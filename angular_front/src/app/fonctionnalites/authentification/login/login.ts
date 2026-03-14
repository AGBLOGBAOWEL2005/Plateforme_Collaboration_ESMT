import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth-service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  form: any = {
    username: '',
    password: ''
  };

  errorMsg: string = '';

  constructor(private auth: AuthService, private router: Router) {}

  login() {
    this.errorMsg = '';
    this.auth.login(this.form).subscribe({
      next: (res: any) => {
        localStorage.setItem('token', res.access);
        this.auth.sessionLogin(this.form).subscribe({
          next: () => {
            console.log('connecté + session');
            this.router.navigate(['/projets']);
          },
          error: (e) => {
            console.error('Session non établie:', e);
            // On navigue quand même car on a le JWT
            this.router.navigate(['/projets']);
          }
        });
      },
      error: (error) => {
        console.error('Erreur de connexion:', error);
        this.errorMsg = 'Identifiants invalides ou problème serveur';
      }
    });
  }
}
