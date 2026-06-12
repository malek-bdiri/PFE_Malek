export interface Exigence {
  id: string;
  type: 'Fonctionnelle' | 'Non-fonctionnelle' | 'Sécurité' | 'Performance';
  intitule: string;
  objectifClient: string;
  description: string;
  solutionProposee: string;
  limitesHypotheses: string;
}

export interface GenerateResponse {
  success: boolean;
  filename: string;
  chunks_added: number;
  extracted_text_length: number;
  exigences: {
    exigences: Exigence[];
    nb_exigences: number;
    resume: string;
  } | null;
  raw_text: string | null;
  provider: string;
  pipeline_metadata: any;
}

export interface HealthResponse {
  status: string;
  service: string;
  chromadb_docs: number;
  llm_provider: string;
}
