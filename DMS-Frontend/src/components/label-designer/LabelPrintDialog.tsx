'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  X, Search, Printer, Loader2, RefreshCw, AlertCircle,
  CheckCircle, ChevronRight, Tag, Hash, Layers
} from 'lucide-react';
import { labelTemplatesApi, type LabelTemplate } from '@/lib/api/label-templates';
import { labelPrintersApi, type LabelPrinter } from '@/lib/api/label-printers';
import { labelPrintingApi, type LabelPrintData, type LabelPrintRequest } from '@/lib/api/label-printing';
import toast from 'react-hot-toast';

// ─── Variable substitution ─────────────────────────────────────────────────────
const VAR_MAP: Record<string, keyof LabelPrintData> = {
  '{{product_name}}': 'productName',
  '{{product_code}}': 'productCode',
  '{{barcode}}':      'barcode',
  '{{category}}':     'category',
  '{{uom}}':          'uom',
  '{{price}}':        'price',
  '{{mrp}}':          'mrp',
  '{{price_list}}':   'priceList',
  '{{print_date}}':   'printDate',
  '{{display_no}}':   'displayNo',
  '{{company_name}}': 'companyName',
  '{{outlet}}':       'outlet',
};

function resolveZpl(zpl: string, data: LabelPrintData): string {
  let out = zpl;
  for (const [token, key] of Object.entries(VAR_MAP)) {
    const val = String(data[key] ?? '');
    out = out.replaceAll(token, val);
  }
  return out;
}

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Props {
  request: LabelPrintRequest;
  onClose: () => void;
}

type Step = 'pick' | 'preview';

