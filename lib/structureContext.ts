import { GoogleGenAI } from '@google/genai';
import { resolveStructuringPrompt } from './agentPrompt';
import { EMPTY_STRUCTURED_CONTEXT, type StructuredContext } from './clientTypes';
import { getSetting } from './mongodb';
import { resolveSecret } from './secrets';
import { upstreamFetch } from './upstream';

/**
 * Provider selection for the one-shot structuring step.
 *
 * Priority:
 *   1. OpenRouter if OPENROUTER_API_KEY is set — lets us swap in any cheap
 *      model via OPENROUTER_STRUCTURING_MODEL (defaults to Gemini 2.0 Flash,
 *      ~12x cheaper than Gemini 2.5 Pro for near-equal JSON quality).
 *   2. Direct Google Gemini API if GEMINI_API_KEY is set — legacy path.
 *
 * The structuring step is called exactly once per client at onboarding, so
 * accuracy matters more than latency, but at 5k clients the per-call cost
 * dominates and OpenRouter's cheaper models save hundreds of dollars.
 */
async function getServerGemini() {
  const key = await resolveSecret('geminiApiKey', 'GEMINI_API_KEY');
  if (!key) throw new Error('Missing GEMINI_API_KEY. Set it in /admin/settings or as an env var.');
  return new GoogleGenAI({ apiKey: key });
}

async function structureViaOpenRouter(rawText: string, model: string, apiKey: string): Promise<StructuredContext> {
  const instruction = await resolveStructuringPrompt();
  const res = await upstreamFetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    // LLM completions can legitimately take a while for long inputs, but
    // anything past 90s is a hung call, not a slow one.
    timeoutMs: 90_000,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      // Optional ranking headers OpenRouter asks for.
      'HTTP-Referer': 'https://flow.instaquirk.tech',
      'X-Title': 'Instaflow',
    },
    body: JSON.stringify({
      model,
      // JSON mode is honored by gemini-flash, deepseek, llama, etc. via OR.
      response_format: { type: 'json_object' },
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: instruction,
        },
        {
          role: 'user',
          content: '=== SOURCE CONTENT ===\n\n' + rawText.slice(0, 180_000),
        },
      ],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${text.slice(0, 300)}`);
  }
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return normalize(tryParseJson(json.choices?.[0]?.message?.content || ''));
}

function tryParseJson(raw: string): StructuredContext | null {
  // Strip markdown fences if the model added any despite instructions.
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');
  // Sometimes the model wraps JSON in extra prose — grab the outermost {...}.
  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');
  if (first === -1 || last === -1) return null;
  cleaned = cleaned.slice(first, last + 1);
  try {
    return JSON.parse(cleaned) as StructuredContext;
  } catch {
    return null;
  }
}

/** Merge model output with empty defaults so missing fields don't crash UI. */
function normalize(partial: Partial<StructuredContext> | null): StructuredContext {
  if (!partial) return { ...EMPTY_STRUCTURED_CONTEXT };
  return {
    business: { ...EMPTY_STRUCTURED_CONTEXT.business, ...(partial.business ?? {}) },
    services: Array.isArray(partial.services) ? partial.services : [],
    faqs: Array.isArray(partial.faqs) ? partial.faqs : [],
    policies: { ...EMPTY_STRUCTURED_CONTEXT.policies, ...(partial.policies ?? {}) },
    bookingChannels: Array.isArray(partial.bookingChannels) ? partial.bookingChannels : [],
    tone: partial.tone || EMPTY_STRUCTURED_CONTEXT.tone,
    personaName: partial.personaName || EMPTY_STRUCTURED_CONTEXT.personaName,
    doNotPromise: Array.isArray(partial.doNotPromise) ? partial.doNotPromise : [],
    escalation: partial.escalation || '',
  };
}

export async function structureContextFromRawText(rawText: string): Promise<StructuredContext> {
  // Prefer OpenRouter when an API key + model are both configured via
  // /admin/settings (or env fallback). The model list is curated at
  // runtime — no redeploy needed to switch between OR's 200+ options.
  const orKey = await resolveSecret('openrouterApiKey', 'OPENROUTER_API_KEY');
  if (orKey) {
    const chosen = (await getSetting<string>('openrouterModel'))?.trim();
    if (chosen) return structureViaOpenRouter(rawText, chosen, orKey);
  }

  const ai = await getServerGemini();
  const instruction = await resolveStructuringPrompt();
  // gemini-2.5-pro is the accuracy/quality choice for this one-shot extraction.
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: [
      {
        role: 'user',
        parts: [
          { text: instruction },
          { text: '\n\n=== SOURCE CONTENT ===\n\n' + rawText.slice(0, 180_000) },
        ],
      },
    ],
    config: {
      responseMimeType: 'application/json',
      temperature: 0.2,
    },
  });

  const raw = response.text || '';
  const parsed = tryParseJson(raw);
  return normalize(parsed);
}
