'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
  FileText,
  Search,
  Download,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { getUserFiles, deleteUserFile, getFileDownloadUrl } from '@/lib/storage/file-service';
import { formatFileSize } from '@/lib/pdf';
import type { UserFile } from '@/types/database';
import styles from './history.module.css';

const FILTER_PILLS = [
  { label: 'All', value: 'all' },
  { label: 'Merge', value: 'merge' },
  { label: 'Split', value: 'split' },
  { label: 'Compress', value: 'compress' },
  { label: 'PDF → Images', value: 'pdf_to_images' },
  { label: 'Images → PDF', value: 'images_to_pdf' },
  { label: 'Reorder', value: 'reorder' },
];

export default function HistoryPage() {
  const { user } = useAuth();
  const [files, setFiles] = useState<UserFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [fileToDelete, setFileToDelete] = useState<UserFile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let mounted = true;
    if (!user) return;

    getUserFiles({
      userId: user.id,
      search,
      operation: activeFilter,
    })
      .then((data) => {
        if (mounted) {
          startTransition(() => {
            setFiles(data);
            setLoading(false);
          });
        }
      })
      .catch((err) => {
        console.error('Error loading history files:', err);
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [user, search, activeFilter]);

  const loadFiles = () => {
    if (!user) return;
    getUserFiles({
      userId: user.id,
      search,
      operation: activeFilter,
    }).then((data) => {
      setFiles(data);
    });
  };


  const handleDownload = async (file: UserFile) => {
    try {
      const url = await getFileDownloadUrl(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.original_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      alert('Could not download file. Please try again.');
    }
  };

  const handleView = async (file: UserFile) => {
    try {
      const url = await getFileDownloadUrl(file);
      window.open(url, '_blank');
    } catch (err) {
      alert('Could not view file.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;
    setDeleting(true);
    try {
      await deleteUserFile(fileToDelete);
      setFileToDelete(null);
      await loadFiles();
    } catch (err) {
      alert('Failed to delete file.');
    } finally {
      setDeleting(false);
    }
  };

  const getOperationBadgeClass = (op: string) => {
    switch (op) {
      case 'merge':
        return styles.opMerge;
      case 'split':
        return styles.opSplit;
      case 'compress':
        return styles.opCompress;
      case 'reorder':
        return styles.opReorder;
      default:
        return styles.opConvert;
    }
  };

  const formatOperationLabel = (op: string) => {
    switch (op) {
      case 'pdf_to_images':
        return 'PDF → Images';
      case 'images_to_pdf':
        return 'Images → PDF';
      default:
        return op.charAt(0).toUpperCase() + op.slice(1);
    }
  };

  return (
    <div className={styles.container}>
      {/* ── Header ───────────────────────────────────────────── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>PDF History</h1>
          <p className={styles.subtitle}>
            Manage and download your processed documents stored in your private workspace.
          </p>
        </div>
        <Button variant="primary" size="sm" href="/tools/pdf" id="history-new-tool">
          Process New PDF
        </Button>
      </div>

      {/* ── Filters & Search ─────────────────────────────────── */}
      <div className={styles.controls}>
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by filename..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.pillsRow} role="tablist" aria-label="Filter operations">
          {FILTER_PILLS.map((pill) => (
            <button
              key={pill.value}
              className={[styles.pill, activeFilter === pill.value ? styles.pillActive : ''].join(' ')}
              onClick={() => setActiveFilter(pill.value)}
              role="tab"
              aria-selected={activeFilter === pill.value}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table Card ───────────────────────────────────────── */}
      <div className={styles.tableCard}>
        {loading ? (
          <div style={{ padding: 'var(--space-4)' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={styles.skeletonRow}>
                <div className={styles.skeletonBox} style={{ width: '35%' }} />
                <div className={styles.skeletonBox} style={{ width: '15%' }} />
                <div className={styles.skeletonBox} style={{ width: '15%' }} />
                <div className={styles.skeletonBox} style={{ width: '15%' }} />
                <div className={styles.skeletonBox} style={{ width: '20%' }} />
              </div>
            ))}
          </div>
        ) : files.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📂</span>
            <h2 className={styles.emptyTitle}>No PDF activity yet</h2>
            <p className={styles.emptySubtitle}>
              Use PDF Tools to process your first document. Your files will be saved here automatically.
            </p>
            <div style={{ marginTop: 8 }}>
              <Button variant="primary" href="/tools/pdf" id="empty-history-btn">
                Open PDF Tools
              </Button>
            </div>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Filename</th>
                  <th className={styles.th}>Operation</th>
                  <th className={styles.th}>Size</th>
                  <th className={styles.th}>Date</th>
                  <th className={styles.th}>Status</th>
                  <th className={styles.th} style={{ textAlign: 'right' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr key={file.id} className={styles.row}>
                    <td className={styles.td}>
                      <div className={styles.fileNameCol}>
                        <div className={styles.fileIconBox}>
                          <FileText size={18} />
                        </div>
                        <span className={styles.fileName} title={file.original_name}>
                          {file.original_name}
                        </span>
                      </div>
                    </td>
                    <td className={styles.td}>
                      <span className={[styles.operationBadge, getOperationBadgeClass(file.operation)].join(' ')}>
                        {formatOperationLabel(file.operation)}
                      </span>
                    </td>
                    <td className={styles.td}>{formatFileSize(file.file_size)}</td>
                    <td className={styles.td}>
                      {new Date(file.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className={styles.td}>
                      <span className={styles.statusCompleted}>
                        <CheckCircle2 size={14} /> Completed
                      </span>
                    </td>
                    <td className={styles.td}>
                      <div className={styles.actionsCol} style={{ justifyContent: 'flex-end' }}>
                        <button
                          className={styles.actionBtn}
                          onClick={() => handleDownload(file)}
                          title="Download"
                          aria-label={`Download ${file.original_name}`}
                        >
                          <Download size={15} />
                        </button>
                        <button
                          className={styles.actionBtn}
                          onClick={() => handleView(file)}
                          title="View"
                          aria-label={`View ${file.original_name}`}
                        >
                          <ExternalLink size={15} />
                        </button>
                        <button
                          className={[styles.actionBtn, styles.deleteBtn].join(' ')}
                          onClick={() => setFileToDelete(file)}
                          title="Delete"
                          aria-label={`Delete ${file.original_name}`}
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
      </div>

      {/* ── Delete Confirmation Modal (Requirement 28) ───────── */}
      {fileToDelete && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <AlertTriangle size={24} />
              <h2 className={styles.modalTitle}>Delete this file?</h2>
            </div>
            <p className={styles.modalBody}>
              This file (&ldquo;<strong>{fileToDelete.original_name}</strong>&rdquo;) will be permanently removed
              from your StudentHub storage. This action cannot be undone.
            </p>
            <div className={styles.modalFooter}>
              <Button
                variant="ghost"
                onClick={() => setFileToDelete(null)}
                disabled={deleting}
                id="cancel-delete-btn"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                id="confirm-delete-btn"
              >
                {deleting ? (
                  <>
                    <Loader2 size={14} className="spin" style={{ marginRight: 6 }} />
                    Deleting...
                  </>
                ) : (
                  'Delete Permanently'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
