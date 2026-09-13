'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Loader2, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import styles from '../auth.module.css';

export default function ForgotPasswordPage() {
  const { resetPasswordForEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    await resetPasswordForEmail(email.trim());
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>
            <BookOpen size={22} strokeWidth={2.5} />
          </span>
          <span className={styles.logoText}>StudentHub</span>
        </Link>

        <h1 className={styles.title}>Forgot Password</h1>
        <p className={styles.subtitle}>
          Enter your registered email and we’ll send you a password reset link.
        </p>

        {submitted ? (
          <div className={styles.successBox} style={{ fontSize: 'var(--text-sm)', width: '100%' }}>
            <strong>Check your email for a password reset link.</strong>
            <p style={{ marginTop: 8 }}>
              If an account is associated with <strong>{email}</strong>, you will receive instructions to reset your password.
            </p>
            <div style={{ marginTop: 16 }}>
              <Button variant="secondary" href="/login" fullWidth id="forgot-return-login">
                Return to Login
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="forgot-email">
                Email Address
              </label>
              <input
                id="forgot-email"
                type="email"
                className={styles.input}
                placeholder="you@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={loading}
              id="send-reset-link-btn"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="spin" style={{ marginRight: 8 }} />
                  Sending link...
                </>
              ) : (
                'Send Reset Link'
              )}
            </Button>
          </form>
        )}

        <Link href="/login" className={styles.switchLink} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={16} /> Back to Sign In
        </Link>
      </div>
    </div>
  );
}
