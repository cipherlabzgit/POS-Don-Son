# Dark Mode Migration Guide

## Overview

This guide provides step-by-step instructions for updating all pages and components to support dark/light themes using CSS variables.

## Quick Reference: Color Replacements

### Background Colors

| Hard-Coded | CSS Variable | Usage |
|------------|--------------|-------|
| `#ffffff` or `'white'` | `var(--card)` | Card backgrounds, modals |
| `backgroundColor: '#F9FAFB'` | `var(--muted)` | Page backgrounds, alternating rows |
| `backgroundColor: '#F3F4F6'` | `var(--muted)` | Secondary backgrounds |
| `backgroundColor: '#111827'` | `var(--card)` (dark) | Handled automatically |

### Text Colors

| Hard-Coded | CSS Variable | Usage |
|------------|--------------|-------|
| `color: '#111827'` | `var(--foreground)` | Primary text, headings |
| `color: '#171717'` | `var(--foreground)` | Primary text |
| `color: '#6B7280'` | `var(--muted-foreground)` | Secondary text, labels |
| `color: '#9CA3AF'` | `var(--muted-foreground)` | Tertiary text |
| `color: '#374151'` | `var(--foreground)` | Body text |
| `color: '#4B5563'` | `var(--foreground)` | Standard text |

### Border Colors

| Hard-Coded | CSS Variable | Usage |
|------------|--------------|-------|
| `border: '1px solid #E5E7EB'` | `border: '1px solid var(--border)'` | Borders, dividers |
| `borderColor: '#E5E7EB'` | `var(--border)` | Border property |
| `borderColor: '#D1D5DB'` | `var(--input)'` | Input borders |
| `borderBottom: '1px solid #E5E7EB'` | `borderBottom: '1px solid var(--border)'` | Bottom borders |

### Special Colors (Keep As-Is)

These colors should **NOT** be changed:

- `#C8102E` - Don & Sons primary brand red
- `#FFD100` - Don & Sons accent yellow
- `#DC2626` - Error red
- `#10B981` - Success green
- `#F59E0B` - Warning orange
- `#3B82F6` - Info blue

## Step-by-Step Migration Process

### Step 1: Identify Files to Update

Find files with hard-coded colors:

```bash
# Search for hex colors
rg "#[0-9A-Fa-f]{6}" --type tsx
```

### Step 2: Update Page Headers

**Before:**
```tsx
<h1 style={{ color: '#111827' }}>Page Title</h1>
<p style={{ color: '#6B7280' }}>Description</p>
```

**After:**
```tsx
<h1 style={{ color: 'var(--foreground)' }}>Page Title</h1>
<p style={{ color: 'var(--muted-foreground)' }}>Description</p>
```

### Step 3: Update Card Components

**Before:**
```tsx
<div className="bg-white rounded-lg" style={{ border: '1px solid #E5E7EB' }}>
  <h3 style={{ color: '#111827' }}>Card Title</h3>
  <p style={{ color: '#6B7280' }}>Card content</p>
</div>
```

**After:**
```tsx
<div className="rounded-lg" style={{ 
  backgroundColor: 'var(--card)', 
  border: '1px solid var(--border)',
  color: 'var(--card-foreground)'
}}>
  <h3 style={{ color: 'var(--foreground)' }}>Card Title</h3>
  <p style={{ color: 'var(--muted-foreground)' }}>Card content</p>
</div>
```

### Step 4: Update Input Fields

**Before:**
```tsx
<input
  style={{
    backgroundColor: 'white',
    border: '1px solid #D1D5DB',
    color: '#111827'
  }}
/>
```

**After:**
```tsx
<input
  style={{
    backgroundColor: 'var(--background)',
    border: '1px solid var(--input)',
    color: 'var(--foreground)'
  }}
/>
```

### Step 5: Update Hover States

**Before:**
```tsx
onMouseEnter={(e) => {
  e.currentTarget.style.backgroundColor = '#F3F4F6';
  e.currentTarget.style.color = '#111827';
}}
onMouseLeave={(e) => {
  e.currentTarget.style.backgroundColor = 'transparent';
  e.currentTarget.style.color = '#6B7280';
}}
```

**After:**
```tsx
onMouseEnter={(e) => {
  e.currentTarget.style.backgroundColor = 'var(--muted)';
  e.currentTarget.style.color = 'var(--foreground)';
}}
onMouseLeave={(e) => {
  e.currentTarget.style.backgroundColor = 'transparent';
  e.currentTarget.style.color = 'var(--muted-foreground)';
}}
```

### Step 6: Update Tailwind Classes

**Before:**
```tsx
<div className="bg-white text-slate-900 border-slate-200">
```

**After:**
```tsx
<div style={{ 
  backgroundColor: 'var(--card)',
  color: 'var(--foreground)',
  border: '1px solid var(--border)'
}}>
```

## Common Patterns

### Pattern 1: Page Container

```tsx
<div className="p-6 space-y-6">
  <div>
    <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
      Page Title
    </h1>
    <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
      Page description
    </p>
  </div>
  
  {/* Content goes here */}
</div>
```

### Pattern 2: Info Banner

