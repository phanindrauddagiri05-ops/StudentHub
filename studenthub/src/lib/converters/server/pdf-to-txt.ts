import { PDFParse } from 'pdf-parse';

export async function convertPdfToTxt(inputBuffer: Buffer): Promise<Buffer> {
  const uint8 = new Uint8Array(inputBuffer);
  const parser = new PDFParse(uint8);
  const result = await parser.getText();

  if (result?.pages && result.pages.length > 0) {
    const pageTexts = result.pages.map((p, idx) => {
      const pageContent = p.text ? p.text.trim() : '';
      return result.pages.length > 1 ? `--- Page ${idx + 1} ---\n${pageContent}` : pageContent;
    });
    return Buffer.from(pageTexts.join('\n\n').trim(), 'utf-8');
  }

  const text = result?.text || '';
  return Buffer.from(text.trim(), 'utf-8');
}
