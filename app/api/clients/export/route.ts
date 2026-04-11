import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getClientsCollection } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/clients/export?base=https://flow.instaquirk.tech
 *
 * Streams an .xlsx of every client. Each row is the original spreadsheet
 * row (so the user gets the same columns they uploaded) plus three
 * server-added columns:
 *   - slug          : the URL slug we generated
 *   - unique_url    : the deep link to that client's voice agent
 *   - scrape_status : pending / done / failed
 *
 * The base URL defaults to the request origin, so this works the same
 * locally and in production without configuration.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const base = (url.searchParams.get('base') || `${url.protocol}//${url.host}`).replace(/\/$/, '');

    const col = await getClientsCollection();
    const docs = await col.find({}).sort({ createdAt: 1 }).toArray();

    const rows = docs.map((d) => {
      // sourceRow holds the user's original Excel columns; legacy clients
      // (created via the single-add form) won't have one — fall back to
      // the canonical fields.
      const original =
        d.sourceRow && typeof d.sourceRow === 'object' ? (d.sourceRow as Record<string, unknown>) : { domain: d.domain, name: d.name };
      return {
        ...original,
        slug: d.slug,
        unique_url: `${base}/?client=${d.slug}`,
        scrape_status: d.scrapeStatus ?? 'done',
      };
    });

    const sheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, 'clients');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="instaflow-clients-${new Date().toISOString().slice(0, 10)}.xlsx"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('Export failed', err);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
