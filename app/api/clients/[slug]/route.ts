import { NextResponse } from 'next/server';
import { getClientsCollection } from '@/lib/mongodb';
import { composeSystemInstruction } from '@/lib/agentPrompt';
import type { StructuredContext } from '@/lib/clientTypes';

export const runtime = 'nodejs';

type RouteCtx = { params: Promise<{ slug: string }> };

/** GET /api/clients/[slug] — fetch a single client by slug. */
export async function GET(_req: Request, { params }: RouteCtx) {
  try {
    const { slug } = await params;
    const col = await getClientsCollection();
    const doc = await col.findOne({ slug });
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const { _id, ...rest } = doc;
    return NextResponse.json(rest);
  } catch (err) {
    console.error('Error fetching client', err);
    return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 });
  }
}

/**
 * PATCH /api/clients/[slug] — update editable fields. If structuredContext or
 * greeting changes, recompose the systemPrompt server-side so the agent always
 * uses a consistent, up-to-date prompt.
 */
export async function PATCH(req: Request, { params }: RouteCtx) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const col = await getClientsCollection();
    const existing = await col.findOne({ slug });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const allowed: Record<string, unknown> = {};
    if (typeof body.name === 'string') allowed.name = body.name;
    if (typeof body.domain === 'string') allowed.domain = body.domain;
    if (typeof body.voiceId === 'string') allowed.voiceId = body.voiceId;
    if (typeof body.greeting === 'string') allowed.greeting = body.greeting;
    if (body.structuredContext && typeof body.structuredContext === 'object') {
      allowed.structuredContext = body.structuredContext;
    }
    // Promote this client to default. Mutex: unset isDefault on every other
    // client first so there's only ever one default at a time.
    if (body.isDefault === true) {
      await col.updateMany(
        { slug: { $ne: slug }, isDefault: true },
        { $set: { isDefault: false } },
      );
      allowed.isDefault = true;
    }
    // Allow manual prompt override (advanced users).
    let systemPrompt: string | undefined;
    if (typeof body.systemPrompt === 'string' && body.systemPrompt.trim()) {
      systemPrompt = body.systemPrompt;
    } else if (allowed.structuredContext || allowed.greeting) {
      systemPrompt = composeSystemInstruction(
        (allowed.structuredContext as StructuredContext) ?? existing.structuredContext,
        (allowed.greeting as string) ?? existing.greeting,
      );
    }
    if (systemPrompt) allowed.systemPrompt = systemPrompt;
    allowed.updatedAt = new Date().toISOString();

    await col.updateOne({ slug }, { $set: allowed });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error updating client', err);
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}

/**
 * DELETE /api/clients/[slug]
 *
 * Refuses to delete the default client. To remove the current default, the
 * admin must first promote another client via PATCH { isDefault: true }.
 */
export async function DELETE(_req: Request, { params }: RouteCtx) {
  try {
    const { slug } = await params;
    const col = await getClientsCollection();
    const existing = await col.findOne({ slug });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (existing.isDefault) {
      return NextResponse.json(
        { error: 'Cannot delete the default client. Promote another client to default first.' },
        { status: 409 },
      );
    }
    await col.deleteOne({ slug });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error deleting client', err);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}
