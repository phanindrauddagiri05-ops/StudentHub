import { ConversionRecord, DocumentFormat } from './types';
import { isImageFormat } from './registry';
import { getSupabaseClient } from '../supabase/client';

const LOCAL_CONVERSIONS_KEY = 'studenthub_recent_conversions';
const LEGACY_CONVERSIONS_KEY = 'studenthub_local_conversions';
const LOCAL_ACTIVITIES_KEY = 'studenthub_local_activities';

export interface ConvertOptions {
  file: File;
  sourceFormat: DocumentFormat;
  targetFormat: DocumentFormat;
  userId?: string;
  quality?: number;
  backgroundColor?: string;
  onProgress?: (progress: number, stage: string) => void;
}

export async function convertDocument({
  file,
  sourceFormat,
  targetFormat,
  userId = 'guest',
  quality,
  backgroundColor,
  onProgress,
}: ConvertOptions): Promise<{ record: ConversionRecord; downloadUrl: string }> {
  onProgress?.(15, 'Uploading file...');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('sourceFormat', sourceFormat);
  formData.append('targetFormat', targetFormat);
  formData.append('userId', userId);
  if (quality !== undefined) {
    formData.append('quality', quality.toString());
  }
  if (backgroundColor) {
    formData.append('backgroundColor', backgroundColor);
  }

  const headers: Record<string, string> = {};
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.access_token) {
        headers['Authorization'] = `Bearer ${data.session.access_token}`;
      }
    } catch (authErr) {
      console.warn('Could not read Supabase session token:', authErr);
    }
  }

  onProgress?.(40, 'Processing conversion on secure server...');

  const response = await fetch('/api/convert', {
    method: 'POST',
    headers,
    body: formData,
  });

  onProgress?.(80, 'Processing conversion output...');

  if (!response.ok) {
    let errorMsg = 'Failed to convert document.';
    try {
      const errJson = await response.json();
      if (errJson?.error) errorMsg = errJson.error;
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMsg);
  }

  const result = await response.json();

  if (!result.success || !result.record) {
    throw new Error(result.error || 'Conversion failed.');
  }

  onProgress?.(100, 'Conversion complete!');

  // Save to unified local storage cache for offline & immediate history display
  try {
    const rawLocal = localStorage.getItem(LOCAL_CONVERSIONS_KEY);
    const rawLegacy = localStorage.getItem(LEGACY_CONVERSIONS_KEY);
    const existing: ConversionRecord[] = rawLocal
      ? JSON.parse(rawLocal)
      : rawLegacy
      ? JSON.parse(rawLegacy)
      : [];
    
    // Prevent duplicates
    const filtered = existing.filter((r) => r.id !== result.record.id);
    filtered.unshift(result.record);
    localStorage.setItem(LOCAL_CONVERSIONS_KEY, JSON.stringify(filtered.slice(0, 50)));

    // Also record to local activities log so Dashboard Recent Activity updates instantly
    const isImage = isImageFormat(sourceFormat) || isImageFormat(targetFormat);
    const rawActivities = localStorage.getItem(LOCAL_ACTIVITIES_KEY);
    const activities = rawActivities ? JSON.parse(rawActivities) : [];
    activities.unshift({
      id: `act_${Date.now()}`,
      user_id: userId,
      action: isImage ? 'image_conversion' : 'document_conversion',
      resource_type: isImage ? 'image' : 'document',
      resource_id: result.record.id,
      metadata: {
        source_filename: file.name,
        source_format: sourceFormat,
        target_format: targetFormat,
        output_filename: result.record.output_filename,
        tool_type: isImage ? 'image_converter' : 'document_converter',
      },
      created_at: new Date().toISOString(),
    });
    localStorage.setItem(LOCAL_ACTIVITIES_KEY, JSON.stringify(activities.slice(0, 50)));
  } catch (storageErr) {
    console.error('Failed to update local conversion cache:', storageErr);
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

  // Fallback to local storage (inspect unified key and legacy key)
  try {
    const local = localStorage.getItem(LOCAL_CONVERSIONS_KEY) || localStorage.getItem(LEGACY_CONVERSIONS_KEY);
    if (local) {
      const parsed: ConversionRecord[] = JSON.parse(local);
      return parsed.filter((r) => !userId || r.user_id === userId || r.user_id === 'guest');
    }
  } catch (parseErr) {
    console.error('Failed to parse local conversions:', parseErr);
  }

  return [];
}

export async function deleteConversionRecord(recordId: string, userId: string): Promise<void> {
  const supabase = getSupabaseClient();

  if (supabase && userId && userId !== 'guest') {
    try {
      const { error } = await supabase.from('document_conversions').delete().eq('id', recordId).eq('user_id', userId);
      if (error) {
        console.error('Error deleting conversion from Supabase:', error);
      }
    } catch (dbErr) {
      console.error('Supabase conversion delete failed:', dbErr);
    }
  }

  try {
    const local = localStorage.getItem(LOCAL_CONVERSIONS_KEY);
    if (local) {
      const parsed: ConversionRecord[] = JSON.parse(local);
      const filtered = parsed.filter((r) => r.id !== recordId);
      localStorage.setItem(LOCAL_CONVERSIONS_KEY, JSON.stringify(filtered));
    }
    const legacy = localStorage.getItem(LEGACY_CONVERSIONS_KEY);
    if (legacy) {
      const parsed: ConversionRecord[] = JSON.parse(legacy);
      const filtered = parsed.filter((r) => r.id !== recordId);
      localStorage.setItem(LEGACY_CONVERSIONS_KEY, JSON.stringify(filtered));
    }
  } catch (err) {
    console.error('Local conversion deletion failed:', err);
  }
}

export const convertImage = convertDocument;

