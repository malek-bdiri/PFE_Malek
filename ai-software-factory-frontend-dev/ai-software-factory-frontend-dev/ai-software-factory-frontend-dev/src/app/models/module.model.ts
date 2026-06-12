export interface Module {
  id?: number;
  nom: string;
  code: string;
  description?: string;
  produitId: number;
  categorie?: string;
  tags?: string;
  dependances?: string;
  obligatoire?: boolean;
  actif?: boolean;
  statut: 'Actif' | 'Inactif';
  prixOneshot?: number;
  prixYearly?: number;
  prixMonthly?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ModuleAssignment {
  moduleId: number;
  produitId: number;
}
