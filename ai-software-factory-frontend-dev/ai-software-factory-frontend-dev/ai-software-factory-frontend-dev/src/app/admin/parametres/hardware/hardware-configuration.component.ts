import { Component, OnInit } from '@angular/core';
import { HardwareType } from '../../../models/hardware-type.model';
import { HardwareTypeService } from '../../../services/hardware-type.service';
import { HardwareComponent } from '../../../models/hardware-component.model';
import { HardwareComponentService } from '../../../services/hardware-component.service';
import { HardwareGroup } from '../../../models/hardware-group.model';
import { HardwareGroupService } from '../../../services/hardware-group.service';

@Component({
  selector: 'app-hardware-configuration',
  templateUrl: './hardware-configuration.component.html'
})
export class HardwareConfigurationComponent implements OnInit {
  activeTab: string = 'types';
  
  // Hardware Types State
  hardwareTypes: HardwareType[] = [];
  selectedId: number | null = null;
  code: string = '';
  label: string = '';
  description: string = '';
  isChecked: boolean = true;
  showModal: boolean = false;

  // Hardware Components State
  hardwareComponents: HardwareComponent[] = [];
  selectedComponentId: number | null = null;
  compCode: string = '';
  compDesignation: string = '';
  compManufacturer: string = '';
  compManufacturerRef: string = '';
  compSupplier: string = '';
  compSupplierRef: string = '';
  compUnitPrice: number = 0;
  compDiscount: number = 0;
  compDescription: string = '';
  compSelectedTypeId: number | null = null;
  showCompModal: boolean = false;

  // Enum lists
  manufacturers = ['CNEM 24T', 'ILME', 'Intel', 'Samsung', 'Cisco', 'Dell', 'HP', 'Seagate'];
  suppliers = ['TME', 'Dell Technologies', 'Cisco France', 'HP France', 'Autre'];

  // Hardware Groups State
  hardwareGroups: HardwareGroup[] = [];
  showGroupModal = false;
  selectedGroupId: number | null = null;
  groupCode = '';
  groupLabel = '';
  groupDescription = '';
  groupTypeId: number | null = null;
  groupLogisticCost = 5;
  groupContingency = 10;
  groupItems: { componentId: number | null; quantity: number; componentLabel?: string; unitPrice?: number }[] = [];

  constructor(
    private hardwareTypeService: HardwareTypeService,
    private hardwareComponentService: HardwareComponentService,
    private hardwareGroupService: HardwareGroupService
  ) {}

  ngOnInit() {
    this.loadTypes();
    this.loadComponents();
    this.loadGroups();
  }
  
  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  // --- Types Logic ---
  loadTypes() {
    this.hardwareTypeService.getAll().subscribe({
      next: (data) => {
        this.hardwareTypes = data;
      },
      error: (err) => console.error('Error loading hardware types', err)
    });
  }

  openAddModal() {
    this.resetForm();
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.resetForm();
  }

  saveType() {
    const payload: HardwareType = {
      code: this.code,
      label: this.label,
      description: this.description,
      statut: this.isChecked ? 'ACTIF' : 'INACTIF'
    };

    if (this.selectedId) {
      this.hardwareTypeService.update(this.selectedId, payload).subscribe({
        next: () => {
          this.loadTypes();
          this.closeModal();
        },
        error: (err) => console.error('Error updating completely', err)
      });
    } else {
      this.hardwareTypeService.create(payload).subscribe({
        next: () => {
          this.loadTypes();
          this.closeModal();
        },
        error: (err) => console.error('Error creating hardware type', err)
      });
    }
  }

  editType(type: HardwareType) {
    this.selectedId = type.id || null;
    this.code = type.code;
    this.label = type.label;
    this.description = type.description || '';
    this.isChecked = type.statut === 'ACTIF';
    this.showModal = true;
  }
  
  deleteType(type: HardwareType) {
    if (confirm('Voulez-vous vraiment supprimer ce type ?')) {
      if (type.id) {
        this.hardwareTypeService.delete(type.id).subscribe({
          next: () => this.loadTypes(),
          error: (err) => console.error('Error deleting hardware type', err)
        });
      }
    }
  }

  resetForm() {
    this.selectedId = null;
    this.code = '';
    this.label = '';
    this.description = '';
    this.isChecked = true;
  }

  // --- Components Logic ---
  loadComponents() {
    this.hardwareComponentService.getAll().subscribe({
      next: (data) => this.hardwareComponents = data,
      error: (err) => console.error('Error loading hardware components', err)
    });
  }

  openAddCompModal() {
    this.resetCompForm();
    this.showCompModal = true;
  }

  closeCompModal() {
    this.showCompModal = false;
    this.resetCompForm();
  }

  saveComponent() {
    const payload: HardwareComponent = {
      code: this.compCode,
      designation: this.compDesignation,
      manufacturer: this.compManufacturer,
      manufacturerRef: this.compManufacturerRef,
      supplier: this.compSupplier,
      supplierRef: this.compSupplierRef,
      unitPrice: this.compUnitPrice,
      discount: this.compDiscount,
      description: this.compDescription,
      type: this.compSelectedTypeId ? { id: this.compSelectedTypeId } as any : undefined
    };

    if (this.selectedComponentId) {
      this.hardwareComponentService.update(this.selectedComponentId, payload).subscribe({
        next: () => {
          this.loadComponents();
          this.closeCompModal();
        },
        error: (err) => console.error('Error updating component', err)
      });
    } else {
      this.hardwareComponentService.create(payload).subscribe({
        next: () => {
          this.loadComponents();
          this.closeCompModal();
        },
        error: (err) => console.error('Error creating component', err)
      });
    }
  }

