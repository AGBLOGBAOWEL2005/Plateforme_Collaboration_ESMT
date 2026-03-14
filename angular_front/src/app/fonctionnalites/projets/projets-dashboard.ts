import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProjectsService, Project } from '../../core/services/projects-service';
import { TasksService, Task } from '../../core/services/tasks-service';
import { AuthService } from '../../core/services/auth-service';
import { FormsModule } from '@angular/forms';

type ProjectView = Project & {
  progress: number;
  total: number;
  done: number;
  statut_calcule: 'A_LANCER' | 'EN_COURS' | 'TERMINE';
};

@Component({
  selector: 'app-projets-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './projets-dashboard.html',
  styleUrl: './projets-dashboard.css',
})
export class ProjetsDashboard {
  private readonly projetsService = inject(ProjectsService);
  private readonly tachesService = inject(TasksService);
  private readonly authService = inject(AuthService);

  baseMedia = 'http://127.0.0.1:8000';

  listeProjets = signal<ProjectView[]>([]);
  toutesLesTaches = signal<Task[]>([]);
  moi = signal<any>(null);
  chargement = signal(false);
  erreur = signal<string | null>(null);
  recherche = signal('');

  projetsFiltres = computed(() => {
    const terme = this.recherche().toLowerCase().trim();
    if (!terme) return this.listeProjets();
    return this.listeProjets().filter(p => 
      p.titre.toLowerCase().includes(terme) || 
      p.description?.toLowerCase().includes(terme)
    );
  });

  projetsCreesCompte = computed(() => {
    return this.listeProjets().filter(p => p.createur === this.moi()?.id).length;
  });

  projetsInachevesCompte = computed(() => {
    return this.listeProjets().filter(p => p.progress < 100).length;
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
    const total = this.toutesLesTaches().length;
    if (total === 0) return 0;
    const aFaire = this.toutesLesTaches().filter(t => t.assigned_to === this.moi()?.id).length;
    if (aFaire === 0) return 0;
    const terminees = this.toutesLesTaches().filter(t => t.assigned_to === this.moi()?.id && t.statut === 'TERMINE').length;
    return Math.round((terminees / aFaire) * 100);
  });

  afficherCreation = signal(false);
  enModification = signal(false);
  idEnModification = signal<number | null>(null);
  
  afficherDocuments = signal(false);
  afficherMembres = signal(false);
  projetSelectionne = signal<ProjectView | null>(null);

  formulaire = signal<Partial<Project>>({
    titre: '',
    description: '',
    date_debut: '',
    date_fin: '',
  });

  ngOnInit() {
    this.recupererMoi();
    this.recupererProjets();
  }

  recupererMoi() {
    this.authService.getMe().subscribe(u => this.moi.set(u));
  }

  recupererProjets() {
    this.chargement.set(true);
    this.erreur.set(null);
    this.projetsService.list().subscribe({
      next: (ps) => {
        const vues: ProjectView[] = ps.map((p) => ({
          ...p,
          progress: 0,
          total: 0,
          done: 0,
          statut_calcule: 'A_LANCER'
        }));
        this.listeProjets.set(vues);
        const toutesLesTachesLocal: Task[] = [];
        let projetsTraites = 0;

        vues.forEach((p, idx) => {
          this.tachesService.listByProject(p.id).subscribe({
            next: (ts) => {
              toutesLesTachesLocal.push(...ts);
              const total = ts.length;
              const done = ts.filter((t) => t.statut === 'TERMINE').length;
              const progress = total === 0 ? 0 : Math.round((done / total) * 100);
              
              let statut: 'A_LANCER' | 'EN_COURS' | 'TERMINE' = 'A_LANCER';
              if (total > 0) {
                if (done === total) {
                  statut = 'TERMINE';
                } else if (done > 0 || ts.some(t => t.statut === 'EN_COURS')) {
                  statut = 'EN_COURS';
                }
              }
 
               const misAJour = { ...p, total, done, progress, statut_calcule: statut };
               const clone = [...this.listeProjets()];
              clone[idx] = misAJour;
              this.listeProjets.set(clone);
              
              projetsTraites++;
              if (projetsTraites === vues.length) {
                this.toutesLesTaches.set(toutesLesTachesLocal);
              }
            },
            error: () => {
              projetsTraites++;
              if (projetsTraites === vues.length) {
                this.toutesLesTaches.set(toutesLesTachesLocal);
              }
            }
          });
        });
        if (vues.length === 0) {
          this.toutesLesTaches.set([]);
        }
        this.chargement.set(false);
      },
      error: (e) => {
        this.erreur.set('Erreur de chargement');
        this.chargement.set(false);
      },
    });
  }

  basculerCreation() {
    this.afficherCreation.update(v => !v);
    if (!this.afficherCreation()) {
      this.reinitialiserFormulaire();
    }
  }

  basculerModification(projet: Project) {
    this.enModification.set(true);
    this.idEnModification.set(projet.id);
    this.formulaire.set({
      titre: projet.titre,
      description: projet.description,
      date_debut: projet.date_debut,
      date_fin: projet.date_fin,
    });
    this.afficherCreation.set(true);
  }

  reinitialiserFormulaire() {
    this.enModification.set(false);
    this.idEnModification.set(null);
    this.formulaire.set({ titre: '', description: '', date_debut: '', date_fin: '' });
  }

  creer() {
    const donnees = this.formulaire();
    if (this.enModification() && this.idEnModification()) {
      this.projetsService.update(this.idEnModification()!, donnees).subscribe({
        next: () => {
          this.basculerCreation();
          this.recupererProjets();
        },
        error: () => this.erreur.set('Modification de projet échouée'),
      });
    } else {
      this.projetsService.create(donnees).subscribe({
        next: () => {
          this.basculerCreation();
          this.recupererProjets();
        },
        error: () => this.erreur.set('Création de projet échouée'),
      });
    }
  }

  supprimerProjet(id: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
      this.projetsService.delete(id).subscribe({
        next: () => this.recupererProjets(),
        error: () => this.erreur.set('Suppression échouée'),
      });
    }
  }

  ouvrirDocuments(projet: ProjectView) {
    this.projetSelectionne.set(projet);
    this.afficherDocuments.set(true);
  }

  fermerDocuments() {
    this.afficherDocuments.set(false);
    this.projetSelectionne.set(null);
  }

  ouvrirMembres(projet: ProjectView) {
    this.projetSelectionne.set(projet);
    this.afficherMembres.set(true);
  }

  fermerMembres() {
    this.afficherMembres.set(false);
    this.projetSelectionne.set(null);
  }

  surFichierSelectionne(event: any, projetId: number) {
    const fichier = event.target.files[0];
    if (fichier) {
      this.projetsService.uploadDocument(projetId, fichier).subscribe({
        next: () => {
          this.recupererProjets();
          if (this.projetSelectionne()?.id === projetId) {
            this.projetsService.get(projetId).subscribe(misAJour => {
              this.projetSelectionne.set({ ...this.projetSelectionne()!, ...misAJour } as ProjectView);
            });
          }
        },
        error: () => this.erreur.set('Téléchargement échoué')
      });
    }
  }
}
