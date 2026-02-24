import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { GEMINI_API_KEY, INSTAFLOW_SYSTEM_INSTRUCTION, AVAILABLE_VOICES, END_CALL_SIGNAL, CALL_CONNECTED_CUE } from '../constants';
import { decode, decodeAudioData, createBlob } from '../services/audioUtils';

export function useVoiceAgent() {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string[]>([]);
  const [selectedVoice, setSelectedVoice] = useState(AVAILABLE_VOICES[0]);

  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  const stopConversation = useCallback(() => {
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
  }, []);

  const previewVoice = useCallback(async () => {
    if (isPreviewing || isActive) return;
    try {
      setIsPreviewing(true);
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: [{ parts: [{ text: selectedVoice.previewText }] }],
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
      setError(msg.includes('API') || msg.includes('401') ? 'Invalid or missing API key. Check .env.local' : msg);
    }
  }, [isPreviewing, isActive, selectedVoice]);

  const startConversation = useCallback(async () => {
    try {
      setError(null);
      setTranscription([]);
      setIsConnecting(true);

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
            if (message.serverContent?.outputTranscription) {
              let text = message.serverContent.outputTranscription.text;
              let shouldEndCall = false;

              if (text.includes(END_CALL_SIGNAL)) {
                shouldEndCall = true;
                text = text.replace(END_CALL_SIGNAL, '').trim();
              }

              setTranscription((prev) => [...prev.slice(-8), `${selectedVoice.label}: ${text}`]);

              if (shouldEndCall) {
                setTimeout(() => stopConversation(), 1000);
              }
            }
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputCtx) {
              setIsAiSpeaking(true);
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
              const sourceNode = outputCtx.createBufferSource();
              sourceNode.buffer = audioBuffer;
              sourceNode.connect(outputCtx.destination);
              sourceNode.onended = () => {
                sourcesRef.current.delete(sourceNode);
                if (sourcesRef.current.size === 0) setIsAiSpeaking(false);
              };
              sourceNode.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(sourceNode);
            }
            if (message.serverContent?.interrupted) {
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
