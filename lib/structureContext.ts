import { GoogleGenAI } from '@google/genai';
import { STRUCTURING_INSTRUCTION } from './agentPrompt';
import { EMPTY_STRUCTURED_CONTEXT, type StructuredContext } from './clientTypes';

/**
 * Server-side Gemini client for the structuring step. We use the larger Pro
 * model here because the call happens once at onboarding (not per call) and
 * accuracy matters more than latency.
 */
function getServerGemini() {
  const key = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!key) throw new Error('Missing GEMINI_API_KEY');
  return new GoogleGenAI({ apiKey: key });
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
