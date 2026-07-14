'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Save, Printer, Loader2, AlertCircle,
  Trash2, Type, Minus, Square, RefreshCw, Code2, Copy, Download,
  Barcode as BarcodeIcon, ChevronRight, X, SlidersHorizontal, Plus, ZoomIn, ZoomOut
} from 'lucide-react';
import { labelTemplatesApi, type CreateLabelTemplateDto, type UpdateLabelTemplateDto } from '@/lib/api/label-templates';
import toast from 'react-hot-toast';

// ─── Constants ─────────────────────────────────────────────────────────────────
const DPMM = 8; // Dots per mm (standard for 203dpi/203.2dpi)


const LABEL_PRESETS = [
  { label: '100 × 50 mm',  w: 100, h: 50  },
  { label: '100 × 75 mm',  w: 100, h: 75  },
  { label: '75 × 40 mm',   w: 75,  h: 40  },
  { label: '60 × 40 mm',   w: 60,  h: 40  },
  { label: '50 × 30 mm',   w: 50,  h: 30  },
  { label: 'Custom',        w: 0,   h: 0   },
];

const VARIABLES = [
  { label: 'Product Name',  value: '{{product_name}}',  example: 'Chocolate Cake'       },
  { label: 'Product Code',  value: '{{product_code}}',  example: 'CC-001'               },
  { label: 'Barcode',       value: '{{barcode}}',       example: '9771234567890'        },
  { label: 'Category',      value: '{{category}}',      example: 'Cakes'               },
  { label: 'Unit',          value: '{{uom}}',           example: 'PCS'                 },
  { label: 'Price',         value: '{{price}}',         example: 'Rs. 350.00'          },
  { label: 'MRP',           value: '{{mrp}}',           example: 'Rs. 400.00'          },
  { label: 'Price List',    value: '{{price_list}}',    example: 'Retail 2026'         },
  { label: 'Print Date',    value: '{{print_date}}',    example: '2026-01-11'          },
  { label: 'Display No.',   value: '{{display_no}}',    example: 'LBL00135772'         },
  { label: 'Company',       value: '{{company_name}}',  example: "Don & Sons (Pvt) Ltd"},
  { label: 'Outlet',        value: '{{outlet}}',        example: 'Colombo Showroom'    },
];

const FONT_SIZES: { label: string; mm: number }[] = [
  { label: 'XS',  mm: 2   },
  { label: 'S',   mm: 3   },
  { label: 'M',   mm: 4.5 },
  { label: 'L',   mm: 6   },
  { label: 'XL',  mm: 9   },
  { label: 'XXL', mm: 14  },
];

// ─── Types ─────────────────────────────────────────────────────────────────────
type ElType = 'text' | 'barcode' | 'line' | 'box';

