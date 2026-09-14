// ============================================================
// StudentHub — Notes Summary Backend Service
// Preserved backend logic for lecture notes summarization.
// Temporarily locked in UI/feature flags until Phase 9.
// ============================================================

import { generatePdfSummary, GeneratedSummary, chunkText } from './provider';

export interface NotesSummaryInput {
  title?: string;
  notesText: string;
  course?: string;
}

/**
 * Summarizes notes text using the AI provider or analytical engine.
 * Fully preserved and ready to re-enable when glitches are addressed.
 */
export async function summarizeNotes(input: NotesSummaryInput): Promise<GeneratedSummary> {
  const title = input.title?.trim() || 'Lecture Notes';
  return generatePdfSummary(input.notesText, `${title}.txt`);
}

export { chunkText };
