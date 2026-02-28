import { ChatApiResponse, EmotionKey } from '../models';

export type FaceExpressionKey =
  | 'irate'
  | 'curious'
  | 'amazed'
  | 'scanning'
  | 'ponder'
  | 'concentrate'
  | 'suspicious'
  | 'bored'
  | 'wonder'
  | 'notice'
  | 'skeptical'
  | 'inquiry'
  | 'sleeping'
  | 'shy'
  | 'laugh'
  | 'cry'
  | 'calm';

export interface EmotionProfile {
  key: EmotionKey;
  name: string;
  icon: string;
  description: string;
}

export interface FaceExpression {
  key: FaceExpressionKey;
  name: string;
  icon: string;
  description: string;
}

export interface CommandDefinition {
  command: string;
  aliases: string[];
  description: string;
  mode: 'set' | 'sleep' | 'wake' | 'auto';
  emotion?: EmotionKey;
  expression?: FaceExpressionKey;
}

export interface ManualCommandOverride {
  emotion: EmotionKey;
  expression: FaceExpressionKey;
}

export const EMOTIONS: Record<EmotionKey, EmotionProfile> = {
  neutral: { key: 'neutral', name: 'Steady Core', icon: '🙂', description: 'Balanced and ready to listen.' },
  joyful: { key: 'joyful', name: 'Spark Joy', icon: '😄', description: 'Bright and upbeat energy.' },
  empathetic: { key: 'empathetic', name: 'Empathy Mode', icon: '🤗', description: 'Warm, supportive, and human-centered.' },
  curious: { key: 'curious', name: 'Curious Scan', icon: '🤔', description: 'Exploring details and asking better questions.' },
  worried: { key: 'worried', name: 'Soft Concern', icon: '😟', description: 'Careful and sensitive to uncertainty.' },
  frustrated: { key: 'frustrated', name: 'Tension Spike', icon: '😤', description: 'Detecting stress and reducing friction.' },
  thinking: { key: 'thinking', name: 'Thinking Loop', icon: '🧠', description: 'Processing your context and generating a response.' }
};

export const EXPRESSIONS: Record<FaceExpressionKey, FaceExpression> = {
  irate: { key: 'irate', name: 'IRATE', icon: '⚡', description: 'Sharp focus with defensive intensity.' },
  curious: { key: 'curious', name: 'CURIOUS', icon: '🧭', description: 'Inspecting details with open attention.' },
  amazed: { key: 'amazed', name: 'AMAZED', icon: '✨', description: 'High-energy reaction to strong signals.' },
  scanning: { key: 'scanning', name: 'SCANNING', icon: '📡', description: 'Rapid context sweep and pattern checks.' },
  ponder: { key: 'ponder', name: 'PONDER', icon: '🫧', description: 'Quiet reflection before answering.' },
  concentrate: { key: 'concentrate', name: 'CONCENTRATE', icon: '🎯', description: 'Narrowing in on the exact point.' },
  suspicious: { key: 'suspicious', name: 'SUSPICIOUS', icon: '🕵️', description: 'Testing assumptions and edge cases.' },
  bored: { key: 'bored', name: 'BORED', icon: '🫠', description: 'Low stimulation detected.' },
  wonder: { key: 'wonder', name: 'WONDER', icon: '🌌', description: 'Curiosity with imaginative exploration.' },
  notice: { key: 'notice', name: 'NOTICE', icon: '👁️', description: 'Subtle cue picked up from conversation.' },
  skeptical: { key: 'skeptical', name: 'SKEPTICAL', icon: '🧪', description: 'Verifying claims before commitment.' },
  inquiry: { key: 'inquiry', name: 'INQUIRY', icon: '❓', description: 'Question-driven reasoning mode.' },
  sleeping: { key: 'sleeping', name: 'SLEEPING', icon: '💤', description: 'Idle mode. Wake me by typing or moving.' },
  shy: { key: 'shy', name: 'SHY', icon: '😊', description: 'Noticed you near my forehead... feeling shy and happy.' },
  laugh: { key: 'laugh', name: 'LAUGH', icon: '😆', description: 'Playful and amused.' },
  cry: { key: 'cry', name: 'CRY', icon: '😢', description: 'Emotional and teary.' },
  calm: { key: 'calm', name: 'CALM', icon: '🫶', description: 'Relaxed and grounded.' }
};

