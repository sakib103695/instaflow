import { NextResponse } from 'next/server';
import { getClientsCollection } from '@/lib/mongodb';
import { scrapeSite } from '@/lib/scraper';
import { structureContextFromRawText } from '@/lib/structureContext';
import { composeSystemInstruction } from '@/lib/agentPrompt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Scraping + Gemini structuring can take 30-60s for big sites.
export const maxDuration = 120;

type RouteCtx = { params: Promise<{ slug: string }> };

/**
 * POST /api/clients/[slug]/scrape
 *
 * Body (optional): { domain?: string, manualText?: string }
 *
 * - If `manualText` is supplied, skip scraping and structure that text directly.
 * - Otherwise, scrape the client's domain (or the override domain), then run
 *   the structuring LLM, then recompose and persist the systemPrompt.
 *
 * This is the heavy onboarding endpoint — admin only.
 */
export async function POST(req: Request, { params }: RouteCtx) {
  try {
    const { slug } = await params;
    const body = await req.json().catch(() => ({}));
    const col = await getClientsCollection();
    const client = await col.findOne({ slug });
    if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const domain: string = body.domain || client.domain;
    const manualText: string | undefined = body.manualText;

    let rawText = '';
    let scrapeMeta = {
      pagesScraped: 0,
      method: 'manual' as 'direct' | 'jina' | 'manual',
      scrapedAt: new Date().toISOString(),
    };
    let scrapeError: string | undefined;

    if (manualText && manualText.trim().length > 0) {
      rawText = manualText.trim();
    } else {
      const scrape = await scrapeSite(domain);
      rawText = scrape.combined;
      scrapeMeta = {
        pagesScraped: scrape.pages.length,
        method: scrape.method,
        scrapedAt: new Date().toISOString(),
      };
      scrapeError = scrape.error;
      if (!rawText || rawText.trim().length < 100) {
        return NextResponse.json(
          {
            error:
              'Could not extract enough content from that site. Try the manual text option, or paste the website content directly.',
            scrapeError,
          },
          { status: 422 },
        );
      }
    }

    const structuredContext = await structureContextFromRawText(rawText);

    // Use the business name from the structured context if it found one, else fall back to the client name.
    const businessName = structuredContext.business.name || client.name;
    structuredContext.business.name = businessName;
    if (!structuredContext.business.website) structuredContext.business.website = domain;

    const greeting =
      client.greeting && !client.greeting.includes(client.name)
        ? client.greeting
        : `Hi, thanks for calling ${businessName} — this is ${structuredContext.personaName || 'Mia'}, how can I help you today?`;

    const systemPrompt = composeSystemInstruction(structuredContext, greeting);

    await col.updateOne(
      { slug },
      {
        $set: {
          domain,
          rawScrape: rawText,
          scrapeMeta,
          structuredContext,
          systemPrompt,
          greeting,
          updatedAt: new Date().toISOString(),
        },
      },
    );

    return NextResponse.json({
      ok: true,
      pagesScraped: scrapeMeta.pagesScraped,
      method: scrapeMeta.method,
      structuredContext,
      systemPrompt,
      greeting,
    });
  } catch (err) {
    console.error('Error in scrape pipeline', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Scrape pipeline failed' },
      { status: 500 },
    );
  }
}
