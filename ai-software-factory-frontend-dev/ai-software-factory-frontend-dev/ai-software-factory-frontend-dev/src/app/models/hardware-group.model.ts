export interface HardwareGroupItem {
  id?:        number;
  componentId?: number;
  component?: { id: number; designation: string; unitPrice?: number; discount?: number };
  quantity:   number;
}

export interface HardwareGroup {
  id?:                 number;
  code:                string;
  label:               string;
  description?:        string;
  type?:               { id: number; label?: string };
  logisticCostPercent: number;
  contingencyPercent:  number;
  items?:              HardwareGroupItem[];
}
