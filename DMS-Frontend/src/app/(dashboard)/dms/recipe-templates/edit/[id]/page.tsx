'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { ArrowLeft, Save } from 'lucide-react';
import { recipeTemplatesApi, type RecipeTemplate } from '@/lib/api/recipe-templates';
import toast from 'react-hot-toast';

export default function EditRecipeTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [template, setTemplate] = useState<RecipeTemplate | null>(null);
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    categoryId: '',
    isDefault: false,
    sortOrder: 0,
    isActive: true,
  });

  useEffect(() => {
    fetchTemplate();
  }, [id]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const data = await recipeTemplatesApi.getById(id);
      setTemplate(data);
      setFormData({
        code: data.code,
        name: data.name,
        description: data.description || '',
        categoryId: data.categoryId || '',
        isDefault: data.isDefault,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      });
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error.message || 'Failed to fetch template';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code || !formData.name) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      await recipeTemplatesApi.update(id, {
        code: formData.code,
        name: formData.name,
        description: formData.description || undefined,
        categoryId: formData.categoryId || undefined,
        isDefault: formData.isDefault,
        sortOrder: formData.sortOrder,
        isActive: formData.isActive,
      });
      toast.success('Recipe template updated successfully');
      router.push('/dms/recipe-templates');
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error.message || 'Failed to update recipe template';
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p style={{ color: 'var(--muted-foreground)' }}>Loading template...</p>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p style={{ color: 'var(--muted-foreground)' }}>Template not found</p>
          <Button variant="primary" onClick={() => router.push('/dms/recipe-templates')} className="mt-4">
            Back to Templates
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Edit Recipe Template</h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Update template information
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Template Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input 
              label="Template Code" 
              value={formData.code} 
              onChange={(e) => setFormData({ ...formData, code: e.target.value })} 
              placeholder="e.g., TMPL-CURRY-001" 
              fullWidth 
              required 
            />
            
            <Input 
              label="Template Name" 
              value={formData.name} 
              onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
              fullWidth 
              required 
            />
            
            <Input 
              label="Description" 
              value={formData.description} 
              onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
              fullWidth 
            />
            
            <Input 
              label="Sort Order" 
              type="number" 
              value={String(formData.sortOrder)} 
              onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })} 
              fullWidth 
            />
            
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="editIsDefault" 
                checked={formData.isDefault} 
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })} 
                className="rounded" 
              />
              <label htmlFor="editIsDefault" className="text-sm" style={{ color: 'var(--foreground)' }}>
                Set as Default Template
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="editIsActive" 
                checked={formData.isActive} 
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} 
                className="rounded" 
              />
              <label htmlFor="editIsActive" className="text-sm" style={{ color: 'var(--foreground)' }}>
                Active
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={submitting}
              >
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
