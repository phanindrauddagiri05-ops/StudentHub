import { CheckCircle, Download, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import styles from './PdfStates.module.css';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import { formatFileSize } from '@/lib/pdf';

/* ── Processing State ────────────────────────────────────── */
interface PdfProcessingStateProps {
  message?: string;
  progress?: number;
}

export function PdfProcessingState({
  message = 'Processing your PDF...',
  progress,
}: PdfProcessingStateProps) {
  return (
    <div className={styles.processingState}>
      <div className={styles.spinner}>
        <Loader2 size={32} className={styles.spinIcon} />
      </div>
      <p className={styles.processingMsg}>{message}</p>
      {progress !== undefined && (
        <div className={styles.progressWrapper}>
          <ProgressBar value={progress} />
        </div>
      )}
    </div>
  );
}

/* ── Success State ───────────────────────────────────────── */
interface PdfSuccessStateProps {
  filename: string;
  fileSize?: number;
  operation?: string;
  createdDate?: string | Date;
  onDownload: () => void;
  onReset: () => void;
  downloadLabel?: string;
  extra?: React.ReactNode;
  savedToHistory?: boolean;
}

export function PdfSuccessState({
  filename,
  fileSize,
  operation,
  createdDate = 'Just now',
  onDownload,
  onReset,
  downloadLabel = 'Download PDF',
  extra,
  savedToHistory = false,
}: PdfSuccessStateProps) {
  const formattedDate =
    createdDate instanceof Date
      ? createdDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
      : createdDate;

  return (
    <div className={styles.successState}>
      <div className={styles.successIcon}>
        <CheckCircle size={48} />
      </div>
      <h3 className={styles.successTitle}>Your PDF is ready.</h3>

      <div className={styles.fileCard}>
        <span className={styles.fileEmoji}>📄</span>
        <div>
          <p className={styles.successFilename}>{filename}</p>
          <div className={styles.successMeta}>
            {fileSize !== undefined && <span>{formatFileSize(fileSize)}</span>}
            {operation && <span className={styles.successOpBadge}>{operation}</span>}
            <span>• {formattedDate}</span>
          </div>
        </div>
      </div>

      {savedToHistory && (
        <span className={styles.savedNotice}>
          ✓ Saved to your StudentHub workspace
        </span>
      )}

      {extra}

      <div className={styles.successActions}>
        <Button
          variant="primary"
          size="lg"
          onClick={onDownload}
          icon={<Download size={18} />}
          id="download-result-btn"
        >
          {downloadLabel}
        </Button>
        <Button variant="ghost" onClick={onReset} icon={<RefreshCw size={16} />} id="process-another-btn">
          Process Another
        </Button>
        <Button variant="secondary" href="/history" id="view-history-btn">
          View History
        </Button>
      </div>
    </div>
  );
}


/* ── Error State ─────────────────────────────────────────── */
interface PdfErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function PdfErrorState({ message, onRetry }: PdfErrorStateProps) {
  return (
    <div className={styles.errorState}>
      <div className={styles.errorIcon}>
        <AlertCircle size={48} />
      </div>
      <h3 className={styles.errorTitle}>We couldn&apos;t process this file.</h3>
      <p className={styles.errorMsg}>{message}</p>
      <Button variant="secondary" onClick={onRetry} icon={<RefreshCw size={16} />} id="retry-btn">
        Try Again
      </Button>
    </div>
  );
}

/* ── Compress Result Extra ───────────────────────────────── */
interface CompressResultInfoProps {
  originalSize: number;
  newSize: number;
  reduction: number;
  wasReduced: boolean;
}

export function CompressResultInfo({ originalSize, newSize, reduction, wasReduced }: CompressResultInfoProps) {
  return (
    <div className={styles.compressInfo}>
      <div className={styles.compressStat}>
        <span className={styles.compressLabel}>Original</span>
        <span className={styles.compressValue}>{formatFileSize(originalSize)}</span>
      </div>
      <div className={styles.compressArrow}>→</div>
      <div className={styles.compressStat}>
        <span className={styles.compressLabel}>New Size</span>
        <span className={[styles.compressValue, wasReduced ? styles.compressGood : ''].join(' ')}>
          {formatFileSize(newSize)}
        </span>
      </div>
      <div className={styles.compressStat}>
        <span className={styles.compressLabel}>Reduction</span>
        <span className={[styles.compressValue, wasReduced ? styles.compressGood : styles.compressNeutral].join(' ')}>
          {wasReduced ? `${reduction}%` : 'No reduction'}
        </span>
      </div>
      {!wasReduced && (
        <p className={styles.compressNote}>
          This PDF is already well-optimized. No significant size reduction was possible.
        </p>
      )}
    </div>
  );
}
