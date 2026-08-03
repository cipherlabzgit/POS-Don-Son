# POS Theme Customization Guide

## Overview

The Don & Sons POS system now supports complete theme customization, allowing administrators to customize the visual appearance of POS terminals including:

- **Brand Colors**: Primary and accent colors with light/dark variants
- **Category Tab Colors**: Individual colors for each of the 8 category tabs

This feature enables branding consistency across different showrooms or seasonal theme changes.

## Features

### 1. Brand Color Customization
- **Primary Color**: Main brand color (header, buttons, branding)
- **Primary Light/Dark**: Variants for hover states and depth
- **Accent Color**: Secondary highlight color (gold/yellow by default)
- **Accent Light/Dark**: Variants for interactive elements

### 2. Category Tab Color Customization
Each of the 8 category tabs in the POS catalog view can have a unique color:
- Tab 0: "All" category (defaults to slate gray)
- Tab 1: "★ Favourites" (defaults to accent color - gold)
- Tabs 2-7: Product categories (cycle through customizable colors)

The category colors are displayed as colorful pills/badges at the top of the catalog section.

## API Endpoints

### Base URL
```
/api/pos-theme-configs
```

### Required Permission
- View: `pos-theme:view`
- Create: `pos-theme:create`
- Edit: `pos-theme:edit`
- Delete: `pos-theme:delete`

### Endpoints

#### 1. Get All Themes
```http
GET /api/pos-theme-configs?page=1&pageSize=50&search=&activeOnly=false
```

**Response:**
```json
{
  "success": true,
  "data": {
    "themes": [...],
    "totalCount": 1,
    "page": 1,
    "pageSize": 50,
    "totalPages": 1
  }
}
```

#### 2. Get Theme by ID
```http
GET /api/pos-theme-configs/{id}
```

#### 3. Get Active Theme (Available to all authenticated users)
```http
GET /api/pos-theme-configs/active
```

**Response:**
```json
{
  "success": true,
  "data": {
    "primaryColor": "#C8102E",
    "primaryLight": "#E31837",
    "primaryDark": "#A00D26",
    "accentColor": "#FFD100",
    "accentLight": "#FFDC33",
    "accentDark": "#CCAA00",
    "categoryColors": [
      "#ffd100",  // gold
      "#c8102e",  // red
      "#16a34a",  // green
      "#1d4ed8",  // blue
      "#9333ea",  // purple
      "#ea580c",  // orange
      "#db2777",  // pink
      "#0891b2"   // teal
    ]
  }
}
```

#### 4. Create New Theme
```http
POST /api/pos-theme-configs
Content-Type: application/json
```

**Request Body:**
```json
{
  "themeName": "Summer Theme",
  "description": "Bright colors for summer season",
  "primaryColor": "#FF6B6B",
  "primaryLight": "#FF8787",
  "primaryDark": "#EE5A5A",
  "accentColor": "#FFD93D",
  "accentLight": "#FFE66D",
  "accentDark": "#F4C430",
  "categoryColors": [
    "#FFD93D",
    "#FF6B6B",
    "#6BCF7F",
    "#4ECDC4",
    "#A78BFA",
    "#FB923C",
    "#F472B6",
    "#22D3EE"
  ],
  "displayOrder": 1
}
```

#### 5. Update Theme
```http
PUT /api/pos-theme-configs/{id}
Content-Type: application/json
```

**Request Body:** (All fields optional)
```json
{
  "themeName": "Updated Theme Name",
  "categoryColors": [
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FF00FF",
    "#00FFFF",
    "#FFA500",
    "#800080"
  ]
}
```

#### 6. Set Theme as Active
```http
POST /api/pos-theme-configs/{id}/activate
```

This will deactivate all other themes and activate the selected theme. POS terminals will automatically fetch and apply the new theme.

#### 7. Delete Theme
```http
DELETE /api/pos-theme-configs/{id}
```

**Note:** System themes cannot be deleted.

## Color Format Requirements

### Validation Rules
- All colors must be in **6-digit hexadecimal format**: `#RRGGBB`
- Valid examples: `#C8102E`, `#FFD100`, `#16a34a`
- Invalid examples: `#CCC` (too short), `red` (not hex), `#RRGGBB` (invalid characters)

### Category Colors Array
- Must contain **exactly 8 colors**
- Each color must be a valid hex code
- Can be `null` or empty to use default colors
- Order matters: Index 0 = first category, Index 7 = eighth category

## Usage Examples

### Example 1: Create a New Theme with Custom Category Colors

