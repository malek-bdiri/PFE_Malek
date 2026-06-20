import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FunctionalAnalysisService } from '../../../services/functional-analysis.service';
import { RagService } from '../../../services/rag.service';
import { ToastService } from '../../../services/toast.service';
import { FunctionalAnalysis } from '../../../models/functional-analysis.model';
import { EvaluationResult, AfdItem } from '../../../models/ai.model';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface FunctionalBlock {
  id?: number;
  code?: string;
  nom: string;
  description: string;
  couleur: string;
  exigences: string[];
}

@Component({
  selector: 'app-analyse-detail',
  templateUrl: './analyse-detail.component.html',
  styleUrls: ['./analyse-detail.component.css']
})
export class AnalyseDetailComponent implements OnInit {

  analysisId!: number;
  analysis!: FunctionalAnalysis;
  blocks: FunctionalBlock[] = [];
  loading = true;
  loadError = '';
  activeTab = 'architecture';

  // Modal nouveau bloc
  showNewBlockModal = false;
  newBlock: FunctionalBlock = { nom: '', description: '', couleur: 'blue', exigences: [] };
  newExigence = '';

  // Modal modifier bloc
  showEditModal = false;
  editingBlock: FunctionalBlock | null = null;
  editExigence = '';

  // AFD
afds: any[] = [];
showNewAfdModal = false;
showViewAfdModal = false;
selectedAfd: any = null;
newAfd: any = {
  intitule: '',
  objectif: '',
  description: '',
  reglesGestion: '',
  fluxNominal: '',
  casAlternatifs: '',
  donneesManipulees: '',
  criteresAcceptation: '',
  statut: 'En cours',
  validateur: ''
};
selectedBlockId: number | null = null;

  // ── Filtre par bloc dans l'onglet AFD ────────────────────────────────────
  activeBlockFilter: number | null = null;

  toggleBlockFilter(blockId: number | undefined): void {
    if (!blockId) return;
    this.activeBlockFilter = this.activeBlockFilter === blockId ? null : blockId;
  }

  get filteredAfds(): any[] {
    if (this.activeBlockFilter === null) return this.afds;
    return this.afds.filter(a => a.block?.id === this.activeBlockFilter);
  }

  afdCountForBlock(blockId: number | undefined): number {
    if (!blockId) return 0;
    return this.afds.filter(a => a.block?.id === blockId).length;
  }

  blockName(id: number | null): string {
    return this.blocks.find(b => b.id === id)?.nom || '';
  }

  colors = ['blue', 'green', 'purple', 'orange', 'pink'];

  colorClasses: Record<string, string> = {
    blue:   'bg-blue-50 border-blue-200',
    green:  'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
    orange: 'bg-orange-50 border-orange-200',
    pink:   'bg-pink-50 border-pink-200'
  };

  titleColorClasses: Record<string, string> = {
    blue:   'text-blue-700',
    green:  'text-green-700',
    purple: 'text-purple-700',
    orange: 'text-orange-700',
    pink:   'text-pink-700'
  };

  iconColorClasses: Record<string, string> = {
    blue:   'text-blue-500',
    green:  'text-green-500',
    purple: 'text-purple-500',
    orange: 'text-orange-500',
    pink:   'text-pink-500'
  };

  badgeClasses: Record<string, string> = {
    blue:   'bg-blue-100 text-blue-600',
    green:  'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    pink:   'bg-pink-100 text-pink-600'
  };

  // ── Évaluation IA ────────────────────────────────────────────────────────
  evaluating         = false;
  evaluationResult: EvaluationResult | null = null;
  showEvalPanel      = false;

  // ── Génération AFDs IA ────────────────────────────────────────────────────
  generatingAiAfds   = false;
  aiAfds: AfdItem[]  = [];
  showAiAfdsPanel    = false;
  expandedAfdId: string | null = null;

  // Exigences du projet (pour évaluation et génération AFD)
  projetExigences: any[] = [];

  confirmDialog: { open: boolean; message: string; onConfirm: () => void } =
    { open: false, message: '', onConfirm: () => {} };

