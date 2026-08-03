# POS Theme Customization System

## Overview

The DMS POS Theme Customization system allows administrators to customize the visual appearance of all POS terminals through the web application. Theme changes are saved to the backend database and automatically synchronized to all POS desktop applications.

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────────┐
│                     Administrator (Web App)                      │
│  - Navigate to Settings → POS Theme Configuration               │
│  - Create/Edit themes with custom colors                        │
│  - Set active theme                                              │
└──────────────────┬──────────────────────────────────────────────┘
                   │ HTTP API
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend (ASP.NET Core)                      │
│  - PosThemeConfigsController                                    │
│  - PosThemeConfigService                                         │
│  - Database: pos_theme_configs table                             │
└──────────────────┬──────────────────────────────────────────────┘
                   │ WebSocket/Polling
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                    POS Desktop App (Electron)                    │
│  - Fetches active theme on startup                              │
│  - Re-fetches when coming back online                            │
│  - Applies CSS custom properties dynamically                     │
└─────────────────────────────────────────────────────────────────┘
```

## Features

### 1. Theme Configuration (Web App)

**Location:** Settings → Administrator → POS Theme Configuration

**Capabilities:**
- Create unlimited custom themes
- Edit existing themes (except system themes)
- Delete custom themes (cannot delete active or system themes)
- Set any theme as active
- Preview colors with live color pickers

**Theme Properties:**
- **Theme Name**: Descriptive name (e.g., "Summer Beach", "Dark Mode")
- **Description**: Optional description
- **Primary Color**: Main brand color (headers, primary buttons)
- **Primary Light**: Lighter variant for hover effects
- **Primary Dark**: Darker variant for borders and shadows
- **Accent Color**: Secondary brand color (highlights, call-to-action)
- **Accent Light**: Lighter accent variant
- **Accent Dark**: Darker accent variant
- **Display Order**: Sort order in list
- **Is Active**: Only one theme can be active
- **Is System**: System themes cannot be deleted

### 2. Backend Implementation

**Database Table:** `pos_theme_configs`

```sql
CREATE TABLE pos_theme_configs (
    "Id" uuid PRIMARY KEY,
    theme_name varchar(100) NOT NULL,
    description varchar(500),
    primary_color varchar(7) NOT NULL,
    primary_light varchar(7),
    primary_dark varchar(7),
    accent_color varchar(7) NOT NULL,
    accent_light varchar(7),
    accent_dark varchar(7),
    is_active boolean NOT NULL DEFAULT false,
    is_system boolean NOT NULL DEFAULT false,
    display_order integer NOT NULL DEFAULT 0,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "CreatedById" uuid,
    "UpdatedById" uuid
);
```

**API Endpoints:**

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/api/pos-theme-configs` | List all themes | `pos-theme:view` |
| GET | `/api/pos-theme-configs/{id}` | Get theme by ID | `pos-theme:view` |
| GET | `/api/pos-theme-configs/active` | Get active theme | Authenticated |
| POST | `/api/pos-theme-configs` | Create theme | `pos-theme:create` |
| PUT | `/api/pos-theme-configs/{id}` | Update theme | `pos-theme:edit` |
| DELETE | `/api/pos-theme-configs/{id}` | Delete theme | `pos-theme:delete` |
| POST | `/api/pos-theme-configs/{id}/activate` | Set active | `pos-theme:edit` |

### 3. POS Desktop Implementation

**Theme Sync Flow:**

1. **On App Start:**
   - POS app loads persisted theme from localStorage (if available)
   - Applies theme immediately for instant UI
   - Fetches latest active theme from backend
   - Updates theme if server version is different

2. **When Coming Online:**
   - POS detects online status change
   - Automatically fetches latest active theme
   - Applies new theme if changed

3. **Theme Application:**
   - Theme colors are injected as CSS custom properties
   - All UI elements reference these CSS variables
   - Changes take effect immediately without restart

**Files:**
- `src/lib/theme-sync.ts` - Theme fetching logic
- `src/lib/settings-store.ts` - Theme state and CSS application
- `src/lib/api.ts` - API call to fetch active theme
- `src/index.css` - CSS custom property definitions
- `src/App.tsx` - Theme sync initialization

**CSS Custom Properties:**

```css
/* Core brand colors */
--brand-primary: #c8102e
--brand-primary-light: #e31837
--brand-primary-dark: #a00d26
--brand-accent: #ffd100
--brand-accent-light: #ffdc33
--brand-accent-dark: #ccaa00

/* POS-specific surfaces */
--pos-header-bg: var(--brand-primary)
--pos-header-border: var(--brand-primary-dark)
--pos-header-text: #ffffff

/* Button colors */
--btn-primary-bg: var(--brand-primary)
--btn-primary-hover: var(--brand-primary-dark)
--btn-accent-bg: var(--brand-accent)
--btn-accent-hover: var(--brand-accent-dark)

/* Category pills (first two use brand colors) */
--cat-0: var(--brand-accent)
--cat-1: var(--brand-primary)
```

## Themed UI Elements

### Header
- Background: `--brand-primary`
- Border: `--brand-primary-dark`
- Text: `--pos-header-text` (white)
- User/outlet dropdowns: semi-transparent white overlays

### Category Pills
- **All Categories**: Dark gray
- **Favourites (★)**: Accent color
- **Category 1**: Primary color
- **Category 2+**: Predefined color cycle (green, blue, purple, etc.)

### Buttons
- **PAY Button**: Primary color with dark hover
- **Print Button**: Accent color
- **Other Action Buttons**: White with brand accents
- **Sync Now Button**: Primary color

