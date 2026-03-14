import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService, Utilisateur } from '../services/auth-service';
import { map, take } from 'rxjs';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return authService.getMe().pipe(
    take(1),
    map((user: Utilisateur) => {
      if (user && user.role === 'ADMIN') {
        return true;
      }
      router.navigate(['/dashboard']);
      return false;
    })
  );
};