  askConfirm(message: string, action: () => void): void {
    this.confirmDialog = { open: true, message, onConfirm: action };
  }
  doConfirm(): void { this.confirmDialog.onConfirm(); this.confirmDialog.open = false; }
  cancelConfirm(): void { this.confirmDialog.open = false; }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private analysisService: FunctionalAnalysisService,
    private http: HttpClient,
    private ragService: RagService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.analysisId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadAnalysis();
    this.loadBlocks();
    this.loadAfds();
    this.loadProjetExigences();
  }

  loadAnalysis(): void {
    this.analysisService.getById(this.analysisId).subscribe({
      next: (data) => { this.analysis = data; this.loadError = ''; },
      error: (err) => {
        this.loadError = 'Impossible de charger cette analyse.';
        this.loading = false;
        console.error(err);
      }
    });
  }

  loadBlocks(): void {
    this.http.get<FunctionalBlock[]>(
      `/api/functional-blocks/analysis/${this.analysisId}`
    ).subscribe({
      next: (data) => {
        this.blocks = data.map((b, i) => ({
          ...b,
          couleur: b.couleur || this.colors[i % this.colors.length],
          exigences: b.exigences || []
        }));
        this.loading = false;
        if (!this.projetExigences.length) {
          this.projetExigences = this.blocks.flatMap(b => b.exigences);
        }
      },
      error: () => { this.loading = false; }
    });
  }

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'Validé':     return 'bg-green-100 text-green-700';
      case 'En cours':   return 'bg-blue-100 text-blue-700';
      case 'En attente': return 'bg-yellow-100 text-yellow-700';
      case 'À revoir':   return 'bg-orange-100 text-orange-700';
      default:           return 'bg-gray-100 text-gray-500';
    }
  }

  // ================================
  // NOUVEAU BLOC
  // ================================
  openNewBlockModal(): void {
    this.newBlock = {
      nom: '',
      description: '',
      couleur: this.colors[this.blocks.length % this.colors.length],
      exigences: []
    };
    this.newExigence = '';
    this.showNewBlockModal = true;
  }

  addExigenceToNew(): void {
    if (this.newExigence.trim()) {
      this.newBlock.exigences.push(this.newExigence.trim().toUpperCase());
      this.newExigence = '';
    }
  }

  removeExigenceFromNew(index: number): void {
    this.newBlock.exigences.splice(index, 1);
  }

  saveNewBlock(): void {
    if (!this.newBlock.nom.trim()) return;
    this.http.post<FunctionalBlock>(
      `/api/functional-blocks/analysis/${this.analysisId}`,
      this.newBlock
    ).subscribe({
      next: (saved) => {
        this.blocks.push({
          ...saved,
          couleur: saved.couleur || this.newBlock.couleur,
          exigences: saved.exigences || []
        });
        this.showNewBlockModal = false;
        this.toast.success('Bloc fonctionnel ajouté');
      },
      error: () => this.toast.error('Erreur lors de l\'ajout du bloc')
    });
  }

  // ================================
  // MODIFIER BLOC
  // ================================
  openEditModal(block: FunctionalBlock): void {
    this.editingBlock = { ...block, exigences: [...block.exigences] };
    this.editExigence = '';
    this.showEditModal = true;
  }

  addExigenceToEdit(): void {
    if (this.editExigence.trim() && this.editingBlock) {
      this.editingBlock.exigences.push(this.editExigence.trim().toUpperCase());
      this.editExigence = '';
    }
  }

  removeExigenceFromEdit(index: number): void {
    this.editingBlock?.exigences.splice(index, 1);
  }

  saveEditBlock(): void {
    if (!this.editingBlock) return;
    if (this.editingBlock.id) {
      this.http.put<FunctionalBlock>(
        `/api/functional-blocks/${this.editingBlock.id}`,
        this.editingBlock
      ).subscribe({
        next: (saved) => {
          const index = this.blocks.findIndex(b => b.id === saved.id);
          if (index !== -1) this.blocks[index] = { ...saved, couleur: this.editingBlock!.couleur };
          this.showEditModal = false;
          this.toast.success('Bloc modifié avec succès');
        },
        error: () => this.toast.error('Erreur lors de la modification du bloc')
      });
    }
  }

  // ================================
  // SUPPRIMER BLOC
  // ================================
  deleteBlock(block: FunctionalBlock, index: number): void {
    if (!block.id) return;
    this.askConfirm('Supprimer ce bloc fonctionnel ?', () => {
      this.http.delete(`/api/functional-blocks/${block.id}`).subscribe({
        next: () => {
          this.blocks.splice(index, 1);
          if (this.activeBlockFilter === block.id) this.activeBlockFilter = null;
          this.toast.success('Bloc supprimé');
        },
        error: () => this.toast.error('Erreur lors de la suppression du bloc')
      });
    });
  }

  // ================================
  // VALIDER
  // ================================
  validerAnalysis(): void {
    this.analysisService.update(this.analysisId, {
      ...this.analysis,
      statut: 'Validé'
    }).subscribe({
      next: (updated) => {
        this.analysis = updated;
        this.toast.success('Analyse validée avec succès');
      },
      error: () => this.toast.error('Erreur lors de la validation de l\'analyse')
    });
  }


  loadAfds(): void {
    this.http.get<any[]>(`/api/afds/analysis/${this.analysisId}`).subscribe({
      next: (data) => this.afds = data,
      error: (err) => console.error(err)
    });
  }

  loadProjetExigences(): void {
    // projetExigences is populated by loadBlocks() as fallback from block exigences
  }

  // ── Évaluation qualité des exigences ──────────────────────────────────────
  evaluerExigences(): void {
    if (!this.projetExigences.length) return;
    this.evaluating = true;
    this.showEvalPanel = true;
    this.evaluationResult = null;

    const projectName = this.analysis?.projet?.nom || '';
    this.ragService.evaluateExigences('', this.projetExigences, projectName).subscribe({
      next: (res) => {
        this.evaluating = false;
        this.evaluationResult = res.evaluation;
      },
      error: (err) => {
        this.evaluating = false;
        console.error('Erreur évaluation', err);
      }
    });
  }

  // ── Génération AFDs par IA ────────────────────────────────────────────────
  genererAiAfds(): void {
    if (!this.projetExigences.length) return;
    this.generatingAiAfds = true;
    this.showAiAfdsPanel = true;
    this.aiAfds = [];

    const projectName = this.analysis?.projet?.nom || '';
    const clientName  = this.analysis?.projet?.client || '';
    const codeProjet  = this.analysis?.projet?.codeProjet || '';
    const projectId   = this.analysis?.projet?.id;
    this.ragService.generateAfdFromExigences(this.projetExigences, projectName, clientName, projectId, codeProjet).subscribe({
      next: (res) => {
        this.generatingAiAfds = false;
        this.aiAfds = res.afds || [];
      },
      error: (err) => {
        this.generatingAiAfds = false;
        console.error('Erreur génération AFDs IA', err);
      }
    });
  }

  toggleAfd(id: string): void {
    this.expandedAfdId = this.expandedAfdId === id ? null : id;
  }

  scoreColor(score: number): string {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-400';
    return 'bg-red-400';
  }

  scoreOf(key: string): number {
    if (!this.evaluationResult) return 0;
    return (this.evaluationResult.scores as any)[key] ?? 0;
  }

