import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Vapi from '@vapi-ai/web';
import { VAPI_PUBLIC_KEY, AVAILABLE_VOICES, DEFAULT_VOICE_ID, type VoiceOption } from '../constants';
import { buildInlineAssistant } from '../lib/vapiAssistant';

export type TranscriptEntry = { role: 'user' | 'agent'; text: string };

/**
 * Returns true if two transcript strings are likely the same chunk (one being
 * a partial/refined version of the other). Compares case-folded, punctuation-
 * stripped text and checks for prefix/equality.
 */
function isSameChunk(a: string, b: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[.,!?;:]+$/g, '').trim();
  const A = norm(a);
  const B = norm(b);
  if (!A || !B) return false;
  if (A === B) return true;
  return A.startsWith(B) || B.startsWith(A);
}

export type UseVapiAgentOptions = {
  /** System prompt to inject as the agent's instructions for this call. */
  systemInstruction: string;
  /** Opening greeting the assistant says when the call connects. */
  greeting: string;
  /**
   * Initial voice id. The user can swap to a different voice via
   * setSelectedVoice — this value is only used as the starting voice and
   * does NOT lock the picker.
   */
  voiceId?: string;
  /** Spoken languages the agent should handle. Defaults to ['en']. */
  languages?: Array<'en' | 'hi'>;
  /**
   * Voice catalog the picker exposes. Defaults to the hardcoded
   * AVAILABLE_VOICES so legacy callers keep working; server pages should
   * pass the curated list loaded via loadVoicesForPicker().
   */
  availableVoices?: VoiceOption[];
  /** Where to POST the saved conversation (defaults to /api/conversations). */
  saveEndpoint?: string;
  /** Extra metadata persisted with the conversation. */
  saveMeta?: Record<string, unknown>;
};

/**
 * Vapi-powered voice agent hook.
 *
 * Designed to be a near-drop-in replacement for the old Gemini Live hook so
 * the existing widgets only need their imports swapped. Returns the same
 * shape: { isActive, isConnecting, isAiSpeaking, isThinking, error,
 * transcription, startConversation, stopConversation }.
 *
 * Architecture: every call is a "transient assistant" — the full config is
 * passed inline to vapi.start(). No assistants stored on Vapi's side, so
 * editing a client's prompt in admin takes effect on the very next call.
 */
