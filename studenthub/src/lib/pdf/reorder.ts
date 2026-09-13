// ============================================================
// PDF Service — Reorder Pages
// ============================================================

import { PDFDocument } from 'pdf-lib';
import { readFileAsArrayBuffer, stripExtension } from './utils';
import type { PdfOperationOutput } from './types';

/**
 * Create a new PDF with pages in the specified order.
 * @param file - The source PDF file
 * @param order - Array of 0-indexed page numbers in the desired new order
 */
export async function reorderPages(file: File, order: number[]): Promise<PdfOperationOutput> {
  if (order.length === 0) {
    throw new Error('No page order was provided.');
  }

  const buffer = await readFileAsArrayBuffer(file);
  let sourcePdf: PDFDocument;
  try {
    sourcePdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
  } catch {
    throw new Error("We couldn't read this PDF. The file may be corrupted or password-protected.");
  }

  const totalPages = sourcePdf.getPageCount();
  const validOrder = order.filter((p) => p >= 0 && p < totalPages);

  const newPdf = await PDFDocument.create();
  const copiedPages = await newPdf.copyPages(sourcePdf, validOrder);
  copiedPages.forEach((page) => newPdf.addPage(page));

  const data = await newPdf.save();
  const baseName = stripExtension(file.name);
  return {
    data,
    filename: `${baseName}_reordered.pdf`,
  };
}
