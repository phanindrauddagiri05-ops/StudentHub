import { getSupabaseClient } from '@/lib/supabase/client';
import { isImageFormat } from '@/lib/converters/registry';
import type {
  UserFile,
  ActivityLog,
  DashboardStats,
  PdfOperationType,
  UnifiedHistoryItem,
  HistoryToolType,
  DocumentConversionRecord,
  MindMapData,
  QuestionSetData,
} from '@/types/database';
import { TOOLS } from '@/lib/tools';

const BUCKET_NAME = 'studenthub-files';
const LOCAL_FILES_KEY = 'studenthub_local_files';
const LOCAL_ACTIVITIES_KEY = 'studenthub_local_activities';
const LOCAL_CONVERSIONS_KEY = 'studenthub_recent_conversions';
const LOCAL_SUMMARIES_KEY = 'studenthub_pdf_summaries';
const LOCAL_MINDMAPS_KEY = 'studenthub_mindmaps';
const LOCAL_QUESTIONS_KEY = 'studenthub_question_sets';

const memoryStore = new Map<string, string>();

function getStorageItem(key: string): string | null {
  if (typeof window !== 'undefined') {
    try {
      return localStorage.getItem(key);
    } catch {
      // fallback
    }
  }
  return memoryStore.get(key) || null;
}

function setStorageItem(key: string, value: string): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, value);
    } catch {
      // fallback
    }
  }
  memoryStore.set(key, value);
}

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

  if (supabase && userId !== 'guest') {
    try {
      // 1. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, blob, {
          contentType: mimeType,
          upsert: false,
        });

      if (uploadError) {
        console.error('Storage upload failed, falling back to local storage:', uploadError);
        throw uploadError;
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
        console.error('Files DB insert failed, falling back to local storage:', dbError);
        throw dbError;
      }

      // 3. Insert into activity_logs
      const { error: actError } = await supabase.from('activity_logs').insert({
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

      if (actError) {
        console.error('Activity logs insert error:', actError);
      }

      return fileRow as UserFile;
    } catch (supaErr) {
      console.error('Supabase persistence failure in saveProcessedFile. Safely falling back to local cache:', supaErr);
      // Fall through to local fallback below
    }
  }

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
  let imagesConvertedCount = 0;
  let activitiesCount = 0;

  if (supabase) {
    const { count: fCount } = await supabase
      .from('files')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { data: convData } = await supabase
      .from('document_conversions')
      .select('source_format, target_format')
      .eq('user_id', userId);

    const { count: aCount } = await supabase
      .from('activity_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    pdfFilesCount = fCount || 0;
    if (convData) {
      for (const row of convData) {
        if (isImageFormat(row.source_format) || isImageFormat(row.target_format)) {
          imagesConvertedCount++;
        } else {
          documentsConvertedCount++;
        }
      }
    }
    activitiesCount = aCount || 0;
  } else {
    try {
      const files: UserFile[] = JSON.parse(localStorage.getItem(LOCAL_FILES_KEY) || '[]');
      const acts: ActivityLog[] = JSON.parse(localStorage.getItem(LOCAL_ACTIVITIES_KEY) || '[]');
      const convs = JSON.parse(localStorage.getItem(LOCAL_CONVERSIONS_KEY) || '[]');
      const sums = JSON.parse(localStorage.getItem(LOCAL_SUMMARIES_KEY) || '[]');
      pdfFilesCount = files.filter((f) => f.user_id === userId).length;
      for (const c of convs.filter((x: { user_id?: string }) => x.user_id === userId || !x.user_id)) {
        if (isImageFormat(c.source_format) || isImageFormat(c.target_format)) {
          imagesConvertedCount++;
        } else {
          documentsConvertedCount++;
        }
      }
      activitiesCount = acts.filter((a) => a.user_id === userId).length;
    } catch {
      // ignore
    }
  }

  let pdfSummariesCount = 0;
  let mindMapsCount = 0;
  let questionsCount = 0;
  if (typeof window !== 'undefined') {
    try {
      const sums = JSON.parse(localStorage.getItem(LOCAL_SUMMARIES_KEY) || '[]');
      pdfSummariesCount = sums.filter((s: { userId?: string }) => s.userId === userId || !s.userId || userId === 'guest').length;
      const maps = JSON.parse(localStorage.getItem(LOCAL_MINDMAPS_KEY) || '[]');
      mindMapsCount = maps.filter((m: { userId?: string }) => m.userId === userId || !m.userId || userId === 'guest').length;
      const qsets = JSON.parse(localStorage.getItem(LOCAL_QUESTIONS_KEY) || '[]');
      questionsCount = qsets.filter((q: { userId?: string }) => q.userId === userId || !q.userId || userId === 'guest').length;
    } catch {
      // ignore
    }
  }

  const availableToolsCount = TOOLS.filter((t) => t.status === 'available').length;
  const comingSoonToolsCount = TOOLS.filter((t) => t.status === 'coming-soon').length;

  return {
    pdfFilesCount,
    documentsConvertedCount,
    imagesConvertedCount,
    pdfSummariesCount,
    mindMapsCount,
    questionsCount,
    activitiesCount,
    availableToolsCount,
    comingSoonToolsCount,
  };
}

