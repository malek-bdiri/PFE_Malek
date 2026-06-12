import { Component, OnInit } from '@angular/core';
import { ProduitService } from '../../../services/produit.service';
import { ModuleService } from '../../../services/module.service';
import { Produit } from '../../../models/produit.model';
import { Module } from '../../../models/module.model';

export interface LicencePalier {
  id?: number;
  produitCode: string;
  produitNom: string;
  module: string;       // 'Tous les modules' ou nom du module
  type: 'Oneshot' | 'Yearly';
  devise: string;
  prixUnitaire: number;
  nbUtilisateursMin: number;
  nbUtilisateursMax: number | null;
  description?: string;
}

@Component({
  selector: 'app-licence',
  templateUrl: './licence.component.html',
  styleUrls: ['./licence.component.css']
})
export class LicenceComponent implements OnInit {

  produits: Produit[] = [];
  modules: Module[] = [];

  // Filtres
  filterProduitId: number | null = null;
  filterModule: string = 'Tous les modules';
  filterType: 'Oneshot' | 'Yearly' | '' = '';
  filterDevise: string = 'EUR';

  devises = ['EUR', 'USD', 'GBP', 'CHF'];

  private readonly STORAGE_KEY = 'licence_paliers';

  paliers: LicencePalier[] = [];

  showModal = false;
  isEditing = false;
  editingId: number | null = null;

  currentPalier: Omit<LicencePalier, 'id'> = this.initPalier();

  constructor(
    private produitService: ProduitService,
    private moduleService: ModuleService
  ) {}

  ngOnInit(): void {
    this.loadPaliersFromStorage();
    this.loadProduits();
  }

  private loadPaliersFromStorage(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        this.paliers = JSON.parse(stored);
      } catch {
        this.paliers = [];
      }
    }
  }

  private persistPaliers(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.paliers));
  }

  loadProduits(): void {
    this.produitService.getProduits().subscribe({
      next: (data) => this.produits = data.filter(p => p.statut === 'Actif'),
      error: (err) => console.error('Erreur produits:', err)
    });
  }

  onFilterProduitChange(): void {
    this.filterModule = 'Tous les modules';
    this.modules = [];
    if (this.filterProduitId) {
      this.moduleService.getModulesByProduitId(this.filterProduitId).subscribe({
        next: (data) => this.modules = data,
        error: (err) => console.error('Erreur modules:', err)
      });
    }
  }

  onModalProduitChange(): void {
    this.currentPalier.module = 'Tous les modules';
    this.modules = [];
    const produit = this.produits.find(p => p.produitCode === this.currentPalier.produitCode);
    if (produit?.id) {
      this.moduleService.getModulesByProduitId(produit.id).subscribe({
        next: (data) => this.modules = data,
        error: (err) => console.error('Erreur modules:', err)
      });
      this.currentPalier.produitNom = produit.nom;
    }
  }

  get filteredPaliers(): LicencePalier[] {
    return this.paliers.filter(p => {
      const selectedProduit = this.produits.find(pr => pr.id === this.filterProduitId);
      if (this.filterProduitId && selectedProduit && p.produitCode !== selectedProduit.produitCode) return false;
      if (this.filterModule !== 'Tous les modules' && p.module !== this.filterModule) return false;
      if (this.filterType && p.type !== this.filterType) return false;
      if (p.devise !== this.filterDevise) return false;
      return true;
    });
  }

  openAddModal(): void {
    this.isEditing = false;
    this.editingId = null;
    this.currentPalier = this.initPalier();
    this.showModal = true;
  }

  openEditModal(palier: LicencePalier): void {
    this.isEditing = true;
    this.editingId = palier.id ?? null;
    this.currentPalier = {
      produitCode: palier.produitCode,
      produitNom: palier.produitNom,
      module: palier.module,
      type: palier.type,
      devise: palier.devise,
      prixUnitaire: palier.prixUnitaire,
      nbUtilisateursMin: palier.nbUtilisateursMin,
      nbUtilisateursMax: palier.nbUtilisateursMax,
      description: palier.description
    };
    this.showModal = true;
  }

  savePalier(): void {
    if (!this.currentPalier.produitCode || !this.currentPalier.type || !this.currentPalier.prixUnitaire) return;

    if (this.isEditing && this.editingId !== null) {
      const idx = this.paliers.findIndex(p => p.id === this.editingId);
      if (idx > -1) {
        this.paliers[idx] = { ...this.currentPalier, id: this.editingId };
      }
    } else {
      const newId = Math.max(0, ...this.paliers.map(p => p.id ?? 0)) + 1;
      this.paliers.push({ ...this.currentPalier, id: newId });
    }
    this.persistPaliers();
    this.closeModal();
  }

  deletePalier(id: number | undefined): void {
    if (!id) return;
    if (!confirm('Supprimer ce palier de licence ?')) return;
    this.paliers = this.paliers.filter(p => p.id !== id);
    this.persistPaliers();
  }

  closeModal(): void {
    this.showModal = false;
  }

  importerPaliers(): void {
    // TODO: implémenter import CSV/Excel
    alert('Import CSV/Excel — à connecter au backend');
  }

  exporterPaliers(): void {
    const rows = [
      ['Produit', 'Module', 'Type', 'Devise', 'Prix unitaire', 'Utilisateurs min', 'Utilisateurs max', 'Description'],
      ...this.filteredPaliers.map(p => [
        `${p.produitCode} - ${p.produitNom}`,
        p.module,
        p.type,
        p.devise,
        p.prixUnitaire,
        p.nbUtilisateursMin,
        p.nbUtilisateursMax ?? '∞',
        p.description ?? ''
      ])
    ];
    const csv = rows.map(r => r.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'licences.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  initPalier(): Omit<LicencePalier, 'id'> {
    return {
      produitCode: this.produits[0]?.produitCode ?? '',
      produitNom: this.produits[0]?.nom ?? '',
      module: 'Tous les modules',
      type: 'Oneshot',
      devise: 'EUR',
      prixUnitaire: 0,
      nbUtilisateursMin: 1,
      nbUtilisateursMax: null,
      description: ''
    };
  }

  formatPrix(prix: number, devise: string): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: devise }).format(prix);
  }
}
