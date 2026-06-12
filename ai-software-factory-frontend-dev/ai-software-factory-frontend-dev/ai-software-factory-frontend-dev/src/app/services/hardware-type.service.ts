import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HardwareType } from '../models/hardware-type.model';

@Injectable({
  providedIn: 'root'
})
export class HardwareTypeService {

  private api = '/api/hardware-types';

  constructor(private http: HttpClient) {}

  getAll() {
    return this.http.get<HardwareType[]>(this.api);
  }

  create(type: HardwareType) {
    return this.http.post(this.api, type);
  }

  update(id: number, type: HardwareType) {
    return this.http.put(`${this.api}/${id}`, type);
  }

  delete(id: number) {
    return this.http.delete(`${this.api}/${id}`);
  }
}
