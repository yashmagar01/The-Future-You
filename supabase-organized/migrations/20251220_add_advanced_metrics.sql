-- Add advanced_metrics JSONB column to feedback table
ALTER TABLE public.feedback 
ADD COLUMN IF NOT EXISTS advanced_metrics JSONB;

-- Add comment for documentation
COMMENT ON COLUMN public.feedback.advanced_metrics IS 
'Phase 2 advanced analytics: {vocal, kinematic, coherence, fusion}';

-- Optional: Add GIN index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_feedback_advanced_metrics 
ON public.feedback USING GIN (advanced_metrics);
