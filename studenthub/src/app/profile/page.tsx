'use client';

import React, { useState } from 'react';
import { CheckCircle, Loader2, Save, Edit3 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import type { UserProfile } from '@/types/database';
import styles from './profile.module.css';

interface ProfileFormProps {
  initialProfile: UserProfile | null;
  email: string;
  onSave: (data: Partial<UserProfile>) => Promise<{ error: Error | null }>;
}

function ProfileForm({ initialProfile, email, onSave }: ProfileFormProps) {
  const [fullName, setFullName] = useState(initialProfile?.full_name || '');
  const [college, setCollege] = useState(initialProfile?.college || '');
  const [course, setCourse] = useState(initialProfile?.course || '');
  const [department, setDepartment] = useState(initialProfile?.department || '');
  const [year, setYear] = useState(initialProfile?.year || '');
  const [semester, setSemester] = useState(initialProfile?.semester || '');

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const res = await onSave({
      full_name: fullName.trim(),
      college: college.trim(),
      course: course.trim(),
      department: department.trim(),
      year: year.trim(),
      semester: semester.trim(),
    });

    setSaving(false);
    if (res.error) {
      setMessage({ text: res.error.message || 'Failed to update profile.', type: 'error' });
    } else {
      setMessage({ text: 'Profile information saved successfully.', type: 'success' });
      setIsEditing(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const initial = (fullName || email || 'S').charAt(0).toUpperCase();

  return (
    <>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Student Profile</h1>
          <p className={styles.subtitle}>
            Manage your personal and academic information for your workspace.
          </p>
        </div>
        {!isEditing && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsEditing(true)}
            icon={<Edit3 size={15} />}
            id="edit-profile-btn"
          >
            Edit Profile
          </Button>
        )}
      </div>

      {message && (
        <div
          className={[
            styles.feedbackAlert,
            message.type === 'success' ? styles.alertSuccess : styles.alertError,
          ].join(' ')}
        >
          {message.text}
        </div>
      )}

      <div className={styles.card}>
        {/* Avatar Section */}
        <div className={styles.avatarSection}>
          <div className={styles.avatarLarge}>{initial}</div>
          <div className={styles.avatarDetails}>
            <div className={styles.profileName}>{fullName || 'Student'}</div>
            <div className={styles.profileEmail}>{email}</div>
            <span className={styles.verifiedBadge}>
              <CheckCircle size={12} /> Verified Student
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Personal Details */}
          <div>
            <h2 className={styles.sectionTitle}>Personal Details</h2>
            <div className={styles.formGrid} style={{ marginTop: 'var(--space-4)' }}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="prof-name">
                  Full Name
                </label>
                <input
                  id="prof-name"
                  type="text"
                  className={[styles.input, !isEditing ? styles.inputReadOnly : ''].join(' ')}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  readOnly={!isEditing}
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="prof-email">
                  Email Address
                </label>
                <input
                  id="prof-email"
                  type="email"
                  className={[styles.input, styles.inputReadOnly].join(' ')}
                  value={email}
                  readOnly
                  disabled
                />
                <span className={styles.helpText}>Email is linked to your authentication account.</span>
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div>
            <h2 className={styles.sectionTitle}>Academic Information</h2>
            <div className={styles.formGrid} style={{ marginTop: 'var(--space-4)' }}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="prof-college">
                  College / University
                </label>
                <input
                  id="prof-college"
                  type="text"
                  className={[styles.input, !isEditing ? styles.inputReadOnly : ''].join(' ')}
                  placeholder="e.g. Stanford University"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  readOnly={!isEditing}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="prof-course">
                  Degree / Program
                </label>
                <input
                  id="prof-course"
                  type="text"
                  className={[styles.input, !isEditing ? styles.inputReadOnly : ''].join(' ')}
                  placeholder="e.g. B.Tech Computer Science"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  readOnly={!isEditing}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="prof-dept">
                  Department
                </label>
                <input
                  id="prof-dept"
                  type="text"
                  className={[styles.input, !isEditing ? styles.inputReadOnly : ''].join(' ')}
                  placeholder="e.g. School of Computing"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  readOnly={!isEditing}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="prof-year">
                  Academic Year
                </label>
                <input
                  id="prof-year"
                  type="text"
                  className={[styles.input, !isEditing ? styles.inputReadOnly : ''].join(' ')}
                  placeholder="e.g. 3rd Year"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  readOnly={!isEditing}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="prof-semester">
                  Current Semester
                </label>
                <input
                  id="prof-semester"
                  type="text"
                  className={[styles.input, !isEditing ? styles.inputReadOnly : ''].join(' ')}
                  placeholder="e.g. 5th Semester"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  readOnly={!isEditing}
                />
              </div>
            </div>
          </div>

          {isEditing && (
            <div className={styles.actionsRow}>
              <Button
                variant="ghost"
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={saving}
                icon={<Save size={16} />}
                id="save-profile-btn"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="spin" style={{ marginRight: 6 }} />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          )}
        </form>
      </div>
    </>
  );
}

export default function ProfilePage() {
  const { user, profile, updateProfile } = useAuth();

  const activeProfile: UserProfile | null = profile || (user ? {
    id: user.id,
    user_id: user.id,
    full_name: user.user_metadata?.full_name || '',
    college: user.user_metadata?.college || '',
    course: user.user_metadata?.course || '',
  } : null);

  const formKey = activeProfile ? `${activeProfile.user_id}-${activeProfile.updated_at || activeProfile.created_at || 'init'}` : 'loading';

  return (
    <div className={styles.container}>
      <ProfileForm
        key={formKey}
        initialProfile={activeProfile}
        email={user?.email || ''}
        onSave={updateProfile}
      />
    </div>
  );
}
