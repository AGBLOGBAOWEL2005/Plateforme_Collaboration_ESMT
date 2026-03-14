import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth-service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {

  form: any = {
    username: '',
    email: '',
    password: '',
    prenom: '',
    nom: '',
    role: 'ETUDIANT'
  };

  errorMsg: string = '';

  constructor(private auth: AuthService, private router: Router) {}

  register() {
    this.errorMsg = '';
    this.auth.register(this.form).subscribe({
      next: (res) => {
        console.log('compte créé');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Erreur inscription:', err);
        this.errorMsg = 'Erreur lors de la création du compte. Vérifiez vos informations.';
      }
    });
  }
}
