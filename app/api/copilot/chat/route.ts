import { NextRequest, NextResponse } from 'next/server';
import { checkOllamaHealth, chatWithOllama } from '@/lib/copilot/ollama-client';
import { buildNovaSystemPrompt } from '@/lib/copilot/system-prompt';
import { buildEmergencyContext } from '@/lib/copilot/context-builder';
import type { CopilotChatRequest, CopilotChatResponse } from '@/lib/copilot/types';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CopilotChatRequest;
    const userMessage = body?.message?.trim();

    if (!userMessage) {
      return NextResponse.json<CopilotChatResponse>(
        {
          success: false,
          message: 'Please provide a valid emergency query or instruction.',
          confidence: 0,
          sources: [],
        },
        { status: 400 }
      );
    }

    // Check local reasoning engine availability (always on in the demo build)
    const health = await checkOllamaHealth();
    if (!health.online) {
      return NextResponse.json<CopilotChatResponse>(
        {
          success: false,
          message: 'ADRIAN Copilot is temporarily unavailable.',
          confidence: 0,
          sources: [],
          error: health.error,
        },
        { status: 503 }
      );
    }

    // Build real-time emergency context (RAG)
    const contextBundle = await buildEmergencyContext(
      userMessage,
      body.conversation || []
    );

    // Build system prompt with grounding rules and live context
    const systemPrompt = buildNovaSystemPrompt(contextBundle.systemContext);

    // Execute Ollama chat completion
    const aiResult = await chatWithOllama({
      systemPrompt,
      conversation: body.conversation,
      userMessage,
    });

    if (!aiResult.success || !aiResult.content) {
      return NextResponse.json<CopilotChatResponse>(
        {
          success: false,
          message:
            'ADRIAN Copilot encountered an issue while processing the emergency response reasoning.',
          confidence: 0,
          sources: contextBundle.relevantSources,
          error: aiResult.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json<CopilotChatResponse>({
      success: true,
      message: aiResult.content,
      confidence: contextBundle.dataCompletenessScore,
      sources: contextBundle.relevantSources,
      model: health.model,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Internal server error';
    console.error('Copilot API Route Error:', errorMessage);
    return NextResponse.json<CopilotChatResponse>(
      {
        success: false,
        message:
          'An unexpected error occurred in ADRIAN Copilot service. Please try again.',
        confidence: 0,
        sources: [],
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
