import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
  showPercent?: boolean;
}

export default function ProgressBar({ value, label, showPercent = true }: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  return (
    <div className={styles.wrapper}>
      {(label || showPercent) && (
        <div className={styles.label}>
          {label && <span>{label}</span>}
          {showPercent && <span>{Math.round(clampedValue)}%</span>}
        </div>
      )}
      <div className={styles.track} role="progressbar" aria-valuenow={clampedValue} aria-valuemin={0} aria-valuemax={100}>
        <div className={styles.bar} style={{ width: `${clampedValue}%` }} />
      </div>
    </div>
  );
}
