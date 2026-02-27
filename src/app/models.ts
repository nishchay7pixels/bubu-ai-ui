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
