import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FunctionalAnalysis } from '../models/functional-analysis.model';

@Injectable({ providedIn: 'root' })
export class FunctionalAnalysisService {

  private apiUrl = '/api/functional-analyses';

  constructor(private http: HttpClient) {}

  getAll(): Observable<FunctionalAnalysis[]> {
    return this.http.get<FunctionalAnalysis[]>(this.apiUrl);
  }

  getById(id: number): Observable<FunctionalAnalysis> {
    return this.http.get<FunctionalAnalysis>(`${this.apiUrl}/${id}`);
  }

  create(projetId: number, analysis: FunctionalAnalysis): Observable<FunctionalAnalysis> {
    return this.http.post<FunctionalAnalysis>(
      `${this.apiUrl}/projet/${projetId}`, analysis
    );
  }

  update(id: number, analysis: FunctionalAnalysis): Observable<FunctionalAnalysis> {
    return this.http.put<FunctionalAnalysis>(`${this.apiUrl}/${id}`, analysis);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}