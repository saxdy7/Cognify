-- Cognify Visual Workspace - Database Schema
-- Run this in your Supabase SQL Editor

-- Create canvas_boards table
CREATE TABLE IF NOT EXISTS public.canvas_boards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  background_color TEXT DEFAULT '#F4F4F0',
  is_dark_mode BOOLEAN DEFAULT FALSE,
  parent_board_id UUID REFERENCES public.canvas_boards(id) ON DELETE CASCADE,
  tldraw_snapshot JSONB, -- legacy snapshot / template bootstrap flag ({ isNewTemplate, templateId })
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure the column exists on databases created before it was added
ALTER TABLE public.canvas_boards ADD COLUMN IF NOT EXISTS tldraw_snapshot JSONB;

-- Create canvas_elements table
CREATE TABLE IF NOT EXISTS public.canvas_elements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID NOT NULL REFERENCES public.canvas_boards(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'note', 'image', 'link', 'file', 'todo', 'column', 'board_link', 'text'
  x FLOAT NOT NULL DEFAULT 0,
  y FLOAT NOT NULL DEFAULT 0,
  width FLOAT DEFAULT 280,
  height FLOAT DEFAULT 160,
  color TEXT DEFAULT '#FFFFFF', -- pastel background customization
  content JSONB NOT NULL DEFAULT '{}'::jsonb, -- dynamic card-type content
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create canvas_connectors table
CREATE TABLE IF NOT EXISTS public.canvas_connectors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID NOT NULL REFERENCES public.canvas_boards(id) ON DELETE CASCADE,
  source_element_id UUID NOT NULL REFERENCES public.canvas_elements(id) ON DELETE CASCADE,
  target_element_id UUID NOT NULL REFERENCES public.canvas_elements(id) ON DELETE CASCADE,
  color TEXT DEFAULT '#5B6CF9',
  label TEXT,
  style TEXT DEFAULT 'straight', -- 'straight' or 'curved'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.canvas_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canvas_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canvas_connectors ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid collision
DROP POLICY IF EXISTS "Users can view their own boards" ON public.canvas_boards;
DROP POLICY IF EXISTS "Users can insert their own boards" ON public.canvas_boards;
DROP POLICY IF EXISTS "Users can update their own boards" ON public.canvas_boards;
DROP POLICY IF EXISTS "Users can delete their own boards" ON public.canvas_boards;

DROP POLICY IF EXISTS "Users can view elements on their boards" ON public.canvas_elements;
DROP POLICY IF EXISTS "Users can insert elements on their boards" ON public.canvas_elements;
DROP POLICY IF EXISTS "Users can update elements on their boards" ON public.canvas_elements;
DROP POLICY IF EXISTS "Users can delete elements on their boards" ON public.canvas_elements;

DROP POLICY IF EXISTS "Users can view connectors on their boards" ON public.canvas_connectors;
DROP POLICY IF EXISTS "Users can insert connectors on their boards" ON public.canvas_connectors;
DROP POLICY IF EXISTS "Users can update connectors on their boards" ON public.canvas_connectors;
DROP POLICY IF EXISTS "Users can delete connectors on their boards" ON public.canvas_connectors;

-- Add RLS Policies
-- canvas_boards
CREATE POLICY "Users can view their own boards" ON public.canvas_boards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own boards" ON public.canvas_boards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own boards" ON public.canvas_boards
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own boards" ON public.canvas_boards
  FOR DELETE USING (auth.uid() = user_id);

-- canvas_elements
CREATE POLICY "Users can view elements on their boards" ON public.canvas_elements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.canvas_boards 
      WHERE canvas_boards.id = canvas_elements.board_id AND canvas_boards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert elements on their boards" ON public.canvas_elements
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.canvas_boards 
      WHERE canvas_boards.id = canvas_elements.board_id AND canvas_boards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update elements on their boards" ON public.canvas_elements
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.canvas_boards 
      WHERE canvas_boards.id = canvas_elements.board_id AND canvas_boards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete elements on their boards" ON public.canvas_elements
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.canvas_boards 
      WHERE canvas_boards.id = canvas_elements.board_id AND canvas_boards.user_id = auth.uid()
    )
  );

-- canvas_connectors
CREATE POLICY "Users can view connectors on their boards" ON public.canvas_connectors
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.canvas_boards 
      WHERE canvas_boards.id = canvas_connectors.board_id AND canvas_boards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert connectors on their boards" ON public.canvas_connectors
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.canvas_boards 
      WHERE canvas_boards.id = canvas_connectors.board_id AND canvas_boards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update connectors on their boards" ON public.canvas_connectors
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.canvas_boards 
      WHERE canvas_boards.id = canvas_connectors.board_id AND canvas_boards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete connectors on their boards" ON public.canvas_connectors
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.canvas_boards 
      WHERE canvas_boards.id = canvas_connectors.board_id AND canvas_boards.user_id = auth.uid()
    )
  );

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_canvas_boards_user_id ON public.canvas_boards(user_id);
CREATE INDEX IF NOT EXISTS idx_canvas_elements_board_id ON public.canvas_elements(board_id);
CREATE INDEX IF NOT EXISTS idx_canvas_connectors_board_id ON public.canvas_connectors(board_id);
CREATE INDEX IF NOT EXISTS idx_canvas_connectors_source ON public.canvas_connectors(source_element_id);
CREATE INDEX IF NOT EXISTS idx_canvas_connectors_target ON public.canvas_connectors(target_element_id);

-- Create automatic update_updated_at triggers
CREATE OR REPLACE FUNCTION update_canvas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS canvas_boards_updated_at_trigger ON public.canvas_boards CASCADE;
DROP TRIGGER IF EXISTS canvas_boards_updated_at_trigger ON canvas_boards CASCADE;
CREATE TRIGGER canvas_boards_updated_at_trigger
  BEFORE UPDATE ON public.canvas_boards
  FOR EACH ROW
  EXECUTE FUNCTION update_canvas_updated_at();

DROP TRIGGER IF EXISTS canvas_elements_updated_at_trigger ON public.canvas_elements;
DROP TRIGGER IF EXISTS canvas_elements_updated_at_trigger ON canvas_elements;
CREATE TRIGGER canvas_elements_updated_at_trigger
  BEFORE UPDATE ON public.canvas_elements
  FOR EACH ROW
  EXECUTE FUNCTION update_canvas_updated_at();

-- Grant permissions
GRANT ALL ON public.canvas_boards TO authenticated;
GRANT ALL ON public.canvas_elements TO authenticated;
GRANT ALL ON public.canvas_connectors TO authenticated;
GRANT ALL ON public.canvas_boards TO service_role;
GRANT ALL ON public.canvas_elements TO service_role;
GRANT ALL ON public.canvas_connectors TO service_role;
