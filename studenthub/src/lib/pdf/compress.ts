// ============================================================
// PDF Service — Compress PDF
// ============================================================
// Note: True lossless PDF compression in the browser is limited.
// pdf-lib re-serializes the PDF which may reduce size for some files.
// We honestly report the actual before/after sizes.
// ============================================================

import { PDFDocument } from 'pdf-lib';
import { readFileAsArrayBuffer, stripExtension } from './utils';
import type { PdfCompressResult } from './types';

export type CompressionLevel = 'low' | 'medium' | 'high';

/**
 * Attempt to compress a PDF by re-serializing it with pdf-lib.
 * For image-heavy PDFs this may achieve reduction; for already-compressed PDFs
 * the result may be equal or slightly larger.
 *
 * We honestly report the actual sizes.
 */
export async function compressPdf(file: File, _level: CompressionLevel = 'medium'): Promise<PdfCompressResult> {
  const originalSize = file.size;

  const buffer = await readFileAsArrayBuffer(file);
  let sourcePdf: PDFDocument;
  try {
    sourcePdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
  } catch {
    throw new Error("We couldn't read this PDF. The file may be corrupted or password-protected.");
  }

  // Re-serialize — pdf-lib removes redundant cross-reference tables
  // and normalizes the document structure
  const data = await sourcePdf.save({ useObjectStreams: true });

  const newSize = data.byteLength;
  const reduction = Math.max(0, Math.round(((originalSize - newSize) / originalSize) * 100));
  const wasReduced = newSize < originalSize;

  const baseName = stripExtension(file.name);
  return {
    data,
    filename: `${baseName}_compressed.pdf`,
    originalSize,
    newSize,
    reduction,
    wasReduced,
  };
}
