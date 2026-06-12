import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProjetService } from '../../../services/projet.service';
import { Projet } from '../../../models/projet.model';

@Component({
  selector: 'app-planning-new',
  templateUrl: './planning-new.component.html',
  styleUrls: ['./planning-new.component.css']
})
export class PlanningNewComponent implements OnInit {

  projets: Projet[] = [];
  selectedProjetId: number | null = null;
  selectedProjetName: string | null = null;
  showProjectDropdown = false;
  errorMessage: string = '';

  constructor(
    private router: Router,
    private projetService: ProjetService
  ) {}

  ngOnInit(): void {
    this.projetService.getProjets().subscribe({
      next: (data) => {
        this.projets = data;
      },
      error: (err) => {
        console.error('Erreur chargement projets', err);
      }
    });
  }

  toggleProjectDropdown(): void {
    this.showProjectDropdown = !this.showProjectDropdown;
  }

  selectProjet(projet: Projet): void {
    this.selectedProjetId = projet.id ?? null;
    this.selectedProjetName = projet.nom ?? '';
    this.showProjectDropdown = false;
    this.errorMessage = '';
  }

  goToStep2(): void {
    if (!this.selectedProjetId) {
      this.errorMessage = "Veuillez sélectionner un projet";
      return;
    }
    this.router.navigate(['/admin/planning/new/step-2', this.selectedProjetId]);
  }
}