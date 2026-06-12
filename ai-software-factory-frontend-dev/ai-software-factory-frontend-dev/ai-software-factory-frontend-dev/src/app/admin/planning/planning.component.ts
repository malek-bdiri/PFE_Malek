import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PlanningService } from '../../services/planning.service';
import { Planning } from '../../models/planning.model';

@Component({
  selector: 'app-planning',
  templateUrl: './planning.component.html',
  styleUrls: ['./planning.component.css']
})
export class PlanningComponent implements OnInit {

  plannings: Planning[] = [];
  filteredPlannings: Planning[] = [];
  openDropdown: string | null = null;

  projects = ['Tous les projets', 'CRM Enterprise', 'ERP Cloud Migration', 'Mobile Banking App'];
  statuses = ['Tous les statuts', 'BROUILLON', 'GENERE', 'VALIDE'];
  phases = ['Toutes les phases', 'Analyse', 'Développement', 'Tests'];

  selectedProject = 'Tous les projets';
  selectedStatus = 'Tous les statuts';
  selectedPhase = 'Toutes les phases';

  constructor(private planningService: PlanningService, private router: Router) {}

  ngOnInit(): void {
    this.loadPlannings();
  }

  loadPlannings(): void {
    this.planningService.getPlannings().subscribe({
      next: (data) => { this.plannings = data; this.filteredPlannings = data; },
      error: (err) => console.error(err)
    });
  }

  toggleDropdown(type: string) {
    this.openDropdown = this.openDropdown === type ? null : type;
  }

  selectProject(p: string) { this.selectedProject = p; this.openDropdown = null; this.applyFilters(); }
  selectStatus(s: string) { this.selectedStatus = s; this.openDropdown = null; this.applyFilters(); }
  selectPhase(ph: string) { this.selectedPhase = ph; this.openDropdown = null; this.applyFilters(); }

  applyFilters(): void {
    this.filteredPlannings = this.plannings.filter(planning => {
      const matchProject = this.selectedProject === 'Tous les projets' || planning.projet?.nom === this.selectedProject;
      const matchStatus = this.selectedStatus === 'Tous les statuts' || planning.statusMetier === this.selectedStatus;
      const matchPhase = this.selectedPhase === 'Toutes les phases' || planning.phaseActuelle === this.selectedPhase;
      return matchProject && matchStatus && matchPhase;
    });
  }

  openPlanning(id: number): void {
    this.router.navigate(['/admin/planning', id]);
  }
}