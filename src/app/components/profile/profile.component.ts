import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LogrosService, ActivityEntry } from '../../services/logros.service';
import { JuegosServiceTsService } from '../../services/juegos.service.ts.service';
import { UserLevelService, UserLevel } from '../../services/user-level.service';
import { Database, ref, get, set, remove } from '@angular/fire/database';
import { take } from 'rxjs';

interface JuegoResumen {
  appId: string; name: string; image: string;
  logrosConseguidos: number; logrosTotales: number; progreso: number;
}

@Component({
  selector: 'app-profile',
  imports: [CommonModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  private auth        = inject(AuthService);
  private achService  = inject(LogrosService);
  private juegosService = inject(JuegosServiceTsService);
  private levelService  = inject(UserLevelService);
  private db          = inject(Database);

  profile   = signal<any>(null);
  level     = signal<UserLevel | null>(null);
  activity  = signal<ActivityEntry[]>([]);
  games     = signal<JuegoResumen[]>([]);
  pinnedId  = signal<string | null>(null);
  loadingActivity = signal(true);
  loadingGames    = signal(true);

  pinnedGame = computed(() => this.games().find(g => g.appId === this.pinnedId()) ?? null);
  Math = Math;

  get portraitUrl() {
    const p = this.pinnedId();
    return p ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${p}/library_600x900.jpg` : null;
  }

  async ngOnInit() {
    const prof = await this.auth.getUserProfile();
    this.profile.set(prof);

    // Load pinned game
    const pinnedSnap = await get(ref(this.db, `/library/${prof.uid}/pinnedGame`));
    if (pinnedSnap.exists()) this.pinnedId.set(pinnedSnap.val());

    // Load games + compute level
    this.juegosService.getAllUserGamesFirebase().pipe(take(1)).subscribe(juegos => {
      let totalDone = 0;
      let loaded = 0;
      const list: JuegoResumen[] = [];

      if (juegos.length === 0) { this.loadingGames.set(false); return; }

      juegos.forEach(j => {
        this.achService.getAchievementsUser(j.appId).pipe(take(1)).subscribe(achs => {
          const done = achs.filter(a => a.conseguido).length;
          totalDone += done;
          list.push({
            appId: j.appId, name: j.name, image: j.image,
            logrosConseguidos: done, logrosTotales: achs.length,
            progreso: achs.length ? (done / achs.length) * 100 : 0
          });
          loaded++;
          if (loaded === juegos.length) {
            list.sort((a, b) => b.progreso - a.progreso);
            this.games.set(list);
            this.level.set(this.levelService.compute(totalDone));
            this.loadingGames.set(false);
          }
        });
      });
    });

    // Load activity feed
    this.achService.getActivityFeed(30).then(feed => {
      this.activity.set(feed);
      this.loadingActivity.set(false);
    });
  }

  async pinGame(appId: string) {
    const uid = this.profile()?.uid;
    if (!uid) return;
    if (this.pinnedId() === appId) {
      await remove(ref(this.db, `/library/${uid}/pinnedGame`));
      this.pinnedId.set(null);
    } else {
      await set(ref(this.db, `/library/${uid}/pinnedGame`), appId);
      this.pinnedId.set(appId);
    }
  }

  formatTime(ts: number): string {
    const d = new Date(ts);
    const now = Date.now();
    const diff = now - ts;
    if (diff < 60000) return 'Ahora mismo';
    if (diff < 3600000) return `Hace ${Math.floor(diff/60000)} min`;
    if (diff < 86400000) return `Hace ${Math.floor(diff/3600000)} h`;
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }
}
