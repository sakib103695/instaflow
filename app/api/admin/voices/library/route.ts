import { NextResponse } from 'next/server';
import { resolveSecret } from '@/lib/secrets';
import { upstreamFetch } from '@/lib/upstream';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type MyVoice = {
  voice_id: string;
  name: string;
  description?: string | null;
  preview_url?: string | null;
  labels?: Record<string, string> | null;
  category?: string | null;
};

type SharedVoice = {
  voice_id: string;
  name: string;
  description?: string | null;
  preview_url?: string | null;
  accent?: string | null;
  gender?: string | null;
  age?: string | null;
  language?: string | null;
  use_case?: string | null;
  category?: string | null;
};

/**
 * GET /api/admin/voices/library?source=mine|shared&search=...&gender=...&language=...&accent=...&page=...
 *
 * Two sources:
 *   - source=mine   (default) — voices on the user's ElevenLabs account (~30).
 *                              /v1/voices endpoint.
 *   - source=shared         — the public Voice Library (thousands of voices)
 *                              via /v1/shared-voices with filter params.
 *
 * All API-key traffic stays server-side. The `previewUrl` returned is a CDN
 * mp3 the browser can play directly at no TTS cost.
 */
export async function GET(request: Request) {
  const apiKey = await resolveSecret('elevenlabsApiKey', 'ELEVENLABS_API_KEY');
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ElevenLabs API key is not set. Add it in /admin/settings.' },
      { status: 500 },
    );
  }

  const url = new URL(request.url);
  const source = url.searchParams.get('source') || 'mine';

  try {
    if (source === 'shared') {
      return await fetchSharedLibrary(apiKey, url.searchParams);
    }
    return await fetchMyVoices(apiKey);
  } catch (err) {
    console.error('Failed to fetch ElevenLabs library', err);
    return NextResponse.json({ error: 'Failed to fetch voice library' }, { status: 500 });
  }
}

async function fetchMyVoices(apiKey: string) {
  const res = await upstreamFetch('https://api.elevenlabs.io/v1/voices', {
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
  const json = (await res.json()) as { voices?: MyVoice[] };
  const voices = (json.voices ?? []).map((v) => ({
    id: v.voice_id,
    name: v.name,
    description: v.description ?? '',
    previewUrl: v.preview_url ?? '',
    category: v.category ?? '',
    labels: v.labels ?? {},
    source: 'mine' as const,
  }));
  return NextResponse.json({ voices, hasMore: false });
}

async function fetchSharedLibrary(apiKey: string, params: URLSearchParams) {
  // Map the admin UI's filter params straight through to the ElevenLabs
  // shared-voices endpoint. See
  // https://elevenlabs.io/docs/api-reference/voice-library/get-shared-voices
  const qs = new URLSearchParams();
  qs.set('page_size', params.get('pageSize') || '30');
  const page = Number(params.get('page') || '0');
  if (page > 0) qs.set('page', String(page));
  const passthrough = ['search', 'gender', 'accent', 'age', 'language', 'use_cases', 'category'];
  for (const k of passthrough) {
    const v = params.get(k);
    if (v) qs.set(k, v);
  }

  const res = await upstreamFetch(`https://api.elevenlabs.io/v1/shared-voices?${qs.toString()}`, {
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
  const json = (await res.json()) as { voices?: SharedVoice[]; has_more?: boolean };
  const voices = (json.voices ?? []).map((v) => ({
    id: v.voice_id,
    name: v.name,
    description: v.description ?? '',
    previewUrl: v.preview_url ?? '',
    category: v.category ?? 'shared',
    // Flatten the shared-voice fields into the same `labels` shape the UI
    // already knows how to render.
    labels: {
      ...(v.gender ? { gender: v.gender } : {}),
      ...(v.accent ? { accent: v.accent } : {}),
      ...(v.age ? { age: v.age } : {}),
      ...(v.language ? { language: v.language } : {}),
      ...(v.use_case ? { use_case: v.use_case } : {}),
    },
    source: 'shared' as const,
  }));
  return NextResponse.json({ voices, hasMore: !!json.has_more });
}
