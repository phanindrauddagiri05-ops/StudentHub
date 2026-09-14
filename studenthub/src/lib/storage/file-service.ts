import { getSupabaseClient } from '@/lib/supabase/client';
import type {
  UserFile,
  ActivityLog,
  DashboardStats,
  PdfOperationType,
  UnifiedHistoryItem,
  DocumentConversionRecord,
} from '@/types/database';

const BUCKET_NAME = 'studenthub-files';
const LOCAL_FILES_KEY = 'studenthub_local_files';
const LOCAL_ACTIVITIES_KEY = 'studenthub_local_activities';
const LOCAL_CONVERSIONS_KEY = 'studenthub_recent_conversions';

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
  let documentsConvertedCount = 0;
  let activitiesCount = 0;

  if (supabase) {
    const { count: fCount } = await supabase
      .from('files')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { count: cCount } = await supabase
      .from('document_conversions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { count: aCount } = await supabase
      .from('activity_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    pdfFilesCount = fCount || 0;
    documentsConvertedCount = cCount || 0;
    activitiesCount = aCount || 0;
  } else {
    try {
      const files: UserFile[] = JSON.parse(localStorage.getItem(LOCAL_FILES_KEY) || '[]');
      const acts: ActivityLog[] = JSON.parse(localStorage.getItem(LOCAL_ACTIVITIES_KEY) || '[]');
      const convs = JSON.parse(localStorage.getItem(LOCAL_CONVERSIONS_KEY) || '[]');
      pdfFilesCount = files.filter((f) => f.user_id === userId).length;
      documentsConvertedCount = convs.filter((c: { user_id?: string }) => c.user_id === userId || !c.user_id).length;
      activitiesCount = acts.filter((a) => a.user_id === userId).length;
    } catch {
      // ignore
    }
  }

  return {
    pdfFilesCount,
    documentsConvertedCount,
    activitiesCount,
    availableToolsCount: 2, // PDF Tools & Document Converters
    comingSoonToolsCount: 6, // Notes, Attendance, Timetable, Study Search, Mind Map, Question Preparation
  };
}

// ------------------------------------------------------------
// UNIFIED HISTORY SYSTEM (PDF + DOCUMENT CONVERTERS)
// ------------------------------------------------------------
export async function getUnifiedHistory({
  userId,
  search = '',
  toolType = 'all',
  operation = 'all',
}: {
  userId: string;
  search?: string;
  toolType?: 'all' | 'pdf' | 'document_converter';
  operation?: string;
}): Promise<UnifiedHistoryItem[]> {
  const supabase = getSupabaseClient();
  const items: UnifiedHistoryItem[] = [];

  const formatPdfOperation = (op: string): string => {
    switch (op) {
      case 'pdf_to_images': return 'PDF → Images';
      case 'images_to_pdf': return 'Images → PDF';
      case 'merge': return 'Merge';
      case 'split': return 'Split';
      case 'compress': return 'Compress';
      case 'reorder': return 'Reorder';
      default: return op.charAt(0).toUpperCase() + op.slice(1);
    }
  };

  if (supabase) {
    // 1. Fetch PDF files if toolType is 'all' or 'pdf'
    if (toolType === 'all' || toolType === 'pdf') {
      let query = supabase
        .from('files')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (operation && operation !== 'all') {
        query = query.eq('operation', operation);
      }

      const { data: pdfData, error: pdfError } = await query;
      if (!pdfError && pdfData) {
        for (const f of pdfData as UserFile[]) {
          items.push({
            id: f.id,
            userId: f.user_id,
            toolType: 'pdf',
            sourceFilename: f.original_name,
            outputFilename: f.original_name,
            displayFilename: f.original_name,
            operation: f.operation,
            operationLabel: formatPdfOperation(f.operation),
            fileSize: Number(f.file_size) || 0,
            status: f.status === 'processing' ? 'processing' : f.status === 'failed' ? 'failed' : 'completed',
            storagePath: f.storage_path,
            createdAt: f.created_at,
          });
        }
      }
    }

    // 2. Fetch Document Conversions if toolType is 'all' or 'document_converter'
    if (toolType === 'all' || toolType === 'document_converter') {
      const { data: convData, error: convError } = await supabase
        .from('document_conversions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!convError && convData) {
        for (const c of convData as DocumentConversionRecord[]) {
          const opLabel = `${(c.source_format || 'DOC').toUpperCase()} → ${(c.target_format || 'PDF').toUpperCase()}`;
          items.push({
            id: c.id,
            userId: c.user_id,
            toolType: 'document_converter',
            sourceFilename: c.source_filename,
            outputFilename: c.output_filename,
            displayFilename: c.source_filename,
            sourceFormat: c.source_format,
            targetFormat: c.target_format,
            operation: `${c.source_format}_to_${c.target_format}`,
            operationLabel: opLabel,
            fileSize: Number(c.output_file_size || c.source_file_size) || 0,
            status: c.status === 'processing' ? 'processing' : c.status === 'failed' ? 'failed' : 'completed',
            errorMessage: c.error_message,
            storagePath: c.storage_path,
            createdAt: c.created_at,
          });
        }
      }
    }
  } else {
    // Local storage fallback for offline / development testing
    try {
      if (toolType === 'all' || toolType === 'pdf') {
        const stored = localStorage.getItem(LOCAL_FILES_KEY);
        const list: UserFile[] = stored ? JSON.parse(stored) : [];
        for (const f of list.filter((x) => x.user_id === userId)) {
          if (operation && operation !== 'all' && f.operation !== operation) continue;
          items.push({
            id: f.id,
            userId: f.user_id,
            toolType: 'pdf',
            sourceFilename: f.original_name,
            outputFilename: f.original_name,
            displayFilename: f.original_name,
            operation: f.operation,
            operationLabel: formatPdfOperation(f.operation),
            fileSize: Number(f.file_size) || 0,
            status: f.status === 'processing' ? 'processing' : f.status === 'failed' ? 'failed' : 'completed',
            storagePath: f.storage_path,
            createdAt: f.created_at,
          });
        }
      }

      if (toolType === 'all' || toolType === 'document_converter') {
        const stored = localStorage.getItem(LOCAL_CONVERSIONS_KEY);
        const list = stored ? JSON.parse(stored) : [];
        for (const c of list) {
          const opLabel = `${(c.source_format || 'DOC').toUpperCase()} → ${(c.target_format || 'PDF').toUpperCase()}`;
          items.push({
            id: c.id,
            userId: c.user_id || userId,
            toolType: 'document_converter',
            sourceFilename: c.source_filename || 'document',
            outputFilename: c.output_filename || 'document.pdf',
            displayFilename: c.source_filename || 'document',
            sourceFormat: c.source_format,
            targetFormat: c.target_format,
            operation: `${c.source_format}_to_${c.target_format}`,
            operationLabel: opLabel,
            fileSize: Number(c.output_file_size || c.source_file_size) || 0,
            status: c.status === 'processing' ? 'processing' : c.status === 'failed' ? 'failed' : 'completed',
            storagePath: c.storage_path || '',
            createdAt: c.created_at || new Date().toISOString(),
            downloadUrl: c.download_url,
          });
        }
      }
    } catch {
      // ignore
    }
  }

  // Deduplicate items by ID
  const seen = new Set<string>();
  const deduplicated = items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });

  // Filter by search query across source and output filenames
  let filtered = deduplicated;
  if (search.trim()) {
    const s = search.toLowerCase().trim();
    filtered = filtered.filter(
      (item) =>
        item.sourceFilename.toLowerCase().includes(s) ||
        item.outputFilename.toLowerCase().includes(s) ||
        item.operationLabel.toLowerCase().includes(s)
    );
  }

  // Sort descending by creation date
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return filtered;
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
// GET UNIFIED DOWNLOAD URL (PDF OR CONVERSION)
// ------------------------------------------------------------
export async function getUnifiedDownloadUrl(item: UnifiedHistoryItem): Promise<string> {
  if (item.downloadUrl && (item.downloadUrl.startsWith('data:') || item.downloadUrl.startsWith('blob:'))) {
    return item.downloadUrl;
  }

  const supabase = getSupabaseClient();
  if (supabase && item.storagePath) {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(item.storagePath, 60 * 60, {
        download: item.outputFilename || item.displayFilename,
      });

    if (error || !data?.signedUrl) {
      throw new Error('Could not generate secure download link.');
    }
    return data.signedUrl;
  }

  // Local fallback
  const blob = await getBlobLocally(item.id);
  if (blob) {
    return URL.createObjectURL(blob);
  }

  if (item.downloadUrl) {
    return item.downloadUrl;
  }

  throw new Error('Download link not available for this record.');
}

