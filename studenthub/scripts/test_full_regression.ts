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
  if (available.length !== 4) throw new Error('Expected 4 available tools');
  if (FEATURE_FLAGS.RESUME_GENERATOR !== false) throw new Error('Resume generator must be locked');
  if (FEATURE_FLAGS.PDF_SUMMARY_AI !== true) throw new Error('PDF Summary must be enabled');
  console.log('✓ Roadmap status verified.');

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

  console.log('\n=== ALL PHASES 1–5 REGRESSION TESTS PASSED! ===\n');
}

runFullRegression().catch((err) => {
  console.error('Regression Test Failure:', err);
  process.exit(1);
});
