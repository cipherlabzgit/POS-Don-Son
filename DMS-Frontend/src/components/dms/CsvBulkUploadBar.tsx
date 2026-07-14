'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, Download, Upload, XCircle } from 'lucide-react';
import PermissionButton from '@/components/auth/PermissionButton';
import Button from '@/components/ui/button';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  buildCsvTemplate,
  csvMatrixToRecords,
  downloadTextFile,
  parseCsvAuto,
  type CsvRowRecord,
} from '@/lib/csv-utils';
import toast from 'react-hot-toast';

export interface CsvColumnMeta {
  /** Exact header text in the template and uploaded file */
  header: string;
}

export interface CsvPreviewRow {
  row: number;
  data: CsvRowRecord;
  status: 'valid' | 'invalid';
  /** Error text, or short success hint */
  detail: string;
}

export interface CsvBulkUploadBarProps<T = unknown> {
  /** Shown in toasts */
  entityLabel: string;
  templateFilename: string;
  columns: CsvColumnMeta[];
  /**
   * CSV headers to show in the import preview table (subset of `columns[].header`).
   * When omitted, every column is shown (fine for short templates; wide for products/ingredients).
   * Pass the same “main fields” you show on the list page for a compact preview like Category / UOM.
   */
  previewDataHeaders?: string[];
  /** Optional example row(s) included in the downloaded template */
  exampleRows?: string[][];
  /** If omitted, actions are shown without a permission gate */
  permission?: string | string[];
  permissionMode?: 'any' | 'all';
  mapRow: (row: CsvRowRecord, excelRowNumber: number) => Promise<{ ok: true; value: T } | { ok: false; error: string }>;
  importRow: (value: T) => Promise<unknown>;
  onImportComplete?: () => void;
}

function pickDisplayName(data: CsvRowRecord, headers: string[]): string {
  const fn = data.firstName?.trim();
  const ln = data.lastName?.trim();
  if (fn || ln) return [fn, ln].filter(Boolean).join(' ').trim();
  const prefs = ['name', 'email', 'description', 'code', 'ingredientType', 'title'];
  for (const p of prefs) {
    const v = data[p]?.trim();
    if (v) return v;
  }
  for (const h of headers) {
    const v = data[h]?.trim();
    if (v) return v;
  }
  return '—';
}

