// ============================================================
// StudentHub — Server-Side Mind Map Generator Service
// Converts text/outlines into interactive MindMapData graphs
// ============================================================

import { MindMapData, MindMapNode, MindMapEdge } from '@/types/database';

const PALETTE = [
  '#2563eb', // Blue
  '#7c3aed', // Purple
  '#059669', // Emerald
  '#d97706', // Amber
  '#db2777', // Pink
  '#0891b2', // Cyan
  '#ea580c', // Orange
];

export interface GenerateMindMapInput {
  text: string;
  title?: string;
}

/**
 * Parses study text or outlines into a structured MindMapData node graph.
 */
export function generateAnalyticalMindMap(input: GenerateMindMapInput): MindMapData {
  const title = input.title?.trim() || 'Study Mind Map';
  const text = input.text.trim();

  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const nodes: MindMapNode[] = [];
  const edges: MindMapEdge[] = [];

  // Root node
  const rootId = 'node_root';
  nodes.push({
    id: rootId,
    text: title,
    x: 450,
    y: 280,
    color: '#0f172a',
    notes: 'Central Topic',
  });

  // Extract branches
  interface BranchItem {
    title: string;
    subtopics: string[];
  }

  const branches: BranchItem[] = [];

  let currentBranch: BranchItem | null = null;

  for (const line of lines) {
    const isBullet = /^[-*•\d+.]\s+/.test(line);
    const clean = line.replace(/^[-*•\d+.]\s+/, '').trim();

    if (!clean) continue;

    if (!isBullet && clean.length < 50) {
      // Heading / main branch
      currentBranch = { title: clean, subtopics: [] };
      branches.push(currentBranch);
    } else if (currentBranch && currentBranch.subtopics.length < 4) {
      currentBranch.subtopics.push(clean.length > 50 ? clean.slice(0, 47) + '...' : clean);
    } else if (!currentBranch) {
      currentBranch = { title: clean.length > 35 ? clean.slice(0, 32) + '...' : clean, subtopics: [] };
      branches.push(currentBranch);
    }
  }

  // If no structured branches found, chunk paragraphs
  if (branches.length === 0) {
    const sentences = text.split(/(?<=[.?!])\s+/).filter((s) => s.length > 20);
    const count = Math.min(4, Math.max(2, sentences.length));
    for (let i = 0; i < count; i++) {
      const s = sentences[i] || `Key Concept ${i + 1}`;
      branches.push({
        title: s.length > 35 ? s.slice(0, 32) + '...' : s,
        subtopics: [`Detail ${i + 1}A`, `Detail ${i + 1}B`],
      });
    }
  }

  // Limit to 7 primary branches for clean presentation
  const activeBranches = branches.slice(0, 6);
  const totalBranches = activeBranches.length;
  const radius = 240;

  activeBranches.forEach((branch, bIdx) => {
    const angle = (2 * Math.PI * bIdx) / totalBranches - Math.PI / 2;
    const branchX = Math.round(450 + radius * Math.cos(angle));
    const branchY = Math.round(280 + radius * Math.sin(angle));
    const branchId = `node_b_${bIdx + 1}`;
    const branchColor = PALETTE[bIdx % PALETTE.length];

    nodes.push({
      id: branchId,
      text: branch.title,
      x: branchX,
      y: branchY,
      color: branchColor,
      parentId: rootId,
    });

    edges.push({
      id: `edge_${rootId}_${branchId}`,
      source: rootId,
      target: branchId,
    });

    // Subtopics
    const subtopics = branch.subtopics.slice(0, 3);
    const subRadius = 140;

    subtopics.forEach((sub, sIdx) => {
      const spreadAngle = angle + (sIdx - (subtopics.length - 1) / 2) * 0.45;
      const subX = Math.round(branchX + subRadius * Math.cos(spreadAngle));
      const subY = Math.round(branchY + subRadius * Math.sin(spreadAngle));
      const subId = `node_sub_${bIdx + 1}_${sIdx + 1}`;

      nodes.push({
        id: subId,
        text: sub,
        x: subX,
        y: subY,
        color: branchColor,
        parentId: branchId,
      });

      edges.push({
        id: `edge_${branchId}_${subId}`,
        source: branchId,
        target: subId,
      });
    });
  });

  return {
    title,
    nodes,
    edges,
  };
}

/**
 * Main Mind Map Generator coordinator
 */
export async function generateMindMap(input: GenerateMindMapInput): Promise<MindMapData> {
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const openaiKey = process.env.OPENAI_API_KEY?.trim();

  // Try LLM if configured
  if (geminiKey || openaiKey) {
    const prompt = `You are a visual knowledge architect. Convert the following academic study notes into a Mind Map structure.
Title: "${input.title || 'Study Mind Map'}"
Text:
${input.text.slice(0, 10000)}

Output a JSON object with:
{
  "title": "${input.title || 'Study Mind Map'}",
  "branches": [
    {
      "title": "Branch Name",
      "subtopics": ["Concept 1", "Concept 2", "Concept 3"]
    }
  ]
}
Return ONLY raw JSON without markdown formatting.`;

    try {
      if (geminiKey) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed.branches)) {
              return generateAnalyticalMindMap({
                title: parsed.title || input.title,
                text: parsed.branches.map((b: any) => `${b.title}\n${(b.subtopics || []).map((s: string) => `- ${s}`).join('\n')}`).join('\n\n'),
              });
            }
          }
        }
      }
    } catch {
      // fallback to analytical generator
    }
  }

  return generateAnalyticalMindMap(input);
}
