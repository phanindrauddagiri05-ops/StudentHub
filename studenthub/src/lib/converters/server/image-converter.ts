// ============================================================
// StudentHub — Server-Side Image Conversion Engine (Phase 4)
// High-performance image processing using Sharp, heic-convert,
// and bmp-js with strict dimension and security guardrails.
// ============================================================

import sharp, { Sharp } from 'sharp';
import bmp from 'bmp-js';
import heicConvert from 'heic-convert';
import { DocumentFormat, ImageConversionOptions } from '../types';
import { MAX_IMAGE_DIMENSION_PIXELS } from '@/lib/constants';

export interface ConvertImageParams {
  sourceFormat: DocumentFormat;
  targetFormat: DocumentFormat;
  inputBuffer: Buffer;
  options?: ImageConversionOptions;
}

export interface ConvertImageResult {
  outputBuffer: Buffer;
  outputMimeType: string;
  outputExtension: string;
}

/**
 * Validates and sanitizes SVG input to prevent script injection or XXE attacks.
 */
function sanitizeSvg(buffer: Buffer): Buffer {
  const content = buffer.toString('utf8');

  // Strict check for malicious executable constructs in SVG
  const dangerousPatterns = [
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    /javascript:/gi,
    /onload\s*=/gi,
    /onerror\s*=/gi,
    /onclick\s*=/gi,
    /<!ENTITY/gi,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(content)) {
      throw new Error(
        'The uploaded SVG contains prohibited active script elements or entities and cannot be converted.'
      );
    }
  }

  // Ensure it has basic SVG structure
  if (!content.includes('<svg') || !content.includes('</svg>')) {
    throw new Error('Invalid SVG format: Missing required root SVG tags.');
  }

  return buffer;
}

/**
 * Detects format from magic bytes to prevent mismatched extensions.
 */
export function detectImageMagicBytes(buffer: Buffer): DocumentFormat | null {
  if (buffer.length < 4) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpg';
  }

  // PNG: 89 50 4E 47
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'png';
  }

  // GIF: GIF87a or GIF89a
  if (
    buffer.length >= 6 &&
    buffer.toString('ascii', 0, 3) === 'GIF'
  ) {
    return 'gif';
  }

  // BMP: 42 4D (BM)
  if (buffer[0] === 0x42 && buffer[1] === 0x4d) {
    return 'bmp';
  }

  // TIFF: 49 49 2A 00 (little endian) or 4D 4D 00 2A (big endian)
  if (
    (buffer[0] === 0x49 && buffer[1] === 0x49 && buffer[2] === 0x2a && buffer[3] === 0x00) ||
    (buffer[0] === 0x4d && buffer[1] === 0x4d && buffer[2] === 0x00 && buffer[3] === 0x2a)
  ) {
    return 'tiff';
  }

  // WEBP: RIFF....WEBP
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'webp';
  }

  // HEIC / HEIF: check ftyp box
  if (buffer.length >= 12 && buffer.toString('ascii', 4, 8) === 'ftyp') {
    const brand = buffer.toString('ascii', 8, 12);
    if (['heic', 'heix', 'hevc', 'heim', 'heis'].includes(brand)) {
      return 'heic';
    }
    if (['mif1', 'msf1', 'heif'].includes(brand)) {
      return 'heif';
    }
  }

  // SVG: starts with <svg or <?xml ... <svg
  const head = buffer.slice(0, 500).toString('utf8').trim();
  if (head.startsWith('<svg') || (head.startsWith('<?xml') && head.includes('<svg'))) {
    return 'svg';
  }

  return null;
}

/**
 * Executes a genuine server-side image conversion.
 */
