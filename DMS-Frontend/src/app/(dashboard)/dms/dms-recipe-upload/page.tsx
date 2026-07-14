'use client';

import { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { Upload, FileText, CheckCircle2, AlertTriangle, XCircle, Download, RefreshCw, FileSpreadsheet, Database } from 'lucide-react';

type RowStatus = 'valid' | 'warning' | 'error';
type UploadStage = 'idle' | 'uploading' | 'parsing' | 'preview' | 'committing' | 'committed';

interface ParsedRow {
  id: number;
  productCode: string;
  productName: string;
  ingredientCode: string;
  ingredientName: string;
  qtyPerUnit: number;
  unit: string;
  status: RowStatus;
  message?: string;
}

const sampleParsed: ParsedRow[] = [
  { id: 1, productCode: 'BR2', productName: 'Sandwich Bread Large', ingredientCode: 'FL01', ingredientName: 'Wheat Flour', qtyPerUnit: 0.45, unit: 'kg', status: 'valid' },
  { id: 2, productCode: 'BR2', productName: 'Sandwich Bread Large', ingredientCode: 'YS01', ingredientName: 'Yeast', qtyPerUnit: 0.008, unit: 'kg', status: 'valid' },
  { id: 3, productCode: 'BR2', productName: 'Sandwich Bread Large', ingredientCode: 'SU01', ingredientName: 'Sugar', qtyPerUnit: 0.025, unit: 'kg', status: 'valid' },
  { id: 4, productCode: 'BR2', productName: 'Sandwich Bread Large', ingredientCode: 'SL01', ingredientName: 'Salt', qtyPerUnit: 0.009, unit: 'kg', status: 'valid' },
  { id: 5, productCode: 'BU10', productName: 'Vegetable Bun', ingredientCode: 'FL01', ingredientName: 'Wheat Flour', qtyPerUnit: 0.060, unit: 'kg', status: 'valid' },
  { id: 6, productCode: 'BU10', productName: 'Vegetable Bun', ingredientCode: 'VG01', ingredientName: 'Vegetable Mix', qtyPerUnit: 0.040, unit: 'kg', status: 'warning', message: 'Ingredient newly created during import' },
  { id: 7, productCode: 'BU12', productName: 'Fish Bun', ingredientCode: 'FI01', ingredientName: 'Fish Filling', qtyPerUnit: 0.045, unit: 'kg', status: 'valid' },
  { id: 8, productCode: 'PZ8', productName: 'Chicken Pizza Large', ingredientCode: 'CH01', ingredientName: 'Chicken Breast', qtyPerUnit: 0.150, unit: 'kg', status: 'valid' },
  { id: 9, productCode: 'PZ8', productName: 'Chicken Pizza Large', ingredientCode: '???', ingredientName: 'Mozzarella Cheese', qtyPerUnit: 0.080, unit: 'kg', status: 'error', message: 'Ingredient code missing — cannot map' },
  { id: 10, productCode: 'CK4', productName: 'Birthday Cake 1kg', ingredientCode: 'EG01', ingredientName: 'Eggs', qtyPerUnit: 0.250, unit: 'kg', status: 'valid' },
  { id: 11, productCode: 'CK4', productName: 'Birthday Cake 1kg', ingredientCode: 'BU01', ingredientName: 'Butter', qtyPerUnit: 0.180, unit: 'kg', status: 'valid' },
  { id: 12, productCode: 'XY99', productName: 'Unknown Product', ingredientCode: 'FL01', ingredientName: 'Wheat Flour', qtyPerUnit: 0.100, unit: 'kg', status: 'error', message: 'Product code XY99 not found in master' },
];

export default function DmsRecipeUploadPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<UploadStage>('idle');
  const [fileName, setFileName] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const validCount = parsedRows.filter(r => r.status === 'valid').length;
  const warningCount = parsedRows.filter(r => r.status === 'warning').length;
  const errorCount = parsedRows.filter(r => r.status === 'error').length;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setStage('uploading');
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setStage('parsing');
          setTimeout(() => {
            setParsedRows(sampleParsed);
            setStage('preview');
          }, 800);
          return 100;
        }
        return prev + 10;
      });
    }, 80);
  };

  const handleCommit = () => {
    if (errorCount > 0) {
      const ok = confirm(`There are ${errorCount} errors. Only valid rows will be imported. Continue?`);
      if (!ok) return;
    }
    setStage('committing');
    setTimeout(() => {
      setStage('committed');
    }, 1200);
  };

  const handleReset = () => {
    setStage('idle');
    setFileName('');
    setParsedRows([]);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadTemplate = () => {
    alert('Recipe template (recipe_upload_template.xlsx) would download here.');
  };

  const statusBadge = (status: RowStatus) => {
    if (status === 'valid') return <Badge variant="success" size="sm"><CheckCircle2 className="w-3 h-3 mr-1" />Valid</Badge>;
    if (status === 'warning') return <Badge variant="warning" size="sm"><AlertTriangle className="w-3 h-3 mr-1" />Warning</Badge>;
    return <Badge variant="danger" size="sm"><XCircle className="w-3 h-3 mr-1" />Error</Badge>;
  };

  const columns = [
    { key: 'status', label: 'Status', render: (r: ParsedRow) => statusBadge(r.status) },
    { key: 'productCode', label: 'Product Code', render: (r: ParsedRow) => <span className="font-mono text-xs">{r.productCode}</span> },
    { key: 'productName', label: 'Product Name' },
    { key: 'ingredientCode', label: 'Ingredient Code', render: (r: ParsedRow) => <span className="font-mono text-xs">{r.ingredientCode}</span> },
    { key: 'ingredientName', label: 'Ingredient Name' },
    { key: 'qtyPerUnit', label: 'Qty/Unit', render: (r: ParsedRow) => <span className="font-medium">{r.qtyPerUnit}</span> },
    { key: 'unit', label: 'UoM', render: (r: ParsedRow) => <Badge variant="neutral" size="sm">{r.unit}</Badge> },
    { key: 'message', label: 'Notes', render: (r: ParsedRow) => r.message ? <span className="text-xs" style={{ color: r.status === 'error' ? '#DC2626' : '#92400E' }}>{r.message}</span> : <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>—</span> },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>DMS Recipe Upload</h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Bulk import product recipes from Excel/CSV with validation
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="md" onClick={downloadTemplate}>
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>
          {stage !== 'idle' && (
            <Button variant="secondary" size="md" onClick={handleReset}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Start Over
            </Button>
          )}
        </div>
      </div>

      {stage === 'idle' && (
        <Card>
          <CardContent>
            <div
              className="rounded-lg p-12 text-center cursor-pointer transition-all"
              style={{
                border: '2px dashed #D1D5DB',
                backgroundColor: 'var(--muted)',
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--muted-foreground)' }} />
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                Drop your Excel / CSV file here
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
                Or click to browse. Supported formats: .xlsx, .xlsm, .xls, .csv
              </p>
              <Button variant="primary" size="md">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Choose File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xlsm,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <p className="text-xs mt-6" style={{ color: 'var(--muted-foreground)' }}>
                Required columns: Product Code, Product Name, Ingredient Code, Ingredient Name, Qty/Unit, UoM
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {stage === 'uploading' && (
        <Card>
          <CardContent>
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto mb-4" style={{ color: '#C8102E' }} />
              <h3 className="text-lg font-semibold mb-1">Uploading {fileName}</h3>
              <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
                {uploadProgress}% complete
              </p>
              <div className="max-w-md mx-auto h-2 rounded-full" style={{ backgroundColor: 'var(--input)' }}>
                <div
                  className="h-2 rounded-full transition-all"
                  style={{ backgroundColor: '#C8102E', width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {stage === 'parsing' && (
        <Card>
          <CardContent>
            <div className="text-center py-8">
              <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-r-transparent mb-4" style={{ borderColor: '#C8102E', borderRightColor: 'transparent' }}></div>
              <h3 className="text-lg font-semibold">Parsing & validating rows…</h3>
              <p className="text-sm mt-2" style={{ color: 'var(--muted-foreground)' }}>
                Cross-checking against product, ingredient and UoM masters
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {stage === 'preview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Total Rows</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: 'var(--foreground)' }}>{parsedRows.length}</p>
                  </div>
                  <FileText className="w-8 h-8" style={{ color: 'var(--muted-foreground)' }} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Valid</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: '#10B981' }}>{validCount}</p>
                  </div>
                  <CheckCircle2 className="w-8 h-8" style={{ color: '#10B981' }} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Warnings</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: '#F59E0B' }}>{warningCount}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8" style={{ color: '#F59E0B' }} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Errors</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: '#DC2626' }}>{errorCount}</p>
                  </div>
                  <XCircle className="w-8 h-8" style={{ color: '#DC2626' }} />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Preview — {fileName}</CardTitle>
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" onClick={handleReset}>Cancel</Button>
                  <Button variant="primary" size="md" onClick={handleCommit} disabled={validCount === 0}>
                    <Database className="w-4 h-4 mr-2" />
                    Commit {validCount} Valid Row{validCount !== 1 ? 's' : ''}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable data={parsedRows} columns={columns} />
            </CardContent>
          </Card>
        </>
      )}

      {stage === 'committing' && (
        <Card>
          <CardContent>
            <div className="text-center py-8">
              <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-r-transparent mb-4" style={{ borderColor: '#C8102E', borderRightColor: 'transparent' }}></div>
              <h3 className="text-lg font-semibold">Importing recipes…</h3>
              <p className="text-sm mt-2" style={{ color: 'var(--muted-foreground)' }}>
                Writing {validCount} rows to recipe master
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {stage === 'committed' && (
        <Card>
          <CardContent>
            <div className="text-center py-8">
              <CheckCircle2 className="w-16 h-16 mx-auto mb-4" style={{ color: '#10B981' }} />
              <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>Import Complete</h3>
              <p className="text-sm mb-6" style={{ color: 'var(--muted-foreground)' }}>
                Successfully imported <strong>{validCount}</strong> recipe row{validCount !== 1 ? 's' : ''} from <strong>{fileName}</strong>.
                {errorCount > 0 && ` ${errorCount} row${errorCount !== 1 ? 's were' : ' was'} skipped.`}
              </p>
              <div className="flex justify-center gap-3">
                <Button variant="secondary" size="md" onClick={handleReset}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Another File
                </Button>
                <Button variant="primary" size="md">
                  <FileText className="w-4 h-4 mr-2" />
                  View Recipe Management
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--dms-warn-box)', border: '1px solid var(--dms-warn-box-border)' }}>
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 mt-0.5" style={{ color: 'var(--dms-warn-label)' }} />
          <div>
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--dms-warn-label)' }}>Validation Rules</p>
            <ul className="text-sm space-y-1" style={{ color: 'var(--dms-warn-label)' }}>
              <li>• <strong>Error</strong>: Product or Ingredient code does not match master — row is skipped on commit.</li>
              <li>• <strong>Warning</strong>: Auto-creation will run (e.g. new ingredient). Row is still imported.</li>
              <li>• Existing recipe rows for the same Product+Ingredient pair are <strong>updated</strong>; new ones are inserted.</li>
              <li>• Quantities must be in the canonical UoM declared on the ingredient master.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
