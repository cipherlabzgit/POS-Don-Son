'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { InlineDetailPanel } from '@/components/ui/inline-detail-panel';
import { FileStack, Plus, Search, Edit, Eye, EyeOff, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { recipeTemplatesApi, type RecipeTemplate } from '@/lib/api/recipe-templates';
import toast from 'react-hot-toast';

export default function RecipeTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<RecipeTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<RecipeTemplate | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, [currentPage, pageSize, searchTerm]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await recipeTemplatesApi.getAll(
        currentPage,
        pageSize,
        searchTerm || undefined,
        undefined
      );
      setTemplates(response.recipeTemplates);
      setTotalPages(response.totalPages);
      setTotalCount(response.totalCount);
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error.message || 'Failed to fetch recipe templates';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToProduct = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      toast.success(`Template "${template.name}" selected. Navigate to Recipe Management to apply it to a product.`);
    }
  };

  const columns = [
    { key: 'code', label: 'Code', render: (item: RecipeTemplate) => <span className="font-medium">{item.code}</span> },
    { key: 'name', label: 'Template Name', render: (item: RecipeTemplate) => <span className="font-medium">{item.name}</span> },
    { key: 'description', label: 'Description' },
    { key: 'isActive', label: 'Status', render: (item: RecipeTemplate) => item.isActive ? <Badge variant="success" size="sm">Active</Badge> : <Badge variant="neutral" size="sm">Inactive</Badge> },
    {
      key: 'actions', label: 'Actions', render: (item: RecipeTemplate) => (
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => {
              if (selectedTemplate?.id === item.id) setSelectedTemplate(null);
              else setSelectedTemplate(item);
            }}
            className="p-1.5 rounded transition-colors"
            style={{ color: 'var(--muted-foreground)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            title={selectedTemplate?.id === item.id ? 'Hide details' : 'View details'}
          >
            {selectedTemplate?.id === item.id ? (
              <Eye className="w-4 h-4" aria-hidden />
            ) : (
              <EyeOff className="w-4 h-4" aria-hidden />
            )}
          </button>
          <button onClick={() => router.push(`/dms/recipe-templates/edit/${item.id}`)} className="p-1.5 rounded transition-colors" style={{ color: 'var(--muted-foreground)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--muted)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'} title="Edit"><Edit className="w-4 h-4" /></button>
          <button onClick={() => handleApplyToProduct(item.id)} className="p-1.5 rounded transition-colors" style={{ color: '#10B981' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--dms-success-callout)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'} title="Apply to Product"><Copy className="w-4 h-4" /></button>
        </div>
      )
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Predefined Recipe Templates</h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>Reusable recipe templates for quick product setup ({totalCount} templates)</p>
        </div>
        <Button variant="primary" size="md" onClick={() => router.push('/dms/recipe-templates/add')}><Plus className="w-4 h-4 mr-2" />Create Template</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Recipe Templates</CardTitle>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
              <input type="text" placeholder="Search templates..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} autoComplete="off" className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-lg text-sm" style={{ border: '1px solid var(--input)' }} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center" style={{ color: 'var(--muted-foreground)' }}>
              Loading templates...
            </div>
          ) : templates.length === 0 ? (
            <div className="p-8 text-center" style={{ color: 'var(--muted-foreground)' }}>
              No templates found
            </div>
          ) : (
            <DataTable
              data={templates}
              columns={columns}
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              expandedRowKey={selectedTemplate?.id ?? null}
              getRowKey={(row) => row.id}
              renderExpandedRow={(tpl) => (
                <InlineDetailPanel
                  title="Template Details"
                  open
                  onClose={() => setSelectedTemplate(null)}
                  contentClassName="max-w-[min(100%,42rem)]"
                  footer={
                    <>
                      <Button variant="ghost" onClick={() => setSelectedTemplate(null)}>Close</Button>
                      <Button variant="primary" onClick={() => handleApplyToProduct(tpl.id)}><Copy className="w-4 h-4 mr-2" />Apply to Product</Button>
                    </>
                  }
                >
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Template Code</p>
                      <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{tpl.code}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Template Name</p>
                      <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{tpl.name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Description</p>
                      <p className="text-sm" style={{ color: 'var(--foreground)' }}>{tpl.description || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Sort Order</p>
                      <p className="text-sm" style={{ color: 'var(--foreground)' }}>{tpl.sortOrder}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Default Template</p>
                        <Badge variant={tpl.isDefault ? 'success' : 'neutral'} size="sm">{tpl.isDefault ? 'Yes' : 'No'}</Badge>
                      </div>
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Status</p>
                        <Badge variant={tpl.isActive ? 'success' : 'neutral'} size="sm">{tpl.isActive ? 'Active' : 'Inactive'}</Badge>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--dms-notes)', border: '1px solid var(--dms-notes-border)' }}>
                      <p className="text-sm" style={{ color: 'var(--dms-notes-fg)' }}>
                        Recipe templates serve as metadata for organizing recipes. To apply this template and define recipe components with ingredients, navigate to Recipe Management and select a product.
                      </p>
                    </div>
                  </div>
                </InlineDetailPanel>
              )}
            />
          )}
        </CardContent>
      </Card>

      <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--dms-success-callout)', border: '1px solid var(--dms-success-border)' }}>
        <div className="flex items-start space-x-3">
          <FileStack className="w-5 h-5 mt-0.5" style={{ color: 'var(--dms-success-text)' }} />
          <div>
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--dms-success-text)' }}>Template Benefits:</p>
            <ul className="text-sm space-y-1" style={{ color: 'var(--dms-success-text)' }}>
              <li>• Save time by creating standard recipes once and applying them to multiple products</li>
              <li>• Maintain consistency across similar products (e.g., all curry fillings use the same base recipe)</li>
              <li>• Templates can be applied as a starting point, then customized per product</li>
              <li>• Examples: Basic Bread Template, Vegetable Curry Template, Fish Filling Template</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
