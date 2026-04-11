import { NextResponse } from 'next/server';
import { getSetting, setSetting } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/settings — read the small set of runtime-tunable settings.
 * PUT /api/admin/settings — partial update; only the keys present in the
 * body are touched, so the page can save one field at a time.
 */
const KNOWN_KEYS = [
  'openrouterModel',
  'openrouterApiKey',
  'elevenlabsApiKey',
  'geminiApiKey',
] as const;

/** Keys whose value is a secret — GET returns a mask instead of the raw string. */
const SECRET_KEYS = new Set<string>(['openrouterApiKey', 'elevenlabsApiKey', 'geminiApiKey']);

function mask(value: string | null): string {
  if (!value) return '';
  if (value.length <= 8) return '••••';
  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}

export async function GET() {
  try {
    const entries = await Promise.all(
      KNOWN_KEYS.map(async (k) => {
        const v = await getSetting<string>(k);
        if (SECRET_KEYS.has(k)) {
          return [
            k,
            { configured: !!v, masked: mask(v) },
          ] as const;
        }
        return [k, v] as const;
      }),
    );
    return NextResponse.json(Object.fromEntries(entries));
  } catch (err) {
    console.error('Failed to read settings', err);
    return NextResponse.json({ error: 'Failed to read settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const updated: Record<string, unknown> = {};
    for (const key of KNOWN_KEYS) {
      if (key in body) {
        const value = body[key];
        if (value === null || value === '') {
          await setSetting(key, null);
          updated[key] = null;
        } else if (typeof value === 'string') {
          await setSetting(key, value);
          updated[key] = value;
        }
      }
    }
    return NextResponse.json({ ok: true, updated });
  } catch (err) {
    console.error('Failed to update settings', err);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
