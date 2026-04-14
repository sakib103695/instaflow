import { MongoClient, ObjectId } from 'mongodb';

/**
 * Lazy MongoDB client.
 *
 * IMPORTANT: We do NOT throw at module load time when MONGODB_URI is missing.
 * Next.js evaluates this module during `next build` (Collecting page data),
 * and at build time runtime env vars aren't set yet. Throwing here would
 * break the Docker image build. Instead, we throw the first time something
 * actually tries to use the database — by then we're at runtime in a real
 * request handler and the env IS set.
 */

const dbName = process.env.MONGODB_DB_NAME || 'instaflow_db';

type GlobalMongo = {
  _mongoClient?: MongoClient;
  _mongoConnectedAt?: number;
  _mongoIndexesCreated?: boolean;
  _mongoConnectPromise?: Promise<void>;
};
const globalForMongo = globalThis as unknown as GlobalMongo;

function getClient(): MongoClient {
  if (globalForMongo._mongoClient) return globalForMongo._mongoClient;
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Missing MONGODB_URI. Set it in .env or in the runtime environment.');
  }
  const client = new MongoClient(uri, {
    // Fail fast on network hiccups instead of hanging a request for minutes.
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
    socketTimeoutMS: 30_000,
  });
  globalForMongo._mongoClient = client;
  return client;
}

/**
 * Ensure the client is connected. Unlike the previous simple boolean flag
 * this version:
 *   - de-duplicates concurrent connect attempts via a shared Promise,
 *   - retries on failure (clears the promise so the next request tries again),
 *   - creates the indexes we rely on, exactly once per process.
 */
async function ensureConnected(): Promise<void> {
  if (globalForMongo._mongoConnectedAt) return;
  if (globalForMongo._mongoConnectPromise) {
    return globalForMongo._mongoConnectPromise;
  }
  const client = getClient();
  const p = (async () => {
    try {
      await client.connect();
      globalForMongo._mongoConnectedAt = Date.now();
      await ensureIndexes(client);
    } catch (err) {
      // Clear the flag so the next request retries instead of hanging on a
      // dead promise forever.
      globalForMongo._mongoConnectedAt = undefined;
      throw err;
    } finally {
      globalForMongo._mongoConnectPromise = undefined;
    }
  })();
  globalForMongo._mongoConnectPromise = p;
  return p;
}

/**
 * Create the indexes the app actually queries by. Idempotent — Mongo
 * no-ops if they already exist. Doing it once at startup avoids full
 * collection scans as data grows.
 */
async function ensureIndexes(client: MongoClient): Promise<void> {
  if (globalForMongo._mongoIndexesCreated) return;
  try {
    const db = client.db(dbName);
    await Promise.all([
      // Unique client slug — blocks duplicate inserts and powers getClient().
      db.collection('clients').createIndex({ slug: 1 }, { unique: true }),
      // Partial unique index on isDefault so at most one client can be the
      // default at any time (enforces atomicity for set-default races).
      db
        .collection('clients')
        .createIndex(
          { isDefault: 1 },
          { unique: true, partialFilterExpression: { isDefault: true } },
        ),
      // Scrape worker scans by status; index makes claim + resume instant.
      db.collection('clients').createIndex({ scrapeStatus: 1 }),
      // Conversations list sorts by createdAt descending; enable the index
      // walk. Plus an index on meta.clientSlug for per-client lookups.
      db.collection('conversations').createIndex({ createdAt: -1 }),
      db.collection('conversations').createIndex({ 'meta.clientSlug': 1 }),
      // Voices: upsert by id.
      db.collection('voices').createIndex({ id: 1 }, { unique: true }),
      // Settings: lookup by key.
      db.collection('settings').createIndex({ key: 1 }, { unique: true }),
    ]);
    globalForMongo._mongoIndexesCreated = true;
  } catch (err) {
    // Don't block requests if index creation has a transient issue —
    // next process can retry. Log and continue.
    console.warn('ensureIndexes: non-fatal error creating indexes', err);
  }
}

async function getDb() {
  const client = getClient();
  await ensureConnected();
  return client.db(dbName);
}

export async function getConversationsCollection() {
  const db = await getDb();
  return db.collection('conversations');
}

export async function getClientsCollection() {
  const db = await getDb();
  return db.collection('clients');
}

export async function getVoicesCollection() {
  const db = await getDb();
  return db.collection('voices');
}

export async function getSettingsCollection() {
  const db = await getDb();
  return db.collection('settings');
}

// Simple in-memory cache for small runtime-tunable settings. 30s TTL is
// short enough that an admin editing a setting sees it on the next request,
// but long enough to avoid hammering Mongo on every hot-path resolve. Cleared
// on setSetting() so writes are visible immediately.
const settingsCache = new Map<string, { value: unknown; expiresAt: number }>();
const SETTINGS_TTL_MS = 30_000;

/** Tiny key-value helper for single-document settings. */
export async function getSetting<T = string>(key: string): Promise<T | null> {
  const cached = settingsCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return (cached.value as T) ?? null;
  }
  const col = await getSettingsCollection();
  const doc = await col.findOne({ key });
  const value = (doc?.value as T) ?? null;
  settingsCache.set(key, { value, expiresAt: Date.now() + SETTINGS_TTL_MS });
  return value;
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  const col = await getSettingsCollection();
  await col.updateOne(
    { key },
    { $set: { key, value, updatedAt: new Date().toISOString() } },
    { upsert: true },
  );
  // Invalidate so the next read picks up the new value immediately.
  settingsCache.delete(key);
}

/** For tests + /api/health. */
export async function pingMongo(): Promise<boolean> {
  try {
    const db = await getDb();
    const res = await db.command({ ping: 1 });
    return res?.ok === 1;
  } catch {
    return false;
  }
}

export { ObjectId };
