import { NextResponse } from 'next/server';
import { getVoicesCollection } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type CuratedVoice = {
  id: string;
  label: string;
  description: string;
  previewUrl: string;
  enabled: boolean;
};

/** GET /api/admin/voices — list curated voices saved in Mongo. */
export async function GET() {
  try {
    const col = await getVoicesCollection();
    const docs = await col.find({}).sort({ label: 1 }).toArray();
    return NextResponse.json(
      docs.map((d) => ({
        id: d.id,
        label: d.label,
        description: d.description ?? '',
        previewUrl: d.previewUrl ?? '',
        enabled: !!d.enabled,
      })),
    );
  } catch (err) {
    console.error('Failed to list curated voices', err);
    return NextResponse.json({ error: 'Failed to list voices' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/voices — upsert partial set of voices.
 *
 * MERGE semantics (not replace): voices in the payload are upserted by id;
 * voices already in the collection but NOT in the payload are untouched.
 *
 * This is crucial now that the UI lets admins browse the full ElevenLabs
 * Voice Library ("shared" source) — a user enabling a shared voice
 * shouldn't wipe out the enabled voices they picked from "My Voices"
 * earlier.
 *
 * To REMOVE a voice from the curated list, set `remove: true` on that
 * entry (or call DELETE with the ids — future work).
 */
export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as {
      voices?: Array<CuratedVoice & { remove?: boolean }>;
    };
    const voices = Array.isArray(body.voices) ? body.voices : null;
    if (!voices) {
      return NextResponse.json({ error: 'voices array required' }, { status: 400 });
    }
    const col = await getVoicesCollection();

    let upserted = 0;
    let removed = 0;
    for (const v of voices) {
      if (!v || typeof v.id !== 'string' || v.id.length === 0) continue;
      if (v.remove) {
        const res = await col.deleteOne({ id: v.id });
        removed += res.deletedCount ?? 0;
        continue;
      }
      const doc = {
        id: v.id,
        label: String(v.label ?? '').trim() || v.id,
        description: String(v.description ?? '').trim(),
        previewUrl: String(v.previewUrl ?? '').trim(),
        enabled: !!v.enabled,
      };
      await col.updateOne({ id: v.id }, { $set: doc }, { upsert: true });
      upserted += 1;
    }
    return NextResponse.json({ ok: true, upserted, removed });
  } catch (err) {
    console.error('Failed to save curated voices', err);
    return NextResponse.json({ error: 'Failed to save voices' }, { status: 500 });
  }
}
