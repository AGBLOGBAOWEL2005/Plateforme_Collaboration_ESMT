import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export type Task = {
  id: number;
  titre: string;
  description: string;
  date_creation: string;
  date_limite: string;
  date_fin_reelle?: string | null;
  statut: 'A_FAIRE' | 'EN_COURS' | 'EN_ATTENTE' | 'TERMINE';
  fichier_rendu?: string | null;
  projet: number;
  assigned_to: number;
  assigned_to_details?: any;
};

@Injectable({ providedIn: 'root' })
export class TasksService {
  private readonly http = inject(HttpClient);
  private readonly api = 'http://127.0.0.1:8000/api/projets/taches/';

  list(): Observable<Task[]> {
    return this.http.get<Task[]>(this.api);
  }

  listByProject(projectId: number): Observable<Task[]> {
    return this.list().pipe(map(list => list.filter(t => t.projet === projectId)));
  }

  create(data: Partial<Task>): Observable<Task> {
    return this.http.post<Task>(this.api, data);
  }

  update(id: number, data: Partial<Task>): Observable<Task> {
    return this.http.patch<Task>(`${this.api}${id}/`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}${id}/`);
  }
}
