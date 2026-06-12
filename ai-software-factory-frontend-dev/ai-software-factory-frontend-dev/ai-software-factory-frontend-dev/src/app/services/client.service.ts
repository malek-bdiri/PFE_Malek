import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Client } from '../models/client.model';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private apiUrl = '/api/clients';

  constructor(private http: HttpClient) { }

  getClients(): Observable<Client[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(clients => clients.map(dto => this.mapFromDTO(dto)))
    );
  }

  getClientById(id: number): Observable<Client> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(dto => this.mapFromDTO(dto))
    );
  }

  createClient(client: Client): Observable<Client> {
    // Mapper pour correspondre au DTO backend
    const dto = {
      nom: client.nom,
      clientCode: client.codeClient,
      secteur: client.secteur,
      pays: client.pays,
      statut: client.statut === 'Actif' ? 'ACTIF' : 'INACTIF'
    };
    console.log('📤 Envoi créer client:', JSON.stringify(dto));
    return this.http.post<any>(this.apiUrl, dto).pipe(
      map(response => this.mapFromDTO(response))
    );
  }

  updateClient(id: number, client: Client): Observable<Client> {
    // Mapper pour correspondre au DTO backend
    const dto = {
      nom: client.nom,
      clientCode: client.codeClient,
      secteur: client.secteur,
      pays: client.pays,
      statut: client.statut === 'Actif' ? 'ACTIF' : 'INACTIF'
    };
    return this.http.put<any>(`${this.apiUrl}/${id}`, dto).pipe(
      map(response => this.mapFromDTO(response))
    );
  }

  private mapFromDTO(dto: any): Client {
    return {
      id: dto.id,
      nom: dto.nom,
      codeClient: dto.clientCode,
      secteur: dto.secteur,
      pays: dto.pays,
      statut: dto.statut === 'ACTIF' ? 'Actif' : 'Inactif',
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt
    };
  }

  deleteClient(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getActiveClients(): Observable<Client[]> {
    return this.http.get<Client[]>(`${this.apiUrl}/active`);
  }
}
