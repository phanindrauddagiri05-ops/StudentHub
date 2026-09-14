// ============================================================
// StudentHub — PDF Text Extraction Service
// Uses pdf-parse (v2) on the server to extract text and detect
// scanned/image-only PDFs.
// ============================================================

export interface PdfTextExtractionResult {
  text: string;
  pageCount: number;
  wordCount: number;
  isScanned: boolean;
  rawPageTexts?: string[];
}

/**
 * Extracts text from a PDF buffer.
 * Detects if the PDF has no extractable text (i.e. scanned or image-only).
 */
export async function extractPdfText(buffer: Buffer): Promise<PdfTextExtractionResult> {
  if (!buffer || buffer.length === 0) {
    throw new Error('PDF file buffer is empty.');
  }

  try {
    // Dynamic require to prevent bundling issues on edge runtimes
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PDFParse } = require('pdf-parse');

    const parser = new PDFParse({ data: buffer });
    await parser.load();

    const textResult = await parser.getText();
    const rawText = typeof textResult === 'string' ? textResult : textResult?.text || '';
    const pageCount = Number(textResult?.total || 1);

    const pages: string[] = Array.isArray(textResult?.pages)
      ? textResult.pages.map((p: { text?: string }) => p.text || '')
      : [rawText];

    // Clean up excessive whitespace and control characters
    const cleanedText = rawText
      .replace(/\r\n/g, '\n')
      .replace(/[\t ]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // Check if there are meaningful alphabetic/alphanumeric characters
    const alphaCount = (cleanedText.match(/[a-zA-Z0-9]/g) || []).length;
    const words = cleanedText ? cleanedText.split(/\s+/).filter(Boolean) : [];
    const wordCount = words.length;

    // A PDF is considered scanned or image-only if there are fewer than 15 alphanumeric characters
    // across the entire document
    const isScanned = alphaCount < 15;

    return {
      text: cleanedText,
      pageCount: Math.max(pageCount, pages.length, 1),
      wordCount,
      isScanned,
      rawPageTexts: pages,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('PDF text extraction error:', message);
    throw new Error(`Unable to extract text from PDF: ${message}`);
  }
}
