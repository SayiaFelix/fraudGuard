import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface GroqTurn {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable({ providedIn: 'root' })
export class GroqService {
  constructor(private http: HttpClient) {}

  async chat(system: string, messages: GroqTurn[], temperature = 0.4): Promise<string> {
    try {
      const response = await firstValueFrom(this.http.post<{ reply?: string; error?: string }>('/api/groq/chat', {
        system,
        messages,
        temperature
      }));
      const reply = (response?.reply || '').trim();
      if (!reply) {
        throw new Error(response?.error || 'The analysis service returned an empty reply');
      }
      return reply;
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        const detail = error.error?.error;
        throw new Error(typeof detail === 'string' && detail.trim() ? detail : 'The analysis service rejected the request');
      }
      throw error;
    }
  }

  async json<T>(system: string, messages: GroqTurn[], temperature = 0.3): Promise<T> {
    const reply = await this.chat(
      system + '\n\nReturn one JSON object only. Do not wrap it in markdown.',
      messages,
      temperature
    );
    const start = reply.indexOf('{');
    const end = reply.lastIndexOf('}');
    if (start < 0 || end <= start) {
      throw new Error('The analysis reply was not usable');
    }
    return JSON.parse(reply.slice(start, end + 1)) as T;
  }
}