  editComponent(comp: HardwareComponent) {
    this.selectedComponentId = comp.id || null;
    this.compCode = comp.code;
    this.compDesignation = comp.designation;
    this.compManufacturer = comp.manufacturer || '';
    this.compManufacturerRef = comp.manufacturerRef || '';
    this.compSupplier = comp.supplier || '';
    this.compSupplierRef = comp.supplierRef || '';
    this.compUnitPrice = comp.unitPrice || 0;
    this.compDiscount = comp.discount || 0;
    this.compDescription = comp.description || '';
    this.compSelectedTypeId = comp.type?.id || null;
    this.showCompModal = true;
  }

  deleteComponent(comp: HardwareComponent) {
    if (confirm('Voulez-vous vraiment supprimer ce composant ?')) {
      if (comp.id) {
        this.hardwareComponentService.delete(comp.id).subscribe({
          next: () => this.loadComponents(),
          error: (err) => console.error('Error deleting hardware component', err)
        });
      }
    }
  }

  resetCompForm() {
    this.selectedComponentId = null;
    this.compCode = '';
    this.compDesignation = '';
    this.compManufacturer = '';
    this.compManufacturerRef = '';
    this.compSupplier = '';
    this.compSupplierRef = '';
    this.compUnitPrice = 0;
    this.compDiscount = 0;
    this.compDescription = '';
    this.compSelectedTypeId = null;
  }

  // --- Groups Logic ---
  loadGroups() {
    this.hardwareGroupService.getAll().subscribe({
      next: (data) => this.hardwareGroups = data,
      error: (err) => console.error('Error loading groups', err)
    });
  }

  openAddGroupModal() {
    this.resetGroupForm();
    this.showGroupModal = true;
  }

  closeGroupModal() {
    this.showGroupModal = false;
    this.resetGroupForm();
  }

  addGroupItem() {
    this.groupItems.push({ componentId: null, quantity: 1 });
  }

  removeGroupItem(index: number) {
    this.groupItems.splice(index, 1);
  }

  onGroupComponentChange(index: number, componentId: number) {
    const comp = this.hardwareComponents.find(c => c.id === Number(componentId));
    if (comp) {
      this.groupItems[index].componentLabel = comp.designation;
      this.groupItems[index].unitPrice      = comp.unitPrice || 0;
    }
  }

  getGroupSubtotal(): number {
    return this.groupItems.reduce((sum, item) => {
      const comp = this.hardwareComponents.find(c => c.id === Number(item.componentId));
      const price = comp ? (comp.unitPrice || 0) * (1 - (comp.discount || 0) / 100) : 0;
      return sum + price * item.quantity;
    }, 0);
  }

  getGroupTotal(): number {
    const sub  = this.getGroupSubtotal();
    const log  = sub * this.groupLogisticCost / 100;
    const cont = sub * this.groupContingency / 100;
    return sub + log + cont;
  }

  saveGroup() {
    const validItems = this.groupItems.filter(i => i.componentId != null);
    const payload = {
      code:                this.groupCode,
      label:               this.groupLabel,
      description:         this.groupDescription,
      type:                this.groupTypeId ? { id: this.groupTypeId } : null,
      logisticCostPercent: this.groupLogisticCost,
      contingencyPercent:  this.groupContingency,
      items:               validItems.map(i => ({
        component: { id: Number(i.componentId) },
        quantity:  i.quantity
      }))
    };

    if (this.selectedGroupId) {
      this.hardwareGroupService.update(this.selectedGroupId, payload).subscribe({
        next: () => { this.loadGroups(); this.closeGroupModal(); },
        error: (err) => console.error('Error updating group', err)
      });
    } else {
      this.hardwareGroupService.create(payload).subscribe({
        next: () => { this.loadGroups(); this.closeGroupModal(); },
        error: (err) => console.error('Error creating group', err)
      });
    }
  }

  editGroup(group: HardwareGroup) {
    this.selectedGroupId   = group.id || null;
    this.groupCode         = group.code;
    this.groupLabel        = group.label;
    this.groupDescription  = group.description || '';
    this.groupTypeId       = group.type?.id || null;
    this.groupLogisticCost = group.logisticCostPercent || 5;
    this.groupContingency  = group.contingencyPercent || 10;
    this.groupItems        = (group.items || []).map(item => ({
      componentId:    item.component?.id || null,
      quantity:       item.quantity,
      componentLabel: item.component?.designation,
      unitPrice:      item.component?.unitPrice
    }));
    this.showGroupModal = true;
  }

  deleteGroup(group: HardwareGroup) {
    if (confirm('Supprimer ce groupe ?') && group.id) {
      this.hardwareGroupService.delete(group.id).subscribe({
        next: () => this.loadGroups(),
        error: (err) => console.error('Error deleting group', err)
      });
    }
  }

  resetGroupForm() {
    this.selectedGroupId   = null;
    this.groupCode         = '';
    this.groupLabel        = '';
    this.groupDescription  = '';
    this.groupTypeId       = null;
    this.groupLogisticCost = 5;
    this.groupContingency  = 10;
    this.groupItems        = [];
  }
}
