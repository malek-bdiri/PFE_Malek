import { Component, OnInit } from '@angular/core';
import { ProduitService } from '../../../services/produit.service';
import { Produit } from '../../../models/produit.model';

@Component({
  selector: 'app-produits',
  templateUrl: './produits.component.html',
  styleUrls: ['./produits.component.css']
})
export class ProduitsComponent implements OnInit {
  produits: Produit[] = [];
  showModal = false;
  isEditing = false;
  currentProduit: Produit = this.initProduit();
  searchTerm = '';

  constructor(private produitService: ProduitService) { }

  ngOnInit(): void {
    this.loadProduits();
  }

  loadProduits(): void {
    this.produitService.getProduits().subscribe({
      next: (data) => this.produits = data,
      error: (error) => console.error('Erreur lors du chargement des produits', error)
    });
  }

  initProduit(): Produit {
    return {
      nom: '',
      produitCode: '',
      description: '',
      statut: 'Actif'
    };
  }

  openAddModal(): void {
    this.isEditing = false;
    this.currentProduit = this.initProduit();
    this.showModal = true;
  }

  openEditModal(produit: Produit): void {
    this.isEditing = true;
    this.currentProduit = { ...produit };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.currentProduit = this.initProduit();
  }

  saveProduit(): void {
    // Validation
    if (!this.currentProduit.nom || !this.currentProduit.produitCode || !this.currentProduit.description) {
      alert('Veuillez remplir tous les champs requis');
      return;
    }

    if (this.isEditing && this.currentProduit.id) {
      this.produitService.updateProduit(this.currentProduit.id, this.currentProduit).subscribe({
        next: () => {
          alert('Produit mis à jour avec succès');
          this.loadProduits();
          this.closeModal();
        },
        error: (error) => {
          console.error('Erreur lors de la mise à jour du produit', error);
          alert('Erreur : ' + (error.error?.message || error.message || 'Impossible de mettre à jour le produit'));
        }
      });
    } else {
      this.produitService.createProduit(this.currentProduit).subscribe({
        next: () => {
          alert('Produit créé avec succès');
          this.loadProduits();
          this.closeModal();
        },
        error: (error) => {
          console.error('Erreur lors de la création du produit', error);
          alert('Erreur : ' + (error.error?.message || error.message || 'Impossible de créer le produit'));
        }
      });
    }
  }

  deleteProduit(id: number | undefined): void {
    if (id && confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      this.produitService.deleteProduit(id).subscribe({
        next: () => this.loadProduits(),
        error: (error) => console.error('Erreur lors de la suppression du produit', error)
      });
    }
  }

  get filteredProduits(): Produit[] {
    if (!this.searchTerm) return this.produits;
    return this.produits.filter(produit =>
      produit.nom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      produit.produitCode.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      produit.description.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }
}
