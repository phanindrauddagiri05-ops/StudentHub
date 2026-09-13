'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import styles from '../auth.module.css';

export default function SignupPage() {
  const router = useRouter();
  const { signUp, isAuthenticated } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [college, setCollege] = useState('');
  const [course, setCourse] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationNotice, setVerificationNotice] = useState(false);

  // If already authenticated, redirect
  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please retype.');
      return;
    }

    setLoading(true);

    const res = await signUp({
      email: email.trim(),
      password,
      fullName: fullName.trim(),
      college: college.trim() || undefined,
      course: course.trim() || undefined,
    });

    setLoading(false);

    if (res.error) {
      setError(res.error.message);
    } else if (res.requiresVerification) {
      setVerificationNotice(true);
    } else {
      router.replace('/dashboard');
    }
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

        <h1 className={styles.title}>Create an Account</h1>
        <p className={styles.subtitle}>Join StudentHub — your student workspace.</p>

        {verificationNotice ? (
          <div className={styles.successBox} style={{ fontSize: 'var(--text-sm)' }}>
            <strong>Check your email to verify your account.</strong>
            <p style={{ marginTop: 8 }}>
              We sent a verification link to <strong>{email}</strong>. Once verified, you can sign in to your dashboard.
            </p>
            <div style={{ marginTop: 16 }}>
              <Button variant="primary" href="/login" fullWidth id="verification-to-login">
                Return to Login
              </Button>
            </div>
          </div>
        ) : (
          <>
            {error && <div className={styles.errorBox}>{error}</div>}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="signup-name">
                  Full Name <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  id="signup-name"
                  type="text"
                  className={styles.input}
                  placeholder="e.g. Alex Hunter"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="signup-email">
                  Email <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  id="signup-email"
                  type="email"
                  className={styles.input}
                  placeholder="you@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="signup-password">
                  Password <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  id="signup-password"
                  type="password"
                  className={styles.input}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="signup-confirm-password">
                  Confirm Password <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  id="signup-confirm-password"
                  type="password"
                  className={styles.input}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>

              <div className={styles.field}>
                <div className={styles.labelRow}>
                  <label className={styles.label} htmlFor="signup-college">
                    College / University
                  </label>
                  <span className={styles.optionalTag}>Optional</span>
                </div>
                <input
                  id="signup-college"
                  type="text"
                  className={styles.input}
                  placeholder="e.g. Stanford University"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <div className={styles.labelRow}>
                  <label className={styles.label} htmlFor="signup-course">
                    Course / Degree
                  </label>
                  <span className={styles.optionalTag}>Optional</span>
                </div>
                <input
                  id="signup-course"
                  type="text"
                  className={styles.input}
                  placeholder="e.g. B.Tech Computer Science"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={loading}
                id="signup-submit-btn"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="spin" style={{ marginRight: 8 }} />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            <p className={styles.switch}>
              Already have an account?{' '}
              <Link href="/login" className={styles.switchLink}>
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
