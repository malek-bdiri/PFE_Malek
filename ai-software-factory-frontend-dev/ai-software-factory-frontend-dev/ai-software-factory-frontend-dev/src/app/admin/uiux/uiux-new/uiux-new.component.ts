import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UiuxSpecificationService } from '../../../services/uiux-specification.service';
import { ProjetService } from '../../../services/projet.service';
import { Projet } from '../../../models/projet.model';
import { UiuxSpecification } from '../../../models/uiux-specification.model';
import { ProduitService } from '../../../services/produit.service';
import { Produit } from '../../../models/produit.model';

@Component({
  selector: 'app-uiux-new',
  templateUrl: './uiux-new.component.html',
  styleUrls: ['./uiux-new.component.css']
})
export class UiuxNewComponent implements OnInit {

  currentStep = 1;
  projets: Projet[] = [];
  selectedProjetId: number | null = null;
  errorMessage = '';
  // ADD after selectedProjetId
produits: any[] = [];
selectedProduitId: number | null = null;
produitMode: 'existing' | 'new' = 'new';

  spec: UiuxSpecification = {
    plateformes: [],
    complexiteUx: '',
    styleDesign: '',
    couleurPrimaire: '#2563EB',
    couleurSecondaire: '#64748B',
    couleurAccent: '#10B981',
    preferenceTypo: '',
    niveauAccessibilite: 'Standard',
    supportMultiLangue: false,
    darkMode: false
  };

  plateformesOptions = ['Web', 'Mobile', 'Tablet', 'Responsive', 'Desktop app'];
  complexiteOptions = ['Simple', 'Enterprise', 'Advanced workflow'];
  styleOptions = ['Minimal', 'Modern enterprise', 'Industrial', 'Luxury', 'Custom'];
  typoOptions = ['Inter', 'Roboto', 'Open Sans', 'Poppins', 'Custom'];
  accessibiliteOptions = ['Standard', 'WCAG AA', 'WCAG AAA'];

  constructor(
    private router: Router,
    private uiuxService: UiuxSpecificationService,
    private projetService: ProjetService,
    private produitService: ProduitService
  ) {}

  ngOnInit(): void {
    this.projetService.getProjets().subscribe({
      next: (data) => this.projets = data,
      error: (err) => console.error(err)
    });
    this.produitService.getProduits().subscribe({
    next: (data) => this.produits = data,
    error: (err) => console.error('Products not available:', err)
  });
}
selectProduitMode(mode: 'existing' | 'new'): void {
  this.produitMode = mode;
  this.selectedProduitId = null;
  // reset spec colors if switching to new
  if (mode === 'new') {
    this.spec.couleurPrimaire = '#2563EB';
    this.spec.couleurSecondaire = '#64748B';
    this.spec.couleurAccent = '#10B981';
    this.spec.styleDesign = '';
    this.spec.plateformes = [];
  }
}

onProduitSelected(): void {
  if (!this.selectedProduitId) return;
  const produit = this.produits.find(p => p.id === this.selectedProduitId);
  if (!produit) return;

  // Pre-fill spec from existing product
  if (produit.couleurPrimaire) this.spec.couleurPrimaire = produit.couleurPrimaire;
  if (produit.couleurSecondaire) this.spec.couleurSecondaire = produit.couleurSecondaire;
  if (produit.couleurAccent) this.spec.couleurAccent = produit.couleurAccent;
  if (produit.styleDesign) this.spec.styleDesign = produit.styleDesign;
  if (produit.plateformes) this.spec.plateformes = produit.plateformes;
  if (produit.preferenceTypo) this.spec.preferenceTypo = produit.preferenceTypo;
}


  togglePlateforme(p: string): void {
    const index = this.spec.plateformes!.indexOf(p);
    if (index === -1) {
      this.spec.plateformes!.push(p);
    } else {
      this.spec.plateformes!.splice(index, 1);
    }
  }

  isPlateformeSelected(p: string): boolean {
    return this.spec.plateformes!.includes(p);
  }

  nextStep(): void {
  if (!this.selectedProjetId) {
    this.errorMessage = 'Veuillez sélectionner un projet';
    setTimeout(() => this.errorMessage = '', 3000);
    return;
  }
  if (this.produitMode === 'existing' && !this.selectedProduitId) {
    this.errorMessage = 'Veuillez sélectionner un produit';
    setTimeout(() => this.errorMessage = '', 3000);
    return;
  }
  this.currentStep = 2;
}

  generate(): void {
  if (!this.selectedProjetId) return;

  // Validation des champs obligatoires
  if (!this.spec.plateformes || this.spec.plateformes.length === 0) {
    this.errorMessage = 'Veuillez sélectionner au moins une plateforme';
    setTimeout(() => this.errorMessage = '', 3000);
    return;
  }

  if (!this.spec.complexiteUx) {
    this.errorMessage = 'Veuillez sélectionner le niveau de complexité UX';
    setTimeout(() => this.errorMessage = '', 3000);
    return;
  }

  if (!this.spec.styleDesign) {
    this.errorMessage = 'Veuillez sélectionner le style de design';
    setTimeout(() => this.errorMessage = '', 3000);
    return;
  }

  const selectedProjet = this.projets.find(p => p.id === this.selectedProjetId);
  this.spec.nom = `Design System ${selectedProjet?.nom}`;

  this.uiuxService.create(this.selectedProjetId, this.spec).subscribe({
    next: (created) => {
      this.router.navigate(['/admin/uiux', created.id]);
    },
    error: (err) => console.error(err)
  });
}

  goBack(): void {
  if (this.currentStep === 2) {
    this.currentStep = 1;
  } else {
    this.router.navigate(['/admin/uiux']);
  }
}

cancel(): void {
  this.router.navigate(['/admin/uiux']);
}
logoFile: File | null = null;
logoPreview: string | null = null;

onLogoSelected(event: any): void {
  const file = event.target.files[0];
  if (!file) return;
  this.logoFile = file;
  const reader = new FileReader();
  reader.onload = (e: any) => {
    this.logoPreview = e.target.result;
  };
  reader.readAsDataURL(file);
}

removeLogo(): void {
  this.logoFile = null;
  this.logoPreview = null;
}
}