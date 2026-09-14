'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Wrench,
  FileText,
  History,
  User,
  Settings,
  LogOut,
  BookOpen,
  ChevronDown,
  GraduationCap,
  Calendar,
  Briefcase,
  Layers,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { TOOLS } from '@/lib/tools';
import styles from './DashboardLayout.module.css';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const [toolsOpen, setToolsOpen] = useState(true);

  const readyCount = TOOLS.filter((t) => t.status === 'available').length;

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

  const isCurrent = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const TOOL_CATEGORIES = [
    { label: 'All Tools', href: '/tools', icon: Layers, exact: true },
    { label: 'Doc Converters', href: '/tools/document-converters', icon: RefreshCw, active: true },
    { label: 'Image Converters', href: '/tools/image-converters', icon: ImageIcon, active: true },
    { label: 'PDF Tools', href: '/tools/pdf', icon: FileText, active: true },
    { label: 'Career', href: '/tools#career', icon: Briefcase, count: 'Soon' },
    { label: 'Study', href: '/tools#study', icon: BookOpen, count: 'Soon' },
    { label: 'Academic', href: '/tools#academic', icon: GraduationCap, count: 'Soon' },
    { label: 'Planning', href: '/tools#planning', icon: Calendar, count: 'Soon' },
  ];

  return (
    <div className={styles.workspaceBody}>
      {/* Desktop Sidebar (Sticky directly below GlobalNavbar) */}
      <aside className={styles.sidebar} id="workspace-sidebar">
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
              <span className={styles.badgeAvailable}>{readyCount} Ready</span>
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

      {/* Main Workspace Content Area */}
      <main className={styles.contentArea}>{children}</main>

      {/* Mobile Bottom Navigation (< 900px) */}
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
          href="/tools/document-converters"
          className={[
            styles.bottomNavItem,
            pathname.startsWith('/tools/document-converters') ? styles.bottomNavActive : '',
          ].join(' ')}
        >
          <RefreshCw size={20} />
          <span>Convert</span>
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
  );
}
