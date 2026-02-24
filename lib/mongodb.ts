import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'instaflow_db';

if (!uri) {
  throw new Error('Missing MONGODB_URI. Set it in .env or .env.local');
}

const client = new MongoClient(uri);

export async function getConversationsCollection() {
  await client.connect();
  return client.db(dbName).collection('conversations');
}

export { ObjectId };
