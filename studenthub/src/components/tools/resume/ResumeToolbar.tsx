'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Loader2, Download, Printer } from 'lucide-react';
import Button from '@/components/ui/Button';
import TemplateSelector from './TemplateSelector';
import type { ResumeTemplate } from '@/lib/resume/types';
import styles from './ResumeToolbar.module.css';

interface ResumeToolbarProps {
  title: string;
  onTitleChange: (newTitle: string) => void;
  template: ResumeTemplate;
  onTemplateChange: (newTemplate: ResumeTemplate) => void;
  saveStatus: 'saved' | 'saving' | 'error';
  onSave?: () => void;
  onExportPdf: () => void;
  exportingPdf: boolean;
  onPrint: () => void;
}

export default function ResumeToolbar({
  title,
  onTitleChange,
  template,
  onTemplateChange,
  saveStatus,
  onSave,
  onExportPdf,
  exportingPdf,
  onPrint,
}: ResumeToolbarProps) {
  return (
    <header className={styles.toolbar}>
      {/* Left: Back & Title */}
      <div className={styles.leftGroup}>
        <Link href="/tools/resume" className={styles.backBtn} id="resume-back-btn">
          <ArrowLeft size={14} /> Back
        </Link>
        <div className={styles.titleInputWrapper}>
          <input
            type="text"
            className={styles.titleInput}
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Untitled Resume"
            title="Click to rename resume"
            aria-label="Resume Title"
          />
        </div>
      </div>

      {/* Center: Template Selector */}
      <div className={styles.centerGroup}>
        <TemplateSelector currentTemplate={template} onSelect={onTemplateChange} />
      </div>

      {/* Right: Autosave Status & Export actions */}
      <div className={styles.rightGroup}>
        <div className={styles.saveStatus}>
          {saveStatus === 'saving' && (
            <span className={styles.saveStatusSaving}>
              <Loader2 size={13} className="spin" style={{ display: 'inline', marginRight: 4 }} />
              Saving...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className={styles.saveStatusSaved}>
              <Check size={13} style={{ display: 'inline', marginRight: 4 }} />
              Saved
            </span>
          )}
          {saveStatus === 'error' && (
            <span className={styles.saveStatusError}>Could not save</span>
          )}
        </div>

        {onSave && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSave}
            title="Save changes immediately"
            id="manual-save-btn"
          >
            Save
          </Button>
        )}

        <Button
          variant="secondary"
          size="sm"
          onClick={onPrint}
          icon={<Printer size={14} />}
          id="print-resume-btn"
          title="Print or Save via Browser Print"
        >
          Print
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={onExportPdf}
          disabled={exportingPdf}
          icon={exportingPdf ? <Loader2 size={14} className="spin" /> : <Download size={14} />}
          id="export-pdf-btn"
        >
          {exportingPdf ? 'Exporting...' : 'Export PDF'}
        </Button>
      </div>
    </header>
  );
}

export { ResumeToolbar };

