import Home from '@/views/Home';
import { getClientForPage } from '@/lib/getClient';
import { INSTAFLOW_SYSTEM_INSTRUCTION, DEFAULT_VOICE_ID } from '@/constants';
import { loadVoicesForPicker } from '@/lib/voices';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type PageProps = {
  searchParams: Promise<{ client?: string }>;
};

/**
 * Homepage. The voice agent's context is selected via `?client=<slug>`:
 *
 *   /                       → uses the client marked isDefault in MongoDB
 *   /?client=instaquirk     → uses that specific client's prompt + voice
 *
 * If neither is available (e.g. fresh install with no clients), we fall back
 * to the hardcoded INSTAFLOW_SYSTEM_INSTRUCTION so the page never breaks.
 */
export default async function Page({ searchParams }: PageProps) {
  const { client: requestedSlug } = await searchParams;
  const [client, availableVoices] = await Promise.all([
    getClientForPage(requestedSlug),
    loadVoicesForPicker(),
  ]);

  const agentConfig = client
    ? {
        slug: client.slug,
        name: client.name,
        systemPrompt: client.systemPrompt,
        greeting: client.greeting,
        voiceId: client.voiceId || DEFAULT_VOICE_ID,
        languages: (Array.isArray(client.languages) && client.languages.length > 0
          ? client.languages
          : ['en']) as Array<'en' | 'hi'>,
      }
    : {
        slug: 'demo',
        name: 'GlowLift Medspa',
        systemPrompt: INSTAFLOW_SYSTEM_INSTRUCTION,
        greeting: "Hi, thanks for calling GlowLift Medspa — this is Mia, how can I help you today?",
        voiceId: DEFAULT_VOICE_ID,
        languages: ['en'] as Array<'en' | 'hi'>,
      };

  return <Home agentConfig={agentConfig} availableVoices={availableVoices} />;
}