openNewAfdModal(): void {
  this.router.navigate(['/admin/analyse', this.analysisId, 'afd', 'new']);
}

saveNewAfd(): void {
  if (!this.newAfd.intitule.trim()) return;
  const url = this.selectedBlockId
    ? `/api/afds/analysis/${this.analysisId}?blockId=${this.selectedBlockId}`
    : `/api/afds/analysis/${this.analysisId}`;

  this.http.post<any>(url, this.newAfd).subscribe({
    next: (saved) => {
      this.afds.push(saved);
      this.showNewAfdModal = false;
      this.toast.success('AFD créée avec succès');
    },
    error: () => this.toast.error('Erreur lors de la création de l\'AFD')
  });
}

viewAfd(afd: any): void {
  this.selectedAfd = afd;
  this.showViewAfdModal = true;
}

deleteAfd(id: number): void {
  this.askConfirm('Supprimer cette AFD ?', () => {
    this.http.delete(`/api/afds/${id}`).subscribe({
      next: () => {
        this.afds = this.afds.filter(a => a.id !== id);
        this.toast.success('AFD supprimée');
      },
      error: () => this.toast.error('Erreur lors de la suppression de l\'AFD')
    });
  });
}

getAfdStatutClass(statut: string): string {
  switch (statut) {
    case 'Validé':     return 'bg-green-100 text-green-700';
    case 'En cours':   return 'bg-blue-100 text-blue-700';
    case 'En attente': return 'bg-yellow-100 text-yellow-700';
    default:           return 'bg-gray-100 text-gray-500';
  }
}

  goBack(): void {
    this.router.navigate(['/admin/analyse']);
  }
  // Ajoute ces propriétés
