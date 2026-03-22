/**
 * Print Service — single source of truth for all print operations.
 *
 * Design principles:
 * - Primary path: call print() on the already-loaded preview iframe in PrintModal
 *   → no extra loading delay, no second iframe, browser dialog appears on clean page
 * - Fallback path: hidden off-screen iframe (used when preview iframe is unavailable)
 * - Settings are persisted to localStorage so staff don't re-configure each time
 * - Clean blob URL lifecycle: every createObjectURL call is matched with revokeObjectURL
 * - Graceful timeout fallback when iframe.onload doesn't fire (some PDF viewers)
 */

export type PaperSize = '80mm' | '58mm' | 'A4' | 'A5';

export interface PrintSettings {
  paperSize: PaperSize;
  copies: number;
  printerHint: string;
  autoSave: boolean;
}

export const PAPER_SIZE_LABELS: Record<PaperSize, string> = {
  '80mm': '80mm — Nhiệt POS',
  '58mm': '58mm — Nhiệt nhỏ',
  'A4': 'A4 — Khổ thường',
  'A5': 'A5 — Khổ nhỏ',
};

export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  paperSize: '80mm',
  copies: 1,
  printerHint: '',
  autoSave: true,
};

const STORAGE_KEY = 'restopos:print-settings';

export function loadPrintSettings(): PrintSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PrintSettings>;
      return { ...DEFAULT_PRINT_SETTINGS, ...parsed };
    }
  } catch {
    // corrupted data — reset
    localStorage.removeItem(STORAGE_KEY);
  }
  return { ...DEFAULT_PRINT_SETTINGS };
}

export function savePrintSettings(settings: PrintSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // quota exceeded or private mode — silently ignore
  }
}

export interface PrintResult {
  success: boolean;
  error?: string;
}

/**
 * Fallback: print a PDF Blob using a hidden off-screen iframe.
 *
 * Used only when the primary path (calling print() on the visible preview iframe)
 * is not available. The caller is responsible for ensuring the custom modal is
 * already closed before calling this, so the browser dialog appears on a clean page.
 *
 * @param pdfBlob  The PDF blob received from the backend API
 * @param onDone   Optional callback when print dialog has been triggered
 */
export function printPdfBlob(
  pdfBlob: Blob,
  onDone?: (result: PrintResult) => void
): void {
  const objectUrl = URL.createObjectURL(pdfBlob);

  const iframe = document.createElement('iframe');
  // Keep it invisible and out of layout flow
  iframe.setAttribute('aria-hidden', 'true');
  iframe.setAttribute('tabindex', '-1');
  iframe.style.cssText =
    'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;' +
    'opacity:0;pointer-events:none;border:none;';

  let triggered = false;

  const cleanup = () => {
    // Delay cleanup so the browser can spool the print job
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

  // Primary: wait for iframe load event
  iframe.addEventListener('load', () => {
    // Small delay — some PDF viewers need a tick to finish rendering
    setTimeout(triggerPrint, 400);
  });

  // Safety net: if onload never fires (e.g. older Chromium builds on Linux),
  // fall back after 5 seconds so the UI doesn't hang forever
  setTimeout(() => {
    if (!triggered) {
      triggerPrint();
    }
  }, 5000);

  document.body.appendChild(iframe);
  iframe.src = objectUrl;
}

/**
 * Download a PDF Blob to the user's device.
 */
export function downloadPdfBlob(pdfBlob: Blob, filename: string = 'hoa-don.pdf'): void {
  const objectUrl = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Revoke after a brief delay to ensure the download has started
  setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
}
