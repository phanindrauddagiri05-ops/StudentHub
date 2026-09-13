// ============================================================
// PDF Service — Utilities
// ============================================================

import { ACCEPTED_PDF_TYPES, ACCEPTED_IMAGE_TYPES, MAX_PDF_SIZE_BYTES, MAX_IMAGE_SIZE_BYTES } from '@/lib/constants';
import type { PdfValidationResult } from './types';

/**
 * Trigger a file download in the browser.
 */
export function downloadBlob(data: Uint8Array | Blob, filename: string, mimeType = 'application/pdf'): void {
  const blob = data instanceof Blob ? data : new Blob([data as BlobPart], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Format bytes to a human-readable string.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Read a File as an ArrayBuffer.
 */
export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Read a File as a data URL.
 */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Validate a PDF file: MIME type and size.
 */
export function validatePdfFile(file: File): PdfValidationResult {
  if (!ACCEPTED_PDF_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "This file doesn't appear to be a valid PDF. Please choose another file.",
    };
  }
  if (file.size > MAX_PDF_SIZE_BYTES) {
    return {
      valid: false,
      error: `This file is larger than the ${Math.round(MAX_PDF_SIZE_BYTES / 1024 / 1024)} MB size limit.`,
    };
  }
  return { valid: true };
}

/**
 * Validate an image file: MIME type and size.
 */
export function validateImageFile(file: File): PdfValidationResult {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'This file format is not supported. Please use JPG, PNG, or WEBP images.',
    };
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: `This image is larger than the ${Math.round(MAX_IMAGE_SIZE_BYTES / 1024 / 1024)} MB size limit.`,
    };
  }
  return { valid: true };
}

/**
 * Generate a unique ID for files.
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Strip extension from filename.
 */
export function stripExtension(filename: string): string {
  return filename.replace(/\.[^.]+$/, '');
}

/**
 * Parse a page range string like "1,3,5-7" into 0-indexed page numbers.
 * Input is 1-indexed, output is 0-indexed.
 */
export function parsePageRange(input: string, totalPages: number): number[] {
  const pages = new Set<number>();
  const parts = input.split(',').map((s) => s.trim());
  for (const part of parts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(Number);
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) {
          if (i >= 1 && i <= totalPages) pages.add(i - 1);
        }
      }
    } else {
      const n = Number(part);
      if (!isNaN(n) && n >= 1 && n <= totalPages) pages.add(n - 1);
    }
  }
  return Array.from(pages).sort((a, b) => a - b);
}
