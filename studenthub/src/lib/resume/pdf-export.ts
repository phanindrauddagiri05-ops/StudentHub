// ============================================================
// StudentHub — Client-Side Resume PDF Generator (pdf-lib)
// ============================================================

import { PDFDocument, StandardFonts, rgb, PDFFont } from 'pdf-lib';
import type { ResumeData, ResumeTemplate } from './types';

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const MARGIN_LEFT = 42;
const MARGIN_RIGHT = 42;
const MARGIN_TOP = 42;
const MARGIN_BOTTOM = 42;
const CONTENT_WIDTH = A4_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

// Color helpers
const COLOR_BLACK = rgb(0.08, 0.1, 0.15);
const COLOR_MUTED = rgb(0.38, 0.43, 0.5);
const COLOR_BLUE = rgb(0.12, 0.35, 0.85);
const COLOR_RULE = rgb(0.85, 0.88, 0.92);

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  if (!text) return [];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, size);
    if (width <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

export async function generateResumePdf(
  data: ResumeData,
  template: ResumeTemplate = 'modern'
): Promise<{ data: Uint8Array; filename: string }> {
  const pdfDoc = await PDFDocument.create();

  // Fonts selection based on template
  const isClassic = template === 'classic';
  const regularFont = await pdfDoc.embedFont(
    isClassic ? StandardFonts.TimesRoman : StandardFonts.Helvetica
  );
  const boldFont = await pdfDoc.embedFont(
    isClassic ? StandardFonts.TimesRomanBold : StandardFonts.HelveticaBold
  );
  const italicFont = await pdfDoc.embedFont(
    isClassic ? StandardFonts.TimesRomanItalic : StandardFonts.HelveticaOblique
  );

  let page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
  let cursorY = A4_HEIGHT - MARGIN_TOP;

  const ensureSpace = (neededHeight: number) => {
    if (cursorY - neededHeight < MARGIN_BOTTOM) {
      page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
      cursorY = A4_HEIGHT - MARGIN_TOP;
    }
  };

  const { personalInfo } = data;
  const primaryTitleColor = isClassic
    ? COLOR_BLACK
    : template === 'minimal'
    ? COLOR_MUTED
    : COLOR_BLUE;

  // ────────────────────────────────────────────────────────────
  // 1. HEADER SECTION
  // ────────────────────────────────────────────────────────────
  const name = personalInfo.fullName || 'Your Name';
  const title = personalInfo.title || '';
  const contactParts = [
    personalInfo.email,
    personalInfo.phone,
    personalInfo.location,
    personalInfo.linkedin,
    personalInfo.github,
    personalInfo.website,
  ].filter(Boolean) as string[];

  if (isClassic) {
    // Classic: Centered header
    const nameWidth = boldFont.widthOfTextAtSize(name.toUpperCase(), 18);
    page.drawText(name.toUpperCase(), {
      x: (A4_WIDTH - nameWidth) / 2,
      y: cursorY - 18,
      size: 18,
      font: boldFont,
      color: COLOR_BLACK,
    });
    cursorY -= 24;

    if (title) {
      const titleWidth = italicFont.widthOfTextAtSize(title, 11);
      page.drawText(title, {
        x: (A4_WIDTH - titleWidth) / 2,
        y: cursorY - 11,
        size: 11,
        font: italicFont,
        color: COLOR_MUTED,
      });
      cursorY -= 16;
    }

    if (contactParts.length > 0) {
      const contactStr = contactParts.join('   •   ');
      const contactWidth = regularFont.widthOfTextAtSize(contactStr, 9.5);
      const contactX = Math.max(MARGIN_LEFT, (A4_WIDTH - contactWidth) / 2);
      page.drawText(contactStr, {
        x: contactX,
        y: cursorY - 9.5,
        size: 9.5,
        font: regularFont,
        color: COLOR_MUTED,
      });
      cursorY -= 16;
    }

    page.drawLine({
      start: { x: MARGIN_LEFT, y: cursorY },
      end: { x: A4_WIDTH - MARGIN_RIGHT, y: cursorY },
      thickness: 0.75,
      color: COLOR_BLACK,
    });
    cursorY -= 16;
  } else {
    // Modern & Minimal: Left aligned header
    page.drawText(name, {
      x: MARGIN_LEFT,
      y: cursorY - 22,
      size: 22,
      font: boldFont,
      color: COLOR_BLACK,
    });
    cursorY -= 26;

    if (title) {
      page.drawText(title, {
        x: MARGIN_LEFT,
        y: cursorY - 12,
        size: 12,
        font: boldFont,
        color: primaryTitleColor,
      });
      cursorY -= 16;
    }

    if (contactParts.length > 0) {
      const contactStr = contactParts.join('  •  ');
      page.drawText(contactStr, {
        x: MARGIN_LEFT,
        y: cursorY - 9.5,
        size: 9.5,
        font: regularFont,
        color: COLOR_MUTED,
      });
      cursorY -= 14;
    }

    // Accent line under header
    page.drawLine({
      start: { x: MARGIN_LEFT, y: cursorY },
      end: { x: A4_WIDTH - MARGIN_RIGHT, y: cursorY },
      thickness: template === 'modern' ? 1.5 : 0.75,
      color: template === 'modern' ? COLOR_BLUE : COLOR_RULE,
    });
    cursorY -= 18;
  }

  // ────────────────────────────────────────────────────────────
  // 2. SECTIONS RENDERING
  // ────────────────────────────────────────────────────────────
  const order = data.sectionOrder || [
    'summary',
    'education',
    'experience',
    'projects',
    'skills',
    'certifications',
    'achievements',
    'languages',
    'interests',
  ];

  const renderSectionHeader = (titleText: string) => {
    ensureSpace(34);
    cursorY -= 4;
    page.drawText(titleText.toUpperCase(), {
      x: MARGIN_LEFT,
      y: cursorY - 11,
      size: 11,
      font: boldFont,
      color: primaryTitleColor,
    });
    cursorY -= 15;

    page.drawLine({
      start: { x: MARGIN_LEFT, y: cursorY },
      end: { x: A4_WIDTH - MARGIN_RIGHT, y: cursorY },
      thickness: 0.5,
      color: COLOR_RULE,
    });
    cursorY -= 10;
  };

  for (const sectionId of order) {
    if (sectionId === 'summary' && data.summary?.trim()) {
      renderSectionHeader('Professional Summary');
      const lines = wrapText(data.summary, regularFont, 10, CONTENT_WIDTH);
      for (const line of lines) {
        ensureSpace(14);
        page.drawText(line, {
          x: MARGIN_LEFT,
          y: cursorY - 10,
          size: 10,
          font: regularFont,
          color: COLOR_BLACK,
        });
        cursorY -= 14;
      }
      cursorY -= 6;
    }

    if (sectionId === 'education' && data.education?.length > 0) {
      renderSectionHeader('Education');
      for (const edu of data.education) {
        ensureSpace(36);
        const inst = edu.institution || 'Institution';
        const dateRange = `${edu.startDate || ''} – ${edu.endDate || 'Present'}`;

        // Line 1: Institution + Dates
        page.drawText(inst, {
          x: MARGIN_LEFT,
          y: cursorY - 10.5,
          size: 10.5,
          font: boldFont,
          color: COLOR_BLACK,
        });
        const dateW = regularFont.widthOfTextAtSize(dateRange, 9.5);
        page.drawText(dateRange, {
          x: A4_WIDTH - MARGIN_RIGHT - dateW,
          y: cursorY - 9.5,
          size: 9.5,
          font: regularFont,
          color: COLOR_MUTED,
        });
        cursorY -= 14;

        // Line 2: Degree + Grade
        const degreeLine = `${edu.degree || ''}${edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}${
          edu.grade ? ` • ${edu.grade}` : ''
        }`;
        if (degreeLine.trim()) {
          page.drawText(degreeLine, {
            x: MARGIN_LEFT,
            y: cursorY - 10,
            size: 10,
            font: italicFont,
            color: COLOR_MUTED,
          });
          cursorY -= 13;
        }

        // Line 3: Description if any
        if (edu.description) {
          const lines = wrapText(edu.description, regularFont, 9.5, CONTENT_WIDTH);
          for (const line of lines) {
            ensureSpace(13);
            page.drawText(line, {
              x: MARGIN_LEFT,
              y: cursorY - 9.5,
              size: 9.5,
              font: regularFont,
              color: COLOR_BLACK,
            });
            cursorY -= 13;
          }
        }
        cursorY -= 4;
      }
      cursorY -= 4;
    }

    if (sectionId === 'experience' && data.experience?.length > 0) {
      renderSectionHeader('Experience');
      for (const exp of data.experience) {
        ensureSpace(38);
        const job = exp.jobTitle || 'Role';
        const dateRange = `${exp.startDate || ''} – ${
          exp.currentlyWorking ? 'Present' : exp.endDate || 'Present'
        }`;

        page.drawText(job, {
          x: MARGIN_LEFT,
          y: cursorY - 10.5,
          size: 10.5,
          font: boldFont,
          color: COLOR_BLACK,
        });
        const dateW = regularFont.widthOfTextAtSize(dateRange, 9.5);
        page.drawText(dateRange, {
          x: A4_WIDTH - MARGIN_RIGHT - dateW,
          y: cursorY - 9.5,
          size: 9.5,
          font: regularFont,
          color: COLOR_MUTED,
        });
        cursorY -= 14;

        const compLine = `${exp.company || ''}${exp.location ? ` • ${exp.location}` : ''}`;
        if (compLine.trim()) {
          page.drawText(compLine, {
            x: MARGIN_LEFT,
            y: cursorY - 10,
            size: 10,
            font: italicFont,
            color: COLOR_MUTED,
          });
          cursorY -= 13;
        }

        if (exp.bullets?.length > 0) {
          for (const bullet of exp.bullets) {
            if (!bullet.trim()) continue;
            const lines = wrapText(bullet, regularFont, 9.5, CONTENT_WIDTH - 14);
            for (let i = 0; i < lines.length; i++) {
              ensureSpace(13);
              if (i === 0) {
                page.drawText('•', {
                  x: MARGIN_LEFT + 2,
                  y: cursorY - 9.5,
                  size: 9.5,
                  font: boldFont,
                  color: COLOR_BLACK,
                });
              }
              page.drawText(lines[i], {
                x: MARGIN_LEFT + 14,
                y: cursorY - 9.5,
                size: 9.5,
                font: regularFont,
                color: COLOR_BLACK,
              });
              cursorY -= 13;
            }
          }
        }
        cursorY -= 4;
      }
      cursorY -= 4;
    }

    if (sectionId === 'projects' && data.projects?.length > 0) {
      renderSectionHeader('Projects');
      for (const proj of data.projects) {
        ensureSpace(34);
        const nameAndTech = `${proj.name || 'Project'}${
          proj.technologies ? `  (${proj.technologies})` : ''
        }`;
        const urlStr = proj.projectUrl || proj.githubUrl || '';

        page.drawText(nameAndTech, {
          x: MARGIN_LEFT,
          y: cursorY - 10.5,
          size: 10.5,
          font: boldFont,
          color: COLOR_BLACK,
        });
        if (urlStr) {
          const urlW = regularFont.widthOfTextAtSize(urlStr, 9);
          page.drawText(urlStr, {
            x: A4_WIDTH - MARGIN_RIGHT - urlW,
            y: cursorY - 9,
            size: 9,
            font: regularFont,
            color: COLOR_MUTED,
          });
        }
        cursorY -= 14;

        if (proj.description) {
          const lines = wrapText(proj.description, regularFont, 9.5, CONTENT_WIDTH);
          for (const line of lines) {
            ensureSpace(13);
            page.drawText(line, {
              x: MARGIN_LEFT,
              y: cursorY - 9.5,
              size: 9.5,
              font: regularFont,
              color: COLOR_BLACK,
            });
            cursorY -= 13;
          }
        }
        cursorY -= 4;
      }
      cursorY -= 4;
    }

    if (sectionId === 'skills' && data.skills?.length > 0) {
      renderSectionHeader('Skills & Technologies');
      const skillsStr = data.skills.join('  •  ');
      const lines = wrapText(skillsStr, regularFont, 9.5, CONTENT_WIDTH);
      for (const line of lines) {
        ensureSpace(14);
        page.drawText(line, {
          x: MARGIN_LEFT,
          y: cursorY - 9.5,
          size: 9.5,
          font: regularFont,
          color: COLOR_BLACK,
        });
        cursorY -= 14;
      }
      cursorY -= 6;
    }

    if (sectionId === 'certifications' && data.certifications?.length > 0) {
      renderSectionHeader('Certifications');
      for (const cert of data.certifications) {
        ensureSpace(22);
        const certLine = `${cert.name || 'Certificate'} — ${cert.issuer || ''}`;
        page.drawText(certLine, {
          x: MARGIN_LEFT,
          y: cursorY - 9.5,
          size: 9.5,
          font: boldFont,
          color: COLOR_BLACK,
        });
        if (cert.issueDate) {
          const dateW = regularFont.widthOfTextAtSize(cert.issueDate, 9);
          page.drawText(cert.issueDate, {
            x: A4_WIDTH - MARGIN_RIGHT - dateW,
            y: cursorY - 9,
            size: 9,
            font: regularFont,
            color: COLOR_MUTED,
          });
        }
        cursorY -= 14;
      }
      cursorY -= 4;
    }

    if (sectionId === 'achievements' && data.achievements?.length > 0) {
      renderSectionHeader('Achievements & Awards');
      for (const ach of data.achievements) {
        ensureSpace(24);
        page.drawText(ach.title, {
          x: MARGIN_LEFT,
          y: cursorY - 9.5,
          size: 9.5,
          font: boldFont,
          color: COLOR_BLACK,
        });
        if (ach.date) {
          const dW = regularFont.widthOfTextAtSize(ach.date, 9);
          page.drawText(ach.date, {
            x: A4_WIDTH - MARGIN_RIGHT - dW,
            y: cursorY - 9,
            size: 9,
            font: regularFont,
            color: COLOR_MUTED,
          });
        }
        cursorY -= 13;

        if (ach.description) {
          const lines = wrapText(ach.description, regularFont, 9, CONTENT_WIDTH);
          for (const line of lines) {
            ensureSpace(12);
            page.drawText(line, {
              x: MARGIN_LEFT,
              y: cursorY - 9,
              size: 9,
              font: regularFont,
              color: COLOR_BLACK,
            });
            cursorY -= 12;
          }
        }
        cursorY -= 3;
      }
      cursorY -= 4;
    }

    if (sectionId === 'languages' && data.languages?.length > 0) {
      renderSectionHeader('Languages');
      const langStr = data.languages
        .map((l) => `${l.language}${l.proficiency ? ` (${l.proficiency})` : ''}`)
        .join('   •   ');
      ensureSpace(14);
      page.drawText(langStr, {
        x: MARGIN_LEFT,
        y: cursorY - 9.5,
        size: 9.5,
        font: regularFont,
        color: COLOR_BLACK,
      });
      cursorY -= 18;
    }

    if (sectionId === 'interests' && data.interests?.length > 0) {
      renderSectionHeader('Interests');
      const intStr = data.interests.join('   •   ');
      ensureSpace(14);
      page.drawText(intStr, {
        x: MARGIN_LEFT,
        y: cursorY - 9.5,
        size: 9.5,
        font: regularFont,
        color: COLOR_BLACK,
      });
      cursorY -= 18;
    }
  }

  const pdfBytes = await pdfDoc.save();
  const cleanTitle = (personalInfo.fullName || 'Resume')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .toLowerCase();

  return {
    data: pdfBytes,
    filename: `${cleanTitle}_resume.pdf`,
  };
}

export function printResume(): void {
  if (typeof window !== 'undefined') {
    window.print();
  }
}
