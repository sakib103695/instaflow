import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'instaflow_db';

if (!uri) {
  throw new Error('Missing MONGODB_URI. Set it in .env or .env.local');
}

// Reuse a single MongoClient across hot reloads in dev (Next.js).
const globalForMongo = globalThis as unknown as { _mongoClient?: MongoClient };
const client = globalForMongo._mongoClient ?? new MongoClient(uri);
if (process.env.NODE_ENV !== 'production') globalForMongo._mongoClient = client;

let connected = false;
async function getDb() {
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

export { ObjectId };
