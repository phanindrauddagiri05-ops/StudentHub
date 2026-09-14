// ============================================================
// StudentHub — Office Document Converter (DOC, DOCX, PPT, PPTX, XLS, XLSX -> PDF)
// Supports Microsoft Office COM automation on Windows,
// LibreOffice headless conversion on cross-platform/Linux deployments,
// and pure TypeScript fallbacks for Word & Excel.
// ============================================================

import { spawn, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';
import { convertXlsxToPdf } from './xlsx-to-pdf';
import { convertDocxToPdf as convertDocxToPdfFallback } from './docx-to-pdf';

export type OfficeType = 'word' | 'powerpoint' | 'excel';

export interface ConvertOfficeOptions {
  type: OfficeType;
  format: 'doc' | 'docx' | 'ppt' | 'pptx' | 'xls' | 'xlsx';
  inputBuffer: Buffer;
  timeoutMs?: number;
}

/**
 * Validate that a buffer is a valid, readable PDF document.
 */
export function isValidPdfBuffer(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 10) return false;
  // Standard PDF magic byte header: %PDF-
  const header = buffer.subarray(0, 5).toString('ascii');
  return header === '%PDF-';
}

/**
 * Detect whether an Office document buffer is password-protected or encrypted.
 */
export function isPasswordProtectedOfficeBuffer(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 512) return false;

  // Modern Office files (.docx, .pptx, .xlsx) when encrypted are wrapped in an OLE compound document
  // containing UTF-16LE 'EncryptedPackage' or 'EncryptionInfo' stream names.
  const isOleHeader =
    buffer[0] === 0xd0 &&
    buffer[1] === 0xcf &&
    buffer[2] === 0x11 &&
    buffer[3] === 0xe0 &&
    buffer[4] === 0xa1 &&
    buffer[5] === 0xb1 &&
    buffer[6] === 0x1a &&
    buffer[7] === 0xe1;

  if (isOleHeader) {
    const encPkgUtf16 = Buffer.from('EncryptedPackage', 'utf16le');
    const encInfoUtf16 = Buffer.from('EncryptionInfo', 'utf16le');
    if (buffer.includes(encPkgUtf16) || buffer.includes(encInfoUtf16)) {
      return true;
    }
  }

  return false;
}

/**
 * Automatically determine the effective extension based on true binary content.
 * Prevents "Word cannot open the file because the file format does not match the file extension"
 * if a user uploads a .doc file as .docx, or a .docx file as .doc.
 */
export function determineEffectiveExtension(
  declaredFormat: 'doc' | 'docx' | 'ppt' | 'pptx' | 'xls' | 'xlsx',
  buffer: Buffer
): 'doc' | 'docx' | 'ppt' | 'pptx' | 'xls' | 'xlsx' {
  if (!buffer || buffer.length < 4) return declaredFormat;

  const isZip =
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07);

  const isOle =
    buffer[0] === 0xd0 &&
    buffer[1] === 0xcf &&
    buffer[2] === 0x11 &&
    buffer[3] === 0xe0;

  // Word family
  if (declaredFormat === 'doc' || declaredFormat === 'docx') {
    return isZip ? 'docx' : 'doc';
  }

  // Excel family
  if (declaredFormat === 'xls' || declaredFormat === 'xlsx') {
    return isZip ? 'xlsx' : 'xls';
  }

  // PowerPoint family
  if (declaredFormat === 'ppt' || declaredFormat === 'pptx') {
    return isZip ? 'pptx' : 'ppt';
  }

  return declaredFormat;
}

/**
 * Find LibreOffice binary path if installed in common locations or in PATH.
 */
