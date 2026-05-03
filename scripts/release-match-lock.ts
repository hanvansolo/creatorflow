import postgres from 'postgres';

const matchId = process.argv[2];
if (!matchId) {
  console.error('Usage: npx tsx scripts/release-match-lock.ts <matchId>');
  process.exit(1);
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) { console.error('DATABASE_URL not set'); process.exit(1); }
  const sql = postgres(url, { prepare: false });

  const result = await sql`
    UPDATE matches
    SET social_posted = FALSE, fb_kickoff_post_id = NULL
    WHERE id = ${matchId}::uuid
    RETURNING id, slug, status, social_posted
  `;
  console.log('Released lock:', result);
  await sql.end();
}

main().catch(e => { console.error(e); process.exit(1); });
