'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import {
  FileText,
  Search,
  Download,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Clock,
  XCircle,
  Image as ImageIcon,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import {
  getUnifiedHistory,
  deleteUnifiedHistoryItem,
  getUnifiedDownloadUrl,
} from '@/lib/storage/file-service';
import { formatFileSize } from '@/lib/pdf';
import type { UnifiedHistoryItem } from '@/types/database';
import styles from './history.module.css';

type HistoryFilter = 'all' | 'pdf' | 'document_converter' | 'image_converter';

const FILTER_PILLS: { label: string; value: HistoryFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'PDF', value: 'pdf' },
  { label: 'Document Conversions', value: 'document_converter' },
  { label: 'Image Conversions', value: 'image_converter' },
];

export default function HistoryPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<UnifiedHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<HistoryFilter>('all');
  const [itemToDelete, setItemToDelete] = useState<UnifiedHistoryItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let mounted = true;
    if (!user) return;

    setLoading(true);
    getUnifiedHistory({
      userId: user.id,
      search,
      toolType: activeFilter,
    })
      .then((data) => {
        if (mounted) {
          startTransition(() => {
            setItems(data);
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

  const loadHistory = () => {
    if (!user) return;
    getUnifiedHistory({
      userId: user.id,
      search,
      toolType: activeFilter,
    }).then((data) => {
      setItems(data);
    });
  };

  const handleDownload = async (item: UnifiedHistoryItem) => {
    try {
      const url = await getUnifiedDownloadUrl(item);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.outputFilename || item.displayFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
      alert('Could not download file. Please try again.');
    }
  };

  const handleView = async (item: UnifiedHistoryItem) => {
    try {
      const url = await getUnifiedDownloadUrl(item);
      window.open(url, '_blank');
    } catch (err) {
      console.error('View error:', err);
      alert('Could not open preview for this document.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      await deleteUnifiedHistoryItem(itemToDelete);
      setItemToDelete(null);
      await loadHistory();
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete history record.');
    } finally {
      setDeleting(false);
    }
  };

  const getOperationBadgeClass = (item: UnifiedHistoryItem) => {
    if (item.toolType === 'image_converter') {
      return styles.opImage;
    }
    if (item.toolType === 'document_converter') {
      return styles.opConvert;
    }
    switch (item.operation) {
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

  return (
    <div className={styles.container}>
      {/* ── Category Navigation Tabs ──────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          marginBottom: '1.5rem',
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: '0.75rem',
        }}
      >
        <button
          type="button"
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.9375rem',
            fontWeight: 600,
            borderRadius: '8px',
            backgroundColor: '#eff6ff',
            color: '#2563eb',
            border: 'none',
            cursor: 'default',
          }}
          id="tab-document-history"
        >
          Document History
        </button>
        <button
          type="button"
          disabled
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.9375rem',
            fontWeight: 600,
            borderRadius: '8px',
            color: '#94a3b8',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'not-allowed',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
          title="Resume Generator and Resume History will be available in Phase 8"
          id="tab-resume-history-disabled"
        >
          Resumes
          <span
            style={{
              fontSize: '10px',
              padding: '1px 6px',
              borderRadius: '999px',
              background: '#f1f5f9',
              color: '#64748b',
              fontWeight: 700,
            }}
          >
            Soon
          </span>
        </button>
      </div>

      {/* ── Header ───────────────────────────────────────────── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Document History</h1>
          <p className={styles.subtitle}>
            Manage your processed files and conversions stored in your private workspace.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Button variant="secondary" size="sm" href="/tools/document-converters" id="history-convert-btn">
            <RefreshCw size={14} style={{ marginRight: 6 }} />
            Convert Document
          </Button>
          <Button variant="primary" size="sm" href="/tools/pdf" id="history-pdf-btn">
            <FileText size={14} style={{ marginRight: 6 }} />
            PDF Tools
          </Button>
        </div>
      </div>

      {/* ── Filters & Search ─────────────────────────────────── */}
      <div className={styles.controls}>
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by filename or format..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="history-search-input"
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
              id={`filter-pill-${pill.value}`}
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
        ) : items.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📂</span>
            {activeFilter === 'image_converter' ? (
              <>
                <h2 className={styles.emptyTitle}>No image conversions yet</h2>
                <p className={styles.emptySubtitle}>
                  Your converted images will appear here. Convert between JPG, PNG, WebP, HEIC, GIF, and more.
                </p>
                <div style={{ marginTop: 8 }}>
                  <Button variant="primary" href="/tools/image-converters" id="empty-image-btn">
                    Convert an Image
                  </Button>
                </div>
              </>
            ) : activeFilter === 'document_converter' ? (
              <>
                <h2 className={styles.emptyTitle}>No document conversions yet</h2>
                <p className={styles.emptySubtitle}>
                  Your converted documents will appear here. Convert your Word, PowerPoint, or Excel files.
                </p>
                <div style={{ marginTop: 8 }}>
                  <Button variant="primary" href="/tools/document-converters" id="empty-convert-btn">
                    Convert a Document
                  </Button>
                </div>
              </>
            ) : activeFilter === 'pdf' ? (
              <>
                <h2 className={styles.emptyTitle}>No PDF activity yet</h2>
                <p className={styles.emptySubtitle}>
                  Use PDF Tools to process your first document. Your files will be saved here automatically.
                </p>
                <div style={{ marginTop: 8 }}>
                  <Button variant="primary" href="/tools/pdf" id="empty-pdf-btn">
                    Open PDF Tools
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h2 className={styles.emptyTitle}>No activity yet</h2>
                <p className={styles.emptySubtitle}>
                  Process a PDF, convert a document, or transform images to see your history records here.
                </p>
                <div style={{ marginTop: 8, display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <Button variant="primary" href="/tools/image-converters" id="empty-start-img-btn">
                    Image Converters
                  </Button>
                  <Button variant="secondary" href="/tools/document-converters" id="empty-start-convert-btn">
                    Document Converters
                  </Button>
                  <Button variant="outline" href="/tools/pdf" id="empty-start-pdf-btn">
                    PDF Tools
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
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
                  {items.map((item) => (
                    <tr key={item.id} className={styles.row}>
                      <td className={styles.td}>
                        <div className={styles.fileNameCol}>
                          <div className={styles.fileIconBox}>
                            {item.toolType === 'image_converter' ? (
                              <ImageIcon size={18} color="#8b5cf6" />
                            ) : item.toolType === 'document_converter' ? (
                              <RefreshCw size={18} color="#0284c7" />
                            ) : (
                              <FileText size={18} color="#2563eb" />
                            )}
                          </div>
                          <div>
                            <span className={styles.fileName} title={item.sourceFilename}>
                              {item.sourceFilename}
                            </span>
                            {(item.toolType === 'document_converter' || item.toolType === 'image_converter') && item.outputFilename !== item.sourceFilename && (
                              <div className={styles.fileSubName} title={`Output: ${item.outputFilename}`}>
                                → {item.outputFilename}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className={styles.td}>
                        <span className={[styles.operationBadge, getOperationBadgeClass(item)].join(' ')}>
                          {item.operationLabel}
                        </span>
                      </td>
                      <td className={styles.td}>{formatFileSize(item.fileSize)}</td>
                      <td className={styles.td}>
                        {new Date(item.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className={styles.td}>
                        {item.status === 'completed' ? (
                          <span className={styles.statusCompleted}>
                            <CheckCircle2 size={14} /> Completed
                          </span>
                        ) : item.status === 'failed' ? (
                          <span className={styles.statusFailed}>
                            <XCircle size={14} /> Failed
                          </span>
                        ) : (
                          <span style={{ color: '#d97706', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-xs)' }}>
                            <Clock size={14} /> Processing
                          </span>
                        )}
                      </td>
                      <td className={styles.td}>
                        <div className={styles.actionsCol} style={{ justifyContent: 'flex-end' }}>
                          {item.status === 'completed' && (
                            <>
                              <button
                                className={styles.actionBtn}
                                onClick={() => handleDownload(item)}
                                title="Download file"
                                aria-label={`Download ${item.outputFilename}`}
                              >
                                <Download size={15} />
                              </button>
                              <button
                                className={styles.actionBtn}
                                onClick={() => handleView(item)}
                                title="Open in new tab"
                                aria-label={`Open ${item.outputFilename}`}
                              >
                                <ExternalLink size={15} />
                              </button>
                            </>
                          )}
                          <button
                            className={[styles.actionBtn, styles.deleteBtn].join(' ')}
                            onClick={() => setItemToDelete(item)}
                            title="Delete from history"
                            aria-label={`Delete ${item.displayFilename}`}
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

            {/* Mobile Card View (< 640px) */}
            <div className={styles.mobileCardList}>
              {items.map((item) => (
                <div key={item.id} className={styles.historyMobileCard}>
                  <div className={styles.mobileCardHeader}>
                    <div className={styles.fileIconBox} style={{ width: 32, height: 32 }}>
                      {item.toolType === 'image_converter' ? (
                        <ImageIcon size={16} color="#8b5cf6" />
                      ) : item.toolType === 'document_converter' ? (
                        <RefreshCw size={16} color="#0284c7" />
                      ) : (
                        <FileText size={16} color="#2563eb" />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className={styles.mobileCardTitle}>{item.sourceFilename}</div>
                      {(item.toolType === 'document_converter' || item.toolType === 'image_converter') &&
                        item.outputFilename !== item.sourceFilename && (
                          <div className={styles.mobileCardSubTitle}>→ {item.outputFilename}</div>
                        )}
                    </div>
                  </div>

                  <div className={styles.mobileCardMeta}>
                    <span className={[styles.operationBadge, getOperationBadgeClass(item)].join(' ')}>
                      {item.operationLabel}
                    </span>
                    <span>•</span>
                    <span>{formatFileSize(item.fileSize)}</span>
                    <span>•</span>
                    <span>
                      {new Date(item.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <span>•</span>
                    {item.status === 'completed' ? (
                      <span className={styles.statusCompleted}>
                        <CheckCircle2 size={12} /> Completed
                      </span>
                    ) : (
                      <span className={styles.statusFailed}>
                        <XCircle size={12} /> {item.status}
                      </span>
                    )}
                  </div>

                  <div className={styles.mobileCardActions}>
                    {item.status === 'completed' && (
                      <>
                        <button
                          type="button"
                          className={styles.mobileActionBtn}
                          onClick={() => handleDownload(item)}
                          aria-label={`Download ${item.outputFilename}`}
                        >
                          <Download size={13} />
                          <span>Download</span>
                        </button>
                        <button
                          type="button"
                          className={styles.mobileActionBtn}
                          onClick={() => handleView(item)}
                          aria-label={`Open ${item.outputFilename}`}
                        >
                          <ExternalLink size={13} />
                          <span>View</span>
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      className={[styles.mobileActionBtn, styles.mobileDeleteBtn].join(' ')}
                      onClick={() => setItemToDelete(item)}
                      aria-label={`Delete ${item.displayFilename}`}
                    >
                      <Trash2 size={13} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Delete Confirmation Modal ────────────────────────── */}
      {itemToDelete && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <AlertTriangle size={24} />
              <h2 className={styles.modalTitle}>Delete this record?</h2>
            </div>
            <p className={styles.modalBody}>
              This file (&ldquo;<strong>{itemToDelete.displayFilename}</strong>&rdquo;) will be permanently removed
              from your StudentHub storage and history. This action cannot be undone.
            </p>
            <div className={styles.modalFooter}>
              <Button
                variant="ghost"
                onClick={() => setItemToDelete(null)}
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
