import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TasksService, Task } from '../../core/services/tasks-service';
import { ProjectsService, Project } from '../../core/services/projects-service';
import { AuthService } from '../../core/services/auth-service';
import { FormsModule } from '@angular/forms';

type Colonne = {
  cle: Task['statut'];
  titre: string;
  couleur: string;
  icone: string;
  elements: Task[];
};

@Component({
  selector: 'app-kanban',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './kanban.html',
  styleUrl: './kanban.css',
})
export class Kanban {
  private readonly route = inject(ActivatedRoute);
  private readonly tachesService = inject(TasksService);
  private readonly projetsService = inject(ProjectsService);
  private readonly authService = inject(AuthService);

  baseMedia = 'http://127.0.0.1:8000';

  projetId = signal<number | null>(null);
  projet = signal<Project | null>(null);
  utilisateurs = signal<any[]>([]);
  moi = signal<any>(null);
  
  afficherCreation = signal(false);
  afficherModification = signal<Task | null>(null);
  afficherDepot = signal<Task | null>(null);
  
  formulaire = signal<Partial<Task>>({
    titre: '',
    description: '',
    date_limite: '',
    statut: 'A_FAIRE',
    assigned_to: undefined,
  });
  
  toutesLesTaches = signal<Task[]>([]);

  colonnesFiltrees = computed(() => {
    const terme = this.recherche().toLowerCase().trim();
    const liste = this.toutesLesTaches();
    
    const filtrer = (tasks: Task[]) => {
      if (!terme) return tasks;
      return tasks.filter(t => 
        t.titre.toLowerCase().includes(terme) || 
        t.description?.toLowerCase().includes(terme)
      );
    };

    return [
      { cle: 'A_FAIRE' as Task['statut'], titre: 'À faire', couleur: 'blue', icone: 'list', elements: filtrer(liste.filter(t => t.statut === 'A_FAIRE')) },
      { cle: 'EN_COURS' as Task['statut'], titre: 'En cours', couleur: 'orange', icone: 'clock', elements: filtrer(liste.filter(t => t.statut === 'EN_COURS')) },
      { cle: 'EN_ATTENTE' as Task['statut'], titre: 'En attente', couleur: 'red', icone: 'pause', elements: filtrer(liste.filter(t => t.statut === 'EN_ATTENTE')) },
      { cle: 'TERMINE' as Task['statut'], titre: 'Terminé', couleur: 'green', icone: 'check', elements: filtrer(liste.filter(t => t.statut === 'TERMINE')) },
    ] as Colonne[];
  });

  enTrainDeGlisser = signal<Task | null>(null);
  recherche = signal('');

  ngOnInit() {
    const pid = Number(this.route.snapshot.paramMap.get('id'));
    this.projetId.set(isNaN(pid) ? null : pid);
    this.chargerDonnees();
    this.chargerUtilisateurs();
    this.chargerMoi();
  }

  chargerMoi() {
    this.authService.getMe().subscribe(u => this.moi.set(u));
  }

  chargerUtilisateurs() {
    this.authService.listUsers().subscribe(liste => this.utilisateurs.set(liste));
  }

  chargerDonnees() {
    const pid = this.projetId();
    if (!pid) return;

    this.projetsService.get(pid).subscribe(p => this.projet.set(p));

    this.tachesService.listByProject(pid).subscribe((liste) => {
      this.toutesLesTaches.set(liste);
    });
  }

  auDebutDuGlissement(tache: Task) {
    // Seul le créateur, l'assigné ou l'admin peut déplacer les tâches
    if (this.projet()?.user_role === 'creator' || tache.assigned_to === this.moi()?.id || this.moi()?.role === 'ADMIN') {
      this.enTrainDeGlisser.set(tache);
    }
  }

  auLacher(cible: Colonne) {
    const t = this.enTrainDeGlisser();
    if (!t) return;

    if (t.statut === cible.cle) {
      this.enTrainDeGlisser.set(null);
      return;
    }

    this.tachesService.update(t.id, { statut: cible.cle }).subscribe({
      next: () => {
        this.enTrainDeGlisser.set(null);
        this.chargerDonnees();
      },
      error: () => {
        this.enTrainDeGlisser.set(null);
        this.chargerDonnees();
      },
    });
  }

  basculerCreation() {
    this.afficherCreation.update(v => !v);
  }

  ouvrirModification(tache: Task) {
    this.formulaire.set({ ...tache });
    this.afficherModification.set(tache);
  }

  fermerModification() {
    this.afficherModification.set(null);
    this.reinitialiserFormulaire();
  }

  ouvrirDepot(tache: Task) {
    this.afficherDepot.set(tache);
  }

  fermerDepot() {
    this.afficherDepot.set(null);
  }

  gererDepotFichier(event: any) {
    const tache = this.afficherDepot();
    if (!tache) return;

    const fichier = event.target.files[0];
    if (!fichier) return;

    const formData = new FormData();
    formData.append('fichier_rendu', fichier);
    formData.append('statut', 'TERMINE');

    this.tachesService.update(tache.id, formData as any).subscribe({
      next: () => {
        this.fermerDepot();
        this.chargerDonnees();
      },
      error: (err) => {
        console.error('Échec du dépôt', err);
      }
    });
  }

  creer() {
    const pid = this.projetId();
    if (!pid) return;
    const donnees: Partial<Task> = {
      ...this.formulaire(),
      projet: pid
    };
    this.tachesService.create(donnees).subscribe(() => {
      this.basculerCreation();
      this.reinitialiserFormulaire();
      this.chargerDonnees();
    });
  }

  modifier() {
    const tache = this.afficherModification();
    if (!tache) return;
    this.tachesService.update(tache.id, this.formulaire()).subscribe(() => {
      this.fermerModification();
      this.chargerDonnees();
    });
  }

  supprimer(tacheId: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      this.tachesService.delete(tacheId).subscribe(() => {
        this.chargerDonnees();
      });
    }
  }

  reinitialiserFormulaire() {
    this.formulaire.set({ titre: '', description: '', date_limite: '', statut: 'A_FAIRE', assigned_to: undefined });
  }
}
