/**
 * Minimal shape passed from the server page down to the voice widget.
 * Decoupled from ClientDoc so we can also use a hardcoded fallback when
 * no clients exist in the database yet.
 */
export type AgentConfig = {
  slug: string;
  name: string;
  systemPrompt: string;
  greeting: string;
  voiceId: string;
  languages?: Array<'en' | 'hi'>;
};

export type StructuredContext = {
  business: {
    name: string;
    industry: string;
    description: string;
    hours: string;
    location: string;
    phone: string;
    email: string;
    website: string;
  };
  services: Array<{
    name: string;
    description: string;
    priceRange: string;
    duration: string;
  }>;
  faqs: Array<{ question: string; answer: string }>;
  policies: {
    booking: string;
    cancellation: string;
    payment: string;
    other: string;
  };
  bookingChannels: string[];
  tone: string;
  personaName: string;
  doNotPromise: string[];
  escalation: string;
};

export type ClientDoc = {
  slug: string;
  name: string;
  domain: string;
  voiceId: string;
  /**
   * Exactly one client in the collection should have isDefault = true.
   * It powers the homepage when no `?client=` query param is supplied,
   * and it cannot be deleted (only swapped to another client).
   */
  isDefault?: boolean;
  /**
   * Lifecycle of the scrape pipeline. Bulk-uploaded clients start as
   * 'pending'; the worker flips them to 'done' or 'failed'. Legacy
   * single-create clients have it undefined and are treated as 'done'.
   */
  scrapeStatus?: 'pending' | 'done' | 'failed';
  scrapeError?: string;
  rawScrape: string;
  scrapeMeta: {
    pagesScraped: number;
    method: 'direct' | 'jina' | 'manual';
    scrapedAt: string | null;
  };
  structuredContext: StructuredContext;
  systemPrompt: string;
  greeting: string;
  /**
   * Which spoken languages the agent should handle. Defaults to ['en'].
   * When more than one is set we run Deepgram in multi-language detection
   * mode and instruct the LLM to match the caller's language (including
   * Hinglish mid-sentence switching).
   */
  languages?: Array<'en' | 'hi'>;
  createdAt: string;
  updatedAt: string;
};

export type Language = 'en' | 'hi';

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'English',
  hi: 'Hindi',
};

/**
 * Generate a sensible default greeting for a given language set. Users can
 * override this in admin; this is just the starting value for new or
 * bulk-created clients.
 */
export function defaultGreeting(name: string, languages: Language[], personaName = 'Mia'): string {
  const langs = languages.length ? languages : ['en'];
  const hasEn = langs.includes('en');
  const hasHi = langs.includes('hi');
  if (hasEn && hasHi) {
    return `Hello, namaste! Thanks for calling ${name}, this is ${personaName}. How can I help you today? Kaise madad kar sakti hoon?`;
  }
  if (hasHi) {
    return `Namaste! ${name} mein aapka swagat hai. Main ${personaName} bol rahi hoon — aaj main aapki kaise madad kar sakti hoon?`;
  }
  return `Hi, thanks for calling ${name} — this is ${personaName}, how can I help you today?`;
}

export const EMPTY_STRUCTURED_CONTEXT: StructuredContext = {
  business: {
    name: '',
    industry: '',
    description: '',
    hours: '',
    location: '',
    phone: '',
    email: '',
    website: '',
  },
  services: [],
  faqs: [],
  policies: { booking: '', cancellation: '', payment: '', other: '' },
  bookingChannels: [],
  tone: 'warm, professional, concise',
  personaName: 'Mia',
  doNotPromise: [],
  escalation: '',
};

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\.[a-z.]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}
