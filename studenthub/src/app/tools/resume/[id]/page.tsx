'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ResumeData, ResumeTemplate } from '@/lib/resume/types';
import { getResumeById, updateResume, exportAndSaveResumePdf } from '@/lib/resume/resume-service';
import { ResumeToolbar } from '@/components/tools/resume/ResumeToolbar';
import { ResumeEditor } from '@/components/tools/resume/ResumeEditor';
import { ResumePreview } from '@/components/tools/resume/ResumePreview';
import styles from './builder.module.css';

export default function ResumeBuilderPage() {
  const params = useParams();
  const resumeId = params?.id as string;

  const [data, setData] = useState<ResumeData | null>(null);
  const [title, setTitle] = useState('');
  const [template, setTemplate] = useState<ResumeTemplate>('modern');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [exporting, setExporting] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'edit' | 'preview'>('edit');

  // Timer ref for debounced autosave
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstMount = useRef(true);

  // Load resume data
  useEffect(() => {
    async function load() {
      if (!resumeId) return;
      setLoading(true);
      setError(null);
      try {
        const item = await getResumeById(resumeId);
        if (!item) {
          setError('Resume not found or you do not have permission to access it.');
          return;
        }
        setTitle(item.title);
        setTemplate(item.template);
        setData(item.resume_data);
      } catch (err: unknown) {
        console.error('Error fetching resume:', err);
        setError('Unable to load this resume. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [resumeId]);

  // Autosave function
  const performSave = useCallback(
    async (newTitle: string, newTemplate: ResumeTemplate, newData: ResumeData) => {
      if (!resumeId) return;
      setSaveStatus('saving');
      try {
        await updateResume(resumeId, {
          title: newTitle,
          template: newTemplate,
          resume_data: newData,
        });
        setSaveStatus('saved');
      } catch (err) {
        console.error('Autosave failed:', err);
        setSaveStatus('error');
      }
    },
    [resumeId]
  );

  // Trigger debounced autosave on change
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    if (!data) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setSaveStatus('saving');
      performSave(title, template, data);
    }, 1500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [data, title, template, performSave]);

  // Draft protection on window close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveStatus === 'saving') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveStatus]);

  // Manual save
  const handleManualSave = async () => {
    if (!data) return;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    await performSave(title, template, data);
  };

  // PDF Export
  const handleExportPdf = async () => {
    if (!data) return;
    setExporting(true);
    try {
      await exportAndSaveResumePdf(title, template, data);
    } catch (err: unknown) {
      console.error('PDF export error:', err);
      alert('Failed to export PDF. Please check your data and try again.');
    } finally {
      setExporting(false);
    }
  };

  // Browser Print
  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className={styles.stateCenter}>
        <div className={styles.spinner} />
        <p style={{ color: '#64748b', fontSize: '0.9375rem', fontWeight: 500 }}>
          Loading your resume workspace...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.stateCenter}>
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
          Unable to Load Resume
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.875rem', maxWidth: '400px', marginBottom: '1.5rem' }}>
          {error || 'The requested resume could not be retrieved.'}
        </p>
        <Link
          href="/tools/resume"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1.25rem',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Return to Resumes
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.workspace}>
      {/* Top Toolbar */}
      <ResumeToolbar
        title={title}
        template={template}
        saveStatus={saveStatus}
        exportingPdf={exporting}
        onTitleChange={(newTitle) => setTitle(newTitle)}
        onTemplateChange={(newTemplate) => setTemplate(newTemplate)}
        onSave={handleManualSave}
        onExportPdf={handleExportPdf}
        onPrint={handlePrint}
      />

      {/* Mobile / Tablet Toggle Tabs */}
      <div className={styles.mobileTabs}>
        <button
          type="button"
          className={`${styles.mobileTab} ${activeMobileTab === 'edit' ? styles.active : ''}`}
          onClick={() => setActiveMobileTab('edit')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Edit Resume
        </button>
        <button
          type="button"
          className={`${styles.mobileTab} ${activeMobileTab === 'preview' ? styles.active : ''}`}
          onClick={() => setActiveMobileTab('preview')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          Preview & Print
        </button>
      </div>

      {/* Main Workspace Area */}
      <div className={styles.mainContent}>
        {/* Left Side: Structured Resume Editor */}
        <div
          className={`${styles.editorPane} ${
            activeMobileTab === 'edit' ? styles.visible : ''
          }`}
        >
          <ResumeEditor data={data} onChange={(newData) => setData(newData)} />
        </div>

        {/* Right Side: Live A4 Preview */}
        <div
          className={`${styles.previewPane} ${
            activeMobileTab === 'preview' ? styles.visible : ''
          }`}
        >
          <ResumePreview data={data} template={template} />
        </div>
      </div>
    </div>
  );
}
