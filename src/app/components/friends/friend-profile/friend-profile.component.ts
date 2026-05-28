import { Component, OnInit, signal, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FriendsService } from '../../../services/friends.service';
import { Database, ref, get } from '@angular/fire/database';

@Component({
  selector: 'app-friend-profile',
  imports: [CommonModule, RouterLink],
  templateUrl: './friend-profile.component.html',
  styleUrl: './friend-profile.component.scss'
})
export class FriendProfileComponent implements OnInit {
  uid = input.required<string>();

  private friendsService = inject(FriendsService);
  private db = inject(Database);

  profile = signal<any>(null);
  games = signal<any[]>([]);
  insignias = signal<any[]>([]);
  stats = signal({ totalLogros: 0, conseguidos: 0, progreso: 0, totalJuegos: 0 });
  loading = signal(true);

  ngOnInit() {
    this.friendsService.getUserPublicProfile(this.uid()).subscribe(async p => {
      this.profile.set(p);
      if (p) {
        await this.loadGamesAndStats(this.uid());
        await this.loadInsignias(this.uid());
      }
      this.loading.set(false);
    });
  }

  private async loadGamesAndStats(uid: string) {
    const libSnap = await get(ref(this.db, `/library/${uid}/games`));
    if (!libSnap.exists()) { this.games.set([]); return; }
    const gameIds = Object.keys(libSnap.val());

    let totalLogros = 0, conseguidos = 0;
    const gamesData: any[] = [];

    for (const id of gameIds) {
      const gameSnap = await get(ref(this.db, `/games/${id}`));
      if (!gameSnap.exists()) continue;
      const game = { appId: id, ...gameSnap.val() };

      const achSnap = await get(ref(this.db, `/achievements/${id}`));
      const userAchSnap = await get(ref(this.db, `/achievementsUser/${uid}/${id}`));
      const total = achSnap.exists() ? Object.keys(achSnap.val()).length : 0;
      const done = userAchSnap.exists()
        ? Object.values(userAchSnap.val() as Record<string, any>).filter((a: any) => a.conseguido).length
        : 0;
      totalLogros += total;
      conseguidos += done;
      gamesData.push({
        ...game,
        logrosTotales: total,
        logrosConseguidos: done,
        progreso: total ? (done / total) * 100 : 0
      });
    }

    this.games.set(gamesData);
    this.stats.set({
      totalLogros, conseguidos,
      progreso: totalLogros ? Math.round((conseguidos / totalLogros) * 100) : 0,
      totalJuegos: gamesData.length
    });
  }

  private async loadInsignias(uid: string) {
    const allSnap = await get(ref(this.db, '/medal'));
    const userSnap = await get(ref(this.db, `/medalUser/${uid}`));
    if (!allSnap.exists()) return;
    const all = allSnap.val();
    const user = userSnap.exists() ? userSnap.val() : {};
    const earned = Object.entries(all)
      .filter(([id]) => user[id]?.conseguido)
      .map(([id, m]: any) => ({ id, ...m }));
    this.insignias.set(earned);
  }
}
