import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { ProjetService } from '../../services/projet.service';
import { ClientService } from '../../services/client.service';
import { ProduitService } from '../../services/produit.service';
import { RagService } from '../../services/rag.service';
import { ValidationService } from '../../services/validation.service';
import { Projet, Exigence } from '../../models/projet.model';
import { Client } from '../../models/client.model';
import { Produit } from '../../models/produit.model';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-projets',
  templateUrl: './projets.component.html',
  styleUrls: ['./projets.component.css']
})
export class ProjetsComponent implements OnInit {
  currentUser: User | null = null;
  sidebarOpen = true;
  showNewProjectForm = false;
  cdcFileName: string = '';
  crFileName: string = '';
  autresDocumentsFileNames: string[] = [];
  creationMode: 'ia' | 'manuel' = 'ia';
  selectedLanguage: string = 'Français';
  exigences: Exigence[] = [];
  showExigenceForm = false;
  isLoading = false;
  loadError = '';
  isGeneratingIA = false;
  iaGenerationError = '';
  iaGenerationSuccess = '';
  editMode = false;
  editingProjetId: number | null = null;

  // Nouveau produit inline
  showNewProduitInput = false;
  newProduitNom = '';
  isSavingProduit = false;

  // ── VALIDATION ──────────────────────────────────────────
  showValidateurModal = false;
  selectedProjetForValidation: Projet | null = null;
  users: any[] = [];
  selectedValidateurId: string | null = null;
  validationStatus: { [projetId: number]: any } = {};
  showDecisionModal = false;
  decisionProjetId: number | null = null;
  decisionProjetNom = '';
  decisionCommentaire = '';
  isSubmittingValidation = false;
  // ── NOTIF PANEL ─────────────────────────────────────────
  showNotifPanel = false;
  // ────────────────────────────────────────────────────────

  // Données dynamiques
  projets: Projet[] = [];
  clients: Client[] = [];
  produits: Produit[] = [];

  // Formulaire nouveau projet
  newProjet = {
    nom: '',
    codeProjet: '',
    client: '',
    clientId: null as number | null,
    produit: '',
    produitId: null as number | null,
    description: ''
  };

  // Fichiers
  cdcFile: File | null = null;
  crFile: File | null = null;
  autresDocuments: File[] = [];

  newExigence: Exigence = {
    type: 'Fonctionnel',
    intitule: '',
    objectifClient: '',
    description: '',
    solutionProposee: '',
    limitesHypotheses: ''
  };

  menuItems = [
    { icon: 'home', label: 'Tableau de bord', route: '/admin/dashboard', active: false, roles: ['ADMIN', 'CHEF_DE_PROJET', 'EDITEUR', 'LECTEUR'] },
    { icon: 'document', label: 'Besoin projet', route: '/admin/projets', active: true, roles: ['ADMIN', 'CHEF_DE_PROJET', 'EDITEUR', 'LECTEUR'] },
    { icon: 'chart', label: 'Analyse fonctionnelle', route: '/admin/analyse', active: false, roles: ['ADMIN', 'CHEF_DE_PROJET'] },
    { icon: 'architecture', label: 'Architecture', route: '/admin/architecture', active: false, roles: ['ADMIN', 'CHEF_DE_PROJET'] },
    { icon: 'test', label: 'Tests', route: '/admin/tests', active: false, roles: ['ADMIN', 'CHEF_DE_PROJET'] },
    { icon: 'automation', label: 'Automatisation', route: '/admin/automation', active: false, roles: ['ADMIN', 'CHEF_DE_PROJET'] },
    { icon: 'settings', label: 'Paramètres', route: '/admin/parametres', active: false, roles: ['ADMIN'] }
  ];

