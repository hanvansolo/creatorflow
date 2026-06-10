import postgres from 'postgres';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) { console.error('set DATABASE_URL'); process.exit(1); }
  const sql = postgres(url, { prepare: false });
  try {
    const byStatus = await sql`
      SELECT status, COUNT(*)::int AS c, COUNT(fb_kickoff_post_id)::int AS with_fb_id
      FROM matches
      WHERE social_posted = FALSE AND kickoff > NOW() - INTERVAL '12 hours'
      GROUP BY status
    `;
    console.log('Matches with social_posted=false in last 12h:');
    for (const r of byStatus) console.log(' ', r);

    // Also check: are there matches with status=live that have social_posted=true but NO fb id?
    // Could indicate posting happened via other platform only.
    const postedNoFB = await sql`
      SELECT status, COUNT(*)::int AS c
      FROM matches
      WHERE social_posted = TRUE AND fb_kickoff_post_id IS NULL
        AND kickoff > NOW() - INTERVAL '12 hours'
      GROUP BY status
    `;
    console.log('\nMatches posted (social_posted=true) but no FB post id:');
    for (const r of postedNoFB) console.log(' ', r);

    // Sample: matches in last 2h with fb_kickoff_post_id set (was FB actually posted?)
    const sampled = await sql`
      SELECT kickoff, status, social_posted, fb_kickoff_post_id, slug
      FROM matches
      WHERE kickoff > NOW() - INTERVAL '2 hours'
      ORDER BY kickoff DESC LIMIT 10
    `;
    console.log('\nMost recent 10 matches (last 2h):');
    for (const r of sampled) console.log(' ', r);
  } finally {
    await sql.end();
  }
}
main().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
