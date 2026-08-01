-- ============================================================
-- MIGRATION: RLS Enforcement (Phase 6)
-- Date: 2026-04-14
-- Description: Hardens Row Level Security (RLS) across all core
--              tables (workspace_groups, group_admins, workspaces)
--              Removes invalid `is_admin = true` checks and adds
--              comprehensive access coverage for Group Admins.
-- ============================================================

-- 1. CLEANUP OLD / INVALID POLICIES
DROP POLICY IF EXISTS "Admins can manage all groups" ON public.workspace_groups;
DROP POLICY IF EXISTS "Group admins can view their groups" ON public.workspace_groups;
DROP POLICY IF EXISTS "Members can view groups of their workspaces" ON public.workspace_groups;

DROP POLICY IF EXISTS "Admins can manage all group admin assignments" ON public.group_admins;
DROP POLICY IF EXISTS "Group admins can view own assignments" ON public.group_admins;

DROP POLICY IF EXISTS "Users can view workspaces they are members of" ON public.workspaces;
DROP POLICY IF EXISTS "Users can insert workspaces" ON public.workspaces;

DROP POLICY IF EXISTS "Users can view members of their workspaces" ON public.workspace_members;

-- ============================================================
-- 2. WORKSPACE_GROUPS POLICIES
-- ============================================================
CREATE POLICY "Admins can manage all groups"
  ON public.workspace_groups FOR ALL
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

CREATE POLICY "Group admins can view their groups"
  ON public.workspace_groups FOR SELECT
  USING (id IN (SELECT group_id FROM public.group_admins WHERE user_id = auth.uid()));

CREATE POLICY "Members can view groups of their workspaces"
  ON public.workspace_groups FOR SELECT
  USING (id IN (
    SELECT w.group_id FROM public.workspaces w
    JOIN public.workspace_members wm ON wm.workspace_id = w.id
    WHERE wm.user_id = auth.uid() AND w.group_id IS NOT NULL
  ));

-- ============================================================
-- 3. GROUP_ADMINS POLICIES
-- ============================================================
CREATE POLICY "Admins can manage all group admin assignments"
  ON public.group_admins FOR ALL
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

CREATE POLICY "Group admins can view own assignments"
  ON public.group_admins FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================
-- 4. WORKSPACES POLICIES
-- ============================================================
CREATE POLICY "Users can view accessible workspaces"
  ON public.workspaces FOR SELECT
  USING (
    owner_id = auth.uid() OR
    id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()) OR
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin') OR
    group_id IN (SELECT group_id FROM public.group_admins WHERE user_id = auth.uid())
  );

CREATE POLICY "Authorized users can insert workspaces"
  ON public.workspaces FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin') OR
    (group_id IS NOT NULL AND group_id IN (SELECT group_id FROM public.group_admins WHERE user_id = auth.uid())) OR
    auth.uid() = owner_id
  );

CREATE POLICY "Authorized users can update workspaces"
  ON public.workspaces FOR UPDATE
  USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin') OR
    (group_id IS NOT NULL AND group_id IN (SELECT group_id FROM public.group_admins WHERE user_id = auth.uid())) OR
    auth.uid() = owner_id
  );

CREATE POLICY "Authorized users can delete workspaces"
  ON public.workspaces FOR DELETE
  USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin') OR
    (group_id IS NOT NULL AND group_id IN (SELECT group_id FROM public.group_admins WHERE user_id = auth.uid())) OR
    auth.uid() = owner_id
  );

-- ============================================================
-- 5. WORKSPACE_MEMBERS POLICIES
-- ============================================================
CREATE POLICY "Users can view members of their workspaces"
  ON public.workspace_members FOR SELECT
  USING (
    workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid()) OR
    workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()) OR
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin') OR
    workspace_id IN (
      SELECT w.id FROM public.workspaces w 
      JOIN public.group_admins ga ON ga.group_id = w.group_id 
      WHERE ga.user_id = auth.uid()
    )
  );
