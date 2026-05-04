import { NextResponse } from 'next/server';
import { getClientsCollection } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Action = 'rescrape' | 'delete';

type BulkActionRequest = {
  slugs?: unknown;
  action?: unknown;
};

/**
 * POST /api/clients/bulk-action
 *
 * Run an action on a set of clients selected from the admin clients
 * table. Saves the user from re-uploading a spreadsheet just to retry
 * the rows that failed.
 *
 * - rescrape: flip scrapeStatus to 'pending' so the next call to
 *   /api/clients/scrape-pending picks them up. Idempotent — safe even
 *   on already-pending or done clients.
 * - delete: hard-delete every selected client. The default client is
 *   refused (admin must promote another client first) so the homepage
 *   never breaks.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BulkActionRequest;
    const slugs = Array.isArray(body.slugs)
      ? (body.slugs as unknown[]).filter((s): s is string => typeof s === 'string' && s.length > 0)
      : [];
    const action = body.action as Action;
    if (slugs.length === 0) {
      return NextResponse.json({ error: 'slugs array required' }, { status: 400 });
    }
    if (action !== 'rescrape' && action !== 'delete') {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    const col = await getClientsCollection();
    const now = new Date().toISOString();

    if (action === 'rescrape') {
      const res = await col.updateMany(
        { slug: { $in: slugs } },
        {
          $set: {
            scrapeStatus: 'pending',
            scrapeError: '',
            updatedAt: now,
          },
        },
      );
      return NextResponse.json({ ok: true, requeued: res.modifiedCount });
    }

    // action === 'delete'
    // Refuse to delete the current default — would leave the homepage
    // pointing at nothing.
    const defaultDoc = await col.findOne(
      { slug: { $in: slugs }, isDefault: true },
      { projection: { slug: 1, name: 1 } },
    );
    if (defaultDoc) {
      return NextResponse.json(
        {
          error: `Cannot delete the default client "${defaultDoc.name}". Promote another client to default first.`,
          defaultSlug: String(defaultDoc.slug),
        },
        { status: 400 },
      );
    }
    const res = await col.deleteMany({ slug: { $in: slugs }, isDefault: { $ne: true } });
    return NextResponse.json({ ok: true, deleted: res.deletedCount });
  } catch (err) {
    console.error('bulk-action failed', err);
    return NextResponse.json({ error: 'Bulk action failed' }, { status: 500 });
  }
}
