import { NextResponse } from 'next/server';
import { getConversationsCollection } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const col = await getConversationsCollection();
    const docs = await col
      .find(
        {},
        {
          projection: {
            transcript: 1,
            selectedVoice: 1,
            startedAt: 1,
            endedAt: 1,
            createdAt: 1,
          },
        }
      )
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray();

    const result = docs.map((d) => ({
      id: d._id.toString(),
      startedAt: d.startedAt || d.createdAt,
      endedAt: d.endedAt || null,
      voiceLabel: d.selectedVoice?.label ?? null,
      messageCount: Array.isArray(d.transcript) ? d.transcript.length : 0,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error('Error listing conversations', err);
    return NextResponse.json(
      { error: 'Failed to list conversations' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const col = await getConversationsCollection();
    const now = new Date();
    const {
      transcript = [],
      selectedVoice = null,
      startedAt,
      endedAt,
      meta = {},
    } = body;

    if (!Array.isArray(transcript) || transcript.length === 0) {
      return NextResponse.json(
        { error: 'transcript must be a non-empty array' },
        { status: 400 }
      );
    }

    const normalizedTranscript = transcript.map((entry: unknown) => {
      if (typeof entry === 'string') return { role: 'agent' as const, text: entry };
      const e = entry as { role?: string; text?: string };
      return { role: (e.role === 'user' ? 'user' : 'agent') as 'user' | 'agent', text: String(e.text ?? '') };
    });

    const doc = {
      transcript: normalizedTranscript,
      selectedVoice,
      startedAt: startedAt ? new Date(startedAt) : now,
      endedAt: endedAt ? new Date(endedAt) : now,
      meta,
      createdAt: now,
    };

    const { insertedId } = await col.insertOne(doc);
    return NextResponse.json({ id: insertedId.toString() }, { status: 201 });
  } catch (err) {
    console.error('Error inserting conversation', err);
    return NextResponse.json(
      { error: 'Failed to save conversation' },
      { status: 500 }
    );
  }
}
