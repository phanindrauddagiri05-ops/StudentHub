// ============================================================
// PDF Service — Images to PDF
// ============================================================

import { PDFDocument } from 'pdf-lib';
import { readFileAsArrayBuffer } from './utils';
import type { PdfOperationOutput } from './types';

/**
 * Create a PDF from an array of images.
 * Supports JPEG, PNG, and WEBP (WEBP is converted via canvas).
 * Each image occupies one full page, scaled to fit.
 */
export async function imagesToPdf(images: File[]): Promise<PdfOperationOutput> {
  if (images.length === 0) {
    throw new Error('Please provide at least one image.');
  }

  const pdf = await PDFDocument.create();

  for (const imageFile of images) {
    const buffer = await readFileAsArrayBuffer(imageFile);
    const mimeType = imageFile.type;

    let embeddedImage;

    if (mimeType === 'image/jpeg') {
      embeddedImage = await pdf.embedJpg(buffer);
    } else if (mimeType === 'image/png') {
      embeddedImage = await pdf.embedPng(buffer);
    } else if (mimeType === 'image/webp') {
      // Convert webp to PNG via canvas
      const dataUrl = await convertImageToJpegDataUrl(imageFile);
      const base64 = dataUrl.split(',')[1];
      const binaryStr = atob(base64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      embeddedImage = await pdf.embedJpg(bytes.buffer);
    } else {
      throw new Error(`Unsupported image format: ${mimeType}. Please use JPG, PNG, or WEBP.`);
    }

    const { width, height } = embeddedImage;
    const A4_WIDTH = 595;
    const A4_HEIGHT = 842;

    // Scale to fit A4 while maintaining aspect ratio
    const scale = Math.min(A4_WIDTH / width, A4_HEIGHT / height);
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;
    const x = (A4_WIDTH - scaledWidth) / 2;
    const y = (A4_HEIGHT - scaledHeight) / 2;

    const page = pdf.addPage([A4_WIDTH, A4_HEIGHT]);
    page.drawImage(embeddedImage, { x, y, width: scaledWidth, height: scaledHeight });
  }

  const data = await pdf.save();
  return {
    data,
    filename: 'images.pdf',
  };
}

/**
 * Convert any image file to JPEG data URL using canvas.
 */
function convertImageToJpegDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load image: ${file.name}`));
    };
    img.src = url;
  });
}
