import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GenerateResponse, HealthResponse } from '../models/rag.model';

@Injectable({
  providedIn: 'root'
})
export class RagService {

  // Passe par Spring Boot (8081) qui proxy vers Python (8000)
  private baseUrl = 'http://localhost:8081/api/rag';

  constructor(private http: HttpClient) {}

  /**
   * Vérifie la santé du backend Python.
   */
  health(): Observable<HealthResponse> {
    return this.http.get<HealthResponse>(`${this.baseUrl}/health`);
  }

  /**
   * Upload CdC + génère les exigences en un seul appel.
   * Le fichier est envoyé en multipart avec les métadonnées projet.
   */
  projectGenerate(
    file: File,
    projectName: string,
    projectId: string,
    clientName: string,
    productName: string,
    language: string,
    topK: number = 8
  ): Observable<GenerateResponse> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append('projectName', projectName);
    formData.append('projectId', projectId);
    formData.append('clientName', clientName);
    formData.append('productName', productName);
    formData.append('language', language);
    formData.append('topK', topK.toString());

    return this.http.post<GenerateResponse>(
      `${this.baseUrl}/project/generate`,
      formData
    );
  }
}
