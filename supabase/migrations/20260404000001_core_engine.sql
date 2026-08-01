CREATE TABLE public.workspaces (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  owner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.workspace_members (
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'member' NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (workspace_id, user_id)
);

CREATE TABLE public.pages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  parent_id uuid REFERENCES public.pages(id) ON DELETE CASCADE,
  title text DEFAULT 'Untitled',
  icon text,
  cover_image text,
  is_public boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.blocks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id uuid REFERENCES public.pages(id) ON DELETE CASCADE NOT NULL UNIQUE,
  content jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance as requested in the plan
CREATE INDEX idx_pages_workspace_id ON public.pages(workspace_id);
CREATE INDEX idx_pages_parent_id ON public.pages(parent_id);
CREATE INDEX idx_blocks_page_id ON public.blocks(page_id);

-- Enable RLS
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

-- Workspace Policies
CREATE POLICY "Users can view workspaces they are members of"
  ON public.workspaces FOR SELECT
  USING (
    owner_id = auth.uid() OR
    id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()) OR
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  );

CREATE POLICY "Users can insert workspaces"
  ON public.workspaces FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Workspace Members Policies
CREATE POLICY "Users can view members of their workspaces"
  ON public.workspace_members FOR SELECT
  USING (
    workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid()) OR
    workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()) OR
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  );

-- Pages Policies
CREATE POLICY "Users can view pages in their workspaces or public pages"
  ON public.pages FOR SELECT
  USING (
    is_public = true OR
    workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid()) OR
    workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()) OR
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  );

CREATE POLICY "Users can insert/update pages in their workspaces"
  ON public.pages FOR ALL
  USING (
    workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid()) OR
    workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('editor', 'owner')) OR
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  );

-- Blocks Policies
CREATE POLICY "Users can view blocks in accessible pages"
  ON public.blocks FOR SELECT
  USING (
    page_id IN (SELECT id FROM public.pages) -- Depends on pages SELECT policy above
  );

CREATE POLICY "Users can insert/update blocks in accessible pages"
  ON public.blocks FOR ALL
  USING (
    page_id IN (SELECT id FROM public.pages WHERE 
      workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid()) OR
      workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('editor', 'owner')) OR
      auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    )
  );

-- Enable Realtime for blocks table
ALTER PUBLICATION supabase_realtime ADD TABLE public.blocks;
