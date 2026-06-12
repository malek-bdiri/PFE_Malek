import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { TestScenario, GenerateTestRequest, CasDeTest } from '../models/test-scenario.model';

@Injectable({ providedIn: 'root' })
export class TestService {
  private apiUrl = 'http://localhost:8081/api/test-scenarios';

  constructor(private http: HttpClient) {}

  generateFromAFD(req: GenerateTestRequest): Observable<TestScenario[]> {
    return this.http.post<TestScenario[]>(`${this.apiUrl}/generate`, req);
  }

  getByProjet(projetId: number): Observable<TestScenario[]> {
    return this.http.get(`${this.apiUrl}/projet/${projetId}`, { responseType: 'text' }).pipe(
      map(text => {
        try {
          return JSON.parse(text) as TestScenario[];
        } catch {
          // Backend returns malformed JSON due to JPA circular reference —
          // extract the array portion before the trailing garbage (]}}]}}...]})
          const match = text.match(/^\[.*\]/s);
          if (match) {
            try { return JSON.parse(match[0]) as TestScenario[]; } catch {}
          }
          console.error('JSON malformé reçu du backend pour getByProjet:', text.substring(0, 200));
          return [] as TestScenario[];
        }
      }),
      catchError(err => {
        console.error('Erreur getByProjet:', err);
        return of([] as TestScenario[]);
      })
    );
  }

  getAll(): Observable<TestScenario[]> {
    return this.http.get<TestScenario[]>(this.apiUrl);
  }

  getById(id: number): Observable<TestScenario> {
    return this.http.get<TestScenario>(`${this.apiUrl}/${id}`);
  }

  createManuel(scenario: TestScenario): Observable<TestScenario> {
    return this.http.post<TestScenario>(this.apiUrl, scenario);
  }

  updateCaseStatut(caseId: number, statut: string, resultatObtenu: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/cas/${caseId}/statut`, { statut, resultatObtenu });
  }

  valider(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/valider`, {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
