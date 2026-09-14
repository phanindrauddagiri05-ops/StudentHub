// ============================================================
// StudentHub — Centralized Conversion Registry
// Maps supported document conversions, category grouping,
// and honest availability status.
// ============================================================

import { ConversionCategory, ConversionDefinition, DocumentFormat } from './types';
import {
  MAX_DOCUMENT_CONVERSION_FILE_SIZE_MB,
  MAX_IMAGE_CONVERSION_FILE_SIZE_MB,
} from '../constants';

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

  // ── Image Conversions (Phase 4) ───────────────────────────
  // JPEG
  {
    id: 'jpg-to-png',
    sourceFormat: 'jpg',
    targetFormat: 'png',
    displayName: 'JPG to PNG',
    description: 'Convert JPEG photograph into crisp, lossless PNG format.',
    categories: ['popular', 'image'],
    available: true,
    maxFileSizeMB: MAX_IMAGE_CONVERSION_FILE_SIZE_MB,
  },
  {
    id: 'jpg-to-webp',
    sourceFormat: 'jpg',
    targetFormat: 'webp',
    displayName: 'JPG to WebP',
    description: 'Convert JPEG image into lightweight modern WebP format for fast web delivery.',
    categories: ['popular', 'image'],
    available: true,
    maxFileSizeMB: MAX_IMAGE_CONVERSION_FILE_SIZE_MB,
  },
  {
    id: 'jpg-to-bmp',
    sourceFormat: 'jpg',
    targetFormat: 'bmp',
    displayName: 'JPG to BMP',
    description: 'Convert JPEG image into uncompressed Windows Bitmap (.bmp) format.',
    categories: ['image'],
    available: true,
    maxFileSizeMB: MAX_IMAGE_CONVERSION_FILE_SIZE_MB,
  },
  {
    id: 'jpg-to-tiff',
    sourceFormat: 'jpg',
    targetFormat: 'tiff',
    displayName: 'JPG to TIFF',
    description: 'Convert JPEG image into high-depth Tagged Image File Format (.tiff).',
    categories: ['image'],
    available: true,
    maxFileSizeMB: MAX_IMAGE_CONVERSION_FILE_SIZE_MB,
  },
  {
    id: 'jpg-to-gif',
    sourceFormat: 'jpg',
    targetFormat: 'gif',
    displayName: 'JPG to GIF',
    description: 'Convert JPEG image into indexed color GIF format.',
    categories: ['image'],
    available: true,
    maxFileSizeMB: MAX_IMAGE_CONVERSION_FILE_SIZE_MB,
  },

  // PNG
  {
    id: 'png-to-jpg',
    sourceFormat: 'png',
    targetFormat: 'jpg',
    displayName: 'PNG to JPG',
    description: 'Convert PNG graphic to standard JPEG photo with clean white background blending.',
    categories: ['popular', 'image'],
    available: true,
    maxFileSizeMB: MAX_IMAGE_CONVERSION_FILE_SIZE_MB,
  },
  {
    id: 'png-to-webp',
    sourceFormat: 'png',
    targetFormat: 'webp',
    displayName: 'PNG to WebP',
    description: 'Convert PNG graphics into modern, high-compression WebP preserving transparency.',
    categories: ['popular', 'image'],
    available: true,
    maxFileSizeMB: MAX_IMAGE_CONVERSION_FILE_SIZE_MB,
  },
  {
    id: 'png-to-bmp',
    sourceFormat: 'png',
    targetFormat: 'bmp',
    displayName: 'PNG to BMP',
    description: 'Convert PNG image into standard Windows Bitmap (.bmp) format.',
    categories: ['image'],
    available: true,
    maxFileSizeMB: MAX_IMAGE_CONVERSION_FILE_SIZE_MB,
  },
  {
    id: 'png-to-tiff',
    sourceFormat: 'png',
    targetFormat: 'tiff',
    displayName: 'PNG to TIFF',
    description: 'Convert PNG image to high-fidelity Tagged Image File Format (.tiff).',
    categories: ['image'],
    available: true,
    maxFileSizeMB: MAX_IMAGE_CONVERSION_FILE_SIZE_MB,
  },
  {
    id: 'png-to-gif',
    sourceFormat: 'png',
    targetFormat: 'gif',
    displayName: 'PNG to GIF',
    description: 'Convert PNG graphic into 256-color indexed GIF image.',
    categories: ['image'],
    available: true,
    maxFileSizeMB: MAX_IMAGE_CONVERSION_FILE_SIZE_MB,
  },

  // WebP
  {
    id: 'webp-to-jpg',
    sourceFormat: 'webp',
    targetFormat: 'jpg',
    displayName: 'WebP to JPG',
    description: 'Convert modern WebP image into universal JPEG format.',
    categories: ['popular', 'image'],
    available: true,
    maxFileSizeMB: MAX_IMAGE_CONVERSION_FILE_SIZE_MB,
  },
  {
    id: 'webp-to-png',
    sourceFormat: 'webp',
    targetFormat: 'png',
    displayName: 'WebP to PNG',
    description: 'Convert WebP image into lossless PNG format preserving alpha channel.',
    categories: ['popular', 'image'],
    available: true,
    maxFileSizeMB: MAX_IMAGE_CONVERSION_FILE_SIZE_MB,
  },
  {
    id: 'webp-to-bmp',
    sourceFormat: 'webp',
    targetFormat: 'bmp',
    displayName: 'WebP to BMP',
    description: 'Convert WebP image into Windows Bitmap (.bmp) format.',
    categories: ['image'],
    available: true,
    maxFileSizeMB: MAX_IMAGE_CONVERSION_FILE_SIZE_MB,
  },
  {
    id: 'webp-to-tiff',
    sourceFormat: 'webp',
    targetFormat: 'tiff',
    displayName: 'WebP to TIFF',
    description: 'Convert WebP image into high-resolution TIFF file format.',
    categories: ['image'],
    available: true,
    maxFileSizeMB: MAX_IMAGE_CONVERSION_FILE_SIZE_MB,
  },

  // HEIC / HEIF
  {
    id: 'heic-to-jpg',
    sourceFormat: 'heic',
    targetFormat: 'jpg',
    displayName: 'HEIC to JPG',
    description: 'Convert Apple iOS / iPhone HEIC photos into universal high-quality JPG.',
    categories: ['popular', 'image'],
    available: true,
    maxFileSizeMB: MAX_IMAGE_CONVERSION_FILE_SIZE_MB,
  },
  {
    id: 'heic-to-png',
    sourceFormat: 'heic',
    targetFormat: 'png',
    displayName: 'HEIC to PNG',
    description: 'Convert Apple HEIC photos into lossless PNG format.',
    categories: ['image'],
    available: true,
    maxFileSizeMB: MAX_IMAGE_CONVERSION_FILE_SIZE_MB,
  },
  {
    id: 'heif-to-jpg',
    sourceFormat: 'heif',
    targetFormat: 'jpg',
    displayName: 'HEIF to JPG',
    description: 'Convert High Efficiency Image Format (.heif) to standard JPEG.',
    categories: ['image'],
    available: true,
    maxFileSizeMB: MAX_IMAGE_CONVERSION_FILE_SIZE_MB,
  },
  {
    id: 'heif-to-png',
    sourceFormat: 'heif',
    targetFormat: 'png',
    displayName: 'HEIF to PNG',
    description: 'Convert High Efficiency Image Format (.heif) into lossless PNG.',
    categories: ['image'],
    available: true,
    maxFileSizeMB: MAX_IMAGE_CONVERSION_FILE_SIZE_MB,
  },

  // BMP
  {
    id: 'bmp-to-jpg',
    sourceFormat: 'bmp',
    targetFormat: 'jpg',
    displayName: 'BMP to JPG',
    description: 'Compress uncompressed Windows Bitmap (.bmp) images into lightweight JPEG.',
    categories: ['image'],
    available: true,
    maxFileSizeMB: MAX_IMAGE_CONVERSION_FILE_SIZE_MB,
  },
  {
    id: 'bmp-to-png',
    sourceFormat: 'bmp',
    targetFormat: 'png',
    displayName: 'BMP to PNG',
    description: 'Convert Windows Bitmap (.bmp) into compressed lossless PNG format.',
    categories: ['image'],
    available: true,
    maxFileSizeMB: MAX_IMAGE_CONVERSION_FILE_SIZE_MB,
  },
  {
    id: 'bmp-to-webp',
    sourceFormat: 'bmp',
    targetFormat: 'webp',
    displayName: 'BMP to WebP',
    description: 'Convert Bitmap (.bmp) into modern WebP format for fast web rendering.',
    categories: ['image'],
    available: true,
    maxFileSizeMB: MAX_IMAGE_CONVERSION_FILE_SIZE_MB,
  },

  // TIFF
  {
    id: 'tiff-to-jpg',
    sourceFormat: 'tiff',
    targetFormat: 'jpg',
    displayName: 'TIFF to JPG',
    description: 'Convert large scanning or photography TIFF images into standard JPEG.',
    categories: ['image'],
    available: true,
    maxFileSizeMB: MAX_IMAGE_CONVERSION_FILE_SIZE_MB,
  },
  {
    id: 'tiff-to-png',
    sourceFormat: 'tiff',
    targetFormat: 'png',
    displayName: 'TIFF to PNG',
    description: 'Convert high-depth TIFF image files into web-friendly lossless PNG.',
    categories: ['image'],
    available: true,
    maxFileSizeMB: MAX_IMAGE_CONVERSION_FILE_SIZE_MB,
  },
  {
    id: 'tiff-to-webp',
    sourceFormat: 'tiff',
    targetFormat: 'webp',
    displayName: 'TIFF to WebP',
    description: 'Convert TIFF imagery into modern high-efficiency WebP images.',
    categories: ['image'],
    available: true,
    maxFileSizeMB: MAX_IMAGE_CONVERSION_FILE_SIZE_MB,
  },

  // SVG
  {
    id: 'svg-to-png',
    sourceFormat: 'svg',
    targetFormat: 'png',
    displayName: 'SVG to PNG',
    description: 'Rasterize scalable vector graphics (.svg) into high-resolution transparent PNG.',
    categories: ['popular', 'image'],
    available: true,
    maxFileSizeMB: MAX_IMAGE_CONVERSION_FILE_SIZE_MB,
  },
  {
    id: 'svg-to-jpg',
    sourceFormat: 'svg',
    targetFormat: 'jpg',
    displayName: 'SVG to JPG',
    description: 'Rasterize vector graphics (.svg) into standard JPEG with clean background.',
    categories: ['image'],
    available: true,
    maxFileSizeMB: MAX_IMAGE_CONVERSION_FILE_SIZE_MB,
  },
  {
    id: 'svg-to-webp',
    sourceFormat: 'svg',
    targetFormat: 'webp',
    displayName: 'SVG to WebP',
    description: 'Rasterize vector graphics (.svg) into modern lightweight WebP format.',
    categories: ['image'],
    available: true,
    maxFileSizeMB: MAX_IMAGE_CONVERSION_FILE_SIZE_MB,
  },

  // GIF
  {
    id: 'gif-to-jpg',
    sourceFormat: 'gif',
    targetFormat: 'jpg',
    displayName: 'GIF to JPG',
    description: 'Extract clean primary frame from GIF into standard JPEG photograph.',
    categories: ['image'],
    available: true,
    maxFileSizeMB: MAX_IMAGE_CONVERSION_FILE_SIZE_MB,
  },
  {
    id: 'gif-to-png',
    sourceFormat: 'gif',
    targetFormat: 'png',
    displayName: 'GIF to PNG',
    description: 'Convert GIF image into crisp lossless PNG graphic.',
    categories: ['image'],
    available: true,
    maxFileSizeMB: MAX_IMAGE_CONVERSION_FILE_SIZE_MB,
  },
  {
    id: 'gif-to-webp',
    sourceFormat: 'gif',
    targetFormat: 'webp',
    displayName: 'GIF to WebP',
    description: 'Convert GIF into modern WebP format with superior compression.',
    categories: ['image'],
    available: true,
    maxFileSizeMB: MAX_IMAGE_CONVERSION_FILE_SIZE_MB,
  },
];

export const CONVERSION_CATEGORIES: { id: ConversionCategory; label: string; icon: string }[] = [
  { id: 'popular', label: 'Popular', icon: '🔥' },
  { id: 'image', label: 'Images', icon: '🖼️' },
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

export const IMAGE_FORMATS: DocumentFormat[] = [
  'jpg',
  'png',
  'webp',
  'gif',
  'bmp',
  'tiff',
  'heic',
  'heif',
  'svg',
];

export function isImageFormat(format: DocumentFormat | string): boolean {
  return IMAGE_FORMATS.includes(format as DocumentFormat);
}

export function getImageSourceFormats(): DocumentFormat[] {
  return IMAGE_FORMATS;
}

export function getImageConversions(): ConversionDefinition[] {
  return CONVERSIONS.filter((c) => c.categories.includes('image'));
}
