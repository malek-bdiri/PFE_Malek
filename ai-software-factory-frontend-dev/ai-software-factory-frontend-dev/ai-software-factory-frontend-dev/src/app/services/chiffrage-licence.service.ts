import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ChiffrageLicenceSummary } from '../models/chiffrage.models';

@Injectable({ providedIn: 'root' })
export class ChiffrageLicenceService {

  constructor(private http: HttpClient) {}

  getSummary(projetId: number): Observable<ChiffrageLicenceSummary> {
    return this.http.get<ChiffrageLicenceSummary>(`/api/projets/${projetId}/chiffrage/licence`);
  }

  save(projetId: number, data: any): Observable<ChiffrageLicenceSummary> {
    return this.http.put<ChiffrageLicenceSummary>(`/api/projets/${projetId}/chiffrage/licence`, data);
  }
}
