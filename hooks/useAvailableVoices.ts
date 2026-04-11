import { useEffect, useState } from 'react';
import { AVAILABLE_VOICES, type VoiceOption } from '@/constants';

/**
 * Client-side fetch of the enabled voice list from /api/voices.
 *
 * Falls back to the hardcoded AVAILABLE_VOICES when the request fails or
 * returns an empty list (fresh install, ElevenLabs key missing, etc.) so
 * the UI always has something to render.
 */
export function useAvailableVoices(): VoiceOption[] {
  const [voices, setVoices] = useState<VoiceOption[]>(AVAILABLE_VOICES);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/voices')
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: Array<{ id: string; label: string; description?: string }>) => {
        if (cancelled) return;
        if (Array.isArray(rows) && rows.length > 0) {
          setVoices(
            rows.map((r) => ({
              id: r.id,
              provider: '11labs' as const,
              label: r.label,
              description: r.description || '',
              previewText: '',
            })),
          );
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return voices;
}
