'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { ArrowLeft, Plus, FileStack } from 'lucide-react';
import { recipeTemplatesApi } from '@/lib/api/recipe-templates';
import toast from 'react-hot-toast';

export default function AddRecipeTemplatePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    categoryId: '',
    isDefault: false,
    sortOrder: 0,
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code || !formData.name) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      await recipeTemplatesApi.create({
        code: formData.code,
        name: formData.name,
        description: formData.description || undefined,
        categoryId: formData.categoryId || undefined,
        isDefault: formData.isDefault,
        sortOrder: formData.sortOrder,
        isActive: formData.isActive,
      });
      toast.success('Recipe template created successfully');
      router.push('/dms/recipe-templates');
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error.message || 'Failed to create recipe template';
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

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
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Create Recipe Template</h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Create a new recipe template for quick product setup
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
              placeholder="e.g., Vegetable Curry Template" 
              fullWidth 
              required 
            />
            
            <Input 
              label="Description" 
              value={formData.description} 
              onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
              placeholder="Brief description of the template..." 
              fullWidth 
            />
            
            <Input 
              label="Sort Order" 
              type="number" 
              value={String(formData.sortOrder)} 
              onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })} 
              placeholder="0" 
              fullWidth 
            />
            
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="isDefault" 
                checked={formData.isDefault} 
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })} 
                className="rounded" 
              />
              <label htmlFor="isDefault" className="text-sm" style={{ color: 'var(--foreground)' }}>
                Set as Default Template
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="isActive" 
                checked={formData.isActive} 
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} 
                className="rounded" 
              />
              <label htmlFor="isActive" className="text-sm" style={{ color: 'var(--foreground)' }}>
                Active
              </label>
            </div>
            
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--dms-notes)', border: '1px solid var(--dms-notes-border)' }}>
              <p className="text-sm font-medium mb-2" style={{ color: 'var(--dms-notes-title)' }}>Next Steps:</p>
              <p className="text-sm" style={{ color: 'var(--dms-notes-fg)' }}>
                After creating the template, navigate to Recipe Management to apply it to a product and define the recipe components and ingredients.
              </p>
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
                {submitting ? 'Creating...' : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Template
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
