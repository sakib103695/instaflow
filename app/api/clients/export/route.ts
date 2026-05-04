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
 * Resolves the public origin from forwarded headers (nginx sets these),
 * falling back to the request URL (only useful in local dev).
 */
function publicBaseFromRequest(request: Request): string {
  const url = new URL(request.url);
  const override = url.searchParams.get('base');
  if (override) return override.replace(/\/$/, '');
  // X-Forwarded-Host wins because the local request.url reports
  // 127.0.0.1:3000 when behind nginx.
  const headers = request.headers;
  const fwdHost = headers.get('x-forwarded-host') || headers.get('host');
  const fwdProto = headers.get('x-forwarded-proto') || url.protocol.replace(/:$/, '');
  if (fwdHost) return `${fwdProto}://${fwdHost}`.replace(/\/$/, '');
  return `${url.protocol}//${url.host}`.replace(/\/$/, '');
}

export async function GET(request: Request) {
  try {
    const base = publicBaseFromRequest(request);

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
