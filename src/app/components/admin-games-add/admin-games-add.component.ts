import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { GamesaddService } from '../../services/gamesadd.service';

@Component({
  selector: 'app-admin-games-add',
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './admin-games-add.component.html',
  styleUrl: './admin-games-add.component.scss'
})
export class AdminGamesAddComponent {
  appid!: number;
  loading = false;
  estado: 'idle' | 'success' | 'error' = 'idle';
  errorMsg = '';

  constructor(
    private gamesService: GamesaddService,
    private router: Router
  ) {}

  addGame() {
    this.loading = true;
    this.estado = 'idle';
    this.errorMsg = '';

    this.gamesService.importGame(this.appid).subscribe({
      next: (res) => {
        this.loading = false;
        this.estado = 'success';
        setTimeout(() => this.router.navigate(['/nav/admin-games']), 2000);
      },
      error: (err) => {
        this.loading = false;
        this.estado = 'error';
        this.errorMsg = err?.error?.message || err?.message || 'Error desconocido al importar el juego.';
      }
    });
  }
}
