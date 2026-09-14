'use client';

import React from 'react';
import { DocumentFormat } from '@/lib/converters/types';
import { getFormatMetadata } from '@/lib/converters/formats';

interface FormatBadgeProps {
  format: DocumentFormat;
  size?: 'sm' | 'md' | 'lg';
}

export const FormatBadge: React.FC<FormatBadgeProps> = ({ format, size = 'md' }) => {
  const meta = getFormatMetadata(format);

  const fontSizes = {
    sm: '10px',
    md: '11.5px',
    lg: '13px',
  };

  const paddings = {
    sm: '2px 6px',
    md: '3px 8px',
    lg: '5px 12px',
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: paddings[size],
        borderRadius: '6px',
        fontSize: fontSizes[size],
        fontWeight: 700,
        backgroundColor: meta.badgeBg,
        color: meta.badgeText,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        lineHeight: 1.2,
      }}
    >
      <span>{meta.icon}</span>
      <span>{meta.format}</span>
    </span>
  );
};
