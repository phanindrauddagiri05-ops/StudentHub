'use client';

import { useState } from 'react';
import ToolPageHeader from '@/components/tools/ToolPageHeader';
import PdfUploader from '@/components/pdf/PdfUploader';
import { PdfProcessingState, PdfErrorState } from '@/components/pdf/PdfStates';
import Button from '@/components/ui/Button';
import { pdfToImages } from '@/lib/pdf';
import { useAuth } from '@/hooks/useAuth';
import { saveProcessedFile } from '@/lib/storage/file-service';
import type { PdfFile, PdfOperationState } from '@/types';
import styles from '../pdf-tool.module.css';

export default function PdfToImagesPage() {
  const { user } = useAuth();
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [state, setState] = useState<PdfOperationState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);

  const handleConvert = async () => {
    if (!files[0]) return;
    setState('processing');
    setError(null);
    try {
      const output = await pdfToImages(files[0].file, undefined, 1.5);
      setImages(output.dataUrls);

      if (user) {
        try {
          const JSZip = (await import('jszip')).default;
          const zip = new JSZip();
          output.dataUrls.forEach((url, i) => {
            const base64 = url.split(',')[1];
            zip.file(`page-${i + 1}.png`, base64, { base64: true });
          });
          const zipBlob = await zip.generateAsync({ type: 'blob' });
          await saveProcessedFile({
            userId: user.id,
            data: zipBlob,
            filename: 'extracted-images.zip',
            operation: 'pdf_to_images',
            mimeType: 'application/zip',
          });
        } catch (saveErr) {
          console.warn('Could not save to history:', saveErr);
        }
      }

      setState('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed. Please try again.');
      setState('error');
    }
  };


  const handleDownloadSingle = (dataUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `page-${index + 1}.png`;
    link.click();
  };

  const handleDownloadAll = async () => {
    // Simple sequential download
    for (let i = 0; i < images.length; i++) {
      await new Promise((res) => setTimeout(res, 200));
      handleDownloadSingle(images[i], i);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setState('idle');
    setError(null);
    setImages([]);
  };

  return (
    <>
      <ToolPageHeader
        breadcrumbs={[
          { label: 'Tools', href: '/tools' },
          { label: 'PDF Tools', href: '/tools/pdf' },
          { label: 'PDF → Images' },
        ]}
        title="PDF → Images"
        description="Convert PDF pages into PNG images."
        icon="📸"
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
                  hint="PDF files only · Max 50 MB · All pages will be converted"
                />
                {files.length > 0 && (
                  <div className={styles.actions}>
                    <Button variant="primary" size="lg" onClick={handleConvert} id="convert-to-images-btn">
                      Convert to Images
                    </Button>
                  </div>
                )}
              </>
            )}
            {state === 'processing' && (
              <PdfProcessingState message="Converting PDF pages to images..." />
            )}
            {state === 'success' && images.length > 0 && (
              <div className={styles.workspace}>
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-gray-900)', marginBottom: 'var(--space-2)' }}>
                    ✅ {images.length} page{images.length !== 1 ? 's' : ''} converted!
                  </h3>
                </div>
                <div className={styles.downloadRow}>
                  <Button variant="primary" onClick={handleDownloadAll} id="download-all-images-btn">
                    Download All ({images.length})
                  </Button>
                  <Button variant="ghost" onClick={handleReset} id="convert-another-btn">
                    Convert Another
                  </Button>
                  {user && (
                    <Button variant="secondary" href="/history" id="view-history-images-btn">
                      View History
                    </Button>
                  )}
                </div>
                <div className={styles.imagesResultGrid}>
                  {images.map((src, i) => (
                    <div key={i} className={styles.imageResultCard}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`Page ${i + 1}`} />
                      <div className={styles.imageResultFooter}>
                        <span className={styles.imageResultLabel}>Page {i + 1}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadSingle(src, i)}
                          id={`download-page-${i + 1}`}
                        >
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {state === 'error' && (
              <PdfErrorState message={error ?? 'Conversion failed.'} onRetry={handleReset} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
