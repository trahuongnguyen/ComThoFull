import React, { useEffect, useRef, useState } from 'react';
import {
  Download,
  FileText,
  Minus,
  Plus,
  Printer,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  DEFAULT_PRINT_SETTINGS,
  PAPER_SIZE_LABELS,
  type PaperSize,
  type PrintSettings,
  downloadPdfBlob,
  loadPrintSettings,
  printPdfBlob,
  savePrintSettings,
} from '@/lib/print-service';

interface PrintModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfBlob: Blob | null;
  title?: string;
}

export function PrintModal({
  open,
  onOpenChange,
  pdfBlob,
  title = 'In hóa đơn',
}: PrintModalProps) {
  const { toast } = useToast();
  const [isPrinting, setIsPrinting] = useState(false);
  const [settings, setSettings] = useState<PrintSettings>(DEFAULT_PRINT_SETTINGS);

  // Stable blob URL — created once per pdfBlob instance, revoked on cleanup
  const blobUrlRef = useRef<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Load persisted settings when modal opens
  useEffect(() => {
    if (open) {
      setSettings(loadPrintSettings());
    }
  }, [open]);

  // Manage blob URL lifecycle — create only when blob changes, revoke on cleanup
  useEffect(() => {
    if (!pdfBlob) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(pdfBlob);
    blobUrlRef.current = url;
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
      blobUrlRef.current = null;
    };
  }, [pdfBlob]);

  const updateSetting = <K extends keyof PrintSettings>(
    key: K,
    value: PrintSettings[K]
  ) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      if (next.autoSave) savePrintSettings(next);
      return next;
    });
  };

  const handlePrint = () => {
    if (!pdfBlob) return;
    setIsPrinting(true);

    if (settings.autoSave) {
      savePrintSettings(settings);
    }

    printPdfBlob(pdfBlob, (result) => {
      setIsPrinting(false);
      if (result.success) {
        toast({
          title: 'Đang in…',
          description: 'Hộp thoại in đã mở. Chọn máy in và xác nhận để hoàn tất.',
        });
      } else {
        toast({
          title: 'Lỗi in ấn',
          description: result.error ?? 'Không thể mở hộp thoại in.',
          variant: 'destructive',
        });
      }
    });
  };

  const handleDownload = () => {
    if (!pdfBlob) return;
    const filename = `${title.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`;
    downloadPdfBlob(pdfBlob, filename);
    toast({ title: 'Đang tải xuống…', description: filename });
  };

  const handleSaveSettings = () => {
    savePrintSettings(settings);
    toast({ title: 'Đã lưu cài đặt in', description: 'Cài đặt sẽ được dùng cho lần in tiếp theo.' });
  };

  const adjustCopies = (delta: number) => {
    updateSetting('copies', Math.max(1, Math.min(10, settings.copies + delta)));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-full h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
          <DialogTitle className="text-lg flex items-center gap-2">
            <Printer className="w-5 h-5 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>

        {/* Body — two-panel layout */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* ── Left panel: PDF preview ──────────────────────────── */}
          <div className="flex-1 bg-muted/20 flex flex-col min-w-0 border-r border-border">
            <div className="px-4 py-2 border-b border-border/50 bg-muted/30 shrink-0">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Xem trước
              </span>
            </div>
            <div className="flex-1 overflow-hidden">
              {previewUrl ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-full border-none"
                  title="PDF Preview"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                  <FileText className="w-14 h-14 opacity-30" />
                  <span className="text-sm">Không có tài liệu để hiển thị</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Right panel: print configuration ─────────────────── */}
          <div className="w-64 shrink-0 flex flex-col bg-card overflow-y-auto">
            <div className="px-4 py-2 border-b border-border/50 bg-muted/30 shrink-0">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Cài đặt in
              </span>
            </div>

            <div className="flex-1 flex flex-col gap-5 px-4 py-5">
              {/* Printer hint */}
              <div className="space-y-1.5">
                <Label htmlFor="printer-hint" className="text-sm font-medium">
                  Máy in
                </Label>
                <Input
                  id="printer-hint"
                  placeholder="Tên máy in (ghi nhớ)…"
                  value={settings.printerHint}
                  onChange={(e) => updateSetting('printerHint', e.target.value)}
                  className="h-9 text-sm bg-secondary"
                />
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Ghi chú tên máy in để dễ chọn trong hộp thoại in.
                </p>
              </div>

              {/* Paper size */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Khổ giấy</Label>
                <Select
                  value={settings.paperSize}
                  onValueChange={(v) => updateSetting('paperSize', v as PaperSize)}
                >
                  <SelectTrigger className="h-9 text-sm bg-secondary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(PAPER_SIZE_LABELS) as [PaperSize, string][]).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value} className="text-sm">
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Copies */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Số bản in</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => adjustCopies(-1)}
                    disabled={settings.copies <= 1}
                    aria-label="Giảm số bản"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </Button>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={settings.copies}
                    onChange={(e) =>
                      updateSetting(
                        'copies',
                        Math.max(1, Math.min(10, parseInt(e.target.value) || 1))
                      )
                    }
                    className="h-9 text-center text-sm bg-secondary [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                    aria-label="Số bản in"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => adjustCopies(1)}
                    disabled={settings.copies >= 10}
                    aria-label="Tăng số bản"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
                {settings.copies > 1 && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 leading-snug">
                    Xác nhận số bản trong hộp thoại in của trình duyệt.
                  </p>
                )}
              </div>

              {/* Auto-save toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  id="auto-save"
                  type="checkbox"
                  checked={settings.autoSave}
                  onChange={(e) => updateSetting('autoSave', e.target.checked)}
                  className="w-4 h-4 accent-primary cursor-pointer"
                />
                <Label htmlFor="auto-save" className="text-sm cursor-pointer select-none">
                  Tự động lưu cài đặt
                </Label>
              </div>

              {!settings.autoSave && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveSettings}
                  className="w-full gap-1.5 text-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  Lưu cài đặt
                </Button>
              )}

              {/* Spacer pushes actions to bottom */}
              <div className="flex-1" />
            </div>

            {/* Action buttons pinned to bottom */}
            <div className="px-4 py-4 border-t border-border space-y-2 shrink-0">
              <Button
                onClick={handlePrint}
                disabled={!pdfBlob || isPrinting}
                className="w-full h-10 gradient-primary text-primary-foreground font-semibold shadow-button hover:opacity-90"
              >
                {isPrinting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Đang mở hộp thoại in…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Printer className="w-4 h-4" />
                    In hóa đơn
                  </span>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleDownload}
                disabled={!pdfBlob}
                className="w-full h-9 gap-2 text-sm"
              >
                <Download className="w-4 h-4" />
                Tải xuống PDF
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
