import { NextResponse } from 'next/server';
import { pingMongo } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/health
 *
 * Cheap liveness + readiness endpoint consumed by the docker-compose
 * healthcheck and any external uptime monitor. Reports:
 *   - process is responsive (if this replies at all, Node is alive)
 *   - Mongo is reachable (ping)
 *
 * Not gated — intentionally public so the load balancer / cron can hit it
 * without credentials. Returns 200 only when everything is healthy; 503
 * otherwise so a misconfigured deployment surfaces instead of silently
 * serving broken pages.
 */
export async function GET() {
  const dbOk = await pingMongo();
  const body = {
    ok: dbOk,
    process: true,
    db: dbOk,
    time: new Date().toISOString(),
  };
  return NextResponse.json(body, { status: dbOk ? 200 : 503 });
}
