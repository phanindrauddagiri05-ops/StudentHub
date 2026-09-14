'use client';

import React from 'react';
import { CheckCircle2, Download, RefreshCw, ArrowDown } from 'lucide-react';
import { ConversionRecord } from '@/lib/converters/types';
import { FormatBadge } from './FormatBadge';
import Button from '@/components/ui/Button';
import styles from './converter.module.css';

interface ConversionSuccessProps {
  record: ConversionRecord;
  downloadUrl: string;
  onReset: () => void;
}

export const ConversionSuccess: React.FC<ConversionSuccessProps> = ({
  record,
  downloadUrl,
  onReset,
}) => {
  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = record.output_filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const outputSizeMb = (record.output_file_size / (1024 * 1024)).toFixed(2);

  return (
    <div className={styles.successCard}>
      <div className={styles.successIcon}>
        <CheckCircle2 size={32} />
      </div>

      <div className={styles.successTitle}>Conversion complete</div>

      {/* Visual transformation flow */}
      <div className={styles.conversionFlow} style={{ flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FormatBadge format={record.source_format} size="sm" />
          <span style={{ fontSize: '13px', color: '#475569' }}>{record.source_filename}</span>
        </div>

        <ArrowDown size={14} style={{ color: '#94a3b8' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FormatBadge format={record.target_format} size="sm" />
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
            {record.output_filename}
          </span>
          <span style={{ fontSize: '12px', color: '#64748b' }}>({outputSizeMb} MB)</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '8px' }}>
        <Button variant="primary" size="md" onClick={handleDownload} id="download-converted-doc-btn">
          <Download size={16} />
          Download {record.target_format.toUpperCase()}
        </Button>

        <Button variant="outline" size="md" onClick={onReset} id="convert-another-btn">
          <RefreshCw size={15} />
          Convert another document
        </Button>
      </div>
    </div>
  );
};
