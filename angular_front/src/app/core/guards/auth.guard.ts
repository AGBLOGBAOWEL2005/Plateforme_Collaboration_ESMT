import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');

  if (token) {
    return true;
  }

  // Rediriger vers la page de connexion si aucun jeton n'est trouvé
  router.navigate(['/login']);
  return false;
};
