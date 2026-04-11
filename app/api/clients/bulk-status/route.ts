import { NextResponse } from 'next/server';
import { getClientsCollection } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/clients/bulk-status
 * Aggregate counts the bulk admin page polls while scraping is in flight.
 */
export async function GET() {
  try {
    const col = await getClientsCollection();
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
