ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS secondary_data_cache JSONB,
  ADD COLUMN IF NOT EXISTS secondary_data_fetched_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS secondary_data_status VARCHAR(20);

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_matches_secondary_cache_fetched
  ON matches (secondary_data_fetched_at)
  WHERE secondary_data_fetched_at IS NOT NULL;
