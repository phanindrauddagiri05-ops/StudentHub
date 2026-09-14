'use client';

import { useState } from 'react';
import ToolPageHeader from '@/components/tools/ToolPageHeader';
import PdfUploader from '@/components/pdf/PdfUploader';
import { PdfProcessingState, PdfSuccessState, PdfErrorState } from '@/components/pdf/PdfStates';
import Button from '@/components/ui/Button';
import { splitPdf, downloadBlob, parsePageRange } from '@/lib/pdf';
import { useAuth } from '@/hooks/useAuth';
import { saveProcessedFile } from '@/lib/storage/file-service';
import type { PdfFile, PdfOperationState } from '@/types';
import styles from '../pdf-tool.module.css';

export default function SplitPdfPage() {
  const { user } = useAuth();
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [pageRange, setPageRange] = useState('');
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [state, setState] = useState<PdfOperationState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ data: Uint8Array; size: number; filename: string } | null>(null);

  const handleFileChange = async (newFiles: PdfFile[]) => {
    setFiles(newFiles);
    if (newFiles.length > 0) {
      // Quick page count using pdfjs
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
        const buf = await newFiles[0].file.arrayBuffer();
        const doc = await pdfjsLib.getDocument({ data: buf }).promise;
        setTotalPages(doc.numPages);
      } catch {
        setTotalPages(null);
      }
    } else {
      setTotalPages(null);
    }
  };

  const handleSplit = async () => {
    if (!files[0]) return;
    setState('processing');
    setError(null);
    try {
      const pages = parsePageRange(pageRange, totalPages ?? 9999);
      const output = await splitPdf(files[0].file, pages);
      const outFilename = output.filename || 'extracted.pdf';
      setResult({ data: output.data, size: output.data.byteLength, filename: outFilename });

      const activeUserId = user?.id || 'guest';
      try {
        await saveProcessedFile({
          userId: activeUserId,
          data: output.data,
          filename: outFilename,
          operation: 'split',
          mimeType: outFilename.endsWith('.zip') ? 'application/zip' : 'application/pdf',
        });
      } catch (saveErr) {
        console.error('Could not save to history:', saveErr);
      }

      setState('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Split failed. Please try again.');
      setState('error');
    }
  };


  const handleReset = () => {
    setFiles([]);
    setPageRange('');
    setTotalPages(null);
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
          { label: 'Split PDF' },
        ]}
        title="Split PDF"
        description="Extract selected pages from a PDF file."
        icon="✂️"
      />
      <div className={styles.page}>
        <div className="container">
          <div className={styles.workspace}>
            {state === 'idle' && (
              <>
                <PdfUploader
                  files={files}
                  onFilesChange={handleFileChange}
                  accept="pdf"
                  multiple={false}
                  label="Drop your PDF file here"
                  hint="PDF files only · Max 50 MB"
                />
                {files.length > 0 && (
                  <>
                    {totalPages && (
                      <div className={styles.infoBox}>
                        ℹ️ This PDF has <strong>{totalPages} pages</strong>. Enter the pages you want to extract.
                      </div>
                    )}
                    <div className={styles.pageInputRow}>
                      <label className={styles.pageInputLabel} htmlFor="page-range-input">
                        Pages to Extract
                      </label>
                      <p className={styles.pageInputDesc}>
                        Enter page numbers or ranges, e.g. <strong>1, 3, 5-7</strong>
                      </p>
                      <input
                        id="page-range-input"
                        type="text"
                        className={styles.pageInput}
                        value={pageRange}
                        onChange={(e) => setPageRange(e.target.value)}
                        placeholder="e.g. 1, 3, 5-7"
                      />
                    </div>
                    <div className={styles.actions}>
                      <Button
                        variant="primary"
                        size="lg"
                        onClick={handleSplit}
                        disabled={!pageRange.trim()}
                        id="extract-pages-btn"
                      >
                        Extract Pages
                      </Button>
                    </div>
                  </>
                )}
              </>
            )}
            {state === 'processing' && <PdfProcessingState message="Extracting pages..." />}
            {state === 'success' && result && (
              <PdfSuccessState
                filename={result.filename}
                fileSize={result.size}
                operation="Split"
                savedToHistory={true}
                onDownload={() => downloadBlob(result.data, result.filename)}
                onReset={handleReset}
                downloadLabel={`Download ${result.filename.endsWith('.zip') ? 'ZIP' : 'PDF'}`}
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
