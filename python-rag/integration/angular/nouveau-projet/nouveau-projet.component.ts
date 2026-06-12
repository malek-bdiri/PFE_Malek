import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RagService } from '../services/rag.service';
import { Exigence, GenerateResponse } from '../models/rag.model';

@Component({
  selector: 'app-nouveau-projet',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nouveau-projet.component.html',
  styleUrls: ['./nouveau-projet.component.scss']
})
export class NouveauProjetComponent {

  // ── 1. Informations projet ──
  projectName = '';
  projectId = '';
  clientName = '';
  language = 'Français';
  productName = 'Smart Factory MOMsoft';

  // ── 2. Produits disponibles ──
  products = [
    'Smart Factory MOMsoft',
    'MOMsoft MES',
    'MOMsoft WMS',
    'MOMsoft QMS',
    'MOMsoft Planning',
    'Autre'
  ];

  languages = ['Français', 'English', 'العربية'];

  // ── 3. Fichier CdC ──
  selectedFile: File | null = null;
  isDragOver = false;

  // ── 4. Résultats ──
  exigences: Exigence[] = [];
  resume = '';
  loading = false;
  error = '';
  generationDone = false;

  // ── 5. Ajout manuel ──
  showManualForm = false;
  manualExigence: Exigence = this.emptyExigence();

  exigenceTypes = ['Fonctionnelle', 'Non-fonctionnelle', 'Sécurité', 'Performance'];

  constructor(private ragService: RagService) {}

  // ════════════════════════════════════════════════════════════════════════
  //  DRAG & DROP / FILE SELECT
  // ════════════════════════════════════════════════════════════════════════

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  private handleFile(file: File): void {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    const maxSize = 10 * 1024 * 1024; // 10 Mo

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|docx|txt)$/i)) {
      this.error = 'Format non supporté. Acceptés : PDF, DOCX, TXT';
      return;
    }
    if (file.size > maxSize) {
      this.error = 'Fichier trop volumineux (max 10 Mo)';
      return;
    }

    this.error = '';
    this.selectedFile = file;
  }

  removeFile(): void {
    this.selectedFile = null;
  }

  // ════════════════════════════════════════════════════════════════════════
  //  GÉNÉRATION IA
  // ════════════════════════════════════════════════════════════════════════

  canGenerate(): boolean {
    return !!(this.projectName && this.projectId && this.clientName && this.selectedFile);
  }

  generate(): void {
    if (!this.canGenerate() || !this.selectedFile) return;

    this.loading = true;
    this.error = '';
    this.exigences = [];
    this.resume = '';
    this.generationDone = false;

    this.ragService.projectGenerate(
      this.selectedFile,
      this.projectName,
      this.projectId,
      this.clientName,
      this.productName,
      this.language
    ).subscribe({
      next: (res: GenerateResponse) => {
        this.loading = false;
        this.generationDone = true;

        if (res.success && res.exigences) {
          this.exigences = res.exigences.exigences || [];
          this.resume = res.exigences.resume || '';
        } else {
          this.error = res.raw_text || 'La génération a échoué. Réessayez.';
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.detail || err.message || 'Erreur de connexion au serveur';
      }
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  //  AJOUT MANUEL
  // ════════════════════════════════════════════════════════════════════════

  emptyExigence(): Exigence {
    return {
      id: '',
      type: 'Fonctionnelle',
      intitule: '',
      objectifClient: '',
      description: '',
      solutionProposee: '',
      limitesHypotheses: ''
    };
  }

  openManualForm(): void {
    this.manualExigence = this.emptyExigence();
    this.showManualForm = true;
  }

  cancelManual(): void {
    this.showManualForm = false;
  }

  addManualExigence(): void {
    if (!this.manualExigence.intitule || !this.manualExigence.objectifClient || !this.manualExigence.description) {
      return;
    }
    const nextId = `EX-${String(this.exigences.length + 1).padStart(3, '0')}`;
    this.manualExigence.id = nextId;
    this.exigences.push({ ...this.manualExigence });
    this.showManualForm = false;
  }

  removeExigence(index: number): void {
    this.exigences.splice(index, 1);
  }

  // ════════════════════════════════════════════════════════════════════════
  //  HELPERS
  // ════════════════════════════════════════════════════════════════════════

  getTypeBadgeClass(type: string): string {
    switch (type) {
      case 'Fonctionnelle':     return 'badge-functional';
      case 'Non-fonctionnelle': return 'badge-nonfunctional';
      case 'Sécurité':          return 'badge-security';
      case 'Performance':       return 'badge-performance';
      default:                  return 'badge-default';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' o';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
    return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
  }
}
