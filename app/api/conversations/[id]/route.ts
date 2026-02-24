import { NextResponse } from 'next/server';
import { getConversationsCollection, ObjectId } from '@/lib/mongodb';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const col = await getConversationsCollection();
    const doc = await col.findOne({ _id: new ObjectId(id) });
    if (!doc) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: doc._id.toString(),
      transcript: doc.transcript ?? [],
      selectedVoice: doc.selectedVoice ?? null,
      startedAt: doc.startedAt ?? null,
      endedAt: doc.endedAt ?? null,
      createdAt: doc.createdAt ?? null,
      meta: doc.meta ?? {},
    });
  } catch (err) {
    console.error('Error fetching conversation', err);
    return NextResponse.json(
      { error: 'Failed to load conversation' },
      { status: 500 }
    );
  }
}
