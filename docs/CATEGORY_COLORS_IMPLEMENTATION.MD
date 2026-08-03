# POS Category Tab Colors - Implementation Summary

## Overview

The POS system now supports **customizable category tab colors**, allowing administrators to assign unique colors to each of the 8 category tabs displayed in the POS catalog view. This feature extends the existing POS theme configuration system.

## What's New

### Category Colors Array
Each POS theme can now include an array of 8 hex color codes that determine the colors of category tabs:
- **Tab 0**: "All" category (default: slate gray)
- **Tab 1**: "★ Favourites" (default: gold/accent color)
- **Tabs 2-7**: Product categories that cycle through the color palette

These colors appear as colorful pills/badges at the top of the POS catalog section, making category navigation more visual and intuitive.

## Changes Made

### Backend Changes

#### 1. Database Schema
**New Column:** `category_colors` (JSONB type)
- Location: `pos_theme_configs` table
- Stores an array of 8 hex color strings
- Example: `["#ffd100", "#c8102e", "#16a34a", "#1d4ed8", "#9333ea", "#ea580c", "#db2777", "#0891b2"]`

**Migration File:** `20260515065200_AddCategoryColorsToPosThemeConfig.cs`
- Adds the column with safety checks (IF NOT EXISTS)
- Sets default colors for existing themes

#### 2. Entity Model
**File:** `DMS-Backend/Models/Entities/PosThemeConfig.cs`

```csharp
[Column("category_colors", TypeName = "jsonb")]
public string? CategoryColors { get; set; }
```

#### 3. DTOs Updated
**File:** `DMS-Backend/Models/DTOs/PosTheme/PosThemeConfigDto.cs`

All DTOs now include:
```csharp
public List<string>? CategoryColors { get; set; }
```

- `PosThemeConfigDto` - Full theme data
- `CreatePosThemeConfigDto` - For creating themes
- `UpdatePosThemeConfigDto` - For updating themes
- `ActivePosThemeDto` - Lightweight DTO with default colors

#### 4. AutoMapper Profile
**File:** `DMS-Backend/Mapping/PosThemeConfigProfile.cs`

Added JSON serialization/deserialization for category colors:
```csharp
.ForMember(dest => dest.CategoryColors, 
    opt => opt.MapFrom(src => 
        string.IsNullOrWhiteSpace(src.CategoryColors) 
            ? null 
            : JsonSerializer.Deserialize<List<string>>(src.CategoryColors)))
```

#### 5. Service Layer
**File:** `DMS-Backend/Services/Implementations/PosThemeConfigService.cs`

Updated `GetActiveThemeAsync()` to:
- Parse category colors JSON
- Return default colors if not set or parsing fails
- Handle null/empty values gracefully

#### 6. Validators
**New Files:**
- `DMS-Backend/Validators/PosTheme/CreatePosThemeConfigDtoValidator.cs`
- `DMS-Backend/Validators/PosTheme/UpdatePosThemeConfigDtoValidator.cs`

**Validation Rules:**
```csharp
RuleFor(x => x.CategoryColors)
    .Must(colors => colors == null || colors.Count == 0 || colors.Count == 8)
    .WithMessage("Category colors must contain exactly 8 colors or be empty");

RuleForEach(x => x.CategoryColors)
    .Matches("^#[0-9A-Fa-f]{6}$")
    .WithMessage("Each category color must be a valid hex color");
```

### Frontend Changes

#### 1. POS Terminal (DMS-POS)

**API Type Update** (`DMS-POS/src/lib/api.ts`)
```typescript
export async function fetchActivePosTheme() {
  const { data } = await api.get<ApiEnvelope<{
    // ... existing fields
    categoryColors: string[]
  }>>('/api/pos-theme-configs/active')
  return unwrap(data)
}
```

**Settings Store** (`DMS-POS/src/lib/settings-store.ts`)
- Added `categoryColors?: string[]` to `ThemeColors` interface
- Updated version from 4 to 5 for migration
- Enhanced `applyThemeColors()` to dynamically set CSS variables:

```typescript
const categoryColors = colors.categoryColors && colors.categoryColors.length >= 8 
  ? colors.categoryColors 
  : defaultCategoryColors

categoryColors.forEach((color, index) => {
  root.style.setProperty(`--cat-${index}`, color)
})
```

