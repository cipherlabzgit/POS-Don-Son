# Permissions Section - Quick Guide

## What's New? 🎉

The permissions section has been completely redesigned to make it much easier to manage role permissions!

## Key Improvements

### 1. Organized by Module 📁
Permissions are now grouped by module (Ingredients, Orders, Products, etc.) instead of being in a flat list.

**Before:** 128 checkboxes in a long scrollable list  
**After:** Organized into collapsible module sections

### 2. Search & Filter 🔍
- **Module Filter:** Dropdown to show only permissions for a specific module
- **Search:** Type to find permissions by name, code, or description
- Works together for powerful filtering

### 3. Bulk Selection ✓
- **Select All:** Top checkbox to select/deselect everything
- **Per Module:** Each module has its own "Select All" checkbox
- **Clear Selected:** Button to quickly deselect all permissions

### 4. Collapsible Sections ▼▶
- **Expand All / Collapse All:** Buttons to toggle all modules at once
- **Individual Control:** Click module header or "Collapse/Expand" link
- Focus on what you need, hide the rest

### 5. Better Visual Design 🎨
- **Selection Counter:** See "3/8" to know how many are selected per module
- **Indeterminate State:** Partial selection shows in parent checkbox
- **Clear Operations:** Shows "Create", "Update", "Delete", "View" clearly
- **Entity Names:** See what each permission applies to

## How to Use

### Selecting Permissions for a New Role

1. **Start Broad**
   - Click "Select All" if the role needs most permissions
   - OR start with nothing and add specific ones

2. **Filter by Module** (Optional)
   - Use the "Filter list by module" dropdown
   - Select specific module to focus on (e.g., "Orders")
   - OR keep "All modules" to see everything

3. **Search** (Optional)
   - Type in the search box
   - Finds matches in name, description, and code
   - Great for finding specific permissions quickly

4. **Select by Module**
   - Expand the module you want
   - Click "Select All" next to the module name
   - OR select individual permissions

5. **Fine-tune**
   - Check/uncheck individual permissions as needed
   - Use "Clear selected" to start over if needed

### Editing Permissions for Existing Role

1. **Review Current State**
   - Badges show "X/Y" selected per module
   - Top shows total selected count

2. **Make Changes**
   - Expand modules you want to modify
   - Add or remove permissions as needed
   - Use bulk actions for faster changes

3. **Save**
   - Click "Save Changes" when done
   - All selections are persisted

## Tips & Tricks 💡

### Finding Specific Permissions
```
Use Search: Type "create" to find all Create permissions
OR
Use Module Filter: Select "Ingredients" to see only ingredient permissions
```

### Selecting Multiple Modules
```
1. Expand All
2. Check "Select All" for Module A
3. Check "Select All" for Module B
4. Collapse All (optional)
5. Save
```

### Creating Similar Roles
```
1. Edit an existing role as template
2. Select all desired permissions
3. Cancel (don't save)
4. Go to "Add New Role"
5. Enter new role details
6. Select same permissions pattern
```

### Quick View of What's Selected
```
- Look at badges: "3/8" means 3 out of 8 selected
- Expand module to see which specific ones
- Total count shown at top
```

## Visual Indicators

### Checkboxes
- ☑ **Checked:** All permissions selected
- ☐ **Unchecked:** No permissions selected
- ▣ **Indeterminate:** Some permissions selected (partial)

### Module Headers
- **Gray Background:** Module section header
- **Badge:** Shows selection count (e.g., "3/8")
- **▶ Collapsed** / **▼ Expanded:** Current state

### Buttons
- **Blue:** Primary actions (Select All)
- **Red:** Destructive actions (Clear selected)
- **Gray:** Neutral actions (Expand/Collapse)

## Common Scenarios

### Scenario 1: Manager Role (Limited Access)
```
1. Start with nothing selected
2. Select "View" modules: Orders, Products, Reports
3. Add specific "Create" for Order Entry
4. Save
```

### Scenario 2: Admin Role (Full Access)
```
1. Click "Select All" at the top
2. Review if any should be excluded
3. Uncheck specific high-risk permissions if needed
4. Save
```

### Scenario 3: Department-Specific Role
```
1. Use Module Filter: Select "Production"
2. Click "Expand all"
3. Select all Production permissions
4. Change filter to "All modules"
5. Add any cross-module permissions needed
6. Save
```

### Scenario 4: Read-Only Role
```
1. Click "Expand all"
2. For each module, select only "View" permissions
3. OR use Search: "view" (select all results)
4. Save
```

## Keyboard Shortcuts

- **Tab:** Navigate between controls
- **Space:** Toggle checkbox
- **Enter:** Click button/link
- **Escape:** Clear search (when search is focused)

## Mobile/Responsive

- **Desktop (Large):** 2 modules per row, 2 permissions per column within each module
- **Tablet:** 1 module per row, 2 permissions per column within module
- **Mobile:** Single column for both modules and permissions (easy touch)
- All features available on all screen sizes

## Troubleshooting

### "Can't find a permission"
- Check module filter - might be filtered to wrong module
- Check search - might have search term active
- Try "All modules" and clear search

### "Changes not saving"
- Ensure you clicked "Save Changes" button
- Check for error messages/toasts
- Verify you have permission to edit roles

### "Too many permissions selected"
- Use "Clear selected" to start fresh
- Select by module instead of "Select All"
- Consider creating multiple roles with specific scopes

## Best Practices

1. **Principle of Least Privilege**
   - Only grant permissions that are actually needed
   - Start minimal, add as required

2. **Logical Grouping**
   - Use modules to think about functional areas
   - Group related permissions together

3. **Regular Review**
   - Periodically review role permissions
   - Remove unused permissions
   - Update as job functions change

4. **Consistent Naming**
   - Name roles clearly (e.g., "Sales Manager", "Production Supervisor")
   - Include scope in description

5. **Test First**
   - Test roles in development
   - Verify permissions work as expected
   - Get user feedback before deploying

---

**Need Help?**
- See full documentation: `PERMISSIONS_REDESIGN.md`
- Component details: `src/components/roles/README.md`
- Backend integration: Check API documentation

**Last Updated:** April 29, 2026
