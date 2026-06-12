export interface UiuxSpecification {
  id?: number;
  code?: string;
  nom?: string;
  version?: string;
  statut?: string;
  projet?: {
    id: number;
    nom: string;
    codeProjet: string;
    client: string;
  };
  afdLies?: string[];
  plateformes?: string[];
  complexiteUx?: string;
  styleDesign?: string;
  couleurPrimaire?: string;
  couleurSecondaire?: string;
  couleurAccent?: string;
  preferenceTypo?: string;
  niveauAccessibilite?: string;
  supportMultiLangue?: boolean;
  darkMode?: boolean;
  paletteCouleursJson?: string;
  systemeTypoJson?: string;
  systemeEspacementJson?: string;
  elevationJson?: string;
  derniereMaj?: string;

  
}