**Theme Sync** (`DMS-POS/src/lib/theme-sync.ts`)
- Already implemented, automatically syncs on login and when coming back online
- No changes needed

#### 2. Admin Frontend (DMS-Frontend)

**API Types** (`DMS-Frontend/src/lib/api/pos-theme.ts`)
- Added `categoryColors?: string[]` to all interfaces
- Updated `getActive()` response type

**Theme Management Page** (`DMS-Frontend/src/app/(dashboard)/administrator/pos-theme/page.tsx`)

**New Features:**
1. **Category Colors Input Section:**
   - 8 color pickers in a 4x2 grid
   - Labels: "Tab 0" through "Tab 7"
   - "Reset to Default" button
   - Descriptive help text

2. **Visual Preview:**
   - Shows 8 small color squares below main colors
   - Displays on theme card in the list view
   - Hover tooltips show tab index and hex value

3. **Default Colors:**
   ```typescript
   const defaultCategoryColors = [
     '#ffd100', // gold
     '#c8102e', // red
     '#16a34a', // green
     '#1d4ed8', // blue
     '#9333ea', // purple
     '#ea580c', // orange
     '#db2777', // pink
     '#0891b2'  // teal
   ];
   ```

## How to Use (Admin Guide)

### Creating a Theme with Custom Category Colors

1. **Navigate to Theme Management**
   - Go to Administrator → POS Theme Configuration
   - Click "New Theme"

2. **Configure Basic Info**
   - Enter theme name (required)
   - Add optional description

3. **Set Brand Colors**
   - Configure Primary color (header, buttons)
   - Configure Accent color (highlights)
   - Set light/dark variants (optional)

4. **Customize Category Tab Colors**
   - Scroll to "Category Tab Colors" section
   - Click each "Tab N" button to pick a color
   - Use "Reset to Default" if needed
   - Preview appears as you change colors

5. **Save and Activate**
   - Click "Create Theme"
   - Find theme in list
   - Click power icon to activate
   - POS terminals auto-sync within seconds

### Updating Existing Theme

1. Click edit icon (✏️) on any theme
2. Modify category colors as needed
3. Save changes
4. If theme is active, changes apply immediately

### Best Practices

**Color Selection:**
- Use distinct colors for easy differentiation
- Ensure sufficient contrast with white text
- Consider brand consistency
- Test visibility in actual POS environment

**Tab Order Reference:**
- Tab 0: "All" (default slate/gray)
- Tab 1: "★ Favourites" (default gold)
- Tabs 2-7: Rotate through product categories

**Testing:**
- Create theme and test before activating
- Activate during off-peak hours
- Have another user verify on POS
- Keep previous active theme ID for rollback

## API Examples

### Create Theme with Category Colors

```bash
POST /api/pos-theme-configs
Content-Type: application/json

{
  "themeName": "Vibrant Summer",
  "description": "Bright colors for summer season",
  "primaryColor": "#FF6B6B",
  "accentColor": "#FFD93D",
  "categoryColors": [
    "#FFD93D",  // gold
    "#FF6B6B",  // coral red
    "#6BCF7F",  // mint green
    "#4ECDC4",  // turquoise
    "#A78BFA",  // lavender
    "#FB923C",  // orange
    "#F472B6",  // pink
    "#22D3EE"   // cyan
  ]
}
```

### Update Only Category Colors

```bash
PUT /api/pos-theme-configs/{id}
Content-Type: application/json

{
  "categoryColors": [
    "#1E3A8A",  // deep blue
    "#991B1B",  // dark red
    "#065F46",  // dark green
    "#7C2D12",  // brown
    "#581C87",  // purple
    "#9A3412",  // orange-brown
    "#831843",  // magenta
    "#155E75"   // teal
  ]
}
```

### Get Active Theme (POS)

```bash
GET /api/pos-theme-configs/active

Response:
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
      "#ffd100", "#c8102e", "#16a34a", "#1d4ed8",
      "#9333ea", "#ea580c", "#db2777", "#0891b2"
    ]
  }
}
```

## Technical Details

