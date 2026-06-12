// ─── Hardware ────────────────────────────────────────────────────────────────

export interface ChiffrageHardwareLigne {
  id?: number;
  hardwareGroupId?: number;
  categorie?: string;
  label?: string;
  quantite: number;
  prixUnitaire: number;
}

export interface ChiffrageHardware {
  id?: number;
  logistiquePct: number;
  contingencePct: number;
  taxeImportPct: number;
  margePct: number;
  lignes: ChiffrageHardwareLigne[];
}

// ─── Licence ─────────────────────────────────────────────────────────────────

export interface ChiffrageLicenceLigne {
  id?: number;
  moduleId?: number;
  moduleName?: string;
  obligatoire?: boolean;
  nbUsers: number;
  pricingTier?: string;
  prixUnitaire: number;
  discountPct: number;
}

export interface ChiffrageLicence {
  id?: number;
  produitId?: number;
  produitNom?: string;
  modeFacturation?: 'Oneshot' | 'Yearly';
  nbUsersGlobal: number;
  remiseGlobalePct: number;
  appliquerRemise: boolean;
  lignes: ChiffrageLicenceLigne[];
}

// ─── Services (H/J) ──────────────────────────────────────────────────────────

export interface ChiffrageServicesLigne {
  id?: number;
  composanteId?: number;
  code?: string;
  libelle?: string;
  hjEstimation: number;
  commentaire?: string;
}

export interface ChiffrageServices {
  id?: number;
  devise: string;
  tjmEur: number;
  tjmTnd: number;
  lignes: ChiffrageServicesLigne[];
}

// ─── Exigences ───────────────────────────────────────────────────────────────

export interface ChiffrageExigenceLigne {
  id?: number;
  exigenceId?: number;
  exigenceRef?: string;
  intitule?: string;
  type?: string;
  hjFonctionnel: number;
  hjDev: number;
  hjTest: number;
}

export interface ChiffrageExigences {
  id?: number;
  lignes: ChiffrageExigenceLigne[];
}

// ─── Total ───────────────────────────────────────────────────────────────────

export interface ChiffrageTotal {
  id?: number;
  tauxChange: number;
  remiseGlobalePct: number;
  margePct: number;
  tvaPct: number;
  arrondi: number;
}

// ─── Paliers de licence (paramètres) ─────────────────────────────────────────

export interface LicencePalier {
  id?: number;
  produitCode: string;
  produitNom: string;
  module: string;
  type: 'Oneshot' | 'Yearly';
  devise: string;
  prixUnitaire: number;
  nbUtilisateursMin: number;
  nbUtilisateursMax: number | null;
  description?: string;
}

// ─── Racine ──────────────────────────────────────────────────────────────────

export interface Chiffrage {
  hardware: ChiffrageHardware;
  licence: ChiffrageLicence;
  services: ChiffrageServices;
  exigences: ChiffrageExigences;
  total: ChiffrageTotal;
}
