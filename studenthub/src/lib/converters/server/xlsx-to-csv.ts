// ============================================================
// Converter: XLSX -> CSV
// ============================================================

import * as xlsx from 'xlsx';

export async function convertXlsxToCsv(inputBuffer: Buffer): Promise<Buffer> {
  const workbook = xlsx.read(inputBuffer, { type: 'buffer' });
  const sheetNames = workbook.SheetNames;

  if (sheetNames.length === 0) {
    throw new Error('The uploaded Excel workbook contains no readable sheets.');
  }

  // Convert each sheet or the first sheet
  const csvParts: string[] = [];
  for (const name of sheetNames) {
    const sheet = workbook.Sheets[name];
    if (sheet) {
      const csv = xlsx.utils.sheet_to_csv(sheet);
      if (sheetNames.length > 1) {
        csvParts.push(`# Sheet: ${name}\n${csv}`);
      } else {
        csvParts.push(csv);
      }
    }
  }

  const combinedCsv = csvParts.join('\n\n');
  return Buffer.from(combinedCsv, 'utf-8');
}
