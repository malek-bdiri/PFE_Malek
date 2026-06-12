import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { LoginRequest, LoginResponse } from '../../models/user.model';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  credentials: LoginRequest = { email: '', password: '' };

  loading          = false;
  error            = '';
  returnUrl        = '/admin';

  // ── Première connexion ─────────────────────────────────────────────────────
  isFirstLogin     = false;
  newPassword      = '';
  confirmPassword  = '';
  changingPassword = false;
  passwordError    = '';
  passwordSuccess  = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/admin']);
    }
  }

  onSubmit(): void {
    if (!this.credentials.email || !this.credentials.password) {
      this.error = 'Veuillez remplir tous les champs';
      return;
    }

    this.loading = true;
    this.error   = '';

    this.authService.login(this.credentials).subscribe({
      next: (response: LoginResponse) => {
        this.loading = false;
        this.redirectAfterLogin();
      },
      error: (error: any) => {
        this.loading = false;
        const desc: string = error?.error?.error_description || '';

        // Keycloak retourne ce message quand UPDATE_PASSWORD est requis
        if (error.status === 400 && desc.toLowerCase().includes('not fully set up')) {
          this.isFirstLogin = true;
          this.error = '';
        } else if (error.status === 400 || error.status === 401) {
          this.error = 'Identifiants invalides. Vérifiez votre email et mot de passe.';
        } else {
          this.error = 'Erreur de connexion. Veuillez réessayer.';
        }
      }
    });
  }

  submitPasswordChange(): void {
    this.passwordError = '';

    if (this.newPassword !== this.confirmPassword) {
      this.passwordError = 'Les mots de passe ne correspondent pas.';
      return;
    }
    if (!this.newPassword || this.newPassword.length < 6) {
      this.passwordError = 'Le mot de passe doit contenir au moins 6 caractères.';
      return;
    }

    this.changingPassword = true;

    this.http.post('/api/admin/users/change-password',
      { email: this.credentials.email, newPassword: this.newPassword },
      { responseType: 'text' }
    ).subscribe({
      next: () => {
        // Re-login automatique avec le nouveau mot de passe
        this.credentials.password = this.newPassword;
        this.authService.login(this.credentials).subscribe({
          next: () => {
            this.changingPassword = false;
            this.redirectAfterLogin();
          },
          error: (err: any) => {
            this.changingPassword = false;
            this.isFirstLogin = false;
            this.credentials.password = '';
            this.error = 'Mot de passe changé. Veuillez vous reconnecter.';
          }
        });
      },
      error: (err: any) => {
        this.changingPassword = false;
        // Extraire le message d'erreur du backend (JSON ou texte brut)
        let msg = 'Erreur changement de mot de passe.';
        if (err.error) {
          if (typeof err.error === 'string') {
            msg = err.error;
          } else if (err.error.error) {
            msg = err.error.error;
          } else if (err.error.message) {
            msg = err.error.message;
          }
        }
        this.passwordError = `Erreur ${err.status} : ${msg}`;
      }
    });
  }

  cancelFirstLogin(): void {
    this.isFirstLogin    = false;
    this.newPassword     = '';
    this.confirmPassword = '';
    this.passwordError   = '';
    this.credentials.password = '';
  }

  private redirectAfterLogin(): void {
    this.router.navigate(['/admin']);
  }
}
