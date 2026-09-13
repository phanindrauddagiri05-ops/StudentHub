'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Key, LogOut, AlertTriangle, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import styles from './settings.module.css';

export default function SettingsPage() {
  const router = useRouter();
  const { updatePassword, signOut } = useAuth();

  // Change password form state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Preferences state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // Account deletion modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (newPassword.length < 6) {
      setPasswordFeedback({ text: 'Password must be at least 6 characters.', type: 'error' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ text: 'Passwords do not match.', type: 'error' });
      return;
    }

    setPasswordLoading(true);
    const res = await updatePassword(newPassword);
    setPasswordLoading(false);

    if (res.error) {
      setPasswordFeedback({ text: res.error.message || 'Failed to update password.', type: 'error' });
    } else {
      setPasswordFeedback({ text: 'Password changed successfully.', type: 'success' });
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordFeedback(null), 4000);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.replace('/');
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    // Sign out & clear all local data
    await signOut();
    router.replace('/');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Account Settings</h1>
        <p className={styles.subtitle}>Manage your credentials, preferences, and privacy.</p>
      </div>

      {/* ── Section 1: Account ──────────────────────────────── */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <Key size={20} color="var(--color-primary-600)" />
          <h2 className={styles.sectionTitle}>Change Password</h2>
        </div>

        {passwordFeedback && (
          <div
            className={[
              styles.feedbackBox,
              passwordFeedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError,
            ].join(' ')}
          >
            {passwordFeedback.text}
          </div>
        )}

        <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="settings-new-pwd">
              New Password
            </label>
            <input
              id="settings-new-pwd"
              type="password"
              className={styles.input}
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="settings-confirm-pwd">
              Confirm New Password
            </label>
            <input
              id="settings-confirm-pwd"
              type="password"
              className={styles.input}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div style={{ alignSelf: 'flex-start' }}>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={passwordLoading}
              id="change-password-submit-btn"
            >
              {passwordLoading ? (
                <>
                  <Loader2 size={14} className="spin" style={{ marginRight: 6 }} />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </div>
        </form>

        <div style={{ paddingTop: 16, borderTop: '1px solid var(--color-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className={styles.prefTitle}>Active Session</div>
            <div className={styles.prefDesc}>Sign out of your current device session.</div>
          </div>
          <Button variant="secondary" size="sm" onClick={handleLogout} icon={<LogOut size={14} />} id="settings-logout-btn">
            Logout
          </Button>
        </div>
      </div>

      {/* ── Section 2: Preferences ──────────────────────────── */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <Bell size={20} color="var(--color-primary-600)" />
          <h2 className={styles.sectionTitle}>Preferences</h2>
        </div>

        <div className={styles.preferenceRow}>
          <div>
            <div className={styles.prefTitle}>Email Notifications</div>
            <div className={styles.prefDesc}>Receive updates when new student tools are released.</div>
          </div>
          <button
            type="button"
            className={[styles.toggleSwitch, emailNotifications ? styles.toggleActive : ''].join(' ')}
            onClick={() => setEmailNotifications(!emailNotifications)}
            aria-label="Toggle email notifications"
          >
            <div className={styles.toggleCircle} />
          </button>
        </div>

        <div className={styles.preferenceRow}>
          <div>
            <div className={styles.prefTitle}>Dark Appearance</div>
            <div className={styles.prefDesc}>Use dark mode theme for the workspace (Coming soon).</div>
          </div>
          <button
            type="button"
            className={[styles.toggleSwitch, darkMode ? styles.toggleActive : ''].join(' ')}
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle dark mode"
          >
            <div className={styles.toggleCircle} />
          </button>
        </div>
      </div>

      {/* ── Section 3: Privacy & Danger Zone ─────────────────── */}
      <div className={[styles.sectionCard, styles.dangerCard].join(' ')}>
        <div className={[styles.sectionHeader, styles.dangerHeader].join(' ')}>
          <AlertTriangle size={20} />
          <h2 className={styles.sectionTitle} style={{ color: '#dc2626' }}>
            Danger Zone
          </h2>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className={styles.prefTitle} style={{ color: '#991b1b' }}>
              Delete StudentHub Account
            </div>
            <p className={styles.dangerDesc}>
              Permanently delete your profile, files, and activity logs. This cannot be recovered.
            </p>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeleteModalOpen(true)}
            id="delete-account-btn"
          >
            Delete Account
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 'var(--radius-2xl)',
              padding: 24,
              maxWidth: 440,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#dc2626' }}>
              <AlertTriangle size={24} />
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: 0 }}>Delete your account?</h2>
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-600)', lineHeight: 1.5 }}>
              Are you sure you want to delete your StudentHub account? All your uploaded PDFs and history will be permanently deleted.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
              <Button variant="ghost" onClick={() => setDeleteModalOpen(false)} disabled={deletingAccount}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDeleteAccount} disabled={deletingAccount}>
                {deletingAccount ? 'Deleting...' : 'Confirm Deletion'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