```tsx
<div
  className="p-4 rounded-lg flex items-start gap-3"
  style={{ 
    backgroundColor: 'var(--muted)',
    border: '1px solid var(--border)'
  }}
>
  <InfoIcon className="w-5 h-5" style={{ color: 'var(--muted-foreground)' }} />
  <div>
    <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
      Information Title
    </p>
    <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
      Information description
    </p>
  </div>
</div>
```

### Pattern 3: Action Button Group

```tsx
<div className="flex items-center space-x-3">
  <button
    style={{ 
      backgroundColor: pageColor,
      color: 'white'
    }}
    className="px-4 py-2 rounded-lg"
  >
    Primary Action
  </button>
  <button
    style={{ 
      backgroundColor: 'var(--muted)',
      color: 'var(--foreground)'
    }}
    className="px-4 py-2 rounded-lg"
    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--border)'}
    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--muted)'}
  >
    Secondary Action
  </button>
</div>
```

### Pattern 4: Data Table Row

```tsx
<tr 
  style={{ 
    backgroundColor: index % 2 === 0 ? 'var(--card)' : 'var(--muted)'
  }}
  onMouseEnter={(e) => {
    const isDark = document.documentElement.classList.contains('dark');
    e.currentTarget.style.backgroundColor = isDark ? 'var(--border)' : '#FEF2F2';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'var(--card)' : 'var(--muted)';
  }}
>
  <td style={{ color: 'var(--foreground)' }}>Data</td>
</tr>
```

## Testing Checklist

After updating a file, test the following:

- [ ] Page renders correctly in light mode
- [ ] Page renders correctly in dark mode
- [ ] Toggle between themes works smoothly
- [ ] Text is readable in both themes
- [ ] Hover states work in both themes
- [ ] Borders are visible in both themes
- [ ] No hard-coded colors remain
- [ ] Brand colors (red, yellow) still work correctly
- [ ] Focus states are visible

## Automated Search & Replace

Use your code editor's find/replace with regex:

### Find: `backgroundColor: ['"]#ffffff['"]`
**Replace with:** `backgroundColor: 'var(--card)'`

### Find: `color: ['"]#111827['"]`
**Replace with:** `color: 'var(--foreground)'`

### Find: `color: ['"]#6B7280['"]`
**Replace with:** `color: 'var(--muted-foreground)'`

### Find: `border: ['"]1px solid #E5E7EB['"]`
**Replace with:** `border: '1px solid var(--border)'`

## Priority Order

Update files in this order for maximum impact:

1. ✅ **UI Components** (DONE)
   - Card, Button, Input, Select, Modal, Badge, Checkbox, Toggle, DataTable

2. ✅ **Layout Components** (DONE)
   - Header, Sidebar, ThemeProvider, ThemeToggle

3. ✅ **Dashboard Widgets** (PARTIALLY DONE)
   - SalesTrendWidget (DONE)
   - DisposalBySectionWidget
   - TopDeliveriesWidget
   - DeliveryVsDisposalWidget
   - MetricCard

4. **High-Traffic Pages**
   - Dashboard (DONE)
   - Reports
   - Daily Production
   - Production Planner
   - Order Entry

5. **Operation Pages**
   - Delivery
   - Disposal
   - Transfer
   - Stock BF
   - Cancellation

6. **Administrator Pages**
   - Users
   - Roles
   - Approvals
   - System Settings

7. **Inventory Pages**
   - Products
   - Ingredients
   - Categories

## Common Mistakes to Avoid

1. ❌ **Don't change brand colors**
   - Keep `#C8102E` (Don & Sons Red)
   - Keep `#FFD100` (Don & Sons Yellow)

2. ❌ **Don't use Tailwind color classes**
   - Avoid `bg-white`, `text-gray-900`, etc.
   - Use inline styles with CSS variables instead

3. ❌ **Don't forget hover states**
   - Update all `onMouseEnter`/`onMouseLeave` handlers

4. ❌ **Don't mix approaches**
   - Be consistent: use CSS variables throughout

5. ❌ **Don't forget borders**
   - Borders need updates too!

## Getting Help

If you encounter issues:

1. Check `THEME_GUIDE.md` for detailed documentation
2. Look at updated components for examples
3. Test in both light and dark modes
4. Check browser console for errors

## Progress Tracking

### Completed
- ✅ Core theme system
- ✅ All UI components
- ✅ Layout components
- ✅ Login page
- ✅ Dashboard page header
- ✅ Sales Trend Widget

### In Progress
- 🔄 Dashboard widgets
- 🔄 High-traffic pages

### TODO
- ⏳ 60+ remaining pages
- ⏳ Custom DMS components
- ⏳ Chart components

## Bulk Update Script

If needed, you can create a script to automate updates:

```javascript
const fs = require('fs');
const replacements = {
  "#111827": "var(--foreground)",
  "#6B7280": "var(--muted-foreground)",
  "#E5E7EB": "var(--border)",
  // Add more...
};

// Process file...
```

## Summary

The goal is to ensure **every page** in the application:
- Uses CSS variables for all colors
- Works perfectly in both light and dark modes
- Maintains brand colors where appropriate
- Has smooth, accessible transitions

Update files systematically, test thoroughly, and maintain consistency throughout the codebase.
