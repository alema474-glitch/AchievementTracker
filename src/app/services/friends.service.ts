import { Injectable, inject } from '@angular/core';
import { Database, ref, objectVal, set, remove, get, update, push, onValue, off } from '@angular/fire/database';
import { Observable, map, of, switchMap, combineLatest, from } from 'rxjs';
import { AuthService } from './auth.service';
import { NotificationsService } from './notifications.service';

export interface FriendRequest {
  id?: string;
  fromUid: string; fromUsername: string;
  toUid: string;   toUsername: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}
export interface Friend {
  uid: string; username: string;
  firstName: string; lastName: string;
  email: string; photoURL?: string; since: string;
}
export interface ChatMessage {
  id?: string;
  fromUid: string; fromUsername: string;
  text: string; timestamp: number;
  read?: boolean;
}

@Injectable({ providedIn: 'root' })
export class FriendsService {
  private db   = inject(Database);
  private auth = inject(AuthService);

  searchUsers(query: string): Observable<any[]> {
    if (!query || query.length < 2) return of([]);
    return from(get(ref(this.db, '/users'))).pipe(
      map(snapshot => {
        if (!snapshot.exists()) return [];
        const myUid = this.auth.getUid();
        const all = snapshot.val() as Record<string, any>;
        return Object.entries(all)
          .filter(([uid, u]) => uid !== myUid && u.username?.toLowerCase().includes(query.toLowerCase()))
          .map(([uid, u]) => ({ uid, ...u }))
          .slice(0, 10);
      })
    );
  }

  async sendFriendRequest(toUid: string, toUsername: string): Promise<void> {
    const myUid = this.auth.getUid();
    if (!myUid) throw new Error('No auth');
    const myProfile = await this.auth.getUserProfile();
    await set(ref(this.db, `/friendRequests/${toUid}/${myUid}`), {
      fromUid: myUid, fromUsername: myProfile.username,
      toUid, toUsername, status: 'pending', createdAt: new Date().toISOString()
    });
  }

  getIncomingRequests(): Observable<FriendRequest[]> {
    const uid = this.auth.getUid();
    if (!uid) return of([]);
    return objectVal<Record<string, any> | null>(ref(this.db, `/friendRequests/${uid}`)).pipe(
      map(res => !res ? [] : Object.entries(res)
        .filter(([, r]) => r.status === 'pending')
        .map(([id, r]) => ({ id, ...r } as FriendRequest)))
    );
  }

  async acceptRequest(fromUid: string): Promise<void> {
    const myUid = this.auth.getUid();
    if (!myUid) throw new Error('No auth');
    const reqSnap = await get(ref(this.db, `/friendRequests/${myUid}/${fromUid}`));
    if (!reqSnap.exists()) throw new Error('Request not found');
    const req = reqSnap.val() as FriendRequest;
    const now = new Date().toISOString();
    await set(ref(this.db, `/friends/${myUid}/${fromUid}`), { since: now });
    await set(ref(this.db, `/friends/${fromUid}/${myUid}`), { since: now });
    await remove(ref(this.db, `/friendRequests/${myUid}/${fromUid}`));
    // Notify the requester
    const myProfile = await this.auth.getUserProfile();
    await NotificationsService.pushFriendAcceptNotification(
      this.db, fromUid, myUid, myProfile.username
    );
  }

  async rejectRequest(fromUid: string): Promise<void> {
    const myUid = this.auth.getUid();
    if (!myUid) return;
    await remove(ref(this.db, `/friendRequests/${myUid}/${fromUid}`));
  }

  async removeFriend(friendUid: string): Promise<void> {
    const myUid = this.auth.getUid();
    if (!myUid) return;
    await remove(ref(this.db, `/friends/${myUid}/${friendUid}`));
    await remove(ref(this.db, `/friends/${friendUid}/${myUid}`));
  }

