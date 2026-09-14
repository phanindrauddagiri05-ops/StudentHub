'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, BookOpen } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import styles from './Header.module.css';

const PUBLIC_NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Features', href: '/#features' },
  { label: 'Tools', href: '/tools' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'FAQ', href: '/#faq' },
];

const AUTH_NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Tools', href: '/tools' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'History', href: '/history' },
];

export default function GlobalNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, profile, user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    setMobileOpen(false);
    router.replace('/');
  };

  const navLinks = isAuthenticated ? AUTH_NAV_LINKS : PUBLIC_NAV_LINKS;

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href.split('#')[0]) && href !== '/';
  };

  const isProfileActive = pathname === '/profile' || pathname === '/settings';

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Student';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className={styles.header} id="global-navbar">
      <div className={`container ${styles.inner}`}>
        {/* Logo */}
        <Link href="/" className={styles.logo} aria-label="StudentHub home">
          <span className={styles.logoIcon}>
            <BookOpen size={22} strokeWidth={2.5} />
          </span>
          <span className={styles.logoText}>StudentHub</span>
        </Link>

        {/* Desktop Nav */}
        <nav className={styles.nav} aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={[styles.navLink, isActive(link.href) ? styles.navLinkActive : ''].join(' ')}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Auth / Profile actions */}
        <div className={styles.actions}>
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Button variant="primary" href="/dashboard" size="sm" id="header-dashboard-btn">
                Workspace
              </Button>
              <Link
                href="/profile"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-accent-600))',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: 'none',
                  boxShadow: isProfileActive ? '0 0 0 2px #ffffff, 0 0 0 4px var(--color-primary-500)' : 'none',
                  transition: 'box-shadow var(--transition-fast)',
                }}
                title={displayName}
                id="header-profile-avatar"
              >
                {initial}
              </Link>
            </div>
          ) : (
            <>
              <Button variant="ghost" href="/login" size="sm" id="header-login">
                Login
              </Button>
              <Button variant="primary" href="/signup" size="sm" id="header-get-started">
                Get Started
              </Button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className={styles.mobileToggle}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          id="mobile-menu-toggle"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div className={styles.mobileMenu} role="navigation" aria-label="Mobile navigation">
          <nav className={styles.mobileNav}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={[styles.mobileNavLink, isActive(link.href) ? styles.mobileNavLinkActive : ''].join(' ')}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className={styles.mobileActions}>
            {isAuthenticated ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                <Button variant="primary" href="/dashboard" fullWidth id="mobile-workspace">
                  Open Workspace
                </Button>
                <Button variant="secondary" href="/profile" fullWidth id="mobile-profile">
                  My Profile
                </Button>
                <Button variant="ghost" onClick={handleLogout} fullWidth id="mobile-logout">
                  Logout
                </Button>
              </div>
            ) : (
              <>
                <Button variant="ghost" href="/login" fullWidth id="mobile-login">
                  Login
                </Button>
                <Button variant="primary" href="/signup" fullWidth id="mobile-get-started">
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
