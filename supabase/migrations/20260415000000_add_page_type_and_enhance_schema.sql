-- ============================================================
-- Migration: Add Missing Columns to Pages Table
-- File: 20260415000000_add_page_type_and_enhance_schema.sql
-- Description: Adds type and is_trash columns to pages table
-- ============================================================

-- Add type column (document or board)
ALTER TABLE public.pages
ADD COLUMN IF NOT EXISTS type text DEFAULT 'document' NOT NULL;

-- Add is_trash column for soft delete
ALTER TABLE public.pages
ADD COLUMN IF NOT EXISTS is_trash boolean DEFAULT false NOT NULL;

-- Create index for trash queries (performance optimization)
CREATE INDEX IF NOT EXISTS idx_pages_is_trash ON public.pages(is_trash);

-- Combine with workspace_id for common queries
CREATE INDEX IF NOT EXISTS idx_pages_workspace_is_trash ON public.pages(workspace_id, is_trash);
