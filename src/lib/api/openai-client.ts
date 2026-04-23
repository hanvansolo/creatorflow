import OpenAI from 'openai';

let _client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!_client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}

/**
 * Default model for all AI operations.
 *
 * `gpt-4.1-nano` is currently the cheapest general-purpose OpenAI chat model
 * (~$0.10 / 1M input tokens, ~$0.40 / 1M output tokens — roughly a third of
 * `gpt-4o-mini`). It handles short rewrites, classification, summarisation
 * and translation comfortably; for tasks where you want higher quality
 * rewrites override via env var (e.g. `SPINNER_MODEL=gpt-4o` for the long
 * article spinner only).
 *
 * If a cheaper model becomes available (e.g. `gpt-5-nano`), set `AI_MODEL`
 * on Railway and every call site picks it up with no redeploy.
 */
export const AI_MODEL = process.env.AI_MODEL || 'gpt-4.1-nano';

/**
 * Convenience helper: make a chat completion and return the plain text,
 * or null on failure.
 *
 * Uses `max_completion_tokens` — the newer parameter that gpt-4.1-nano,
 * gpt-5-nano, and the o-series all require. `max_tokens` is rejected
 * outright by these models ("Unsupported parameter" error). The older
 * gpt-4o-mini family still accepts `max_completion_tokens` too, so this
 * is safe as a global default.
 */
export async function chatComplete(opts: {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  model?: string;
  systemPrompt?: string;
}): Promise<string | null> {
  const messages: Array<{ role: 'system' | 'user'; content: string }> = [];
  if (opts.systemPrompt) messages.push({ role: 'system', content: opts.systemPrompt });
  messages.push({ role: 'user', content: opts.prompt });

  const res = await getOpenAIClient().chat.completions.create({
    model: opts.model || AI_MODEL,
    max_completion_tokens: opts.maxTokens ?? 1024,
    temperature: opts.temperature ?? 0.7,
    messages,
  });
  return res.choices[0]?.message?.content ?? null;
}
