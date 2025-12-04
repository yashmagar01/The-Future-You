-- Migration: Allow 'uploaded' status in recordings table
-- Created: 2025-12-04

-- Drop the existing constraint
ALTER TABLE public.recordings DROP CONSTRAINT IF EXISTS recordings_status_check;

-- Add the new constraint including 'uploaded'
ALTER TABLE public.recordings 
ADD CONSTRAINT recordings_status_check 
CHECK (status IN ('uploaded', 'processing', 'completed', 'failed'));

-- Add comment explaining the statuses
COMMENT ON COLUMN public.recordings.status IS 'Status: uploaded (waiting for worker), processing (active), completed (done), failed (error)';
