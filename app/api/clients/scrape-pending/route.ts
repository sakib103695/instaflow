import { NextResponse } from 'next/server';
import { getClientsCollection } from '@/lib/mongodb';
import { scrapeSite } from '@/lib/scraper';
import { structureContextFromRawText } from '@/lib/structureContext';
import { composeSystemInstructionAsync } from '@/lib/agentPrompt';
import { defaultGreeting, type Language } from '@/lib/clientTypes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/**
 * POST /api/clients/scrape-pending
 *
 * Pulls ONE pending client and runs the full scrape + structure pipeline
 * on it. Single-row design on purpose: keeps each request well under any
 * HTTP timeout, lets the admin UI render a clean progress bar by polling
 * in a loop, and recovers cleanly from container restarts (still-pending
 * rows just get picked up next time).
 *
 * Response when work was done:
 *   { processed: 1, slug, name, status: 'done' | 'failed', remaining }
 * Response when nothing pending:
 *   { processed: 0, remaining: 0 }
 */
export async function POST() {
  try {
    const col = await getClientsCollection();

    // Self-heal: any row stuck in `in_progress` for more than 5 minutes means
    // the previous scrape crashed mid-flight. Revert it to pending so a new
    // poll picks it up instead of leaving the queue jammed.
    const staleCutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    await col.updateMany(
      { scrapeStatus: 'in_progress', updatedAt: { $lt: staleCutoff } },
      { $set: { scrapeStatus: 'pending' } },
    );

    // findOneAndUpdate atomically claims a row so two concurrent pollers
    // can't grab the same one.
    const claimed = await col.findOneAndUpdate(
      { scrapeStatus: 'pending' },
      { $set: { scrapeStatus: 'in_progress', updatedAt: new Date().toISOString() } },
      { returnDocument: 'after' },
    );

    if (!claimed) {
      const remaining = await col.countDocuments({ scrapeStatus: 'pending' });
      return NextResponse.json({ processed: 0, remaining });
    }

    const slug = String(claimed.slug);
    const name = String(claimed.name);
    const domain = String(claimed.domain);

    try {
      const scrape = await scrapeSite(domain);
      const rawText = scrape.combined;
      if (!rawText || rawText.trim().length < 100) {
        await col.updateOne(
          { slug },
          {
            $set: {
              scrapeStatus: 'failed',
              scrapeError: scrape.error || 'not enough content',
              updatedAt: new Date().toISOString(),
            },
          },
        );
        const remaining = await col.countDocuments({ scrapeStatus: 'pending' });
        return NextResponse.json({ processed: 1, slug, name, status: 'failed', remaining });
      }

      const structuredContext = await structureContextFromRawText(rawText);
      const businessName = structuredContext.business.name || name;
      structuredContext.business.name = businessName;
      if (!structuredContext.business.website) structuredContext.business.website = domain;

      const languages = (Array.isArray(claimed.languages) && claimed.languages.length > 0
        ? (claimed.languages as Language[])
        : ['en']) as Language[];
      const personaName = structuredContext.personaName || 'Mia';
      const greeting = defaultGreeting(businessName, languages, personaName);
      const systemPrompt = await composeSystemInstructionAsync(structuredContext, greeting, languages);

      await col.updateOne(
        { slug },
        {
          $set: {
            rawScrape: rawText,
            scrapeMeta: {
              pagesScraped: scrape.pages.length,
              method: scrape.method,
              scrapedAt: new Date().toISOString(),
            },
            structuredContext,
            systemPrompt,
            greeting,
            scrapeStatus: 'done',
            scrapeError: '',
            updatedAt: new Date().toISOString(),
          },
        },
      );

      const remaining = await col.countDocuments({ scrapeStatus: 'pending' });
      return NextResponse.json({ processed: 1, slug, name, status: 'done', remaining });
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'scrape failed';
      await col.updateOne(
        { slug },
        {
          $set: {
            scrapeStatus: 'failed',
            scrapeError: reason.slice(0, 500),
            updatedAt: new Date().toISOString(),
          },
        },
      );
      const remaining = await col.countDocuments({ scrapeStatus: 'pending' });
      return NextResponse.json({ processed: 1, slug, name, status: 'failed', remaining });
    }
  } catch (err) {
    console.error('scrape-pending failed', err);
    return NextResponse.json({ error: 'scrape-pending failed' }, { status: 500 });
  }
}
