// ============================================================
// PDF Service — Shared Types
// ============================================================

export interface PdfMergeOptions {
  files: File[];
}

export interface PdfSplitOptions {
  file: File;
  pages: number[]; // 0-indexed page numbers
}

export interface PdfReorderOptions {
  file: File;
  order: number[]; // new order as 0-indexed page indices
}

export interface PdfImagesToPdfOptions {
  images: File[];
}

export interface PdfToImagesOptions {
  file: File;
  pages?: number[]; // 0-indexed; undefined = all pages
  scale?: number; // default 1.5
}

export interface PdfCompressOptions {
  file: File;
}

export interface PdfCompressResult {
  data: Uint8Array;
  filename: string;
  originalSize: number;
  newSize: number;
  reduction: number; // percentage 0-100
  wasReduced: boolean;
}

export interface PdfOperationOutput {
  data: Uint8Array;
  filename: string;
}

export interface PdfImageOutput {
  dataUrls: string[];
  pageCount: number;
}

export interface PdfValidationResult {
  valid: boolean;
  error?: string;
}
