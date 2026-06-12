import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UiuxSpecificationService } from '../../../services/uiux-specification.service';
import { UiuxSpecification } from '../../../models/uiux-specification.model';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-uiux-detail',
  templateUrl: './uiux-detail.component.html',
  styleUrls: ['./uiux-detail.component.css']
})
export class UiuxDetailComponent implements OnInit {

  specId!: number;
  spec!: UiuxSpecification;
  loading = true;
  activeTab = 'overview';

  tabs = [
    { id: 'overview',      label: 'Overview' },
    { id: 'design-rules',  label: 'Design Rules' },
    { id: 'components',    label: 'Components' },
    { id: 'layout',        label: 'Layout System' },
    { id: 'interactions',  label: 'Interactions' },
    { id: 'accessibilite', label: 'Accessibilité' },
    { id: 'ui-spec-afd',   label: 'UI Spec by AFD' },
    { id: 'figma-prompt',  label: 'Figma Prompt' }
  ];

  // Données générées
  paletteColors: any[] = [];
  systemeTypo: any = null;
  systemeEspacement: any[] = [];
  elevation: any[] = [];
  afds: any[] = [];
  uiSpecAfds: any[] = [];
customInstruction = '';
promptText = '';

components = [
  {
    name: 'Buttons',
    variants: ['Primary', 'Secondary', 'Outline', 'Ghost', 'Destructive'],
    states: ['Default', 'Hover', 'Active', 'Disabled', 'Loading']
  },
  {
    name: 'Forms',
    variants: ['Text Input', 'Select', 'Checkbox', 'Radio', 'Switch', 'Textarea'],
    states: ['Default', 'Focus', 'Error', 'Disabled', 'Success']
  },
  {
    name: 'Tables',
    variants: ['Basic', 'Sortable', 'Filterable', 'Expandable'],
    states: ['Default', 'Hover Row', 'Selected Row', 'Loading', 'Empty']
  },
  {
    name: 'Modals',
    variants: ['Small', 'Medium', 'Large', 'Fullscreen'],
    states: ['Open', 'Closing', 'With Footer', 'Scrollable']
  },
  {
    name: 'Navigation',
    variants: ['Top Nav', 'Side Nav', 'Breadcrumb', 'Tabs'],
    states: ['Default', 'Active', 'Collapsed', 'Mobile']
  },
  {
    name: 'Cards',
    variants: ['Basic', 'With Image', 'With Actions', 'Interactive'],
    states: ['Default', 'Hover', 'Selected', 'Loading']
  },
  {
    name: 'Alerts',
    variants: ['Info', 'Success', 'Warning', 'Error'],
    states: ['Default', 'Dismissible', 'With Action']
  },
  {
    name: 'Empty States',
    variants: ['No Data', 'No Results', 'Error', 'Success'],
    states: ['Default', 'With Action', 'With Illustration']
  }
];
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private uiuxService: UiuxSpecificationService,
    private http: HttpClient 
  ) {}

  ngOnInit(): void {
    this.specId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadSpec();
  }

  loadSpec(): void {
    this.uiuxService.getById(this.specId).subscribe({
      next: (data) => {
        this.spec = data;
        this.generateContent();
        this.loadAfds();
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  

loadAfds(): void {
  this.http.get<any[]>(
    `/api/ui-spec-afd/uiux/${this.specId}`
  ).subscribe({
    next: (data) => {
      this.uiSpecAfds = data;
      console.log('UI SPEC AFD:', data); // 🔥 DEBUG
    },
    error: (err) => console.error(err)
  });
}


  generateContent(): void {
  // Palette — déjà dynamique ✅

  // Typographie basée sur preferenceTypo
  const fontMap: Record<string, string> = {
    'Inter':      'Inter, system-ui, sans-serif',
    'Roboto':     'Roboto, Arial, sans-serif',
    'Open Sans':  'Open Sans, sans-serif',
    'Poppins':    'Poppins, sans-serif',
    'Custom':     'Custom font family'
  };

  this.systemeTypo = {
    fontFamily: fontMap[this.spec.preferenceTypo || 'Inter'] || 'Inter, system-ui, sans-serif',
    scale: this.getTypoScale(this.spec.complexiteUx || '')
  };

  // Espacement basé sur styleDesign
  this.systemeEspacement = this.getEspacementScale(this.spec.styleDesign || '');

  // Élévation basée sur complexiteUx
  this.elevation = this.getElevation(this.spec.complexiteUx || '');
}

getTypoScale(complexite: string): any[] {
  if (complexite === 'Simple') {
    return [
      { label: 'Heading 1', value: '2rem / 32px (Bold)' },
      { label: 'Heading 2', value: '1.5rem / 24px (Bold)' },
      { label: 'Body',      value: '1rem / 16px (Regular)' },
      { label: 'Small',     value: '0.875rem / 14px (Regular)' }
    ];
  } else if (complexite === 'Enterprise') {
    return [
      { label: 'Heading 1', value: '2.25rem / 36px (Bold)' },
      { label: 'Heading 2', value: '1.875rem / 30px (Bold)' },
      { label: 'Heading 3', value: '1.5rem / 24px (Semibold)' },
      { label: 'Body',      value: '1rem / 16px (Regular)' },
      { label: 'Small',     value: '0.875rem / 14px (Regular)' }
    ];
  } else {
    return [
      { label: 'Display',   value: '3rem / 48px (Bold)' },
      { label: 'Heading 1', value: '2.25rem / 36px (Bold)' },
      { label: 'Heading 2', value: '1.875rem / 30px (Semibold)' },
      { label: 'Heading 3', value: '1.5rem / 24px (Semibold)' },
      { label: 'Body',      value: '1rem / 16px (Regular)' },
      { label: 'Caption',   value: '0.75rem / 12px (Regular)' }
    ];
  }
}

getEspacementScale(style: string): any[] {
  if (style === 'Minimal') {
    return [
      { label: 'Base: 8px (0.5rem)' },
      { label: 'sm: 8px (0.5rem)' },
      { label: 'md: 24px (1.5rem)' },
      { label: 'lg: 40px (2.5rem)' },
      { label: 'xl: 64px (4rem)' }
    ];
  } else if (style === 'Luxury') {
    return [
      { label: 'Base: 8px (0.5rem)' },
      { label: 'sm: 16px (1rem)' },
      { label: 'md: 32px (2rem)' },
      { label: 'lg: 56px (3.5rem)' },
      { label: 'xl: 80px (5rem)' }
    ];
  } else {
    return [
      { label: 'Base: 4px (0.25rem)' },
      { label: 'xs: 4px (0.25rem)' },
      { label: 'sm: 8px (0.5rem)' },
      { label: 'md: 16px (1rem)' },
      { label: 'lg: 24px (1.5rem)' },
      { label: 'xl: 32px (2rem)' },
      { label: '2xl: 48px (3rem)' }
    ];
  }
}

getElevation(complexite: string): any[] {
  if (complexite === 'Simple') {
    return [
      { label: 'Level 1 - Cards',     value: 'box-shadow: 0 1px 2px rgba(0,0,0,0.05)' },
      { label: 'Level 2 - Modals',    value: 'box-shadow: 0 4px 6px rgba(0,0,0,0.07)' }
    ];
  } else {
    return [
      { label: 'Level 1 - Cards',     value: 'box-shadow: 0 1px 3px rgba(0,0,0,0.1)' },
      { label: 'Level 2 - Dropdowns', value: 'box-shadow: 0 4px 6px rgba(0,0,0,0.1)' },
      { label: 'Level 3 - Modals',    value: 'box-shadow: 0 10px 15px rgba(0,0,0,0.1)' },
      { label: 'Level 4 - Overlays',  value: 'box-shadow: 0 20px 25px rgba(0,0,0,0.15)' }
    ];
  }
}

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'Validé':    return 'bg-green-100 text-green-700';
      case 'Généré':    return 'bg-blue-100 text-blue-700';
      case 'Brouillon': return 'bg-gray-100 text-gray-600';
      default:          return 'bg-gray-100 text-gray-500';
    }
  }

  valider(): void {
    this.uiuxService.valider(this.specId).subscribe({
      next: (updated) => this.spec = updated,
      error: (err) => console.error(err)
    });
  }

  exportMarkdown(): void {
    if (!this.spec) return;
    const content = `# ${this.spec.nom}\n\n` +
      `## Résumé\n` +
      `- Projet: ${this.spec.projet?.nom}\n` +
      `- Plateformes: ${this.spec.plateformes?.join(', ')}\n` +
      `- Style: ${this.spec.styleDesign}\n` +
      `- Complexité UX: ${this.spec.complexiteUx}\n\n` +
      `## Palette de couleurs\n` +
      `- Primary: ${this.spec.couleurPrimaire}\n` +
      `- Secondary: ${this.spec.couleurSecondaire}\n` +
      `- Accent: ${this.spec.couleurAccent}\n\n` +
      `## Typographie\n` +
      `- Font: ${this.spec.preferenceTypo}\n\n` +
      `## Accessibilité\n` +
      `- Niveau: ${this.spec.niveauAccessibilite}\n` +
      `- Multi-langue: ${this.spec.supportMultiLangue ? 'Oui' : 'Non'}\n` +
      `- Dark mode: ${this.spec.darkMode ? 'Oui' : 'Non'}\n`;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.spec.code}-design-spec.md`;
    a.click();
    URL.revokeObjectURL(url);
  }
getFigmaPrompt(): string {
  if (!this.spec) return '';
  return `Create a modern ${this.spec.styleDesign?.toLowerCase()} ${this.spec.projet?.nom} dashboard with:\n` +
    `- Clean, professional layout\n` +
    `- Primary color: ${this.spec.couleurPrimaire}\n` +
    `- Secondary color: ${this.spec.couleurSecondaire}\n` +
    `- Accent color: ${this.spec.couleurAccent}\n` +
    `- Typography: ${this.spec.preferenceTypo} font family\n` +
    `- Components: navigation sidebar, data tables, cards, charts\n` +
    `- Responsive design for ${this.spec.plateformes?.join(' and ')}\n` +
    `- ${this.spec.niveauAccessibilite} accessibility compliance\n` +
    (this.spec.darkMode ? `- Light and dark mode support\n` : '') +
    (this.spec.supportMultiLangue ? `- Multi-language support (RTL/LTR)\n` : '');
}

copyPrompt(): void {
  navigator.clipboard.writeText(this.getFigmaPrompt());
}

applyAdjustment(type: string): void {
  console.log('Adjustment:', type);
}

applyCustomInstruction(): void {
  console.log('Custom instruction:', this.customInstruction);
  this.customInstruction = '';
}

getComponentsForAfd(afd: any): string[] {
  const title = afd.intitule?.toLowerCase() || '';
  if (title.includes('auth') || title.includes('login')) {
    return ['Form', 'Input', 'Button', 'Alert', 'Card'];
  } else if (title.includes('liste') || title.includes('gestion')) {
    return ['Table', 'Button', 'Modal', 'Filter', 'Pagination'];
  } else if (title.includes('dashboard') || title.includes('rapport')) {
    return ['Chart', 'Card', 'Table', 'Badge', 'Navigation'];
  } else {
    return ['Form', 'Button', 'Card', 'Alert'];
  }
}

getLayoutForAfd(afd: any): string {
  const title = afd.intitule?.toLowerCase() || '';
  if (title.includes('auth') || title.includes('login')) {
    return 'Centered Layout — max 400px, card centré verticalement';
  } else if (title.includes('liste') || title.includes('gestion')) {
    return 'Full Width Layout — header + table + pagination';
  } else {
    return 'Dashboard Layout — sidebar + content area';
  }
}

getNavigationForAfd(afd: any): string {
  const title = afd.intitule?.toLowerCase() || '';
  if (title.includes('auth') || title.includes('login')) {
    return 'Pas de navigation — page isolée';
  } else {
    return 'Breadcrumb + sidebar navigation active';
  }
}

getInteractionsForAfd(afd: any): string {
  const title = afd.intitule?.toLowerCase() || '';
  if (title.includes('auth') || title.includes('login')) {
    return 'Validation temps réel, feedback erreur, redirect après succès';
  } else if (title.includes('liste') || title.includes('gestion')) {
    return 'Tri colonnes, filtres, CRUD modal, confirmation suppression';
  } else {
    return 'Formulaire avec validation, toast notifications';
  }
}
  goBack(): void {
    this.router.navigate(['/admin/uiux']);
  }
  genererUiSpec(item: any): void {
  this.http.put<any>(
    `/api/ui-spec-afd/${item.id}/generer`, {}
  ).subscribe({
    next: () => this.loadAfds(),
    error: (err) => console.error(err)
  });
}

regenererUiSpec(item: any): void {
  this.http.put<any>(
    `/api/ui-spec-afd/${item.id}/regenerer`, {}
  ).subscribe({
    next: () => this.loadAfds(),
    error: (err) => console.error(err)
  });
}

  
}