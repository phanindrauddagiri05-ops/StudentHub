// ============================================================
// StudentHub — Centralized Feature Flags
// Controls feature availability according to the master roadmap.
// ============================================================

export const FEATURE_FLAGS = {
  // Phase 1: Website + PDF Tools
  PDF_TOOLS: true,

  // Phase 2: Authentication + Dashboard
  AUTH_DASHBOARD: true,

  // Phase 3: Document Converters (CURRENT PHASE)
  DOCUMENT_CONVERTERS: true,

  // Phase 4: Image Converters (COMPLETED)
  IMAGE_CONVERTERS: true,

  // Phase 5: PDF Summary + AI (TEMPORARILY LOCKED UNTIL FUTURE UPDATE)
  PDF_SUMMARY_AI: false,

  // Phase 6: Mind Maps + Questions (PHASE 6 ACTIVE)
  MIND_MAPS: true,
  QUESTIONS_GENERATOR: true,

  // Phase 7: Timetable + Attendance (LOCKED)
  TIMETABLE: false,
  ATTENDANCE_CALCULATOR: false,

  // Phase 8: Resume Generator (LOCKED UNTIL PHASE 8)
  // Code, templates, models, and schemas are fully preserved.
  RESUME_GENERATOR: false,

  // Phase 9: Notes + Search (LOCKED)
  NOTES: false,
  NOTES_SEARCH: false,
  NOTES_SUMMARY: false,

  // Phase 10: Study Search (LOCKED)
  STUDY_SEARCH: false,

  // Phase 11: Ads + Analytics + Monetization (LOCKED)
  MONETIZATION: false,
} as const;

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

export function isFeatureEnabled(flag: FeatureFlagKey): boolean {
  return Boolean(FEATURE_FLAGS[flag]);
}
