import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth-service';
import { ProjectsService } from '../../core/services/projects-service';
import { TasksService } from '../../core/services/tasks-service';
import { CommunicationService } from '../../core/services/communication-service';
import { EvaluationService, EvaluationStats } from '../../core/services/evaluation-service';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-panel.html',
  styleUrl: './admin-panel.css'
})
export class AdminPanel {
  private readonly authService = inject(AuthService);
  private readonly projetsService = inject(ProjectsService);
  private readonly tachesService = inject(TasksService);
  private readonly communicationService = inject(CommunicationService);
  private readonly evaluationService = inject(EvaluationService);

  ongletActif = signal<'utilisateurs' | 'evaluations'>('utilisateurs');
  
  utilisateurs = signal<any[]>([]);
  rechercheUtilisateur = signal('');

  utilisateursFiltres = computed(() => {
    const terme = this.rechercheUtilisateur().toLowerCase().trim();
    if (!terme) return this.utilisateurs();
    return this.utilisateurs().filter(u => 
      u.username.toLowerCase().includes(terme) || 
      u.email.toLowerCase().includes(terme) || 
      u.prenom.toLowerCase().includes(terme) || 
      u.nom.toLowerCase().includes(terme)
    );
  });

  evaluationsEnseignants = signal<EvaluationStats[]>([]);
  
  filtrePeriode = signal<'trimestre' | 'annee'>('trimestre');
  trimestreSelectionne = signal<'T1' | 'T2' | 'T3' | 'T4'>('T1');
  anneeSelectionnee = signal<number>(new Date().getFullYear());
  
  chargement = signal(false);
  baseMedia = 'http://127.0.0.1:8000';

  // Gestion Modal Utilisateur
  afficherModalUtilisateur = signal(false);
  modeEditionUtilisateur = signal(false);
  utilisateurSelectionne = signal<any | null>(null);
  formUtilisateur = {
    username: '',
    email: '',
    prenom: '',
    nom: '',
    role: 'ETUDIANT',
    password: ''
  };

  ngOnInit() {
    this.chargerUtilisateurs();
  }

  changerOnglet(onglet: 'utilisateurs' | 'evaluations') {
    this.ongletActif.set(onglet);
    if (onglet === 'utilisateurs') this.chargerUtilisateurs();
    if (onglet === 'evaluations') this.chargerEvaluations();
  }

  selectionnerTrimestre(t: any) {
    this.trimestreSelectionne.set(t);
    this.filtrePeriode.set('trimestre');
    this.chargerEvaluations();
  }

  selectionnerAnnee() {
    this.filtrePeriode.set('annee');
    this.chargerEvaluations();
  }

  chargerEvaluations() {
    this.chargement.set(true);
    const trimestre = this.filtrePeriode() === 'trimestre' ? this.trimestreSelectionne() : undefined;
    
    this.evaluationService.getPrimes(this.filtrePeriode(), trimestre, this.anneeSelectionnee()).subscribe({
      next: (stats) => {
        this.evaluationsEnseignants.set(stats);
        this.chargement.set(false);
      },
      error: () => this.chargement.set(false)
    });
  }

  chargerUtilisateurs() {
    this.chargement.set(true);
    this.authService.listUsers().subscribe({
      next: (users) => {
        this.utilisateurs.set(users);
        this.chargement.set(false);
      },
      error: () => this.chargement.set(false)
    });
  }

  // Modal Utilisateur
  ouvrirModalUtilisateur(u?: any) {
    if (u) {
      this.modeEditionUtilisateur.set(true);
      this.utilisateurSelectionne.set(u);
      this.formUtilisateur = {
        username: u.username,
        email: u.email,
        prenom: u.prenom,
        nom: u.nom,
        role: u.role,
        password: ''
      };
    } else {
      this.modeEditionUtilisateur.set(false);
      this.utilisateurSelectionne.set(null);
      this.formUtilisateur = {
        username: '',
        email: '',
        prenom: '',
        nom: '',
        role: 'ETUDIANT',
        password: ''
      };
    }
    this.afficherModalUtilisateur.set(true);
  }

  fermerModalUtilisateur() {
    this.afficherModalUtilisateur.set(false);
  }

  enregistrerUtilisateur() {
    this.chargement.set(true);
    const data = { ...this.formUtilisateur };
    if (!data.password) delete (data as any).password;

    if (this.modeEditionUtilisateur()) {
      this.authService.updateUser(this.utilisateurSelectionne().id, data).subscribe({
        next: () => {
          this.chargerUtilisateurs();
          this.fermerModalUtilisateur();
        },
        error: (err) => {
          console.error(err);
          this.chargement.set(false);
        }
      });
    } else {
      this.authService.createUser(data).subscribe({
        next: () => {
          this.chargerUtilisateurs();
          this.fermerModalUtilisateur();
        },
        error: (err) => {
          console.error(err);
          this.chargement.set(false);
        }
      });
    }
  }

  // Actions CRUD
  supprimerUtilisateur(id: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      this.chargement.set(true);
      this.authService.deleteUser(id).subscribe({
        next: () => this.chargerUtilisateurs(),
        error: () => this.chargement.set(false)
      });
    }
  }
}
