import { Component, OnInit } from '@angular/core';
import { JuegosServiceTsService } from '../../services/juegos.service.ts.service';
import { Juego } from '../../models/juegos.module';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-games',
  imports: [CommonModule],
  templateUrl: './admin-games.component.html',
  styleUrl: './admin-games.component.scss'
})
export class AdminGamesComponent implements OnInit {

  constructor(private juegos: JuegosServiceTsService, private router: Router) { }

  juegosTotal: Juego[] = []
  juegosFiltrados: Juego[] = []

  categoriasDisponibles: string[] = [];
  categoriasSeleccionadas: string[] = [];

  ngOnInit() {
    // Suscribirse a las tareas en tiempo real
    this.juegos.getAllGames().subscribe({
      next: (juego) => {
        this.juegosTotal = juego;
        this.juegosFiltrados = [...this.juegosTotal];

        const categoriasSet = new Set<string>();

        this.juegosTotal.forEach(juego => {
          if (juego.genres) {
            juego.genres.forEach((c: string) => categoriasSet.add(c));
          }
        });

        this.categoriasDisponibles = Array.from(categoriasSet).sort();
      },
      error: (err) => {
        console.error('Error al cargar juegos de Firebase:', err);
      }
    });
  }

  mostrarTexto(event: Event): void {
    const entrada = event.target as HTMLInputElement;
    const nombre = entrada.value.toLowerCase().trim();

    if (nombre === '') {
      this.juegosFiltrados = [...this.juegosTotal];
    } else {
      this.juegosFiltrados = this.juegosTotal.filter(j =>
        j.name.toLowerCase().includes(nombre)
      );
    }
  }

  toggleCategoria(categoria: string) {
    if (this.categoriasSeleccionadas.includes(categoria)) {
      this.categoriasSeleccionadas =
        this.categoriasSeleccionadas.filter(c => c !== categoria);
    } else {
      this.categoriasSeleccionadas.push(categoria);
    }

    console.log("Categorías seleccionadas:", this.categoriasSeleccionadas);

    this.filtrarJuegos();
  }

  // Filtrar juegos
  filtrarJuegos() {

    if (this.categoriasSeleccionadas.length === 0) {
      this.juegosFiltrados = [...this.juegosTotal];
      return;
    }

    this.juegosFiltrados = this.juegosTotal.filter(juego =>
      juego.genres?.some((cat: string) =>
        this.categoriasSeleccionadas.includes(cat)
      )
    );

    console.log("Juegos filtrados:", this.juegosFiltrados);

  }

  goToAdd() {
    this.router.navigate(['/nav/admin-games-add']);
  }
}
