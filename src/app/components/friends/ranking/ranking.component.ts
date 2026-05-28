import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FriendsService } from '../../../services/friends.service';
import { AuthService } from '../../../services/auth.service';
import { Database, ref, get } from '@angular/fire/database';

interface RankEntry {
  uid: string;
  username: string;
  photoURL?: string;
  firstName: string;
  lastName: string;
  totalDone: number;
  totalLogros: number;
  totalJuegos: number;
  pct: number;
  isMe: boolean;
}

@Component({
  selector: 'app-ranking',
  imports: [CommonModule, RouterLink],
  templateUrl: './ranking.component.html',
  styleUrl: './ranking.component.scss'
})
export class RankingComponent implements OnInit {
  private friendsService = inject(FriendsService);
  private authService = inject(AuthService);
  private db = inject(Database);

  ranking = signal<RankEntry[]>([]);
  loading = signal(true);
  myRank = signal(0);

  async ngOnInit() {
    const friends = await new Promise<any[]>(res =>
      this.friendsService.getFriends().subscribe(f => res(f))
    );
    const myUid = this.authService.getUid()!;
    const myProfile = await this.authService.getUserProfile();

    const allUsers = [
      { uid: myUid, ...myProfile },
      ...friends.map(f => ({ uid: f.uid, username: f.username, firstName: f.firstName, lastName: f.lastName, photoURL: f.photoURL }))
    ];

    const entries: RankEntry[] = [];
    for (const user of allUsers) {
      const entry = await this.computeStats(user.uid, user);
      entries.push(entry);
    }

    entries.sort((a, b) => b.totalDone - a.totalDone || b.pct - a.pct);
    this.ranking.set(entries);

    const myIdx = entries.findIndex(e => e.isMe);
    this.myRank.set(myIdx + 1);
    this.loading.set(false);
  }

  private async computeStats(uid: string, profile: any): Promise<RankEntry> {
    const libSnap = await get(ref(this.db, `/library/${uid}/games`));
    const myUid = this.authService.getUid();
    if (!libSnap.exists()) {
      return { uid, username: profile.username, firstName: profile.firstName || '', lastName: profile.lastName || '', photoURL: profile.photoURL, totalDone: 0, totalLogros: 0, totalJuegos: 0, pct: 0, isMe: uid === myUid };
    }
    const gameIds = Object.keys(libSnap.val());
    let totalDone = 0, totalLogros = 0;

    for (const id of gameIds) {
      const [achSnap, userAchSnap] = await Promise.all([
        get(ref(this.db, `/achievements/${id}`)),
        get(ref(this.db, `/achievementsUser/${uid}/${id}`))
      ]);
      const total = achSnap.exists() ? Object.keys(achSnap.val()).length : 0;
      const done = userAchSnap.exists()
        ? Object.values(userAchSnap.val() as Record<string, any>).filter((a: any) => a.conseguido).length : 0;
      totalLogros += total;
      totalDone += done;
    }

    return {
      uid, username: profile.username,
      firstName: profile.firstName || '', lastName: profile.lastName || '',
      photoURL: profile.photoURL,
      totalDone, totalLogros,
      totalJuegos: gameIds.length,
      pct: totalLogros ? Math.round((totalDone / totalLogros) * 100) : 0,
      isMe: uid === myUid
    };
  }

  getRankIcon(i: number): string {
    if (i === 0) return 'bi-trophy-fill';
    if (i === 1) return 'bi-award-fill';
    if (i === 2) return 'bi-patch-check-fill';
    return '';
  }

  getRankColor(i: number): string {
    if (i === 0) return '#fbbf24';
    if (i === 1) return '#94a3b8';
    if (i === 2) return '#c77b37';
    return '';
  }
}
