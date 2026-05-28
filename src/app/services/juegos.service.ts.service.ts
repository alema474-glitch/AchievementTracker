import { Injectable } from '@angular/core';
import { Juego } from '../models/juegos.module';
import { Database, get, listVal, objectVal, ref, set } from '@angular/fire/database';
import { AuthService } from './auth.service';
import { combineLatest, from, map, Observable, of, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class JuegosServiceTsService {
  constructor(
    private database: Database,
    private auth: AuthService
  ) { }

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
            map(snapshot => snapshot.exists() ? snapshot.val() as Juego : null)
          )
        );

        return combineLatest(gameObservables);
      }),
      map(games => games.filter(g => g !== null) as Juego[])
    );
  }

  getGameById(appId: string): Observable<Juego | null> {
    const gameRef = ref(this.database, `/games/${appId}`);
    return objectVal<Juego | null>(gameRef);
  }

  getAllGames(): Observable<Juego[]> {
    const gamesRef = ref(this.database, '/games');
    return objectVal<Record<string, any> | null>(gamesRef).pipe(
      map(res => {
        if (!res) return [];
        return Object.keys(res).map(id => ({
          appId: id,
          name: res[id].name,
          description: res[id].description,
          image: res[id].image,
          genres: res[id].genres || [],
          logrosConseguidos: res[id].logrosConseguidos,
          logrosTotales: res[id].logrosTotales,
          progreso: res[id].progreso || 0
        }));
      })
    );
  }

  async addGameToLibrary(juego: Juego): Promise<void> {
    const uid = this.auth.getUid();
    if (!uid) throw new Error("No hay usuario");

    const gameRef = ref(
      this.database,
      `/library/${uid}/games/${juego.appId}`
    );

    await set(gameRef, true);
  }

  async addGame(game: Juego): Promise<void> {
    const gameRef = ref(this.database, `/games/${game.appId}`);
    await set(gameRef, {
      name: game.name,
      description: game.description,
      image: game.image,
      genres: game.genres
    });
  }
}
