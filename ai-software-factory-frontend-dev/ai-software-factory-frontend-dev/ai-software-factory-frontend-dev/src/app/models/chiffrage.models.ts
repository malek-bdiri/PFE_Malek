export interface LicenceLigneDetail {
  moduleId: number;
  moduleNom: string;
  obligatoire: boolean;
  nbUsers: number;
  pricingMode: 'ONESHOT' | 'YEARLY';
  pricingTierLabel: string;
  prixUnitaire: number;
  subtotal: number;
  remisePercent: number;
  remiseAmount: number;
  finalSubtotal: number;
}

export interface ChiffrageLicenceSummary {
  pricingMode: string;
  baseTotal: number;
  discountAmount: number;
  totalLicence: number;
  lignes: LicenceLigneDetail[];
}
