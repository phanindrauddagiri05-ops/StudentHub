'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { DocumentFormat } from '@/lib/converters/types';
import { getAllSourceFormats, getCompatibleTargets } from '@/lib/converters/registry';
import { getFormatMetadata } from '@/lib/converters/formats';
import styles from './converter.module.css';

interface ConversionSelectorProps {
  sourceFormat: DocumentFormat;
  targetFormat: DocumentFormat;
  onSourceChange: (source: DocumentFormat) => void;
  onTargetChange: (target: DocumentFormat) => void;
  disabled?: boolean;
}

export const ConversionSelector: React.FC<ConversionSelectorProps> = ({
  sourceFormat,
  targetFormat,
  onSourceChange,
  onTargetChange,
  disabled = false,
}) => {
  const sourceFormats = getAllSourceFormats();
  const compatibleTargets = getCompatibleTargets(sourceFormat);

  const handleSourceChange = (newSource: DocumentFormat) => {
    onSourceChange(newSource);
    const newTargets = getCompatibleTargets(newSource);
    if (!newTargets.includes(targetFormat) && newTargets.length > 0) {
      onTargetChange(newTargets[0]);
    }
  };

  return (
    <div className={styles.selectorRow}>
      {/* Source Format */}
      <div className={styles.formatSelectWrapper}>
        <label className={styles.selectLabel} htmlFor="source-format-select">
          Convert From
        </label>
        <select
          id="source-format-select"
          className={styles.formatSelect}
          value={sourceFormat}
          disabled={disabled}
          onChange={(e) => handleSourceChange(e.target.value as DocumentFormat)}
        >
          {sourceFormats.map((fmt) => {
            const meta = getFormatMetadata(fmt);
            return (
              <option key={fmt} value={fmt}>
                {meta.icon} {meta.shortName} ({meta.extension})
              </option>
            );
          })}
        </select>
      </div>

      {/* Center Arrow */}
      <div className={styles.arrowDivider}>
        <ArrowRight size={22} strokeWidth={2.5} />
      </div>

      {/* Target Format */}
      <div className={styles.formatSelectWrapper}>
        <label className={styles.selectLabel} htmlFor="target-format-select">
          Convert To
        </label>
        <select
          id="target-format-select"
          className={styles.formatSelect}
          value={targetFormat}
          disabled={disabled}
          onChange={(e) => onTargetChange(e.target.value as DocumentFormat)}
        >
          {compatibleTargets.map((fmt) => {
            const meta = getFormatMetadata(fmt);
            return (
              <option key={fmt} value={fmt}>
                {meta.icon} {meta.shortName} ({meta.extension})
              </option>
            );
          })}
        </select>
      </div>
    </div>
  );
};
