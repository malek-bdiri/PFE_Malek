import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Chiffrage, ChiffrageHardware, ChiffrageLicence,
  ChiffrageServices, ChiffrageExigences, ChiffrageTotal
} from '../models/chiffrage.model';

export interface Composante {
  id?: number;
  code: string;
  libelle: string;
  description?: string;
  active: boolean;
}

export interface TjmConfig {
  tjmMin: number;
  tjmMax: number;
  devise: string;
}

@Injectable({ providedIn: 'root' })
export class ChiffrageService {

  constructor(private http: HttpClient) {}

  // ─── Chargement complet ───────────────────────────────────────────────────

  getChiffrage(projetId: number): Observable<Chiffrage> {
    return this.http.get<Chiffrage>(`/api/projets/${projetId}/chiffrage`);
  }

  // ─── Sauvegarde par section ───────────────────────────────────────────────

  saveHardware(projetId: number, data: ChiffrageHardware): Observable<ChiffrageHardware> {
    return this.http.put<ChiffrageHardware>(`/api/projets/${projetId}/chiffrage/hardware`, data);
  }

  saveLicence(projetId: number, data: ChiffrageLicence): Observable<ChiffrageLicence> {
    return this.http.put<ChiffrageLicence>(`/api/projets/${projetId}/chiffrage/licence`, data);
  }

  saveServices(projetId: number, data: ChiffrageServices): Observable<ChiffrageServices> {
    return this.http.put<ChiffrageServices>(`/api/projets/${projetId}/chiffrage/services`, data);
  }

  saveExigences(projetId: number, data: ChiffrageExigences): Observable<ChiffrageExigences> {
    return this.http.put<ChiffrageExigences>(`/api/projets/${projetId}/chiffrage/exigences`, data);
  }

  saveTotal(projetId: number, data: ChiffrageTotal): Observable<ChiffrageTotal> {
    return this.http.put<ChiffrageTotal>(`/api/projets/${projetId}/chiffrage/total`, data);
  }

  // ─── Référentiels ─────────────────────────────────────────────────────────

  getComposantes(): Observable<Composante[]> {
    return this.http.get<Composante[]>('/api/composantes');
  }

  getTjmConfig(): Observable<TjmConfig> {
    return this.http.get<TjmConfig>('/api/composantes/tjm');
  }
}
