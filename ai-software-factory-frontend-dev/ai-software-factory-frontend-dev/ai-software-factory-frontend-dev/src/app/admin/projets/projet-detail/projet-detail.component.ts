import { Component, OnInit, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ProjetService } from '../../../services/projet.service';
import { UserService } from '../../../services/user.service';
import { ValidationService } from '../../../services/validation.service';
import { ChiffrageService, Composante } from '../../../services/chiffrage.service';
import { HardwareGroupService } from '../../../services/hardware-group.service';
import { ProduitService } from '../../../services/produit.service';
import { ModuleService } from '../../../services/module.service';
import { Projet, Exigence } from '../../../models/projet.model';
import { HardwareGroup } from '../../../models/hardware-group.model';
import { Produit } from '../../../models/produit.model';
import { Module } from '../../../models/module.model';
import {
  Chiffrage, ChiffrageHardware, ChiffrageHardwareLigne,
  ChiffrageLicence, ChiffrageLicenceLigne,
  ChiffrageServices, ChiffrageServicesLigne,
  ChiffrageExigences, ChiffrageExigenceLigne,
  ChiffrageTotal, LicencePalier
} from '../../../models/chiffrage.model';
import { User } from '../../../models/user.model';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ObjectifGroupe {
  objectif: string;
  exigences: Exigence[];
}

interface SourceDocumentItem {
  nom: string;
  typeLabel: string;
  dateUpload?: string;
}

