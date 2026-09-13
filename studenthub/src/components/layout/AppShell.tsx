'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import DashboardLayout from './DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const AUTH_PAGES = ['/login', '/signup', '/forgot-password', '/reset-password'];
const WORKSPACE_PAGES = ['/dashboard', '/history', '/profile', '/settings'];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isAuthPage = AUTH_PAGES.some((p) => pathname === p || pathname.startsWith(p + '/'));
  const isWorkspacePage = WORKSPACE_PAGES.some((p) => pathname === p || pathname.startsWith(p + '/'));

  if (isAuthPage) {
    return <main>{children}</main>;
  }

  if (isWorkspacePage) {
    return (
      <ProtectedRoute>
        <DashboardLayout>{children}</DashboardLayout>
      </ProtectedRoute>
    );
  }

  // Public pages
  return (
    <div id="app-shell" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <main id="main-content" style={{ flex: 1 }}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
