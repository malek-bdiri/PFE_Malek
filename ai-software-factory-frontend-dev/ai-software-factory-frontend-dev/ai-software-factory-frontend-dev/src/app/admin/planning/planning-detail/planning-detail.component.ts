import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PlanningService } from 'src/app/services/planning.service';
import { Planning } from 'src/app/models/planning.model';

@Component({
  selector: 'app-planning-detail',
  templateUrl: './planning-detail.component.html',
  styleUrls: ['./planning-detail.component.css']
})
export class PlanningDetailComponent implements OnInit {

  planning!: Planning;

  phases: any[] = [];

  activeTab: string = 'overview';

  loading = false;
  versions: any[] = [];
selectedVersionId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private planningService: PlanningService
  ) {}

  ngOnInit(): void {

    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id) {
      console.error("ID planning invalide");
      return;
    }

    this.loadPlanning(id);

    this.loadPhases(id);

  }
showRecalcModal = false;

formRecalc = {
  dev: 3,
  test: 2,
  func: 2,
  taux: 80,
  jours: 5
};
  // ================================
  // LOAD PLANNING
  // ================================

  loadPlanning(id: number) {

    this.loading = true;

    this.planningService.getPlanningById(id).subscribe({

      next: (data: Planning) => {

        console.log("Planning reçu :", data);

        this.planning = data;

         this.selectedVersionId = data.id;
      this.loadVersions();
      this.loadPhases(data.id);

        this.loading = false;

      },

      error: err => {

        console.error("Erreur chargement planning", err);

        this.loading = false;

      }

    });

  }

  // ================================
  // LOAD PHASES
  // ================================

  loadPhases(id: number) {

    this.planningService.getPhasesByPlanning(id).subscribe({

      next: data => {

        // NOUVEAU - par ceci :
this.phases = data.map((p: any) => ({
  id: p.id,
  ordre: p.ordre,
  nom: p.nom,
  description: p.description,
  debutPrevu: p.dateDebut,
  finPrevue: p.dateFin,
  debutReel: p.debutReel,
  finReelle: p.finReelle,
  progression: p.progression,
  poids: p.poids,
  statut: this.formatStatus(p.statut),
  responsable: p.responsable,
  actionsLiees: p.actionsLiees
}));

      },

      error: err => {
        console.error("Erreur chargement phases", err);
      }

    });

  }

  // ================================
  // TABS
  // ================================

  setTab(tab: string) {
    this.activeTab = tab;
  }
isOverview(): boolean {
  return this.activeTab === 'overview';
}

isGantt(): boolean {
  return this.activeTab === 'gantt';
}

isPhases(): boolean {
  return this.activeTab === 'phases';
}
  // ================================
  // NAVIGATION
  // ================================

  goBack() {
    this.router.navigate(['/admin/planning']);
  }

  // ================================
  // FORMAT STATUS
  // ================================

  formatStatus(status: string): string {

    switch (status) {

      case "TERMINE":
        return "Terminé";

      case "EN_COURS":
        return "En cours";

      case "EN_ATTENTE":
        return "Non démarré";

      default:
        return status;

    }

  }

  // ================================
  // STATUS STYLE
  // ================================

  getStatusClass(status: string) {

    switch (status) {

      case 'Terminé':
        return 'bg-green-100 text-green-700';

      case 'En cours':
        return 'bg-blue-100 text-blue-700';

      case 'Non démarré':
        return 'bg-gray-100 text-gray-600';

      default:
        return 'bg-gray-100 text-gray-600';

    }

  }

  // ================================
  // DURÉE PROJET
  // ================================

  get durationDays(): number {

    if (!this.planning?.dateDebut || !this.planning?.dateFin) {
      return 0;
    }

    const start = new Date(this.planning.dateDebut);
    const end = new Date(this.planning.dateFin);

    const diff = end.getTime() - start.getTime();

    return Math.ceil(diff / (1000 * 3600 * 24));

  }
  get chargeTotale(): number {

  if (!this.planning) return 0;

  return this.planning.chargeTotale || 0;

}

get ressources(): number {

  if (!this.planning) return 0;

  return this.planning.totalRessources || 0;

}

