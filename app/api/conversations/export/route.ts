import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getConversationsCollection, getClientsCollection } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/conversations/export
 *
 * Streams an .xlsx with one row per conversation. Columns:
 *   - client_name, client_slug
 *   - started_at, ended_at, duration_sec
 *   - voice
 *   - messages (count)
 *   - transcript (full text, agent/user turns joined by newlines)
 */
export async function GET() {
  try {
    const col = await getConversationsCollection();
    const docs = await col.find({}).sort({ createdAt: -1 }).limit(5000).toArray();

    // Slug → name lookup.
    const slugs = [
      ...new Set(
        docs
          .map((d) => (d.meta as Record<string, unknown>)?.clientSlug)
          .filter((s): s is string => typeof s === 'string' && s.length > 0),
      ),
    ];
    let clientMap = new Map<string, string>();
    if (slugs.length > 0) {
      const clientsCol = await getClientsCollection();
      const clients = await clientsCol
        .find({ slug: { $in: slugs } }, { projection: { slug: 1, name: 1 } })
        .toArray();
      clientMap = new Map(clients.map((c) => [String(c.slug), String(c.name)]));
    }

    const rows = docs.map((d) => {
      const slug = (d.meta as Record<string, unknown>)?.clientSlug as string | undefined;
      const started = d.startedAt ? new Date(d.startedAt) : null;
      const ended = d.endedAt ? new Date(d.endedAt) : null;
      const durationSec =
        started && ended ? Math.round((ended.getTime() - started.getTime()) / 1000) : null;
      const transcript = Array.isArray(d.transcript)
        ? d.transcript
            .map((t: { role?: string; text?: string } | string) => {
              if (typeof t === 'string') return `Agent: ${t}`;
              return `${t.role === 'user' ? 'User' : 'Agent'}: ${t.text || ''}`;
            })
            .join('\n')
        : '';

      return {
        client_name: (slug && clientMap.get(slug)) || '',
        client_slug: slug || '',
        started_at: started ? started.toISOString() : '',
        ended_at: ended ? ended.toISOString() : '',
        duration_sec: durationSec ?? '',
        voice: d.selectedVoice?.label || '',
        messages: Array.isArray(d.transcript) ? d.transcript.length : 0,
        transcript,
      };
    });

    const sheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, 'conversations');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="instaflow-conversations-${new Date().toISOString().slice(0, 10)}.xlsx"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('Conversations export failed', err);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
