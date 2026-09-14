'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon } from 'lucide-react';
import { MAX_IMAGE_CONVERSION_FILE_SIZE_BYTES, MAX_IMAGE_CONVERSION_FILE_SIZE_MB, ACCEPTED_IMAGE_CONVERTER_EXTENSIONS } from '@/lib/constants';
import styles from './image-converter.module.css';

interface ImageUploadZoneProps {
  sourceFormat: string;
  onFileSelected: (file: File) => void;
  onError: (msg: string) => void;
}

export const ImageUploadZone: React.FC<ImageUploadZoneProps> = ({
  sourceFormat,
  onFileSelected,
  onError,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSelect = (file: File) => {
    if (file.size > MAX_IMAGE_CONVERSION_FILE_SIZE_BYTES) {
      onError(
        `File size exceeds the ${MAX_IMAGE_CONVERSION_FILE_SIZE_MB} MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`
      );
      return;
    }

    if (file.size === 0) {
      onError('The selected file is empty.');
      return;
    }

    onFileSelected(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSelect(e.target.files[0]);
    }
  };

  return (
    <div
      className={`${styles.dropzone} ${isDragOver ? styles.dropzoneActive : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => fileInputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          fileInputRef.current?.click();
        }
      }}
      aria-label="Upload your image file"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_IMAGE_CONVERTER_EXTENSIONS}
        onChange={handleInputChange}
        style={{ display: 'none' }}
      />
      <UploadCloud className={styles.dropIcon} />
      <div className={styles.dropText}>Upload your image</div>
      <div className={styles.dropSubtext}>
        Drag & drop or Browse files from your device
      </div>

      <div className={styles.formatBadges}>
        <span className={styles.badge}>Preferred: {sourceFormat.toUpperCase()}</span>
        <span className={styles.badge}>JPG</span>
        <span className={styles.badge}>PNG</span>
        <span className={styles.badge}>WEBP</span>
        <span className={styles.badge}>HEIC</span>
        <span className={styles.badge}>GIF</span>
        <span className={styles.badge}>BMP</span>
        <span className={styles.badge}>TIFF</span>
        <span className={styles.badge}>SVG</span>
        <span className={styles.badge}>Max {MAX_IMAGE_CONVERSION_FILE_SIZE_MB}MB</span>
      </div>
    </div>
  );
};