// ─── Component ─────────────────────────────────────────────────────────────────
export default function LabelPrintDialog({ request, onClose }: Props) {
  const [step, setStep]               = useState<Step>('pick');
  const [templates, setTemplates]     = useState<LabelTemplate[]>([]);
  const [printers, setPrinters]       = useState<LabelPrinter[]>([]);
  const [printData, setPrintData]     = useState<LabelPrintData | null>(null);
  const [selectedTpl, setSelectedTpl] = useState<LabelTemplate | null>(null);
  const [search, setSearch]           = useState('');
  const [loading, setLoading]         = useState(true);
  const [prevUrl, setPrevUrl]         = useState<string | null>(null);
  const [prevErr, setPrevErr]         = useState('');
  const [preving, setPreving]         = useState(false);
  const [copies, setCopies]           = useState(request.labelCount);
  const [printing, setPrinting]       = useState(false);
  const prevTimer                     = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // ── Load templates + print data in parallel ──────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [tplRes, pd, printerList] = await Promise.all([
          labelTemplatesApi.getAll(1, 200, undefined, true),
          labelPrintingApi.getPrintData(request.id),
          labelPrintersApi.getAll(true),
        ]);
        setTemplates(tplRes.labelTemplates);
        setPrintData(pd);
        setPrinters(printerList);
        // Pre-select default template if one exists
        const def = tplRes.labelTemplates.find(t => t.isDefault) ?? null;
        if (def) setSelectedTpl(def);
      } catch {
        toast.error('Failed to load templates or print data');
      } finally {
        setLoading(false);
      }
    })();
  }, [request.id]);

  // ── Auto-preview when template or data changes ───────────────────────────────
  const doPreview = useCallback(async (tpl: LabelTemplate, data: LabelPrintData) => {
    if (!tpl.layoutDesign) { setPrevUrl(null); setPrevErr('Template has no design'); return; }
    setPreving(true); setPrevErr('');
    try {
      if (prevUrl) URL.revokeObjectURL(prevUrl);
      const resolvedZpl = resolveZpl(tpl.layoutDesign, data);
      const url = await labelTemplatesApi.zplPreview(resolvedZpl, tpl.widthMm, tpl.heightMm, 8);
      setPrevUrl(url);
    } catch (e: any) {
      setPrevErr(e?.response?.data?.message ?? 'Preview failed');
      setPrevUrl(null);
    } finally {
      setPreving(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedTpl || !printData || step !== 'preview') return;
    clearTimeout(prevTimer.current);
    prevTimer.current = setTimeout(() => doPreview(selectedTpl, printData), 600);
    return () => clearTimeout(prevTimer.current);
  }, [selectedTpl, printData, step, doPreview]);

  // ── Print via browser window.print ──────────────────────────────────────────
  function handlePrint() {
    if (!selectedTpl?.layoutDesign || !printData) return;
    setPrinting(true);
    try {
      const resolvedZpl = resolveZpl(selectedTpl.layoutDesign, printData);
      // Repeat ZPL for the number of copies
      const allZpl = Array(copies).fill(resolvedZpl).join('\n');

      // Open a print window with the raw ZPL — works with Zebra Browser Print driver
      const win = window.open('', '_blank', 'width=400,height=300');
      if (!win) { toast.error('Popup blocked — allow popups to print'); return; }
      win.document.write(`<html><body><pre style="font-family:monospace;font-size:10px;white-space:pre-wrap">${allZpl}</pre></body></html>`);
      win.document.close();
      win.focus();
      win.print();
      win.close();
      toast.success(`Sent ${copies} label${copies !== 1 ? 's' : ''} to printer`);
      onClose();
    } finally {
      setPrinting(false);
    }
  }

  // ── Download ZPL file (fallback) ─────────────────────────────────────────────
  function handleDownloadZpl() {
    if (!selectedTpl?.layoutDesign || !printData) return;
    const resolvedZpl = resolveZpl(selectedTpl.layoutDesign, printData);
    const allZpl = Array(copies).fill(resolvedZpl).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([allZpl], { type: 'text/plain' }));
    a.download = `${request.displayNo}.zpl`;
    a.click();
  }

  const filtered = templates.filter(t =>
    !search ||
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.code.toLowerCase().includes(search.toLowerCase()) ||
    (t.templateType ?? '').toLowerCase().includes(search.toLowerCase())
  );

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div
        className="relative w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ background: 'white', maxHeight: 'calc(100vh - 2rem)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b" style={{ borderColor: '#E2E8F0' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#FFF1F2' }}>
              <Printer className="w-5 h-5" style={{ color: '#C8102E' }} />
            </div>
            <div>
              <p className="font-bold text-base" style={{ color: '#0F172A' }}>Print Labels</p>
              <p className="text-xs" style={{ color: '#64748B' }}>
                {request.displayNo} · {request.productName || request.productCode} · {request.labelCount} labels
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            style={{ color: '#64748B' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Step tabs ───────────────────────────────────────────────────── */}
        <div className="flex shrink-0 border-b" style={{ borderColor: '#E2E8F0', background: '#F8FAFC' }}>
          {(['pick', 'preview'] as Step[]).map((s, i) => {
            const labels = ['1. Choose Template', '2. Preview & Print'];
            const active = step === s;
            return (
              <button
                key={s}
                onClick={() => { if (s === 'preview' && !selectedTpl) { toast.error('Select a template first'); return; } setStep(s); }}
                className="flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors"
                style={{
                  borderColor: active ? '#C8102E' : 'transparent',
                  color: active ? '#C8102E' : '#64748B',
                  background: 'transparent',
                }}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${active ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {i + 1}
                </span>
                {labels[i]}
              </button>
            );
          })}
        </div>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <div className="flex-1 min-h-0 overflow-hidden">

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#C8102E' }} />
            </div>
          ) : step === 'pick' ? (
            // ════════════════════════════════════════════════════════════════
            //  STEP 1 — Pick template
            // ════════════════════════════════════════════════════════════════
            <div className="flex h-full min-h-0">
              {/* Template list */}
              <div className="flex flex-col w-full min-h-0 overflow-hidden">
                {/* Request data summary */}
                <div className="shrink-0 mx-6 mt-4 mb-3 rounded-xl p-4 border" style={{ background: '#F0FDF4', borderColor: '#86EFAC' }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: '#166534' }}>Label Data (will be applied to template)</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1.5">
                    {printData && [
                      ['Product',    printData.productName],
                      ['Code',       printData.productCode],
                      ['Price',      printData.price],
                      ['Category',   printData.category],
                      ['UOM',        printData.uom],
                      ['Start Date', printData.startDate],
                      ['Expiry Date',printData.expiryDate],
                      ['Display No', printData.displayNo],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <span className="text-xs" style={{ color: '#4ADE80' }}>{k}: </span>
                        <span className="text-xs font-semibold" style={{ color: '#166534' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Search */}
                <div className="shrink-0 px-6 mb-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94A3B8' }} />
                    <input
                      type="text"
                      placeholder="Search templates by name, code or type…"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-lg border text-sm"
                      style={{ borderColor: '#E2E8F0' }}
                    />
                  </div>
                </div>

                {/* Template cards */}
                <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-4">
                  {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <Tag className="w-10 h-10 opacity-20" style={{ color: '#64748B' }} />
                      <p className="text-sm" style={{ color: '#94A3B8' }}>No templates found</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {filtered.map(tpl => {
                        const isSelected = selectedTpl?.id === tpl.id;
                        return (
                          <button
                            key={tpl.id}
                            onClick={() => setSelectedTpl(tpl)}
                            className="text-left rounded-xl border-2 p-4 transition-all hover:shadow-md"
                            style={{
                              borderColor: isSelected ? '#C8102E' : '#E2E8F0',
                              background: isSelected ? '#FFF1F2' : 'white',
                            }}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm truncate" style={{ color: isSelected ? '#C8102E' : '#0F172A' }}>
                                  {tpl.name}
                                </p>
                                <p className="text-xs font-mono mt-0.5" style={{ color: '#64748B' }}>{tpl.code}</p>
                              </div>
                              {isSelected && (
                                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#C8102E' }} />
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {tpl.templateType && (
                                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#F1F5F9', color: '#475569' }}>
                                  {tpl.templateType}
                                </span>
                              )}
                              {tpl.isDefault && (
                                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#FFF7ED', color: '#C2410C' }}>
                                  Default
                                </span>
                              )}
                              {tpl.printerName && (
                                <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: '#F0FDF4', color: '#166534' }}>
                                  <Printer className="w-2.5 h-2.5" />
                                  {tpl.printerName}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-xs" style={{ color: '#94A3B8' }}>
                              <Layers className="w-3 h-3" />
                              <span>{tpl.widthMm} × {tpl.heightMm} mm</span>
                              {!tpl.layoutDesign && (
                                <span className="ml-auto px-1.5 py-0.5 rounded text-xs" style={{ background: '#FEF2F2', color: '#DC2626' }}>
                                  No design
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // ════════════════════════════════════════════════════════════════
            //  STEP 2 — Preview & Print
            // ════════════════════════════════════════════════════════════════
            <div className="flex h-full min-h-0 overflow-hidden">

              {/* Left: template info + copies */}
              <div className="w-72 shrink-0 border-r flex flex-col overflow-y-auto" style={{ borderColor: '#E2E8F0', background: '#F8FAFC' }}>
                <div className="p-4 space-y-4">
                  {/* Selected template */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#94A3B8' }}>Template</p>
                    <div className="rounded-xl border p-3" style={{ background: 'white', borderColor: '#E2E8F0' }}>
                      <p className="font-semibold text-sm" style={{ color: '#0F172A' }}>{selectedTpl?.name}</p>
                      <p className="text-xs font-mono" style={{ color: '#64748B' }}>{selectedTpl?.code}</p>
                      <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>{selectedTpl?.widthMm} × {selectedTpl?.heightMm} mm</p>
                      {selectedTpl?.printerName && (
                        <div className="flex items-center gap-1 mt-2">
                          <Printer className="w-3 h-3" style={{ color: '#059669' }} />
                          <span className="text-xs font-medium" style={{ color: '#059669' }}>{selectedTpl.printerName}</span>
                        </div>
                      )}
                      <button
                        onClick={() => setStep('pick')}
                        className="mt-2 text-xs underline"
                        style={{ color: '#C8102E' }}
                      >
                        Change template
                      </button>
                    </div>
                  </div>

                  {/* Label data */}
                  {printData && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#94A3B8' }}>Label Data</p>
                      <div className="rounded-xl border p-3 space-y-1.5" style={{ background: 'white', borderColor: '#E2E8F0' }}>
                        {[
                          ['Product',     printData.productName],
                          ['Code',        printData.productCode],
                          ['Barcode',     printData.barcode],
                          ['Price',       printData.price],
                          ['Category',    printData.category],
                          ['UOM',         printData.uom],
                          ['Start Date',  printData.startDate],
                          ['Expiry Date', printData.expiryDate],
                          ['Display No',  printData.displayNo],
                          ['Print Date',  printData.printDate],
                        ].map(([k, v]) => (
                          <div key={k} className="flex items-start gap-1.5">
                            <span className="text-xs shrink-0 w-20" style={{ color: '#94A3B8' }}>{k}</span>
                            <span className="text-xs font-medium break-all" style={{ color: '#0F172A' }}>{v || '—'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Copies */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#94A3B8' }}>Copies</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCopies(c => Math.max(1, c - 1))}
                        className="w-8 h-8 rounded-lg border flex items-center justify-center text-sm font-bold transition-colors hover:bg-slate-100"
                        style={{ borderColor: '#E2E8F0', color: '#475569' }}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={1000}
                        value={copies}
                        onChange={e => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 px-2 py-1.5 rounded-lg border text-sm text-center font-semibold"
                        style={{ borderColor: '#E2E8F0' }}
                      />
                      <button
                        onClick={() => setCopies(c => Math.min(1000, c + 1))}
                        className="w-8 h-8 rounded-lg border flex items-center justify-center text-sm font-bold transition-colors hover:bg-slate-100"
                        style={{ borderColor: '#E2E8F0', color: '#475569' }}
                      >
                        +
                      </button>
                      <span className="text-xs" style={{ color: '#94A3B8' }}>label{copies !== 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  {/* Printer info */}
                  {printers.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#94A3B8' }}>Available Printers</p>
                      <div className="space-y-1.5">
                        {printers.map(p => (
                          <div key={p.id} className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: 'white', border: '1px solid #E2E8F0' }}>
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            <span className="text-xs font-medium" style={{ color: '#0F172A' }}>{p.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: preview */}
              <div className="flex-1 min-w-0 flex flex-col min-h-0 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 shrink-0 border-b" style={{ borderColor: '#E2E8F0', background: 'white' }}>
                  <span className="text-sm font-semibold flex items-center gap-2" style={{ color: '#0F172A' }}>
                    <Printer className="w-4 h-4" style={{ color: '#C8102E' }} />
                    Print Preview
                  </span>
                  <button
                    type="button"
                    onClick={() => selectedTpl && printData && doPreview(selectedTpl, printData)}
                    disabled={preving}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors disabled:opacity-50"
                    style={{ borderColor: '#C8102E', color: '#C8102E', background: 'white' }}
                  >
                    {preving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    Refresh
                  </button>
                </div>

                <div className="flex-1 min-h-0 overflow-auto flex items-center justify-center p-6" style={{ background: '#E2E8F0' }}>
                  {preving && (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-10 h-10 animate-spin" style={{ color: '#C8102E' }} />
                      <span className="text-sm" style={{ color: '#64748B' }}>Rendering preview…</span>
                    </div>
                  )}
                  {!preving && prevErr && (
                    <div className="max-w-sm rounded-xl p-4 text-sm flex items-start gap-3" style={{ background: '#FEF2F2', color: '#991B1B', border: '1px solid #FCA5A5' }}>
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <span>{prevErr}</span>
                    </div>
                  )}
                  {!preving && prevUrl && !prevErr && (
                    <div className="rounded-xl overflow-hidden shadow-lg border bg-white" style={{ borderColor: '#CBD5E1' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={prevUrl}
                        alt="Label preview"
                        className="block w-auto h-auto"
                        style={{ maxHeight: 'calc(100vh - 18rem)', maxWidth: '100%', objectFit: 'contain' }}
                      />
                    </div>
                  )}
                  {!preving && !prevUrl && !prevErr && (
                    <div className="flex flex-col items-center gap-2 text-center max-w-xs">
                      <Printer className="w-12 h-12 opacity-20" style={{ color: '#64748B' }} />
                      <p className="text-sm font-medium" style={{ color: '#475569' }}>Preview loads automatically</p>
                      <p className="text-xs" style={{ color: '#94A3B8' }}>
                        {selectedTpl?.layoutDesign ? 'Click Refresh if it doesn\'t appear.' : 'The selected template has no design yet.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0 border-t" style={{ borderColor: '#E2E8F0', background: '#F8FAFC' }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors hover:bg-slate-50"
            style={{ borderColor: '#E2E8F0', color: '#64748B' }}
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {step === 'pick' && (
              <button
                onClick={() => {
                  if (!selectedTpl) { toast.error('Please select a template first'); return; }
                  setStep('preview');
                }}
                disabled={!selectedTpl}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                style={{ background: '#C8102E' }}
              >
                Next: Preview
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {step === 'preview' && (
              <>
                <button
                  onClick={handleDownloadZpl}
                  disabled={!selectedTpl?.layoutDesign || !printData}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors hover:bg-slate-50 disabled:opacity-40"
                  style={{ borderColor: '#E2E8F0', color: '#475569' }}
                >
                  <Hash className="w-4 h-4" />
                  Download ZPL
                </button>
                <button
                  onClick={handlePrint}
                  disabled={printing || !selectedTpl?.layoutDesign || !printData}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                  style={{ background: '#C8102E' }}
                >
                  {printing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                  Print {copies} Label{copies !== 1 ? 's' : ''}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
