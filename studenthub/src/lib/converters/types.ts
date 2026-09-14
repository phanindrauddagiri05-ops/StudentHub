// ============================================================
// StudentHub — Document Converter Types
// ============================================================

export type DocumentFormat =
  | 'pdf'
  | 'docx'
  | 'doc'
  | 'xlsx'
  | 'xls'
  | 'pptx'
  | 'ppt'
  | 'txt'
  | 'csv'
  | 'jpg'
  | 'png'
  | 'webp'
  | 'gif'
  | 'bmp'
  | 'tiff'
  | 'heic'
  | 'heif'
  | 'svg';

export type ConversionCategory =
  | 'popular'
  | 'pdf'
  | 'word'
  | 'excel'
  | 'powerpoint'
  | 'text'
  | 'data'
  | 'image';

export interface ImageConversionOptions {
  quality?: number; // 1-100, default 80
  backgroundColor?: string; // e.g. '#ffffff' for jpg
  width?: number;
  height?: number;
}

export interface FormatMetadata {
  format: DocumentFormat;
  extension: string;
  mimeTypes: string[];
  displayName: string;
  shortName: string;
  icon: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  group: 'document' | 'spreadsheet' | 'presentation' | 'text' | 'data' | 'image';
}

export interface ConversionDefinition {
  id: string; // e.g. 'pdf-to-docx'
  sourceFormat: DocumentFormat;
  targetFormat: DocumentFormat;
  displayName: string; // e.g. 'PDF to Word'
  description: string;
  categories: ConversionCategory[];
  available: boolean;
  comingSoonReason?: string;
  maxFileSizeMB: number;
}

export interface ConversionRecord {
  id: string;
  user_id: string;
  source_filename: string;
  source_format: DocumentFormat;
  target_format: DocumentFormat;
  source_file_size: number;
  output_filename: string;
  output_file_size: number;
  storage_path: string;
  status: 'processing' | 'completed' | 'failed';
  error_message?: string | null;
  created_at: string;
  download_url?: string;
}

export interface ConversionResponse {
  success: boolean;
  record?: ConversionRecord;
  downloadUrl?: string;
  error?: string;
}

export type ConversionStep =
  | 'idle'
  | 'validating'
  | 'uploading'
  | 'converting'
  | 'saving'
  | 'success'
  | 'error';
