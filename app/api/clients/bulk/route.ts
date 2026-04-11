import { NextResponse } from 'next/server';
import { getClientsCollection } from '@/lib/mongodb';
import { EMPTY_STRUCTURED_CONTEXT, slugify } from '@/lib/clientTypes';
import { composeSystemInstruction } from '@/lib/agentPrompt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type BulkRow = Record<string, unknown>;

type BulkRequest = {
  rows: BulkRow[];
  domainColumn: string;
  nameColumn?: string;
};

/**
 * POST /api/clients/bulk
 *
 * Bulk-create client shells from parsed Excel rows. Slug is derived from
 * the domain column. Each row becomes a client doc with scrapeStatus
 * 'pending' — the actual scrape happens later via /scrape-pending so this
 * endpoint stays under any HTTP timeout no matter how many rows arrive.
 *
 * Response:
 *   { created, skipped, errors: [{row, reason}] }
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BulkRequest;
    const rows = Array.isArray(body.rows) ? body.rows : null;
    const domainColumn = String(body.domainColumn || '').trim();
    const nameColumn = body.nameColumn ? String(body.nameColumn).trim() : '';

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'rows array required' }, { status: 400 });
    }
    if (!domainColumn) {
      return NextResponse.json({ error: 'domainColumn required' }, { status: 400 });
    }

    const col = await getClientsCollection();

    // Pre-load existing slugs once so we can de-dupe in O(1) instead of
    // hitting Mongo per row.
    const existing = await col.find({}, { projection: { slug: 1 } }).toArray();
    const usedSlugs = new Set<string>(existing.map((d) => String(d.slug)));

    const errors: Array<{ row: number; reason: string }> = [];
    const docs: Record<string, unknown>[] = [];

    rows.forEach((row, idx) => {
      const rawDomain = String(row[domainColumn] ?? '').trim();
      if (!rawDomain) {
        errors.push({ row: idx + 1, reason: 'empty domain' });
        return;
      }

      // Slug from domain. Add a numeric suffix on collision so we can ingest
      // the same domain twice without crashing the whole batch.
      const baseSlug = slugify(rawDomain) || `client-${idx + 1}`;
      let slug = baseSlug;
      let n = 1;
      while (usedSlugs.has(slug)) {
        n += 1;
        slug = `${baseSlug}-${n}`;
      }
      usedSlugs.add(slug);

      // Display name: explicit name column if provided, else fall back to
      // a humanized version of the domain (e.g. "Glow Lift").
      const explicitName = nameColumn ? String(row[nameColumn] ?? '').trim() : '';
      const name =
        explicitName ||
        baseSlug
          .split('-')
          .filter(Boolean)
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
          .join(' ') ||
        rawDomain;

      const now = new Date().toISOString();
      const greeting = `Hi, thanks for calling ${name} — this is Mia, how can I help you today?`;
      const structuredContext = {
        ...EMPTY_STRUCTURED_CONTEXT,
        business: { ...EMPTY_STRUCTURED_CONTEXT.business, name, website: rawDomain },
      };

      docs.push({
        slug,
        name,
        domain: rawDomain,
        voiceId: '',
        isDefault: false,
        scrapeStatus: 'pending',
        rawScrape: '',
        scrapeMeta: { pagesScraped: 0, method: 'manual' as const, scrapedAt: null },
        structuredContext,
        systemPrompt: composeSystemInstruction(structuredContext, greeting),
        greeting,
        // Stash the original spreadsheet row so the export endpoint can echo
        // every original column back to the user later.
        sourceRow: row,
        createdAt: now,
        updatedAt: now,
      });
    });

    let created = 0;
    if (docs.length > 0) {
      const result = await col.insertMany(docs, { ordered: false });
      created = result.insertedCount;
    }

    return NextResponse.json({
      created,
      skipped: errors.length,
      errors: errors.slice(0, 50),
    });
  } catch (err) {
    console.error('Bulk create failed', err);
    return NextResponse.json({ error: 'Bulk create failed' }, { status: 500 });
  }
}
