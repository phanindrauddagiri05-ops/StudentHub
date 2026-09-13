// ============================================================
// PDF Service — PDF to Images
// ============================================================

import type { PdfImageOutput } from './types';

/**
 * Convert PDF pages to PNG image data URLs using pdfjs-dist.
 * Runs entirely client-side.
 *
 * @param file - The source PDF file
 * @param pages - 0-indexed page numbers to render; undefined = all pages
 * @param scale - Render scale (default 1.5 for good quality)
 */
export async function pdfToImages(
  file: File,
  pages?: number[],
  scale = 1.5
): Promise<PdfImageOutput> {
  // Dynamic import to avoid SSR issues with pdfjs-dist
  const pdfjsLib = await import('pdfjs-dist');

  // Use a reliable CDN worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const buffer = await file.arrayBuffer();

  let pdfDoc: Awaited<ReturnType<typeof pdfjsLib.getDocument>['promise']>;
  try {
    const loadingTask = pdfjsLib.getDocument({ data: buffer });
    pdfDoc = await loadingTask.promise;
  } catch {
    throw new Error("We couldn't read this PDF. The file may be corrupted or password-protected.");
  }

  const totalPages = pdfDoc.numPages;
  const pagesToRender = pages
    ? pages.filter((p) => p >= 0 && p < totalPages)
    : Array.from({ length: totalPages }, (_, i) => i);

  if (pagesToRender.length === 0) {
    throw new Error('No valid pages to convert.');
  }

  const dataUrls: string[] = [];

  for (const pageIndex of pagesToRender) {
    const page = await pdfDoc.getPage(pageIndex + 1); // pdfjs uses 1-indexed
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext('2d')!;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await page.render({ canvas, canvasContext: ctx, viewport } as any).promise;
    dataUrls.push(canvas.toDataURL('image/png'));
  }

  return {
    dataUrls,
    pageCount: totalPages,
  };
}
