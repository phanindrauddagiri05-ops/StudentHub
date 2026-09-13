'use client';

import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';
import styles from './forms.module.css';

interface SummaryFormProps {
  summary: string;
  onChange: (updated: string) => void;
}

export default function SummaryForm({ summary, onChange }: SummaryFormProps) {
  const [open, setOpen] = useState(true);

  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHeader} onClick={() => setOpen(!open)}>
        <div className={styles.headerLeft}>
          <span className={styles.sectionIcon}>
            <FileText size={18} />
          </span>
          <span className={styles.sectionTitle}>Professional Summary</span>
        </div>
        <div className={styles.headerRight}>
          <button type="button" className={styles.collapseBtn} aria-label="Toggle section">
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {open && (
        <div className={styles.sectionBody}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="resume-summary">
              Short Bio / Career Objective
            </label>
            <textarea
              id="resume-summary"
              className={styles.textarea}
              placeholder="Write 2–4 concise sentences highlighting your background, major skills, and the roles you are aiming for..."
              value={summary || ''}
              onChange={(e) => onChange(e.target.value)}
              rows={4}
            />
            <div className={styles.charCount}>
              {summary ? summary.length : 0} characters (ideal: 150–350)
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
