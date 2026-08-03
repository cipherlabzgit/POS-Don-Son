# Phase 7 - Frontend Integration Plan

## Overview
Integrate 6 production pages with the Phase 7 backend APIs, removing all mock data.

---

## Pages to Integrate (6 total)

### 1. Daily Production (`production/daily-production/page.tsx`)
**Mock data:** `mockDailyProduction` from `@/lib/mock-data/production`
**API module to create:** `src/lib/api/daily-productions.ts`
**Endpoints:**
- `GET /api/daily-productions` - List with pagination, filter
- `GET /api/daily-productions/{id}` - Get detail
- `POST /api/daily-productions` - Create (Pending status)
- `PUT /api/daily-productions/{id}` - Update (only if Pending)
- `DELETE /api/daily-productions/{id}` - Soft delete (only if Pending)
- `POST /api/daily-productions/{id}/approve` - Approve
- `POST /api/daily-productions/{id}/reject` - Reject

**Integration tasks:**
- ✅ Remove `mockDailyProduction` import
- ✅ Create `dailyProductionsApi` module
- ✅ Implement `useEffect` for data fetching
- ✅ Add loading/error states
- ✅ Wire CRUD operations
- ✅ Wire workflow actions (approve, reject)
- ✅ Add toast notifications

---

### 2. Production Cancel (`production/production-cancel/page.tsx`)
**Mock data:** Inline mock data or from production.ts
**API module to create:** `src/lib/api/production-cancels.ts`
**Endpoints:** Same pattern as Daily Production
**Integration tasks:** Same pattern as Daily Production

---

### 3. Stock Adjustment (`production/stock-adjustment/page.tsx`)
**Mock data:** `mockStockAdjustments` from `@/lib/mock-data/production`
**API module to create:** `src/lib/api/stock-adjustments.ts`
**Endpoints:**
- `GET /api/stock-adjustments` - List
- `GET /api/stock-adjustments/{id}` - Detail
- `POST /api/stock-adjustments` - Create (Draft)
- `PUT /api/stock-adjustments/{id}` - Update (only if Draft)
- `DELETE /api/stock-adjustments/{id}` - Soft delete (only if Draft)
- `POST /api/stock-adjustments/{id}/submit` - Submit for approval
- `POST /api/stock-adjustments/{id}/approve` - Approve
- `POST /api/stock-adjustments/{id}/reject` - Reject

**Integration tasks:**
- ✅ Remove `mockStockAdjustments` import
- ✅ Create `stockAdjustmentsApi` module
- ✅ Wire submit/approve/reject workflow
- ✅ Draft → Pending → Approved/Rejected flow

---

### 4. Stock Adjustment Approval (`production/stock-adjustment-approval/page.tsx`)
**Mock data:** Uses `mockStockAdjustments` filtered by pending
**API module:** Uses existing `approvals.ts` (from Phase 4)
**Endpoints:**
- `GET /api/approvals?type=stock-adjustment` - Get pending stock adjustments
- `POST /api/approvals/{id}/approve` - Approve
- `POST /api/approvals/{id}/reject` - Reject

**Integration tasks:**
- ✅ Remove mock data
- ✅ Use existing `approvalsApi` with type filter
- ✅ Wire approve/reject actions
- ✅ Refresh list after approval

---

### 5. Current Stock (`production/current-stock/page.tsx`)
**Mock data:** `mockCurrentStock` from `@/lib/mock-data/production`
**API module to create:** `src/lib/api/current-stock.ts`
**Endpoints:**
- `GET /api/current-stock` - Get all products' current stock
- `GET /api/current-stock/{productId}` - Get specific product stock

**Integration tasks:**
- ✅ Remove `mockCurrentStock` import
- ✅ Create `currentStockApi` module
- ✅ Read-only view (no CRUD operations)
- ✅ Display computed stock data
- ✅ Add refresh functionality

---

### 6. Production Plan (`production/production-plan/page.tsx`)
**Mock data:** `mockProductionPlans` from `@/lib/mock-data/production`
**API module to create:** `src/lib/api/production-plans.ts`
**Endpoints:**
- `GET /api/production-plans` - List
- `GET /api/production-plans/{id}` - Detail
- `POST /api/production-plans` - Create (Draft)
- `PUT /api/production-plans/{id}` - Update
- `DELETE /api/production-plans/{id}` - Soft delete
- `POST /api/production-plans/{id}/approve` - Approve
- `POST /api/production-plans/{id}/start` - Start (Approved → InProgress)
- `POST /api/production-plans/{id}/complete` - Complete (InProgress → Completed)

**Integration tasks:**
- ✅ Remove `mockProductionPlans` import
- ✅ Create `productionPlansApi` module
- ✅ Wire extended workflow (Draft → Approved → InProgress → Completed)
- ✅ Add status transition buttons

---

## Common Integration Patterns

### 1. Data Fetching Pattern
```typescript
useEffect(() => {
  fetchData();
}, [currentPage, pageSize]);

const fetchData = async () => {
  try {
    setIsLoading(true);
    const response = await api.getAll(page, pageSize, filters);
    setData(response.data);
    setTotalPages(response.totalPages);
  } catch (error) {
    toast.error('Failed to load data');
  } finally {
    setIsLoading(false);
  }
};
```

