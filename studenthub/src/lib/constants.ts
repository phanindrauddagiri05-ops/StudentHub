// ============================================================
// StudentHub — App Constants
// ============================================================

export const APP_NAME = 'StudentHub';
export const APP_TAGLINE = 'Everything You Need for Student Life, in One Place.';
export const APP_SUBTAGLINE = 'Study smarter. Stay organized. Build your future.';
export const APP_URL = 'https://studenthub.app';
export const APP_DESCRIPTION =
  'StudentHub is an all-in-one productivity platform designed around the everyday needs of students.';
export const APP_COPYRIGHT = `© ${new Date().getFullYear()} StudentHub. All rights reserved.`;

// File limits
export const MAX_PDF_SIZE_MB = 50;
export const MAX_IMAGE_SIZE_MB = 20;
export const MAX_DOCUMENT_CONVERSION_FILE_SIZE_MB = 25;
export const MAX_PDF_SIZE_BYTES = MAX_PDF_SIZE_MB * 1024 * 1024;
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
export const MAX_DOCUMENT_CONVERSION_FILE_SIZE_BYTES =
  MAX_DOCUMENT_CONVERSION_FILE_SIZE_MB * 1024 * 1024;
export const MAX_PDF_FILES = 20;

// Accepted MIME types
export const ACCEPTED_PDF_TYPES = ['application/pdf'];
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ACCEPTED_PDF_EXTENSIONS = '.pdf';
export const ACCEPTED_IMAGE_EXTENSIONS = '.jpg,.jpeg,.png,.webp';

// PDF worker (pdfjs-dist)
export const PDF_WORKER_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

// Routes
export const ROUTES = {
  home: '/',
  tools: '/tools',
  pdfTools: '/tools/pdf',
  pdfMerge: '/tools/pdf/merge',
  pdfSplit: '/tools/pdf/split',
  pdfImagesToP: '/tools/pdf/images-to-pdf',
  pdfToImages: '/tools/pdf/pdf-to-images',
  pdfReorder: '/tools/pdf/reorder',
  pdfCompress: '/tools/pdf/compress',
  documentConverters: '/tools/document-converters',
  resume: '/tools/resume',
  login: '/login',
  signup: '/signup',
  dashboard: '/dashboard',
  profile: '/profile',
  settings: '/settings',
  history: '/history',
  resumeHistory: '/history/resumes',
} as const;
