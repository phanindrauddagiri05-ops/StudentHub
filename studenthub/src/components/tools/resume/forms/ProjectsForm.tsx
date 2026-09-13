'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ProjectEntry } from '@/lib/resume/types';
import styles from './forms.module.css';

interface ProjectsFormProps {
  projects: ProjectEntry[];
  onChange: (projects: ProjectEntry[]) => void;
}

export const ProjectsForm: React.FC<ProjectsFormProps> = ({ projects, onChange }) => {
  const addProject = () => {
    const newEntry: ProjectEntry = {
      id: crypto.randomUUID(),
      name: '',
      description: '',
      technologies: '',
      url: '',
      githubUrl: '',
    };
    onChange([...projects, newEntry]);
  };

  const updateEntry = (id: string, field: keyof ProjectEntry, value: string | string[]) => {
    onChange(
      projects.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const removeEntry = (id: string) => {
    onChange(projects.filter((p) => p.id !== id));
  };

  const handleTechChange = (id: string, techString: string) => {
    updateEntry(id, 'technologies', techString);
  };

  return (
    <div className={styles.formContainer}>
      <p className={styles.helpText}>
        Highlight projects, coursework, or independent open-source contributions. Especially useful for students showcasing practical technical skills.
      </p>

      {projects.map((proj, idx) => (
        <div key={proj.id} className={styles.entryCard}>
          <div className={styles.entryHeader}>
            <span className={styles.entryTitle}>
              {proj.name || `Project #${idx + 1}`}
            </span>
            <button
              type="button"
              className={[styles.iconBtn, styles.deleteBtn].join(' ')}
              onClick={() => removeEntry(proj.id)}
              aria-label="Remove project"
              title="Remove project"
            >
              <Trash2 size={15} />
            </button>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Project Name *</label>
            <input
              type="text"
              className={styles.input}
              placeholder="e.g. StudentHub Web Platform"
              value={proj.name}
              onChange={(e) => updateEntry(proj.id, 'name', e.target.value)}
            />
          </div>

          <div className={styles.twoColumn}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Live Demo URL</label>
              <input
                type="url"
                className={styles.input}
                placeholder="https://example.com"
                value={proj.url || ''}
                onChange={(e) => updateEntry(proj.id, 'url', e.target.value)}
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>GitHub / Repository URL</label>
              <input
                type="url"
                className={styles.input}
                placeholder="https://github.com/username/project"
                value={proj.githubUrl || ''}
                onChange={(e) => updateEntry(proj.id, 'githubUrl', e.target.value)}
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Technologies Used (comma-separated)</label>
            <input
              type="text"
              className={styles.input}
              placeholder="Next.js, TypeScript, PostgreSQL, TailwindCSS"
              value={Array.isArray(proj.technologies) ? proj.technologies.join(', ') : (proj.technologies || '')}
              onChange={(e) => handleTechChange(proj.id, e.target.value)}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Project Description</label>
            <textarea
              className={styles.textarea}
              placeholder="Describe the problem solved, architecture, and impact..."
              value={proj.description}
              onChange={(e) => updateEntry(proj.id, 'description', e.target.value)}
            />
          </div>
        </div>
      ))}

      <button type="button" className={styles.addEntryBtn} onClick={addProject}>
        <Plus size={14} />
        Add Project
      </button>
    </div>
  );
};
