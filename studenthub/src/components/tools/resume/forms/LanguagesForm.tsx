'use client';

import React from 'react';
import { LanguageEntry } from '@/lib/resume/types';
import styles from './forms.module.css';

interface LanguagesFormProps {
  languages: LanguageEntry[];
  onChange: (languages: LanguageEntry[]) => void;
}

export const LanguagesForm: React.FC<LanguagesFormProps> = ({ languages, onChange }) => {
  const addLanguage = () => {
    const newEntry: LanguageEntry = {
      id: crypto.randomUUID(),
      name: '',
      proficiency: 'Fluent',
    };
    onChange([...languages, newEntry]);
  };

  const updateEntry = (id: string, field: keyof LanguageEntry, value: string) => {
    onChange(
      languages.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );
  };

  const removeEntry = (id: string) => {
    onChange(languages.filter((l) => l.id !== id));
  };

  return (
    <div className={styles.formContainer}>
      <p className={styles.helpText}>
        List languages and your level of spoken/written proficiency.
      </p>

      {languages.map((lang, idx) => (
        <div key={lang.id} className={styles.entryCard}>
          <div className={styles.entryHeader}>
            <span className={styles.entryTitle}>
              {lang.name ? `${lang.name} (${lang.proficiency})` : `Language #${idx + 1}`}
            </span>
            <button
              type="button"
              className={styles.deleteButton}
              onClick={() => removeEntry(lang.id)}
              aria-label="Remove language"
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
              <label className={styles.label}>Language *</label>
              <input
                type="text"
                className={styles.input}
                placeholder="e.g. English, Hindi, Spanish"
                value={lang.name}
                onChange={(e) => updateEntry(lang.id, 'name', e.target.value)}
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Proficiency</label>
              <select
                className={styles.select}
                value={lang.proficiency}
                onChange={(e) => updateEntry(lang.id, 'proficiency', e.target.value)}
              >
                <option value="Native">Native / Bilingual</option>
                <option value="Fluent">Fluent</option>
                <option value="Professional">Professional Working</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Basic">Basic / Elementary</option>
              </select>
            </div>
          </div>
        </div>
      ))}

      <button type="button" className={styles.addButton} onClick={addLanguage}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add Language
      </button>
    </div>
  );
};
