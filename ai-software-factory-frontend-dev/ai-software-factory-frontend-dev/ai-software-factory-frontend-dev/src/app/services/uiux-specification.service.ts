import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UiuxSpecification } from '../models/uiux-specification.model';

@Injectable({ providedIn: 'root' })
export class UiuxSpecificationService {

  private apiUrl = '/api/uiux';

  constructor(private http: HttpClient) {}

  getAll(): Observable<UiuxSpecification[]> {
    return this.http.get<UiuxSpecification[]>(this.apiUrl);
  }

  getById(id: number): Observable<UiuxSpecification> {
    return this.http.get<UiuxSpecification>(`${this.apiUrl}/${id}`);
  }

  create(projetId: number, spec: UiuxSpecification): Observable<UiuxSpecification> {
    return this.http.post<UiuxSpecification>(
      `${this.apiUrl}/projet/${projetId}`, spec
    );
  }

  update(id: number, spec: UiuxSpecification): Observable<UiuxSpecification> {
    return this.http.put<UiuxSpecification>(`${this.apiUrl}/${id}`, spec);
  }

  valider(id: number): Observable<UiuxSpecification> {
    return this.http.put<UiuxSpecification>(`${this.apiUrl}/${id}/valider`, {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
  getAfdsByUiux(id: number) {
  return this.http.get<any[]>(`/api/ui-spec-afd/uiux/${id}`);
}
}