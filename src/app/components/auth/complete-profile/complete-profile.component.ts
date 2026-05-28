import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Particle {
  left: number;
  width: number;
  height: number;
  duration: number;
  delay: number;
}

@Component({
  selector: 'app-complete-profile',
  imports: [CommonModule, FormsModule],
  templateUrl: './complete-profile.component.html',
  styleUrl: './complete-profile.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class CompleteProfileComponent implements OnInit {
  username = '';
  firstName = '';
  lastName = '';

  constructor(private auth: AuthService, private router: Router) {}

  particles: Particle[] = [];

  async ngOnInit() {
    this.generateParticles(28);
    const profile = await this.auth.getUserProfile();
    if (profile) {
      this.username = profile.username || '';
      this.firstName = profile.firstName || '';
      this.lastName = profile.lastName || '';
    }
  }

  async saveProfile() {
    try {
      await this.auth.saveUser(
        this.auth.getCurrentUser()?.email || '',
        this.firstName,
        this.lastName,
        this.username,
        'USER'
      );
      this.router.navigate(['/nav/home']); // Redirige a home
    } catch (err) {
      console.log(err);
    }
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
