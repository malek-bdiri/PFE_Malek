import { Component, OnInit } from '@angular/core';
import { ModuleService } from '../../../services/module.service';
import { ProduitService } from '../../../services/produit.service';
import { Module } from '../../../models/module.model';
import { Produit } from '../../../models/produit.model';

@Component({
  selector: 'app-modules',
  templateUrl: './modules.component.html',
  styleUrls: ['./modules.component.css']
})
export class ModulesComponent implements OnInit {

  produits: Produit[] = [];
  selectedProduitId: number | null = null;

  modules: Module[] = [];
  allModules: Module[] = [];

  showCreateModal = false;
  showAffectModal = false;
  showEditModal   = false;

  newModule: Module = this.emptyModule();
  editingModule: Module | null = null;

  modulesNonAffectes: Module[] = [];
  selectedModuleIdsToAffect = new Set<number>();

  isSaving    = false;
  isLoading   = false;
  codeEnDoublon = false;

  categories = ['Core', 'Analytics', 'IoT', 'IA', 'Reporting', 'Mobile', 'Security'];

  constructor(
    private moduleService: ModuleService,
    private produitService: ProduitService
  ) {}

  ngOnInit(): void {
    this.loadProduits();
    this.loadAllModules();
  }

  loadProduits(): void {
    this.produitService.getProduits().subscribe({
      next: (p) => this.produits = p.filter(x => x.statut === 'Actif')
    });
  }

  loadAllModules(): void {
    this.moduleService.getModules().subscribe({
      next: (m) => this.allModules = m
    });
  }

  onProduitChange(): void {
    if (!this.selectedProduitId) { this.modules = []; return; }
    this.isLoading = true;
    this.moduleService.getModulesByProduit(this.selectedProduitId).subscribe({
      next: (m) => { this.modules = m; this.isLoading = false; },
      error: ()  => { this.modules = []; this.isLoading = false; }
    });
  }

  // ── Création + affectation ────────────────────────────────────────────────

  openCreateModal(): void {
    if (!this.selectedProduitId) { alert('Veuillez sélectionner un produit.'); return; }
    this.newModule = this.emptyModule();
    this.codeEnDoublon = false;
    this.showCreateModal = true;
  }

  onCodeChange(): void {
    this.codeEnDoublon = this.allModules.some(
      m => m.code.toLowerCase() === this.newModule.code.trim().toLowerCase()
    );
  }

  saveNewModule(): void {
    if (!this.newModule.code || !this.newModule.nom || !this.newModule.categorie) {
      alert('Code, Nom et Catégorie sont obligatoires.');
      return;
    }
    const codeExiste = this.allModules.some(
      m => m.code.toLowerCase() === this.newModule.code.trim().toLowerCase()
    );
    if (codeExiste) {
      alert(`Le code "${this.newModule.code}" existe déjà. Utilisez un code différent.`);
      return;
    }
    this.isSaving = true;
    const payload = {
      code:        this.newModule.code.trim(),
      nom:         this.newModule.nom.trim(),
      categorie:   this.newModule.categorie || 'Core',
      description: this.newModule.description || '',
      tags:        this.newModule.tags || '',
      obligatoire: this.newModule.obligatoire || false,
      actif:       this.newModule.statut !== 'Inactif',
      prixOneshot: this.newModule.prixOneshot || 0,
      prixYearly:  this.newModule.prixYearly  || 0,
      prixMonthly: this.newModule.prixMonthly || 0,
      dependances: this.newModule.dependances || ''
    };
    this.moduleService.createAndAssignModule(this.selectedProduitId!, payload).subscribe({
      next: () => {
        this.showCreateModal = false;
        this.onProduitChange();
        this.loadAllModules();
        this.isSaving = false;
      },
      error: (err) => {
        const msg = err.status === 409
          ? (err.error?.error || 'Ce code de module existe déjà.')
          : (err.error?.message || err.error?.error || 'Erreur serveur — vérifiez que le code est unique.');
        alert(msg);
        this.isSaving = false;
      }
    });
  }

