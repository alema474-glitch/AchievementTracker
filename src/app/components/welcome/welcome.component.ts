import { CommonModule } from '@angular/common';
import { Component, ViewEncapsulation } from '@angular/core';
import { RouterLink } from "@angular/router";

interface Particle {
  left: number;
  width: number;
  height: number;
  duration: number;
  delay: number;
}

@Component({
  selector: 'app-welcome',
  imports: [RouterLink, CommonModule],
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class WelcomeComponent {
  particles: Particle[] = [];

  ngOnInit() {
    this.generateParticles(28);
  }

  generateParticles(count: number) {
    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        left: Math.random() * 100,      // porcentaje horizontal
        width: Math.random() * 3 + 1,   // ancho px
        height: Math.random() * 3 + 1,  // alto px
        duration: Math.random() * 20 + 12, // duración de animación en s
        delay: Math.random() * 3          // delay en s
      });
    }
  }
}
