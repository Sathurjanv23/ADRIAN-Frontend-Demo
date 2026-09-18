import type { OllamaMessage, CopilotStatusResponse } from './types';

// ============================================================
// ADRIAN Copilot — Frontend-only Demo Reasoning Engine
// ------------------------------------------------------------
// The production build calls a local Ollama LLM. For the
// standalone frontend demo there is no LLM (and no backend), so
// this module answers deterministically from the same live
// operational context (lib/copilot/context-builder.ts) that would
// otherwise have been handed to the model as a system prompt.
// Function names are kept identical so app/api/copilot/* routes
// don't need to change.
// ============================================================

const DEMO_MODEL_NAME = 'ADRIAN-Local-Insight (Demo Heuristic Engine)';

export async function checkOllamaHealth(): Promise<CopilotStatusResponse> {
  return {
    online: true,
    model: DEMO_MODEL_NAME,
    availableModels: [DEMO_MODEL_NAME],
  };
}

function extractSection(context: string, header: string): string | null {
  const pattern = new RegExp(`### ${header}[\\s\\S]*?(?=\\n### |$)`, 'i');
  const match = context.match(pattern);
  return match ? match[0].trim() : null;
}

function firstLines(text: string, count: number): string {
  return text.split('\n').slice(0, count).join('\n');
}

/**
 * Builds a deterministic, grounded-sounding reply from the
 * emergency operations context embedded in the system prompt,
 * mimicking the structure the real LLM was instructed to follow.
 */
function reasonLocally(systemPrompt: string, userMessage: string): string {
  const marker = '=== CURRENT EMERGENCY OPERATIONS SYSTEM CONTEXT ===';
  const idx = systemPrompt.indexOf(marker);
  const context = idx >= 0 ? systemPrompt.slice(idx + marker.length).trim() : systemPrompt;
  const q = userMessage.toLowerCase();

  const topics: { keys: string[]; header: string; lines: number }[] = [
    { keys: ['incident', 'critical', 'urgent', 'priority', 'flood', 'landslide', 'trapped', 'nov-', 'situation', 'summary', 'status', 'overview'], header: 'ACTIVE INCIDENTS', lines: 8 },
    { keys: ['team', 'deploy', 'dispatch', 'available', 'rescue'], header: 'RESCUE TEAMS', lines: 6 },
    { keys: ['risk', 'predict', 'zone', 'river', 'rain', 'weather'], header: 'RISK PREDICTIONS & SENSORS', lines: 6 },
    { keys: ['hospital', 'medical', 'icu', 'bed', 'ambulance', 'patient', 'doctor'], header: 'HOSPITAL CAPACITY', lines: 6 },
    { keys: ['resource', 'supply', 'boat', 'stock', 'water', 'food', 'equipment'], header: 'RESOURCE INVENTORY', lines: 6 },
  ];

  const matchedSections: string[] = [];
  for (const topic of topics) {
    if (topic.keys.some((k) => q.includes(k))) {
      const section = extractSection(context, topic.header);
      if (section) matchedSections.push(firstLines(section, topic.lines));
    }
  }

  if (matchedSections.length === 0) {
    // General fallback: give a compact one-line pull from every section available.
    const allHeaders = ['ACTIVE INCIDENTS', 'RESCUE TEAMS', 'RISK PREDICTIONS & SENSORS', 'HOSPITAL CAPACITY', 'RESOURCE INVENTORY'];
    for (const header of allHeaders) {
      const section = extractSection(context, header);
      if (section) matchedSections.push(firstLines(section, 3));
    }
  }

  const body = matchedSections.join('\n\n');

  return [
    `Based on the current verified system data:`,
    '',
    body || "I don't have enough verified system data to determine that.",
    '',
    `**RECOMMENDATION:** Cross-check the above against the live Command Center map before dispatching further units, and prioritize CRITICAL-severity items with vulnerable persons or rising risk scores first.`,
  ].join('\n');
}

export async function chatWithOllama(params: {
  systemPrompt: string;
  conversation?: OllamaMessage[];
  userMessage: string;
}): Promise<{ content: string; success: boolean; error?: string }> {
  // Small artificial delay so the UI's "thinking" state still feels real.
  await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 400));

  try {
    const content = reasonLocally(params.systemPrompt, params.userMessage);
    return { content, success: true };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown demo reasoning error';
    return { content: '', success: false, error: errorMessage };
  }
}
