-- ============================================================
-- MIGRATION: Group Admin Invitation Support
-- Date: 2026-04-14
-- Description: Adds invite_type and group_ids columns to
--              invitations table. Makes workspace_id nullable
--              for group admin invites.
-- ============================================================

-- Add invite_type column: 'workspace_member' (default) or 'group_admin'
ALTER TABLE public.invitations
  ADD COLUMN invite_type text NOT NULL DEFAULT 'workspace_member';

-- Add group_ids column: array of group UUIDs for group admin invites
ALTER TABLE public.invitations
  ADD COLUMN group_ids uuid[] DEFAULT '{}';

-- Make workspace_id nullable (group admin invites don't need a workspace)
ALTER TABLE public.invitations
  ALTER COLUMN workspace_id DROP NOT NULL;
