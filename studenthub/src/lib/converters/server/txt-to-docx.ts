// ============================================================
// Converter: TXT -> DOCX
// ============================================================

import { Document, Paragraph, TextRun, Packer } from 'docx';

export async function convertTxtToDocx(inputBuffer: Buffer): Promise<Buffer> {
  const text = inputBuffer.toString('utf-8');
  const lines = text.split(/\r?\n/);

  const paragraphs = lines.map((line) => {
    return new Paragraph({
      children: [
        new TextRun({
          text: line,
          font: 'Calibri',
          size: 22, // 11pt
          color: '1E293B',
        }),
      ],
      spacing: {
        after: 120, // 6pt
        line: 276, // 1.15 line spacing
      },
    });
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: paragraphs.length > 0 ? paragraphs : [new Paragraph('')],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}
