import { Component, OnInit } from '@angular/core';

export interface Composante {
  id?: number;
  code: string;
  libelle: string;
  description: string;
  active: boolean;
}

export interface TjmStandard {
  tjmMin: number;
  tjmMax: number;
  devise: string;
}

@Component({
  selector: 'app-composantes-tjm',
  templateUrl: './composantes-tjm.component.html',
  styleUrls: ['./composantes-tjm.component.css']
})
export class ComposantesTjmComponent implements OnInit {

  private readonly COMPOSANTES_KEY = 'composantes_data';
  private readonly TJM_KEY = 'tjm_data';

  // ─── Composantes ─────────────────────────────────────────────────────────────
  composantes: Composante[] = [];

  showModal = false;
  isEditing = false;
  editingId: number | null = null;

  currentComposante: Omit<Composante, 'id'> = this.initComposante();

  // ─── TJM ─────────────────────────────────────────────────────────────────────
  tjm: TjmStandard = {
    tjmMin: 600,
    tjmMax: 2000,
    devise: 'EUR'
  };

  devises = [
    { code: 'EUR', label: 'EUR (Euro)' },
    { code: 'USD', label: 'USD (Dollar US)' },
    { code: 'GBP', label: 'GBP (Livre Sterling)' },
    { code: 'CHF', label: 'CHF (Franc Suisse)' }
  ];

  tjmSaved = false;

  ngOnInit(): void {
    const storedComposantes = localStorage.getItem(this.COMPOSANTES_KEY);
    if (storedComposantes) {
      try { this.composantes = JSON.parse(storedComposantes); } catch { this.composantes = []; }
    }
    const storedTjm = localStorage.getItem(this.TJM_KEY);
    if (storedTjm) {
      try { this.tjm = JSON.parse(storedTjm); } catch {}
    }
  }

  private persistComposantes(): void {
    localStorage.setItem(this.COMPOSANTES_KEY, JSON.stringify(this.composantes));
  }

  private persistTjm(): void {
    localStorage.setItem(this.TJM_KEY, JSON.stringify(this.tjm));
  }

  // ─── Composantes CRUD ─────────────────────────────────────────────────────────
  openAddModal(): void {
    this.isEditing = false;
    this.editingId = null;
    this.currentComposante = this.initComposante();
    this.showModal = true;
  }

  openEditModal(c: Composante): void {
    this.isEditing = true;
    this.editingId = c.id ?? null;
    this.currentComposante = { code: c.code, libelle: c.libelle, description: c.description, active: c.active };
    this.showModal = true;
  }

  saveComposante(): void {
    if (!this.currentComposante.code || !this.currentComposante.libelle) return;

    if (this.isEditing && this.editingId !== null) {
      const idx = this.composantes.findIndex(c => c.id === this.editingId);
      if (idx > -1) this.composantes[idx] = { ...this.currentComposante, id: this.editingId };
    } else {
      const newId = Math.max(0, ...this.composantes.map(c => c.id ?? 0)) + 1;
      this.composantes.push({ ...this.currentComposante, id: newId });
    }
    this.persistComposantes();
    this.closeModal();
  }

  toggleActive(c: Composante): void {
    c.active = !c.active;
    this.persistComposantes();
  }

  deleteComposante(id: number | undefined): void {
    if (!id) return;
    if (!confirm('Supprimer cette composante ?')) return;
    this.composantes = this.composantes.filter(c => c.id !== id);
    this.persistComposantes();
  }

  closeModal(): void {
    this.showModal = false;
  }

  importer(): void {
    alert('Import CSV/Excel — à connecter au backend');
  }

  exporter(): void {
    const rows = [
      ['Code', 'Libellé', 'Description', 'Active'],
      ...this.composantes.map(c => [c.code, c.libelle, c.description, c.active ? 'Oui' : 'Non'])
    ];
    const csv = rows.map(r => r.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'composantes.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  // ─── TJM ─────────────────────────────────────────────────────────────────────
  saveTjm(): void {
    this.persistTjm();
    this.tjmSaved = true;
    setTimeout(() => this.tjmSaved = false, 3000);
  }

  initComposante(): Omit<Composante, 'id'> {
    return { code: '', libelle: '', description: '', active: true };
  }
}
