// ============================================================
// StudentHub — Shared Types
// ============================================================

export type ToolStatus = 'available' | 'coming-soon';
export type ToolCategory = 'study' | 'documents' | 'academic' | 'planning' | 'career';

export interface Tool {
  id: string;
  name: string;
  slug: string;
  description: string;
  longDescription?: string;
  icon: string;
  category: ToolCategory;
  status: ToolStatus;
  path: string;
  color?: string;
}

export interface PdfFile {
  id: string;
  file: File;
  name: string;
  size: number;
  pageCount?: number;
  thumbnail?: string;
}

export interface PdfPage {
  index: number;
  thumbnail: string;
  selected?: boolean;
}

export type PdfOperationState = 'idle' | 'uploading' | 'processing' | 'success' | 'error';

export interface PdfOperationResult {
  data: Uint8Array;
  filename: string;
  mimeType: string;
}

export interface PdfCompressResult {
  data: Uint8Array;
  filename: string;
  originalSize: number;
  newSize: number;
  reduction: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  description?: string;
  duration?: number;
}

export interface NavItem {
  label: string;
  href: string;
  external?: boolean;
}

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type BadgeVariant = 'available' | 'coming-soon' | 'new' | 'default';

export * from './database';

