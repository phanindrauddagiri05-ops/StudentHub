'use client';

import React, { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Activity,
  Sparkles,
  Plus,
  Bookmark,
  FolderTree,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { getDashboardStats, getUserActivities } from '@/lib/storage/file-service';
import { formatRelativeTime } from '@/lib/utils/date';
import type { DashboardStats, ActivityLog } from '@/types/database';
import { CreateResumeModal } from '@/components/tools/resume/CreateResumeModal';
import styles from './dashboard.module.css';

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [createResumeOpen, setCreateResumeOpen] = useState(false);
  const [, startTransition] = useTransition();

  // Time-of-day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const realName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Student';

  useEffect(() => {
    if (!user) return;

    let mounted = true;
    async function loadData() {
      try {
        const [statsData, activitiesData] = await Promise.all([
          getDashboardStats(user!.id),
          getUserActivities({ userId: user!.id, limit: 6 }),
        ]);

        if (mounted) {
          startTransition(() => {
            setStats(statsData);
            setActivities(activitiesData);
            setLoading(false);
          });
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        if (mounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [user]);

  const QUICK_TOOLS = [
    {
      id: 'resume-generator',
      name: 'Resume Generator',
      desc: 'Build ATS-friendly, professional resumes with live A4 preview and instant vector PDF export.',
      emoji: '💼',
      status: 'available',
      href: '/tools/resume',
      actionText: 'Build Resume',
    },
    {
      id: 'pdf-tools',
      name: 'PDF Tools',
      desc: 'Merge, split, reorder, compress, and convert PDF documents privately in your browser.',
      emoji: '📄',
      status: 'available',
      href: '/tools/pdf',
      actionText: 'Open Tool',
    },
    {
      id: 'percentage-calculator',
      name: 'Percentage Calculator',
      desc: 'Calculate college semester grades, CGPA to percentage, and marks required for target cutoffs.',
      emoji: '📊',
      status: 'coming-soon',
      href: '#',
      actionText: 'Coming Soon',
    },
    {
      id: 'notes-organizer',
      name: 'Smart Notes',
      desc: 'Organize lecture notes, extract key definitions, and generate study flashcards.',
      emoji: '📝',
      status: 'coming-soon',
      href: '#',
      actionText: 'Coming Soon',
    },
    {
      id: 'pdf-summary',
      name: 'PDF Summary',
      desc: 'Extract key takeaways and generate executive chapter summaries from textbooks.',
      emoji: '📑',
      status: 'coming-soon',
      href: '#',
      actionText: 'Coming Soon',
    },
    {
      id: 'mind-map',
      name: 'Mind Map Generator',
      desc: 'Turn complex concepts, historical timelines, and syllabi into interactive visual diagrams.',
      emoji: '🧠',
      status: 'coming-soon',
      href: '#',
      actionText: 'Coming Soon',
    },
    {
      id: 'question-preparation',
      name: 'Question Preparation',
      desc: 'Generate exam practice sets, multiple choice tests, and flashcards from study materials.',
      emoji: '❓',
      status: 'coming-soon',
      href: '#',
      actionText: 'Coming Soon',
    },
    {
      id: 'attendance-calculator',
      name: 'Attendance Calculator',
      desc: 'Track attendance requirements and calculate safe leaves to maintain 75%+ eligibility.',
      emoji: '📅',
      status: 'coming-soon',
      href: '#',
      actionText: 'Coming Soon',
    },
    {
      id: 'timetable-generator',
      name: 'Timetable Generator',
      desc: 'Generate automated balanced class schedules and study revision planners.',
      emoji: '⏰',
      status: 'coming-soon',
      href: '#',
      actionText: 'Coming Soon',
    },
    {
      id: 'study-search',
      name: 'Study Search',
      desc: 'Search your local textbook library and notes instantly with semantic indexing.',
      emoji: '🔍',
      status: 'coming-soon',
      href: '#',
      actionText: 'Coming Soon',
    },
  ];

  const formatActivityAction = (action: string) => {
    const map: Record<string, string> = {
      pdf_merge: 'PDF merged',
      pdf_split: 'PDF split',
      pdf_compress: 'PDF compressed',
      pdf_reorder: 'PDF pages reordered',
      pdf_pdf_to_images: 'PDF converted to images',
      pdf_images_to_pdf: 'Images converted to PDF',
      resume_create: 'Resume created',
      resume_update: 'Resume updated',
      resume_duplicate: 'Resume duplicated',
      resume_delete: 'Resume deleted',
      resume_export: 'Resume exported as PDF',
    };
    return map[action] || action.replace(/_/g, ' ');
  };

  const totalSavedFiles = (stats?.pdfFilesCount ?? 0) + (stats?.resumesCount ?? 0);

  return (
    <div className={styles.dashboard}>
      {/* ── Welcome & Primary Quick Actions ───────────────────── */}
      <section className={styles.welcomeSection}>
        <div className={styles.greetingRow}>
          <div>
            <h1 className={styles.greetingTitle}>
              {getGreeting()}, {realName} 👋
            </h1>
            <p className={styles.greetingSubtitle}>
              Everything you need to study, organize, and build your career.
            </p>
          </div>
        </div>

        {/* Primary Quick Action Buttons */}
        <div className={styles.quickActionsRow}>
          <button
            type="button"
            className={[styles.quickActionBtn, styles.quickActionPrimary].join(' ')}
            onClick={() => setCreateResumeOpen(true)}
          >
            <Plus size={16} />
            Create Resume
          </button>
          <Link href="/tools/pdf" className={styles.quickActionBtn}>
            <FileText size={16} color="#2563eb" />
            PDF Tools
          </Link>
          <Link href="/tools#study" className={styles.quickActionBtn}>
            <Bookmark size={16} color="#7c3aed" />
            Upload Notes
          </Link>
          <Link href="/tools#academic" className={styles.quickActionBtn}>
            <Sparkles size={16} color="#059669" />
            Calculate Percentage
          </Link>
        </div>
      </section>

      {/* ── Real Statistics Cards ────────────────────────────── */}
      <section aria-label="Dashboard Statistics">
        <div className={styles.statsGrid}>
          {/* PDFs Processed */}
          <div className={styles.statCard}>
            <div className={[styles.statIconBox, styles.iconBlue].join(' ')}>
              <FileText size={24} />
            </div>
            <div className={styles.statInfo}>
              {loading ? (
                <div className={styles.skeleton} style={{ width: 40, height: 28 }} />
              ) : (
                <span className={styles.statValue}>{stats?.pdfFilesCount ?? 0}</span>
              )}
              <span className={styles.statLabel}>PDFs Processed</span>
            </div>
          </div>

          {/* Saved Files */}
          <div className={styles.statCard}>
            <div className={[styles.statIconBox, styles.iconGreen].join(' ')}>
              <FolderTree size={24} />
            </div>
            <div className={styles.statInfo}>
              {loading ? (
                <div className={styles.skeleton} style={{ width: 40, height: 28 }} />
              ) : (
                <span className={styles.statValue}>{totalSavedFiles}</span>
              )}
              <span className={styles.statLabel}>Saved Files</span>
            </div>
          </div>

          {/* Resumes */}
          <div className={styles.statCard}>
            <div className={[styles.statIconBox, styles.iconPurple].join(' ')}>
              <Sparkles size={24} />
            </div>
            <div className={styles.statInfo}>
              {loading ? (
                <div className={styles.skeleton} style={{ width: 40, height: 28 }} />
              ) : (
                <span className={styles.statValue}>{stats?.resumesCount ?? 0}</span>
              )}
              <span className={styles.statLabel}>Resumes Built</span>
            </div>
          </div>

          {/* Recent Activity */}
          <div className={styles.statCard}>
            <div className={[styles.statIconBox, styles.iconOrange].join(' ')}>
              <Activity size={24} />
            </div>
            <div className={styles.statInfo}>
              {loading ? (
                <div className={styles.skeleton} style={{ width: 40, height: 28 }} />
              ) : (
                <span className={styles.statValue}>{stats?.activitiesCount ?? 0}</span>
              )}
              <span className={styles.statLabel}>Recent Activities</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Content Grid ─────────────────────────────────── */}
      <div className={styles.mainGrid}>
        {/* Quick Tools Section */}
        <section>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Quick Tools</h2>
            <Link href="/tools" className={styles.sectionLink}>
              View All Tools →
            </Link>
          </div>

          <div className={styles.toolsList}>
            {QUICK_TOOLS.map((tool) => (
              <div key={tool.id} className={styles.toolCard}>
                <div className={styles.toolCardHeader}>
                  <span className={styles.toolEmoji}>{tool.emoji}</span>
                  {tool.status === 'available' ? (
                    <span className={styles.toolBadgeActive}>Available</span>
                  ) : (
                    <span className={styles.toolBadgeSoon}>Coming Soon</span>
                  )}
                </div>
                <h3 className={styles.toolName}>{tool.name}</h3>
                <p className={styles.toolDesc}>{tool.desc}</p>
                <div>
                  {tool.status === 'available' ? (
                    <Button
                      variant="primary"
                      size="sm"
                      href={tool.href}
                      id={`dashboard-tool-${tool.id}`}
                    >
                      {tool.actionText}
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" disabled>
                      {tool.actionText}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Activity Feed */}
        <section>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Recent Activity</h2>
            <Link href="/history" className={styles.sectionLink}>
              Full History →
            </Link>
          </div>

          <div className={styles.activityCard}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div className={styles.skeleton} style={{ width: 34, height: 34 }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div className={styles.skeleton} style={{ width: '60%', height: 14 }} />
                      <div className={styles.skeleton} style={{ width: '40%', height: 10 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : activities.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>⏳</span>
                <p className={styles.emptyTitle}>No recent activity</p>
                <p className={styles.emptySubtitle}>
                  Create your first resume or process a PDF to view activity logs here.
                </p>
                <div style={{ marginTop: 12, display: 'flex', gap: '0.5rem' }}>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setCreateResumeOpen(true)}
                  >
                    Create Resume
                  </Button>
                  <Button variant="secondary" size="sm" href="/tools/pdf">
                    PDF Tools
                  </Button>
                </div>
              </div>
            ) : (
              <div className={styles.activityList}>
                {activities.map((act) => (
                  <div key={act.id} className={styles.activityItem}>
                    <div className={styles.activityIconBox}>
                      {act.action.startsWith('resume') ? (
                        <Sparkles size={16} />
                      ) : (
                        <FileText size={16} />
                      )}
                    </div>
                    <div className={styles.activityDetails}>
                      <div className={styles.activityAction}>{formatActivityAction(act.action)}</div>
                      {typeof act.metadata?.filename === 'string' && (
                        <div className={styles.activityFilename}>&ldquo;{act.metadata.filename}&rdquo;</div>
                      )}
                      {typeof act.metadata?.title === 'string' && (
                        <div className={styles.activityFilename}>&ldquo;{act.metadata.title}&rdquo;</div>
                      )}
                      <div className={styles.activityTime}>{formatRelativeTime(act.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Create Resume Modal */}
      <CreateResumeModal
        isOpen={createResumeOpen}
        onClose={() => setCreateResumeOpen(false)}
        onCreated={(id) => {
          setCreateResumeOpen(false);
          router.push(`/tools/resume/${id}`);
        }}
      />
    </div>
  );
}
