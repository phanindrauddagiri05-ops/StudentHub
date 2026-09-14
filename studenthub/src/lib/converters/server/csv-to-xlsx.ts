// ============================================================
// Converter: CSV -> XLSX
// ============================================================

import * as xlsx from 'xlsx';

export async function convertCsvToXlsx(inputBuffer: Buffer): Promise<Buffer> {
  const csvText = inputBuffer.toString('utf-8');
  const workbook = xlsx.read(csvText, { type: 'string' });

  // Generate binary XLSX buffer
  const xlsxBuffer = xlsx.write(workbook, {
    type: 'buffer',
    bookType: 'xlsx',
  });

  return Buffer.from(xlsxBuffer);
}
