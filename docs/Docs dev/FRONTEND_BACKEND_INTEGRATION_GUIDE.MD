# Frontend-Backend Integration Guide
## Don & Sons DMS - Complete Integration Plan

## Overview

This document provides a comprehensive guide for integrating the Next.js frontend with the ASP.NET Core backend, removing all hardcoded/mock data and connecting to real database data.

## Current Status

### ✅ Already Integrated
1. **Categories** (`/inventory/category`) - Fully integrated with backend
2. **Unit of Measures** (`/inventory/uom`) - Fully integrated with backend
3. **Authentication** (`/login`) - JWT-based auth with refresh tokens

### 🔄 Needs Integration
1. **Products** (`/inventory/products`) - Using `mockProducts`
2. **Ingredients** (`/inventory/ingredient`) - Using `mockIngredients`
3. **Dashboard Widgets** - Using mock data for charts
4. **Users Management** - If backend APIs exist
5. **Roles & Permissions** - If backend APIs exist

## Architecture

### Backend (ASP.NET Core)
```
Controllers → Services → Repositories → DbContext → PostgreSQL
     ↓           ↓            ↓
   DTOs    AutoMapper    Entities
```

### Frontend (Next.js)
```
Pages/Components → API Client → Axios → Backend API
        ↓              ↓
   useState/      Response Types
   useEffect      (TypeScript)
```

### API Communication Flow
```
Frontend (React)
    ↓
API Client (lib/api/*.ts)
    ↓
Axios Interceptor (adds JWT token)
    ↓
Backend API (Controllers)
    ↓
Service Layer
    ↓
Database (PostgreSQL)
```

## Integration Steps

### Step 1: Update API Client (if needed)

**Location**: `DMS-Frontend/src/lib/api/client.ts`

Already configured with:
- ✅ Base URL: `http://localhost:5000`
- ✅ JWT token injection
- ✅ Automatic token refresh on 401
- ✅ Error handling

### Step 2: Create/Update API Module

**Pattern**: `DMS-Frontend/src/lib/api/{entity}.ts`

Example structure:
```typescript
import apiClient from './client';

export interface Entity {
  id: string;
  // ... other fields
}

export interface CreateEntityDto {
  // ... fields
}

export interface UpdateEntityDto {
  // ... fields
}

export interface EntitiesResponse {
  entities: Entity[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const entityApi = {
  async getAll(params): Promise<EntitiesResponse> {
    const response = await apiClient.get('/api/entity', { params });
    return response.data.data;
  },
  
  async getById(id: string): Promise<Entity> {
    const response = await apiClient.get(`/api/entity/${id}`);
    return response.data.data;
  },
  
  async create(data: CreateEntityDto): Promise<Entity> {
    const response = await apiClient.post('/api/entity', data);
    return response.data.data;
  },
  
  async update(id: string, data: UpdateEntityDto): Promise<Entity> {
    const response = await apiClient.put(`/api/entity/${id}`, data);
    return response.data.data;
  },
  
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/entity/${id}`);
  },
};
```

### Step 3: Update Page Component

**Pattern**: Replace mock data with API calls

#### Before (Mock Data):
```typescript
import { mockProducts } from '@/lib/mock-data/products';

