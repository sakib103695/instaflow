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

const globalForMongo = globalThis as unknown as { _mongoClient?: MongoClient };

function getClient(): MongoClient {
  if (globalForMongo._mongoClient) return globalForMongo._mongoClient;
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Missing MONGODB_URI. Set it in .env or in the runtime environment.');
  }
  const client = new MongoClient(uri);
  if (process.env.NODE_ENV !== 'production') {
    globalForMongo._mongoClient = client;
  } else {
    // Cache in module-scoped global anyway to avoid reconnecting on every
    // request in production. (We just don't pollute the dev hot-reload global.)
    globalForMongo._mongoClient = client;
  }
  return client;
}

let connected = false;
async function getDb() {
  const client = getClient();
  if (!connected) {
    await client.connect();
    connected = true;
  }
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

export { ObjectId };
