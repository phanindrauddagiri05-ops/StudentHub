// ============================================================
// Converter: CSV -> TXT
// ============================================================

import * as xlsx from 'xlsx';

export async function convertCsvToTxt(inputBuffer: Buffer): Promise<Buffer> {
  const csvText = inputBuffer.toString('utf-8');
  const workbook = xlsx.read(csvText, { type: 'string' });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    return Buffer.from(csvText, 'utf-8');
  }

  const sheet = workbook.Sheets[firstSheetName];
  const txt = xlsx.utils.sheet_to_txt(sheet);
  return Buffer.from(txt, 'utf-8');
}
