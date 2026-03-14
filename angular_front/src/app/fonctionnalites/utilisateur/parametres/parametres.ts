import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-parametres',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './parametres.html',
  styleUrl: './parametres.css'
})
export class Parametres {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  baseMedia = 'http://127.0.0.1:8000';
  moi = signal<any>(null);
  formulaire = signal<any>({
    prenom: '',
    nom: '',
    username: '',
    email: '',
    photo: null,
    nouveau_mot_de_passe: '',
    confirmer_mot_de_passe: ''
  });
  chargement = signal(false);
  succes = signal(false);
  erreur = signal<string | null>(null);

  ngOnInit() {
    this.chargerMoi();
  }

  chargerMoi() {
    this.authService.getMe().subscribe({
      next: (u: any) => {
        this.moi.set(u);
        this.formulaire.set({
          prenom: u.prenom,
          nom: u.nom,
          username: u.username,
          email: u.email,
          photo: null,
          nouveau_mot_de_passe: '',
          confirmer_mot_de_passe: ''
        });
      }
    });
  }

  surFichierSelectionne(event: any) {
    const fichier = event.target.files[0];
    if (fichier) {
      this.formulaire.update(f => ({ ...f, photo: fichier }));
    }
  }

  enregistrer() {
    this.chargement.set(true);
    this.succes.set(false);
    this.erreur.set(null);

    const formData = new FormData();
    const data = this.formulaire();
    
    formData.append('prenom', data.prenom);
    formData.append('nom', data.nom);
    formData.append('email', data.email);
    
    if (data.nouveau_mot_de_passe) {
      if (data.nouveau_mot_de_passe !== data.confirmer_mot_de_passe) {
        this.chargement.set(false);
        this.erreur.set('Les mots de passe ne correspondent pas.');
        return;
      }
      formData.append('password', data.nouveau_mot_de_passe);
    }

    if (data.photo) {
      formData.append('photo', data.photo);
    }

    this.authService.updateMe(formData).subscribe({
      next: () => {
        this.chargement.set(false);
        this.succes.set(true);
        this.chargerMoi();
      },
      error: (err) => {
        this.chargement.set(false);
        this.erreur.set('Une erreur est survenue lors de la mise à jour du profil.');
      }
    });
  }

  retour() {
    this.router.navigate(['/projets']);
  }
}
