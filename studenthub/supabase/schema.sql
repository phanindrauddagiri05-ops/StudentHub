-- ============================================================
-- StudentHub Database Schema & Row Level Security (RLS)
-- Phase 2: Authentication, User Profiles, Files & Activity Logs
-- ============================================================

-- Enable pgcrypto for UUID generation if not enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  college TEXT,
  course TEXT,
  department TEXT,
  year TEXT,
  semester TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = user_id);

-- ============================================================
-- 2. FILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT DEFAULT 'application/pdf',
  file_size BIGINT NOT NULL DEFAULT 0,
  operation TEXT NOT NULL, -- 'merge', 'split', 'compress', 'pdf_to_images', 'images_to_pdf', 'reorder'
  status TEXT NOT NULL DEFAULT 'completed', -- 'processing', 'completed', 'failed'
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index for fast user queries ordered by date
CREATE INDEX IF NOT EXISTS idx_files_user_created ON public.files(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_files_operation ON public.files(user_id, operation);

-- Enable RLS for files
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- Files Policies: strict user isolation
CREATE POLICY "Users can view own files" 
  ON public.files FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own files" 
  ON public.files FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own files" 
  ON public.files FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own files" 
  ON public.files FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================================
-- 3. ACTIVITY LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'pdf_merge', 'pdf_split', 'pdf_compress', 'pdf_to_images', 'images_to_pdf', 'pdf_reorder'
  resource_type TEXT NOT NULL DEFAULT 'pdf',
  resource_id UUID REFERENCES public.files(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index for fast user activity feed
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created ON public.activity_logs(user_id, created_at DESC);

-- Enable RLS for activity logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Activity Logs Policies
CREATE POLICY "Users can view own activity logs" 
  ON public.activity_logs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity logs" 
  ON public.activity_logs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 4. AUTOMATIC PROFILE CREATION TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url, college, course)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(NEW.raw_user_meta_data->>'college', ''),
    COALESCE(NEW.raw_user_meta_data->>'course', '')
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger firing on every auth.users creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- 5. STORAGE BUCKET CONFIGURATION & RLS
-- ============================================================
-- Insert private storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('studenthub-files', 'studenthub-files', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Storage RLS: Users can only access their own user directory 'users/<user_id>/*'
CREATE POLICY "Users can upload own files to storage"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'studenthub-files' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Users can read own files from storage"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'studenthub-files' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Users can delete own files from storage"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'studenthub-files' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- ============================================================
-- 6. RESUMES TABLE (Phase 3)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  template TEXT NOT NULL DEFAULT 'modern',
  resume_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index for fast user query ordered by updated_at
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes(user_id, updated_at DESC);

-- Enable RLS for resumes
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

-- Resumes Policies
CREATE POLICY "Users can view own resumes" 
  ON public.resumes FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own resumes" 
  ON public.resumes FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resumes" 
  ON public.resumes FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own resumes" 
  ON public.resumes FOR DELETE 
  USING (auth.uid() = user_id);