showEditAfdModal = false;
editingAfd: any = null;

showValidateAfdModal = false;
validatingAfd: any = null;
validationForm = {
  validateur: '',
  commentaire: '',
  pieceJointe: null as File | null
};

// Ajoute ces méthodes
openEditAfdModal(afd: any): void {
  this.editingAfd = { ...afd };
  this.showEditAfdModal = true;
}

saveEditAfd(): void {
  if (!this.editingAfd || !this.editingAfd.intitule.trim()) return;
  this.http.put<any>(
    `/api/afds/${this.editingAfd.id}`,
    this.editingAfd
  ).subscribe({
    next: (saved) => {
      const index = this.afds.findIndex(a => a.id === saved.id);
      if (index !== -1) this.afds[index] = saved;
      this.showEditAfdModal = false;
      this.toast.success('AFD modifiée avec succès');
    },
    error: () => this.toast.error('Erreur lors de la modification de l\'AFD')
  });
}
downloadAfdPdf(id: number, code: string): void {
  this.http.get(
    `/api/afds/${id}/pdf`,
    { responseType: 'blob' }
  ).subscribe({
    next: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${code}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      this.toast.success(`PDF ${code} téléchargé`);
    },
    error: () => this.toast.error('Erreur lors du téléchargement du PDF')
  });
}
openValidateAfdModal(afd: any): void {
    this.validatingAfd = afd;
    this.validationForm = {
      validateur: '',
      commentaire: '',
      pieceJointe: null
    };
    this.showValidateAfdModal = true;
  }

  onValidationFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) this.validationForm.pieceJointe = file;
  }

  confirmerValidationAfd(): void {
    if (!this.validatingAfd || !this.validationForm.validateur.trim()) return;

    const updatedAfd = {
      ...this.validatingAfd,
      statut: 'Validé',
      validateur: this.validationForm.validateur,
      commentaireValidation: this.validationForm.commentaire,
      dateValidation: new Date().toISOString()
    };

    this.http.put<any>(
      `/api/afds/${this.validatingAfd.id}`,
      updatedAfd
    ).subscribe({
      next: (saved) => {
        const index = this.afds.findIndex(a => a.id === saved.id);
        if (index !== -1) this.afds[index] = saved;
        this.showValidateAfdModal = false;
        this.toast.success('AFD validée avec succès');
        if (this.validationForm.pieceJointe) {
          const formData = new FormData();
          formData.append('file', this.validationForm.pieceJointe);
          this.http.post(`/api/afds/${saved.id}/attachment`, formData).subscribe();
        }
      },
      error: () => this.toast.error('Erreur lors de la validation de l\'AFD')
    });
  }

  // ================================
  // EXPORT PDF
  // ================================

  /** Exporte TOUTES les AFDs de l'analyse en un seul PDF */
  exportAllAfdsPdf(): void {
    if (!this.afds.length) return;
    this.toast.info('Export PDF en cours...');
    const doc = new jsPDF();
    const projet = this.analysis?.projet;
    const title = `Analyse Fonctionnelle — ${projet?.nom || ''}`;

    this.afds.forEach((afd, index) => {
      if (index > 0) doc.addPage();
      this._renderAfdPage(doc, afd, projet, index + 1, this.afds.length);
    });

    const filename = `AFD_${projet?.codeProjet || 'export'}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
    this.toast.success(`${this.afds.length} AFD(s) exportée(s) en PDF`);
  }

  /** Exporte UNE seule AFD en PDF */
  exportSingleAfdPdf(afd: any): void {
    const doc = new jsPDF();
    const projet = this.analysis?.projet;
    this._renderAfdPage(doc, afd, projet, 1, 1);
    doc.save(`${afd.code || afd.id}_${afd.intitule?.replace(/[^a-zA-Z0-9]/g, '_') || 'AFD'}.pdf`);
  }

  private _renderAfdPage(doc: jsPDF, afd: any, projet: any, pageNum: number, total: number): void {
    const primaryColor: [number, number, number] = [37, 99, 235];   // blue-600
    const lightGray: [number, number, number]   = [248, 250, 252];  // slate-50
    const darkText: [number, number, number]    = [15, 23, 42];     // slate-900
    const mutedText: [number, number, number]   = [100, 116, 139];  // slate-500
    const pageW = doc.internal.pageSize.getWidth();
    let y = 0;

    // ── Header band ──────────────────────────────────────────────────────
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageW, 28, 'F');

    doc.setFontSize(7);
    doc.setTextColor(180, 200, 255);
    doc.text('MOMsoft Smart Factory', 14, 10);

    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    const titleText = `AFD — ${afd.intitule || ''}`.substring(0, 70);
    doc.text(titleText, 14, 20);

    doc.setFontSize(8);
    doc.setTextColor(180, 200, 255);
    doc.setFont('helvetica', 'normal');
    doc.text(`${pageNum} / ${total}`, pageW - 20, 20, { align: 'right' });

    y = 36;

    // ── Meta info row ─────────────────────────────────────────────────────
    doc.setFillColor(...lightGray);
    doc.roundedRect(14, y, pageW - 28, 22, 2, 2, 'F');

    const metas = [
      { label: 'Code',    value: afd.code || '—' },
      { label: 'Projet',  value: projet?.nom || '—' },
      { label: 'Statut',  value: afd.statut || '—' },
      { label: 'Validateur', value: afd.validateur || '—' },
    ];
    const colW = (pageW - 28) / metas.length;
    metas.forEach((m, i) => {
      const x = 18 + i * colW;
      doc.setFontSize(7);
      doc.setTextColor(...mutedText);
      doc.setFont('helvetica', 'normal');
      doc.text(m.label.toUpperCase(), x, y + 8);
      doc.setFontSize(9);
      doc.setTextColor(...darkText);
      doc.setFont('helvetica', 'bold');
      doc.text(String(m.value), x, y + 16);
    });

    y += 30;

    // ── Sections helper ───────────────────────────────────────────────────
    const addSection = (label: string, content: string): void => {
      if (!content?.trim()) return;
      doc.setFontSize(9);
      doc.setTextColor(...primaryColor);
      doc.setFont('helvetica', 'bold');
      doc.text(label.toUpperCase(), 14, y);

      // underline
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(0.4);
      doc.line(14, y + 1.5, 14 + doc.getTextWidth(label.toUpperCase()), y + 1.5);

      y += 5;
      doc.setFontSize(9);
      doc.setTextColor(...darkText);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(content, pageW - 28);
      doc.text(lines, 14, y);
      y += lines.length * 5 + 6;

      // page break guard
      if (y > 265) { doc.addPage(); y = 20; }
    };

    addSection('Objectif',            afd.objectif || '');
    addSection('Description',         afd.description || '');
    addSection('Règles de gestion',   afd.reglesGestion || '');
    addSection('Flux nominal',        afd.fluxNominal || '');
    addSection('Cas alternatifs',     afd.casAlternatifs || '');
    addSection('Données manipulées',  afd.donneesManipulees || '');
    addSection('Critères d\'acceptation', afd.criteresAcceptation || '');

    // ── Footer ────────────────────────────────────────────────────────────
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFillColor(...primaryColor);
    doc.rect(0, pageH - 10, pageW, 10, 'F');
    doc.setFontSize(7);
    doc.setTextColor(180, 200, 255);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Généré le ${new Date().toLocaleDateString('fr-FR')} — MOMsoft Smart Factory`,
      pageW / 2, pageH - 4,
      { align: 'center' }
    );
  }
}