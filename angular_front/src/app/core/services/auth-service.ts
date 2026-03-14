import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Utilisateur {
  id: number;
  username: string;
  email: string;
  prenom: string;
  nom: string;
  role: 'ADMIN' | 'PROFESSEUR' | 'ETUDIANT';
  photo?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  api="http://127.0.0.1:8000/api"

  constructor(private http:HttpClient) {}

  login(data:any){
    return this.http.post(`${this.api}/token/`,data)
  }

  register(data:any){
    return this.http.post(`${this.api}/users/register/`,data)
  }

  sessionLogin(data:any){
    return this.http.post(`${this.api}/users/session-login/`, data, { withCredentials: true })
  }

  getMe(): Observable<Utilisateur>{
    return this.http.get<Utilisateur>(`${this.api}/users/me/`)
  }

  updateMe(data: any){
    return this.http.patch<Utilisateur>(`${this.api}/users/me/`, data)
  }

  listUsers(): Observable<Utilisateur[]>{
    return this.http.get<Utilisateur[]>(`${this.api}/users/users/`)
  }

  createUser(data: any): Observable<Utilisateur> {
    return this.http.post<Utilisateur>(`${this.api}/users/users/`, data);
  }

  updateUser(id: number, data: any): Observable<Utilisateur> {
    return this.http.patch<Utilisateur>(`${this.api}/users/users/${id}/`, data);
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.api}/users/users/${id}/`);
  }
}
