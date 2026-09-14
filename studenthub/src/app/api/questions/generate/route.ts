// ============================================================
// StudentHub — Questions Generation API Route
// POST /api/questions/generate
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { FEATURE_FLAGS } from '@/lib/config/features';
import { generateQuestions } from '@/lib/ai/questions-generator';
import { getSupabaseClient } from '@/lib/supabase/client';
import { QuestionDifficulty, QuestionType } from '@/types/database';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!FEATURE_FLAGS.QUESTIONS_GENERATOR) {
    return NextResponse.json(
      {
        error: 'Question Generator is temporarily locked.',
        comingSoon: true,
      },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const { text, title, count = 5, difficulty = 'medium', type = 'mcq' } = body || {};

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'Please provide study material or notes to generate questions.' }, { status: 400 });
    }

    // Authenticate user if bearer token is present
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
          // fallback to guest
        }
      }
    }

    const validCount = Math.min(Math.max(Number(count) || 5, 1), 25);
    const validDifficulty: QuestionDifficulty = ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium';
    const validType: QuestionType = ['mcq', 'short_answer', 'true_false', 'fill_blank', 'mixed'].includes(type) ? type : 'mcq';

    const questions = await generateQuestions({
      text: text.trim(),
      title: title ? String(title).trim() : 'Study Questions',
      count: validCount,
      difficulty: validDifficulty,
      type: validType,
    });

    const setId = `qset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const createdAt = new Date().toISOString();

    // Server-side activity logging if user is authenticated
    if (supabase && verifiedUserId !== 'guest') {
      try {
        await supabase.from('activity_logs').insert({
          user_id: verifiedUserId,
          action: `Question set generated — ${title || 'Study Material'} (${questions.length} questions)`,
          resource_type: 'question_set',
          metadata: {
            title: title || 'Study Questions',
            count: questions.length,
            difficulty: validDifficulty,
            type: validType,
          },
          created_at: createdAt,
        });
      } catch (logErr) {
        console.warn('Could not insert activity log on server:', logErr);
      }
    }

    return NextResponse.json({
      success: true,
      id: setId,
      title: title || 'Exam Question Set',
      questions,
      difficulty: validDifficulty,
      questionCount: questions.length,
      questionType: validType,
      userId: verifiedUserId,
      createdAt,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Questions generation API error:', msg);
    return NextResponse.json({ error: 'Failed to generate questions. Please try again.' }, { status: 500 });
  }
}