interface El {
  id: string;
  type: ElType;
  xMm: number;
  yMm: number;
  // text / barcode
  content?: string;
  fontMm?: number;
  // barcode
  barHeightMm?: number;
  showHri?: boolean;
  // line / box
  widthMm?: number;
  heightMm?: number;
  thickMm?: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
let _id = 1;
const uid = () => String(_id++);

function mm2d(mm: number) { return Math.round(mm * DPMM); }

function resolveExamples(t: string) {
  let o = t;
  for (const v of VARIABLES) o = o.replaceAll(v.value, v.example);
  return o;
}

function buildZpl(els: El[], wMm: number, hMm: number) {
  let z = `^XA\n^PW${mm2d(wMm)}\n^LL${mm2d(hMm)}\n`;
  for (const e of els) {
    const x = mm2d(e.xMm), y = mm2d(e.yMm);
    z += `^FO${x},${y}`;
    if (e.type === 'text') {
      const fh = mm2d(e.fontMm ?? 4.5);
      z += `^A0N,${fh},${fh}^FD${e.content ?? ''}^FS\n`;
    } else if (e.type === 'barcode') {
      const bh = mm2d(e.barHeightMm ?? 12), hri = e.showHri ? 'Y' : 'N';
      z += `^BY2^BCN,${bh},${hri},N,N^FD${e.content ?? ''}^FS\n`;
    } else if (e.type === 'line') {
      const w = mm2d(e.widthMm ?? 30), t = mm2d(e.thickMm ?? 0.5);
      z += `^GB${w},${t},${t}^FS\n`;
    } else if (e.type === 'box') {
      const w = mm2d(e.widthMm ?? 30), h = mm2d(e.heightMm ?? 15), t = mm2d(e.thickMm ?? 0.5);
      z += `^GB${w},${h},${t}^FS\n`;
    }
  }
  return z + '^XZ';
}

function defaultEl(type: ElType, count: number): El {
  const y = 4 + count * 8;
  switch (type) {
    case 'text':    return { id: uid(), type, xMm: 4, yMm: y, content: '{{product_name}}', fontMm: 4.5 };
    case 'barcode': return { id: uid(), type, xMm: 4, yMm: y, content: '{{barcode}}', barHeightMm: 12, showHri: true };
    case 'line':    return { id: uid(), type, xMm: 4, yMm: y, widthMm: 40, thickMm: 0.5 };
    case 'box':     return { id: uid(), type, xMm: 4, yMm: y, widthMm: 40, heightMm: 15, thickMm: 0.5 };
  }
}

function parseZpl(zpl: string): El[] {
  const els: El[] = [];
  let cx = 0, cy = 0;
  for (const raw of zpl.split('\n')) {
    const l = raw.trim();
    const fo = l.match(/\^FO(\d+),(\d+)/);
    if (fo) { cx = parseInt(fo[1]); cy = parseInt(fo[2]); }
    const txt = l.match(/\^A0N,(\d+),\d*\^FD(.*?)\^FS/);
    if (txt) { els.push({ id: uid(), type: 'text', xMm: cx/DPMM, yMm: cy/DPMM, fontMm: parseInt(txt[1])/DPMM, content: txt[2] }); continue; }
    const bc = l.match(/\^BCN,(\d+),(Y|N),N,N\^FD(.*?)\^FS/);
    if (bc) { els.push({ id: uid(), type: 'barcode', xMm: cx/DPMM, yMm: cy/DPMM, barHeightMm: parseInt(bc[1])/DPMM, showHri: bc[2]==='Y', content: bc[3] }); continue; }
    const gb = l.match(/\^GB(\d+),(\d+),(\d+)\^FS/);
    if (gb) {
      const [w,h,t] = [parseInt(gb[1]),parseInt(gb[2]),parseInt(gb[3])];
      if (h <= t+2) els.push({ id: uid(), type: 'line', xMm: cx/DPMM, yMm: cy/DPMM, widthMm: w/DPMM, thickMm: t/DPMM });
      else els.push({ id: uid(), type: 'box', xMm: cx/DPMM, yMm: cy/DPMM, widthMm: w/DPMM, heightMm: h/DPMM, thickMm: t/DPMM });
    }
  }
  return els;
}

function n2(n: number) { return Math.round(n * 10) / 10; }

// ─── Element colours ───────────────────────────────────────────────────────────
const EL_COLOR: Record<ElType, string>  = { text: '#2563EB', barcode: '#7C3AED', line: '#D97706', box: '#059669' };
const EL_BG:    Record<ElType, string>  = { text: '#EFF6FF', barcode: '#F5F3FF', line: '#FFFBEB', box: '#F0FDF4' };
const EL_LABEL: Record<ElType, string>  = { text: 'Text',   barcode: 'Barcode', line: 'Line',   box: 'Box'  };

function ElIcon({ type, size = 14 }: { type: ElType; size?: number }) {
  const s = { width: size, height: size };
  if (type === 'text')    return <Type style={s} />;
  if (type === 'barcode') return <BarcodeIcon style={s} />;
  if (type === 'line')    return <Minus style={s} />;
  return <Square style={s} />;
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function ZplDesigner({ mode, templateId }: { mode: 'add'|'edit'; templateId?: string }) {
  const router = useRouter();

  // ── Step 1: label size ────────────────────────────────────────────────────
  const [step, setStep]           = useState<1|2>(1);
  const [wMm, setWMm]             = useState(100);
  const [hMm, setHMm]             = useState(50);
  const [preset, setPreset]       = useState(0);

  // ── Step 2: elements & selection ─────────────────────────────────────────
  const [els, setEls]             = useState<El[]>([]);
  const [selId, setSelId]         = useState<string|null>(null);
  const sel = els.find(e => e.id === selId) ?? null;

  // ── Zoom state ────────────────────────────────────────────────────────────
  const [zoom, setZoom]           = useState(3);

  // ── Template metadata ─────────────────────────────────────────────────────
  const [code, setCode]           = useState('');
  const [tname, setTname]         = useState('');
  const [desc, setDesc]           = useState('');
  const [ttype, setTtype]         = useState('Product');
  const [isDefault, setIsDefault] = useState(false);
  const [isActive, setIsActive]   = useState(true);

  // ── Preview ───────────────────────────────────────────────────────────────
  const [prevUrl, setPrevUrl]     = useState<string|null>(null);
  const [prevErr, setPrevErr]     = useState('');
  const [preving, setPreving]     = useState(false);
  const prevTimer                 = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // ── Drag state ────────────────────────────────────────────────────────────
  const dragRef   = useRef<{ id: string; ox: number; oy: number }|null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // ── UI ────────────────────────────────────────────────────────────────────
  const [loading, setLoading]     = useState(mode === 'edit');
  const [saving, setSaving]       = useState(false);
  const [showZpl, setShowZpl]     = useState(false);
  const [showProperties, setShowProperties] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Close properties on Escape
      if (e.key === 'Escape') setShowProperties(false);

      // Arrow keys for movement
      if (selId && sel && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) {
        const stepSize = e.shiftKey ? 2 : 0.5;
        if (e.key === 'ArrowLeft')  { e.preventDefault(); upd(selId, { xMm: Math.max(0, n2(sel.xMm - stepSize)) }); }
        if (e.key === 'ArrowRight') { e.preventDefault(); upd(selId, { xMm: Math.min(wMm, n2(sel.xMm + stepSize)) }); }
        if (e.key === 'ArrowUp')    { e.preventDefault(); upd(selId, { yMm: Math.max(0, n2(sel.yMm - stepSize)) }); }
        if (e.key === 'ArrowDown')  { e.preventDefault(); upd(selId, { yMm: Math.min(hMm, n2(sel.yMm + stepSize)) }); }
        if (e.key === 'Delete' || e.key === 'Backspace') {
          removeEl(selId);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selId, sel, wMm, hMm, showProperties]);

  // ── Load existing template ─────────────────────────────────────────────────
  useEffect(() => {
    if (mode === 'edit' && templateId) loadTpl();
  }, []);

  async function loadTpl() {
    try {
      setLoading(true);
      const t = await labelTemplatesApi.getById(templateId!);
      setCode(t.code); setTname(t.name); setDesc(t.description||''); setTtype(t.templateType||'Product');
      setIsDefault(t.isDefault); setIsActive(t.isActive);
      setWMm(t.widthMm); setHMm(t.heightMm);
      setPreset(5); // custom
      if (t.layoutDesign) { const p = parseZpl(t.layoutDesign); if (p.length) { setEls(p); setStep(2); } }
    } catch { toast.error('Failed to load template'); router.push('/administrator/label-templates'); }
    finally { setLoading(false); }
  }

  // ── Auto-preview ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (step !== 2) return;
    clearTimeout(prevTimer.current);
    prevTimer.current = setTimeout(doPreview, 900);
    return () => clearTimeout(prevTimer.current);
  }, [els, wMm, hMm, step]);

