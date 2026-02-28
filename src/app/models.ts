export type EmotionKey = 'neutral' | 'joyful' | 'empathetic' | 'curious' | 'worried' | 'frustrated' | 'thinking';

export interface Skill {
  id: string;
  name: string;
  instructions: string;
  active: boolean;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  active: boolean;
}

export interface AppConfig {
  model: string;
  ollamaBaseUrl: string;
  temperature: number;
  persona: string;
  displayName: string;
  shortBio: string;
  responseStyle: string;
  verbosity: 'concise' | 'balanced' | 'detailed';
  maxHistoryMessages: number;
  idleTimeoutSeconds: number;
  enableCommandMode: boolean;
  enableTypingGaze: boolean;
  enableForeheadReaction: boolean;
  enableAutoEmotion: boolean;
  skills: Skill[];
  tools: Tool[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatApiResponse {
  reply: string;
  emotion: EmotionKey;
}

export interface SearchFileResultItem {
  path: string;
  line: number;
  snippet: string;
}

export interface SearchFilesToolResponse {
  ok: boolean;
  data?: {
    query: string;
    results: SearchFileResultItem[];
    truncated: boolean;
  };
  error?: string;
}

export interface SearchFilesToolInput {
  query: string;
  glob?: string;
  max_results?: number;
  max_file_size_bytes?: number;
}
