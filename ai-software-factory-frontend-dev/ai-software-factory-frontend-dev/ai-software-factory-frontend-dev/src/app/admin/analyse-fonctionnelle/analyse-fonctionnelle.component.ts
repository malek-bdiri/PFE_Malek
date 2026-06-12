import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FunctionalAnalysisService } from '../../services/functional-analysis.service';
import { FunctionalAnalysis } from '../../models/functional-analysis.model';

@Component({
  selector: 'app-analyse-fonctionnelle',
  templateUrl: './analyse-fonctionnelle.component.html',
  styleUrls: ['./analyse-fonctionnelle.component.css']
})
export class AnalyseFonctionnelleComponent implements OnInit {

  analyses: FunctionalAnalysis[] = [];
  filteredAnalyses: FunctionalAnalysis[] = [];

  searchTerm = '';
  selectedStatut = '';
  selectedClient = '';

  statuts = ['Validé', 'En cours', 'En attente', 'À revoir'];

  constructor(
    private analysisService: FunctionalAnalysisService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAnalyses();
  }

  loadAnalyses(): void {
    console.log('🔍 Récupération des analyses AFD...');
    this.analysisService.getAll().subscribe({
      next: (data) => {
        console.log('✅ Données reçues:', data);
        this.analyses = data;
        this.filteredAnalyses = data;
      },
      error: (err) => {
        console.error('❌ Erreur lors de la récupération des AFD:', err);
        console.error('Status:', err.status);
        console.error('Message:', err.message);
        console.error('Error:', err.error);
      }
    });
  }

  get clients(): string[] {
  const all = this.analyses
    .map(a => a.projet?.client)
    .filter((c): c is string => !!c);
  return [...new Set(all)];
}

  applyFilters(): void {
    this.filteredAnalyses = this.analyses.filter(a => {
      const matchSearch = !this.searchTerm ||
        a.code?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        a.projet?.nom?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        a.projet?.client?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        a.validateur?.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchStatut = !this.selectedStatut ||
        this.selectedStatut === 'Tous les statuts' ||
        a.statut === this.selectedStatut;

      const matchClient = !this.selectedClient ||
        this.selectedClient === 'Tous les clients' ||
        a.projet?.client === this.selectedClient;

      return matchSearch && matchStatut && matchClient;
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

  deleteAnalysis(id: number): void {
    if (!confirm('Supprimer cette analyse ?')) return;
    this.analysisService.delete(id).subscribe({
      next: () => this.loadAnalyses(),
      error: (err) => console.error(err)
    });
  }

  viewDetails(id: number): void {
    this.router.navigate(['/admin/analyse', id]);
  }
}