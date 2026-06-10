import postgres from 'postgres';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) { console.error('DATABASE_URL not set'); process.exit(1); }
  const sql = postgres(url, { prepare: false });

  const subs = await sql`
    SELECT COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE status = 'active')::int AS active,
           MIN(subscribed_at) AS earliest,
           MAX(subscribed_at) AS latest
    FROM newsletter_subscribers
  `;
  console.log('Subscribers:', subs[0]);

  const recent = await sql`
    SELECT email, status, timezone, subscribed_at
    FROM newsletter_subscribers
    ORDER BY subscribed_at DESC
    LIMIT 5
  `;
  console.log('\nMost recent:');
  for (const r of recent) console.log(' ', r.email, '·', r.status, '·', r.timezone, '·', r.created_at);

  const cron = await sql`
    SELECT job_name, enabled, last_run_at, last_status, last_result
    FROM cron_settings
    WHERE job_name LIKE 'email%'
    ORDER BY job_name
  `;
  console.log('\nEmail cron status:');
  for (const r of cron) {
    const ageM = r.last_run_at ? Math.round((Date.now() - new Date(r.last_run_at as any).getTime()) / 60000) : null;
    console.log(`  ${r.job_name}: enabled=${r.enabled} last_status=${r.last_status} ` +
      (ageM != null ? `(${ageM}m ago)` : '(never run)'));
    console.log(`    result: ${JSON.stringify(r.last_result)}`);
  }

  await sql.end();
}

main().catch(e => { console.error(e); process.exit(1); });
