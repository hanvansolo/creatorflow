import postgres from 'postgres';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) { console.error('DATABASE_URL not set'); process.exit(1); }
  const sql = postgres(url, { prepare: false });

  const rows = await sql`
    SELECT key, value FROM site_settings
    WHERE key LIKE 'script_%' OR key LIKE '%adsense%' OR key LIKE '%ads%'
    ORDER BY key
  `;
  for (const r of rows) {
    console.log('===', r.key, '===');
    console.log(r.value || '(empty)');
    console.log();
  }
  if (rows.length === 0) console.log('(no matching site_settings rows)');
  await sql.end();
}

main().catch(e => { console.error(e); process.exit(1); });
