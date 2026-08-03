# Phase 6 - Frontend Integration Plan

## Overview
Integrate 9 operation pages with the Phase 6 backend APIs, removing all mock data.

---

## Pages to Integrate (9 total)

### 1. Delivery (`operation/delivery/page.tsx`)
**Mock data:** `mockDeliveries` from `@/lib/mock-data/operations`
**API module to create:** `src/lib/api/deliveries.ts`
**Endpoints:**
- `GET /api/deliveries` - List with pagination, filter
- `GET /api/deliveries/{id}` - Get detail
- `POST /api/deliveries` - Create
- `PUT /api/deliveries/{id}` - Update
- `DELETE /api/deliveries/{id}` - Soft delete
- `POST /api/deliveries/{id}/submit` - Submit for approval
- `POST /api/deliveries/{id}/approve` - Approve
- `POST /api/deliveries/{id}/reject` - Reject

**Integration tasks:**
- ✅ Remove `mockDeliveries` import
- ✅ Create `deliveriesApi` module
- ✅ Implement `useEffect` for data fetching
- ✅ Add loading/error states
- ✅ Wire CRUD operations
- ✅ Wire workflow actions (submit, approve, reject)
- ✅ Add toast notifications

---

### 2. Disposal (`operation/disposal/page.tsx`)
**Mock data:** `mockDisposals` from `@/lib/mock-data/operations`
**API module to create:** `src/lib/api/disposals.ts`
**Endpoints:** Same pattern as Delivery
**Integration tasks:** Same pattern as Delivery

---

### 3. Transfer (`operation/transfer/page.tsx`)
**Mock data:** `mockTransfers` from `@/lib/mock-data/operations`
**API module to create:** `src/lib/api/transfers.ts`
**Endpoints:** Same pattern as Delivery + `POST /{id}/complete` for Completed status
**Integration tasks:** Same pattern as Delivery

---

### 4. Cancellation (`operation/cancellation/page.tsx`)
**Mock data:** `mockCancellations` (inline in page)
**API module to create:** `src/lib/api/cancellations.ts`
**Endpoints:**
- `GET /api/cancellations` - List
- `GET /api/cancellations/{id}` - Detail
- `POST /api/cancellations` - Create (starts in Pending)
- `POST /api/cancellations/{id}/approve` - Approve
- `POST /api/cancellations/{id}/reject` - Reject

**Integration tasks:**
- ✅ Remove `mockCancellations` inline data
- ✅ Create `cancellationsApi` module
- ✅ No Draft status - starts as Pending
- ✅ Wire approve/reject workflow

---

### 5. Delivery Return (`operation/delivery-return/page.tsx`)
**Mock data:** `mockDeliveryReturns` (inline in page)
**API module to create:** `src/lib/api/delivery-returns.ts`
**Endpoints:** Same pattern as Delivery + `POST /{id}/process` for Processed status
**Integration tasks:** Same pattern as Delivery

---

### 6. Stock BF (`operation/stock-bf/page.tsx`)
**Mock data:** `mockStockBF` (inline in page)
**API module to create:** `src/lib/api/stock-bf.ts`
**Endpoints:**
- `GET /api/stock-bf` - List with filter
- `GET /api/stock-bf/{id}` - Detail
- `POST /api/stock-bf` - Create
- `PUT /api/stock-bf/{id}` - Update
- `DELETE /api/stock-bf/{id}` - Soft delete
- `POST /api/stock-bf/{id}/adjust` - Mark as Adjusted

**Integration tasks:**
- ✅ Remove `mockStockBF` inline data
- ✅ Create `stockBfApi` module
- ✅ Wire adjust workflow

---

### 7. Showroom Open Stock (`operation/showroom-open-stock/page.tsx`)
**Mock data:** `mockShowroomOpenStock` (inline in page)
**API module to create:** `src/lib/api/showroom-open-stock.ts`
**Endpoints:**
- `GET /api/showroom-open-stock` - List all
- `PUT /api/showroom-open-stock/{id}` - Update stock as at date (admin only)

**Integration tasks:**
- ✅ Remove `mockShowroomOpenStock` inline data
- ✅ Create `showroomOpenStockApi` module
- ✅ Admin-only edit enforcement

---

### 8. Label Printing (`operation/label-printing/page.tsx`)
**Mock data:** `mockLabelPrintRequests` (inline in page)
**API module to create:** `src/lib/api/label-printing.ts`
**Endpoints:**
- `GET /api/label-printing` - List requests
- `POST /api/label-printing` - Create request
- `POST /api/label-printing/{id}/approve` - Approve
- `POST /api/label-printing/{id}/reject` - Reject
- `GET /api/labels/print` - Generate print-ready data

**Integration tasks:**
- ✅ Remove `mockLabelPrintRequests` inline data
- ✅ Create `labelPrintingApi` module
- ✅ Respect product `enableLabelPrint` flag
- ✅ Implement yellow background for `allowFutureLabelPrint` products
- ✅ Wire print generation endpoint

---

### 9. Showroom Label Printing (`operation/showroom-label-printing/page.tsx`)
**Mock data:** Uses `mockShowrooms` only (no operation mock)
**API module to create:** `src/lib/api/showroom-labels.ts`
**Endpoints:**
- `POST /api/labels/showroom` - Generate showroom label print data

**Integration tasks:**
- ✅ Create `showroomLabelsApi` module
- ✅ Wire print generation endpoint
- ✅ Keep showroom dropdown (already uses real data)

---

## Common Integration Patterns

### 1. Data Fetching Pattern
```typescript
useEffect(() => {
  fetchData();
}, []);

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
const handleSubmit = async (id: string) => {
  try {
    await api.submit(id);
    toast.success('Submitted for approval');
    fetchData();
  } catch (error) {
    toast.error('Failed to submit');
  }
};

const handleApprove = async (id: string) => {
  try {
    await api.approve(id);
    toast.success('Approved successfully');
    fetchData();
  } catch (error) {
    toast.error('Failed to approve');
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
  outletId: string;
  outlet: {
    id: string;
    code: string;
    name: string;
  };
  status: string;
  // ... other fields
}

export interface Create{Entity}Dto {
  {entityDate}: string;
  outletId: string;
  notes?: string;
  items: Create{Entity}ItemDto[];
}

export interface Update{Entity}Dto {
  {entityDate}: string;
  outletId: string;
  notes?: string;
  items: Update{Entity}ItemDto[];
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

  submit: async (id: string) => {
    const response = await api.post(`${BASE_URL}/${id}/submit`);
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

1. **9 API modules** in `src/lib/api/`:
   - `deliveries.ts`
   - `disposals.ts`
   - `transfers.ts`
   - `cancellations.ts`
   - `delivery-returns.ts`
   - `stock-bf.ts`
   - `showroom-open-stock.ts`
   - `label-printing.ts`
   - `showroom-labels.ts`

2. **9 updated pages** in `src/app/(dashboard)/operation/`:
   - All with mock data removed
   - All with real API integration
   - All with loading/error states
   - All with toast notifications

3. **Zero mock data remaining** in operation pages

4. **Completion document:** `PHASE_6_FRONTEND_COMPLETE.md`

---

## Notes

- All operation entities use `Guid` IDs (string in frontend)
- Status values match backend enums exactly
- Date fields use ISO 8601 format
- Decimal fields (quantities, prices) use proper number formatting
- All API calls go through the centralized `client.ts` with auth interceptor
- Toast notifications use either `react-hot-toast` or `sonner` (consistent with existing pages)