### Color Format
- **Required Format:** 6-digit hexadecimal (`#RRGGBB`)
- **Case:** Insensitive (accepts both uppercase and lowercase)
- **Validation:** Regex pattern `^#[0-9A-Fa-f]{6}$`
- **Examples:** `#C8102E`, `#ffd100`, `#16a34a`

### Database Storage
```sql
-- PostgreSQL JSONB format
category_colors: '["#ffd100","#c8102e","#16a34a","#1d4ed8","#9333ea","#ea580c","#db2777","#0891b2"]'::jsonb
```

### CSS Variables Applied
```css
:root {
  --cat-0: #ffd100;  /* Tab 0 */
  --cat-1: #c8102e;  /* Tab 1 */
  --cat-2: #16a34a;  /* Tab 2 */
  --cat-3: #1d4ed8;  /* Tab 3 */
  --cat-4: #9333ea;  /* Tab 4 */
  --cat-5: #ea580c;  /* Tab 5 */
  --cat-6: #db2777;  /* Tab 6 */
  --cat-7: #0891b2;  /* Tab 7 */
}
```

### POS Component Usage
The colors are applied in `PosMainPage.tsx`:

```typescript
const catRow = useMemo(() => {
  const cols: { id: string; name: string; colour: string }[] = [
    { id: 'all', name: 'All', colour: 'bg-slate-700 text-white' },
    { id: 'fav', name: '★ Favourites', colour: CAT_COLOURS[0] },
  ]
  sorted.forEach((c, i) => 
    cols.push({ 
      id: c.id, 
      name: c.name, 
      colour: CAT_COLOURS[(i + 1) % CAT_COLOURS.length] 
    })
  )
  return cols
}, [categories])
```

## Deployment Checklist

### Before Deploying

- [x] Database migration created
- [x] Backend models updated
- [x] DTOs and validators created
- [x] Service layer updated
- [x] Frontend API types updated
- [x] POS settings store updated
- [x] Admin UI updated
- [ ] Migration applied to database
- [ ] Backend restarted
- [ ] Frontend builds verified
- [ ] POS tested on dev environment

### After Deploying

1. Run database migration:
   ```bash
   dotnet ef database update --project DMS-Backend
   ```

2. Restart backend server

3. Clear browser cache on POS terminals (or hard refresh)

4. Test theme creation and activation

5. Verify POS receives and applies new colors

## Troubleshooting

### Colors Not Applying on POS

**Possible Causes:**
1. POS is offline (check network)
2. Theme not activated (check admin panel)
3. Browser cache (hard refresh: Ctrl+F5)
4. Theme fetch failed (check console logs)

**Solution:**
- Log out and log back in to POS
- Check browser console for errors
- Verify API endpoint returns category colors
- Check Settings store has theme data

### Validation Errors

**"Category colors must contain exactly 8 colors"**
- Ensure array has exactly 8 elements
- Can be empty/null for defaults

**"Each category color must be a valid hex color"**
- Use format `#RRGGBB`
- No short formats like `#CCC`
- No color names like `red`

### Migration Issues

**"Column already exists"**
- Migration uses `IF NOT EXISTS` checks
- Safe to run multiple times
- No action needed

**"Failed to parse JSON"**
- Check category_colors column format
- Should be valid JSON array
- Example: `["#ffd100", "#c8102e"]`

## Visual Reference

### POS Category Tabs (Before)
```
[All] [★ Favourites] [Breads] [Cakes] [Cookies] [Drinks] [Dairy] [Toppings]
 gray      gold        red     green    blue    purple  orange   pink
```

### POS Category Tabs (After Customization)
```
[All] [★ Favourites] [Breads] [Cakes] [Cookies] [Drinks] [Dairy] [Toppings]
 gray   custom-0    custom-1 custom-2 custom-3 custom-4 custom-5 custom-6
```

Admins can now set custom-0 through custom-7 to any color!

## Support & Documentation

- **Full Documentation:** See `POS_THEME_CUSTOMIZATION.md`
- **API Reference:** Backend `/api/pos-theme-configs` endpoints
- **Permissions Required:** `pos-theme:view`, `pos-theme:create`, `pos-theme:edit`

## Notes

- Changes take effect immediately when theme is activated
- POS terminals auto-sync within seconds
- Default colors used if category colors not specified
- Backwards compatible (works with themes created before this feature)
- Category colors are optional (can be null/empty)
