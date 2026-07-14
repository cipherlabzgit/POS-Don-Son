'use client';

import { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Select from '@/components/ui/select';
import { Database, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, XCircle, RefreshCw, ArrowRight, Eye, Settings2 } from 'lucide-react';

type SheetStatus = 'pending' | 'parsing' | 'ready' | 'imported' | 'error';

interface DetectedSheet {
  name: string;
  rowCount: number;
  columnCount: number;
  detectedTarget: TargetEntity;
  status: SheetStatus;
  message?: string;
}

type TargetEntity =
  | 'products'
  | 'outlets'
  | 'recipes'
  | 'orders'
  | 'delivery-plan'
  | 'production-plan'
  | 'price-master'
  | 'ingredients'
  | 'skip';

const targetOptions: { value: TargetEntity; label: string; description: string }[] = [
  { value: 'products', label: 'Product Master', description: 'Codes, names, UoM, prices, flags' },
  { value: 'outlets', label: 'Outlet / Showroom Master', description: 'Outlet codes, addresses, managers' },
  { value: 'recipes', label: 'Recipes', description: 'Product → ingredient mapping with qty/unit' },
  { value: 'ingredients', label: 'Ingredient Master', description: 'Raw material list with UoM' },
  { value: 'orders', label: 'Order Entry', description: 'Default outlet × product quantities' },
  { value: 'delivery-plan', label: 'Delivery Plan', description: 'Pre-loaded delivery plans' },
  { value: 'production-plan', label: 'Production Plan', description: 'Pre-loaded production summaries' },
  { value: 'price-master', label: 'Price Master', description: 'Future-dated price changes' },
  { value: 'skip', label: '— Skip this sheet —', description: 'Sheet will not be imported' },
];

const sampleSheets: DetectedSheet[] = [
  { name: 'Products', rowCount: 248, columnCount: 12, detectedTarget: 'products', status: 'ready' },
  { name: 'Outlets', rowCount: 15, columnCount: 8, detectedTarget: 'outlets', status: 'ready' },
  { name: 'Recipe Master', rowCount: 1432, columnCount: 7, detectedTarget: 'recipes', status: 'ready' },
  { name: 'DefaultQty', rowCount: 3720, columnCount: 18, detectedTarget: 'orders', status: 'ready' },
  { name: 'Plan-2026-04', rowCount: 86, columnCount: 9, detectedTarget: 'delivery-plan', status: 'ready', message: 'Detected month sheet "April 2026"' },
  { name: 'Prices-Future', rowCount: 65, columnCount: 5, detectedTarget: 'price-master', status: 'ready' },
  { name: 'Ingredients', rowCount: 184, columnCount: 6, detectedTarget: 'ingredients', status: 'ready' },
  { name: 'Notes', rowCount: 42, columnCount: 3, detectedTarget: 'skip', status: 'pending', message: 'Free-form notes — auto-skipped' },
  { name: 'PivotCache', rowCount: 0, columnCount: 0, detectedTarget: 'skip', status: 'error', message: 'Macro-only sheet, no data' },
];

const statusBadge = (s: SheetStatus) => {
  switch (s) {
    case 'ready': return <Badge variant="success" size="sm"><CheckCircle2 className="w-3 h-3 mr-1" />Ready</Badge>;
    case 'parsing': return <Badge variant="info" size="sm">Parsing…</Badge>;
    case 'imported': return <Badge variant="primary" size="sm"><CheckCircle2 className="w-3 h-3 mr-1" />Imported</Badge>;
    case 'error': return <Badge variant="danger" size="sm"><XCircle className="w-3 h-3 mr-1" />Error</Badge>;
    default: return <Badge variant="neutral" size="sm">Pending</Badge>;
  }
};

export default function XlsmImporterPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [sheets, setSheets] = useState<DetectedSheet[]>([]);
  const [stage, setStage] = useState<'idle' | 'analyzing' | 'mapping' | 'importing' | 'done'>('idle');
  const [importMode, setImportMode] = useState<'append' | 'upsert' | 'replace'>('upsert');
  const [dryRun, setDryRun] = useState(true);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    setStage('analyzing');
    setTimeout(() => {
      setSheets(sampleSheets);
      setStage('mapping');
    }, 1200);
  };

  const updateSheetTarget = (sheetName: string, target: TargetEntity) => {
    setSheets(prev => prev.map(s => s.name === sheetName ? { ...s, detectedTarget: target, status: target === 'skip' ? 'pending' : 'ready' } : s));
  };

  const importableCount = sheets.filter(s => s.status === 'ready' && s.detectedTarget !== 'skip').length;
  const totalRows = sheets.filter(s => s.status === 'ready' && s.detectedTarget !== 'skip').reduce((sum, s) => sum + s.rowCount, 0);

  const runImport = () => {
    setStage('importing');
    setSheets(prev => prev.map(s => (s.status === 'ready' && s.detectedTarget !== 'skip') ? { ...s, status: 'parsing' } : s));
    setTimeout(() => {
      setSheets(prev => prev.map(s => (s.status === 'parsing') ? { ...s, status: 'imported' } : s));
      setStage('done');
    }, 1800);
  };

  const reset = () => {
    setStage('idle');
    setFileName('');
    setSheets([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>xlsm Importer</h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Migrate legacy Excel macro workbooks (.xlsm) into the DMS in one shot
          </p>
        </div>
        {stage !== 'idle' && (
          <Button variant="secondary" size="md" onClick={reset}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Start Over
          </Button>
        )}
      </div>

      {stage === 'idle' && (
        <Card>
          <CardContent>
            <div
              className="rounded-lg p-12 text-center cursor-pointer transition-all"
              style={{ border: '2px dashed #D1D5DB', backgroundColor: 'var(--muted)' }}
              onClick={() => fileInputRef.current?.click()}
            >
              <FileSpreadsheet className="w-16 h-16 mx-auto mb-4" style={{ color: '#10B981' }} />
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                Upload legacy .xlsm workbook
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
                The importer will auto-detect sheets and map them to DMS entities
              </p>
              <Button variant="primary" size="md">
                <Upload className="w-4 h-4 mr-2" />
                Choose .xlsm File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsm,.xlsx,.xls"
                onChange={handleFile}
                className="hidden"
              />
              <p className="text-xs mt-6" style={{ color: 'var(--muted-foreground)' }}>
                Supports: Products, Outlets, Recipes, Default Order Quantities, Delivery Plans, Production Plans, Prices, Ingredients
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {stage === 'analyzing' && (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-r-transparent mb-4" style={{ borderColor: '#10B981', borderRightColor: 'transparent' }}></div>
              <h3 className="text-lg font-semibold">Analyzing workbook…</h3>
              <p className="text-sm mt-2" style={{ color: 'var(--muted-foreground)' }}>
                Detecting sheets, headers, and target entities for {fileName}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {(stage === 'mapping' || stage === 'importing' || stage === 'done') && sheets.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent>
                <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>File</p>
                <p className="text-base font-bold mt-1 truncate" style={{ color: 'var(--foreground)' }}>{fileName}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Sheets Detected</p>
                <p className="text-2xl font-bold mt-1" style={{ color: 'var(--foreground)' }}>{sheets.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-xs uppercase tracking-wider" style={{ color: '#10B981' }}>To Import</p>
                <p className="text-2xl font-bold mt-1" style={{ color: '#10B981' }}>{importableCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-xs uppercase tracking-wider" style={{ color: '#C8102E' }}>Total Rows</p>
                <p className="text-2xl font-bold mt-1" style={{ color: '#C8102E' }}>{totalRows.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="w-5 h-5" />
                  Sheet → Entity Mapping
                </CardTitle>
                {stage === 'mapping' && (
                  <div className="flex items-center gap-3">
                    <Select
                      value={importMode}
                      onChange={(e) => setImportMode(e.target.value as typeof importMode)}
                      options={[
                        { value: 'upsert', label: 'Upsert (insert + update)' },
                        { value: 'append', label: 'Append only' },
                        { value: 'replace', label: 'Replace (delete + insert)' },
                      ]}
                    />
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} />
                      Dry run
                    </label>
                    <Button variant="primary" size="md" onClick={runImport} disabled={importableCount === 0}>
                      <Database className="w-4 h-4 mr-2" />
                      {dryRun ? 'Validate' : 'Import'} {importableCount} Sheet{importableCount !== 1 ? 's' : ''}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sheets.map(sheet => (
                  <div
                    key={sheet.name}
                    className="p-4 rounded-lg flex items-center gap-4"
                    style={{
                      border: '1px solid var(--border)',
                      backgroundColor: sheet.detectedTarget === 'skip' ? 'var(--dms-sky-tint)' : 'var(--dms-surface)',
                    }}
                  >
                    <FileSpreadsheet className="w-8 h-8 flex-shrink-0" style={{ color: sheet.detectedTarget === 'skip' ? '#9CA3AF' : '#10B981' }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold truncate" style={{ color: 'var(--foreground)' }}>{sheet.name}</p>
                        {statusBadge(sheet.status)}
                      </div>
                      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        {sheet.rowCount.toLocaleString()} rows × {sheet.columnCount} columns
                        {sheet.message && <span className="ml-2 italic">— {sheet.message}</span>}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5" style={{ color: 'var(--muted-foreground)' }} />
                    <div className="w-72">
                      <Select
                        value={sheet.detectedTarget}
                        onChange={(e) => updateSheetTarget(sheet.name, e.target.value as TargetEntity)}
                        disabled={stage !== 'mapping' || sheet.status === 'error'}
                        options={targetOptions.map(t => ({ value: t.value, label: t.label }))}
                        fullWidth
                      />
                    </div>
                    <button
                      className="p-2 rounded transition-colors"
                      style={{ color: 'var(--muted-foreground)' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--muted)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      title="Preview rows"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {stage === 'importing' && (
            <div className="p-4 rounded-lg flex items-center gap-3" style={{ backgroundColor: 'var(--dms-info-soft)', border: '1px solid var(--dms-info-soft-border)' }}>
              <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-r-transparent" style={{ borderColor: '#1E40AF', borderRightColor: 'transparent' }}></div>
              <p className="text-sm font-medium" style={{ color: 'var(--dms-link)' }}>
                {dryRun ? 'Validating' : 'Importing'} {totalRows.toLocaleString()} rows across {importableCount} sheet{importableCount !== 1 ? 's' : ''}…
              </p>
            </div>
          )}

          {stage === 'done' && (
            <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--dms-success-callout)', border: '1px solid var(--dms-success-border)' }}>
              <div className="flex items-start gap-4">
                <CheckCircle2 className="w-10 h-10 flex-shrink-0" style={{ color: '#16A34A' }} />
                <div className="flex-1">
                  <h3 className="text-lg font-bold" style={{ color: 'var(--dms-success-text)' }}>
                    {dryRun ? 'Validation Complete' : 'Import Complete'}
                  </h3>
                  <p className="text-sm mt-1" style={{ color: '#166534' }}>
                    {dryRun
                      ? `${totalRows.toLocaleString()} rows passed validation across ${importableCount} sheets. No data was written. Re-run with "Dry run" off to commit.`
                      : `Successfully imported ${totalRows.toLocaleString()} rows across ${importableCount} sheets using ${importMode} mode.`}
                  </p>
                  <div className="mt-4 flex gap-3">
                    {dryRun && (
                      <Button variant="primary" size="sm" onClick={() => { setDryRun(false); setStage('mapping'); setSheets(sampleSheets); }}>
                        Run Real Import
                      </Button>
                    )}
                    <Button variant="secondary" size="sm" onClick={reset}>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Another File
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--dms-error-callout)', border: '1px solid var(--dms-error-border)' }}>
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 mt-0.5" style={{ color: 'var(--dms-error-text)' }} />
          <div>
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--dms-error-text)' }}>Use with caution</p>
            <ul className="text-sm space-y-1" style={{ color: 'var(--dms-error-text)' }}>
              <li>• Always run a <strong>Dry run</strong> first against the real workbook to surface mapping errors.</li>
              <li>• <strong>Replace</strong> mode permanently deletes existing master data for the matched entity — back up first.</li>
              <li>• <strong>Upsert</strong> matches by code (Product Code, Outlet Code, Ingredient Code, etc.) — make sure codes are unique.</li>
              <li>• Macro sheets (.xlsm formulas) are evaluated server-side; unsupported macros are skipped with a warning.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
