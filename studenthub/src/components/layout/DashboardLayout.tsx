'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BookOpen,
  LayoutDashboard,
  Wrench,
  FileText,
  CalendarCheck,
  Clock,
  Search,
  Bookmark,
  History,
  User,
  Settings,
  LogOut,
  FileCode,
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

  const handleLogout = async () => {
    await signOut();
    router.replace('/');
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student';
  const initial = displayName.charAt(0).toUpperCase();

  const NAV_MAIN = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, exact: true },
    { label: 'Tools', href: '/tools', icon: Wrench, badge: '1 Active' },
    { label: 'PDF History', href: '/history', icon: History, exact: true },
  ];

  const NAV_COMING_SOON = [
    { label: 'Notes', icon: FileText },
    { label: 'Attendance', icon: CalendarCheck },
    { label: 'Timetable', icon: Clock },
    { label: 'Study Search', icon: Search },
    { label: 'Saved', icon: Bookmark },
  ];

  const isCurrent = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

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
          {NAV_MAIN.map((item) => {
            const Icon = item.icon;
            const active = isCurrent(item.href, item.exact);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={[styles.navItem, active ? styles.navItemActive : ''].join(' ')}
              >
                <span className={styles.navIcon}>
                  <Icon size={18} />
                </span>
                <span className={styles.navLabel}>{item.label}</span>
                {item.badge && <span className={styles.badgeAvailable}>{item.badge}</span>}
              </Link>
            );
          })}

          <span className={styles.sectionTitle} style={{ marginTop: 'var(--space-2)' }}>
            Under Development
          </span>
          {NAV_COMING_SOON.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className={styles.navItem} style={{ opacity: 0.75, cursor: 'default' }}>
                <span className={styles.navIcon}>
                  <Icon size={18} />
                </span>
                <span className={styles.navLabel}>{item.label}</span>
                <span className={styles.badgeSoon}>Coming Soon</span>
              </div>
            );
          })}
        </div>

        <div className={styles.sidebarFooter}>
          <Link href="/profile" className={styles.userCard} style={{ textDecoration: 'none' }}>
            <div className={styles.avatar}>{initial}</div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>{displayName}</div>
              <div className={styles.userEmail}>{user?.email || 'Student Account'}</div>
            </div>
          </Link>

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
          <div className={styles.searchBar}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search your workspace..."
              className={styles.searchInput}
              readOnly
              onClick={() => {}}
            />
            <span className={styles.searchShortcut}>Ctrl+K</span>
          </div>

          <div className={styles.headerActions}>
            <Link href="/tools/pdf" className={styles.quickToolBtn}>
              <FileCode size={15} />
              Open PDF Tools
            </Link>
            <Link href="/profile" className={styles.avatar} style={{ textDecoration: 'none' }} title={displayName}>
              {initial}
            </Link>
          </div>
        </header>

        {/* Mobile Header */}
        <div className={styles.mobileHeader}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoIcon} style={{ width: 28, height: 28 }}>
              <BookOpen size={16} strokeWidth={2.5} />
            </span>
            <span className={styles.logoText} style={{ fontSize: 'var(--text-base)' }}>
              StudentHub
            </span>
          </Link>
          <Link href="/profile" className={styles.avatar} style={{ width: 30, height: 30, fontSize: 12 }}>
            {initial}
          </Link>
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
            className={[styles.bottomNavItem, pathname.startsWith('/tools') ? styles.bottomNavActive : ''].join(' ')}
          >
            <Wrench size={20} />
            <span>Tools</span>
          </Link>
          <Link
            href="/history"
            className={[styles.bottomNavItem, pathname === '/history' ? styles.bottomNavActive : ''].join(' ')}
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
