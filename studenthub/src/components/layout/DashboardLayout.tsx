'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BookOpen,
  LayoutDashboard,
  Wrench,
  FileText,
  Search,
  History,
  User,
  Settings,
  LogOut,
  Bell,
  ChevronRight,
  Sparkles,
  ChevronDown,
  FolderTree,
  GraduationCap,
  Calendar,
  Briefcase,
  Layers,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import styles from './DashboardLayout.module.css';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const [toolsOpen, setToolsOpen] = useState(true);

  const handleLogout = async () => {
    await signOut();
    router.replace('/');
  };

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Student';
  const initial = displayName.charAt(0).toUpperCase();

  // Determine current page title and breadcrumb
  const getPageInfo = () => {
    if (pathname === '/dashboard') return { title: 'Dashboard', crumb: 'Home' };
    if (pathname === '/tools') return { title: 'Tools Directory', crumb: 'Tools' };
    if (pathname === '/tools/pdf') return { title: 'PDF Tools', crumb: 'Tools / Documents / PDF Tools' };
    if (pathname === '/tools/resume') return { title: 'Resume Generator', crumb: 'Tools / Career / Resume' };
    if (pathname.startsWith('/tools/resume/')) return { title: 'Resume Editor', crumb: 'Tools / Resume / Builder' };
    if (pathname === '/history') return { title: 'Document History', crumb: 'History / Documents' };
    if (pathname === '/history/resumes') return { title: 'Resume History', crumb: 'History / Resumes' };
    if (pathname === '/profile') return { title: 'Student Profile', crumb: 'Account / Profile' };
    if (pathname === '/settings') return { title: 'Account Settings', crumb: 'Account / Settings' };
    return { title: 'StudentHub', crumb: 'Workspace' };
  };

  const pageInfo = getPageInfo();

  const isCurrent = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const TOOL_CATEGORIES = [
    { label: 'All Tools', href: '/tools', icon: Layers, exact: true },
    { label: 'Documents', href: '/tools#documents', icon: FolderTree, count: 'PDF & Resumes' },
    { label: 'Career', href: '/tools/resume', icon: Briefcase, count: 'Resume Builder', active: true },
    { label: 'Study', href: '/tools#study', icon: BookOpen, count: 'Soon' },
    { label: 'Academic', href: '/tools#academic', icon: GraduationCap, count: 'Soon' },
    { label: 'Planning', href: '/tools#planning', icon: Calendar, count: 'Soon' },
  ];

  return (
    <div className={styles.shell}>
      {/* ── Desktop Sidebar ─────────────────────────────────── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoIcon}>
              <BookOpen size={20} strokeWidth={2.5} />
            </span>
            <span className={styles.logoText}>StudentHub</span>
          </Link>
        </div>

        <div className={styles.navSection}>
          <span className={styles.sectionTitle}>Main Workspace</span>

          <Link
            href="/dashboard"
            className={[styles.navItem, isCurrent('/dashboard', true) ? styles.navItemActive : ''].join(' ')}
          >
            <span className={styles.navIcon}>
              <LayoutDashboard size={18} />
            </span>
            <span className={styles.navLabel}>Dashboard</span>
          </Link>

          {/* Tools with Categories */}
          <div>
            <button
              type="button"
              className={[styles.navItem, pathname.startsWith('/tools') ? styles.navItemActive : ''].join(' ')}
              onClick={() => setToolsOpen(!toolsOpen)}
            >
              <span className={styles.navIcon}>
                <Wrench size={18} />
              </span>
              <span className={styles.navLabel}>Tools</span>
              <span className={styles.badgeAvailable}>2 Ready</span>
              <ChevronDown
                size={14}
                style={{
                  transform: toolsOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform 0.2s',
                  marginLeft: '0.25rem',
                  color: '#94a3b8',
                }}
              />
            </button>

            {toolsOpen && (
              <div style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
                {TOOL_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const active = isCurrent(cat.href, cat.exact);
                  return (
                    <Link
                      key={cat.label}
                      href={cat.href}
                      className={[styles.navItem, active ? styles.navItemActive : ''].join(' ')}
                      style={{ fontSize: '0.8125rem', padding: '6px 10px' }}
                    >
                      <span className={styles.navIcon}>
                        <Icon size={15} />
                      </span>
                      <span className={styles.navLabel}>{cat.label}</span>
                      {cat.active && (
                        <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', backgroundColor: '#eff6ff', color: '#2563eb' }}>
                          Ready
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* History */}
          <Link
            href="/history"
            className={[styles.navItem, pathname.startsWith('/history') ? styles.navItemActive : ''].join(' ')}
          >
            <span className={styles.navIcon}>
              <History size={18} />
            </span>
            <span className={styles.navLabel}>History</span>
          </Link>

          <span className={styles.sectionTitle} style={{ marginTop: 'var(--space-3)' }}>
            Account
          </span>

          <Link
            href="/profile"
            className={[styles.navItem, pathname === '/profile' ? styles.navItemActive : ''].join(' ')}
          >
            <span className={styles.navIcon}>
              <User size={18} />
            </span>
            <span className={styles.navLabel}>Profile</span>
          </Link>

          <Link
            href="/settings"
            className={[styles.navItem, pathname === '/settings' ? styles.navItemActive : ''].join(' ')}
          >
            <span className={styles.navIcon}>
              <Settings size={18} />
            </span>
            <span className={styles.navLabel}>Settings</span>
          </Link>
        </div>

        {/* User Card & Logout */}
        <div className={styles.sidebarFooter}>
          <Link href="/profile" className={styles.userCard} style={{ textDecoration: 'none' }}>
            <div className={styles.avatar}>{initial}</div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>{displayName}</div>
              <div className={styles.userEmail}>{user?.email || 'Student Account'}</div>
            </div>
          </Link>

          <button onClick={handleLogout} className={[styles.navItem, styles.logoutBtn].join(' ')}>
            <span className={styles.navIcon}>
              <LogOut size={18} />
            </span>
            <span className={styles.navLabel}>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main Workspace ──────────────────────────────────── */}
      <div className={styles.mainWrapper}>
        {/* Desktop Top Header */}
        <header className={styles.topHeader}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: '#64748b' }}>
              <span>StudentHub</span>
              <ChevronRight size={12} />
              <span>{pageInfo.crumb}</span>
            </div>
            <h1 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', margin: '2px 0 0 0' }}>
              {pageInfo.title}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className={styles.searchBar}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search tools, resumes, docs..."
                className={styles.searchInput}
                readOnly
                onClick={() => router.push('/tools')}
              />
              <span className={styles.searchShortcut}>/</span>
            </div>

            {/* Notifications Placeholder */}
            <button
              type="button"
              className={styles.quickToolBtn}
              style={{ padding: '8px', borderRadius: '8px', color: '#64748b', backgroundColor: '#f1f5f9' }}
              title="Notifications"
            >
              <Bell size={18} />
            </button>

            {/* Quick Resume Generator button */}
            <Link href="/tools/resume" className={styles.quickToolBtn}>
              <Sparkles size={15} />
              Resume Builder
            </Link>

            <Link href="/profile" className={styles.avatar} style={{ textDecoration: 'none' }} title={displayName}>
              {initial}
            </Link>
          </div>
        </header>

        {/* Mobile Compact Header */}
        <div className={styles.mobileHeader}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoIcon} style={{ width: 28, height: 28 }}>
              <BookOpen size={16} strokeWidth={2.5} />
            </span>
            <span className={styles.logoText} style={{ fontSize: 'var(--text-base)' }}>
              StudentHub
            </span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link href="/tools/resume" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2563eb', textDecoration: 'none', background: '#eff6ff', padding: '4px 8px', borderRadius: '6px' }}>
              Resume
            </Link>
            <Link href="/profile" className={styles.avatar} style={{ width: 30, height: 30, fontSize: 12 }}>
              {initial}
            </Link>
          </div>
        </div>

        {/* Content */}
        <main className={styles.contentArea}>{children}</main>

        {/* Mobile Bottom Navigation */}
        <nav className={styles.mobileBottomNav} aria-label="Mobile Bottom Navigation">
          <Link
            href="/dashboard"
            className={[styles.bottomNavItem, pathname === '/dashboard' ? styles.bottomNavActive : ''].join(' ')}
          >
            <LayoutDashboard size={20} />
            <span>Home</span>
          </Link>
          <Link
            href="/tools"
            className={[styles.bottomNavItem, pathname === '/tools' ? styles.bottomNavActive : ''].join(' ')}
          >
            <Wrench size={20} />
            <span>Tools</span>
          </Link>
          <Link
            href="/tools/resume"
            className={[styles.bottomNavItem, pathname.startsWith('/tools/resume') ? styles.bottomNavActive : ''].join(' ')}
          >
            <FileText size={20} />
            <span>Resume</span>
          </Link>
          <Link
            href="/history"
            className={[styles.bottomNavItem, pathname.startsWith('/history') ? styles.bottomNavActive : ''].join(' ')}
          >
            <History size={20} />
            <span>History</span>
          </Link>
          <Link
            href="/profile"
            className={[styles.bottomNavItem, pathname === '/profile' ? styles.bottomNavActive : ''].join(' ')}
          >
            <User size={20} />
            <span>Profile</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}