  // ── Édition ───────────────────────────────────────────────────────────────

  openEditModal(module: Module): void {
    this.editingModule = { ...module };
    this.showEditModal = true;
  }

  saveEdit(): void {
    if (!this.editingModule?.id) return;
    this.isSaving = true;
    const payload: any = {
      code:        this.editingModule.code,
      nom:         this.editingModule.nom,
      categorie:   this.editingModule.categorie || 'Core',
      description: this.editingModule.description || '',
      tags:        this.editingModule.tags || '',
      obligatoire: this.editingModule.obligatoire || false,
      actif:       this.editingModule.statut !== 'Inactif',
      prixOneshot: this.editingModule.prixOneshot || 0,
      prixYearly:  this.editingModule.prixYearly  || 0,
      prixMonthly: this.editingModule.prixMonthly || 0,
      dependances: this.editingModule.dependances || ''
    };
    this.moduleService.updateModule(this.editingModule.id, payload).subscribe({
      next: () => {
        this.showEditModal = false;
        this.onProduitChange();
        this.isSaving = false;
      },
      error: (err) => {
        alert('Erreur: ' + err.message);
        this.isSaving = false;
      }
    });
  }

  // ── Affectation modules existants ─────────────────────────────────────────

  openAffectModal(): void {
    if (!this.selectedProduitId) { alert('Veuillez sélectionner un produit.'); return; }
    this.selectedModuleIdsToAffect.clear();
    this.moduleService.getModulesDisponibles(this.selectedProduitId).subscribe({
      next: (m) => { this.modulesNonAffectes = m; this.showAffectModal = true; },
      error: () => {
        const affectedIds = new Set(this.modules.map(m => m.id));
        this.modulesNonAffectes = this.allModules.filter(m => !affectedIds.has(m.id));
        this.showAffectModal = true;
      }
    });
  }

  toggleAffect(moduleId: number): void {
    if (this.selectedModuleIdsToAffect.has(moduleId)) {
      this.selectedModuleIdsToAffect.delete(moduleId);
    } else {
      this.selectedModuleIdsToAffect.add(moduleId);
    }
  }

  confirmerAffectation(): void {
    if (this.selectedModuleIdsToAffect.size === 0) return;
    const ids = Array.from(this.selectedModuleIdsToAffect);
    this.moduleService.affecterModules(this.selectedProduitId!, ids).subscribe({
      next: () => { this.showAffectModal = false; this.onProduitChange(); },
      error: (err) => alert('Erreur affectation: ' + (err.error?.message || err.message))
    });
  }

  // ── Suppression ───────────────────────────────────────────────────────────

  deleteModule(module: Module): void {
    if (!module.id || !confirm(`Supprimer le module "${module.nom}" ?`)) return;
    this.moduleService.deleteModule(module.id).subscribe({
      next: () => this.onProduitChange(),
      error: (err) => alert('Erreur: ' + err.message)
    });
  }

  toggleObligatoire(module: Module): void {
    if (!module.id) return;
    const updated = { ...module, obligatoire: !module.obligatoire };
    this.moduleService.updateModule(module.id, updated).subscribe({
      next: (m) => {
        const idx = this.modules.findIndex(x => x.id === m.id);
        if (idx !== -1) this.modules[idx] = m;
      }
    });
  }

  private emptyModule(): Module {
    return {
      code: '', nom: '', categorie: 'Core',
      description: '', tags: '', dependances: '',
      obligatoire: false, actif: true,
      produitId: this.selectedProduitId || 0,
      statut: 'Actif',
      prixOneshot: 0, prixYearly: 0, prixMonthly: 0
    };
  }

  get selectedProduitNom(): string {
    return this.produits.find(p => p.id === this.selectedProduitId)?.nom || '';
  }
}
