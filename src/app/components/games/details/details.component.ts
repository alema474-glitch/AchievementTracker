import { Component, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Juego } from '../../../models/juegos.module';
import { LogrosService } from '../../../services/logros.service';
import { Logros } from '../../../models/logros.module';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JuegosServiceTsService } from '../../../services/juegos.service.ts.service';
import { NotesService, AchievementNote } from '../../../services/notes.service';
import { ChallengesService } from '../../../services/challenges.service';

@Component({
  selector: 'app-details',
  imports: [CommonModule, FormsModule],
  templateUrl: './details.component.html',
  styleUrl: './details.component.scss'
})
export class DetailsComponent implements OnInit {
  juego!: Juego;
  logrosUser: { achievement: Logros, conseguido: boolean }[] = [];

  filtro: 'todos' | 'conseguidos' | 'pendientes' = 'todos';
  busqueda = '';
  heroImgError = false;
  togglingAll = false;
  notes: Record<string, AchievementNote> = {};
  editingNoteId: string | null = null;
  noteText = '';
  savingNote = false;

  constructor(
    private route: ActivatedRoute,
    private juegosService: JuegosServiceTsService,
    private achService: LogrosService,
    private router: Router,
    private notesService: NotesService,
    private challengesService: ChallengesService
  ) {}

  ngOnInit(): void {
    const appId = this.route.snapshot.paramMap.get('id');
    if (!appId) return;

    this.juegosService.getGameById(appId).subscribe(juego => {
      if (juego) {
        this.juego = juego;
        this.achService.getAchievementsUser(appId).subscribe(data => {
          this.logrosUser = data;
        });
        this.notesService.getNotes(appId).subscribe(n => this.notes = n);
      } else {
        this.volverAJuegos();
      }
    });
  }

  // ── Steam image helpers ───────────────────────────────────────────────────────
  get heroImageUrl(): string {
    if (this.heroImgError || !this.juego) return this.juego?.image ?? '';
    return `https://cdn.cloudflare.steamstatic.com/steam/apps/${this.juego.appId}/header.jpg`;
  }
  get portraitImageUrl(): string {
    if (!this.juego?.appId) return '';
    return `https://cdn.cloudflare.steamstatic.com/steam/apps/${this.juego.appId}/library_600x900.jpg`;
  }
  get backdropImageUrl(): string {
    if (!this.juego?.appId) return '';
    return `https://cdn.cloudflare.steamstatic.com/steam/apps/${this.juego.appId}/library_hero.jpg`;
  }
  onHeroImgError() { this.heroImgError = true; }

  // ── Stats ────────────────────────────────────────────────────────────────────
  get conseguidosCount(): number {
    return this.logrosUser.filter(l => l.conseguido).length;
  }
  get progresoPct(): number {
    if (!this.logrosUser.length) return 0;
    return Math.round((this.conseguidosCount / this.logrosUser.length) * 100);
  }

  // ── Toggle all state ─────────────────────────────────────────────────────────
  /** true = todos conseguidos, false = alguno pendiente */
  get todosConseguidos(): boolean {
    return this.logrosUser.length > 0 && this.logrosUser.every(l => l.conseguido);
  }

  async toggleTodos(): Promise<void> {
    if (!this.juego || this.togglingAll) return;
    this.togglingAll = true;

    const appId = this.juego.appId;
    const marcar = !this.todosConseguidos; // si no están todos, marcar; si todos sí, desmarcar

    try {
      // Execute sequentially to avoid Firebase rate limits
      for (const item of this.logrosUser) {
        if (item.conseguido !== marcar) {
          await this.achService.toggleAchievement(appId, item.achievement.id, item.conseguido);
          item.conseguido = marcar;
        }
      }
    } finally {
      this.togglingAll = false;
    }
  }

  // ── Filtering ────────────────────────────────────────────────────────────────
  get logrosFiltrados(): { achievement: Logros, conseguido: boolean }[] {
    let lista = this.logrosUser;
    if (this.filtro === 'conseguidos') lista = lista.filter(l => l.conseguido);
    if (this.filtro === 'pendientes')  lista = lista.filter(l => !l.conseguido);
    if (this.busqueda.trim()) {
      const q = this.busqueda.toLowerCase();
      lista = lista.filter(l => l.achievement.name.toLowerCase().includes(q));
    }
    return [...lista].sort((a, b) => Number(a.conseguido) - Number(b.conseguido));
  }

  setFiltro(f: 'todos' | 'conseguidos' | 'pendientes') { this.filtro = f; }

  // ── Actions ──────────────────────────────────────────────────────────────────
  startEditNote(achId: string) {
    this.editingNoteId = achId;
    this.noteText = this.notes[achId]?.text ?? '';
  }

  cancelEditNote() { this.editingNoteId = null; this.noteText = ''; }

  async saveNote() {
    if (!this.juego || this.savingNote) return;
    this.savingNote = true;
    try {
      await this.notesService.saveNote(this.juego.appId, this.editingNoteId!, this.noteText);
      this.editingNoteId = null; this.noteText = '';
    } finally { this.savingNote = false; }
  }

  async deleteNote(achId: string) {
    if (!this.juego) return;
    await this.notesService.deleteNote(this.juego.appId, achId);
  }

  volverAJuegos() { this.router.navigate(['/nav/games']); }

  toggleLogro(logroItem: { achievement: Logros, conseguido: boolean }) {
    const idLogro = logroItem.achievement.id;
    const appId   = this.juego.appId;
    this.achService.toggleAchievement(appId, idLogro, logroItem.conseguido).then(() => {
      logroItem.conseguido = !logroItem.conseguido;
    });
  }
}
