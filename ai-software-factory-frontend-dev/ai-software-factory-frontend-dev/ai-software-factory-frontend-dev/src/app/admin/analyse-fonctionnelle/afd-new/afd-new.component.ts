import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-afd-new',
  templateUrl: './afd-new.component.html',
  styleUrls: ['./afd-new.component.css']
})
export class AfdNewComponent implements OnInit {

  analysisId!: number;
  blocks: any[] = [];
  selectedBlockId: number | null = null;
  aiInstruction = '';
  aiSuggestion = '';
  loadingAi = false;

  afd = {
    intitule: '',
    objectif: '',
    description: '',
    reglesGestion: '',
    fluxNominal: '',
    casAlternatifs: '',
    donneesManipulees: '',
    criteresAcceptation: '',
    statut: 'En cours',
    validateur: '',
     complexiteFonctionnelle: '' 
  };

  exigences: any[] = [];
  selectedExigences: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.analysisId = Number(this.route.snapshot.paramMap.get('analysisId'));
    this.loadBlocks();
    this.loadExigences();
  }

  loadBlocks(): void {
    this.http.get<any[]>(
      `/api/functional-blocks/analysis/${this.analysisId}`
    ).subscribe({
      next: (data) => this.blocks = data,
      error: (err) => console.error(err)
    });
  }

  loadExigences(): void {
    this.http.get<any>(
      `/api/functional-analyses/${this.analysisId}`
    ).subscribe({
      next: (analysis) => {
        if (analysis?.projet?.id) {
          this.http.get<any[]>(
            `/api/exigences/projet/${analysis.projet.id}`
          ).subscribe({
            next: (data) => this.exigences = data,
            error: (err) => console.error(err)
          });
        }
      },
      error: (err) => console.error(err)
    });
  }

  toggleExigence(code: string): void {
    const index = this.selectedExigences.indexOf(code);
    if (index === -1) {
      this.selectedExigences.push(code);
    } else {
      this.selectedExigences.splice(index, 1);
    }
  }

  isExigenceSelected(code: string): boolean {
    return this.selectedExigences.includes(code);
  }

  proposeAiImprovement(): void {
    if (!this.afd.description && !this.aiInstruction) return;
    this.loadingAi = true;

    const prompt = `Tu es un expert en analyse fonctionnelle. 
    Description actuelle: "${this.afd.description}". 
    Instruction: "${this.aiInstruction}".
    Propose une amélioration concise de cette AFD en français.`;

    this.http.post<any>('https://api.anthropic.com/v1/messages', {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    }).subscribe({
      next: (res) => {
        this.aiSuggestion = res.content?.[0]?.text || '';
        this.loadingAi = false;
      },
      error: () => {
        this.aiSuggestion = 'Erreur lors de la génération IA.';
        this.loadingAi = false;
      }
    });
  }

  applySuggestion(): void {
    if (this.aiSuggestion) {
      this.afd.description = this.aiSuggestion;
      this.aiSuggestion = '';
    }
  }

  save(): void {
    if (!this.afd.intitule.trim()) return;

    const url = this.selectedBlockId
      ? `/api/afds/analysis/${this.analysisId}?blockId=${this.selectedBlockId}`
      : `/api/afds/analysis/${this.analysisId}`;

    this.http.post<any>(url, this.afd).subscribe({
      next: () => {
        this.router.navigate(['/admin/analyse', this.analysisId]);
      },
      error: (err) => console.error(err)
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/analyse', this.analysisId]);
  }
}