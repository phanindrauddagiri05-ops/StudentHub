'use client';

import React, { useState } from 'react';
import { NotesSummaryComingSoon } from '@/components/tools/notes/NotesSummaryComingSoon';
import { FEATURE_FLAGS } from '@/lib/config/features';
import Button from '@/components/ui/Button';
import { Sparkles, Copy, Download, RotateCcw } from 'lucide-react';

export default function NotesSummaryPage() {
  // Feature is locked until future update
  if (!FEATURE_FLAGS.NOTES_SUMMARY) {
    return <NotesSummaryComingSoon />;
  }

  // Preserved interactive UI for when feature is re-enabled
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [notesText, setNotesText] = useState('');
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [title, setTitle] = useState('');
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [result, setResult] = useState<any>(null);

  const handleSummarize = async () => {
    if (!notesText.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/notes-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: notesText, title }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data.result);
      }
    } catch (err) {
      console.error('Notes summary failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
      <h1>Notes Summary</h1>
      <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
        Paste your lecture notes, study outlines, or reading materials for an instant summary.
      </p>

      {!result ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            type="text"
            placeholder="Document Title (e.g. Biology Chapter 4)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px' }}
          />
          <textarea
            rows={10}
            placeholder="Paste your notes here..."
            value={notesText}
            onChange={(e) => setNotesText(e.target.value)}
            style={{ padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', width: '100%' }}
          />
          <Button variant="primary" size="lg" onClick={handleSummarize} disabled={loading}>
            <Sparkles size={16} style={{ marginRight: 6 }} />
            {loading ? 'Summarizing...' : 'Summarize Notes'}
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ padding: '1.5rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <h3>Overview</h3>
            <p>{result.overview}</p>
            <h3>Key Points</h3>
            <ul>{result.keyPoints?.map((pt: string, i: number) => <li key={i}>{pt}</li>)}</ul>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setResult(null)}>
            <RotateCcw size={14} style={{ marginRight: 6 }} />
            Summarize More Notes
          </Button>
        </div>
      )}
    </div>
  );
}
