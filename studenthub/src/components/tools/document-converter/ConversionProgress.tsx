'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import styles from './converter.module.css';

interface ConversionProgressProps {
  progress?: number;
  stageText?: string;
}

export const ConversionProgress: React.FC<ConversionProgressProps> = ({
  stageText,
}) => {
  return (
    <div className={styles.progressContainer}>
      <Loader2 size={40} className="animate-spin" style={{ color: 'var(--color-primary-600)' }} />

      <div className={styles.progressText}>
        {stageText || 'Converting your document...'}
      </div>

      <div style={{ fontSize: '13.5px', color: 'var(--color-gray-500)', marginTop: '-4px' }}>
        This may take a little longer for large files.
      </div>

      <span style={{ fontSize: '12px', color: 'var(--color-gray-400)', marginTop: '8px' }}>
        Please keep this window open while processing.
      </span>
    </div>
  );
};
