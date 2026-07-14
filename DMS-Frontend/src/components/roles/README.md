# Roles Components

This folder contains reusable components for the Role Management system.

## Components

### PermissionsSelector

A comprehensive permissions management component that provides an organized, filterable, and searchable interface for selecting role permissions.

**File:** `PermissionsSelector.tsx`

**Usage:**
```tsx
import PermissionsSelector from '@/components/roles/PermissionsSelector';

<PermissionsSelector
  permissions={allPermissions}
  selectedIds={selectedPermissionIds}
  onChange={(newSelectedIds) => setSelectedPermissionIds(newSelectedIds)}
/>
```

**Features:**
- Module-based grouping
- Collapsible sections
- Search and filter functionality
- Bulk selection (Select All, per module, Clear All)
- Responsive 2-column grid layout
- Visual indicators for selection state
- Indeterminate checkboxes for partial selection

**Props:**
```typescript
interface PermissionsSelectorProps {
  permissions: Permission[];      // Array of all available permissions
  selectedIds: string[];           // Array of selected permission IDs
  onChange: (selectedIds: string[]) => void; // Callback when selection changes
}
```

**Example:**
See usage in:
- `src/app/(dashboard)/administrator/roles/add/page.tsx`
- `src/app/(dashboard)/administrator/roles/edit/[id]/page.tsx`

## Design Principles

1. **Modularity** - Each component is self-contained and reusable
2. **Accessibility** - Keyboard navigation, proper ARIA labels, semantic HTML
3. **Responsiveness** - Mobile-first approach with desktop enhancements
4. **Performance** - Memoized calculations, efficient re-renders
5. **User Experience** - Clear visual feedback, intuitive interactions

## Styling

All components use:
- Tailwind CSS for utility classes
- CSS variables for theming (`var(--foreground)`, `var(--muted)`, etc.)
- Consistent spacing and sizing
- Brand colors for primary actions

## Future Components

Potential components to add to this folder:

1. **RoleCard** - Display role information in card format
2. **PermissionBadge** - Small badge showing permission info
3. **RoleSelector** - Dropdown or list for selecting roles
4. **PermissionMatrix** - Table view of permissions by module/operation
5. **RoleComparer** - Side-by-side comparison of role permissions

## Related Files

- **API:** `src/lib/api/roles.ts`, `src/lib/api/permissions.ts`
- **Types:** Defined in API files
- **Pages:** `src/app/(dashboard)/administrator/roles/`
- **UI Components:** `src/components/ui/`

## Contributing

When adding new components to this folder:

1. Follow the existing pattern (TypeScript, functional components)
2. Add proper TypeScript interfaces for props
3. Include JSDoc comments for complex logic
4. Use Tailwind CSS for styling
5. Ensure accessibility (keyboard, screen readers)
6. Test on different screen sizes
7. Update this README with component documentation
