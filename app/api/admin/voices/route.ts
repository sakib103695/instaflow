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
 * PUT /api/admin/voices — replace the curated voices collection.
 *
 * Whole-collection replace (instead of per-row CRUD) keeps the admin UI
 * dead simple: it loads the full list, edits in memory, and saves once.
 * The voices set is small (<100 rows) so the wire/IO cost is irrelevant.
 */
export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as { voices?: CuratedVoice[] };
    const voices = Array.isArray(body.voices) ? body.voices : null;
    if (!voices) {
      return NextResponse.json({ error: 'voices array required' }, { status: 400 });
    }
    const cleaned = voices
      .filter((v) => v && typeof v.id === 'string' && v.id.length > 0)
      .map((v) => ({
        id: v.id,
        label: String(v.label ?? '').trim() || v.id,
        description: String(v.description ?? '').trim(),
        previewUrl: String(v.previewUrl ?? '').trim(),
        enabled: !!v.enabled,
      }));

    const col = await getVoicesCollection();
    await col.deleteMany({});
    if (cleaned.length > 0) await col.insertMany(cleaned);
    return NextResponse.json({ ok: true, count: cleaned.length });
  } catch (err) {
    console.error('Failed to save curated voices', err);
    return NextResponse.json({ error: 'Failed to save voices' }, { status: 500 });
  }
}
