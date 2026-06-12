import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ValidationService {
  constructor(private http: HttpClient, private authService: AuthService) {}

  getUsers(): Observable<any[]> {
    return this.http.get<any[]>('/api/admin/users');
  }

  /**
   * Retourne la liste des validateurs potentiels (ADMIN + CHEF_DE_PROJET).
   * - Pour ADMIN : appel direct sur /api/admin/users (toujours disponible)
   * - Pour les autres rôles : appel sur /api/projets/validateurs
   *   (endpoint à créer sur le backend — voir BACKEND_FIX_USERS_LIST.md)
   */
  getValidateurs(): Observable<any[]> {
    const role = this.authService.currentUserValue?.role;
    if (role === 'ADMIN') {
      return this.http.get<any[]>('/api/admin/users');
    }
    return this.http.get<any[]>('/api/projets/validateurs').pipe(
      catchError(() => this.http.get<any[]>('/api/admin/users').pipe(
        catchError(() => of([]))
      ))
    );
  }

  demanderValidation(projetId: number, payload: any): Observable<any> {
    return this.http.post(`/api/projets/${projetId}/demande-validation`, payload);
  }

  getValidationStatus(projetId: number): Observable<any> {
    return this.http.get(`/api/projets/${projetId}/validation-status`);
  }

  valider(projetId: number, decision: string, commentaire: string): Observable<any> {
    return this.http.post(`/api/projets/${projetId}/valider`, { decision, commentaire });
  }
}
