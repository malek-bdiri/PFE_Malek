import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User, CreateUserRequest } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiUrl = '/api/admin/users';

  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(users => users.map(u => ({
        id:        u.id,
        firstname: u.firstname  || u.firstName  || '',
        lastname:  u.lastname   || u.lastName   || '',
        email:     u.email      || u.username   || '',
        role:      u.role       || 'LECTEUR',
        enabled:   u.enabled    ?? true
      } as User)))
    );
  }

  /** Créer un user dans Keycloak — le backend génère le mdp et envoie l'email */
  createUser(user: User): Observable<{ message: string; userId: string }> {
    const request: CreateUserRequest = {
      firstName: user.firstname,
      lastName:  user.lastname,
      email:     user.email,
      role:      user.role
    };
    return this.http.post<{ message: string; userId: string }>(this.apiUrl, request);
  }

  /** Modifier prénom / nom / rôle (email non modifiable) */
  updateUser(id: string, user: User): Observable<string> {
    const request: CreateUserRequest = {
      firstName: user.firstname,
      lastName:  user.lastname,
      email:     user.email,
      role:      user.role
    };
    return this.http.put(this.apiUrl + '/' + id, request, { responseType: 'text' });
  }

  deleteUser(id: string): Observable<string> {
    return this.http.delete(this.apiUrl + '/' + id, { responseType: 'text' });
  }

  updateUserRole(id: number, role: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/role`, { role });
  }

  toggleUserStatus(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/toggle-status`, {});
  }
}
