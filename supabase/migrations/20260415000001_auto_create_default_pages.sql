-- ============================================================
-- Migration: Auto-Create Default Pages on Workspace Insert
-- File: 20260415000001_auto_create_default_pages.sql
-- Description: Creates trigger to automatically create 2 default pages for every new workspace
-- ============================================================

-- Create function to auto-create default pages
CREATE OR REPLACE FUNCTION public.create_default_pages()
RETURNS TRIGGER AS $$
BEGIN
  -- Create "Getting Started" page
  INSERT INTO public.pages (workspace_id, title, type, is_trash)
  VALUES (NEW.id, 'Getting Started', 'document', false);
  
  -- Create "To-Do List" page
  INSERT INTO public.pages (workspace_id, title, type, is_trash)
  VALUES (NEW.id, 'To-Do List', 'board', false);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists (avoid conflicts)
DROP TRIGGER IF EXISTS tr_create_default_pages ON public.workspaces;

-- Create trigger that fires AFTER a new workspace is inserted
CREATE TRIGGER tr_create_default_pages
AFTER INSERT ON public.workspaces
FOR EACH ROW
EXECUTE FUNCTION public.create_default_pages();

-- ============================================================
-- Verification
-- ============================================================

-- Verify function exists
SELECT 'FUNCTION_VERIFICATION' as check,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name = 'create_default_pages';

-- Verify trigger exists
SELECT 'TRIGGER_VERIFICATION' as check,
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public' AND trigger_name = 'tr_create_default_pages';
