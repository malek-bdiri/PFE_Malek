import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { Module, ModuleAssignment } from '../models/module.model';

@Injectable({
  providedIn: 'root'
})
export class ModuleService {
  private apiUrl = '/api/modules';

  constructor(private http: HttpClient) { }

  getModules(): Observable<Module[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(map(list => list.map(this.mapFromDto)));
  }

  getModulesByProduitId(produitId: number): Observable<Module[]> {
    return this.http.get<any[]>(`${this.apiUrl}/produit/${produitId}`).pipe(map(list => list.map(this.mapFromDto)));
  }

  getModuleById(id: number): Observable<Module> {
    return this.http.get<Module>(`${this.apiUrl}/${id}`);
  }

  createModule(module: Module): Observable<Module> {
    return this.http.post<Module>(this.apiUrl, module);
  }

  updateModule(id: number, module: Module): Observable<Module> {
    return this.http.put<Module>(`${this.apiUrl}/${id}`, module);
  }

  deleteModule(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  assignModuleToProduit(assignment: ModuleAssignment): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/assign`, assignment);
  }

  createAndAssignModule(produitId: number, module: any): Observable<Module> {
    return this.http.post<any>(this.apiUrl, module).pipe(
      switchMap(created =>
        this.http.post<any[]>(`${this.apiUrl}/produit/${produitId}/affecter`, [created.id]).pipe(
          map(() => this.mapFromDto(created))
        )
      )
    );
  }

  affecterModuleExistant(produitId: number, moduleId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/produit/${produitId}/affecter`, [moduleId]);
  }

  affecterModules(produitId: number, moduleIds: number[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/produit/${produitId}/affecter`, moduleIds);
  }

  getModulesByProduit(produitId: number): Observable<Module[]> {
    return this.http.get<any[]>(`${this.apiUrl}/produit/${produitId}`).pipe(map(list => list.map(this.mapFromDto)));
  }

  getModulesDisponibles(produitId: number): Observable<Module[]> {
    return this.http.get<any[]>(`${this.apiUrl}/produit/${produitId}/disponibles`).pipe(map(list => list.map(this.mapFromDto)));
  }

  retirerModuleDeProduit(produitId: number, moduleId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/produit/${produitId}/retirer/${moduleId}`);
  }

  private mapFromDto = (dto: any): Module => ({
    id:          dto.id,
    code:        dto.code,
    nom:         dto.nom,
    categorie:   dto.categorie,
    description: dto.description || '',
    tags:        dto.tags || '',
    dependances: dto.dependances || '',
    obligatoire: dto.obligatoire || false,
    actif:       dto.actif !== false,
    statut:      dto.actif !== false ? 'Actif' : 'Inactif',
    prixOneshot: dto.prixOneshot || 0,
    prixYearly:  dto.prixYearly  || 0,
    prixMonthly: dto.prixMonthly || 0,
    produitId:   0
  });
}