// ------------------------------------------------------------
// DELETE USER FILE (PDF)
// ------------------------------------------------------------
export async function deleteUserFile(file: UserFile): Promise<void> {
  const supabase = getSupabaseClient();

  if (supabase) {
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([file.storage_path]);

    if (storageError) {
      console.warn('Storage delete warning:', storageError);
    }

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

// ------------------------------------------------------------
// DELETE UNIFIED HISTORY ITEM (PDF OR CONVERSION)
// ------------------------------------------------------------
export async function deleteUnifiedHistoryItem(item: UnifiedHistoryItem): Promise<void> {
  const supabase = getSupabaseClient();

  if (supabase) {
    if (item.storagePath) {
      await supabase.storage.from(BUCKET_NAME).remove([item.storagePath]).catch((err) => {
        console.warn('Storage delete warning:', err);
      });
    }

    if (item.toolType === 'pdf') {
      const { error } = await supabase
        .from('files')
        .delete()
        .eq('id', item.id)
        .eq('user_id', item.userId);
      if (error) throw new Error('Could not delete PDF file record.');
    } else {
      const { error } = await supabase
        .from('document_conversions')
        .delete()
        .eq('id', item.id)
        .eq('user_id', item.userId);
      if (error) throw new Error('Could not delete conversion record.');
    }
  } else {
    if (item.toolType === 'pdf') {
      await deleteBlobLocally(item.id);
      try {
        const stored = localStorage.getItem(LOCAL_FILES_KEY);
        if (stored) {
          const list: UserFile[] = JSON.parse(stored);
          localStorage.setItem(LOCAL_FILES_KEY, JSON.stringify(list.filter((f) => f.id !== item.id)));
        }
      } catch {}
    } else {
      try {
        const stored = localStorage.getItem(LOCAL_CONVERSIONS_KEY);
        if (stored) {
          const list = JSON.parse(stored);
          localStorage.setItem(LOCAL_CONVERSIONS_KEY, JSON.stringify(list.filter((c: { id?: string }) => c.id !== item.id)));
        }
      } catch {}
    }
  }
}