  getFriends(): Observable<Friend[]> {
    const uid = this.auth.getUid();
    if (!uid) return of([]);
    return objectVal<Record<string, any> | null>(ref(this.db, `/friends/${uid}`)).pipe(
      switchMap(res => {
        if (!res) return of([]);
        const uids = Object.keys(res);
        return combineLatest(uids.map(fuid =>
          from(get(ref(this.db, `/users/${fuid}`))).pipe(
            map(snap => snap.exists() ? { uid: fuid, since: res[fuid].since, ...snap.val() } as Friend : null)
          )
        )).pipe(map(friends => friends.filter(Boolean) as Friend[]));
      })
    );
  }

  async isFriend(otherUid: string): Promise<boolean> {
    const myUid = this.auth.getUid();
    if (!myUid) return false;
    return (await get(ref(this.db, `/friends/${myUid}/${otherUid}`))).exists();
  }

  getUserPublicProfile(uid: string): Observable<any> {
    return objectVal<any>(ref(this.db, `/users/${uid}`)).pipe(
      map(data => data ? { uid, ...data } : null)
    );
  }

  // ── Chat ──────────────────────────────────────────────────────────────────
  getChatId(uid1: string, uid2: string): string { return [uid1, uid2].sort().join('_'); }

  getChatMessages(friendUid: string): Observable<ChatMessage[]> {
    const myUid = this.auth.getUid();
    if (!myUid) return of([]);
    const chatId = this.getChatId(myUid, friendUid);
    return objectVal<Record<string, any> | null>(ref(this.db, `/chats/${chatId}/messages`)).pipe(
      map(res => !res ? [] :
        Object.entries(res).map(([id, m]) => ({ id, ...m } as ChatMessage))
          .sort((a, b) => a.timestamp - b.timestamp)
      )
    );
  }

  async sendMessage(friendUid: string, text: string): Promise<void> {
    const myUid = this.auth.getUid();
    if (!myUid || !text.trim()) return;
    const myProfile = await this.auth.getUserProfile();
    const chatId = this.getChatId(myUid, friendUid);
    const ts = Date.now();
    await push(ref(this.db, `/chats/${chatId}/messages`), {
      fromUid: myUid, fromUsername: myProfile.username,
      text: text.trim(), timestamp: ts, read: false
    });
    // Push notification to recipient
    await NotificationsService.pushMessageNotification(
      this.db, friendUid, myUid, myProfile.username, text.trim()
    );
    // Mark last message metadata for unread count
    await set(ref(this.db, `/chats/${chatId}/meta/lastMsg`), {
      fromUid: myUid, text: text.trim(), timestamp: ts
    });
    // Increment unread for recipient
    const unreadRef = ref(this.db, `/chats/${chatId}/unread/${friendUid}`);
    const snap = await get(unreadRef);
    await set(unreadRef, (snap.exists() ? (snap.val() || 0) : 0) + 1);
  }

  /** Get unread count for a specific friend's chat */
  getUnreadCount(friendUid: string): Observable<number> {
    const myUid = this.auth.getUid();
    if (!myUid) return of(0);
    const chatId = this.getChatId(myUid, friendUid);
    return objectVal<number | null>(ref(this.db, `/chats/${chatId}/unread/${myUid}`)).pipe(
      map(n => n ?? 0)
    );
  }

  /** Mark chat as read (call when user opens chat) */
  async markChatRead(friendUid: string): Promise<void> {
    const myUid = this.auth.getUid();
    if (!myUid) return;
    const chatId = this.getChatId(myUid, friendUid);
    await set(ref(this.db, `/chats/${chatId}/unread/${myUid}`), 0);
  }

  /** Total unread across all friends */
  getTotalUnread(friendUids: string[]): Observable<number> {
    const myUid = this.auth.getUid();
    if (!myUid || !friendUids.length) return of(0);
    return combineLatest(friendUids.map(uid => this.getUnreadCount(uid))).pipe(
      map(counts => counts.reduce((a, b) => a + b, 0))
    );
  }
}
