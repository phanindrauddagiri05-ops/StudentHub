// ============================================================
// StudentHub — Server Conversion Dispatcher
// Executes genuine server-side document conversions.
// ============================================================

import { DocumentFormat } from '../types';
import { getConversion } from '../registry';
import { convertTxtToPdf } from './txt-to-pdf';
import { convertTxtToDocx } from './txt-to-docx';
import { convertPdfToTxt } from './pdf-to-txt';
import { convertPdfToDocx } from './pdf-to-docx';
import { convertDocxToTxt } from './docx-to-txt';
import { convertDocxToPdf } from './docx-to-pdf';
import { convertXlsxToCsv } from './xlsx-to-csv';
import { convertCsvToXlsx } from './csv-to-xlsx';
import { convertXlsxToPdf } from './xlsx-to-pdf';
import { convertCsvToPdf } from './csv-to-pdf';
import { convertCsvToTxt } from './csv-to-txt';
import { convertOfficeToPdf } from './office-to-pdf';
import { convertImage } from './image-converter';
import { isImageFormat } from '../registry';
import { ImageConversionOptions } from '../types';

export interface ExecuteConversionParams {
  sourceFormat: DocumentFormat;
  targetFormat: DocumentFormat;
  inputBuffer: Buffer;
  sourceFilename: string;
  options?: ImageConversionOptions;
}

export interface ExecuteConversionResult {
  outputBuffer: Buffer;
  outputFilename: string;
  outputMimeType: string;
}

export async function executeServerConversion({
  sourceFormat,
  targetFormat,
  inputBuffer,
  sourceFilename,
  options,
}: ExecuteConversionParams): Promise<ExecuteConversionResult> {
  const definition = getConversion(sourceFormat, targetFormat);

  if (!definition) {
    throw new Error(`Conversion from ${sourceFormat.toUpperCase()} to ${targetFormat.toUpperCase()} is not recognized.`);
  }

  if (!definition.available) {
    throw new Error(
      definition.comingSoonReason ||
        `Conversion from ${sourceFormat.toUpperCase()} to ${targetFormat.toUpperCase()} is coming soon.`
    );
  }

  // Preserve original base filename: report.pdf -> report.docx
  const baseName = sourceFilename.replace(/\.[^/.]+$/, '') || 'converted_document';
  const cleanBaseName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');

  // Handle Phase 4 Image Conversions
  if (isImageFormat(sourceFormat) && isImageFormat(targetFormat)) {
    const imgResult = await convertImage({
      sourceFormat,
      targetFormat,
      inputBuffer,
      options,
    });

    return {
      outputBuffer: imgResult.outputBuffer,
      outputFilename: `${cleanBaseName}${imgResult.outputExtension}`,
      outputMimeType: imgResult.outputMimeType,
    };
  }

  let outputBuffer: Buffer;
  let outputMimeType = 'application/octet-stream';

  const pairKey = `${sourceFormat}->${targetFormat}`;

  switch (pairKey) {
    case 'pdf->docx':
      outputBuffer = await convertPdfToDocx(inputBuffer);
      outputMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      break;

    case 'pdf->txt':
      outputBuffer = await convertPdfToTxt(inputBuffer);
      outputMimeType = 'text/plain';
      break;

    case 'docx->pdf':
      outputBuffer = await convertOfficeToPdf({
        type: 'word',
        format: 'docx',
        inputBuffer,
      });
      outputMimeType = 'application/pdf';
      break;

    case 'doc->pdf':
      outputBuffer = await convertOfficeToPdf({
        type: 'word',
        format: 'doc',
        inputBuffer,
      });
      outputMimeType = 'application/pdf';
      break;

    case 'docx->txt':
      outputBuffer = await convertDocxToTxt(inputBuffer);
      outputMimeType = 'text/plain';
      break;

    case 'xlsx->csv':
      outputBuffer = await convertXlsxToCsv(inputBuffer);
      outputMimeType = 'text/csv';
      break;

    case 'csv->xlsx':
      outputBuffer = await convertCsvToXlsx(inputBuffer);
      outputMimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      break;

    case 'xlsx->pdf':
      outputBuffer = await convertOfficeToPdf({
        type: 'excel',
        format: 'xlsx',
        inputBuffer,
      });
      outputMimeType = 'application/pdf';
      break;

    case 'xls->pdf':
      outputBuffer = await convertOfficeToPdf({
        type: 'excel',
        format: 'xls',
        inputBuffer,
      });
      outputMimeType = 'application/pdf';
      break;

    case 'pptx->pdf':
      outputBuffer = await convertOfficeToPdf({
        type: 'powerpoint',
        format: 'pptx',
        inputBuffer,
      });
      outputMimeType = 'application/pdf';
      break;

    case 'ppt->pdf':
      outputBuffer = await convertOfficeToPdf({
        type: 'powerpoint',
        format: 'ppt',
        inputBuffer,
      });
      outputMimeType = 'application/pdf';
      break;

    case 'csv->pdf':
      outputBuffer = await convertCsvToPdf(inputBuffer);
      outputMimeType = 'application/pdf';
      break;

    case 'csv->txt':
      outputBuffer = await convertCsvToTxt(inputBuffer);
      outputMimeType = 'text/plain';
      break;

    case 'txt->pdf':
      outputBuffer = await convertTxtToPdf(inputBuffer);
      outputMimeType = 'application/pdf';
      break;

    case 'txt->docx':
      outputBuffer = await convertTxtToDocx(inputBuffer);
      outputMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      break;

    default:
      throw new Error(`Unsupported conversion pair: ${pairKey}`);
  }

  const outputFilename = `${cleanBaseName}.${targetFormat}`;

  return {
    outputBuffer,
    outputFilename,
    outputMimeType,
  };
}
