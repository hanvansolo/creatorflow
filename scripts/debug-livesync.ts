import postgres from 'postgres';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) { console.error('DATABASE_URL not set'); process.exit(1); }
  const sql = postgres(url, { prepare: false });

  // Test the early-exit query
  const liveStatuses = ['live', 'halftime', 'extra_time', 'penalties'];
  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
  const fiveMinFromNow = new Date(Date.now() + 5 * 60 * 1000);

  let earlyExit: any[] = [];
  try {
    earlyExit = await sql`
      SELECT 1 FROM matches
      WHERE status = ANY(${liveStatuses})
         OR (kickoff BETWEEN ${fourHoursAgo.toISOString()} AND ${fiveMinFromNow.toISOString()})
      LIMIT 1
    `;
    console.log('[OK] early-exit query works. Rows:', earlyExit.length);
  } catch (e: any) {
    console.log('[FAIL] early-exit query crashed:', e.message);
  }

  const liveRows = await sql`
    SELECT m.id, m.status, m.minute, m.home_score, m.away_score, m.kickoff, m.updated_at,
           hc.name AS home, ac.name AS away
    FROM matches m
    JOIN clubs hc ON m.home_club_id = hc.id
    JOIN clubs ac ON m.away_club_id = ac.id
    WHERE m.status IN ('live','halftime','extra_time','penalties')
    ORDER BY m.kickoff DESC
    LIMIT 20
  `;
  console.log('\nCurrently live in DB:');
  for (const r of liveRows) {
    const ageM = Math.round((Date.now() - new Date(r.updated_at as any).getTime()) / 60000);
    console.log(`  ${r.home} vs ${r.away} — status=${r.status} min=${r.minute} score=${r.home_score}-${r.away_score} updated_at=${ageM}m ago`);
  }

  const cw = await sql`
    SELECT m.id, m.status, m.minute, m.home_score, m.away_score, m.kickoff, m.updated_at, m.api_football_id,
           hc.name AS home, ac.name AS away
    FROM matches m
    JOIN clubs hc ON m.home_club_id = hc.id
    JOIN clubs ac ON m.away_club_id = ac.id
    WHERE (hc.name ILIKE '%Coventry%' OR hc.name ILIKE '%Wrexham%')
       AND (ac.name ILIKE '%Coventry%' OR ac.name ILIKE '%Wrexham%')
       AND m.kickoff > NOW() - INTERVAL '6 hours'
  `;
  console.log('\nCoventry vs Wrexham:');
  for (const r of cw) {
    const ageM = Math.round((Date.now() - new Date(r.updated_at as any).getTime()) / 60000);
    console.log(`  ${r.home} vs ${r.away} — status=${r.status} min=${r.minute} score=${r.home_score}-${r.away_score} kickoff=${r.kickoff} updated_at=${ageM}m ago api_id=${r.api_football_id}`);
  }

  await sql.end();
}

main().catch(e => { console.error('FAIL:', e); process.exit(1); });
