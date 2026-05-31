import { Injectable, inject, signal, computed } from '@angular/core';
import { Database, ref, onValue, off, set, get, objectVal, update } from '@angular/fire/database';
import { AuthService } from './auth.service';
import { Subject } from 'rxjs';

export interface AppNotification {
  id: string;
  type: 'message' | 'friend_accept';
  fromUid: string;
  fromUsername: string;
  text?: string;       // for messages
  timestamp: number;
  read: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private db   = inject(Database);
  private auth = inject(AuthService);

  notifications = signal<AppNotification[]>([]);
  unreadCount   = computed(() => this.notifications().filter(n => !n.read).length);

  // Emits when a new notification arrives (for toast)
  newNotification$ = new Subject<AppNotification>();

  private dbRef: any;
  private initialized = false;

  init() {
    if (this.initialized) return;
    this.initialized = true;
    const uid = this.auth.getUid();
    if (!uid) return;

    this.dbRef = ref(this.db, `/notifications/${uid}`);
    onValue(this.dbRef, snapshot => {
      if (!snapshot.exists()) { this.notifications.set([]); return; }
      const val = snapshot.val() as Record<string, any>;
      const list: AppNotification[] = Object.entries(val)
        .map(([id, n]) => ({ id, ...n } as AppNotification))
        .sort((a, b) => b.timestamp - a.timestamp);

      const prev = this.notifications();
      const newOnes = list.filter(n =>
        !n.read && !prev.find(p => p.id === n.id)
      );
      this.notifications.set(list);

      // Emit new ones for toast
      newOnes.forEach(n => this.newNotification$.next(n));
    });
  }

  destroy() {
    if (this.dbRef) off(this.dbRef);
    this.initialized = false;
  }

  async markRead(id: string) {
    const uid = this.auth.getUid();
    if (!uid) return;
    await update(ref(this.db, `/notifications/${uid}/${id}`), { read: true });
  }

  async markAllRead() {
    const uid = this.auth.getUid();
    if (!uid) return;
    const snap = await get(ref(this.db, `/notifications/${uid}`));
    if (!snap.exists()) return;
    const updates: Record<string, any> = {};
    Object.keys(snap.val()).forEach(id => {
      updates[`/notifications/${uid}/${id}/read`] = true;
    });
    await update(ref(this.db), updates);
  }

  // ── Called by FriendsService when a message is sent ───────────────────────
  static async pushMessageNotification(
    db: Database, toUid: string,
    fromUid: string, fromUsername: string, text: string
  ) {
    const nRef = ref(db, `/notifications/${toUid}/${Date.now()}_msg_${fromUid}`);
    await set(nRef, {
      type: 'message', fromUid, fromUsername,
      text: text.length > 60 ? text.slice(0, 60) + '…' : text,
      timestamp: Date.now(), read: false
    });
  }

  // ── Called by FriendsService when a friend request is accepted ────────────
  static async pushFriendAcceptNotification(
    db: Database, toUid: string,
    fromUid: string, fromUsername: string
  ) {
    const nRef = ref(db, `/notifications/${toUid}/${Date.now()}_accept_${fromUid}`);
    await set(nRef, {
      type: 'friend_accept', fromUid, fromUsername,
      timestamp: Date.now(), read: false
    });
  }
}
