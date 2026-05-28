import { inject } from '@angular/core';
import { Database } from '@angular/fire/database';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take, from } from 'rxjs';
import { UserRole } from '../models/user.module';

export const roleGuard: CanActivateFn = (route, state) => {
  const db = inject(Database);
  const router = inject(Router);
  const personService = inject(AuthService);

  const roles: UserRole[] = route.data['roles'];

  return personService.getUserWithProfile().pipe(
    take(1),
    map((person) => {
      if (person) {
        if (person.role && roles.includes(person.role)) {
          return true; // Acceso permitido
        }
        router.navigate(['/nav/home']); // Redirigimos a /nav/home
        return false; // Acceso denegado
      } else {
        router.navigate(['/login']); // Redirigimos a /login
        return false; // Acceso denegado
      }
    })
  );
};
