'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, FileText } from 'lucide-react';
import Button from '@/components/ui/Button';

export function NotesSummaryComingSoon() {
  return (
    <div
      style={{
        padding: '5rem 1.5rem',
        maxWidth: '640px',
        margin: '0 auto',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
      id="notes-summary-coming-soon"
    >
      <div
        style={{
          width: '68px',
          height: '68px',
          borderRadius: '1.25rem',
          backgroundColor: '#fef3c7',
          color: '#d97706',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.25rem',
          fontSize: '2rem',
        }}
      >
        📝
      </div>

      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          borderRadius: '999px',
          backgroundColor: '#fef3c7',
          color: '#b45309',
          fontSize: '0.75rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '1rem',
        }}
      >
        <Clock size={13} />
        Coming Soon
      </div>

      <h1
        style={{
          fontSize: '2rem',
          fontWeight: 800,
          color: '#0f172a',
          letterSpacing: '-0.02em',
          marginBottom: '0.75rem',
        }}
      >
        Notes Summary — Coming Soon
      </h1>

      <p
        style={{
          fontSize: '1rem',
          color: '#64748b',
          lineHeight: 1.6,
          maxWidth: '480px',
          marginBottom: '2rem',
        }}
      >
        This feature is temporarily unavailable and will be enabled in a future update.
      </p>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Button variant="primary" size="md" href="/tools" id="browse-tools-btn">
          <ArrowLeft size={16} style={{ marginRight: 6 }} />
          Browse Available Tools
        </Button>
        <Button variant="secondary" size="md" href="/tools/pdf-summary" id="open-pdf-summary-btn">
          <FileText size={16} style={{ marginRight: 6 }} />
          Try PDF Summary
        </Button>
      </div>
    </div>
  );
}