### 2. Create/Update Pattern
```typescript
const handleCreate = async () => {
  try {
    setIsSubmitting(true);
    await api.create(formData);
    toast.success('Created successfully');
    fetchData();
    setShowModal(false);
  } catch (error) {
    toast.error('Failed to create');
  } finally {
    setIsSubmitting(false);
  }
};
```

### 3. Workflow Pattern
```typescript
const handleApprove = async (id: string) => {
  try {
    await api.approve(id);
    toast.success('Approved successfully');
    fetchData();
  } catch (error) {
    toast.error('Failed to approve');
  }
};

const handleReject = async (id: string) => {
  try {
    await api.reject(id);
    toast.success('Rejected successfully');
    fetchData();
  } catch (error) {
    toast.error('Failed to reject');
  }
};
```

---

## API Module Template

```typescript
// src/lib/api/{entity}.ts
import api from './client';

export interface {Entity} {
  id: string;
  {entityNo}: string;
  {entityDate}: string;
  productId: string;
  product: {
    id: string;
    code: string;
    name: string;
  };
  status: string;
  // ... other fields
}

export interface Create{Entity}Dto {
  {entityDate}: string;
  productId: string;
  // ... other fields
}

export interface Update{Entity}Dto {
  {entityDate}: string;
  productId: string;
  // ... other fields
}

const BASE_URL = '/api/{entity}';

export const {entity}Api = {
  getAll: async (page = 1, pageSize = 10, filters?: any) => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      ...filters
    });
    const response = await api.get(`${BASE_URL}?${params}`);
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  create: async (data: Create{Entity}Dto) => {
    const response = await api.post(BASE_URL, data);
    return response.data;
  },

  update: async (id: string, data: Update{Entity}Dto) => {
    const response = await api.put(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response.data;
  },

  approve: async (id: string) => {
    const response = await api.post(`${BASE_URL}/${id}/approve`);
    return response.data;
  },

  reject: async (id: string) => {
    const response = await api.post(`${BASE_URL}/${id}/reject`);
    return response.data;
  },
};
```

---

## Special Cases

### Stock Adjustment
```typescript
// Additional endpoint for submit
submit: async (id: string) => {
  const response = await api.post(`${BASE_URL}/${id}/submit`);
  return response.data;
};
```

### Stock Adjustment Approval
```typescript
// Uses existing approvals API
import { approvalsApi } from './approvals';

// Filter by type
const response = await approvalsApi.getPending({
  type: 'stock-adjustment',
  page,
  pageSize
});
```

### Current Stock
```typescript
// Read-only API
export const currentStockApi = {
  getAll: async () => {
    const response = await api.get('/api/current-stock');
    return response.data;
  },

  getByProduct: async (productId: string) => {
    const response = await api.get(`/api/current-stock/${productId}`);
    return response.data;
  },
};
```

### Production Plan
```typescript
// Extended workflow
start: async (id: string) => {
  const response = await api.post(`${BASE_URL}/${id}/start`);
  return response.data;
},

complete: async (id: string) => {
  const response = await api.post(`${BASE_URL}/${id}/complete`);
  return response.data;
},
```

---

## Verification Checklist

For each page:
- [ ] Mock data imports removed
- [ ] API module created with correct types
- [ ] useEffect data fetching implemented
- [ ] Loading state shows while fetching
- [ ] Error handling with toast notifications
- [ ] Create operation wired
- [ ] Update operation wired (where applicable)
- [ ] Delete operation wired (where applicable)
- [ ] Workflow operations wired (submit, approve, reject, etc.)
- [ ] Status badges display correctly
- [ ] Pagination works with backend
- [ ] Filters work with backend
- [ ] Form validation matches backend rules
- [ ] Success messages show on operations
- [ ] Error messages show on failures

---

## Expected Deliverables

1. **5 API modules** in `src/lib/api/`:
   - `daily-productions.ts`
   - `production-cancels.ts`
   - `stock-adjustments.ts`
   - `production-plans.ts`
   - `current-stock.ts`

2. **6 updated pages** in `src/app/(dashboard)/production/`:
   - All with mock data removed
   - All with real API integration
   - All with loading/error states
   - All with toast notifications

3. **Zero mock data remaining** in production pages

4. **Completion document:** `PHASE_7_FRONTEND_COMPLETE.md`

---

## Notes

- All production entities use `Guid` IDs (string in frontend)
- Status values match backend enums exactly
- Date fields use ISO 8601 format
- Decimal fields (quantities) use proper number formatting
- All API calls go through the centralized `client.ts` with auth interceptor
- Toast notifications use `react-hot-toast` or `sonner` (consistent with existing pages)
- Current Stock is read-only (no CRUD operations)
- Stock Adjustment Approval uses existing `approvalsApi` with type filter

---

**Created:** April 29, 2026  
**Phase:** 7 - Production & Stock  
**Status:** Ready for Implementation (after backend completes)
