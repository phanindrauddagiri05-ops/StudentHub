'use client';

import React, { useState } from 'react';
import {
  Code,
  Award,
  Sparkles,
  Languages,
  Heart,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ResumeData, ResumeSectionKey } from '@/lib/resume/types';
import PersonalInfoForm from './forms/PersonalInfoForm';
import SummaryForm from './forms/SummaryForm';
import EducationForm from './forms/EducationForm';
import ExperienceForm from './forms/ExperienceForm';
import { ProjectsForm } from './forms/ProjectsForm';
import { SkillsForm } from './forms/SkillsForm';
import { CertificationsForm } from './forms/CertificationsForm';
import { AchievementsForm } from './forms/AchievementsForm';
import { LanguagesForm } from './forms/LanguagesForm';
import { InterestsForm } from './forms/InterestsForm';
import { SectionReorder } from './forms/SectionReorder';
import styles from './forms/forms.module.css';

interface ResumeEditorProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

export const ResumeEditor: React.FC<ResumeEditorProps> = ({ data, onChange }) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    projects: true,
    skills: true,
    certifications: false,
    achievements: false,
    languages: false,
    interests: false,
    reorder: false,
  });

  const toggle = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const updateField = <K extends keyof ResumeData>(field: K, val: ResumeData[K]) => {
    onChange({
      ...data,
      [field]: val,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
      {/* 1. Personal Information */}
      <PersonalInfoForm
        data={data.personalInfo}
        onChange={(p) => updateField('personalInfo', p)}
      />

      {/* 2. Professional Summary */}
      <SummaryForm
        summary={data.summary}
        onChange={(s) => updateField('summary', s)}
      />

      {/* 3. Education */}
      <EducationForm
        entries={data.education}
        onChange={(edu) => updateField('education', edu)}
      />

      {/* 4. Experience */}
      <ExperienceForm
        entries={data.experience}
        onChange={(exp) => updateField('experience', exp)}
      />

      {/* 5. Projects */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader} onClick={() => toggle('projects')}>
          <div className={styles.headerLeft}>
            <span className={styles.sectionIcon}>
              <Code size={18} />
            </span>
            <span className={styles.sectionTitle}>Projects</span>
            {data.projects.length > 0 && (
              <span className={styles.itemCountBadge}>{data.projects.length}</span>
            )}
          </div>
          <div className={styles.headerRight}>
            <button type="button" className={styles.collapseBtn} aria-label="Toggle projects section">
              {openSections.projects ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>
        {openSections.projects && (
          <div className={styles.sectionBody}>
            <ProjectsForm
              projects={data.projects}
              onChange={(proj) => updateField('projects', proj)}
            />
          </div>
        )}
      </div>

      {/* 6. Skills */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader} onClick={() => toggle('skills')}>
          <div className={styles.headerLeft}>
            <span className={styles.sectionIcon}>
              <Sparkles size={18} />
            </span>
            <span className={styles.sectionTitle}>Skills</span>
            {data.skills.length > 0 && (
              <span className={styles.itemCountBadge}>{data.skills.length}</span>
            )}
          </div>
          <div className={styles.headerRight}>
            <button type="button" className={styles.collapseBtn} aria-label="Toggle skills section">
              {openSections.skills ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>
        {openSections.skills && (
          <div className={styles.sectionBody}>
            <SkillsForm
              skills={data.skills}
              onChange={(sk) => updateField('skills', sk)}
            />
          </div>
        )}
      </div>

      {/* 7. Certifications */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader} onClick={() => toggle('certifications')}>
          <div className={styles.headerLeft}>
            <span className={styles.sectionIcon}>
              <Award size={18} />
            </span>
            <span className={styles.sectionTitle}>Certifications</span>
            {data.certifications && data.certifications.length > 0 && (
              <span className={styles.itemCountBadge}>{data.certifications.length}</span>
            )}
          </div>
          <div className={styles.headerRight}>
            <button type="button" className={styles.collapseBtn} aria-label="Toggle certifications section">
              {openSections.certifications ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>
        {openSections.certifications && (
          <div className={styles.sectionBody}>
            <CertificationsForm
              certifications={data.certifications || []}
              onChange={(c) => updateField('certifications', c)}
            />
          </div>
        )}
      </div>

      {/* 8. Achievements */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader} onClick={() => toggle('achievements')}>
          <div className={styles.headerLeft}>
            <span className={styles.sectionIcon}>
              <Award size={18} />
            </span>
            <span className={styles.sectionTitle}>Achievements & Honors</span>
            {data.achievements && data.achievements.length > 0 && (
              <span className={styles.itemCountBadge}>{data.achievements.length}</span>
            )}
          </div>
          <div className={styles.headerRight}>
            <button type="button" className={styles.collapseBtn} aria-label="Toggle achievements section">
              {openSections.achievements ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>
        {openSections.achievements && (
          <div className={styles.sectionBody}>
            <AchievementsForm
              achievements={data.achievements || []}
              onChange={(a) => updateField('achievements', a)}
            />
          </div>
        )}
      </div>

      {/* 9. Languages */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader} onClick={() => toggle('languages')}>
          <div className={styles.headerLeft}>
            <span className={styles.sectionIcon}>
              <Languages size={18} />
            </span>
            <span className={styles.sectionTitle}>Languages</span>
            {data.languages && data.languages.length > 0 && (
              <span className={styles.itemCountBadge}>{data.languages.length}</span>
            )}
          </div>
          <div className={styles.headerRight}>
            <button type="button" className={styles.collapseBtn} aria-label="Toggle languages section">
              {openSections.languages ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>
        {openSections.languages && (
          <div className={styles.sectionBody}>
            <LanguagesForm
              languages={data.languages || []}
              onChange={(l) => updateField('languages', l)}
            />
          </div>
        )}
      </div>

      {/* 10. Interests */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader} onClick={() => toggle('interests')}>
          <div className={styles.headerLeft}>
            <span className={styles.sectionIcon}>
              <Heart size={18} />
            </span>
            <span className={styles.sectionTitle}>Interests</span>
            {data.interests && data.interests.length > 0 && (
              <span className={styles.itemCountBadge}>{data.interests.length}</span>
            )}
          </div>
          <div className={styles.headerRight}>
            <button type="button" className={styles.collapseBtn} aria-label="Toggle interests section">
              {openSections.interests ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>
        {openSections.interests && (
          <div className={styles.sectionBody}>
            <InterestsForm
              interests={data.interests || []}
              onChange={(i) => updateField('interests', i)}
            />
          </div>
        )}
      </div>

      {/* 11. Section Order */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader} onClick={() => toggle('reorder')}>
          <div className={styles.headerLeft}>
            <span className={styles.sectionIcon}>
              <ArrowUpDown size={18} />
            </span>
            <span className={styles.sectionTitle}>Section Order</span>
          </div>
          <div className={styles.headerRight}>
            <button type="button" className={styles.collapseBtn} aria-label="Toggle reorder section">
              {openSections.reorder ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>
        {openSections.reorder && (
          <div className={styles.sectionBody}>
            <SectionReorder
              order={data.sectionOrder || ['summary', 'education', 'experience', 'projects', 'skills', 'certifications', 'achievements', 'languages', 'interests']}
              onChange={(order: ResumeSectionKey[]) => updateField('sectionOrder', order)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeEditor;
