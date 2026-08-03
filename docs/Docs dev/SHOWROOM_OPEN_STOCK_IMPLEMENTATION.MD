# Showroom Open Stock - Implementation Summary

**Implementation Date:** April 29, 2026
**Status:** ✅ Complete and Integrated

---

## Overview

The Showroom Open Stock feature allows administrators to view and manage the "Last Stock BF (Brought Forward) Date" for each showroom. This date is critical for calculating opening balances for future stock operations.

### Business Logic

- Each showroom has a "Stock as at" date (Last Stock BF Date)
- Admin users can edit this date to affect future opening balance calculations
- Example scenario:
  - Last Stock BF Date = 01/01/2026
  - Showroom closed on 02/01/2026 & 03/01/2026
  - Admin can edit the Stock BF submitted on 01/01/2026 to affect 04/01/2026 Opening Balance

---

## Backend Implementation

### 1. Database Entity

**File:** `DMS-Backend/Models/Entities/ShowroomOpenStock.cs`

```csharp
[Table("showroom_open_stock")]
public class ShowroomOpenStock : BaseEntity
{
    [Required]
    [Column("outlet_id")]
    public Guid OutletId { get; set; }

    [Required]
    [Column("stock_as_at")]
    public DateTime StockAsAt { get; set; }

    public Outlet Outlet { get; set; } = null!;
}
```

**Database Table:** `showroom_open_stock`
- Primary Key: `id` (inherited from BaseEntity)
- Foreign Key: `outlet_id` → `outlets.id`
- Columns: `stock_as_at`, `is_active`, `created_at`, `updated_at`, `created_by_id`, `updated_by_id`

### 2. DTOs (Data Transfer Objects)