function getLibreOfficeExecutable(): string | null {
  const isWindows = process.platform === 'win32';
  const candidates: string[] = [];

  if (isWindows) {
    candidates.push(
      'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
      'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
      'soffice.exe',
      'soffice'
    );
  } else {
    candidates.push(
      '/usr/bin/soffice',
      '/usr/bin/libreoffice',
      '/usr/local/bin/soffice',
      'libreoffice',
      'soffice'
    );
  }

  for (const candidate of candidates) {
    if (path.isAbsolute(candidate) && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

/**
 * Convert using headless LibreOffice.
 */
async function convertViaLibreOffice(
  executable: string,
  inputPath: string,
  outputDir: string,
  timeoutMs: number
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const args = [
      '--headless',
      '--convert-to',
      'pdf',
      '--outdir',
      outputDir,
      inputPath,
    ];

    const child = spawn(executable, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stderr = '';
    const timer = setTimeout(() => {
      try { child.kill('SIGKILL'); } catch {}
      reject(new Error('LibreOffice conversion timed out.'));
    }, timeoutMs);

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', async (code) => {
      clearTimeout(timer);
      const inputBaseName = path.basename(inputPath, path.extname(inputPath));
      const expectedPdfPath = path.join(outputDir, `${inputBaseName}.pdf`);

      if (code === 0 && fs.existsSync(expectedPdfPath)) {
        try {
          const pdfBytes = await fs.promises.readFile(expectedPdfPath);
          await fs.promises.unlink(expectedPdfPath).catch(() => {});
          resolve(pdfBytes);
        } catch (readErr) {
          reject(readErr);
        }
      } else {
        const lowerErr = stderr.toLowerCase();
        if (
          lowerErr.includes('password') ||
          lowerErr.includes('protected') ||
          lowerErr.includes('encrypted')
        ) {
          reject(new Error('This document is password protected and cannot be converted.'));
        } else {
          reject(new Error(`LibreOffice conversion failed (code ${code}): ${stderr}`));
        }
      }
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

/**
 * Convert using Windows PowerShell COM automation (MS Office Word, PowerPoint, Excel).
 */
async function convertViaWindowsOfficeCOM(
  type: OfficeType,
  inputPath: string,
  outputPath: string,
  timeoutMs: number
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(
      process.cwd(),
      'src/lib/converters/server/scripts/office-converter.ps1'
    );

    const args = [
      '-NoProfile',
      '-NonInteractive',
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      scriptPath,
      '-Type',
      type,
      '-InputPath',
      inputPath,
      '-OutputPath',
      outputPath,
    ];

    const child = spawn('powershell.exe', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      try {
        if (child.pid) {
          execSync(`taskkill /F /T /PID ${child.pid}`, { stdio: 'ignore' });
        }
      } catch {}
      reject(new Error('Office conversion timed out.'));
    }, timeoutMs);

    child.stdout.on('data', (d) => {
      stdout += d.toString();
    });

    child.stderr.on('data', (d) => {
      stderr += d.toString();
    });

    child.on('close', async (code) => {
      clearTimeout(timer);

      const allOutput = `${stdout} ${stderr}`.toLowerCase();
      if (
        code === 2 ||
        allOutput.includes('password_protected') ||
        allOutput.includes('password') ||
        allOutput.includes('protected') ||
        allOutput.includes('encrypted')
      ) {
        reject(new Error('This document is password protected and cannot be converted.'));
        return;
      }

      if (code === 0 && fs.existsSync(outputPath)) {
        try {
          const buffer = await fs.promises.readFile(outputPath);
          resolve(buffer);
        } catch (e) {
          reject(e);
        }
      } else {
        reject(
          new Error(
            `Office automation exited with code ${code}. ${stderr.trim() || 'No output generated.'}`
          )
        );
      }
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

/**
 * Universal Office to PDF converter.
 */
export async function convertOfficeToPdf({
  type,
  format,
  inputBuffer,
  timeoutMs = 45000,
}: ConvertOfficeOptions): Promise<Buffer> {
  if (!inputBuffer || inputBuffer.length === 0) {
    throw new Error('Unable to convert this file. The document is empty.');
  }

  // Pre-flight check: detect password-protected / encrypted documents
  if (isPasswordProtectedOfficeBuffer(inputBuffer)) {
    throw new Error('This document is password protected and cannot be converted.');
  }

  // Determine the effective extension based on true binary content
  const effectiveFormat = determineEffectiveExtension(format, inputBuffer);

  // Create isolated temp files with sanitized random names and accurate extension
  const uniqueId = crypto.randomUUID();
  const tmpDir = os.tmpdir();
  const inputFilePath = path.join(tmpDir, `sh_in_${uniqueId}.${effectiveFormat}`);
  const outputFilePath = path.join(tmpDir, `sh_out_${uniqueId}.pdf`);

  try {
    await fs.promises.writeFile(inputFilePath, inputBuffer);

    let pdfBuffer: Buffer | null = null;
    let lastError: Error | null = null;

    // Strategy 1: On Windows, use Microsoft Office COM automation if available
    if (process.platform === 'win32') {
      try {
        pdfBuffer = await convertViaWindowsOfficeCOM(
          type,
          inputFilePath,
          outputFilePath,
          timeoutMs
        );
      } catch (comErr) {
        lastError = comErr instanceof Error ? comErr : new Error(String(comErr));
        if (lastError.message.includes('password protected')) {
          throw lastError;
        }
        console.warn('Windows Office COM conversion attempt failed:', lastError.message);
      }
    }

    // Strategy 2: If COM failed or on Linux, attempt LibreOffice headless
    if (!pdfBuffer) {
      const libreOfficeExe = getLibreOfficeExecutable();
      if (libreOfficeExe) {
        try {
          pdfBuffer = await convertViaLibreOffice(
            libreOfficeExe,
            inputFilePath,
            tmpDir,
            timeoutMs
          );
        } catch (loErr) {
          lastError = loErr instanceof Error ? loErr : new Error(String(loErr));
          if (lastError.message.includes('password protected')) {
            throw lastError;
          }
          console.warn('LibreOffice conversion attempt failed:', lastError.message);
        }
      }
    }

    // Strategy 3: Pure TypeScript fallbacks
    if (!pdfBuffer) {
      if (type === 'excel') {
        try {
          pdfBuffer = await convertXlsxToPdf(inputBuffer);
        } catch (xlsxErr) {
          lastError = xlsxErr instanceof Error ? xlsxErr : new Error(String(xlsxErr));
          console.warn('Pure TypeScript spreadsheet fallback failed:', lastError.message);
        }
      } else if (type === 'word') {
        try {
          pdfBuffer = await convertDocxToPdfFallback(inputBuffer);
        } catch (docxErr) {
          lastError = docxErr instanceof Error ? docxErr : new Error(String(docxErr));
          console.warn('Pure TypeScript DOCX fallback failed:', lastError.message);
        }
      }
    }

    // Output validation
    if (!pdfBuffer || !isValidPdfBuffer(pdfBuffer)) {
      if (lastError) {
        if (lastError.message.includes('password protected')) {
          throw lastError;
        }
        const lower = lastError.message.toLowerCase();
        if (
          lower.includes('corrupt') ||
          lower.includes('cannot open') ||
          lower.includes('unsupported') ||
          lower.includes('damaged')
        ) {
          throw new Error(`Unable to convert document: ${lastError.message}`);
        }
      }
      throw new Error(
        'Unable to convert this document. Please check the file and try again.'
      );
    }

    return pdfBuffer;
  } finally {
    // Guaranteed cleanup of temporary files
    await fs.promises.unlink(inputFilePath).catch(() => {});
    await fs.promises.unlink(outputFilePath).catch(() => {});
  }
}
