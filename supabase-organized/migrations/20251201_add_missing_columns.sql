-- Add stutter_count column to feedback table
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS stutter_count INTEGER DEFAULT 0;

-- Add structure_score column to feedback table (for CoLA)
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS structure_score INTEGER DEFAULT 0;
