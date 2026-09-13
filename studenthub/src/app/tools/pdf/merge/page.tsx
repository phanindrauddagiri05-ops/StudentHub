'use client';

import { useState } from 'react';
import ToolPageHeader from '@/components/tools/ToolPageHeader';
import PdfUploader from '@/components/pdf/PdfUploader';
import { PdfProcessingState, PdfSuccessState, PdfErrorState } from '@/components/pdf/PdfStates';
import Button from '@/components/ui/Button';
import { mergePdfs, downloadBlob } from '@/lib/pdf';
import { useAuth } from '@/hooks/useAuth';
import { saveProcessedFile } from '@/lib/storage/file-service';
import type { PdfFile, PdfOperationState } from '@/types';
import styles from '../pdf-tool.module.css';

export default function MergePdfPage() {
  const { user } = useAuth();
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [state, setState] = useState<PdfOperationState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ data: Uint8Array; size: number } | null>(null);

  const handleMerge = async () => {
    if (files.length < 2) return;
    setState('processing');
    setError(null);
    try {
      const output = await mergePdfs(files.map((f) => f.file));
      setResult({ data: output.data, size: output.data.byteLength });

      if (user) {
        try {
          await saveProcessedFile({
            userId: user.id,
            data: output.data,
            filename: 'merged.pdf',
            operation: 'merge',
            mimeType: 'application/pdf',
          });
        } catch (saveErr) {
          console.warn('Could not save to history:', saveErr);
        }
      }

      setState('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Merge failed. Please try again.');
      setState('error');
    }
  };


  const handleDownload = () => {
    if (!result) return;
    downloadBlob(result.data, 'merged.pdf');
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
          { label: 'Merge PDF' },
        ]}
        title="Merge PDF Files"
        description="Combine multiple PDF files into one document."
        icon="🔗"
      />

      <div className={styles.page}>
        <div className="container">
          <div className={styles.workspace}>
            {state === 'idle' && (
              <>
                <PdfUploader
                  files={files}
                  onFilesChange={setFiles}
                  accept="pdf"
                  multiple={true}
                  maxFiles={20}
                  label="Drop your PDF files here"
                  hint="PDF files only · Max 50 MB each · Up to 20 files"
                />
                {files.length >= 2 && (
                  <div className={styles.actions}>
                    <p className={styles.fileCount}>{files.length} files selected — they will be merged in order.</p>
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleMerge}
                      disabled={files.length < 2}
                      id="merge-pdfs-btn"
                    >
                      Merge PDFs
                    </Button>
                  </div>
                )}
                {files.length === 1 && (
                  <p className={styles.hint}>Add at least one more PDF to merge.</p>
                )}
              </>
            )}

            {state === 'processing' && (
              <PdfProcessingState message="Merging your PDF files..." />
            )}

            {state === 'success' && result && (
              <PdfSuccessState
                filename="merged.pdf"
                fileSize={result.size}
                operation="Merge"
                savedToHistory={Boolean(user)}
                onDownload={handleDownload}
                onReset={handleReset}
                downloadLabel="Download Merged PDF"
              />
            )}

            {state === 'error' && (
              <PdfErrorState
                message={error ?? 'An unexpected error occurred.'}
                onRetry={handleReset}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
