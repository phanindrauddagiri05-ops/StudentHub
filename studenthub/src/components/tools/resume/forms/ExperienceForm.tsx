'use client';

import React, { useState } from 'react';
import { Briefcase, ChevronDown, ChevronUp, Plus, Trash2, X } from 'lucide-react';
import type { ExperienceEntry } from '@/lib/resume/types';
import styles from './forms.module.css';

interface ExperienceFormProps {
  entries: ExperienceEntry[];
  onChange: (updated: ExperienceEntry[]) => void;
}

export default function ExperienceForm({ entries, onChange }: ExperienceFormProps) {
  const [open, setOpen] = useState(true);

  const addEntry = () => {
    const newEntry: ExperienceEntry = {
      id: `exp-${Date.now()}`,
      company: '',
      jobTitle: '',
      location: '',
      startDate: '',
      endDate: '',
      currentlyWorking: false,
      bullets: [''],
    };
    onChange([...entries, newEntry]);
    setOpen(true);
  };

  const updateEntry = (id: string, updates: Partial<ExperienceEntry>) => {
    onChange(
      entries.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const removeEntry = (id: string) => {
    onChange(entries.filter((item) => item.id !== id));
  };

  const updateBullet = (entryId: string, bulletIdx: number, value: string) => {
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) return;
    const newBullets = [...entry.bullets];
    newBullets[bulletIdx] = value;
    updateEntry(entryId, { bullets: newBullets });
  };

  const addBullet = (entryId: string) => {
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) return;
    updateEntry(entryId, { bullets: [...entry.bullets, ''] });
  };

  const removeBullet = (entryId: string, bulletIdx: number) => {
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) return;
    const newBullets = entry.bullets.filter((_, i) => i !== bulletIdx);
    updateEntry(entryId, { bullets: newBullets.length ? newBullets : [''] });
  };

  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHeader} onClick={() => setOpen(!open)}>
        <div className={styles.headerLeft}>
          <span className={styles.sectionIcon}>
            <Briefcase size={18} />
          </span>
          <span className={styles.sectionTitle}>Experience & Internships</span>
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
                    #{index + 1} {entry.jobTitle || 'Role'} at {entry.company || 'Company'}
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
                    <label className={styles.label}>Job Title / Role</label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="e.g. Software Engineering Intern"
                      value={entry.jobTitle || ''}
                      onChange={(e) => updateEntry(entry.id, { jobTitle: e.target.value })}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Company / Organization</label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="e.g. Google / Tech Labs"
                      value={entry.company || ''}
                      onChange={(e) => updateEntry(entry.id, { company: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.formGrid3}>
                  <div className={styles.field}>
                    <label className={styles.label}>Location</label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="e.g. Remote or New York, NY"
                      value={entry.location || ''}
                      onChange={(e) => updateEntry(entry.id, { location: e.target.value })}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Start Date</label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="e.g. Jun 2024"
                      value={entry.startDate || ''}
                      onChange={(e) => updateEntry(entry.id, { startDate: e.target.value })}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>End Date</label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="e.g. Aug 2024 or Present"
                      disabled={entry.currentlyWorking}
                      value={entry.currentlyWorking ? 'Present' : entry.endDate || ''}
                      onChange={(e) => updateEntry(entry.id, { endDate: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '2px 0 6px' }}>
                  <input
                    type="checkbox"
                    id={`cur-${entry.id}`}
                    checked={Boolean(entry.currentlyWorking)}
                    onChange={(e) => updateEntry(entry.id, { currentlyWorking: e.target.checked })}
                  />
                  <label htmlFor={`cur-${entry.id}`} style={{ fontSize: 12, color: 'var(--color-gray-600)', cursor: 'pointer' }}>
                    I am currently working in this role
                  </label>
                </div>

                {/* Bullets */}
                <div className={styles.bulletsContainer}>
                  <label className={styles.label}>Key Responsibilities & Impact (Bullet Points)</label>
                  {entry.bullets.map((bullet, bIdx) => (
                    <div key={bIdx} className={styles.bulletRow}>
                      <span style={{ color: 'var(--color-gray-400)', fontSize: 12 }}>•</span>
                      <input
                        type="text"
                        className={styles.bulletInput}
                        placeholder="e.g. Developed features that improved page load by 35%..."
                        value={bullet}
                        onChange={(e) => updateBullet(entry.id, bIdx, e.target.value)}
                      />
                      {entry.bullets.length > 1 && (
                        <button
                          type="button"
                          className={styles.iconBtn}
                          onClick={() => removeBullet(entry.id, bIdx)}
                          title="Remove bullet"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className={styles.addBulletBtn}
                    onClick={() => addBullet(entry.id)}
                  >
                    + Add bullet point
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button type="button" className={styles.addEntryBtn} onClick={addEntry} id="add-experience-btn">
            <Plus size={14} /> Add Experience
          </button>
        </div>
      )}
    </div>
  );
}
