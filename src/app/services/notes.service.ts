import { Injectable, inject } from '@angular/core';
import { Database, ref, set, get, remove, objectVal } from '@angular/fire/database';
import { Observable, map, of } from 'rxjs';
import { AuthService } from './auth.service';

export interface AchievementNote {
  text: string;
  updatedAt: number;
}

@Injectable({ providedIn: 'root' })
export class NotesService {
  private db   = inject(Database);
  private auth = inject(AuthService);

  private path(gameId: string, achId: string): string {
    return `/notes/${this.auth.getUid()}/${gameId}/${achId}`;
  }

  getNotes(gameId: string): Observable<Record<string, AchievementNote>> {
    const uid = this.auth.getUid();
    if (!uid) return of({});
    return objectVal<Record<string, AchievementNote> | null>(
      ref(this.db, `/notes/${uid}/${gameId}`)
    ).pipe(map(r => r ?? {}));
  }

  async saveNote(gameId: string, achId: string, text: string): Promise<void> {
    if (!text.trim()) return this.deleteNote(gameId, achId);
    await set(ref(this.db, this.path(gameId, achId)), {
      text: text.trim(), updatedAt: Date.now()
    });
  }

  async deleteNote(gameId: string, achId: string): Promise<void> {
    await remove(ref(this.db, this.path(gameId, achId)));
  }
}
