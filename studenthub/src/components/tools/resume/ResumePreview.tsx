'use client';

import React, { useState } from 'react';
import { ResumeData, ResumeTemplate } from '@/lib/resume/types';
import { renderResumeTemplate } from '@/lib/resume/templates';
import styles from './ResumePreview.module.css';

interface ResumePreviewProps {
  data: ResumeData;
  template: ResumeTemplate;
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({ data, template }) => {
  const [zoom, setZoom] = useState(85); // 85% default fits nicely on desktop displays

  const zoomIn = () => setZoom((prev) => Math.min(prev + 10, 130));
  const zoomOut = () => setZoom((prev) => Math.max(prev - 10, 50));
  const resetZoom = () => setZoom(85);

  return (
    <div className={styles.previewContainer}>
      <div className={styles.previewToolbar}>
        <div className={styles.leftControls}>
          <span className={styles.badge}>Live A4 Preview</span>
          <span style={{ fontSize: '0.8125rem', color: '#64748b', textTransform: 'capitalize' }}>
            Template: <strong>{template}</strong>
          </span>
        </div>

        <div className={styles.rightControls}>
          <button
            type="button"
            className={styles.zoomButton}
            onClick={zoomOut}
            aria-label="Zoom out"
            title="Zoom out"
          >
            -
          </button>
          <span
            className={styles.zoomLevel}
            onClick={resetZoom}
            style={{ cursor: 'pointer' }}
            title="Click to reset zoom"
          >
            {zoom}%
          </span>
          <button
            type="button"
            className={styles.zoomButton}
            onClick={zoomIn}
            aria-label="Zoom in"
            title="Zoom in"
          >
            +
          </button>
        </div>
      </div>

      <div className={styles.canvasWrapper}>
        <div
          className={styles.a4Sheet}
          style={{
            transform: `scale(${zoom / 100})`,
          }}
        >
          {renderResumeTemplate(data, template)}
        </div>
      </div>
    </div>
  );
};
