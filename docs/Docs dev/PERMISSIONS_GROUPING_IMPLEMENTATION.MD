# Permissions Grouping Implementation

## Overview
Reorganized the permissions display in the "Add New Role" and "Edit Role" forms to group permissions by sections with clear CRUD subsections for better readability and easier selection.

## Changes Made

### 1. Grouped Permission Display
**File:** `DMS-Frontend/src/app/(dashboard)/administrator/security/page.tsx`

**Before:**
- Flat list of all permissions
- Hard to identify related permissions
- No visual grouping
- Difficult to select multiple related permissions

**After:**
- Permissions grouped by section (e.g., Inventory, Operation, Production)
- Each section is collapsible
- CRUD operations clearly labeled within each section
- Section-level "Select All" and "Clear All" buttons

### 2. Key Features

#### Section Grouping
Permissions are automatically grouped by their prefix:
- `inventory.products.view` → **Products** section → **View** operation
- `operation.delivery.create` → **Delivery** section → **Create** operation
- `administrator.users.update` → **Users** section → **Update** operation

#### Section Organization
Main sections include:
- **Administrator**: System administration permissions
  - Approvals, Cashier Balance, Day-End Process, etc.
- **Inventory**: Inventory management
  - Products, Category, Ingredient, Unit of Measure
- **Operation**: Daily operations
  - Delivery, Disposal, Transfer, Stock BF, etc.
- **Production**: Production management
  - Daily Production, Stock Adjustment, Production Plan
- **DMS**: Distribution Management System
  - Order Entry, Delivery Plan, Production Planner, etc.
- **Reports**: Reporting features
- **Showroom**: Showroom management

#### CRUD Operations Display
Each permission is displayed with:
- **Operation Name**: View, Create, Update, Delete, Approve, Export, Print
- **Description**: Detailed description of the permission
- **Checkbox**: For easy selection

#### Section Controls
Each section has:
- **Expand/Collapse Toggle**: Click section header to show/hide permissions
- **Selection Counter Badge**: Shows "X/Y" (selected/total) permissions
- **"All" Button**: Select all permissions in the section
- **"None" Button**: Deselect all permissions in the section

### 3. Visual Improvements

#### Hierarchical Structure
```
┌─────────────────────────────────────────────────────┐
│ Permissions [12 selected] ▼                         │
├─────────────────────────────────────────────────────┤
│ [Select All]  [Clear All]                           │
├─────────────────────────────────────────────────────┤
│ ▼ Inventory - Products [2/4]    [All] [None]       │
│   ☑ View - View products list                      │
│   ☑ Create - Create new products                    │
│   ☐ Update - Update products                        │
│   ☐ Delete - Delete products                        │
├─────────────────────────────────────────────────────┤
│ ▶ Operation - Delivery [0/4]    [All] [None]       │
├─────────────────────────────────────────────────────┤
│ ▼ Production - Daily Production [3/4] [All] [None] │
│   ☑ View - View daily production                    │
│   ☑ Create - Create daily production                │
│   ☑ Update - Update daily production                │
│   ☐ Delete - Delete daily production                │
└─────────────────────────────────────────────────────┘
```

#### Color Coding
- Section headers: Muted background
- "All" button: Green background (#10B981)
- "None" button: Red background (#DC2626)
- Selection badge: Blue info badge
- Hover states: Subtle background change

### 4. User Experience Improvements

#### Auto-Expand on First Open
- When opening the permissions panel for the first time, all sections are expanded
- User can see all available permissions immediately
- Can collapse sections they don't need

#### Smart Section Names
Permissions are displayed with human-readable names:
- `inventory.products` → "Products"
- `administrator.users` → "Users"
- `operation.delivery` → "Delivery"
- `dms.production-planner` → "Production Planner"

#### Quick Selection
- **Global "Select All"**: Select all permissions across all sections
- **Global "Clear All"**: Deselect all permissions
- **Section "All"**: Select all permissions in one section
- **Section "None"**: Deselect all permissions in one section
- **Individual Checkboxes**: Fine-grained control

### 5. Implementation Details

#### Helper Functions

**groupPermissionsBySection()**
- Groups permissions by section prefix
- Returns object with section as key, permissions array as value

**getSectionName(section)**
- Converts section code to human-readable name
- Handles special cases and formatting

**getOperationName(operation)**
- Converts operation code to human-readable name
- Maps common CRUD operations (view, create, update, delete)

**toggleSection(section)**
- Expands/collapses a section
- Updates expandedSections state array

**selectAllInSection(section, permissions)**
- Selects all permissions in a specific section
- Adds to existing selections without removing others

**deselectAllInSection(section, permissions)**
- Deselects all permissions in a specific section
- Keeps selections from other sections intact

#### State Management
```typescript
const [showPermissions, setShowPermissions] = useState(false);
const [expandedSections, setExpandedSections] = useState<string[]>([]);
```

- `showPermissions`: Controls visibility of entire permissions panel
- `expandedSections`: Tracks which sections are expanded

## Benefits

✅ **Better Organization**: Permissions grouped logically by feature area  
✅ **Easier to Navigate**: Collapsible sections reduce visual clutter  
✅ **Clear Labeling**: CRUD operations clearly named (View, Create, Update, Delete)  
✅ **Quick Selection**: Section-level controls for bulk selection  
✅ **Visual Feedback**: Badges show selection count per section  
✅ **Improved UX**: Auto-expand on first open, hover states  
✅ **Scalability**: Works well even with hundreds of permissions  
✅ **Maintainability**: Easy to add new sections and permissions  

## Permission Code Structure

Permissions follow this naming convention:
```
{module}.{feature}.{operation}
```

Examples:
- `inventory.products.view`
- `operation.delivery.create`
- `administrator.users.update`
- `dms.production-planner.view`

The system automatically:
1. Extracts the module and feature (`inventory.products`)
2. Groups all operations under that section
3. Displays the operation name (`view` → "View")

## Testing Checklist

### Visual Testing
- [ ] Permissions panel opens and closes correctly
- [ ] All sections display with correct names
- [ ] CRUD operations labeled correctly
- [ ] Badges show accurate counts
- [ ] Colors and styling correct

### Functionality Testing
- [ ] Global "Select All" selects everything
- [ ] Global "Clear All" deselects everything
- [ ] Section "All" selects only that section
- [ ] Section "None" deselects only that section
- [ ] Individual checkboxes work correctly
- [ ] Section expand/collapse works
- [ ] Auto-expand on first open works
- [ ] Selection persists when collapsing/expanding

### Edge Cases
- [ ] Works with no permissions
- [ ] Works with one permission
- [ ] Works with hundreds of permissions
- [ ] Handles unknown section names gracefully
- [ ] Handles unknown operation names gracefully

## Future Enhancements (Optional)

1. **Search Filter**: Add search box to filter permissions
2. **Permission Templates**: Common permission sets (Read-only, Editor, Admin)
3. **Copy Permissions**: Copy permission set from another role
4. **Permission Recommendations**: Suggest common permission combinations
5. **Permission Dependencies**: Warn if required permissions are missing
6. **Recently Used**: Highlight commonly selected permissions
7. **Keyboard Navigation**: Navigate and select with keyboard shortcuts
