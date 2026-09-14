'use client';

import { useState } from 'react';
import ToolPageHeader from '@/components/tools/ToolPageHeader';
import PdfUploader from '@/components/pdf/PdfUploader';
import { PdfProcessingState, PdfSuccessState, PdfErrorState } from '@/components/pdf/PdfStates';
import Button from '@/components/ui/Button';
import { imagesToPdf, downloadBlob } from '@/lib/pdf';
import { useAuth } from '@/hooks/useAuth';
import { saveProcessedFile } from '@/lib/storage/file-service';
import type { PdfFile, PdfOperationState } from '@/types';
import styles from '../pdf-tool.module.css';

export default function ImagesToPdfPage() {
  const { user } = useAuth();
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [state, setState] = useState<PdfOperationState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ data: Uint8Array; size: number } | null>(null);

  const handleCreate = async () => {
    if (files.length === 0) return;
    setState('processing');
    setError(null);
    try {
      const output = await imagesToPdf(files.map((f) => f.file));
      setResult({ data: output.data, size: output.data.byteLength });

      const activeUserId = user?.id || 'guest';
      try {
        await saveProcessedFile({
          userId: activeUserId,
          data: output.data,
          filename: 'images.pdf',
          operation: 'images_to_pdf',
          mimeType: 'application/pdf',
        });
      } catch (saveErr) {
        console.error('Could not save to history:', saveErr);
      }

      setState('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create PDF. Please try again.');
      setState('error');
    }
  };


  const handleReset = () => {
    setFiles([]);
    setState('idle');
    setError(null);
    setResult(null);
  };

  return (
    <>
      <ToolPageHeader
        breadcrumbs={[
          { label: 'Tools', href: '/tools' },
          { label: 'PDF Tools', href: '/tools/pdf' },
          { label: 'Images → PDF' },
        ]}
        title="Images → PDF"
        description="Create a PDF document from multiple images."
        icon="🖼️"
      />
      <div className={styles.page}>
        <div className="container">
          <div className={styles.workspace}>
            {state === 'idle' && (
              <>
                <PdfUploader
                  files={files}
                  onFilesChange={setFiles}
                  accept="image"
                  multiple={true}
                  maxFiles={40}
                  label="Drop your images here"
                  hint="JPG, PNG, WEBP · Max 20 MB each · Up to 40 images"
                />
                {files.length > 0 && (
                  <div className={styles.actions}>
                    <p className={styles.fileCount}>
                      {files.length} image{files.length !== 1 ? 's' : ''} — each image becomes one PDF page.
                    </p>
                    <Button variant="primary" size="lg" onClick={handleCreate} id="create-pdf-btn">
                      Create PDF
                    </Button>
                  </div>
                )}
              </>
            )}
            {state === 'processing' && <PdfProcessingState message="Creating your PDF..." />}
            {state === 'success' && result && (
              <PdfSuccessState
                filename="images.pdf"
                fileSize={result.size}
                operation="Images → PDF"
                savedToHistory={true}
                onDownload={() => downloadBlob(result.data, 'images.pdf')}
                onReset={handleReset}
                downloadLabel="Download PDF"
              />
            )}
            {state === 'error' && (
              <PdfErrorState message={error ?? 'An error occurred.'} onRetry={handleReset} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
