'use client';

import { useState } from 'react';
import ToolPageHeader from '@/components/tools/ToolPageHeader';
import PdfUploader from '@/components/pdf/PdfUploader';
import { PdfProcessingState, PdfSuccessState, PdfErrorState } from '@/components/pdf/PdfStates';
import Button from '@/components/ui/Button';
import { pdfToImages, reorderPages, downloadBlob } from '@/lib/pdf';
import { useAuth } from '@/hooks/useAuth';
import { saveProcessedFile } from '@/lib/storage/file-service';
import type { PdfFile, PdfOperationState } from '@/types';
import styles from '../pdf-tool.module.css';
import reorderStyles from './reorder.module.css';

export default function ReorderPdfPage() {
  const { user } = useAuth();
  const [files, setFiles] = useState<PdfFile[]>([]);

  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [order, setOrder] = useState<number[]>([]);
  const [loadingThumbs, setLoadingThumbs] = useState(false);
  const [state, setState] = useState<PdfOperationState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ data: Uint8Array; size: number } | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleFileChange = async (newFiles: PdfFile[]) => {
    setFiles(newFiles);
    if (newFiles.length === 0) {
      setThumbnails([]);
      setOrder([]);
      return;
    }
    setLoadingThumbs(true);
    try {
      const result = await pdfToImages(newFiles[0].file, undefined, 0.5);
      setThumbnails(result.dataUrls);
      setOrder(result.dataUrls.map((_, i) => i));
    } catch {
      setThumbnails([]);
      setOrder([]);
    } finally {
      setLoadingThumbs(false);
    }
  };

  const handleDragStart = (index: number) => setDraggingIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };
  const handleDrop = (targetIndex: number) => {
    if (draggingIndex === null || draggingIndex === targetIndex) return;
    const newOrder = [...order];
    const [moved] = newOrder.splice(draggingIndex, 1);
    newOrder.splice(targetIndex, 0, moved);
    setOrder(newOrder);
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  const handleSave = async () => {
    if (!files[0] || order.length === 0) return;
    setState('processing');
    setError(null);
    try {
      const output = await reorderPages(files[0].file, order);
      setResult({ data: output.data, size: output.data.byteLength });

      const activeUserId = user?.id || 'guest';
      try {
        await saveProcessedFile({
          userId: activeUserId,
          data: output.data,
          filename: 'reordered.pdf',
          operation: 'reorder',
          mimeType: 'application/pdf',
        });
      } catch (saveErr) {
        console.error('Could not save to history:', saveErr);
      }

      setState('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reorder failed.');
      setState('error');
    }
  };

  const handleReset = () => {
    setFiles([]);
    setThumbnails([]);
    setOrder([]);
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
          { label: 'Reorder PDF' },
        ]}
        title="Reorder PDF"
        description="Drag and drop to rearrange pages in any order."
        icon="🔀"
      />
      <div className={styles.page}>
        <div className="container">
          <div className={styles.workspace}>
            {state === 'idle' && (
              <>
                {files.length === 0 && (
                  <PdfUploader
                    files={files}
                    onFilesChange={handleFileChange}
                    accept="pdf"
                    multiple={false}
                    label="Drop your PDF file here"
                    hint="PDF files only · Max 50 MB"
                  />
                )}
                {loadingThumbs && (
                  <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-gray-500)' }}>
                    Loading page previews...
                  </div>
                )}
                {!loadingThumbs && thumbnails.length > 0 && (
                  <>
                    <div className={styles.infoBox}>
                      🖱️ Drag and drop pages to reorder them. Current order: {order.map((i) => i + 1).join(', ')}
                    </div>
                    <div className={reorderStyles.grid}>
                      {order.map((pageIndex, displayIndex) => (
                        <div
                          key={`${pageIndex}-${displayIndex}`}
                          className={[
                            reorderStyles.thumb,
                            draggingIndex === displayIndex ? reorderStyles.dragging : '',
                            dragOverIndex === displayIndex ? reorderStyles.dragOver : '',
                          ].join(' ')}
                          draggable
                          onDragStart={() => handleDragStart(displayIndex)}
                          onDragOver={(e) => handleDragOver(e, displayIndex)}
                          onDrop={() => handleDrop(displayIndex)}
                          onDragEnd={() => { setDraggingIndex(null); setDragOverIndex(null); }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={thumbnails[pageIndex]} alt={`Page ${pageIndex + 1}`} className={reorderStyles.thumbImg} />
                          <span className={reorderStyles.thumbLabel}>Page {pageIndex + 1}</span>
                          <span className={reorderStyles.thumbPos}>#{displayIndex + 1}</span>
                        </div>
                      ))}
                    </div>
                    <div className={styles.actions}>
                      <Button variant="primary" size="lg" onClick={handleSave} id="save-order-btn">
                        Save New Order
                      </Button>
                      <Button variant="ghost" onClick={handleReset} id="reorder-reset-btn">
                        Start Over
                      </Button>
                    </div>
                  </>
                )}
              </>
            )}
            {state === 'processing' && <PdfProcessingState message="Reordering pages..." />}
            {state === 'success' && result && (
              <PdfSuccessState
                filename="reordered.pdf"
                fileSize={result.size}
                operation="Reorder"
                savedToHistory={true}
                onDownload={() => downloadBlob(result.data, 'reordered.pdf')}
                onReset={handleReset}
                downloadLabel="Download Reordered PDF"
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
