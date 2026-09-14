// ============================================================
// StudentHub — Notes Summary API Route
// POST /api/notes-summary
// Backend processing logic preserved; blocked while feature is Coming Soon.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { FEATURE_FLAGS } from '@/lib/config/features';
import { summarizeNotes } from '@/lib/ai/notes-summary';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!FEATURE_FLAGS.NOTES_SUMMARY) {
    return NextResponse.json(
      {
        error: 'Notes Summary — Coming Soon. This feature is temporarily unavailable and will be enabled in a future update.',
        comingSoon: true,
      },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const { text, title, course } = body || {};

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'No notes text provided for summarization.' }, { status: 400 });
    }

    const result = await summarizeNotes({
      notesText: text,
      title,
      course,
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Notes summary API error:', message);
    return NextResponse.json({ error: 'Failed to process notes summary.' }, { status: 500 });
  }
}
