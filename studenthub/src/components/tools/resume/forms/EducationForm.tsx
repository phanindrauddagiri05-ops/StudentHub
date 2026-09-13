'use client';

import React, { useState } from 'react';
import { GraduationCap, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import type { EducationEntry } from '@/lib/resume/types';
import styles from './forms.module.css';

interface EducationFormProps {
  entries: EducationEntry[];
  onChange: (updated: EducationEntry[]) => void;
}

export default function EducationForm({ entries, onChange }: EducationFormProps) {
  const [open, setOpen] = useState(true);

  const addEntry = () => {
    const newEntry: EducationEntry = {
      id: `edu-${Date.now()}`,
      institution: '',
      degree: '',
      fieldOfStudy: '',
      startDate: '',
      endDate: '',
      grade: '',
      description: '',
    };
    onChange([...entries, newEntry]);
    setOpen(true);
  };

  const updateEntry = (id: string, field: keyof EducationEntry, value: string) => {
    onChange(
      entries.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const removeEntry = (id: string) => {
    onChange(entries.filter((item) => item.id !== id));
  };

  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHeader} onClick={() => setOpen(!open)}>
        <div className={styles.headerLeft}>
          <span className={styles.sectionIcon}>
            <GraduationCap size={18} />
          </span>
          <span className={styles.sectionTitle}>Education</span>
          <span className={styles.itemCountBadge}>{entries.length}</span>
        </div>
        <div className={styles.headerRight}>
          <button type="button" className={styles.collapseBtn} aria-label="Toggle section">
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {open && (
        <div className={styles.sectionBody}>
          <div className={styles.entriesList}>
            {entries.map((entry, index) => (
              <div key={entry.id} className={styles.entryCard}>
                <div className={styles.entryHeader}>
                  <span className={styles.entryTitle}>
                    #{index + 1} {entry.institution || 'New Education'}
                  </span>
                  <div className={styles.entryActions}>
                    <button
                      type="button"
                      className={[styles.iconBtn, styles.deleteBtn].join(' ')}
                      onClick={() => removeEntry(entry.id)}
                      title="Delete entry"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.field}>
                    <label className={styles.label}>College / Institution</label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="e.g. Stanford University"
                      value={entry.institution || ''}
                      onChange={(e) => updateEntry(entry.id, 'institution', e.target.value)}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Degree</label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="e.g. B.Tech / Bachelor of Science"
                      value={entry.degree || ''}
                      onChange={(e) => updateEntry(entry.id, 'degree', e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.formGrid3}>
                  <div className={styles.field}>
                    <label className={styles.label}>Field of Study</label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="e.g. Computer Science"
                      value={entry.fieldOfStudy || ''}
                      onChange={(e) => updateEntry(entry.id, 'fieldOfStudy', e.target.value)}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Start Year</label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="e.g. 2022"
                      value={entry.startDate || ''}
                      onChange={(e) => updateEntry(entry.id, 'startDate', e.target.value)}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>End Year</label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="e.g. 2026 (or Present)"
                      value={entry.endDate || ''}
                      onChange={(e) => updateEntry(entry.id, 'endDate', e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Grade / CGPA (Optional)</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="e.g. 3.8 / 4.0 or 8.9 CGPA"
                    value={entry.grade || ''}
                    onChange={(e) => updateEntry(entry.id, 'grade', e.target.value)}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Description / Honors (Optional)</label>
                  <textarea
                    className={styles.textarea}
                    placeholder="e.g. Relevant Coursework: Data Structures, Machine Learning. Dean's Honor Roll."
                    value={entry.description || ''}
                    onChange={(e) => updateEntry(entry.id, 'description', e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </div>

          <button type="button" className={styles.addEntryBtn} onClick={addEntry} id="add-education-btn">
            <Plus size={14} /> Add Education
          </button>
        </div>
      )}
    </div>
  );
}
