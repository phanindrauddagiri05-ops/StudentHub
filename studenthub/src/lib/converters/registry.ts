// ============================================================
// StudentHub — Centralized Conversion Registry
// Maps supported document conversions, category grouping,
// and honest availability status.
// ============================================================

import { ConversionCategory, ConversionDefinition, DocumentFormat } from './types';
import { MAX_DOCUMENT_CONVERSION_FILE_SIZE_MB } from '../constants';

export const CONVERSIONS: ConversionDefinition[] = [
  // ── Popular Group ──────────────────────────────────────────
  {
    id: 'pdf-to-docx',
    sourceFormat: 'pdf',
    targetFormat: 'docx',
    displayName: 'PDF to Word',
    description: 'Convert PDF documents into editable Microsoft Word (.docx) files.',
    categories: ['popular', 'pdf'],
    available: true,
    maxFileSizeMB: MAX_DOCUMENT_CONVERSION_FILE_SIZE_MB,
  },
  {
    id: 'docx-to-pdf',
    sourceFormat: 'docx',
    targetFormat: 'pdf',
    displayName: 'Word to PDF',
    description: 'Convert Word documents (.docx) into universal, print-ready PDF files.',
    categories: ['popular', 'word'],
    available: true,
    maxFileSizeMB: MAX_DOCUMENT_CONVERSION_FILE_SIZE_MB,
  },
  {
    id: 'xlsx-to-pdf',
    sourceFormat: 'xlsx',
    targetFormat: 'pdf',
    displayName: 'Excel to PDF',
    description: 'Convert Excel spreadsheets (.xlsx) into clean, paginated PDF tables.',
    categories: ['popular', 'excel'],
    available: true,
    maxFileSizeMB: MAX_DOCUMENT_CONVERSION_FILE_SIZE_MB,
  },
  {
    id: 'pptx-to-pdf',
    sourceFormat: 'pptx',
    targetFormat: 'pdf',
    displayName: 'PowerPoint to PDF',
    description: 'Convert presentation slides (.pptx) into multi-page PDF documents.',
    categories: ['popular', 'powerpoint'],
    available: true,
    maxFileSizeMB: MAX_DOCUMENT_CONVERSION_FILE_SIZE_MB,
  },

  // ── PDF Group ─────────────────────────────────────────────
  {
    id: 'pdf-to-txt',
    sourceFormat: 'pdf',
    targetFormat: 'txt',
    displayName: 'PDF to Text',
    description: 'Extract raw text streams and paragraphs from PDF files into plain text.',
    categories: ['pdf', 'text'],
    available: true,
    maxFileSizeMB: MAX_DOCUMENT_CONVERSION_FILE_SIZE_MB,
  },
  {
    id: 'pdf-to-jpg',
    sourceFormat: 'pdf',
    targetFormat: 'jpg',
    displayName: 'PDF to JPG',
    description: 'Render PDF document pages into high-resolution JPG images.',
    categories: ['pdf'],
    available: false,
    comingSoonReason: 'Part of Phase 4 Image & Page Renderers.',
    maxFileSizeMB: MAX_DOCUMENT_CONVERSION_FILE_SIZE_MB,
  },
  {
    id: 'pdf-to-png',
    sourceFormat: 'pdf',
    targetFormat: 'png',
    displayName: 'PDF to PNG',
    description: 'Render PDF document pages into crisp lossless PNG images.',
    categories: ['pdf'],
    available: false,
    comingSoonReason: 'Part of Phase 4 Image & Page Renderers.',
    maxFileSizeMB: MAX_DOCUMENT_CONVERSION_FILE_SIZE_MB,
  },
  {
    id: 'pdf-to-xlsx',
    sourceFormat: 'pdf',
    targetFormat: 'xlsx',
    displayName: 'PDF to Excel',
    description: 'Extract tables from PDF into structured Excel spreadsheets.',
    categories: ['pdf', 'excel'],
    available: false,
    comingSoonReason: 'Requires AI table-boundary parser. In active development.',
    maxFileSizeMB: MAX_DOCUMENT_CONVERSION_FILE_SIZE_MB,
  },

  // ── Word Group ────────────────────────────────────────────
  {
    id: 'doc-to-pdf',
    sourceFormat: 'doc',
    targetFormat: 'pdf',
    displayName: 'Legacy Word (DOC) to PDF',
    description: 'Convert legacy binary Word .doc files to universal, print-ready PDF documents.',
    categories: ['word'],
    available: true,
    maxFileSizeMB: MAX_DOCUMENT_CONVERSION_FILE_SIZE_MB,
  },
  {
    id: 'docx-to-txt',
    sourceFormat: 'docx',
    targetFormat: 'txt',
    displayName: 'Word to Text',
    description: 'Extract clean plain text from Word .docx documents.',
    categories: ['word', 'text'],
    available: true,
    maxFileSizeMB: MAX_DOCUMENT_CONVERSION_FILE_SIZE_MB,
  },

  // ── Excel Group ───────────────────────────────────────────
  {
    id: 'xls-to-pdf',
    sourceFormat: 'xls',
    targetFormat: 'pdf',
    displayName: 'Legacy Excel (XLS) to PDF',
    description: 'Convert legacy Excel .xls files to clean paginated PDF tables.',
    categories: ['excel'],
    available: true,
    maxFileSizeMB: MAX_DOCUMENT_CONVERSION_FILE_SIZE_MB,
  },
  {
    id: 'xlsx-to-csv',
    sourceFormat: 'xlsx',
    targetFormat: 'csv',
    displayName: 'Excel to CSV',
    description: 'Export Excel worksheet records to comma-separated values (.csv).',
    categories: ['excel', 'data'],
    available: true,
    maxFileSizeMB: MAX_DOCUMENT_CONVERSION_FILE_SIZE_MB,
  },

  // ── PowerPoint Group ──────────────────────────────────────
  {
    id: 'ppt-to-pdf',
    sourceFormat: 'ppt',
    targetFormat: 'pdf',
    displayName: 'Legacy PowerPoint (PPT) to PDF',
    description: 'Convert legacy .ppt slides into multi-page PDF documents.',
    categories: ['powerpoint'],
    available: true,
    maxFileSizeMB: MAX_DOCUMENT_CONVERSION_FILE_SIZE_MB,
  },

  // ── Text Group ────────────────────────────────────────────
  {
    id: 'txt-to-pdf',
    sourceFormat: 'txt',
    targetFormat: 'pdf',
    displayName: 'Text to PDF',
    description: 'Format plain text documents into clean, paginated PDF files.',
    categories: ['text'],
    available: true,
    maxFileSizeMB: MAX_DOCUMENT_CONVERSION_FILE_SIZE_MB,
  },
  {
    id: 'txt-to-docx',
    sourceFormat: 'txt',
    targetFormat: 'docx',
    displayName: 'Text to Word',
    description: 'Convert plain text files into editable Microsoft Word (.docx) documents.',
    categories: ['text', 'word'],
    available: true,
    maxFileSizeMB: MAX_DOCUMENT_CONVERSION_FILE_SIZE_MB,
  },

  // ── Data Group ────────────────────────────────────────────
  {
    id: 'csv-to-xlsx',
    sourceFormat: 'csv',
    targetFormat: 'xlsx',
    displayName: 'CSV to Excel',
    description: 'Convert comma-separated data into a formatted Microsoft Excel spreadsheet.',
    categories: ['data', 'excel'],
    available: true,
    maxFileSizeMB: MAX_DOCUMENT_CONVERSION_FILE_SIZE_MB,
  },
  {
    id: 'csv-to-pdf',
    sourceFormat: 'csv',
    targetFormat: 'pdf',
    displayName: 'CSV to PDF',
    description: 'Render comma-separated values into a clean tabular PDF grid.',
    categories: ['data'],
    available: true,
    maxFileSizeMB: MAX_DOCUMENT_CONVERSION_FILE_SIZE_MB,
  },
  {
    id: 'csv-to-txt',
    sourceFormat: 'csv',
    targetFormat: 'txt',
    displayName: 'CSV to Text',
    description: 'Convert tabular CSV data into clean formatted plain text.',
    categories: ['data', 'text'],
    available: true,
    maxFileSizeMB: MAX_DOCUMENT_CONVERSION_FILE_SIZE_MB,
  },
];