// ------------------------------------------------------------
// UNIFIED HISTORY SYSTEM (PDF + DOCUMENT CONVERTERS + IMAGE CONVERTERS)
// ------------------------------------------------------------
export async function getUnifiedHistory({
  userId,
  search = '',
  toolType = 'all',
  operation = 'all',
}: {
  userId: string;
  search?: string;
  toolType?: 'all' | 'pdf' | 'document_converter' | 'image_converter' | 'pdf_summary' | 'mind_map' | 'question_set';
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

    // 2. Fetch Document & Image Conversions
    if (toolType === 'all' || toolType === 'document_converter' || toolType === 'image_converter') {
      const { data: convData, error: convError } = await supabase
        .from('document_conversions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!convError && convData) {
        for (const c of convData as DocumentConversionRecord[]) {
          const isImg = isImageFormat(c.source_format) || isImageFormat(c.target_format);
          const itemToolType: HistoryToolType = isImg ? 'image_converter' : 'document_converter';

          if (toolType === 'document_converter' && isImg) continue;
          if (toolType === 'image_converter' && !isImg) continue;

          const opLabel = `${(c.source_format || 'IMG').toUpperCase()} → ${(c.target_format || 'IMG').toUpperCase()}`;
          items.push({
            id: c.id,
            userId: c.user_id,
            toolType: itemToolType,
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

      if (toolType === 'all' || toolType === 'document_converter' || toolType === 'image_converter') {
        const stored = localStorage.getItem(LOCAL_CONVERSIONS_KEY);
        const legacyStored = localStorage.getItem('studenthub_local_conversions');
        const listA = stored ? JSON.parse(stored) : [];
        const listB = legacyStored ? JSON.parse(legacyStored) : [];
        const combined = [...listA, ...listB];
        const uniqueConvs = new Map<string, any>();
        for (const item of combined) {
          if (item?.id && !uniqueConvs.has(item.id)) {
            uniqueConvs.set(item.id, item);
          }
        }
        const list = Array.from(uniqueConvs.values());
        for (const c of list) {
          const isImg = isImageFormat(c.source_format) || isImageFormat(c.target_format);
          const itemToolType: HistoryToolType = isImg ? 'image_converter' : 'document_converter';

          if (toolType === 'document_converter' && isImg) continue;
          if (toolType === 'image_converter' && !isImg) continue;

          const opLabel = `${(c.source_format || 'IMG').toUpperCase()} → ${(c.target_format || 'IMG').toUpperCase()}`;
          items.push({
            id: c.id,
            userId: c.user_id || userId,
            toolType: itemToolType,
            sourceFilename: c.source_filename || 'image',
            outputFilename: c.output_filename || 'image.jpg',
            displayFilename: c.source_filename || 'image',
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

    // Include PDF Summaries in local fallback and unified list
    try {
      if (toolType === 'all' || toolType === 'pdf_summary') {
        const storedSummaries = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_SUMMARIES_KEY) : null;
        if (storedSummaries) {
          const sumList: any[] = JSON.parse(storedSummaries);
          for (const s of sumList.filter((x) => x.userId === userId || !x.userId || userId === 'guest')) {
            items.push({
              id: s.id,
              userId: s.userId || userId,
              toolType: 'pdf_summary',
              sourceFilename: s.filename || 'document.pdf',
              outputFilename: `${(s.filename || 'document').replace(/\.pdf$/i, '')}_summary.txt`,
              displayFilename: s.filename || 'document.pdf',
              operation: 'pdf_summary',
              operationLabel: 'PDF Summary',
              fileSize: s.fileSize || 0,
              status: 'completed',
              storagePath: '',
              createdAt: s.createdAt || new Date().toISOString(),
              summaryData: s.summary,
            });
          }
        }
      }

      // Include Mind Maps in unified list
      if (toolType === 'all' || toolType === 'mind_map') {
        const storedMaps = getStorageItem(LOCAL_MINDMAPS_KEY);
        if (storedMaps) {
          const mapList: any[] = JSON.parse(storedMaps);
          for (const m of mapList.filter((x) => x.userId === userId || !x.userId || userId === 'guest')) {
            items.push({
              id: m.id,
              userId: m.userId || userId,
              toolType: 'mind_map',
              sourceFilename: m.title || 'Mind Map',
              outputFilename: `${m.title || 'mind-map'}.json`,
              displayFilename: m.title || 'Mind Map',
              operation: 'mind_map',
              operationLabel: 'Mind Map',
              fileSize: JSON.stringify(m.data || {}).length,
              status: 'completed',
              storagePath: '',
              createdAt: m.createdAt || new Date().toISOString(),
              mindMapData: m.data,
            });
          }
        }
      }

      // Include Question Sets in unified list
      if (toolType === 'all' || toolType === 'question_set') {
        const storedQuestions = getStorageItem(LOCAL_QUESTIONS_KEY);
        if (storedQuestions) {
          const qList: any[] = JSON.parse(storedQuestions);
          for (const q of qList.filter((x) => x.userId === userId || !x.userId || userId === 'guest')) {
            items.push({
              id: q.id,
              userId: q.userId || userId,
              toolType: 'question_set',
              sourceFilename: q.title || 'Exam Preparation',
              outputFilename: `${q.title || 'questions'}.json`,
              displayFilename: q.title || 'Exam Questions',
              operation: 'question_set',
              operationLabel: `Questions (${q.data?.questions?.length || q.questionCount || 0} Qs)`,
              fileSize: JSON.stringify(q.data || {}).length,
              status: 'completed',
              storagePath: '',
              createdAt: q.createdAt || new Date().toISOString(),
              questionSetData: q.data,
            });
          }
        }
      }
    } catch (e) {
      console.error('Error fetching summaries/mindmaps/questions for history:', e);
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
    } else if (item.toolType === 'pdf_summary') {
      try {
        const stored = localStorage.getItem(LOCAL_SUMMARIES_KEY);
        if (stored) {
          const list = JSON.parse(stored);
          localStorage.setItem(LOCAL_SUMMARIES_KEY, JSON.stringify(list.filter((s: { id?: string }) => s.id !== item.id)));
        }
      } catch (err) {
        console.error('Error deleting local summary from cache:', err);
      }
    } else if (item.toolType === 'mind_map') {
      try {
        const stored = localStorage.getItem(LOCAL_MINDMAPS_KEY);
        if (stored) {
          const list = JSON.parse(stored);
          localStorage.setItem(LOCAL_MINDMAPS_KEY, JSON.stringify(list.filter((m: { id?: string }) => m.id !== item.id)));
        }
      } catch (err) {
        console.error('Error deleting mind map record:', err);
      }
    } else if (item.toolType === 'question_set') {
      try {
        const stored = localStorage.getItem(LOCAL_QUESTIONS_KEY);
        if (stored) {
          const list = JSON.parse(stored);
          localStorage.setItem(LOCAL_QUESTIONS_KEY, JSON.stringify(list.filter((q: { id?: string }) => q.id !== item.id)));
        }
      } catch (err) {
        console.error('Error deleting question set record:', err);
      }
    } else {
      try {
        const stored = localStorage.getItem(LOCAL_CONVERSIONS_KEY);
        if (stored) {
          const list = JSON.parse(stored);
          localStorage.setItem(LOCAL_CONVERSIONS_KEY, JSON.stringify(list.filter((c: { id?: string }) => c.id !== item.id)));
        }
        const legacyStored = localStorage.getItem('studenthub_local_conversions');
        if (legacyStored) {
          const list = JSON.parse(legacyStored);
          localStorage.setItem('studenthub_local_conversions', JSON.stringify(list.filter((c: { id?: string }) => c.id !== item.id)));
        }
      } catch (err) {
        console.error('Error deleting from local conversion cache:', err);
      }
    }
  }
}

// ------------------------------------------------------------
// SAVE PDF SUMMARY RECORD
// ------------------------------------------------------------
export interface SavePdfSummaryParams {
  id: string;
  userId: string;
  filename: string;
  fileSize: number;
  pageCount: number;
  wordCount: number;
  summary: {
    overview: string;
    keyPoints: string[];
    importantDetails: string[];
    conclusions: string;
  };
  provider: string;
  createdAt: string;
}

export async function savePdfSummaryRecord(params: SavePdfSummaryParams): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(LOCAL_SUMMARIES_KEY);
      const list = stored ? JSON.parse(stored) : [];
      // avoid duplicates
      if (!list.some((s: { id?: string }) => s.id === params.id)) {
        list.unshift(params);
        localStorage.setItem(LOCAL_SUMMARIES_KEY, JSON.stringify(list.slice(0, 100)));
      }

      // Log to local activities
      const actStored = localStorage.getItem(LOCAL_ACTIVITIES_KEY);
      const acts = actStored ? JSON.parse(actStored) : [];
      acts.unshift({
        id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        user_id: params.userId,
        action: `PDF summarized — ${params.filename}`,
        resource_type: 'pdf_summary',
        metadata: { filename: params.filename },
        created_at: params.createdAt,
      });
      localStorage.setItem(LOCAL_ACTIVITIES_KEY, JSON.stringify(acts.slice(0, 100)));
    } catch (err) {
      console.warn('Could not save summary record locally:', err);
    }
  }

  const supabase = getSupabaseClient();
  if (supabase && params.userId && params.userId !== 'guest') {
    try {
      await supabase.from('files').insert({
        id: params.id,
        user_id: params.userId,
        original_name: params.filename,
        storage_path: `summaries/${params.userId}/${params.id}.json`,
        mime_type: 'application/json',
        file_size: params.fileSize,
        operation: 'compress' as any,
        status: 'completed',
        created_at: params.createdAt,
      });
    } catch {
      // ignore
    }
  }
}

// ------------------------------------------------------------
// SAVE MIND MAP RECORD
// ------------------------------------------------------------
export interface SaveMindMapParams {
  id: string;
  userId: string;
  title: string;
  data: MindMapData;
  createdAt?: string;
}

export async function saveMindMapRecord(params: SaveMindMapParams): Promise<void> {
  const createdAt = params.createdAt || new Date().toISOString();
  const entry = {
    id: params.id,
    userId: params.userId,
    title: params.title,
    data: params.data,
    createdAt,
  };

  try {
    const stored = getStorageItem(LOCAL_MINDMAPS_KEY);
    const list = stored ? JSON.parse(stored) : [];
    const existingIdx = list.findIndex((m: { id?: string }) => m.id === params.id);
    if (existingIdx >= 0) {
      list[existingIdx] = entry;
    } else {
      list.unshift(entry);
    }
    setStorageItem(LOCAL_MINDMAPS_KEY, JSON.stringify(list.slice(0, 100)));

    // Log activity
    const actStored = getStorageItem(LOCAL_ACTIVITIES_KEY);
    const acts = actStored ? JSON.parse(actStored) : [];
    acts.unshift({
      id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      user_id: params.userId,
      action: `Mind Map created — ${params.title}`,
      resource_type: 'mind_map',
      metadata: { title: params.title },
      created_at: createdAt,
    });
    setStorageItem(LOCAL_ACTIVITIES_KEY, JSON.stringify(acts.slice(0, 100)));
  } catch (err) {
    console.warn('Could not save mind map locally:', err);
  }

  const supabase = getSupabaseClient();
  if (supabase && params.userId && params.userId !== 'guest') {
    try {
      await supabase.from('files').insert({
        id: params.id,
        user_id: params.userId,
        original_name: `${params.title}.json`,
        storage_path: `mindmaps/${params.userId}/${params.id}.json`,
        mime_type: 'application/json',
        file_size: JSON.stringify(params.data).length,
        operation: 'compress' as any,
        status: 'completed',
        created_at: createdAt,
      });
    } catch {
      // ignore
    }
  }
}

export async function getMindMapRecord(id: string): Promise<MindMapData | null> {
  try {
    const stored = getStorageItem(LOCAL_MINDMAPS_KEY);
    if (stored) {
      const list = JSON.parse(stored);
      const match = list.find((m: { id?: string }) => m.id === id);
      if (match) return match.data;
    }
  } catch (err) {
    console.warn('Could not read local mind map:', err);
  }
  return null;
}

// ------------------------------------------------------------
// SAVE QUESTION SET RECORD
// ------------------------------------------------------------
export interface SaveQuestionSetParams {
  id: string;
  userId: string;
  title: string;
  data: QuestionSetData;
  createdAt?: string;
}

export async function saveQuestionSetRecord(params: SaveQuestionSetParams): Promise<void> {
  const createdAt = params.createdAt || new Date().toISOString();
  const entry = {
    id: params.id,
    userId: params.userId,
    title: params.title,
    data: params.data,
    questionCount: params.data.questions.length,
    createdAt,
  };

  try {
    const stored = getStorageItem(LOCAL_QUESTIONS_KEY);
    const list = stored ? JSON.parse(stored) : [];
    const existingIdx = list.findIndex((q: { id?: string }) => q.id === params.id);
    if (existingIdx >= 0) {
      list[existingIdx] = entry;
    } else {
      list.unshift(entry);
    }
    setStorageItem(LOCAL_QUESTIONS_KEY, JSON.stringify(list.slice(0, 100)));

    // Log activity
    const actStored = getStorageItem(LOCAL_ACTIVITIES_KEY);
    const acts = actStored ? JSON.parse(actStored) : [];
    acts.unshift({
      id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      user_id: params.userId,
      action: `Question set generated — ${params.title} (${params.data.questions.length} questions)`,
      resource_type: 'question_set',
      metadata: { title: params.title, count: params.data.questions.length },
      created_at: createdAt,
    });
    setStorageItem(LOCAL_ACTIVITIES_KEY, JSON.stringify(acts.slice(0, 100)));
  } catch (err) {
    console.warn('Could not save question set locally:', err);
  }

  const supabase = getSupabaseClient();
  if (supabase && params.userId && params.userId !== 'guest') {
    try {
      await supabase.from('files').insert({
        id: params.id,
        user_id: params.userId,
        original_name: `${params.title}.json`,
        storage_path: `questions/${params.userId}/${params.id}.json`,
        mime_type: 'application/json',
        file_size: JSON.stringify(params.data).length,
        operation: 'compress' as any,
        status: 'completed',
        created_at: createdAt,
      });
    } catch {
      // ignore
    }
  }
}

export async function getQuestionSetRecord(id: string): Promise<QuestionSetData | null> {
  try {
    const stored = getStorageItem(LOCAL_QUESTIONS_KEY);
    if (stored) {
      const list = JSON.parse(stored);
      const match = list.find((q: { id?: string }) => q.id === id);
      if (match) return match.data;
    }
  } catch (err) {
    console.warn('Could not read local question set:', err);
  }
  return null;
}

