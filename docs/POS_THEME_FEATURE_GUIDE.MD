# POS Theme Customization Feature

## Overview

This feature allows administrators to customize the color scheme of POS terminals through the backend administration panel. Changes are applied dynamically to all connected POS terminals without requiring manual updates.

## Feature Components

### Backend (DMS-Backend)

#### 1. Database Entity
**File:** `DMS-Backend/Models/Entities/PosThemeConfig.cs`
- Stores theme configurations with primary/accent colors and their variants
- Supports multiple themes with one active theme at a time
- System themes are protected from deletion

#### 2. DTOs
**File:** `DMS-Backend/Models/DTOs/PosTheme/PosThemeConfigDto.cs`
- `PosThemeConfigDto` - Full theme configuration
- `CreatePosThemeConfigDto` - Create new theme
- `UpdatePosThemeConfigDto` - Partial update
- `ActivePosThemeDto` - Lightweight DTO for POS terminals

#### 3. Service Layer
**Files:**
- `DMS-Backend/Services/Interfaces/IPosThemeConfigService.cs`
- `DMS-Backend/Services/Implementations/PosThemeConfigService.cs`

**Key Methods:**
- `GetAllAsync` - List all themes with pagination
- `GetByIdAsync` - Get theme details
- `GetActiveThemeAsync` - Get currently active theme (used by POS)
- `CreateAsync` - Create new theme
- `UpdateAsync` - Update existing theme
- `DeleteAsync` - Delete theme (with validation)
- `SetActiveThemeAsync` - Activate a theme

#### 4. API Controller
**File:** `DMS-Backend/Controllers/PosThemeConfigsController.cs`

**Endpoints:**
- `GET /api/pos-theme-configs` - List themes (Admin only)
- `GET /api/pos-theme-configs/{id}` - Get theme by ID (Admin only)
- `GET /api/pos-theme-configs/active` - Get active theme (All authenticated users)
- `POST /api/pos-theme-configs` - Create theme (Admin only)
- `PUT /api/pos-theme-configs/{id}` - Update theme (Admin only)
- `DELETE /api/pos-theme-configs/{id}` - Delete theme (Admin only)
- `POST /api/pos-theme-configs/{id}/activate` - Set active theme (Admin only)

#### 5. Database Migration
**File:** `DMS-Backend/Migrations/20260513111500_AddPosThemeConfig.cs`
- Creates `pos_theme_configs` table
- Adds indexes for performance
- Seeds default "Don & Sons Default" theme

#### 6. Permissions
**Updated File:** `DMS-Backend/Data/Seeders/ComprehensivePermissionSeeder.cs`

**New Permissions:**
- `pos-theme:view` - View POS theme configurations
- `pos-theme:create` - Create POS theme configurations
- `pos-theme:edit` - Update POS theme configurations
- `pos-theme:delete` - Delete POS theme configurations

#### 7. Service Registration
**Updated File:** `DMS-Backend/Program.cs`
- Added `IPosThemeConfigService` service registration

#### 8. Database Context
**Updated File:** `DMS-Backend/Data/ApplicationDbContext.cs`
- Added `PosThemeConfigs` DbSet

#### 9. AutoMapper Profile
**File:** `DMS-Backend/Mapping/PosThemeConfigProfile.cs`
- Entity to DTO mappings

### POS Frontend (DMS-POS)

#### 1. API Client
**Updated File:** `DMS-POS/src/lib/api.ts`
- Added `fetchActivePosTheme()` function

#### 2. Settings Store
**Updated File:** `DMS-POS/src/lib/settings-store.ts`
- Added `themeColors` state
- Added `setThemeColors()` action
- Added `applyThemeColors()` to dynamically update CSS variables
- Migrated to version 4 with theme support

**CSS Variables Updated:**
- `--brand-primary`
- `--brand-primary-light`
- `--brand-primary-dark`
- `--brand-accent`
- `--brand-accent-light`
- `--brand-accent-dark`
- `--pos-header-bg`
- `--pos-header-border`
- `--cat-0` (category pill colors)
- `--cat-1`

#### 3. Theme Sync Utility
**New File:** `DMS-POS/src/lib/theme-sync.ts`
- `syncThemeFromServer()` - Fetches and applies theme from backend
- Called on app startup and reconnect

