export interface Produit {
  id?: number;
  nom: string;
  produitCode: string;
  description: string;
  statut: 'Actif' | 'Inactif';
  createdAt?: Date;
  updatedAt?: Date;
}
