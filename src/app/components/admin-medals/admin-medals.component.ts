import { Component, OnInit } from '@angular/core';
import { InsigniasService } from '../../services/insignias.service';
import { Insignia } from '../../models/insignias.module';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from "@angular/router";

@Component({
  selector: 'app-admin-medals',
  imports: [CommonModule],
  templateUrl: './admin-medals.component.html',
  styleUrl: './admin-medals.component.scss'
})
export class AdminMedalsComponent implements OnInit {
  medals: Insignia[] = [];

  constructor(private insigniasService: InsigniasService, private router: Router) {}

  ngOnInit(): void {
    this.insigniasService.getAllMedals().subscribe(medals => {
      this.medals = medals;
    });
  }

  goToAdd() {
    this.router.navigate(['/nav/admin-medal-add']);
  }
}
