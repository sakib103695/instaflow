import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ElevenLabsVoice = {
  voice_id: string;
  name: string;
  description?: string | null;
  preview_url?: string | null;
  labels?: Record<string, string> | null;
  category?: string | null;
};

/**
 * GET /api/admin/voices/library
 *
 * Proxies the ElevenLabs `/v1/voices` endpoint so the API key never reaches
 * the browser. Returns every voice the account has access to (premade +
 * cloned + designed). Each voice includes a public `previewUrl` (CDN-hosted
 * mp3 sample) that the admin UI plays directly — that doesn't consume any
 * TTS character quota.
 */
export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  if (!apiKey || apiKey === 'REPLACE_ME') {
    return NextResponse.json(
      { error: 'ELEVENLABS_API_KEY is not configured on the server.' },
      { status: 500 },
    );
  }

  try {
    const res = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': apiKey, accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `ElevenLabs returned ${res.status}: ${text.slice(0, 200)}` },
        { status: 502 },
      );
    }
    const json = (await res.json()) as { voices?: ElevenLabsVoice[] };
    const voices = (json.voices ?? []).map((v) => ({
      id: v.voice_id,
      name: v.name,
      description: v.description ?? '',
      previewUrl: v.preview_url ?? '',
      category: v.category ?? '',
      labels: v.labels ?? {},
    }));
    return NextResponse.json({ voices });
  } catch (err) {
    console.error('Failed to fetch ElevenLabs library', err);
    return NextResponse.json({ error: 'Failed to fetch voice library' }, { status: 500 });
  }
}
