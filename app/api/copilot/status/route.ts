import { NextResponse } from 'next/server';
import { checkOllamaHealth } from '@/lib/copilot/ollama-client';
import type { CopilotStatusResponse } from '@/lib/copilot/types';

export async function GET() {
  const health = await checkOllamaHealth();
  return NextResponse.json<CopilotStatusResponse>(health);
}
