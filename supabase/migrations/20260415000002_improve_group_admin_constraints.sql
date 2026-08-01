-- ============================================================
-- Migration: Improve Group Admin Assignment with Better Constraints
-- File: 20260415000002_improve_group_admin_constraints.sql
-- Description: Adds NOT NULL constraint to group_admins to ensure data integrity
-- ============================================================

-- Ensure group_admins have NOT NULL constraints
ALTER TABLE public.group_admins
ALTER COLUMN group_id SET NOT NULL,
ALTER COLUMN user_id SET NOT NULL;

-- Add check constraint to ensure valid UUIDs
ALTER TABLE public.group_admins
ADD CONSTRAINT check_valid_group_id CHECK (group_id IS NOT NULL),
ADD CONSTRAINT check_valid_user_id CHECK (user_id IS NOT NULL);

-- Create indices for fast lookups
CREATE INDEX IF NOT EXISTS idx_group_admins_user_id ON public.group_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_group_admins_group_id ON public.group_admins(group_id);

-- ============================================================
-- Verification
-- ============================================================

SELECT 'GROUP_ADMIN_TABLE_VERIFICATION' as check,
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'group_admins' AND table_schema = 'public'
ORDER BY column_name;
