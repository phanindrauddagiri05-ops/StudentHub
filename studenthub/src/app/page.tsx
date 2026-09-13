import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, FileText, BookOpen, GraduationCap, BarChart3, Calendar, Brain, CheckCircle, ChevronDown, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';
import ToolCard from '@/components/tools/ToolCard';
import { TOOLS } from '@/lib/tools';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'StudentHub — Everything You Need for Student Life',
  description: 'Create resumes, manage documents, organize notes, track attendance, prepare for exams and study smarter — all from one student workspace.',
};

const FEATURES = [
  {
    category: 'Study',
    icon: <Brain size={22} />,
    color: '#7c3aed',
    items: ['Notes', 'Study Search', 'Mind Maps', 'Question Prep'],
  },
  {
    category: 'Documents',
    icon: <FileText size={22} />,
    color: '#2563eb',
    items: ['PDF Tools', 'PDF Summary'],
  },
  {
    category: 'Career',
    icon: <GraduationCap size={22} />,
    color: '#059669',
    items: ['Resume Generator'],
  },
  {
    category: 'Planning',
    icon: <Calendar size={22} />,
    color: '#d97706',
    items: ['Attendance Tracker', 'Timetable'],
  },
  {
    category: 'Academic',
    icon: <BarChart3 size={22} />,
    color: '#dc2626',
    items: ['Percentage Calculator'],
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Choose a Tool',
    desc: 'Select the academic tool you need from our growing collection.',
    icon: '🔍',
  },
  {
    step: '02',
    title: 'Get Your Work Done',
    desc: 'Upload files, enter information or generate content instantly.',
    icon: '⚡',
  },
  {
    step: '03',
    title: 'Save & Continue',
    desc: 'Keep your work organized in your StudentHub workspace.',
    icon: '✅',
  },
];

const WHY_ITEMS = [
  {
    icon: '🗂️',
    title: 'One Workspace',
    desc: 'Keep all your academic tools and generated content in one organized place.',
  },
  {
    icon: '✨',
    title: 'Simple',
    desc: 'No complicated software or confusing interfaces — just open and use.',
  },
  {
    icon: '📁',
    title: 'Organized',
    desc: 'Your study materials and generated content are always easy to find.',
  },
  {
    icon: '🚀',
    title: 'Always Growing',
    desc: 'New student-focused tools are added regularly as StudentHub expands.',
  },
];

const FAQ = [
  {
    q: 'What is StudentHub?',
    a: 'StudentHub is an all-in-one productivity platform designed around the everyday needs of students. It brings your academic tools, documents, and workflow together in a single organized workspace.',
  },
  {
    q: 'Is StudentHub free?',
    a: 'Yes. StudentHub is free to use. We focus on building useful tools that every student needs, without unnecessary paywalls.',
  },
  {
    q: 'What tools are available now?',
    a: 'PDF Tools is the first fully functional tool — you can merge, split, convert, reorder and compress PDF files directly in your browser. More tools are being developed.',
  },
  {
    q: 'Will more tools be added?',
    a: 'Yes. StudentHub is designed as a growing platform. Resume Generator, Notes, PDF Summary, Mind Maps, Attendance Calculator, Timetable, and more are actively being built.',
  },
  {
    q: 'Can I use StudentHub on mobile?',
    a: 'Yes. StudentHub is fully responsive and works on desktop, tablet and mobile devices.',
  },
];

const FUTURE_TOOLS = [
  { emoji: '📄', name: 'Resume' },
  { emoji: '📝', name: 'Notes' },
  { emoji: '✨', name: 'AI Summary' },
  { emoji: '🧠', name: 'Mind Maps' },
  { emoji: '❓', name: 'Questions' },
  { emoji: '📅', name: 'Attendance' },
  { emoji: '🗓️', name: 'Timetable' },
];

