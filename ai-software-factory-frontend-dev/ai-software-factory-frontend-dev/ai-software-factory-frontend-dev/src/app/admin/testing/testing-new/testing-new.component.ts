import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { TestService } from '../../../services/test.service';
import { ProjetService } from '../../../services/projet.service';
import { FunctionalAnalysisService } from '../../../services/functional-analysis.service';
import { TestScenario, GenerateTestRequest } from '../../../models/test-scenario.model';
import { Projet } from '../../../models/projet.model';

@Component({
  selector: 'app-testing-new',
  templateUrl: './testing-new.component.html',
  styleUrls: ['./testing-new.component.css']
})
export class TestingNewComponent implements OnInit {

  @Output() closed = new EventEmitter<{ saved: boolean; projetId?: number }>();

  // Step: 'form' | 'generating' | 'result'
  step: 'form' | 'generating' | 'result' = 'form';

  // Form fields
  titre = '';
  description = '';
  type = 'Functional';
  priorite = 'P2';
  selectedProjetId: number | null = null;
  selectedAfdId: number | null = null;

  // Data lists
  projets: Projet[] = [];
  analyses: any[] = [];
  afds: any[] = [];
  loadingAfds = false;

  // Generation result
  generatedScenarios: TestScenario[] = [];
  errorMessage = '';

  types = ['Functional', 'Regression', 'Integration', 'UAT'];
  priorites = [
    { value: 'P1', label: 'P1 - Critique' },
    { value: 'P2', label: 'P2 - Haute' },
    { value: 'P3', label: 'P3 - Normale' }
  ];

  constructor(
    private testService: TestService,
    private projetService: ProjetService,
    private analysisService: FunctionalAnalysisService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadProjets();
  }

  loadProjets(): void {
    this.projetService.getProjets().subscribe({
      next: (data) => this.projets = data,
      error: (err) => console.error(err)
    });
  }

  onProjetChange(): void {
    this.analyses = [];
    this.afds = [];
    this.selectedAfdId = null;

    if (!this.selectedProjetId) return;

    this.loadingAfds = true;
    // Use getAll() and filter client-side (no /projet/{id} endpoint on backend)
    this.analysisService.getAll().subscribe({
      next: (all) => {
        const filtered = all.filter(a => a.projet?.id == this.selectedProjetId);
        this.analyses = filtered;
        this.loadAfdsForAnalyses(filtered);
      },
      error: () => { this.loadingAfds = false; }
    });
  }

  loadAfdsForAnalyses(analyses: any[]): void {
    if (analyses.length === 0) {
      this.loadingAfds = false;
      return;
    }

    const allAfds: any[] = [];
    let done = 0;

    analyses.forEach(analysis => {
      this.http.get<any[]>(`http://localhost:8081/api/afds/analysis/${analysis.id}`)
        .subscribe({
          next: (afds) => {
            afds.forEach(a => allAfds.push({ ...a, analysisCode: analysis.code }));
          },
          error: () => {},
          complete: () => {
            done++;
            if (done === analyses.length) {
              this.afds = allAfds;
              this.loadingAfds = false;
            }
          }
        });
    });
  }

  get selectedAfd(): any {
    return this.afds.find(a => a.id == this.selectedAfdId) || null;
  }

  get canGenerate(): boolean {
    return !!this.titre && !!this.selectedProjetId && !!this.selectedAfdId;
  }

  get canCreateManuel(): boolean {
    return !!this.titre && !!this.selectedProjetId;
  }

  generateFromAFD(): void {
    if (!this.canGenerate) return;

    const afd = this.selectedAfd;
    this.step = 'generating';
    this.errorMessage = '';

    const req: GenerateTestRequest = {
      projetId: this.selectedProjetId!,
      afdId: this.selectedAfdId!,
      afdTitre: afd?.intitule || this.titre,
      exigenceDescription: this.description || afd?.description || '',
      champs: afd?.donneesManipulees || '',
      regles: afd?.reglesGestion || '',
      gaps: afd?.casAlternatifs || ''
    };

    this.testService.generateFromAFD(req)
      .pipe(finalize(() => {
        if (this.step === 'generating') this.step = 'result';
      }))
      .subscribe({
        next: (scenarios) => {
          this.generatedScenarios = scenarios;
          this.step = 'result';
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Erreur lors de la génération. Vérifiez que le backend et le modèle RAG sont démarrés.';
          this.step = 'result';
        }
      });
  }

  createManuel(): void {
    if (!this.canCreateManuel) return;

    const scenario: TestScenario = {
      titre: this.titre,
      type: this.type,
      priorite: this.priorite,
      projetId: this.selectedProjetId!,
      afdId: this.selectedAfdId || undefined,
      statut: 'Brouillon',
      version: 'v1.0'
    };

    this.testService.createManuel(scenario).subscribe({
      next: () => this.closed.emit({ saved: true, projetId: this.selectedProjetId ?? undefined }),
      error: (err) => console.error(err)
    });
  }

  cancel(): void {
    this.closed.emit({ saved: false });
  }

  done(): void {
    this.closed.emit({
      saved: this.generatedScenarios.length > 0,
      projetId: this.selectedProjetId ?? undefined
    });
  }

  retryForm(): void {
    this.step = 'form';
    this.generatedScenarios = [];
    this.errorMessage = '';
  }
}
