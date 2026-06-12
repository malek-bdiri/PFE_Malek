import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TestService } from '../../services/test.service';
import { ProjetService } from '../../services/projet.service';
import { TestScenario } from '../../models/test-scenario.model';
import { Projet } from '../../models/projet.model';

@Component({
  selector: 'app-testing',
  templateUrl: './testing.component.html',
  styleUrls: ['./testing.component.css']
})
export class TestingComponent implements OnInit {

  scenarios: TestScenario[] = [];
  filteredScenarios: TestScenario[] = [];
  loading = false;

  searchTerm = '';
  selectedStatut = '';
  selectedType = '';
  selectedProjetId: number | null = null;

  projets: Projet[] = [];
  showNewModal = false;

  statuts = ['Brouillon', 'Généré', 'Validé'];
  types = ['Functional', 'Regression', 'Integration', 'UAT'];

  constructor(
    private testService: TestService,
    private projetService: ProjetService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.projetService.getProjets().subscribe({
      next: (data) => this.projets = data,
      error: (err) => console.error(err)
    });
  }

  loadScenarios(): void {
    if (!this.selectedProjetId) {
      this.scenarios = [];
      this.filteredScenarios = [];
      return;
    }
    this.loading = true;
    this.testService.getByProjet(this.selectedProjetId).subscribe({
      next: (data) => {
        this.scenarios = data;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  onProjetChange(): void {
    this.selectedStatut = '';
    this.selectedType = '';
    this.searchTerm = '';
    this.loadScenarios();
  }

  applyFilters(): void {
    this.filteredScenarios = this.scenarios.filter(s => {
      const matchSearch = !this.searchTerm ||
        s.titre?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        s.scenarioId?.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchStatut = !this.selectedStatut || s.statut === this.selectedStatut;
      const matchType = !this.selectedType || s.type === this.selectedType;
      return matchSearch && matchStatut && matchType;
    });
  }

  onModalClosed(result: { saved: boolean; projetId?: number }): void {
    this.showNewModal = false;
    if (result.saved) {
      // Sync project selection from modal so the list shows the right project
      if (result.projetId) {
        this.selectedProjetId = result.projetId;
      }
      this.loadScenarios();
    }
  }

  get hasProjet(): boolean {
    return !!this.selectedProjetId;
  }

  goToDetail(id: number): void {
    this.router.navigate(['/admin/tests', id]);
  }

  deleteScenario(id: number, event: Event): void {
    event.stopPropagation();
    if (confirm('Supprimer ce scénario de test ?')) {
      this.testService.delete(id).subscribe(() => this.loadScenarios());
    }
  }

  getPrioriteClass(priorite?: string): string {
    switch (priorite) {
      case 'P1': return 'bg-red-100 text-red-700';
      case 'P2': return 'bg-orange-100 text-orange-700';
      case 'P3': return 'bg-blue-100 text-blue-700';
      default:   return 'bg-gray-100 text-gray-700';
    }
  }

  getStatutClass(statut?: string): string {
    switch (statut) {
      case 'Validé':   return 'bg-green-100 text-green-700';
      case 'Généré':   return 'bg-blue-100 text-blue-700';
      case 'Brouillon': return 'bg-yellow-100 text-yellow-700';
      default:          return 'bg-gray-100 text-gray-700';
    }
  }

  countByStatut(statut: string): number {
    return this.scenarios.filter(s => s.statut === statut).length;
  }
}
