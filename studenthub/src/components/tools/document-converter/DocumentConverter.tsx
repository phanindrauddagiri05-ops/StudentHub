'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, History, Layers } from 'lucide-react';
import { DocumentFormat, ConversionRecord } from '@/lib/converters/types';
import { getConversion } from '@/lib/converters/registry';
import { getFormatMetadata, detectFormatFromFilename } from '@/lib/converters/formats';
import { convertDocument } from '@/lib/converters/conversion.service';
import { ConversionSelector } from './ConversionSelector';
import { FileUploadZone } from './FileUploadZone';
import { SelectedFile } from './SelectedFile';
import { ConversionProgress } from './ConversionProgress';
import { ConversionSuccess } from './ConversionSuccess';
import { ConversionError } from './ConversionError';
import { ConversionCardsGrid } from './ConversionCardsGrid';
import { ConversionHistory } from './ConversionHistory';
import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import styles from './converter.module.css';

export const DocumentConverter: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'convert' | 'history'>('convert');

  const [sourceFormat, setSourceFormat] = useState<DocumentFormat>('pdf');
  const [targetFormat, setTargetFormat] = useState<DocumentFormat>('docx');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [status, setStatus] = useState<'idle' | 'converting' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [result, setResult] = useState<{ record: ConversionRecord; downloadUrl: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const currentDefinition = getConversion(sourceFormat, targetFormat);
  const targetMeta = getFormatMetadata(targetFormat);

  const handleSelectPair = (source: DocumentFormat, target: DocumentFormat) => {
    setSourceFormat(source);
    setTargetFormat(target);
    setStatus('idle');
    setSelectedFile(null);
    setResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFileSelect = (file: File) => {
    const detected = detectFormatFromFilename(file.name);
    if (detected) {
      if ((detected === 'doc' || detected === 'docx') && (sourceFormat === 'doc' || sourceFormat === 'docx')) {
        setSourceFormat(detected);
      } else if ((detected === 'xls' || detected === 'xlsx') && (sourceFormat === 'xls' || sourceFormat === 'xlsx')) {
        setSourceFormat(detected);
      } else if ((detected === 'ppt' || detected === 'pptx') && (sourceFormat === 'ppt' || sourceFormat === 'pptx')) {
        setSourceFormat(detected);
      } else if (detected !== sourceFormat) {
        const candidateDef = getConversion(detected, targetFormat);
        if (candidateDef && candidateDef.available) {
          setSourceFormat(detected);
        }
      }
    }
    setSelectedFile(file);
    setStatus('idle');
    setResult(null);
  };

  const handleConvert = async () => {
    if (!selectedFile) return;

    setStatus('converting');
    setProgress(10);
    setProgressText('Preparing document...');
    setErrorMessage('');

    try {
      const convResult = await convertDocument({
        file: selectedFile,
        sourceFormat,
        targetFormat,
        userId: user?.id,
        onProgress: (p, text) => {
          setProgress(p);
          setProgressText(text);
        },
      });

      setResult(convResult);
      setStatus('success');
    } catch (err: unknown) {
      console.error('Conversion error:', err);
      const msg = err instanceof Error ? err.message : 'Conversion failed.';
      setErrorMessage(msg);
      setStatus('error');
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setSelectedFile(null);
    setResult(null);
    setProgress(0);
    setErrorMessage('');
  };

  return (
    <div className={styles.container}>
      {/* Top Header */}
      <div className={styles.header}>
        <div className={styles.topBar}>
          <Link href="/tools" className={styles.backLink} id="back-to-tools-link">
            <ArrowLeft size={16} />
            Back to Tools
          </Link>
        </div>

        <h1 className={styles.title}>Document Converters</h1>
        <p className={styles.subtitle}>
          Convert documents between popular file formats quickly and securely.
        </p>

        {/* Navigation Tabs */}
        <div className={styles.tabsContainer}>
          <button
            type="button"
            className={[styles.tabBtn, activeTab === 'convert' ? styles.tabBtnActive : ''].join(' ')}
            onClick={() => setActiveTab('convert')}
            id="tab-convert"
          >
            <Layers size={16} />
            Convert Documents
          </button>
          <button
            type="button"
            className={[styles.tabBtn, activeTab === 'history' ? styles.tabBtnActive : ''].join(' ')}
            onClick={() => setActiveTab('history')}
            id="tab-history"
          >
            <History size={16} />
            Conversion History
          </button>
        </div>
      </div>

      {activeTab === 'history' ? (
        <ConversionHistory userId={user?.id} />
      ) : (
        <>
          {/* Main Conversion Card */}
          <div className={styles.workspaceCard}>
            {/* Conversion Selector Row */}
            <ConversionSelector
              sourceFormat={sourceFormat}
              targetFormat={targetFormat}
              onSourceChange={setSourceFormat}
              onTargetChange={setTargetFormat}
              disabled={status === 'converting'}
            />

            {/* Availability Alert if unavailable */}
            {currentDefinition && !currentDefinition.available && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fef3c7',
                  color: '#92400e',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>⚠️</span>
                <span>
                  <strong>Coming Soon:</strong> {currentDefinition.comingSoonReason || 'This conversion is in active development.'}
                </span>
              </div>
            )}

            {/* Interactive Workspace Area */}
            {status === 'converting' && (
              <ConversionProgress progress={progress} stageText={progressText} />
            )}

            {status === 'success' && result && (
              <ConversionSuccess
                record={result.record}
                downloadUrl={result.downloadUrl}
                onReset={handleReset}
              />
            )}

            {status === 'error' && (
              <ConversionError
                message={errorMessage}
                onRetry={handleConvert}
                onChooseAnotherFile={handleReset}
              />
            )}

            {status === 'idle' && (
              <>
                {!selectedFile ? (
                  <FileUploadZone
                    sourceFormat={sourceFormat}
                    onFileSelect={handleFileSelect}
                    disabled={currentDefinition ? !currentDefinition.available : false}
                  />
                ) : (
                  <>
                    <SelectedFile
                      file={selectedFile}
                      sourceFormat={sourceFormat}
                      targetFormat={targetFormat}
                      onRemove={() => setSelectedFile(null)}
                    />

                    <div className={styles.actionBtnRow}>
                      <Button
                        variant="primary"
                        size="lg"
                        onClick={handleConvert}
                        disabled={currentDefinition ? !currentDefinition.available : false}
                        id="convert-document-btn"
                      >
                        Convert to {targetMeta.shortName}
                        <ArrowRight size={18} />
                      </Button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* Preset Cards & Category Explorer */}
          <ConversionCardsGrid onSelectPair={handleSelectPair} />
        </>
      )}
    </div>
  );
};
