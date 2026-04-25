import { formatDateTimeVN } from '@/lib/datetime';
import qz from 'qz-tray';

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
  const stamp = formatDateTimeVN(new Date());
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
<p>${stamp}</p>
<p>Nếu ra đúng máy → thiết lập xong. Trình duyệt thường nhớ máy cho trang này.</p>
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

// -----------------------------
// QZ Tray bridge (silent print)
// -----------------------------

/**
 * QZ Tray là "local bridge" chuẩn POS: Web → WebSocket → QZ Tray → Printer.
 *
 * Production notes:
 * - QZ yêu cầu TLS certificate + signature cho từng request (trừ khi bạn chạy chế độ demo/dev).
 * - Tuyệt đối KHÔNG nhúng private key ký lệnh in vào frontend (ai mở DevTools là lấy được).
 * - Best practice: backend expose endpoint ký (signing) có authz theo user/role/shift.
 */

const QZ_PRINTER_STORAGE_KEY = 'restopos:qz:printer';

export type QzPrinterName = string;

export interface QzStatus {
  installed: boolean;
  active: boolean;
}

export interface QzInitOptions {
  /**
   * URL trả về certificate public (PEM). Ví dụ: `/qz/public.pem`
   * (file static hoặc endpoint backend).
   */
  certificateUrl: string;
  /**
   * Endpoint backend ký message cho QZ. Ví dụ: `/api/qz/sign`
   * Body: { payload: string } -> { signature: string }
   */
  signUrl: string;
  /** Optional: header auth (JWT/Bearer...) cho signUrl */
  getAuthHeaders?: () => Record<string, string>;
}

function safeLocalStorageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeLocalStorageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

export function getQzStatus(): QzStatus {
  const installed = typeof window !== 'undefined' && typeof qz.websocket !== 'undefined';
  const active = installed ? qz.websocket.isActive() === true : false;
  return { installed, active };
}

/**
 * Khởi tạo security layer cho QZ Tray.
 * - certificate: frontend fetch PEM public cert
 * - signature: frontend gửi payload lên backend để ký
 */
export function initQzSecurity(options: QzInitOptions): void {
  qz.security.setCertificatePromise(async () => {
    const res = await fetch(options.certificateUrl, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Không tải được certificate (${res.status})`);
    return await res.text();
  });

  qz.security.setSignaturePromise(async (toSign: string) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.getAuthHeaders?.() ?? {}),
    };

    const res = await fetch(options.signUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ payload: toSign }),
    });
    if (!res.ok) throw new Error(`Không ký được request (${res.status})`);
    const data = (await res.json()) as { signature?: string };
    if (!data.signature) throw new Error('Backend không trả về signature');
    return data.signature;
  });
}

export async function ensureQzConnected(): Promise<void> {
  if (qz.websocket.isActive()) return;
  await qz.websocket.connect();
}

export async function disconnectQz(): Promise<void> {
  if (!qz.websocket.isActive()) return;
  await qz.websocket.disconnect();
}

export async function listQzPrinters(): Promise<QzPrinterName[]> {
  await ensureQzConnected();
  return await qz.printers.find();
}

export function getDefaultQzPrinter(): QzPrinterName | null {
  const v = safeLocalStorageGet(QZ_PRINTER_STORAGE_KEY);
  return v && v.trim().length ? v : null;
}

export function setDefaultQzPrinter(printerName: QzPrinterName): void {
  safeLocalStorageSet(QZ_PRINTER_STORAGE_KEY, printerName);
}

export interface QzPrintPlainTextParams {
  printer: QzPrinterName;
  /**
   * TEXT thuần, phù hợp kitchen ticket đơn giản.
   * Với tiếng Việt: tùy firmware/codepage của máy in, có thể lỗi dấu.
   * Nếu cần tiếng Việt ổn định, ưu tiên in dạng ảnh (raster) hoặc font-unicode printer.
   */
  text: string;
  copies?: number;
}

export async function qzPrintPlainText(params: QzPrintPlainTextParams): Promise<void> {
  await ensureQzConnected();
  const config = qz.configs.create(params.printer, {
    copies: params.copies ?? 1,
    // safe defaults for POS
    density: 0,
    // jobName helps Windows queue debugging
    jobName: 'RestoPOS',
  });

  const data = [
    {
      type: 'raw',
      format: 'plain',
      data: params.text,
    },
  ];

  await qz.print(config, data);
}

export interface QzPrintImageParams {
  printer: QzPrinterName;
  /**
   * Data URL (base64) của ảnh, ví dụ: `data:image/png;base64,...`
   * Đây là cách thực tế nhất để in tiếng Việt “đúng dấu” trên ESC/POS phổ thông.
   */
  dataUrl: string;
  copies?: number;
}

export async function qzPrintImage(params: QzPrintImageParams): Promise<void> {
  await ensureQzConnected();
  const config = qz.configs.create(params.printer, {
    copies: params.copies ?? 1,
    jobName: 'RestoPOS',
  });

  const data = [
    {
      type: 'image',
      data: params.dataUrl,
    },
  ];

  await qz.print(config, data);
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export interface QzPrintPdfBlobParams {
  printer: QzPrinterName;
  pdfBlob: Blob;
  copies?: number;
}

/**
 * In PDF silent qua QZ Tray (không mở popup).
 * Backend của bạn hiện đã trả PDF cho phiếu bếp/hóa đơn, nên đây là cách "ít đụng backend" nhất.
 */
export async function qzPrintPdfBlob(params: QzPrintPdfBlobParams): Promise<void> {
  await ensureQzConnected();
  const config = qz.configs.create(params.printer, {
    copies: params.copies ?? 1,
    jobName: 'RestoPOS',
  });

  const buffer = await params.pdfBlob.arrayBuffer();
  const base64 = arrayBufferToBase64(buffer);

  const data = [
    {
      type: 'raw',
      format: 'pdf',
      flavor: 'base64',
      data: base64,
    },
  ];

  await qz.print(config, data);
}