export const COMMANDS: CommandDefinition[] = [
  { command: 'sleep', aliases: ['sleep', 'nap', 'snooze', 'rest'], description: 'Enter sleep mode.', mode: 'sleep' },
  { command: 'wake', aliases: ['wake', 'wakeup', 'awake', 'rise'], description: 'Wake from sleep mode.', mode: 'wake' },
  { command: 'auto', aliases: ['auto', 'normal', 'reset', 'default', 'freestyle'], description: 'Return to AI-driven expressions.', mode: 'auto' },
  { command: 'laugh', aliases: ['laugh', 'lol', 'giggle', 'chuckle'], description: 'Happy laughing face.', mode: 'set', emotion: 'joyful', expression: 'laugh' },
  { command: 'cry', aliases: ['cry', 'sad', 'tears', 'sob'], description: 'Sad crying face.', mode: 'set', emotion: 'worried', expression: 'cry' },
  { command: 'happy', aliases: ['happy', 'joy', 'smile', 'cheer'], description: 'Happy expression.', mode: 'set', emotion: 'joyful', expression: 'amazed' },
  { command: 'calm', aliases: ['calm', 'relax', 'peaceful', 'steady'], description: 'Calm neutral face.', mode: 'set', emotion: 'neutral', expression: 'calm' },
  { command: 'curious', aliases: ['curious', 'question', 'investigate'], description: 'Curious look.', mode: 'set', emotion: 'curious', expression: 'curious' },
  { command: 'inquiry', aliases: ['inquiry', 'ask', 'query'], description: 'Inquiry mode.', mode: 'set', emotion: 'curious', expression: 'inquiry' },
  { command: 'scan', aliases: ['scan', 'scanning', 'analyze'], description: 'Scanning mode.', mode: 'set', emotion: 'thinking', expression: 'scanning' },
  { command: 'ponder', aliases: ['ponder', 'think', 'reflect'], description: 'Ponder mode.', mode: 'set', emotion: 'worried', expression: 'ponder' },
  { command: 'concentrate', aliases: ['concentrate', 'focus', 'lockin'], description: 'Concentrated mode.', mode: 'set', emotion: 'curious', expression: 'concentrate' },
  { command: 'amazed', aliases: ['amazed', 'wow', 'surprised'], description: 'Amazed mode.', mode: 'set', emotion: 'joyful', expression: 'amazed' },
  { command: 'bored', aliases: ['bored', 'idle', 'meh'], description: 'Bored mode.', mode: 'set', emotion: 'neutral', expression: 'bored' },
  { command: 'wonder', aliases: ['wonder', 'dream', 'imagine'], description: 'Wonder mode.', mode: 'set', emotion: 'joyful', expression: 'wonder' },
  { command: 'notice', aliases: ['notice', 'alert', 'observe'], description: 'Notice mode.', mode: 'set', emotion: 'empathetic', expression: 'notice' },
  { command: 'skeptical', aliases: ['skeptical', 'doubt', 'verify'], description: 'Skeptical mode.', mode: 'set', emotion: 'worried', expression: 'skeptical' },
  { command: 'suspicious', aliases: ['suspicious', 'sus', 'paranoid'], description: 'Suspicious mode.', mode: 'set', emotion: 'frustrated', expression: 'suspicious' },
  { command: 'irate', aliases: ['irate', 'angry', 'mad'], description: 'Irate mode.', mode: 'set', emotion: 'frustrated', expression: 'irate' },
  { command: 'shy', aliases: ['shy', 'blush', 'bashful'], description: 'Shy and happy mode.', mode: 'set', emotion: 'joyful', expression: 'shy' }
];

export const COMMAND_HELP = COMMANDS.map((cmd) => ({
  command: cmd.command,
  aliases: cmd.aliases.slice(1).join(', '),
  description: cmd.description
}));

const commandAliasMap = buildCommandAliasMap();

function includesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

function buildCommandAliasMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const cmd of COMMANDS) {
    for (const alias of cmd.aliases) {
      map[alias] = cmd.command;
    }
  }
  return map;
}

