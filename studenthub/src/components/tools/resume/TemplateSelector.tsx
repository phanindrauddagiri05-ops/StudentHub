'use client';

import React from 'react';
import type { ResumeTemplate } from '@/lib/resume/types';
import styles from './TemplateSelector.module.css';

interface TemplateSelectorProps {
  currentTemplate: ResumeTemplate;
  onSelect: (template: ResumeTemplate) => void;
}

const TEMPLATES: { id: ResumeTemplate; label: string; dotClass: string }[] = [
  { id: 'modern', label: 'Modern', dotClass: styles.dotModern },
  { id: 'classic', label: 'Classic', dotClass: styles.dotClassic },
  { id: 'minimal', label: 'Minimal', dotClass: styles.dotMinimal },
];

export default function TemplateSelector({ currentTemplate, onSelect }: TemplateSelectorProps) {
  return (
    <div className={styles.container} role="group" aria-label="Resume Template Selection">
      {TEMPLATES.map((tmpl) => (
        <button
          key={tmpl.id}
          type="button"
          className={[
            styles.templateBtn,
            currentTemplate === tmpl.id ? styles.templateBtnActive : '',
          ].join(' ')}
          onClick={() => onSelect(tmpl.id)}
          aria-pressed={currentTemplate === tmpl.id}
          id={`template-btn-${tmpl.id}`}
        >
          <span className={[styles.dot, tmpl.dotClass].join(' ')} />
          {tmpl.label}
        </button>
      ))}
    </div>
  );
}
