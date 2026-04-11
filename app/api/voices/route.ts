import { NextResponse } from 'next/server';
import { getVoicesCollection } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/voices — public list of enabled voices.
 *
 * Used by the public hero / demo widgets to populate the voice picker.
 * Only returns enabled voices and only the fields the client needs.
 */
export async function GET() {
  try {
    const col = await getVoicesCollection();
    const docs = await col.find({ enabled: true }).sort({ label: 1 }).toArray();
    return NextResponse.json(
      docs.map((d) => ({
        id: d.id,
        label: d.label,
        description: d.description ?? '',
      })),
    );
  } catch (err) {
    console.error('Failed to list public voices', err);
    return NextResponse.json([], { status: 200 });
  }
}
