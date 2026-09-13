'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';
import type { UserProfile } from '@/types/database';

export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  isMockAuth: boolean;
  signUp: (params: {
    email: string;
    password: string;
    fullName: string;
    college?: string;
    course?: string;
  }) => Promise<{ error: Error | null; requiresVerification?: boolean }>;
  signInWithPassword: (params: {
    email: string;
    password: string;
  }) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  updateProfile: (data: Partial<UserProfile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'studenthub_local_user';
const LOCAL_PROFILE_KEY = 'studenthub_local_profile';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseClient();
  const isMock = !isSupabaseConfigured() || !supabase;

  // Fetch or construct profile
  const fetchProfile = useCallback(async (userId: string, currentUser?: User | null) => {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading user profile:', error);
        }

        if (data) {
          setProfile(data as UserProfile);
          return;
        }

        // If no row exists yet, create fallback profile object
        const metaName = currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'Student';
        const fallbackProfile: UserProfile = {
          id: userId,
          user_id: userId,
          full_name: metaName,
          created_at: new Date().toISOString(),
        };
        setProfile(fallbackProfile);
      } catch (err) {
        console.error('Profile fetch failed:', err);
      }
    } else {
      // Local fallback mode
      try {
        const local = localStorage.getItem(LOCAL_PROFILE_KEY);
        if (local) {
          setProfile(JSON.parse(local));
        } else if (currentUser) {
          const defaultProfile: UserProfile = {
            id: userId,
            user_id: userId,
            full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Alex Hunter',
            college: currentUser.user_metadata?.college || 'Apex Engineering College',
            course: currentUser.user_metadata?.course || 'Computer Science & Engineering',
            department: 'Information Technology',
            year: '3rd Year',
            semester: '6th Semester',
            created_at: new Date().toISOString(),
          };
          localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(defaultProfile));
          setProfile(defaultProfile);
        }
      } catch {
        // Safe fallback
      }
    }
  }, [supabase]);

  // Initial load
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (supabase) {
        try {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (mounted) {
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            if (currentSession?.user) {
              await fetchProfile(currentSession.user.id, currentSession.user);
            }
          }

          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, newSession) => {
              if (!mounted) return;
              setSession(newSession);
              setUser(newSession?.user ?? null);
              if (newSession?.user) {
                await fetchProfile(newSession.user.id, newSession.user);
              } else {
                setProfile(null);
              }
              setLoading(false);
            }
          );

          return () => {
            subscription.unsubscribe();
          };
        } catch (err) {
          console.error('Auth initialization error:', err);
        } finally {
          if (mounted) setLoading(false);
        }
      } else {
        // Local mode initialization
        try {
          const savedUser = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (savedUser) {
            const parsedUser = JSON.parse(savedUser) as User;
            setUser(parsedUser);
            await fetchProfile(parsedUser.id, parsedUser);
          }
        } catch {
          // ignore
        } finally {
          if (mounted) setLoading(false);
        }
      }
    }

    initAuth();

    return () => {
      mounted = false;
    };
  }, [supabase, fetchProfile]);

  // Sign up
  const signUp = async (params: {
    email: string;
    password: string;
    fullName: string;
    college?: string;
    course?: string;
  }) => {
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: params.email,
          password: params.password,
          options: {
            data: {
              full_name: params.fullName,
              college: params.college || '',
              course: params.course || '',
            },
          },
        });

        if (error) return { error: new Error(error.message) };

        const requiresVerification = !data.session && !!data.user;
        if (data.session && data.user) {
          setUser(data.user);
          setSession(data.session);
          await fetchProfile(data.user.id, data.user);
        }
        return { error: null, requiresVerification };
      } catch (err) {
        return { error: err instanceof Error ? err : new Error('Signup failed') };
      }
    } else {
      // Local fallback sign up
      const mockId = `usr_${Date.now()}`;
      const mockUser = {
        id: mockId,
        email: params.email,
        app_metadata: {},
        user_metadata: {
          full_name: params.fullName,
          college: params.college || '',
          course: params.course || '',
        },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as unknown as User;

      const mockProfile: UserProfile = {
        id: mockId,
        user_id: mockId,
        full_name: params.fullName,
        college: params.college || '',
        course: params.course || '',
        department: '',
        year: '',
        semester: '',
        created_at: new Date().toISOString(),
      };

      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mockUser));
        localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(mockProfile));
        setUser(mockUser);
        setProfile(mockProfile);
      } catch {
        // ignore
      }
      return { error: null, requiresVerification: false };
    }
  };

  // Sign in with password
  const signInWithPassword = async (params: { email: string; password: string }) => {
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: params.email,
          password: params.password,
        });
        if (error) {
          if (error.message.toLowerCase().includes('invalid login credentials')) {
            return { error: new Error('Email or password is incorrect.') };
          }
          return { error: new Error(error.message) };
        }
        if (data.user && data.session) {
          setUser(data.user);
          setSession(data.session);
          await fetchProfile(data.user.id, data.user);
        }
        return { error: null };
      } catch (err) {
        return {
          error: new Error('Something went wrong. Check your connection and try again.'),
        };
      }
    } else {
      // Local sign in
      const mockId = `usr_demo`;
      const name = params.email.split('@')[0] || 'Student';
      const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
      const mockUser = {
        id: mockId,
        email: params.email,
        app_metadata: {},
        user_metadata: { full_name: capitalized },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as unknown as User;

      const mockProfile: UserProfile = {
        id: mockId,
        user_id: mockId,
        full_name: capitalized,
        college: 'State University of Technology',
        course: 'Computer Science',
        department: 'Engineering',
        year: '3rd Year',
        semester: '5th Semester',
        created_at: new Date().toISOString(),
      };

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mockUser));
      localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(mockProfile));
      setUser(mockUser);
      setProfile(mockProfile);
      return { error: null };
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    if (supabase) {
      try {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${origin}/dashboard`,
          },
        });
        if (error) {
          return {
            error: new Error("Google sign-in couldn't be completed. Please try again."),
          };
        }
        return { error: null };
      } catch {
        return {
          error: new Error("Google sign-in couldn't be completed. Please try again."),
        };
      }
    } else {
      // Local fallback mock Google login
      const mockId = `usr_google_${Date.now()}`;
      const mockUser = {
        id: mockId,
        email: 'alex.hunter@gmail.com',
        app_metadata: { provider: 'google' },
        user_metadata: { full_name: 'Alex Hunter', avatar_url: '' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as unknown as User;

      const mockProfile: UserProfile = {
        id: mockId,
        user_id: mockId,
        full_name: 'Alex Hunter',
        college: 'Apex Institute of Science',
        course: 'Computer Science',
        department: 'School of Computing',
        year: '3rd Year',
        semester: '6th Semester',
        created_at: new Date().toISOString(),
      };

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mockUser));
      localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(mockProfile));
      setUser(mockUser);
      setProfile(mockProfile);
      return { error: null };
    }
  };

  // Sign out
  const signOut = async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Sign out error:', err);
      }
    }
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      localStorage.removeItem(LOCAL_PROFILE_KEY);
      sessionStorage.clear();
    } catch {
      // ignore
    }
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  // Reset password email
  const resetPasswordForEmail = async (email: string) => {
    if (supabase) {
      try {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${origin}/reset-password`,
        });
        if (error) {
          // Do not reveal if email exists
          return { error: null };
        }
        return { error: null };
      } catch {
        return { error: null };
      }
    }
    return { error: null };
  };

  // Update password
  const updatePassword = async (newPassword: string) => {
    if (supabase) {
      try {
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (error) return { error: new Error(error.message) };
        return { error: null };
      } catch (err) {
        return { error: err instanceof Error ? err : new Error('Password update failed') };
      }
    }
    return { error: null };
  };

  // Update profile
  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return { error: new Error('Not authenticated') };

    const updated: UserProfile = {
      ...(profile || {
        id: user.id,
        user_id: user.id,
        full_name: user.user_metadata?.full_name || 'Student',
      }),
      ...data,
      updated_at: new Date().toISOString(),
    };

    if (supabase) {
      try {
        const { error } = await supabase
          .from('profiles')
          .upsert({
            user_id: user.id,
            full_name: updated.full_name,
            avatar_url: updated.avatar_url || '',
            college: updated.college || '',
            course: updated.course || '',
            department: updated.department || '',
            year: updated.year || '',
            semester: updated.semester || '',
            updated_at: updated.updated_at,
          });

        if (error) return { error: new Error(error.message) };
        setProfile(updated);
        return { error: null };
      } catch (err) {
        return { error: err instanceof Error ? err : new Error('Profile update failed') };
      }
    } else {
      // Local update
      try {
        localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(updated));
        setProfile(updated);
      } catch {
        // ignore
      }
      return { error: null };
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id, user);
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    isAuthenticated: !!user,
    isMockAuth: isMock,
    signUp,
    signInWithPassword,
    signInWithGoogle,
    signOut,
    resetPasswordForEmail,
    updatePassword,
    updateProfile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
