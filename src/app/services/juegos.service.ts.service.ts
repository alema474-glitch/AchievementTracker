import { Injectable, inject } from '@angular/core';
import { Juego } from '../models/juegos.module';
import { Database, get, objectVal, ref, set, remove } from '@angular/fire/database';
import { AuthService } from './auth.service';
import { combineLatest, from, map, Observable, of, switchMap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class JuegosServiceTsService {
  private database = inject(Database);
  private auth     = inject(AuthService);

  getAllUserGamesFirebase(): Observable<Juego[]> {
    const uid = this.auth.getUid();
    if (!uid) return of([]);
    const libraryRef = ref(this.database, `/library/${uid}/games`);
    return objectVal<Record<string, any> | null>(libraryRef).pipe(
      switchMap((idsObj) => {
        if (!idsObj) return of([]);
        const ids = Object.keys(idsObj);
        const gameObservables = ids.map(id =>
          from(get(ref(this.database, `/games/${id}`))).pipe(
            map(snapshot => snapshot.exists() ? { ...snapshot.val(), appId: id } as Juego : null)
          )
        );
        return combineLatest(gameObservables);
      }),
      map(games => games.filter(g => g !== null) as Juego[])
    );
  }

  getGameById(appId: string): Observable<Juego | null> {
    const gameRef = ref(this.database, `/games/${appId}`);
    return objectVal<Juego | null>(gameRef).pipe(
      map(g => g ? { ...g, appId } : null)
    );
  }

  getAllGames(): Observable<Juego[]> {
    const gamesRef = ref(this.database, '/games');
    return objectVal<Record<string, any> | null>(gamesRef).pipe(
      map(res => {
        if (!res) return [];
        return Object.keys(res).map(id => ({
          appId: id, name: res[id].name, description: res[id].description,
          image: res[id].image, genres: res[id].genres || [],
          logrosConseguidos: res[id].logrosConseguidos,
          logrosTotales: res[id].logrosTotales, progreso: res[id].progreso || 0
        }));
      })
    );
  }

  async addGameToLibrary(juego: Juego): Promise<void> {
    const uid = this.auth.getUid();
    if (!uid) throw new Error('No hay usuario');
    await set(ref(this.database, `/library/${uid}/games/${juego.appId}`), {
      addedAt: new Date().toISOString()
    });
  }

  async addGame(game: Juego): Promise<void> {
    await set(ref(this.database, `/games/${game.appId}`), {
      name: game.name, description: game.description,
      image: game.image, genres: game.genres
    });
  }

  // ── Hidden games ─────────────────────────────────────────────────────────────
  getHiddenGames(): Observable<Set<string>> {
    const uid = this.auth.getUid();
    if (!uid) return of(new Set<string>());
    return objectVal<Record<string, boolean> | null>(
      ref(this.database, `/library/${uid}/hidden`)
    ).pipe(
      map(res => new Set(res ? Object.keys(res) : []))
    );
  }

  async hideGame(appId: string): Promise<void> {
    const uid = this.auth.getUid();
    if (!uid) return;
    await set(ref(this.database, `/library/${uid}/hidden/${appId}`), true);
  }

  async showGame(appId: string): Promise<void> {
    const uid = this.auth.getUid();
    if (!uid) return;
    await remove(ref(this.database, `/library/${uid}/hidden/${appId}`));
  }

  async removeGameFromLibrary(appId: string): Promise<void> {
    const uid = this.auth.getUid();
    if (!uid) return;
    // Remove from library entry, hidden entry, and user achievements
    await remove(ref(this.database, `/library/${uid}/games/${appId}`));
    await remove(ref(this.database, `/library/${uid}/hidden/${appId}`));
    await remove(ref(this.database, `/achievementsUser/${uid}/${appId}`));
    await remove(ref(this.database, `/activity/${uid}`));
    await remove(ref(this.database, `/notes/${uid}/${appId}`));
  }
}
