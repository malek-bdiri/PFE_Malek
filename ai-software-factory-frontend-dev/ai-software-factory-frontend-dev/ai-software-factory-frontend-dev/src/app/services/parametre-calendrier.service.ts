import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ParametreCalendrier {
  id?: number;
  joursTravaillesParSemaine: number;
  heuresEffectivesParJour: number;
  joursFeries: number;
  joursOuvresParAn: number;
}

@Injectable({ providedIn: 'root' })
export class ParametreCalendrierService {

  private apiUrl = '/api/parametres/calendrier';

  constructor(private http: HttpClient) {}

  get(): Observable<ParametreCalendrier> {
    return this.http.get<ParametreCalendrier>(this.apiUrl);
  }

  save(data: ParametreCalendrier) {
    return this.http.post(this.apiUrl, data);
  }
}