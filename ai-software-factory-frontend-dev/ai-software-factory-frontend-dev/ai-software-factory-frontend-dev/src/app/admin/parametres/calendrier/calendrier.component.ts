import { Component, OnInit } from '@angular/core';
import { JourFerieService, JourFerie } 
from 'src/app/services/jour-ferie.service';

import { HttpClient } from '@angular/common/http';



interface JourTravail {
  name: string;
  selected: boolean;
}

@Component({
  selector: 'app-calendrier',
  templateUrl: './calendrier.component.html'
})
export class CalendrierComponent implements OnInit {
   timer: any = null;

  constructor(
  private jourFerieService: JourFerieService,
  private http: HttpClient
) {}

  // ===============================
  // JOURS TRAVAILLÉS
  // ===============================
  jours: JourTravail[] = [
    { name: 'Lundi', selected: true },
    { name: 'Mardi', selected: true },
    { name: 'Mercredi', selected: true },
    { name: 'Jeudi', selected: true },
    { name: 'Vendredi', selected: true },
    { name: 'Samedi', selected: false },
    { name: 'Dimanche', selected: false }
  ];

  toggleJour(jour: JourTravail): void {
    jour.selected = !jour.selected;
  }

  // ===============================
  // HORAIRES
  // ===============================
  heureDebut: string = '08:00';
  heureFin: string = '17:00';
  pause: number = 60;

  get heuresEffectives(): number {
    const debut = this.toMinutes(this.heureDebut);
    const fin = this.toMinutes(this.heureFin);
    return Math.max((fin - debut - this.pause) / 60, 0);
  }

  private toMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  horairesSpecifiques: boolean = false;

  // ===============================
  // JOURS FÉRIÉS (BACKEND CONNECTED)
  // ===============================
  joursFeries: JourFerie[] = [];
  showModal: boolean = false;
  editingIndex: number | null = null;
  formError: boolean = false;
  errorToast: boolean = false;

  selectedMonth: string = '';
  selectedDay: string = '';

  months = [
    { value: '01', label: 'Janvier' },
    { value: '02', label: 'Février' },
    { value: '03', label: 'Mars' },
    { value: '04', label: 'Avril' },
    { value: '05', label: 'Mai' },
    { value: '06', label: 'Juin' },
    { value: '07', label: 'Juillet' },
    { value: '08', label: 'Août' },
    { value: '09', label: 'Septembre' },
    { value: '10', label: 'Octobre' },
    { value: '11', label: 'Novembre' },
    { value: '12', label: 'Décembre' }
  ];

  days = Array.from({ length: 31 }, (_, i) =>
    (i + 1).toString().padStart(2, '0')
  );

  newJour: JourFerie = {
    date: '',
    nom: '',
    recurrentAnnuel: false,
    description: ''
  };

  // ===============================
  // LOAD FROM BACKEND
  // ===============================
  ngOnInit(): void {
    this.loadJoursFeries();
    this.loadCalendrier();
  }

  loadCalendrier(): void {
  this.http.get<any>('/api/calendrier').subscribe({
    next: (cal) => {
      if (cal.startTime) this.heureDebut = cal.startTime.substring(0, 5);
      if (cal.endTime)   this.heureFin   = cal.endTime.substring(0, 5);
      if (cal.lunchBreakMinutes) this.pause = cal.lunchBreakMinutes;
      this.jours[0].selected = cal.monday    || false;
      this.jours[1].selected = cal.tuesday   || false;
      this.jours[2].selected = cal.wednesday || false;
      this.jours[3].selected = cal.thursday  || false;
      this.jours[4].selected = cal.friday    || false;
      this.jours[5].selected = cal.saturday  || false;
      this.jours[6].selected = cal.sunday    || false;
    },
    error: (err) => console.error(err)
  });
}
  loadJoursFeries(): void {
    this.jourFerieService.getAll().subscribe(data => {
      this.joursFeries = data;
    });
  }

  // ===============================
  // MODAL
  // ===============================
  openModal(): void {
    this.resetForm();
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingIndex = null;
  }