export const CONVERSION_CATEGORIES: { id: ConversionCategory; label: string; icon: string }[] = [
  { id: 'popular', label: 'Popular', icon: '🔥' },
  { id: 'pdf', label: 'PDF', icon: '📄' },
  { id: 'word', label: 'Word', icon: '📝' },
  { id: 'excel', label: 'Excel', icon: '📊' },
  { id: 'powerpoint', label: 'PowerPoint', icon: '📽️' },
  { id: 'text', label: 'Text', icon: '📋' },
  { id: 'data', label: 'Data', icon: '📑' },
];

export function getConversionsByCategory(category: ConversionCategory): ConversionDefinition[] {
  return CONVERSIONS.filter((c) => c.categories.includes(category));
}

export function getConversion(
  sourceFormat: DocumentFormat,
  targetFormat: DocumentFormat
): ConversionDefinition | undefined {
  return CONVERSIONS.find(
    (c) => c.sourceFormat === sourceFormat && c.targetFormat === targetFormat
  );
}

export function getCompatibleTargets(sourceFormat: DocumentFormat): DocumentFormat[] {
  return Array.from(
    new Set(
      CONVERSIONS.filter((c) => c.sourceFormat === sourceFormat).map((c) => c.targetFormat)
    )
  );
}

export function getAllSourceFormats(): DocumentFormat[] {
  return Array.from(new Set(CONVERSIONS.map((c) => c.sourceFormat)));
}

export function getAvailableConversions(): ConversionDefinition[] {
  return CONVERSIONS.filter((c) => c.available);
}
