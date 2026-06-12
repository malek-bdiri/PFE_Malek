export interface CasDeTest {
  id?: number;
  caseId?: string;       // TC-001-01
  groupe?: string;       // "Ajout valide"
  priorite?: string;     // P1, P2, P3
  statut?: string;       // Non exécuté, Réussi, Échoué
  preconditions?: string[];
  etapes?: string[];
  resultatAttendu?: string;
  resultatObtenu?: string;
}

export interface TestScenario {
  id?: number;
  scenarioId?: string;            // TS-001
  titre?: string;
  type?: string;                  // Functional, Regression, Integration, UAT
  priorite?: string;              // P1, P2, P3
  statut?: string;                // Brouillon, Généré, Validé
  version?: string;               // v1.0
  projetId?: number;
  afdId?: number;
  casDeTest?: CasDeTest[];
  criteresAcceptation?: string[];
  createdAt?: string;
  updatedAt?: string;
  description?: string;
}

export interface GenerateTestRequest {
  projetId?: number;
  afdId?: number;
  afdTitre?: string;
  exigenceDescription?: string;
  champs?: string;
  regles?: string;
  gaps?: string;
}
