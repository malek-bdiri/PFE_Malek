export interface HardwareType {
  id?: number;
  code: string;
  label: string;
  description: string;
  statut: 'ACTIF' | 'INACTIF';
}