  get visibleMenuItems() {
    const role = this.authService.currentUserValue?.role || '';
    return this.menuItems.filter(item => item.roles.includes(role));
  }

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private projetService: ProjetService,
    private clientService: ClientService,
    private produitService: ProduitService,
    private ragService: RagService,
    private validationService: ValidationService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe((user: User | null) => {
      this.currentUser = user;
    });
    this.loadProjets();
    this.loadClients();
    this.loadProduits();
    this.route.queryParams.subscribe(params => {
      if (params['editId']) {
        this.loadProjetForEdit(+params['editId']);
      }
    });
  }

  // ════════════════════════════════════════════════════════
  //  VALIDATION
  // ════════════════════════════════════════════════════════

  loadValidationStatus(projetId: number): void {
    this.validationService.getValidationStatus(projetId).subscribe({
      next: (status) => { this.validationStatus[projetId] = status; },
      error: () => { this.validationStatus[projetId] = { statut: 'AUCUNE', isValidateur: false }; }
    });
  }

  getStatutValidation(projetId: number | undefined): string {
    if (!projetId) return 'AUCUNE';
    return this.validationStatus[projetId]?.statut || 'AUCUNE';
  }

  isValidateur(projetId: number | undefined): boolean {
    if (!projetId) return false;
    return this.validationStatus[projetId]?.isValidateur === true;
  }

  get projetsEnAttenteDeValidation(): Projet[] {
    return this.projets.filter(p =>
      p.id &&
      this.getStatutValidation(p.id) === 'EN_ATTENTE' &&
      this.isValidateur(p.id)
    );
  }

  get notifCount(): number {
    return this.projetsEnAttenteDeValidation.length;
  }

  /** ADMIN, CHEF_DE_PROJET et EDITEUR peuvent demander/re-soumettre une validation */
  get canDemandValidation(): boolean {
    const role = this.authService.currentUserValue?.role || '';
    return role === 'ADMIN' || role === 'CHEF_DE_PROJET' || role === 'EDITEUR';
  }

  /** ADMIN, CHEF_DE_PROJET et EDITEUR peuvent créer/modifier les exigences */
  get canEditExigences(): boolean {
    const role = this.authService.currentUserValue?.role || '';
    return role === 'ADMIN' || role === 'CHEF_DE_PROJET' || role === 'EDITEUR';
  }

  /** ADMIN, CHEF_DE_PROJET et EDITEUR peuvent créer/modifier un projet */
  get canEditProjet(): boolean {
    const role = this.authService.currentUserValue?.role || '';
    return role === 'ADMIN' || role === 'CHEF_DE_PROJET' || role === 'EDITEUR';
  }

  ouvrirModalValidateur(projet: Projet, event: Event): void {
    event.stopPropagation();
    this.selectedProjetForValidation = projet;
    this.selectedValidateurId = null;
    this.validationService.getValidateurs().subscribe({
      next: (users) => {
        // Seuls ADMIN et CHEF_DE_PROJET peuvent être validateurs
        this.users = users.filter((u: any) =>
          u.role === 'ADMIN' || u.role === 'CHEF_DE_PROJET'
        );
        this.showValidateurModal = true;
      },
      error: (err) => console.error('Erreur chargement users:', err)
    });
  }

  confirmerDemande(): void {
    if (!this.selectedValidateurId || !this.selectedProjetForValidation?.id) return;
    const validateur = this.users.find(u => u.id === this.selectedValidateurId);
    this.isSubmittingValidation = true;
    this.validationService.demanderValidation(this.selectedProjetForValidation.id, {
      projetNom:       this.selectedProjetForValidation.nom,
      validateurId:    validateur.id,
      validateurNom:   (validateur.firstname || '') + ' ' + (validateur.lastname || ''),
      validateurEmail: validateur.email,
      lienProjet:      `${window.location.origin}/login?returnUrl=%2Fadmin%2Fprojets%2F${this.selectedProjetForValidation.id}`
    }).subscribe({
      next: () => {
        this.showValidateurModal = false;
        this.isSubmittingValidation = false;
        this.loadValidationStatus(this.selectedProjetForValidation!.id!);
      },
      error: (err) => { console.error('Erreur demande validation:', err); this.isSubmittingValidation = false; }
    });
  }

  ouvrirDecision(projet: Projet, event: Event): void {
    event.stopPropagation();
    this.decisionProjetId = projet.id!;
    this.decisionProjetNom = projet.nom;
    this.decisionCommentaire = '';
    this.showDecisionModal = true;
  }

  soumettrDecision(decision: 'VALIDE' | 'REVISION'): void {
    if (!this.decisionProjetId) return;
    this.isSubmittingValidation = true;
    this.validationService.valider(this.decisionProjetId, decision, this.decisionCommentaire).subscribe({
      next: () => {
        this.showDecisionModal = false;
        this.isSubmittingValidation = false;
        this.loadValidationStatus(this.decisionProjetId!);
        this.loadProjets();
      },
      error: (err) => { console.error('Erreur validation:', err); this.isSubmittingValidation = false; }
    });
  }

  // ════════════════════════════════════════════════════════

  // ✅ Charger les projets depuis MySQL
  loadProjets(): void {
    this.isLoading = true;
    this.loadError = '';
    this.projetService.getProjets().subscribe({
      next: (projets) => {
        this.projets = projets;
        this.isLoading = false;
        console.log('✅ Projets chargés:', this.projets.length);
        projets.forEach(p => { if (p.id) this.loadValidationStatus(p.id); });
      },
      error: (error) => {
        console.error('❌ Erreur chargement projets:', error);
        this.loadError = 'Impossible de charger les projets. Vérifiez le backend.';
        this.isLoading = false;
      }
    });
  }

  loadClients(): void {
    this.clientService.getClients().subscribe({
      next: (clients) => {
        this.clients = clients.filter(c => c.statut === 'Actif');
      },
      error: (error) => console.error('Erreur clients:', error)
    });
  }

  loadProduits(): void {
    this.produitService.getProduits().subscribe({
      next: (produits) => {
        this.produits = produits.filter(p => p.statut === 'Actif');
      },
      error: (error) => console.error('Erreur produits:', error)
    });
  }

  onProduitSelectChange(value: any): void {
    if (value === -1) {
      this.showNewProduitInput = true;
      this.newProduitNom = '';
    } else {
      this.showNewProduitInput = false;
    }
  }

  saveNewProduit(): void {
    const nom = this.newProduitNom.trim();
    if (!nom) return;
    this.isSavingProduit = true;
    const produit: Produit = {
      nom,
      produitCode: nom.toUpperCase().replace(/\s+/g, '-').substring(0, 20),
      description: '',
      statut: 'Actif'
    };
    this.produitService.createProduit(produit).subscribe({
      next: (created) => {
        this.produits = [...this.produits, created];
        this.newProjet.produitId = created.id ?? null;
        this.showNewProduitInput = false;
        this.newProduitNom = '';
        this.isSavingProduit = false;
      },
      error: (err) => {
        console.error('Erreur création produit:', err);
        this.isSavingProduit = false;
      }
    });
  }

  loadProjetForEdit(id: number): void {
    this.editMode = true;
    this.editingProjetId = id;
    forkJoin({
      projet: this.projetService.getProjetById(id),
      clients: this.clientService.getClients(),
      produits: this.produitService.getProduits()
    }).subscribe({
      next: ({ projet, clients, produits }) => {
        this.clients = clients.filter(c => c.statut === 'Actif');
        this.produits = produits.filter(p => p.statut === 'Actif');
        this.newProjet = {
          nom: projet.nom,
          codeProjet: projet.codeProjet,
          client: projet.client,
          clientId: this.clients.find(c => c.nom === projet.client)?.id as number || null,
          produit: projet.produit || '',
          produitId: this.produits.find(p => p.nom === projet.produit)?.id as number || null,
          description: projet.description || ''
        };
        this.creationMode = 'manuel';
        this.exigences = [...(projet.exigences || [])];
        this.showNewProjectForm = true;
      },
      error: (err) => console.error('Erreur chargement projet pour édition:', err)
    });
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  toggleNewProjectForm(): void {
    this.showNewProjectForm = !this.showNewProjectForm;
    if (!this.showNewProjectForm) {
      this.cancelNewProject();
    }
  }

  onCDCSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.cdcFileName = file.name;
      // Lire le fichier en mémoire immédiatement pour éviter ERR_UPLOAD_FILE_CHANGED
      const reader = new FileReader();
      reader.onload = (e) => {
        const buffer = e.target!.result as ArrayBuffer;
        const blob = new Blob([buffer], { type: file.type });
        this.cdcFile = new File([blob], file.name, { type: file.type });
      };
      reader.readAsArrayBuffer(file);
    }
  }

  onCRSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.crFile = file;
      this.crFileName = file.name;
    }
  }

  onAutresDocumentsSelected(event: any): void {
    const files: FileList = event.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        this.autresDocuments.push(files[i]);
        this.autresDocumentsFileNames.push(files[i].name);
      }
    }
  }

  removeAutreDocument(index: number): void {
    this.autresDocuments.splice(index, 1);
    this.autresDocumentsFileNames.splice(index, 1);
  }

  setCreationMode(mode: 'ia' | 'manuel'): void {
    this.creationMode = mode;
    // Reset exigences quand on change de mode
    this.exigences = [];
    this.showExigenceForm = false;
    this.resetNewExigence();
    this.iaGenerationError = '';
    this.iaGenerationSuccess = '';
  }

  generateExigencesFromIA(onSuccess?: () => void): void {
    if (!this.newProjet.nom || !this.newProjet.codeProjet) {
      alert('Veuillez d\'abord remplir Nom du projet et ID Projet.');
      return;
    }

    const selectedClient = this.clients.find(c => Number(c.id) === Number(this.newProjet.clientId));
    if (!selectedClient) {
      alert('Veuillez sélectionner un client avant la génération IA.');
      return;
    }

    if (!this.cdcFile) {
      alert('Veuillez joindre un fichier CdC (PDF) pour la génération IA.');
      return;
    }

    this.isGeneratingIA = true;
    this.iaGenerationError = '';
    this.iaGenerationSuccess = '';

    const selectedProduit = this.produits.find(p => Number(p.id) === Number(this.newProjet.produitId));

    this.ragService.generateExigences(
      this.cdcFile,
      this.newProjet.nom,
      this.newProjet.codeProjet,
      selectedClient.nom,
      selectedProduit?.nom || 'Smart Factory MOMsoft',
      this.selectedLanguage,
      4
    ).pipe(
      finalize(() => { this.isGeneratingIA = false; })
    ).subscribe({
      next: (response) => {
        // Bloquer uniquement si l'API retourne explicitement success=false
        if (response?.success === false) {
          const apiError: string = response?.error || 'Erreur inconnue retournee par le service IA.';
          const rateLimit = apiError.includes('rate_limit_exceeded') || apiError.includes('tokens per minute');
          this.iaGenerationError = rateLimit
            ? 'Limite de tokens atteinte (document trop volumineux). Essayez avec un fichier plus court ou réessayez dans une minute.'
            : apiError.length > 200 ? apiError.substring(0, 200) + '...' : apiError;
          return;
        }
        const generated = this.extractExigencesFromResponse(response);
        if (generated.length === 0) {
          // Vérifier si c'est un problème de JSON tronqué (max_tokens LLM atteint)
          const apiError: string = response?.error || '';
          const isTruncated = apiError.includes('delimiter') || apiError.includes('Expecting') || apiError.includes('JSON');
          this.iaGenerationError = isTruncated
            ? 'La réponse du modèle a été tronquée (JSON incomplet). Essayez avec un fichier plus court ou un projet plus ciblé.'
            : 'Aucune exigence exploitable n\'a ete retournee par le modele.';
          return;
        }
        this.exigences = generated;
        this.iaGenerationSuccess = `${generated.length} exigence(s) generee(s) via IA.`;
        if (onSuccess) onSuccess();
      },
      error: (error) => {
        console.error('Erreur generation IA:', error);
        this.iaGenerationError =
          error?.error?.detail ||
          error?.error?.message ||
          error?.message ||
          'Erreur lors de la generation IA. Verifiez que le serveur RAG est disponible.';
      }
    });
  }

  private buildDocumentsList(): import('../../models/projet.model').ProjetDocument[] {
    const today = new Date().toISOString().split('T')[0];
    const docs: import('../../models/projet.model').ProjetDocument[] = [];
    if (this.cdcFileName) {
      docs.push({ nom: this.cdcFileName, typeLabel: 'Cahier des charges', dateUpload: today });
    }
    if (this.crFileName) {
      docs.push({ nom: this.crFileName, typeLabel: 'Compte-rendu', dateUpload: today });
    }
    this.autresDocumentsFileNames.forEach(name => {
      docs.push({ nom: name, typeLabel: 'Document source', dateUpload: today });
    });
    return docs;
  }

  private extractExigencesFromResponse(response: any): Exigence[] {
    // Spring Boot RagGenerateResponse: { exigences: { exigences: [...] } }
    // FastAPI /api/generate:           { parsed_json: { exigences: [...] } }
    const candidates = [
      response?.exigences?.exigences,
      response?.parsed_json?.exigences,
      response?.exigences,
      response?.requirements,
      response?.data?.exigences,
      response?.result?.exigences,
    ];

    let rawList: any = candidates.find(Array.isArray);

    if (!rawList && typeof response?.exigences === 'string') {
      try {
        const parsed = JSON.parse(response.exigences);
        if (Array.isArray(parsed)) rawList = parsed;
      } catch { rawList = []; }
    }

    if (!Array.isArray(rawList)) {
      console.warn('extractExigencesFromResponse: aucun tableau trouve dans', response);
      return [];
    }

    return rawList
      .map((item: any, index: number) => {
        const intitule = (item?.intitule || item?.titre || item?.title || '').toString().trim();
        const description = (item?.description || item?.details || item?.content || '').toString().trim();
        return {
          type: (item?.type || 'Fonctionnel').toString(),
          intitule: intitule || `Exigence ${index + 1}`,
          objectifClient: (item?.objectifClient || item?.objective || '').toString(),
          description,
          solutionProposee: (item?.solutionProposee || item?.solution || '').toString(),
          limitesHypotheses: (item?.limitesHypotheses || item?.limitations || '').toString(),
          priorite: (item?.priorite || item?.priority || item?.niveau || 'Moyenne').toString(),
          sourceDocument: item?.sourceDocument || response?.filename || this.cdcFileName || undefined
        } as Exigence;
      })
      .filter((e: Exigence) => !!(e.intitule || e.description));
  }

  // ✅ Créer le projet (IA ou Manuel)
  createProject(): void {
    if (!this.newProjet.nom || !this.newProjet.codeProjet) {
      alert('Veuillez remplir les champs obligatoires (Nom et Code projet)');
      return;
    }

    const selectedClient = this.clients.find(c => Number(c.id) === Number(this.newProjet.clientId));
    if (!selectedClient) {
      alert('Veuillez sélectionner un client.');
      return;
    }

    if (this.creationMode === 'ia' && this.exigences.length === 0) {
      this.generateExigencesFromIA(() => this.createProject());
      return;
    }

    // ✅ Mode manuel : exiger au moins une exigence
    if (this.creationMode === 'manuel' && this.exigences.length === 0) {
      alert('En mode manuel, veuillez ajouter au moins une exigence.');
      return;
    }

    const selectedProduit = this.produits.find(p => Number(p.id) === Number(this.newProjet.produitId));

    const exigencesForBackend: Exigence[] = this.exigences.map(exig => ({
      type: exig.type,
      intitule: exig.intitule,
      objectifClient: exig.objectifClient,
      description: exig.description,
      solutionProposee: exig.solutionProposee,
      limitesHypotheses: exig.limitesHypotheses
    }));

    const projetData: any = {
      nom: this.newProjet.nom,
      codeProjet: this.newProjet.codeProjet,
      client: selectedClient.nom,
      clientId: selectedClient.id,
      description: this.newProjet.description,
      modeCreation: this.creationMode.toUpperCase() as 'IA' | 'MANUEL',
      exigences: exigencesForBackend
    };

    if (selectedProduit && selectedProduit.nom) {
      projetData.produit = selectedProduit.nom;
      if (selectedProduit.id != null) projetData.produitId = selectedProduit.id;
    }

    console.log('📤 Envoi projet:', projetData);

    if (this.editMode && this.editingProjetId) {
      this.projetService.updateProjet(this.editingProjetId, projetData).subscribe({
        next: () => {
          this.loadProjets();
          this.cancelNewProject();
          alert('✅ Projet mis à jour avec succès !');
        },
        error: (error) => {
            console.error('❌ Erreur mise à jour projet:', error, error.error);
            alert('Erreur: ' + (error.error?.message || error.error || error.message));
        }
      });
    } else {
      this.projetService.createProjet(projetData).subscribe({
        next: (projet) => {
          console.log('✅ Projet créé:', projet);

          // Upload documents si mode IA
          if (this.creationMode === 'ia' && (this.cdcFile || this.crFile || this.autresDocuments.length > 0)) {
            const formData = new FormData();
            if (this.cdcFile) formData.append('cdc', this.cdcFile);
            if (this.crFile) formData.append('cr', this.crFile);
            this.autresDocuments.forEach((file, index) => {
              formData.append(`autreDocument${index}`, file);
            });

            if (projet.id) {
              this.projetService.uploadDocuments(projet.id, formData).subscribe({
                next: () => console.log('✅ Documents uploadés'),
                error: (err) => console.error('❌ Erreur upload:', err)
              });
            }
          }

          this.loadProjets();
          this.cancelNewProject();
          alert('✅ Projet créé avec succès !');
        },
        error: (error) => {
            console.error('❌ Erreur création projet:', error, error.error);
            alert('Erreur: ' + (error.error?.message || JSON.stringify(error.error) || error.message));
        }
      });
    }
  }

  cancelNewProject(): void {
    this.showNewProjectForm = false;
    this.editMode = false;
    this.editingProjetId = null;
    this.cdcFileName = '';
    this.crFileName = '';
    this.autresDocumentsFileNames = [];
    this.cdcFile = null;
    this.crFile = null;
    this.autresDocuments = [];
    this.creationMode = 'ia';
    this.exigences = [];
    this.showExigenceForm = false;
    this.iaGenerationError = '';
    this.iaGenerationSuccess = '';
    this.isGeneratingIA = false;
    this.resetNewExigence();
    this.newProjet = {
      nom: '',
      codeProjet: '',
      client: '',
      clientId: null,
      produit: '',
      produitId: null,
      description: ''
    };
  }

  // ✅ Gestion exigences (mode manuel)
  toggleExigenceForm(): void {
    this.showExigenceForm = !this.showExigenceForm;
    if (!this.showExigenceForm) {
      this.resetNewExigence();
    }
  }

  addExigence(): void {
    if (!this.newExigence.intitule || !this.newExigence.objectifClient || !this.newExigence.description) {
      alert('Veuillez remplir les champs obligatoires de l\'exigence (Intitulé, Objectif, Description)');
      return;
    }
    this.exigences.push({ ...this.newExigence });
    this.resetNewExigence();
    this.showExigenceForm = false;
    console.log('✅ Exigence ajoutée, total:', this.exigences.length);
  }

  removeExigence(index: number): void {
    this.exigences.splice(index, 1);
  }

  resetNewExigence(): void {
    this.newExigence = {
      type: 'Fonctionnel',
      intitule: '',
      objectifClient: '',
      description: '',
      solutionProposee: '',
      limitesHypotheses: ''
    };
  }

  // ✅ Supprimer un projet
  deleteProjet(id: number | undefined): void {
    if (!id) return;
    if (!confirm('Supprimer ce projet ?')) return;

    this.projetService.deleteProjet(id).subscribe({
      next: () => {
        this.loadProjets();
        alert('✅ Projet supprimé');
      },
      error: (err) => alert('❌ Erreur suppression: ' + err.message)
    });
  }

  logout(): void {
    this.authService.logout();
  }

  setActiveMenu(index: number): void {
    this.menuItems.forEach((item, i) => {
      item.active = i === index;
    });
  }

  viewProjet(projet: Projet): void {
    if (projet.id) {
      this.router.navigate(['/admin/projets', projet.id]);
    }
  }

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'Validé': return 'bg-green-100 text-green-800';
      case 'En cours': return 'bg-blue-100 text-blue-800';
      case 'En attente': return 'bg-gray-100 text-gray-800';
      case 'À revoir': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}