// ============================================================
// Converter: DOCX -> TXT
// Extracts textual content from Word documents, preserving
// paragraphs and structure.
// ============================================================

import mammoth from 'mammoth';

export async function convertDocxToTxt(inputBuffer: Buffer): Promise<Buffer> {
  if (!inputBuffer || inputBuffer.length === 0) {
    throw new Error('Unable to convert this document. The document is empty.');
  }

  let text = '';

  try {
    // 1. Try extracting with mammoth convertToHtml for structured paragraph separation
    const { value: html } = await mammoth.convertToHtml({ buffer: inputBuffer });
    if (html && html.trim()) {
      // Replace headings and paragraph tags with explicit double newlines
      // Replace list items with bullet points and newlines
      const structured = html
        .replace(/<\/(h[1-6]|p)>/gi, '\n\n')
        .replace(/<li>/gi, '• ')
        .replace(/<\/li>/gi, '\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '') // Strip remaining tags
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

      text = structured.replace(/\n{3,}/g, '\n\n').trim();
    }
  } catch {
    // Fall back to extractRawText
  }

  if (!text) {
    try {
      const result = await mammoth.extractRawText({ buffer: inputBuffer });
      text = (result.value || '').trim();
    } catch {
      // ignore
    }
  }

  // Validate output has extracted content
  if (!text || text.length === 0) {
    throw new Error('Unable to convert this document. Please try another file.');
  }

  return Buffer.from(text, 'utf-8');
}
