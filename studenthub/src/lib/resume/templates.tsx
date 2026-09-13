import React from 'react';
import type { ResumeData, ResumeTemplate, ResumeSectionId } from './types';
import styles from './templates.module.css';

interface TemplateProps {
  data: ResumeData;
}

// ────────────────────────────────────────────────────────────
// SHARED SECTION DISPATCHER
// ────────────────────────────────────────────────────────────
function renderSection(
  id: ResumeSectionId,
  data: ResumeData,
  template: ResumeTemplate
) {
  switch (id) {
    case 'summary':
      if (!data.summary?.trim()) return null;
      return (
        <div key="summary" className={getSectionClass(template)}>
          <h2 className={getTitleClass(template)}>Professional Summary</h2>
          <p className={getDescClass(template)}>{data.summary}</p>
        </div>
      );

    case 'education':
      if (!data.education || data.education.length === 0) return null;
      return (
        <div key="education" className={getSectionClass(template)}>
          <h2 className={getTitleClass(template)}>Education</h2>
          {data.education.map((edu) => (
            <div key={edu.id} className={getEntryClass(template)}>
              <div className={getHeaderClass(template)}>
                <span className={getEntryTitleClass(template)}>
                  {edu.institution || 'University / Institution'}
                </span>
                <span className={getDateClass(template)}>
                  {edu.startDate} – {edu.endDate || 'Present'}
                </span>
              </div>
              <div className={getSubtitleClass(template)}>
                {edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}
                {edu.grade ? ` • ${edu.grade}` : ''}
              </div>
              {edu.description && (
                <p className={getDescClass(template)}>{edu.description}</p>
              )}
            </div>
          ))}
        </div>
      );

    case 'experience':
      if (!data.experience || data.experience.length === 0) return null;
      return (
        <div key="experience" className={getSectionClass(template)}>
          <h2 className={getTitleClass(template)}>Experience</h2>
          {data.experience.map((exp) => (
            <div key={exp.id} className={getEntryClass(template)}>
              <div className={getHeaderClass(template)}>
                <span className={getEntryTitleClass(template)}>
                  {exp.jobTitle || 'Role / Position'}
                </span>
                <span className={getDateClass(template)}>
                  {exp.startDate} – {exp.currentlyWorking ? 'Present' : exp.endDate || 'Present'}
                </span>
              </div>
              <div className={getSubtitleClass(template)}>
                {exp.company} {exp.location ? `• ${exp.location}` : ''}
              </div>
              {exp.bullets && exp.bullets.length > 0 && (
                <ul className={getBulletsClass(template)}>
                  {exp.bullets.filter(Boolean).map((bullet, idx) => (
                    <li key={idx}>{bullet}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      );

    case 'projects':
      if (!data.projects || data.projects.length === 0) return null;
      return (
        <div key="projects" className={getSectionClass(template)}>
          <h2 className={getTitleClass(template)}>Projects</h2>
          {data.projects.map((proj) => (
            <div key={proj.id} className={getEntryClass(template)}>
              <div className={getHeaderClass(template)}>
                <span className={getEntryTitleClass(template)}>
                  {proj.name}
                  {proj.technologies && (
                    <span style={{ fontWeight: 400, fontSize: '11px', color: '#64748b', marginLeft: 6 }}>
                      ({proj.technologies})
                    </span>
                  )}
                </span>
                <span className={getDateClass(template)}>
                  {proj.projectUrl || proj.githubUrl || ''}
                </span>
              </div>
              {proj.description && (
                <p className={getDescClass(template)}>{proj.description}</p>
              )}
            </div>
          ))}
        </div>
      );

    case 'skills':
      if (!data.skills || data.skills.length === 0) return null;
      return (
        <div key="skills" className={getSectionClass(template)}>
          <h2 className={getTitleClass(template)}>Skills & Technologies</h2>
          <div className={styles.modernTagsList}>
            {data.skills.map((skill, idx) => (
              <span key={idx} className={styles.modernTag}>
                {skill}
              </span>
            ))}
          </div>
        </div>
      );

    case 'certifications':
      if (!data.certifications || data.certifications.length === 0) return null;
      return (
        <div key="certifications" className={getSectionClass(template)}>
          <h2 className={getTitleClass(template)}>Certifications</h2>
          {data.certifications.map((cert) => (
            <div key={cert.id} className={getEntryClass(template)}>
              <div className={getHeaderClass(template)}>
                <span className={getEntryTitleClass(template)}>{cert.name}</span>
                {cert.issueDate && (
                  <span className={getDateClass(template)}>{cert.issueDate}</span>
                )}
              </div>
              <div className={getSubtitleClass(template)}>{cert.issuer}</div>
            </div>
          ))}
        </div>
      );

    case 'achievements':
      if (!data.achievements || data.achievements.length === 0) return null;
      return (
        <div key="achievements" className={getSectionClass(template)}>
          <h2 className={getTitleClass(template)}>Key Achievements</h2>
          {data.achievements.map((ach) => (
            <div key={ach.id} className={getEntryClass(template)}>
              <div className={getHeaderClass(template)}>
                <span className={getEntryTitleClass(template)}>{ach.title}</span>
                {ach.date && <span className={getDateClass(template)}>{ach.date}</span>}
              </div>
              {ach.description && (
                <p className={getDescClass(template)}>{ach.description}</p>
              )}
            </div>
          ))}
        </div>
      );

    case 'languages':
      if (!data.languages || data.languages.length === 0) return null;
      return (
        <div key="languages" className={getSectionClass(template)}>
          <h2 className={getTitleClass(template)}>Languages</h2>
          <p className={getDescClass(template)}>
            {data.languages
              .map((l) => `${l.language}${l.proficiency ? ` (${l.proficiency})` : ''}`)
              .join(' • ')}
          </p>
        </div>
      );

    case 'interests':
      if (!data.interests || data.interests.length === 0) return null;
      return (
        <div key="interests" className={getSectionClass(template)}>
          <h2 className={getTitleClass(template)}>Interests</h2>
          <p className={getDescClass(template)}>{data.interests.join(' • ')}</p>
        </div>
      );

    default:
      return null;
  }
}

function getSectionClass(t: ResumeTemplate) {
  if (t === 'classic') return styles.classicSection;
  if (t === 'minimal') return styles.minimalSection;
  return styles.modernSection;
}

function getTitleClass(t: ResumeTemplate) {
  if (t === 'classic') return styles.classicSectionTitle;
  if (t === 'minimal') return styles.minimalSectionTitle;
  return styles.modernSectionTitle;
}

function getEntryClass(t: ResumeTemplate) {
  if (t === 'classic') return styles.classicEntry;
  if (t === 'minimal') return styles.minimalEntry;
  return styles.modernEntry;
}

function getHeaderClass(t: ResumeTemplate) {
  if (t === 'classic') return styles.classicEntryHeader;
  if (t === 'minimal') return styles.minimalEntryHeader;
  return styles.modernEntryHeader;
}

function getEntryTitleClass(t: ResumeTemplate) {
  if (t === 'classic') return styles.classicEntryTitle;
  if (t === 'minimal') return styles.minimalEntryTitle;
  return styles.modernEntryTitle;
}

function getSubtitleClass(t: ResumeTemplate) {
  if (t === 'classic') return styles.classicEntrySubtitle;
  if (t === 'minimal') return styles.minimalEntrySubtitle;
  return styles.modernEntrySubtitle;
}

function getDateClass(t: ResumeTemplate) {
  if (t === 'classic') return styles.classicEntryDate;
  if (t === 'minimal') return styles.minimalEntryDate;
  return styles.modernEntryDate;
}

function getDescClass(t: ResumeTemplate) {
  if (t === 'classic') return styles.classicEntryDesc;
  if (t === 'minimal') return styles.minimalEntryDesc;
  return styles.modernEntryDesc;
}

function getBulletsClass(t: ResumeTemplate) {
  if (t === 'classic') return styles.classicBullets;
  if (t === 'minimal') return styles.minimalBullets;
  return styles.modernBullets;
}

// ────────────────────────────────────────────────────────────
// 1. MODERN TEMPLATE
// ────────────────────────────────────────────────────────────
export function ModernTemplate({ data }: TemplateProps) {
  const { personalInfo } = data;
  const order = data.sectionOrder || [];

  return (
    <div className={styles.modernRoot}>
      <header className={styles.modernHeader}>
        <h1 className={styles.modernName}>{personalInfo.fullName || 'Your Name'}</h1>
        {personalInfo.title && <div className={styles.modernTitle}>{personalInfo.title}</div>}
        <div className={styles.modernContactRow}>
          {personalInfo.email && <span className={styles.modernContactItem}>✉ {personalInfo.email}</span>}
          {personalInfo.phone && <span className={styles.modernContactItem}>☎ {personalInfo.phone}</span>}
          {personalInfo.location && <span className={styles.modernContactItem}>📍 {personalInfo.location}</span>}
          {personalInfo.linkedin && <span className={styles.modernContactItem}>in {personalInfo.linkedin}</span>}
          {personalInfo.github && <span className={styles.modernContactItem}>⌥ {personalInfo.github}</span>}
          {personalInfo.website && <span className={styles.modernContactItem}>🌐 {personalInfo.website}</span>}
        </div>
      </header>

      {order.map((sectionId) => renderSection(sectionId, data, 'modern'))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// 2. CLASSIC TEMPLATE
// ────────────────────────────────────────────────────────────
export function ClassicTemplate({ data }: TemplateProps) {
  const { personalInfo } = data;
  const order = data.sectionOrder || [];

  return (
    <div className={styles.classicRoot}>
      <header className={styles.classicHeader}>
        <h1 className={styles.classicName}>{personalInfo.fullName || 'YOUR NAME'}</h1>
        {personalInfo.title && <div className={styles.classicTitle}>{personalInfo.title}</div>}
        <div className={styles.classicContactRow}>
          {[
            personalInfo.email,
            personalInfo.phone,
            personalInfo.location,
            personalInfo.linkedin,
            personalInfo.github,
            personalInfo.website,
          ]
            .filter(Boolean)
            .join('  •  ')}
        </div>
      </header>

      {order.map((sectionId) => renderSection(sectionId, data, 'classic'))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// 3. MINIMAL TEMPLATE
// ────────────────────────────────────────────────────────────
export function MinimalTemplate({ data }: TemplateProps) {
  const { personalInfo } = data;
  const order = data.sectionOrder || [];

  return (
    <div className={styles.minimalRoot}>
      <header className={styles.minimalHeader}>
        <div>
          <h1 className={styles.minimalName}>{personalInfo.fullName || 'Your Name'}</h1>
          {personalInfo.title && <div className={styles.minimalTitle}>{personalInfo.title}</div>}
        </div>
        <div className={styles.minimalContactCol}>
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.phone && <span>{personalInfo.phone}</span>}
          {personalInfo.location && <span>{personalInfo.location}</span>}
          {personalInfo.linkedin && <span>{personalInfo.linkedin}</span>}
          {personalInfo.github && <span>{personalInfo.github}</span>}
        </div>
      </header>

      {order.map((sectionId) => renderSection(sectionId, data, 'minimal'))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// MAIN RENDERER COMPONENT
// ────────────────────────────────────────────────────────────
export function ResumeTemplateRenderer({
  template,
  data,
}: {
  template: ResumeTemplate;
  data: ResumeData;
}) {
  return (
    <div className={styles.resumePage} id="printable-resume-page">
      {template === 'classic' ? (
        <ClassicTemplate data={data} />
      ) : template === 'minimal' ? (
        <MinimalTemplate data={data} />
      ) : (
        <ModernTemplate data={data} />
      )}
    </div>
  );
}

export function renderResumeTemplate(data: ResumeData, template: ResumeTemplate) {
  return <ResumeTemplateRenderer template={template} data={data} />;
}

