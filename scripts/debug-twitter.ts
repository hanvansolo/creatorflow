import postgres from 'postgres';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) { console.error('DATABASE_URL not set'); process.exit(1); }
  const sql = postgres(url, { prepare: false });

  const last24h = await sql`
    SELECT content_type, status, error, posted_at, post_text
    FROM social_posts
    WHERE platform = 'twitter'
      AND posted_at > NOW() - INTERVAL '24 hours'
    ORDER BY posted_at DESC
    LIMIT 20
  `;
  console.log(`Twitter posts in last 24h: ${last24h.length}`);
  for (const r of last24h) {
    const ageM = Math.round((Date.now() - new Date(r.posted_at as any).getTime()) / 60000);
    const preview = (r.post_text as string).replace(/\n/g, ' ').slice(0, 80);
    console.log(`  ${ageM}m ago | ${r.status} | ${r.content_type} | ${preview}…`);
    if (r.status === 'failed') console.log(`    ↳ error: ${r.error}`);
  }

  // Cron status
  const cron = await sql`
    SELECT last_run_at, last_status, last_result
    FROM cron_settings
    WHERE job_name = 'live-sync'
  `;
  console.log('\nlive-sync last run:');
  for (const r of cron) {
    const ageM = r.last_run_at ? Math.round((Date.now() - new Date(r.last_run_at as any).getTime()) / 60000) : null;
    console.log(`  ${ageM}m ago | status=${r.last_status}`);
    console.log(`  result: ${JSON.stringify(r.last_result)}`);
  }

  await sql.end();
}

main().catch(e => { console.error(e); process.exit(1); });
