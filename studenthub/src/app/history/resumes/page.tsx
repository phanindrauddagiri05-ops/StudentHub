'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Search,
  ExternalLink,
  Trash2,
  Copy,
  Edit2,
  Download,
  Plus,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import {
  getUserResumes,
  deleteResume,
  duplicateResume,
  updateResume,
  exportAndSaveResumePdf,
} from '@/lib/resume/resume-service';
import { ResumeRecord } from '@/lib/resume/types';
import { CreateResumeModal } from '@/components/tools/resume/CreateResumeModal';
import { ResumeComingSoon } from '@/components/tools/resume/ResumeComingSoon';
import { FEATURE_FLAGS } from '@/lib/config/features';
import styles from '../history.module.css';

export default function ResumesHistoryPage() {
  if (!FEATURE_FLAGS.RESUME_GENERATOR) {
    return <ResumeComingSoon />;
  }

  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<ResumeRecord | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ResumeRecord | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);

  const fetchResumes = async () => {
    try {
      const data = await getUserResumes();
      setResumes(data);
    } catch (err) {
      console.error('Error fetching resumes:', err);
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
        console.error('Error fetching resumes:', err);
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredResumes = resumes.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateResume(id);
      await fetchResumes();
    } catch (err) {
      console.error('Failed to duplicate resume:', err);
    }
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget || !renameValue.trim()) return;
    try {
      await updateResume(renameTarget.id, { title: renameValue.trim() });
      setRenameTarget(null);
      await fetchResumes();
    } catch (err) {
      console.error('Failed to rename resume:', err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteResume(deleteTarget.id);
      setDeleteTarget(null);
      await fetchResumes();
    } catch (err) {
      console.error('Failed to delete resume:', err);
    }
  };

  const handleExport = async (r: ResumeRecord) => {
    setExportingId(r.id);
    try {
      await exportAndSaveResumePdf(r.title, r.template, r.resume_data);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      alert('Could not export PDF. Please try again.');
    } finally {
      setExportingId(null);
    }
  };

  return (
    <div className={styles.container}>
      {/* ── Tabs for Document History vs Resume History ────────── */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
        <Link
          href="/history"
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.9375rem',
            fontWeight: 600,
            borderRadius: '8px',
            color: '#64748b',
            textDecoration: 'none',
          }}
        >
          PDF Documents
        </Link>
        <Link
          href="/history/resumes"
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.9375rem',
            fontWeight: 600,
            borderRadius: '8px',
            backgroundColor: '#eff6ff',
            color: '#2563eb',
            textDecoration: 'none',
          }}
        >
          Resumes ({resumes.length})
        </Link>
      </div>

      {/* ── Header ───────────────────────────────────────────── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Resume History</h1>
          <p className={styles.subtitle}>
            Manage, duplicate, edit, and export your tailored career profiles and resumes.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsCreateOpen(true)}
          id="history-new-resume"
        >
          <Plus size={16} style={{ marginRight: '0.375rem' }} />
          Create Resume
        </Button>
      </div>

      {/* ── Controls ─────────────────────────────────────────── */}
      <div className={styles.controls}>
        <div className={styles.searchBox} style={{ maxWidth: '400px' }}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search resumes by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────── */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
          Loading your resumes...
        </div>
      ) : filteredResumes.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <FileText size={40} />
          </div>
          <h3 className={styles.emptyTitle}>No resumes found</h3>
          <p className={styles.emptySubtitle}>
            {search ? 'No resumes match your search query.' : 'You haven’t created any resumes yet.'}
          </p>
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsCreateOpen(true)}
            id="empty-create-resume"
          >
            Create Your First Resume
          </Button>
        </div>
      ) : (
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Resume Name</th>
                <th>Template</th>
                <th>Created</th>
                <th>Last Modified</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredResumes.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div className={styles.fileNameCell}>
                      <div className={styles.fileIconWrapper}>
                        <FileText size={18} />
                      </div>
                      <span className={styles.fileName} title={r.title}>
                        {r.title}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: '#f1f5f9',
                        color: '#475569',
                        textTransform: 'capitalize',
                      }}
                    >
                      {r.template}
                    </span>
                  </td>
                  <td className={styles.metaCell}>
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className={styles.metaCell}>
                    {new Date(r.updated_at).toLocaleDateString()}
                  </td>
                  <td>
                    <div className={styles.actionsCell}>
                      <Link
                        href={`/tools/resume/${r.id}`}
                        className={styles.actionBtn}
                        title="Open in Builder"
                      >
                        <ExternalLink size={15} />
                      </Link>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => handleExport(r)}
                        disabled={exportingId === r.id}
                        title="Export PDF"
                      >
                        <Download size={15} />
                      </button>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => {
                          setRenameTarget(r);
                          setRenameValue(r.title);
                        }}
                        title="Rename Resume"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => handleDuplicate(r.id)}
                        title="Duplicate Resume"
                      >
                        <Copy size={15} />
                      </button>
                      <button
                        type="button"
                        className={[styles.actionBtn, styles.deleteBtn].join(' ')}
                        onClick={() => setDeleteTarget(r)}
                        title="Delete Resume"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Create Resume Modal ───────────────────────────────── */}
      <CreateResumeModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          setIsCreateOpen(false);
          fetchResumes();
        }}
      />

      {/* ── Rename Modal ─────────────────────────────────────── */}
      {renameTarget && (
        <div className={styles.modalOverlay} onClick={() => setRenameTarget(null)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Rename Resume</h3>
            <form onSubmit={handleRenameSubmit} style={{ marginTop: '1rem' }}>
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  fontSize: '0.9375rem',
                }}
                required
                autoFocus
              />
              <div className={styles.modalActions}>
                <Button variant="secondary" size="sm" onClick={() => setRenameTarget(null)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Save Name
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ────────────────────────── */}
      {deleteTarget && (
        <div className={styles.modalOverlay} onClick={() => setDeleteTarget(null)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Delete resume?</h3>
            <p className={styles.modalSubtitle} style={{ marginTop: '0.5rem', marginBottom: '1.25rem' }}>
              Are you sure you want to delete <strong>{deleteTarget.title}</strong>? This action cannot be undone.
            </p>
            <div className={styles.modalActions}>
              <Button variant="secondary" size="sm" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleDeleteConfirm}>
                Delete Resume
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
