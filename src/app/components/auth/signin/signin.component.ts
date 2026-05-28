import { CommonModule } from '@angular/common';
import { Component, ViewEncapsulation } from '@angular/core';
import { UserCredential } from '@angular/fire/auth';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from "@angular/router";
import { matchPasswordValidator, strongPasswordValidator } from '../../../validations/signin.validation';
import { AuthService } from '../../../services/auth.service';

interface Particle {
  left: number;
  width: number;
  height: number;
  duration: number;
  delay: number;
}

@Component({
  selector: 'app-signin',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signin.component.html',
  styleUrl: './signin.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class SigninComponent {

  registerForm: FormGroup;

  constructor(formBuilder: FormBuilder, private router: Router, private authService: AuthService) {
    this.registerForm = formBuilder.group({
      'username': ['', [Validators.required]],
      'firstName': ['', [Validators.required]],
      'lastName': ['', [Validators.required]],
      'email': ['', [Validators.required, Validators.email]],
      'password': ['', [Validators.required, Validators.minLength(5), strongPasswordValidator]],
      'confirmPassword': ['', [Validators.required, matchPasswordValidator]],
      'conditions': [false, [Validators.requiredTrue]]
    })
  }

  async onSubmit() {
    // Comprobamos que el formulario sea válido
    if (this.registerForm.valid) {
      try {
        let username = this.registerForm.get('username')?.value;
        let firstName = this.registerForm.get('firstName')?.value;
        let lastName = this.registerForm.get('lastName')?.value;
        let email = this.registerForm.get('email')?.value;
        let password = this.registerForm.get('password')?.value;
        let confirmPassword = this.registerForm.get('confirmPassword')?.value;

        const userCredential: UserCredential = await this.authService.register(email, password);

        await this.authService.saveUser(email, firstName, lastName, username);

        // Obtener el perfil del usuario para determinar el rol
        this.authService.getUserWithProfile().subscribe((userProfile) => {
          if (userProfile && userProfile.role === 'ADMIN') {
            this.router.navigate(['/nav/admin-games']);
          } else {
            this.router.navigate(['/nav/home']);
          }
        });
      } catch (error: any) {
        console.error('Error en el registro:', error);
      }

    }
  }

  async loginGoogle() {
    try {
      const result = await this.authService.loginWithGoogle();
      const user = result.user;

      if (!user) return;

      // Traer perfil de la DB
      let profile = await this.authService.getUserProfile();

      if (!profile) {
        // Guardamos mínimo info
        await this.authService.saveUser(
          user.email || '',
          user.displayName || '',
          '', // lastname vacío
          user.displayName || '', // username temporal
          'USER'
        );
        profile = await this.authService.getUserProfile();
      }

      // Comprobar si le falta algún dato obligatorio
      if (!profile.username || !profile.firstName || !profile.lastName || !profile.email) {
        this.router.navigate(['/complete-profile']);
        return;
      }

      // Si todo está bien, redirige según rol, por defecto USER
      this.authService.getUserWithProfile().subscribe(up => {
        if (up && up.role === 'ADMIN') {
          this.router.navigate(['/nav/admin-games']);
        } else {
          this.router.navigate(['/nav/home']);
        }
      });

    } catch (error) {
      console.log(error);
    }
  }

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
