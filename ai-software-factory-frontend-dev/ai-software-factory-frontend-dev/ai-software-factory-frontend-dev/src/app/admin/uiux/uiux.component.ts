import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UiuxSpecificationService } from '../../services/uiux-specification.service';
import { UiuxSpecification } from '../../models/uiux-specification.model';

@Component({
  selector: 'app-uiux',
  templateUrl: './uiux.component.html',
  styleUrls: ['./uiux.component.css']
})
export class UiuxComponent implements OnInit {

  specs: UiuxSpecification[] = [];
  filteredSpecs: UiuxSpecification[] = [];

  searchTerm = '';
  selectedStatut = '';
  selectedProjet = '';

  statuts = ['Brouillon', 'Généré', 'Validé'];

  constructor(
    private uiuxService: UiuxSpecificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSpecs();
  }

  loadSpecs(): void {
    this.uiuxService.getAll().subscribe({
      next: (data) => {
        this.specs = data;
        this.filteredSpecs = data;
      },
      error: (err) => console.error(err)
    });
  }

  get projets(): string[] {
    const all = this.specs
      .map(s => s.projet?.nom)
      .filter((p): p is string => !!p);
    return [...new Set(all)];
  }

  applyFilters(): void {
    this.filteredSpecs = this.specs.filter(s => {
      const matchSearch = !this.searchTerm ||
        s.code?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        s.nom?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        s.projet?.nom?.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchStatut = !this.selectedStatut ||
        s.statut === this.selectedStatut;

      const matchProjet = !this.selectedProjet ||
        s.projet?.nom === this.selectedProjet;

      return matchSearch && matchStatut && matchProjet;
    });
  }

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'Validé':   return 'bg-green-100 text-green-700';
      case 'Généré':   return 'bg-blue-100 text-blue-700';
      case 'Brouillon':return 'bg-gray-100 text-gray-600';
      default:         return 'bg-gray-100 text-gray-500';
    }
  }

  openSpec(id: number): void {
    this.router.navigate(['/admin/uiux', id]);
  }

  deleteSpec(id: number): void {
    if (!confirm('Supprimer cette spécification ?')) return;
    this.uiuxService.delete(id).subscribe({
      next: () => this.loadSpecs(),
      error: (err) => console.error(err)
    });
  }
}