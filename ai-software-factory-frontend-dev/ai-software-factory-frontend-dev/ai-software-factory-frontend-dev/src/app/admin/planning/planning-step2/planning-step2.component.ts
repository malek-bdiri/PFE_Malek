import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PlanningService } from 'src/app/services/planning.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-planning-step2',
  templateUrl: './planning-step2.component.html',
  styleUrls: ['./planning-step2.component.css']
})
export class PlanningStep2Component implements OnInit {

  projetId!: number;

  startDate: string = '';
  endDate: string = '';
  hoursPerDay = 8;
  workingDaysPerWeek = 5;

  typesRessource = [
    'Développeur Senior',
    'Développeur Junior',
    'Testeur',
    'Consultant Fonctionnel',
    'Chef de Projet',
    'Architecte'
  ];

  ressources: any[] = [
    { type: 'Développeur Senior', nombre: 3, utilisation: 80, charge: 100 }
  ];

  sequentialPhases = true;
  parallelTasks = false;
  riskBuffer = 15;
  milestones: { name: string; date: string }[] = [];

  showPreview = false;
  errorMessage = '';
  estimatedEndDate!: Date;
  totalProjectHours = 0;
  previewCharge: number = 0;
  previewDays: number = 0;
  previewWeeks: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private planningService: PlanningService,
    private snackBar: MatSnackBar,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.projetId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadProjectWorkload();
    this.loadCalendar();
  }

  loadProjectWorkload() {
    this.http.get<any[]>(`/api/exigences/projet/${this.projetId}`)
      .subscribe(exigences => {
        let total = 0;
        exigences.forEach(e => {
          total += (e.hjDev || 0) + (e.hjTest || 0) + (e.hjFonc || 0);
        });
        this.totalProjectHours = total * this.hoursPerDay;
      });
  }

  loadCalendar() {
  this.http.get<any>('/api/calendrier')
    .subscribe(cal => {
      const start = cal.startTime.split(':');
      const end = cal.endTime.split(':');
      this.hoursPerDay = Number(end[0]) - Number(start[0]) - (cal.lunchBreakMinutes / 60);
      this.workingDaysPerWeek = cal.workingDaysPerWeek || 5;
    });
}

  calculateRessource(r: any): number {
    return r.nombre * this.hoursPerDay * (r.utilisation / 100) * (r.charge / 100);
  }

  get totalJour(): number {
    return this.ressources.map(r => this.calculateRessource(r)).reduce((a, b) => a + b, 0);
  }

  get weeklyCapacity(): number {
    return this.totalJour * this.workingDaysPerWeek;
  }

  get totalProjectDays(): number {
    return this.totalProjectHours / this.hoursPerDay;
  }

  addRessource() {
    this.ressources.push({ type: 'Développeur Senior', nombre: 1, utilisation: 80, charge: 100 });
  }

  removeRessource(index: number) {
    this.ressources.splice(index, 1);
  }

  addMilestone() {
    this.milestones.push({ name: '', date: '' });
  }

  preview() {
    if (!this.startDate) {
      this.errorMessage = "Veuillez saisir une date de début";
      return;
    }
    const request = {
      dateDebut: this.startDate,
      dateFin: this.endDate,
      riskBuffer: this.riskBuffer,
      sequentialPhases: this.sequentialPhases,
      ressources: this.ressources
    };
    this.http.post<any>(`/api/plannings/preview/${this.projetId}`, request)
      .subscribe({
        next: (res) => {
          this.previewCharge = res.chargeTotale;
          this.previewDays = res.durationDays;
          this.previewWeeks = res.durationWeeks;
          this.estimatedEndDate = new Date(res.endDate);
          this.showPreview = true;
        },
        error: () => { this.errorMessage = "Erreur lors du calcul"; }
      });
  }

  confirmAndGenerate() {
    const request = {
      dateDebut: this.startDate,
      dateFin: this.endDate,
      riskBuffer: this.riskBuffer,
      sequentialPhases: this.sequentialPhases,
      ressources: this.ressources
    };
    this.planningService.generatePlanning(this.projetId, request).subscribe({
      next: (planning) => {
        this.snackBar.open('Planning généré avec succès', '', { duration: 2000 });
        this.router.navigate(['/admin/planning', planning.id]);
      },
      error: () => {
        this.snackBar.open('Erreur génération planning', '', { duration: 3000 });
      }
    });
  }

  goBack() {
    this.router.navigate(['/admin/planning/new']);
  }
}