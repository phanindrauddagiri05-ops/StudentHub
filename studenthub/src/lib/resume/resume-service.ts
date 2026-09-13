import { getSupabaseClient } from '@/lib/supabase/client';
import { saveProcessedFile } from '@/lib/storage/file-service';
import { generateResumePdf } from './pdf-export';
import type { ResumeRecord, ResumeData, ResumeTemplate } from './types';
import { EMPTY_RESUME_DATA } from './types';

const LOCAL_RESUMES_KEY = 'studenthub_local_resumes';

// Helper to get active user ID synchronously or from session
export async function getActiveUserId(): Promise<string> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user?.id) {
        return data.session.user.id;
      }
    } catch {
      // fallback below
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('studenthub_local_user');
      if (raw) {
        const u = JSON.parse(raw);
        if (u.id) return u.id;
      }
    } catch {
      // ignore
    }
  }

  return 'anonymous_student';
}

function getLocalResumes(): ResumeRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_RESUMES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalResumes(list: ResumeRecord[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_RESUMES_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export async function getUserResumes(userId?: string): Promise<ResumeRecord[]> {
  const effectiveUserId = userId || (await getActiveUserId());
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', effectiveUserId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching resumes from Supabase:', error);
        return getLocalResumes().filter((r) => r.user_id === effectiveUserId);
      }
      return data as ResumeRecord[];
    } catch {
      return getLocalResumes().filter((r) => r.user_id === effectiveUserId);
    }
  } else {
    return getLocalResumes().filter((r) => r.user_id === effectiveUserId);
  }
}

export async function getResumeById(id: string, userId?: string): Promise<ResumeRecord | null> {
  const effectiveUserId = userId || (await getActiveUserId());
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('id', id)
        .eq('user_id', effectiveUserId)
        .single();

      if (error) {
        return getLocalResumes().find((r) => r.id === id && r.user_id === effectiveUserId) || null;
      }
      return data as ResumeRecord;
    } catch {
      return getLocalResumes().find((r) => r.id === id && r.user_id === effectiveUserId) || null;
    }
  } else {
    return getLocalResumes().find((r) => r.id === id && r.user_id === effectiveUserId) || null;
  }
}

export async function createResume(
  param1:
    | string
    | {
        userId?: string;
        title: string;
        template?: ResumeTemplate;
        initialData?: Partial<ResumeData>;
      },
  param2?: ResumeTemplate,
  param3?: Partial<ResumeData>,
  param4?: string
): Promise<ResumeRecord> {
  let title = 'Untitled Resume';
  let template: ResumeTemplate = 'modern';
  let initialData: Partial<ResumeData> = {};
  let userId: string | undefined;

  if (typeof param1 === 'object') {
    title = param1.title;
    template = param1.template || 'modern';
    initialData = param1.initialData || {};
    userId = param1.userId;
  } else {
    title = param1;
    template = param2 || 'modern';
    initialData = param3 || {};
    userId = param4;
  }

  const effectiveUserId = userId || (await getActiveUserId());
  const supabase = getSupabaseClient();
  const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `res_${Date.now()}`;
  const now = new Date().toISOString();

  const mergedData: ResumeData = {
    ...EMPTY_RESUME_DATA,
    ...initialData,
    personalInfo: {
      ...EMPTY_RESUME_DATA.personalInfo,
      ...(initialData?.personalInfo || {}),
    },
  };

  const newResume: ResumeRecord = {
    id,
    user_id: effectiveUserId,
    title: title.trim() || 'Untitled Resume',
    template,
    resume_data: mergedData,
    created_at: now,
    updated_at: now,
  };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('resumes')
        .insert(newResume)
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: effectiveUserId,
        action: 'resume_create',
        resource_type: 'resume',
        resource_id: id,
        metadata: { title: newResume.title },
      });

      return data as ResumeRecord;
    } catch (err) {
      console.warn('Supabase createResume failed, falling back to local:', err);
    }
  }

  // Local fallback
  const list = getLocalResumes();
  list.unshift(newResume);
  setLocalResumes(list);
  return newResume;
}

