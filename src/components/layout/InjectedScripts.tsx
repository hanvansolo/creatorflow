import { db, siteSettings } from '@/lib/db';
import { eq } from 'drizzle-orm';
import Script from 'next/script';

async function getScript(key: string): Promise<string> {
  try {
    const [setting] = await db
      .select({ value: siteSettings.value })
      .from(siteSettings)
      .where(eq(siteSettings.key, key))
      .limit(1);
    return setting?.value || '';
  } catch {
    // Silently fail if table doesn't exist yet (during initial migration)
    return '';
  }
}

/**
 * Parse script tags from HTML string and extract src and inline content
 */
function parseScriptTags(html: string): Array<{ src?: string; content?: string; attrs: Record<string, string> }> {
  const scripts: Array<{ src?: string; content?: string; attrs: Record<string, string> }> = [];
  // Match script tags with their attributes and content
  const scriptRegex = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = scriptRegex.exec(html)) !== null) {
    const attrsString = match[1];
    const content = match[2].trim();
    const attrs: Record<string, string> = {};

    // Parse attributes
    const attrRegex = /(\w+(?:-\w+)*)(?:="([^"]*)"|='([^']*)'|=([^\s>]+))?/g;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(attrsString)) !== null) {
      const name = attrMatch[1];
      const value = attrMatch[2] || attrMatch[3] || attrMatch[4] || 'true';
      attrs[name] = value;
    }

    scripts.push({
      src: attrs.src,
      content: content || undefined,
      attrs,
    });
  }

  return scripts;
}

/**
 * Extract all data-* attributes from an attrs object
 */
function getDataAttributes(attrs: Record<string, string>): Record<string, string> {
  const dataAttrs: Record<string, string> = {};
  for (const [key, value] of Object.entries(attrs)) {
    if (key.startsWith('data-')) {
      dataAttrs[key] = value;
    }
  }
  return dataAttrs;
}

/**
 * Scripts to inject in <head>
 * Use: Analytics, Meta Pixel, Tag Manager, etc.
 */
export async function HeadScripts() {
  const html = await getScript('script_head');
  if (!html) return null;

  const scripts = parseScriptTags(html);

  return (
    <>
      {scripts.map((script, i) => {
        if (script.src) {
          // External script - pass through all data-* attributes
          const dataAttrs = getDataAttributes(script.attrs);
          return (
            <Script
              key={`head-script-${i}`}
              src={script.src}
              strategy="afterInteractive"
              {...dataAttrs}
            />
          );
        } else if (script.content) {
          // Inline script
          return (
            <Script
              key={`head-script-${i}`}
              id={`injected-head-${i}`}
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{ __html: script.content }}
            />
          );
        }
        return null;
      })}
    </>
  );
}

/**
 * Scripts to inject at start of <body>
 * Use: GTM noscript, critical embeds
 */
export async function BodyStartScripts() {
  const html = await getScript('script_body_start');
  if (!html) return null;

  // For noscript and other non-script HTML, use dangerouslySetInnerHTML
  // For scripts, parse and use Script component
  const scripts = parseScriptTags(html);
  const nonScriptHtml = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').trim();

  return (
    <>
      {nonScriptHtml && (
        <div
          id="injected-body-start-html"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: nonScriptHtml }}
        />
      )}
      {scripts.map((script, i) => {
        if (script.src) {
          return (
            <Script
              key={`body-start-script-${i}`}
              src={script.src}
              strategy="beforeInteractive"
            />
          );
        } else if (script.content) {
          return (
            <Script
              key={`body-start-script-${i}`}
              id={`injected-body-start-${i}`}
              strategy="beforeInteractive"
              dangerouslySetInnerHTML={{ __html: script.content }}
            />
          );
        }
        return null;
      })}
    </>
  );
}

/**
 * Scripts to inject before </body>
 * Use: Chat widgets, deferred tracking
 */
export async function BodyEndScripts() {
  const html = await getScript('script_body_end');
  if (!html) return null;

  const scripts = parseScriptTags(html);
  const nonScriptHtml = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').trim();

  return (
    <>
      {nonScriptHtml && (
        <div
          id="injected-body-end-html"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: nonScriptHtml }}
        />
      )}
      {scripts.map((script, i) => {
        if (script.src) {
          // External script - pass through all data-* attributes
          const dataAttrs = getDataAttributes(script.attrs);
          return (
            <Script
              key={`body-end-script-${i}`}
              src={script.src}
              strategy="lazyOnload"
              {...dataAttrs}
            />
          );
        } else if (script.content) {
          return (
            <Script
              key={`body-end-script-${i}`}
              id={`injected-body-end-${i}`}
              strategy="lazyOnload"
              dangerouslySetInnerHTML={{ __html: script.content }}
            />
          );
        }
        return null;
      })}
    </>
  );
}