#### 4. App Integration
**Updated Files:**
- `DMS-POS/src/App.tsx` - Applies theme on mount and after login
- `DMS-POS/src/lib/use-online-status.ts` - Syncs theme when coming back online

### Admin Frontend (DMS-Frontend)

#### 1. API Client
**New File:** `DMS-Frontend/src/lib/api/pos-theme.ts`
- Complete API client for theme management
- Type-safe interfaces for all DTOs

#### 2. Theme Management Page
**New File:** `DMS-Frontend/src/app/(dashboard)/administrator/pos-theme/page.tsx`

**Features:**
- List all themes with color previews
- Create new themes with color pickers
- Edit existing themes
- Delete non-system, inactive themes
- Activate/deactivate themes
- Visual indicators for active and system themes
- Real-time color preview

**Components:**
- `ColorInput` - Color picker with visual preview
- `ThemeFormModal` - Modal form for creating/editing themes

#### 3. Permission Map
**Updated File:** `DMS-Frontend/src/lib/auth/permission-map.ts`
- Added POS Theme subsection to Administrator module

## Color Scheme Structure

Each theme consists of:

### Primary Color Set
- **Primary:** Main color for headers, primary buttons
- **Primary Light:** Lighter variant for hover states
- **Primary Dark:** Darker variant for borders, shadows

### Accent Color Set
- **Accent:** Secondary color for highlights, call-to-action
- **Accent Light:** Lighter variant
- **Accent Dark:** Darker variant

### Default Don & Sons Colors
- Primary: `#C8102E` (Red)
- Primary Light: `#E31837`
- Primary Dark: `#A00D26`
- Accent: `#FFD100` (Gold)
- Accent Light: `#FFDC33`
- Accent Dark: `#CCAA00`

## User Flow

### Administrator Workflow

1. **Access Theme Management**
   - Navigate to `Administrator → POS Theme` in the admin panel
   - Requires `pos-theme:view` permission

2. **Create New Theme**
   - Click "New Theme" button
   - Enter theme name and optional description
   - Select primary colors (main + light + dark variants)
   - Select accent colors (main + light + dark variants)
   - Set display order
   - Click "Create Theme"

3. **Edit Existing Theme**
   - Click edit icon on theme card
   - Modify colors as needed
   - Click "Update Theme"

4. **Activate Theme**
   - Click the power button icon on desired theme
   - Theme becomes active immediately
   - Previous active theme is automatically deactivated
   - All POS terminals fetch new theme on next sync

5. **Delete Theme**
   - Only non-system, inactive themes can be deleted
   - Click trash icon
   - Confirm deletion

### POS Terminal Workflow

1. **Initial Theme Load**
   - On login, POS fetches active theme from backend
   - Theme colors are applied to CSS variables
   - Changes are visible immediately

2. **Theme Updates**
   - When admin activates a new theme
   - POS terminals automatically fetch and apply it on:
     - App reconnection (coming back online)
     - Window focus (returning to app)
     - Periodic sync (every 60 seconds)

3. **Offline Behavior**
   - If theme fetch fails, POS continues with:
     - Last cached theme colors, OR
     - Default hardcoded CSS values
   - No error shown to user

## Deployment Steps

### 1. Backend Deployment

```bash
# Navigate to backend directory
cd DMS-Backend

# Stop the backend if running
# (Close terminal or stop IIS/service)

# Apply the migration
dotnet ef database update

# Start the backend
dotnet run
```

The migration will:
- Create `pos_theme_configs` table
- Add necessary indexes
- Seed the default "Don & Sons Default" theme (active)

### 2. Verify Backend

Test the API endpoints:
```bash
# Get active theme (should return default theme)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5126/api/pos-theme-configs/active

# List all themes
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5126/api/pos-theme-configs
```

### 3. Frontend Deployment

```bash
# Navigate to frontend directory
cd DMS-Frontend

# Install dependencies (if not already)
npm install

# Build for production
npm run build

# Deploy build folder to web server
```

### 4. POS Deployment

