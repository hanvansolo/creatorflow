import postgres from 'postgres';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) { console.error('DATABASE_URL not set'); process.exit(1); }
  const sql = postgres(url, { prepare: false });

  const rows = await sql`
    SELECT job_name, enabled, last_run_at, last_status, last_result, interval_ms
    FROM cron_settings
    WHERE job_name = 'live-sync'
  `;
  console.log('live-sync cron status:');
  for (const r of rows) {
    const ageM = r.last_run_at ? Math.round((Date.now() - new Date(r.last_run_at as any).getTime()) / 60000) : null;
    console.log('  enabled:', r.enabled);
    console.log('  interval:', r.interval_ms, 'ms');
    console.log('  last_run_at:', r.last_run_at, ageM != null ? `(${ageM} min ago)` : '');
    console.log('  last_status:', r.last_status);
    console.log('  last_result:', JSON.stringify(r.last_result, null, 2));
  }

  // Show last few cron runs across all jobs to see if anything is alive
  console.log('\nAll crons — last run:');
  const all = await sql`
    SELECT job_name, last_run_at, last_status
    FROM cron_settings
    ORDER BY last_run_at DESC NULLS LAST
    LIMIT 10
  `;
  for (const r of all) {
    const ageM = r.last_run_at ? Math.round((Date.now() - new Date(r.last_run_at as any).getTime()) / 60000) : null;
    console.log(`  ${r.job_name}: ${r.last_status} ${ageM != null ? `${ageM}m ago` : 'never'}`);
  }

  await sql.end();
}

main().catch(e => { console.error('FAIL:', e); process.exit(1); });
