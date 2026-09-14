'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  UploadCloud,
  Sparkles,
  CheckCircle,
  Copy,
  Download,
  Bookmark,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  ListChecks,
  Compass,
  FileCheck2,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { formatFileSize } from '@/lib/pdf';
import { savePdfSummaryRecord } from '@/lib/storage/file-service';
import styles from './summary.module.css';

type ProcessStep = 'idle' | 'extracting' | 'analyzing' | 'generating' | 'completed' | 'error';

interface SummaryData {
  overview: string;
  keyPoints: string[];
  importantDetails: string[];
  conclusions: string;
}

interface SummaryResultPayload {
  id: string;
  filename: string;
  fileSize: number;
  pageCount: number;
  wordCount: number;
  summary: SummaryData;
  provider: string;
  createdAt: string;
}

export default function PdfSummaryPage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [pageCountEstimate, setPageCountEstimate] = useState<number | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [step, setStep] = useState<ProcessStep>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isScanned, setIsScanned] = useState(false);
  const [result, setResult] = useState<SummaryResultPayload | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  // Auto-hide toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith('.pdf') && selectedFile.type !== 'application/pdf') {
      setErrorMessage('Please upload a valid PDF document (.pdf)');
      return;
    }
    if (selectedFile.size > 25 * 1024 * 1024) {
      setErrorMessage('PDF file exceeds the 25MB limit.');
      return;
    }

    setFile(selectedFile);
    setErrorMessage(null);
    setIsScanned(false);
    setResult(null);
    setStep('idle');
    setIsSaved(false);

    // Estimate page count via quick inspection or default
    setPageCountEstimate(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleGenerate = async () => {
    if (!file) return;

    setStep('extracting');
    setErrorMessage(null);
    setIsScanned(false);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulation steps for user visual feedback
      setTimeout(() => {
        setStep((prev) => (prev === 'extracting' ? 'analyzing' : prev));
      }, 900);

      setTimeout(() => {
        setStep((prev) => (prev === 'analyzing' || prev === 'extracting' ? 'generating' : prev));
      }, 2000);

      const res = await fetch('/api/summary', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.isScanned) {
          setIsScanned(true);
        }
        throw new Error(data.error || 'Failed to generate PDF summary.');
      }

      setResult(data);
      setStep('completed');

      // Automatically save to local history & activity log
      await savePdfSummaryRecord({
        id: data.id,
        userId: user?.id || 'guest',
        filename: data.filename,
        fileSize: data.fileSize,
        pageCount: data.pageCount,
        wordCount: data.wordCount,
        summary: data.summary,
        provider: data.provider,
        createdAt: data.createdAt,
      });
      setIsSaved(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred during summarization.';
      setErrorMessage(msg);
      setStep('error');
    }
  };

  const handleCopySummary = () => {
    if (!result) return;
    const textToCopy = `SUMMARY OF: ${result.filename}
    
OVERVIEW:
${result.summary.overview}

KEY POINTS:
${result.summary.keyPoints.map((pt, i) => `${i + 1}. ${pt}`).join('\n')}

IMPORTANT DETAILS:
${result.summary.importantDetails.map((dt) => `• ${dt}`).join('\n')}

CONCLUSIONS:
${result.summary.conclusions}
`;
    navigator.clipboard.writeText(textToCopy);
    showToast('Summary copied to clipboard!');
  };

  const handleDownloadSummary = () => {
    if (!result) return;
    const content = `# Summary: ${result.filename}
*Generated on ${new Date(result.createdAt).toLocaleString()} via StudentHub AI*
*Pages: ${result.pageCount} | Words: ${result.wordCount}*

---

## 1. Overview
${result.summary.overview}

---

## 2. Key Points
${result.summary.keyPoints.map((pt, i) => `${i + 1}. ${pt}`).join('\n')}

---

## 3. Important Details
${result.summary.importantDetails.map((dt) => `- ${dt}`).join('\n')}

---

## 4. Conclusions
${result.summary.conclusions}
`;

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${result.filename.replace(/\.pdf$/i, '')}_summary.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Summary file downloaded!');
  };

  const handleManualSave = async () => {
    if (!result) return;
    try {
      await savePdfSummaryRecord({
        id: result.id,
        userId: user?.id || 'guest',
        filename: result.filename,
        fileSize: result.fileSize,
        pageCount: result.pageCount,
        wordCount: result.wordCount,
        summary: result.summary,
        provider: result.provider,
        createdAt: result.createdAt,
      });
      setIsSaved(true);
      showToast('Saved to your History!');
    } catch {
      showToast('Could not save summary.');
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setStep('idle');
    setErrorMessage(null);
    setIsScanned(false);
    setIsSaved(false);
  };

  return (
    <div className={styles.container}>
      {/* ── Page Header ────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.badgeRow}>
          <span className={styles.phaseBadge}>
            <Sparkles size={12} />
            Phase 5 • AI Tool
          </span>
        </div>
        <h1 className={styles.title}>PDF Summary</h1>
        <p className={styles.subtitle}>
          Upload a PDF and get a clear AI-powered summary with structured takeaways, key points, and core details.
        </p>
      </div>

      {/* ── Upload Box (Visible when no file is selected) ───── */}
      {!file && step !== 'completed' && (
        <div
          className={[styles.dropzone, isDragOver ? styles.dropzoneActive : ''].join(' ')}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          id="pdf-summary-dropzone"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className={styles.fileInput}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileSelect(e.target.files[0]);
              }
            }}
          />
          <div className={styles.dropzoneIconWrapper}>
            <UploadCloud size={32} />
          </div>
          <div className={styles.dropzoneTitle}>Upload a PDF to Summarize</div>
          <p className={styles.dropzoneHint}>
            Drag and drop your academic notes, textbook chapter, or report (up to 25MB)
          </p>
          <Button variant="primary" size="md">
            Choose PDF File
          </Button>
        </div>
      )}

      {/* ── Document Info Card (File selected, before or during processing) ── */}
      {file && step !== 'completed' && (
        <div className={styles.docCard}>
          <div className={styles.docMetaRow}>
            <div className={styles.docMetaLeft}>
              <div className={styles.docIcon}>
                <FileText size={24} />
              </div>
              <div className={styles.docDetails}>
                <div className={styles.docName}>{file.name}</div>
                <div className={styles.docStats}>
                  <span>{formatFileSize(file.size)}</span>
                  <span>•</span>
                  <span>PDF Document</span>
                  {pageCountEstimate && (
                    <>
                      <span>•</span>
                      <span>~{pageCountEstimate} pages</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {step === 'idle' && (
              <button type="button" className={styles.changeBtn} onClick={handleReset}>
                Change File
              </button>
            )}
          </div>

          {step === 'idle' && (
            <Button
              variant="primary"
              size="lg"
              onClick={handleGenerate}
              id="generate-summary-btn"
              fullWidth
            >
              <Sparkles size={18} style={{ marginRight: 8 }} />
              Generate Summary
            </Button>
          )}

          {/* Processing Visual Feedback */}
          {(step === 'extracting' || step === 'analyzing' || step === 'generating') && (
            <div className={styles.processingCard}>
              <div className={styles.spinner} />
              <div className={styles.processingTitle}>Processing Document...</div>
              <div className={styles.stepsList}>
                <div
                  className={[
                    styles.stepItem,
                    step === 'extracting' ? styles.stepActive : step === 'analyzing' || step === 'generating' ? styles.stepDone : '',
                  ].join(' ')}
                >
                  <span>{step === 'analyzing' || step === 'generating' ? '✓' : '•'}</span>
                  <span>Extracting text...</span>
                </div>
                <div
                  className={[
                    styles.stepItem,
                    step === 'analyzing' ? styles.stepActive : step === 'generating' ? styles.stepDone : '',
                  ].join(' ')}
                >
                  <span>{step === 'generating' ? '✓' : '•'}</span>
                  <span>Analyzing document...</span>
                </div>
                <div className={[styles.stepItem, step === 'generating' ? styles.stepActive : ''].join(' ')}>
                  <span>•</span>
                  <span>Generating summary...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Scanned PDF Notice ─────────────────────────────── */}
      {isScanned && (
        <div className={styles.alertNotice} id="scanned-pdf-alert">
          <AlertTriangle size={20} className={styles.alertNoticeIcon} />
          <div>
            <strong>Scanned Document Detected:</strong>
            <p style={{ marginTop: 4 }}>
              This PDF appears to be scanned or image-based. OCR support will be added in a future update.
            </p>
          </div>
        </div>
      )}

      {/* ── General Error State ────────────────────────────── */}
      {step === 'error' && !isScanned && errorMessage && (
        <div className={styles.errorCard} id="summary-error-alert">
          <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <strong>Summarization Error:</strong>
            <p style={{ marginTop: 4 }}>{errorMessage}</p>
            <div style={{ marginTop: 12 }}>
              <Button variant="secondary" size="sm" onClick={handleReset}>
                <RotateCcw size={14} style={{ marginRight: 6 }} />
                Try Another PDF
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Completed Summary Results ──────────────────────── */}
      {step === 'completed' && result && (
        <div className={styles.resultsContainer} id="summary-results">
          <div className={styles.resultsHeader}>
            <div className={styles.resultsTitleArea}>
              <div className={styles.resultsBadge}>
                <CheckCircle size={20} />
              </div>
              <div>
                <div className={styles.resultsTitle}>Summary: {result.filename}</div>
                <div className={styles.resultsSubtitle}>
                  {result.pageCount} {result.pageCount === 1 ? 'page' : 'pages'} • {result.wordCount} words • {result.provider}
                </div>
              </div>
            </div>

            <div className={styles.resultsActions}>
              <Button variant="secondary" size="sm" onClick={handleCopySummary} id="copy-summary-btn">
                <Copy size={14} style={{ marginRight: 6 }} />
                Copy
              </Button>
              <Button variant="secondary" size="sm" onClick={handleDownloadSummary} id="download-summary-btn">
                <Download size={14} style={{ marginRight: 6 }} />
                Download
              </Button>
              <Button
                variant={isSaved ? 'ghost' : 'primary'}
                size="sm"
                onClick={handleManualSave}
                id="save-summary-btn"
                disabled={isSaved}
              >
                {isSaved ? (
                  <>
                    <FileCheck2 size={14} style={{ marginRight: 6, color: '#059669' }} />
                    Saved to History
                  </>
                ) : (
                  <>
                    <Bookmark size={14} style={{ marginRight: 6 }} />
                    Save
                  </>
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleReset} id="summarize-another-btn">
                <RotateCcw size={14} style={{ marginRight: 6 }} />
                New PDF
              </Button>
            </div>
          </div>

          <div className={styles.summaryGrid}>
            {/* Overview */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <BookOpen size={18} className={styles.sectionIcon} />
                <h2 className={styles.sectionTitle}>Overview</h2>
              </div>
              <p className={styles.sectionBody}>{result.summary.overview}</p>
            </div>

            {/* Key Points */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <ListChecks size={18} className={styles.sectionIcon} />
                <h2 className={styles.sectionTitle}>Key Points</h2>
              </div>
              <div className={styles.bulletList}>
                {result.summary.keyPoints.map((point, i) => (
                  <div key={i} className={styles.bulletItem}>
                    <span className={styles.bulletDot} />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Important Details */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <Sparkles size={18} className={styles.sectionIcon} />
                <h2 className={styles.sectionTitle}>Important Details</h2>
              </div>
              <div className={styles.bulletList}>
                {result.summary.importantDetails.map((detail, i) => (
                  <div key={i} className={styles.bulletItem}>
                    <span className={styles.bulletDot} />
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Conclusions */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <Compass size={18} className={styles.sectionIcon} />
                <h2 className={styles.sectionTitle}>Conclusions</h2>
              </div>
              <p className={styles.sectionBody}>{result.summary.conclusions}</p>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && <div className={styles.toast}>{toastMessage}</div>}
    </div>
  );
}
