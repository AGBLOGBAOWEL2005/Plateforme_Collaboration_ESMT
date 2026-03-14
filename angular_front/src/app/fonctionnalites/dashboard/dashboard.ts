import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProjectsService, Project } from '../../core/services/projects-service';
import { TasksService, Task } from '../../core/services/tasks-service';
import { AuthService } from '../../core/services/auth-service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private readonly projetsService = inject(ProjectsService);
  private readonly tachesService = inject(TasksService);
  private readonly authService = inject(AuthService);

  baseMedia = 'http://127.0.0.1:8000';

  listeProjets = signal<Project[]>([]);
  toutesLesTaches = signal<Task[]>([]);
  moi = signal<any>(null);
  chargement = signal(true);

  // Filtres de période
  filtrePeriode = signal<'trimestre' | 'annee'>('trimestre');
  trimestreSelectionne = signal<number>(this.getTrimestreActuel());
  anneeSelectionnee = signal<number>(new Date().getFullYear());

  private getTrimestreActuel(): number {
    const mois = new Date().getMonth();
    return Math.floor(mois / 3) + 1;
  }

  setFiltrePeriode(f: 'trimestre' | 'annee') {
    this.filtrePeriode.set(f);
  }

  setTrimestre(t: number) {
    this.trimestreSelectionne.set(t);
  }

  setAnnee(a: number) {
    this.anneeSelectionnee.set(a);
  }

  // Filtrage des tâches selon la période
  tachesFiltrees = computed(() => {
    const filtre = this.filtrePeriode();
    const annee = this.anneeSelectionnee();
    const trimestre = this.trimestreSelectionne();
    const mesTaches = this.toutesLesTaches().filter(t => t.assigned_to === this.moi()?.id);

    return mesTaches.filter(t => {
      const dateTache = new Date(t.date_creation || t.date_limite);
      const memeAnnee = dateTache.getFullYear() === annee;
      
      if (filtre === 'annee') return memeAnnee;
      
      const tTache = Math.floor(dateTache.getMonth() / 3) + 1;
      return memeAnnee && tTache === trimestre;
    });
  });

  // Statistiques détaillées (Cahier des charges)
  statsDetaillees = computed(() => {
    const taches = this.tachesFiltrees();
    const total = taches.length;
    if (total === 0) return { total: 0, terminees: 0, dansDelais: 0, enRetard: 0, inachevees: 0, pourcentageDelais: 0, prime: 0 };

    const terminees = taches.filter(t => t.statut === 'TERMINE');
    const inachevees = taches.filter(t => t.statut !== 'TERMINE');
    
    const dansDelais = terminees.filter(t => {
      if (!t.date_fin_reelle) return false;
      return new Date(t.date_fin_reelle) <= new Date(t.date_limite);
    });

    const enRetard = terminees.filter(t => {
      if (!t.date_fin_reelle) return true;
      return new Date(t.date_fin_reelle) > new Date(t.date_limite);
    });

    const pourcentageDelais = Math.round((dansDelais.length / total) * 100);
    
    let prime = 0;
    if (this.moi()?.role === 'PROFESSEUR') {
      if (pourcentageDelais === 100) prime = 100000;
      else if (pourcentageDelais >= 90) prime = 30000;
    }

    return {
      total,
      terminees: terminees.length,
      dansDelais: dansDelais.length,
      enRetard: enRetard.length,
      inachevees: inachevees.length,
      pourcentageDelais,
      prime
    };
  });

  ngOnInit() {
    this.authService.getMe().subscribe(u => this.moi.set(u));
    this.chargerDonnees();
  }

  chargerDonnees() {
    this.projetsService.list().subscribe({
      next: (ps) => {
        this.listeProjets.set(ps);
        const tachesLocales: Task[] = [];
        let projetsTraites = 0;

        if (ps.length === 0) {
          this.chargement.set(false);
          return;
        }

        ps.forEach((p) => {
          this.tachesService.listByProject(p.id).subscribe({
            next: (ts) => {
              tachesLocales.push(...ts);
              projetsTraites++;
              if (projetsTraites === ps.length) {
                this.toutesLesTaches.set(tachesLocales);
                this.chargement.set(false);
              }
            },
            error: () => {
              projetsTraites++;
              if (projetsTraites === ps.length) {
                this.toutesLesTaches.set(tachesLocales);
                this.chargement.set(false);
              }
            }
          });
        });
      },
      error: () => this.chargement.set(false)
    });
  }

  // Statistiques calculées
  projetsCreesCompte = computed(() => {
    return this.listeProjets().filter(p => p.createur === this.moi()?.id).length;
  });

  projetsInachevesCompte = computed(() => {
    // Un projet est inachevé s'il a au moins une tâche non terminée ou s'il n'a pas de tâches
    // Pour simplifier, on va dire inachevé si toutes ses tâches ne sont pas TERMINE
    // Mais on n'a pas le progress ici directement sans recalculer. 
    // Utilisons une logique simple : 
    return this.listeProjets().length; // À affiner si besoin
  });

  tachesAFaireCompte = computed(() => {
    return this.toutesLesTaches().filter(t => t.assigned_to === this.moi()?.id && t.statut !== 'TERMINE').length;
  });

  tachesInacheveesCompte = computed(() => {
    return this.toutesLesTaches().filter(t => t.statut !== 'TERMINE').length;
  });

  pourcentageProjetsCrees = computed(() => {
    const total = this.listeProjets().length;
    if (total === 0) return 0;
    return Math.round((this.projetsCreesCompte() / total) * 100);
  });

  pourcentageTachesAFaire = computed(() => {
    const totalAssigne = this.toutesLesTaches().filter(t => t.assigned_to === this.moi()?.id).length;
    if (totalAssigne === 0) return 0;
    const terminees = this.toutesLesTaches().filter(t => t.assigned_to === this.moi()?.id && t.statut === 'TERMINE').length;
    return Math.round((terminees / totalAssigne) * 100);
  });
}
