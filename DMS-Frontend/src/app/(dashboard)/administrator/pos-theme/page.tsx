'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { ProtectedPage } from '@/components/auth';
import { 
  Palette, Plus, Edit2, Trash2, Check, X, Paintbrush, 
  Star, Power, AlertTriangle 
} from 'lucide-react';
import { posThemeApi, type PosThemeConfig, type CreatePosThemeDto } from '@/lib/api/pos-theme';
import toast from 'react-hot-toast';

// Color input component
function ColorInput({ 
  label, 
  value, 
  onChange, 
  required 
}: { 
  label: string; 
  value: string; 
  onChange: (v: string) => void; 
  required?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-1">
      <label className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
        {label} {!required && <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>(optional)</span>}
      </label>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="flex items-center gap-3 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all hover:opacity-80 w-full"
        style={{
          backgroundColor: value,
          borderColor: 'var(--border)',
          color: value ? '#ffffff' : 'var(--foreground)',
          minHeight: 42,
        }}
      >
        <Paintbrush className="w-4 h-4 flex-shrink-0" />
        <span className="font-mono tracking-wide">{value.toUpperCase()}</span>
        <input
          ref={ref}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only"
          tabIndex={-1}
        />
      </button>
    </div>
  );
}

// Theme form modal
function ThemeFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreatePosThemeDto) => Promise<void>;
  initialData?: PosThemeConfig;
}) {
  const defaultCategoryColors = [
    '#ffd100', '#c8102e', '#16a34a', '#1d4ed8',
    '#9333ea', '#ea580c', '#db2777', '#0891b2'
  ];

  const [formData, setFormData] = useState<CreatePosThemeDto>({
    themeName: initialData?.themeName || '',
    description: initialData?.description || '',
    primaryColor: initialData?.primaryColor || '#C8102E',
    primaryLight: initialData?.primaryLight || '#E31837',
    primaryDark: initialData?.primaryDark || '#A00D26',
    accentColor: initialData?.accentColor || '#FFD100',
    accentLight: initialData?.accentLight || '#FFDC33',
    accentDark: initialData?.accentDark || '#CCAA00',
    categoryColors: initialData?.categoryColors || defaultCategoryColors,
    displayOrder: initialData?.displayOrder || 0,
  });

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.themeName.trim()) {
      toast.error('Theme name is required');
      return;
    }
    setSaving(true);
    try {
      await onSave(formData);
      onClose();
      toast.success(initialData ? 'Theme updated' : 'Theme created');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save theme');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" style={{ color: '#C8102E' }} />
              {initialData ? 'Edit Theme' : 'Create New Theme'}
            </CardTitle>
            <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
              <X className="w-5 h-5" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                  Theme Name *
                </label>
                <input
                  type="text"
                  value={formData.themeName}
                  onChange={(e) => setFormData({ ...formData, themeName: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}
                  placeholder="e.g., Blue Ocean Theme"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}
                  placeholder="Optional description"
                  rows={2}
                />
              </div>
            </div>

            {/* Primary Colors */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Primary Color (Headers, Main Buttons)</h3>
              <div className="grid grid-cols-3 gap-3">
                <ColorInput
                  label="Primary"
                  value={formData.primaryColor}
                  onChange={(v) => setFormData({ ...formData, primaryColor: v })}
                  required
                />
                <ColorInput
                  label="Light"
                  value={formData.primaryLight || ''}
                  onChange={(v) => setFormData({ ...formData, primaryLight: v })}
                />
                <ColorInput
                  label="Dark"
                  value={formData.primaryDark || ''}
                  onChange={(v) => setFormData({ ...formData, primaryDark: v })}
                />
              </div>
            </div>

            {/* Accent Colors */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Accent Color (Highlights, Secondary Elements)</h3>
              <div className="grid grid-cols-3 gap-3">
                <ColorInput
                  label="Accent"
                  value={formData.accentColor}
                  onChange={(v) => setFormData({ ...formData, accentColor: v })}
                  required
                />
                <ColorInput
                  label="Light"
                  value={formData.accentLight || ''}
                  onChange={(v) => setFormData({ ...formData, accentLight: v })}
                />
                <ColorInput
                  label="Dark"
                  value={formData.accentDark || ''}
                  onChange={(v) => setFormData({ ...formData, accentDark: v })}
                />
              </div>
            </div>

            {/* Category Tab Colors */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Category Tab Colors (8 Colors for POS Catalog Tabs)</h3>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, categoryColors: defaultCategoryColors })}
                  className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
                  style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
                >
                  Reset to Default
                </button>
              </div>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                These colors appear as category pills in the POS catalog view. Tab 0 is "All", Tab 1 is "Favourites", and Tabs 2-7 cycle through product categories.
              </p>
              <div className="grid grid-cols-4 gap-3">
                {(formData.categoryColors || defaultCategoryColors).map((color, index) => (
                  <ColorInput
                    key={index}
                    label={`Tab ${index}`}
                    value={color}
                    onChange={(v) => {
                      const newColors = [...(formData.categoryColors || defaultCategoryColors)];
                      newColors[index] = v;
                      setFormData({ ...formData, categoryColors: newColors });
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Display Order */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                Display Order
              </label>
              <input
                type="number"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                className="w-32 px-4 py-2 rounded-lg border"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}
                min={0}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? 'Saving...' : initialData ? 'Update Theme' : 'Create Theme'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PosThemePage() {
  const [themes, setThemes] = useState<PosThemeConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTheme, setEditingTheme] = useState<PosThemeConfig | undefined>();

  const loadThemes = async () => {
    setLoading(true);
    try {
      const data = await posThemeApi.getAll({ page: 1, pageSize: 100 });
      setThemes(data.themes || []);
    } catch (err: any) {
      console.error('Failed to load themes:', err);
      toast.error('Failed to load themes');
      setThemes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadThemes();
  }, []);

  const handleCreate = async (data: CreatePosThemeDto) => {
    await posThemeApi.create(data);
    await loadThemes();
  };

  const handleUpdate = async (data: CreatePosThemeDto) => {
    if (!editingTheme) return;
    await posThemeApi.update(editingTheme.id, data);
    await loadThemes();
  };

  const handleDelete = async (id: string, isSystem: boolean, isActive: boolean) => {
    if (isSystem) {
      toast.error('Cannot delete system themes');
      return;
    }
    if (isActive) {
      toast.error('Cannot delete the active theme');
      return;
    }
    if (!confirm('Delete this theme?')) return;
    try {
      await posThemeApi.delete(id);
      toast.success('Theme deleted');
      await loadThemes();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete theme');
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await posThemeApi.setActive(id);
      toast.success('Theme activated');
      await loadThemes();
    } catch (err: any) {
      toast.error(err.message || 'Failed to activate theme');
    }
  };

  return (
    <ProtectedPage permission="pos-theme:view">
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2.5" style={{ color: 'var(--foreground)' }}>
              <Palette className="w-6 h-6" style={{ color: '#C8102E' }} />
              POS Theme Configuration
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Customize brand colors and category tab colors for POS terminals. Changes apply immediately when activated.
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={() => { setEditingTheme(undefined); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-1.5" />
            New Theme
          </Button>
        </div>

        {/* Themes List */}
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center" style={{ color: 'var(--muted-foreground)' }}>
              Loading themes...
            </CardContent>
          </Card>
        ) : themes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center" style={{ color: 'var(--muted-foreground)' }}>
              No themes found. Create one to get started.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {themes.map((theme) => (
              <Card key={theme.id}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Color Preview */}
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <div
                          className="w-12 h-12 rounded-lg border-2"
                          style={{ backgroundColor: theme.primaryColor, borderColor: 'var(--border)' }}
                          title={`Primary: ${theme.primaryColor}`}
                        />
                        <div
                          className="w-12 h-12 rounded-lg border-2"
                          style={{ backgroundColor: theme.accentColor, borderColor: 'var(--border)' }}
                          title={`Accent: ${theme.accentColor}`}
                        />
                      </div>
                      {/* Category Colors Preview */}
                      {theme.categoryColors && theme.categoryColors.length > 0 && (
                        <div className="flex gap-1" title="Category tab colors">
                          {theme.categoryColors.map((color, idx) => (
                            <div
                              key={idx}
                              className="w-6 h-6 rounded border"
                              style={{ backgroundColor: color, borderColor: 'var(--border)' }}
                              title={`Tab ${idx}: ${color}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Theme Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>
                          {theme.themeName}
                        </h3>
                        {theme.isActive && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <Star className="w-3 h-3 fill-current" />
                            Active
                          </span>
                        )}
                        {theme.isSystem && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            System
                          </span>
                        )}
                      </div>
                      {theme.description && (
                        <p className="text-sm mb-2" style={{ color: 'var(--muted-foreground)' }}>
                          {theme.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-3 text-xs font-mono" style={{ color: 'var(--muted-foreground)' }}>
                        <span>Primary: {theme.primaryColor}</span>
                        <span>Accent: {theme.accentColor}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {!theme.isActive && (
                        <button
                          onClick={() => handleActivate(theme.id)}
                          className="p-2 rounded-lg transition-colors"
                          style={{ color: 'var(--muted-foreground)' }}
                          title="Activate this theme"
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)'; e.currentTarget.style.color = 'var(--foreground)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--muted-foreground)'; }}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => { setEditingTheme(theme); setShowForm(true); }}
                        className="p-2 rounded-lg transition-colors"
                        style={{ color: 'var(--muted-foreground)' }}
                        title="Edit theme"
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)'; e.currentTarget.style.color = 'var(--foreground)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--muted-foreground)'; }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {!theme.isSystem && !theme.isActive && (
                        <button
                          onClick={() => handleDelete(theme.id, theme.isSystem, theme.isActive)}
                          className="p-2 rounded-lg transition-colors"
                          style={{ color: 'var(--muted-foreground)' }}
                          title="Delete theme"
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FEE2E2'; e.currentTarget.style.color = '#DC2626'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--muted-foreground)'; }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div
          className="rounded-lg px-4 py-3 text-sm flex items-start gap-3"
          style={{ backgroundColor: '#EFF6FF', borderLeft: '3px solid #3B82F6', color: '#1E40AF' }}
        >
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Note:</strong> The active theme will be applied to all POS terminals when they connect to the server. 
            Changes take effect immediately upon activation.
          </div>
        </div>
      </div>

      {/* Form Modal */}
      <ThemeFormModal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingTheme(undefined); }}
        onSave={editingTheme ? handleUpdate : handleCreate}
        initialData={editingTheme}
      />
    </ProtectedPage>
  );
}
