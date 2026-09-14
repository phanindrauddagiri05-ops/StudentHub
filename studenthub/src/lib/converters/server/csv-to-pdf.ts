// ============================================================
// Converter: CSV -> PDF
// ============================================================

import * as xlsx from 'xlsx';
import { convertXlsxToPdf } from './xlsx-to-pdf';

export async function convertCsvToPdf(inputBuffer: Buffer): Promise<Buffer> {
  const csvText = inputBuffer.toString('utf-8');
  const workbook = xlsx.read(csvText, { type: 'string' });

  // Convert intermediate workbook to XLSX buffer, then render to PDF
  const xlsxBuffer = xlsx.write(workbook, {
    type: 'buffer',
    bookType: 'xlsx',
  });

  return convertXlsxToPdf(Buffer.from(xlsxBuffer));
}