export default function HomePage() {
  const featuredTools = TOOLS.slice(0, 6);

  return (
    <>
      {/* ── Hero ────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <Sparkles size={14} />
              <span>Your All-in-One Student Workspace</span>
            </div>

            <h1 className={styles.heroTitle}>
              Everything You Need<br />
              <span className="gradient-text">for Student Life.</span>
            </h1>

            <p className={styles.heroSubtitle}>
              Create resumes, manage documents, organize notes, track attendance, prepare for exams
              and study smarter — all from one student workspace.
            </p>

            <div className={styles.heroActions}>
              <Button variant="primary" href="/signup" size="lg" id="hero-get-started">
                Get Started Free
                <ArrowRight size={18} />
              </Button>
              <Button variant="outline" href="/tools" size="lg" id="hero-explore-tools">
                Explore Tools
              </Button>
            </div>

            {/* Trust indicators */}
            <div className={styles.trustBar}>
              {[
                { icon: <CheckCircle size={15} />, text: '10+ Student Tools' },
                { icon: <CheckCircle size={15} />, text: 'One Student Workspace' },
                { icon: <CheckCircle size={15} />, text: 'Simple & Organized' },
                { icon: <CheckCircle size={15} />, text: 'Built for Students' },
              ].map((item, i) => (
                <div key={i} className={styles.trustItem}>
                  <span className={styles.trustIcon}>{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard preview */}
          <div className={styles.heroVisual}>
            <div className={styles.dashboardPreview}>
              <div className={styles.previewHeader}>
                <div className={styles.previewDots}>
                  <span /><span /><span />
                </div>
                <span className={styles.previewTitle}>StudentHub Dashboard</span>
              </div>
              <div className={styles.previewGrid}>
                {[
                  { icon: '📋', name: 'PDF Tools', status: 'available', color: '#eff6ff' },
                  { icon: '📄', name: 'Resume', status: 'soon', color: '#f5f3ff' },
                  { icon: '📝', name: 'Notes', status: 'soon', color: '#fffbeb' },
                  { icon: '📅', name: 'Attendance', status: 'soon', color: '#f0fdf4' },
                  { icon: '🗓️', name: 'Timetable', status: 'soon', color: '#fef2f2' },
                  { icon: '🧠', name: 'Mind Maps', status: 'soon', color: '#f5f3ff' },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={styles.previewCard}
                    style={{ background: item.color }}
                  >
                    <span className={styles.previewCardIcon}>{item.icon}</span>
                    <span className={styles.previewCardName}>{item.name}</span>
                    {item.status === 'available' ? (
                      <span className={styles.previewAvailable}>● Available</span>
                    ) : (
                      <span className={styles.previewSoon}>● Soon</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────── */}
      <section className={`section ${styles.features}`} id="features">
        <div className="container">
          <div className="section-header">
            <div className="section-tag">
              <BookOpen size={14} />
              Features
            </div>
            <h2 className="section-title">Everything in One Place</h2>
            <p className="section-subtitle">
              A growing collection of tools designed around the everyday needs of students.
            </p>
          </div>

          <div className={styles.featuresGrid}>
            {FEATURES.map((f) => (
              <div key={f.category} className={styles.featureCard}>
                <div
                  className={styles.featureIcon}
                  style={{
                    background: `color-mix(in srgb, ${f.color} 12%, white)`,
                    color: f.color,
                  }}
                >
                  {f.icon}
                </div>
                <h3 className={styles.featureCategory}>{f.category}</h3>
                <ul className={styles.featureItems}>
                  {f.items.map((item) => (
                    <li key={item} className={styles.featureItem}>
                      <CheckCircle size={13} className={styles.featureCheck} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tools Preview ─────────────────────────────────── */}
      <section className={`section ${styles.toolsPreview}`}>
        <div className="container">
          <div className="section-header">
            <div className="section-tag">🧰 Tools</div>
            <h2 className="section-title">Student Tools</h2>
            <p className="section-subtitle">
              Explore what&apos;s available now and what&apos;s coming soon.
            </p>
          </div>

          <div className={styles.toolsGrid}>
            {featuredTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>

          <div className={styles.toolsViewAll}>
            <Button variant="outline" href="/tools" id="view-all-tools">
              View All Tools <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────── */}
      <section className={`section ${styles.howItWorks}`} id="how-it-works">
        <div className="container">
          <div className="section-header">
            <div className="section-tag">⚡ How It Works</div>
            <h2 className="section-title">Three Simple Steps</h2>
          </div>
          <div className={styles.stepsGrid}>
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} className={styles.step}>
                <div className={styles.stepNumber}>{step.step}</div>
                <div className={styles.stepIcon}>{step.icon}</div>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDesc}>{step.desc}</p>
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className={styles.stepArrow} aria-hidden="true">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why StudentHub ────────────────────────────────── */}
      <section className={`section ${styles.why}`}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Built Around Student Life</h2>
          </div>
          <div className={styles.whyGrid}>
            {WHY_ITEMS.map((item, i) => (
              <div key={i} className={styles.whyCard}>
                <span className={styles.whyIcon}>{item.icon}</span>
                <h3 className={styles.whyTitle}>{item.title}</h3>
                <p className={styles.whyDesc}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Future Tools ─────────────────────────────────── */}
      <section className={`section ${styles.futureTools}`}>
        <div className="container">
          <div className="section-header">
            <div className="section-tag">🔮 Roadmap</div>
            <h2 className="section-title">More Tools Are Coming</h2>
            <p className="section-subtitle">
              StudentHub is growing. Here&apos;s what we&apos;re building next.
            </p>
          </div>
          <div className={styles.futureGrid}>
            {FUTURE_TOOLS.map((tool, i) => (
              <div key={i} className={styles.futureChip}>
                <span>{tool.emoji}</span>
                <span>{tool.name}</span>
                <span className={styles.futureChipBadge}>Soon</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────── */}
      <section className={`section ${styles.faq}`} id="faq">
        <div className="container">
          <div className="section-header">
            <div className="section-tag">❓ FAQ</div>
            <h2 className="section-title">Frequently Asked Questions</h2>
          </div>
          <div className={styles.faqList}>
            {FAQ.map((item, i) => (
              <details key={i} className={styles.faqItem} id={`faq-${i}`}>
                <summary className={styles.faqQ}>
                  <span>{item.q}</span>
                  <ChevronDown size={18} className={styles.faqChevron} />
                </summary>
                <p className={styles.faqA}>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────── */}
      <section className={styles.cta}>
        <div className="container">
          <div className={styles.ctaBox}>
            <h2 className={styles.ctaTitle}>Your Student Workspace Starts Here.</h2>
            <p className={styles.ctaSubtitle}>
              Bring your study tools, documents and academic workflow together.
            </p>
            <div className={styles.ctaActions}>
              <Button variant="primary" href="/signup" size="lg" id="cta-get-started">
                Get Started Free <ArrowRight size={18} />
              </Button>
              <Button variant="ghost" href="/tools" size="lg" id="cta-explore">
                Explore Tools
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
