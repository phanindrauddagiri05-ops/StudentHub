'use client';

import React from 'react';
import { AchievementEntry } from '@/lib/resume/types';
import styles from './forms.module.css';

interface AchievementsFormProps {
  achievements: AchievementEntry[];
  onChange: (achievements: AchievementEntry[]) => void;
}

export const AchievementsForm: React.FC<AchievementsFormProps> = ({
  achievements,
  onChange,
}) => {
  const addAchievement = () => {
    const newEntry: AchievementEntry = {
      id: crypto.randomUUID(),
      title: '',
      description: '',
      date: '',
    };
    onChange([...achievements, newEntry]);
  };

  const updateEntry = (id: string, field: keyof AchievementEntry, value: string) => {
    onChange(
      achievements.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
  };

  const removeEntry = (id: string) => {
    onChange(achievements.filter((a) => a.id !== id));
  };

  return (
    <div className={styles.formContainer}>
      <p className={styles.helpText}>
        Share hackathon awards, academic honors, scholarships, coding competitions, or leadership milestones.
      </p>

      {achievements.map((ach, idx) => (
        <div key={ach.id} className={styles.entryCard}>
          <div className={styles.entryHeader}>
            <span className={styles.entryTitle}>
              {ach.title || `Achievement #${idx + 1}`}
            </span>
            <button
              type="button"
              className={styles.deleteButton}
              onClick={() => removeEntry(ach.id)}
              aria-label="Remove achievement"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              Remove
            </button>
          </div>

          <div className={styles.twoColumn}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Achievement Title *</label>
              <input
                type="text"
                className={styles.input}
                placeholder="e.g. 1st Place — National Hackathon 2025"
                value={ach.title}
                onChange={(e) => updateEntry(ach.id, 'title', e.target.value)}
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Date / Year</label>
              <input
                type="text"
                className={styles.input}
                placeholder="e.g. Oct 2025"
                value={ach.date}
                onChange={(e) => updateEntry(ach.id, 'date', e.target.value)}
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Description</label>
            <textarea
              className={styles.textarea}
              placeholder="Competed against 150+ teams; developed an AI accessibility tool..."
              value={ach.description}
              onChange={(e) => updateEntry(ach.id, 'description', e.target.value)}
            />
          </div>
        </div>
      ))}

      <button type="button" className={styles.addButton} onClick={addAchievement}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add Achievement
      </button>
    </div>
  );
};
