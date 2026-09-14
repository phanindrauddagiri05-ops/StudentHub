'use client';

import { useState } from 'react';
import ToolPageHeader from '@/components/tools/ToolPageHeader';
import PdfUploader from '@/components/pdf/PdfUploader';
import { PdfProcessingState, PdfSuccessState, PdfErrorState, CompressResultInfo } from '@/components/pdf/PdfStates';
import Button from '@/components/ui/Button';
import { compressPdf, downloadBlob } from '@/lib/pdf';
import { useAuth } from '@/hooks/useAuth';
import { saveProcessedFile } from '@/lib/storage/file-service';
import type { CompressionLevel } from '@/lib/pdf/compress';
import type { PdfFile, PdfOperationState } from '@/types';
import styles from '../pdf-tool.module.css';

export default function CompressPdfPage() {
  const { user } = useAuth();
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [level, setLevel] = useState<CompressionLevel>('medium');
  const [state, setState] = useState<PdfOperationState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    data: Uint8Array;
    originalSize: number;
    newSize: number;
    reduction: number;
    wasReduced: boolean;
  } | null>(null);

  const handleCompress = async () => {
    if (!files[0]) return;
    setState('processing');
    setError(null);
    try {
      const output = await compressPdf(files[0].file, level);
      setResult(output);

      const activeUserId = user?.id || 'guest';
      try {
        await saveProcessedFile({
          userId: activeUserId,
          data: output.data,
          filename: 'compressed.pdf',
          operation: 'compress',
          mimeType: 'application/pdf',
        });
      } catch (saveErr) {
        console.error('Could not save to history:', saveErr);
      }

      setState('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Compression failed. Please try again.');
      setState('error');
    }
  };


  const handleReset = () => {
    setFiles([]);
    setLevel('medium');
    setState('idle');
    setError(null);
    setResult(null);
  };

  const LEVELS: { id: CompressionLevel; label: string; desc: string }[] = [
    { id: 'low', label: 'Low', desc: 'Fastest, minimal reduction' },
    { id: 'medium', label: 'Medium', desc: 'Balanced' },
    { id: 'high', label: 'High', desc: 'Maximum reduction' },
  ];

  return (
    <>
      <ToolPageHeader
        breadcrumbs={[
          { label: 'Tools', href: '/tools' },
          { label: 'PDF Tools', href: '/tools/pdf' },
          { label: 'Compress PDF' },
        ]}
        title="Compress PDF"
        description="Reduce PDF file size by optimizing the document structure."
        icon="📦"
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
                  multiple={false}
                  label="Drop your PDF file here"
                  hint="PDF files only · Max 50 MB"
                />
                {files.length > 0 && (
                  <>
                    <div className={styles.levelRow}>
                      <span className={styles.levelLabel}>Compression Level</span>
                      <div className={styles.levelBtns}>
                        {LEVELS.map((l) => (
                          <button
                            key={l.id}
                            className={[styles.levelBtn, level === l.id ? styles.levelBtnActive : ''].join(' ')}
                            onClick={() => setLevel(l.id)}
                            id={`level-${l.id}`}
                          >
                            <strong>{l.label}</strong>
                            <br />
                            <small style={{ fontSize: '11px', opacity: 0.7 }}>{l.desc}</small>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className={styles.infoBox}>
                      ℹ️ Browser-based compression re-optimizes the PDF structure. Results vary by PDF content — some files may not compress significantly if they are already optimized.
                    </div>
                    <div className={styles.actions}>
                      <Button variant="primary" size="lg" onClick={handleCompress} id="compress-btn">
                        Compress PDF
                      </Button>
                    </div>
                  </>
                )}
              </>
            )}
            {state === 'processing' && <PdfProcessingState message="Compressing your PDF..." />}
            {state === 'success' && result && (
              <PdfSuccessState
                filename="compressed.pdf"
                fileSize={result.newSize}
                operation="Compress"
                savedToHistory={true}
                onDownload={() => downloadBlob(result.data, 'compressed.pdf')}
                onReset={handleReset}
                downloadLabel="Download Compressed PDF"
                extra={
                  <CompressResultInfo
                    originalSize={result.originalSize}
                    newSize={result.newSize}
                    reduction={result.reduction}
                    wasReduced={result.wasReduced}
                  />
                }
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
