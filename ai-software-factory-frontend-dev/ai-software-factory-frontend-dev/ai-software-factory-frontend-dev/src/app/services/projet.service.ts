import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Projet, CreateProjetRequest, ProjetDocument } from '../models/projet.model';

@Injectable({
  providedIn: 'root'
})
export class ProjetService {
  private apiUrl = '/api/projets';

  constructor(private http: HttpClient) { }

  getProjets(): Observable<Projet[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(dtos => dtos.map(dto => this.mapFromDTO(dto)))
    );
  }

  getProjetById(id: number): Observable<Projet> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(dto => this.mapFromDTO(dto))
    );
  }
  

  createProjet(projet: CreateProjetRequest): Observable<Projet> {
    const exigences = (projet.exigences || []).map((e: any) => ({
      ...e,
      intitule: e?.intitule || e?.titre || ''
    }));

    const dto: any = {
      nom: projet.nom,
      codeProjet: projet.codeProjet,
      description: projet.description,
      modeCreation: projet.modeCreation,
      exigences
    };

    // Send both name and id when available to maximize backend compatibility
    if (projet.client) {
      dto.client = projet.client;
    }
    if (projet.clientId !== undefined && projet.clientId !== null) {
      dto.clientId = projet.clientId;
    }

    if (projet.produit) {
      dto.produit = projet.produit;
    }
    if (projet.produitId !== undefined && projet.produitId !== null) {
      dto.produitId = projet.produitId;
    }

    if (projet.documents && projet.documents.length > 0) {
      dto.documents = projet.documents;
    }

    Object.keys(dto).forEach(key => {
      if (dto[key] === undefined) {
        delete dto[key];
      }
    });

    return this.http.post<any>(this.apiUrl, dto).pipe(
      map(response => this.mapFromDTO(response))
    );
  }

  updateProjet(id: number, projet: Partial<Projet>): Observable<Projet> {
    const dto: any = {
      nom: projet.nom,
      codeProjet: projet.codeProjet,
      client: projet.client,
      produit: projet.produit,
      description: projet.description,
      modeCreation: projet.modeCreation,
      exigences: projet.exigences
    };
    if (projet.statutValidation !== undefined) {
      dto.statutValidation = projet.statutValidation;
    }
    return this.http.put<any>(`${this.apiUrl}/${id}`, dto).pipe(
      map(response => this.mapFromDTO(response))
    );
  }

  addExigence(projetId: number, exigence: any): Observable<Projet> {
    const dto = {
      ...exigence,
      intitule: exigence?.intitule || exigence?.titre || ''
    };

    return this.http.post<any>(`${this.apiUrl}/${projetId}/exigences`, dto).pipe(
      map(response => this.mapFromDTO(response))
    );
  }

  deleteProjet(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  patchExigences(projetId: number, exigences: any[]): Observable<Projet> {
    return this.http.patch<any>(`${this.apiUrl}/${projetId}/exigences`, exigences).pipe(
      map(response => this.mapFromDTO(response))
    );
  }

  uploadDocuments(projetId: number, files: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/${projetId}/documents`, files);
  }

  getDocuments(projetId: number): Observable<ProjetDocument[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${projetId}/documents`).pipe(
      map(docs => docs.map(d => ({
        nom: d.nom || d.filename || d.name || '',
        typeLabel: d.typeLabel || this.inferDocType(d.nom || d.filename || ''),
        dateUpload: d.dateUpload || d.uploadedAt
      })))
    );
  }

  deleteDocument(projetId: number, docName: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${projetId}/documents/${encodeURIComponent(docName)}`);
  }

  private inferDocType(fileName: string): string {
    const name = fileName.toLowerCase();
    if (name.includes('cdc')) return 'Cahier des charges';
    if (name.includes('cr')) return 'Compte-rendu';
    return 'Document source';
  }

  private mapFromDTO(dto: any): Projet {
    const exigences = Array.isArray(dto?.exigences)
      ? dto.exigences.map((e: any) => ({
          id: e?.id,
          type: e?.type || 'Fonctionnel',
          intitule: e?.intitule || e?.titre || '',
          objectifClient: e?.objectifClient || '',
          description: e?.description || '',
          solutionProposee: e?.solutionProposee || '',
          limitesHypotheses: e?.limitesHypotheses || '',
          statut: e?.statut || 'En attente',
          sourceDocument: e?.sourceDocument,
          sourceSection: e?.sourceSection,
          responsable: e?.responsable,
          validateur: e?.validateur,
          commentaireValidation: e?.commentaireValidation,
          priorite: e?.priorite
        }))
      : [];

    return {
      id: dto.id,
      nom: dto.nom,
      codeProjet: dto.codeProjet,
      client: dto.client,
      produit: dto.produit,
      description: dto.description,
      modeCreation: dto.modeCreation,
      dateCreation: dto.dateCreation,
      statutValidation: dto.statutValidation || 'AUCUNE',
      exigences,
      documents: dto.documents || [],
      demandesModificationCount: dto.demandesModificationCount
    };
  }
}
