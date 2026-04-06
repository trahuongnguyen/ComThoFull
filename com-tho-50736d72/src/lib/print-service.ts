/**
 * Print Service — single source of truth for all print operations.
 *
 * Web / POS reality:
 * - JavaScript cannot read or set the physical printer (browser security).
 * - Khổ giấy, số bản, máy in thật = chỉ trong hộp thoại in của Chrome/Edge/OS.
 * - App chỉ có thể: (1) gọi window.print() → mở dialog thật; (2) lưu ghi chú local (printerHint);
 *     (3) bật "in nhanh" để bỏ bước xem trước trong app.
 * - Chrome/Edge thường nhớ máy in đã chọn cho từng trang web sau lần đầu.
 */

/** Luồng in từ POS — dùng để bật/tắt “in nhanh” riêng */
export type PrintFlow = 'kitchen' | 'bill';

export interface PrintSettings {
  /**
   * Ghi chú thủ công: tên máy in đúng như trong Windows / hộp thoại in
   * (ứng dụng không đọc được danh sách máy in từ trình duyệt).
   */
  printerHint: string;
  autoSave: boolean;
  /** Sau “Gửi bếp”: không mở modal xem trước, mở thẳng hộp thoại in */
  quickPrintKitchen: boolean;
  /** Sau thanh toán: không mở modal xem trước, mở thẳng hộp thoại in */
  quickPrintBill: boolean;
}

export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  printerHint: '',
  autoSave: true,
  quickPrintKitchen: false,
  quickPrintBill: false,
};

const STORAGE_KEY = 'restopos:print-settings';

function normalizePrintSettings(raw: unknown): PrintSettings {
  const d = DEFAULT_PRINT_SETTINGS;
  if (!raw || typeof raw !== 'object') return { ...d };
  const o = raw as Record<string, unknown>;
  return {
    printerHint: typeof o.printerHint === 'string' ? o.printerHint : d.printerHint,
    autoSave: typeof o.autoSave === 'boolean' ? o.autoSave : d.autoSave,
    quickPrintKitchen:
      typeof o.quickPrintKitchen === 'boolean' ? o.quickPrintKitchen : d.quickPrintKitchen,
    quickPrintBill: typeof o.quickPrintBill === 'boolean' ? o.quickPrintBill : d.quickPrintBill,
  };
}

export function loadPrintSettings(): PrintSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return normalizePrintSettings(JSON.parse(raw));
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
  return { ...DEFAULT_PRINT_SETTINGS };
}

export function savePrintSettings(settings: PrintSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* quota / private mode */
  }
}

/** Có bỏ qua modal xem trước cho luồng hiện tại không */
export function shouldQuickPrint(flow: PrintFlow): boolean {
  const s = loadPrintSettings();
  return flow === 'kitchen' ? s.quickPrintKitchen : s.quickPrintBill;
}

const SESSION_PRINT_HINT_KEY = 'restopos:session-print-hint-shown';

export function hasSessionPrintHintBeenShown(): boolean {
  try {
    return sessionStorage.getItem(SESSION_PRINT_HINT_KEY) === '1';
  } catch {
    return true;
  }
}

export function markSessionPrintHintShown(): void {
  try {
    sessionStorage.setItem(SESSION_PRINT_HINT_KEY, '1');
  } catch {
    /* ignore */
  }
}

export interface PrintResult {
  success: boolean;
  error?: string;
}

/**
 * Mở hộp thoại in **thật** của hệ điều hành / trình duyệt bằng một trang HTML tối giản.
 * Tại đây người dùng chọn máy in nhiệt, khổ giấy, số bản — đây là bước thiết lập thực tế duy nhất trên web.
 */
export function openSystemPrinterSetupDialog(onDone?: (result: PrintResult) => void): void {
  const html = `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"/><title>Thiết lập máy in</title>
<style>
  body{font-family:system-ui,sans-serif;margin:10px;font-size:11px;line-height:1.35;max-width:72mm}
  h1{font-size:12px;margin:0 0 6px}
  p{margin:4px 0}
  .hint{color:#555;font-size:10px}
  @media print{
    .no-print{display:none!important}
    body{margin:0;max-width:none;color:#000}
  }
</style></head><body>
<h1 class="no-print">Thiết lập máy in POS</h1>
<p class="no-print hint">Trong hộp thoại in: chọn <b>Đích</b>/<b>Destination</b> = máy in nhiệt. Chỉnh khổ giấy và số bản nếu cần. Hủy nếu chỉ muốn xem.</p>
<p><b>Trang thử in</b></p>
<p>${new Date().toLocaleString('vi-VN')}</p>
<p>Nếu ra đúng máy → thiết lập xong. Trình duyệt thường nhớ máy cho trang này.</p>
<script>
  window.addEventListener('load',function(){
    setTimeout(function(){try{window.focus();window.print();}catch(e){}},120);
  });
</script>
</body></html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const objectUrl = URL.createObjectURL(blob);
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.setAttribute('tabindex', '-1');
  iframe.style.cssText =
    'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;' +
    'opacity:0;pointer-events:none;border:none;';

  let triggered = false;

  const cleanup = () => {
    setTimeout(() => {
      if (document.body.contains(iframe)) document.body.removeChild(iframe);
      URL.revokeObjectURL(objectUrl);
    }, 4000);
  };

  const triggerPrint = () => {
    if (triggered) return;
    triggered = true;
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      cleanup();
      onDone?.({ success: true });
    } catch (err) {
      cleanup();
      onDone?.({
        success: false,
        error: err instanceof Error ? err.message : 'Không thể mở hộp thoại in',
      });
    }
  };

  iframe.addEventListener('load', () => setTimeout(triggerPrint, 200));
  setTimeout(() => {
    if (!triggered) triggerPrint();
  }, 5000);

  document.body.appendChild(iframe);
  iframe.src = objectUrl;
}

/**
 * In PDF từ blob — mở hộp thoại in hệ thống (cùng cơ chế chọn máy / khổ giấy thật).
 */
export function printPdfBlob(
  pdfBlob: Blob,
  onDone?: (result: PrintResult) => void
): void {
  const objectUrl = URL.createObjectURL(pdfBlob);

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.setAttribute('tabindex', '-1');
  iframe.style.cssText =
    'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;' +
    'opacity:0;pointer-events:none;border:none;';

  let triggered = false;

  const cleanup = () => {
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
      URL.revokeObjectURL(objectUrl);
    }, 4000);
  };

  const triggerPrint = () => {
    if (triggered) return;
    triggered = true;
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      cleanup();
      onDone?.({ success: true });
    } catch (err) {
      cleanup();
      onDone?.({
        success: false,
        error: err instanceof Error ? err.message : 'Lỗi khi mở hộp thoại in',
      });
    }
  };

  iframe.addEventListener('load', () => {
    setTimeout(triggerPrint, 400);
  });

  setTimeout(() => {
    if (!triggered) {
      triggerPrint();
    }
  }, 5000);

  document.body.appendChild(iframe);
  iframe.src = objectUrl;
}

export function downloadPdfBlob(pdfBlob: Blob, filename: string = 'hoa-don.pdf'): void {
  const objectUrl = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
}
