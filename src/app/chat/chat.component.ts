import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AppStateService } from '../app-state.service';
import { ChatService } from '../chat.service';
import { AppConfig, ChatApiResponse, ChatMessage, EmotionKey, SearchFilesToolResponse } from '../models';
import {
  COMMAND_HELP,
  EMOTIONS,
  EXPRESSIONS,
  CommandDefinition,
  EmotionProfile,
  FaceExpression,
  FaceExpressionKey,
  ManualCommandOverride,
  detectTone,
  getIdleMs,
  inferEmotionFromReply,
  parseCommand,
  pickExpression,
  resolveAssistantEmotion
} from './expression-engine';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') private messagesContainer?: ElementRef<HTMLDivElement>;

  readonly commandHelp = COMMAND_HELP;

  private typingPauseTimer?: ReturnType<typeof setTimeout>;
  private idleTimer?: ReturnType<typeof setTimeout>;

  config!: AppConfig;
  messages: ChatMessage[] = [];
  draft = '';
  loading = false;
  error = '';

  userEmotion: EmotionKey = 'neutral';
  assistantEmotion: EmotionKey = 'neutral';
  currentEmotion: EmotionProfile = EMOTIONS.neutral;
  currentExpression: FaceExpression = EXPRESSIONS.notice;

  isUserTyping = false;
  showFaceText = false;
  isSleeping = false;
  isForeheadHover = false;

  private manualCommandOverride: ManualCommandOverride | null = null;
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
      this.userEmotion = detectTone(latestUser.content, 'user');
      this.lastUserMessage = latestUser.content;
    }

    if (latestAssistant) {
      this.lastAssistantReply = latestAssistant.content;
      this.assistantEmotion = inferEmotionFromReply(latestAssistant.content);
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

    if (this.isForeheadHover) {
      this.currentEmotion = EMOTIONS.joyful;
      this.currentExpression = EXPRESSIONS.shy;
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
      this.queueTypingPauseReset();
      this.resetIdleTimer();
      return;
    }

    const curiousTyping = this.draft.includes('?') || /\b(why|how|what|can|could)\b/i.test(this.draft);
    this.currentEmotion = curiousTyping ? EMOTIONS.curious : EMOTIONS.neutral;
    this.currentExpression = curiousTyping ? EXPRESSIONS.inquiry : EXPRESSIONS.notice;

    this.queueTypingPauseReset();
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
    this.userEmotion = detectTone(userMessage.content, 'user');

    const searchQuery = this.parseSearchQuery(outgoingText);
    const command = this.config.enableCommandMode ? parseCommand(outgoingText) : null;
    this.draft = '';

    if (searchQuery) {
      this.executeSearchCommand(searchQuery, outgoingText);
      return;
    }

    if (command) {
      const commandReply = this.applyCommand(command);
      this.appendAssistantMessage(commandReply);
      this.assistantEmotion = inferEmotionFromReply(commandReply);
      this.syncDisplayedEmotion(commandReply, outgoingText);
      this.resetIdleTimer();
      return;
    }

    this.currentEmotion = EMOTIONS.thinking;
    this.currentExpression = EXPRESSIONS.scanning;
    this.loading = true;

    this.chatService.sendMessage(outgoingText, this.messages, this.config).subscribe({
      next: (response: ChatApiResponse) => {
        this.lastAssistantReply = response.reply;
        this.assistantEmotion = resolveAssistantEmotion(response, this.config.enableAutoEmotion);

        this.appendAssistantMessage(response.reply);
        this.loading = false;
        this.syncDisplayedEmotion(response.reply, outgoingText);
        this.resetIdleTimer();
      },
      error: (err) => {
        this.error = err?.error?.error ?? 'Could not reach the local Ollama bridge.';
        this.loading = false;
        this.currentEmotion = EMOTIONS.worried;
        this.currentExpression = EXPRESSIONS.skeptical;
        this.resetIdleTimer();
      }
    });
  }

  clearHistory(): void {
    this.messages = [];
    this.userEmotion = 'neutral';
    this.assistantEmotion = 'neutral';
    this.currentEmotion = EMOTIONS.neutral;
    this.currentExpression = EXPRESSIONS.notice;
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

    this.currentEmotion = EMOTIONS[command.emotion];
    this.currentExpression = EXPRESSIONS[command.expression];

    return `Set mode to ${EXPRESSIONS[command.expression].name}. Use /auto to return to dynamic mode.`;
  }

  private parseSearchQuery(input: string): string | null {
    const match = input.match(/^\/search\s+(.+)$/i);
    if (!match) {
      return null;
    }

    const query = match[1].trim();
    return query || null;
  }

  private executeSearchCommand(query: string, userText: string): void {
    this.currentEmotion = EMOTIONS.thinking;
    this.currentExpression = EXPRESSIONS.scanning;
    this.loading = true;

    this.chatService
      .searchFiles({
        query,
        max_results: 20,
        max_file_size_bytes: 2000000
      })
      .subscribe({
        next: (response: SearchFilesToolResponse) => {
          const reply = this.formatSearchReply(query, response);
          this.appendAssistantMessage(reply);
          this.assistantEmotion = inferEmotionFromReply(reply);
          this.loading = false;
          this.syncDisplayedEmotion(reply, userText);
          this.resetIdleTimer();
        },
        error: (err) => {
          const status = Number(err?.status || 0);
          let fallback = err?.error?.error || 'I tried running the file search, but the tool is unavailable right now.';

          if (status === 0) {
            fallback = 'Search tool backend is offline. Start both services with: npm run dev';
          } else if (status === 404) {
            fallback = 'search_files tool route was not found. Restart backend with latest code: npm run start:api';
          }

          const reply = `I could not complete that search yet. ${fallback}`;
          this.error = fallback;
          this.appendAssistantMessage(reply);
          this.assistantEmotion = 'worried';
          this.loading = false;
          this.syncDisplayedEmotion(reply, userText);
          this.resetIdleTimer();
        }
      });
  }

  private formatSearchReply(query: string, response: SearchFilesToolResponse): string {
    if (!response.ok || !response.data) {
      return `I checked the workspace for "${query}", but I could not get valid search results.`;
    }

    const total = response.data.results.length;

    if (total === 0) {
      return `I searched the workspace for "${query}" and did not find a match. Try a broader phrase or another keyword.`;
    }

    const topResults = response.data.results.slice(0, 5);
    const lines = topResults.map((item, index) => {
      const snippet = item.snippet || '(no preview)';
      return `${index + 1}. ${item.path}:${item.line} - ${snippet}`;
    });

    const header = `I searched for "${query}" and found ${total} match${total === 1 ? '' : 'es'}.`;
    const truncationLine = response.data.truncated ? 'I stopped early due to result limits, but I can narrow it with a glob if you want.' : '';

    return [header, 'Top hits:', ...lines, truncationLine].filter(Boolean).join('\n');
  }

  private appendAssistantMessage(content: string): void {
    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content,
      timestamp: new Date().toISOString()
    };

    this.lastAssistantReply = content;
    this.messages = [...this.messages, assistantMessage];
    this.appState.saveHistory(this.messages);
    this.scrollMessagesToBottom();
  }

  private queueTypingPauseReset(): void {
    if (this.typingPauseTimer) {
      clearTimeout(this.typingPauseTimer);
    }

    this.typingPauseTimer = setTimeout(() => {
      this.isUserTyping = false;
      this.syncDisplayedEmotion(this.lastAssistantReply, this.lastUserMessage);
    }, 700);
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
    }, getIdleMs(this.config.idleTimeoutSeconds));
  }

  private enterSleepMode(): void {
    if (this.loading || this.isUserTyping) {
      this.resetIdleTimer();
      return;
    }

    this.isSleeping = true;
    this.isForeheadHover = false;
    this.currentEmotion = EMOTIONS.neutral;
    this.currentExpression = EXPRESSIONS.sleeping;
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

  private syncDisplayedEmotion(assistantReply = '', userText = ''): void {
    if (this.isSleeping) {
      this.currentEmotion = EMOTIONS.neutral;
      this.currentExpression = EXPRESSIONS.sleeping;
      return;
    }

    if (this.isForeheadHover && this.config.enableForeheadReaction) {
      this.currentEmotion = EMOTIONS.joyful;
      this.currentExpression = EXPRESSIONS.shy;
      return;
    }

    if (this.loading) {
      this.currentEmotion = EMOTIONS.thinking;
      this.currentExpression = EXPRESSIONS.scanning;
      return;
    }

    if (this.manualCommandOverride && this.config.enableCommandMode) {
      this.currentEmotion = EMOTIONS[this.manualCommandOverride.emotion];
      this.currentExpression = EXPRESSIONS[this.manualCommandOverride.expression];
      return;
    }

    this.currentEmotion = EMOTIONS[this.assistantEmotion] ?? EMOTIONS[this.userEmotion] ?? EMOTIONS.neutral;
    this.currentExpression = EXPRESSIONS[pickExpression(this.currentEmotion.key, assistantReply, userText) as FaceExpressionKey];
  }

  get userToneName(): string {
    return EMOTIONS[this.userEmotion].name;
  }

  get assistantToneName(): string {
    return EMOTIONS[this.assistantEmotion].name;
  }
}
