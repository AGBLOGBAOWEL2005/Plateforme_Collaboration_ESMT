import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export type Notification = {
  id: number;
  user: number;
  notification: string;
  date_notification: string;
  lu: boolean;
};

export type Message = {
  id: number;
  conversation: number;
  sender: number;
  sender_details?: any;
  contenu: string;
  date_envoi: string;
  lu: boolean;
  message_parent?: number;
  message_parent_details?: {
    id: number;
    sender: string;
    contenu: string;
  };
  reactions?: Reaction[];
};

export type Reaction = {
  id: number;
  message: number;
  user: number;
  user_details?: any;
  emoji: string;
  date_reaction: string;
};

export type Conversation = {
  id: number;
  type: 'PRIVE' | 'PROJET';
  project?: number;
  project_title?: string;
  created_at: string;
  participants: number[];
  participants_details?: any[];
  messages?: Message[];
  last_message?: Message;
};

@Injectable({ providedIn: 'root' })
export class CommunicationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://127.0.0.1:8000/api/communication/';

  // Notifications
  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.baseUrl}notifications/`);
  }

  getUnreadCount(): Observable<number> {
    return this.getNotifications().pipe(
      map(notifs => notifs.filter(n => !n.lu).length)
    );
  }

  markNotificationAsRead(id: number): Observable<any> {
    return this.http.patch(`${this.baseUrl}notifications/${id}/`, { lu: true });
  }

  deleteNotification(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}notifications/${id}/`);
  }

  // Messagerie
  getConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${this.baseUrl}conversations/`);
  }

  getMessages(conversationId: number): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.baseUrl}messages/?conversation=${conversationId}`);
  }

  sendMessage(conversationId: number, contenu: string, parentId?: number): Observable<Message> {
    return this.http.post<Message>(`${this.baseUrl}messages/`, {
      conversation: conversationId,
      contenu: contenu,
      message_parent: parentId
    });
  }

  reactToMessage(messageId: number, emoji: string): Observable<any> {
    return this.http.post(`${this.baseUrl}messages/${messageId}/react/`, { emoji });
  }

  createConversation(data: Partial<Conversation>): Observable<Conversation> {
    return this.http.post<Conversation>(`${this.baseUrl}conversations/`, data);
  }
}
