export interface HardwareType {
  id?: number;
  code: string;
  label: string;
  description?: string;
  statut: string;
}

export interface HardwareComponent {
  id?: number;
  code: string;
  designation: string;
  manufacturer?: string;
  manufacturerRef?: string;
  supplier?: string;
  supplierRef?: string;
  unitPrice: number;
  discount?: number;
  type?: HardwareType;
  description?: string;
  netPrice?: number;
}