export default function ProductsPage() {
  const [products, setProducts] = useState(mockProducts);
  // ...
}
```

#### After (Real API):
```typescript
import { productsApi, type Product } from '@/lib/api/products';
import { useEffect, useState } from 'react';
import { toast } from 'sonner'; // or your toast library

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch data on mount and when filters change
  useEffect(() => {
    fetchProducts();
  }, [currentPage, pageSize, searchTerm]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await productsApi.getAll(
        currentPage,
        pageSize,
        searchTerm || undefined,
        undefined, // categoryId
        true // activeOnly
      );
      
      setProducts(response.products);
      setTotalPages(response.totalPages);
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: CreateProductDto) => {
    try {
      await productsApi.create(data);
      toast.success('Product created successfully');
      fetchProducts(); // Refresh list
    } catch (err: any) {
      toast.error(err.message || 'Failed to create product');
    }
  };

  const handleUpdate = async (id: string, data: UpdateProductDto) => {
    try {
      await productsApi.update(id, data);
      toast.success('Product updated successfully');
      fetchProducts(); // Refresh list
    } catch (err: any) {
      toast.error(err.message || 'Failed to update product');
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      const product = products.find(p => p.id === id);
      if (!product) return;
      
      await productsApi.update(id, {
        ...product,
        isActive: !product.isActive
      });
      
      toast.success(`Product ${product.isActive ? 'deactivated' : 'activated'}`);
      fetchProducts(); // Refresh list
    } catch (err: any) {
      toast.error(err.message || 'Failed to toggle product status');
    }
  };

  // Loading state
  if (loading && products.length === 0) {
    return <div>Loading...</div>;
  }

  // Error state
  if (error && products.length === 0) {
    return <div>Error: {error}</div>;
  }

  return (
    // ... your JSX
  );
}
```

## Integration Checklist by Module

### Products Page Integration

**File**: `DMS-Frontend/src/app/(dashboard)/inventory/products/page.tsx`

- [ ] Remove `import { mockProducts, mockCategories, mockUOMs } from '@/lib/mock-data/products'`
- [ ] Add `import { productsApi, type Product } from '@/lib/api/products'`
- [ ] Add `import { categoriesApi } from '@/lib/api/categories'`
- [ ] Add `import { uomsApi } from '@/lib/api/uoms'`
- [ ] Add loading state with `useState<boolean>(true)`
- [ ] Add error state with `useState<string | null>(null)`
- [ ] Add `useEffect` to fetch products on mount
- [ ] Update `handleAddProduct` to call `productsApi.create()`
- [ ] Update `handleEditProduct` to call `productsApi.update()`
- [ ] Update `handleToggleActive` to call `productsApi.update()`
- [ ] Fetch categories and UOMs for dropdowns
- [ ] Add toast notifications for success/error
- [ ] Update TypeScript interfaces to match backend DTOs
- [ ] Handle pagination properly with backend response
- [ ] Test CRUD operations

### Ingredients Page Integration

**File**: `DMS-Frontend/src/app/(dashboard)/inventory/ingredient/page.tsx`

- [ ] Remove `import { mockIngredients, mockUOMs } from '@/lib/mock-data/products'`
- [ ] Add `import { ingredientsApi, type Ingredient } from '@/lib/api/ingredients'`
- [ ] Add `import { uomsApi } from '@/lib/api/uoms'`
- [ ] Add `import { categoriesApi } from '@/lib/api/categories'`
- [ ] Add loading state
- [ ] Add error state
- [ ] Add `useEffect` to fetch ingredients
- [ ] Update `handleAddIngredient` to call `ingredientsApi.create()`
- [ ] Update `handleEditIngredient` to call `ingredientsApi.update()`
- [ ] Update `handleToggleActive` to call `ingredientsApi.update()`
- [ ] Fetch UOMs and categories for dropdowns
- [ ] Add toast notifications
- [ ] Update TypeScript interfaces
- [ ] Test CRUD operations

### Dashboard Widgets Integration

**Files**: 
- `DMS-Frontend/src/components/dashboard/sales-trend-widget.tsx`
- `DMS-Frontend/src/components/dashboard/disposal-by-section-widget.tsx`
- `DMS-Frontend/src/components/dashboard/top-deliveries-widget.tsx`

**Note**: Dashboard widgets require backend APIs for:
- Sales trends (daily/weekly sales data)
- Disposal by section (disposal records)
- Top deliveries (delivery records)

**Action**: Check if these APIs exist in backend. If not, document as "Future Implementation".

## Common Patterns

### 1. Loading States

```typescript
{loading ? (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
) : (
  // ... content
)}
```

### 2. Error States

```typescript
{error && (
  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
    {error}
  </div>
)}
```

### 3. Empty States

```typescript
{products.length === 0 && !loading && (
  <div className="text-center py-8 text-muted-foreground">
    No products found. Create your first product!
  </div>
)}
```

### 4. Debounced Search

```typescript
import { useDebounce } from '@/lib/hooks/useDebounce';

const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebounce(searchTerm, 300);

useEffect(() => {
  fetchData();
}, [debouncedSearch]);
```

### 5. Optimistic Updates (Optional)

```typescript
const handleToggleActive = async (id: string) => {
  // Optimistic update
  setProducts(prev => prev.map(p => 
    p.id === id ? { ...p, isActive: !p.isActive } : p
  ));

  try {
    await productsApi.update(id, { ...product, isActive: !product.isActive });
  } catch (err) {
    // Rollback on error
    setProducts(prev => prev.map(p => 
      p.id === id ? { ...p, isActive: !p.isActive } : p
    ));
    toast.error('Failed to update');
  }
};
```

## Backend API Response Format

All backend APIs follow this format:

```typescript
// Success Response
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // ... actual data
  }
}

// Error Response
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "code": "ERROR_CODE",
      "message": "Detailed error message",
      "field": "fieldName" // optional, for validation errors
    }
  ]
}
```

## API Client Response Handling

API client already extracts `response.data.data`:

```typescript
const response = await apiClient.get('/api/products');
return response.data.data; // Extracts the actual data
```

## Environment Variables

**File**: `DMS-Frontend/.env.local`

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

For production:
```bash
NEXT_PUBLIC_API_URL=https://your-domain.com/api
```

## Testing Integration

### 1. Start Backend
```bash
cd DMS-Backend
dotnet run
```

Backend should run on: `http://localhost:5000`

