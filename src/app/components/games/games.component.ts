import { Component, OnInit } from '@angular/core';
import { JuegosServiceTsService } from '../../services/juegos.service.ts.service';
import { Juego } from '../../models/juegos.module';
import { CommonModule } from '@angular/common';
import { RouterLink } from "@angular/router";
import { FormsModule } from '@angular/forms';
import { LogrosService } from '../../services/logros.service';
import { take } from 'rxjs';

@Component({
  selector: 'app-games',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './games.component.html',
  styleUrl: './games.component.scss'
})
export class GamesComponent implements OnInit {

  constructor(private juegos: JuegosServiceTsService, private achService: LogrosService) {

  }

  juegosTotal: Juego[] = []
  juegosFiltrados: Juego[] = []

  totalLogros = 0;
  logrosConseguidos = 0;
  progresoTotal = 0; // porcentaje

  categoriasDisponibles: string[] = [];
  categoriasSeleccionadas: string[] = [];

  ngOnInit() {
    // Suscribirse a los juegos en tiempo real
    this.juegos.getAllUserGamesFirebase().subscribe({
      next: (juego) => {
        this.juegosTotal = juego;
        this.juegosFiltrados = [...this.juegosTotal];

        let totalConseguidos = 0;
        let totalLogros = 0;

        const categoriasSet = new Set<string>();

        this.juegosTotal.forEach(juego => {
          if (juego.genres) {
            juego.genres.forEach((c: string) => categoriasSet.add(c));
          }
        });

        this.categoriasDisponibles = Array.from(categoriasSet).sort();

        console.log("Categorias detectadas:", this.categoriasDisponibles);

        juego.forEach(juego => {
          this.achService.getAchievementsUser(juego.appId).pipe(take(1)).subscribe(achArray => {
            const conseguidos = achArray.filter(a => a.conseguido).length;

            // Guardar progreso individual
            juego.logrosConseguidos = conseguidos;
            juego.logrosTotales = achArray.length;
            juego.progreso = achArray.length ? (conseguidos / achArray.length) * 100 : 0;

            // Para progreso global
            totalConseguidos += conseguidos;
            totalLogros += achArray.length;

            // Actualizar progreso total
            this.logrosConseguidos = totalConseguidos;
            this.totalLogros = totalLogros;
            this.progresoTotal = totalLogros ? (totalConseguidos / totalLogros) * 100 : 0;
          });
        });
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

}
