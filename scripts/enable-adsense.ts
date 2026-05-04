/**
 * Inject the AdSense loader script into site_settings.script_head so
 * AdSense (Auto Ads + manual <ins> slots) can render. Idempotent — bails
 * out if the loader is already present.
 */

import postgres from 'postgres';

const PUB_ID = 'ca-pub-8717247095472771';
const LOADER_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${PUB_ID}`;
const LOADER_SCRIPT =
  `<script async src="${LOADER_SRC}" crossorigin="anonymous"></script>`;

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) { console.error('DATABASE_URL not set'); process.exit(1); }
  const sql = postgres(url, { prepare: false });

  const [row] = await sql`SELECT value FROM site_settings WHERE key = 'script_head' LIMIT 1`;
  const current = (row?.value as string) || '';

  if (current.includes('adsbygoogle.js') && current.includes(PUB_ID)) {
    console.log('AdSense loader already present in script_head — no change.');
    await sql.end();
    return;
  }

  // Prepend so AdSense loads early (helps Auto Ads page-level placements).
  const next = `<!-- Google AdSense -->\n${LOADER_SCRIPT}\n<meta name="google-adsense-account" content="${PUB_ID}">\n\n${current}`;

  await sql`
    INSERT INTO site_settings (key, value, updated_at)
    VALUES ('script_head', ${next}, NOW())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
  `;
  console.log('AdSense loader injected into script_head.');
  console.log('First 300 chars of new value:\n');
  console.log(next.slice(0, 300));
  await sql.end();
}

main().catch(e => { console.error(e); process.exit(1); });
