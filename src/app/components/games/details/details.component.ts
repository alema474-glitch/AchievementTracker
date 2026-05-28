import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Juego } from '../../../models/juegos.module';
import { LogrosService } from '../../../services/logros.service';
import { Logros } from '../../../models/logros.module';
import { CommonModule } from '@angular/common';
import { JuegosServiceTsService } from '../../../services/juegos.service.ts.service';

@Component({
  selector: 'app-details',
  imports: [CommonModule],
  templateUrl: './details.component.html',
  styleUrl: './details.component.scss'
})
export class DetailsComponent {
  juego!: Juego;

  // Array de logros con su estado de conseguido
  logrosUser: { achievement: Logros, conseguido: boolean }[] = [];

  constructor(
    private route: ActivatedRoute,
    private juegosService: JuegosServiceTsService,
    private achService: LogrosService,
    private router: Router
  ) { }

  ngOnInit(): void {
    const appId = this.route.snapshot.paramMap.get('id'); // id del juego desde la ruta
    if (!appId) return;

    // Traer los datos del juego
    this.juegosService.getGameById(appId).subscribe(juego => {
      if (juego) {
        this.juego = juego;

        // Cargar logros del usuario para este juego
        this.achService.getAchievementsUser(appId).subscribe(data => {
          this.logrosUser = data;
        });
      } else {
        console.error("Juego no encontrado");
        this.volverAJuegos(); // Volver a la lista si no existe
      }
    });
  }

  // Función para volver a la lista de juegos
  volverAJuegos() {
    this.router.navigate(['/nav/games']);
  }

  // Función para marcar o desmarcar logro
  toggleLogro(logroItem: { achievement: Logros, conseguido: boolean }) {
    const idLogro = logroItem.achievement.id;
    const appId = this.juego.appId;
    this.achService.toggleAchievement(appId, idLogro, logroItem.conseguido).then(() => {
      logroItem.conseguido = !logroItem.conseguido;
    });
  }

  get conseguidosCount(): number {
    return this.logrosUser.filter(l => l.conseguido).length;
  }
}
