import { NextResponse } from 'next/server';
import { getClientsCollection } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/clients/bulk-status
 * Aggregate counts the bulk admin page polls while scraping is in flight.
 *
 * Also heals any rows stuck in `in_progress` for more than 90s. This means
 * the bulk page resurrects orphaned rows just by being open — the user
 * doesn't need to remember to re-click "Scrape pending" to unblock the
 * queue after a crashed handler or a disconnected request.
 */
export async function GET() {
  try {
    const col = await getClientsCollection();

    const staleCutoff = new Date(Date.now() - 90 * 1000).toISOString();
    await col.updateMany(
      { scrapeStatus: 'in_progress', updatedAt: { $lt: staleCutoff } },
      { $set: { scrapeStatus: 'pending' } },
    );

    const [pending, inProgress, failed, total] = await Promise.all([
      col.countDocuments({ scrapeStatus: 'pending' }),
      col.countDocuments({ scrapeStatus: 'in_progress' }),
      col.countDocuments({ scrapeStatus: 'failed' }),
      col.countDocuments({}),
    ]);
    const done = total - pending - inProgress - failed;
    return NextResponse.json({ total, done, pending, inProgress, failed });
  } catch (err) {
    console.error('bulk-status failed', err);
    return NextResponse.json({ error: 'bulk-status failed' }, { status: 500 });
  }
}
