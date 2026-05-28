import { Component, ViewEncapsulation } from '@angular/core';
import { Router, RouterLink } from "@angular/router";
import { AuthService } from '../../../services/auth.service';
import { UserCredential } from '@angular/fire/auth';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface Particle {
  left: number;
  width: number;
  height: number;
  duration: number;
  delay: number;
}

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class LoginComponent {

  particles: Particle[] = [];

  errorMessage: string = '';

  constructor(private router: Router, private auth: AuthService) {

  }

  formLogin = {
    email: '',
    passwd: ''

  }

  login() {
    this.errorMessage = ''; // limpiar error anterior
    if (this.formLogin.email && this.formLogin.passwd) {
      this.auth.login(this.formLogin.email, this.formLogin.passwd).then((user: UserCredential) => {
        // Obtener el perfil del usuario para determinar el rol
        this.auth.getUserWithProfile().subscribe((userProfile) => {
          if (userProfile && userProfile.role === 'ADMIN') {
            this.router.navigate(['/nav/admin-games']);
          } else {
            this.router.navigate(['/nav/home']);
          }
        });
      }).catch((error) => {
        this.errorMessage = this.getErrorMessage(error.code); // capturar error
      });
    }
  }

  async loginGoogle() {
    this.errorMessage = ''; // limpiar error anterior
    try {
      const result = await this.auth.loginWithGoogle();
      const user = result.user;

      if (!user) return;

      // Traer perfil de la DB
      let profile = await this.auth.getUserProfile();

      if (!profile) {
        // Guardamos mínimo info
        await this.auth.saveUser(
          user.email || '',
          user.displayName || '',
          '', // lastname vacío
          user.displayName || '', // username temporal
          'USER'
        );
        profile = await this.auth.getUserProfile();
      }

      // Comprobar si le falta algún dato obligatorio
      if (!profile.username || !profile.firstName || !profile.lastName || !profile.email) {
        this.router.navigate(['/complete-profile']);
        return;
      }

      // Si todo está bien, redirige según rol, por defecto USER
      this.auth.getUserWithProfile().subscribe(up => {
        if (up && up.role === 'ADMIN') {
          this.router.navigate(['/nav/admin-games']);
        } else {
          this.router.navigate(['/nav/home']);
        }
      });

    } catch (error: any) {
      this.errorMessage = this.getErrorMessage(error.code); // capturar error
    }
  }

  private getErrorMessage(code: string): string {
  switch (code) {
    case 'auth/invalid-credential':
      return 'Email o contraseña incorrectos';
    case 'auth/wrong-password':
      return 'La contraseña es incorrecta';
    case 'auth/user-not-found':
      return 'No existe ninguna cuenta con ese email';
    case 'auth/user-disabled':
      return 'Esta cuenta ha sido desactivada';
    case 'auth/too-many-requests':
      return 'Demasiados intentos fallidos. Inténtalo más tarde';
    case 'auth/network-request-failed':
      return 'Error de conexión. Comprueba tu red';
    case 'auth/popup-closed-by-user':
      return 'Inicio de sesión con Google cancelado';
    default:
      return 'Ha ocurrido un error. Inténtalo de nuevo';
  }
}

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
