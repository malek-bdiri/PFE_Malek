import { Projet } from './projet.model';

export interface Planning {

  id: number;

  nom: string;

  version: string;

  phaseActuelle: string;

  progression: number;

  dateDebut: string;

  dateFin: string;

  statut: string;

  projet?: Projet;

  phases?: any[];

  statusMetier?: 'BROUILLON' | 'GENERE' | 'VALIDE';

  // =========================
  // METRICS PLANNING
  // =========================

  chargeTotale?: number;

  totalRessources?: number;

  tauxCharge?: number;

}