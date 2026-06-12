import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../services/user.service';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-utilisateurs',
  templateUrl: './utilisateurs.component.html',
  styleUrls: ['./utilisateurs.component.css']
})
export class UtilisateursComponent implements OnInit {
  users: User[] = [];
  showModal    = false;
  showAddModal = false;
  isSaving     = false;
  isLoading    = false;
  loadError    = '';
  successMsg   = '';

  currentUser: User = this.initUser();
  newUser: User     = this.initUser();
  searchTerm = '';
  roles = ['ADMIN', 'CHEF_DE_PROJET', 'EDITEUR', 'LECTEUR'];

  constructor(private userService: UserService) {}

  ngOnInit(): void { this.loadUsers(); }

  loadUsers(): void {
    this.isLoading = true;
    this.loadError = '';
    this.userService.getUsers().subscribe({
      next: (data) => { this.users = data; this.isLoading = false; },
      error: (err) => {
        const msg = String(err?.error?.message || err?.error || err?.message || '');
        if (err.status === 401 || msg.includes('401 Unauthorized'))
          this.loadError = 'Erreur 401 Keycloak — vérifiez les credentials admin dans application.properties.';
        else if (err.status === 500)
          this.loadError = 'Erreur serveur — vérifiez les logs backend.';
        else
          this.loadError = 'Erreur ' + err.status + ' : ' + (err.error?.message || err.message);
        this.users = [];
        this.isLoading = false;
      }
    });
  }

  initUser(): User {
    return { firstname: '', lastname: '', email: '', role: 'EDITEUR' };
  }

  // ── Ajouter ───────────────────────────────────────────────────────────────

  openAddModal(): void {
    this.newUser = this.initUser();
    this.successMsg = '';
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
    this.newUser = this.initUser();
  }

  addUser(): void {
    if (!this.newUser.firstname || !this.newUser.lastname || !this.newUser.email || !this.newUser.role) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    this.isSaving = true;
    const nom = `${this.newUser.firstname} ${this.newUser.lastname}`;
    const email = this.newUser.email;
    this.userService.createUser(this.newUser).subscribe({
      next: (res) => {
        this.isSaving = false;
        this.closeAddModal();
        this.loadUsers();
        this.successMsg = res?.message || `✅ Compte créé pour ${nom}. Email envoyé à ${email}.`;
        setTimeout(() => this.successMsg = '', 8000);
      },
      error: (err) => {
        this.isSaving = false;
        const msg = err?.error?.error || err?.error?.message || err?.message || 'Erreur inconnue';
        alert('Erreur : ' + msg);
      }
    });
  }

  // ── Modifier ──────────────────────────────────────────────────────────────

  openEditModal(user: User): void {
    this.currentUser = { ...user };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.currentUser = this.initUser();
  }

  saveUser(): void {
    if (!this.currentUser.id) return;
    this.isSaving = true;
    this.userService.updateUser(String(this.currentUser.id), this.currentUser).subscribe({
      next: () => {
        this.isSaving = false;
        this.loadUsers();
        this.closeModal();
      },
      error: (err) => {
        this.isSaving = false;
        alert('Erreur : ' + (err.error?.error || err.message));
      }
    });
  }

  // ── Supprimer ─────────────────────────────────────────────────────────────

  confirmDelete(user: User): void {
    if (!confirm(`Supprimer ${user.firstname} ${user.lastname} ?`)) return;
    this.userService.deleteUser(String(user.id)).subscribe({
      next: () => this.loadUsers(),
      error: (err) => alert('Erreur : ' + (err.error || err.message))
    });
  }

  // ── Toggle statut ─────────────────────────────────────────────────────────

  toggleStatus(user: User): void {
    if (user.id) {
      this.userService.toggleUserStatus(user.id).subscribe({
        next: () => this.loadUsers(),
        error: (err) => console.error('Erreur toggle statut', err)
      });
    }
  }

  updateRole(userId: number | undefined, newRole: string): void {
    if (userId) {
      this.userService.updateUserRole(userId, newRole).subscribe({
        next: () => this.loadUsers(),
        error: (err) => console.error('Erreur mise à jour rôle', err)
      });
    }
  }

  getRoleLabel(role: string): string {
    const map: Record<string, string> = {
      ADMIN: 'Admin', CHEF_DE_PROJET: 'Chef de projet',
      EDITEUR: 'Éditeur', LECTEUR: 'Lecteur'
    };
    return map[role] || role;
  }

  get filteredUsers(): User[] {
    if (!this.searchTerm) return this.users;
    const t = this.searchTerm.toLowerCase();
    return this.users.filter(u =>
      u.firstname.toLowerCase().includes(t) ||
      u.lastname.toLowerCase().includes(t)  ||
      u.email.toLowerCase().includes(t)     ||
      u.role.toLowerCase().includes(t)
    );
  }
}
