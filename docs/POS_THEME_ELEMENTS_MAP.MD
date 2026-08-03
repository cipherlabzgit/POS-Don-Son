# POS Theme - Themed Elements Map

## Visual Guide to Themed Elements

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [HEADER BAR - Primary Color Background]                                     │
│  ┌──────┐                                                                   │
│  │ MENU │  Don & Sons             [Zoom] [Online] [Showroom ▼] [User ▼]   │
│  └──────┘  Point of Sale                                                    │
│  Primary                                           Header text: White        │
│  Border: Primary Dark                                                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┬────────────────────────────────────────────────────────────┐
│ BILL SIDEBAR     │ CATALOG PANEL                                              │
│                  │                                                            │
│ Current Bill     │ [Search Box - Focus Ring: Primary] 🔍                     │
│                  │                                                            │
│ [Product List]   │ ┌────────┬────────┬────────┬────────┬────────┬────────┐ │
│                  │ │  All   │ ★ Fav  │ Breads │ Cakes  │ Cookies│ Drinks │ │
│  Item      Qty   │ │ Gray   │ Accent │Primary │ Green  │  Blue  │ Purple │ │
│  Fried Rice  2   │ └────────┴────────┴────────┴────────┴────────┴────────┘ │
│  [- 2 +]  [×]    │  Category Pills: First two = Brand colors                 │
│                  │                                                            │
│                  │ ┌──────────┬──────────┬──────────┬──────────┐            │
│ Total            │ │ ★        │ ★        │          │          │            │
│ Rs 950.00        │ │ Fried    │ Mango    │ Samosa   │ Butter   │            │
│                  │ │ Rice     │ Juice    │ Product  │ Croiss.. │            │
│ [PAY]            │ │          │    [2]   │          │          │            │
│ Primary BG       │ │ Rs 950   │ Rs 300   │ Rs 120   │ Rs 180   │            │
│ Primary Dark     │ └──────────┴──────────┴──────────┴──────────┘            │
│ on hover         │  Star (fav): Primary when active                          │
│                  │  Qty Badge: Primary background                             │
│ [Customer]       │  Hover Border: Primary color                               │
│ [Print]          │  Product tile border: Primary on hover                     │
│ Accent BG        │                                                            │
│ [History]        │                                                            │
│                  │                                                            │
└──────────────────┴────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ OPERATIONS DRAWER (Slide from left)                                         │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Menu                                                            [×]      │ │
│ │ Operations                                                               │ │
│ │ Primary Background                                                       │ │
│ ├─────────────────────────────────────────────────────────────────────────┤ │
│ │                                                                          │ │
│ │ DAILY TASKS                                                              │ │
│ │ ┌────────────────────────────────────────────────────────────────────┐  │ │
│ │ │ 📦 Stock BF                                                        │  │ │
│ │ │    Icon: Primary color                                             │  │ │
│ │ │    Border: Primary on hover                                        │  │ │
│ │ └────────────────────────────────────────────────────────────────────┘  │ │
│ │ ┌────────────────────────────────────────────────────────────────────┐  │ │
│ │ │ 🚚 New Transfer                                                    │  │ │
│ │ └────────────────────────────────────────────────────────────────────┘  │ │
│ │                                                                          │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ PAYMENT MODAL                                                                │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Complete Payment                                                         │ │
│ │                                                                          │ │
│ │ Total: Rs 950.00                                                         │ │
│ │                                                                          │ │
│ │ ┌──────────────────┐ ┌──────────────────┐                              │ │
│ │ │  CASH PAYMENT    │ │  CARD PAYMENT    │                              │ │
│ │ │  Primary BG      │ │  Primary BG      │                              │ │
│ │ └──────────────────┘ └──────────────────┘                              │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ SYNC POPOVER                                                                 │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ PENDING SYNC                                                             │ │
│ │                                                                          │ │
│ │ pos-sale: ×3 • retries ≤1                                                │ │
│ │ Type shown in Primary color                                              │ │
│ │                                                                          │ │
│ │ ┌──────────────────────────────────────────────────────────────────┐    │ │
│ │ │                      Sync now                                    │    │ │
│ │ │                   Primary Background                             │    │ │
│ │ └──────────────────────────────────────────────────────────────────┘    │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Theme Color Mapping

