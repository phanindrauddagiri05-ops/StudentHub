import { Document, Paragraph, TextRun, HeadingLevel, Packer } from 'docx';
import { PDFParse } from 'pdf-parse';

export async function convertPdfToDocx(inputBuffer: Buffer): Promise<Buffer> {
  const uint8 = new Uint8Array(inputBuffer);
  const parser = new PDFParse(uint8);
  const result = await parser.getText();

  const rawText = result?.text || '';
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  const docxParagraphs: Paragraph[] = [];

  for (const line of lines) {
    // Basic heading heuristic: short lines without ending punctuation
    const isHeading =
      line.length < 60 &&
      !line.endsWith('.') &&
      (/^[A-Z0-9\s:_-]+$/.test(line) || (/^[A-Z][a-zA-Z0-9\s:_-]+$/.test(line) && line.length < 40));

    docxParagraphs.push(
      new Paragraph({
        heading: isHeading ? HeadingLevel.HEADING_2 : undefined,
        children: [
          new TextRun({
            text: line,
            bold: isHeading,
            size: isHeading ? 28 : 22,
            font: 'Calibri',
            color: isHeading ? '0F172A' : '1E293B',
          }),
        ],
        spacing: {
          after: isHeading ? 180 : 120,
          line: 276,
        },
      })
    );
  }

  const wordDoc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: docxParagraphs.length > 0 ? docxParagraphs : [new Paragraph('')],
      },
    ],
  });

  const buffer = await Packer.toBuffer(wordDoc);
  return buffer;
}
