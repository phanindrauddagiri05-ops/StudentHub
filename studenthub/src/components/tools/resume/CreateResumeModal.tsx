'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createResume } from '@/lib/resume/resume-service';
import { ResumeTemplate, SAMPLE_STUDENT_RESUME, EMPTY_RESUME_DATA, ResumeData } from '@/lib/resume/types';
import styles from './CreateResumeModal.module.css';

interface CreateResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (resumeId: string) => void;
}

export const CreateResumeModal: React.FC<CreateResumeModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const router = useRouter();
  const { user, profile } = useAuth();

  const [title, setTitle] = useState('Software Developer Resume');
  const [template, setTemplate] = useState<ResumeTemplate>('modern');
  const [starterType, setStarterType] = useState<'sample' | 'profile' | 'empty'>('sample');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a name for your resume');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let initialData: ResumeData;

      if (starterType === 'sample') {
        initialData = {
          ...SAMPLE_STUDENT_RESUME,
          personalInfo: {
            ...SAMPLE_STUDENT_RESUME.personalInfo,
            fullName: profile?.full_name || user?.user_metadata?.full_name || SAMPLE_STUDENT_RESUME.personalInfo.fullName,
            email: user?.email || SAMPLE_STUDENT_RESUME.personalInfo.email,
          },
        };
      } else if (starterType === 'profile') {
        initialData = {
          ...EMPTY_RESUME_DATA,
          personalInfo: {
            ...EMPTY_RESUME_DATA.personalInfo,
            fullName: profile?.full_name || user?.user_metadata?.full_name || '',
            email: user?.email || '',
          },
        };
      } else {
        initialData = { ...EMPTY_RESUME_DATA };
      }

      const newResume = await createResume(title.trim(), template, initialData);

      if (onCreated) {
        onCreated(newResume.id);
      } else {
        router.push(`/tools/resume/${newResume.id}`);
      }
    } catch (err: unknown) {
      console.error('Failed to create resume:', err);
      setError('Could not create resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.titleWrapper}>
            <div className={styles.iconBox}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            </div>
            <div>
              <h2 className={styles.modalTitle}>Create New Resume</h2>
              <p className={styles.modalSubtitle}>Build a polished, job-ready resume in minutes</p>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close modal"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleCreate}>
          <div className={styles.modalBody}>
            {error && (
              <div style={{ padding: '0.75rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}

            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="resumeName">
                Resume Name *
              </label>
              <input
                id="resumeName"
                type="text"
                className={styles.input}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Software Developer Resume"
                required
                autoFocus
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Starting Template</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                {(['modern', 'classic', 'minimal'] as ResumeTemplate[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTemplate(t)}
                    style={{
                      padding: '0.625rem 0.5rem',
                      border: template === t ? '2px solid #2563eb' : '1px solid #cbd5e1',
                      borderRadius: '8px',
                      backgroundColor: template === t ? '#eff6ff' : '#ffffff',
                      color: template === t ? '#1d4ed8' : '#334155',
                      fontWeight: 600,
                      fontSize: '0.8125rem',
                      textTransform: 'capitalize',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Starting Content</label>
              <div className={styles.radioGroup}>
                <label className={`${styles.radioLabel} ${starterType === 'sample' ? styles.selected : ''}`}>
                  <input
                    type="radio"
                    name="starterType"
                    checked={starterType === 'sample'}
                    onChange={() => setStarterType('sample')}
                  />
                  <div>
                    <div className={styles.radioTitle}>Student Example (Recommended)</div>
                    <div className={styles.radioDesc}>Includes sample projects, coursework, and bullets you can quickly edit.</div>
                  </div>
                </label>

                <label className={`${styles.radioLabel} ${starterType === 'profile' ? styles.selected : ''}`}>
                  <input
                    type="radio"
                    name="starterType"
                    checked={starterType === 'profile'}
                    onChange={() => setStarterType('profile')}
                  />
                  <div>
                    <div className={styles.radioTitle}>Prefill from Profile</div>
                    <div className={styles.radioDesc}>Starts blank with your name and email pre-populated.</div>
                  </div>
                </label>

                <label className={`${styles.radioLabel} ${starterType === 'empty' ? styles.selected : ''}`}>
                  <input
                    type="radio"
                    name="starterType"
                    checked={starterType === 'empty'}
                    onChange={() => setStarterType('empty')}
                  />
                  <div>
                    <div className={styles.radioTitle}>Blank Resume</div>
                    <div className={styles.radioDesc}>Start with a completely empty canvas.</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.createButton}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Resume'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
