import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CommunicationService } from '../core/services/communication-service';
import { AuthService, Utilisateur } from '../core/services/auth-service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell {
  private readonly communicationService = inject(CommunicationService);
  private readonly authService = inject(AuthService);
  private readonly routeur = inject(Router);

  nombreNonLus = signal(0);
  moi = signal<Utilisateur | null>(null);
  private intervalleRecuperation: any;

  ngOnInit() {
    this.recupererMoi();
    this.recupererNombreNonLus();
    // Vérification périodique des nouvelles notifications
    this.intervalleRecuperation = setInterval(() => this.recupererNombreNonLus(), 10000);
  }

  ngOnDestroy() {
    if (this.intervalleRecuperation) clearInterval(this.intervalleRecuperation);
  }

  recupererMoi() {
    this.authService.getMe().subscribe(u => this.moi.set(u));
  }

  recupererNombreNonLus() {
    this.communicationService.getUnreadCount().subscribe(nombre => this.nombreNonLus.set(nombre));
  }

  deconnexion() {
    localStorage.removeItem('token');
    this.routeur.navigate(['/login']);
  }
}