  const doPreview = useCallback(async () => {
    if (els.length === 0) { setPrevUrl(null); setPrevErr(''); return; }
    setPreving(true); setPrevErr('');
    try {
      if (prevUrl) URL.revokeObjectURL(prevUrl);
      const url = await labelTemplatesApi.zplPreview(resolveExamples(buildZpl(els, wMm, hMm)), wMm, hMm, 10);
      setPrevUrl(url);
    } catch (e: any) { setPrevErr(e?.response?.data?.message ?? 'Preview failed'); setPrevUrl(null); }
    finally { setPreving(false); }
  }, [els, wMm, hMm]);

  // ── Drag ──────────────────────────────────────────────────────────────────
  function onDragStart(e: React.MouseEvent, id: string) {
    e.preventDefault();
    const el = els.find(x => x.id === id)!;
    dragRef.current = { id, ox: e.clientX - el.xMm * zoom, oy: e.clientY - el.yMm * zoom };
    setSelId(id);
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!dragRef.current) return;
    const { id, ox, oy } = dragRef.current;
    const xMm = Math.max(0, Math.min(wMm - 2, (e.clientX - ox) / zoom));
    const yMm = Math.max(0, Math.min(hMm - 2, (e.clientY - oy) / zoom));
    setEls(prev => prev.map(el => el.id === id ? { ...el, xMm: n2(xMm), yMm: n2(yMm) } : el));
  }

  function onMouseUp() { dragRef.current = null; }

  // ── Update / add / remove ─────────────────────────────────────────────────
  function upd(id: string, patch: Partial<El>) {
    setEls(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
  }
  function addEl(type: ElType) {
    const el = defaultEl(type, els.length);
    setEls(prev => [...prev, el]);
    setSelId(el.id);
    setShowProperties(true);
  }
  function removeEl(id: string) {
    setEls(prev => prev.filter(e => e.id !== id));
    if (selId === id) setSelId(null);
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  async function save() {
    if (!code.trim() || !tname.trim()) { toast.error('Code and Name are required'); return; }
    const payload: CreateLabelTemplateDto = {
      code, name: tname, description: desc, templateType: ttype,
      widthMm: wMm, heightMm: hMm, layoutDesign: buildZpl(els, wMm, hMm),
      fields: null, fontSettings: null, sortOrder: 0, isDefault, isActive,
    };
    try {
      setSaving(true);
      if (mode === 'add') await labelTemplatesApi.create(payload);
      else await labelTemplatesApi.update(templateId!, payload as UpdateLabelTemplateDto);
      toast.success(mode === 'add' ? 'Template created!' : 'Template saved!');
      router.push('/administrator/label-templates');
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'Save failed'); }
    finally { setSaving(false); }
  }

  function downloadZpl() {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([buildZpl(els, wMm, hMm)], { type: 'text/plain' }));
    a.download = `${code || 'label'}.zpl`; a.click();
  }

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="w-10 h-10 animate-spin" style={{ color: '#C8102E' }} />
    </div>
  );

  const zpl = buildZpl(els, wMm, hMm);

  // ════════════════════════════════════════════════════════════════════════════
  //  STEP 1 — Pick label size
  // ════════════════════════════════════════════════════════════════════════════
  if (step === 1) return (
    <div className="min-h-screen flex flex-col items-center justify-start px-6 py-6 sm:px-8 sm:pt-8 sm:pb-10"
      style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-2xl">
        {/* Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: '#FFF1F2' }}>
            <Printer className="w-7 h-7" style={{ color: '#C8102E' }} />
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
            {mode === 'add' ? 'Create New Label Template' : 'Edit Label Template'}
          </h1>
          <p style={{ color: 'var(--muted-foreground)' }}>
            First, choose the size of your label
          </p>
        </div>

        {/* Size presets */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {LABEL_PRESETS.filter(p => p.w > 0).map((p, i) => (
            <button key={i} onClick={() => { setPreset(i); setWMm(p.w); setHMm(p.h); }}
              className="rounded-xl p-4 border-2 text-left transition-all"
              style={{
                borderColor: preset === i ? '#C8102E' : 'var(--border)',
                background: preset === i ? '#FFF1F2' : 'var(--card)',
              }}>
              {/* Mini label preview */}
              <div className="flex items-center justify-center mb-3">
                <div className="rounded border-2 flex items-center justify-center"
                  style={{
                    width:  Math.round(p.w * 0.8),
                    height: Math.round(p.h * 0.8),
                    borderColor: preset === i ? '#C8102E' : '#CBD5E1',
                    background: 'white',
                    minWidth: 40, minHeight: 24,
                    maxWidth: 96, maxHeight: 64,
                  }}>
                  <div className="w-2/3 h-1 rounded-full" style={{ background: preset === i ? '#C8102E' : '#CBD5E1' }} />
                </div>
              </div>
              <div className="font-semibold text-sm" style={{ color: preset === i ? '#C8102E' : 'var(--foreground)' }}>
                {p.label}
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                {p.w} × {p.h} mm
              </div>
            </button>
          ))}
          {/* Custom */}
          <button onClick={() => setPreset(5)}
            className="rounded-xl p-4 border-2 text-left transition-all"
            style={{
              borderColor: preset === 5 ? '#C8102E' : 'var(--border)',
              background: preset === 5 ? '#FFF1F2' : 'var(--card)',
            }}>
            <div className="flex items-center justify-center mb-3">
              <div className="rounded border-2 border-dashed flex items-center justify-center"
                style={{ width: 56, height: 36, borderColor: preset === 5 ? '#C8102E' : '#CBD5E1', background: 'white' }}>
                <span className="text-lg" style={{ color: preset === 5 ? '#C8102E' : '#CBD5E1' }}>?</span>
              </div>
            </div>
            <div className="font-semibold text-sm" style={{ color: preset === 5 ? '#C8102E' : 'var(--foreground)' }}>
              Custom Size
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Enter your own</div>
          </button>
        </div>

        {/* Custom inputs */}
        {preset === 5 && (
          <div className="rounded-xl p-4 mb-6 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <p className="text-sm font-medium mb-3" style={{ color: 'var(--foreground)' }}>Enter custom label size</p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Width (mm)</label>
                <input type="number" min={10} max={300} value={wMm}
                  onChange={e => setWMm(parseFloat(e.target.value)||100)}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{ borderColor: 'var(--input)' }} />
              </div>
              <div className="flex-1">
                <label className="block text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Height (mm)</label>
                <input type="number" min={10} max={300} value={hMm}
                  onChange={e => setHMm(parseFloat(e.target.value)||50)}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{ borderColor: 'var(--input)' }} />
              </div>
              <div className="flex-1">
                <label className="block text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Preview</label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium"
                  style={{ borderColor: 'var(--border)', background: 'var(--muted)' }}>
                  {wMm} × {hMm} mm
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Template name & code */}
        <div className="rounded-xl p-4 mb-6 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <p className="text-sm font-medium mb-3" style={{ color: 'var(--foreground)' }}>Template details</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>
                Template Code <span style={{ color: '#C8102E' }}>*</span>
              </label>
              <input value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. PROD-LBL-01"
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: 'var(--input)' }} />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>
                Template Name <span style={{ color: '#C8102E' }}>*</span>
              </label>
              <input value={tname} onChange={e => setTname(e.target.value)} placeholder="e.g. Product Label"
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: 'var(--input)' }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Type</label>
              <input value={ttype} onChange={e => setTtype(e.target.value)} placeholder="Product"
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: 'var(--input)' }} />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Description</label>
              <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Optional"
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: 'var(--input)' }} />
            </div>
          </div>
          <div className="flex gap-4 mt-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} className="rounded" />
              <span style={{ color: 'var(--foreground)' }}>Set as default</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="rounded" />
              <span style={{ color: 'var(--foreground)' }}>Active</span>
            </label>
          </div>
        </div>

        {/* Next button */}
        <button
          onClick={() => { if (!code.trim() || !tname.trim()) { toast.error('Please enter a code and name first'); return; } setStep(2); }}
          className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
          style={{ background: '#C8102E' }}>
          Continue to Label Designer
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  //  STEP 2 — Visual designer
  // ════════════════════════════════════════════════════════════════════════════
  const canvasW = Math.round(wMm * zoom);
  const canvasH = Math.round(hMm * zoom);

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#F1F5F9' }}>

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b shrink-0"
        style={{ background: 'white', borderColor: '#E2E8F0' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => setStep(1)}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border hover:bg-gray-50 transition-colors"
            style={{ borderColor: '#E2E8F0', color: '#64748B' }}>
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div>
            <span className="font-semibold text-sm" style={{ color: '#0F172A' }}>
              {tname || 'Label Designer'}
            </span>
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{ background: '#F1F5F9', color: '#64748B' }}>
              {wMm} × {hMm} mm
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowProperties(p => !p)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors"
            style={{
              borderColor: showProperties ? '#C8102E' : '#E2E8F0',
              color: showProperties ? '#C8102E' : '#64748B',
              background: showProperties ? '#FFF1F2' : 'white',
            }}
            aria-expanded={showProperties}
            aria-controls="label-designer-properties-panel"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden />
            Properties
          </button>
          <button onClick={() => setShowZpl(p => !p)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors"
            style={{ borderColor: showZpl ? '#6366F1' : '#E2E8F0', color: showZpl ? '#6366F1' : '#64748B', background: showZpl ? '#EEF2FF' : 'white' }}>
            <Code2 className="w-3.5 h-3.5" /> ZPL Code
          </button>
          <button onClick={downloadZpl}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border hover:bg-gray-50 transition-colors"
            style={{ borderColor: '#E2E8F0', color: '#64748B' }}>
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button onClick={save} disabled={saving}
            className="flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-lg font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: '#C8102E' }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Template
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Edit area: toolbox + canvas (properties open from toolbar) */}
        <div className="flex flex-1 min-w-0 min-h-0 overflow-hidden">

        {/* ── LEFT: Toolbox ─────────────────────────────────────────────────── */}
        <div className="w-52 flex flex-col shrink-0 border-r overflow-y-auto min-h-0"
          style={{ background: 'white', borderColor: '#E2E8F0' }}>

          {/* Add elements */}
          <div className="p-3 border-b" style={{ borderColor: '#E2E8F0' }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#94A3B8' }}>
              Add to Label
            </p>
            <div className="space-y-1.5">
              {(['text','barcode','line','box'] as ElType[]).map(t => (
                <button key={t} onClick={() => addEl(t)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium border transition-all hover:shadow-sm"
                  style={{ borderColor: EL_COLOR[t] + '40', background: EL_BG[t], color: EL_COLOR[t] }}>
                  <ElIcon type={t} size={15} />
                  {EL_LABEL[t]}
                  <span className="ml-auto text-lg leading-none" style={{ color: EL_COLOR[t] + '80' }}>+</span>
                </button>
              ))}
            </div>
          </div>

          {/* Added elements */}
          <div className="flex-1 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#94A3B8' }}>
              Elements ({els.length})
            </p>
            {els.length === 0 ? (
              <p className="text-xs text-center py-4" style={{ color: '#94A3B8' }}>
                Click a button above to add your first element
              </p>
            ) : (
              <div className="space-y-1">
                {els.map(el => (
                  <div key={el.id}
                    onClick={() => setSelId(el.id)}
                    className="flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-all group"
                    style={{
                      background: selId === el.id ? EL_BG[el.type] : 'transparent',
                      border: `1.5px solid ${selId === el.id ? EL_COLOR[el.type] : 'transparent'}`,
                    }}>
                    <div className="w-6 h-6 rounded flex items-center justify-center shrink-0"
                      style={{ background: EL_BG[el.type], color: EL_COLOR[el.type] }}>
                      <ElIcon type={el.type} size={13} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate" style={{ color: '#0F172A' }}>
                        {el.type === 'text' || el.type === 'barcode'
                          ? (VARIABLES.find(v => v.value === el.content)?.label ?? el.content?.slice(0,16) ?? EL_LABEL[el.type])
                          : EL_LABEL[el.type]}
                      </div>
                      <div className="text-xs" style={{ color: '#94A3B8', fontSize: '0.6rem' }}>
                        {n2(el.xMm)},{n2(el.yMm)} mm
                      </div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); removeEl(el.id); }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-100 transition-all">
                      <X className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ZPL code (collapsible) */}
          {showZpl && (
            <div className="border-t p-3" style={{ borderColor: '#E2E8F0' }}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold" style={{ color: '#94A3B8' }}>Generated ZPL</span>
                <button onClick={() => { navigator.clipboard.writeText(zpl); toast.success('Copied!'); }}
                  className="text-xs flex items-center gap-1 hover:opacity-70" style={{ color: '#94A3B8' }}>
                  <Copy className="w-3 h-3" /> Copy
                </button>
              </div>
              <pre className="text-xs p-2 rounded overflow-x-auto max-h-40"
                style={{ background: '#1e1e2e', color: '#cdd6f4', fontFamily: 'monospace', lineHeight: 1.5, fontSize: '0.6rem' }}>
                {zpl}
              </pre>
            </div>
          )}
        </div>

        {/* ── CENTER: Canvas (preview is on the right rail) ───────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
          <div className="shrink-0 px-4 py-2 border-b flex flex-wrap items-center justify-between gap-2"
            style={{ background: '#F8FAFC', borderColor: '#E2E8F0' }}>
            <p className="text-xs" style={{ color: '#64748B' }}>
              Click an element to select · Drag to reposition ·{' '}
              <span style={{ color: '#94A3B8' }}>Canvas: {wMm} × {hMm} mm · grid 5 mm</span>
            </p>
            <div className="flex items-center gap-1 bg-white border rounded-lg px-1 py-1" style={{ borderColor: '#E2E8F0' }}>
              <button onClick={() => setZoom(z => Math.max(0.5, z - 0.5))} title="Zoom out"
                className="p-1 rounded hover:bg-slate-100 text-slate-500 transition-colors">
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-medium w-10 text-center text-slate-700" title="Zoom level">
                {Math.round((zoom / 3) * 100)}%
              </span>
              <button onClick={() => setZoom(z => Math.min(10, z + 0.5))} title="Zoom in"
                className="p-1 rounded hover:bg-slate-100 text-slate-500 transition-colors">
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Scrollable design area */}
          <div 
            className="flex-1 min-h-0 overflow-auto flex flex-col items-center p-4 sm:p-6 gap-4"
            onWheel={e => {
              if (e.ctrlKey || e.metaKey) {
                // Cannot preventDefault on passive wheel event in React easily without a ref,
                // but we can still respond to it.
                const delta = e.deltaY < 0 ? 0.25 : -0.25;
                setZoom(z => Math.max(0.5, Math.min(10, z + delta)));
              }
            }}
          >
          {/* The label canvas */}
          <div
            ref={canvasRef}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onClick={e => { if (e.target === canvasRef.current) setSelId(null); }}
            className="relative select-none shrink-0"
            style={{
              width: canvasW,
              height: canvasH,
              background: 'white',
              border: '2px solid #CBD5E1',
              borderRadius: 4,
              boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
              cursor: 'default',
              flexShrink: 0,
            }}>

            {/* Grid dots */}
            <svg width={canvasW} height={canvasH} className="absolute inset-0 pointer-events-none" style={{ opacity: 0.15 }}>
              {Array.from({ length: Math.floor(wMm / 5) + 1 }, (_, i) =>
                Array.from({ length: Math.floor(hMm / 5) + 1 }, (_, j) => (
                  <circle key={`${i}-${j}`} cx={i * 5 * zoom} cy={j * 5 * zoom} r={1} fill="#64748B" />
                ))
              )}
            </svg>

            {/* mm ruler labels */}
            <div className="absolute -top-5 left-0 flex" style={{ width: canvasW }}>
              {[0, 25, 50, 75, 100].filter(v => v <= wMm).map(v => (
                <div key={v} className="absolute text-xs" style={{ left: v * zoom - 6, color: '#94A3B8', fontSize: '0.55rem' }}>
                  {v}
                </div>
              ))}
            </div>

            {/* Render elements on canvas */}
            {els.map(el => {
              const isSelected = selId === el.id;
              const x = el.xMm * zoom, y = el.yMm * zoom;
              return (
                <div
                  key={el.id}
                  onMouseDown={e => onDragStart(e, el.id)}
                  onClick={e => {
                    e.stopPropagation();
                    // Cycle: if already selected, find next overlapping element
                    if (isSelected) {
                      const overlapping = els.filter(other =>
                        other.id !== el.id &&
                        other.xMm >= el.xMm - 2 && other.xMm <= el.xMm + 2 &&
                        other.yMm >= el.yMm - 2 && other.yMm <= el.yMm + 2
                      );
                      if (overlapping.length > 0) {
                        setSelId(overlapping[0].id);
                        return;
                      }
                    }
                    setSelId(el.id);
                  }}
                  className="absolute cursor-move"
                  style={{
                    left: x, top: y,
                    outline: isSelected ? `2px solid ${EL_COLOR[el.type]}` : 'none',
                    outlineOffset: 2,
                    borderRadius: 2,
                    zIndex: isSelected ? 50 : 1,
                  }}>
                  {el.type === 'text' && (
                    <span style={{
                      display: 'block',
                      fontFamily: '"Arial Narrow", Arial, sans-serif',
                      fontWeight: 800,
                      fontSize: (el.fontMm ?? 4.5) * zoom * 1.1, // Adjusted scale
                      lineHeight: 0.9,
                      paddingTop: (el.fontMm ?? 4.5) * zoom * 0.12, // Mimic ZPL top padding
                      transform: 'scaleX(0.88)', // Match condensed Font 0
                      transformOrigin: 'left',
                      color: '#0F172A',
                      whiteSpace: 'nowrap',
                      userSelect: 'none',
                    }}>
                      {VARIABLES.find(v => v.value === el.content)?.example ?? el.content ?? ''}
                    </span>
                  )}
                  {el.type === 'barcode' && (
                    <div style={{ userSelect: 'none' }}>
                      <div className="flex gap-[1px] items-end"
                        style={{ height: (el.barHeightMm ?? 12) * zoom }}>
                        {Array.from({ length: Math.max(20, (el.content?.length || 10) * 4) }, (_, i) => (
                          <div key={i} style={{
                            width: (i % 5 === 0 || i % 7 === 0) ? 2 : 1,
                            height: i % 13 === 0 ? '80%' : '100%',
                            background: '#0F172A',
                            flexShrink: 0,
                          }} />
                        ))}
                      </div>
                      {el.showHri && (
                        <div style={{ fontSize: 6, fontFamily: 'monospace', color: '#0F172A', textAlign: 'center', marginTop: 2 }}>
                          {VARIABLES.find(v => v.value === el.content)?.example ?? el.content ?? ''}
                        </div>
                      )}
                    </div>
                  )}
                  {el.type === 'line' && (
                    <div style={{
                      width: (el.widthMm ?? 30) * zoom,
                      height: Math.max(1, (el.thickMm ?? 0.5) * zoom),
                      background: '#0F172A',
                    }} />
                  )}
                  {el.type === 'box' && (
                    <div style={{
                      width: (el.widthMm ?? 30) * zoom,
                      height: (el.heightMm ?? 15) * zoom,
                      border: `${Math.max(1, (el.thickMm ?? 0.5) * zoom)}px solid #0F172A`,
                      background: 'transparent',
                    }} />
                  )}

                  {/* Selection handles */}
                  {isSelected && (
                    <>
                      <div style={{ position: 'absolute', top: -4, left: -4, width: 8, height: 8, borderRadius: '50%', background: EL_COLOR[el.type], border: '2px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
                      <div style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, borderRadius: '50%', background: EL_COLOR[el.type], border: '2px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
                    </>
                  )}
                </div>
              );
            })}
          </div>
          </div>
        </div>
        </div>

        {/* ── RIGHT: Print preview (full height beside editor) ───────────────── */}
        <div
          className="flex flex-col shrink-0 w-[min(100%,22rem)] sm:w-[min(100%,26rem)] lg:w-[min(40vw,36rem)] min-w-0 max-w-[42rem] min-h-0 border-l overflow-hidden"
          style={{ borderColor: '#E2E8F0', background: '#E2E8F0' }}
        >
          <div className="flex items-center justify-between px-4 py-2.5 shrink-0"
            style={{ background: 'white', borderBottom: '1px solid #E2E8F0' }}>
            <span className="text-sm font-semibold flex items-center gap-2" style={{ color: '#0F172A' }}>
              <Printer className="w-4 h-4" style={{ color: '#C8102E' }} aria-hidden />
              Print preview
            </span>
            <button type="button" onClick={() => void doPreview()} disabled={preving || els.length === 0}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors disabled:opacity-50"
              style={{ borderColor: '#C8102E', color: '#C8102E', background: 'white' }}>
              {preving ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden /> : <RefreshCw className="w-3.5 h-3.5" aria-hidden />}
              Refresh
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-auto flex items-center justify-center p-4 sm:p-5">
            {preving && (
              <div className="flex flex-col items-center gap-3 py-8">
                <Loader2 className="w-10 h-10 animate-spin" style={{ color: '#C8102E' }} aria-hidden />
                <span className="text-sm" style={{ color: '#64748B' }}>Rendering preview…</span>
              </div>
            )}
            {!preving && prevErr && (
              <div className="w-full max-w-md rounded-xl p-4 text-sm flex items-start gap-3"
                style={{ background: '#FEF2F2', color: '#991B1B', border: '1px solid #FCA5A5' }}>
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden />
                <span>{prevErr}</span>
              </div>
            )}
            {!preving && prevUrl && !prevErr && (
              <div
                className="rounded-xl overflow-hidden shadow-lg border bg-white flex items-center justify-center w-full max-w-full"
                style={{ borderColor: '#CBD5E1' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={prevUrl}
                  alt="Zebra print preview"
                  className="block w-auto h-auto max-w-full"
                  style={{
                    maxHeight: 'min(calc(100vh - 9rem), 85vh)',
                    objectFit: 'contain',
                  }}
                />
              </div>
            )}
            {!preving && !prevUrl && !prevErr && (
              <div className="flex flex-col items-center gap-2 text-center py-10 px-4 max-w-xs mx-auto">
                <Printer className="w-12 h-12 opacity-20" style={{ color: '#64748B' }} aria-hidden />
                <p className="text-sm font-medium" style={{ color: '#475569' }}>No preview yet</p>
                <p className="text-xs leading-relaxed" style={{ color: '#94A3B8' }}>
                  Add at least one element. The preview updates automatically, or tap Refresh.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      {showProperties && (
        <>
          <div
            role="presentation"
            className="fixed z-[60] left-0 right-0 bottom-0 bg-slate-950/40"
            style={{ top: '3.25rem' }}
            onClick={() => setShowProperties(false)}
          />
          <div
            id="label-designer-properties-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="label-designer-properties-title"
            className="fixed z-[70] flex flex-col w-full max-w-md border-l shadow-2xl bg-white overflow-hidden"
            style={{ top: '3.25rem', bottom: 0, right: 0, borderColor: '#E2E8F0' }}
          >
            <div className="flex items-center justify-between shrink-0 px-4 py-3 border-b" style={{ borderColor: '#E2E8F0', background: '#FAFAFA' }}>
              <div>
                <p id="label-designer-properties-title" className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748B' }}>
                  Properties
                </p>
                <p className="text-[0.65rem] mt-0.5" style={{ color: '#94A3B8' }}>
                  Select an element on the canvas or in the list
                </p>
              </div>
              <button type="button" onClick={() => setShowProperties(false)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors" aria-label="Close properties">
                <X className="w-4 h-4" style={{ color: '#64748B' }} />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
              {sel ? (
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: EL_BG[sel.type], color: EL_COLOR[sel.type] }}>
                      <ElIcon type={sel.type} size={14} />
                    </div>
                    <span className="font-semibold text-sm" style={{ color: '#0F172A' }}>
                      {EL_LABEL[sel.type]} Settings
                    </span>
                    <button type="button" onClick={() => removeEl(sel.id)}
                      className="ml-auto p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="Delete">
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#64748B' }}>
                        Position (mm)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs mb-1" style={{ color: '#94A3B8' }}>← → Left</label>
                          <input type="number" step={0.5} min={0} max={wMm}
                            value={n2(sel.xMm)}
                            onChange={e => upd(sel.id, { xMm: parseFloat(e.target.value)||0 })}
                            className="w-full px-2 py-1.5 text-sm rounded-lg border"
                            style={{ borderColor: '#E2E8F0' }} />
                        </div>
                        <div>
                          <label className="block text-xs mb-1" style={{ color: '#94A3B8' }}>↑ ↓ Top</label>
                          <input type="number" step={0.5} min={0} max={hMm}
                            value={n2(sel.yMm)}
                            onChange={e => upd(sel.id, { yMm: parseFloat(e.target.value)||0 })}
                            className="w-full px-2 py-1.5 text-sm rounded-lg border"
                            style={{ borderColor: '#E2E8F0' }} />
                        </div>
                      </div>
                    </div>

                    {sel.type === 'text' && (<>
                      <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: '#64748B' }}>
                          Content
                        </label>
                        <input value={sel.content ?? ''} onChange={e => upd(sel.id, { content: e.target.value })}
                          placeholder="Type text…"
                          className="w-full px-3 py-2 text-sm rounded-lg border mb-2"
                          style={{ borderColor: '#E2E8F0' }} />
                        <label className="block text-xs mb-1.5" style={{ color: '#64748B' }}>
                          Or pick a data field:
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {VARIABLES.map(v => (
                            <button key={v.value} type="button"
                              onClick={() => upd(sel.id, { content: v.value })}
                              className="px-2 py-1 rounded-full text-xs font-medium border transition-all"
                              style={{
                                borderColor: sel.content === v.value ? '#C8102E' : '#E2E8F0',
                                background: sel.content === v.value ? '#FFF1F2' : '#F8FAFC',
                                color: sel.content === v.value ? '#C8102E' : '#475569',
                              }}>
                              {v.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: '#64748B' }}>
                          Text Size
                        </label>
                        <div className="grid grid-cols-3 gap-1.5 mb-2">
                          {FONT_SIZES.map(fs => (
                            <button key={fs.mm} type="button"
                              onClick={() => upd(sel.id, { fontMm: fs.mm })}
                              className="py-1.5 rounded-lg text-xs font-medium border transition-all"
                              style={{
                                borderColor: sel.fontMm === fs.mm ? '#C8102E' : '#E2E8F0',
                                background: sel.fontMm === fs.mm ? '#FFF1F2' : '#F8FAFC',
                                color: sel.fontMm === fs.mm ? '#C8102E' : '#475569',
                                fontSize: Math.max(9, Math.min(13, fs.mm * 2.2)),
                              }}>
                              {fs.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>)}

                    {sel.type === 'barcode' && (<>
                      <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: '#64748B' }}>
                          Barcode Data
                        </label>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {VARIABLES.map(v => (
                            <button key={v.value} type="button"
                              onClick={() => upd(sel.id, { content: v.value })}
                              className="px-2 py-1 rounded-full text-xs font-medium border transition-all"
                              style={{
                                borderColor: sel.content === v.value ? '#7C3AED' : '#E2E8F0',
                                background: sel.content === v.value ? '#F5F3FF' : '#F8FAFC',
                                color: sel.content === v.value ? '#7C3AED' : '#475569',
                              }}>
                              {v.label}
                            </button>
                          ))}
                        </div>
                        <input value={sel.content ?? ''} onChange={e => upd(sel.id, { content: e.target.value })}
                          placeholder="or type a fixed value"
                          className="w-full px-3 py-2 text-sm rounded-lg border"
                          style={{ borderColor: '#E2E8F0' }} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: '#64748B' }}>
                          Barcode Height (mm)
                        </label>
                        <input type="number" step={1} min={5} max={50}
                          value={n2(sel.barHeightMm ?? 12)}
                          onChange={e => upd(sel.id, { barHeightMm: parseFloat(e.target.value)||12 })}
                          className="w-full px-3 py-2 text-sm rounded-lg border"
                          style={{ borderColor: '#E2E8F0' }} />
                      </div>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={sel.showHri ?? true}
                          onChange={e => upd(sel.id, { showHri: e.target.checked })} className="rounded" />
                        <span style={{ color: '#0F172A' }}>Show number below barcode</span>
                      </label>
                    </>)}

                    {sel.type === 'line' && (<>
                      <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: '#64748B' }}>Length (mm)</label>
                        <input type="number" step={1} min={1} value={n2(sel.widthMm ?? 30)}
                          onChange={e => upd(sel.id, { widthMm: parseFloat(e.target.value)||30 })}
                          className="w-full px-3 py-2 text-sm rounded-lg border" style={{ borderColor: '#E2E8F0' }} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: '#64748B' }}>Thickness (mm)</label>
                        <input type="number" step={0.25} min={0.25} max={5} value={n2(sel.thickMm ?? 0.5)}
                          onChange={e => upd(sel.id, { thickMm: parseFloat(e.target.value)||0.5 })}
                          className="w-full px-3 py-2 text-sm rounded-lg border" style={{ borderColor: '#E2E8F0' }} />
                      </div>
                    </>)}

                    {sel.type === 'box' && (<>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-semibold mb-1.5" style={{ color: '#64748B' }}>Width (mm)</label>
                          <input type="number" step={1} min={1} value={n2(sel.widthMm ?? 30)}
                            onChange={e => upd(sel.id, { widthMm: parseFloat(e.target.value)||30 })}
                            className="w-full px-3 py-2 text-sm rounded-lg border" style={{ borderColor: '#E2E8F0' }} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1.5" style={{ color: '#64748B' }}>Height (mm)</label>
                          <input type="number" step={1} min={1} value={n2(sel.heightMm ?? 15)}
                            onChange={e => upd(sel.id, { heightMm: parseFloat(e.target.value)||15 })}
                            className="w-full px-3 py-2 text-sm rounded-lg border" style={{ borderColor: '#E2E8F0' }} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: '#64748B' }}>Border thickness (mm)</label>
                        <input type="number" step={0.25} min={0.25} max={5} value={n2(sel.thickMm ?? 0.5)}
                          onChange={e => upd(sel.id, { thickMm: parseFloat(e.target.value)||0.5 })}
                          className="w-full px-3 py-2 text-sm rounded-lg border" style={{ borderColor: '#E2E8F0' }} />
                      </div>
                    </>)}
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#94A3B8' }}>
                    How to use
                  </p>
                  <div className="space-y-3">
                    {[
                      { n: '1', t: 'Add an element', d: 'Click Text, Barcode, Line, or Box on the left to add it to the label.' },
                      { n: '2', t: 'Drag to position', d: 'Drag any element on the white canvas to move it where you want.' },
                      { n: '3', t: 'Edit properties', d: 'Click an element, then use Properties in the toolbar to change text, size, and other settings.' },
                      { n: '4', t: 'Check the preview', d: 'The Print preview panel on the right shows how the label will print on your Zebra.' },
                    ].map(s => (
                      <div key={s.n} className="flex gap-3">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white"
                          style={{ background: '#C8102E' }}>{s.n}</div>
                        <div>
                          <div className="text-xs font-semibold mb-0.5" style={{ color: '#0F172A' }}>{s.t}</div>
                          <div className="text-xs" style={{ color: '#64748B' }}>{s.d}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
