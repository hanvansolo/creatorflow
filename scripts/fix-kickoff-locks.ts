/**
 * One-off: matches inserted with social_posted=false that already have a
 * Facebook kickoff post id were never flipped to true due to a bug in
 * live-sync's new-match path (now fixed). Left alone, the next cron run
 * would re-post them. Flip social_posted=true for any match where FB
 * clearly already posted.
 */
import postgres from 'postgres';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) { console.error('set DATABASE_URL'); process.exit(1); }
  const sql = postgres(url, { prepare: false });
  try {
    const before = await sql<{ c: number }[]>`
      SELECT COUNT(*)::int AS c FROM matches
      WHERE social_posted = FALSE AND fb_kickoff_post_id IS NOT NULL
    `;
    console.log(`Matches stuck with social_posted=false but fb_kickoff_post_id set: ${before[0].c}`);

    if (before[0].c === 0) {
      console.log('Nothing to fix.');
      return;
    }

    const fixed = await sql<{ id: string; slug: string }[]>`
      UPDATE matches SET social_posted = TRUE
      WHERE social_posted = FALSE AND fb_kickoff_post_id IS NOT NULL
      RETURNING id, slug
    `;
    console.log(`Fixed ${fixed.length} rows:`);
    for (const r of fixed.slice(0, 20)) console.log(`  ${r.slug} (${r.id})`);
    if (fixed.length > 20) console.log(`  … and ${fixed.length - 20} more`);
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error('FAILED:', e instanceof Error ? e.message : e);
  process.exit(1);
});