### 2. Start Frontend
```bash
cd DMS-Frontend
npm run dev
```

Frontend should run on: `http://localhost:3000`

### 3. Test Flow
1. **Login** → Should get JWT token
2. **Navigate to Categories** → Should load from database
3. **Create a Category** → Should save to database
4. **Navigate to Products** → Should load from database
5. **Create a Product** → Should save and link to category
6. **Edit Product** → Should update in database
7. **Toggle Active** → Should update status

### 4. Check Network Tab
- Open DevTools → Network tab
- Filter by "XHR" or "Fetch"
- Verify requests go to `http://localhost:5000/api/*`
- Check response status (200, 201, 401, etc.)
- Verify JWT token in Authorization header

### 5. Check Backend Logs
Backend should log:
```
[INFO] POST /api/products - 201 Created
[INFO] GET /api/products?page=1&pageSize=10 - 200 OK
```

## Error Handling

### Common Errors

#### 1. 401 Unauthorized
**Cause**: No token or expired token
**Solution**: Login again, token refresh should happen automatically

#### 2. 403 Forbidden
**Cause**: User doesn't have permission
**Solution**: Check user's role and permissions in database

#### 3. 404 Not Found
**Cause**: Resource doesn't exist or wrong URL
**Solution**: Check API endpoint and IDs

#### 4. 409 Conflict
**Cause**: Duplicate code or constraint violation
**Solution**: Show meaningful error to user

#### 5. 500 Server Error
**Cause**: Backend exception
**Solution**: Check backend logs

## Toast Notifications

Using Sonner (already installed):

```typescript
import { toast } from 'sonner';

// Success
toast.success('Product created successfully');

// Error
toast.error('Failed to create product');

// Loading
const toastId = toast.loading('Creating product...');
// ... after operation
toast.dismiss(toastId);
toast.success('Product created');
```

## TypeScript Types

### Matching Backend DTOs

Backend uses C# DTOs, frontend uses TypeScript interfaces. Ensure they match:

**Backend** (C#):
```csharp
public class CreateProductDto
{
    public string Code { get; set; }
    public string Name { get; set; }
    public Guid CategoryId { get; set; }
    public decimal UnitPrice { get; set; }
    public bool IsActive { get; set; }
}
```

**Frontend** (TypeScript):
```typescript
export interface CreateProductDto {
  code: string;
  name: string;
  categoryId: string; // UUID as string
  unitPrice: number;
  isActive: boolean;
}
```

## Performance Optimization

### 1. Cache API Responses (Optional)
```typescript
import { useQuery } from '@tanstack/react-query';

const { data, isLoading, error } = useQuery({
  queryKey: ['products', page, search],
  queryFn: () => productsApi.getAll(page, 10, search),
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

### 2. Lazy Load Dropdowns
Only fetch categories/UOMs when modal opens:
```typescript
useEffect(() => {
  if (showModal) {
    fetchCategories();
    fetchUOMs();
  }
}, [showModal]);
```

### 3. Debounce Search
Already covered above.

## Security Considerations

### 1. JWT Token Storage
- ✅ Stored in Zustand store (memory)
- ✅ RefreshToken in localStorage (httpOnly cookie would be better for production)

### 2. API Calls
- ✅ Always include Authorization header
- ✅ Handle token refresh automatically
- ✅ Logout on auth failure

### 3. Input Validation
- Frontend: Basic validation before API call
- Backend: FluentValidation for all inputs (✅ Already implemented)

## Rollback Plan

If integration causes issues:

1. Keep mock data files
2. Use feature flag to toggle:
```typescript
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

const products = USE_MOCK_DATA ? mockProducts : await productsApi.getAll();
```

## Integration Priority

1. **High Priority** (Core functionality):
   - ✅ Categories
   - ✅ Unit of Measures
   - 🔄 Products
   - 🔄 Ingredients

2. **Medium Priority** (Administrative):
   - Users Management
   - Roles & Permissions
   - System Settings

3. **Low Priority** (Dashboard/Reports):
   - Dashboard widgets (need APIs)
   - Reports (need APIs)

## Next Steps

1. **Integrate Products Page** (This document provides the pattern)
2. **Integrate Ingredients Page** (Similar to Products)
3. **Test thoroughly**
4. **Document any issues**
5. **Create backend APIs for dashboard data** (if needed)
6. **Integrate remaining pages** as backend APIs become available

## Support

For issues:
1. Check browser console for errors
2. Check network tab for failed requests
3. Check backend logs for exceptions
4. Verify database has seed data
5. Ensure both servers are running

---

**Status**: Ready for Products and Ingredients integration
**Last Updated**: 2026-04-23
