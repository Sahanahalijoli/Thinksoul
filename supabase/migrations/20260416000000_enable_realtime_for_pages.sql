-- ============================================================
-- MIGRATION: Realtime for workspaces, pages, and page blocks
-- Date: 2026-04-16
-- Description: Publishes workspaces/pages/blocks for narrow
--              client subscriptions and ensures deletes include
--              enough row data for filtered realtime payloads.
-- ============================================================

ALTER TABLE public.workspaces REPLICA IDENTITY FULL;
ALTER TABLE public.pages REPLICA IDENTITY FULL;
ALTER TABLE public.blocks REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'workspaces'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.workspaces';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'pages'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.pages';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'blocks'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.blocks';
  END IF;
END $$;