### Primary Color Applications

| Element | Usage | Notes |
|---------|-------|-------|
| Header Bar | Background | Full-width top bar |
| Header Border | Bottom border | Uses Primary Dark |
| PAY Button | Background | Large action button |
| PAY Button (hover) | Background | Uses Primary Dark |
| Category Pill #2 | Background | Second pill (after Favourites) |
| Product Hover | Border color | When hovering over product tiles |
| Favorite Star | Fill & color | When product is favorited |
| Cart Quantity Badge | Background | Circle with item count |
| Operations Icons | Icon color | Drawer menu item icons |
| Operations Hover | Border color | Menu item hover state |
| Sync Button | Background | In sync popover |
| Sync Type Label | Text color | In pending sync list |
| Focus Ring | Ring color | Keyboard navigation |
| Modal Buttons | Background | Action buttons in modals |

### Accent Color Applications

| Element | Usage | Notes |
|---------|-------|-------|
| Favourites Pill | Background | First category pill with ★ |
| Print Button | Background | Middle action button |
| Action Buttons | Various | Secondary actions |

### Combined Primary + Accent

| Element | Colors Used |
|---------|-------------|
| Category Pills | Accent (1st), Primary (2nd), then cycle through preset colors |
| Action Button Row | Print (Accent), History (Neutral) |
| Product Tiles | Star (Primary), Quantity badge (Primary) |

## CSS Variables Reference

### Applied by Theme System

These variables are dynamically set when theme changes:

```css
--brand-primary:       /* e.g., #C8102E */
--brand-primary-light: /* e.g., #E31837 */
--brand-primary-dark:  /* e.g., #A00D26 */
--brand-accent:        /* e.g., #FFD100 */
--brand-accent-light:  /* e.g., #FFDC33 */
--brand-accent-dark:   /* e.g., #CCAA00 */

/* Derived variables */
--pos-header-bg:       /* = primary */
--pos-header-border:   /* = primary-dark */
--pos-header-text:     /* = #ffffff */
--btn-primary-bg:      /* = primary */
--btn-primary-hover:   /* = primary-dark */
--btn-accent-bg:       /* = accent */
--btn-accent-hover:    /* = accent-dark */
--cat-0:               /* = accent */
--cat-1:               /* = primary */
--ring:                /* = primary */
```

### Usage in Components

```tsx
// Tailwind classes with CSS variables
<button className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)]">
  PAY
</button>

// Inline styles
<header style={{ 
  backgroundColor: 'var(--pos-header-bg)',
  borderBottom: '2px solid var(--pos-header-border)'
}}>
  ...
</header>

// Category pills
<button className={`bg-[var(--cat-0)] text-neutral-900`}>
  ★ Favourites
</button>

<button className={`bg-[var(--cat-1)] text-white`}>
  Breads
</button>
```

## Interactive State Mapping

### Hover States
- **PAY Button**: Primary → Primary Dark
- **Print Button**: Accent → Accent Dark
- **Product Tiles**: Border becomes Primary with opacity
- **Category Pills**: Slight opacity increase
- **Operations Menu Items**: Border becomes Primary

### Active/Selected States
- **Active Category**: Ring border in Primary
- **Favorite Products**: Star filled with Primary
- **Items in Cart**: Badge with Primary background

### Focus States
- **Search Input**: Ring in Primary with opacity
- **All Focusable Elements**: 2px ring in Primary

## Responsive Behavior

Themes work consistently across:
- ✅ Different screen sizes (responsive grid)
- ✅ Different zoom levels (70% - 120%)
- ✅ Touch devices (all themed elements maintain touch targets)
- ✅ Keyboard navigation (focus rings use Primary color)

## Animation Transitions

Themed elements with transitions:
- Color changes: 150ms ease
- Hover states: 100ms ease
- Button press: 80ms ease
- Focus rings: 200ms ease

All transitions respect theme colors throughout animation.

---

**Note:** This map shows all elements that respond to theme changes. For implementation details, see `POS_THEME_CUSTOMIZATION_GUIDE.md`.
