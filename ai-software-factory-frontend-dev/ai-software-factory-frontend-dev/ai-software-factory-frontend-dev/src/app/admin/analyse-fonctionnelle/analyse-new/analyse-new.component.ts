import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProjetService } from '../../../services/projet.service';
import { FunctionalAnalysisService } from '../../../services/functional-analysis.service';
import { Projet } from '../../../models/projet.model';

@Component({
  selector: 'app-analyse-new',
  templateUrl: './analyse-new.component.html',
  styleUrls: ['./analyse-new.component.css']
})
export class AnalyseNewComponent implements OnInit {

  projets: Projet[] = [];
  selectedProjetId: number | null = null;
  description = '';
  aiInstructions = '';
  uploadedFiles: File[] = [];
  errorMessage = '';
  isDragging = false;

  constructor(
    private router: Router,
    private projetService: ProjetService,
    private analysisService: FunctionalAnalysisService
  ) {}

  ngOnInit(): void {
    this.projetService.getProjets().subscribe({
      next: (data) => this.projets = data,
      error: (err) => console.error(err)
    });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(): void {
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    const files = event.dataTransfer?.files;
    if (files) this.addFiles(files);
  }

  onFileSelected(event: any): void {
    this.addFiles(event.target.files);
  }

  addFiles(files: FileList): void {
    Array.from(files).forEach(f => {
      if (!this.uploadedFiles.find(existing => existing.name === f.name)) {
        this.uploadedFiles.push(f);
      }
    });
  }

  removeFile(index: number): void {
    this.uploadedFiles.splice(index, 1);
  }

  getFileIcon(file: File): string {
    if (file.type.includes('pdf')) return '📄';
    if (file.type.includes('word') || file.name.endsWith('.docx')) return '📝';
    if (file.type.includes('image')) return '🖼️';
    return '📎';
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  generate(): void {
    if (!this.selectedProjetId) {
      this.errorMessage = 'Veuillez sélectionner un projet';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }
    this.doGenerate();
  }

  private doGenerate(): void {
    const analysis: any = { statut: 'En cours' };
    if (this.description?.trim()) {
      analysis.description = this.description.trim();
    }

    this.analysisService.create(this.selectedProjetId!, analysis).subscribe({
      next: (created) => {
        this.router.navigate(
          ['/admin/analyse/generating', created.id],
          { queryParams: { projetId: this.selectedProjetId } }
        );
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Erreur lors de la création de l\'analyse';
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/analyse']);
  }
}
