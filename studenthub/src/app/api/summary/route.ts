// ============================================================
// StudentHub — PDF AI Summary API Endpoint
// POST /api/summary
// Secure server-side PDF validation, text extraction,
// AI summarization, activity logging, and unified history integration.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { extractPdfText } from '@/lib/ai/pdf-text';
import { generatePdfSummary } from '@/lib/ai/provider';
import { getSupabaseClient } from '@/lib/supabase/client';
import { FEATURE_FLAGS } from '@/lib/config/features';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_PDF_SIZE_BYTES = 25 * 1024 * 1024; // 25MB limit

export async function POST(req: NextRequest) {
  if (!FEATURE_FLAGS.PDF_SUMMARY_AI) {
    return NextResponse.json(
      {
        error: 'PDF Summary — Coming Soon. This feature is temporarily unavailable and will be enabled in a future update.',
        comingSoon: true,
      },
      { status: 503 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No PDF file provided for summarization.' }, { status: 400 });
    }

    const filename = file.name || 'document.pdf';

    // 1. Validate file extension and mime type
    if (!filename.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Invalid file format. Please upload a valid PDF document.' },
        { status: 400 }
      );
    }

    // 2. Validate file size
    if (file.size > MAX_PDF_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'PDF file exceeds the maximum allowed size of 25MB.' },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json({ error: 'The uploaded PDF file is empty.' }, { status: 400 });
    }

    // 3. Authenticate User if Authorization token is provided
    let verifiedUserId = 'guest';
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    const supabase = getSupabaseClient();

    if (authHeader && supabase) {
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      if (token) {
        try {
          const { data: userData, error: userError } = await supabase.auth.getUser(token);
          if (!userError && userData?.user?.id) {
            verifiedUserId = userData.user.id;
          }
        } catch {
          // Fall back to guest if token validation fails
        }
      }
    }

    // 4. Extract text from PDF buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let textExtraction;
    try {
      textExtraction = await extractPdfText(buffer);
    } catch (extractErr: unknown) {
      const msg = extractErr instanceof Error ? extractErr.message : String(extractErr);
      return NextResponse.json({ error: `Text extraction failed: ${msg}` }, { status: 422 });
    }

    // 5. Scanned / image-only PDF detection
    if (textExtraction.isScanned || !textExtraction.text.trim()) {
      return NextResponse.json(
        {
          error: 'This PDF appears to be scanned or image-based. OCR support will be added in a future update.',
          isScanned: true,
          pageCount: textExtraction.pageCount,
        },
        { status: 422 }
      );
    }

    // 6. Generate AI Summary with chunking if document is long
    const summaryResult = await generatePdfSummary(textExtraction.text, filename);
    const summaryId = `sum_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const createdAt = new Date().toISOString();

    const responsePayload = {
      success: true,
      id: summaryId,
      filename,
      fileSize: file.size,
      pageCount: textExtraction.pageCount,
      wordCount: textExtraction.wordCount,
      summary: {
        overview: summaryResult.overview,
        keyPoints: summaryResult.keyPoints,
        importantDetails: summaryResult.importantDetails,
        conclusions: summaryResult.conclusions,
      },
      provider: summaryResult.providerUsed,
      chunkCount: summaryResult.chunkCount,
      userId: verifiedUserId,
      createdAt,
    };

    // 7. Log Activity on server if Supabase is connected
    if (supabase && verifiedUserId !== 'guest') {
      try {
        await supabase.from('activity_logs').insert({
          user_id: verifiedUserId,
          action: `PDF summarized — ${filename}`,
          resource_type: 'pdf_summary',
          metadata: {
            filename,
            page_count: textExtraction.pageCount,
            word_count: textExtraction.wordCount,
            summary_id: summaryId,
          },
          created_at: createdAt,
        });
      } catch (logErr) {
        console.warn('Could not insert activity log on server:', logErr);
      }
    }

    return NextResponse.json(responsePayload);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Unhandled PDF Summary API Error:', msg);
    return NextResponse.json(
      { error: 'An unexpected error occurred while processing the document. Please try again.' },
      { status: 500 }
    );
  }
}
