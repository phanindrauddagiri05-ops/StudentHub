'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import styles from './forms.module.css';

interface InterestsFormProps {
  interests: string[];
  onChange: (interests: string[]) => void;
}

export const InterestsForm: React.FC<InterestsFormProps> = ({ interests, onChange }) => {
  const [inputVal, setInputVal] = useState('');

  const addInterest = (val: string) => {
    const trimmed = val.trim();
    if (trimmed && !interests.includes(trimmed)) {
      onChange([...interests, trimmed]);
    }
    setInputVal('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addInterest(inputVal);
    }
  };

  const removeInterest = (item: string) => {
    onChange(interests.filter((i) => i !== item));
  };

  const suggestions = [
    'Open Source',
    'Competitive Programming',
    'Robotics',
    'Machine Learning',
    'Tech Blogging',
    'Chess',
    'Hackathons',
    'UI/UX Design',
    'Podcasting',
  ];

  return (
    <div className={styles.formContainer}>
      <p className={styles.helpText}>
        Share personal interests or activities that demonstrate passion, curiosity, or teamwork.
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center' }}>
        <input
          type="text"
          className={styles.input}
          placeholder="e.g. Open Source, Chess, Robotics..."
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          className={styles.inlineAddBtn}
          onClick={() => addInterest(inputVal)}
        >
          <Plus size={14} /> Add
        </button>
      </div>

      <div className={styles.chipContainer}>
        {interests.map((item) => (
          <span key={item} className={styles.chip}>
            {item}
            <button
              type="button"
              className={styles.chipRemove}
              onClick={() => removeInterest(item)}
              aria-label={`Remove ${item}`}
            >
              ×
            </button>
          </span>
        ))}
        {interests.length === 0 && (
          <span style={{ fontSize: '0.875rem', color: '#94a3b8', fontStyle: 'italic' }}>
            No interests added yet.
          </span>
        )}
      </div>

      <div style={{ marginTop: '1.25rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Suggested Interests
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.5rem' }}>
          {suggestions
            .filter((s) => !interests.includes(s))
            .map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => addInterest(s)}
                className={styles.suggestionPill}
              >
                + {s}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
};
