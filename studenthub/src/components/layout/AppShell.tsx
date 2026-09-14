'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import GlobalNavbar from './GlobalNavbar';
import Footer from './Footer';
import DashboardLayout from './DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';

const AUTH_PAGES = ['/login', '/signup', '/forgot-password', '/reset-password'];
const STRICT_WORKSPACE_PAGES = ['/dashboard', '/history', '/profile', '/settings'];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAuth();

  const isAuthPage = AUTH_PAGES.some((p) => pathname === p || pathname.startsWith(p + '/'));
  const isStrictWorkspace = STRICT_WORKSPACE_PAGES.some((p) => pathname === p || pathname.startsWith(p + '/'));
  const isToolPage = pathname.startsWith('/tools');

  // Standalone auth pages (no navbars/footers)
  if (isAuthPage) {
    return <main>{children}</main>;
  }

  // Determine whether to wrap content inside the Workspace shell (Sidebar + ContentArea)
  const isWorkspace = isStrictWorkspace || (isToolPage && isAuthenticated && !loading);

  const mainContent = isStrictWorkspace ? (
    <ProtectedRoute>
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  ) : isWorkspace ? (
    <DashboardLayout>{children}</DashboardLayout>
  ) : (
    <main id="main-content" style={{ flex: 1 }}>
      {children}
    </main>
  );

  return (
    <div
      id="app-shell"
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        width: '100%',
        overflowX: 'hidden',
      }}
    >
      {/* ── Single Global Navbar across all pages ────────── */}
      <GlobalNavbar />

      {/* ── Page Content (Workspace Sidebar + Content, or Public Content) ── */}
      <div style={{ display: 'flex', flex: 1, flexDirection: 'column', width: '100%' }}>
        {mainContent}
      </div>

      {/* ── Global Full-Width Footer ─────────────────────── */}
      <Footer />
    </div>
  );
}
