-- ============================================================
-- Migration: Add user_role, sync existing group admins, and update RLS
-- Date: 2026-04-15
-- Description: Add a separate user_role field for group admin users,
--              keep legacy role for founder/admin, and allow group admins
--              to access workspaces/pages/blocks in their assigned groups.
-- ============================================================

-- Rename the legacy mentor enum value to group_admin if it exists.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'user_role' AND e.enumlabel = 'mentor'
  ) THEN
    ALTER TYPE public.user_role RENAME VALUE 'mentor' TO 'group_admin';
  END IF;
END;
$$;

-- Add the new column if it does not yet exist.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS user_role text NOT NULL DEFAULT 'user';

-- Populate existing group admins.
UPDATE public.profiles
SET user_role = 'group_admin'
WHERE id IN (SELECT user_id FROM public.group_admins);

-- Ensure other users are defaulted to user if missing.
UPDATE public.profiles
SET user_role = 'user'
WHERE user_role IS NULL;

-- Create or update trigger to set user_role when a user becomes a group admin.
DROP TRIGGER IF EXISTS trg_group_admin_insert ON public.group_admins;
DROP FUNCTION IF EXISTS set_user_as_group_admin();

CREATE OR REPLACE FUNCTION set_user_as_group_admin()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET user_role = 'group_admin'
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_group_admin_insert
AFTER INSERT ON public.group_admins
FOR EACH ROW EXECUTE FUNCTION set_user_as_group_admin();

-- Trigger to clear group_admin status when no more group assignments exist.
DROP TRIGGER IF EXISTS trg_group_admin_delete ON public.group_admins;
DROP FUNCTION IF EXISTS remove_group_admin_role();

CREATE OR REPLACE FUNCTION remove_group_admin_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.group_admins
    WHERE user_id = OLD.user_id
  ) THEN
    UPDATE public.profiles
    SET user_role = 'user'
    WHERE id = OLD.user_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_group_admin_delete
AFTER DELETE ON public.group_admins
FOR EACH ROW EXECUTE FUNCTION remove_group_admin_role();

-- ============================================================
-- Row Level Security policies for group admin access
-- ============================================================

-- Workspaces: allow group admins to view workspaces inside groups they administer.
DROP POLICY IF EXISTS "Group admins can view their group workspaces" ON public.workspaces;
CREATE POLICY "Group admins can view their group workspaces"
  ON public.workspaces FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM public.group_admins WHERE user_id = auth.uid()
    )
  );

-- Pages: allow group admins to view pages in group workspaces.
DROP POLICY IF EXISTS "Group admins can view pages in group workspaces" ON public.pages;
CREATE POLICY "Group admins can view pages in group workspaces"
  ON public.pages FOR SELECT
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces
      WHERE group_id IN (
        SELECT group_id FROM public.group_admins WHERE user_id = auth.uid()
      )
    )
  );

-- Blocks: allow group admins to access blocks in pages inside their group workspaces.
DROP POLICY IF EXISTS "Group admins can access blocks in group workspaces" ON public.blocks;
CREATE POLICY "Group admins can access blocks in group workspaces"
  ON public.blocks FOR SELECT
  USING (
    page_id IN (
      SELECT id FROM public.pages
      WHERE workspace_id IN (
        SELECT id FROM public.workspaces
        WHERE group_id IN (
          SELECT group_id FROM public.group_admins WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Workspace members: allow group admins to view members of workspaces in their groups.
DROP POLICY IF EXISTS "Group admins can view members of their group workspaces" ON public.workspace_members;
CREATE POLICY "Group admins can view members of their group workspaces"
  ON public.workspace_members FOR SELECT
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces
      WHERE group_id IN (
        SELECT group_id FROM public.group_admins WHERE user_id = auth.uid()
      )
    )
  );
