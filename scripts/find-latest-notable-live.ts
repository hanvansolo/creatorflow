import postgres from 'postgres';

const NOTABLE_COMPS = new Set([
  'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1',
  'Championship', 'Eredivisie', 'Primeira Liga',
  'UEFA Champions League', 'UEFA Europa League', 'UEFA Conference League',
  'FA Cup', 'EFL Cup', 'Copa del Rey', 'Coppa Italia', 'DFB Pokal',
  'Copa Libertadores', 'Copa America', 'World Cup', 'European Championship',
]);
const BIG_CLUBS = new Set([
  'Manchester United', 'Manchester City', 'Liverpool', 'Arsenal',
  'Chelsea', 'Tottenham', 'Real Madrid', 'Barcelona', 'Bayern Munich',
  'Paris Saint Germain', 'Juventus', 'Inter', 'AC Milan', 'Napoli',
  'Borussia Dortmund', 'Atletico Madrid',
]);

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) { console.error('DATABASE_URL not set'); process.exit(1); }
  const sql = postgres(url, { prepare: false });

  const rows = await sql`
    SELECT m.id, m.slug, m.kickoff, m.status, m.minute, m.home_score, m.away_score,
           m.social_posted, m.fb_kickoff_post_id,
           hc.name AS home, hc.logo_url AS home_logo,
           ac.name AS away, ac.logo_url AS away_logo,
           comp.name AS competition
    FROM matches m
    JOIN clubs hc ON m.home_club_id = hc.id
    JOIN clubs ac ON m.away_club_id = ac.id
    LEFT JOIN competition_seasons cs ON m.competition_season_id = cs.id
    LEFT JOIN competitions comp ON cs.competition_id = comp.id
    WHERE m.status IN ('live', 'halftime', 'extra_time', 'penalties')
    ORDER BY m.kickoff DESC
  `;

  console.log(`${rows.length} matches currently live\n`);

  const notable = rows.filter(r =>
    NOTABLE_COMPS.has(r.competition as string)
    || BIG_CLUBS.has(r.home as string)
    || BIG_CLUBS.has(r.away as string)
  );

  console.log(`Notable live matches (${notable.length}):`);
  for (const r of notable.slice(0, 10)) {
    const ageM = Math.round((Date.now() - new Date(r.kickoff as any).getTime()) / 60_000);
    console.log(
      `  ${r.home} vs ${r.away}  ${r.home_score}-${r.away_score}  ${r.minute}'  [${r.competition}]  kickoff ${ageM}m ago  ` +
      `social_posted=${r.social_posted}  fb_id=${r.fb_kickoff_post_id ? 'yes' : 'no'}  id=${r.id}`
    );
  }

  await sql.end();
}

main().catch(e => { console.error(e); process.exit(1); });
