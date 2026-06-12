import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HardwareComponent } from '../models/hardware-component.model';

@Injectable({
  providedIn: 'root'
})
export class HardwareComponentService {
  private apiUrl = '/api/hardware-components';

  constructor(private http: HttpClient) {}

  getAll(): Observable<HardwareComponent[]> {
    return this.http.get<HardwareComponent[]>(this.apiUrl);
  }

  getById(id: number): Observable<HardwareComponent> {
    return this.http.get<HardwareComponent>(`${this.apiUrl}/${id}`);
  }

  create(component: HardwareComponent): Observable<HardwareComponent> {
    return this.http.post<HardwareComponent>(this.apiUrl, component);
  }

  update(id: number, component: HardwareComponent): Observable<HardwareComponent> {
    return this.http.put<HardwareComponent>(`${this.apiUrl}/${id}`, component);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getByManufacturer(name: string): Observable<HardwareComponent[]> {
    return this.http.get<HardwareComponent[]>(`${this.apiUrl}/manufacturer/${name}`);
  }

  getBySupplier(name: string): Observable<HardwareComponent[]> {
    return this.http.get<HardwareComponent[]>(`${this.apiUrl}/supplier/${name}`);
  }

  getByType(typeId: number): Observable<HardwareComponent[]> {
    return this.http.get<HardwareComponent[]>(`${this.apiUrl}/type/${typeId}`);
  }
}