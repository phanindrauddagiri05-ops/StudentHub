import { getSupabaseClient } from '@/lib/supabase/client';
import type { UserFile, ActivityLog, DashboardStats, PdfOperationType } from '@/types/database';

const BUCKET_NAME = 'studenthub-files';
const LOCAL_FILES_KEY = 'studenthub_local_files';
const LOCAL_ACTIVITIES_KEY = 'studenthub_local_activities';

// Simple IndexedDB helper for storing local file binaries if Supabase is offline
const IDB_NAME = 'studenthub_storage';
const IDB_STORE = 'files_blobs';

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('Window not defined'));
    }
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveBlobLocally(id: string, blob: Blob): Promise<void> {
  try {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put({ id, blob });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IDB saveBlob error, continuing:', err);
  }
}

async function getBlobLocally(id: string): Promise<Blob | null> {
  try {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result ? req.result.blob : null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

async function deleteBlobLocally(id: string): Promise<void> {
  try {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // ignore
  }
}

// ------------------------------------------------------------
// SAVE PROCESSED PDF FILE
// ------------------------------------------------------------
export async function saveProcessedFile({
  userId,
  data,
  filename,
  operation,
  mimeType = 'application/pdf',
}: {
  userId: string;
  data: Uint8Array | Blob;
  filename: string;
  operation: PdfOperationType;
  mimeType?: string;
}): Promise<UserFile> {
  const supabase = getSupabaseClient();
  const blob = data instanceof Blob ? data : new Blob([data as Uint8Array<ArrayBuffer>], { type: mimeType });
  const fileSize = blob.size;
  const timestamp = Date.now();
  const cleanName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `users/${userId}/pdfs/${timestamp}_${cleanName}`;
  const fileId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `file_${timestamp}`;

  if (supabase) {
    // 1. Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, blob, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload failed:', uploadError);
      throw new Error('Failed to save file to secure storage.');
    }

    // 2. Insert into files table
    const { data: fileRow, error: dbError } = await supabase
      .from('files')
      .insert({
        id: fileId,
        user_id: userId,
        original_name: filename,
        storage_path: storagePath,
        mime_type: mimeType,
        file_size: fileSize,
        operation,
        status: 'completed',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Files DB insert failed:', dbError);
      throw new Error('Failed to record file metadata.');
    }

    // 3. Insert into activity_logs
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: `pdf_${operation}`,
      resource_type: 'pdf',
      resource_id: fileRow.id,
      metadata: {
        filename,
        file_size: fileSize,
        operation,
      },
    });

    return fileRow as UserFile;
  } else {
    // Fallback: Store metadata in localStorage & blob in IndexedDB
    const newFile: UserFile = {
      id: fileId,
      user_id: userId,
      original_name: filename,
      storage_path: storagePath,
      mime_type: mimeType,
      file_size: fileSize,
      operation,
      status: 'completed',
      created_at: new Date().toISOString(),
    };

    await saveBlobLocally(fileId, blob);

    try {
      const stored = localStorage.getItem(LOCAL_FILES_KEY);
      const list: UserFile[] = stored ? JSON.parse(stored) : [];
      list.unshift(newFile);
      localStorage.setItem(LOCAL_FILES_KEY, JSON.stringify(list));

      // Activity log
      const storedLogs = localStorage.getItem(LOCAL_ACTIVITIES_KEY);
      const logs: ActivityLog[] = storedLogs ? JSON.parse(storedLogs) : [];
      logs.unshift({
        id: `act_${Date.now()}`,
        user_id: userId,
        action: `pdf_${operation}`,
        resource_type: 'pdf',
        resource_id: fileId,
        metadata: {
          filename,
          file_size: fileSize,
          operation,
        },
        created_at: new Date().toISOString(),
      });
      localStorage.setItem(LOCAL_ACTIVITIES_KEY, JSON.stringify(logs));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }

    return newFile;
  }
}

