/**
 * One-off cleanup: null out logo_url for clubs (and headshot_url for players)
 * whose image is the API-Football "no logo" placeholder (exactly
 * API_FOOTBALL_PLACEHOLDER_SIZE bytes). Once nulled, the OG image renderer
 * and site components fall back to team-initials rendering which looks far
 * better than a "camera" stock placeholder.
 *
 * Safe to re-run — only nulls rows that currently match the placeholder size.
 */
import postgres from 'postgres';
import {
  API_FOOTBALL_PLACEHOLDER_SIZE,
  getLogoSize,
  isApiFootballUrl,
} from '../src/lib/utils/api-football-logo';

const BATCH_SIZE = 25; // concurrent range-GETs per batch

async function checkBatch(
  rows: Array<{ id: string; name: string; url: string }>,
): Promise<Array<{ id: string; name: string; action: 'null' | 'keep' | 'skip' }>> {
  return Promise.all(
    rows.map(async (r) => {
      if (!isApiFootballUrl(r.url)) return { id: r.id, name: r.name, action: 'skip' as const };
      const size = await getLogoSize(r.url);
      if (size === API_FOOTBALL_PLACEHOLDER_SIZE) return { id: r.id, name: r.name, action: 'null' as const };
      return { id: r.id, name: r.name, action: 'keep' as const };
    }),
  );
}

async function cleanClubs(sql: ReturnType<typeof postgres>) {
  console.log('\n=== clubs ===');
  const rows = await sql<{ id: string; name: string; url: string }[]>`
    SELECT id, name, logo_url AS url FROM clubs WHERE logo_url IS NOT NULL
  `;
  console.log(`Checking ${rows.length} clubs…`);

  const toNull: string[] = [];
  let kept = 0;
  let skipped = 0;
  let checked = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const results = await checkBatch(rows.slice(i, i + BATCH_SIZE));
    for (const r of results) {
      checked++;
      if (r.action === 'null') toNull.push(r.id);
      else if (r.action === 'keep') kept++;
      else skipped++;
    }
    if (checked % 500 === 0 || checked === rows.length) {
      console.log(`  progress: ${checked}/${rows.length}  (will null ${toNull.length}, kept ${kept}, skipped ${skipped})`);
    }
  }

  for (let i = 0; i < toNull.length; i += 500) {
    const chunk = toNull.slice(i, i + 500);
    await sql`UPDATE clubs SET logo_url = NULL WHERE id IN ${sql(chunk)}`;
  }
  console.log(`  → nulled ${toNull.length} placeholder club logos`);
}

async function cleanPlayers(sql: ReturnType<typeof postgres>) {
  console.log('\n=== players ===');
  const rows = await sql<{ id: string; name: string; url: string }[]>`
    SELECT id, COALESCE(known_as, last_name, first_name) AS name, headshot_url AS url
    FROM players WHERE headshot_url IS NOT NULL
  `;
  console.log(`Checking ${rows.length} players…`);

  const toNull: string[] = [];
  let kept = 0;
  let skipped = 0;
  let checked = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const results = await checkBatch(rows.slice(i, i + BATCH_SIZE));
    for (const r of results) {
      checked++;
      if (r.action === 'null') toNull.push(r.id);
      else if (r.action === 'keep') kept++;
      else skipped++;
    }
    if (checked % 1000 === 0 || checked === rows.length) {
      console.log(`  progress: ${checked}/${rows.length}  (will null ${toNull.length}, kept ${kept}, skipped ${skipped})`);
    }
  }

  for (let i = 0; i < toNull.length; i += 500) {
    const chunk = toNull.slice(i, i + 500);
    await sql`UPDATE players SET headshot_url = NULL WHERE id IN ${sql(chunk)}`;
  }
  console.log(`  → nulled ${toNull.length} placeholder player headshots`);
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('set DATABASE_URL');
    process.exit(1);
  }
  console.log(`Placeholder size threshold: ${API_FOOTBALL_PLACEHOLDER_SIZE} bytes`);

  const sql = postgres(url, { prepare: false });
  try {
    await cleanClubs(sql);
    await cleanPlayers(sql);
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error('FAILED:', e instanceof Error ? e.message : e);
  process.exit(1);
});