export async function updateResume(
  id: string,
  arg2: string | { title?: string; template?: ResumeTemplate; resume_data?: ResumeData },
  arg3?: { title?: string; template?: ResumeTemplate; resume_data?: ResumeData }
): Promise<ResumeRecord> {
  let effectiveUserId: string;
  let updates: { title?: string; template?: ResumeTemplate; resume_data?: ResumeData };

  if (typeof arg2 === 'string') {
    effectiveUserId = arg2;
    updates = arg3 || {};
  } else {
    effectiveUserId = await getActiveUserId();
    updates = arg2;
  }

  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('resumes')
        .update({
          ...updates,
          updated_at: now,
        })
        .eq('id', id)
        .eq('user_id', effectiveUserId)
        .select()
        .single();

      if (error) throw error;
      return data as ResumeRecord;
    } catch (err) {
      console.warn('Supabase updateResume fallback:', err);
    }
  }

  // Local fallback
  const list = getLocalResumes();
  const index = list.findIndex((r) => r.id === id && r.user_id === effectiveUserId);
  if (index !== -1) {
    list[index] = {
      ...list[index],
      ...updates,
      updated_at: now,
    };
    setLocalResumes(list);
    return list[index];
  }

  throw new Error('Resume not found to update.');
}

export async function duplicateResume(id: string, userId?: string): Promise<ResumeRecord> {
  const effectiveUserId = userId || (await getActiveUserId());
  const existing = await getResumeById(id, effectiveUserId);
  if (!existing) throw new Error('Resume not found.');

  return createResume({
    userId: effectiveUserId,
    title: `${existing.title} (Copy)`,
    template: existing.template,
    initialData: existing.resume_data,
  });
}

export async function deleteResume(id: string, userId?: string): Promise<void> {
  const effectiveUserId = userId || (await getActiveUserId());
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { error } = await supabase
        .from('resumes')
        .delete()
        .eq('id', id)
        .eq('user_id', effectiveUserId);

      if (error) throw error;

      await supabase.from('activity_logs').insert({
        user_id: effectiveUserId,
        action: 'resume_delete',
        resource_type: 'resume',
        resource_id: id,
      });
      return;
    } catch (err) {
      console.warn('Supabase deleteResume fallback:', err);
    }
  }

  // Local fallback
  const list = getLocalResumes().filter((r) => !(r.id === id && r.user_id === effectiveUserId));
  setLocalResumes(list);
}

export async function exportAndSaveResumePdf(
  param1: ResumeRecord | string,
  param2?: string | ResumeTemplate,
  param3?: ResumeData,
  param4?: string
): Promise<{ data: Uint8Array; filename: string }> {
  let title = 'Resume';
  let template: ResumeTemplate = 'modern';
  let resumeData: ResumeData;
  let userId: string | undefined;

  if (typeof param1 === 'object') {
    title = param1.title;
    template = param1.template;
    resumeData = param1.resume_data;
    userId = typeof param2 === 'string' ? param2 : undefined;
  } else {
    title = param1;
    template = (param2 as ResumeTemplate) || 'modern';
    resumeData = param3!;
    userId = param4;
  }

  const effectiveUserId = userId || (await getActiveUserId());

  // 1. Generate real vector PDF binary
  const { data, filename } = await generateResumePdf(resumeData, template);

  // 2. Save into user storage and files table
  try {
    await saveProcessedFile({
      userId: effectiveUserId,
      data,
      filename,
      operation: 'compress',
      mimeType: 'application/pdf',
    });
  } catch (err) {
    console.warn('Could not save exported resume to storage:', err);
  }

  // 3. Log activity
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('activity_logs').insert({
        user_id: effectiveUserId,
        action: 'resume_export',
        resource_type: 'resume',
        resource_id: typeof param1 === 'object' ? param1.id : undefined,
        metadata: { title, filename },
      });
    } catch {
      // ignore
    }
  }

  // 4. Trigger client-side download if running in browser
  if (typeof window !== 'undefined') {
    const blob = new Blob([data.buffer as ArrayBuffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return { data, filename };
}
