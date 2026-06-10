import postgres from 'postgres';

const matchId = process.argv[2] || 'dd32a8a8-6db5-4025-9dec-09052f14888e';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) { console.error('DATABASE_URL not set'); process.exit(1); }
  const sql = postgres(url, { prepare: false });

  const matchRows = await sql`
    SELECT m.id, m.slug, m.status, m.minute, m.home_score, m.away_score,
           m.social_posted, m.fb_kickoff_post_id, m.updated_at,
           hc.name AS home, ac.name AS away,
           comp.name AS competition
    FROM matches m
    JOIN clubs hc ON m.home_club_id = hc.id
    JOIN clubs ac ON m.away_club_id = ac.id
    LEFT JOIN competition_seasons cs ON m.competition_season_id = cs.id
    LEFT JOIN competitions comp ON cs.competition_id = comp.id
    WHERE m.id = ${matchId}::uuid
  `;
  console.log('Match state:');
  for (const r of matchRows) {
    console.log(`  ${r.home} vs ${r.away}  [${r.competition}]`);
    console.log(`  ${r.home_score}-${r.away_score} at ${r.minute}'  status=${r.status}`);
    console.log(`  social_posted=${r.social_posted}`);
    console.log(`  fb_kickoff_post_id=${r.fb_kickoff_post_id ?? '(null)'}`);
    const updatedAge = Math.round((Date.now() - new Date(r.updated_at as any).getTime()) / 1000);
    console.log(`  updated_at=${updatedAge}s ago`);
  }

  const cronRows = await sql`
    SELECT last_run_at, last_status, last_result
    FROM cron_settings
    WHERE job_name = 'live-sync'
  `;
  console.log('\nLive-sync cron:');
  for (const r of cronRows) {
    const runAge = r.last_run_at ? Math.round((Date.now() - new Date(r.last_run_at as any).getTime()) / 1000) : null;
    console.log(`  last_run_at=${runAge != null ? `${runAge}s ago` : 'never'}`);
    console.log(`  last_status=${r.last_status}`);
    console.log(`  last_result=${JSON.stringify(r.last_result)}`);
  }

  await sql.end();
}

main().catch(e => { console.error(e); process.exit(1); });
