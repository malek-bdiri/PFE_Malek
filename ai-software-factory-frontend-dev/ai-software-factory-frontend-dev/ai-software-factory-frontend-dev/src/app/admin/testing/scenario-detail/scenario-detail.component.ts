import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { TestService } from '../../../services/test.service';
import { TestScenario, CasDeTest } from '../../../models/test-scenario.model';

@Component({
  selector: 'app-scenario-detail',
  templateUrl: './scenario-detail.component.html',
  styleUrls: ['./scenario-detail.component.css']
})
export class ScenarioDetailComponent implements OnInit {

  scenario: TestScenario | null = null;
  loading = true;

  // For update case statut inline
  updatingCaseId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private testService: TestService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadScenario(id);
  }

  loadScenario(id: number): void {
    this.testService.getById(id).subscribe({
      next: (data) => { this.scenario = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  valider(): void {
    if (!this.scenario?.id) return;
    this.testService.valider(this.scenario.id).subscribe(() => {
      if (this.scenario) this.scenario.statut = 'Validé';
    });
  }

  updateCasStatut(cas: CasDeTest, statut: 'Réussi' | 'Échoué' | 'Non exécuté'): void {
    if (!cas.id) return;
    this.updatingCaseId = cas.id;
    this.testService.updateCaseStatut(cas.id, statut, cas.resultatObtenu || '')
      .pipe(finalize(() => this.updatingCaseId = null))
      .subscribe(() => {
        cas.statut = statut;
      });
  }

  getStatutClass(statut?: string): string {
    switch (statut) {
      case 'Validé':       return 'bg-green-100 text-green-700';
      case 'Généré':       return 'bg-blue-100 text-blue-700';
      case 'Brouillon':    return 'bg-yellow-100 text-yellow-700';
      default:             return 'bg-gray-100 text-gray-700';
    }
  }

  getCasStatutClass(statut?: string): string {
    switch (statut) {
      case 'Réussi':       return 'bg-green-100 text-green-700';
      case 'Échoué':       return 'bg-red-100 text-red-700';
      case 'Non exécuté': return 'bg-gray-100 text-gray-500';
      default:             return 'bg-gray-100 text-gray-500';
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/tests']);
  }
}
