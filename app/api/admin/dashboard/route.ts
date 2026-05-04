import { NextResponse } from 'next/server';
import {
  getClientsCollection,
  getConversationsCollection,
  getVoicesCollection,
  getSetting,
} from '@/lib/mongodb';
import { resolveSecret } from '@/lib/secrets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/dashboard
 *
 * Single roll-up endpoint the dashboard page polls. Returns the headline
 * counters (clients by scrape status, conversations totals, voices,
 * default client) plus the most recent few items so the UI doesn't have
 * to call five different routes to render an overview.
 */
export async function GET() {
  try {
    const [clientsCol, conversationsCol, voicesCol] = await Promise.all([
      getClientsCollection(),
      getConversationsCollection(),
      getVoicesCollection(),
    ]);

    // Heal stuck rows so the dashboard reflects accurate state.
    const staleCutoff = new Date(Date.now() - 90 * 1000).toISOString();
    await clientsCol.updateMany(
      { scrapeStatus: 'in_progress', updatedAt: { $lt: staleCutoff } },
      { $set: { scrapeStatus: 'pending' } },
    );

    const since24h = new Date(Date.now() - 24 * 3600 * 1000);

    const [
      totalClients,
      pending,
      inProgress,
      failed,
      defaultClient,
      totalConversations,
      conversations24h,
      enabledVoices,
      recentClients,
      recentFailedClients,
    ] = await Promise.all([
      clientsCol.countDocuments({}),
      clientsCol.countDocuments({ scrapeStatus: 'pending' }),
      clientsCol.countDocuments({ scrapeStatus: 'in_progress' }),
      clientsCol.countDocuments({ scrapeStatus: 'failed' }),
      clientsCol.findOne(
        { isDefault: true },
        { projection: { slug: 1, name: 1 } },
      ),
      conversationsCol.countDocuments({}),
      conversationsCol.countDocuments({ createdAt: { $gte: since24h } }),
      voicesCol.countDocuments({ enabled: true }),
      clientsCol
        .find(
          {},
          { projection: { slug: 1, name: 1, scrapeStatus: 1, createdAt: 1 } },
        )
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray(),
      clientsCol
        .find(
          { scrapeStatus: 'failed' },
          { projection: { slug: 1, name: 1, scrapeError: 1, updatedAt: 1 } },
        )
        .sort({ updatedAt: -1 })
        .limit(5)
        .toArray(),
    ]);

    // Legacy clients without a scrapeStatus field count as done (fallback
    // applied here so dashboard math agrees with the clients list view).
    const done = totalClients - pending - inProgress - failed;

    // Health: which secrets are configured. The dashboard surfaces a banner
    // when something critical is missing so the user doesn't burn through
    // a queue only to see every row fail with "no key configured".
    const [orKey, geminiKey, elevenKey, orModel] = await Promise.all([
      resolveSecret('openrouterApiKey', 'OPENROUTER_API_KEY'),
      resolveSecret('geminiApiKey', 'GEMINI_API_KEY'),
      resolveSecret('elevenlabsApiKey', 'ELEVENLABS_API_KEY'),
      getSetting<string>('openrouterModel'),
    ]);
    const llmConfigured = !!(orKey && orModel?.trim()) || !!geminiKey;

    return NextResponse.json({
      clients: { total: totalClients, done, pending, inProgress, failed },
      defaultClient: defaultClient
        ? { slug: String(defaultClient.slug), name: String(defaultClient.name) }
        : null,
      conversations: { total: totalConversations, last24h: conversations24h },
      voices: { enabled: enabledVoices },
      recentClients: recentClients.map((c) => ({
        slug: String(c.slug),
        name: String(c.name),
        scrapeStatus: (c.scrapeStatus as string) ?? 'done',
        createdAt: c.createdAt,
      })),
      recentFailures: recentFailedClients.map((c) => ({
        slug: String(c.slug),
        name: String(c.name),
        scrapeError: c.scrapeError ? String(c.scrapeError) : '',
        updatedAt: c.updatedAt,
      })),
      health: {
        llmConfigured,
        openrouterKey: !!orKey,
        openrouterModel: !!(orModel && orModel.trim()),
        geminiKey: !!geminiKey,
        elevenlabsKey: !!elevenKey,
      },
    });
  } catch (err) {
    console.error('dashboard endpoint failed', err);
    return NextResponse.json({ error: 'Dashboard fetch failed' }, { status: 500 });
  }
}
