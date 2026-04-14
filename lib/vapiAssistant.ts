import { DEFAULT_VOICE_ID, findVoice } from '@/constants';
import type { Language } from './clientTypes';

/**
 * Builds an INLINE Vapi assistant config that's passed straight to
 * `vapi.start()` from the browser. Vapi calls these "transient" assistants —
 * they exist only for the duration of the call, so we can pass a brand new
 * system prompt every time without ever creating/syncing a persistent
 * assistant on Vapi's side.
 *
 * Why this matters: it means we can edit a client's prompt in our admin and
 * the very next call uses it. No PATCH-Vapi-on-update logic, no risk of
 * drift, no Vapi resources to clean up on delete.
 */

export type BuildAssistantOptions = {
  systemPrompt: string;
  greeting: string;
  voiceId?: string;
  /** Optional model override (default gpt-4o-mini). */
  model?: string;
  /** Languages the agent should understand. Defaults to ['en']. */
  languages?: Language[];
};

/**
 * Build the transcriber block based on enabled languages.
 *
 *   ['en']       → nova-3 English (lowest latency, highest accuracy for EN).
 *   ['hi']       → nova-2 Hindi (nova-3 doesn't support Hindi yet).
 *   ['en','hi']  → nova-2 multi-language detection. Handles Hinglish code-
 *                  switching mid-sentence, which is the norm for Indian callers.
 */
function buildTranscriber(languages: Language[]) {
  if (languages.length > 1) {
    return {
      provider: 'deepgram' as const,
      model: 'nova-2',
      language: 'multi' as const,
      smartFormat: true,
    };
  }
  const only = languages[0] || 'en';
  if (only === 'hi') {
    return {
      provider: 'deepgram' as const,
      model: 'nova-2',
      language: 'hi' as const,
      smartFormat: true,
    };
  }
  return {
    provider: 'deepgram' as const,
    model: 'nova-3',
    language: 'en' as const,
    smartFormat: true,
  };
}

/**
 * The "best human-realtime stack" as of today:
 *   - LLM:         OpenAI gpt-4o-mini  (~300ms TTFT, smart enough)
 *   - Transcriber: Deepgram nova-3     (~150ms streaming STT)
 *   - Voice:       ElevenLabs flash v2.5 (~75ms TTFB, top naturalness)
 *
 * Vapi's smart "livekit" endpointing model is far better than fixed silence
 * thresholds — it predicts turn end based on prosody/syntax instead of
 * waiting for N ms of silence.
 */
export function buildInlineAssistant(opts: BuildAssistantOptions) {
  const voiceId = opts.voiceId || DEFAULT_VOICE_ID;
  const voiceMeta = findVoice(voiceId);
  // Provider-specific voice block. ElevenLabs is the default high-quality
  // option; Cartesia Sonic-2 is the ultra-low-latency alternative.
  const voice =
    voiceMeta?.provider === 'cartesia'
      ? {
          provider: 'cartesia' as const,
          voiceId,
          model: 'sonic-2',
        }
      : {
          provider: '11labs' as const,
          voiceId,
          model: 'eleven_flash_v2_5',
          stability: 0.5,
          similarityBoost: 0.75,
          optimizeStreamingLatency: 3,
        };
  return {
    name: 'Instaflow Agent',
    firstMessage: opts.greeting,
    firstMessageMode: 'assistant-speaks-first' as const,

    // Warm office ambience makes it feel like a real receptionist on a real desk.
    backgroundSound: 'office' as const,
    backgroundDenoisingEnabled: true,

    // Smart endpointing: predict turn end via prosody, not fixed silence.
    startSpeakingPlan: {
      waitSeconds: 0.4,
      smartEndpointingPlan: {
        provider: 'livekit' as const,
        // Vapi's livekit endpointing model — best balance of snappy and patient.
      },
    },
    // Don't cut the agent off on coughs/blips — require sustained speech.
    stopSpeakingPlan: {
      numWords: 2,
      voiceSeconds: 0.3,
      backoffSeconds: 1.0,
    },

    transcriber: buildTranscriber(opts.languages && opts.languages.length > 0 ? opts.languages : ['en']),

    model: {
      provider: 'openai' as const,
      model: opts.model || 'gpt-4o-mini',
      temperature: 0.7,
      messages: [
        {
          role: 'system' as const,
          content: opts.systemPrompt,
        },
      ],
      // Reduce hallucination risk: tight token cap per turn = forces short replies.
      maxTokens: 250,
    },

    voice,

    // Phrases the assistant can say to gracefully end a call.
    endCallPhrases: [
      'have a great day',
      'have a wonderful day',
      'goodbye now',
      'bye now',
      'take care',
    ],
    endCallMessage: '',
    // Hard ceiling so a runaway call can't drain credits.
    maxDurationSeconds: 600,
    silenceTimeoutSeconds: 30,

    // We don't want Vapi to email or webhook us per call — we save the
    // transcript ourselves via our existing /api/conversations endpoint.
  };
}
