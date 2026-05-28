import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { InsigniasService } from '../../services/insignias.service';
import { Insignia } from '../../models/insignias.module';

@Component({
  selector: 'app-medals',
  imports: [CommonModule],
  templateUrl: './medals.component.html',
  styleUrl: './medals.component.scss'
})
export class MedalsComponent implements OnInit {

  insignias: { medal: Insignia, conseguido: boolean }[] = [];

  // Filtro activo: 'todas' | 'conseguidas' | 'bloqueadas'
  filtroActivo: string = 'todas';

  constructor(private insigniasService: InsigniasService) { }

  ngOnInit() {
    this.insigniasService.getMedalsUser().subscribe(res => {
      this.insignias = res.sort((a, b) => a.medal.valor - b.medal.valor);
    });
  }

  // Helper para contar conseguidas (usado en el template como método auxiliar)
  get conseguidasCount(): number {
    return this.insignias.filter(i => i.conseguido).length;
  }

}
