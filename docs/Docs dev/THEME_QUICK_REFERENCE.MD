# Theme System Quick Reference

## Quick Start

### Using CSS Variables

```tsx
// Background colors
backgroundColor: 'var(--background)'  // Main page background
backgroundColor: 'var(--card)'        // Card/panel background
backgroundColor: 'var(--muted)'       // Secondary background

// Text colors
color: 'var(--foreground)'            // Primary text
color: 'var(--muted-foreground)'      // Secondary text
color: 'var(--card-foreground)'       // Text on cards

// Borders
border: '1px solid var(--border)'
borderColor: 'var(--border)'

// Inputs
backgroundColor: 'var(--background)'
border: '1px solid var(--input)'
```

## Common Patterns

### Card
```tsx
<div style={{ 
  backgroundColor: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: '0.5rem'
}}>
  <h3 style={{ color: 'var(--foreground)' }}>Title</h3>
  <p style={{ color: 'var(--muted-foreground)' }}>Text</p>
</div>
```

### Button
```tsx
<button style={{ 
  backgroundColor: 'var(--muted)',
  color: 'var(--foreground)'
}}>
  Button
</button>
```

### Input
```tsx
<input style={{ 
  backgroundColor: 'var(--background)',
  border: '1px solid var(--input)',
  color: 'var(--foreground)'
}} />
```

### Hover State
```tsx
onMouseEnter={(e) => {
  e.currentTarget.style.backgroundColor = 'var(--muted)';
}}
onMouseLeave={(e) => {
  e.currentTarget.style.backgroundColor = 'transparent';
}}
```

## CSS Variables Cheat Sheet

### Backgrounds
- `--background` - Main background
- `--card` - Card background
- `--muted` - Secondary background
- `--popover` - Dropdown background

### Text
- `--foreground` - Primary text
- `--muted-foreground` - Secondary text
- `--card-foreground` - Card text
- `--popover-foreground` - Dropdown text

### Interactive
- `--border` - Borders, dividers
- `--input` - Input borders
- `--ring` - Focus ring

### Brand (Always Use Brand Colors for CTA)
- `--brand-primary` - Don & Sons Red (#C8102E)
- `--brand-accent` - Don & Sons Yellow (#FFD100)
- `--page-accent-color` - Page-specific color

## Theme Store Hook

```tsx
import { useThemeStore } from '@/lib/stores/theme-store';

const { mode, setMode, toggleMode } = useThemeStore();

// mode: 'light' | 'dark' | 'system'
// setMode('dark') - Set specific mode
// toggleMode() - Cycle through modes
```

## Migration Template

```tsx
// ❌ Before
<div style={{ backgroundColor: '#ffffff', color: '#111827' }}>
  <h1 style={{ color: '#111827' }}>Title</h1>
  <p style={{ color: '#6B7280' }}>Text</p>
  <button style={{ backgroundColor: '#F3F4F6' }}>Action</button>
</div>

// ✅ After
<div style={{ backgroundColor: 'var(--card)', color: 'var(--card-foreground)' }}>
  <h1 style={{ color: 'var(--foreground)' }}>Title</h1>
  <p style={{ color: 'var(--muted-foreground)' }}>Text</p>
  <button style={{ backgroundColor: 'var(--muted)' }}>Action</button>
</div>
```

## Testing Checklist

- [ ] Renders in light mode
- [ ] Renders in dark mode
- [ ] System theme works
- [ ] Text is readable
- [ ] Hover states work
- [ ] No hard-coded colors

## Common Issues

### Theme not applying
- Check `suppressHydrationWarning` on `<html>`
- Ensure `ThemeProvider` wraps app
- Verify CSS variables in `globals.css`

### Colors wrong
- Don't use hex colors directly
- Use `var(--variable-name)` format
- Test in both themes

### Theme not persisting
- Check localStorage is enabled
- Verify Zustand persist config
- Check `_hasHydrated` state
