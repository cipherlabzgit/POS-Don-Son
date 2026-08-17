'use client';

import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { InlineDetailPanel } from '@/components/ui/inline-detail-panel';
import { Package, Plus, Search, Edit, Eye, EyeOff, Trash2, Check, X, Loader2, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { productsApi, type Product, type CreateProductDto, type UpsertProductSectionAssignment } from '@/lib/api/products';
import { categoriesApi, type Category } from '@/lib/api/categories';
import { uomsApi, type UnitOfMeasure } from '@/lib/api/uoms';
import { labelTemplatesApi } from '@/lib/api/label-templates';
import { productionSectionsApi } from '@/lib/api/production-sections';
import toast from 'react-hot-toast';
import { ProtectedPage, PermissionButton } from '@/components/auth';
import { usePermissions } from '@/hooks/usePermissions';
import CsvBulkUploadBar from '@/components/dms/CsvBulkUploadBar';
import type { CsvRowRecord } from '@/lib/csv-utils';
import { parseBool, parseDecimal, parseIntField, parseIntList, req } from '@/lib/bulk-csv-field-parsers';

function formatLoadProductsError(err: unknown): string {
  const e = err as {
    response?: { data?: { message?: string } };
    message?: string;
    code?: string;
  };
  const apiMsg = e.response?.data?.message;
  if (apiMsg && typeof apiMsg === 'string' && apiMsg.trim()) return apiMsg;
  if (e.code === 'ERR_NETWORK' || e.message === 'Network Error') {
    return 'Could not connect to the server. Check your connection and try again.';
  }
  if (e.message && typeof e.message === 'string' && e.message.trim()) return e.message;
  return 'Failed to load products. Please try again.';
}

// Memoized search input to prevent re-renders
const SearchInput = memo(({ 
  value, 
  onChange, 
  placeholder = "Search...",
  inputRef 
}: { 
  value: string; 
  onChange: (value: string) => void; 
  placeholder?: string;
  inputRef?: React.RefObject<HTMLInputElement>;
}) => (
  <div className="relative w-full sm:w-auto">
    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
    <input
      ref={inputRef}
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      autoComplete="off"
      className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-lg text-sm"
      style={{ border: '1px solid var(--input)' }}
    />
  </div>
));

export default function ProductsPage() {
  return (
    <ProtectedPage permission="products:view">
      <ProductsPageContent />
    </ProtectedPage>
  );
}

function ProductsPageContent() {
  const router = useRouter();
  const { canAction } = usePermissions();
  const canEditProduct = canAction('/inventory/products', 'edit');
  const canDeleteProduct = canAction('/inventory/products', 'delete');
  const canBulkProduct = canAction('/inventory/products', 'import') || canAction('/inventory/products', 'create');

  const codeLookupPromise = useRef<Promise<{ 
    categories: Map<string, string>; 
    uoms: Map<string, string>;
    labelTemplates: Map<string, string>;
    productionSections: Map<string, string>;
  }> | null>(null);
  const ensureCodeLookups = useCallback(async () => {
    if (!codeLookupPromise.current) {
      codeLookupPromise.current = (async () => {
        const [cRes, uRes, ltRes, psRes] = await Promise.all([
          categoriesApi.getAll(1, 500, undefined, undefined),
          uomsApi.getAll(1, 500, undefined, undefined),
          labelTemplatesApi.getAll(1, 500, undefined, undefined).catch(() => ({ labelTemplates: [] })),
          productionSectionsApi.getAll(1, 500, undefined, undefined).catch(() => ({ productionSections: [] })),
        ]);
        const categories = new Map(
          cRes.categories.map((c) => [c.code.trim().toUpperCase(), c.id] as const),
        );
        const uoms = new Map(uRes.unitOfMeasures.map((u) => [u.code.trim().toUpperCase(), u.id] as const));
        const labelTemplates = new Map(
          ltRes.labelTemplates.map((lt) => [lt.code.trim().toUpperCase(), lt.id] as const),
        );
        const productionSections = new Map(
          psRes.productionSections.map((ps) => [ps.code.trim().toUpperCase(), ps.id] as const),
        );
        return { categories, uoms, labelTemplates, productionSections };
      })();
    }
    return codeLookupPromise.current;
  }, []);

  const mapProductRow = useCallback(
    async (
      row: CsvRowRecord,
      _excelRow: number,
    ): Promise<{ ok: true; value: CreateProductDto } | { ok: false; error: string }> => {
      try {
        console.log('[Product CSV] Mapping row:', row);
        
        console.log('[Product CSV] Loading code lookups...');
        const { categories, uoms, labelTemplates, productionSections } = await ensureCodeLookups();
        console.log('[Product CSV] Code lookups loaded - Categories:', categories.size, 'UOMs:', uoms.size);
        
        const catCode = req(row, 'categoryCode').trim().toUpperCase();
        const uomCode = req(row, 'uomCode').trim().toUpperCase();
        console.log('[Product CSV] Looking up categoryCode:', catCode, 'uomCode:', uomCode);
        
        const categoryId = categories.get(catCode);
        const unitOfMeasureId = uoms.get(uomCode);
        
        if (!categoryId) {
          console.error('[Product CSV] Category not found:', catCode, 'Available:', Array.from(categories.keys()));
          return { ok: false, error: `Unknown categoryCode "${row.categoryCode}"` };
        }
        if (!unitOfMeasureId) {
          console.error('[Product CSV] UOM not found:', uomCode, 'Available:', Array.from(uoms.keys()));
          return { ok: false, error: `Unknown uomCode "${row.uomCode}"` };
        }
        
        console.log('[Product CSV] Category ID:', categoryId, 'UOM ID:', unitOfMeasureId);

        // Parse labelTemplateCode (optional)
        let labelTemplateId: string | undefined = undefined;
        const labelTemplateCode = row.labelTemplateCode?.trim();
        if (labelTemplateCode) {
          console.log('[Product CSV] Looking up labelTemplateCode:', labelTemplateCode);
          labelTemplateId = labelTemplates.get(labelTemplateCode.toUpperCase());
          if (!labelTemplateId) {
            console.error('[Product CSV] Label template not found:', labelTemplateCode, 'Available:', Array.from(labelTemplates.keys()));
            return { ok: false, error: `Unknown labelTemplateCode "${labelTemplateCode}"` };
          }
        }

        // Parse sectionAssignments (optional)
        const sectionAssignments: UpsertProductSectionAssignment[] = [];
        const sectionCodesStr = row.sectionAssignmentCodes?.trim();
        if (sectionCodesStr) {
          console.log('[Product CSV] Parsing section assignments:', sectionCodesStr);
          const sectionCodes = sectionCodesStr.split(';').map(s => s.trim()).filter(Boolean);
          const sectionRolesStr = row.sectionAssignmentRoles?.trim() || '';
          const sectionRoles = sectionRolesStr.split(';').map(s => s.trim());

          for (let i = 0; i < sectionCodes.length; i++) {
            const code = sectionCodes[i].toUpperCase();
            const sectionId = productionSections.get(code);
            if (!sectionId) {
              console.error('[Product CSV] Production section not found:', sectionCodes[i], 'Available:', Array.from(productionSections.keys()));
              return { ok: false, error: `Unknown production section code "${sectionCodes[i]}"` };
            }
            sectionAssignments.push({
              productionSectionId: sectionId,
              role: sectionRoles[i] || undefined,
              sortOrder: i,
            });
          }
          console.log('[Product CSV] Section assignments parsed:', sectionAssignments.length);
        }

        console.log('[Product CSV] Creating DTO...');

        const dto: CreateProductDto = {
          code: req(row, 'code'),
          name: req(row, 'name'),
          description: row.description?.trim() || undefined,
          categoryId,
          unitOfMeasureId,
          unitPrice: parseDecimal(row, 'unitPrice'),
          productType: row.productType?.trim() || 'Finished',
          productionSection: row.productionSection?.trim() || undefined,
          productionSectionId: undefined,
          sectionAssignments,
          hasFullSize: parseBool(row, 'hasFullSize', true),
          hasMiniSize: parseBool(row, 'hasMiniSize', false),
          allowDecimal: parseBool(row, 'allowDecimal', false),
          decimalPlaces: parseIntField(row, 'decimalPlaces', 0),
          roundingValue: parseIntField(row, 'roundingValue', 1),
          isPlainRollItem: parseBool(row, 'isPlainRollItem', false),
          requireOpenStock: parseBool(row, 'requireOpenStock', true),
          displayInPOS: parseBool(row, 'displayInPOS', true),
          enableLabelPrint: parseBool(row, 'enableLabelPrint', true),
          allowFutureLabelPrint: parseBool(row, 'allowFutureLabelPrint', false),
          labelTemplateId: labelTemplateId || undefined,
          sortOrder: parseIntField(row, 'sortOrder', 0),
          defaultDeliveryTurns: parseIntList(row, 'defaultDeliveryTurns'),
          availableInTurns: parseIntList(row, 'availableInTurns'),
          isActive: parseBool(row, 'isActive', true),
        };
        console.log('[Product CSV] DTO created successfully:', dto.code);
        return { ok: true, value: dto };
      } catch (e: unknown) {
        console.error('[Product CSV] Error mapping row:', e);
        return { ok: false, error: e instanceof Error ? e.message : 'Invalid row' };
      }
    },
    [ensureCodeLookups],
  );
  
  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [uoms, setUoms] = useState<UnitOfMeasure[]>([]);
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination and search
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filters
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedUomId, setSelectedUomId] = useState<string>('');
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
  }, []);

  // Fetch categories and UOMs on mount
  useEffect(() => {
    fetchCategoriesAndUoms();
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch products on mount and when filters change
  useEffect(() => {
    fetchProducts();
  }, [currentPage, pageSize, searchTerm, selectedCategoryId, selectedUomId]);

  const fetchCategoriesAndUoms = async () => {
    try {
      const [categoriesResponse, uomsResponse] = await Promise.all([
        categoriesApi.getAll(1, 500, undefined, undefined),
        uomsApi.getAll(1, 500, undefined, undefined),
      ]);
      setCategories(categoriesResponse.categories);
      setUoms(uomsResponse.unitOfMeasures);
    } catch (err) {
      console.error('Failed to fetch categories and UOMs:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Apply category filter if selected
      const categoryFilter = selectedCategoryId || undefined;
      
      // Don't pass activeOnly parameter - this will return ALL products (active and inactive)
      const response = await productsApi.getAll(
        currentPage,
        pageSize,
        searchTerm || undefined,
        categoryFilter
        // activeOnly parameter omitted - returns all products
      );
      
      // Apply UOM filter client-side if selected
      let filteredProducts = response.products;
      if (selectedUomId) {
        filteredProducts = response.products.filter(p => p.unitOfMeasureId === selectedUomId);
      }
      
      setProducts(filteredProducts);
      setTotalPages(response.totalPages);
      setTotalCount(selectedUomId ? filteredProducts.length : response.totalCount);
    } catch (err: unknown) {
      // Check if this is a 404 or "no data found" scenario
      const e = err as {
        response?: { status?: number; data?: { message?: string } };
        message?: string;
        code?: string;
      };
      
      // If it's a 404 or the backend explicitly says "no records found", treat it as empty data
      if (
        e.response?.status === 404 || 
        e.response?.data?.message?.toLowerCase().includes('no records found') ||
        e.response?.data?.message?.toLowerCase().includes('not found')
      ) {
        // Not an error - just no data
        setProducts([]);
        setTotalPages(1);
        setTotalCount(0);
      } else {
        // Real error - show error message
        const errorMsg = formatLoadProductsError(err);
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      await productsApi.update(product.id, {
        code: product.code,
        name: product.name,
        description: product.description,
        categoryId: product.categoryId,
        unitOfMeasureId: product.unitOfMeasureId,
        unitPrice: product.unitPrice,
        productType: product.productType,
        productionSection: product.productionSection,
        productionSectionId: product.productionSectionId,
        sectionAssignments: product.sectionAssignments?.map(sa => ({
          productionSectionId: sa.productionSectionId,
          role: sa.role,
          sortOrder: sa.sortOrder,
        })) || [],
        hasFullSize: product.hasFullSize,
        hasMiniSize: product.hasMiniSize,
        allowDecimal: product.allowDecimal,
        decimalPlaces: product.decimalPlaces,
        roundingValue: product.roundingValue,
        isPlainRollItem: product.isPlainRollItem,
        requireOpenStock: product.requireOpenStock,
        displayInPOS: product.displayInPOS,
        enableLabelPrint: product.enableLabelPrint,
        allowFutureLabelPrint: product.allowFutureLabelPrint,
        labelTemplateId: product.labelTemplateId ?? null,
        sortOrder: product.sortOrder,
        defaultDeliveryTurns: product.defaultDeliveryTurns,
        availableInTurns: product.availableInTurns,
        isActive: !product.isActive,
      });
      
      toast.success(`Product ${product.isActive ? 'deactivated' : 'activated'} successfully`);
      fetchProducts();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to toggle product status';
      toast.error(errorMsg);
    }
  };


  const columns = [
    {
      key: 'categoryName',
      label: 'Category',
      render: (item: Product) => (
        <span className="font-medium">{item.categoryName}</span>
      ),
    },
    {
      key: 'code',
      label: 'Product Code',
      render: (item: Product) => (
        <span className="font-mono font-semibold" style={{ color: '#C8102E' }}>
          {item.code}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'Product Name',
    },
    {
      key: 'unitPrice',
      label: 'Unit Price',
      render: (item: Product) => (
        <span className="font-semibold">
          Rs. {item.unitPrice.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'unitOfMeasure',
      label: 'UOM',
    },
    {
      key: 'requireOpenStock',
      label: 'Require Open Stk',
      render: (item: Product) => (
        item.requireOpenStock ? (
          <Badge variant="success" size="sm">Yes</Badge>
        ) : (
          <Badge variant="neutral" size="sm">No</Badge>
        )
      ),
    },
    {
      key: 'displayInPOS',
      label: 'Display in POS',
      render: (item: Product) => (
        item.displayInPOS ? (
          <Badge variant="success" size="sm">Yes</Badge>
        ) : (
          <Badge variant="neutral" size="sm">No</Badge>
        )
      ),
    },
    {
      key: 'isActive',
      label: 'Active',
      render: (item: Product) => (
        item.isActive ? (
          <Badge variant="success" size="sm">Yes</Badge>
        ) : (
          <Badge variant="danger" size="sm">No</Badge>
        )
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: Product) => (
        <div className="flex items-center space-x-2">
          {canEditProduct && (
            <button
              onClick={() => router.push(`/inventory/products/edit/${item.id}`)}
              className="p-1.5 rounded transition-colors"
              style={{ color: 'var(--muted-foreground)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => {
              if (selectedProduct?.id === item.id) setSelectedProduct(null);
              else setSelectedProduct(item);
            }}
            className="p-1.5 rounded transition-colors"
            style={{ color: 'var(--muted-foreground)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            title={selectedProduct?.id === item.id ? 'Hide details' : 'View details'}
          >
            {selectedProduct?.id === item.id ? (
              <Eye className="w-4 h-4" aria-hidden />
            ) : (
              <EyeOff className="w-4 h-4" aria-hidden />
            )}
          </button>
          {(canEditProduct || canDeleteProduct) && (
            <button
              onClick={() => handleToggleActive(item)}
              className="p-1.5 rounded transition-colors"
              style={{ color: item.isActive ? '#DC2626' : '#10B981' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = item.isActive ? '#FEF2F2' : '#F0FDF4'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              title={item.isActive ? 'Deactivate' : 'Activate'}
            >
              {item.isActive ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            </button>
          )}
        </div>
      ),
    },
  ];

  // Loading state
  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p style={{ color: 'var(--muted-foreground)' }}>Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Products</h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Manage your product catalog ({totalCount} items)
          </p>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <PermissionButton
            permission="products:create"
            variant="primary"
            size="md"
            onClick={() => router.push('/inventory/products/add')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </PermissionButton>
        </div>
      </div>

      {canBulkProduct && (
        <div className="w-full min-w-0 max-w-full">
          <CsvBulkUploadBar<CreateProductDto>
            entityLabel="products"
            templateFilename="products-import-template.csv"
            permission={['products:import', 'products:create']}
            permissionMode="any"
            previewDataHeaders={[
              'code',
              'name',
              'categoryCode',
              'uomCode',
              'unitPrice',
              'isActive',
            ]}
            columns={[
              { header: 'code' },
              { header: 'name' },
              { header: 'description' },
              { header: 'categoryCode' },
              { header: 'uomCode' },
              { header: 'unitPrice' },
              { header: 'productType' },
              { header: 'productionSection' },
              { header: 'sectionAssignmentCodes' },
              { header: 'sectionAssignmentRoles' },
              { header: 'hasFullSize' },
              { header: 'hasMiniSize' },
              { header: 'allowDecimal' },
              { header: 'decimalPlaces' },
              { header: 'roundingValue' },
              { header: 'isPlainRollItem' },
              { header: 'requireOpenStock' },
              { header: 'displayInPOS' },
              { header: 'enableLabelPrint' },
              { header: 'allowFutureLabelPrint' },
              { header: 'labelTemplateCode' },
              { header: 'sortOrder' },
              { header: 'defaultDeliveryTurns' },
              { header: 'availableInTurns' },
              { header: 'isActive' },
            ]}
            exampleRows={[
              [
                'SKU001',
                'Sample Product',
                '',
                'BREAD',
                'PCS',
                '120.00',
                '',
                '',
                'BAK;FILL',
                'Primary;Secondary',
                'true',
                'false',
                'false',
                '0',
                '1',
                'false',
                'true',
                'true',
                'true',
                'false',
                'LBL001',
                '0',
                '1;2',
                '1;2;3',
                'true',
              ],
            ]}
            mapRow={mapProductRow}
            importRow={(dto) => productsApi.create(dto)}
            onImportComplete={() => fetchProducts()}
          />
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle>Product List</CardTitle>
              <SearchInput 
                value={searchInput}
                onChange={handleSearchChange}
                placeholder="Search category, code, name, price, UOM..."
                inputRef={searchInputRef}
              />
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Filters:</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <select
                  value={selectedCategoryId}
                  onChange={(e) => {
                    setSelectedCategoryId(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 rounded-lg text-sm min-w-[150px]"
                  style={{ border: '1px solid var(--input)', backgroundColor: 'var(--background)' }}
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedUomId}
                  onChange={(e) => {
                    setSelectedUomId(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 rounded-lg text-sm min-w-[150px]"
                  style={{ border: '1px solid var(--input)', backgroundColor: 'var(--background)' }}
                >
                  <option value="">All UOMs</option>
                  {uoms.map((uom) => (
                    <option key={uom.id} value={uom.id}>
                      {uom.description} ({uom.code})
                    </option>
                  ))}
                </select>
                {(selectedCategoryId || selectedUomId || searchInput) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCategoryId('');
                      setSelectedUomId('');
                      setSearchInput('');
                      setCurrentPage(1);
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--muted-foreground)' }} />
              <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Loading products…
              </span>
            </div>
          ) : error ? (
            <div className="px-6 py-12 text-center">
              <p className="mb-4 text-sm" style={{ color: 'var(--foreground)' }}>
                {error}
              </p>
              <Button type="button" variant="secondary" onClick={() => void fetchProducts()}>
                Try again
              </Button>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto mb-4 h-12 w-12" style={{ color: 'var(--muted-foreground)' }} />
              <p style={{ color: 'var(--muted-foreground)' }}>
                No products found. Create your first product!
              </p>
            </div>
          ) : (
            <DataTable
              data={products}
              columns={columns}
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              expandedRowKey={selectedProduct?.id ?? null}
              getRowKey={(item) => item.id}
              renderExpandedRow={(item) => (
                <InlineDetailPanel
                  title="Product Information"
                  open
                  onClose={() => setSelectedProduct(null)}
                  footer={
                    <Button variant="ghost" onClick={() => setSelectedProduct(null)}>
                      Close
                    </Button>
                  }
                >
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Product Code</p>
                        <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{item.code}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Category</p>
                        <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{item.categoryName}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Product Name</p>
                      <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{item.name}</p>
                    </div>
                    {item.description && (
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Description</p>
                        <p className="text-sm" style={{ color: 'var(--foreground)' }}>{item.description}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Unit Price</p>
                        <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Rs. {item.unitPrice.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Unit of Measure</p>
                        <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{item.unitOfMeasure}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Require Open Stock</p>
                        {item.requireOpenStock ? (
                          <Badge variant="success" size="sm">Yes</Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">No</Badge>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Display in POS</p>
                        {item.displayInPOS ? (
                          <Badge variant="success" size="sm">Yes</Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">No</Badge>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Enable Label Print</p>
                        {item.enableLabelPrint ? (
                          <Badge variant="success" size="sm">Yes</Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">No</Badge>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Status</p>
                        {item.isActive ? (
                          <Badge variant="success" size="sm">Active</Badge>
                        ) : (
                          <Badge variant="danger" size="sm">Inactive</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </InlineDetailPanel>
              )}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
