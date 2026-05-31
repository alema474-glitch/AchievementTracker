import { Injectable, inject } from '@angular/core';
import { Database, ref, objectVal, remove, set, get } from '@angular/fire/database';
import { Observable, map, of, switchMap } from 'rxjs';
import { AuthService } from './auth.service';
import { Logros } from '../models/logros.module';

export interface ActivityEntry {
  gameId:      string;
  gameName:    string;
  gameImage:   string;
  achievementId:   string;
  achievementName: string;
  timestamp:   number;
}

@Injectable({ providedIn: 'root' })
export class LogrosService {
  private db   = inject(Database);
  private auth = inject(AuthService);

  getAchievementsPorJuego(idJuego: string): Observable<Logros[]> {
    const achRef = ref(this.db, `/achievements/${idJuego}`);
    return objectVal<Record<string, any> | null>(achRef).pipe(
      map(res => {
        if (!res) return [];
        return Object.keys(res).map(id => new Logros(id, res[id].name, idJuego));
      })
    );
  }

  getAchievementsUser(idJuego: string): Observable<{achievement: Logros, conseguido: boolean}[]> {
    const uid = this.auth.getUid();
    if (!uid) return of([]);
    return this.getAchievementsPorJuego(idJuego).pipe(
      switchMap(achievements => {
        const userRef = ref(this.db, `/achievementsUser/${uid}/${idJuego}`);
        return objectVal<Record<string, any> | null>(userRef).pipe(
          map(userRes => achievements.map(a => ({
            achievement: a,
            conseguido: userRes ? !!userRes[a.id]?.conseguido : false
          })))
        );
      })
    );
  }

  async addAchievementUser(idJuego: string, idAchievement: string) {
    const uid = this.auth.getUid();
    if (!uid) throw new Error('Usuario no autenticado');
    const ts = Date.now();
    await set(ref(this.db, `/achievementsUser/${uid}/${idJuego}/${idAchievement}`), {
      conseguido: true, timestamp: ts
    });
    // Write to activity feed
    await set(ref(this.db, `/activity/${uid}/${ts}_${idAchievement}`), {
      gameId: idJuego, achievementId: idAchievement, timestamp: ts
    });
  }

  async removeAchievementUser(idJuego: string, idAchievement: string) {
    const uid = this.auth.getUid();
    if (!uid) throw new Error('Usuario no autenticado');
    await remove(ref(this.db, `/achievementsUser/${uid}/${idJuego}/${idAchievement}`));
    // Remove from activity (find by gameId+achievementId)
    const actSnap = await get(ref(this.db, `/activity/${uid}`));
    if (actSnap.exists()) {
      const entries = actSnap.val() as Record<string, any>;
      for (const [key, val] of Object.entries(entries)) {
        if (val.gameId === idJuego && val.achievementId === idAchievement) {
          await remove(ref(this.db, `/activity/${uid}/${key}`));
        }
      }
    }
  }

  async toggleAchievement(idJuego: string, idAchievement: string, conseguido: boolean) {
    if (conseguido) return this.removeAchievementUser(idJuego, idAchievement);
    return this.addAchievementUser(idJuego, idAchievement);
  }

  // ── Activity feed ──────────────────────────────────────────────────────────
  async getActivityFeed(limit = 50): Promise<ActivityEntry[]> {
    const uid = this.auth.getUid();
    if (!uid) return [];
    const actSnap = await get(ref(this.db, `/activity/${uid}`));
    if (!actSnap.exists()) return [];

    const raw = actSnap.val() as Record<string, any>;
    const entries = Object.values(raw)
      .sort((a: any, b: any) => b.timestamp - a.timestamp)
      .slice(0, limit);

    const results: ActivityEntry[] = [];
    for (const e of entries) {
      const [gameSnap, achSnap] = await Promise.all([
        get(ref(this.db, `/games/${e.gameId}`)),
        get(ref(this.db, `/achievements/${e.gameId}/${e.achievementId}`))
      ]);
      if (!gameSnap.exists()) continue;
      results.push({
        gameId:          e.gameId,
        gameName:        gameSnap.val().name,
        gameImage:       gameSnap.val().image,
        achievementId:   e.achievementId,
        achievementName: achSnap.exists() ? achSnap.val().name : e.achievementId,
        timestamp:       e.timestamp
      });
    }
    return results;
  }
}
