# POS Theme Customization System

## Quick Links

- 📖 **[Complete Guide](POS_THEME_CUSTOMIZATION_GUIDE.md)** - Full documentation with architecture, API, and troubleshooting
- ⚡ **[Quick Reference](POS_THEME_QUICK_REFERENCE.md)** - Fast guide for administrators
- 🎨 **[Elements Map](POS_THEME_ELEMENTS_MAP.md)** - Visual guide showing all themed elements
- 📋 **[Implementation Summary](POS_THEME_IMPLEMENTATION_SUMMARY.md)** - Technical implementation details and deployment

## What is This?

The POS Theme Customization system allows administrators to customize the visual appearance (colors) of all POS terminals through the web application. Changes are instant and synchronize automatically to all connected POS devices.

## How It Works

```
Administrator (Web App)              
     │
     │ 1. Creates/edits theme          
     │ 2. Selects colors                
     │ 3. Activates theme               
     ▼                                  
Backend API (Saves to Database)        
     │                                  
     │ Theme stored in pos_theme_configs
     │                                  
     ▼                                  
POS Desktop (Auto-sync)                
     │                                  
     │ Fetches active theme             
     │ Applies CSS colors               
     │ UI updates instantly             
     ▼                                  
All POS Terminals Updated! 🎨
```

## For Administrators

### How to Customize Your POS Colors

1. **Access Settings**
   - Log into DMS Web App
   - Go to: Settings → Administrator → POS Theme Configuration

2. **Create a Theme**
   - Click "New Theme" button
   - Enter a name (e.g., "Summer Theme")
   - Click color boxes to pick colors:
     - **Primary Color**: Main color (headers, buttons) - e.g., Red
     - **Accent Color**: Highlight color (secondary elements) - e.g., Gold
   - Click "Create Theme"

3. **Apply to All POS Terminals**
   - Click the ⚡ power button next to your theme
   - All POS terminals update within seconds!

**See:** [Quick Reference](POS_THEME_QUICK_REFERENCE.md) for detailed steps

## For Developers

### Project Structure

```
DMS-Backend/
├── Controllers/
│   └── PosThemeConfigsController.cs   # API endpoints
├── Services/
│   └── PosThemeConfigService.cs       # Business logic
├── Models/
│   ├── Entities/PosThemeConfig.cs     # Database model
│   └── DTOs/PosTheme/                 # API contracts
└── Migrations/
    └── *_AddPosThemeConfig.cs         # Database schema

DMS-Frontend/
└── src/
    ├── app/(dashboard)/administrator/
    │   └── pos-theme/page.tsx         # Admin UI
    └── lib/api/
        └── pos-theme.ts               # API client

DMS-POS/
└── src/
    ├── lib/
    │   ├── theme-sync.ts              # Fetch from backend
    │   ├── settings-store.ts          # State & CSS application
    │   └── api.ts                     # API integration
    ├── App.tsx                        # Theme initialization
    └── index.css                      # CSS custom properties
```

### Key Technologies

- **Backend**: ASP.NET Core 10, Entity Framework Core, PostgreSQL
- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **POS**: Electron, React, Zustand, Tailwind CSS
- **Styling**: CSS Custom Properties (CSS Variables)

### API Endpoints

```
GET    /api/pos-theme-configs           # List all themes
GET    /api/pos-theme-configs/{id}      # Get theme by ID
GET    /api/pos-theme-configs/active    # Get active theme (public)
POST   /api/pos-theme-configs           # Create theme
PUT    /api/pos-theme-configs/{id}      # Update theme
DELETE /api/pos-theme-configs/{id}      # Delete theme
POST   /api/pos-theme-configs/{id}/activate  # Set active
```

### Database Schema

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

### Adding New Themed Elements

1. **Define CSS Variable** (in `DMS-POS/src/index.css`):
   ```css
   :root {
     --my-button-bg: #c8102e;
   }
   ```

2. **Use in Component**:
   ```tsx
   <button className="bg-[var(--my-button-bg)]">
     Click Me
   </button>
   ```

3. **Apply Theme** (in `settings-store.ts`):
   ```typescript
   root.style.setProperty('--my-button-bg', colors.primaryColor)
   ```

