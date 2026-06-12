import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Planning } from '../models/planning.model';

@Injectable({
  providedIn: 'root'
})
export class PlanningService {

  private apiUrl = '/api/plannings';

  constructor(private http: HttpClient) {}

  // =============================
  // GET ALL PLANNINGS
  // =============================
  getPlannings(): Observable<Planning[]> {
    return this.http.get<Planning[]>(this.apiUrl);
  }

  // =============================
  // GET PLANNING BY ID
  // =============================
  getPlanningById(id: number): Observable<Planning> {
    return this.http.get<Planning>(`${this.apiUrl}/${id}`);
  }

  // =============================
  // GET PHASES
  // =============================
  getPhasesByPlanning(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${id}/phases`);
  }

  // =============================
  // GENERATE PLANNING
  // =============================
  generatePlanning(projetId: number, request: any): Observable<Planning> {

    return this.http.post<Planning>(
      `${this.apiUrl}/generate/${projetId}`,
      request
    );

  }

  // =============================
  // CREATE
  // =============================
  create(planning: any): Observable<Planning> {
    return this.http.post<Planning>(this.apiUrl, planning);
  }

  // =============================
  // UPDATE
  // =============================
  update(id: number, planning: any): Observable<Planning> {
    return this.http.put<Planning>(`${this.apiUrl}/${id}`, planning);
  }

  // =============================
  // DELETE
  // =============================
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
validerPlanning(id: number) {
  return this.http.put(`/api/plannings/${id}/valider`, {});
}

recalculate(projetId: number, data: any) {
  return this.http.post(`/api/plannings/recalculate/${projetId}`, data);
}
getPlanningsByProjet(projetId: number) {
  return this.http.get<any[]>(`/api/plannings/projet/${projetId}`);
}
addPhase(planningId: number, phase: any): Observable<any> {
  return this.http.post(`/api/phases/planning/${planningId}`, phase);
}

updatePhase(phaseId: number, phase: any): Observable<any> {
  return this.http.put(`/api/phases/${phaseId}`, phase);
}

deletePhase(phaseId: number): Observable<any> {
  return this.http.delete(`/api/phases/${phaseId}`);
}
}