### Interactive Elements
- Product tile hover borders: Primary color
- Star favorites: Primary color when selected
- Cart quantity badges: Primary color background
- Pending sync badge: Primary color
- Focus rings: Primary color

### Product Tiles
- Favorite star (selected): Primary color
- Cart quantity badge: Primary color background
- Hover border: Primary color with opacity

### Modals & Drawers
- Operations drawer header: Primary color
- Modal action buttons: Primary color

## Usage Guide

### For Administrators

#### Creating a New Theme

1. Navigate to **Settings → Administrator → POS Theme Configuration**
2. Click **"New Theme"** button
3. Fill in theme details:
   - **Theme Name**: e.g., "Ocean Blue"
   - **Description**: Optional, e.g., "Calm blue theme for summer"
   - **Primary Color**: Click to open color picker, select main color
   - **Primary Light/Dark**: Adjust variants (optional, will use defaults if empty)
   - **Accent Color**: Select secondary/highlight color
   - **Accent Light/Dark**: Adjust variants (optional)
   - **Display Order**: Number for sorting (0 = first)
4. Click **"Create Theme"**

#### Activating a Theme

1. Find the theme you want to activate in the list
2. Click the **power button** (⚡) next to the theme
3. Confirmation: Theme is marked as "Active"
4. All POS terminals will automatically apply the new theme within seconds when online

#### Editing a Theme

1. Click the **edit button** (✏️) next to the theme
2. Modify colors or details
3. Click **"Update Theme"**
4. If this is the active theme, changes apply immediately to all POS terminals

#### Deleting a Theme

1. Click the **delete button** (🗑️) next to the theme
2. Confirm deletion
3. **Note**: Cannot delete:
   - System themes (marked with "System" badge)
   - The currently active theme

### For Developers

#### Adding New Themeable Elements

1. **Define CSS Custom Property:**
   ```css
   /* In index.css */
   :root {
     --my-element-bg: #c8102e;
   }
   ```

2. **Apply in Component:**
   ```tsx
   <div style={{ backgroundColor: 'var(--my-element-bg)' }}>
     Content
   </div>
   ```
   
   Or with Tailwind:
   ```tsx
   <div className="bg-[var(--my-element-bg)]">
     Content
   </div>
   ```

3. **Update Theme Application (if needed):**
   ```typescript
   // In settings-store.ts, applyThemeColors function
   root.style.setProperty('--my-element-bg', colors.primaryColor)
   ```

#### Testing Theme Changes

1. **Local Development:**
   ```bash
   # Start backend
   cd DMS-Backend
   dotnet run

   # Start POS app
   cd DMS-POS
   npm run dev
   ```

2. **Test Theme Sync:**
   - Change active theme in web app
   - POS should update within a few seconds
   - Check browser console for theme sync logs: `[theme-sync] Theme synchronized from server:`

3. **Test Offline Behavior:**
   - Disconnect from network
   - Restart POS app
   - Theme should persist from localStorage
   - Reconnect - should sync latest theme

## Default Theme

**Don & Sons Default Theme:**
- Primary Color: `#C8102E` (Don & Sons Red)
- Primary Light: `#E31837`
- Primary Dark: `#A00D26`
- Accent Color: `#FFD100` (Don & Sons Gold)
- Accent Light: `#FFDC33`
- Accent Dark: `#CCAA00`

This theme is created automatically during database migration and marked as a system theme.

## Troubleshooting

### Theme Not Applying to POS

**Symptoms:** POS shows default colors after changing theme in web app

**Solutions:**
1. Check if POS is online (look for green badge in header)
2. Manually refresh cache from User menu → Refresh cache
3. Check browser console for errors: `[theme-sync]` logs
4. Verify backend is running and accessible
5. Restart POS application

### Colors Look Different Than Expected

**Cause:** CSS color format issues

**Solution:** Ensure all colors are in hex format: `#RRGGBB`
- ✅ Correct: `#C8102E`
- ❌ Wrong: `rgb(200, 16, 46)`, `red`, `#C8102E99`

### Theme Sync Slow

**Cause:** Network latency or POS not detecting online status

**Solution:**
1. Check network connection
2. Manually sync from header sync button
3. Check `online` badge status in header

### Cannot Delete Theme

**Cause:** Attempting to delete active or system theme

**Solution:**
1. If theme is active: Activate a different theme first, then delete
2. If theme is system: System themes cannot be deleted (by design)

## Future Enhancements

Potential future features:
- [ ] Dark mode themes
- [ ] Font customization
- [ ] Logo upload
- [ ] Background images for product tiles
- [ ] Animation speed preferences
- [ ] Sound theme (for button clicks, etc.)
- [ ] Preview mode in web app (see theme on mock POS UI)
- [ ] Theme templates/presets
- [ ] Export/import themes
- [ ] Theme scheduling (different themes by time of day)

## Technical Notes

### Performance
- Theme changes are instant (no page reload required)
- Theme data is cached in localStorage for offline use
- CSS custom properties have excellent browser support
- Minimal performance impact (single property updates)

### Browser Compatibility
- CSS Custom Properties: All modern browsers
- Electron (Chromium): Full support
- No IE11 support needed (Electron app only)

### Security
- Theme changes require authentication
- Permission-based access control
- SQL injection protection via parameterized queries
- XSS protection via input validation

### Scalability
- Themes stored in database, not files
- No deployment needed for theme changes
- Supports unlimited themes
- Efficient querying with indexes

## Support

For issues or questions:
1. Check this documentation first
2. Review browser console logs (`[theme-sync]` prefix)
3. Check backend logs for API errors
4. Contact development team with:
   - Screenshot of issue
   - Browser console logs
   - Steps to reproduce
