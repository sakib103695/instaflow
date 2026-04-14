/**
 * Lightweight web scraper for client onboarding.
 *
 * Strategy:
 *   1. Normalize the URL.
 *   2. Use Jina Reader (https://r.jina.ai/<url>) as the primary fetcher — it
 *      executes JS, follows redirects, strips chrome, and returns clean
 *      markdown. Free tier is generous and rate-limit-friendly for our use.
 *   3. Discover internal links from the homepage markdown, prioritize the
 *      pages a customer-support agent actually needs (about, services,
 *      pricing, faq, contact, hours, book), and fetch up to MAX_PAGES of them.
 *   4. Concatenate everything with section headers so the LLM structuring
 *      step has clear page boundaries.
 *
 * If Jina is unreachable we fall back to a plain `fetch` of the URL and
 * return the raw HTML — the structuring LLM is robust enough to handle it.
 */

const MAX_PAGES = 12;
const PER_PAGE_TIMEOUT_MS = 15000;
const HIGH_PRIORITY_KEYWORDS = [
  'service',
  'pricing',
  'price',
  'menu',
  'treatment',
  'faq',
  'contact',
  'about',
  'hour',
  'book',
  'appointment',
  'location',
];

export type ScrapeResult = {
  url: string;
  pages: Array<{ url: string; title: string; content: string }>;
  combined: string;
  method: 'jina' | 'direct';
  error?: string;
};

export function normalizeUrl(input: string): string {
  let u = input.trim();
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  try {
    const parsed = new URL(u);
    parsed.hash = '';
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return u;
  }
}

/**
 * Reject targets that would let a malicious admin (or bad bulk upload row)
 * scan the internal network by bouncing a fetch through our server.
 *
 * Blocks: non-http(s) schemes, localhost variants, and RFC1918 private +
 * link-local IPv4 ranges. We validate the hostname string, not a resolved
 * IP — attackers can still set up DNS pointing to private IPs, but Jina
 * (our primary fetcher) proxies through its own infra, which gives us a
 * second natural barrier for that case.
 */
export function isSafePublicUrl(input: string): boolean {
  try {
    const u = new URL(input);
    if (!/^https?:$/.test(u.protocol)) return false;
    const host = u.hostname.toLowerCase();
    if (!host) return false;
    if (host === 'localhost' || host === '0.0.0.0' || host === '::1') return false;
    if (/^127\./.test(host)) return false;
    if (/^10\./.test(host)) return false;
    if (/^192\.168\./.test(host)) return false;
    if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return false;
    if (/^169\.254\./.test(host)) return false; // link-local
    if (/^fc[0-9a-f]{2}:/i.test(host) || /^fd[0-9a-f]{2}:/i.test(host)) return false; // IPv6 ULA
    if (/^fe80:/i.test(host)) return false; // IPv6 link-local
    return true;
  } catch {
    return false;
  }
}

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'InstaflowBot/1.0 (+https://instaflow.ai)' },
    });
  } finally {
    clearTimeout(t);
  }
}

async function fetchViaJina(targetUrl: string): Promise<string> {
  const res = await fetchWithTimeout(`https://r.jina.ai/${targetUrl}`, PER_PAGE_TIMEOUT_MS);
  if (!res.ok) throw new Error(`Jina returned ${res.status}`);
  return await res.text();
}

async function fetchDirect(targetUrl: string): Promise<string> {
  const res = await fetchWithTimeout(targetUrl, PER_PAGE_TIMEOUT_MS);
  if (!res.ok) throw new Error(`Direct fetch returned ${res.status}`);
  return await res.text();
}

/**
 * Extract markdown links from a Jina-style markdown blob and return same-origin
 * absolute URLs, prioritizing keywords a support agent actually cares about.
 */
function extractInternalLinks(markdown: string, origin: string): string[] {
  const linkRegex = /\[[^\]]*\]\(([^)\s]+)\)/g;
  const found = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = linkRegex.exec(markdown)) !== null) {
    const href = match[1];
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
    try {
      const abs = new URL(href, origin).toString().replace(/\/$/, '').split('#')[0];
      if (new URL(abs).origin === origin) found.add(abs);
    } catch {
      /* ignore bad URLs */
    }
  }

  const all = Array.from(found);
  const score = (u: string) => {
    const lower = u.toLowerCase();
    let s = 0;
    for (const kw of HIGH_PRIORITY_KEYWORDS) if (lower.includes(kw)) s += 10;
    // shorter paths first (probably top-level pages)
    s -= u.split('/').length;
    return s;
  };
  return all.sort((a, b) => score(b) - score(a));
}

function extractTitle(markdown: string, fallback: string): string {
  const h1 = markdown.match(/^#\s+(.+)$/m);
  if (h1) return h1[1].trim();
  const titleLine = markdown.match(/^Title:\s*(.+)$/m);
  if (titleLine) return titleLine[1].trim();
  return fallback;
}

export async function scrapeSite(rawUrl: string): Promise<ScrapeResult> {
  const url = normalizeUrl(rawUrl);
  if (!isSafePublicUrl(url)) {
    return {
      url,
      pages: [],
      combined: '',
      method: 'direct',
      error: 'Refusing to scrape a non-public URL (localhost, private IP, or non-http scheme).',
    };
  }
  const origin = new URL(url).origin;
  const pages: ScrapeResult['pages'] = [];
  let method: 'jina' | 'direct' = 'jina';

  // 1. Fetch the homepage.
  let homeMd: string;
  try {
    homeMd = await fetchViaJina(url);
  } catch (e) {
    method = 'direct';
    try {
      homeMd = await fetchDirect(url);
    } catch (e2) {
      return {
        url,
        pages: [],
        combined: '',
        method: 'direct',
        error: e2 instanceof Error ? e2.message : 'Failed to fetch site',
      };
    }
  }

  pages.push({ url, title: extractTitle(homeMd, url), content: homeMd });

  // 2. Discover and fetch additional pages (only if we got markdown from Jina).
  if (method === 'jina') {
    const candidates = extractInternalLinks(homeMd, origin)
      .filter((u) => u !== url)
      .slice(0, MAX_PAGES - 1);

    const results = await Promise.allSettled(
      candidates.map(async (link) => {
        const md = await fetchViaJina(link);
        return { url: link, title: extractTitle(md, link), content: md };
      }),
    );

    for (const r of results) {
      if (r.status === 'fulfilled' && r.value.content.trim().length > 100) {
        pages.push(r.value);
      }
    }
  }

  // 3. Combine with clear page boundaries.
  const combined = pages
    .map(
      (p) =>
        `\n\n===== PAGE: ${p.title} =====\nURL: ${p.url}\n\n${p.content.trim()}`,
    )
    .join('\n')
    .slice(0, 200_000); // hard cap to keep prompt size sane

  return { url, pages, combined, method };
}
