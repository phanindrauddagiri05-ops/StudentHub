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

export interface DashboardStats {
  pdfFilesCount: number;
  resumesCount: number;
  activitiesCount: number;
  availableToolsCount: number;
  comingSoonToolsCount: number;
}

export * from '@/lib/resume/types';

