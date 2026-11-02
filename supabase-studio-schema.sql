-- Cognify Studio (pipeline, projects, schedule, finance, growth) - Database Schema
-- Run this once in your Supabase SQL Editor.
--
-- One row per user holds the whole Studio workspace as JSON. Every deal, project,
-- task, invoice, expense and teammate is saved here, so it follows your account
-- across browsers and devices instead of living only in one browser.

CREATE TABLE IF NOT EXISTS public.studio_data (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.studio_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own studio data" ON public.studio_data;
DROP POLICY IF EXISTS "Users can insert their own studio data" ON public.studio_data;
DROP POLICY IF EXISTS "Users can update their own studio data" ON public.studio_data;
DROP POLICY IF EXISTS "Users can delete their own studio data" ON public.studio_data;

-- RLS policies (per-user isolation)
CREATE POLICY "Users can view their own studio data" ON public.studio_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own studio data" ON public.studio_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own studio data" ON public.studio_data
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own studio data" ON public.studio_data
  FOR DELETE USING (auth.uid() = user_id);

-- Automatic updated_at trigger (lets the app tell when another device saved newer data)
CREATE OR REPLACE FUNCTION update_studio_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS studio_data_updated_at_trigger ON public.studio_data;
CREATE TRIGGER studio_data_updated_at_trigger
  BEFORE UPDATE ON public.studio_data
  FOR EACH ROW
  EXECUTE FUNCTION update_studio_data_updated_at();

-- Grant permissions
GRANT ALL ON public.studio_data TO authenticated;
GRANT ALL ON public.studio_data TO service_role;
