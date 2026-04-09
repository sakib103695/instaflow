import 'server-only';
import { getClientsCollection } from './mongodb';
import type { ClientDoc } from './clientTypes';

/**
 * Server-only client fetcher used by the homepage.
 *
 * Resolution order:
 *   1. If `slug` is provided AND it matches a client → return that client.
 *   2. Otherwise return the client marked `isDefault: true`.
 *   3. Otherwise (nothing in DB yet) return null.
 *
 * The route handler decides what to do on null (typically: render an empty
 * "no agent configured yet" placeholder, or redirect to admin).
 */
export async function getClientForPage(slug?: string | null): Promise<ClientDoc | null> {
  const col = await getClientsCollection();

  if (slug) {
    const doc = await col.findOne({ slug });
    if (doc) return stripId(doc);
  }

  const def = await col.findOne({ isDefault: true });
  if (def) return stripId(def);

  return null;
}

function stripId(doc: any): ClientDoc {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, ...rest } = doc;
  return rest as ClientDoc;
}
