/** Vapi public key — set NEXT_PUBLIC_VAPI_PUBLIC_KEY in .env.local */
export const VAPI_PUBLIC_KEY =
  (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY : undefined) || '';

/** Special marker the AI should include when it decides to end the call. */
export const END_CALL_SIGNAL = '[END_CALL]';

/** Cue sent when the call connects so the model greets first. */
export const CALL_CONNECTED_CUE = '[Call connected]';

export const APP_CONFIG = {
  name: 'InstaFlow',
  tagline: 'AI Voice Agents That Answer Every Call Instantly',
  primaryColor: '#5b21b6',
  secondaryColor: '#0f0518',
};

/**
 * Curated voice catalog used by Vapi.
 *
 * Each entry maps to a real voice on a TTS provider that Vapi supports.
 * We hand-pick a small set across providers + accents/genders so visitors
 * can hear distinct, characterful options instead of being overwhelmed.
 *
 * Why a curated list (not a Vapi `GET /voices` endpoint): Vapi doesn't have
 * one. Voice catalogs live on each provider (ElevenLabs, Cartesia, PlayHT,
 * etc.) and they're hundreds long each. For a public-facing demo, 8 great
 * voices is the right UX.
 */
export type VoiceProvider = '11labs' | 'cartesia';

export type VoiceOption = {
  id: string;
  provider: VoiceProvider;
  label: string;
  description: string;
  /** Demo line shown in the picker UI; not currently spoken aloud. */
  previewText: string;
};

export const AVAILABLE_VOICES: VoiceOption[] = [
  // ===== ElevenLabs (most natural, slightly higher latency) =====
  {
    id: 'EXAVITQu4vr4xnSDxMaL',
    provider: '11labs',
    label: 'Sarah',
    description: 'Warm professional female · US · best default',
    previewText: "Hi, I'm Sarah. I help customers feel heard and get things sorted quickly.",
  },
  {
    id: 'XB0fDUnXU5powFXDhCwa',
    provider: '11labs',
    label: 'Charlotte',
    description: 'Calm soft female · UK · empathetic support',
    previewText: "Hello, I'm Charlotte. I'm here to help you with whatever you need today.",
  },
  {
    id: 'cgSgspJ2msm6clMCkdW9',
    provider: '11labs',
    label: 'Jessica',
    description: 'Confident upbeat female · US · sales & front desk',
    previewText: "Hey there! I'm Jessica. Let's get you taken care of.",
  },
  {
    id: 'pFZP5JQG7iQjIQuC4Bku',
    provider: '11labs',
    label: 'Lily',
    description: 'Soft gentle female · UK · wellness & beauty',
    previewText: "Hi, I'm Lily. So glad you called — let's chat.",
  },
  {
    id: 'nPczCjzI2devNBz1zQrb',
    provider: '11labs',
    label: 'Brian',
    description: 'Warm friendly male · US · general purpose',
    previewText: "Hi, I'm Brian. How can I help you out today?",
  },
  {
    id: 'pNInz6obpgDdcvkpqHQH',
    provider: '11labs',
    label: 'Adam',
    description: 'Deep authoritative male · US · premium brands',
    previewText: "Hello, this is Adam. Thanks for calling — how may I assist you?",
  },
  // ===== Cartesia Sonic-2 (ultra-low latency, slightly less natural) =====
  {
    id: '79a125e8-cd45-4c13-8a67-188112f4dd22',
    provider: 'cartesia',
    label: 'Lucy (Fast)',
    description: 'British female · ultra-fast · lowest latency',
    previewText: "Hi, I'm Lucy. Let's get you sorted in no time.",
  },
  {
    id: '421b3369-f63f-4b03-8980-37a44df1d4e8',
    provider: 'cartesia',
    label: 'Marcus (Fast)',
    description: 'American male · ultra-fast · lowest latency',
    previewText: "Hey, I'm Marcus. Ready when you are.",
  },
];

/** Quick lookup for the assistant builder. */
export function findVoice(id: string): VoiceOption | undefined {
  return AVAILABLE_VOICES.find((v) => v.id === id);
}

/** Default voice id used when nothing else is specified. */
export const DEFAULT_VOICE_ID = AVAILABLE_VOICES[0].id;

/**
 * Demo system prompt used by the homepage `/` voice demo. This is what
 * visitors hear when they click "Talk to..." on the marketing page. It's a
 * fixed showcase persona — not driven by client data.
 */
export const INSTAFLOW_SYSTEM_INSTRUCTION = `
You are "Mia", a warm, sharp human receptionist for GlowLift Medspa, a premium medical spa.

Speak naturally — short sentences, contractions, occasional fillers ("mm-hm", "got it", "let me see"). Never sound like a script, never say you're an AI. If asked, you're a real person at the front desk.

What you do: greet callers, answer basic questions about treatments (Botox, fillers, facials, laser), and help book/reschedule/cancel appointments. Hours: Mon-Sat 9am-7pm. Closed Sundays. Located in downtown LA.

When booking: collect treatment, preferred day/time, name, and phone. Repeat key details back. If a time isn't available, suggest the closest alternative.

Never invent prices or medical advice. For specifics: "Pricing depends on the treatment — let me have one of our specialists call you back with an exact quote. What's the best number?"

When the caller is clearly done, say a warm goodbye and end the call gracefully.
`.trim();
