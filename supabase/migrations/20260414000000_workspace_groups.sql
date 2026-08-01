-- ============================================================
-- MIGRATION: Workspace Groups (Folders) Architecture
-- Date: 2026-04-14
-- Description: Adds workspace_groups table, group_admins junction
--              table, and group_id FK on workspaces. Migrates all
--              existing workspaces into a "General" group.
-- ============================================================

-- 1. Create workspace_groups table
CREATE TABLE public.workspace_groups (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create group_admins junction table (M:N — one user can admin many groups)
CREATE TABLE public.group_admins (
  group_id uuid REFERENCES public.workspace_groups(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (group_id, user_id)
);

-- 3. Add group_id column to workspaces (nullable for safety during migration)
ALTER TABLE public.workspaces
  ADD COLUMN group_id uuid REFERENCES public.workspace_groups(id) ON DELETE SET NULL;

-- 4. Create indexes for performance
CREATE INDEX idx_workspaces_group_id ON public.workspaces(group_id);
CREATE INDEX idx_group_admins_user_id ON public.group_admins(user_id);
CREATE INDEX idx_group_admins_group_id ON public.group_admins(group_id);

-- 5. Enable RLS on new tables
ALTER TABLE public.workspace_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_admins ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for workspace_groups
-- Main admins can do everything
CREATE POLICY "Admins can manage all groups"
  ON public.workspace_groups FOR ALL
  USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true OR role = 'admin')
  );

-- Group admins can view their assigned groups
CREATE POLICY "Group admins can view their groups"
  ON public.workspace_groups FOR SELECT
  USING (
    id IN (SELECT group_id FROM public.group_admins WHERE user_id = auth.uid())
  );

-- Workspace members can view groups that contain their workspaces
CREATE POLICY "Members can view groups of their workspaces"
  ON public.workspace_groups FOR SELECT
  USING (
    id IN (
      SELECT w.group_id FROM public.workspaces w
      JOIN public.workspace_members wm ON wm.workspace_id = w.id
      WHERE wm.user_id = auth.uid() AND w.group_id IS NOT NULL
    )
  );

-- 7. RLS Policies for group_admins
-- Main admins can manage all group admin assignments
CREATE POLICY "Admins can manage all group admin assignments"
  ON public.group_admins FOR ALL
  USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true OR role = 'admin')
  );

-- Group admins can view their own assignments
CREATE POLICY "Group admins can view own assignments"
  ON public.group_admins FOR SELECT
  USING (user_id = auth.uid());

-- 8. Data migration: Create "General" group and move all existing workspaces into it
DO $$
DECLARE
  general_group_id uuid;
  admin_user_id uuid;
BEGIN
  -- Find the first admin user to set as creator
  SELECT id INTO admin_user_id FROM public.profiles WHERE is_admin = true OR role = 'admin' LIMIT 1;
  
  -- Create the General group
  INSERT INTO public.workspace_groups (name, created_by)
  VALUES ('General', admin_user_id)
  RETURNING id INTO general_group_id;
  
  -- Move all existing workspaces into the General group
  UPDATE public.workspaces SET group_id = general_group_id WHERE group_id IS NULL;
END $$;

-- 9. Enable Realtime for workspace_groups
ALTER PUBLICATION supabase_realtime ADD TABLE public.workspace_groups;
