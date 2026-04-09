import { NextResponse } from 'next/server';
import { getClientsCollection } from '@/lib/mongodb';
import { EMPTY_STRUCTURED_CONTEXT, slugify } from '@/lib/clientTypes';
import { composeSystemInstruction } from '@/lib/agentPrompt';

export const runtime = 'nodejs';

/** GET /api/clients — list all clients (admin only). */
export async function GET() {
  try {
    const col = await getClientsCollection();
    const docs = await col
      .find(
        {},
        {
          projection: {
            slug: 1,
            name: 1,
            domain: 1,
            voiceId: 1,
            isDefault: 1,
            createdAt: 1,
            updatedAt: 1,
            'structuredContext.business.name': 1,
          },
        },
      )
      .sort({ createdAt: -1 })
      .limit(500)
      .toArray();

    return NextResponse.json(
      docs.map((d) => ({
        slug: d.slug,
        name: d.name,
        domain: d.domain,
        voiceId: d.voiceId,
        isDefault: !!d.isDefault,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      })),
    );
  } catch (err) {
    console.error('Error listing clients', err);
    return NextResponse.json({ error: 'Failed to list clients' }, { status: 500 });
  }
}

/** POST /api/clients — create an empty client shell (scraping happens separately). */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, domain, voiceId = 'Kore' } = body ?? {};

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }
    if (!domain || typeof domain !== 'string') {
      return NextResponse.json({ error: 'domain is required' }, { status: 400 });
    }

    const col = await getClientsCollection();

    // Generate a unique slug from the name (fall back to domain).
    const baseSlug = slugify(name) || slugify(domain) || 'client';
    let slug = baseSlug;
    let i = 1;
    while (await col.findOne({ slug })) {
      i += 1;
      slug = `${baseSlug}-${i}`;
    }

    // First client in the collection becomes the default automatically.
    const existingCount = await col.countDocuments({});
    const isDefault = existingCount === 0;

    const now = new Date().toISOString();
    const greeting = `Hi, thanks for calling ${name} — this is Mia, how can I help you today?`;
    const doc = {
      slug,
      name,
      domain,
      voiceId,
      isDefault,
      rawScrape: '',
      scrapeMeta: { pagesScraped: 0, method: 'manual' as const, scrapedAt: null },
      structuredContext: {
        ...EMPTY_STRUCTURED_CONTEXT,
        business: { ...EMPTY_STRUCTURED_CONTEXT.business, name, website: domain },
      },
      systemPrompt: composeSystemInstruction(
        { ...EMPTY_STRUCTURED_CONTEXT, business: { ...EMPTY_STRUCTURED_CONTEXT.business, name, website: domain } },
        greeting,
      ),
      greeting,
      createdAt: now,
      updatedAt: now,
    };

    await col.insertOne(doc);
    return NextResponse.json({ slug }, { status: 201 });
  } catch (err) {
    console.error('Error creating client', err);
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}
