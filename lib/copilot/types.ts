export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CopilotChatRequest {
  message: string;
  conversation?: OllamaMessage[];
}

export interface CopilotChatResponse {
  success: boolean;
  message: string;
  confidence: number;
  sources: string[];
  model?: string;
  timestamp?: string;
  error?: string;
}

export interface CopilotStatusResponse {
  online: boolean;
  model: string;
  availableModels: string[];
  error?: string;
}

export interface ContextBundle {
  systemContext: string;
  relevantSources: string[];
  dataCompletenessScore: number;
}