**List DTO** (`ShowroomOpenStockListDto.cs`):
```csharp
public sealed class ShowroomOpenStockListDto
{
    public Guid Id { get; set; }
    public Guid OutletId { get; set; }
    public string OutletCode { get; set; } = string.Empty;
    public string OutletName { get; set; } = string.Empty;
    public DateTime StockAsAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

**Detail DTO** (`ShowroomOpenStockDetailDto.cs`):
```csharp
public sealed class ShowroomOpenStockDetailDto
{
    public Guid Id { get; set; }
    public Guid OutletId { get; set; }
    public string OutletCode { get; set; } = string.Empty;
    public string OutletName { get; set; } = string.Empty;
    public DateTime StockAsAt { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Guid? CreatedById { get; set; }
    public Guid? UpdatedById { get; set; }
}
```

**Create DTO** (`CreateShowroomOpenStockDto.cs`):
```csharp
public sealed class CreateShowroomOpenStockDto
{
    public required Guid OutletId { get; set; }
    public required DateTime StockAsAt { get; set; }
}
```

**Update DTO** (`UpdateShowroomOpenStockDto.cs`):
```csharp
public sealed class UpdateShowroomOpenStockDto
{
    public required DateTime StockAsAt { get; set; }
}
```

### 3. AutoMapper Profile

**File:** `DMS-Backend/Mapping/ShowroomOpenStockProfile.cs`

Maps entity to DTOs with proper outlet code and name extraction:
```csharp
CreateMap<ShowroomOpenStock, ShowroomOpenStockListDto>()
    .ForMember(dest => dest.OutletCode, opt => opt.MapFrom(src => src.Outlet!.Code))
    .ForMember(dest => dest.OutletName, opt => opt.MapFrom(src => src.Outlet!.Name));
```

### 4. Service Layer

**Interface:** `IShowroomOpenStockService`
**Implementation:** `ShowroomOpenStockService`

**Methods:**
- `GetAllAsync()` - Get all showroom open stocks
- `GetByIdAsync(Guid id)` - Get by ID
- `GetByOutletIdAsync(Guid outletId)` - Get by outlet ID
- `CreateAsync(CreateShowroomOpenStockDto dto, Guid userId)` - Create new record
- `UpdateAsync(Guid id, UpdateShowroomOpenStockDto dto, Guid userId)` - Update stock date
- `DeleteAsync(Guid id)` - Soft delete (sets IsActive = false)

### 5. API Controller

**File:** `DMS-Backend/Controllers/ShowroomOpenStocksController.cs`
**Base Route:** `/api/showroom-open-stocks`

**Endpoints:**
| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/api/showroom-open-stocks` | `operation:showroom-open-stock:view` | Get all records |
| GET | `/api/showroom-open-stocks/{id}` | `operation:showroom-open-stock:view` | Get by ID |
| GET | `/api/showroom-open-stocks/by-outlet/{outletId}` | `operation:showroom-open-stock:view` | Get by outlet ID |
| POST | `/api/showroom-open-stocks` | `operation:showroom-open-stock:create` | Create new record |
| PUT | `/api/showroom-open-stocks/{id}` | `operation:showroom-open-stock:update` | Update stock date |
| DELETE | `/api/showroom-open-stocks/{id}` | `operation:showroom-open-stock:delete` | Delete record |

**Security:**
- All endpoints require authentication (`[Authorize]`)
- Permission-based authorization via `[HasPermission]`
- Audit logging enabled via `[Audit]` attribute on mutating operations

### 6. Data Seeding

**File:** `DMS-Backend/Data/Seeders/DevDataSeeder.cs`

Added `SeedShowroomOpenStockAsync()` method that:
- Creates showroom open stock records for all active outlets
- Sets default stock date to `2026-01-10`
- Only runs if no records exist (idempotent)
- Logs the number of records created

### 7. Service Registration

**File:** `DMS-Backend/Program.cs` (Line 153)
```csharp
builder.Services.AddScoped<IShowroomOpenStockService, ShowroomOpenStockService>();
```

---

## Frontend Implementation

### 1. API Module

**File:** `DMS-Frontend/src/lib/api/showroom-open-stock.ts`

**TypeScript Interface:**
```typescript
export interface ShowroomOpenStock {
  id: string;
  outletId: string;
  outletCode: string;
  outletName: string;
  stockAsAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdById?: string;
  updatedById?: string;
}
```

**API Methods:**
```typescript
showroomOpenStockApi.getAll()
showroomOpenStockApi.getById(id)
showroomOpenStockApi.getByOutletId(outletId)
showroomOpenStockApi.create(data)
showroomOpenStockApi.update(id, data)
showroomOpenStockApi.delete(id)
```

### 2. Page Component

**File:** `DMS-Frontend/src/app/(dashboard)/operation/showroom-open-stock/page.tsx`

**Features:**
✅ Lists all showrooms with their Stock BF dates
✅ Search functionality by showroom code or name
✅ View modal to display showroom details
✅ Edit modal for admin users to update stock date
✅ Permission-based access (admin can edit, others view-only)
✅ Loading states with spinner
✅ Error handling with toast notifications
✅ Real-time data fetching from API
✅ No hardcoded/mock data

**UI Components:**
- **Table Display:**
  - Showroom Code (monospace font)
  - Showroom Name
  - Last Stock BF Date (with calendar icon)
  - Action buttons (View, Edit Date)

- **Modals:**
  - View Modal: Displays showroom details (read-only)
  - Edit Date Modal: Date picker for admin to update stock date

- **User Experience:**
  - Search bar for filtering showrooms
  - Responsive table layout
  - Hover effects on rows
  - Loading indicator while fetching data
  - Success/error toast messages
  - Empty state when no showrooms found

### 3. Authentication & Authorization

**Admin Detection:**
```typescript
const user = useAuthStore((s) => s.user);
const isAdmin = isAdminUser(user);
```

Only admin users see the "Edit Date" button.

### 4. Data Flow

```
1. Page Load → useEffect() triggered
2. fetchShowrooms() → API call to backend
3. Backend → Database query with Outlet join
4. Response → showroomOpenStockApi.getAll()
5. State Update → setShowrooms(response)
6. UI Render → Display data in table
```

---

## Integration Points

### 1. Database
- Table: `showroom_open_stock`
- Migration: `Phase6_Operations.cs` (applied)
- Indexes: On `outlet_id`, `created_by_id`, `updated_by_id`

### 2. API Client
- Base URL: `http://localhost:5000/api/showroom-open-stocks`
- Authentication: JWT Bearer token (from auth store)
- Response format: Standard ApiResponse wrapper

### 3. Navigation
- Menu: Operations → Showroom Open Stock
- Route: `/operation/showroom-open-stock`

---

## Testing Checklist

### Backend Tests
- [ ] GET /api/showroom-open-stocks returns list with outlet details
- [ ] GET /api/showroom-open-stocks/{id} returns single record
- [ ] GET /api/showroom-open-stocks/by-outlet/{outletId} returns outlet's record
- [ ] POST creates new record (admin only)
- [ ] PUT updates stock date (admin only)
- [ ] DELETE soft-deletes record (admin only)
- [ ] Unauthorized access returns 401
- [ ] Missing permissions return 403

### Frontend Tests
- [ ] Page loads without errors
- [ ] Data fetched from backend on mount
- [ ] Table displays all showrooms
- [ ] Search filters by code and name
- [ ] View modal shows correct details
- [ ] Edit button visible only for admin
- [ ] Edit modal updates date successfully
- [ ] Toast notifications appear on success/error
- [ ] Loading state shows while fetching
- [ ] No hardcoded data in page

---

## Files Modified/Created

### Backend
✅ `DMS-Backend/Models/Entities/ShowroomOpenStock.cs`
✅ `DMS-Backend/Models/DTOs/ShowroomOpenStock/ShowroomOpenStockListDto.cs` (Updated)
✅ `DMS-Backend/Models/DTOs/ShowroomOpenStock/ShowroomOpenStockDetailDto.cs` (Updated)
✅ `DMS-Backend/Models/DTOs/ShowroomOpenStock/CreateShowroomOpenStockDto.cs`
✅ `DMS-Backend/Models/DTOs/ShowroomOpenStock/UpdateShowroomOpenStockDto.cs`
✅ `DMS-Backend/Mapping/ShowroomOpenStockProfile.cs` (Updated)
✅ `DMS-Backend/Services/Interfaces/IShowroomOpenStockService.cs`
✅ `DMS-Backend/Services/Implementations/ShowroomOpenStockService.cs`
✅ `DMS-Backend/Controllers/ShowroomOpenStocksController.cs`
✅ `DMS-Backend/Data/Seeders/DevDataSeeder.cs` (Updated)
✅ `DMS-Backend/Migrations/20260427112803_Phase6_Operations.cs`

### Frontend
✅ `DMS-Frontend/src/lib/api/showroom-open-stock.ts` (Updated)
✅ `DMS-Frontend/src/app/(dashboard)/operation/showroom-open-stock/page.tsx` (Updated)

---

## Permissions Required

**Permission Codes:**
- `operation:showroom-open-stock:view` - View showroom open stock
- `operation:showroom-open-stock:create` - Create new records
- `operation:showroom-open-stock:update` - Edit stock dates
- `operation:showroom-open-stock:delete` - Delete records

**Assigned to:** Super Admin role by default

---

## Database Query Example

**Get all showroom open stocks:**
```sql
SELECT 
    sos.id,
    sos.outlet_id,
    o.code AS outlet_code,
    o.name AS outlet_name,
    sos.stock_as_at,
    sos.updated_at
FROM showroom_open_stock sos
INNER JOIN outlets o ON sos.outlet_id = o.id
WHERE sos.is_active = true
ORDER BY o.code;
```

---

## Known Limitations

1. **Single Record Per Outlet:** Each outlet can only have one active showroom open stock record
2. **Admin Only Edit:** Only admin users can modify stock dates
3. **No History:** Previous stock dates are not tracked (consider audit logs for history)

---

## Future Enhancements

- [ ] Add stock date history tracking
- [ ] Add validation to prevent future dates
- [ ] Add bulk update functionality for multiple showrooms
- [ ] Add date range reports showing stock date changes
- [ ] Add notifications when stock dates are updated
- [ ] Export functionality for showroom stock dates

---

## Deployment Notes

1. **Database Migration:** Already applied in Phase 6 migration
2. **Seed Data:** Runs automatically on startup if dev seed is enabled
3. **Permissions:** Ensure admin users have the required permissions
4. **Testing:** Test with actual outlet data before production use

---

## Support Information

**Feature Owner:** Operations Team
**Technical Contact:** Development Team
**Documentation:** This file
**Related Features:** Stock BF, Delivery Planning, Reconciliation

---

**End of Implementation Summary**
