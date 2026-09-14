'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  History,
  RotateCcw,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { DocumentFormat, ConversionRecord } from '@/lib/converters/types';
import {
  getConversion,
  getCompatibleTargets,
  getImageSourceFormats,
  isImageFormat,
} from '@/lib/converters/registry';
import { getFormatMetadata, detectFormatFromFilename } from '@/lib/converters/formats';
import { convertDocument } from '@/lib/converters/conversion.service';
import { ImageUploadZone } from './ImageUploadZone';
import { ImagePreviewCard } from './ImagePreviewCard';
import { QualitySlider } from './QualitySlider';
import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { formatFileSize } from '@/lib/pdf';
import styles from './image-converter.module.css';

export const ImageConverter: React.FC = () => {
  const { user } = useAuth();

  const [sourceFormat, setSourceFormat] = useState<DocumentFormat>('png');
  const [targetFormat, setTargetFormat] = useState<DocumentFormat>('jpg');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [quality, setQuality] = useState<number>(80);

  const [status, setStatus] = useState<'idle' | 'converting' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [result, setResult] = useState<{ record: ConversionRecord; downloadUrl: string } | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState('');

  const sourceFormats = getImageSourceFormats();
  const compatibleTargets = getCompatibleTargets(sourceFormat).filter((fmt) => isImageFormat(fmt));

  const handleSourceChange = (newSource: DocumentFormat) => {
    setSourceFormat(newSource);
    const newTargets = getCompatibleTargets(newSource).filter((fmt) => isImageFormat(fmt));
    if (!newTargets.includes(targetFormat)) {
      setTargetFormat(newTargets[0] || 'jpg');
    }
    setStatus('idle');
    setResult(null);
    setErrorMessage('');
  };

  const handleTargetChange = (newTarget: DocumentFormat) => {
    setTargetFormat(newTarget);
    setStatus('idle');
    setResult(null);
    setErrorMessage('');
  };

  const handleFileSelect = (file: File) => {
    const detected = detectFormatFromFilename(file.name);
    if (detected && isImageFormat(detected)) {
      if (detected !== sourceFormat) {
        setSourceFormat(detected);
        const targets = getCompatibleTargets(detected).filter((fmt) => isImageFormat(fmt));
        if (!targets.includes(targetFormat)) {
          setTargetFormat(targets[0] || (detected === 'jpg' ? 'png' : 'jpg'));
        }
      }
    }
    setSelectedFile(file);
    setStatus('idle');
    setResult(null);
    setErrorMessage('');
  };

  const handleConvert = async () => {
    if (!selectedFile) return;

    setStatus('converting');
    setProgress(15);
    setProgressText('Preparing image conversion...');
    setErrorMessage('');

    try {
      const convResult = await convertDocument({
        file: selectedFile,
        sourceFormat,
        targetFormat,
        userId: user?.id,
        quality: ['jpg', 'webp'].includes(targetFormat) ? quality : undefined,
        onProgress: (p, text) => {
          setProgress(p);
          setProgressText(text);
        },
      });

      setResult(convResult);
      setStatus('success');
    } catch (err: unknown) {
      console.error('Image conversion error:', err);
      const msg =
        err instanceof Error ? err.message : 'An unexpected error occurred during image conversion.';
      setErrorMessage(msg);
      setStatus('error');
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setSelectedFile(null);
    setResult(null);
    setErrorMessage('');
    setProgress(0);
  };

  const targetMeta = getFormatMetadata(targetFormat);
  const showQualitySlider = ['jpg', 'webp'].includes(targetFormat);

  return (
    <div className={styles.container}>
      {/* Breadcrumb Navigation */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/dashboard">Dashboard</Link>
        <span>/</span>
        <Link href="/tools">Tools</Link>
        <span>/</span>
        <span style={{ color: 'var(--text-primary, #0f172a)', fontWeight: 600 }}>
          Image Converters
        </span>
      </nav>

      {/* Header Section */}
      <header className={styles.headerSection}>
        <h1 className={styles.title}>
          <span className={styles.titleIcon}>🖼️</span>
          Image Converters
        </h1>
        <p className={styles.subtitle}>
          Convert your images to popular formats quickly and securely in your browser and on server.
        </p>
      </header>

      {/* Main Converter Card */}
      <div className={styles.converterCard}>
        {/* Format Selectors */}
        <div className={styles.selectorRow}>
          <div className={styles.selectorGroup}>
            <label htmlFor="source-format-select" className={styles.selectorLabel}>
              Convert from
            </label>
            <select
              id="source-format-select"
              value={sourceFormat}
              onChange={(e) => handleSourceChange(e.target.value as DocumentFormat)}
              className={styles.formatSelect}
              disabled={status === 'converting'}
            >
              {sourceFormats.map((fmt) => (
                <option key={fmt} value={fmt}>
                  {fmt.toUpperCase()} ({getFormatMetadata(fmt).shortName})
                </option>
              ))}
            </select>
          </div>

          <div className={styles.arrowDivider} aria-hidden="true">
            <ArrowRight size={24} />
          </div>

          <div className={styles.selectorGroup}>
            <label htmlFor="target-format-select" className={styles.selectorLabel}>
              to
            </label>
            <select
              id="target-format-select"
              value={targetFormat}
              onChange={(e) => handleTargetChange(e.target.value as DocumentFormat)}
              className={styles.formatSelect}
              disabled={status === 'converting'}
            >
              {compatibleTargets.map((fmt) => (
                <option key={fmt} value={fmt}>
                  {fmt.toUpperCase()} ({getFormatMetadata(fmt).shortName})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic State Views */}
        {status === 'converting' ? (
          <div className={styles.progressCard}>
            <div className={styles.spinner} />
            <div className={styles.statusText}>Converting image...</div>
            <div className={styles.statusSubtext}>
              {progressText || 'Processing pixels and encoding target format...'}
            </div>
            <div className={styles.shimmerBar} />
          </div>
        ) : status === 'success' && result ? (
          <div className={styles.successCard}>
            <div className={styles.checkIconContainer}>
              <CheckCircle2 size={36} />
            </div>
            <h2 className={styles.successTitle}>Conversion Complete!</h2>
            <div className={styles.successDetails}>
              <strong>{result.record.output_filename}</strong>
              <div style={{ marginTop: '0.25rem', color: '#64748b', fontSize: '0.875rem' }}>
                Original: {selectedFile ? formatFileSize(selectedFile.size) : 'N/A'} • Output:{' '}
                {formatFileSize(result.record.output_file_size)}
              </div>
            </div>

            <div className={styles.actionsRow}>
              <a
                href={result.downloadUrl}
                download={result.record.output_filename}
                style={{ textDecoration: 'none' }}
              >
                <Button variant="primary" size="lg">
                  <Download size={18} />
                  Download {targetFormat.toUpperCase()}
                </Button>
              </a>

              <Button variant="outline" size="lg" onClick={handleReset}>
                <RotateCcw size={18} />
                Convert Another
              </Button>

              <Link href="/history" style={{ textDecoration: 'none' }}>
                <Button variant="ghost" size="lg">
                  <History size={18} />
                  View History
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {errorMessage && (
              <div className={styles.errorCard} role="alert">
                <AlertCircle className={styles.errorIcon} size={20} />
                <div>
                  <div className={styles.errorHeading}>Conversion Failed</div>
                  <div className={styles.errorMessage}>{errorMessage}</div>
                </div>
              </div>
            )}

            {!selectedFile ? (
              <ImageUploadZone
                sourceFormat={sourceFormat}
                onFileSelected={handleFileSelect}
                onError={(err) => setErrorMessage(err)}
              />
            ) : (
              <>
                <ImagePreviewCard
                  file={selectedFile}
                  sourceFormat={sourceFormat}
                  targetFormat={targetFormat}
                  onRemove={handleReset}
                  onConvert={handleConvert}
                  converting={false}
                />

                {showQualitySlider && (
                  <QualitySlider value={quality} onChange={setQuality} />
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Feature Highlights Footer Banner */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
          marginTop: '1rem',
        }}
      >
        <div
          style={{
            padding: '1.25rem',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '0.875rem',
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: '0.25rem', color: '#0f172a' }}>
            📱 Mobile HEIC Support
          </div>
          <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
            Seamlessly convert Apple iPhone HEIC and HEIF photos into universal JPG and PNG files.
          </div>
        </div>

        <div
          style={{
            padding: '1.25rem',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '0.875rem',
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: '0.25rem', color: '#0f172a' }}>
            🎨 Clean Transparency
          </div>
          <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
            Converting transparent PNG and SVG into JPG automatically blends onto clean white
            backgrounds without black boxes.
          </div>
        </div>

        <div
          style={{
            padding: '1.25rem',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '0.875rem',
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: '0.25rem', color: '#0f172a' }}>
            🔒 Privacy & Dimension Safe
          </div>
          <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
            Sensitive EXIF GPS and camera serial metadata are stripped by default, with protection
            against pixel bomb attacks.
          </div>
        </div>
      </div>
    </div>
  );
};
