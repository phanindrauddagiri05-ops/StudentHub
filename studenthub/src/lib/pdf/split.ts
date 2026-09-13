// ============================================================
// PDF Service — Split PDF (Extract Pages)
// ============================================================

import { PDFDocument } from 'pdf-lib';
import { readFileAsArrayBuffer, stripExtension } from './utils';
import type { PdfOperationOutput } from './types';

/**
 * Extract specific pages from a PDF.
 * @param file - The source PDF file
 * @param pages - 0-indexed page numbers to extract
 */
export async function splitPdf(file: File, pages: number[]): Promise<PdfOperationOutput> {
  if (pages.length === 0) {
    throw new Error('Please select at least one page to extract.');
  }

  const buffer = await readFileAsArrayBuffer(file);
  let sourcePdf: PDFDocument;
  try {
    sourcePdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
  } catch {
    throw new Error("We couldn't read this PDF. The file may be corrupted or password-protected.");
  }

  const totalPages = sourcePdf.getPageCount();
  const validPages = pages.filter((p) => p >= 0 && p < totalPages);
  if (validPages.length === 0) {
    throw new Error('None of the selected pages exist in this PDF.');
  }

  const newPdf = await PDFDocument.create();
  const copiedPages = await newPdf.copyPages(sourcePdf, validPages);
  copiedPages.forEach((page) => newPdf.addPage(page));

  const data = await newPdf.save();
  const baseName = stripExtension(file.name);
  return {
    data,
    filename: `${baseName}_extracted.pdf`,
  };
}
