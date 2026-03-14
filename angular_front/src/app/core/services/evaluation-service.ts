import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface EvaluationStats {
  id: number;
  prenom: string;
  nom: string;
  username: string;
  photo: string | null;
  total_taches: number;
  dans_delai: number;
  pourcentage: number;
  prime: number;
  commentaire: string;
}

@Injectable({ providedIn: 'root' })
export class EvaluationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://127.0.0.1:8000/api/evaluation/';

  getPrimes(periode: string, trimestre?: string, annee?: number): Observable<EvaluationStats[]> {
    let url = `${this.baseUrl}primes/?periode=${periode}`;
    if (trimestre) url += `&trimestre=${trimestre}`;
    if (annee) url += `&annee=${annee}`;
    return this.http.get<EvaluationStats[]>(url);
  }
}
