'use client';

import React from 'react';
import { ResumeSectionKey } from '@/lib/resume/types';
import styles from './forms.module.css';

interface SectionReorderProps {
  order: ResumeSectionKey[];
  onChange: (order: ResumeSectionKey[]) => void;
}

const SECTION_LABELS: Record<ResumeSectionKey, string> = {
  summary: 'Professional Summary',
  education: 'Education',
  experience: 'Work Experience',
  projects: 'Projects',
  skills: 'Skills',
  certifications: 'Certifications',
  achievements: 'Achievements & Honors',
  languages: 'Languages',
  interests: 'Interests',
};

export const SectionReorder: React.FC<SectionReorderProps> = ({ order, onChange }) => {
  const moveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...order];
    const temp = newOrder[index - 1];
    newOrder[index - 1] = newOrder[index];
    newOrder[index] = temp;
    onChange(newOrder);
  };

  const moveDown = (index: number) => {
    if (index === order.length - 1) return;
    const newOrder = [...order];
    const temp = newOrder[index + 1];
    newOrder[index + 1] = newOrder[index];
    newOrder[index] = temp;
    onChange(newOrder);
  };

  return (
    <div className={styles.formContainer}>
      <p className={styles.helpText}>
        Rearrange how sections appear on your resume template. Use the up and down arrows to customize the visual flow for your target position.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
        {order.map((key, index) => (
          <div
            key={key}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 1rem',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#1e293b',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  backgroundColor: '#e2e8f0',
                  color: '#64748b',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                {index + 1}
              </span>
              <span>{SECTION_LABELS[key] || key}</span>
            </div>

            <div style={{ display: 'flex', gap: '0.375rem' }}>
              <button
                type="button"
                disabled={index === 0}
                onClick={() => moveUp(index)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  backgroundColor: '#ffffff',
                  color: index === 0 ? '#cbd5e1' : '#334155',
                  cursor: index === 0 ? 'not-allowed' : 'pointer',
                }}
                aria-label={`Move ${SECTION_LABELS[key]} up`}
              >
                ▲
              </button>
              <button
                type="button"
                disabled={index === order.length - 1}
                onClick={() => moveDown(index)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  backgroundColor: '#ffffff',
                  color: index === order.length - 1 ? '#cbd5e1' : '#334155',
                  cursor: index === order.length - 1 ? 'not-allowed' : 'pointer',
                }}
                aria-label={`Move ${SECTION_LABELS[key]} down`}
              >
                ▼
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
