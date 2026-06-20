import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { RagService } from '../../../services/rag.service';
import { AfdItem } from '../../../models/ai.model';

interface GenerationStep {
  label: string;
  description: string;
  status: 'done' | 'loading' | 'pending';
}

@Component({
  selector: 'app-analyse-generating',
  templateUrl: './analyse-generating.component.html',
  styleUrls: ['./analyse-generating.component.css']
})
export class AnalyseGeneratingComponent implements OnInit, OnDestroy {

  analysisId!: number;
  progress = 0;
  private navTimer: any;

  steps: GenerationStep[] = [
    { label: 'Préparation des sources',          description: 'Chargement des exigences du projet',        status: 'pending' },
    { label: 'Analyse du contexte',              description: 'Analyse du périmètre fonctionnel',           status: 'pending' },
    { label: 'Construction des blocs fonctionnels', description: 'Identification des blocs',               status: 'pending' },
    { label: 'Génération des AFDs par IA',       description: 'Création des fiches de description',        status: 'pending' },
    { label: 'Finalisation',                     description: 'Enregistrement des résultats',              status: 'pending' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private ragService: RagService
  ) {}

  ngOnInit(): void {
    this.analysisId = Number(this.route.snapshot.paramMap.get('id'));
    const projetIdParam = this.route.snapshot.queryParamMap.get('projetId');

    if (projetIdParam) {
      this.startRealGeneration(Number(projetIdParam));
    } else {
      this.runFakeAnimation();
    }
  }

  ngOnDestroy(): void {
    if (this.navTimer) clearTimeout(this.navTimer);
  }

  private step(index: number, status: 'loading' | 'done'): void {
    this.steps[index].status = status;
    if (status === 'done') {
      this.progress = Math.round(((index + 1) / this.steps.length) * 100);
    }
  }

  private navigate(): void {
    this.navTimer = setTimeout(() => {
      this.router.navigate(['/admin/analyse', this.analysisId]);
    }, 1000);
  }

  private startRealGeneration(projetId: number): void {
    this.step(0, 'loading');

    this.http.get<any>(`/api/projets/${projetId}`).subscribe({
      next: (projet) => {
        this.step(0, 'done');
        this.step(1, 'loading');

        const exigences: any[] = projet?.exigences || [];
        const projectName: string = projet?.nom || '';
        const clientName: string = projet?.client || '';
        const codeProjet: string = projet?.codeProjet || '';
        const projectId: number | undefined = projet?.id;

        setTimeout(() => {
          this.step(1, 'done');
          this.step(2, 'loading');

          if (!exigences.length) {
            this.step(2, 'done');
            this.step(3, 'done');
            this.step(4, 'done');
            this.progress = 100;
            this.navigate();
            return;
          }

          setTimeout(() => {
            this.step(2, 'done');
            this.step(3, 'loading');

            this.ragService.generateAfdFromExigences(
              exigences, projectName, clientName, projectId, codeProjet
            ).subscribe({
              next: (res) => {
                const afds: AfdItem[] = res?.afds || [];
                const validateurFromRes: string = res?.validateur || '';
                this.step(3, 'done');
                this.step(4, 'loading');

                if (!afds.length) {
                  this.step(4, 'done');
                  this.progress = 100;
                  this.navigate();
                  return;
                }

                let saved = 0;
                const total = afds.length;

                const trunc = (s: string) => s ? s.substring(0, 255) : '';

                afds.forEach((afd) => {
                  const payload = {
                    intitule: trunc(afd.titre || 'AFD IA'),
                    objectif: '',
                    description: trunc(afd.description || ''),
                    reglesGestion: trunc(Array.isArray(afd.criteres_acceptation)
                      ? afd.criteres_acceptation.join(' | ')
                      : ''),
                    fluxNominal: trunc(afd.module_momsoft || ''),
                    casAlternatifs: trunc(Array.isArray(afd.acteurs)
                      ? afd.acteurs.join(', ')
                      : ''),
                    donneesManipulees: trunc(Array.isArray(afd.exigences_couvertes)
                      ? afd.exigences_couvertes.join(', ')
                      : ''),
                    criteresAcceptation: '',
                    complexiteFonctionnelle: '',
                    statut: 'En cours',
                    validateur: trunc(validateurFromRes || '')
                  };

                  this.http.post(`/api/afds/analysis/${this.analysisId}`, payload).subscribe({
                    next: () => { if (++saved === total) this.finalize(); },
                    error: (e) => {
                      console.error('Erreur sauvegarde AFD:', e?.error || e?.message, payload);
                      if (++saved === total) this.finalize();
                    }
                  });
                });
              },
              error: (err) => {
                console.error('Erreur génération AFDs IA:', err);
                this.step(3, 'done');
                this.finalize();
              }
            });
          }, 1200);
        }, 1000);
      },
      error: () => {
        this.runFakeAnimation();
      }
    });
  }

  private finalize(): void {
    this.step(4, 'done');
    this.progress = 100;
    this.navigate();
  }

  private runFakeAnimation(): void {
    const stepDuration = 1500;
    let currentStep = 0;
    this.steps[0].status = 'loading';

    const timer = setInterval(() => {
      if (currentStep < this.steps.length) {
        this.steps[currentStep].status = 'done';
        this.progress = Math.round(((currentStep + 1) / this.steps.length) * 100);
        currentStep++;
        if (currentStep < this.steps.length) {
          this.steps[currentStep].status = 'loading';
        } else {
          clearInterval(timer);
          this.navigate();
        }
      }
    }, stepDuration);
  }
}
