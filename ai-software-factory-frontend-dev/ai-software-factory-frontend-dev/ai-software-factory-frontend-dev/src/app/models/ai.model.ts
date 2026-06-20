export interface VerifyDocumentResponse {
  is_valid: boolean;
  document_type: string;
  confidence: number;
  message: string;
}

export interface EvaluationScores {
  couverture: number;
  completude: number;
  precision: number;
  pertinence: number;
  qualite_redactionnelle: number;
}

export interface EvaluationResult {
  scores: EvaluationScores;
  score_global: number;
  nb_exigences_evaluees: number;
  points_forts: string[];
  axes_amelioration: string[];
  commentaire: string;
}

export interface EvaluateResponse {
  success: boolean;
  evaluation: EvaluationResult;
  nb_exigences: number;
  model: string;
  provider: string;
}

export interface AfdItem {
  id: string;
  titre: string;
  description: string;
  exigences_couvertes: string[];
  criteres_acceptation: string[];
  acteurs: string[];
  module_momsoft: string;
}

export interface AfdFromExigencesRequest {
  exigences: any[];
  project_name?: string;
  project_id?: string | number;
  code_projet?: string;
  client_name?: string;
  validateur?: string;
  product_name?: string;
  top_k?: number;
}

export interface AfdResponse {
  success: boolean;
  afds: AfdItem[];
  nb_afds: number;
  resume: string;
  project_name: string;
  project_id: string | number | null;
  code_projet: string | null;
  client_name: string;
  validateur: string | null;
  provider: string;
  error?: string;
}
