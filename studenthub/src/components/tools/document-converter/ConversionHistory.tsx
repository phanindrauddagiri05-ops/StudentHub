'use client';

import React, { useEffect, useState } from 'react';
import { Download, Trash2, Clock, FileText } from 'lucide-react';
import { ConversionRecord } from '@/lib/converters/types';
import { getUserConversions, deleteConversionRecord } from '@/lib/converters/conversion.service';
import { FormatBadge } from './FormatBadge';
import { formatRelativeTime } from '@/lib/utils/date';
import styles from './converter.module.css';

interface ConversionHistoryProps {
  userId?: string;
}

export const ConversionHistory: React.FC<ConversionHistoryProps> = ({ userId }) => {
  const [records, setRecords] = useState<ConversionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    try {
      const data = await getUserConversions(userId || 'guest');
      setRecords(data);
    } catch (err) {
      console.error('Failed to load conversion history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [userId]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this conversion record?')) return;
    await deleteConversionRecord(id, userId || 'guest');
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const handleDownload = (record: ConversionRecord) => {
    if (!record.download_url) return;
    const a = document.createElement('a');
    a.href = record.download_url;
    a.download = record.output_filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-gray-400)' }}>
        <Clock size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem' }} />
        <p style={{ fontSize: '0.875rem' }}>Loading conversion history...</p>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '4rem 1.5rem',
          border: '1px dashed var(--color-border)',
          borderRadius: '16px',
          background: '#fafbfc',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: '#e2e8f0',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
          }}
        >
          <FileText size={24} />
        </div>
        <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-gray-800)', marginBottom: '4px' }}>
          No conversions yet
        </h4>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-500)', maxWidth: '340px', margin: '0 auto' }}>
          Your converted documents will be securely stored and listed here for instant download.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.historyTableWrapper}>
      <table className={styles.historyTable}>
        <thead>
          <tr>
            <th>File</th>
            <th>Conversion</th>
            <th>Size</th>
            <th>Date</th>
            <th>Status</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.map((rec) => {
            const sizeMb = (rec.output_file_size / (1024 * 1024)).toFixed(2);
            return (
              <tr key={rec.id}>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-gray-900)' }}>
                      {rec.output_filename}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--color-gray-400)' }}>
                      From {rec.source_filename}
                    </span>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FormatBadge format={rec.source_format} size="sm" />
                    <span style={{ color: '#94a3b8' }}>→</span>
                    <FormatBadge format={rec.target_format} size="sm" />
                  </div>
                </td>
                <td>
                  <span style={{ fontSize: '12px', color: 'var(--color-gray-500)' }}>
                    {sizeMb} MB
                  </span>
                </td>
                <td>
                  <span style={{ fontSize: '12px', color: 'var(--color-gray-500)' }}>
                    {formatRelativeTime(rec.created_at)}
                  </span>
                </td>
                <td>
                  <span
                    className={[
                      styles.statusBadge,
                      rec.status === 'completed' ? styles.statusCompleted : styles.statusFailed,
                    ].join(' ')}
                  >
                    {rec.status}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                    {rec.download_url && (
                      <button
                        type="button"
                        onClick={() => handleDownload(rec)}
                        className={styles.actionIconBtn}
                        title={`Download ${rec.output_filename}`}
                        aria-label={`Download ${rec.output_filename}`}
                      >
                        <Download size={15} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(rec.id)}
                      className={[styles.actionIconBtn, styles.actionIconBtnDanger].join(' ')}
                      title="Delete conversion"
                      aria-label="Delete conversion"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
