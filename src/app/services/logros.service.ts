import { Injectable } from '@angular/core';
import { Database, ref, objectVal, remove, set } from '@angular/fire/database';
import { Observable, map, of, switchMap } from 'rxjs';
import { AuthService } from './auth.service';
import { Logros } from '../models/logros.module';

@Injectable({
  providedIn: 'root'
})
export class LogrosService {
  constructor(private db: Database, private auth: AuthService) {}

  // Obtener todos los logros de un juego
  getAchievementsPorJuego(idJuego: string): Observable<Logros[]> {
    const achRef = ref(this.db, `/achievements/${idJuego}`);
    return objectVal<Record<string, any> | null>(achRef).pipe(
      map(res => {
        if (!res) return [];
        return Object.keys(res).map(id => new Logros(id, res[id].name, idJuego));
      })
    );
  }

  // Obtener los logros del usuario para un juego
  getAchievementsUser(idJuego: string): Observable<{achievement: Logros, conseguido: boolean}[]> {
    const uid = this.auth.getUid();
    if (!uid) return of([]);

    return this.getAchievementsPorJuego(idJuego).pipe(
      switchMap(achievements => {
        const userRef = ref(this.db, `/achievementsUser/${uid}/${idJuego}`);
        return objectVal<Record<string, any> | null>(userRef).pipe(
          map(userRes => {
            return achievements.map(a => ({
              achievement: a,
              conseguido: userRes ? !!userRes[a.id]?.conseguido : false
            }));
          })
        );
      })
    );
  }

  // Marcar un logro como conseguido
  async addAchievementUser(idJuego: string, idAchievement: string) {
    const uid = this.auth.getUid();
    if (!uid) throw new Error('Usuario no autenticado');
    const refPath = ref(this.db, `/achievementsUser/${uid}/${idJuego}/${idAchievement}`);
    await set(refPath, { conseguido: true });
  }

  // Desmarcar un logro
  async removeAchievementUser(idJuego: string, idAchievement: string) {
    const uid = this.auth.getUid();
    if (!uid) throw new Error('Usuario no autenticado');
    const refPath = ref(this.db, `/achievementsUser/${uid}/${idJuego}/${idAchievement}`);
    await remove(refPath);
  }

  // Toggle (opcional, útil si quieres un solo método)
  async toggleAchievement(idJuego: string, idAchievement: string, conseguido: boolean) {
    if (conseguido) return this.removeAchievementUser(idJuego, idAchievement);
    return this.addAchievementUser(idJuego, idAchievement);
  }
}
