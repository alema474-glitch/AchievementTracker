import { Component, OnInit, OnDestroy, signal, inject, input, ViewChild, ElementRef, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FriendsService, ChatMessage } from '../../../services/friends.service';
import { AuthService } from '../../../services/auth.service';
import { Database, ref, onValue, off } from '@angular/fire/database';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent implements OnInit, OnDestroy {
  uid = input.required<string>();

  private friendsService = inject(FriendsService);
  private authService = inject(AuthService);
  private db = inject(Database);

  @ViewChild('messagesEnd') messagesEnd!: ElementRef;

  friendProfile = signal<any>(null);
  messages = signal<ChatMessage[]>([]);
  messageText = signal('');
  loading = signal(true);
  sending = signal(false);
  myUid = '';

  private sub?: Subscription;
  private dbRef: any;

  constructor() {
    afterNextRender(() => this.scrollToBottom());
  }

  ngOnInit() {
    this.myUid = this.authService.getUid()!;

    // Load friend profile
    this.friendsService.getUserPublicProfile(this.uid()).subscribe(p => {
      this.friendProfile.set(p);
    });

    // Real-time messages via Firebase listener
    const chatId = this.friendsService.getChatId(this.myUid, this.uid());
    this.dbRef = ref(this.db, `/chats/${chatId}/messages`);

    onValue(this.dbRef, snapshot => {
      if (!snapshot.exists()) {
        this.messages.set([]);
        this.loading.set(false);
        return;
      }
      const val = snapshot.val() as Record<string, any>;
      const msgs: ChatMessage[] = Object.entries(val)
        .map(([id, m]) => ({ id, ...m } as ChatMessage))
        .sort((a, b) => a.timestamp - b.timestamp);
      this.messages.set(msgs);
      this.loading.set(false);
      setTimeout(() => this.scrollToBottom(), 50);
    });
  }

  ngOnDestroy() {
    if (this.dbRef) off(this.dbRef);
    this.sub?.unsubscribe();
  }

  async send() {
    const text = this.messageText().trim();
    if (!text || this.sending()) return;
    this.sending.set(true);
    this.messageText.set('');
    try {
      await this.friendsService.sendMessage(this.uid(), text);
    } finally {
      this.sending.set(false);
    }
  }

  onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.send();
    }
  }

  isMe(msg: ChatMessage): boolean {
    return msg.fromUid === this.myUid;
  }

  formatTime(ts: number): string {
    const d = new Date(ts);
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  formatDate(ts: number): string {
    return new Date(ts).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  showDateSeparator(msgs: ChatMessage[], i: number): boolean {
    if (i === 0) return true;
    const prev = new Date(msgs[i - 1].timestamp).toDateString();
    const curr = new Date(msgs[i].timestamp).toDateString();
    return prev !== curr;
  }

  private scrollToBottom() {
    try {
      this.messagesEnd?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
    } catch {}
  }
}
