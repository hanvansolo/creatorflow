-- Add match_report_generated flag to matches table
ALTER TABLE matches ADD COLUMN IF NOT EXISTS match_report_generated BOOLEAN DEFAULT FALSE;
