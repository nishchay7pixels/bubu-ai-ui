import { Injectable } from '@angular/core';
import { AppConfig, ChatMessage, Skill, Tool } from './models';

const CONFIG_KEY = 'emo-robot-config';
const HISTORY_KEY = 'emo-robot-history';

@Injectable({ providedIn: 'root' })
export class AppStateService {
  readonly defaultConfig: AppConfig = {
    model: 'bubu-ai',
    ollamaBaseUrl: 'http://127.0.0.1:11434',
    temperature: 0.7,
    persona: 'You are an expressive emotional support robot with playful empathy and clear technical reasoning.',
    displayName: 'Bubu',
    shortBio: 'An expressive local AI companion with a robotic emotional face.',
    responseStyle: 'Friendly, practical, and emotionally aware.',
    verbosity: 'balanced',
    maxHistoryMessages: 12,
    idleTimeoutSeconds: 60,
    enableCommandMode: true,
    enableTypingGaze: true,
    enableForeheadReaction: true,
    enableAutoEmotion: true,
    skills: [],
    tools: []
  };

  getConfig(): AppConfig {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (!stored) {
      return { ...this.defaultConfig };
    }

    try {
      const parsed = JSON.parse(stored) as AppConfig;
      return {
        ...this.defaultConfig,
        ...parsed,
        skills: parsed.skills ?? [],
        tools: parsed.tools ?? []
      };
    } catch {
      return { ...this.defaultConfig };
    }
  }

  saveConfig(config: AppConfig): void {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  }

  getHistory(): ChatMessage[] {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (!stored) {
      return [];
    }

    try {
      return JSON.parse(stored) as ChatMessage[];
    } catch {
      return [];
    }
  }

  saveHistory(history: ChatMessage[]): void {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }

  addSkill(config: AppConfig, skill: Omit<Skill, 'id'>): AppConfig {
    return {
      ...config,
      skills: [
        ...config.skills,
        {
          ...skill,
          id: crypto.randomUUID()
        }
      ]
    };
  }

  addTool(config: AppConfig, tool: Omit<Tool, 'id'>): AppConfig {
    return {
      ...config,
      tools: [
        ...config.tools,
        {
          ...tool,
          id: crypto.randomUUID()
        }
      ]
    };
  }
}
