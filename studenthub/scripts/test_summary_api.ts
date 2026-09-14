import { PDFDocument } from 'pdf-lib';
import { POST } from '../src/app/api/summary/route';
import { NextRequest } from 'next/server';

async function testApi() {
  console.log('--- TESTING /api/summary ENDPOINT ---');

  // Test 1: Valid PDF
  const doc = await PDFDocument.create();
  const page = doc.addPage([500, 500]);
  page.drawText('StudentHub Research Report on Distributed Databases and Consensus Algorithms.\nKey findings demonstrate Paxos and Raft maintain consistency during network partitions.\nImportant details include quorum replication, leader election heartbeats, and write-ahead logs.\nIn conclusion, modern distributed architectures depend heavily on linearizable state machine replication.');
  const pdfBytes = await doc.save();

  const file = new File([pdfBytes], 'Distributed_Databases.pdf', { type: 'application/pdf' });
  const formData = new FormData();
  formData.append('file', file);

  const req = new NextRequest('http://localhost:3000/api/summary', {
    method: 'POST',
    body: formData,
  });

  const res = await POST(req);
  console.log('API Status Code:', res.status);
  const data = await res.json();
  console.log('Success:', data.success);
  console.log('Filename:', data.filename);
  console.log('Page count:', data.pageCount);
  console.log('Provider:', data.provider);
  console.log('Overview:', data.summary?.overview?.slice(0, 80) + '...');
  console.log('Key points count:', data.summary?.keyPoints?.length);

  if (res.status !== 200 || !data.success) {
    throw new Error('Expected 200 OK with success: true');
  }

  // Test 2: Scanned / Empty PDF
  console.log('\n--- TESTING SCANNED/EMPTY PDF ERROR ---');
  const blankDoc = await PDFDocument.create();
  blankDoc.addPage([400, 400]);
  const blankBytes = await blankDoc.save();

  const blankFile = new File([blankBytes], 'Scanned_Receipt.pdf', { type: 'application/pdf' });
  const blankFormData = new FormData();
  blankFormData.append('file', blankFile);

  const blankReq = new NextRequest('http://localhost:3000/api/summary', {
    method: 'POST',
    body: blankFormData,
  });

  const blankRes = await POST(blankReq);
  console.log('Scanned PDF Status:', blankRes.status);
  const blankData = await blankRes.json();
  console.log('Error message:', blankData.error);
  console.log('isScanned flag:', blankData.isScanned);

  if (blankRes.status !== 422) {
    throw new Error(`Expected 422 Unprocessable Entity, got ${blankRes.status}`);
  }
  if (!blankData.isScanned) {
    throw new Error('Expected isScanned: true in response');
  }
  if (!blankData.error.includes('OCR support will be added in a future update')) {
    throw new Error('Expected OCR notification message');
  }

  console.log('\n✓ /api/summary route verified successfully!');
}

testApi().catch((err) => {
  console.error('API Test Failure:', err);
  process.exit(1);
});
