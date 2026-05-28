import { Injectable, inject } from '@angular/core';
import { Database, ref, objectVal, set, remove, get, update, push, onValue, off } from '@angular/fire/database';
import { Observable, map, of, switchMap, combineLatest, from } from 'rxjs';
import { AuthService } from './auth.service';

export interface FriendRequest {
  id?: string;
  fromUid: string;
  fromUsername: string;
  toUid: string;
  toUsername: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface Friend {
  uid: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  photoURL?: string;
  since: string;
}

export interface ChatMessage {
  id?: string;
  fromUid: string;
  fromUsername: string;
  text: string;
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class FriendsService {
  private db = inject(Database);
  private auth = inject(AuthService);

  // ── Search users by username ─────────────────────────────────────────────
  searchUsers(query: string): Observable<any[]> {
    if (!query || query.length < 2) return of([]);
    const usersRef = ref(this.db, '/users');
    return from(get(usersRef)).pipe(
      map(snapshot => {
        if (!snapshot.exists()) return [];
        const myUid = this.auth.getUid();
        const all = snapshot.val() as Record<string, any>;
        return Object.entries(all)
          .filter(([uid, u]) =>
            uid !== myUid &&
            u.username?.toLowerCase().includes(query.toLowerCase())
          )
          .map(([uid, u]) => ({ uid, ...u }))
          .slice(0, 10);
      })
    );
  }

  // ── Friend requests ──────────────────────────────────────────────────────
  async sendFriendRequest(toUid: string, toUsername: string): Promise<void> {
    const myUid = this.auth.getUid();
    if (!myUid) throw new Error('No auth');
    const myProfile = await this.auth.getUserProfile();
    const reqRef = ref(this.db, `/friendRequests/${toUid}/${myUid}`);
    await set(reqRef, {
      fromUid: myUid,
      fromUsername: myProfile.username,
      toUid,
      toUsername,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
  }

  getIncomingRequests(): Observable<FriendRequest[]> {
    const uid = this.auth.getUid();
    if (!uid) return of([]);
    const reqRef = ref(this.db, `/friendRequests/${uid}`);
    return objectVal<Record<string, any> | null>(reqRef).pipe(
      map(res => {
        if (!res) return [];
        return Object.entries(res)
          .filter(([, r]) => r.status === 'pending')
          .map(([id, r]) => ({ id, ...r } as FriendRequest));
      })
    );
  }

  async acceptRequest(fromUid: string): Promise<void> {
    const myUid = this.auth.getUid();
    if (!myUid) throw new Error('No auth');

    const reqSnap = await get(ref(this.db, `/friendRequests/${myUid}/${fromUid}`));
    if (!reqSnap.exists()) throw new Error('Request not found');

    const now = new Date().toISOString();
    // Add to both friends lists
    await set(ref(this.db, `/friends/${myUid}/${fromUid}`), { since: now });
    await set(ref(this.db, `/friends/${fromUid}/${myUid}`), { since: now });
    // Remove request
    await remove(ref(this.db, `/friendRequests/${myUid}/${fromUid}`));
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

  // ── Friends list ─────────────────────────────────────────────────────────
  getFriends(): Observable<Friend[]> {
    const uid = this.auth.getUid();
    if (!uid) return of([]);
    const friendsRef = ref(this.db, `/friends/${uid}`);
    return objectVal<Record<string, any> | null>(friendsRef).pipe(
      switchMap(res => {
        if (!res) return of([]);
        const uids = Object.keys(res);
        const userFetches = uids.map(fuid =>
          from(get(ref(this.db, `/users/${fuid}`))).pipe(
            map(snap => snap.exists() ? { uid: fuid, since: res[fuid].since, ...snap.val() } as Friend : null)
          )
        );
        return combineLatest(userFetches).pipe(
          map(friends => friends.filter(Boolean) as Friend[])
        );
      })
    );
  }

  async isFriend(otherUid: string): Promise<boolean> {
    const myUid = this.auth.getUid();
    if (!myUid) return false;
    const snap = await get(ref(this.db, `/friends/${myUid}/${otherUid}`));
    return snap.exists();
  }

  async hasPendingRequest(toUid: string): Promise<boolean> {
    const myUid = this.auth.getUid();
    if (!myUid) return false;
    const snap = await get(ref(this.db, `/friendRequests/${toUid}/${myUid}`));
    return snap.exists();
  }

  // ── User public profile ──────────────────────────────────────────────────
  getUserPublicProfile(uid: string): Observable<any> {
    const userRef = ref(this.db, `/users/${uid}`);
    return objectVal<any>(userRef).pipe(
      map(data => data ? { uid, ...data } : null)
    );
  }

  // ── Chat ─────────────────────────────────────────────────────────────────
  getChatId(uid1: string, uid2: string): string {
    return [uid1, uid2].sort().join('_');
  }

  getChatMessages(friendUid: string): Observable<ChatMessage[]> {
    const myUid = this.auth.getUid();
    if (!myUid) return of([]);
    const chatId = this.getChatId(myUid, friendUid);
    const chatRef = ref(this.db, `/chats/${chatId}/messages`);
    return objectVal<Record<string, any> | null>(chatRef).pipe(
      map(res => {
        if (!res) return [];
        return Object.entries(res)
          .map(([id, m]) => ({ id, ...m } as ChatMessage))
          .sort((a, b) => a.timestamp - b.timestamp);
      })
    );
  }

  async sendMessage(friendUid: string, text: string): Promise<void> {
    const myUid = this.auth.getUid();
    if (!myUid || !text.trim()) return;
    const myProfile = await this.auth.getUserProfile();
    const chatId = this.getChatId(myUid, friendUid);
    const msgsRef = ref(this.db, `/chats/${chatId}/messages`);
    await push(msgsRef, {
      fromUid: myUid,
      fromUsername: myProfile.username,
      text: text.trim(),
      timestamp: Date.now()
    });
  }
}
