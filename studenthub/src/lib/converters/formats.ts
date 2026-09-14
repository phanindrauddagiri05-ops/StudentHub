// ============================================================
// StudentHub — Document Formats Metadata
// ============================================================

import { DocumentFormat, FormatMetadata } from './types';

export const FORMATS: Record<DocumentFormat, FormatMetadata> = {
  pdf: {
    format: 'pdf',
    extension: '.pdf',
    mimeTypes: ['application/pdf'],
    displayName: 'Portable Document Format',
    shortName: 'PDF',
    icon: '📄',
    color: '#ef4444',
    badgeBg: '#fef2f2',
    badgeText: '#b91c1c',
    group: 'document',
  },
  docx: {
    format: 'docx',
    extension: '.docx',
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/x-docx',
    ],
    displayName: 'Microsoft Word Document',
    shortName: 'Word (DOCX)',
    icon: '📝',
    color: '#2563eb',
    badgeBg: '#eff6ff',
    badgeText: '#1d4ed8',
    group: 'document',
  },
  doc: {
    format: 'doc',
    extension: '.doc',
    mimeTypes: [
      'application/msword',
      'application/doc',
      'application/x-msword',
      'application/vnd.msword',
    ],
    displayName: 'Legacy Word Document',
    shortName: 'Word (DOC)',
    icon: '📝',
    color: '#3b82f6',
    badgeBg: '#eff6ff',
    badgeText: '#1e40af',
    group: 'document',
  },
  xlsx: {
    format: 'xlsx',
    extension: '.xlsx',
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ],
    displayName: 'Microsoft Excel Spreadsheet',
    shortName: 'Excel (XLSX)',
    icon: '📊',
    color: '#10b981',
    badgeBg: '#ecfdf5',
    badgeText: '#047857',
    group: 'spreadsheet',
  },
  xls: {
    format: 'xls',
    extension: '.xls',
    mimeTypes: [
      'application/vnd.ms-excel',
      'application/msexcel',
      'application/x-msexcel',
      'application/x-ms-excel',
    ],
    displayName: 'Legacy Excel Spreadsheet',
    shortName: 'Excel (XLS)',
    icon: '📊',
    color: '#059669',
    badgeBg: '#ecfdf5',
    badgeText: '#065f46',
    group: 'spreadsheet',
  },
  pptx: {
    format: 'pptx',
    extension: '.pptx',
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/x-vnd.openxmlformats-officedocument.presentationml.presentation',
    ],
    displayName: 'Microsoft PowerPoint Presentation',
    shortName: 'PowerPoint (PPTX)',
    icon: '📽️',
    color: '#f97316',
    badgeBg: '#fff7ed',
    badgeText: '#c2410c',
    group: 'presentation',
  },
  ppt: {
    format: 'ppt',
    extension: '.ppt',
    mimeTypes: [
      'application/vnd.ms-powerpoint',
      'application/powerpoint',
      'application/mspowerpoint',
      'application/x-mspowerpoint',
    ],
    displayName: 'Legacy PowerPoint Presentation',
    shortName: 'PowerPoint (PPT)',
    icon: '📽️',
    color: '#ea580c',
    badgeBg: '#fff7ed',
    badgeText: '#9a3412',
    group: 'presentation',
  },
  txt: {
    format: 'txt',
    extension: '.txt',
    mimeTypes: ['text/plain'],
    displayName: 'Plain Text File',
    shortName: 'Text (TXT)',
    icon: '📋',
    color: '#64748b',
    badgeBg: '#f8fafc',
    badgeText: '#334155',
    group: 'text',
  },
  csv: {
    format: 'csv',
    extension: '.csv',
    mimeTypes: ['text/csv', 'application/csv', 'text/comma-separated-values'],
    displayName: 'Comma-Separated Values',
    shortName: 'CSV Data',
    icon: '📑',
    color: '#0891b2',
    badgeBg: '#ecfeff',
    badgeText: '#0e7490',
    group: 'data',
  },

  // Future Phase 4 formats
  jpg: {
    format: 'jpg',
    extension: '.jpg',
    mimeTypes: ['image/jpeg'],
    displayName: 'JPEG Image',
    shortName: 'JPG',
    icon: '🖼️',
    color: '#8b5cf6',
    badgeBg: '#f5f3ff',
    badgeText: '#6d28d9',
    group: 'image',
  },
  png: {
    format: 'png',
    extension: '.png',
    mimeTypes: ['image/png'],
    displayName: 'PNG Image',
    shortName: 'PNG',
    icon: '🖼️',
    color: '#a855f7',
    badgeBg: '#faf5ff',
    badgeText: '#7e22ce',
    group: 'image',
  },
  webp: {
    format: 'webp',
    extension: '.webp',
    mimeTypes: ['image/webp'],
    displayName: 'WebP Image',
    shortName: 'WebP',
    icon: '🖼️',
    color: '#06b6d4',
    badgeBg: '#ecfeff',
    badgeText: '#0891b2',
    group: 'image',
  },
};

export function getFormatMetadata(format: DocumentFormat): FormatMetadata {
  return (
    FORMATS[format] || {
      format,
      extension: `.${format}`,
      mimeTypes: ['application/octet-stream'],
      displayName: format.toUpperCase(),
      shortName: format.toUpperCase(),
      icon: '📄',
      color: '#64748b',
      badgeBg: '#f1f5f9',
      badgeText: '#475569',
      group: 'document',
    }
  );
}

export function detectFormatFromFilename(filename: string): DocumentFormat | null {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (!ext) return null;
  if (ext === 'jpeg') return 'jpg';
  if (ext in FORMATS) return ext as DocumentFormat;
  return null;
}
