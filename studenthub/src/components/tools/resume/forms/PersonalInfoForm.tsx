'use client';

import React, { useState } from 'react';
import { User, ChevronDown, ChevronUp } from 'lucide-react';
import type { PersonalInfo } from '@/lib/resume/types';
import styles from './forms.module.css';

interface PersonalInfoFormProps {
  data: PersonalInfo;
  onChange: (updated: PersonalInfo) => void;
}

export default function PersonalInfoForm({ data, onChange }: PersonalInfoFormProps) {
  const [open, setOpen] = useState(true);

  const updateField = (field: keyof PersonalInfo, value: string) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHeader} onClick={() => setOpen(!open)}>
        <div className={styles.headerLeft}>
          <span className={styles.sectionIcon}>
            <User size={18} />
          </span>
          <span className={styles.sectionTitle}>Personal Information</span>
        </div>
        <div className={styles.headerRight}>
          <button type="button" className={styles.collapseBtn} aria-label="Toggle section">
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {open && (
        <div className={styles.sectionBody}>
          <div className={styles.formGrid2}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="pi-fullname">
                Full Name <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                id="pi-fullname"
                type="text"
                className={styles.input}
                placeholder="e.g. Alex Hunter"
                value={data.fullName || ''}
                onChange={(e) => updateField('fullName', e.target.value)}
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="pi-title">
                Professional Title
              </label>
              <input
                id="pi-title"
                type="text"
                className={styles.input}
                placeholder="e.g. Full Stack Developer / CS Student"
                value={data.title || ''}
                onChange={(e) => updateField('title', e.target.value)}
              />
            </div>
          </div>

          <div className={styles.formGrid2}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="pi-email">
                Email Address <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                id="pi-email"
                type="email"
                className={styles.input}
                placeholder="alex@university.edu"
                value={data.email || ''}
                onChange={(e) => updateField('email', e.target.value)}
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="pi-phone">
                Phone Number
              </label>
              <input
                id="pi-phone"
                type="tel"
                className={styles.input}
                placeholder="+1 (555) 000-0000"
                value={data.phone || ''}
                onChange={(e) => updateField('phone', e.target.value)}
              />
            </div>
          </div>

          <div className={styles.formGrid2}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="pi-location">
                Location (City, Country)
              </label>
              <input
                id="pi-location"
                type="text"
                className={styles.input}
                placeholder="e.g. San Francisco, CA"
                value={data.location || ''}
                onChange={(e) => updateField('location', e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="pi-website">
                Portfolio / Website
              </label>
              <input
                id="pi-website"
                type="url"
                className={styles.input}
                placeholder="https://alexhunter.dev"
                value={data.website || ''}
                onChange={(e) => updateField('website', e.target.value)}
              />
            </div>
          </div>

          <div className={styles.formGrid2}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="pi-linkedin">
                LinkedIn URL / Username
              </label>
              <input
                id="pi-linkedin"
                type="text"
                className={styles.input}
                placeholder="linkedin.com/in/alexhunter"
                value={data.linkedin || ''}
                onChange={(e) => updateField('linkedin', e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="pi-github">
                GitHub URL / Username
              </label>
              <input
                id="pi-github"
                type="text"
                className={styles.input}
                placeholder="github.com/alexhunter"
                value={data.github || ''}
                onChange={(e) => updateField('github', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
