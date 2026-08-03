# POS Theme Quick Reference

## Administrator Quick Start

### Access Theme Settings
1. Log into DMS Web App
2. Go to: **Settings** → **Administrator** → **POS Theme Configuration**

### Create New Theme (3 Steps)
1. Click **"New Theme"** button
2. Enter theme name and select colors using color pickers
3. Click **"Create Theme"**

### Apply Theme to All POS Terminals
- Click the ⚡ **power icon** next to any theme
- Theme activates immediately across all POS terminals (when online)

### Edit Existing Theme
- Click ✏️ **edit icon** → Modify colors → Click **"Update Theme"**

### Delete Theme
- Click 🗑️ **trash icon** → Confirm deletion
- **Note:** Cannot delete active theme or system themes

## Color Guide

### Primary Color (Red tones recommended)
- **Used For:** Header, main buttons, category pills, focus rings
- **Example:** `#C8102E` (Don & Sons Red)

### Accent Color (Gold/Yellow tones recommended)
- **Used For:** Favourites category, Print button, highlights
- **Example:** `#FFD100` (Don & Sons Gold)

### Light & Dark Variants
- **Light:** Hover effects and subtle highlights
- **Dark:** Borders, shadows, pressed states
- **Tip:** Leave empty to use auto-generated defaults

## What Gets Themed?

| Element | Color Source |
|---------|-------------|
| Header Bar | Primary |
| PAY Button | Primary |
| Category Pills (1st two) | Accent & Primary |
| Star Favorites | Primary |
| Product Hover Borders | Primary |
| Print Button | Accent |
| Cart Quantity Badges | Primary |
| Sync Button | Primary |
| Focus Rings | Primary |
| Menu Headers | Primary |

## Common Themes

### Classic Red & Gold (Default)
```
Primary: #C8102E (Red)
Accent:  #FFD100 (Gold)
```

### Ocean Blue
```
Primary: #0369A1 (Deep Blue)
Accent:  #06B6D4 (Cyan)
```

### Forest Green
```
Primary: #15803D (Forest Green)
Accent:  #FDE047 (Yellow)
```

### Royal Purple
```
Primary: #7C3AED (Purple)
Accent:  #F472B6 (Pink)
```

### Sunset Orange
```
Primary: #EA580C (Orange)
Accent:  #FBBF24 (Amber)
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| POS not showing new theme | Check POS is online (green badge), wait 10 seconds, or click Refresh cache |
| Cannot delete theme | Make sure theme is not active; activate another theme first |
| Colors don't match expectation | Use hex format only: #RRGGBB (e.g., #C8102E) |
| Theme changes too slow | Check network connection; manually refresh from POS |

## Best Practices

✅ **DO:**
- Use contrasting colors (dark primary + light accent, or vice versa)
- Test theme before activating during business hours
- Keep primary color dark enough for white text
- Name themes descriptively (e.g., "Summer Beach", not "Theme 1")

❌ **DON'T:**
- Use very light colors for primary (white text won't be readable)
- Change active theme during peak hours without testing
- Delete themes without backup (recreate if needed)
- Use similar primary and accent colors (reduces contrast)

## Quick Tips

💡 **Pro Tips:**
1. Create multiple themes for different seasons/events
2. Primary color should work well with white text
3. Accent color should stand out but not clash
4. Light variants should be 10-20% lighter than base
5. Dark variants should be 10-20% darker than base
6. Test on actual POS hardware before activating

## Emergency Rollback

If a theme causes issues:
1. Go to POS Theme Configuration
2. Click ⚡ on "Don & Sons Default" theme
3. System theme will restore default colors
4. All POS terminals update within seconds

## Need Help?

- 📖 Full Documentation: `POS_THEME_CUSTOMIZATION_GUIDE.md`
- 🔧 Technical Issues: Check browser console (F12) for errors
- 💬 Support: Contact development team

---

**Last Updated:** May 13, 2026  
**Version:** 1.0
