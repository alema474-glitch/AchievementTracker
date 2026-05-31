import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ChallengesService, Challenge } from '../../services/challenges.service';
import { AuthService } from '../../services/auth.service';
import { FriendsService, Friend } from '../../services/friends.service';
import { JuegosServiceTsService } from '../../services/juegos.service.ts.service';
import { LogrosService } from '../../services/logros.service';
import { take } from 'rxjs';

type TabMode = 'received' | 'sent' | 'active' | 'history';

@Component({
  selector: 'app-challenges',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './challenges.component.html',
  styleUrl: './challenges.component.scss'
})
export class ChallengesComponent implements OnInit {
  private challengeService = inject(ChallengesService);
  private authService      = inject(AuthService);
  private friendsService   = inject(FriendsService);
  private juegosService    = inject(JuegosServiceTsService);
  private achService       = inject(LogrosService);

  tab      = signal<TabMode>('received');
  all      = signal<Challenge[]>([]);
  friends  = signal<Friend[]>([]);
  loading  = signal(true);

  // New challenge modal state
  showModal  = signal(false);
  selFriend  = signal<Friend | null>(null);
  games      = signal<any[]>([]);
  selGame    = signal<any | null>(null);
  achievements = signal<any[]>([]);
  selAch     = signal<any | null>(null);
  loadingAchs  = signal(false);
  sending    = signal(false);

  myUid = '';

  ngOnInit() {
    this.myUid = this.authService.getUid() ?? '';
    this.challengeService.getMyChallenges().subscribe(cs => {
      this.all.set(cs); this.loading.set(false);
    });
    this.friendsService.getFriends().subscribe(f => this.friends.set(f));
    this.juegosService.getAllUserGamesFirebase().pipe(take(1)).subscribe(g => this.games.set(g));
  }

  // ── Tabs ──────────────────────────────────────────────────────────────────
  get received() { return this.all().filter(c => c.status === 'pending' && c.toUid === this.myUid); }
  get sent()     { return this.all().filter(c => c.status === 'pending' && c.fromUid === this.myUid); }
  get active()   { return this.all().filter(c => c.status === 'active'); }
  get history()  { return this.all().filter(c => ['won','lost','declined'].includes(c.status)); }

  currentList() {
    switch (this.tab()) {
      case 'received': return this.received;
      case 'sent':     return this.sent;
      case 'active':   return this.active;
      case 'history':  return this.history;
    }
  }

  // ── New challenge modal ───────────────────────────────────────────────────
  openModal() { this.showModal.set(true); this.selFriend.set(null); this.selGame.set(null); this.selAch.set(null); }
  closeModal() { this.showModal.set(false); }

  onSelectFriend(f: Friend) { this.selFriend.set(f); }

  onSelectGame(g: any) {
    this.selGame.set(g); this.selAch.set(null); this.loadingAchs.set(true);
    this.achService.getAchievementsUser(g.appId).pipe(take(1)).subscribe(achs => {
      this.achievements.set(achs.filter(a => !a.conseguido).map(a => a.achievement));
      this.loadingAchs.set(false);
    });
  }

  onSelectAch(a: any) { this.selAch.set(a); }

  async sendChallenge() {
    const f = this.selFriend(), g = this.selGame(), a = this.selAch();
    if (!f || !g || !a || this.sending()) return;
    this.sending.set(true);
    try {
      await this.challengeService.sendChallenge(
        f.uid, f.username, g.appId, g.name, g.image, a.id, a.name
      );
      this.closeModal();
    } finally { this.sending.set(false); }
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  async accept(c: Challenge)  { await this.challengeService.acceptChallenge(c.id!, c.fromUid); }
  async decline(c: Challenge) { await this.challengeService.declineChallenge(c.id!, c.fromUid); }

  // ── Helpers ───────────────────────────────────────────────────────────────
  isMyWin(c: Challenge) { return c.status === 'won' && c.winnerId !== this.myUid; }
  isWon(c: Challenge)   { return c.status === 'won' && c.winnerId === this.myUid; }
  isLost(c: Challenge)  { return c.status === 'lost'; }

  badgeFor(c: Challenge): { text: string; icon: string; cls: string } {
    if (c.status === 'pending') return { text: '', icon: 'bi-hourglass-split',     cls: 'badge--pending' };
    if (c.status === 'active')  return { text: '', icon: 'bi-lightning-charge-fill', cls: 'badge--active' };
    if (c.status === 'won')     return { text: '', icon: 'bi-trophy-fill',           cls: 'badge--win' };
    if (c.status === 'lost')    return { text: '', icon: 'bi-x-circle-fill',         cls: 'badge--lost' };
    return { text: '', icon: 'bi-slash-circle',                                      cls: 'badge--declined' };
  }

  relTime(ts: number): string {
    const diff = Date.now() - ts;
    if (diff < 86_400_000) return `Hace ${Math.floor(diff / 3_600_000) || 1} h`;
    return `Hace ${Math.floor(diff / 86_400_000)} días`;
  }
}
