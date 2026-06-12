export interface FunctionalAnalysis {
  id?: number;
  code?: string;
  projet?: {
    id: number;
    nom: string;
    codeProjet: string;
    client: string;
  };
  validateur?: string;
  statut?: string;
  nbAfd?: number;
  date?: string;
  description?: string;
}