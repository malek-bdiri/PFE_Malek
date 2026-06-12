import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Produit } from '../models/produit.model';

@Injectable({
  providedIn: 'root'
})
export class ProduitService {
  private apiUrl = '/api/produits';

  constructor(private http: HttpClient) { }

  getProduits(): Observable<Produit[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(dtos => dtos.map(dto => this.mapFromDTO(dto)))
    );
  }

  getProduitById(id: number): Observable<Produit> {
    return this.http.get<Produit>(`${this.apiUrl}/${id}`);
  }

  
  createProduit(produit: Produit): Observable<Produit> {
    const dto = {
      nom: produit.nom,
      produitCode: produit.produitCode,
      description: produit.description,
      statut: produit.statut === 'Actif' ? 'ACTIF' : 'INACTIF'
    };
    return this.http.post<any>(this.apiUrl, dto).pipe(
      map(response => this.mapFromDTO(response))
    );
  }

  updateProduit(id: number, produit: Produit): Observable<Produit> {
    const dto = {
      nom: produit.nom,
      produitCode: produit.produitCode,
      description: produit.description,
      statut: produit.statut === 'Actif' ? 'ACTIF' : 'INACTIF'
    };
    return this.http.put<any>(`${this.apiUrl}/${id}`, dto).pipe(
      map(response => this.mapFromDTO(response))
    );
  }

  deleteProduit(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getActiveProduits(): Observable<Produit[]> {
    return this.http.get<any[]>(`${this.apiUrl}/active`).pipe(
      map(dtos => dtos.map(dto => this.mapFromDTO(dto)))
    );
  }

  getModulesByProduit(produitId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${produitId}/modules`);
  }

  private mapFromDTO(dto: any): Produit {
    return {
      id: dto.id,
      nom: dto.nom,
      produitCode: dto.produitCode,
      description: dto.description,
      statut: dto.statut === 'ACTIF' ? 'Actif' : 'Inactif'
    };
  }
}
