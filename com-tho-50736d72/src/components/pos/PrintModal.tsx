import React, { useEffect, useRef, useState } from 'react';
import {
  Download,
  FileText,
  Info,
  Printer,
  Save,
  Settings2,
  Zap,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  DEFAULT_PRINT_SETTINGS,
  type PrintSettings,
  downloadPdfBlob,
  loadPrintSettings,
  openSystemPrinterSetupDialog,
  printPdfBlob,
  savePrintSettings,
} from '@/lib/print-service';

/**
 * Luồng in: xem trước PDF → bấm In → print() trên iframe đã load → đóng modal.
 * Thiết lập máy in thật: nút riêng → openSystemPrinterSetupDialog (hộp thoại OS/trình duyệt).
 */

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
  const [settings, setSettings] = useState<PrintSettings>(DEFAULT_PRINT_SETTINGS);
  const [printerSetupBusy, setPrinterSetupBusy] = useState(false);

  const previewIframeRef = useRef<HTMLIFrameElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSettings(loadPrintSettings());
    }
  }, [open]);

  useEffect(() => {
    if (!pdfBlob) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(pdfBlob);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
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

  const handlePrinterSetup = () => {
    setPrinterSetupBusy(true);
    openSystemPrinterSetupDialog((result) => {
      setPrinterSetupBusy(false);
      if (result.success) {
        toast({
          title: 'Hộp thoại in hệ thống',
          description:
            'Chọn máy in nhiệt, khổ giấy và số bản tại đây. Có thể ghi tên máy vào ô bên dưới để nhân viên sau chọn đúng.',
        });
      } else {
        toast({
          title: 'Không mở được hộp thoại in',
          description: result.error ?? 'Thử lại hoặc kiểm tra quyền trình duyệt.',
          variant: 'destructive',
        });
      }
    });
  };

  const handlePrint = () => {
    if (!pdfBlob) return;
    if (settings.autoSave) savePrintSettings(settings);

    const iframeWindow = previewIframeRef.current?.contentWindow;
    if (iframeWindow) {
      try {
        iframeWindow.focus();
        iframeWindow.print();
        onOpenChange(false);
        return;
      } catch {
        /* fallback */
      }
    }

    const blob = pdfBlob;
    onOpenChange(false);
    setTimeout(() => {
      printPdfBlob(blob, (result) => {
        if (!result.success) {
          toast({
            title: 'Lỗi in ấn',
            description: result.error ?? 'Không thể mở hộp thoại in.',
            variant: 'destructive',
          });
        }
      });
    }, 150);
  };

  const handleDownload = () => {
    if (!pdfBlob) return;
    const filename = `${title.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`;
    downloadPdfBlob(pdfBlob, filename);
    toast({ title: 'Đang tải xuống…', description: filename });
  };

  const handleSaveSettings = () => {
    savePrintSettings(settings);
    toast({ title: 'Đã lưu cài đặt in', description: 'Ghi chú máy in và tùy chọn in nhanh.' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-full h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
          <DialogTitle className="text-lg flex items-center gap-2">
            <Printer className="w-5 h-5 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 bg-muted/20 flex flex-col min-w-0 border-r border-border">
            <div className="px-4 py-2 border-b border-border/50 bg-muted/30 shrink-0">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Xem trước
              </span>
            </div>
            <div className="flex-1 overflow-hidden">
              {previewUrl ? (
                <iframe
                  ref={previewIframeRef}
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

          <div className="w-[17rem] shrink-0 flex flex-col bg-card overflow-y-auto">
            <div className="px-4 py-2 border-b border-border/50 bg-muted/30 shrink-0">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Cài đặt in
              </span>
            </div>

            <div className="flex-1 flex flex-col gap-4 px-4 py-4">
              <Alert className="py-3 px-3 border-primary/25 bg-primary/5">
                <Info className="h-4 w-4 text-primary" />
                <AlertTitle className="text-xs font-semibold">In thật trên web</AlertTitle>
                <AlertDescription className="text-[11px] text-muted-foreground leading-snug mt-1">
                  Máy in, khổ giấy và số bản chỉ chọn được trong hộp thoại in của Windows/Chrome —
                  ứng dụng không can thiệp được. Lần đầu dùng nút bên dưới để chọn đúng máy nhiệt.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full h-10 gap-2 text-sm font-medium"
                  onClick={handlePrinterSetup}
                  disabled={printerSetupBusy}
                >
                  <Settings2 className="w-4 h-4 shrink-0" />
                  {printerSetupBusy ? 'Đang mở…' : 'Thiết lập máy in (hệ thống)'}
                </Button>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Mở hộp thoại in thật với trang thử — chọn máy in POS tại &quot;Đích&quot; / Destination.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="printer-hint" className="text-sm font-medium">
                  Ghi nhớ tên máy in
                </Label>
                <Input
                  id="printer-hint"
                  placeholder="Đúng tên trong Windows, VD: EPSON TM-T82"
                  value={settings.printerHint}
                  onChange={(e) => updateSetting('printerHint', e.target.value)}
                  className="h-9 text-sm bg-secondary"
                />
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Chỉ là ghi chú trên máy này — giúp ca sau chọn đúng dòng trong hộp thoại in.
                </p>
              </div>

              <div className="space-y-3 rounded-lg border border-border/80 bg-muted/20 p-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Zap className="w-4 h-4 text-primary shrink-0" />
                  In nhanh
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Bỏ màn xem trước trong app; vẫn mở hộp thoại in hệ thống để chọn máy.
                </p>
                <div className="flex items-start gap-2">
                  <input
                    id="quick-kitchen"
                    type="checkbox"
                    checked={settings.quickPrintKitchen}
                    onChange={(e) => updateSetting('quickPrintKitchen', e.target.checked)}
                    className="w-4 h-4 mt-0.5 accent-primary cursor-pointer shrink-0"
                  />
                  <Label htmlFor="quick-kitchen" className="text-sm font-normal leading-snug cursor-pointer">
                    Sau <strong>Gửi bếp</strong> — in ngay
                  </Label>
                </div>
                <div className="flex items-start gap-2">
                  <input
                    id="quick-bill"
                    type="checkbox"
                    checked={settings.quickPrintBill}
                    onChange={(e) => updateSetting('quickPrintBill', e.target.checked)}
                    className="w-4 h-4 mt-0.5 accent-primary cursor-pointer shrink-0"
                  />
                  <Label htmlFor="quick-bill" className="text-sm font-normal leading-snug cursor-pointer">
                    Sau <strong>Thanh toán</strong> — in ngay
                  </Label>
                </div>
              </div>

              <div className="flex items-center gap-2">
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

              <div className="flex-1 min-h-2" />
            </div>

            <div className="px-4 py-4 border-t border-border space-y-2 shrink-0">
              <Button
                onClick={handlePrint}
                disabled={!pdfBlob}
                className="w-full h-10 gradient-primary text-primary-foreground font-semibold shadow-button hover:opacity-90 gap-2"
              >
                <Printer className="w-4 h-4" />
                In hóa đơn
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
