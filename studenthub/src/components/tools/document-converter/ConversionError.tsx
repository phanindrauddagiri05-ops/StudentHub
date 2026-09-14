'use client';

import React from 'react';
import { AlertCircle, RefreshCw, FileUp } from 'lucide-react';
import Button from '@/components/ui/Button';
import styles from './converter.module.css';

interface ConversionErrorProps {
  message?: string;
  onRetry: () => void;
  onChooseAnotherFile?: () => void;
}

export const ConversionError: React.FC<ConversionErrorProps> = ({
  message,
  onRetry,
  onChooseAnotherFile,
}) => {
  return (
    <div className={styles.errorCard}>
      <div className={styles.errorIcon}>
        <AlertCircle size={28} />
      </div>

      <div>
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#991b1b', marginBottom: '6px' }}>
          Conversion failed
        </div>
        <div style={{ fontSize: '14px', color: '#b91c1c', maxWidth: '440px', lineHeight: 1.5 }}>
          {message || 'Something went wrong while converting this document. Please check the file and try again.'}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Button variant="primary" size="sm" onClick={onRetry} id="retry-conversion-btn">
          <RefreshCw size={14} />
          Try Again
        </Button>
        {onChooseAnotherFile && (
          <Button variant="outline" size="sm" onClick={onChooseAnotherFile} id="choose-another-file-btn">
            <FileUp size={14} />
            Choose Another File
          </Button>
        )}
      </div>
    </div>
  );
};
