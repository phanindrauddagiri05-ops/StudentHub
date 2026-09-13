'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
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
              className={[styles.iconBtn, styles.deleteBtn].join(' ')}
              onClick={() => removeEntry(ach.id)}
              aria-label="Remove achievement"
              title="Remove achievement"
            >
              <Trash2 size={15} />
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

      <button type="button" className={styles.addEntryBtn} onClick={addAchievement}>
        <Plus size={14} />
        Add Achievement
      </button>
    </div>
  );
};
