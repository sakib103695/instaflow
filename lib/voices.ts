import { getVoicesCollection } from '@/lib/mongodb';
import { AVAILABLE_VOICES, type VoiceOption } from '@/constants';

/**
 * Loads the voice list the public/admin UI should show.
 *
 * Priority:
 *   1. Enabled voices from the Mongo `voices` collection (curated in admin).
 *   2. If none exist or Mongo is unreachable, fall back to the hardcoded
 *      AVAILABLE_VOICES so the site never ships with an empty picker.
 *
 * Returns the same VoiceOption shape the client components already expect.
 * Curated rows default to provider='11labs' (the admin voices page is
 * ElevenLabs-only).
 */
export async function loadVoicesForPicker(): Promise<VoiceOption[]> {
  try {
    const col = await getVoicesCollection();
    const docs = await col.find({ enabled: true }).sort({ label: 1 }).toArray();
    if (docs.length === 0) return AVAILABLE_VOICES;
    return docs.map((d) => ({
      id: String(d.id),
      provider: '11labs' as const,
      label: String(d.label || d.id),
      description: String(d.description || ''),
      previewText: '',
    }));
  } catch (err) {
    console.warn('loadVoicesForPicker: falling back to hardcoded list', err);
    return AVAILABLE_VOICES;
  }
}
