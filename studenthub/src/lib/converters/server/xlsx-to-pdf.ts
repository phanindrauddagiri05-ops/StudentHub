// ============================================================
// Converter: XLSX -> PDF
// Converts Excel worksheets into cleanly formatted PDF tables.
// ============================================================

import * as xlsx from 'xlsx';
import { PDFDocument, StandardFonts, rgb, grayscale } from 'pdf-lib';

export async function convertXlsxToPdf(inputBuffer: Buffer): Promise<Buffer> {
  const workbook = xlsx.read(inputBuffer, { type: 'buffer' });
  const sheetNames = workbook.SheetNames;

  if (sheetNames.length === 0) {
    throw new Error('No readable sheets found in this Excel workbook.');
  }

  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Landscape A4 for spreadsheets
  const pageWidth = 841.89;
  const pageHeight = 595.28;
  const margin = 40;
  const tableWidth = pageWidth - margin * 2;
  const rowHeight = 20;

  for (const sheetName of sheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const rawRows = xlsx.utils.sheet_to_json<string[]>(sheet, { header: 1 });
    if (rawRows.length === 0) continue;

    // Filter out completely empty trailing rows
    const rows = rawRows.filter((r) => r && r.some((c) => c !== undefined && c !== null && String(c).trim() !== ''));
    if (rows.length === 0) continue;

    // Determine max columns
    const maxCols = Math.min(Math.max(...rows.map((r) => r.length)), 12);
    const colWidth = tableWidth / Math.max(maxCols, 1);

    let pageNumber = 1;
    let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    // Draw Sheet Title
    const drawSheetHeader = (page: typeof currentPage, title: string, pageNum: number) => {
      page.drawText(title, {
        x: margin,
        y: pageHeight - 30,
        size: 14,
        font: fontBold,
        color: rgb(0.1, 0.15, 0.25),
      });

      page.drawText(`Page ${pageNum}`, {
        x: pageWidth - margin - 45,
        y: pageHeight - 30,
        size: 9,
        font: fontRegular,
        color: grayscale(0.5),
      });
    };

    drawSheetHeader(currentPage, `Sheet: ${sheetName}`, pageNumber);
    y -= 25;

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      const isHeaderRow = rowIndex === 0;

      // Check page break
      if (y < margin + rowHeight + 10) {
        pageNumber++;
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        drawSheetHeader(currentPage, `Sheet: ${sheetName} (cont.)`, pageNumber);
        y = pageHeight - margin - 25;
      }

      // Draw Row Background
      if (isHeaderRow) {
        currentPage.drawRectangle({
          x: margin,
          y: y - rowHeight + 4,
          width: tableWidth,
          height: rowHeight,
          color: rgb(0.14, 0.38, 0.92), // primary blue
        });
      } else if (rowIndex % 2 === 1) {
        currentPage.drawRectangle({
          x: margin,
          y: y - rowHeight + 4,
          width: tableWidth,
          height: rowHeight,
          color: rgb(0.96, 0.97, 0.99), // subtle zebra
        });
      }

      // Draw Cell Text & Vertical Grid lines
      for (let colIndex = 0; colIndex < maxCols; colIndex++) {
        const cellVal = row[colIndex] !== undefined && row[colIndex] !== null ? String(row[colIndex]).trim() : '';
        const cellX = margin + colIndex * colWidth;

        // Truncate cell text if too long
        const font = isHeaderRow ? fontBold : fontRegular;
        const fontSize = isHeaderRow ? 9 : 8.5;
        let displayVal = cellVal.replace(/[^\x20-\x7E\xA0-\xFF]/g, '?');

        while (displayVal.length > 3 && font.widthOfTextAtSize(displayVal, fontSize) > colWidth - 10) {
          displayVal = displayVal.slice(0, -2) + '...';
        }

        currentPage.drawText(displayVal, {
          x: cellX + 5,
          y: y - 11,
          size: fontSize,
          font,
          color: isHeaderRow ? rgb(1, 1, 1) : rgb(0.15, 0.2, 0.25),
        });

        // Cell border
        currentPage.drawRectangle({
          x: cellX,
          y: y - rowHeight + 4,
          width: colWidth,
          height: rowHeight,
          borderColor: rgb(0.88, 0.9, 0.94),
          borderWidth: 0.5,
        });
      }

      y -= rowHeight;
    }
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