@Component({
  selector: 'app-projet-detail',
  templateUrl: './projet-detail.component.html',
  styleUrls: ['./projet-detail.component.css']
})
export class ProjetDetailComponent implements OnInit {
  currentUser: User | null = null;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
      this.showExportMenu = false;
      this.showChiffrageMenu = false;
    }
  }
  sidebarOpen = true;
  projet: Projet | null = null;
  isLoading = false;
  isSavingExigence = false;
  loadError = '';
  saveError = '';
  activeTab: 'exigences' | 'objectifs' | 'modifications' | 'dashboard' = 'exigences';
  showExigenceForm = false;

  // Validation exigences
  users: User[] = [];
  validatingIndex: number | null = null;
  validationForm = { validateurNom: '', commentaire: '' };
  isSavingValidation = false;
  validationError = '';

  // Demande validation projet
  showDemandeModal = false;
  demandeValidateurId: string | null = null;
  demandeValidateurs: any[] = [];
  isSubmittingDemande = false;
  demandeError = '';
  demandeSuccessMsg = '';

  // Modification / suppression exigences
  editingExigenceIndex: number | null = null;
  editingExigence: Exigence = { type: 'Fonctionnel', intitule: '', objectifClient: '', description: '', solutionProposee: '', limitesHypotheses: '' };
  isSavingEdit = false;
  editError = '';

  newExigence: Exigence = {
    type: 'Fonctionnel',
    intitule: '',
    objectifClient: '',
    description: '',
    solutionProposee: '',
    limitesHypotheses: ''
  };

  // ─── Section active (besoins / chiffrage) ─────────────────────────────────
  activeSection: 'besoins' | 'chiffrage' = 'besoins';
  activeChiffrageTab: 'hardware' | 'licence' | 'services' | 'exigences' | 'total' = 'hardware';
  showChiffrageMenu = false;
  isSavingChiffrage = false;
  chiffrageSaved = false;

  // ─── Données chiffrage ────────────────────────────────────────────────────
  chiffrage: Chiffrage = this.defaultChiffrage();
  showHwGroupModal = false;

  // ─── Référentiels chiffrage ───────────────────────────────────────────────
  allHardwareGroups: HardwareGroup[] = [];
  hwGroupSearch = '';
  allProduits: Produit[] = [];
  licenceModules: Module[] = [];
  licencePaliers: LicencePalier[] = [];
  showLicenceModuleModal = false;
  licenceModuleSearch = '';
  selectedLicenceModuleIds = new Set<number>();
  allComposantes: Composante[] = [];
  chiffrageLoaded = false;
  showDeviseEquivalent = false;
  editingComposanteRows = new Set<number>();
  showComposanteModal = false;
  composanteModalSearch = '';

  // ─── Section active (besoins / chiffrage) END ─────────────────────────────

  menuItems = [
    { icon: 'home', label: 'Tableau de bord', route: '/admin/dashboard', active: false, roles: ['ADMIN', 'CHEF_DE_PROJET', 'EDITEUR', 'LECTEUR'] },
    { icon: 'document', label: 'Besoin projet', route: '/admin/projets', active: true, roles: ['ADMIN', 'CHEF_DE_PROJET', 'EDITEUR', 'LECTEUR'] },
    { icon: 'chart', label: 'Analyse fonctionnelle', route: '/admin/analyse', active: false, roles: ['ADMIN', 'CHEF_DE_PROJET'] },
    { icon: 'test', label: 'Tests', route: '/admin/tests', active: false, roles: ['ADMIN', 'CHEF_DE_PROJET'] },
    { icon: 'settings', label: 'Paramètres', route: '/admin/parametres', active: false, roles: ['ADMIN'] }
  ];

  get visibleMenuItems() {
    const role = this.authService.currentUserValue?.role || '';
    return this.menuItems.filter(item => item.roles.includes(role));
  }

  get canEditExigences(): boolean {
    const role = this.authService.currentUserValue?.role || '';
    return role === 'ADMIN' || role === 'CHEF_DE_PROJET' || role === 'EDITEUR';
  }

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private projetService: ProjetService,
    private userService: UserService,
    private validationService: ValidationService,
    private chiffrageService: ChiffrageService,
    private hardwareGroupService: HardwareGroupService,
    private produitService: ProduitService,
    private moduleService: ModuleService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe((user: User | null) => {
      this.currentUser = user;
    });

    // Charger la liste des validateurs (endpoint accessible à tous les rôles)
    this.loadUsers();

    const projetId = this.route.snapshot.paramMap.get('id');
    if (projetId) {
      this.loadProjet(+projetId);
    }
  }

  loadProjet(id: number): void {
    this.isLoading = true;
    this.loadError = '';
    console.log('🔍 Chargement du projet ID:', id);
    this.projetService.getProjetById(id).subscribe({
      next: (projet) => {
        this.projet = projet;
        this.isLoading = false;
        console.log('✅ Projet chargé:', this.projet);
      },
      error: (error) => {
        console.error('❌ Erreur chargement projet:', error);
        console.error('❌ Détails erreur:', error.error);
        console.error('❌ Status:', error.status);
        this.loadError = `Impossible de charger le projet. ${error.status ? 'Erreur ' + error.status : ''} ${error.error?.message || error.message || ''}`;
        this.isLoading = false;
      }
    });
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  setActiveMenu(index: number): void {
    this.menuItems.forEach((item, i) => {
      item.active = i === index;
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/projets']);
  }

  setActiveTab(tab: 'exigences' | 'objectifs' | 'modifications' | 'dashboard'): void {
    this.activeTab = tab;
    if (tab === 'dashboard' && !this.chiffrageLoaded && this.projet?.id) {
      this.loadChiffrage(this.projet.id);
    }
  }

  // ─── Dashboard computed properties ────────────────────────────────────────

  get dashExParType(): { label: string; count: number; pct: number; color: string }[] {
    const exs = this.getExigences();
    const total = exs.length || 1;
    const norm = (v: string) => v.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[-\s]+/g, ' ').trim();
    const types = [
      { label: 'Fonctionnelle',     color: '#3b82f6', match: (t: string) => norm(t) === 'fonctionnel' || norm(t) === 'fonctionnelle' },
      { label: 'Non-fonctionnelle', color: '#8b5cf6', match: (t: string) => norm(t).startsWith('non') },
      { label: 'Sécurité',          color: '#ef4444', match: (t: string) => norm(t).includes('secur') },
      { label: 'Performance',       color: '#f59e0b', match: (t: string) => norm(t) === 'performance' },
    ];
    const result = types.map(t => ({
      label: t.label, color: t.color,
      count: exs.filter(e => t.match(e.type || '')).length,
      pct: 0
    }));
    const other = exs.length - result.reduce((s, r) => s + r.count, 0);
    if (other > 0) result.push({ label: 'Autre', color: '#9ca3af', count: other, pct: 0 });
    return result.filter(r => r.count > 0).map(r => ({ ...r, pct: (r.count / total) * 100 }));
  }

  get dashDonutType(): string {
    const cats = this.dashExParType.filter(c => c.count > 0);
    if (!cats.length) return 'conic-gradient(#e5e7eb 0% 100%)';
    const tot = cats.reduce((s, c) => s + c.count, 0);
    let start = 0;
    const segs = cats.map(c => {
      const pct = (c.count / tot) * 100;
      const seg = `${c.color} ${start.toFixed(1)}% ${(start + pct).toFixed(1)}%`;
      start += pct;
      return seg;
    });
    return `conic-gradient(${segs.join(', ')})`;
  }

  get dashExParStatut(): { label: string; count: number; pct: number; color: string }[] {
    const exs = this.getExigences();
    const total = exs.length || 1;
    return [
      { label: 'Validées',   color: '#10b981', count: exs.filter(e => this.normalizeText(e.statut || '') === 'validee').length,     pct: 0 },
      { label: 'En attente', color: '#f59e0b', count: exs.filter(e => !e.statut || this.normalizeText(e.statut) === 'en attente').length, pct: 0 },
      { label: 'À revoir',   color: '#ef4444', count: exs.filter(e => this.normalizeText(e.statut || '') === 'a revoir').length,    pct: 0 },
    ].filter(s => s.count > 0).map(s => ({ ...s, pct: (s.count / total) * 100 }));
  }

  get dashTauxValidation(): number {
    const exs = this.getExigences();
    if (!exs.length) return 0;
    const validated = exs.filter(e => this.normalizeText(e.statut || '') === 'validee').length;
    return Math.round((validated / exs.length) * 100);
  }

  get dashCoutParCategorie(): { label: string; valeur: number; pct: number; color: string }[] {
    const hw  = this.getHwTotal();
    const lic = this.getLicenceTotal();
    const svc = this.getServicesTotal() + this.getExigencesCout();
    const base = hw + lic + svc || 1;
    return [
      { label: 'Hardware',  valeur: hw,  color: '#3b82f6', pct: (hw  / base) * 100 },
      { label: 'Licence',   valeur: lic, color: '#8b5cf6', pct: (lic / base) * 100 },
      { label: 'Services',  valeur: svc, color: '#10b981', pct: (svc / base) * 100 },
    ].filter(c => c.valeur > 0);
  }

  get dashDernieresExigences(): Exigence[] {
    return [...this.getExigences()].reverse().slice(0, 5);
  }

  toggleExigenceForm(): void {
    this.showExigenceForm = !this.showExigenceForm;
    this.saveError = '';
    if (!this.showExigenceForm) {
      this.resetExigenceForm();
    }
  }

  addExigence(): void {
    if (!this.projet?.id) {
      this.saveError = 'Projet introuvable.';
      return;
    }

    if (!this.newExigence.intitule || !this.newExigence.objectifClient || !this.newExigence.description) {
      this.saveError = 'Veuillez remplir les champs obligatoires (Intitule, Objectif client, Description).';
      return;
    }

    this.isSavingExigence = true;
    this.saveError = '';

    const payloadExigence: Exigence = {
      type: this.newExigence.type,
      intitule: this.newExigence.intitule,
      objectifClient: this.newExigence.objectifClient,
      description: this.newExigence.description,
      solutionProposee: this.newExigence.solutionProposee,
      limitesHypotheses: this.newExigence.limitesHypotheses
    };

    this.projetService.addExigence(this.projet.id, payloadExigence).subscribe({
      next: (updatedProjet) => {
        this.projet = updatedProjet;
        this.isSavingExigence = false;
        this.showExigenceForm = false;
        this.resetExigenceForm();
      },
      error: (error) => {
        this.isSavingExigence = false;
        this.saveError = error?.error?.message || 'Erreur lors de l\'ajout de l\'exigence.';
      }
    });
  }

  resetExigenceForm(): void {
    this.newExigence = {
      type: 'Fonctionnel',
      intitule: '',
      objectifClient: '',
      description: '',
      solutionProposee: '',
      limitesHypotheses: ''
    };
  }

  getExigenceCount(): number {
    return this.projet?.exigences?.length || 0;
  }

  formatExigenceNumber(index: number): string {
    return `REQ-${String(index + 1).padStart(3, '0')}`;
  }

  getExigences(): Exigence[] {
    return this.projet?.exigences || [];
  }

  getProjectStatus(): string {
    const exigences = this.getExigences();
    if (exigences.length === 0) {
      return 'En attente';
    }

    const statuts = exigences.map(e => this.getExigenceStatus(e));
    if (statuts.some(s => this.normalizeText(s) === 'a revoir')) {
      return 'A revoir';
    }
    if (statuts.some(s => this.normalizeText(s) === 'en attente')) {
      return 'En cours';
    }
    return 'Validee';
  }

  getProjectStatusClass(): string {
    return this.getStatusClass(this.getProjectStatus());
  }

  getExigenceStatus(exigence: Exigence): string {
    return (exigence.statut || 'En attente').trim();
  }

  getStatusClass(statut: string): string {
    const value = this.normalizeText(statut);
    if (value === 'validee') {
      return 'bg-green-100 text-green-700';
    }
    if (value === 'a revoir') {
      return 'bg-orange-100 text-orange-700';
    }
    if (value === 'en cours') {
      return 'bg-blue-100 text-blue-700';
    }
    return 'bg-gray-100 text-gray-700';
  }

  getExigenceReference(exigence: Exigence): string {
    const index = this.getExigences().findIndex((e) => e === exigence || (e.id && exigence.id && e.id === exigence.id));
    return this.formatExigenceNumber(index >= 0 ? index : 0);
  }

  getObjectifGroupes(): ObjectifGroupe[] {
    const groupes = new Map<string, ObjectifGroupe>();

    this.getExigences().forEach((exigence) => {
      const objectif = (exigence.objectifClient || 'Objectif non renseigne').trim();
      const key = this.normalizeObjectif(objectif);

      if (!groupes.has(key)) {
        groupes.set(key, { objectif, exigences: [] });
      }

      groupes.get(key)?.exigences.push(exigence);
    });

    return Array.from(groupes.values());
  }

  getObjectifCount(): number {
    return this.getObjectifGroupes().length;
  }

  getAverageExigenceByObjectif(): string {
    const objectifs = this.getObjectifCount();
    if (!objectifs) {
      return '0.0';
    }
    return (this.getExigenceCount() / objectifs).toFixed(1);
  }

  getModificationCount(): number {
    const projetAny = this.projet as any;
    if (typeof projetAny?.demandesModificationCount === 'number') {
      return projetAny.demandesModificationCount;
    }
    if (Array.isArray(projetAny?.demandesModification)) {
      return projetAny.demandesModification.length;
    }
    return 0;
  }

  getSourceDocuments(): SourceDocumentItem[] {
    const projetAny = this.projet as any;
    const fallbackDate = this.projet?.dateCreation
      ? this.projet.dateCreation.split('T')[0]
      : undefined;

    if (Array.isArray(projetAny?.documents) && projetAny.documents.length > 0) {
      return projetAny.documents.map((d: any) => ({
        nom: d.nom,
        typeLabel: d.typeLabel || this.inferTypeLabel(d.nom),
        dateUpload: d.dateUpload || fallbackDate
      }));
    }

    const map = new Map<string, SourceDocumentItem>();
    this.getExigences().forEach((e) => {
      if (e.sourceDocument && !map.has(e.sourceDocument)) {
        map.set(e.sourceDocument, {
          nom: e.sourceDocument,
          typeLabel: this.inferTypeLabel(e.sourceDocument),
          dateUpload: fallbackDate
        });
      }
    });
    return Array.from(map.values());
  }

  getExigenceSourceLabel(exigence: Exigence): string {
    if (!exigence.sourceDocument) {
      return 'Source : Non renseignee';
    }
    return `Source : ${exigence.sourceDocument}${exigence.sourceSection ? ' - ' + exigence.sourceSection : ''}`;
  }

  goToEdit(): void {
    this.router.navigate(['/admin/projets'], { queryParams: { editId: this.projet?.id } });
  }

  ouvrirDemandeValidation(): void {
    if (!this.projet?.id) return;
    this.demandeValidateurId = null;
    this.demandeError = '';
    this.demandeSuccessMsg = '';
    this.demandeValidateurs = this.users.filter((u: any) =>
      u.role === 'ADMIN' || u.role === 'CHEF_DE_PROJET'
    );
    this.showDemandeModal = true;
  }

  confirmerDemandeValidation(): void {
    if (!this.demandeValidateurId || !this.projet?.id) return;
    const validateur = this.demandeValidateurs.find((u: any) =>
      u.id === this.demandeValidateurId || (u as any).keycloakId === this.demandeValidateurId
    );
    if (!validateur) return;
    this.isSubmittingDemande = true;
    this.demandeError = '';
    this.validationService.demanderValidation(this.projet.id, {
      projetNom: this.projet.nom,
      validateurId: validateur.id || (validateur as any).keycloakId,
      validateurNom: ((validateur.firstname || '') + ' ' + (validateur.lastname || '')).trim(),
      validateurEmail: validateur.email,
      lienProjet: `${window.location.origin}/login?returnUrl=%2Fadmin%2Fprojets%2F${this.projet.id}`
    }).subscribe({
      next: () => {
        this.isSubmittingDemande = false;
        this.showDemandeModal = false;
        this.demandeSuccessMsg = 'Demande envoyée à ' + ((validateur.firstname || '') + ' ' + (validateur.lastname || '')).trim();
      },
      error: (err: any) => {
        this.isSubmittingDemande = false;
        this.demandeError = err?.error?.message || 'Erreur lors de la demande de validation.';
      }
    });
  }

  showExportMenu = false;

  exporterExigences(): void {
    this.showExportMenu = !this.showExportMenu;
  }

  exporterExigencesExcel(): void {
    this.showExportMenu = false;
    const exigences = this.getExigences();
    const rows = exigences.map((e, i) => ({
      'N°':             i + 1,
      'Type':           e.type || '',
      'Intitulé':       e.intitule || '',
      'Objectif client':e.objectifClient || '',
      'Description':    e.description || '',
      'Solution proposée': e.solutionProposee || '',
      'Limites / Hypothèses': e.limitesHypotheses || '',
      'Priorité':       e.priorite || '',
      'Statut':         e.statut || 'En attente',
      'Responsable':    e.responsable || '',
      'Validateur':     e.validateur || '',
      'Commentaire':    e.commentaireValidation || ''
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    // Largeur colonnes
    ws['!cols'] = [8, 14, 30, 30, 40, 40, 30, 12, 14, 20, 20, 30].map(w => ({ wch: w }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Exigences');
    const nom = (this.projet?.nom || 'projet').replace(/[^a-zA-Z0-9_\- ]/g, '');
    XLSX.writeFile(wb, `Exigences_${nom}.xlsx`);
  }

  exporterExigencesPDF(): void {
    this.showExportMenu = false;
    const exigences = this.getExigences();
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'A4' });
    const nomProjet = this.projet?.nom || 'Projet';
    const date = new Date().toLocaleDateString('fr-FR');

    // En-tête
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 44, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`Liste des exigences — ${nomProjet}`, 32, 28);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Généré le ${date}`, doc.internal.pageSize.getWidth() - 32, 28, { align: 'right' });

    autoTable(doc, {
      startY: 56,
      head: [['N°', 'Type', 'Intitulé', 'Description', 'Priorité', 'Statut', 'Responsable']],
      body: exigences.map((e, i) => [
        i + 1,
        e.type || '',
        e.intitule || '',
        e.description || '',
        e.priorite || '',
        e.statut || 'En attente',
        e.responsable || ''
      ]),
      styles: { fontSize: 8, cellPadding: 5, overflow: 'linebreak' },
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [239, 246, 255] },
      columnStyles: {
        0: { cellWidth: 28, halign: 'center' },
        1: { cellWidth: 60 },
        2: { cellWidth: 130 },
        3: { cellWidth: 200 },
        4: { cellWidth: 50, halign: 'center' },
        5: { cellWidth: 70, halign: 'center' },
        6: { cellWidth: 80 }
      },
      margin: { left: 32, right: 32 },
      didDrawPage: (data) => {
        const pageCount = (doc as any).internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Page ${data.pageNumber} / ${pageCount}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 16,
          { align: 'center' }
        );
      }
    });

    const nom = nomProjet.replace(/[^a-zA-Z0-9_\- ]/g, '');
    doc.save(`Exigences_${nom}.pdf`);
  }

  envoyerVersJira(): void {
    window.alert('Synchronisation JIRA en preparation: connectez cette action a votre integration JIRA.');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CHIFFRAGE
  // ═══════════════════════════════════════════════════════════════════════════

  private defaultChiffrage(): Chiffrage {
    return {
      hardware:  { logistiquePct: 5, contingencePct: 10, taxeImportPct: 8, margePct: 20, lignes: [] },
      licence:   { produitId: undefined, produitNom: 'Product Beta', modeFacturation: 'Oneshot', nbUsersGlobal: 1, remiseGlobalePct: 0, appliquerRemise: false, lignes: [
        { moduleId: 1, moduleName: 'Beta Core', obligatoire: true, nbUsers: 1, pricingTier: '1\u201320 utilisateurs', prixUnitaire: 8000, discountPct: 0 }
      ] },
      services:  { devise: 'EUR', tjmEur: 600, tjmTnd: 2000, lignes: [
        { composanteId: 1, code: 'GP', libelle: 'Gestion projet', hjEstimation: 5, commentaire: 'Suivi hebdomadaire' },
        { composanteId: 2, code: 'CP', libelle: 'Cadrage projet', hjEstimation: 3, commentaire: 'Ateliers de cadrage' }
      ] },
      exigences: { lignes: [] },
      total:     { tauxChange: 3.33, remiseGlobalePct: 5, margePct: 20, tvaPct: 20, arrondi: 0.01 }
    };
  }

  ouvrirChiffrage(tab: 'hardware' | 'licence' | 'services' | 'exigences' | 'total'): void {
    this.showChiffrageMenu = false;
    this.activeChiffrageTab = tab;
    this.activeSection = 'chiffrage';
    if (!this.chiffrageLoaded && this.projet?.id) {
      this.loadChiffrage(this.projet.id);
    }
  }

  loadChiffrage(projetId: number): void {
    this.chiffrageService.getChiffrage(projetId).subscribe({
      next: (data) => {
        // Fusionner avec les valeurs par défaut pour les clés manquantes
        this.chiffrage.hardware  = data.hardware  || this.chiffrage.hardware;
        this.chiffrage.licence   = data.licence   || this.chiffrage.licence;
        this.chiffrage.services  = data.services  || this.chiffrage.services;
        // Normaliser les noms de champs backend → frontend pour les exigences
        if (data.exigences) {
          if (data.exigences.lignes) {
            data.exigences.lignes = (data.exigences.lignes as any[]).map((l: any) => ({
              id:            l.id,
              exigenceId:    l.exigenceId,
              intitule:      l.exigenceIntitule || l.intitule || '',
              type:          l.exigenceType     || l.type     || '',
              hjFonctionnel: l.hjEstimation     ?? l.hjFonctionnel ?? 0,
              hjDev:         l.hjValidation     ?? l.hjDev         ?? 0,
              hjTest:        l.hjRecette        ?? l.hjTest        ?? 0
            }));
          }
          this.chiffrage.exigences = data.exigences;
        }
        this.chiffrage.total     = data.total     || this.chiffrage.total;
        this.chiffrageLoaded = true;
        this.syncExigencesLignes();
      },
      error: () => {
        // Première fois : pas de données → on garde les valeurs par défaut
        this.chiffrageLoaded = true;
        this.syncExigencesLignes();
      }
    });
    this.loadChiffrageRefs();
  }

  loadChiffrageRefs(): void {
    this.loadPaliers();
    this.hardwareGroupService.getAll().subscribe({ next: (d) => this.allHardwareGroups = d, error: () => {} });
    this.produitService.getProduits().subscribe({ next: (d) => this.allProduits = d.filter(p => p.statut === 'Actif'), error: () => {} });
    this.chiffrageService.getComposantes().subscribe({ next: (d) => this.allComposantes = d.filter(c => c.active), error: () => {} });
    this.chiffrageService.getTjmConfig().subscribe({
      next: (t) => {
        if (!this.chiffrage.services.tjmEur) this.chiffrage.services.tjmEur = t.tjmMin;
        if (!this.chiffrage.services.tjmTnd) this.chiffrage.services.tjmTnd = t.tjmMax;
        if (!this.chiffrage.services.devise) this.chiffrage.services.devise = t.devise;
      },
      error: () => {}
    });
    if (this.chiffrage.licence.produitId) {
      this.loadModulesPourLicence(this.chiffrage.licence.produitId);
    }
  }

  private loadPaliers(): void {
    try {
      const stored = localStorage.getItem('licence_paliers');
      this.licencePaliers = stored ? JSON.parse(stored) : [];
    } catch { this.licencePaliers = []; }
  }

  getPrixFromPalier(moduleName: string, mode: string, nbUsers: number): { prixUnitaire: number; tierLabel: string } {
    const produitCode = this.allProduits.find(p => p.id === this.chiffrage.licence.produitId)?.produitCode || '';
    const type = mode as 'Oneshot' | 'Yearly';

    const matching = this.licencePaliers.filter(p =>
      p.produitCode === produitCode &&
      p.type === type &&
      (p.module === moduleName || p.module === 'Tous les modules') &&
      nbUsers >= p.nbUtilisateursMin &&
      (p.nbUtilisateursMax === null || nbUsers <= p.nbUtilisateursMax)
    );

    // Préférer le palier spécifique au module sur "Tous les modules"
    const palier = matching.find(p => p.module === moduleName) || matching[0];
    if (!palier) return { prixUnitaire: 0, tierLabel: '—' };

    const max = palier.nbUtilisateursMax === null ? '∞' : palier.nbUtilisateursMax.toString();
    const tierLabel = `${palier.nbUtilisateursMin} – ${max}`;
    return { prixUnitaire: palier.prixUnitaire, tierLabel };
  }

  onLicenceModeChange(mode: 'Oneshot' | 'Yearly'): void {
    this.chiffrage.licence.modeFacturation = mode;
    this.refreshAllLignePrix();
  }

  onLicenceNbUsersChange(): void {
    const nb = this.chiffrage.licence.nbUsersGlobal || 1;
    this.chiffrage.licence.lignes.forEach(l => l.nbUsers = nb);
    this.refreshAllLignePrix();
  }

  private refreshAllLignePrix(): void {
    const mode = this.chiffrage.licence.modeFacturation || 'Oneshot';
    const nb = this.chiffrage.licence.nbUsersGlobal || 1;
    this.chiffrage.licence.lignes.forEach(l => {
      const { prixUnitaire, tierLabel } = this.getPrixFromPalier(l.moduleName || '', mode, nb);
      l.prixUnitaire = prixUnitaire;
      l.pricingTier  = tierLabel;
      l.nbUsers      = nb;
    });
  }

  loadModulesPourLicence(produitId: number, autoPopulate = false): void {
    this.moduleService.getModulesByProduitId(produitId).subscribe({
      next: (mods) => {
        this.licenceModules = mods;
        if (autoPopulate) {
          this.autoAjouterModules(mods);
        } else {
          // Rafraîchir les prix des lignes existantes à 0 depuis les paramètres modules
          this.rafraichirPrixLignes(mods);
        }
      },
      error: () => {
        this.moduleService.getModules().subscribe({
          next: (all) => {
            this.licenceModules = all.filter(m => m.produitId === produitId);
            if (autoPopulate) this.autoAjouterModules(this.licenceModules);
            else this.rafraichirPrixLignes(this.licenceModules);
          },
          error: () => { this.licenceModules = []; }
        });
      }
    });
  }

  private rafraichirPrixLignes(mods: Module[]): void {
    const mode = this.chiffrage.licence.modeFacturation || 'Oneshot';
    const nbUsers = this.chiffrage.licence.nbUsersGlobal || 1;
    this.chiffrage.licence.lignes.forEach(l => {
      const mod = mods.find(m => m.id === l.moduleId);
      if (mod) {
        const { prixUnitaire, tierLabel } = this.getPrixFromPalier(mod.nom, mode, nbUsers);
        if (!l.prixUnitaire && prixUnitaire) l.prixUnitaire = prixUnitaire;
        l.pricingTier = tierLabel;
        l.nbUsers = nbUsers;
      }
    });
  }

  private autoAjouterModules(mods: Module[]): void {
    const mode = this.chiffrage.licence.modeFacturation || 'Oneshot';
    const nbUsers = this.chiffrage.licence.nbUsersGlobal || 1;
    mods.forEach(m => {
      if (!this.isLicenceModuleAdded(m.id!)) {
        const { prixUnitaire, tierLabel } = this.getPrixFromPalier(m.nom, mode, nbUsers);
        this.chiffrage.licence.lignes.push({
          moduleId:     m.id,
          moduleName:   m.nom,
          obligatoire:  m.obligatoire || false,
          nbUsers,
          pricingTier:  tierLabel,
          prixUnitaire,
          discountPct:  0
        });
      }
    });
  }

  onLicenceProduitChange(): void {
    const produit = this.allProduits.find(p => p.id === this.chiffrage.licence.produitId);
    this.chiffrage.licence.produitNom = produit?.nom || '';
    this.chiffrage.licence.lignes = [];
    if (produit?.id) this.loadModulesPourLicence(produit.id, true);
  }

  /** Synchronise les lignes chiffrageExigences avec les exigences du projet */
  syncExigencesLignes(): void {
    const exigences = this.getExigences();
    const existing = this.chiffrage.exigences.lignes;
    this.chiffrage.exigences.lignes = exigences.map((e, idx) => {
      const found = existing.find(l => l.exigenceId === e.id) ||
                    (e.id ? undefined : existing[idx]);
      // Toujours écraser les champs d'affichage depuis l'exigence réelle
      return {
        ...(found || {}),
        exigenceId:    e.id,
        exigenceRef:   this.formatExigenceNumber(idx),
        intitule:      e.intitule   || '',
        type:          e.type       || '',
        hjFonctionnel: found?.hjFonctionnel ?? 0,
        hjDev:         found?.hjDev         ?? 0,
        hjTest:        found?.hjTest        ?? 0
      };
    });
  }

  getExigenceTypeClass(type: string): string {
    const t = (type || '').toLowerCase();
    if (t.includes('non-fonctionnel') || t.includes('non fonctionnel')) return 'bg-purple-100 text-purple-700 border border-purple-200';
    if (t.includes('fonctionnel')) return 'bg-blue-100 text-blue-700 border border-blue-200';
    if (t.includes('sécurit') || t.includes('securit')) return 'bg-red-100 text-red-700 border border-red-200';
    if (t.includes('performance')) return 'bg-orange-100 text-orange-700 border border-orange-200';
    if (t) return 'bg-gray-100 text-gray-600 border border-gray-200';
    return 'hidden';
  }

  // ─── Hardware helpers ──────────────────────────────────────────────────────

  get hwGroupsFiltres(): HardwareGroup[] {
    const s = this.hwGroupSearch.toLowerCase();
    return this.allHardwareGroups.filter(g =>
      !s || g.label.toLowerCase().includes(s) || g.code.toLowerCase().includes(s)
    );
  }

  isHwGroupAdded(g: HardwareGroup): boolean {
    return this.chiffrage.hardware.lignes.some(l => l.hardwareGroupId === g.id);
  }

  ajouterHwGroup(g: HardwareGroup): void {
    if (this.isHwGroupAdded(g)) return;
    const basePrice = g.items?.reduce((sum, item) =>
      sum + (item.component?.unitPrice || 0) * item.quantity, 0) || 0;
    this.chiffrage.hardware.lignes.push({
      hardwareGroupId: g.id,
      categorie: g.type?.label || '',
      label: g.label,
      quantite: 1,
      prixUnitaire: basePrice
    });
  }

  retirerHwLigne(i: number): void {
    this.chiffrage.hardware.lignes.splice(i, 1);
  }

  getHwSousTotal(l: ChiffrageHardwareLigne): number {
    return l.quantite * l.prixUnitaire;
  }

  getHwBaseTotal(): number {
    return this.chiffrage.hardware.lignes.reduce((s, l) => s + this.getHwSousTotal(l), 0);
  }

  getHwLogistique(): number { return this.getHwBaseTotal() * this.chiffrage.hardware.logistiquePct / 100; }
  getHwContingence(): number { return this.getHwBaseTotal() * this.chiffrage.hardware.contingencePct / 100; }
  getHwTaxeImport(): number { return this.getHwBaseTotal() * this.chiffrage.hardware.taxeImportPct / 100; }
  getHwMarge(): number { const base = this.getHwBaseTotal() + this.getHwLogistique() + this.getHwContingence() + this.getHwTaxeImport(); return base * this.chiffrage.hardware.margePct / 100; }
  getHwTotal(): number { return this.getHwBaseTotal() + this.getHwLogistique() + this.getHwContingence() + this.getHwTaxeImport() + this.getHwMarge(); }

  // ─── Licence helpers ───────────────────────────────────────────────────────

  openLicenceModuleModal(): void {
    if (!this.chiffrage.licence.produitId) {
      alert('Veuillez sélectionner un produit.');
      return;
    }
    this.licenceModuleSearch = '';
    this.selectedLicenceModuleIds = new Set(
      this.chiffrage.licence.lignes.map(l => l.moduleId).filter(id => id != null) as number[]
    );
    this.showLicenceModuleModal = true;
  }

  get filteredLicenceModules(): Module[] {
    const term = this.licenceModuleSearch.trim().toLowerCase();
    if (!term) return this.licenceModules;
    return this.licenceModules.filter(m =>
      m.nom.toLowerCase().includes(term) || m.code.toLowerCase().includes(term)
    );
  }

  isLicenceModuleAdded(id: number): boolean {
    return this.chiffrage.licence.lignes.some(l => l.moduleId === id);
  }

  toggleLicenceModule(id: number): void {
    if (this.isLicenceModuleAdded(id)) return;
    if (this.selectedLicenceModuleIds.has(id)) {
      this.selectedLicenceModuleIds.delete(id);
    } else {
      this.selectedLicenceModuleIds.add(id);
    }
  }

  confirmerLicenceModules(): void {
    const mode = this.chiffrage.licence.modeFacturation || 'Oneshot';
    const nbUsers = this.chiffrage.licence.nbUsersGlobal || 1;
    this.licenceModules
      .filter(m => this.selectedLicenceModuleIds.has(m.id!) && !this.isLicenceModuleAdded(m.id!))
      .forEach(m => {
        const { prixUnitaire, tierLabel } = this.getPrixFromPalier(m.nom, mode, nbUsers);
        this.chiffrage.licence.lignes.push({
          moduleId:    m.id,
          moduleName:  m.nom,
          obligatoire: m.obligatoire || false,
          nbUsers,
          pricingTier: tierLabel,
          prixUnitaire,
          discountPct: 0
        });
      });
    this.showLicenceModuleModal = false;
  }

  ajouterLicenceModule(mod: Module): void {
    if (this.chiffrage.licence.lignes.some(l => l.moduleId === mod.id)) return;
    const mode = this.chiffrage.licence.modeFacturation || 'Oneshot';
    const nbUsers = this.chiffrage.licence.nbUsersGlobal || 1;
    const { prixUnitaire, tierLabel } = this.getPrixFromPalier(mod.nom, mode, nbUsers);
    this.chiffrage.licence.lignes.push({
      moduleId:    mod.id,
      moduleName:  mod.nom,
      obligatoire: mod.obligatoire || false,
      nbUsers,
      pricingTier: tierLabel,
      prixUnitaire,
      discountPct: 0
    });
  }

  retirerLicenceLigne(i: number): void {
    this.chiffrage.licence.lignes.splice(i, 1);
  }

  getLicenceSousTotal(l: ChiffrageLicenceLigne): number { return l.nbUsers * l.prixUnitaire; }
  getLicenceDiscountAmount(l: ChiffrageLicenceLigne): number { return this.getLicenceSousTotal(l) * l.discountPct / 100; }
  getLicenceFinalSousTotal(l: ChiffrageLicenceLigne): number { return this.getLicenceSousTotal(l) - this.getLicenceDiscountAmount(l); }

  getLicenceBaseTotal(): number {
    return this.chiffrage.licence.lignes.reduce((s, l) => s + this.getLicenceFinalSousTotal(l), 0);
  }

  getLicenceGlobalDiscount(): number {
    if (!this.chiffrage.licence.appliquerRemise) return 0;
    return this.getLicenceBaseTotal() * this.chiffrage.licence.remiseGlobalePct / 100;
  }

  getLicenceTotal(): number {
    return this.getLicenceBaseTotal() - this.getLicenceGlobalDiscount();
  }

  // ─── Services helpers ──────────────────────────────────────────────────────

  isModuleAdded(moduleId: number): boolean {
    return this.chiffrage.licence.lignes.some(l => l.moduleId === moduleId);
  }

  getHwGroupBasePrice(g: HardwareGroup): number {
    if (!g.items) return 0;
    return g.items.reduce((sum, item) =>
      sum + (item.component?.unitPrice || 0) * item.quantity, 0);
  }

  resetTjmStandard(): void {
    this.chiffrage.services.tjmEur = 600;
    this.chiffrage.services.tjmTnd = 2000;
    this.chiffrage.services.devise = 'EUR';
  }

  ajouterServicesLigne(): void {
    this.chiffrage.services.lignes.push({ hjEstimation: 0, commentaire: '' });
    this.editingComposanteRows.add(this.chiffrage.services.lignes.length - 1);
  }

  openComposanteModal(): void {
    this.composanteModalSearch = '';
    this.showComposanteModal = true;
  }

  isComposanteDejaAjoutee(id: number | undefined): boolean {
    if (!id) return false;
    return this.chiffrage.services.lignes.some(l => l.composanteId === id);
  }

  ajouterComposanteDepuisModal(c: Composante): void {
    if (this.isComposanteDejaAjoutee(c.id)) return;
    this.chiffrage.services.lignes.push({
      composanteId: c.id,
      code:         c.code,
      libelle:      c.libelle,
      hjEstimation: 0,
      commentaire:  ''
    });
  }

  get filteredComposantesModal(): Composante[] {
    const term = this.composanteModalSearch.trim().toLowerCase();
    if (!term) return this.allComposantes;
    return this.allComposantes.filter(c =>
      c.libelle.toLowerCase().includes(term) ||
      c.code.toLowerCase().includes(term) ||
      (c.description || '').toLowerCase().includes(term)
    );
  }

  isEditingComposante(i: number): boolean {
    return this.editingComposanteRows.has(i) || !this.chiffrage.services.lignes[i]?.libelle;
  }

  startEditComposante(i: number): void { this.editingComposanteRows.add(i); }

  stopEditComposante(i: number): void {
    this.editingComposanteRows.delete(i);
    this.setComposanteLabel(this.chiffrage.services.lignes[i]);
  }

  setComposanteLabel(ligne: ChiffrageServicesLigne): void {
    const c = this.allComposantes.find(x => x.id === ligne.composanteId);
    if (c) { ligne.code = c.code; ligne.libelle = c.libelle; }
  }

  getComposanteDescription(ligne: ChiffrageServicesLigne): string {
    return this.allComposantes.find(x => x.id === ligne.composanteId)?.description || '';
  }

  retirerServicesLigne(i: number): void {
    this.chiffrage.services.lignes.splice(i, 1);
  }

  getServicesCoutLigne(l: ChiffrageServicesLigne): number {
    const tjm = this.chiffrage.services.devise === 'TND'
      ? this.chiffrage.services.tjmTnd
      : this.chiffrage.services.tjmEur;
    return l.hjEstimation * tjm;
  }

  getServicesHjTotal(): number {
    return this.chiffrage.services.lignes.reduce((s, l) => s + l.hjEstimation, 0);
  }

  getServicesTotal(): number {
    return this.chiffrage.services.lignes.reduce((s, l) => s + this.getServicesCoutLigne(l), 0);
  }

  getExigencesHjTotalFromServices(): number {
    return this.chiffrage.exigences.lignes.reduce(
      (s, l) => s + l.hjFonctionnel + l.hjDev + l.hjTest, 0);
  }

  getExigencesCout(): number {
    const tjm = this.chiffrage.services.devise === 'TND'
      ? this.chiffrage.services.tjmTnd
      : this.chiffrage.services.tjmEur;
    return this.getExigencesHjTotalFromServices() * tjm;
  }

  getServicesTotalGeneral(): number {
    return this.getServicesTotal() + this.getExigencesCout();
  }

  getServicesTotalTND(): number {
    return this.getServicesHjTotal() * this.chiffrage.services.tjmTnd;
  }

  getServicesTotalEUR(): number {
    return this.getServicesHjTotal() * this.chiffrage.services.tjmEur;
  }

  // ─── Exigences helpers ─────────────────────────────────────────────────────

  getExigenceHjLigne(l: ChiffrageExigenceLigne): number {
    return l.hjFonctionnel + l.hjDev + l.hjTest;
  }

  getExigenceHjTotal(): number {
    return this.chiffrage.exigences.lignes.reduce((s, l) => s + this.getExigenceHjLigne(l), 0);
  }

  getExigenceTotalFonc(): number { return this.chiffrage.exigences.lignes.reduce((s, l) => s + l.hjFonctionnel, 0); }
  getExigenceTotalDev(): number  { return this.chiffrage.exigences.lignes.reduce((s, l) => s + l.hjDev, 0); }
  getExigenceTotalTest(): number { return this.chiffrage.exigences.lignes.reduce((s, l) => s + l.hjTest, 0); }

  // ─── Total helpers ─────────────────────────────────────────────────────────

  getTotalBase(): number {
    return this.getLicenceTotal() + this.getHwTotal() + this.getServicesTotal() + this.getExigencesCout();
  }

  getTotalApresRemise(): number {
    return this.getTotalBase() * (1 - this.chiffrage.total.remiseGlobalePct / 100);
  }

  getTotalMarge(): number {
    return this.getTotalApresRemise() * this.chiffrage.total.margePct / 100;
  }

  getTotalHT(): number {
    return this.getTotalApresRemise() + this.getTotalMarge();
  }

  getTotalTVA(): number {
    return this.getTotalHT() * this.chiffrage.total.tvaPct / 100;
  }

  getTotalTTC(): number {
    return this.getTotalHT() + this.getTotalTVA();
  }

  getTotalTND(): number {
    return this.getTotalTTC() * this.chiffrage.total.tauxChange;
  }

  getTotalHJ(): number {
    return this.getServicesHjTotal() + this.getExigenceHjTotal();
  }

  getPctCategorie(valeur: number): string {
    const base = this.getTotalBase();
    if (!base) return '0.0%';
    return ((valeur / base) * 100).toFixed(1) + '%';
  }

  // ─── Sauvegarde ────────────────────────────────────────────────────────────

  sauvegarderHardware(): void {
    if (!this.projet?.id) return;
    this.isSavingChiffrage = true;
    this.chiffrageService.saveHardware(this.projet.id, this.chiffrage.hardware).subscribe({
      next: (d) => { this.chiffrage.hardware = d; this.onSaveOk(); },
      error: () => { this.isSavingChiffrage = false; }
    });
  }

  sauvegarderLicence(): void {
    if (!this.projet?.id) return;
    if (!this.chiffrage.licence.produitId) {
      alert('Veuillez sélectionner un produit avant de sauvegarder.');
      return;
    }
    this.isSavingChiffrage = true;
    // Envoyer uniquement les champs persistés (pas les champs d'affichage)
    const payload: any = {
      ...(this.chiffrage.licence.id ? { id: this.chiffrage.licence.id } : {}),
      produitId:        this.chiffrage.licence.produitId,
      modeFacturation:  this.chiffrage.licence.modeFacturation || 'Oneshot',
      nbUsersGlobal:    this.chiffrage.licence.nbUsersGlobal    || 1,
      remiseGlobalePct: this.chiffrage.licence.remiseGlobalePct || 0,
      appliquerRemise:  this.chiffrage.licence.appliquerRemise  || false,
      lignes: this.chiffrage.licence.lignes.map(l => ({
        ...(l.id ? { id: l.id } : {}),
        moduleId:     l.moduleId,
        nbUsers:      l.nbUsers      || 1,
        prixUnitaire: l.prixUnitaire || 0,
        discountPct:  l.discountPct  || 0
      }))
    };
    this.chiffrageService.saveLicence(this.projet.id, payload).subscribe({
      next: (d) => {
        // Fusionner la réponse backend avec les données d'affichage locales
        const backendLignes = d?.lignes || [];
        this.chiffrage.licence = {
          ...(d || this.chiffrage.licence),
          lignes: this.chiffrage.licence.lignes.map((orig, i) => ({
            ...orig,
            id: backendLignes[i]?.id ?? orig.id
          }))
        };
        this.onSaveOk();
      },
      error: (err) => {
        const msg = err?.error?.message || err?.error?.error || JSON.stringify(err?.error) || 'Erreur inconnue';
        alert('Erreur sauvegarde licence : ' + msg);
        this.isSavingChiffrage = false;
      }
    });
  }

  sauvegarderServices(): void {
    if (!this.projet?.id) return;
    this.isSavingChiffrage = true;
    this.chiffrageService.saveServices(this.projet.id, this.chiffrage.services).subscribe({
      next: (d) => { this.chiffrage.services = d; this.onSaveOk(); },
      error: () => { this.isSavingChiffrage = false; }
    });
  }

  sauvegarderExigences(): void {
    if (!this.projet?.id) return;
    this.isSavingChiffrage = true;

    const payload: any = {
      ...(this.chiffrage.exigences.id ? { id: this.chiffrage.exigences.id } : {}),
      lignes: this.chiffrage.exigences.lignes.map(l => ({
        ...(l.id ? { id: l.id } : {}),
        exigenceId:       l.exigenceId,
        exigenceIntitule: l.intitule || '',
        exigenceType:     l.type     || '',
        hjEstimation:     l.hjFonctionnel || 0,
        hjValidation:     l.hjDev         || 0,
        hjRecette:        l.hjTest        || 0
      }))
    };

    this.chiffrageService.saveExigences(this.projet.id, payload).subscribe({
      next: (d) => {
        if (d) {
          if ((d as any).id) this.chiffrage.exigences.id = (d as any).id;
          // Récupérer les IDs générés et normaliser les champs backend → frontend
          const backendLignes: any[] = d.lignes || [];
          backendLignes.forEach((bl: any, i: number) => {
            const local = this.chiffrage.exigences.lignes[i];
            if (local) {
              if (bl.id) local.id = bl.id;
              // hjEstimation/hjValidation/hjRecette peuvent avoir été mis à jour par le backend
              if (bl.hjEstimation  !== undefined) local.hjFonctionnel = bl.hjEstimation;
              if (bl.hjValidation  !== undefined) local.hjDev          = bl.hjValidation;
              if (bl.hjRecette     !== undefined) local.hjTest         = bl.hjRecette;
            }
          });
        }
        this.syncExigencesLignes();
        this.onSaveOk();
      },
      error: (err) => {
        const status = err?.status;
        const msg = status === 401
          ? 'Session expirée ou accès refusé. Reconnectez-vous.'
          : (err?.error?.message || err?.error?.error || 'Erreur sauvegarde exigences.');
        alert(msg);
        this.isSavingChiffrage = false;
      }
    });
  }

  sauvegarderTotal(): void {
    if (!this.projet?.id) return;
    this.isSavingChiffrage = true;
    this.chiffrageService.saveTotal(this.projet.id, this.chiffrage.total).subscribe({
      next: (d) => { this.chiffrage.total = d; this.onSaveOk(); },
      error: () => { this.isSavingChiffrage = false; }
    });
  }

  private onSaveOk(): void {
    this.isSavingChiffrage = false;
    this.chiffrageSaved = true;
    setTimeout(() => this.chiffrageSaved = false, 3000);
  }

  // ═══════════════════════════════════════════════════════════════════════════

  loadUsers(): void {
    // Utilise l'endpoint accessible à tous les rôles authentifiés
    this.validationService.getValidateurs().subscribe({
      next: (users) => { this.users = users as User[]; },
      error: () => {
        // Fallback : pré-remplir avec l'utilisateur connecté seulement
        if (this.currentUser) this.users = [this.currentUser];
      }
    });
  }

  openValidation(index: number): void {
    this.validatingIndex = index;
    // Pré-remplir avec l'utilisateur connecté
    const fullName = [this.currentUser?.firstname, this.currentUser?.lastname].filter(Boolean).join(' ');
    this.validationForm = { validateurNom: fullName, commentaire: '' };
    this.validationError = '';
    this.editingExigenceIndex = null;
  }

  closeValidation(): void {
    this.validatingIndex = null;
    this.validationError = '';
  }

  confirmValidation(): void {
    if (!this.validationForm.validateurNom) {
      this.validationError = 'Veuillez sélectionner un validateur.';
      return;
    }
    if (!this.projet?.id) return;
    const exigences = this.getExigences().map((e, idx) => {
      if (idx === this.validatingIndex) {
        return { ...e, statut: 'Validee', validateur: this.validationForm.validateurNom, commentaireValidation: this.validationForm.commentaire } as Exigence;
      }
      return e;
    });
    this.isSavingValidation = true;
    this.projetService.patchExigences(this.projet.id, exigences).subscribe({
      next: (p) => {
        this.projet = p;
        this.isSavingValidation = false;
        this.closeValidation();
      },
      error: (err) => {
        this.isSavingValidation = false;
        this.validationError = err?.error?.message || 'Erreur lors de la validation.';
      }
    });
  }

  isExigenceValidee(exigence: Exigence): boolean {
    return this.normalizeText(exigence.statut || '') === 'validee';
  }

  isProjetValidable(): boolean {
    const exigences = this.getExigences();
    return exigences.length > 0 && exigences.every(e => this.isExigenceValidee(e));
  }

  openEditExigence(index: number): void {
    const exigence = this.getExigences()[index];
    this.editingExigenceIndex = index;
    this.editingExigence = { ...exigence };
    this.editError = '';
    this.validatingIndex = null;
  }

  closeEditExigence(): void {
    this.editingExigenceIndex = null;
    this.editError = '';
  }

  saveEditExigence(): void {
    if (!this.projet?.id) return;
    if (!this.editingExigence.intitule || !this.editingExigence.description) {
      this.editError = 'Intitulé et description sont obligatoires.';
      return;
    }
    const exigences = this.getExigences().map((e, idx) => {
      if (idx === this.editingExigenceIndex) return { ...this.editingExigence } as Exigence;
      return e;
    });
    this.isSavingEdit = true;
    this.projetService.patchExigences(this.projet.id, exigences).subscribe({
      next: (p) => {
        this.projet = p;
        this.isSavingEdit = false;
        this.closeEditExigence();
      },
      error: (err) => {
        this.isSavingEdit = false;
        this.editError = err?.error?.message || 'Erreur lors de la modification.';
      }
    });
  }

  deleteExigence(index: number): void {
    if (!this.projet?.id) return;
    if (!confirm('Supprimer cette exigence ?')) return;
    const exigences = this.getExigences().filter((_, idx) => idx !== index);
    this.projetService.patchExigences(this.projet.id, exigences).subscribe({
      next: (p) => { this.projet = p; },
      error: (err) => alert('Erreur: ' + (err?.error?.message || err.message))
    });
  }

  private normalizeObjectif(value: string): string {
    return this.normalizeText(value)
      .replace(/\s+/g, ' ')
      .trim();
  }

  private normalizeText(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  private inferTypeLabel(fileName: string): string {
    const name = fileName.toLowerCase();
    if (name.includes('cdc')) {
      return 'Cahier des charges';
    }
    if (name.includes('cr')) {
      return 'Compte-rendu';
    }
    return 'Document source';
  }
}
