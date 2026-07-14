'use client';

import { useState, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { ProtectedPage } from '@/components/auth';
import { Palette, RotateCcw, Check, ChevronDown, ChevronUp, Paintbrush } from 'lucide-react';
import { useThemeStore, DEFAULT_PAGE_COLORS, DEFAULT_BRAND_COLOR, type PageColorEntry } from '@/lib/stores/theme-store';
import toast from 'react-hot-toast';

// ─── Inline color input that looks like a styled button ───────────────────────
function ColorSwatch({
  color,
  onChange,
}: {
  color: string;
  onChange: (c: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  return (
    <button
      type="button"
      onClick={() => ref.current?.click()}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-1"
      style={{
        backgroundColor: color,
        borderColor: 'transparent',
        color: '#ffffff',
        minWidth: 120,
        boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
      }}
    >
      <Paintbrush className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="font-mono tracking-wide">{color.toUpperCase()}</span>
      {/* hidden native picker */}
      <input
        ref={ref}
        type="color"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
        tabIndex={-1}
      />
    </button>
  );
}

// ─── Section apply-to-all picker ─────────────────────────────────────────────
function SectionColorPicker({ onApply }: { onApply: (c: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <button
      type="button"
      onClick={() => ref.current?.click()}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors hover:opacity-80"
      style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)', backgroundColor: 'var(--muted)' }}
      title="Pick one color and apply it to every page in this section"
    >
      <Paintbrush className="w-3 h-3" />
      Apply color to all
      <input
        ref={ref}
        type="color"
        defaultValue={DEFAULT_BRAND_COLOR}
        onChange={(e) => onApply(e.target.value)}
        className="sr-only"
        tabIndex={-1}
      />
    </button>
  );
}

// ─── Section accordion ────────────────────────────────────────────────────────
interface SectionGroupProps {
  section: string;
  entries: PageColorEntry[];
  colorMap: Record<string, string>;
  onColorChange: (path: string, color: string) => void;
  onResetPage: (path: string) => void;
  onApplyToAll: (color: string) => void;
}

function SectionGroup({ section, entries, colorMap, onColorChange, onResetPage, onApplyToAll }: SectionGroupProps) {
  const [expanded, setExpanded] = useState(true);
  const customCount = entries.filter((e) => (colorMap[e.path] ?? DEFAULT_BRAND_COLOR) !== DEFAULT_BRAND_COLOR).length;

  return (
    <Card>
      {/* Section header row */}
      <CardHeader className="py-3 px-5">
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2 flex-1 text-left"
            onClick={() => setExpanded((p) => !p)}
          >
            {expanded
              ? <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--muted-foreground)' }} />
              : <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--muted-foreground)' }} />}
            <CardTitle className="text-sm font-semibold">{section}</CardTitle>
            {customCount > 0 && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}
              >
                {customCount} customised
              </span>
            )}
          </button>

          {entries.length > 1 && (
            <SectionColorPicker onApply={onApplyToAll} />
          )}
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}>
                <th className="text-left px-5 py-2 text-xs font-semibold" style={{ color: 'var(--muted-foreground)', width: '40%' }}>Page</th>
                <th className="text-left px-5 py-2 text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>Accent color</th>
                <th className="px-5 py-2 text-xs font-semibold text-right" style={{ color: 'var(--muted-foreground)', width: 80 }}>Status</th>
                <th className="px-5 py-2" style={{ width: 60 }} />
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, idx) => {
                const current = colorMap[entry.path] ?? DEFAULT_BRAND_COLOR;
                const isDefault = current === DEFAULT_BRAND_COLOR;
                return (
                  <tr
                    key={entry.path}
                    style={{
                      borderBottom: idx < entries.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    {/* Page name + path */}
                    <td className="px-5 py-3">
                      <p className="font-medium" style={{ color: 'var(--foreground)' }}>{entry.label}</p>
                      <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{entry.path}</p>
                    </td>

                    {/* Color picker */}
                    <td className="px-5 py-3">
                      <ColorSwatch color={current} onChange={(c) => onColorChange(entry.path, c)} />
                    </td>

                    {/* Status badge */}
                    <td className="px-5 py-3 text-right">
                      {isDefault ? (
                        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Default</span>
                      ) : (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}
                        >
                          Custom
                        </span>
                      )}
                    </td>

                    {/* Reset button */}
                    <td className="px-4 py-3 text-right">
                      {!isDefault && (
                        <button
                          onClick={() => onResetPage(entry.path)}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: 'var(--muted-foreground)' }}
                          title="Reset to default brand red"
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)'; e.currentTarget.style.color = 'var(--foreground)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--muted-foreground)'; }}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      )}
    </Card>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function ThemeCustomizationPage() {
  const { pageColorMap, setPageColor } = useThemeStore();

  const [localMap, setLocalMap] = useState<Record<string, string>>(() => ({ ...pageColorMap }));
  const [saved, setSaved] = useState(false);

  const grouped = useMemo(() => {
    const map = new Map<string, PageColorEntry[]>();
    for (const entry of DEFAULT_PAGE_COLORS) {
      if (!map.has(entry.section)) map.set(entry.section, []);
      map.get(entry.section)!.push(entry);
    }
    return map;
  }, []);

  const customisedCount = Object.values(localMap).filter((c) => c !== DEFAULT_BRAND_COLOR).length;

  const handleColorChange = (path: string, color: string) => {
    setLocalMap((prev) => ({ ...prev, [path]: color }));
    setSaved(false);
  };

  const handleResetPage = (path: string) => {
    setLocalMap((prev) => ({ ...prev, [path]: DEFAULT_BRAND_COLOR }));
    setSaved(false);
  };

  const handleApplyToSection = (sectionEntries: PageColorEntry[], color: string) => {
    setLocalMap((prev) => {
      const next = { ...prev };
      sectionEntries.forEach((e) => { next[e.path] = color; });
      return next;
    });
    setSaved(false);
  };

  const handleResetAll = () => {
    const fresh: Record<string, string> = {};
    DEFAULT_PAGE_COLORS.forEach((e) => { fresh[e.path] = DEFAULT_BRAND_COLOR; });
    setLocalMap(fresh);
    setSaved(false);
  };

  const handleSave = () => {
    Object.entries(localMap).forEach(([path, color]) => setPageColor(path, color));
    setSaved(true);
    toast.success('Theme colours saved');
  };

  return (
    <ProtectedPage permission="theme-customization:view">
      <div className="p-6 space-y-5">

        {/* ── Page header ───────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2.5" style={{ color: 'var(--foreground)' }}>
              <Palette className="w-6 h-6 shrink-0" style={{ color: '#C8102E' }} />
              Theme Customization
            </h1>
            <p className="mt-1 text-sm max-w-xl" style={{ color: 'var(--muted-foreground)' }}>
              Choose an accent color for each page. Click any colored button to open the color picker.
              White always stays white — only the red accent changes.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="ghost" size="sm" onClick={handleResetAll} disabled={customisedCount === 0}>
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Reset all
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave}>
              {saved ? <Check className="w-3.5 h-3.5 mr-1.5" /> : null}
              {saved ? 'Saved' : 'Save changes'}
            </Button>
          </div>
        </div>

        {/* ── Summary strip ─────────────────────────────────────────────── */}
        <div
          className="rounded-xl px-5 py-3 flex items-center gap-4 flex-wrap"
          style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
            {customisedCount === 0
              ? 'All pages are using the default brand red.'
              : `${customisedCount} page${customisedCount !== 1 ? 's' : ''} customised`}
          </span>
          {customisedCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {DEFAULT_PAGE_COLORS
                .filter((e) => (localMap[e.path] ?? DEFAULT_BRAND_COLOR) !== DEFAULT_BRAND_COLOR)
                .slice(0, 10)
                .map((e) => (
                  <span
                    key={e.path}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full text-white font-medium"
                    style={{ backgroundColor: localMap[e.path] }}
                  >
                    {e.label}
                  </span>
                ))}
              {customisedCount > 10 && (
                <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  +{customisedCount - 10} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── How to use tip ────────────────────────────────────────────── */}
        <div
          className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2"
          style={{ backgroundColor: '#EFF6FF', borderLeft: '3px solid #3B82F6', color: '#1E40AF' }}
        >
          <Paintbrush className="w-4 h-4 flex-shrink-0" />
          <span>
            <strong>Tip:</strong> Click any colored button to open your system color picker. Use
            <em> Apply color to all</em> on a section header to quickly theme an entire module.
          </span>
        </div>

        {/* ── Section groups ────────────────────────────────────────────── */}
        {Array.from(grouped.entries()).map(([section, entries]) => (
          <SectionGroup
            key={section}
            section={section}
            entries={entries}
            colorMap={localMap}
            onColorChange={handleColorChange}
            onResetPage={handleResetPage}
            onApplyToAll={(color) => handleApplyToSection(entries, color)}
          />
        ))}

        {/* ── Sticky footer ─────────────────────────────────────────────── */}
        <div
          className="sticky bottom-0 py-3 flex justify-end gap-2"
          style={{ backgroundColor: 'var(--background)', borderTop: '1px solid var(--border)' }}
        >
          <Button variant="ghost" onClick={handleResetAll} disabled={customisedCount === 0}>
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Reset all to default
          </Button>
          <Button variant="primary" onClick={handleSave}>
            {saved ? <Check className="w-3.5 h-3.5 mr-1.5" /> : null}
            {saved ? 'Saved' : 'Save changes'}
          </Button>
        </div>
      </div>
    </ProtectedPage>
  );
}
