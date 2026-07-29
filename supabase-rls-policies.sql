-- Enable RLS on all tables
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.containers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own bookmarks" ON public.bookmarks;
DROP POLICY IF EXISTS "Users can insert their own bookmarks" ON public.bookmarks;
DROP POLICY IF EXISTS "Users can update their own bookmarks" ON public.bookmarks;
DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON public.bookmarks;

DROP POLICY IF EXISTS "Users can view their own containers" ON public.containers;
DROP POLICY IF EXISTS "Users can insert their own containers" ON public.containers;
DROP POLICY IF EXISTS "Users can update their own containers" ON public.containers;
DROP POLICY IF EXISTS "Users can delete their own containers" ON public.containers;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Bookmarks policies
CREATE POLICY "Users can view their own bookmarks"
  ON public.bookmarks
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookmarks"
  ON public.bookmarks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookmarks"
  ON public.bookmarks
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks"
  ON public.bookmarks
  FOR DELETE
  USING (auth.uid() = user_id);

-- Containers policies
CREATE POLICY "Users can view their own containers"
  ON public.containers
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own containers"
  ON public.containers
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own containers"
  ON public.containers
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own containers"
  ON public.containers
  FOR DELETE
  USING (auth.uid() = user_id);

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
