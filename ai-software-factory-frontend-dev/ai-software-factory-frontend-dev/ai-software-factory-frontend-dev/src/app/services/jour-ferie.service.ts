import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface JourFerie {
  id?: number;
  date: string;
  nom: string;
  recurrentAnnuel: boolean;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class JourFerieService {

  private apiUrl = '/api/jours-feries';

  constructor(private http: HttpClient) {}

  getAll(): Observable<JourFerie[]> {
    return this.http.get<JourFerie[]>(this.apiUrl);
  }

  create(data: JourFerie) {
    return this.http.post<JourFerie>(this.apiUrl, data);
  }
  update(jour: JourFerie): Observable<JourFerie> {
    return this.http.put<JourFerie>(`${this.apiUrl}/${jour.id}`, jour);
  }


  delete(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}