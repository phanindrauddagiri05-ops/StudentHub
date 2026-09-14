// ============================================================
// Converter: DOCX -> PDF (Pure TypeScript Fallback)
// Converts Word DOCX documents into clean, paginated PDF pages.
// ============================================================

import mammoth from 'mammoth';
import { PDFDocument, StandardFonts, rgb, RGB } from 'pdf-lib';

interface ParsedBlock {
  type: 'h1' | 'h2' | 'h3' | 'p' | 'bullet';
  text: string;
}

function sanitizeForWinAnsi(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'") // Smart single quotes
    .replace(/[\u201C\u201D]/g, '"') // Smart double quotes
    .replace(/[\u2013\u2014]/g, '-') // En-dash, em-dash
    .replace(/\u2026/g, '...')       // Ellipsis
    .replace(/\u2022/g, '*')         // Bullet
    .replace(/\u00A0/g, ' ')         // Non-breaking space
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '?'); // Strip/replace non-WinAnsi
}

export async function convertDocxToPdf(inputBuffer: Buffer): Promise<Buffer> {
  // 1. Extract HTML using mammoth
  let html = '';
  try {
    const result = await mammoth.convertToHtml({ buffer: inputBuffer });
    html = result.value || '';
  } catch {
    // Fall back to raw text
  }

  // 2. Parse HTML into simple blocks
  const blocks: ParsedBlock[] = [];
  if (html) {
    const regex = /<(h1|h2|h3|p|li)[^>]*>([\s\S]*?)<\/\1>/gi;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(html)) !== null) {
      const tag = match[1].toLowerCase();
      // Strip nested HTML tags & clean HTML entities
      let text = match[2]
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();

      if (!text) continue;
      text = sanitizeForWinAnsi(text);

      if (tag === 'h1') blocks.push({ type: 'h1', text });
      else if (tag === 'h2') blocks.push({ type: 'h2', text });
      else if (tag === 'h3') blocks.push({ type: 'h3', text });
      else if (tag === 'li') blocks.push({ type: 'bullet', text: `*  ${text}` });
      else blocks.push({ type: 'p', text });
    }
  }

  // Fallback if no HTML tags matched
  if (blocks.length === 0) {
    let rawText = '';
    try {
      const result = await mammoth.extractRawText({ buffer: inputBuffer });
      rawText = result.value || '';
    } catch {
      rawText = inputBuffer.toString('utf-8');
    }
    const lines = rawText.split(/\r?\n/).map((l) => sanitizeForWinAnsi(l.trim())).filter(Boolean);
    for (const l of lines) {
      blocks.push({ type: 'p', text: l });
    }
  }

  if (blocks.length === 0) {
    blocks.push({ type: 'p', text: 'Document converted successfully.' });
  }

  // 3. Render into PDF using pdf-lib
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const margin = 54; // 0.75 inch
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const maxLineWidth = pageWidth - margin * 2;

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;
  let pageNumber = 1;

  const drawPageFooter = (page: typeof currentPage, num: number) => {
    page.drawText(`${num}`, {
      x: pageWidth / 2 - 5,
      y: 30,
      size: 9,
      font: fontRegular,
      color: rgb(0.5, 0.5, 0.5),
    });
  };

  drawPageFooter(currentPage, pageNumber);

  function wrapText(text: string, font: typeof fontRegular, size: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const test = currentLine ? `${currentLine} ${word}` : word;
      let w = 0;
      try {
        w = font.widthOfTextAtSize(test, size);
      } catch {
        w = test.length * (size * 0.5);
      }

      if (w <= maxLineWidth) {
        currentLine = test;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  for (const block of blocks) {
    let font = fontRegular;
    let size = 11;
    let lineHeight = 16;
    let spaceBefore = 6;
    let color: RGB = rgb(0.12, 0.15, 0.2);

    if (block.type === 'h1') {
      font = fontBold;
      size = 20;
      lineHeight = 24;
      spaceBefore = 18;
      color = rgb(0.08, 0.12, 0.25);
    } else if (block.type === 'h2') {
      font = fontBold;
      size = 15;
      lineHeight = 20;
      spaceBefore = 14;
      color = rgb(0.12, 0.18, 0.3);
    } else if (block.type === 'h3') {
      font = fontBold;
      size = 12.5;
      lineHeight = 17;
      spaceBefore = 10;
      color = rgb(0.15, 0.2, 0.3);
    } else if (block.type === 'bullet') {
      size = 10.5;
      lineHeight = 15;
      spaceBefore = 3;
    }

    const lines = wrapText(block.text, font, size);
    y -= spaceBefore;

    for (const line of lines) {
      if (y < margin + 40) {
        pageNumber++;
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        drawPageFooter(currentPage, pageNumber);
        y = pageHeight - margin;
      }

      try {
        currentPage.drawText(line, {
          x: margin,
          y,
          size,
          font,
          color,
        });
      } catch {
        // Safe fallback for any untypical characters
        const safeLine = line.replace(/[^\x20-\x7E]/g, '?');
        currentPage.drawText(safeLine, {
          x: margin,
          y,
          size,
          font,
          color,
        });
      }

      y -= lineHeight;
    }
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
