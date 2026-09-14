import { NextRequest, NextResponse } from 'next/server';
import { executeServerConversion } from '@/lib/converters/server';
import { getConversion, getCompatibleTargets } from '@/lib/converters/registry';
import { DocumentFormat } from '@/lib/converters/types';
import { detectFormatFromFilename } from '@/lib/converters/formats';
import { MAX_DOCUMENT_CONVERSION_FILE_SIZE_BYTES } from '@/lib/constants';
import { getSupabaseClient } from '@/lib/supabase/client';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    let sourceFormat = formData.get('sourceFormat') as DocumentFormat | null;
    const targetFormat = formData.get('targetFormat') as DocumentFormat | null;
    const userId = (formData.get('userId') as string) || 'anonymous';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No document file provided.' }, { status: 400 });
    }

    if (!sourceFormat || !targetFormat) {
      return NextResponse.json(
        { success: false, error: 'Source and target formats are required.' },
        { status: 400 }
      );
    }

    // Convert file to buffer early so we can check size and binary signature
    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    // 1. Inspect filename to auto-detect if the user selected a compatible format
    if (file.name) {
      const detected = detectFormatFromFilename(file.name);
      if (detected && detected !== sourceFormat) {
        const compatible = getCompatibleTargets(detected);
        if (compatible.includes(targetFormat)) {
          sourceFormat = detected;
        }
      }
    }

    // 2. Inspect binary magic bytes to auto-correct mismatched extensions
    if (inputBuffer.length >= 4) {
      const isZip =
        inputBuffer[0] === 0x50 &&
        inputBuffer[1] === 0x4b &&
        (inputBuffer[2] === 0x03 || inputBuffer[2] === 0x05 || inputBuffer[2] === 0x07);

      if (sourceFormat === 'docx' || sourceFormat === 'doc') {
        sourceFormat = isZip ? 'docx' : 'doc';
      } else if (sourceFormat === 'xlsx' || sourceFormat === 'xls') {
        sourceFormat = isZip ? 'xlsx' : 'xls';
      } else if (sourceFormat === 'pptx' || sourceFormat === 'ppt') {
        sourceFormat = isZip ? 'pptx' : 'ppt';
      }
    }

    // Check file size
    if (file.size > MAX_DOCUMENT_CONVERSION_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: `File size exceeds the 25 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`,
        },
        { status: 400 }
      );
    }

    // Validate conversion availability
    const definition = getConversion(sourceFormat, targetFormat);
    if (!definition) {
      return NextResponse.json(
        {
          success: false,
          error: `Conversion from ${sourceFormat.toUpperCase()} to ${targetFormat.toUpperCase()} is not recognized.`,
        },
        { status: 400 }
      );
    }

    if (!definition.available) {
      return NextResponse.json(
        {
          success: false,
          error:
            definition.comingSoonReason ||
            `Conversion from ${sourceFormat.toUpperCase()} to ${targetFormat.toUpperCase()} is currently Coming Soon.`,
        },
        { status: 400 }
      );
    }

    // Execute server-side conversion
    const { outputBuffer, outputFilename, outputMimeType } = await executeServerConversion({
      sourceFormat,
      targetFormat,
      inputBuffer,
      sourceFilename: file.name,
    });

    const timestamp = Date.now();
    const conversionId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `conv_${timestamp}`;
    const storagePath = `users/${userId}/conversions/${timestamp}_${outputFilename}`;

    let downloadUrl: string | undefined;
    const supabase = getSupabaseClient();

    if (supabase && userId !== 'anonymous') {
      try {
        // Upload converted file to private storage
        const { error: uploadError } = await supabase.storage
          .from('studenthub-files')
          .upload(storagePath, outputBuffer, {
            contentType: outputMimeType,
            upsert: false,
          });

        if (!uploadError) {
          // Generate signed URL for 2 hours
          const { data: signData } = await supabase.storage
            .from('studenthub-files')
            .createSignedUrl(storagePath, 60 * 120, { download: outputFilename });

          if (signData?.signedUrl) {
            downloadUrl = signData.signedUrl;
          }

          // Insert into document_conversions table
          await supabase.from('document_conversions').insert({
            id: conversionId,
            user_id: userId,
            source_filename: file.name,
            source_format: sourceFormat,
            target_format: targetFormat,
            source_file_size: file.size,
            output_filename: outputFilename,
            output_file_size: outputBuffer.length,
            storage_path: storagePath,
            status: 'completed',
          });

          // Log activity
          await supabase.from('activity_logs').insert({
            user_id: userId,
            action: `document_conversion`,
            resource_type: 'document',
            metadata: {
              source_filename: file.name,
              source_format: sourceFormat,
              target_format: targetFormat,
              output_filename: outputFilename,
            },
          });
        }
      } catch (storageErr) {
        console.warn('Supabase storage save warning, falling back to data URL:', storageErr);
      }
    }

    // Fallback or immediate direct download URL if signedUrl wasn't generated
    if (!downloadUrl) {
      const base64 = outputBuffer.toString('base64');
      downloadUrl = `data:${outputMimeType};base64,${base64}`;
    }

    return NextResponse.json({
      success: true,
      record: {
        id: conversionId,
        user_id: userId,
        source_filename: file.name,
        source_format: sourceFormat,
        target_format: targetFormat,
        source_file_size: file.size,
        output_filename: outputFilename,
        output_file_size: outputBuffer.length,
        storage_path: storagePath,
        status: 'completed',
        created_at: new Date().toISOString(),
        download_url: downloadUrl,
      },
      downloadUrl,
    });
  } catch (error: unknown) {
    console.error('Server conversion error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred during document conversion.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
