'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import { Plus, Trash2, Save, GripVertical, Calculator, FileStack, Layers, Search, ChevronDown, X } from 'lucide-react';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { recipesApi, type Recipe, type RecipeComponent, type RecipeIngredient } from '@/lib/api/recipes';
import { recipeTemplatesApi, type RecipeTemplate } from '@/lib/api/recipe-templates';
import { productsApi, type Product } from '@/lib/api/products';
import { ingredientsApi, type Ingredient } from '@/lib/api/ingredients';
import { productionSectionsApi, type ProductionSection } from '@/lib/api/production-sections';
import toast from 'react-hot-toast';
import { formatSlDate } from '@/lib/sri-lanka-time';

export default function RecipeManagementPage() {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedComponentIndex, setSelectedComponentIndex] = useState<number>(-1);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [previewQty, setPreviewQty] = useState('100');
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // Product searchable dropdown state
  const [productSearch, setProductSearch] = useState('');
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const productDropdownRef = useRef<HTMLDivElement>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [productionSections, setProductionSections] = useState<ProductionSection[]>([]);
  const [templates, setTemplates] = useState<RecipeTemplate[]>([]);
  const [calculationResult, setCalculationResult] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const [loadingCalculation, setLoadingCalculation] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      fetchRecipeForProduct(selectedProductId);
    }
  }, [selectedProductId]);

  // Close product dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (productDropdownRef.current && !productDropdownRef.current.contains(e.target as Node)) {
        setProductDropdownOpen(false);
        setProductSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (selectedProductId && previewQty) {
      const qty = Number(previewQty);
      if (qty > 0) {
        calculatePreview();
      }
    }
  }, [selectedProductId, previewQty, recipe]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [productsRes, ingredientsRes, sectionsRes] = await Promise.all([
        productsApi.getAll(1, 1000, undefined, undefined, true),
        ingredientsApi.getAll(1, 1000, undefined, undefined, undefined, true),
        productionSectionsApi.getAll(1, 1000, undefined, true),
      ]);
      setProducts(productsRes.products);
      setIngredients(ingredientsRes.ingredients);
      setProductionSections(sectionsRes.productionSections);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'Failed to fetch initial data');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecipeForProduct = async (productId: string) => {
    try {
      setLoadingRecipe(true);
      const recipeData = await recipesApi.getByProductId(productId);
      setRecipe(recipeData);
      setSelectedComponentIndex(-1);
    } catch (error: any) {
      if (error?.response?.status === 404) {
        setRecipe(null);
        toast('No recipe found for this product. Create a new recipe or load from template.');
      } else {
        toast.error(error?.response?.data?.message || error.message || 'Failed to fetch recipe');
      }
    } finally {
      setLoadingRecipe(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const templatesRes = await recipeTemplatesApi.getAll(1, 100, undefined, true);
      setTemplates(templatesRes.recipeTemplates);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'Failed to fetch templates');
    }
  };

  const calculatePreview = async () => {
    if (!selectedProductId || !recipe) return;
    try {
      setLoadingCalculation(true);
      const qty = Number(previewQty) || 100;
      const result = await recipesApi.calculateIngredients(selectedProductId, qty);
      setCalculationResult(result);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'Failed to calculate ingredients');
      setCalculationResult(null);
    } finally {
      setLoadingCalculation(false);
    }
  };

  const handleAddComponent = () => {
    if (!recipe) {
      const selectedProduct = products.find(p => p.id === selectedProductId);
      if (!selectedProduct) {
        toast.error('Please select a product first');
        return;
      }
      const newRecipe: Recipe = {
        id: '',
        productId: selectedProductId,
        productCode: selectedProduct.code,
        productName: selectedProduct.name,
        version: 1,
        effectiveFrom: new Date().toISOString(),
        applyRoundOff: false,
        isActive: true,
        recipeComponents: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setRecipe(newRecipe);
    }

    const newIndex = recipe?.recipeComponents.length || 0;
    const newComponent: RecipeComponent = {
      productionSectionId: productionSections[0]?.id || '',
      componentName: `Component ${newIndex + 1}`,
      sortOrder: newIndex + 1,
      isPercentageBased: false,
      recipeIngredients: [],
    };

    setRecipe(prev => ({
      ...prev!,
      recipeComponents: [...(prev?.recipeComponents || []), newComponent],
    }));
    setSelectedComponentIndex(newIndex);
  };

  const handleRemoveComponent = (index: number) => {
    if (!recipe) return;
    const updatedComponents = recipe.recipeComponents.filter((_, i) => i !== index);
    setRecipe({ ...recipe, recipeComponents: updatedComponents });
    // Deselect: go to -1 if no components left, or if deleted component was selected
    if (updatedComponents.length === 0) {
      setSelectedComponentIndex(-1);
    } else if (selectedComponentIndex >= updatedComponents.length) {
      setSelectedComponentIndex(updatedComponents.length - 1);
    } else if (selectedComponentIndex === index) {
      setSelectedComponentIndex(-1);
    }
  };

  const handleUpdateComponent = (index: number, field: keyof RecipeComponent, value: any) => {
    if (!recipe) return;
    const updatedComponents = [...recipe.recipeComponents];
    updatedComponents[index] = { ...updatedComponents[index], [field]: value };
    setRecipe({ ...recipe, recipeComponents: updatedComponents });
  };

  const handleAddIngredient = () => {
    if (!recipe || selectedComponentIndex < 0 || selectedComponentIndex >= recipe.recipeComponents.length) {
      toast.error('Please select a component first');
      return;
    }

    const newIngredient: RecipeIngredient = {
      ingredientId: ingredients[0]?.id || '',
      qtyPerUnit: 0,
      extraQtyPerUnit: 0,
      storesOnly: false,
      showExtraInStores: false,
      isPercentage: false,
      sortOrder: recipe.recipeComponents[selectedComponentIndex].recipeIngredients.length + 1,
    };

    const updatedComponents = [...recipe.recipeComponents];
    updatedComponents[selectedComponentIndex] = {
      ...updatedComponents[selectedComponentIndex],
      recipeIngredients: [...updatedComponents[selectedComponentIndex].recipeIngredients, newIngredient],
    };
    setRecipe({ ...recipe, recipeComponents: updatedComponents });
  };

  const handleRemoveIngredient = (ingredientIndex: number) => {
    if (!recipe || selectedComponentIndex < 0) return;
    const updatedComponents = [...recipe.recipeComponents];
    updatedComponents[selectedComponentIndex] = {
      ...updatedComponents[selectedComponentIndex],
      recipeIngredients: updatedComponents[selectedComponentIndex].recipeIngredients.filter((_, i) => i !== ingredientIndex),
    };
    setRecipe({ ...recipe, recipeComponents: updatedComponents });
  };

  const handleUpdateIngredient = (ingredientIndex: number, field: keyof RecipeIngredient, value: any) => {
    if (!recipe || selectedComponentIndex < 0) return;
    const updatedComponents = [...recipe.recipeComponents];
    const updatedIngredients = [...updatedComponents[selectedComponentIndex].recipeIngredients];
    updatedIngredients[ingredientIndex] = { ...updatedIngredients[ingredientIndex], [field]: value };
    updatedComponents[selectedComponentIndex] = {
      ...updatedComponents[selectedComponentIndex],
      recipeIngredients: updatedIngredients,
    };
    setRecipe({ ...recipe, recipeComponents: updatedComponents });
  };

  const handleSave = async () => {
    if (!recipe || !selectedProductId) {
      toast.error('No recipe to save');
      return;
    }

    if (recipe.recipeComponents.length === 0) {
      toast.error('Please add at least one recipe component');
      return;
    }

    try {
      setSubmitting(true);
      if (recipe.id) {
        await recipesApi.update(recipe.id, {
          productId: selectedProductId,
          recipeName: recipe.recipeName || undefined,
          templateId: recipe.templateId,
          version: recipe.version,
          effectiveFrom: recipe.effectiveFrom,
          effectiveTo: recipe.effectiveTo,
          applyRoundOff: recipe.applyRoundOff,
          roundOffValue: recipe.roundOffValue,
          roundOffNotes: recipe.roundOffNotes,
          isActive: recipe.isActive,
          recipeComponents: recipe.recipeComponents,
        });
        toast.success('Recipe updated successfully');
      } else {
        const created = await recipesApi.create({
          productId: selectedProductId,
          recipeName: recipe.recipeName || undefined,
          templateId: recipe.templateId,
          version: 1,
          effectiveFrom: new Date().toISOString(),
          applyRoundOff: recipe.applyRoundOff,
          isActive: true,
          recipeComponents: recipe.recipeComponents,
        });
        setRecipe(created);
        toast.success('Recipe created successfully');
      }
      await fetchRecipeForProduct(selectedProductId);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'Failed to save recipe');
    } finally {
      setSubmitting(false);
    }
  };

  // Fix Issue 2: actually fetch template detail and map components/ingredients into the recipe
  const handleLoadTemplate = async (templateId: string) => {
    if (!selectedProductId) {
      toast.error('Please select a product first');
      return;
    }

    try {
      setLoadingTemplate(true);
      const detail = await recipeTemplatesApi.getById(templateId);
      const selectedProduct = products.find(p => p.id === selectedProductId);
      if (!selectedProduct) return;

      const mappedComponents: RecipeComponent[] = (detail.components ?? [])
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((comp) => ({
          productionSectionId: comp.productionSectionId,
          componentName: comp.componentName,
          sortOrder: comp.sortOrder,
          isPercentageBased: false,
          recipeIngredients: (comp.ingredients ?? [])
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((ing) => ({
              ingredientId: ing.ingredientId,
              qtyPerUnit: ing.qtyPerUnit,
              extraQtyPerUnit: ing.extraQtyPerUnit,
              storesOnly: ing.storesOnly,
              showExtraInStores: ing.showExtraInStores,
              isPercentage: false,
              sortOrder: ing.sortOrder,
            })),
        }));

      const newRecipe: Recipe = {
        id: recipe?.id || '',
        productId: selectedProductId,
        productCode: selectedProduct.code,
        productName: selectedProduct.name,
        templateId: templateId,
        templateName: detail.name,
        version: recipe?.version || 1,
        effectiveFrom: recipe?.effectiveFrom || new Date().toISOString(),
        applyRoundOff: false,
        isActive: true,
        recipeComponents: mappedComponents,
        createdAt: recipe?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setRecipe(newRecipe);
      setSelectedComponentIndex(-1);
      setShowTemplateModal(false);

      if (mappedComponents.length > 0) {
        toast.success(`Template "${detail.name}" loaded — ${mappedComponents.length} component(s) ready. Review and save.`);
      } else {
        toast(`Template "${detail.name}" loaded but has no components yet. Add components manually.`);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'Failed to load template');
    } finally {
      setLoadingTemplate(false);
    }
  };

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const filteredProducts = products.filter(p =>
    productSearch === '' ||
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.code.toLowerCase().includes(productSearch.toLowerCase())
  );

  const ingredientOptions = ingredients.map(i => ({ value: i.id, label: `${i.code} - ${i.name}` }));
  const sectionOptions = productionSections.map(s => ({ value: s.id, label: s.name }));

  const currentComponent = selectedComponentIndex >= 0 ? recipe?.recipeComponents[selectedComponentIndex] : undefined;

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center" style={{ color: 'var(--muted-foreground)' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Recipe Management</h1>
        <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>Create and edit product recipes with multi-component structure</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Product selection + component list */}
        <Card>
          <CardHeader><CardTitle>Product Selection</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Searchable product dropdown */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                  Product
                </label>
                <div ref={productDropdownRef} className="relative">
                  {/* Trigger button */}
                  <button
                    type="button"
                    onClick={() => {
                      setProductDropdownOpen((o) => !o);
                      setProductSearch('');
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg text-left"
                    style={{
                      border: '1px solid var(--input)',
                      backgroundColor: 'var(--background)',
                      color: selectedProductId ? 'var(--foreground)' : 'var(--muted-foreground)',
                    }}
                  >
                    <span className="truncate">
                      {selectedProduct ? `${selectedProduct.code} - ${selectedProduct.name}` : 'Select a product…'}
                    </span>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {selectedProductId && (
                        <span
                          role="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProductId('');
                            setRecipe(null);
                            setCalculationResult(null);
                          }}
                          className="p-0.5 rounded hover:bg-red-100"
                          style={{ color: 'var(--muted-foreground)' }}
                        >
                          <X className="w-3.5 h-3.5" />
                        </span>
                      )}
                      <ChevronDown
                        className="w-4 h-4 transition-transform"
                        style={{
                          color: 'var(--muted-foreground)',
                          transform: productDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}
                      />
                    </div>
                  </button>

                  {/* Dropdown panel */}
                  {productDropdownOpen && (
                    <div
                      className="absolute z-50 w-full mt-1 rounded-lg shadow-lg overflow-hidden"
                      style={{ border: '1px solid var(--border)', backgroundColor: 'var(--background)' }}
                    >
                      {/* Search input */}
                      <div className="p-2 border-b" style={{ borderColor: 'var(--border)' }}>
                        <div className="flex items-center gap-2 px-2 py-1.5 rounded"
                          style={{ border: '1px solid var(--input)', backgroundColor: 'var(--muted)' }}
                        >
                          <Search className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--muted-foreground)' }} />
                          <input
                            autoFocus
                            type="text"
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            placeholder="Search by code or name…"
                            autoComplete="off"
                            className="flex-1 text-sm bg-transparent outline-none"
                            style={{ color: 'var(--foreground)' }}
                          />
                          {productSearch && (
                            <button onClick={() => setProductSearch('')}>
                              <X className="w-3.5 h-3.5" style={{ color: 'var(--muted-foreground)' }} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Options list */}
                      <div className="max-h-56 overflow-y-auto">
                        {filteredProducts.length === 0 ? (
                          <div className="px-4 py-6 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
                            No products match "{productSearch}"
                          </div>
                        ) : (
                          filteredProducts.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setSelectedProductId(p.id);
                                setProductDropdownOpen(false);
                                setProductSearch('');
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors"
                              style={{
                                backgroundColor: p.id === selectedProductId ? 'var(--dms-amber)' : 'transparent',
                                color: 'var(--foreground)',
                              }}
                              onMouseEnter={(e) => {
                                if (p.id !== selectedProductId)
                                  e.currentTarget.style.backgroundColor = 'var(--muted)';
                              }}
                              onMouseLeave={(e) => {
                                if (p.id !== selectedProductId)
                                  e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                            >
                              <span
                                className="text-xs font-mono px-1.5 py-0.5 rounded shrink-0"
                                style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}
                              >
                                {p.code}
                              </span>
                              <span className="truncate">{p.name}</span>
                            </button>
                          ))
                        )}
                      </div>

                      {/* Count footer */}
                      <div className="px-3 py-1.5 border-t text-xs" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)', backgroundColor: 'var(--muted)' }}>
                        {filteredProducts.length} of {products.length} products
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {loadingRecipe && (
                <div className="text-sm text-center" style={{ color: 'var(--muted-foreground)' }}>
                  Loading recipe...
                </div>
              )}

              {/* Fix Issue 3: recipeName input */}
              {recipe && (
                <>
                  <div className="pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                    <p className="text-sm font-medium mb-3" style={{ color: 'var(--muted-foreground)' }}>Recipe Details</p>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>
                          Recipe Name
                        </label>
                        <input
                          type="text"
                          value={recipe.recipeName ?? ''}
                          onChange={(e) => setRecipe(prev => prev ? { ...prev, recipeName: e.target.value } : prev)}
                          placeholder="e.g. Dough Recipe, Standard Mix"
                          className="w-full px-2 py-1.5 text-sm rounded"
                          style={{ border: '1px solid var(--input)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                        />
                      </div>
                      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        Version {recipe.version} · Effective {formatSlDate(recipe.effectiveFrom)}
                      </p>
                      {recipe.templateName && (
                        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                          Template: {recipe.templateName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                    <p className="text-sm font-medium mb-2" style={{ color: 'var(--muted-foreground)' }}>
                      Components ({recipe.recipeComponents.length})
                    </p>
                    <div className="space-y-2">
                      {recipe.recipeComponents.map((component, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedComponentIndex(index)}
                          className="w-full px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors flex items-center justify-between"
                          style={{
                            backgroundColor: selectedComponentIndex === index ? 'var(--dms-amber)' : 'var(--dms-pill-off-bg)',
                            border: `1px solid ${selectedComponentIndex === index ? 'var(--dms-notes-border)' : 'var(--dms-pill-off-border)'}`,
                            color: 'var(--foreground)',
                          }}
                        >
                          <span>{component.componentName}</span>
                          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                            {component.recipeIngredients.length} ingredients
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="pt-4 space-y-2">
                <Button variant="secondary" size="sm" onClick={handleAddComponent} fullWidth>
                  <Plus className="w-4 h-4 mr-2" />Add Component
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { fetchTemplates(); setShowTemplateModal(true); }}
                  fullWidth
                  disabled={!selectedProductId}
                >
                  <FileStack className="w-4 h-4 mr-2" />Load Template
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right: Component editor + calculator */}
        <div className="lg:col-span-2 space-y-6">
          {currentComponent ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Component: {currentComponent.componentName}</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveComponent(selectedComponentIndex)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 mb-6">
                    <Input
                      label="Component Name"
                      value={currentComponent.componentName}
                      onChange={(e) => handleUpdateComponent(selectedComponentIndex, 'componentName', e.target.value)}
                      placeholder="e.g., Dough Recipe, Filling Recipe"
                      fullWidth
                    />
                    <Select
                      label="Production Section"
                      value={currentComponent.productionSectionId}
                      onChange={(e) => handleUpdateComponent(selectedComponentIndex, 'productionSectionId', e.target.value)}
                      options={sectionOptions}
                      fullWidth
                    />
                    <Input
                      label="Sort Order"
                      type="number"
                      value={String(currentComponent.sortOrder)}
                      onChange={(e) => handleUpdateComponent(selectedComponentIndex, 'sortOrder', Number(e.target.value))}
                      fullWidth
                    />
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium" style={{ color: 'var(--foreground)' }}>Ingredients</h3>
                    <Button variant="secondary" size="sm" onClick={handleAddIngredient}>
                      <Plus className="w-4 h-4 mr-2" />Add Ingredient
                    </Button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y" style={{ borderColor: 'var(--border)' }}>
                      <thead style={{ backgroundColor: 'var(--muted)' }}>
                        <tr>
                          <th className="px-2 py-3 text-xs font-medium" style={{ color: 'var(--muted-foreground)', width: '30px' }}></th>
                          <th className="px-3 py-3 text-left text-xs font-medium" style={{ color: 'var(--muted-foreground)', minWidth: '200px' }}>Ingredient</th>
                          <th className="px-3 py-3 text-center text-xs font-medium" style={{ color: 'var(--muted-foreground)', minWidth: '90px' }}>Qty/Unit</th>
                          <th className="px-3 py-3 text-center text-xs font-medium" style={{ color: 'var(--muted-foreground)', minWidth: '90px' }}>Extra/Unit</th>
                          {/* Fix Issue 1: all four option columns */}
                          <th className="px-3 py-3 text-center text-xs font-medium" style={{ color: 'var(--muted-foreground)', minWidth: '80px' }}>Stores Only</th>
                          <th className="px-3 py-3 text-center text-xs font-medium" style={{ color: 'var(--muted-foreground)', minWidth: '100px' }}>Extra in Stores</th>
                          <th className="px-3 py-3 text-center text-xs font-medium" style={{ color: 'var(--muted-foreground)', minWidth: '80px' }}>Percentage</th>
                          <th className="px-2 py-3 text-xs font-medium" style={{ color: 'var(--muted-foreground)', width: '50px' }}></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                        {currentComponent.recipeIngredients.map((ingredient, index) => (
                          <tr key={index}>
                            <td className="px-2 py-2">
                              <GripVertical className="w-4 h-4" style={{ color: 'var(--muted-foreground)', cursor: 'grab' }} />
                            </td>
                            <td className="px-3 py-2">
                              <select
                                className="w-full px-2 py-1 text-sm rounded"
                                style={{ border: '1px solid var(--input)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                                value={ingredient.ingredientId}
                                onChange={(e) => handleUpdateIngredient(index, 'ingredientId', e.target.value)}
                              >
                                {ingredientOptions.map(opt => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                step="0.001"
                                value={ingredient.qtyPerUnit}
                                onChange={(e) => handleUpdateIngredient(index, 'qtyPerUnit', Number(e.target.value))}
                                onFocus={(e) => e.target.select()}
                                className="w-full px-2 py-1 text-sm text-center rounded"
                                style={{ border: '1px solid var(--input)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                step="0.001"
                                value={ingredient.extraQtyPerUnit}
                                onChange={(e) => handleUpdateIngredient(index, 'extraQtyPerUnit', Number(e.target.value))}
                                onFocus={(e) => e.target.select()}
                                className="w-full px-2 py-1 text-sm text-center rounded"
                                style={{ border: '1px solid var(--input)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                              />
                            </td>
                            {/* Fix Issue 1: storesOnly */}
                            <td className="px-3 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={ingredient.storesOnly}
                                onChange={(e) => handleUpdateIngredient(index, 'storesOnly', e.target.checked)}
                                className="w-4 h-4 cursor-pointer"
                                title="Stores Only — ingredient only counted for stores, not production floor"
                              />
                            </td>
                            {/* Fix Issue 1: showExtraInStores — was missing */}
                            <td className="px-3 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={ingredient.showExtraInStores}
                                onChange={(e) => handleUpdateIngredient(index, 'showExtraInStores', e.target.checked)}
                                className="w-4 h-4 cursor-pointer"
                                title="Show Extra in Stores — include extra qty on stores sheet"
                              />
                            </td>
                            {/* Percentage */}
                            <td className="px-3 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={ingredient.isPercentage}
                                onChange={(e) => handleUpdateIngredient(index, 'isPercentage', e.target.checked)}
                                className="w-4 h-4 cursor-pointer"
                                title="Percentage — quantity is percentage-based"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <button
                                type="button"
                                onClick={() => handleRemoveIngredient(index)}
                                className="p-1 rounded transition-colors"
                                style={{ color: 'var(--dms-red-text)' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--dms-destructive-soft)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {currentComponent.recipeIngredients.length === 0 && (
                          <tr>
                            <td colSpan={8} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
                              No ingredients yet. Click "Add Ingredient" to start.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Column legend */}
                  <div className="mt-3 flex flex-wrap gap-4 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    <span><strong>Stores Only</strong> — ingredient counted for stores, not production floor</span>
                    <span><strong>Extra in Stores</strong> — show extra qty on stores sheet</span>
                    <span><strong>Percentage</strong> — qty is percentage-based</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Recipe Preview Calculator</CardTitle>
                    <Button variant="secondary" size="sm" onClick={calculatePreview} disabled={loadingCalculation || !recipe?.id}>
                      <Calculator className="w-4 h-4 mr-2" />
                      {loadingCalculation ? 'Calculating...' : 'Calculate'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Input
                      label="Production Quantity"
                      type="number"
                      value={previewQty}
                      onChange={(e) => setPreviewQty(e.target.value)}
                      placeholder="100"
                      helperText="Enter quantity to calculate ingredient requirements"
                      fullWidth
                    />

                    {!recipe?.id && (
                      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        Save the recipe first to use the calculator.
                      </p>
                    )}

                    {calculationResult && (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y" style={{ borderColor: 'var(--border)' }}>
                          <thead style={{ backgroundColor: 'var(--muted)' }}>
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Component</th>
                              <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Ingredient</th>
                              <th className="px-4 py-3 text-center text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Required Qty</th>
                              <th className="px-4 py-3 text-center text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Extra Qty</th>
                              <th className="px-4 py-3 text-center text-xs font-medium" style={{ color: 'var(--muted-foreground)', backgroundColor: 'var(--dms-amber)' }}>Total</th>
                              <th className="px-4 py-3 text-center text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Stores Only</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                            {calculationResult.ingredients.map((ing: any, idx: number) => (
                              <tr key={idx} style={ing.storesOnly ? { opacity: 0.65 } : {}}>
                                <td className="px-4 py-3 text-sm" style={{ color: 'var(--foreground)' }}>{ing.componentName}</td>
                                <td className="px-4 py-3 text-sm" style={{ color: 'var(--foreground)' }}>
                                  {ing.ingredientCode} — {ing.ingredientName}
                                </td>
                                <td className="px-4 py-3 text-center text-sm" style={{ color: '#3B82F6' }}>
                                  {ing.requiredQuantity.toFixed(3)} {ing.unit}
                                </td>
                                <td className="px-4 py-3 text-center text-sm" style={{ color: '#F59E0B' }}>
                                  {ing.extraQuantity.toFixed(3)} {ing.unit}
                                </td>
                                <td className="px-4 py-3 text-center text-sm font-bold" style={{ color: 'var(--dms-amber-fg)', backgroundColor: 'var(--dms-amber)' }}>
                                  {ing.totalQuantity.toFixed(3)} {ing.unit}
                                </td>
                                <td className="px-4 py-3 text-center text-xs" style={{ color: ing.storesOnly ? '#C8102E' : 'var(--muted-foreground)' }}>
                                  {ing.storesOnly ? 'Stores' : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Layers className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--muted-foreground)' }} />
                {!selectedProductId ? (
                  <>
                    <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--foreground)' }}>No Product Selected</h3>
                    <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                      Select a product to view or create its recipe.
                    </p>
                  </>
                ) : (recipe?.recipeComponents ?? []).length > 0 ? (
                  <>
                    <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--foreground)' }}>No Component Selected</h3>
                    <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                      Click a component from the list on the left to edit it.
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--foreground)' }}>No Components Yet</h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
                      Add a component to start building the recipe, or load a template.
                    </p>
                    <Button variant="primary" onClick={handleAddComponent}>
                      <Plus className="w-4 h-4 mr-2" />Add First Component
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Template modal */}
      <Modal isOpen={showTemplateModal} onClose={() => setShowTemplateModal(false)} title="Load Recipe Template" size="md">
        <div className="space-y-3">
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Select a template to pre-fill this recipe with components and ingredients. Existing components will be replaced.
          </p>
          {templates.filter(t => t.isActive).map((template) => (
            <button
              key={template.id}
              onClick={() => handleLoadTemplate(template.id)}
              disabled={loadingTemplate}
              className="w-full p-4 rounded-lg text-left transition-colors hover:!bg-[color:var(--muted)] disabled:opacity-50"
              style={{ border: '1px solid var(--border)' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium" style={{ color: 'var(--foreground)' }}>{template.name}</p>
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{template.description || 'No description'}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>Code: {template.code}</p>
                </div>
                {loadingTemplate
                  ? <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Loading…</div>
                  : <FileStack className="w-6 h-6" style={{ color: '#C8102E' }} />}
              </div>
            </button>
          ))}
          {templates.length === 0 && (
            <div className="p-8 text-center" style={{ color: 'var(--muted-foreground)' }}>
              No active templates found
            </div>
          )}
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowTemplateModal(false)} disabled={loadingTemplate}>Cancel</Button>
        </ModalFooter>
      </Modal>

      <div className="flex justify-end">
        <Button variant="primary" size="md" onClick={handleSave} disabled={submitting || !recipe}>
          <Save className="w-4 h-4 mr-2" />
          {submitting ? 'Saving...' : 'Save Recipe'}
        </Button>
      </div>

      <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--dms-success-callout)', border: '1px solid var(--dms-success-border)' }}>
        <div className="flex items-start space-x-3">
          <FileStack className="w-5 h-5 mt-0.5" style={{ color: 'var(--dms-success-text)' }} />
          <div>
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--dms-success-text)' }}>Multi-Component Recipe System:</p>
            <ul className="text-sm space-y-1" style={{ color: 'var(--dms-success-text)' }}>
              <li>• Recipes are organized into components — e.g., "Dough Recipe" and "Bun Recipe" are separate components under one product</li>
              <li>• Each component belongs to a production section (Bakery, Filling, etc.) and contains multiple ingredients</li>
              <li>• <strong>Stores Only</strong>: ingredient counted only on the stores sheet, not the production floor sheet</li>
              <li>• <strong>Extra in Stores</strong>: include the extra/waste qty on the stores sheet</li>
              <li>• Templates pre-fill components and ingredients — load one then save</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