export function parseCommand(input: string): CommandDefinition | null {
  const clean = input.trim().toLowerCase().replace(/^\//, '').replace(/[^a-z\s-]/g, '');
  const token = clean.split(/\s+/)[0];

  if (!token) {
    return null;
  }

  const mapped = commandAliasMap[token];
  if (!mapped) {
    return null;
  }

  return COMMANDS.find((cmd) => cmd.command === mapped) ?? null;
}

export function detectTone(text: string, role: 'user' | 'assistant'): EmotionKey {
  const normalized = text.toLowerCase();

  if (includesAny(normalized, ['angry', 'annoyed', 'frustrated', 'hate', 'stupid', 'worst', 'wtf'])) {
    return 'frustrated';
  }

  if (includesAny(normalized, ['sad', 'upset', 'anxious', 'worried', 'scared', 'afraid', 'stress'])) {
    return 'worried';
  }

  if (includesAny(normalized, ['thanks', 'thank you', 'great', 'awesome', 'love', 'perfect', 'amazing', 'yay'])) {
    return 'joyful';
  }

  if (normalized.includes('?') || includesAny(normalized, ['why', 'how', 'what', 'could you', 'can you'])) {
    return 'curious';
  }

  if (role === 'assistant' && includesAny(normalized, ['i understand', 'i hear you', 'sorry', 'let us fix', 'you can do this', 'we can'])) {
    return 'empathetic';
  }

  return 'neutral';
}

export function inferEmotionFromReply(text: string): EmotionKey {
  const normalized = text.toLowerCase();

  if (includesAny(normalized, ['angry', 'annoyed', 'frustrated', 'hate', 'ridiculous', 'wtf'])) {
    return 'frustrated';
  }

  if (includesAny(normalized, ['sad', 'upset', 'worried', 'anxious', 'afraid', 'concern', 'unfortunately', 'cry'])) {
    return 'worried';
  }

  if (includesAny(normalized, ['sorry', 'i understand', 'i hear you', 'that sounds hard', 'you are not alone'])) {
    return 'empathetic';
  }

  if (normalized.includes('!') || includesAny(normalized, ['great', 'awesome', 'amazing', 'excellent', 'perfect', 'love', 'glad', 'nice', 'fantastic', 'haha'])) {
    return 'joyful';
  }

  if (normalized.includes('?') || includesAny(normalized, ['why', 'how', 'what', 'could', 'maybe', 'let us explore'])) {
    return 'curious';
  }

  return 'neutral';
}

export function resolveAssistantEmotion(response: ChatApiResponse, enableAutoEmotion: boolean): EmotionKey {
  if (!enableAutoEmotion) {
    return EMOTIONS[response.emotion] ? response.emotion : 'neutral';
  }

  const inferred = inferEmotionFromReply(response.reply);
  if (inferred !== 'neutral') {
    return inferred;
  }

  return EMOTIONS[response.emotion] ? response.emotion : 'neutral';
}

export function pickExpression(emotion: EmotionKey, assistantReply: string, userText: string): FaceExpressionKey {
  const assistant = assistantReply.toLowerCase();
  const user = userText.toLowerCase();

  if (assistant.includes('bored') || user.includes('bored')) {
    return 'bored';
  }

  if (emotion === 'thinking') {
    return 'scanning';
  }

  if (emotion === 'curious') {
    return assistant.includes('?') ? 'inquiry' : 'curious';
  }

  if (emotion === 'joyful') {
    return assistant.includes('ha') || assistant.includes('lol') ? 'laugh' : 'amazed';
  }

  if (emotion === 'worried') {
    return assistant.includes('cry') || assistant.includes('tears') ? 'cry' : 'ponder';
  }

  if (emotion === 'frustrated') {
    return assistant.includes('suspicious') || assistant.includes('not sure') ? 'suspicious' : 'irate';
  }

  if (emotion === 'empathetic') {
    return 'notice';
  }

  if (assistant.includes('focus') || assistant.includes('step')) {
    return 'concentrate';
  }

  return 'calm';
}

export function getIdleMs(seconds: number): number {
  if (!Number.isFinite(seconds)) {
    return 60_000;
  }

  return Math.max(10, Math.min(600, seconds)) * 1000;
}
