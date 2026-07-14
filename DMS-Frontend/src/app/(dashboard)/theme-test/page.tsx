'use client';

import { useTheme } from '@/lib/theme/theme-context';
import { brandColors } from '@/lib/theme/colors';
import Button from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Palette, Check } from 'lucide-react';

export default function ThemeTestPage() {
  const { pageColor, setPageColor, resetToDefault } = useTheme();

  const testColors = [
    { name: 'Primary Red (Default)', color: brandColors.primary.DEFAULT },
    { name: 'Accent Yellow', color: brandColors.accent.DEFAULT },
    { name: 'Red Light', color: brandColors.primary.light },
    { name: 'Success Green', color: brandColors.status.success },
    { name: 'Warning Orange', color: brandColors.status.warning },
    { name: 'Error Red', color: brandColors.status.error },
    { name: 'Info Blue', color: brandColors.status.info },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Theme System Test</h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Testing Don & Sons brand theme and per-page color coding
          </p>
        </div>
        <Button variant="outline" onClick={resetToDefault}>
          Reset to Default
        </Button>
      </div>

      {/* Current Theme Display */}
      <Card>
        <CardHeader>
          <CardTitle>Current Page Color</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div
              className="w-24 h-24 rounded-lg shadow-md"
              style={{ 
                backgroundColor: pageColor,
                border: '2px solid #E5E7EB'
              }}
            ></div>
            <div>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Hex Color Code</p>
              <p className="text-2xl font-mono font-bold" style={{ color: 'var(--foreground)' }}>{pageColor}</p>
              <p className="text-xs mt-2" style={{ color: 'var(--muted-foreground)' }}>
                This color is applied to sidebar highlights, buttons, and active states
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Color Selector */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Palette className="w-5 h-5" />
            <CardTitle>Change Page Color</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
            Click any color below to see the theme change. Notice how the sidebar active
            state, buttons, and other accents update automatically.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {testColors.map((item) => (
              <button
                key={item.color}
                onClick={() => setPageColor(item.color)}
                className="p-4 rounded-lg transition-all hover:shadow-md"
                style={{
                  border: pageColor === item.color ? '2px solid #111827' : '2px solid #E5E7EB',
                  outline: pageColor === item.color ? '2px solid #111827' : 'none',
                  outlineOffset: pageColor === item.color ? '2px' : '0',
                }}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-12 h-12 rounded-lg shadow-sm"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{item.name}</p>
                    <p className="text-xs font-mono" style={{ color: 'var(--muted-foreground)' }}>{item.color}</p>
                  </div>
                  {pageColor === item.color && (
                    <Check className="w-5 h-5" style={{ color: 'var(--foreground)' }} />
                  )}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Button Variants */}
      <Card>
        <CardHeader>
          <CardTitle>Button Components</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>Variants</p>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Primary Button</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="accent">Accent</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="outline">Outline</Button>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>Sizes</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>States</p>
            <div className="flex flex-wrap gap-3">
              <Button disabled>Disabled</Button>
              <Button isLoading>Loading...</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Badge Components */}
      <Card>
        <CardHeader>
          <CardTitle>Badge Components</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>Variants</p>
              <div className="flex flex-wrap gap-3">
                <Badge variant="primary">Primary</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="danger">Danger</Badge>
                <Badge variant="info">Info</Badge>
                <Badge variant="neutral">Neutral</Badge>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>Sizes</p>
              <div className="flex flex-wrap items-center gap-3">
                <Badge size="sm">Small</Badge>
                <Badge size="md">Medium</Badge>
                <Badge size="lg">Large</Badge>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>Status Examples</p>
              <div className="flex flex-wrap gap-3">
                <Badge variant="success">Approved</Badge>
                <Badge variant="warning">Pending</Badge>
                <Badge variant="danger">Rejected</Badge>
                <Badge variant="info">In Progress</Badge>
                <Badge variant="neutral">Draft</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card Variants */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card padding="sm">
          <CardTitle>Small Padding</CardTitle>
          <CardContent className="mt-2">
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Card with small padding for compact layouts.
            </p>
          </CardContent>
        </Card>

        <Card padding="md">
          <CardTitle>Medium Padding</CardTitle>
          <CardContent className="mt-2">
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Card with medium padding (default).
            </p>
          </CardContent>
        </Card>

        <Card padding="lg" hover>
          <CardTitle>Large Padding + Hover</CardTitle>
          <CardContent className="mt-2">
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Card with large padding and hover effect.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start space-x-3">
            <div 
              className="flex-shrink-0 w-6 h-6 rounded-full text-white flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: pageColor }}
            >
              1
            </div>
            <p className="text-sm" style={{ color: 'var(--foreground)' }}>
              Click on different colors above to change the page theme. Notice how the
              sidebar active state updates automatically.
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <div 
              className="flex-shrink-0 w-6 h-6 rounded-full text-white flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: pageColor }}
            >
              2
            </div>
            <p className="text-sm" style={{ color: 'var(--foreground)' }}>
              Navigate to different pages in the sidebar. Each page can have its own color
              (configured by admin in Label Settings).
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <div 
              className="flex-shrink-0 w-6 h-6 rounded-full text-white flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: pageColor }}
            >
              3
            </div>
            <p className="text-sm" style={{ color: 'var(--foreground)' }}>
              Test the responsive design by resizing your browser window. The layout should
              adapt from 320px (mobile) to 1920px (desktop).
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <div 
              className="flex-shrink-0 w-6 h-6 rounded-full text-white flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: pageColor }}
            >
              4
            </div>
            <p className="text-sm" style={{ color: 'var(--foreground)' }}>
              On mobile, click the menu icon to open the sidebar. Test the expandable menu
              items (Inventory, Operation, Administrator, Production).
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            All components use the brand colors and respond to theme changes automatically.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
