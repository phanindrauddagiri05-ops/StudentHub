// ============================================================
// Converter: TXT -> PDF
// ============================================================

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function convertTxtToPdf(inputBuffer: Buffer): Promise<Buffer> {
  const text = inputBuffer.toString('utf-8');
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const fontSize = 10;
  const lineHeight = 14;
  const margin = 50;
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const maxLineWidth = pageWidth - margin * 2;

  // Helper to wrap a single line of text
  function wrapLine(line: string): string[] {
    if (!line) return [''];
    const words = line.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const width = font.widthOfTextAtSize(testLine, fontSize);
      if (width <= maxLineWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  const rawLines = text.split(/\r?\n/);
  const wrappedLines: string[] = [];
  for (const rawLine of rawLines) {
    wrappedLines.push(...wrapLine(rawLine));
  }

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;
  let pageNumber = 1;

  // Add header
  const drawPageHeader = (page: typeof currentPage, num: number) => {
    page.drawText(`Page ${num}`, {
      x: pageWidth - margin - 40,
      y: pageHeight - 30,
      size: 8,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
  };

  drawPageHeader(currentPage, pageNumber);

  for (const line of wrappedLines) {
    if (y < margin + lineHeight) {
      pageNumber++;
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      drawPageHeader(currentPage, pageNumber);
      y = pageHeight - margin;
    }

    currentPage.drawText(line, {
      x: margin,
      y,
      size: fontSize,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });

    y -= lineHeight;
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
