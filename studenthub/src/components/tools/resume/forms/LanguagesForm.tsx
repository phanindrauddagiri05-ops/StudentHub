'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
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
              className={[styles.iconBtn, styles.deleteBtn].join(' ')}
              onClick={() => removeEntry(lang.id)}
              aria-label="Remove language"
              title="Remove language"
            >
              <Trash2 size={15} />
            </button>
          </div>

          <div className={styles.twoColumn}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Language *</label>
              <input
                type="text"
                className={styles.input}
                placeholder="e.g. English, Hindi, Spanish"
                value={lang.name || ''}
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

      <button type="button" className={styles.addEntryBtn} onClick={addLanguage}>
        <Plus size={14} />
        Add Language
      </button>
    </div>
  );
};
