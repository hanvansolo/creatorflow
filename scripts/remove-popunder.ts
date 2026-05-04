/**
 * Strip the Profitable CPM Rate Network popunder script from
 * site_settings.script_head. AdSense policy explicitly forbids
 * serving Google ads alongside pop-under / redirect networks; leaving
 * this in place puts the AdSense account at risk of suspension.
 *
 * Idempotent — bails if no matching script is found.
 */

import postgres from 'postgres';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) { console.error('DATABASE_URL not set'); process.exit(1); }
  const sql = postgres(url, { prepare: false });

  const [row] = await sql`SELECT value FROM site_settings WHERE key = 'script_head' LIMIT 1`;
  const current = (row?.value as string) || '';

  if (!current.includes('profitablecpmratenetwork.com')) {
    console.log('No popunder script found in script_head — no change.');
    await sql.end();
    return;
  }

  // Strip the <script> tag and the matching <div id="container-..."> sibling.
  const next = current
    .replace(/<script[^>]*profitablecpmratenetwork\.com[^>]*><\/script>\s*/gi, '')
    .replace(/<div\s+id="container-[a-f0-9]+"[^>]*>\s*<\/div>\s*/gi, '')
    // Collapse any double-blank-lines we created.
    .replace(/\n{3,}/g, '\n\n');

  await sql`UPDATE site_settings SET value = ${next}, updated_at = NOW() WHERE key = 'script_head'`;
  console.log('Removed popunder. New length:', next.length, '(was', current.length, ')');
  await sql.end();
}

main().catch(e => { console.error(e); process.exit(1); });
