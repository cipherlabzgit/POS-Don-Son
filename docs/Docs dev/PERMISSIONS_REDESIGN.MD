# Permissions Section Redesign

## Overview

The permissions section in the Role Management system has been completely redesigned to provide better organization, easier navigation, and improved usability when managing role permissions.

## What Changed

### Before
- Simple flat checkbox list of all permissions
- Difficult to find specific permissions
- No grouping or organization
- Limited to 2-column grid with basic scrolling
- Hard to understand permission relationships

### After
- **Module-based grouping** - Permissions organized by module (e.g., Account, Activity, Ingredients, Orders, etc.)
- **Collapsible sections** - Each module can be expanded/collapsed for better focus
- **Advanced filtering** - Filter by module or search across all permissions
- **Bulk actions** - Select/deselect all permissions in a module
- **Visual hierarchy** - Clear separation between operations (Create, Update, Delete, View)
- **Better descriptions** - Operations and entities clearly displayed
- **Smart display** - Shows selected count per module and overall

## Key Features

### 1. Module Filtering
```typescript
- Dropdown to filter by specific module
- Shows total permissions count per module
- "All modules" option to see everything
```

### 2. Search Functionality
```typescript
- Search across permission name, description, and code
- Real-time filtering
- Works with module filter
```

### 3. Collapsible Module Sections
```typescript
- Each module is a collapsible card
- Shows selected/total count per module (e.g., "3/8")
- Expand/Collapse buttons for individual modules
- "Expand all" / "Collapse all" for bulk operations
```

### 4. Bulk Selection
```typescript
- "Select All" checkbox at the top (selects all permissions)
- "Select All" per module (selects all in that module)
- "Clear selected" button to deselect everything
- Indeterminate state for partially selected modules
```

### 5. Better Permission Display
```typescript
- Each permission shows:
  - Operation name (Create, Update, Delete, View, etc.)
  - Entity/resource name (what the operation applies to)
  - Organized in a 2-column grid within each module
```

## Component Structure

### PermissionsSelector Component
**Location:** `DMS-Frontend/src/components/roles/PermissionsSelector.tsx`

**Props:**
```typescript
interface PermissionsSelectorProps {
  permissions: Permission[];      // All available permissions
  selectedIds: string[];           // Currently selected permission IDs
  onChange: (selectedIds: string[]) => void; // Callback when selection changes
}
```

**Features:**
- Automatic grouping by module
- Sorting by displayOrder within modules
- Smart operation and entity extraction from permission names
- Responsive design (2-column grid on desktop, single column on mobile)

### Updated Permission Interface
**Location:** `DMS-Frontend/src/lib/api/permissions.ts`

```typescript
export interface Permission {
  id: string;
  code: string;
  name: string;           // NEW: Display name
  module: string;         // Used for grouping
  description: string;
  displayOrder: number;   // NEW: For custom sorting
  isActive: boolean;
}
```

## Usage in Role Pages

### Edit Role Page
**Location:** `DMS-Frontend/src/app/(dashboard)/administrator/roles/edit/[id]/page.tsx`

- Permissions section moved to separate Card
- Uses new PermissionsSelector component
- Maintains existing save functionality

### Add Role Page
**Location:** `DMS-Frontend/src/app/(dashboard)/administrator/roles/add/page.tsx`

- Same layout as Edit Role for consistency
- Permissions section in separate Card
- Uses PermissionsSelector component

## Backend Integration

### Permission Entity
**Location:** `DMS-Backend/Models/Entities/Permission.cs`

```csharp
public sealed class Permission
{
    public Guid Id { get; set; }
    public string Name { get; set; }        // Display name
    public string Code { get; set; }        // Unique code
    public string Module { get; set; }      // For grouping
    public string? Description { get; set; }
    public int? DisplayOrder { get; set; }  // Custom sorting
    // ... other fields
}
```

### Permission DTO
**Location:** `DMS-Backend/Models/DTOs/Permissions/PermissionDto.cs`

```csharp
public sealed class PermissionDto
{
    public Guid Id { get; set; }
    public string Code { get; set; }
    public string Name { get; set; }
    public string Module { get; set; }
    public string Description { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
}
```

### API Endpoints
- `GET /api/permissions` - Returns all permissions with Name and DisplayOrder
- `GET /api/permissions/grouped` - Returns permissions grouped by module

## UI/UX Improvements

### Visual Design
1. **Module Headers**
   - Gray background with subtle border
   - Collapse/expand icons
   - Badge showing selected count
   - "Collapse" link and "Select All" checkbox

2. **Permission Items**
   - 2-column responsive grid
   - Checkbox with operation name (bold)
   - Entity name or description (muted)
   - Hover effect for better interaction

3. **Filter Controls**
   - Module dropdown with counts
   - Search input with icon
   - Action buttons with appropriate colors

4. **Action Buttons**
   - "Expand all" / "Collapse all" - Background color
   - "Clear selected" - Red/danger color
   - "Select All" - Checkbox with label

### Accessibility
- All interactive elements are keyboard accessible
- Proper label associations
- Clear focus states
- Semantic HTML structure
- ARIA attributes where needed

### Responsive Design
- **Module Grid:** 2 modules per row on large screens (lg breakpoint), 1 on mobile
- **Permission Grid:** 2-column grid within each module (md breakpoint)
- Single column on mobile for both
- Touch-friendly tap targets
- Scrollable content area (max-height: 600px)

## Permission Naming Convention

For best results with the automatic operation/entity extraction, follow this naming convention:

```
[Operation] [Entity]

Examples:
- Create Ingredients
- Update Orders
- Delete Products
- View Reports
- Manage Users
```

**Supported Operations:**
- Create
- Update
- Delete
- View
- Read
- Manage
- Execute
- Approve
- Cancel

## Testing Checklist

- [ ] Module filtering works correctly
- [ ] Search filters permissions in real-time
- [ ] Select All selects all permissions
- [ ] Module Select All selects only that module's permissions
- [ ] Clear selected removes all selections
- [ ] Expand all/Collapse all works
- [ ] Individual module expand/collapse works
- [ ] Indeterminate state shows for partially selected modules
- [ ] Permission selection/deselection works
- [ ] Save Changes persists selected permissions
- [ ] Backend receives correct permission IDs
- [ ] Role loads with existing permissions selected
- [ ] Responsive design works on mobile
- [ ] Keyboard navigation works

## Future Enhancements

Potential improvements for future iterations:

1. **Permission Templates**
   - Pre-defined permission sets (e.g., "Read-only", "Full access")
   - Quick application of common permission patterns

2. **Permission Dependencies**
   - Auto-select dependent permissions
   - Warn when deselecting required permissions

3. **Visual Permission Matrix**
   - Table view showing modules vs operations
   - Click cells to toggle permissions

4. **Permission History**
   - Track who added/removed permissions
   - Audit log for permission changes

5. **Smart Suggestions**
   - Suggest commonly used permissions for role type
   - ML-based recommendations

6. **Export/Import**
   - Export role permissions as JSON
   - Import from templates or other roles

## Migration Notes

### For Developers
- The Permission interface now includes `name` and `displayOrder` fields
- Backend already supports these fields
- No database migration needed (DisplayOrder is nullable)
- Old checkbox implementation has been completely replaced

### For Users
- All existing role permissions are preserved
- New interface provides better organization
- Same functionality with improved usability
- No action needed from users

## Support

For questions or issues related to the permissions redesign:
1. Check this documentation
2. Review the component code and comments
3. Test in development environment first
4. Report bugs through the standard process

---

**Last Updated:** April 29, 2026  
**Version:** 1.0  
**Author:** DMS Development Team
