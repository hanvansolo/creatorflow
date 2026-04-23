import { config } from 'dotenv';
config({ path: '.env.local' });

import postgres from 'postgres';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }
  const sqlPath = resolve(__dirname, '..', 'drizzle', '0010_article_sources.sql');
  const raw = readFileSync(sqlPath, 'utf8');
  const statements = raw
    .split('--> statement-breakpoint')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => !s.split('\n').every((l) => l.trim().startsWith('--')));

  console.log(`Applying ${statements.length} statement(s) from 0010_article_sources.sql`);
  const sql = postgres(url, { prepare: false });
  try {
    for (const stmt of statements) {
      const preview = stmt.slice(0, 100).replace(/\s+/g, ' ');
      console.log(`  → ${preview}${stmt.length > 100 ? '…' : ''}`);
      await sql.unsafe(stmt);
    }
    console.log('Done.');
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error('FAILED:', err instanceof Error ? err.message : err);
  process.exit(1);
});
