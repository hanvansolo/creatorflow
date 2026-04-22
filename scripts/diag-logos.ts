import postgres from 'postgres';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) { console.error('set DATABASE_URL'); process.exit(1); }
  const sql = postgres(url, { prepare: false });
  try {
    const wetschen = await sql`SELECT name, slug, logo_url, api_football_id FROM clubs WHERE name ILIKE '%wetschen%' LIMIT 5`;
    console.log('=== Wetschen ===');
    for (const r of wetschen) console.log(r);

    const counts = await sql`SELECT COUNT(*)::int as total, COUNT(logo_url)::int as with_logo, (COUNT(*) - COUNT(logo_url))::int as null_logo FROM clubs`;
    console.log('=== Total counts ===', counts[0]);

    // Look for obvious placeholder URL patterns
    const placeholderLike = await sql`
      SELECT COUNT(*)::int as count, logo_url FROM clubs
      WHERE logo_url ILIKE '%placeholder%' OR logo_url ILIKE '%default%' OR logo_url ILIKE '%image-not-available%' OR logo_url ILIKE '%no-image%'
      GROUP BY logo_url ORDER BY count DESC LIMIT 10`;
    console.log('=== URLs matching placeholder patterns ===');
    for (const r of placeholderLike) console.log(r);

    // Sample 10 logo URLs to understand the format landscape
    const sample = await sql`SELECT name, logo_url FROM clubs WHERE logo_url IS NOT NULL ORDER BY random() LIMIT 10`;
    console.log('=== Sample 10 logo URLs ===');
    for (const r of sample) console.log(r.name, '→', r.logo_url);
  } finally {
    await sql.end();
  }
}
main().catch(e => { console.error(e.message); process.exit(1); });