// ------------------------------------------------------------
// GET USER FILES
// ------------------------------------------------------------
export async function getUserFiles({
  userId,
  search = '',
  operation,
}: {
  userId: string;
  search?: string;
  operation?: string;
}): Promise<UserFile[]> {
  const supabase = getSupabaseClient();

  if (supabase) {
    let query = supabase
      .from('files')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (operation && operation !== 'all') {
      query = query.eq('operation', operation);
    }

    if (search.trim()) {
      query = query.ilike('original_name', `%${search.trim()}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching user files:', error);
      return [];
    }
    return (data as UserFile[]) || [];
  } else {
    try {
      const stored = localStorage.getItem(LOCAL_FILES_KEY);
      let list: UserFile[] = stored ? JSON.parse(stored) : [];
      list = list.filter((f) => f.user_id === userId);

      if (operation && operation !== 'all') {
        list = list.filter((f) => f.operation === operation);
      }
      if (search.trim()) {
        const s = search.toLowerCase().trim();
        list = list.filter((f) => f.original_name.toLowerCase().includes(s));
      }
      return list;
    } catch {
      return [];
    }
  }
}

// ------------------------------------------------------------
// GET USER ACTIVITIES
// ------------------------------------------------------------
export async function getUserActivities({
  userId,
  limit = 10,
}: {
  userId: string;
  limit?: number;
}): Promise<ActivityLog[]> {
  const supabase = getSupabaseClient();

  if (supabase) {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching activities:', error);
      return [];
    }
    return (data as ActivityLog[]) || [];
  } else {
    try {
      const stored = localStorage.getItem(LOCAL_ACTIVITIES_KEY);
      let list: ActivityLog[] = stored ? JSON.parse(stored) : [];
      list = list.filter((a) => a.user_id === userId);
      return list.slice(0, limit);
    } catch {
      return [];
    }
  }
}

// ------------------------------------------------------------
// GET DASHBOARD STATS
// ------------------------------------------------------------
export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const supabase = getSupabaseClient();

  let pdfFilesCount = 0;
  let activitiesCount = 0;

  if (supabase) {
    const { count: fCount } = await supabase
      .from('files')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { count: aCount } = await supabase
      .from('activity_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    pdfFilesCount = fCount || 0;
    activitiesCount = aCount || 0;
  } else {
    try {
      const files: UserFile[] = JSON.parse(localStorage.getItem(LOCAL_FILES_KEY) || '[]');
      const acts: ActivityLog[] = JSON.parse(localStorage.getItem(LOCAL_ACTIVITIES_KEY) || '[]');
      pdfFilesCount = files.filter((f) => f.user_id === userId).length;
      activitiesCount = acts.filter((a) => a.user_id === userId).length;
    } catch {
      // ignore
    }
  }

  return {
    pdfFilesCount,
    activitiesCount,
    availableToolsCount: 1, // PDF Tools
    comingSoonToolsCount: 7, // Resume, Notes, Attendance, Timetable, Study Search, Mind Map, Question Papers
  };
}

// ------------------------------------------------------------
// DOWNLOAD FILE (SIGNED URL OR BLOB)
// ------------------------------------------------------------
export async function getFileDownloadUrl(file: UserFile): Promise<string> {
  const supabase = getSupabaseClient();

  if (supabase) {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(file.storage_path, 60 * 60, {
        download: file.original_name,
      });

    if (error || !data?.signedUrl) {
      throw new Error('Could not generate secure download link.');
    }
    return data.signedUrl;
  } else {
    const blob = await getBlobLocally(file.id);
    if (!blob) {
      throw new Error('File data not found locally.');
    }
    return URL.createObjectURL(blob);
  }
}

// ------------------------------------------------------------
// DELETE FILE
// ------------------------------------------------------------
export async function deleteUserFile(file: UserFile): Promise<void> {
  const supabase = getSupabaseClient();

  if (supabase) {
    // 1. Delete storage object
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([file.storage_path]);

    if (storageError) {
      console.warn('Storage delete warning:', storageError);
    }

    // 2. Delete database record
    const { error: dbError } = await supabase
      .from('files')
      .delete()
      .eq('id', file.id)
      .eq('user_id', file.user_id);

    if (dbError) {
      throw new Error('Could not delete file record.');
    }
  } else {
    await deleteBlobLocally(file.id);
    try {
      const stored = localStorage.getItem(LOCAL_FILES_KEY);
      if (stored) {
        const list: UserFile[] = JSON.parse(stored);
        const filtered = list.filter((f) => f.id !== file.id);
        localStorage.setItem(LOCAL_FILES_KEY, JSON.stringify(filtered));
      }
    } catch {
      // ignore
    }
  }
}
