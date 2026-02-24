import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { GEMINI_API_KEY, INSTAFLOW_SYSTEM_INSTRUCTION, AVAILABLE_VOICES, END_CALL_SIGNAL, CALL_CONNECTED_CUE } from '../constants';
import { decode, decodeAudioData, createBlob } from '../services/audioUtils';

export type TranscriptEntry = { role: 'user' | 'agent'; text: string };

const END_CALL_AUDIO_WAIT_MS = 8000; // max wait for last AI line to finish before ending

export function useVoiceAgent() {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<TranscriptEntry[]>([]);
  const [selectedVoiceState, setSelectedVoiceState] = useState(AVAILABLE_VOICES[0]);

  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  const transcriptionRef = useRef<TranscriptEntry[]>([]);
  const selectedVoiceRef = useRef(AVAILABLE_VOICES[0]);
  const startedAtRef = useRef<string | null>(null);
  const endedAtRef = useRef<string | null>(null);
  const hasSavedRef = useRef(false);
  const pendingEndCallRef = useRef(false);
  const endCallTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedVoice = selectedVoiceState;

  const setSelectedVoice = useCallback(
    (voice: (typeof AVAILABLE_VOICES)[number]) => {
      setSelectedVoiceState(voice);
      selectedVoiceRef.current = voice;
    },
    [],
  );

  const stopConversation = useCallback(() => {
    // Capture a snapshot of the current conversation and save it once.
    if (!hasSavedRef.current && typeof window !== 'undefined') {
      const transcript = transcriptionRef.current;
      if (Array.isArray(transcript) && transcript.length > 0) {
        hasSavedRef.current = true;
        const startedAt = startedAtRef.current;
        const endedAt = new Date().toISOString();
        endedAtRef.current = endedAt;

        const voice = selectedVoiceRef.current;
        const payload = {
          transcript,
          selectedVoice: voice
            ? {
                id: voice.id,
                label: voice.label,
              }
            : null,
          startedAt: startedAt ?? null,
          endedAt,
          meta: {},
        };

        // Fire and forget – no state updates here.
        fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch((e) => {
          console.error('Failed to save conversation', e);
        });
      }
    }

    setIsActive(false);
    setIsConnecting(false);
    setIsAiSpeaking(false);

    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    for (const source of sourcesRef.current.values()) {
      try {
        source.stop();
      } catch (e) {}
    }
    sourcesRef.current.clear();

    if (audioContextInRef.current) audioContextInRef.current.close();
    if (audioContextOutRef.current) audioContextOutRef.current.close();
    audioContextInRef.current = null;
    audioContextOutRef.current = null;
    nextStartTimeRef.current = 0;
    pendingEndCallRef.current = false;
    if (endCallTimeoutRef.current) {
      clearTimeout(endCallTimeoutRef.current);
      endCallTimeoutRef.current = null;
    }
  }, []);

  const previewVoice = useCallback(async () => {
    if (isPreviewing || isActive) return;
    try {
      setIsPreviewing(true);
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      // Frame as "speak this text" so the TTS model outputs audio only, not text.
      const ttsPrompt = `Read aloud exactly, with no additions or changes: "${selectedVoice.previewText}"`;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: [{ parts: [{ text: ttsPrompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice.id as any } },
          },
        },
      });

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      if (audioCtx.state === 'suspended') await audioCtx.resume();
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioBuffer = await decodeAudioData(decode(base64Audio), audioCtx, 24000, 1);
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);
        source.onended = () => {
          setIsPreviewing(false);
          audioCtx.close();
        };
        source.start();
      } else {
        setIsPreviewing(false);
      }
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || err?.toString?.() || 'Preview failed';

      setIsPreviewing(false);

      if (
        typeof msg === 'string' &&
        msg.includes('Model tried to generate text, but it should only be used for TTS')
      ) {
        setError(
          'Preview is temporarily unavailable due to a limitation in the Gemini TTS model. Live calls still work normally.',
        );
      } else if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
        setError(
          'You have exceeded your current Gemini API quota. Check your plan and billing details, or wait and try again later.',
        );
      } else if (msg.includes('401') || msg.toLowerCase().includes('api key')) {
        setError(
          'Invalid or missing API key. Make sure VITE_GEMINI_API_KEY is set in your .env or .env.local, then restart the dev server.',
        );
      } else {
        setError(msg);
      }
    }
  }, [isPreviewing, isActive, selectedVoice]);

  const startConversation = useCallback(async () => {
    try {
      setError(null);
      setTranscription([]);
      transcriptionRef.current = [];
      setIsConnecting(true);

      startedAtRef.current = new Date().toISOString();
      endedAtRef.current = null;
      hasSavedRef.current = false;

      if (!GEMINI_API_KEY || GEMINI_API_KEY.length < 10) {
        setError('Invalid or missing API key.');
        setIsConnecting(false);
        return;
      }

      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      if (inputCtx.state === 'suspended') await inputCtx.resume();
      if (outputCtx.state === 'suspended') await outputCtx.resume();
      audioContextInRef.current = inputCtx;
      audioContextOutRef.current = outputCtx;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: INSTAFLOW_SYSTEM_INSTRUCTION,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice.id as any } },
          },
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsActive(true);
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(1024, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              if (sessionRef.current) {
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmBlob = createBlob(inputData);
                sessionRef.current.sendRealtimeInput({ media: pcmBlob });
              }
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const serverContent = message.serverContent as any;
            if (serverContent?.inputTranscription?.text) {
              const text = (serverContent.inputTranscription.text || '').trim();
              if (text) {
                setTranscription((prev) => {
                  const next: TranscriptEntry[] = [...prev.slice(-20), { role: 'user', text }];
                  transcriptionRef.current = next;
                  return next;
                });
              }
            }
            if (serverContent?.outputTranscription) {
              let text = serverContent.outputTranscription.text || '';
              let shouldEndCall = false;

              if (text.includes(END_CALL_SIGNAL)) {
                shouldEndCall = true;
                text = text.replace(END_CALL_SIGNAL, '').trim();
              }

              if (text) {
                setTranscription((prev) => {
                  const next: TranscriptEntry[] = [...prev.slice(-20), { role: 'agent', text }];
                  transcriptionRef.current = next;
                  return next;
                });
              }

              if (shouldEndCall) {
                pendingEndCallRef.current = true;
                if (endCallTimeoutRef.current) clearTimeout(endCallTimeoutRef.current);
                endCallTimeoutRef.current = setTimeout(() => {
                  endCallTimeoutRef.current = null;
                  pendingEndCallRef.current = false;
                  stopConversation();
                }, END_CALL_AUDIO_WAIT_MS);
              }
            }
            const base64Audio = serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && outputCtx) {
              setIsAiSpeaking(true);
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
              const sourceNode = outputCtx.createBufferSource();
              sourceNode.buffer = audioBuffer;
              sourceNode.connect(outputCtx.destination);
              sourceNode.onended = () => {
                sourcesRef.current.delete(sourceNode);
                if (sourcesRef.current.size === 0) {
                  setIsAiSpeaking(false);
                  if (pendingEndCallRef.current) {
                    pendingEndCallRef.current = false;
                    if (endCallTimeoutRef.current) {
                      clearTimeout(endCallTimeoutRef.current);
                      endCallTimeoutRef.current = null;
                    }
                    stopConversation();
                  }
                }
              };
              sourceNode.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(sourceNode);
            }
            if (serverContent?.interrupted) {
              for (const s of sourcesRef.current.values()) {
                try {
                  s.stop();
                } catch (e) {}
                sourcesRef.current.delete(s);
              }
              nextStartTimeRef.current = 0;
              setIsAiSpeaking(false);
            }
          },
          onerror: (e: any) => {
            setError(e?.message || 'Connection failed. Please refresh.');
            stopConversation();
          },
          onclose: () => stopConversation(),
        },
      });
      const session = await sessionPromise;
      sessionRef.current = session;
      // Trigger AI to say hello first (user-friendly: no need to speak first)
      try {
        session.sendClientContent({
          turns: [{ role: 'user', parts: [{ text: CALL_CONNECTED_CUE }] }],
          turnComplete: true,
        });
      } catch (e) {
        console.warn('Initial greeting cue failed', e);
      }
    } catch (err: any) {
      const msg = err?.message || err?.toString?.() || 'Unknown error';
      setError(msg.includes('Permission') || msg.includes('microphone') ? 'Microphone access denied. Allow mic in browser.' : msg);
      setIsConnecting(false);
    }
  }, [stopConversation, selectedVoice]);

  useEffect(() => {
    return () => stopConversation();
  }, [stopConversation]);

  return {
    isActive,
    isConnecting,
    isPreviewing,
    isAiSpeaking,
    error,
    transcription,
    selectedVoice,
    setSelectedVoice,
    previewVoice,
    startConversation,
    stopConversation,
  };
}
