import Anthropic from '@anthropic-ai/sdk';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { db, translations } from '@/lib/db';
import { DEFAULT_LOCALE, LOCALE_NAMES, type Locale } from './config';

let _tableEnsured = false;
async function ensureTable(): Promise<void> {
  if (_tableEnsured) return;
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS translations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        content_type VARCHAR(50) NOT NULL,
        content_id VARCHAR(100) NOT NULL,
        locale VARCHAR(10) NOT NULL,
        field VARCHAR(50) NOT NULL,
        value TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS translations_unique_idx ON translations (content_type, content_id, locale, field)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS translations_lookup_idx ON translations (content_type, content_id, locale)`);
    _tableEnsured = true;
  } catch (e) {
    console.error('[translate] ensureTable failed:', (e as Error).message);
  }
}

let _anthropic: Anthropic | null = null;
function anthropic(): Anthropic | null {
  if (_anthropic) return _anthropic;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  _anthropic = new Anthropic({ apiKey: key });
  return _anthropic;
}

const FIELD_GUIDANCE: Record<string, string> = {
  title: 'Keep it punchy and headline-style. Preserve team and competition names. Do not add quotes around the output.',
  summary: 'Keep it tight — one to two sentences max. Preserve team and competition names.',
  body: 'Preserve markdown, HTML, links, images, and structure exactly. Only translate prose.',
  generic: 'Preserve team names, competition names, numbers, and any URLs or hashtags.',
};

async function translateOne(text: string, target: Locale, field: string): Promise<string> {
  if (target === DEFAULT_LOCALE) return text;
  const client = anthropic();
  if (!client) return text;

  try {
    const guidance = FIELD_GUIDANCE[field] || FIELD_GUIDANCE.generic;
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: Math.min(4000, Math.ceil(text.length * 2 + 200)),
      messages: [
        {
          role: 'user',
          content: `Translate the following football news ${field} into ${LOCALE_NAMES[target]}. ${guidance} Output ONLY the translation — no preamble, no quotes.\n\n${text}`,
        },
      ],
    });
    const out = msg.content[0];
    if (out.type === 'text') return out.text.trim();
    return text;
  } catch (e) {
    console.error(`[translate] ${target}/${field} failed:`, (e as Error).message);
    return text;
  }
}

/**
 * Get a translated field value with DB-backed caching. Returns original
 * text on cache miss if translation fails or isn't configured.
 */
export async function translateField(
  contentType: string,
  contentId: string,
  field: string,
  sourceText: string,
  target: Locale,
): Promise<string> {
  if (target === DEFAULT_LOCALE || !sourceText) return sourceText;
  await ensureTable();

  try {
    const [cached] = await db
      .select({ value: translations.value })
      .from(translations)
      .where(and(
        eq(translations.contentType, contentType),
        eq(translations.contentId, contentId),
        eq(translations.locale, target),
        eq(translations.field, field),
      ))
      .limit(1);

    if (cached) return cached.value;
  } catch {
    // Table may not exist yet (migration pending) — fall through to live translate.
  }

  const translated = await translateOne(sourceText, target, field);
  if (translated === sourceText) return sourceText;

  try {
    await db.insert(translations).values({
      contentType, contentId, locale: target, field, value: translated,
    }).onConflictDoNothing();
  } catch { /* ignore cache write failures */ }

  return translated;
}

/**
 * Batch-translate multiple content items. Loads all cached translations
 * in one query, then fires off Claude calls in parallel for misses.
 * Used on list pages like /news to avoid N round-trips.
 */
export async function translateBatch<T extends { id: string }>(
  items: T[],
  contentType: string,
  fields: { key: keyof T; field: string }[],
  target: Locale,
): Promise<T[]> {
  if (target === DEFAULT_LOCALE || items.length === 0) return items;
  await ensureTable();

  const ids = items.map(i => i.id);
  let cache: Record<string, Record<string, string>> = {};

  try {
    const rows = await db
      .select()
      .from(translations)
      .where(and(
        eq(translations.contentType, contentType),
        eq(translations.locale, target),
        inArray(translations.contentId, ids),
      ));
    for (const r of rows) {
      if (!cache[r.contentId]) cache[r.contentId] = {};
      cache[r.contentId][r.field] = r.value;
    }
  } catch { /* table may not exist */ }

  const translated = await Promise.all(items.map(async (item) => {
    const out: Record<string, unknown> = { ...item };
    await Promise.all(fields.map(async ({ key, field }) => {
      const source = (item as Record<string, unknown>)[key as string];
      if (typeof source !== 'string' || !source) return;
      const cachedValue = cache[item.id]?.[field];
      if (cachedValue) {
        out[key as string] = cachedValue;
        return;
      }
      const result = await translateOne(source, target, field);
      if (result !== source) {
        out[key as string] = result;
        try {
          await db.insert(translations).values({
            contentType, contentId: item.id, locale: target, field, value: result,
          }).onConflictDoNothing();
        } catch {}
      }
    }));
    return out as T;
  }));

  return translated;
}