get tauxCharge(): number {

  if (!this.planning) return 0;

  return this.planning.tauxCharge || 0;

}
validerPlanning() {

  if (!this.planning?.id) return;

  this.planningService.validerPlanning(this.planning.id).subscribe({

    next: (updated: any) => {
      this.planning = updated;
    },

    error: (err: any) => {
      console.error("Erreur validation", err);
    }

  });

}
generateNewVersion() {

  if (!this.planning?.projet?.id) return;

  const payload = {
    dateDebut: this.planning.dateDebut,
    ressources: [
      { type: 'DEV', nombre: this.formRecalc.dev, utilisation: this.formRecalc.taux, charge: 100 },
      { type: 'TEST', nombre: this.formRecalc.test, utilisation: this.formRecalc.taux, charge: 100 },
      { type: 'FUNC', nombre: this.formRecalc.func, utilisation: this.formRecalc.taux, charge: 100 }
    ],
    riskBuffer: 0,
    sequentialPhases: true
  };

  console.log("🚀 SEND:", payload);

  this.planningService.recalculate(this.planning.projet.id, payload)
    .subscribe({
      next: (res: any) => {

        console.log("✅ RESPONSE:", res);

        this.planning = res;
        this.selectedVersionId = res.id;
        this.loadVersions();

        // 🔥 reload phases (IMPORTANT)
        this.loadPhases(res.id);

        // 🔥 fermer modal
        this.showRecalcModal = false;

      },
      error: err => {
        console.error("❌ ERROR:", err);
      }
    });


    console.log("CLICK OK");
console.log("PAYLOAD:", payload);
}
get totalRessources(): number {
  return this.formRecalc.dev + this.formRecalc.test + this.formRecalc.func;
}

get heuresParJour(): number {
  return 8; // tu peux connecter au calendrier après
}

get capaciteHebdo(): number {
  return this.totalRessources
    * this.heuresParJour
    * (this.formRecalc.taux / 100)
    * this.formRecalc.jours;
}

get capaciteParJour(): number {
  return this.heuresParJour * (this.formRecalc.taux / 100);
}
openRecalcModal() {
  this.showRecalcModal = true;
}

loadVersions() {

  if (!this.planning?.projet?.id) return;

  this.planningService.getPlanningsByProjet(this.planning.projet.id)
    .subscribe({
      next: (data) => {

         console.log("VERSIONS:", data);
        this.versions = data;
      },
      error: err => console.error(err)
    });

}
selectVersion(p: any) {

  if (!p) return;
  console.log("🔁 SWITCH VERSION:", p); // debug

  this.selectedVersionId = p.id;

  this.planning = p;

  this.loadPhases(p.id);

}
onVersionChange(id: number) {

  const selected = this.versions.find(v => v.id === id);

  if (!selected) return;

  this.selectVersion(selected);

}

// Ajoute ces propriétés
showAddPhaseModal = false;
editingPhase: any = null;

newPhase = {
  nom: '',
  description: '',
  dateDebut: '',
  dateFin: '',
  debutReel: '',
  finReelle: '',
  poids: 25,
  responsable: '',
  statut: 'Non démarré',
  actionsLiees: 0
};

// Ajoute ces méthodes
openAddPhaseModal() {
  this.newPhase = {
    nom: '', description: '', dateDebut: '', dateFin: '',
    debutReel: '', finReelle: '', poids: 25,
    responsable: '', statut: 'Non démarré', actionsLiees: 0
  };
  this.editingPhase = null;
  this.showAddPhaseModal = true;
}

openEditPhaseModal(phase: any) {
  this.newPhase = { ...phase };
  this.editingPhase = phase;
  this.showAddPhaseModal = true;
}

savePhase() {
  if (!this.planning?.id) return;

  const obs = this.editingPhase
    ? this.planningService.updatePhase(this.editingPhase.id, this.newPhase)
    : this.planningService.addPhase(this.planning.id, this.newPhase);

  obs.subscribe({
    next: () => {
      this.loadPhases(this.planning.id);
      this.showAddPhaseModal = false;
    },
    error: err => console.error(err)
  });
}

deletePhase(phaseId: number) {
  if (!confirm('Supprimer cette phase ?')) return;
  this.planningService.deletePhase(phaseId).subscribe({
    next: () => this.loadPhases(this.planning.id),
    error: err => console.error(err)
  });
}

getStatusBadgeClass(statut: string): string {
  switch(statut) {
    case 'Terminé':    return 'bg-green-100 text-green-700';
    case 'En cours':   return 'bg-blue-100 text-blue-700';
    case 'En retard':  return 'bg-red-100 text-red-700';
    case 'Bloqué':     return 'bg-orange-100 text-orange-700';
    default:           return 'bg-gray-100 text-gray-500';
  }
}
}