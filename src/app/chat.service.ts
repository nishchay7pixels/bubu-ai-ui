import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfig, ChatApiResponse, ChatMessage, SearchFilesToolInput, SearchFilesToolResponse } from './models';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly apiUrl = 'http://127.0.0.1:3333/api/chat';
  private readonly toolsApiUrl = 'http://127.0.0.1:3333/api/tools';

  constructor(private readonly http: HttpClient) {}

  sendMessage(message: string, history: ChatMessage[], config: AppConfig): Observable<ChatApiResponse> {
    return this.http.post<ChatApiResponse>(this.apiUrl, {
      message,
      history,
      config
    });
  }

  searchFiles(input: SearchFilesToolInput): Observable<SearchFilesToolResponse> {
    return this.http.post<SearchFilesToolResponse>(`${this.toolsApiUrl}/search_files`, input);
  }
}