```bash
# Navigate to POS directory
cd DMS-POS

# Install dependencies (if not already)
npm install

# Build the Electron app
npm run build

# Create distributable
npm run dist

# Install on POS terminals
```

### 5. Permission Assignment

1. Log in as Super Admin
2. Navigate to `Administrator → Roles`
3. Edit the "Administrator" role (or create new role)
4. Assign POS Theme permissions:
   - ✓ View
   - ✓ Create
   - ✓ Update
   - ✓ Delete

### 6. Verification

#### Test Admin UI
1. Log in with admin account
2. Navigate to `Administrator → POS Theme`
3. Verify default theme is listed and active
4. Try creating a new theme with custom colors
5. Activate the new theme

#### Test POS Terminal
1. Log in to POS
2. Verify colors match the active theme
3. In admin panel, change active theme
4. Focus POS window (should trigger sync)
5. Verify POS colors update to new theme

## Troubleshooting

### Theme Not Applying to POS

**Symptoms:** POS shows default colors despite theme being active

**Solutions:**
1. Check browser console for API errors
2. Verify POS is online (check online/offline badge)
3. Reload POS application
4. Check backend logs for `/api/pos-theme-configs/active` endpoint
5. Verify authentication token is valid

### Cannot Delete Theme

**Symptoms:** Delete button is greyed out or shows error

**Reasons:**
- Theme is currently active (deactivate first)
- Theme is marked as system theme (cannot delete)
- User lacks `pos-theme:delete` permission

### Colors Not Updating After Theme Change

**Solutions:**
1. Wait 60 seconds for automatic sync
2. Click away from POS and back to trigger focus sync
3. Toggle offline/online to force reconnect sync
4. Restart POS application

### Migration Fails

**Error:** "Column already exists" or "Table already exists"

**Solution:**
```bash
# Check migration status
dotnet ef migrations list

# If migration already applied
# No action needed

# If migration partially applied
# Manual cleanup may be required
```

## Technical Details

### CSS Variable System

The POS uses CSS custom properties (variables) for theming:

```css
:root {
  --brand-primary: #C8102E;
  --brand-primary-light: #E31837;
  --brand-primary-dark: #A00D26;
  --brand-accent: #FFD100;
  --brand-accent-light: #FFDC33;
  --brand-accent-dark: #CCAA00;
}
```

These are dynamically updated via JavaScript:
```javascript
document.documentElement.style.setProperty('--brand-primary', '#0000FF');
```

### State Management

Theme colors are persisted in:
1. **Backend:** PostgreSQL `pos_theme_configs` table
2. **POS:** LocalStorage via Zustand persist middleware
3. **Runtime:** CSS variables on document root

### Sync Strategy

POS fetches theme in these scenarios:
1. **Initial load:** After successful login
2. **Reconnect:** Network connection restored
3. **Focus:** User returns to POS window
4. **Periodic:** Every 60 seconds while online

This ensures themes update quickly while avoiding excessive API calls.

### Security

- All theme management endpoints require authentication
- Admin-only permissions protect management operations
- Active theme endpoint available to all authenticated users
- No sensitive data in theme configuration
- System themes protected from deletion

## Future Enhancements

Potential improvements for future versions:

1. **Preview Mode**
   - Test theme before activating
   - Side-by-side comparison

2. **Per-Outlet Themes**
   - Different themes for different outlets
   - Franchise/location branding

3. **Advanced Customization**
   - Typography settings
   - Border radius
   - Shadow styles
   - Animation preferences

4. **Theme Import/Export**
   - JSON export for backup
   - Import themes from file
   - Share themes between installations

5. **Color Palette Suggestions**
   - Auto-generate variant colors
   - Accessibility checker
   - Brand color extraction from logo

## Support

For issues or questions:
1. Check backend logs: `DMS-Backend/logs/`
2. Check browser console in POS and Admin
3. Verify database migration status
4. Review permissions assignments
5. Test API endpoints directly with curl/Postman

## Summary

This feature provides a complete, production-ready solution for customizing POS terminal colors through a centralized admin panel. It requires:
- One database migration
- No manual POS configuration
- Standard permission-based access control
- Automatic synchronization to all terminals

The implementation follows existing patterns in the codebase and integrates seamlessly with the current authentication, permission, and sync systems.