export default function CsvBulkUploadBar<T>({
  entityLabel,
  templateFilename,
  columns,
  previewDataHeaders,
  exampleRows = [],
  permission,
  permissionMode = 'any',
  mapRow,
  importRow,
  onImportComplete,
}: CsvBulkUploadBarProps<T>) {
  const headers = columns.map((c) => c.header);
  const previewHeaders =
    previewDataHeaders?.length ?
      previewDataHeaders.filter((h) => headers.includes(h))
    : headers;
  const tablePreviewHeaders = previewHeaders.length > 0 ? previewHeaders : headers;
  const inputRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<{ value: T; row: number }[]>([]);
  const [parseErrors, setParseErrors] = useState<{ row: number; message: string }[]>([]);
  const [previewRows, setPreviewRows] = useState<CsvPreviewRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [errorReportOpen, setErrorReportOpen] = useState(false);

  useEffect(() => {
    if (parseErrors.length === 0) setErrorReportOpen(false);
  }, [parseErrors.length]);

  const downloadTemplate = useCallback(() => {
    const csv = buildCsvTemplate(headers, exampleRows);
    downloadTextFile(templateFilename, csv);
  }, [headers, exampleRows, templateFilename]);

  const resetFileInput = () => {
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleFile = async (file: File | null) => {
    setParsed([]);
    setParseErrors([]);
    setPreviewRows([]);
    setSelectedLabel(null);
    if (!file) return;
    
    console.log('[CSV Upload] File selected:', file.name, 'Size:', file.size, 'bytes');
    setSelectedLabel(file.name);
    
    try {
      console.log('[CSV Upload] Reading file...');
      const text = await file.text();
      console.log('[CSV Upload] File read successfully, length:', text.length);
      
      console.log('[CSV Upload] Parsing CSV...');
      const matrix = parseCsvAuto(text);
      console.log('[CSV Upload] CSV parsed, rows:', matrix.length);
      
      console.log('[CSV Upload] Expected headers:', headers);
      const { rows, error } = csvMatrixToRecords(matrix, headers);
      console.log('[CSV Upload] Matrix to records result - rows:', rows.length, 'error:', error);
      
      if (error) {
        console.error('[CSV Upload] Header validation error:', error);
        toast.error(error);
        setSelectedLabel(null);
        resetFileInput();
        return;
      }

      const values: { value: T; row: number }[] = [];
      const errs: { row: number; message: string }[] = [];
      const preview: CsvPreviewRow[] = [];

      console.log('[CSV Upload] Starting row validation for', rows.length, 'rows...');
      for (let i = 0; i < rows.length; i++) {
        const excelRow = i + 2;
        console.log(`[CSV Upload] Validating row ${excelRow}:`, rows[i]);
        
        try {
          const mapped = await mapRow(rows[i], excelRow);
          if (mapped.ok === false) {
            console.warn(`[CSV Upload] Row ${excelRow} validation failed:`, mapped.error);
            errs.push({ row: excelRow, message: mapped.error });
            preview.push({
              row: excelRow,
              data: rows[i],
              status: 'invalid',
              detail: mapped.error,
            });
          } else {
            console.log(`[CSV Upload] Row ${excelRow} validated successfully`);
            values.push({ value: mapped.value, row: excelRow });
            preview.push({
              row: excelRow,
              data: rows[i],
              status: 'valid',
              detail: 'Ready to import',
            });
          }
        } catch (mapError) {
          console.error(`[CSV Upload] Row ${excelRow} mapping threw exception:`, mapError);
          const errorMsg = mapError instanceof Error ? mapError.message : 'Unknown error during row mapping';
          errs.push({ row: excelRow, message: errorMsg });
          preview.push({
            row: excelRow,
            data: rows[i],
            status: 'invalid',
            detail: errorMsg,
          });
        }
      }
      
      console.log('[CSV Upload] Validation complete - Valid:', values.length, 'Invalid:', errs.length);

      setParseErrors(errs);
      setParsed(values);
      setPreviewRows(preview);

      if (errs.length && !values.length) {
        toast.error(`${entityLabel}: all rows failed validation. Review the preview or open the full report.`);
      } else if (errs.length) {
        toast(`${entityLabel}: ${values.length} valid, ${errs.length} invalid. Review the preview before importing.`, {
          icon: '⚠️',
        });
      } else if (values.length) {
        toast.success(`${entityLabel}: ${values.length} row(s) validated — review the preview, then click Import.`);
      } else {
        toast.error('No data rows found in CSV.');
        setSelectedLabel(null);
        resetFileInput();
      }
    } catch (e: unknown) {
      console.error('[CSV Upload] Fatal error during file processing:', e);
      const errorMessage = e instanceof Error ? e.message : 'Failed to read CSV';
      toast.error(`CSV Upload Error: ${errorMessage}`);
      setSelectedLabel(null);
      resetFileInput();
    } finally {
      if (!file.size) resetFileInput();
    }
  };

  const runImport = async () => {
    if (!parsed.length) return;
    setImporting(true);
    let ok = 0;
    const failures: { row: number; message: string }[] = [];
    for (const item of parsed) {
      try {
        await importRow(item.value);
        ok += 1;
      } catch (e: unknown) {
        const ax = e && typeof e === 'object' && 'response' in e ? (e as { response?: { data?: unknown } }).response?.data : undefined;
        let msg = '';
        if (ax && typeof ax === 'object') {
          const d = ax as { message?: string; error?: { message?: string } };
          msg = d.message ?? d.error?.message ?? '';
        }
        failures.push({
          row: item.row,
          message: msg || (e instanceof Error ? e.message : 'Request failed'),
        });
      }
    }
    setImporting(false);
    setPreviewRows([]);
    if (failures.length === 0) {
      toast.success(`Imported ${ok} ${entityLabel} record(s).`);
      setParsed([]);
      setParseErrors([]);
      setSelectedLabel(null);
      resetFileInput();
      onImportComplete?.();
    } else {
      toast.error(`Imported ${ok}, failed ${failures.length}. See the import issues report.`);
      setParseErrors(failures);
      setParsed([]);
      setErrorReportOpen(true);
    }
  };

  const triggerPick = () => inputRef.current?.click();

  const validCount = previewRows.filter((r) => r.status === 'valid').length;
  const invalidCount = previewRows.filter((r) => r.status === 'invalid').length;

  return (
    <div className="flex flex-col gap-3 w-full min-w-0 max-w-full">
      <div className="flex flex-wrap items-center gap-2 justify-end">
        <PermissionButton
          permission={permission}
          mode={permissionMode}
          type="button"
          variant="secondary"
          size="md"
          onClick={downloadTemplate}
        >
          <Download className="w-4 h-4 mr-2" />
          CSV template
        </PermissionButton>
        <PermissionButton
          permission={permission}
          mode={permissionMode}
          type="button"
          variant="secondary"
          size="md"
          onClick={triggerPick}
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload CSV
        </PermissionButton>
        <PermissionButton
          permission={permission}
          mode={permissionMode}
          type="button"
          variant="primary"
          size="md"
          disabled={!parsed.length || importing}
          onClick={runImport}
        >
          {importing ? 'Importing…' : `Import${parsed.length ? ` (${parsed.length})` : ''}`}
        </PermissionButton>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            void handleFile(f);
          }}
        />
      </div>
      {selectedLabel && (
        <p className="text-xs text-right sm:text-left" style={{ color: 'var(--muted-foreground)' }}>
          Selected: {selectedLabel}
        </p>
      )}
      {parseErrors.length > 0 && previewRows.length === 0 && (
        <div
          className="flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-sm justify-between"
          style={{
            borderColor: '#FECACA',
            background: '#FEF2F2',
            color: '#7F1D1D',
          }}
        >
          <span className="font-medium">
            {parseErrors.length} issue{parseErrors.length === 1 ? '' : 's'} (see preview or report)
          </span>
          <button
            type="button"
            className="font-semibold underline underline-offset-2 hover:opacity-80 shrink-0"
            onClick={() => setErrorReportOpen(true)}
          >
            Open full report
          </button>
        </div>
      )}

      {previewRows.length > 0 && (
        <Card padding="none" className="overflow-hidden w-full">
          <div className="px-4 py-3 sm:px-6 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-base">Import preview</CardTitle>
                <p className="text-xs mt-1 font-normal" style={{ color: 'var(--muted-foreground)' }}>
                  Nothing is saved until you click Import. Row numbers match your spreadsheet (header is row 1).
                  {previewDataHeaders?.length ?
                    ' Key columns only; every column is still validated before import.'
                  : ''}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <Badge variant="success" size="sm">
                  {validCount} valid
                </Badge>
                {invalidCount > 0 && (
                  <Badge variant="danger" size="sm">
                    {invalidCount} invalid
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <CardContent className="p-0">
            <div className="overflow-x-auto overflow-y-auto max-h-[min(480px,55vh)] w-full">
              <table
                className={`w-full text-sm text-left border-collapse ${tablePreviewHeaders.length > 6 ? 'min-w-[640px]' : 'min-w-0'}`}
              >
                <thead className="sticky top-0 z-10" style={{ background: 'var(--muted)' }}>
                  <tr>
                    <th
                      scope="col"
                      className="px-3 py-2.5 font-semibold whitespace-nowrap w-14 border-b"
                      style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                    >
                      #
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2.5 font-semibold whitespace-nowrap border-b min-w-[140px]"
                      style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                    >
                      Name / label
                    </th>
                    {tablePreviewHeaders.map((h) => (
                      <th
                        key={h}
                        scope="col"
                        className="px-3 py-2.5 font-semibold whitespace-nowrap border-b max-w-[200px]"
                        style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                      >
                        {h}
                      </th>
                    ))}
                    <th
                      scope="col"
                      className="px-3 py-2.5 font-semibold whitespace-nowrap border-b w-32"
                      style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2.5 font-semibold border-b min-w-[200px]"
                      style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                    >
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((pr) => (
                    <tr
                      key={pr.row}
                      className="align-top"
                      style={{
                        borderBottom: '1px solid var(--border)',
                        backgroundColor: pr.status === 'invalid' ? '#FFC7C7' : 'transparent',
                      }}
                    >
                      <td className="px-3 py-2 font-mono font-medium whitespace-nowrap">{pr.row}</td>
                      <td className="px-3 py-2 font-medium whitespace-nowrap max-w-[200px] truncate" title={pickDisplayName(pr.data, headers)}>
                        {pickDisplayName(pr.data, headers)}
                      </td>
                      {tablePreviewHeaders.map((h) => (
                        <td
                          key={h}
                          className="px-3 py-2 max-w-[200px] truncate align-top"
                          style={{ color: 'var(--foreground)' }}
                          title={pr.data[h] ?? ''}
                        >
                          {pr.data[h] ?? ''}
                        </td>
                      ))}
                      <td className="px-3 py-2 whitespace-nowrap align-top">
                        {pr.status === 'valid' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden />
                            OK
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-700 font-medium">
                            <XCircle className="w-4 h-4 shrink-0" aria-hidden />
                            Error
                          </span>
                        )}
                      </td>
                      <td
                        className="px-3 py-2 align-top text-xs sm:text-sm"
                        style={{ color: pr.status === 'valid' ? 'var(--muted-foreground)' : '#991B1B' }}
                      >
                        {pr.detail}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Modal
        isOpen={errorReportOpen && parseErrors.length > 0}
        onClose={() => setErrorReportOpen(false)}
        title={`Import issues (${parseErrors.length}) — ${entityLabel}`}
        size="full"
      >
        <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
          Spreadsheet row numbers include the header row (row 2 is the first data row).
        </p>
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <div className="overflow-x-auto overflow-y-auto max-h-[min(75vh,calc(100vh-220px))]">
            <table className="w-full text-sm text-left border-collapse min-w-[480px]">
              <thead className="sticky top-0 z-10" style={{ background: 'var(--muted)' }}>
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 font-semibold whitespace-nowrap w-28"
                    style={{ color: 'var(--foreground)', borderBottom: '1px solid var(--border)' }}
                  >
                    Row
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 font-semibold"
                    style={{ color: 'var(--foreground)', borderBottom: '1px solid var(--border)' }}
                  >
                    Message
                  </th>
                </tr>
              </thead>
              <tbody>
                {parseErrors.map((e, idx) => (
                  <tr
                    key={`${e.row}-${idx}`}
                    style={{ borderBottom: '1px solid var(--border)' }}
                    className="align-top"
                  >
                    <td className="px-4 py-2.5 font-mono font-semibold whitespace-nowrap">{e.row}</td>
                    <td className="px-4 py-2.5" style={{ color: '#991B1B' }}>
                      {e.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <ModalFooter>
          <Button type="button" variant="primary" size="md" onClick={() => setErrorReportOpen(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
