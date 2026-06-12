import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HardwareGroup } from '../models/hardware-group.model';

@Injectable({
  providedIn: 'root'
})
export class HardwareGroupService {
  private apiUrl = '/api/hardware-groups';

  constructor(private http: HttpClient) {}

  getAll(): Observable<HardwareGroup[]> {
    return this.http.get<HardwareGroup[]>(this.apiUrl);
  }

  getById(id: number): Observable<HardwareGroup> {
    return this.http.get<HardwareGroup>(`${this.apiUrl}/${id}`);
  }

  create(payload: any): Observable<HardwareGroup> {
    return this.http.post<HardwareGroup>(this.apiUrl, payload);
  }

  update(id: number, payload: any): Observable<HardwareGroup> {
    return this.http.put<HardwareGroup>(`${this.apiUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
