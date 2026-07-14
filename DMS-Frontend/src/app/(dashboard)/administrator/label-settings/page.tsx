'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { ProtectedPage } from '@/components/auth';
import { usePermissions } from '@/hooks/usePermissions';
import { Printer, Plus, Loader2, Settings, MessageSquare, LayoutTemplate } from 'lucide-react';
import { labelPrintersApi, type LabelPrinter, getLabelPrintersErrorMessage } from '@/lib/api/label-printers';
import {
  labelPrintingCommentsApi,
  type LabelPrintingComment,
  getLabelPrintingCommentsErrorMessage,
} from '@/lib/api/label-printing-comments';
import { labelTemplatesApi, type LabelTemplate, getLabelTemplatesErrorMessage } from '@/lib/api/label-templates';
import toast from 'react-hot-toast';

type PrinterModalMode = 'add' | 'edit';

export default function LabelSettingsPage() {
  const { can } = usePermissions();

  const [loading, setLoading] = useState(true);
  const [printers, setPrinters] = useState<LabelPrinter[]>([]);
  const [comments, setComments] = useState<LabelPrintingComment[]>([]);
  const [templates, setTemplates] = useState<LabelTemplate[]>([]);

  const [printerModalOpen, setPrinterModalOpen] = useState(false);
  const [printerModalMode, setPrinterModalMode] = useState<PrinterModalMode>('add');
  const [printerEditingId, setPrinterEditingId] = useState<string | null>(null);
  const [printerName, setPrinterName] = useState('');
  const [printerSortOrder, setPrinterSortOrder] = useState(0);
  const [printerIsActive, setPrinterIsActive] = useState(true);
  const [printerSaving, setPrinterSaving] = useState(false);

  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [commentModalMode, setCommentModalMode] = useState<PrinterModalMode>('add');
  const [commentEditingId, setCommentEditingId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [commentSortOrder, setCommentSortOrder] = useState(0);
  const [commentIsActive, setCommentIsActive] = useState(true);
  const [commentSaving, setCommentSaving] = useState(false);

  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateEditing, setTemplateEditing] = useState<LabelTemplate | null>(null);
  const [templatePrinterId, setTemplatePrinterId] = useState<string>('');
  const [templateSaving, setTemplateSaving] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      const [pList, cList] = await Promise.all([
        labelPrintersApi.getAll(false),
        labelPrintingCommentsApi.getAll(false),
      ]);
      setPrinters(pList);
      setComments(cList);
      if (can('label-templates:view')) {
        const tRes = await labelTemplatesApi.getAll(1, 500, undefined, undefined);
        setTemplates(tRes.labelTemplates);
      } else {
        setTemplates([]);
      }
    } catch (err: unknown) {
      toast.error(getLabelPrintersErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [can]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const openAddPrinter = () => {
    const nextOrder = printers.length ? Math.max(...printers.map((p) => p.sortOrder)) + 1 : 0;
    setPrinterModalMode('add');
    setPrinterEditingId(null);
    setPrinterName('');
    setPrinterSortOrder(nextOrder);
    setPrinterIsActive(true);
    setPrinterModalOpen(true);
  };

  const openEditPrinter = (p: LabelPrinter) => {
    setPrinterModalMode('edit');
    setPrinterEditingId(p.id);
    setPrinterName(p.name);
    setPrinterSortOrder(p.sortOrder);
    setPrinterIsActive(p.isActive);
    setPrinterModalOpen(true);
  };

  const savePrinter = async () => {
    if (!printerName.trim()) {
      toast.error('Printer name is required');
      return;
    }
    try {
      setPrinterSaving(true);
      if (printerModalMode === 'add') {
        await labelPrintersApi.create({ name: printerName.trim(), sortOrder: printerSortOrder });
        toast.success('Printer added');
      } else if (printerEditingId) {
        await labelPrintersApi.update(printerEditingId, {
          name: printerName.trim(),
          sortOrder: printerSortOrder,
          isActive: printerIsActive,
        });
        toast.success('Printer updated');
      }
      setPrinterModalOpen(false);
      await loadAll();
    } catch (err: unknown) {
      toast.error(getLabelPrintersErrorMessage(err));
    } finally {
      setPrinterSaving(false);
    }
  };

  const openAddComment = () => {
    const nextOrder = comments.length ? Math.max(...comments.map((c) => c.sortOrder)) + 1 : 0;
    setCommentModalMode('add');
    setCommentEditingId(null);
    setCommentText('');
    setCommentSortOrder(nextOrder);
    setCommentIsActive(true);
    setCommentModalOpen(true);
  };

  const openEditComment = (c: LabelPrintingComment) => {
    setCommentModalMode('edit');
    setCommentEditingId(c.id);
    setCommentText(c.commentText);
    setCommentSortOrder(c.sortOrder);
    setCommentIsActive(c.isActive);
    setCommentModalOpen(true);
  };

  const saveComment = async () => {
    if (!commentText.trim()) {
      toast.error('Comment text is required');
      return;
    }
    try {
      setCommentSaving(true);
      if (commentModalMode === 'add') {
        await labelPrintingCommentsApi.create({ commentText: commentText.trim(), sortOrder: commentSortOrder });
        toast.success('Comment added');
      } else if (commentEditingId) {
        await labelPrintingCommentsApi.update(commentEditingId, {
          commentText: commentText.trim(),
          sortOrder: commentSortOrder,
          isActive: commentIsActive,
        });
        toast.success('Comment updated');
      }
      setCommentModalOpen(false);
      await loadAll();
    } catch (err: unknown) {
      toast.error(getLabelPrintingCommentsErrorMessage(err));
    } finally {
      setCommentSaving(false);
    }
  };

  const openAssignTemplate = (t: LabelTemplate) => {
    setTemplateEditing(t);
    setTemplatePrinterId(t.labelPrinterId ?? '');
    setTemplateModalOpen(true);
  };

  const saveTemplatePrinter = async () => {
    if (!templateEditing) return;
    try {
      setTemplateSaving(true);
      const id = templatePrinterId || null;
      await labelTemplatesApi.assignPrinter(templateEditing.id, id);
      toast.success('Template printer updated');
      setTemplateModalOpen(false);
      setTemplateEditing(null);
      await loadAll();
    } catch (err: unknown) {
      toast.error(getLabelTemplatesErrorMessage(err));
    } finally {
      setTemplateSaving(false);
    }
  };

  const printerOptionsForSelect = [
    { value: '', label: '(No printer assigned)' },
    ...printers.filter((p) => p.isActive).map((p) => ({ value: p.id, label: p.name })),
  ];

  const printerColumns = [
    {
      key: 'name',
      label: 'Printer name',
      render: (item: LabelPrinter) => <span className="font-medium">{item.name}</span>,
    },
    {
      key: 'sortOrder',
      label: 'Order',
      render: (item: LabelPrinter) => <span className="text-sm text-muted-foreground">{item.sortOrder}</span>,
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (item: LabelPrinter) => (
        <span className="text-sm" style={{ color: item.isActive ? 'var(--foreground)' : 'var(--muted-foreground)' }}>
          {item.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: LabelPrinter) =>
        can('label-settings:edit') ? (
          <button
            type="button"
            onClick={() => openEditPrinter(item)}
            className="p-1.5 rounded transition-colors"
            style={{ color: 'var(--muted-foreground)' }}
            title="Edit printer"
            aria-label="Edit printer"
          >
            <Settings className="w-4 h-4" />
          </button>
        ) : null,
    },
  ];

  const templateColumns = [
    {
      key: 'name',
      label: 'Template',
      render: (item: LabelTemplate) => (
        <div>
          <span className="font-medium">{item.name}</span>
          <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {item.code}
          </div>
        </div>
      ),
    },
    {
      key: 'printer',
      label: 'Assigned printer',
      render: (item: LabelTemplate) => <span className="text-sm">{item.printerName?.trim() || '—'}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: LabelTemplate) =>
        can('label-templates:edit') ? (
          <button
            type="button"
            onClick={() => openAssignTemplate(item)}
            className="p-1.5 rounded transition-colors"
            style={{ color: 'var(--muted-foreground)' }}
            title="Set template printer"
            aria-label="Set template printer"
          >
            <Settings className="w-4 h-4" />
          </button>
        ) : null,
    },
  ];

  const commentColumns = [
    {
      key: 'commentText',
      label: 'Comments',
      render: (item: LabelPrintingComment) => <span className="font-medium">{item.commentText}</span>,
    },
    {
      key: 'sortOrder',
      label: 'Order',
      render: (item: LabelPrintingComment) => (
        <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {item.sortOrder}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: LabelPrintingComment) =>
        can('label-settings:edit') ? (
          <button
            type="button"
            onClick={() => openEditComment(item)}
            className="p-1.5 rounded transition-colors"
            style={{ color: 'var(--muted-foreground)' }}
            title="Edit comment"
            aria-label="Edit comment"
          >
            <Settings className="w-4 h-4" />
          </button>
        ) : null,
    },
  ];

  return (
    <ProtectedPage permission="label-settings:view">
      <div className="p-6 space-y-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: 'var(--foreground)' }}>
              <Printer className="w-8 h-8 shrink-0" style={{ color: '#C8102E' }} />
              Label settings
            </h1>
            <p className="mt-1 max-w-2xl" style={{ color: 'var(--muted-foreground)' }}>
              Define label printers, map each label template to a printer, and maintain predefined comments for
              printing on labels. Administrators only.
            </p>
          </div>
          <Link
            href="/administrator/label-key-settings"
            className="text-sm underline-offset-2 hover:underline shrink-0"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Label configuration keys (advanced)
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-10 h-10 animate-spin" style={{ color: '#C8102E' }} />
          </div>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold">Defined label printers</CardTitle>
                {can('label-settings:create') && (
                  <Button variant="primary" size="md" onClick={openAddPrinter}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add printer
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-0">
                <DataTable
                  embedded
                  data={printers}
                  columns={printerColumns}
                  hideRowsPerPage
                  currentPage={1}
                  totalPages={1}
                  pageSize={Math.max(printers.length, 1)}
                />
              </CardContent>
            </Card>

            {can('label-templates:view') && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <LayoutTemplate className="w-5 h-5" style={{ color: '#C8102E' }} />
                    Set template to printer
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <DataTable
                    embedded
                    data={templates}
                    columns={templateColumns}
                    hideRowsPerPage
                    currentPage={1}
                    totalPages={1}
                    pageSize={Math.max(templates.length, 1)}
                  />
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" style={{ color: '#C8102E' }} />
                  Defined label printing comments
                </CardTitle>
                {can('label-settings:create') && (
                  <Button variant="primary" size="md" onClick={openAddComment}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add comment
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-0">
                <DataTable
                  embedded
                  data={comments}
                  columns={commentColumns}
                  hideRowsPerPage
                  currentPage={1}
                  totalPages={1}
                  pageSize={Math.max(comments.length, 1)}
                />
              </CardContent>
            </Card>
          </>
        )}

        <Modal
          isOpen={printerModalOpen}
          onClose={() => !printerSaving && setPrinterModalOpen(false)}
          title={printerModalMode === 'add' ? 'Add printer' : 'Edit printer'}
        >
          <div className="space-y-4">
            <Input label="Printer name" value={printerName} onChange={(e) => setPrinterName(e.target.value)} fullWidth />
            <Input
              label="Sort order"
              type="number"
              value={String(printerSortOrder)}
              onChange={(e) => setPrinterSortOrder(parseInt(e.target.value, 10) || 0)}
              fullWidth
            />
            {printerModalMode === 'edit' && (
              <Toggle checked={printerIsActive} onChange={setPrinterIsActive} label="Active" />
            )}
          </div>
          <ModalFooter>
            <Button variant="ghost" type="button" onClick={() => setPrinterModalOpen(false)} disabled={printerSaving}>
              Cancel
            </Button>
            <Button variant="primary" type="button" onClick={savePrinter} disabled={printerSaving}>
              {printerSaving ? 'Saving…' : 'Save'}
            </Button>
          </ModalFooter>
        </Modal>

        <Modal
          isOpen={commentModalOpen}
          onClose={() => !commentSaving && setCommentModalOpen(false)}
          title={commentModalMode === 'add' ? 'Add printing comment' : 'Edit printing comment'}
        >
          <div className="space-y-4">
            <Input label="Comment" value={commentText} onChange={(e) => setCommentText(e.target.value)} fullWidth />
            <Input
              label="Sort order"
              type="number"
              value={String(commentSortOrder)}
              onChange={(e) => setCommentSortOrder(parseInt(e.target.value, 10) || 0)}
              fullWidth
            />
            {commentModalMode === 'edit' && <Toggle checked={commentIsActive} onChange={setCommentIsActive} label="Active" />}
          </div>
          <ModalFooter>
            <Button variant="ghost" type="button" onClick={() => setCommentModalOpen(false)} disabled={commentSaving}>
              Cancel
            </Button>
            <Button variant="primary" type="button" onClick={saveComment} disabled={commentSaving}>
              {commentSaving ? 'Saving…' : 'Save'}
            </Button>
          </ModalFooter>
        </Modal>

        <Modal
          isOpen={templateModalOpen}
          onClose={() => !templateSaving && setTemplateModalOpen(false)}
          title="Assign printer to template"
        >
          {templateEditing && (
            <>
              <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
                Template: <strong>{templateEditing.name}</strong>
              </p>
              <Select
                label="Printer"
                fullWidth
                value={templatePrinterId}
                onChange={(e) => setTemplatePrinterId(e.target.value)}
                options={printerOptionsForSelect}
              />
              <ModalFooter>
                <Button variant="ghost" type="button" onClick={() => setTemplateModalOpen(false)} disabled={templateSaving}>
                  Cancel
                </Button>
                <Button variant="primary" type="button" onClick={saveTemplatePrinter} disabled={templateSaving}>
                  {templateSaving ? 'Saving…' : 'Save'}
                </Button>
              </ModalFooter>
            </>
          )}
        </Modal>
      </div>
    </ProtectedPage>
  );
}
