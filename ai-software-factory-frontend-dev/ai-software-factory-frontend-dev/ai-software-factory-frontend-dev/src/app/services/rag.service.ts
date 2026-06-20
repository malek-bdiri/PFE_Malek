import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VerifyDocumentResponse, EvaluateResponse, AfdResponse } from '../models/ai.model';

const RAG_API = '/rag-api';
const SPRING_API = '/api';

export interface GenerateRequest {
  query: string;
  generation_type: 'exigences' | 'afd' | 'planning' | 'generic';
  category?: string;
  top_k?: number;
  project_name?: string;
  project_id?: string;
  client?: string;
  language?: string;
  product_context?: string;
}

@Injectable({ providedIn: 'root' })
export class RagService {
  constructor(private http: HttpClient) {}

  health(): Observable<any> {
    return this.http.get(`${RAG_API}/health`);
  }

  getDocuments(): Observable<any> {
    return this.http.get(`${RAG_API}/documents`);
  }

  generate(req: GenerateRequest): Observable<any> {
    return this.http.post(`${RAG_API}/generate`, req);
  }

  /**
   * Upload CdC PDF → FastAPI /project/generate → Gemini
   * Appel direct FastAPI (bypass Spring Boot /api/ai/generate-exigences qui retourne 500)
   */
  generateExigences(
    file: File,
    projectName: string,
    projectId: string,
    clientName: string,
    productName: string,
    language: string = 'Français',
    topK: number = 8
  ): Observable<any> {
    const form = new FormData();
    form.append('file', file, file.name);
    form.append('project_name', projectName);
    form.append('project_id', projectId);
    form.append('client_name', clientName);
    form.append('product_name', productName);
    form.append('language', language);
    form.append('top_k', String(topK));
    return this.http.post(`${RAG_API}/project/generate`, form);
  }

  uploadDocument(file: File, category: string): Observable<any> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.http.post(`${RAG_API}/upload/${category}`, form);
  }

  verifyDocument(file: File): Observable<VerifyDocumentResponse> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.http.post<VerifyDocumentResponse>(`${RAG_API}/verify/document`, form);
  }

  evaluateExigences(
    cdcText: string,
    exigences: any[],
    projectName: string
  ): Observable<EvaluateResponse> {
    return this.http.post<EvaluateResponse>(`${RAG_API}/evaluate/exigences`, {
      cdc_text: cdcText,
      exigences,
      project_name: projectName
    });
  }

  generateAfdFromExigences(
    exigences: any[],
    projectName: string,
    clientName: string,
    projectId?: string | number,
    codeProjet?: string,
    validateur?: string,
    topK: number = 4
  ): Observable<AfdResponse> {
    return this.http.post<AfdResponse>(`${RAG_API}/generate/afd`, {
      exigences,
      project_name: projectName,
      project_id: projectId ?? null,
      code_projet: codeProjet ?? null,
      client_name: clientName,
      validateur: validateur ?? null,
      top_k: topK
    });
  }
}