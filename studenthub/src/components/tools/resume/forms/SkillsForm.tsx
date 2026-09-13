'use client';

import React, { useState } from 'react';
import styles from './forms.module.css';

interface SkillsFormProps {
  skills: string[];
  onChange: (skills: string[]) => void;
}

export const SkillsForm: React.FC<SkillsFormProps> = ({ skills, onChange }) => {
  const [inputVal, setInputVal] = useState('');

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      onChange([...skills, trimmed]);
    }
    setInputVal('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill(inputVal);
    }
  };

  const removeSkill = (skillToRemove: string) => {
    onChange(skills.filter((s) => s !== skillToRemove));
  };

  const suggestions = [
    'JavaScript',
    'TypeScript',
    'React',
    'Node.js',
    'Python',
    'SQL',
    'Git',
    'Next.js',
    'Data Structures',
    'Java',
    'C++',
    'Figma',
    'REST APIs',
    'TailwindCSS',
    'PostgreSQL',
  ];

  return (
    <div className={styles.formContainer}>
      <p className={styles.helpText}>
        Add key skills relevant to your target role. Type a skill and press <strong>Enter</strong> or comma to add.
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input
          type="text"
          className={styles.input}
          placeholder="e.g. React, Python, Git..."
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          className={styles.addButton}
          style={{ width: 'auto', padding: '0 1.25rem' }}
          onClick={() => addSkill(inputVal)}
        >
          Add
        </button>
      </div>

      <div className={styles.chipContainer}>
        {skills.map((skill) => (
          <span key={skill} className={styles.chip}>
            {skill}
            <button
              type="button"
              className={styles.chipRemove}
              onClick={() => removeSkill(skill)}
              aria-label={`Remove ${skill}`}
            >
              ×
            </button>
          </span>
        ))}
        {skills.length === 0 && (
          <span style={{ fontSize: '0.875rem', color: '#94a3b8', fontStyle: 'italic' }}>
            No skills added yet. Choose from quick suggestions below or type your own.
          </span>
        )}
      </div>

      <div style={{ marginTop: '1.25rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Quick Suggestions
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.5rem' }}>
          {suggestions
            .filter((s) => !skills.includes(s))
            .slice(0, 10)
            .map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => addSkill(s)}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.625rem',
                  background: '#f8fafc',
                  border: '1px dashed #cbd5e1',
                  borderRadius: '9999px',
                  color: '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                + {s}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
};
