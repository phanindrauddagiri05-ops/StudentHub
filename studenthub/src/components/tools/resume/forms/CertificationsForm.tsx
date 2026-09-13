'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { CertificationEntry } from '@/lib/resume/types';
import styles from './forms.module.css';

interface CertificationsFormProps {
  certifications: CertificationEntry[];
  onChange: (certifications: CertificationEntry[]) => void;
}

export const CertificationsForm: React.FC<CertificationsFormProps> = ({
  certifications,
  onChange,
}) => {
  const addCert = () => {
    const newEntry: CertificationEntry = {
      id: crypto.randomUUID(),
      name: '',
      issuer: '',
      date: '',
      url: '',
    };
    onChange([...certifications, newEntry]);
  };

  const updateEntry = (id: string, field: keyof CertificationEntry, value: string) => {
    onChange(
      certifications.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const removeEntry = (id: string) => {
    onChange(certifications.filter((c) => c.id !== id));
  };

  return (
    <div className={styles.formContainer}>
      <p className={styles.helpText}>
        List professional certifications, licenses, and verified online course accomplishments.
      </p>

      {certifications.map((cert, idx) => (
        <div key={cert.id} className={styles.entryCard}>
          <div className={styles.entryHeader}>
            <span className={styles.entryTitle}>
              {cert.name || `Certification #${idx + 1}`}
            </span>
            <button
              type="button"
              className={[styles.iconBtn, styles.deleteBtn].join(' ')}
              onClick={() => removeEntry(cert.id)}
              aria-label="Remove certification"
              title="Remove certification"
            >
              <Trash2 size={15} />
            </button>
          </div>

          <div className={styles.twoColumn}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Certificate Name *</label>
              <input
                type="text"
                className={styles.input}
                placeholder="e.g. AWS Certified Cloud Practitioner"
                value={cert.name}
                onChange={(e) => updateEntry(cert.id, 'name', e.target.value)}
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Issuing Organization *</label>
              <input
                type="text"
                className={styles.input}
                placeholder="e.g. Amazon Web Services / Coursera"
                value={cert.issuer}
                onChange={(e) => updateEntry(cert.id, 'issuer', e.target.value)}
              />
            </div>
          </div>

          <div className={styles.twoColumn}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Issue Date</label>
              <input
                type="text"
                className={styles.input}
                placeholder="e.g. Nov 2025"
                value={cert.date}
                onChange={(e) => updateEntry(cert.id, 'date', e.target.value)}
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Credential URL</label>
              <input
                type="url"
                className={styles.input}
                placeholder="https://credly.com/your-badge"
                value={cert.url || ''}
                onChange={(e) => updateEntry(cert.id, 'url', e.target.value)}
              />
            </div>
          </div>
        </div>
      ))}

      <button type="button" className={styles.addEntryBtn} onClick={addCert}>
        <Plus size={14} />
        Add Certification
      </button>
    </div>
  );
};
