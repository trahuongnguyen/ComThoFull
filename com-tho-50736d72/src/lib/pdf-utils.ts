/**
 * PDF utility helpers — thin re-exports kept for backward compatibility.
 * All print/download logic lives in print-service.ts.
 */

export { downloadPdfBlob, printPdfBlob } from './print-service';

/**
 * Open a PDF Blob in a new browser tab (for preview-only use cases,
 * NOT for printing — use printPdfBlob from print-service instead).
 */
export const openPdfBlob = (pdfBlob: Blob, _title?: string): void => {
  const url = URL.createObjectURL(pdfBlob);
  window.open(url, '_blank');
  // Revoke after a delay to let the browser load it
  setTimeout(() => URL.revokeObjectURL(url), 5000);
};
