import { getSetting } from './mongodb';

/**
 * Resolves a runtime secret, preferring the admin-managed value in Mongo
 * over the environment variable. This lets the user rotate API keys from
 * the Settings page without a redeploy.
 *
 * Env var stays as a fallback so:
 *   - fresh installs still work before anyone logs into admin,
 *   - CI/GitHub-secrets-style deployments keep working unchanged,
 *   - local dev still reads from .env.local.
 */
export async function resolveSecret(
  settingsKey: 'openrouterApiKey' | 'elevenlabsApiKey' | 'geminiApiKey',
  envVar: string,
): Promise<string | null> {
  try {
    const db = (await getSetting<string>(settingsKey))?.trim();
    if (db) return db;
  } catch {
    // If Mongo is unreachable, fall back to env silently.
  }
  const env = process.env[envVar]?.trim();
  if (env && env !== 'REPLACE_ME') return env;
  return null;
}
