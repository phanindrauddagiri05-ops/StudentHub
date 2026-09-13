// ============================================================
// PDF Service — Merge PDFs
// ============================================================

import { PDFDocument } from 'pdf-lib';
import { readFileAsArrayBuffer } from './utils';
import type { PdfOperationOutput } from './types';

/**
 * Merge multiple PDF files into a single PDF document.
 * Pages are appended in the order the files are provided.
 */
export async function mergePdfs(files: File[]): Promise<PdfOperationOutput> {
  if (files.length < 2) {
    throw new Error('Please provide at least 2 PDF files to merge.');
  }

  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const buffer = await readFileAsArrayBuffer(file);
    let sourcePdf: PDFDocument;
    try {
      sourcePdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
    } catch {
      throw new Error(`Could not read "${file.name}". The file may be corrupted or password-protected.`);
    }
    const copiedPages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  const data = await mergedPdf.save();
  return {
    data,
    filename: 'merged.pdf',
  };
}
