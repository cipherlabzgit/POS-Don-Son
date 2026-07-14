# Don & Sons DMS - Frontend

> Comprehensive Delivery Management System for Don & Sons (Pvt) Ltd

## 🎯 Overview

This is the frontend application for Don & Sons Delivery Management System, built with Next.js 14, TypeScript, and Tailwind CSS. The system manages bakery production, delivery operations, inventory, and administration with a mobile-responsive, brand-themed interface.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The app will be available at [http://localhost:3000](http://localhost:3000)

## 📦 Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **State Management:** Zustand
- **Data Fetching:** TanStack Query (React Query)
- **HTTP Client:** Axios
- **Forms:** React Hook Form + Zod
- **Charts:** Recharts
- **Icons:** Lucide React

## 🎨 Brand Theme

### Colors

The application uses Don & Sons brand colors:

- **Primary Red:** `#C8102E` - Main brand color from logo
- **Accent Yellow:** `#FFD100` - Secondary brand color
- **White:** Text on dark backgrounds

### Per-Page Color Coding

Each module page can have its own accent color (configurable by admin):
- Sidebar active highlights
- Table headers
- Action buttons
- Navigation selection

## 🏗️ Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication pages
│   │   ├── login/
│   │   └── layout.tsx
│   ├── (dashboard)/              # Protected dashboard pages
│   │   ├── dashboard/
│   │   ├── inventory/            # Inventory module
│   │   ├── showroom/             # Showroom management
│   │   ├── operation/            # Operations module
│   │   ├── reports/              # Reports module
│   │   ├── administrator/        # Administrator module
│   │   ├── production/           # Production module
│   │   ├── theme-test/           # Theme testing page
│   │   └── layout.tsx
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles
├── components/
│   ├── layout/                   # Layout components
│   │   ├── sidebar.tsx           # Navigation sidebar
│   │   └── header.tsx            # Top header
│   ├── ui/                       # Reusable UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── badge.tsx
│   └── dashboard/                # Dashboard widgets
├── lib/
│   ├── theme/                    # Theme system
│   │   ├── colors.ts             # Brand colors
│   │   └── theme-context.tsx    # Theme provider
│   ├── navigation/               # Navigation config
│   │   └── menu-items.ts        # Menu structure
│   ├── stores/                   # Zustand stores
│   │   └── auth-store.ts
│   └── api/                      # API clients
│       ├── client.ts
│       └── auth.ts
└── middleware.ts                 # Auth middleware
```

## 🧭 Navigation Structure

### Main Modules

1. **Dashboard** - Overview with charts and metrics
2. **Inventory**
   - Products (470+ items)
   - Category (25 categories)
   - Unit of Measure
   - Ingredient (127 items)
3. **Show Room** - Outlet management (30 showrooms)
4. **Operation**
   - Delivery
   - Disposal
   - Transfer
   - Stock BF
   - Cancellation
   - Delivery Return
   - Label Printing
   - Showroom Open Stock
   - Showroom Label Printing
5. **Reports** - Various business reports
6. **Administrator**
   - Day-End Process
   - Cashier Balance
   - System Settings
   - Label Settings
   - Delivery Plan
   - Security (Users & Roles)
   - Day Lock
   - Approvals
   - Showroom Employee
   - Price Manager
   - WorkFlow Config
7. **Production**
   - Daily Production
   - Production Cancel
   - Current Stock
   - Stock Adjustment
   - Stock Adjustment Approval
   - Production Plan

## 🎭 Theme System

### Using the Theme

```tsx
import { useTheme } from '@/lib/theme/theme-context';

function MyComponent() {
  const { pageColor, setPageColor, resetToDefault } = useTheme();
  
  return (
    <div style={{ backgroundColor: pageColor }}>
      {/* Content */}
    </div>
  );
}
```

### Brand Colors

```tsx
import { brandColors } from '@/lib/theme/colors';

// Primary red
brandColors.primary.DEFAULT  // #C8102E

// Accent yellow
brandColors.accent.DEFAULT   // #FFD100

// Status colors
brandColors.status.success   // Green
brandColors.status.warning   // Orange
brandColors.status.error     // Red
brandColors.status.info      // Blue
```

## 🧩 UI Components

### Button

```tsx
import Button from '@/components/ui/button';

<Button variant="primary" size="md" onClick={handleClick}>
  Click Me
</Button>

// Variants: primary, secondary, accent, danger, ghost, outline
// Sizes: sm, md, lg
```

### Card

```tsx
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';

<Card padding="md" hover>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
  <CardFooter>
    Footer content
  </CardFooter>
</Card>
```

### Badge

```tsx
import { Badge } from '@/components/ui/badge';

<Badge variant="success" size="md">Approved</Badge>

// Variants: primary, success, warning, danger, info, neutral
// Sizes: sm, md, lg
```

## 📱 Responsive Design

The application is fully responsive:

- **Mobile:** 320px - 767px
- **Tablet:** 768px - 1023px
- **Desktop:** 1024px+
- **Large Desktop:** 1920px+

### Features
- Collapsible sidebar on desktop
- Mobile-friendly drawer navigation
- Touch-optimized controls
- Adaptive layouts

## 🔐 Authentication

Authentication is handled via JWT tokens with refresh token mechanism:

```tsx
import { useAuthStore } from '@/lib/stores/auth-store';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuthStore();
  
  // User info
  console.log(user.firstName, user.lastName);
  console.log(user.isSuperAdmin);
  
  // Check permissions
  const canView = user?.isSuperAdmin || hasPermission('products.view');
}
```

## 🎯 Permission-Based Navigation

Navigation items are automatically filtered based on user permissions:

```tsx
// In menu-items.ts
{
  name: 'Products',
  href: '/inventory/products',
  icon: Package,
  permission: 'inventory.products.view', // Optional permission check
}
```

## 🧪 Testing the Theme

Visit `/theme-test` to test:
- Theme color switching
- Button variants
- Badge components
- Card layouts
- Responsive design

## 📝 Key Implementation Details

### Soft Delete Pattern
All records use an `Active` status flag instead of hard deletes:
```tsx
// Never permanently delete
record.active = false;  // Soft delete
```

### Per-Page Theming
Each page can have a custom accent color:
```tsx
// Set page color (usually from admin settings)
setPageColor('#C8102E');  // Red for delivery page
setPageColor('#10B981');  // Green for production page
```

### Role-Based Access
Navigation and features are filtered by user role:
```tsx
// Only show if user has permission or is super admin
if (user?.isSuperAdmin || hasPermission('operation.delivery.view')) {
  // Show delivery page
}
```

## 🔧 Development Guidelines

### Adding a New Page

1. Create page in appropriate module folder:
   ```tsx
   // src/app/(dashboard)/inventory/products/page.tsx
   export default function ProductsPage() {
     return <div>Products</div>;
   }
   ```

2. Add to navigation (if needed):
   ```tsx
   // src/lib/navigation/menu-items.ts
   {
     name: 'Products',
     href: '/inventory/products',
     icon: Package,
     permission: 'inventory.products.view',
   }
   ```

3. Use theme context:
   ```tsx
   import { useTheme } from '@/lib/theme/theme-context';
   const { pageColor } = useTheme();
   ```

### Creating a New Component

```tsx
// components/ui/my-component.tsx
import { useTheme } from '@/lib/theme/theme-context';

interface MyComponentProps {
  title: string;
}

export function MyComponent({ title }: MyComponentProps) {
  const { pageColor } = useTheme();
  
  return (
    <div style={{ borderColor: pageColor }}>
      {title}
    </div>
  );
}
```

## 🚧 Upcoming Features

- [ ] Data table component with pagination
- [ ] Date picker with yellow highlight for special cases
- [ ] Form components with validation
- [ ] Modal/Dialog components
- [ ] Toast notifications
- [ ] Loading states and skeletons
- [ ] Dashboard widgets with charts
- [ ] Report generation interface

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev)
- [React Hook Form](https://react-hook-form.com)
- [Zustand](https://zustand-demo.pmnd.rs)

## 🤝 Contributing

1. Follow the existing code structure
2. Use TypeScript for all new files
3. Maintain responsive design patterns
4. Test on mobile and desktop
5. Use brand colors from theme system
6. Add comments for complex logic

## 📄 License

Proprietary - Don & Sons (Pvt) Ltd

---

**Built with ❤️ by Cipher Labz**
