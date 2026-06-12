import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
   * Upload CdC PDF → Spring Boot /api/ai/generate-exigences → FastAPI → Gemini
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
    return this.http.post(`${SPRING_API}/ai/generate-exigences`, form);
  }

  uploadDocument(file: File, category: string): Observable<any> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.http.post(`${RAG_API}/upload/${category}`, form);
  }
}