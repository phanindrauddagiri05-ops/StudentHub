'use client';

import React from 'react';
import styles from './image-converter.module.css';

interface QualitySliderProps {
  value: number;
  onChange: (val: number) => void;
}

export const QualitySlider: React.FC<QualitySliderProps> = ({ value, onChange }) => {
  return (
    <div className={styles.qualitySection}>
      <div className={styles.qualityHeader}>
        <span>Compression Quality</span>
        <span className={styles.qualityValue}>{value}%</span>
      </div>
      <input
        type="range"
        min={10}
        max={100}
        step={5}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className={styles.qualitySlider}
        aria-label="Image compression quality slider"
      />
      <div className={styles.qualityLabels}>
        <span>Smaller file</span>
        <span>Standard (80%)</span>
        <span>Higher quality</span>
      </div>
    </div>
  );
};