```bash
curl -X POST https://api.yourserver.com/api/pos-theme-configs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "themeName": "Christmas Special",
    "description": "Red and green theme for Christmas season",
    "primaryColor": "#C41E3A",
    "primaryLight": "#E84258",
    "primaryDark": "#A01729",
    "accentColor": "#228B22",
    "accentLight": "#32CD32",
    "accentDark": "#006400",
    "categoryColors": [
      "#FFD700",
      "#C41E3A",
      "#228B22",
      "#006400",
      "#800020",
      "#8B0000",
      "#32CD32",
      "#DC143C"
    ],
    "displayOrder": 2
  }'
```

### Example 2: Update Only Category Colors

```bash
curl -X PUT https://api.yourserver.com/api/pos-theme-configs/{theme-id} \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "categoryColors": [
      "#FF6B9D",
      "#C44569",
      "#786FA6",
      "#4B7BEC",
      "#26DE81",
      "#FED330",
      "#FD7272",
      "#F8A5C2"
    ]
  }'
```

### Example 3: Activate a Theme

```bash
curl -X POST https://api.yourserver.com/api/pos-theme-configs/{theme-id}/activate \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## POS Terminal Behavior

### Automatic Theme Sync
POS terminals automatically fetch and apply the active theme when:
1. **User logs in** - Theme is fetched on initial authentication
2. **Connection restored** - When POS comes back online after being offline
3. **App refresh** - When POS app is restarted or refreshed

### Offline Behavior
- Last fetched theme is cached in browser localStorage
- POS continues to use cached theme when offline
- Theme is re-synced when connection is restored

### Color Application
The theme colors are applied to:
- **Header bar** - Primary color
- **Pay button** - Primary color
- **Category tabs** - Individual category colors from the array
- **Accent elements** - Accent color (print button, highlights)
- **Interactive states** - Light/dark variants for hover/active states

## Default Theme

The default "Don & Sons" theme uses:
- **Primary**: `#C8102E` (Don & Sons Red)
- **Accent**: `#FFD100` (Don & Sons Gold)
- **Category Colors**:
  1. `#ffd100` - Gold (Favourites)
  2. `#c8102e` - Red (primary)
  3. `#16a34a` - Green
  4. `#1d4ed8` - Blue
  5. `#9333ea` - Purple
  6. `#ea580c` - Orange
  7. `#db2777` - Pink
  8. `#0891b2` - Teal

## Best Practices

### Color Selection
1. **Contrast**: Ensure sufficient contrast between text and background
2. **Accessibility**: Test colors for readability
3. **Branding**: Maintain brand consistency
4. **Visibility**: Choose distinct colors for category tabs to make them easily distinguishable

### Theme Management
1. **Test First**: Create and test themes before activating
2. **Naming**: Use descriptive names (e.g., "Summer 2026", "Brand Refresh")
3. **Documentation**: Add descriptions to document theme purpose
4. **Backup**: Keep default theme available as fallback

### Deployment
1. Create theme during off-peak hours
2. Test on one terminal before activating system-wide
3. Monitor POS terminals after theme activation
4. Have rollback plan (previous theme ID ready)

## Troubleshooting

### Theme Not Applying
1. Check if POS is online
2. Verify theme is set as active
3. Refresh POS terminal (F5 or logout/login)
4. Check browser console for errors
5. Verify API permissions

### Colors Look Wrong
1. Verify hex color format (`#RRGGBB`)
2. Check if 8 colors are provided for category colors
3. Ensure colors have proper contrast
4. Test in different lighting conditions

### POS Shows Default Theme
This is normal when:
- No active theme is set
- POS is offline and has no cached theme
- Theme fetch failed (check API)

## Technical Details

### Database Schema
```sql
Table: pos_theme_configs
- id (uuid)
- theme_name (varchar 100)
- description (varchar 500)
- primary_color (varchar 7)
- primary_light (varchar 7)
- primary_dark (varchar 7)
- accent_color (varchar 7)
- accent_light (varchar 7)
- accent_dark (varchar 7)
- category_colors (jsonb) -- Array of 8 hex colors
- is_active (boolean)
- is_system (boolean)
- display_order (integer)
- created_at, updated_at, created_by_id, updated_by_id
```

### Frontend Implementation
- Theme colors stored in Zustand store (`settings-store.ts`)
- Applied as CSS custom properties on `document.documentElement`
- Persisted in localStorage for offline use
- Auto-syncs when online status changes

## Support

For issues or questions regarding theme customization:
1. Check API response for validation errors
2. Review browser console logs
3. Verify user permissions
4. Contact system administrator
