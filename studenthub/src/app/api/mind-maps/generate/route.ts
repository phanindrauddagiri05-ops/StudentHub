// ============================================================
// StudentHub — Mind Map Generation API Route
// POST /api/mind-maps/generate
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { FEATURE_FLAGS } from '@/lib/config/features';
import { generateMindMap } from '@/lib/ai/mindmap-generator';
import { getSupabaseClient } from '@/lib/supabase/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!FEATURE_FLAGS.MIND_MAPS) {
    return NextResponse.json(
      {
        error: 'Mind Map Generator is temporarily locked.',
        comingSoon: true,
      },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const { text, title } = body || {};

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'Please provide topic notes or outline to generate a mind map.' }, { status: 400 });
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

    const cleanTitle = title?.trim() || 'Study Mind Map';
    const mindMapData = await generateMindMap({
      text: text.trim(),
      title: cleanTitle,
    });

    const mapId = `map_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const createdAt = new Date().toISOString();

    // Server-side activity logging if user is authenticated
    if (supabase && verifiedUserId !== 'guest') {
      try {
        await supabase.from('activity_logs').insert({
          user_id: verifiedUserId,
          action: `Mind Map generated — ${cleanTitle}`,
          resource_type: 'mind_map',
          metadata: {
            title: cleanTitle,
            nodeCount: mindMapData.nodes.length,
          },
          created_at: createdAt,
        });
      } catch (logErr) {
        console.warn('Could not insert activity log on server:', logErr);
      }
    }

    return NextResponse.json({
      success: true,
      id: mapId,
      title: cleanTitle,
      data: mindMapData,
      userId: verifiedUserId,
      createdAt,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Mind Map generation API error:', msg);
    return NextResponse.json({ error: 'Failed to generate mind map. Please try again.' }, { status: 500 });
  }
}
