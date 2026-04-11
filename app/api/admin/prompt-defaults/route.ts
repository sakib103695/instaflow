import { NextResponse } from 'next/server';
import { BASE_AGENT_INSTRUCTION, STRUCTURING_INSTRUCTION } from '@/lib/agentPrompt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/prompt-defaults
 *
 * Returns the hardcoded default prompts so the Settings UI can show them
 * as placeholder text and offer a "reset to default" action. Kept server-
 * side so the defaults stay in sync with the compiled code — if anyone
 * ships a new version, this endpoint reflects it immediately.
 */
export async function GET() {
  return NextResponse.json({
    basePrompt: BASE_AGENT_INSTRUCTION,
    structuringPrompt: STRUCTURING_INSTRUCTION,
  });
}
