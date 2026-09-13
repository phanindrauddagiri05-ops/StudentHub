'use client';

import { useCallback, useRef, useState } from 'react';
import { Upload, File as FileIcon, X, GripVertical } from 'lucide-react';
import styles from './PdfUploader.module.css';
import Button from '@/components/ui/Button';
import { validatePdfFile, validateImageFile, formatFileSize, generateId } from '@/lib/pdf';
import type { PdfFile } from '@/types';

interface PdfUploaderProps {
  files: PdfFile[];
  onFilesChange: (files: PdfFile[]) => void;
  accept?: 'pdf' | 'image' | 'both';
  multiple?: boolean;
  maxFiles?: number;
  label?: string;
  hint?: string;
}

export default function PdfUploader({
  files,
  onFilesChange,
  accept = 'pdf',
  multiple = true,
  maxFiles = 20,
  label = 'Drop files here',
  hint,
}: PdfUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const acceptStr =
    accept === 'pdf'
      ? 'application/pdf'
      : accept === 'image'
      ? 'image/jpeg,image/png,image/webp'
      : 'application/pdf,image/jpeg,image/png,image/webp';

  const validateFile = useCallback(
    (file: File) => {
      if (accept === 'pdf') return validatePdfFile(file);
      if (accept === 'image') return validateImageFile(file);
      const pdfResult = validatePdfFile(file);
      const imgResult = validateImageFile(file);
      return pdfResult.valid ? pdfResult : imgResult;
    },
    [accept]
  );

  const processFiles = useCallback(
    (rawFiles: FileList | null) => {
      if (!rawFiles) return;
      setError(null);

      const newFiles: PdfFile[] = [];
      const errors: string[] = [];

      Array.from(rawFiles).forEach((file) => {
        if (files.length + newFiles.length >= maxFiles) {
          errors.push(`Maximum ${maxFiles} files allowed.`);
          return;
        }
        const validation = validateFile(file);
        if (!validation.valid) {
          errors.push(`${file.name}: ${validation.error}`);
          return;
        }
        newFiles.push({
          id: generateId(),
          file,
          name: file.name,
          size: file.size,
        });
      });

      if (errors.length) setError(errors[0]);
      if (newFiles.length) {
        onFilesChange(multiple ? [...files, ...newFiles] : newFiles);
      }
    },
    [files, maxFiles, multiple, onFilesChange, validateFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  const handleRemove = (id: string) => {
    onFilesChange(files.filter((f) => f.id !== id));
  };

  const defaultHint =
    accept === 'pdf'
      ? `PDF files only · Max ${Math.round(50)} MB each`
      : accept === 'image'
      ? 'JPG, PNG, WEBP · Max 20 MB each'
      : 'PDF or image files';

  return (
    <div className={styles.wrapper}>
      {/* Drop zone */}
      <div
        className={[styles.dropzone, isDragging ? styles.dragging : '', files.length ? styles.hasFiles : ''].join(' ')}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
        aria-label="Upload files"
        id="pdf-upload-zone"
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptStr}
          multiple={multiple}
          className={styles.hiddenInput}
          onChange={(e) => processFiles(e.target.files)}
          id="pdf-file-input"
        />

        <div className={styles.dropContent}>
          <div className={styles.uploadIcon}>
            <Upload size={28} />
          </div>
          <p className={styles.dropLabel}>{label}</p>
          <p className={styles.dropOr}>or</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
            id="choose-files-btn"
          >
            Choose Files
          </Button>
          <p className={styles.dropHint}>{hint ?? defaultHint}</p>
        </div>
      </div>

      {/* Error */}
      {error && <p className={styles.error}>{error}</p>}

      {/* File list */}
      {files.length > 0 && (
        <ul className={styles.fileList} aria-label="Uploaded files">
          {files.map((pdfFile, index) => (
            <li key={pdfFile.id} className={styles.fileItem}>
              <span className={styles.fileIndex}>{index + 1}</span>
              <div className={styles.fileIcon}>
                <FileIcon size={18} />
              </div>
              <div className={styles.fileInfo}>
                <span className={styles.fileName}>{pdfFile.name}</span>
                <span className={styles.fileSize}>{formatFileSize(pdfFile.size)}</span>
              </div>
              <button
                className={styles.removeBtn}
                onClick={() => handleRemove(pdfFile.id)}
                aria-label={`Remove ${pdfFile.name}`}
                id={`remove-file-${pdfFile.id}`}
              >
                <X size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
