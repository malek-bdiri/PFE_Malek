import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  private isRefreshing = false;
  private refreshDone$ = new BehaviorSubject<string | null>(null);

  private readonly urlsToSkip = ['/assets/', '/auth/login', '/auth/register', '/auth/refresh', '/rag-api', '/keycloak/', '/api/admin/users/change-password'];

  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();
    
    console.log('🔗 Intercepteur:', {
      url: req.url,
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      willSkip: this.urlsToSkip.some(u => req.url.includes(u))
    });

    if (!token || this.urlsToSkip.some(u => req.url.includes(u))) {
      return next.handle(req);
    }

    return next.handle(this.addToken(req, token)).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Erreur intercepteur:', { status: error.status, url: req.url });
        if (error.status === 401 && !this.urlsToSkip.some(u => req.url.includes(u))) {
          return this.handle401(req, next);
        }
        return throwError(() => error);
      })
    );
  }

  private addToken(req: HttpRequest<any>, token: string): HttpRequest<any> {
    return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  private handle401(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.isRefreshing) {
      // Attendre que le refresh en cours se termine, puis rejouer
      return this.refreshDone$.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(token => next.handle(this.addToken(req, token!)))
      );
    }

    this.isRefreshing = true;
    this.refreshDone$.next(null);

    return this.authService.refreshAccessToken().pipe(
      switchMap(response => {
        this.isRefreshing = false;
        this.refreshDone$.next(response.access_token);
        return next.handle(this.addToken(req, response.access_token));
      }),
      catchError(err => {
        this.isRefreshing = false;
        // Refresh échoué → déconnecter
        this.authService.logout();
        return throwError(() => err);
      })
    );
  }
}