  resetForm(): void {
    this.newJour = {
      date: '',
      nom: '',
      recurrentAnnuel: false,
      description: ''
    };
  }

  editJour(jour: JourFerie) {
  this.newJour = { ...jour };
  this.editingIndex = this.joursFeries.indexOf(jour);
  this.showModal = true;
}

  // ===============================
  // GESTION DATE RÉCURRENT
  // ===============================
  onRecurrentDateChange(event: any): void {
    const fullDate = event.target.value;
    if (!fullDate) return;

    const [year, month, day] = fullDate.split('-');

    // Pour LocalDate backend on garde format yyyy-MM-dd
    this.newJour.date = `${year}-${month}-${day}`;
  }

  // ===============================
  // CREATE / UPDATE
  // ===============================
 addJourFerie(): void {

  if (!this.newJour.nom) {
    this.showErrorToast();
    return;
  }

  if (!this.newJour.date) {
    this.showErrorToast();
    return;
  }

  const parts = this.newJour.date.split('-');

  if (parts.length !== 3) {
    this.showErrorToast();
    return;
  }

  // 🔵 CAS NON RÉCURRENT → année obligatoire
  if (!this.newJour.recurrentAnnuel && parts[0].length !== 4) {
    this.showErrorToast();
    return;
  }

  // 🔵 CAS RÉCURRENT → on ne vérifie PAS l'année
  // On garde la date telle qu’elle est
  // Backend LocalDate sera content

  if (this.editingIndex !== null && this.newJour.id) {

    this.jourFerieService.update(this.newJour)
      .subscribe(() => this.loadJoursFeries());

  } else {

    this.jourFerieService.create(this.newJour)
      .subscribe(() => this.loadJoursFeries());
  }

  this.resetForm();
  this.showModal = false;
}
  // ===============================
  // DELETE
  // ===============================
  deleteJour(jour: JourFerie): void {

    if (!jour.id) return;

    this.jourFerieService.delete(jour.id).subscribe(() => {
      this.loadJoursFeries();
    });
  }
  showErrorToast(): void {

  this.errorToast = true;

  setTimeout(() => {
    this.errorToast = false;
  }, 3000);
}

  // ===============================
  // FORMAT DATE DISPLAY
  // ===============================
  formatDate(dateString: string, recurrent?: boolean): string {

  if (!dateString) return '';

  const date = new Date(dateString);

  if (recurrent) {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long'
    });
  }

  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}
// ===============================
// SAVE CALENDRIER
// ===============================
saveCalendrier(): void {
  const payload = {
    startTime: this.heureDebut,
    endTime: this.heureFin,
    lunchBreakMinutes: this.pause,
    monday:    this.getJour('Lundi'),
    tuesday:   this.getJour('Mardi'),
    wednesday: this.getJour('Mercredi'),
    thursday:  this.getJour('Jeudi'),
    friday:    this.getJour('Vendredi'),
    saturday:  this.getJour('Samedi'),
    sunday:    this.getJour('Dimanche')
  };

  this.http.put('/api/calendrier', payload)
    .subscribe({
      next: () => console.log("Calendrier mis à jour ✅"),
      error: (err) => console.error("❌ Erreur", err)
    });
}

// ===============================
// HELPER
// ===============================
getJour(name: string): boolean {
  return this.jours.find(j => j.name === name)?.selected || false;
}

// ===============================
// AUTO UPDATE
// ===============================
onCalendarChange(): void {

  if (this.timer) {
    clearTimeout(this.timer);
  }

  this.timer = setTimeout(() => {
    this.saveCalendrier();
  }, 500);

}

// ===============================
// RELOAD PREVIEW
// ===============================
reloadPlanningPreview(): void {

  console.log("🔄 Recalcul planning...");

  // exemple simple (tu peux adapter)
  this.http.post('/api/plannings/preview/1', {
    dateDebut: new Date(),
    ressources: [],
    riskBuffer: 0,
    sequentialPhases: true
  }).subscribe(res => {
    console.log("Preview planning :", res);
  });

}
}