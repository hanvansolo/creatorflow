-- Translation cache table — AI-translated strings per content field per locale.
CREATE TABLE IF NOT EXISTS translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type VARCHAR(50) NOT NULL,
  content_id VARCHAR(100) NOT NULL,
  locale VARCHAR(10) NOT NULL,
  field VARCHAR(50) NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS translations_unique_idx
  ON translations (content_type, content_id, locale, field);

CREATE INDEX IF NOT EXISTS translations_lookup_idx
  ON translations (content_type, content_id, locale);
