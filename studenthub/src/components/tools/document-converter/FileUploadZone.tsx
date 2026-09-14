'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { DocumentFormat } from '@/lib/converters/types';
import { getFormatMetadata } from '@/lib/converters/formats';
import { MAX_DOCUMENT_CONVERSION_FILE_SIZE_MB } from '@/lib/constants';
import styles from './converter.module.css';

interface FileUploadZoneProps {
  sourceFormat: DocumentFormat;
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  sourceFormat,
  onFileSelect,
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const meta = getFormatMetadata(sourceFormat);

  // Compute accepted types with sibling family formats (e.g. doc & docx, xls & xlsx, ppt & pptx)
  const acceptedExtensions = [meta.extension];
  const acceptedMimes = [...meta.mimeTypes];

  if (sourceFormat === 'docx' || sourceFormat === 'doc') {
    acceptedExtensions.push('.doc', '.docx');
    acceptedMimes.push(
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
  } else if (sourceFormat === 'xlsx' || sourceFormat === 'xls') {
    acceptedExtensions.push('.xls', '.xlsx');
    acceptedMimes.push(
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
  } else if (sourceFormat === 'pptx' || sourceFormat === 'ppt') {
    acceptedExtensions.push('.ppt', '.pptx');
    acceptedMimes.push(
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    );
  }

  const acceptAttribute = Array.from(new Set([...acceptedMimes, ...acceptedExtensions])).join(',');

  const formatDisplayLabel =
    sourceFormat === 'docx' || sourceFormat === 'doc'
      ? 'Word (.docx, .doc)'
      : sourceFormat === 'xlsx' || sourceFormat === 'xls'
      ? 'Excel (.xlsx, .xls)'
      : sourceFormat === 'pptx' || sourceFormat === 'ppt'
      ? 'PowerPoint (.pptx, .ppt)'
      : `${meta.shortName} (${meta.extension})`;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div
      className={[styles.dropZone, isDragOver ? styles.dropZoneActive : ''].join(' ')}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      role="button"
      tabIndex={0}
      aria-label={`Upload ${meta.shortName} document`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={acceptAttribute}
        onChange={handleInputChange}
        style={{ display: 'none' }}
        disabled={disabled}
      />

      <div className={styles.dropZoneIcon}>
        <UploadCloud size={28} />
      </div>

      <div>
        <div className={styles.dropZoneHeading}>Upload your file</div>
        <div className={styles.dropZoneSubheading}>
          Drag &amp; drop your document here, or <span style={{ color: 'var(--color-primary-600)', textDecoration: 'underline' }}>Browse</span>
        </div>
      </div>

      <div className={styles.dropZoneMeta}>
        Supported format: <strong>{formatDisplayLabel}</strong> • Maximum file size: <strong>{MAX_DOCUMENT_CONVERSION_FILE_SIZE_MB} MB</strong>
      </div>
    </div>
  );
};
