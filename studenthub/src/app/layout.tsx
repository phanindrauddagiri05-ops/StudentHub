import type { Metadata } from 'next';
import './globals.css';
import AppShell from '@/components/layout/AppShell';
import { AuthProvider } from '@/lib/auth/auth-context';
import { APP_NAME, APP_DESCRIPTION } from '@/lib/constants';

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — Everything You Need for Student Life`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: ['student tools', 'pdf tools', 'resume generator', 'notes', 'attendance calculator', 'study tools'],
  openGraph: {
    type: 'website',
    siteName: APP_NAME,
    title: `${APP_NAME} — Everything You Need for Student Life`,
    description: APP_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}


