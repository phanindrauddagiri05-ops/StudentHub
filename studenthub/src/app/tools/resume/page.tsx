'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ResumeRecord } from '@/lib/resume/types';
import {
  getUserResumes,
  deleteResume,
  duplicateResume,
  exportAndSaveResumePdf,
} from '@/lib/resume/resume-service';
import { CreateResumeModal } from '@/components/tools/resume/CreateResumeModal';
import { ResumeComingSoon } from '@/components/tools/resume/ResumeComingSoon';
import { FEATURE_FLAGS } from '@/lib/config/features';
import { AdSlot } from '@/components/ads/AdSlot';
import styles from './resume-list.module.css';

export default function ResumeHubPage() {
  const router = useRouter();

  if (!FEATURE_FLAGS.RESUME_GENERATOR) {
    return <ResumeComingSoon />;
  }

  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ResumeRecord | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);

  const refreshResumes = async () => {
    try {
      const data = await getUserResumes();
      setResumes(data);
    } catch (err) {
      console.error('Failed to load resumes:', err);
    }
  };

  useEffect(() => {
    let active = true;
    getUserResumes()
      .then((data) => {
        if (active) {
          setResumes(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load resumes:', err);
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await duplicateResume(id);
      await refreshResumes();
    } catch (err) {
      console.error('Failed to duplicate resume:', err);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteResume(deleteTarget.id);
      setDeleteTarget(null);
      await refreshResumes();
    } catch (err) {
      console.error('Failed to delete resume:', err);
    }
  };

  const handleExport = async (resume: ResumeRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    setExportingId(resume.id);
    try {
      await exportAndSaveResumePdf(resume.title, resume.template, resume.resume_data);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      alert('Could not export PDF. Please open the editor and try again.');
    } finally {
      setExportingId(null);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        <Link href="/tools" className={styles.backLink}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Tools
        </Link>

        {/* Header banner */}
        <div className={styles.headerCard}>
          <div className={styles.headerLeft}>
            <div className={styles.toolIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div>
              <h1 className={styles.title}>Resume Generator</h1>
              <p className={styles.description}>
                Build ATS-friendly, professional resumes with live preview and instant vector PDF export.
              </p>
            </div>
          </div>

          <button
            type="button"
            className={styles.createBtn}
            onClick={() => setModalOpen(true)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create Resume
          </button>
        </div>

        {/* Quick Stats Bar */}
        <div className={styles.statsBar}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <div>
              <div className={styles.statVal}>{resumes.length}</div>
              <div className={styles.statLabel}>Saved Resumes</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="9" y1="21" x2="9" y2="9" />
              </svg>
            </div>
            <div>
              <div className={styles.statVal}>3</div>
              <div className={styles.statLabel}>Pro Templates</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="8 17 12 21 16 17" />
                <line x1="12" y1="12" x2="12" y2="21" />
                <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29" />
              </svg>
            </div>
            <div>
              <div className={styles.statVal}>A4 Vector</div>
              <div className={styles.statLabel}>PDF Quality</div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                style={{
                  height: '210px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  animation: 'pulse 1.5s infinite ease-in-out',
                }}
              />
            ))}
          </div>
        ) : resumes.length === 0 ? (
          <div className={styles.emptyCard}>
            <div className={styles.emptyIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <line x1="12" y1="11" x2="12" y2="17" />
                <line x1="9" y1="14" x2="15" y2="14" />
              </svg>
            </div>
            <h2 className={styles.emptyTitle}>No resumes yet</h2>
            <p className={styles.emptyDesc}>
              Create your first resume and build a professional profile in minutes with pre-built student templates.
            </p>
            <button
              type="button"
              className={styles.createBtn}
              onClick={() => setModalOpen(true)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create Resume
            </button>
          </div>
        ) : (
          <div className={styles.resumeGrid}>
            {resumes.map((resume) => (
              <div key={resume.id} className={styles.resumeCard}>
                <div>
                  <div className={styles.cardTop}>
                    <div className={styles.cardIcon}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                      </svg>
                    </div>
                    <span className={styles.templateBadge}>{resume.template}</span>
                  </div>

                  <h3 className={styles.resumeTitle} title={resume.title}>
                    {resume.title}
                  </h3>

                  <p className={styles.metaText}>
                    Last updated: {new Date(resume.updated_at).toLocaleDateString()}
                  </p>
                  <p className={styles.metaText}>
                    Created: {new Date(resume.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className={styles.cardActions}>
                  <Link href={`/tools/resume/${resume.id}`} className={styles.openBtn}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Open Editor
                  </Link>

                  <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={(e) => handleExport(resume, e)}
                    disabled={exportingId === resume.id}
                    title="Export printable PDF"
                    aria-label="Export PDF"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="8 17 12 21 16 17" />
                      <line x1="12" y1="12" x2="12" y2="21" />
                      <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={(e) => handleDuplicate(resume.id, e)}
                    title="Duplicate resume"
                    aria-label="Duplicate"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    className={`${styles.iconBtn} ${styles.deleteIconBtn}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(resume);
                    }}
                    title="Delete resume"
                    aria-label="Delete"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Ad slot outside critical area */}
        <div style={{ marginTop: '3.5rem' }}>
          <AdSlot slotId="resume-hub-bottom" format="horizontal" />
        </div>
      </div>

      {/* Create Modal */}
      <CreateResumeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(id) => {
          setModalOpen(false);
          router.push(`/tools/resume/${id}`);
        }}
      />

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div className={styles.confirmDialog} onClick={() => setDeleteTarget(null)}>
          <div className={styles.confirmBox} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.confirmTitle}>Delete resume?</h3>
            <p className={styles.confirmText}>
              Are you sure you want to delete <strong>{deleteTarget.title}</strong>? This action cannot be undone.
            </p>
            <div className={styles.confirmActions}>
              <button
                type="button"
                className={styles.iconBtn}
                style={{ width: 'auto', padding: '0.5rem 1rem' }}
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
                onClick={confirmDelete}
              >
                Delete Resume
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
