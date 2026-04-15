// @ts-nocheck
/**
 * Telegram multi-channel broadcaster.
 *
 * Config via env var TELEGRAM_CHANNELS — comma-separated list of
 * `<chatId>:<langCode>` entries. Example:
 *
 *   TELEGRAM_CHANNELS=@footyfeed_en:en,@footyfeed_es:es,@footyfeed_pt:pt,@footyfeed_ar:ar
 *
 * A single TELEGRAM_BOT_TOKEN posts to all channels. Content is translated
 * via Anthropic before sending when langCode !== 'en'.
 *
 * Bot must be added as admin to each channel before posting.
 */

import Anthropic from '@anthropic-ai/sdk';

type Channel = { chatId: string; lang: string };

function parseChannels(): Channel[] {
  const raw = process.env.TELEGRAM_CHANNELS;
  if (!raw) return [];
  return raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(entry => {
      const [chatId, lang] = entry.split(':');
      return { chatId: chatId.trim(), lang: (lang || 'en').trim().toLowerCase() };
    });
}

const LANG_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  pt: 'Portuguese (Brazil)',
  ar: 'Arabic',
  ru: 'Russian',
  de: 'German',
  fr: 'French',
  it: 'Italian',
  tr: 'Turkish',
  ja: 'Japanese',
  ko: 'Korean',
  zh: 'Simplified Chinese',
  id: 'Indonesian',
  vi: 'Vietnamese',
  th: 'Thai',
  nl: 'Dutch',
};

async function translate(text: string, targetLang: string): Promise<string> {
  if (targetLang === 'en' || !LANG_NAMES[targetLang]) return text;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return text;

  try {
    const anthropic = new Anthropic({ apiKey: key });
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `Translate the following football social media post into ${LANG_NAMES[targetLang]}. Preserve emojis, hashtags (convert to natural ${LANG_NAMES[targetLang]} hashtags where appropriate), URLs, team names, and competition names. Output ONLY the translation — no preamble, no quotes, no explanation.\n\n${text}`,
        },
      ],
    });
    const out = msg.content[0];
    if (out.type === 'text') return out.text.trim();
    return text;
  } catch (e) {
    console.error(`[Telegram] Translation to ${targetLang} failed:`, (e as Error).message);
    return text;
  }
}

async function sendOne(
  botToken: string,
  chatId: string,
  text: string,
  imageUrl?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const endpoint = imageUrl
      ? `https://api.telegram.org/bot${botToken}/sendPhoto`
      : `https://api.telegram.org/bot${botToken}/sendMessage`;

    const body: Record<string, string | boolean> = { chat_id: chatId };
    if (imageUrl) {
      body.photo = imageUrl;
      body.caption = text.slice(0, 1024);
    } else {
      body.text = text.slice(0, 4096);
      body.disable_web_page_preview = false;
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json();
    if (res.ok && data.ok) return { success: true };
    return { success: false, error: data.description || JSON.stringify(data).slice(0, 300) };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

/**
 * Post the same message to every configured Telegram channel, translating
 * per channel language. Returns a summary — `anySuccess` is true if at
 * least one channel accepted the post.
 */
export async function postToTelegram(
  text: string,
  imageUrl?: string,
): Promise<{ anySuccess: boolean; sent: number; failed: number; errors: string[] }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const channels = parseChannels();
  if (!botToken || channels.length === 0) {
    return { anySuccess: false, sent: 0, failed: 0, errors: ['Telegram not configured'] };
  }

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const ch of channels) {
    const localized = await translate(text, ch.lang);
    const result = await sendOne(botToken, ch.chatId, localized, imageUrl);
    if (result.success) {
      sent++;
      console.log(`[Telegram] Sent to ${ch.chatId} (${ch.lang})`);
    } else {
      failed++;
      errors.push(`${ch.chatId}: ${result.error}`);
      console.error(`[Telegram] Failed ${ch.chatId} (${ch.lang}): ${result.error}`);
    }
  }

  return { anySuccess: sent > 0, sent, failed, errors };
}
