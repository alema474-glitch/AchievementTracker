import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Juego } from '../../../models/juegos.module';
import { JuegosServiceTsService } from '../../../services/juegos.service.ts.service';

@Component({
  selector: 'app-add',
  imports: [CommonModule],
  templateUrl: './add.component.html',
  styleUrl: './add.component.scss'
})
export class AddComponent implements OnInit {

  constructor(private juegos: JuegosServiceTsService) {}

  juegosTotal: Juego[] = [];
  juegosFiltrados: Juego[] = [];
  juegoSeleccionado?: Juego;

  // ── Toast state ──────────────────────────────────
  toast: { tipo: 'success' | 'error'; mensaje: string; nombre?: string } | null = null;
  private toastTimer: any;

  ngOnInit() {
    this.juegos.getAllGames().subscribe({
      next: (juego) => {
        this.juegosTotal = juego;
        this.juegosFiltrados = [...this.juegosTotal];
      },
      error: (err) => console.error('Error al cargar juegos:', err)
    });
  }

  mostrarTexto(event: Event): void {
    const entrada = event.target as HTMLInputElement;
    const nombre = entrada.value.toLowerCase().trim();
    this.juegosFiltrados = nombre === ''
      ? [...this.juegosTotal]
      : this.juegosTotal.filter(j => j.name.toLowerCase().includes(nombre));
  }

  seleccionarJuego(juego: Juego) {
    this.juegoSeleccionado = juego;
  }

  async confirmarAgregar() {
    if (!this.juegoSeleccionado) return;
    const nombre = this.juegoSeleccionado.name;

    try {
      await this.juegos.addGameToLibrary(this.juegoSeleccionado);
      this.mostrarToast('success', nombre);
    } catch (error) {
      console.error(error);
      this.mostrarToast('error', nombre);
    }
  }

  private mostrarToast(tipo: 'success' | 'error', nombre: string) {
    clearTimeout(this.toastTimer);
    this.toast = {
      tipo,
      nombre,
      mensaje: tipo === 'success'
        ? '¡Juego añadido a tu biblioteca!'
        : 'Error al añadir el juego. Inténtalo de nuevo.'
    };
    this.toastTimer = setTimeout(() => this.toast = null, 4000);
  }
}
