import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-ui-spec-detail',
  templateUrl: './ui-spec-detail.component.html',
  styleUrls: ['./ui-spec-detail.component.css']
})
export class UiSpecDetailComponent implements OnInit {

  specAfdId!: number;
  uiuxId!: number;
  item: any = null;
  loading = true;
  saving = false;

  // Sections collapsibles
  sections: any[] = [
    { id: 'resume',     label: '1. Résumé Fonctionnel',        open: true  },
    { id: 'flux',       label: '2. Flux Utilisateur',           open: true  },
    { id: 'ecrans',     label: '3. Définitions des Écrans',     open: false },
    { id: 'mapping',    label: '4. Mapping des Composants',     open: false },
    { id: 'interaction',label: '5. Règles d\'Interaction',      open: false },
    { id: 'access',     label: '6. Accessibilité & Règles UX',  open: false },
    { id: 'responsive', label: '7. Comportement Responsive',    open: false },
    { id: 'figma',      label: '8. Générateur de Prompt Figma', open: false },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.specAfdId = Number(this.route.snapshot.paramMap.get('specAfdId'));
    this.uiuxId    = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  load(): void {
    this.http.get<any>(
      `/api/ui-spec-afd/${this.specAfdId}`
    ).subscribe({
      next: (data) => {
        this.item = data;
        // Si pas encore de contenu généré → générer par défaut
        if (!this.item.resumeFonctionnel) {
          this.generateDefaultContent();
        }
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  generateDefaultContent(): void {
    const afd = this.item.afd;
    if (!afd) return;

    this.item.resumeFonctionnel = afd.description || 
      `Ce module permet ${afd.intitule?.toLowerCase()}.`;

    this.item.fluxUtilisateur = afd.fluxNominal || 
      `1. L'utilisateur accède à la fonctionnalité\n2. L'utilisateur effectue l'action\n3. Le système confirme`;

    this.item.definitionsEcrans = 
      `Écran principal: ${afd.intitule}\nObjectif: ${afd.objectif || 'Voir description AFD'}`;

    this.item.mappingComposants = 
      `Formulaires: FormGroup avec validation\nBoutons: Primary + Secondary\nAlerts: Toast success/error`;

    this.item.reglesInteraction = 
      `Loading States: Spinner pendant l'enregistrement\nValidation: Temps réel sur blur\nConfirmations: Toast après action`;

    this.item.accessibilite = 
      `Niveau: WCAG AA\nNavigation clavier: Tab, Enter, Escape\nARIA: Labels et descriptions sur tous les éléments`;

    this.item.comportementResponsive = 
      `Desktop: Layout full\nMobile: 1 colonne, boutons full-width\nTablet: Adapté`;

    this.item.figmaPrompt = 
      `Create a ${afd.intitule} interface with:\n- Clean, professional layout\n- Form validation\n- Responsive design\n- WCAG AA accessibility`;
  }

  toggleSection(id: string): void {
    const s = this.sections.find(s => s.id === id);
    if (s) s.open = !s.open;
  }

  save(): void {
    this.saving = true;
    this.http.put<any>(
      `/api/ui-spec-afd/${this.specAfdId}`,
      this.item
    ).subscribe({
      next: (data) => {
        this.item = data;
        this.saving = false;
      },
      error: (err) => {
        console.error(err);
        this.saving = false;
      }
    });
  }

  valider(): void {
    this.http.put<any>(
      `/api/ui-spec-afd/${this.specAfdId}/valider`,
      {}
    ).subscribe({
      next: (data) => this.item = data,
      error: (err) => console.error(err)
    });
  }

  copyPrompt(): void {
    navigator.clipboard.writeText(this.item.figmaPrompt || '');
  }

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'Validé':   return 'bg-green-100 text-green-700';
      case 'Généré':   return 'bg-blue-100 text-blue-700';
      case 'Obsolète': return 'bg-orange-100 text-orange-700';
      default:         return 'bg-gray-100 text-gray-500';
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/uiux', this.uiuxId]);
  }
}