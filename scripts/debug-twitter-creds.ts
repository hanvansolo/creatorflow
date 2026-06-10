import postgres from 'postgres';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) { console.error('DATABASE_URL not set'); process.exit(1); }
  const sql = postgres(url, { prepare: false });

  const r = await sql`
    SELECT key, LENGTH(value)::int AS len, updated_at
    FROM site_settings
    WHERE key LIKE '%twitter%' OR key LIKE '%x_%'
    ORDER BY key
  `;
  console.log('Twitter-related site_settings rows:');
  for (const row of r) console.log(' ', row);
  if (r.length === 0) console.log('  (none — no DB-stored refresh token)');

  await sql.end();
}

main().catch(e => { console.error(e); process.exit(1); });
