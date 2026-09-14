'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';

export const ResumeComingSoon: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '65vh',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
          color: '#7c3aed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.5rem',
          boxShadow: '0 10px 25px -5px rgba(124, 58, 237, 0.15)',
        }}
      >
        <Clock size={36} strokeWidth={2.2} />
      </div>

      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          background: '#f5f3ff',
          border: '1px solid #ddd6fe',
          borderRadius: '9999px',
          color: '#7c3aed',
          fontSize: '12px',
          fontWeight: 700,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          marginBottom: '1rem',
        }}
      >
        <Sparkles size={13} />
        Coming Soon — Phase 8
      </div>

      <h1
        style={{
          fontSize: '2rem',
          fontWeight: 800,
          color: '#0f172a',
          letterSpacing: '-0.025em',
          marginBottom: '0.75rem',
        }}
      >
        Resume Generator
      </h1>

      <p
        style={{
          fontSize: '1rem',
          color: '#64748b',
          maxWidth: '460px',
          lineHeight: 1.6,
          marginBottom: '2rem',
        }}
      >
        We&apos;re preparing the Resume Generator for a future StudentHub release.
        Build ATS-friendly, professional resumes with student-tailored templates when Phase 8 launches.
      </p>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/tools">
          <Button variant="primary" size="md">
            <ArrowLeft size={16} />
            Back to Tools
          </Button>
        </Link>
        <Link href="/tools/document-converters">
          <Button variant="outline" size="md">
            Explore Document Converters
          </Button>
        </Link>
      </div>
    </div>
  );
};