export async function convertImage({
  sourceFormat,
  targetFormat,
  inputBuffer,
  options = {},
}: ConvertImageParams): Promise<ConvertImageResult> {
  if (!inputBuffer || inputBuffer.length === 0) {
    throw new Error('Image input buffer is empty.');
  }

  let effectiveSource = sourceFormat;
  const magicDetected = detectImageMagicBytes(inputBuffer);
  if (magicDetected && magicDetected !== sourceFormat) {
    // If user uploaded a valid image of another format, adapt safely
    effectiveSource = magicDetected;
  }

  let workingBuffer = inputBuffer;
  let rawBmpDecoded: { data: Buffer; width: number; height: number } | null = null;

  // 1. Format-specific pre-processing
  if (effectiveSource === 'svg') {
    workingBuffer = sanitizeSvg(inputBuffer);
  } else if (effectiveSource === 'bmp') {
    try {
      const decoded = bmp.decode(inputBuffer);
      rawBmpDecoded = {
        data: decoded.data,
        width: decoded.width,
        height: decoded.height,
      };
    } catch {
      throw new Error('Failed to decode BMP image file. File may be corrupted.');
    }
  } else if (effectiveSource === 'heic' || effectiveSource === 'heif') {
    // Try Sharp first, fallback to heic-convert if needed
    try {
      await sharp(inputBuffer).metadata();
    } catch {
      try {
        const converted = await heicConvert({
          buffer: inputBuffer,
          format: 'PNG',
        });
        workingBuffer = Buffer.from(converted);
        effectiveSource = 'png';
      } catch (heicErr: unknown) {
        const msg = heicErr instanceof Error ? heicErr.message : 'Unknown HEIC error';
        throw new Error(`Failed to decode HEIC/HEIF photo: ${msg}`);
      }
    }
  }

  // 2. Initialize Sharp pipeline
  let pipeline: Sharp;
  if (rawBmpDecoded) {
    pipeline = sharp(rawBmpDecoded.data, {
      raw: {
        width: rawBmpDecoded.width,
        height: rawBmpDecoded.height,
        channels: 4,
      },
    });
  } else if (effectiveSource === 'svg') {
    pipeline = sharp(workingBuffer, { density: 300 });
  } else if (effectiveSource === 'gif') {
    // Extract first frame cleanly for static conversions
    pipeline = sharp(workingBuffer, { page: 0 });
  } else {
    pipeline = sharp(workingBuffer);
  }

  // 3. Dimension and Decompression Bomb Protection
  const metadata = await pipeline.metadata();
  const width = metadata.width || (rawBmpDecoded ? rawBmpDecoded.width : 0);
  const height = metadata.height || (rawBmpDecoded ? rawBmpDecoded.height : 0);

  if (width > MAX_IMAGE_DIMENSION_PIXELS || height > MAX_IMAGE_DIMENSION_PIXELS) {
    throw new Error(
      `Image dimensions (${width}x${height}) exceed the maximum allowable size of ${MAX_IMAGE_DIMENSION_PIXELS}x${MAX_IMAGE_DIMENSION_PIXELS} pixels.`
    );
  }

  // 4. Orientation & Sensitive Metadata Stripping
  // Rotate automatically based on EXIF, but strip sensitive GPS/camera serials
  pipeline = pipeline.rotate();

  // 5. Transparency Handling
  // When converting transparent formats (PNG, WEBP, SVG) to JPG, blend onto clean white
  const bgColor = options.backgroundColor || '#FFFFFF';
  if (targetFormat === 'jpg') {
    pipeline = pipeline.flatten({ background: bgColor });
  }

  // 6. Target Format Output Encoding
  let outputBuffer: Buffer;
  let outputMimeType: string;
  let outputExtension: string;
  const quality = Math.min(100, Math.max(1, options.quality ?? 80));

  switch (targetFormat) {
    case 'jpg':
      outputBuffer = await pipeline
        .jpeg({
          quality,
          mozjpeg: true,
        })
        .toBuffer();
      outputMimeType = 'image/jpeg';
      outputExtension = '.jpg';
      break;

    case 'png':
      outputBuffer = await pipeline
        .png({
          compressionLevel: 8,
          adaptiveFiltering: true,
        })
        .toBuffer();
      outputMimeType = 'image/png';
      outputExtension = '.png';
      break;

    case 'webp':
      outputBuffer = await pipeline
        .webp({
          quality,
          effort: 4,
        })
        .toBuffer();
      outputMimeType = 'image/webp';
      outputExtension = '.webp';
      break;

    case 'tiff':
      outputBuffer = await pipeline
        .tiff({
          quality,
          compression: 'deflate',
        })
        .toBuffer();
      outputMimeType = 'image/tiff';
      outputExtension = '.tiff';
      break;

    case 'gif':
      outputBuffer = await pipeline.gif().toBuffer();
      outputMimeType = 'image/gif';
      outputExtension = '.gif';
      break;

    case 'bmp': {
      // Export raw RGBA from Sharp, then encode with bmp-js
      const { data: rawData, info } = await pipeline
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const bmpData = {
        data: rawData,
        width: info.width,
        height: info.height,
      };
      const encodedBmp = bmp.encode(bmpData);
      outputBuffer = encodedBmp.data;
      outputMimeType = 'image/bmp';
      outputExtension = '.bmp';
      break;
    }

    default:
      throw new Error(`Unsupported target image format: ${targetFormat}`);
  }

  return {
    outputBuffer,
    outputMimeType,
    outputExtension,
  };
}
