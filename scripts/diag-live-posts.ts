import postgres from 'postgres';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) { console.error('set DATABASE_URL'); process.exit(1); }
  const sql = postgres(url, { prepare: false });
  try {
    // Matches our DB thinks are live / recently live.
    const liveNow = await sql`
      SELECT m.id, m.slug, m.status, m.social_posted, m.fb_kickoff_post_id,
             m.kickoff, m.updated_at,
             hc.name AS home, ac.name AS away,
             comp.name AS competition
      FROM matches m
      LEFT JOIN clubs hc ON m.home_club_id = hc.id
      LEFT JOIN clubs ac ON m.away_club_id = ac.id
      LEFT JOIN competition_seasons cs ON m.competition_season_id = cs.id
      LEFT JOIN competitions comp ON cs.competition_id = comp.id
      WHERE m.status IN ('live', 'halftime', 'extra_time', 'penalties')
      ORDER BY m.kickoff DESC LIMIT 20
    `;
    console.log('=== Matches currently LIVE in our DB ===');
    if (liveNow.length === 0) console.log('  (none)');
    for (const r of liveNow) console.log({
      when: r.kickoff, status: r.status,
      posted: r.social_posted, fb_id: r.fb_kickoff_post_id ? r.fb_kickoff_post_id.slice(0, 20) : 'no',
      comp: r.competition, home: r.home, away: r.away,
      updated_min_ago: r.updated_at ? Math.round((Date.now() - new Date(r.updated_at).getTime()) / 60000) : null,
    });

    // Matches that transitioned to 'live' or 'finished' in the last 3 hours,
    // to see what live-sync actually touched.
    const recentlyTouched = await sql`
      SELECT m.id, m.slug, m.status, m.social_posted, m.fb_kickoff_post_id,
             m.kickoff, m.updated_at,
             comp.name AS competition, hc.name AS home, ac.name AS away
      FROM matches m
      LEFT JOIN clubs hc ON m.home_club_id = hc.id
      LEFT JOIN clubs ac ON m.away_club_id = ac.id
      LEFT JOIN competition_seasons cs ON m.competition_season_id = cs.id
      LEFT JOIN competitions comp ON cs.competition_id = comp.id
      WHERE m.updated_at > NOW() - INTERVAL '3 hours'
        AND m.status IN ('live', 'halftime', 'finished', 'extra_time', 'penalties')
      ORDER BY m.updated_at DESC LIMIT 25
    `;
    console.log('\n=== Matches that live-sync touched in the last 3 hours ===');
    if (recentlyTouched.length === 0) console.log('  (none)');
    for (const r of recentlyTouched) console.log({
      updated_min_ago: Math.round((Date.now() - new Date(r.updated_at).getTime()) / 60000),
      kick_min_ago: Math.round((Date.now() - new Date(r.kickoff).getTime()) / 60000),
      status: r.status, posted: r.social_posted, fb_id: r.fb_kickoff_post_id ? 'YES' : 'no',
      comp: r.competition, m: `${r.home} vs ${r.away}`,
    });

    // Last 5 FB post attempts with errors.
    const fbErrors = await sql`
      SELECT content_type, status, error, posted_at, post_text
      FROM social_posts
      WHERE platform = 'facebook' AND posted_at > NOW() - INTERVAL '3 hours'
      ORDER BY posted_at DESC LIMIT 15
    `;
    console.log('\n=== FB posts (last 3h) with error details ===');
    for (const r of fbErrors) console.log({
      min_ago: Math.round((Date.now() - new Date(r.posted_at).getTime()) / 60000),
      type: r.content_type, status: r.status,
      error: r.error ? r.error.slice(0, 200) : null,
      text: r.post_text ? r.post_text.slice(0, 80) : null,
    });
  } finally {
    await sql.end();
  }
}
main().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
