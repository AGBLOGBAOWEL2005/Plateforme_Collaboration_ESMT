import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type Project = {
  id: number;
  titre: string;
  description: string;
  date_debut: string;
  date_fin: string;
  createur: number;
  members: any[];
  documents: any[];
  user_role: 'creator' | 'member' | 'guest';
};

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private readonly http = inject(HttpClient);
  private readonly api = 'http://127.0.0.1:8000/api/projets/projets/';
  private readonly docApi = 'http://127.0.0.1:8000/api/projets/documents/';

  list(): Observable<Project[]> {
    return this.http.get<Project[]>(this.api);
  }

  create(data: Partial<Project>): Observable<Project> {
    return this.http.post<Project>(this.api, data);
  }

  get(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.api}${id}/`);
  }

  update(id: number, data: Partial<Project>): Observable<Project> {
    return this.http.patch<Project>(`${this.api}${id}/`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}${id}/`);
  }

  uploadDocument(projectId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('projet', projectId.toString());
    formData.append('fichier', file);
    formData.append('nom_document', file.name);
    return this.http.post(this.docApi, formData);
  }
}
