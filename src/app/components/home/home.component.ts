import { Component, OnInit } from '@angular/core';
import { Juego } from '../../models/juegos.module';
import { JuegosServiceTsService } from '../../services/juegos.service.ts.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from "@angular/router";
import { forkJoin, map, take } from 'rxjs';
import { LogrosService } from '../../services/logros.service';
import { InsigniasService } from '../../services/insignias.service';
import { Database, objectVal, ref } from '@angular/fire/database';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {

  juegosDestacados: Juego[] = [];
  juegosMenosDestacados: Juego[] = [];
  insigniasActuales: any[] = [];

  totalLogros = 0;
  logrosConseguidos = 0;
  progresoTotal = 0;

  constructor(
    private juegosService: JuegosServiceTsService,
    private achService: LogrosService,
    private insigniasService: InsigniasService
  ) { }

  ngOnInit(): void {
    this.juegosService.getAllUserGamesFirebase().subscribe(juegos => {
      let totalConseguidos = 0;
      let totalLogros = 0;

      this.juegosDestacados = [];
      this.juegosMenosDestacados = [];

      let juegosProcesados = 0;

      juegos.forEach(juego => {
        this.achService.getAchievementsUser(juego.appId).pipe(take(1)).subscribe(achArray => {
          const conseguidos = achArray.filter(a => a.conseguido).length;
          const totales = achArray.length;

          const progreso = totales ? (conseguidos / totales) * 100 : 0;

          juego.logrosConseguidos = conseguidos;
          juego.logrosTotales = totales;
          juego.progreso = progreso;

          // progreso global
          totalConseguidos += conseguidos;
          totalLogros += totales;

          // clasificación
          if (progreso >= 90 && !this.juegosDestacados.some(j => j.appId === juego.appId)) {
            this.juegosDestacados.push(juego);
          } else if (progreso <= 15 && !this.juegosMenosDestacados.some(j => j.appId === juego.appId)) {
            this.juegosMenosDestacados.push(juego);
          }

          juegosProcesados++;

          // cuando todos los juegos se han procesado
          if (juegosProcesados === juegos.length) {
            this.logrosConseguidos = totalConseguidos;
            this.totalLogros = totalLogros;
            this.progresoTotal = totalLogros ? (totalConseguidos / totalLogros) * 100 : 0;

            // Evaluar y desbloquear insignias automáticas
            this.insigniasService.evaluateMedals(totalConseguidos, juegos.length);
          }
        });
      });

      // Suscripción en tiempo real para actualizar insignias automáticamente
      this.insigniasService.getMedalsUser().subscribe(medals => {
        this.insigniasActuales = medals
          .filter(m => m.conseguido)
          .map(m => m.medal);
      });
    });
  }
}
