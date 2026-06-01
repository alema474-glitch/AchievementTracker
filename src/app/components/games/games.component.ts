import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { JuegosServiceTsService } from '../../services/juegos.service.ts.service';
import { Juego } from '../../models/juegos.module';
import { LogrosService } from '../../services/logros.service';
import { take, combineLatest } from 'rxjs';

type SortMode = 'nombre' | 'progreso-asc' | 'progreso-desc' | 'reciente';

interface JuegoEnriquecido extends Juego {
  logrosConseguidos: number;
  logrosTotales: number;
  progreso: number;
  addedAt?: string;
  hidden?: boolean;
}

interface GenreStats {
  genre: string;
  count: number;
  totalLogros: number;
  conseguidos: number;
  pct: number;
}

@Component({
  selector: 'app-games',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './games.component.html',
  styleUrl: './games.component.scss'
})
export class GamesComponent implements OnInit {
  private juegosService = inject(JuegosServiceTsService);
  private achService    = inject(LogrosService);

  // ── Raw data ─────────────────────────────────────────────────────────────────
  juegosTotal:  JuegoEnriquecido[] = [];
  hiddenIds:    Set<string> = new Set();
  mostrarOcultos = false;

  // ── Global stats ──────────────────────────────────────────────────────────────
  totalLogros       = 0;
  logrosConseguidos = 0;
  progresoTotal     = 0;
  genreStats:       GenreStats[] = [];

  // ── Filters / sort ────────────────────────────────────────────────────────────
  busqueda             = '';
  sortMode: SortMode   = 'nombre';
  categoriasDisponibles: string[] = [];
  categoriasSeleccionadas: string[] = [];

  // ── Computed list (visible) ───────────────────────────────────────────────────
  get juegosFiltrados(): JuegoEnriquecido[] {
    let lista = this.juegosTotal.filter(j =>
      this.mostrarOcultos ? this.hiddenIds.has(j.appId) : !this.hiddenIds.has(j.appId)
    );

    if (this.busqueda.trim()) {
      const q = this.busqueda.toLowerCase();
      lista = lista.filter(j => j.name.toLowerCase().includes(q));
    }

    if (this.categoriasSeleccionadas.length) {
      lista = lista.filter(j =>
        j.genres?.some((c: string) => this.categoriasSeleccionadas.includes(c))
      );
    }

    switch (this.sortMode) {
      case 'progreso-desc': return [...lista].sort((a, b) => b.progreso - a.progreso);
      case 'progreso-asc':  return [...lista].sort((a, b) => a.progreso - b.progreso);
      case 'reciente':      return [...lista].sort((a, b) =>
        (b.addedAt ?? '').localeCompare(a.addedAt ?? ''));
      default:              return [...lista].sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  get hiddenCount(): number { return this.hiddenIds.size; }

  ngOnInit() {
    combineLatest([
      this.juegosService.getAllUserGamesFirebase(),
      this.juegosService.getHiddenGames()
    ]).subscribe(([juegos, hidden]) => {
      this.hiddenIds = hidden;
      this.juegosTotal = juegos as JuegoEnriquecido[];

      const cats = new Set<string>();
      juegos.forEach(j => j.genres?.forEach((c: string) => cats.add(c)));
      this.categoriasDisponibles = Array.from(cats).sort();

      let totalC = 0, totalL = 0;
      const genreMap = new Map<string, { count: number; tL: number; tC: number }>();

      juegos.forEach(j => {
        this.achService.getAchievementsUser(j.appId).pipe(take(1)).subscribe(achArray => {
          const cons = achArray.filter(a => a.conseguido).length;
          const jEnr = j as JuegoEnriquecido;
          jEnr.logrosConseguidos = cons;
          jEnr.logrosTotales     = achArray.length;
          jEnr.progreso          = achArray.length ? (cons / achArray.length) * 100 : 0;

          totalC += cons; totalL += achArray.length;
          this.logrosConseguidos = totalC;
          this.totalLogros       = totalL;
          this.progresoTotal     = totalL ? (totalC / totalL) * 100 : 0;

          // Genre stats
          (j.genres ?? []).forEach((g: string) => {
            const cur = genreMap.get(g) ?? { count: 0, tL: 0, tC: 0 };
            genreMap.set(g, {
              count: cur.count + 1,
              tL: cur.tL + achArray.length,
              tC: cur.tC + cons
            });
          });

          this.genreStats = Array.from(genreMap.entries())
            .map(([genre, d]) => ({
              genre, count: d.count, totalLogros: d.tL, conseguidos: d.tC,
              pct: d.tL ? Math.round((d.tC / d.tL) * 100) : 0
            }))
            .sort((a, b) => b.pct - a.pct);
        });
      });
    });
  }

  // ── Actions ──────────────────────────────────────────────────────────────────
  toggleCategoria(cat: string) {
    this.categoriasSeleccionadas = this.categoriasSeleccionadas.includes(cat)
      ? this.categoriasSeleccionadas.filter(c => c !== cat)
      : [...this.categoriasSeleccionadas, cat];
  }

  async toggleHide(j: JuegoEnriquecido) {
    if (this.hiddenIds.has(j.appId)) {
      await this.juegosService.showGame(j.appId);
      this.hiddenIds.delete(j.appId);
    } else {
      await this.juegosService.hideGame(j.appId);
      this.hiddenIds.add(j.appId);
    }
    this.hiddenIds = new Set(this.hiddenIds); // trigger change detection
  }

  removingId = signal<string>('');

  async removeGame(j: JuegoEnriquecido) {
    if (this.removingId()) return;
    this.removingId.set(j.appId);
    try {
      await this.juegosService.removeGameFromLibrary(j.appId);
      this.juegosTotal = this.juegosTotal.filter(g => g.appId !== j.appId);
    } finally {
      this.removingId.set('');
    }
  }

  mostrarTexto(event: Event) {
    this.busqueda = (event.target as HTMLInputElement).value;
  }

  setSortMode(m: SortMode) { this.sortMode = m; }

  getGenreBarWidth(pct: number): string { return `${pct}%`; }
}
