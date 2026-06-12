import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ProjetService } from '../../services/projet.service';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';
import { Projet } from '../../models/projet.model';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  currentUser: User | null = null;
  projets: Projet[] = [];
  users: User[] = [];
  isLoading = false;

  // ── Filtre projet ──────────────────────────────────────────────────────────
  selectedProjetId: number | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private projetService: ProjetService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe((u: User | null) => { this.currentUser = u; });
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.projetService.getProjets().subscribe({
      next: (p) => { this.projets = p; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
    this.userService.getUsers().subscribe({
      next: (u) => { this.users = u; },
      error: () => {}
    });
  }

  // ── KPIs ───────────────────────────────────────────────────────────────────
  get totalProjets(): number { return this.projets.length; }

  get nbProjetsValides(): number {
    return this.projets.filter(p => p.statutValidation === 'VALIDE').length;
  }

  get nbProjetsEnAttente(): number {
    return this.projets.filter(p => p.statutValidation === 'EN_ATTENTE').length;
  }

  get nbProjetsActifs(): number {
    return this.projets.filter(p => !['VALIDE', 'EN_ATTENTE'].includes(p.statutValidation || '')).length;
  }

  get totalExigences(): number {
    return this.projets.reduce((s, p) => s + (p.exigences?.length || 0), 0);
  }

  get totalExigencesValidees(): number {
    return this.projets.reduce((s, p) =>
      s + (p.exigences?.filter(e => this.normalize(e.statut || '').includes('valid')).length || 0), 0);
  }

  get nbUsersActifs(): number { return this.users.length; }

  get ratioIA(): number {
    if (!this.projets.length) return 0;
    return Math.round(this.projets.filter(p => p.modeCreation === 'IA').length / this.projets.length * 100);
  }

  get tauxValidationGlobal(): number {
    if (!this.totalExigences) return 0;
    return Math.round((this.totalExigencesValidees / this.totalExigences) * 100);
  }

  // ── Chart data ─────────────────────────────────────────────────────────────
  get projetsParStatut(): { label: string; count: number; pct: number; color: string }[] {
    const total = this.projets.length || 1;
    const items = [
      { label: 'Actifs',     count: this.projets.filter(p => p.statutValidation === 'AUCUNE').length,      color: '#3b82f6' },
      { label: 'En attente', count: this.projets.filter(p => p.statutValidation === 'EN_ATTENTE').length,  color: '#f59e0b' },
      { label: 'Validés',    count: this.projets.filter(p => p.statutValidation === 'VALIDE').length,      color: '#10b981' },
      { label: 'Révision',   count: this.projets.filter(p => p.statutValidation === 'REVISION').length,    color: '#ef4444' },
    ];
    return items.map(i => ({ ...i, pct: (i.count / total) * 100 }));
  }

  get donutStatut(): string {
    return this.buildDonut(this.projetsParStatut);
  }

  get topClients(): { client: string; count: number; pct: number }[] {
    const map = new Map<string, number>();
    this.projets.forEach(p => { const k = p.client || 'N/A'; map.set(k, (map.get(k) || 0) + 1); });
    const max = Math.max(...Array.from(map.values()), 1);
    return Array.from(map.entries())
      .map(([client, count]) => ({ client, count, pct: (count / max) * 100 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }

  get usersByRole(): { label: string; count: number; pct: number; color: string }[] {
    const roles = [
      { key: 'ADMIN',          label: 'Admin',          color: '#8b5cf6' },
      { key: 'CHEF_DE_PROJET', label: 'Chef de projet', color: '#3b82f6' },
      { key: 'EDITEUR',        label: 'Éditeur',        color: '#10b981' },
      { key: 'LECTEUR',        label: 'Lecteur',        color: '#f59e0b' },
    ];
    const total = this.users.length || 1;
    return roles.map(r => ({
      label: r.label,
      color: r.color,
      count: this.users.filter(u => u.role === r.key).length,
      pct:   (this.users.filter(u => u.role === r.key).length / total) * 100
    }));
  }

  get derniersProjets(): Projet[] {
    return [...this.projets].reverse().slice(0, 8);
  }

  get projetsBloquesCount(): number {
    return this.projets.filter(p => p.statutValidation === 'EN_ATTENTE').length;
  }

  // ── Filtre projet : données du projet sélectionné ─────────────────────────

  get selectedProjet(): Projet | null {
    return this.projets.find(p => p.id === this.selectedProjetId) || null;
  }

  get selectedExigences() {
    return this.selectedProjet?.exigences || [];
  }

  get selectedExParType(): { label: string; count: number; pct: number; color: string }[] {
    const exs = this.selectedExigences;
    const total = exs.length || 1;
    const types = [
      { label: 'Fonctionnelle',     color: '#3b82f6', match: (t: string) => this.normType(t) === 'fonctionnel' || this.normType(t) === 'fonctionnelle' },
      { label: 'Non-fonctionnelle', color: '#8b5cf6', match: (t: string) => this.normType(t).startsWith('non') },
      { label: 'Sécurité',          color: '#ef4444', match: (t: string) => this.normType(t).includes('secur') },
      { label: 'Performance',       color: '#f59e0b', match: (t: string) => this.normType(t) === 'performance' },
    ];
    const result = types.map(t => ({
      label: t.label, color: t.color,
      count: exs.filter(e => t.match(e.type || '')).length,
      pct: 0
    }));
    const matched = result.reduce((s, r) => s + r.count, 0);
    const other = exs.length - matched;
    if (other > 0) result.push({ label: 'Autre', color: '#9ca3af', count: other, pct: 0 });
    return result.filter(r => r.count > 0).map(r => ({ ...r, pct: (r.count / total) * 100 }));
  }

  get selectedDonutType(): string {
    return this.buildDonut(this.selectedExParType);
  }

  get selectedExParStatut(): { label: string; count: number; pct: number; color: string }[] {
    const exs = this.selectedExigences;
    const total = exs.length || 1;
    return [
      { label: 'Validées',   color: '#10b981', count: exs.filter(e => this.normalize(e.statut || '').includes('valid')).length,     pct: 0 },
      { label: 'En attente', color: '#f59e0b', count: exs.filter(e => !e.statut || this.normalize(e.statut) === 'en attente').length, pct: 0 },
      { label: 'À revoir',   color: '#ef4444', count: exs.filter(e => this.normalize(e.statut || '') === 'a revoir').length,          pct: 0 },
    ].filter(s => s.count > 0).map(s => ({ ...s, pct: (s.count / total) * 100 }));
  }

  get selectedDonutStatut(): string {
    return this.buildDonut(this.selectedExParStatut);
  }

  get selectedTauxValidation(): number {
    const exs = this.selectedExigences;
    if (!exs.length) return 0;
    return Math.round(exs.filter(e => this.normalize(e.statut || '').includes('valid')).length / exs.length * 100);
  }

  private buildDonut(cats: { color: string; count: number }[]): string {
    const filtered = cats.filter(c => c.count > 0);
    if (!filtered.length) return 'conic-gradient(#e5e7eb 0% 100%)';
    const tot = filtered.reduce((s, c) => s + c.count, 0);
    let start = 0;
    const segs = filtered.map(c => {
      const pct = (c.count / tot) * 100;
      const seg = `${c.color} ${start.toFixed(1)}% ${(start + pct).toFixed(1)}%`;
      start += pct;
      return seg;
    });
    return `conic-gradient(${segs.join(', ')})`;
  }

  selectProjet(id: number | null): void {
    this.selectedProjetId = id;
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  private normalize(val: string): string {
    return val.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  }

  private normType(val: string): string {
    return val.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[-\s]+/g, ' ').trim();
  }

  getStatutLabel(statut?: string): string {
    switch (statut) {
      case 'VALIDE':     return 'Validé';
      case 'EN_ATTENTE': return 'En attente';
      case 'REVISION':   return 'Révision';
      default:           return 'Actif';
    }
  }

  getStatutClass(statut?: string): string {
    switch (statut) {
      case 'VALIDE':     return 'bg-green-100 text-green-700';
      case 'EN_ATTENTE': return 'bg-yellow-100 text-yellow-700';
      case 'REVISION':   return 'bg-red-100 text-red-700';
      default:           return 'bg-blue-100 text-blue-700';
    }
  }

  getModeClass(mode?: string): string {
    return mode === 'IA' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600';
  }

  logout(): void { this.authService.logout(); }
  goToProjet(id?: number): void { if (id) this.router.navigate(['/admin/projets', id]); }
  goToProjets(): void { this.router.navigate(['/admin/projets']); }
}
