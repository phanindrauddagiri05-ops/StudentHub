import { PDFDocument } from 'pdf-lib';
import { extractPdfText } from '../src/lib/ai/pdf-text';
import { generatePdfSummary, chunkText } from '../src/lib/ai/provider';
import { TOOLS } from '../src/lib/tools';
import { FEATURE_FLAGS } from '../src/lib/config/features';

async function runTests() {
  console.log('=== RUNNING PHASE 5 AUTOMATED TEST SUITE ===');

  // 1. Tool Registry & Feature Flags
  console.log('\n--- 1. Testing Feature Flags & Tool Registry ---');
  const availableTools = TOOLS.filter((t) => t.status === 'available');
  console.log('Available tools count:', availableTools.length);
  availableTools.forEach((t) => console.log(`  ✓ ${t.name} (${t.id}) -> ${t.path}`));

  if (availableTools.length !== 4) {
    throw new Error(`Expected exactly 4 available tools, found ${availableTools.length}`);
  }
  if (!FEATURE_FLAGS.PDF_SUMMARY_AI) {
    throw new Error('FEATURE_FLAGS.PDF_SUMMARY_AI must be true');
  }
  if (FEATURE_FLAGS.RESUME_GENERATOR) {
    throw new Error('FEATURE_FLAGS.RESUME_GENERATOR must remain false (locked until Phase 8)');
  }
  console.log('✓ Tool registry & feature flags passed.');

  // 2. Normal PDF Text Extraction
  console.log('\n--- 2. Testing PDF Text Extraction ---');
  const doc = await PDFDocument.create();
  const page = doc.addPage([500, 500]);
  page.drawText('StudentHub Academic Research Report on Quantum Computing and Algorithms.\nKey findings demonstrate significant performance advantages in matrix multiplication and graph search problems.\nImportant details include quadratic speedups via Grover search and polynomial algorithms.\nIn conclusion, practical applications will require fault-tolerant error correction codes.');
  const pdfBytes = await doc.save();
  const buffer = Buffer.from(pdfBytes);

  const extraction = await extractPdfText(buffer);
  console.log('Extracted text preview:', extraction.text.slice(0, 100) + '...');
  console.log('Page count:', extraction.pageCount);
  console.log('Word count:', extraction.wordCount);
  console.log('Is scanned:', extraction.isScanned);

  if (extraction.isScanned) {
    throw new Error('Expected text PDF to not be flagged as scanned.');
  }
  if (extraction.pageCount !== 1) {
    throw new Error(`Expected 1 page, got ${extraction.pageCount}`);
  }
  console.log('✓ PDF text extraction passed.');

  // 3. Scanned / Image-Only PDF Detection
  console.log('\n--- 3. Testing Scanned PDF Detection ---');
  const blankDoc = await PDFDocument.create();
  blankDoc.addPage([400, 400]); // Blank page without text
  const blankBytes = await blankDoc.save();
  const blankBuffer = Buffer.from(blankBytes);

  const blankExtraction = await extractPdfText(blankBuffer);
  console.log('Blank PDF isScanned:', blankExtraction.isScanned);
  if (!blankExtraction.isScanned) {
    throw new Error('Expected empty PDF to be detected as scanned/image-only.');
  }
  console.log('✓ Scanned PDF detection passed.');

  // 4. Long Document Chunking
  console.log('\n--- 4. Testing Chunking Engine ---');
  const longText = 'This is section paragraph for testing chunking in StudentHub AI summarizer. '.repeat(350); // ~26,000 characters
  console.log('Long text length:', longText.length, 'characters');
  const chunks = chunkText(longText);
  console.log('Number of generated chunks:', chunks.length);
  if (chunks.length < 2) {
    throw new Error('Expected text > 20,000 chars to produce multiple chunks.');
  }
  console.log('✓ Chunking engine passed.');

  // 5. Summary Generation & 4-Part Structure
  console.log('\n--- 5. Testing Summary Generation ---');
  const summaryResult = await generatePdfSummary(extraction.text, 'Quantum_Computing_Paper.pdf');
  console.log('Provider used:', summaryResult.providerUsed);
  console.log('Overview length:', summaryResult.overview.length);
  console.log('Key points count:', summaryResult.keyPoints.length);
  console.log('Important details count:', summaryResult.importantDetails.length);
  console.log('Conclusions length:', summaryResult.conclusions.length);

  if (!summaryResult.overview || summaryResult.overview.length < 10) {
    throw new Error('Overview section is missing or empty.');
  }
  if (!Array.isArray(summaryResult.keyPoints) || summaryResult.keyPoints.length === 0) {
    throw new Error('Key points section is missing or empty.');
  }
  if (!Array.isArray(summaryResult.importantDetails) || summaryResult.importantDetails.length === 0) {
    throw new Error('Important details section is missing or empty.');
  }
  if (!summaryResult.conclusions || summaryResult.conclusions.length < 10) {
    throw new Error('Conclusions section is missing or empty.');
  }

  console.log('Sample Key Point #1:', summaryResult.keyPoints[0]);
  console.log('Sample Conclusion:', summaryResult.conclusions);
  console.log('✓ Structured 4-part summary generation passed.');

  console.log('\n=== ALL PHASE 5 TESTS PASSED SUCCESSFULLY! ===\n');
}

runTests().catch((err) => {
  console.error('Test failure:', err);
  process.exit(1);
});