export function useVapiAgent(opts: UseVapiAgentOptions) {
  const {
    systemInstruction,
    greeting,
    voiceId,
    availableVoices,
    languages,
    saveEndpoint = '/api/conversations',
    saveMeta,
  } = opts;
  // Effective catalog: caller-provided list if non-empty, else the hardcoded
  // fallback. Memoized on the input identity so setSelectedVoice stays stable.
  const voices = availableVoices && availableVoices.length > 0 ? availableVoices : AVAILABLE_VOICES;

  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  /** True between "user stopped talking" and "agent started talking back". */
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<TranscriptEntry[]>([]);
  /**
   * Voice selection. The `voiceId` prop is the *initial* value only — once
   * the user picks a different voice via setSelectedVoice we keep their
   * choice and never reset it from props (parent re-renders would otherwise
   * snap the picker back to the default).
   */
  const [selectedVoiceState, setSelectedVoiceState] = useState<VoiceOption>(
    () => voices.find((v) => v.id === (voiceId || DEFAULT_VOICE_ID)) ?? voices[0],
  );
  const selectedVoice = selectedVoiceState;
  const setSelectedVoice = useCallback((v: VoiceOption) => {
    setSelectedVoiceState(v);
  }, []);

  // ----- refs that don't trigger re-renders -----
  const vapiRef = useRef<Vapi | null>(null);
  const transcriptionRef = useRef<TranscriptEntry[]>([]);
  const startedAtRef = useRef<string | null>(null);
  const hasSavedRef = useRef(false);
  // Hold the latest saveMeta so persistConversation (which is wired into
  // long-lived Vapi event listeners) doesn't capture a stale one if the
  // parent rerenders with a new meta during the call.
  const saveMetaRef = useRef(saveMeta);
  useEffect(() => {
    saveMetaRef.current = saveMeta;
  }, [saveMeta]);

  /**
   * Build a brand new Vapi instance for every call.
   *
   * Why not reuse one across calls: Vapi's web SDK wraps Daily.co, which
   * keeps WebRTC room state on the instance. Reusing the same instance after
   * a call ends causes "Meeting ended due to ejection" on the next start
   * because Daily thinks you're rejoining a dead room. A fresh instance per
   * call is cheap and avoids the entire class of teardown races.
   */
  const createVapi = useCallback(() => {
    if (!VAPI_PUBLIC_KEY) {
      throw new Error('Missing NEXT_PUBLIC_VAPI_PUBLIC_KEY in .env');
    }
    return new Vapi(VAPI_PUBLIC_KEY);
  }, []);

  /**
   * Append/merge a transcript chunk.
   *
   * Vapi's transcript stream is messy: every chunk arrives twice (once as
   * `partial` and once as `final`), and partials are the in-progress text
   * for the *current* chunk only — NOT cumulative across chunks.
   *
   * Strategy: dedupe by text similarity instead of trying to track turn
   * state with a flag. If the incoming text and the last bubble's text
   * are the same speaker AND one is a prefix/superset of the other (case +
   * trailing-punctuation insensitive), it's the same chunk being updated:
   * replace the bubble. Otherwise it's a new chunk: append.
   */
  const appendTranscript = useCallback(
    (role: 'user' | 'agent', text: string) => {
      const cleaned = text.trim();
      if (!cleaned) return;
      setTranscription((prev) => {
        const last = prev[prev.length - 1];
        let next: TranscriptEntry[];
        if (last && last.role === role && isSameChunk(last.text, cleaned)) {
          // Same chunk → keep the longer (more complete) version.
          const better = cleaned.length >= last.text.length ? cleaned : last.text;
          next = [...prev.slice(0, -1), { role, text: better }];
        } else {
          next = [...prev, { role, text: cleaned }];
        }
        const trimmed = next.length > 50 ? next.slice(-50) : next;
        transcriptionRef.current = trimmed;
        return trimmed;
      });
    },
    [],
  );

  const persistConversation = useCallback(() => {
    if (hasSavedRef.current) return;
    const transcript = transcriptionRef.current;
    if (!Array.isArray(transcript) || transcript.length === 0) return;
    hasSavedRef.current = true;

    const payload = {
      transcript,
      selectedVoice: { id: selectedVoice.id, label: selectedVoice.label },
      startedAt: startedAtRef.current ?? null,
      endedAt: new Date().toISOString(),
      meta: saveMetaRef.current ?? {},
    };

    fetch(saveEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch((e) => console.error('Failed to save conversation', e));
  }, [saveEndpoint, selectedVoice.id, selectedVoice.label]);

  const stopConversation = useCallback(() => {
    persistConversation();
    if (vapiRef.current) {
      try {
        vapiRef.current.stop();
        vapiRef.current.removeAllListeners();
      } catch (e) {
        console.warn('vapi.stop failed', e);
      }
      vapiRef.current = null;
    }
    setIsActive(false);
    setIsConnecting(false);
    setIsAiSpeaking(false);
    setIsThinking(false);
  }, [persistConversation]);

  const startConversation = useCallback(async () => {
    if (isActive || isConnecting) {
      console.warn('startConversation called while already active');
      return;
    }
    try {
      setError(null);
      setTranscription([]);
      transcriptionRef.current = [];
      hasSavedRef.current = false;
      startedAtRef.current = new Date().toISOString();
      setIsConnecting(true);

      // Tear down any previous instance from a prior call so its Daily room
      // releases cleanly. Then build a brand new Vapi for this call.
      if (vapiRef.current) {
        try {
          vapiRef.current.stop();
          vapiRef.current.removeAllListeners();
        } catch {}
        vapiRef.current = null;
      }
      const vapi = createVapi();
      vapiRef.current = vapi;

      vapi.on('call-start', () => {
        console.log('[vapi] call-start');
        setIsConnecting(false);
        setIsActive(true);
      });

      vapi.on('call-end', () => {
        console.log('[vapi] call-end');
        persistConversation();
        setIsActive(false);
        setIsConnecting(false);
        setIsAiSpeaking(false);
        setIsThinking(false);
        try {
          vapi.removeAllListeners();
        } catch {}
        // Drop the ref so the next start gets a fresh instance.
        if (vapiRef.current === vapi) vapiRef.current = null;
      });

      vapi.on('speech-start', () => {
        // Vapi fires this when the assistant starts speaking.
        setIsAiSpeaking(true);
        setIsThinking(false);
      });
      vapi.on('speech-end', () => {
        setIsAiSpeaking(false);
      });

      // Vapi sends `message` events for: transcript chunks, function calls,
      // status updates, etc. We only care about transcripts here.
      vapi.on('message', (msg: any) => {
        if (msg?.type === 'transcript' && typeof msg.transcript === 'string') {
          const role = msg.role === 'assistant' ? 'agent' : 'user';
          appendTranscript(role, msg.transcript);
          // The instant we see a final user transcript, flip into "thinking"
          // so the UI shows a typing indicator before audio arrives.
          if (role === 'user' && msg.transcriptType === 'final') setIsThinking(true);
        }
      });

      vapi.on('error', (err: any) => {
        const toText = (v: any): string => {
          if (v == null) return '';
          if (typeof v === 'string') return v;
          if (typeof v === 'object') return toText(v.message) || toText(v.error) || JSON.stringify(v);
          return String(v);
        };
        const detail = toText(err?.error?.message) || toText(err?.message) || toText(err?.errorMsg) || toText(err);
        const text = detail.toLowerCase();
        // Daily.co (Vapi's WebRTC layer) emits these as "errors" when a room
        // shuts down normally. They're not real failures — suppress them so
        // we don't flash a red error bar after a perfectly fine call.
        const isBenignTeardown =
          text.includes('ejection') ||
          text.includes('meeting has ended') ||
          text.includes('meeting ended') ||
          text.includes('left meeting');
        if (isBenignTeardown) {
          console.debug('[vapi] benign teardown event, suppressed', err);
          return;
        }
        console.error('[vapi] error', err);
        setError(detail || 'Vapi error');
        setIsConnecting(false);
        setIsActive(false);
      });

      // Inject the selected voice's persona name into the prompt + greeting
      // so the agent introduces itself with the right name regardless of which
      // voice the user picked (the voice file carries audio, not a name).
      //
      // Extract a clean first name: leading letters only. Strips any parens
      // suffix like "Lucy (Fast)" → "Lucy", emoji, and extra qualifiers.
      const rawLabel = (selectedVoice?.label || '').trim();
      const nameMatch = rawLabel.match(/^[A-Za-z\u00C0-\u024F]+/);
      const personaName = nameMatch ? nameMatch[0] : 'Mia';
      const nameSection = `## Your name on this call\nYou go by "${personaName}". Always introduce yourself as ${personaName}. Never use any other name.`;
      // The composed prompt already has a "## Your name on this call" block
      // (from composeSystemInstruction). Replace it in place rather than
      // appending — otherwise the prompt contains two conflicting name
      // sections and the LLM may pick either.
      const nameSectionRe = /##\s*Your name on this call[\s\S]*?(?=\n##\s|\n*$)/i;
      const adjustedPrompt = nameSectionRe.test(systemInstruction)
        ? systemInstruction.replace(nameSectionRe, nameSection)
        : `${systemInstruction}\n\n${nameSection}`;
      // Rewrite the greeting to use the new name. Support both English
      // ("this is X") and the Hindi default ("main X bol rahi hoon").
      const adjustedGreeting = greeting
        .replace(/this is\s+\w+/i, `this is ${personaName}`)
        .replace(/main\s+\w+\s+bol\s+rahi\s+hoon/i, `main ${personaName} bol rahi hoon`);

      const assistant = buildInlineAssistant({
        systemPrompt: adjustedPrompt,
        greeting: adjustedGreeting,
        voiceId: selectedVoice.id,
        languages,
      });

      await vapi.start(assistant as any);
    } catch (err: any) {
      console.error('startConversation failed', err);
      const msg = err?.message || err?.toString?.() || 'Failed to start call';
      setError(
        msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('microphone')
          ? 'Microphone access denied. Allow mic in browser.'
          : msg,
      );
      setIsConnecting(false);
      setIsActive(false);
    }
  }, [isActive, isConnecting, createVapi, persistConversation, appendTranscript, systemInstruction, greeting, selectedVoice.id, selectedVoice.label]);

  // Cleanup on unmount only — never tear down mid-call due to dep changes.
  // Use a ref pattern so this effect doesn't re-run when stopConversation
  // identity changes (which would happen on every saveMeta change otherwise).
  const stopRef = useRef(stopConversation);
  useEffect(() => {
    stopRef.current = stopConversation;
  }, [stopConversation]);
  useEffect(() => {
    return () => stopRef.current();
  }, []);

  // Voice preview is intentionally a no-op now: with Vapi we don't have a
  // free TTS endpoint to play a sample, and the demo widget's old "preview"
  // button isn't worth a $0.01 credit per click. Stubbed for API compat.
  const previewVoice = useCallback(async () => {}, []);
  const isPreviewing = false;

  return {
    isActive,
    isConnecting,
    isPreviewing,
    isAiSpeaking,
    isThinking,
    error,
    transcription,
    voices,
    selectedVoice,
    setSelectedVoice,
    previewVoice,
    startConversation,
    stopConversation,
  };
}
