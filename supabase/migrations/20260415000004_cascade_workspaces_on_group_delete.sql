-- ============================================================
-- MIGRATION: Cascade workspaces when deleting workspace groups
-- Date: 2026-04-15
-- Description: Makes workspace_groups deletion delete child
--              workspaces instead of preserving them with a
--              NULL group_id. Workspace child tables already
--              cascade from workspaces.
-- ============================================================

ALTER TABLE public.workspaces
  DROP CONSTRAINT IF EXISTS workspaces_group_id_fkey;

ALTER TABLE public.workspaces
  ADD CONSTRAINT workspaces_group_id_fkey
  FOREIGN KEY (group_id)
  REFERENCES public.workspace_groups(id)
  ON DELETE CASCADE;
