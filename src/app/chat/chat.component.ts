import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AppStateService } from '../app-state.service';
import { ChatService } from '../chat.service';
import { AppConfig, ChatApiResponse, ChatMessage, EmotionKey } from '../models';

type FaceExpressionKey =
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

interface EmotionProfile {
  key: EmotionKey;
  name: string;
  icon: string;
  description: string;
}

interface FaceExpression {
  key: FaceExpressionKey;
  name: string;
  icon: string;
  description: string;
}

interface CommandDefinition {
  command: string;
  aliases: string[];
  description: string;
  mode: 'set' | 'sleep' | 'wake' | 'auto';
  emotion?: EmotionKey;
  expression?: FaceExpressionKey;
}

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') private messagesContainer?: ElementRef<HTMLDivElement>;

  

  private readonly emotions: Record<EmotionKey, EmotionProfile> = {
    neutral: {
      key: 'neutral',
      name: 'Steady Core',
      icon: '🙂',
      description: 'Balanced and ready to listen.'
    },
    joyful: {
      key: 'joyful',
      name: 'Spark Joy',
      icon: '😄',
      description: 'Bright and upbeat energy.'
    },
    empathetic: {
      key: 'empathetic',
      name: 'Empathy Mode',
      icon: '🤗',
      description: 'Warm, supportive, and human-centered.'
    },
    curious: {
      key: 'curious',
      name: 'Curious Scan',
      icon: '🤔',
      description: 'Exploring details and asking better questions.'
    },
    worried: {
      key: 'worried',
      name: 'Soft Concern',
      icon: '😟',
      description: 'Careful and sensitive to uncertainty.'
    },
    frustrated: {
      key: 'frustrated',
      name: 'Tension Spike',
      icon: '😤',
      description: 'Detecting stress and reducing friction.'
    },
    thinking: {
      key: 'thinking',
      name: 'Thinking Loop',
      icon: '🧠',
      description: 'Processing your context and generating a response.'
    }
  };

  private readonly expressions: Record<FaceExpressionKey, FaceExpression> = {
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

  private readonly commands: CommandDefinition[] = [
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

  readonly commandHelp = this.commands.map((cmd) => ({
    command: cmd.command,
    aliases: cmd.aliases.slice(1).join(', '),
    description: cmd.description
  }));

  private readonly commandAliasMap = this.buildCommandAliasMap();

  private typingPauseTimer?: ReturnType<typeof setTimeout>;
  private idleTimer?: ReturnType<typeof setTimeout>;

  config!: AppConfig;
  messages: ChatMessage[] = [];
  draft = '';
  loading = false;
  error = '';

  userEmotion: EmotionKey = 'neutral';
  assistantEmotion: EmotionKey = 'neutral';
  currentEmotion: EmotionProfile = this.emotions.neutral;
  currentExpression: FaceExpression = this.expressions.notice;
  isUserTyping = false;
  showFaceText = false;
  isSleeping = false;
  isForeheadHover = false;

  private manualCommandOverride: { emotion: EmotionKey; expression: FaceExpressionKey } | null = null;
  private lastAssistantReply = '';
  private lastUserMessage = '';

  constructor(
    private readonly appState: AppStateService,
    private readonly chatService: ChatService
  ) {}

  @HostListener('document:mousemove')
  @HostListener('document:keydown')
  @HostListener('document:touchstart')
  onUserActivity(): void {
    if (this.loading) {
      this.resetIdleTimer();
      return;
    }

    if (this.isSleeping) {
      this.isSleeping = false;
      this.syncDisplayedEmotion(this.lastAssistantReply, this.lastUserMessage);
    }

    this.resetIdleTimer();
  }

  ngOnInit(): void {
    this.config = this.appState.getConfig();
    this.messages = this.appState.getHistory();

    const latestUser = [...this.messages].reverse().find((message) => message.role === 'user');
    const latestAssistant = [...this.messages].reverse().find((message) => message.role === 'assistant');

    if (latestUser) {
      this.userEmotion = this.detectTone(latestUser.content, 'user');
      this.lastUserMessage = latestUser.content;
    }
    if (latestAssistant) {
      this.lastAssistantReply = latestAssistant.content;
      this.assistantEmotion = this.inferEmotionFromReply(latestAssistant.content);
    }

    this.syncDisplayedEmotion(this.lastAssistantReply, this.lastUserMessage);
    this.scrollMessagesToBottom();
    this.resetIdleTimer();
  }

  ngOnDestroy(): void {
    if (this.typingPauseTimer) {
      clearTimeout(this.typingPauseTimer);
    }
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }
  }

  onComposerEnter(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.shiftKey) {
      return;
    }

    keyboardEvent.preventDefault();
    this.sendMessage();
  }

  onFaceHover(event: MouseEvent): void {
    if (this.loading || this.isSleeping || !this.config.enableForeheadReaction) {
      return;
    }

    const target = event.currentTarget as HTMLElement | null;
    if (!target) {
      return;
    }

    const rect = target.getBoundingClientRect();
    const relX = (event.clientX - rect.left) / rect.width;
    const relY = (event.clientY - rect.top) / rect.height;
    const inForeheadZone = relY >= 0.06 && relY <= 0.34 && relX >= 0.22 && relX <= 0.78;

    if (inForeheadZone === this.isForeheadHover) {
      return;
    }

    this.isForeheadHover = inForeheadZone;

    if (this.isForeheadHover && this.config.enableForeheadReaction) {
      this.currentEmotion = this.emotions.joyful;
      this.currentExpression = this.expressions.shy;
    } else {
      this.syncDisplayedEmotion(this.lastAssistantReply, this.lastUserMessage);
    }
  }

  onFaceLeave(): void {
    if (!this.isForeheadHover) {
      return;
    }

    this.isForeheadHover = false;
    this.syncDisplayedEmotion(this.lastAssistantReply, this.lastUserMessage);
  }

  onDraftTyping(): void {
    if (this.loading) {
      return;
    }

    if (!this.draft.trim()) {
      this.stopTypingGaze();
      this.resetIdleTimer();
      return;
    }

    this.isSleeping = false;
    this.isUserTyping = true;
    this.isForeheadHover = false;

    if (!this.config.enableTypingGaze) {
      if (this.typingPauseTimer) {
        clearTimeout(this.typingPauseTimer);
      }
      this.typingPauseTimer = setTimeout(() => {
        this.isUserTyping = false;
        this.syncDisplayedEmotion(this.lastAssistantReply, this.lastUserMessage);
      }, 700);
      this.resetIdleTimer();
      return;
    }

    const curiousTyping = this.draft.includes('?') || /\b(why|how|what|can|could)\b/i.test(this.draft);
    this.currentEmotion = curiousTyping ? this.emotions.curious : this.emotions.neutral;
    this.currentExpression = curiousTyping ? this.expressions.inquiry : this.expressions.notice;

    if (this.typingPauseTimer) {
      clearTimeout(this.typingPauseTimer);
    }

    this.typingPauseTimer = setTimeout(() => {
      this.isUserTyping = false;
      this.syncDisplayedEmotion(this.lastAssistantReply, this.lastUserMessage);
    }, 700);

    this.resetIdleTimer();
  }

  sendMessage(): void {
    if (!this.draft.trim() || this.loading) {
      return;
    }

    this.error = '';
    this.isSleeping = false;
    this.isForeheadHover = false;
    this.stopTypingGaze();

    const outgoingText = this.draft.trim();
    const userMessage: ChatMessage = {
      role: 'user',
      content: outgoingText,
      timestamp: new Date().toISOString()
    };

    this.messages = [...this.messages, userMessage];
    this.appState.saveHistory(this.messages);
    this.scrollMessagesToBottom();

    this.lastUserMessage = userMessage.content;
    this.userEmotion = this.detectTone(userMessage.content, 'user');

    const command = this.config.enableCommandMode ? this.parseCommand(outgoingText) : null;
    this.draft = '';

    if (command) {
      const commandReply = this.applyCommand(command);
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: commandReply,
        timestamp: new Date().toISOString()
      };
      this.messages = [...this.messages, assistantMessage];
      this.appState.saveHistory(this.messages);
      this.scrollMessagesToBottom();
      this.resetIdleTimer();
      return;
    }

    this.currentEmotion = this.emotions.thinking;
    this.currentExpression = this.expressions.scanning;
    this.loading = true;

    this.chatService.sendMessage(outgoingText, this.messages, this.config).subscribe({
      next: (response: ChatApiResponse) => {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response.reply,
          timestamp: new Date().toISOString()
        };

        this.lastAssistantReply = response.reply;
        this.assistantEmotion = this.resolveAssistantEmotion(response);

        this.messages = [...this.messages, assistantMessage];
        this.appState.saveHistory(this.messages);
        this.loading = false;
        this.syncDisplayedEmotion(response.reply, outgoingText);
        this.scrollMessagesToBottom();
        this.resetIdleTimer();
      },
      error: (err) => {
        this.error = err?.error?.error ?? 'Could not reach the local Ollama bridge.';
        this.loading = false;
        this.currentEmotion = this.emotions.worried;
        this.currentExpression = this.expressions.skeptical;
        this.resetIdleTimer();
      }
    });
  }

  clearHistory(): void {
    this.messages = [];
    this.userEmotion = 'neutral';
    this.assistantEmotion = 'neutral';
    this.currentEmotion = this.emotions.neutral;
    this.currentExpression = this.expressions.notice;
    this.lastAssistantReply = '';
    this.lastUserMessage = '';
    this.manualCommandOverride = null;
    this.stopTypingGaze();
    this.isSleeping = false;
    this.isForeheadHover = false;
    this.appState.saveHistory([]);
    this.resetIdleTimer();
  }

  toggleFaceText(): void {
    this.showFaceText = !this.showFaceText;
    this.resetIdleTimer();
  }

  private parseCommand(input: string): CommandDefinition | null {
    const clean = input.trim().toLowerCase().replace(/^\//, '').replace(/[^a-z\s-]/g, '');
    const token = clean.split(/\s+/)[0];

    if (!token) {
      return null;
    }

    const mappedCommand = this.commandAliasMap[token];
    if (!mappedCommand) {
      return null;
    }

    return this.commands.find((cmd) => cmd.command === mappedCommand) ?? null;
  }

  private applyCommand(command: CommandDefinition): string {
    if (command.mode === 'sleep') {
      this.manualCommandOverride = null;
      this.enterSleepMode();
      return 'Entering sleep mode. Type `/wake` when you want me back.';
    }

    if (command.mode === 'wake') {
      this.isSleeping = false;
      this.syncDisplayedEmotion(this.lastAssistantReply, this.lastUserMessage);
      return 'Awake and ready.';
    }

    if (command.mode === 'auto') {
      this.isSleeping = false;
      this.manualCommandOverride = null;
      this.syncDisplayedEmotion(this.lastAssistantReply, this.lastUserMessage);
      return 'Returned to automatic emotion tracking from AI responses.';
    }

    if (!command.emotion || !command.expression) {
      return 'Command recognized, but expression mapping is missing.';
    }

    this.isSleeping = false;
    this.manualCommandOverride = {
      emotion: command.emotion,
      expression: command.expression
    };

    this.currentEmotion = this.emotions[command.emotion];
    this.currentExpression = this.expressions[command.expression];

    return `Set mode to ${this.expressions[command.expression].name}. Use /auto to return to dynamic mode.`;
  }

  private stopTypingGaze(): void {
    this.isUserTyping = false;
    if (this.typingPauseTimer) {
      clearTimeout(this.typingPauseTimer);
      this.typingPauseTimer = undefined;
    }
  }

  private resetIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }

    this.idleTimer = setTimeout(() => {
      this.enterSleepMode();
    }, this.getIdleMs());
  }

  private enterSleepMode(): void {
    if (this.loading || this.isUserTyping) {
      this.resetIdleTimer();
      return;
    }

    this.isSleeping = true;
    this.isForeheadHover = false;
    this.currentEmotion = this.emotions.neutral;
    this.currentExpression = this.expressions.sleeping;
  }

  private scrollMessagesToBottom(): void {
    setTimeout(() => {
      if (!this.messagesContainer?.nativeElement) {
        return;
      }

      const el = this.messagesContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    });
  }

  private resolveAssistantEmotion(response: ChatApiResponse): EmotionKey {
    if (!this.config.enableAutoEmotion) {
      return this.isEmotionKey(response.emotion) ? response.emotion : 'neutral';
    }

    const inferred = this.inferEmotionFromReply(response.reply);

    if (inferred !== 'neutral') {
      return inferred;
    }

    return this.isEmotionKey(response.emotion) ? response.emotion : 'neutral';
  }

  private getIdleMs(): number {
    const seconds = Number(this.config.idleTimeoutSeconds);
    if (!Number.isFinite(seconds)) {
      return 60_000;
    }

    return Math.max(10, Math.min(600, seconds)) * 1000;
  }

  private syncDisplayedEmotion(assistantReply = '', userText = ''): void {
    if (this.isSleeping) {
      this.currentEmotion = this.emotions.neutral;
      this.currentExpression = this.expressions.sleeping;
      return;
    }

    if (this.isForeheadHover) {
      this.currentEmotion = this.emotions.joyful;
      this.currentExpression = this.expressions.shy;
      return;
    }

    if (this.loading) {
      this.currentEmotion = this.emotions.thinking;
      this.currentExpression = this.expressions.scanning;
      return;
    }

    if (this.manualCommandOverride && this.config.enableCommandMode) {
      this.currentEmotion = this.emotions[this.manualCommandOverride.emotion];
      this.currentExpression = this.expressions[this.manualCommandOverride.expression];
      return;
    }

    this.currentEmotion = this.emotions[this.assistantEmotion] ?? this.emotions[this.userEmotion] ?? this.emotions.neutral;
    this.currentExpression = this.pickExpression(this.currentEmotion.key, assistantReply, userText);
  }

  private pickExpression(emotion: EmotionKey, assistantReply: string, userText: string): FaceExpression {
    const assistant = assistantReply.toLowerCase();
    const user = userText.toLowerCase();

    if (assistant.includes('bored') || user.includes('bored')) {
      return this.expressions.bored;
    }

    if (emotion === 'thinking') {
      return this.expressions.scanning;
    }

    if (emotion === 'curious') {
      return assistant.includes('?') ? this.expressions.inquiry : this.expressions.curious;
    }

    if (emotion === 'joyful') {
      return assistant.includes('ha') || assistant.includes('lol') ? this.expressions.laugh : this.expressions.amazed;
    }

    if (emotion === 'worried') {
      return assistant.includes('cry') || assistant.includes('tears') ? this.expressions.cry : this.expressions.ponder;
    }

    if (emotion === 'frustrated') {
      return assistant.includes('suspicious') || assistant.includes('not sure')
        ? this.expressions.suspicious
        : this.expressions.irate;
    }

    if (emotion === 'empathetic') {
      return this.expressions.notice;
    }

    if (assistant.includes('focus') || assistant.includes('step')) {
      return this.expressions.concentrate;
    }

    return this.expressions.calm;
  }

  private inferEmotionFromReply(text: string): EmotionKey {
    const normalized = text.toLowerCase();

    if (this.includesAny(normalized, ['angry', 'annoyed', 'frustrated', 'hate', 'ridiculous', 'wtf'])) {
      return 'frustrated';
    }

    if (this.includesAny(normalized, ['sad', 'upset', 'worried', 'anxious', 'afraid', 'concern', 'unfortunately', 'cry'])) {
      return 'worried';
    }

    if (this.includesAny(normalized, ['sorry', 'i understand', 'i hear you', 'that sounds hard', 'you are not alone'])) {
      return 'empathetic';
    }

    if (
      normalized.includes('!') ||
      this.includesAny(normalized, ['great', 'awesome', 'amazing', 'excellent', 'perfect', 'love', 'glad', 'nice', 'fantastic', 'haha'])
    ) {
      return 'joyful';
    }

    if (normalized.includes('?') || this.includesAny(normalized, ['why', 'how', 'what', 'could', 'maybe', 'let us explore'])) {
      return 'curious';
    }

    return 'neutral';
  }

  private detectTone(text: string, role: 'user' | 'assistant'): EmotionKey {
    const normalized = text.toLowerCase();

    if (this.includesAny(normalized, ['angry', 'annoyed', 'frustrated', 'hate', 'stupid', 'worst', 'wtf'])) {
      return 'frustrated';
    }

    if (this.includesAny(normalized, ['sad', 'upset', 'anxious', 'worried', 'scared', 'afraid', 'stress'])) {
      return 'worried';
    }

    if (this.includesAny(normalized, ['thanks', 'thank you', 'great', 'awesome', 'love', 'perfect', 'amazing', 'yay'])) {
      return 'joyful';
    }

    if (normalized.includes('?') || this.includesAny(normalized, ['why', 'how', 'what', 'could you', 'can you'])) {
      return 'curious';
    }

    if (
      role === 'assistant' &&
      this.includesAny(normalized, ['i understand', 'i hear you', 'sorry', 'let us fix', 'you can do this', 'we can'])
    ) {
      return 'empathetic';
    }

    return 'neutral';
  }

  private includesAny(text: string, terms: string[]): boolean {
    return terms.some((term) => text.includes(term));
  }

  private buildCommandAliasMap(): Record<string, string> {
    const map: Record<string, string> = {};
    for (const cmd of this.commands) {
      for (const alias of cmd.aliases) {
        map[alias] = cmd.command;
      }
    }
    return map;
  }

  private isEmotionKey(value: string): value is EmotionKey {
    return value in this.emotions;
  }

  get userToneName(): string {
    return this.emotions[this.userEmotion].name;
  }

  get assistantToneName(): string {
    return this.emotions[this.assistantEmotion].name;
  }
}
