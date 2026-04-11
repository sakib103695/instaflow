import { GoogleGenAI } from '@google/genai';
import { STRUCTURING_INSTRUCTION } from './agentPrompt';
import { EMPTY_STRUCTURED_CONTEXT, type StructuredContext } from './clientTypes';
import { getSetting } from './mongodb';

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
function getServerGemini() {
  const key = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!key) throw new Error('Missing GEMINI_API_KEY');
  return new GoogleGenAI({ apiKey: key });
}

async function structureViaOpenRouter(rawText: string, model: string): Promise<StructuredContext> {
  const apiKey = process.env.OPENROUTER_API_KEY!.trim();
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
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
          content: STRUCTURING_INSTRUCTION,
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
  // Prefer OpenRouter when configured AND an admin has picked a model in
  // settings. The model list is curated at runtime via /admin/settings —
  // no env var / redeploy needed to switch between OR's 200+ options.
  const keyConfigured =
    process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY !== 'REPLACE_ME';
  if (keyConfigured) {
    const chosen = (await getSetting<string>('openrouterModel'))?.trim();
    if (chosen) return structureViaOpenRouter(rawText, chosen);
  }

  const ai = getServerGemini();
  // gemini-2.5-pro is the accuracy/quality choice for this one-shot extraction.
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: [
      {
        role: 'user',
        parts: [
          { text: STRUCTURING_INSTRUCTION },
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
