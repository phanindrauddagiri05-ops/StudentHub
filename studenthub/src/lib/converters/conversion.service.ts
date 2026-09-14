// ============================================================
// StudentHub — Client Conversion Service
// Dispatches conversion requests to the server, manages progress,
// and manages user conversion history.
// ============================================================

import { ConversionRecord, DocumentFormat } from './types';
import { getSupabaseClient } from '../supabase/client';

const LOCAL_CONVERSIONS_KEY = 'studenthub_local_conversions';

export interface ConvertOptions {
  file: File;
  sourceFormat: DocumentFormat;
  targetFormat: DocumentFormat;
  userId?: string;
  onProgress?: (progress: number, stage: string) => void;
}

export async function convertDocument({
  file,
  sourceFormat,
  targetFormat,
  userId = 'guest',
  onProgress,
}: ConvertOptions): Promise<{ record: ConversionRecord; downloadUrl: string }> {
  onProgress?.(15, 'Uploading document...');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('sourceFormat', sourceFormat);
  formData.append('targetFormat', targetFormat);
  formData.append('userId', userId);

  onProgress?.(40, 'Converting document on secure server...');

  const response = await fetch('/api/convert', {
    method: 'POST',
    body: formData,
  });

  onProgress?.(80, 'Processing conversion output...');

  if (!response.ok) {
    let errorMsg = 'Failed to convert document.';
    try {
      const errJson = await response.json();
      if (errJson?.error) errorMsg = errJson.error;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  const result = await response.json();

  if (!result.success || !result.record) {
    throw new Error(result.error || 'Conversion failed.');
  }

  onProgress?.(100, 'Conversion complete!');

  // Save to local storage cache for offline & immediate history display
  try {
    const existing: ConversionRecord[] = JSON.parse(
      localStorage.getItem(LOCAL_CONVERSIONS_KEY) || '[]'
    );
    existing.unshift(result.record);
    localStorage.setItem(LOCAL_CONVERSIONS_KEY, JSON.stringify(existing.slice(0, 50)));
  } catch {
    // ignore
  }

  return {
    record: result.record,
    downloadUrl: result.downloadUrl || result.record.download_url,
  };
}

export async function getUserConversions(userId: string): Promise<ConversionRecord[]> {
  const supabase = getSupabaseClient();

  if (supabase && userId && userId !== 'guest') {
    try {
      const { data, error } = await supabase
        .from('document_conversions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30);

      if (!error && data) {
        return data as ConversionRecord[];
      }
    } catch (err) {
      console.warn('Error fetching conversions from Supabase:', err);
    }
  }

  // Fallback to local storage
  try {
    const local = localStorage.getItem(LOCAL_CONVERSIONS_KEY);
    if (local) {
      const parsed: ConversionRecord[] = JSON.parse(local);
      return parsed.filter((r) => !userId || r.user_id === userId || r.user_id === 'guest');
    }
  } catch {
    // ignore
  }

  return [];
}

export async function deleteConversionRecord(recordId: string, userId: string): Promise<void> {
  const supabase = getSupabaseClient();

  if (supabase && userId && userId !== 'guest') {
    try {
      await supabase.from('document_conversions').delete().eq('id', recordId).eq('user_id', userId);
    } catch {
      // ignore
    }
  }

  try {
    const local = localStorage.getItem(LOCAL_CONVERSIONS_KEY);
    if (local) {
      const parsed: ConversionRecord[] = JSON.parse(local);
      const filtered = parsed.filter((r) => r.id !== recordId);
      localStorage.setItem(LOCAL_CONVERSIONS_KEY, JSON.stringify(filtered));
    }
  } catch {
    // ignore
  }
}
