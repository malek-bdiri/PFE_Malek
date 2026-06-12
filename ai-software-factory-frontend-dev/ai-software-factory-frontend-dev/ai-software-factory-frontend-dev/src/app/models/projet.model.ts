export interface Exigence {
  id?: number;
  type: string;
  intitule: string;
  objectifClient: string;
  description: string;
  solutionProposee: string;
  limitesHypotheses: string;
  priorite?: string;
  statut?: 'Validee' | 'A revoir' | 'En attente' | string;
  sourceDocument?: string;
  sourceSection?: string;
  responsable?: string;
  validateur?: string;
  commentaireValidation?: string;
}

export interface ProjetDocument {
  nom: string;
  typeLabel?: string;
  dateUpload?: string;
}

export interface Projet {
  id?: number;
  nom: string;
  codeProjet: string;
  client: string;
  produit?: string;
  description?: string;
  modeCreation: 'IA' | 'MANUEL';
  dateCreation?: string;
  statutValidation?: 'AUCUNE' | 'EN_ATTENTE' | 'VALIDE' | 'REVISION' | string;
  exigences?: Exigence[];
  documents?: ProjetDocument[];
  demandesModificationCount?: number;
}

export interface CreateProjetRequest {
  nom: string;
  codeProjet: string;
  client?: string;
  clientId?: number;
  produit?: string;
  produitId?: number;
  description?: string;
  modeCreation: 'IA' | 'MANUEL';
  exigences?: Exigence[];
  documents?: ProjetDocument[];
}
