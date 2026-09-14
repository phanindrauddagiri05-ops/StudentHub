// ============================================================
// StudentHub — Phase 2 Database & Auth Types
// ============================================================

export type PdfOperationType =
  | 'merge'
  | 'split'
  | 'compress'
  | 'pdf_to_images'
  | 'images_to_pdf'
  | 'reorder';

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url?: string;
  college?: string;
  course?: string;
  department?: string;
  year?: string;
  semester?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserFile {
  id: string;
  user_id: string;
  original_name: string;
  storage_path: string;
  mime_type: string;
  file_size: number;
  operation: PdfOperationType;
  status: 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at?: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface DocumentConversionRecord {
  id: string;
  user_id: string;
  source_filename: string;
  source_format: string;
  target_format: string;
  source_file_size: number;
  output_filename: string;
  output_file_size: number;
  storage_path: string;
  status: 'processing' | 'completed' | 'failed';
  error_message?: string;
  created_at: string;
}

export type HistoryToolType = 'pdf' | 'document_converter' | 'image_converter' | 'pdf_summary';

export interface PdfSummaryData {
  overview: string;
  keyPoints: string[];
  importantDetails: string[];
  conclusions: string;
  rawText?: string;
  pageCount?: number;
  wordCount?: number;
}

export interface UnifiedHistoryItem {
  id: string;
  userId: string;
  toolType: HistoryToolType;
  sourceFilename: string;
  outputFilename: string;
  displayFilename: string;
  sourceFormat?: string;
  targetFormat?: string;
  operation: string;
  operationLabel: string;
  fileSize: number;
  status: 'completed' | 'failed' | 'processing';
  errorMessage?: string;
  storagePath: string;
  createdAt: string;
  downloadUrl?: string;
  summaryData?: PdfSummaryData;
}

export interface DashboardStats {
  pdfFilesCount: number;
  documentsConvertedCount: number;
  imagesConvertedCount?: number;
  pdfSummariesCount?: number;
  resumesCount?: number;
  activitiesCount: number;
  availableToolsCount: number;
  comingSoonToolsCount: number;
}

export * from '@/lib/resume/types';