**See:** [Complete Guide](POS_THEME_CUSTOMIZATION_GUIDE.md#adding-new-themeable-elements) for details

## Features

✨ **Core Features**
- Create unlimited custom themes
- Edit colors with visual color pickers
- Activate themes with one click
- Real-time synchronization to POS terminals
- Offline support (theme persists locally)
- System theme protection (cannot delete)

🎨 **Themed Elements** (30+)
- Header bar
- PAY button & action buttons
- Category pills
- Product tiles (borders, favorites, badges)
- Print button
- Operations drawer
- Sync indicators
- Modal buttons
- Focus rings
- All hover states

⚡ **Performance**
- Instant theme application (no restart)
- < 500ms total sync time
- < 10ms CSS update time
- Minimal memory footprint

## Screenshots

### Web App - Theme Configuration
```
┌─────────────────────────────────────────────────────────┐
│  🎨 POS Theme Configuration                    [+ New]  │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────┐  │
│  │ [Red] [Gold]  Don & Sons Default   ⭐ Active     │  │
│  │ Classic Don & Sons red and gold theme  [System]  │  │
│  │ Primary: #C8102E  Accent: #FFD100      [⚡][✏️]  │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ [Blue] [Cyan]  Ocean Blue Theme                  │  │
│  │ Calm blue theme for summer                       │  │
│  │ Primary: #0369A1  Accent: #06B6D4   [⚡][✏️][🗑️]│  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### POS Terminal - Themed UI
```
┌─────────────────────────────────────────────────────────┐
│ [≡] Don & Sons    [Zoom] [●] [Showroom ▼] [User ▼]    │ ← Primary color
│     Point of Sale                                        │
├─────────────┬───────────────────────────────────────────┤
│ Current Bill│ [Search...] 🔍                            │
│             │ [All] [★ Fav] [Breads] [Cakes]  ← First 2 │
│ Items: 2    │       Accent   Primary                    │
│             │ ┌────────┬────────┬────────┐              │
│ Rs 950.00   │ │ ★ Fried│  Mango │ Samosa │  ← Stars &  │
│             │ │   Rice │  Juice │ Product│    badges in │
│ [   PAY   ] │ │  [2]   │        │        │    Primary   │
│ Primary BG  │ │ Rs 950 │ Rs 300 │ Rs 120 │              │
│             │ └────────┴────────┴────────┘              │
│ [Customer]  │                                            │
│ [ Print  ]  │  ← Accent color                           │
│ [History ]  │                                            │
└─────────────┴───────────────────────────────────────────┘
```

## Common Use Cases

### Seasonal Themes
- **Summer**: Ocean Blue & Cyan
- **Autumn**: Orange & Amber
- **Winter**: Navy Blue & Silver
- **Spring**: Green & Yellow

### Brand Alignment
- Match store franchise colors
- Coordinate with marketing campaigns
- Seasonal promotions

### Special Events
- Christmas: Red & Green
- New Year: Gold & Black
- Valentine's: Pink & Red

## Troubleshooting

| Issue | Solution |
|-------|----------|
| POS not updating | Check online status, refresh cache |
| Can't delete theme | Activate another theme first |
| Colors don't match | Use hex format: #RRGGBB |
| Slow sync | Check network connection |

**See:** [Quick Reference - Troubleshooting](POS_THEME_QUICK_REFERENCE.md#troubleshooting) for more

## System Requirements

- **Backend**: .NET 10.0+, PostgreSQL 13+
- **Frontend**: Node.js 18+, Modern browser
- **POS**: Windows 10+, Electron 39+

## Installation & Setup

### Database Migration
```powershell
cd DMS-Backend
dotnet ef database update
```

### Verify Default Theme
```sql
SELECT * FROM pos_theme_configs WHERE is_system = true;
```

### Grant Permissions
Ensure admin roles have:
- `pos-theme:view`
- `pos-theme:create`
- `pos-theme:edit`
- `pos-theme:delete`

**See:** [Implementation Summary - Deployment](POS_THEME_IMPLEMENTATION_SUMMARY.md#deployment-steps)

## Testing

### Quick Test
1. Create test theme in web app
2. Set primary color to bright green (#00FF00)
3. Activate theme
4. Check POS terminal - header should turn green within 10 seconds

### Full Test Checklist
**See:** [Implementation Summary - Testing](POS_THEME_IMPLEMENTATION_SUMMARY.md#testing-checklist)

## Documentation

### For Administrators
- **[Quick Reference](POS_THEME_QUICK_REFERENCE.md)** - How to create and manage themes
- **[Elements Map](POS_THEME_ELEMENTS_MAP.md)** - What each color affects

### For Developers
- **[Customization Guide](POS_THEME_CUSTOMIZATION_GUIDE.md)** - Full technical documentation
- **[Implementation Summary](POS_THEME_IMPLEMENTATION_SUMMARY.md)** - Architecture and deployment

### Database Documentation
- **[Database Fix Summary](DATABASE_FIX_SUMMARY.md)** - Schema setup and fixes

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | May 13, 2026 | Initial release with full theme system |

## Support

For issues or questions:
1. Check documentation (links above)
2. Review console logs (`[theme-sync]`, `[theme]` prefixes)
3. Check backend logs for API errors
4. Contact development team

## License

Proprietary - Don & Sons (Pvt) Ltd

---

**Status:** ✅ Production Ready  
**Last Updated:** May 13, 2026  
**Version:** 1.0
