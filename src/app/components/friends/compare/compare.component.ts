import { Component, OnInit, signal, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { FriendsService } from '../../../services/friends.service';
import { Database, ref, get } from '@angular/fire/database';

interface GameComparison {
  appId: string;
  name: string;
  image: string;
  myDone: number;
  friendDone: number;
  total: number;
  myPct: number;
  friendPct: number;
}

@Component({
  selector: 'app-compare',
  imports: [CommonModule, RouterLink],
  templateUrl: './compare.component.html',
  styleUrl: './compare.component.scss'
})
export class CompareComponent implements OnInit {
  uid = input.required<string>();

  private authService = inject(AuthService);
  private friendsService = inject(FriendsService);
  private db = inject(Database);

  myProfile = signal<any>(null);
  friendProfile = signal<any>(null);
  comparisons = signal<GameComparison[]>([]);
  loading = signal(true);

  myStats = signal({ total: 0, done: 0, games: 0 });
  friendStats = signal({ total: 0, done: 0, games: 0 });

  sharedGames = signal(0);

  async ngOnInit() {
    const myUid = this.authService.getUid()!;
    const [myProf, friendProf] = await Promise.all([
      this.authService.getUserProfile(),
      this.getProfile(this.uid())
    ]);
    this.myProfile.set(myProf);
    this.friendProfile.set(friendProf);

    await this.buildComparisons(myUid, this.uid());
    this.loading.set(false);
  }

  private async getProfile(uid: string): Promise<any> {
    const snap = await get(ref(this.db, `/users/${uid}`));
    return snap.exists() ? { uid, ...snap.val() } : null;
  }

  private async buildComparisons(myUid: string, friendUid: string) {
    const [myLibSnap, friendLibSnap] = await Promise.all([
      get(ref(this.db, `/library/${myUid}/games`)),
      get(ref(this.db, `/library/${friendUid}/games`))
    ]);

    const myIds = myLibSnap.exists() ? Object.keys(myLibSnap.val()) : [];
    const friendIds = friendLibSnap.exists() ? Object.keys(friendLibSnap.val()) : [];

    // Union of all games
    const allIds = [...new Set([...myIds, ...friendIds])];
    const shared = myIds.filter(id => friendIds.includes(id));
    this.sharedGames.set(shared.length);

    let myTotal = 0, myDoneTotal = 0;
    let friendTotal = 0, friendDoneTotal = 0;
    const comparisons: GameComparison[] = [];

    for (const id of allIds) {
      const [gameSnap, achSnap, myAchSnap, friendAchSnap] = await Promise.all([
        get(ref(this.db, `/games/${id}`)),
        get(ref(this.db, `/achievements/${id}`)),
        get(ref(this.db, `/achievementsUser/${myUid}/${id}`)),
        get(ref(this.db, `/achievementsUser/${friendUid}/${id}`))
      ]);

      if (!gameSnap.exists()) continue;
      const game = gameSnap.val();
      const total = achSnap.exists() ? Object.keys(achSnap.val()).length : 0;
      const myDone = myAchSnap.exists()
        ? Object.values(myAchSnap.val() as Record<string, any>).filter((a: any) => a.conseguido).length : 0;
      const friendDone = friendAchSnap.exists()
        ? Object.values(friendAchSnap.val() as Record<string, any>).filter((a: any) => a.conseguido).length : 0;

      if (myIds.includes(id)) { myTotal += total; myDoneTotal += myDone; }
      if (friendIds.includes(id)) { friendTotal += total; friendDoneTotal += friendDone; }

      comparisons.push({
        appId: id, name: game.name, image: game.image,
        myDone, friendDone, total,
        myPct: total ? Math.round((myDone / total) * 100) : 0,
        friendPct: total ? Math.round((friendDone / total) * 100) : 0
      });
    }

    comparisons.sort((a, b) => Math.max(b.myPct, b.friendPct) - Math.max(a.myPct, a.friendPct));
    this.comparisons.set(comparisons);
    this.myStats.set({ total: myTotal, done: myDoneTotal, games: myIds.length });
    this.friendStats.set({ total: friendTotal, done: friendDoneTotal, games: friendIds.length });
  }

  myGlobalPct() {
    const s = this.myStats();
    return s.total ? Math.round((s.done / s.total) * 100) : 0;
  }
  friendGlobalPct() {
    const s = this.friendStats();
    return s.total ? Math.round((s.done / s.total) * 100) : 0;
  }
  winner() {
    const m = this.myGlobalPct(), f = this.friendGlobalPct();
    if (m > f) return 'me';
    if (f > m) return 'friend';
    return 'tie';
  }
}
