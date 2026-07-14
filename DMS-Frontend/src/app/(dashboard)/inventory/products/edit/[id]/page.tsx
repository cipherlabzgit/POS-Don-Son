'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import Checkbox from '@/components/ui/checkbox';
import { Toggle } from '@/components/ui/toggle';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';
import { productsApi, type Product, type UpdateProductDto, type UpsertProductSectionAssignment } from '@/lib/api/products';
import { labelTemplatesApi, type LabelTemplate } from '@/lib/api/label-templates';
import { categoriesApi, type Category } from '@/lib/api/categories';
import { uomsApi, type UnitOfMeasure } from '@/lib/api/uoms';
import { productionSectionsApi, type ProductionSection } from '@/lib/api/production-sections';
import toast from 'react-hot-toast';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [uoms, setUOMs] = useState<UnitOfMeasure[]>([]);
  const [sections, setSections] = useState<ProductionSection[]>([]);
  const [labelTemplates, setLabelTemplates] = useState<LabelTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Section assignments state
  const [assignments, setAssignments] = useState<UpsertProductSectionAssignment[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [roleInput, setRoleInput] = useState('');

  const [formData, setFormData] = useState<Partial<UpdateProductDto>>({
    code: '',
    name: '',
    description: '',
    categoryId: '',
    unitOfMeasureId: '',
    unitPrice: 0,
    productType: '',
    productionSection: '',
    productionSectionId: '',
    hasFullSize: true,
    hasMiniSize: false,
    allowDecimal: false,
    decimalPlaces: 0,
    roundingValue: 1,
    isPlainRollItem: false,
    requireOpenStock: true,
    displayInPOS: true,
    enableLabelPrint: true,
    allowFutureLabelPrint: false,
    labelTemplateId: null,
    sortOrder: 0,
    defaultDeliveryTurns: [],
    availableInTurns: [],
    isActive: true,
  });

  useEffect(() => {
    fetchProduct();
    fetchCategories();
    fetchUOMs();
    fetchSections();
    (async () => {
      try {
        const res = await labelTemplatesApi.getAll(1, 500, undefined, true);
        setLabelTemplates(res.labelTemplates);
      } catch {
        setLabelTemplates([]);
      }
    })();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const fullProduct = await productsApi.getById(productId);
      setProduct(fullProduct);

      setFormData({
        code: fullProduct.code,
        name: fullProduct.name,
        description: fullProduct.description,
        categoryId: fullProduct.categoryId,
        unitOfMeasureId: fullProduct.unitOfMeasureId,
        unitPrice: fullProduct.unitPrice,
        productType: fullProduct.productType,
        productionSection: fullProduct.productionSection,
        productionSectionId: fullProduct.productionSectionId || '',
        hasFullSize: fullProduct.hasFullSize ?? true,
        hasMiniSize: fullProduct.hasMiniSize ?? false,
        allowDecimal: fullProduct.allowDecimal ?? false,
        decimalPlaces: fullProduct.decimalPlaces ?? 0,
        roundingValue: fullProduct.roundingValue ?? 1,
        isPlainRollItem: fullProduct.isPlainRollItem ?? false,
        requireOpenStock: fullProduct.requireOpenStock,
        displayInPOS: fullProduct.displayInPOS ?? true,
        enableLabelPrint: fullProduct.enableLabelPrint,
        allowFutureLabelPrint: fullProduct.allowFutureLabelPrint,
        labelTemplateId: fullProduct.labelTemplateId ?? null,
        sortOrder: fullProduct.sortOrder ?? 0,
        defaultDeliveryTurns: fullProduct.defaultDeliveryTurns || [],
        availableInTurns: fullProduct.availableInTurns || [],
        isActive: fullProduct.isActive,
      });

      // Pre-populate section assignments from API response
      if (fullProduct.sectionAssignments && fullProduct.sectionAssignments.length > 0) {
        setAssignments(
          fullProduct.sectionAssignments.map(a => ({
            productionSectionId: a.productionSectionId,
            role: a.role,
            sortOrder: a.sortOrder,
          }))
        );
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to load product';
      toast.error(errorMsg);
      router.push('/inventory/products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoriesApi.getAll(1, 100, undefined, true);
      setCategories(response.categories);
    } catch (err: any) {
      console.error('Failed to load categories:', err);
    }
  };

  const fetchUOMs = async () => {
    try {
      const response = await uomsApi.getAll(1, 100, undefined, true);
      setUOMs(response.unitOfMeasures);
    } catch (err: any) {
      console.error('Failed to load UOMs:', err);
    }
  };

  const fetchSections = async () => {
    try {
      const response = await productionSectionsApi.getAll(1, 100, undefined, true);
      setSections(response.productionSections);
    } catch (err: any) {
      console.error('Failed to load production sections:', err);
    }
  };

  const addAssignment = () => {
    if (!selectedSectionId) return;
    if (assignments.some(a => a.productionSectionId === selectedSectionId)) {
      toast.error('This section is already added');
      return;
    }
    setAssignments([
      ...assignments,
      { productionSectionId: selectedSectionId, role: roleInput.trim() || undefined, sortOrder: assignments.length },
    ]);
    setSelectedSectionId('');
    setRoleInput('');
  };

  const removeAssignment = (sectionId: string) => {
    setAssignments(assignments.filter(a => a.productionSectionId !== sectionId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.hasFullSize && !formData.hasMiniSize) {
      toast.error('Select at least Full or Mini size — these control the order entry grid.');
      return;
    }

    try {
      setSubmitting(true);

      const dto: UpdateProductDto = {
        code: formData.code!,
        name: formData.name!,
        description: formData.description,
        categoryId: formData.categoryId!,
        unitOfMeasureId: formData.unitOfMeasureId!,
        unitPrice: Number(formData.unitPrice) || 0,
        productType: formData.productType,
        productionSection: formData.productionSection,
        productionSectionId: formData.productionSectionId || undefined,
        sectionAssignments: assignments,
        hasFullSize: formData.hasFullSize ?? true,
        hasMiniSize: formData.hasMiniSize ?? false,
        allowDecimal: formData.allowDecimal ?? false,
        decimalPlaces: Number(formData.decimalPlaces) || 0,
        roundingValue: Math.floor(Number(formData.roundingValue) || 1),
        isPlainRollItem: formData.isPlainRollItem ?? false,
        requireOpenStock: formData.requireOpenStock ?? true,
        displayInPOS: formData.displayInPOS ?? true,
        enableLabelPrint: formData.enableLabelPrint ?? true,
        allowFutureLabelPrint: formData.allowFutureLabelPrint ?? false,
        labelTemplateId: formData.labelTemplateId?.trim()
          ? formData.labelTemplateId
          : null,
        sortOrder: Number(formData.sortOrder) || 0,
        defaultDeliveryTurns: formData.defaultDeliveryTurns || [],
        availableInTurns: formData.availableInTurns || [],
        isActive: formData.isActive ?? true,
      };

      await productsApi.update(productId, dto);
      toast.success('Product updated successfully');
      router.push('/inventory/products');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to update product';
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p style={{ color: 'var(--muted-foreground)' }}>Loading product...</p>
        </div>
      </div>
    );
  }

  const availableSections = sections.filter(
    s => !assignments.some(a => a.productionSectionId === s.id)
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Edit Product</h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Update product information
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Product Code"
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g., ACT33, BR2, BU12"
                fullWidth
                required
              />
              <Input
                label="Product Name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Full product name"
                fullWidth
                required
              />
            </div>

            <Input
              label="Description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Product description (optional)"
              fullWidth
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Product Category"
                value={formData.categoryId || ''}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                options={categories.map(c => ({ value: c.id, label: c.name }))}
                placeholder="Select category"
                fullWidth
                required
              />
              <Select
                label="Unit of Measure"
                value={formData.unitOfMeasureId || ''}
                onChange={(e) => setFormData({ ...formData, unitOfMeasureId: e.target.value })}
                options={uoms.map(u => ({ value: u.id, label: `${u.code} - ${u.description}` }))}
                placeholder="Select UOM"
                fullWidth
                required
              />
            </div>

            <Input
              label="Unit Price (Rs.)"
              type="number"
              step="0.01"
              value={formData.unitPrice?.toString() || '0'}
              onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
              placeholder="0.00"
              fullWidth
              required
            />

            {/* ── Order entry: Full / Mini / decimals (DMS grid) ── */}
            <div
              className="space-y-3 p-4 rounded-lg"
              style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}
            >
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  Order entry quantities
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                  Controls Full and Mini columns on DMS → Order Entry. Production sections below are unrelated.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Checkbox
                  label="Full size"
                  checked={formData.hasFullSize ?? true}
                  onChange={(e) => setFormData({ ...formData, hasFullSize: e.target.checked })}
                />
                <Checkbox
                  label="Mini size"
                  checked={formData.hasMiniSize ?? false}
                  onChange={(e) => setFormData({ ...formData, hasMiniSize: e.target.checked })}
                />
              </div>
              <Checkbox
                label="Allow decimal quantities"
                checked={formData.allowDecimal ?? false}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setFormData((prev) => ({
                    ...prev,
                    allowDecimal: checked,
                    decimalPlaces:
                      checked && (prev.decimalPlaces === 0 || prev.decimalPlaces === undefined)
                        ? 2
                        : prev.decimalPlaces,
                  }));
                }}
              />
              {(formData.allowDecimal ?? false) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Decimal places"
                    type="number"
                    min={0}
                    max={6}
                    step={1}
                    value={(formData.decimalPlaces ?? 2).toString()}
                    onChange={(e) =>
                      setFormData({ ...formData, decimalPlaces: Number(e.target.value) })
                    }
                    fullWidth
                  />
                  <Input
                    label="Rounding step"
                    type="number"
                    min={1}
                    step={1}
                    title="Optional increment for rounding (e.g. 1 = whole numbers)"
                    value={(formData.roundingValue ?? 1).toString()}
                    onChange={(e) =>
                      setFormData({ ...formData, roundingValue: Number(e.target.value) })
                    }
                    fullWidth
                  />
                </div>
              )}
            </div>

            {/* ── Production Section Assignments ── */}
            <div className="space-y-3 pt-2">
              <label className="block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                Production Sections
                <span className="ml-2 text-xs font-normal" style={{ color: 'var(--muted-foreground)' }}>
                  One product can span multiple sections (e.g. Egg Bun → Bakery + Filling)
                </span>
              </label>

              {/* Current assignments */}
              {assignments.length > 0 && (
                <div className="space-y-2">
                  {assignments.map((a) => {
                    const sec = sections.find(s => s.id === a.productionSectionId);
                    return (
                      <div
                        key={a.productionSectionId}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg"
                        style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}
                      >
                        <span className="font-mono text-xs font-semibold" style={{ color: '#C8102E' }}>
                          {sec?.code ?? '?'}
                        </span>
                        <span className="text-sm font-medium flex-1">{sec?.name ?? a.productionSectionId}</span>
                        {a.role && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: 'var(--card)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}
                          >
                            {a.role}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeAssignment(a.productionSectionId)}
                          className="p-1 rounded hover:bg-red-100 transition-colors"
                          style={{ color: '#DC2626' }}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add section row */}
              {availableSections.length > 0 && (
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Select
                      label=""
                      value={selectedSectionId}
                      onChange={(e) => setSelectedSectionId(e.target.value)}
                      options={availableSections.map(s => ({ value: s.id, label: `${s.code} — ${s.name}` }))}
                      placeholder="Select a section to add..."
                      fullWidth
                    />
                  </div>
                  <div className="w-40">
                    <Input
                      label=""
                      value={roleInput}
                      onChange={(e) => setRoleInput(e.target.value)}
                      placeholder="Role (optional)"
                      fullWidth
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addAssignment}
                    disabled={!selectedSectionId}
                    style={{ marginBottom: '1px' }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <Checkbox
                label="Require Open Stock"
                checked={formData.requireOpenStock || false}
                onChange={(e) => setFormData({ ...formData, requireOpenStock: e.target.checked })}
              />
              <Checkbox
                label="Display in POS"
                checked={formData.displayInPOS ?? true}
                onChange={(e) => setFormData({ ...formData, displayInPOS: e.target.checked })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Checkbox
                label="Enable Label Print"
                checked={formData.enableLabelPrint || false}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setFormData({
                    ...formData,
                    enableLabelPrint: checked,
                    ...(checked ? {} : { labelTemplateId: null }),
                  });
                }}
              />
            </div>

            {(formData.enableLabelPrint ?? false) && (
              <div className="pt-2">
                <Select
                  label="Label template"
                  value={formData.labelTemplateId || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      labelTemplateId: e.target.value || null,
                    })
                  }
                  options={[
                    { value: '', label: '— None —' },
                    ...labelTemplates.map((t) => ({
                      value: t.id,
                      label: `${t.code} — ${t.name}`,
                    })),
                  ]}
                  placeholder="Select template (optional)"
                  fullWidth
                />
              </div>
            )}

            <div className="pt-2">
              <Toggle
                checked={formData.isActive || false}
                onChange={(checked) => setFormData({ ...formData, isActive: checked })}
                label="Active Status"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="ghost" onClick={() => router.back()} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? 'Saving...' : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
