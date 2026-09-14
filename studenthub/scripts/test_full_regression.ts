import { executeServerConversion } from '../src/lib/converters/server';
import { extractPdfText } from '../src/lib/ai/pdf-text';
import { generatePdfSummary } from '../src/lib/ai/provider';
import { TOOLS } from '../src/lib/tools';
import { FEATURE_FLAGS } from '../src/lib/config/features';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';

async function runFullRegression() {
  console.log('=== STUDENTHUB COMPREHENSIVE REGRESSION SUITE ===');

  // 1. Feature Flags & Ready Count
  console.log('\n--- 1. Roadmap & Tool Status Verification ---');
  const available = TOOLS.filter((t) => t.status === 'available');
  console.log(`Available Tools (${available.length}):`, available.map((t) => t.name).join(', '));
  if (available.length !== 3) throw new Error(`Expected 3 available tools, got ${available.length}`);
  if (FEATURE_FLAGS.RESUME_GENERATOR !== false) throw new Error('Resume generator must be locked');
  if (FEATURE_FLAGS.NOTES_SUMMARY !== false) throw new Error('Notes Summary must be locked');
  if (FEATURE_FLAGS.PDF_SUMMARY_AI !== false) throw new Error('PDF Summary must be locked');
  const pdfSummaryTool = TOOLS.find((t) => t.id === 'pdf-summary');
  if (!pdfSummaryTool || pdfSummaryTool.status !== 'coming-soon') {
    throw new Error('PDF summary tool must be registered as coming-soon');
  }
  const notesSummaryTool = TOOLS.find((t) => t.id === 'notes-summary');
  if (!notesSummaryTool || notesSummaryTool.status !== 'coming-soon') {
    throw new Error('Notes summary tool must be registered as coming-soon');
  }
  console.log('✓ Roadmap status verified (PDF Summary locked, Notes Summary locked, Resume locked, 3 available tools).');

  // 2. Image Conversion: SVG -> PNG
  console.log('\n--- 2. Image Conversion Regression (SVG -> PNG) ---');
  const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" fill="#7c3aed"/></svg>');
  const imgRes = await executeServerConversion({
    sourceFormat: 'svg',
    targetFormat: 'png',
    inputBuffer: svg,
    sourceFilename: 'badge.svg',
  });
  console.log('✓ Converted SVG to PNG, size:', imgRes.outputBuffer.length, 'bytes');

  // 3. Document Conversion: DOCX -> TXT
  console.log('\n--- 3. Document Conversion Regression (DOCX -> TXT) ---');
  const zip = new JSZip();
  zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>');
  zip.file('word/document.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>StudentHub Regression Validation Document</w:t></w:r></w:p></w:body></w:document>');
  const docxBytes = await zip.generateAsync({ type: 'nodebuffer' });
  const docRes = await executeServerConversion({
    sourceFormat: 'docx',
    targetFormat: 'txt',
    inputBuffer: docxBytes,
    sourceFilename: 'report.docx',
  });
  console.log('✓ Converted DOCX to TXT, output text:', docRes.outputBuffer.toString('utf-8'));

  // 4. PDF Operations: PDF Create & Merge
  console.log('\n--- 4. PDF Tools Regression ---');
  const pdf1 = await PDFDocument.create();
  pdf1.addPage([300, 300]).drawText('Page 1');
  const pdf1Bytes = await pdf1.save();

  const pdf2 = await PDFDocument.create();
  pdf2.addPage([300, 300]).drawText('Page 2');
  const pdf2Bytes = await pdf2.save();

  const merged = await PDFDocument.create();
  const [copied1] = await merged.copyPages(await PDFDocument.load(pdf1Bytes), [0]);
  const [copied2] = await merged.copyPages(await PDFDocument.load(pdf2Bytes), [0]);
  merged.addPage(copied1);
  merged.addPage(copied2);
  const mergedBytes = await merged.save();
  console.log('✓ Merged 2 PDFs into 1, size:', mergedBytes.length, 'bytes, pages:', merged.getPageCount());

  // 5. Phase 5 PDF AI Summary
  console.log('\n--- 5. PDF Summary Regression ---');
  const sumPdf = await PDFDocument.create();
  sumPdf.addPage([500, 500]).drawText('Comprehensive guide to Operating Systems: Concurrency, Virtual Memory, and Scheduling algorithms.\nKey points emphasize mutual exclusion and paging.\nImportant details include LRU cache eviction and round-robin quantum.\nIn conclusion, kernel design requires trade-offs between throughput and responsiveness.');
  const sumBytes = await sumPdf.save();
  const extracted = await extractPdfText(Buffer.from(sumBytes));
  const summary = await generatePdfSummary(extracted.text, 'Operating_Systems.pdf');
  console.log('✓ Extracted text from PDF, length:', extracted.text.length, 'chars');
  console.log('✓ Generated 4-part summary successfully!');
  console.log('  Overview:', summary.overview.slice(0, 70) + '...');
  console.log('  Key points:', summary.keyPoints.length);
  console.log('  Important details:', summary.importantDetails.length);
  console.log('  Conclusions:', summary.conclusions.slice(0, 70) + '...');

  // 6. Notes Summary Backend Logic Preservation Test
  console.log('\n--- 6. Notes Summary Backend Logic Preservation ---');
  const { summarizeNotes } = await import('../src/lib/ai/notes-summary');
  const sampleNotes = 'Lecture 1: Intro to Neural Networks. Perceptrons form the basic building block. Multi-layer perceptrons use backpropagation for gradient descent optimization.';
  const notesResult = await summarizeNotes({ notesText: sampleNotes, title: 'AI Lecture' });
  if (!notesResult || !notesResult.overview || notesResult.keyPoints.length === 0) {
    throw new Error('Notes summary backend logic returned empty result');
  }
  console.log('✓ Notes summary preserved backend logic executed successfully!');
  console.log('  Notes Overview:', notesResult.overview.slice(0, 60) + '...');
  console.log('  Notes Key Points count:', notesResult.keyPoints.length);

  // 7. Verify API Lock Behavior (Uploads and Processing Blocked)
  console.log('\n--- 7. PDF Summary API Lock Verification ---');
  const { POST: postSummary } = await import('../src/app/api/summary/route');
  const { NextRequest } = await import('next/server');
  const mockReq = new NextRequest('http://localhost:3000/api/summary', { method: 'POST' });
  const lockRes = await postSummary(mockReq);
  console.log('Locked API Status Code:', lockRes.status);
  const lockData = await lockRes.json();
  console.log('Locked API Error Notice:', lockData.error);
  if (lockRes.status !== 503 || !lockData.comingSoon) {
    throw new Error(`Expected 503 with comingSoon: true, got ${lockRes.status}`);
  }
  console.log('✓ PDF Summary API lock correctly blocks processing with 503 Coming Soon notice.');

  console.log('\n=== ALL PHASES 1–5 REGRESSION TESTS PASSED! ===\n');
}

runFullRegression().catch((err) => {
  console.error('Regression Test Failure:', err);
  process.exit(1);
});
