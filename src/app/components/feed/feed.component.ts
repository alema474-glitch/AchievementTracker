import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FeedService, FeedEntry } from '../../services/feed.service';

@Component({
  selector: 'app-feed',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  templateUrl: './feed.component.html',
  styleUrl: './feed.component.scss'
})
export class FeedComponent implements OnInit {
  private feedService = inject(FeedService);

  entries  = signal<FeedEntry[]>([]);
  loading  = signal(true);
  error    = signal('');

  async ngOnInit() {
    try {
      const data = await this.feedService.getFriendsActivity(8);
      this.entries.set(data);
    } catch (e: any) {
      this.error.set('No se pudo cargar el feed.');
    } finally {
      this.loading.set(false);
    }
  }

  relativeTime(ts: number): string {
    const diff = Date.now() - ts;
    if (diff < 60_000)       return 'Ahora mismo';
    if (diff < 3_600_000)    return `Hace ${Math.floor(diff / 60_000)} min`;
    if (diff < 86_400_000)   return `Hace ${Math.floor(diff / 3_600_000)} h`;
    if (diff < 604_800_000)  return `Hace ${Math.floor(diff / 86_400_000)} días`;
    return new Date(ts).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  groupByDay(entries: FeedEntry[]): { date: string; items: FeedEntry[] }[] {
    const groups = new Map<string, FeedEntry[]>();
    entries.forEach(e => {
      const d = new Date(e.timestamp);
      const key = d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(e);
    });
    return Array.from(groups.entries()).map(([date, items]) => ({ date, items }));
  }
}
