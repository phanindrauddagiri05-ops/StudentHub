'use client';

import React from 'react';
import { ArrowRight, Trash2 } from 'lucide-react';
import { DocumentFormat } from '@/lib/converters/types';
import { getFormatMetadata } from '@/lib/converters/formats';
import { FormatBadge } from './FormatBadge';
import styles from './converter.module.css';

interface SelectedFileProps {
  file: File;
  sourceFormat: DocumentFormat;
  targetFormat: DocumentFormat;
  onRemove: () => void;
  disabled?: boolean;
}

export const SelectedFile: React.FC<SelectedFileProps> = ({
  file,
  sourceFormat,
  targetFormat,
  onRemove,
  disabled = false,
}) => {
  const meta = getFormatMetadata(sourceFormat);
  const sizeMb = (file.size / (1024 * 1024)).toFixed(2);

  return (
    <div className={styles.selectedFileCard}>
      <div className={styles.selectedFileInfo}>
        <div
          className={styles.fileIconBadge}
          style={{ backgroundColor: meta.badgeBg, color: meta.color }}
        >
          {meta.icon}
        </div>

        <div className={styles.fileNameMeta}>
          <span className={styles.fileName} title={file.name}>
            {file.name}
          </span>
          <div className={styles.fileMeta}>
            <span>{sizeMb} MB</span>
            <span>•</span>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <FormatBadge format={sourceFormat} size="sm" />
              <ArrowRight size={12} style={{ color: '#94a3b8' }} />
              <FormatBadge format={targetFormat} size="sm" />
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        className={styles.actionIconBtnDanger}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '6px 12px',
          borderRadius: '8px',
          border: '1px solid #fecaca',
          background: '#ffffff',
          color: '#dc2626',
          fontSize: '12px',
          fontWeight: 600,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
        aria-label="Remove selected file"
      >
        <Trash2 size={14} />
        Remove
      </button>
    </div>
  );
};
