'use client';

import React, { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import {
  FileText,
  Activity,
  CheckCircle2,
  Clock,
  Search,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { getDashboardStats, getUserActivities } from '@/lib/storage/file-service';
import { formatRelativeTime } from '@/lib/utils/date';
import type { DashboardStats, ActivityLog } from '@/types/database';
import styles from './dashboard.module.css';

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [, startTransition] = useTransition();

  // Determine time-of-day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName =
    profile?.full_name?.split(' ')[0] ||
    user?.user_metadata?.full_name?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    'Student';

  useEffect(() => {
    if (!user) return;

    let mounted = true;
    async function loadData() {
      try {
        const [statsData, activitiesData] = await Promise.all([
          getDashboardStats(user!.id),
          getUserActivities({ userId: user!.id, limit: 5 }),
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
      id: 'pdf-tools',
      name: 'PDF Tools',
      desc: 'Merge, split, reorder, compress, and convert PDF documents in your browser.',
      emoji: '📄',
      status: 'available',
      href: '/tools/pdf',
      actionText: 'Open Tool',
    },
    {
      id: 'resume-generator',
      name: 'Resume Generator',
      desc: 'Build ATS-friendly professional resumes tailored to job descriptions.',
      emoji: '💼',
      status: 'coming-soon',
      href: '#',
      actionText: 'Coming Soon',
    },
    {
      id: 'notes-organizer',
      name: 'Smart Notes',
      desc: 'Organize lecture notes, extract key points, and generate flashcards.',
      emoji: '📝',
      status: 'coming-soon',
      href: '#',
      actionText: 'Coming Soon',
    },
    {
      id: 'mind-map',
      name: 'Mind Map Generator',
      desc: 'Turn complex concepts and syllabi into visual diagrams.',
      emoji: '🧠',
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
    };
    return map[action] || action.replace(/_/g, ' ');
  };

  return (
    <div className={styles.dashboard}>
      {/* ── Welcome & Workspace Search ───────────────────────── */}
      <section className={styles.welcomeSection}>
        <div className={styles.greetingRow}>
          <div>
            <h1 className={styles.greetingTitle}>
              {getGreeting()}, {firstName} 👋
            </h1>
            <p className={styles.greetingSubtitle}>Here&apos;s your student workspace.</p>
          </div>

          <div className={styles.searchWrapper}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search your workspace..."
              className={styles.searchInput}
              aria-label="Search workspace"
              readOnly
            />
          </div>
        </div>
      </section>

      {/* ── Real Statistics Cards ────────────────────────────── */}
      <section aria-label="Dashboard Statistics">
        <div className={styles.statsGrid}>
          {/* PDF Files */}
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
              <span className={styles.statLabel}>PDF Files Processed</span>
            </div>
          </div>

          {/* Recent Activity */}
          <div className={styles.statCard}>
            <div className={[styles.statIconBox, styles.iconPurple].join(' ')}>
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

          {/* Available Tools */}
          <div className={styles.statCard}>
            <div className={[styles.statIconBox, styles.iconGreen].join(' ')}>
              <CheckCircle2 size={24} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>1 Tool</span>
              <span className={styles.statLabel}>PDF Suite Available</span>
            </div>
          </div>

          {/* Coming Soon */}
          <div className={styles.statCard}>
            <div className={[styles.statIconBox, styles.iconOrange].join(' ')}>
              <Clock size={24} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>7 Tools</span>
              <span className={styles.statLabel}>Under Development</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Content Grid ─────────────────────────────────── */}
      <div className={styles.mainGrid}>
        {/* Quick Tools */}
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
                    <Button variant="primary" size="sm" href={tool.href} id={`dashboard-tool-${tool.id}`}>
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
                <p className={styles.emptySubtitle}>Use PDF Tools to process your first document.</p>
                <div style={{ marginTop: 12 }}>
                  <Button variant="primary" size="sm" href="/tools/pdf" id="dashboard-empty-tools">
                    Open PDF Tools
                  </Button>
                </div>
              </div>
            ) : (
              <div className={styles.activityList}>
                {activities.map((act) => (
                  <div key={act.id} className={styles.activityItem}>
                    <div className={styles.activityIconBox}>
                      <FileText size={16} />
                    </div>
                    <div className={styles.activityDetails}>
                      <div className={styles.activityAction}>{formatActivityAction(act.action)}</div>
                      {typeof act.metadata?.filename === 'string' && (
                        <div className={styles.activityFilename}>&ldquo;{act.metadata.filename}&rdquo;</div>
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
    </div>
  );
}
