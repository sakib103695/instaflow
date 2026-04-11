import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type OpenRouterModel = {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  pricing?: { prompt?: string; completion?: string };
  architecture?: { modality?: string; input_modalities?: string[] };
};

/**
 * GET /api/admin/openrouter/models
 *
 * Proxies OpenRouter's public /v1/models catalog. No OR key needed for the
 * listing — it's fully public. We filter to text-input models (no vision-
 * only, no audio-only) and trim each entry to the fields the picker needs
 * so we don't ship ~1MB of JSON to the browser.
 *
 * Cached in the response for 10 minutes; the admin UI calls this on mount
 * and on refresh, not per keystroke.
 */
export async function GET() {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { accept: 'application/json' },
      next: { revalidate: 600 },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `OpenRouter returned ${res.status}` },
        { status: 502 },
      );
    }
    const json = (await res.json()) as { data?: OpenRouterModel[] };
    const data = json.data ?? [];
    const models = data
      .filter((m) => {
        const mods = m.architecture?.input_modalities;
        // Accept text-in models; skip audio/image-only ones.
        if (!mods) return true;
        return mods.includes('text');
      })
      .map((m) => ({
        id: m.id,
        name: m.name || m.id,
        // OR pricing strings are $/token as a decimal string — convert to
        // $/M tokens for human display.
        promptPerM: m.pricing?.prompt ? Number(m.pricing.prompt) * 1_000_000 : null,
        completionPerM: m.pricing?.completion ? Number(m.pricing.completion) * 1_000_000 : null,
        contextLength: m.context_length ?? null,
      }))
      .sort((a, b) => {
        // Cheapest first; unknown-price sinks to bottom.
        const ap = a.promptPerM ?? Number.POSITIVE_INFINITY;
        const bp = b.promptPerM ?? Number.POSITIVE_INFINITY;
        if (ap !== bp) return ap - bp;
        return a.name.localeCompare(b.name);
      });
    return NextResponse.json({ models });
  } catch (err) {
    console.error('OpenRouter catalog fetch failed', err);
    return NextResponse.json({ error: 'Failed to fetch OpenRouter models' }, { status: 500 });
  }
}
