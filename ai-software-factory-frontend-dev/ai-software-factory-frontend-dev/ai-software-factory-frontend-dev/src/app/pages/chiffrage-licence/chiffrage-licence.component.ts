import { Component, Input, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { ProduitService } from '../../services/produit.service';
import { ModuleService } from '../../services/module.service';
import { ChiffrageLicenceService } from '../../services/chiffrage-licence.service';
import { ChiffrageLicenceSummary, LicenceLigneDetail } from '../../models/chiffrage.models';

@Component({
  selector: 'app-chiffrage-licence',
  templateUrl: './chiffrage-licence.component.html',
  styleUrls: ['./chiffrage-licence.component.css']
})
export class ChiffrageLicenceComponent implements OnInit {
  @Input() projetId!: number;

  selectedProduitId: number | null = null;
  pricingMode: 'ONESHOT' | 'YEARLY' = 'ONESHOT';
  nbUsers = 1;
  applyGlobalDiscount = false;
  globalDiscountPercent = 0;

  produits: any[] = [];
  summary: ChiffrageLicenceSummary | null = null;
  lignes: LicenceLigneDetail[] = [];

  showModuleModal = false;
  availableModules: any[] = [];
  selectedModuleIds = new Set<number>();
  moduleSearchTerm = '';
  paliersCount = 0;

  isSaving = false;

  constructor(
    private produitService: ProduitService,
    private moduleService: ModuleService,
    private licenceService: ChiffrageLicenceService
  ) {}

  ngOnInit(): void {
    this.loadProduits();
    this.loadSummary();
  }

  loadProduits(): void {
    this.produitService.getProduits().subscribe({
      next: (p) => this.produits = p.filter((x: any) => x.statut === 'Actif')
    });
  }

  loadSummary(): void {
    this.licenceService.getSummary(this.projetId).subscribe({
      next: (s) => {
        this.summary = s;
        this.lignes = s.lignes;
        this.pricingMode = s.pricingMode as 'ONESHOT' | 'YEARLY';
      },
      error: () => { this.summary = null; this.lignes = []; }
    });
  }

  onProduitChange(): void {
    this.lignes = [];
    this.summary = null;
  }

  onModeChange(mode: 'ONESHOT' | 'YEARLY'): void {
    this.pricingMode = mode;
    this.lignes.forEach(l => {
      l.pricingMode = mode;
      this.refreshLignePrix(l);
    });
    this.recalculer();
  }

  onNbUsersChange(): void {
    this.lignes.forEach(l => {
      l.nbUsers = this.nbUsers;
      this.refreshLignePrix(l);
    });
    this.recalculer();
  }

  openModuleModal(): void {
    if (!this.selectedProduitId) {
      alert('Veuillez sélectionner un produit.');
      return;
    }
    this.moduleSearchTerm = '';
    this.loadPaliersCount();
    this.moduleService.getModulesByProduit(this.selectedProduitId).subscribe({
      next: (modules) => {
        this.availableModules = modules;
        this.selectedModuleIds = new Set(this.lignes.map(l => l.moduleId));
        this.showModuleModal = true;
      },
      error: () => alert('Erreur lors du chargement des modules.')
    });
  }

  private loadPaliersCount(): void {
    try {
      const stored = localStorage.getItem('licence_paliers');
      this.paliersCount = stored ? JSON.parse(stored).length : 0;
    } catch { this.paliersCount = 0; }
  }

  get filteredModules(): any[] {
    if (!this.moduleSearchTerm.trim()) return this.availableModules;
    const term = this.moduleSearchTerm.trim().toLowerCase();
    return this.availableModules.filter(m =>
      m.nom.toLowerCase().includes(term) || m.code.toLowerCase().includes(term)
    );
  }

  updatePrixUnitaire(ligne: LicenceLigneDetail, prix: number): void {
    ligne.prixUnitaire  = Math.max(0, prix || 0);
    ligne.subtotal      = ligne.prixUnitaire * ligne.nbUsers;
    ligne.remiseAmount  = ligne.subtotal * ligne.remisePercent / 100;
    ligne.finalSubtotal = ligne.subtotal - ligne.remiseAmount;
    this.recalculer();
  }

  isAlreadyAdded(moduleId: number): boolean {
    return this.lignes.some(l => l.moduleId === moduleId);
  }

  toggleModule(moduleId: number): void {
    if (this.isAlreadyAdded(moduleId)) return;
    if (this.selectedModuleIds.has(moduleId)) {
      this.selectedModuleIds.delete(moduleId);
    } else {
      this.selectedModuleIds.add(moduleId);
    }
  }

  confirmerModules(): void {
    this.availableModules.forEach(m => {
      if (this.selectedModuleIds.has(m.id) && !this.isAlreadyAdded(m.id)) {
        const prix = this.pricingMode === 'YEARLY' ? (m.prixYearly || 0) : (m.prixOneshot || 0);
        const subtotal = prix * this.nbUsers;
        this.lignes.push({
          moduleId:        m.id,
          moduleNom:       m.nom,
          obligatoire:     m.obligatoire || false,
          nbUsers:         this.nbUsers,
          pricingMode:     this.pricingMode,
          pricingTierLabel: '1–10 utilisateurs',
          prixUnitaire:    prix,
          subtotal,
          remisePercent:   0,
          remiseAmount:    0,
          finalSubtotal:   subtotal
        });
      }
    });
    this.showModuleModal = false;
    this.recalculer();
  }

  updateRemise(ligne: LicenceLigneDetail, remise: number): void {
    ligne.remisePercent  = Math.min(100, Math.max(0, remise));
    ligne.subtotal       = ligne.prixUnitaire * ligne.nbUsers;
    ligne.remiseAmount   = ligne.subtotal * ligne.remisePercent / 100;
    ligne.finalSubtotal  = ligne.subtotal - ligne.remiseAmount;
    this.recalculer();
  }

  removeLigne(index: number): void {
    if (this.lignes[index].obligatoire) return;
    this.lignes.splice(index, 1);
    this.recalculer();
  }

  applyGlobalDiscountChange(): void {
    if (!this.applyGlobalDiscount) {
      this.lignes.forEach(l => {
        l.remisePercent = 0;
        l.remiseAmount  = 0;
        l.finalSubtotal = l.subtotal;
      });
    }
    this.recalculer();
  }

  onGlobalDiscountChange(): void {
    if (!this.applyGlobalDiscount) return;
    this.lignes.forEach(l => {
      l.remisePercent = this.globalDiscountPercent;
      l.remiseAmount  = l.subtotal * this.globalDiscountPercent / 100;
      l.finalSubtotal = l.subtotal - l.remiseAmount;
    });
    this.recalculer();
  }

  private refreshLignePrix(ligne: LicenceLigneDetail): void {
    const module = this.availableModules.find(m => m.id === ligne.moduleId);
    if (!module) return;
    ligne.prixUnitaire  = this.pricingMode === 'YEARLY' ? (module.prixYearly || 0) : (module.prixOneshot || 0);
    ligne.subtotal      = ligne.prixUnitaire * ligne.nbUsers;
    ligne.remiseAmount  = ligne.subtotal * ligne.remisePercent / 100;
    ligne.finalSubtotal = ligne.subtotal - ligne.remiseAmount;
  }

  recalculer(): void {
    const base     = this.lignes.reduce((s, l) => s + l.subtotal, 0);
    const discount = this.lignes.reduce((s, l) => s + l.remiseAmount, 0);
    const total    = this.lignes.reduce((s, l) => s + l.finalSubtotal, 0);
    this.summary = {
      pricingMode:    this.pricingMode,
      baseTotal:      base,
      discountAmount: discount,
      totalLicence:   total,
      lignes:         this.lignes
    };
  }

  sauvegarder(): void {
    if (!this.selectedProduitId) { alert('Veuillez sélectionner un produit.'); return; }
    this.isSaving = true;
    const req = {
      produitId:             this.selectedProduitId,
      nbUsers:               this.nbUsers,
      pricingMode:           this.pricingMode,
      applyGlobalDiscount:   this.applyGlobalDiscount,
      globalDiscountPercent: this.globalDiscountPercent,
      lignes: this.lignes.map(l => ({
        moduleId:      l.moduleId,
        nbUsers:       l.nbUsers,
        pricingMode:   l.pricingMode,
        remisePercent: l.remisePercent
      }))
    };
    this.licenceService.save(this.projetId, req)
      .pipe(finalize(() => this.isSaving = false))
      .subscribe({ next: (s) => { this.summary = s; this.lignes = s.lignes; } });
  }

  get baseTotal()     { return this.lignes.reduce((s, l) => s + l.subtotal, 0); }
  get discountTotal() { return this.lignes.reduce((s, l) => s + l.remiseAmount, 0); }
  get totalLicence()  { return this.lignes.reduce((s, l) => s + l.finalSubtotal, 0); }
}
