import { Injectable, inject } from '@angular/core';
import { Database, ref, get } from '@angular/fire/database';
import { AuthService } from './auth.service';
import { FriendsService } from './friends.service';
import { Observable, from, map, of, take } from 'rxjs';

export interface FeedEntry {
  uid:         string;
  username:    string;
  photoURL?:   string;
  gameId:      string;
  gameName:    string;
  gameImage:   string;
  achievementId:   string;
  achievementName: string;
  timestamp:   number;
}

@Injectable({ providedIn: 'root' })
export class FeedService {
  private db      = inject(Database);
  private auth    = inject(AuthService);
  private friends = inject(FriendsService);

  async getFriendsActivity(limitPerFriend = 10): Promise<FeedEntry[]> {
    // Get friend list (one-shot)
    const friendList = await new Promise<any[]>(res =>
      this.friends.getFriends().pipe(take(1)).subscribe(f => res(f))
    );
    if (!friendList.length) return [];

    const entries: FeedEntry[] = [];

    for (const friend of friendList) {
      const actSnap = await get(ref(this.db, `/activity/${friend.uid}`));
      if (!actSnap.exists()) continue;
      const raw = actSnap.val() as Record<string, any>;
      const recent = Object.values(raw)
        .sort((a: any, b: any) => b.timestamp - a.timestamp)
        .slice(0, limitPerFriend);

      for (const e of recent) {
        const [gameSnap, achSnap] = await Promise.all([
          get(ref(this.db, `/games/${e.gameId}`)),
          get(ref(this.db, `/achievements/${e.gameId}/${e.achievementId}`))
        ]);
        if (!gameSnap.exists()) continue;
        entries.push({
          uid:             friend.uid,
          username:        friend.username,
          photoURL:        friend.photoURL,
          gameId:          e.gameId,
          gameName:        gameSnap.val().name,
          gameImage:       gameSnap.val().image,
          achievementId:   e.achievementId,
          achievementName: achSnap.exists() ? achSnap.val().name : e.achievementId,
          timestamp:       e.timestamp
        });
      }
    }

    return entries.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
  }
}
