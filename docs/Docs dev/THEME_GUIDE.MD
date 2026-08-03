# Theme System Guide - Don & Sons DMS

## Overview

The Don & Sons DMS application features a comprehensive theming system that supports:
- **Dark/Light Mode**: System-wide dark and light themes
- **System Theme Detection**: Automatically follows OS theme preferences
- **Page-Specific Color Coding**: Custom colors for different operational pages
- **Persistent Preferences**: Theme choices are saved across sessions

## Theme Modes

### Available Modes

1. **Light Mode**: Clean, bright interface ideal for well-lit environments
2. **Dark Mode**: Eye-friendly dark interface perfect for low-light conditions
3. **System Mode**: Automatically matches your operating system's theme preference

### Switching Themes

Users can cycle through theme modes using the theme toggle button in the header:
- Click the sun/moon/monitor icon to cycle: Light → Dark → System → Light

## Architecture

### Core Components

#### 1. Theme Store (`src/lib/stores/theme-store.ts`)
- Manages theme mode state (light/dark/system)
- Handles page-specific color theming
- Persists preferences to localStorage
- Zustand-based state management

#### 2. Theme Provider (`src/components/theme/theme-provider.tsx`)
- Applies theme classes to the DOM
- Listens for system theme changes
- Handles hydration-safe theme application

#### 3. Theme Toggle (`src/components/theme/theme-toggle.tsx`)
- UI component for switching themes
- Shows current mode icon (Sun/Moon/Monitor)
- Accessible and keyboard-friendly

#### 4. Theme Utilities (`src/lib/theme/theme-utils.ts`)
- Helper functions for theme operations
- CSS variable getters/setters
- System theme detection utilities

### CSS Architecture

#### CSS Variables

The theme system uses CSS custom properties defined in `globals.css`:

**Light Mode Variables:**
```css
--background: #ffffff
--foreground: #171717
--card: #ffffff
--border: #E5E7EB
--muted: #F9FAFB
--muted-foreground: #6B7280
```

**Dark Mode Variables:**
```css
--background: #0a0a0a
--foreground: #ededed
--card: #111827
--border: #374151
--muted: #1F2937
--muted-foreground: #9CA3AF
```

#### Brand Colors

Brand colors remain consistent across themes:
- **Primary**: `#C8102E` (Don & Sons Red)
- **Accent**: `#FFD100` (Don & Sons Yellow)

## Usage Guide

### For Developers

#### Using Theme Variables in Components

Always use CSS variables for theme-aware styling:

```tsx
// ✅ Good - Uses CSS variables
<div style={{ backgroundColor: 'var(--card)', color: 'var(--foreground)' }}>
  Content
</div>

// ❌ Bad - Hard-coded colors
<div style={{ backgroundColor: '#ffffff', color: '#000000' }}>
  Content
</div>
```

#### Common CSS Variables

| Variable | Purpose | Light Value | Dark Value |
|----------|---------|-------------|------------|
| `--background` | Page background | `#ffffff` | `#0a0a0a` |
| `--foreground` | Primary text | `#171717` | `#ededed` |
| `--card` | Card backgrounds | `#ffffff` | `#111827` |
| `--border` | Borders | `#E5E7EB` | `#374151` |
| `--muted` | Secondary backgrounds | `#F9FAFB` | `#1F2937` |
| `--muted-foreground` | Secondary text | `#6B7280` | `#9CA3AF` |

#### Accessing Theme State

```tsx
import { useThemeStore } from '@/lib/stores/theme-store';

function MyComponent() {
  const { mode, setMode, toggleMode } = useThemeStore();
  
  return (
    <div>
      <p>Current mode: {mode}</p>
      <button onClick={toggleMode}>Toggle Theme</button>
    </div>
  );
}
```

#### Page-Specific Colors

```tsx
import { useTheme } from '@/lib/theme/theme-context';

function PageComponent() {
  const { pageColor, setPageColor } = useTheme();
  
  return (
    <button style={{ backgroundColor: pageColor }}>
      Action Button
    </button>
  );
}
```

### Creating Theme-Aware Components

#### Example: Custom Card Component

```tsx
export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div 
      style={{ 
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        color: 'var(--card-foreground)',
        padding: '1rem',
        borderRadius: '0.5rem'
      }}
    >
      {children}
    </div>
  );
}
```

#### Example: Theme-Aware Button

```tsx
export function Button({ children, variant = 'primary' }: ButtonProps) {
  const styles = variant === 'primary' ? {
    backgroundColor: 'var(--brand-primary)',
    color: 'white'
  } : {
    backgroundColor: 'var(--muted)',
    color: 'var(--foreground)'
  };
  
  return (
    <button style={styles}>
      {children}
    </button>
  );
}
```

## Best Practices

### DO's ✅

1. **Use CSS Variables**: Always use `var(--variable-name)` for colors
2. **Test Both Themes**: Verify components work in light and dark modes
3. **Respect Page Colors**: Use page-specific colors for operation pages
4. **Consider Contrast**: Ensure text is readable in both themes
5. **Smooth Transitions**: Let CSS handle theme transitions automatically

### DON'Ts ❌

1. **Hard-code Colors**: Never use hex values directly in components
2. **Assume Light Theme**: Don't design only for light mode
3. **Override Transitions**: Don't disable the smooth theme transitions
4. **Ignore Accessibility**: Ensure sufficient color contrast ratios
5. **Break Consistency**: Keep brand colors consistent across themes

## Accessibility

The theme system is designed with accessibility in mind:

- **Contrast Ratios**: All color combinations meet WCAG AA standards
- **Keyboard Navigation**: Theme toggle is fully keyboard accessible
- **Screen Readers**: Proper ARIA labels on theme controls
- **No Flash**: Smooth transitions prevent jarring theme switches
- **System Preference**: Respects user's OS-level theme preference

## Troubleshooting

### Theme Not Applying
- Check if `suppressHydrationWarning` is on the `<html>` tag
- Ensure ThemeProvider is at the root level
- Verify CSS variables are defined in `globals.css`

### Colors Look Wrong
- Clear browser cache and localStorage
- Check if CSS custom properties are supported
- Verify component is using CSS variables, not hard-coded values

### Theme Not Persisting
- Check localStorage is enabled in browser
- Verify Zustand persist middleware is configured
- Ensure `_hasHydrated` check is in place

## Migration Guide

### Updating Existing Components

To make an existing component theme-aware:

1. **Find Hard-coded Colors**
   ```tsx
   // Before
   <div style={{ backgroundColor: '#ffffff' }}>
   ```

2. **Replace with CSS Variables**
   ```tsx
   // After
   <div style={{ backgroundColor: 'var(--card)' }}>
   ```

3. **Test Both Themes**
   - Toggle to dark mode
   - Verify all colors look correct
   - Check text contrast

4. **Update Related Styles**
   - Borders, shadows, hover states
   - Ensure consistency

## Future Enhancements

Potential future additions to the theme system:

- Custom theme builder for admins
- Additional color schemes (e.g., high contrast)
- Scheduled theme switching
- Per-page theme overrides in settings
- Theme preview mode

## Support

For questions or issues with the theme system:
- Check this guide first
- Review component examples in `src/components/`
- Test in both light and dark modes
- Ensure CSS variables are being used correctly
