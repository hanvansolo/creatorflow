import { SITE_CONFIG } from '@/lib/seo';

export const dynamic = 'force-dynamic';

/**
 * Sitemap index wrapper.
 *
 * `app/sitemap.ts` uses `generateSitemaps()` to split the sitemap into chunks
 * which Next.js serves at /sitemap/0.xml, /sitemap/1.xml, etc. But Next.js
 * 16 does NOT auto-generate the top-level sitemap index at /sitemap.xml,
 * so crawlers (and our own robots.txt) hit 404 on the canonical URL.
 *
 * This route handler emits the <sitemapindex> that points at each chunk.
 * Keep the chunk list in sync with `generateSitemaps()` in sitemap.ts.
 */
const CHUNK_IDS = [0, 1, 2, 3, 4];

export async function GET() {
  const now = new Date().toISOString();
  const entries = CHUNK_IDS
    .map(
      (id) => `  <sitemap>
    <loc>${SITE_CONFIG.url}/sitemap/${id}.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`,
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>
`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600, must-revalidate',
    },
  });
}
