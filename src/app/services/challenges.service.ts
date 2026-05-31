import { Injectable, inject } from '@angular/core';
import { Database, ref, set, get, update, remove, objectVal, push } from '@angular/fire/database';
import { Observable, map, of, combineLatest, from, switchMap } from 'rxjs';
import { AuthService } from './auth.service';
import { NotificationsService } from './notifications.service';

export type ChallengeStatus = 'pending' | 'active' | 'won' | 'lost' | 'declined';

export interface Challenge {
  id?: string;
  fromUid:       string;
  fromUsername:  string;
  toUid:         string;
  toUsername:    string;
  gameId:        string;
  gameName:      string;
  gameImage:     string;
  achievementId:   string;
  achievementName: string;
  status:        ChallengeStatus;
  createdAt:     number;
  resolvedAt?:   number;
  winnerId?:     string;
}

@Injectable({ providedIn: 'root' })
export class ChallengesService {
  private db   = inject(Database);
  private auth = inject(AuthService);

  // ── Create ──────────────────────────────────────────────────────────────────
  async sendChallenge(
    toUid: string, toUsername: string,
    gameId: string, gameName: string, gameImage: string,
    achievementId: string, achievementName: string
  ): Promise<void> {
    const myUid    = this.auth.getUid()!;
    const myProfile = await this.auth.getUserProfile();
    const id       = `${Date.now()}_${myUid}`;
    const challenge: Omit<Challenge, 'id'> = {
      fromUid: myUid, fromUsername: myProfile.username,
      toUid, toUsername,
      gameId, gameName, gameImage,
      achievementId, achievementName,
      status: 'pending', createdAt: Date.now()
    };
    // Write to both users
    await set(ref(this.db, `/challenges/${myUid}/${id}`), challenge);
    await set(ref(this.db, `/challenges/${toUid}/${id}`), challenge);
    // Notify
    await NotificationsService.pushChallengeNotification(
      this.db, toUid, myUid, myProfile.username, achievementName
    );
  }

  async acceptChallenge(challengeId: string, fromUid: string): Promise<void> {
    const myUid = this.auth.getUid()!;
    await update(ref(this.db, `/challenges/${myUid}/${challengeId}`), { status: 'active' });
    await update(ref(this.db, `/challenges/${fromUid}/${challengeId}`), { status: 'active' });
  }

  async declineChallenge(challengeId: string, fromUid: string): Promise<void> {
    const myUid = this.auth.getUid()!;
    await update(ref(this.db, `/challenges/${myUid}/${challengeId}`), { status: 'declined' });
    await update(ref(this.db, `/challenges/${fromUid}/${challengeId}`), { status: 'declined' });
  }

  /** Called by LogrosService when an achievement is unlocked — checks for active challenge */
  async checkAndResolveChallenge(achievementId: string, gameId: string): Promise<void> {
    const myUid = this.auth.getUid()!;
    const snap  = await get(ref(this.db, `/challenges/${myUid}`));
    if (!snap.exists()) return;
    const all = snap.val() as Record<string, Challenge>;
    for (const [id, ch] of Object.entries(all)) {
      if (
        ch.status === 'active' &&
        ch.achievementId === achievementId &&
        ch.gameId === gameId
      ) {
        const winnerId  = myUid;
        const loserId   = ch.fromUid === myUid ? ch.toUid : ch.fromUid;
        const resolvedAt = Date.now();
        await update(ref(this.db, `/challenges/${myUid}/${id}`),   { status: 'won',  winnerId, resolvedAt });
        await update(ref(this.db, `/challenges/${loserId}/${id}`), { status: 'lost', winnerId, resolvedAt });
      }
    }
  }

  // ── Queries ─────────────────────────────────────────────────────────────────
  getMyChallenges(): Observable<Challenge[]> {
    const uid = this.auth.getUid();
    if (!uid) return of([]);
    return objectVal<Record<string, any> | null>(ref(this.db, `/challenges/${uid}`)).pipe(
      map(res => !res ? [] :
        Object.entries(res)
          .map(([id, c]) => ({ id, ...c } as Challenge))
          .sort((a, b) => b.createdAt - a.createdAt)
      )
    );
  }

  getPendingReceived(): Observable<Challenge[]> {
    return this.getMyChallenges().pipe(
      map(all => all.filter(c => c.status === 'pending' && c.toUid === this.auth.getUid()))
    );
  }

  getActiveCount(): Observable<number> {
    return this.getMyChallenges().pipe(
      map(all => all.filter(c => c.status === 'active' || c.status === 'pending').length)
    );
  }
}
