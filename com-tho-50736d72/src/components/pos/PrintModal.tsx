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
  getDefaultQzPrinter,
  getQzStatus,
  loadPrintSettings,
  openSystemPrinterSetupDialog,
  listQzPrinters,
  qzPrintPlainText,
  qzPrintPdfBlob,
  setDefaultQzPrinter,
  ensureQzConnected,
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

  const [qzBusy, setQzBusy] = useState(false);
  const [qzPrinters, setQzPrinters] = useState<string[]>([]);
  const [qzPrinter, setQzPrinter] = useState<string>(getDefaultQzPrinter() ?? '');

  const previewIframeRef = useRef<HTMLIFrameElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSettings(loadPrintSettings());
      setQzPrinter(getDefaultQzPrinter() ?? '');
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

    // Prefer silent print via QZ Tray when available + configured
    const qzStatus = getQzStatus();
    const preferredPrinter = getDefaultQzPrinter();
    if (qzStatus.installed && preferredPrinter) {
      const blob = pdfBlob;
      onOpenChange(false);
      setTimeout(() => {
        setQzBusy(true);
        qzPrintPdfBlob({ printer: preferredPrinter, pdfBlob: blob })
          .then(() => {
            toast({ title: 'Đã in (silent)', description: preferredPrinter });
          })
          .catch((err) => {
            toast({
              title: 'Silent print thất bại',
              description: err instanceof Error ? err.message : 'Không gửi được lệnh in.',
              variant: 'destructive',
            });
            // fallback to browser print dialog
            printPdfBlob(blob);
          })
          .finally(() => setQzBusy(false));
      }, 150);
      return;
    }

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

  const handleQzConnectAndLoadPrinters = async () => {
    setQzBusy(true);
    try {
      await ensureQzConnected();
      const printers = await listQzPrinters();
      setQzPrinters(printers);
      toast({
        title: 'QZ Tray đã kết nối',
        description: printers.length ? `Tìm thấy ${printers.length} máy in.` : 'Không tìm thấy máy in nào.',
      });
    } catch (err) {
      toast({
        title: 'Không kết nối được QZ Tray',
        description:
          err instanceof Error
            ? err.message
            : 'Kiểm tra QZ Tray đang chạy và không bị firewall chặn.',
        variant: 'destructive',
      });
    } finally {
      setQzBusy(false);
    }
  };

  const handleQzSavePrinter = () => {
    if (!qzPrinter.trim()) {
      toast({ title: 'Chưa chọn máy in', description: 'Hãy chọn một máy in trong danh sách QZ.' });
      return;
    }
    setDefaultQzPrinter(qzPrinter.trim());
    toast({ title: 'Đã lưu máy in (QZ)', description: qzPrinter.trim() });
  };

  const handleQzTestPrint = async () => {
    if (!qzPrinter.trim()) {
      toast({ title: 'Chưa chọn máy in', description: 'Hãy chọn máy in QZ trước.' });
      return;
    }
    setQzBusy(true);
    try {
      await qzPrintPlainText({
        printer: qzPrinter.trim(),
        text: `RestoPOS - Test Print\n${new Date().toLocaleString('vi-VN')}\n------------------------\nOK\n\n\n`,
      });
      toast({ title: 'Đã gửi lệnh in (silent)', description: qzPrinter.trim() });
    } catch (err) {
      toast({
        title: 'In QZ thất bại',
        description: err instanceof Error ? err.message : 'Không gửi được lệnh in.',
        variant: 'destructive',
      });
    } finally {
      setQzBusy(false);
    }
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
              {(() => {
                const s = getQzStatus();
                if (!s.installed) return null;
                return (
                  <Alert className="py-3 px-3 border-success/25 bg-success/5">
                    <Info className="h-4 w-4 text-success" />
                    <AlertTitle className="text-xs font-semibold">QZ Tray (silent print)</AlertTitle>
                    <AlertDescription className="text-[11px] text-muted-foreground leading-snug mt-1">
                      Đã phát hiện QZ Tray. Bạn có thể chọn máy in 1 lần và in trực tiếp (không hiện popup).
                    </AlertDescription>
                  </Alert>
                );
              })()}

              <Alert className="py-3 px-3 border-primary/25 bg-primary/5">
                <Info className="h-4 w-4 text-primary" />
                <AlertTitle className="text-xs font-semibold">In thật trên web</AlertTitle>
                <AlertDescription className="text-[11px] text-muted-foreground leading-snug mt-1">
                  Máy in, khổ giấy và số bản chỉ chọn được trong hộp thoại in của Windows/Chrome —
                  ứng dụng không can thiệp được. Lần đầu dùng nút bên dưới để chọn đúng máy nhiệt.
                </AlertDescription>
              </Alert>

              {(() => {
                const s = getQzStatus();
                if (!s.installed) return null;
                return (
                  <div className="space-y-2 rounded-lg border border-border/80 bg-muted/20 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-medium flex items-center gap-2">
                        <Printer className="w-4 h-4 text-success shrink-0" />
                        Máy in (QZ)
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-8"
                        onClick={handleQzConnectAndLoadPrinters}
                        disabled={qzBusy}
                        title={s.active ? 'Đã kết nối' : 'Kết nối và tải danh sách máy in'}
                      >
                        {qzBusy ? 'Đang…' : s.active ? 'Làm mới' : 'Kết nối'}
                      </Button>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Chọn máy in</Label>
                      <select
                        className="w-full h-9 rounded-md bg-secondary px-2 text-sm border border-border"
                        value={qzPrinter}
                        onChange={(e) => setQzPrinter(e.target.value)}
                      >
                        <option value="">— Chọn máy in —</option>
                        {(qzPrinters.length ? qzPrinters : qzPrinter ? [qzPrinter] : []).map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-muted-foreground leading-snug">
                        Lưu máy in này để lần sau in silent. Nếu danh sách trống, bấm “Kết nối”.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex-1 h-9"
                        onClick={handleQzSavePrinter}
                        disabled={qzBusy}
                      >
                        Lưu
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="flex-1 h-9 gradient-primary text-primary-foreground"
                        onClick={handleQzTestPrint}
                        disabled={qzBusy}
                      >
                        Test silent
                      </Button>
                    </div>
                  </div>
                );
              })()}

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
