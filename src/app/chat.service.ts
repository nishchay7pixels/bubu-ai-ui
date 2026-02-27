import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfig, ChatApiResponse, ChatMessage } from './models';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly apiUrl = 'http://127.0.0.1:3333/api/chat';

  constructor(private readonly http: HttpClient) {}

  sendMessage(message: string, history: ChatMessage[], config: AppConfig): Observable<ChatApiResponse> {
    return this.http.post<ChatApiResponse>(this.apiUrl, {
      message,
      history,
      config
    });
  }
}
