import {
  Component, Input, OnChanges,
  SimpleChanges, AfterViewInit,
  ElementRef, ViewChild, NgZone
} from '@angular/core';
import { Planning } from '../../../models/planning.model';

declare var gantt: any;

@Component({
  selector: 'app-planning-gantt',
  template: `
    <div class="bg-white rounded-2xl border shadow-sm p-4">
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-semibold">Diagramme de Gantt</h3>
        <div class="flex gap-2">
          <button *ngFor="let z of zoomLevels"
                  (click)="setZoom(z.value)"
                  [class.bg-blue-600]="currentZoom === z.value"
                  [class.text-white]="currentZoom === z.value"
                  [class.bg-gray-100]="currentZoom !== z.value"
                  class="px-3 py-1.5 rounded text-sm">
            {{ z.label }}
          </button>
        </div>
      </div>
      <div #ganttContainer style="width:100%; height:500px;"></div>
    </div>
  `
})
export class PlanningGanttComponent implements OnChanges, AfterViewInit {

  @Input() planning!: Planning;
  @Input() phases: any[] = [];
  @ViewChild('ganttContainer') ganttContainer!: ElementRef;

  currentZoom = 'week';
  viewReady = false;

  zoomLevels = [
    { label: 'Jour',    value: 'day'   },
    { label: 'Semaine', value: 'week'  },
    { label: 'Mois',    value: 'month' },
    { label: 'Année',   value: 'year'  }
  ];

  constructor(private zone: NgZone) {}

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.initGantt();
      this.viewReady = true;
      if (this.phases?.length) this.loadData();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.viewReady && (changes['phases'] || changes['planning'])) {
      this.zone.runOutsideAngular(() => this.loadData());
    }
  }

  initGantt(): void {
    gantt.config.date_format = '%Y-%m-%d';
    gantt.config.fit_tasks = true;
    gantt.config.open_tree_initially = true;

    gantt.ext.zoom.init({
      levels: [
        {
          name: 'day',
          scale_height: 50,
          scales: [
            { unit: 'month', format: '%F %Y' },
            { unit: 'day',   format: '%d %M' }
          ]
        },
        {
          name: 'week',
          scale_height: 50,
          scales: [
            { unit: 'month', format: '%F %Y' },
            { unit: 'week',  format: 'W%W'   }
          ]
        },
        {
          name: 'month',
          scale_height: 50,
          scales: [
            { unit: 'year',  format: '%Y' },
            { unit: 'month', format: '%F' }
          ]
        },
        {
          name: 'year',
          scale_height: 50,
          scales: [
            { unit: 'year', format: '%Y' }
          ]
        }
      ]
    });

    gantt.ext.zoom.setLevel('week');

    gantt.config.columns = [
      { name: 'text',       label: 'Nom de la phase', tree: true, width: 200 },
      { name: 'start_date', label: 'Début',           width: 100, align: 'center' },
      { name: 'end_date',   label: 'Fin',             width: 100, align: 'center' },
      { name: 'progress',   label: 'Progression',     width: 100, align: 'center',
        template: (task: any) => Math.round(task.progress * 100) + '%' }
    ];

    gantt.templates.task_class = (_s: any, _e: any, task: any) => {
      switch (task.statut) {
        case 'Terminé':   return 'gantt-done';
        case 'En cours':  return 'gantt-progress';
        case 'En retard': return 'gantt-late';
        case 'Bloqué':    return 'gantt-blocked';
        default:          return 'gantt-pending';
      }
    };

    gantt.init(this.ganttContainer.nativeElement);
  }

  loadData(): void {
    if (!this.phases?.length || !this.planning) return;

    const tasks = this.phases.map((p, i) => ({
      id:         p.id || i + 1,
      text:       p.nom,
      start_date: this.formatDate(p.debutPrevu || p.dateDebut),
      end_date:   this.formatDate(p.finPrevue  || p.dateFin),
      progress:   (p.progression || 0) / 100,
      statut:     p.statut,
      open:       true
    }));

    gantt.clearAll();
    gantt.parse({ data: tasks, links: [] });
  }

  setZoom(level: string): void {
    this.currentZoom = level;
    this.zone.runOutsideAngular(() => {
      gantt.ext.zoom.setLevel(level);
    });
  }

  formatDate(d: any): string {
    if (!d) return '';
    const date = new Date(d);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}