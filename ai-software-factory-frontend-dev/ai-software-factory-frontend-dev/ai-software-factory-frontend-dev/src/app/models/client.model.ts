export interface Client {
  id?: number;
  nom: string;
  codeClient: string;
  secteur: string;
  pays: string;
  statut: 'Actif' | 'Inactif';
  createdAt?: Date;
  updatedAt?: Date;
}
