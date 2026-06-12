import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { Router } from '@angular/router';
import { LoginRequest, LoginResponse, User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/api/auth';
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor(private http: HttpClient, private router: Router) {
    const storedUser = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
const keycloakUrl =
  'http://localhost:8080/realms/momsoft/protocol/openid-connect/token';    
    const body = new URLSearchParams();
    body.set('grant_type', 'password');
    body.set('client_id', 'momsoft-rest-api');
    body.set('client_secret', 'T0076YKmZyv1Bk2kJ1IoCThGqHt0L3L6');
    body.set('username', credentials.email);
    body.set('password', credentials.password);
    
    return this.http.post<LoginResponse>(keycloakUrl, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).pipe(
      tap(response => {
        if (response.access_token) {
          // Stocker le token d'accès
          localStorage.setItem('token', response.access_token);
          localStorage.setItem('refresh_token', response.refresh_token);
          
          // Décoder le JWT pour extraire les informations utilisateur
          const userInfo = this.decodeToken(response.access_token);
          
          const user: User = {
            email: userInfo.email || credentials.email,
            role: this.extractPrimaryRole(userInfo),
            firstname: userInfo.given_name || credentials.email.split('@')[0],
            lastname: userInfo.family_name || 'User',
            keycloakId: userInfo.sub
          };
          
          console.log('✅ Utilisateur connecté:', user);
          localStorage.setItem('currentUser', JSON.stringify(user));
          this.currentUserSubject.next(user);
        }
      })
    );
  }

  /**
   * Décode un JWT token pour extraire les informations
   */
  private decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch (e) {
      console.error('Erreur lors du décodage du token:', e);
      return {};
    }
  }

  /**
   * Extrait le rôle principal depuis realm_access.roles
   */
  private extractPrimaryRole(tokenData: any): string {
    const roles = tokenData.realm_access?.roles || [];
    
    // Ordre de priorité des rôles
    const rolePriority = ['ADMIN', 'CHEF_DE_PROJET', 'EDITEUR', 'LECTEUR'];
    
    for (const role of rolePriority) {
      if (roles.includes(role)) {
        return role;
      }
    }
    
    return 'LECTEUR'; // Rôle par défaut
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    // Vérifier si le token n'est pas expiré
    try {
      const tokenData = this.decodeToken(token);
      const expirationTime = tokenData.exp * 1000; // Convertir en millisecondes
      return Date.now() < expirationTime;
    } catch (e) {
      return false;
    }
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  /**
   * Rafraîchir le token d'accès avec le refresh token
   */
  refreshToken(): Observable<LoginResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    return this.http.post<LoginResponse>(`${this.apiUrl}/refresh`, { refresh_token: refreshToken })
      .pipe(
        tap(response => {
          if (response.access_token) {
            localStorage.setItem('token', response.access_token);
            localStorage.setItem('refresh_token', response.refresh_token);
          }
        })
      );
  }

  /**
   * Rafraîchir le token directement via Keycloak (évite la dépendance au backend Spring Boot)
   */
  refreshAccessToken(): Observable<LoginResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    const keycloakUrl = '/keycloak/realms/momsoft/protocol/openid-connect/token';
    const body = new URLSearchParams();
    body.set('grant_type', 'refresh_token');
    body.set('client_id', 'momsoft-rest-api');
    body.set('client_secret', 'T0076YKmZyv1Bk2kJ1IoCThGqHt0L3L6');
    body.set('refresh_token', refreshToken);
    return this.http.post<LoginResponse>(keycloakUrl, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).pipe(
      tap(response => {
        if (response.access_token) {
          localStorage.setItem('token', response.access_token);
          if (response.refresh_token) {
            localStorage.setItem('refresh_token', response.refresh_token);
          }
        }
      })
    );
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email });
  }

  changeFirstPassword(email: string, newPassword: string): Observable<string> {
    return this.http.post('/api/admin/users/change-password',
      { email, newPassword },
      { responseType: 'text' }
    );
  }
}