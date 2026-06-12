import { Component, OnInit } from '@angular/core';
import { ClientService } from '../../../services/client.service';
import { Client } from '../../../models/client.model';

@Component({
  selector: 'app-clients',
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.css']
})
export class ClientsComponent implements OnInit {
  clients: Client[] = [];
  showModal = false;
  isEditing = false;
  currentClient: Client = this.initClient();
  searchTerm = '';
  
  secteurs: string[] = [
    'Industrie',
    'Technologies',
    'Finance',
    'Santé',
    'Éducation',
    'Énergie',
    'Autre'
  ];
  
  pays: string[] = [
    'Afghanistan', 'Afrique du Sud', 'Albanie', 'Algérie', 'Allemagne', 'Andorre', 'Angola', 
    'Antigua-et-Barbuda', 'Arabie Saoudite', 'Argentine', 'Arménie', 'Australie', 'Autriche', 
    'Azerbaïdjan', 'Bahamas', 'Bahreïn', 'Bangladesh', 'Barbade', 'Belgique', 'Belize', 'Bénin', 
    'Bhoutan', 'Biélorussie', 'Birmanie', 'Bolivie', 'Bosnie-Herzégovine', 'Botswana', 'Brésil', 
    'Brunei', 'Bulgarie', 'Burkina Faso', 'Burundi', 'Cambodge', 'Cameroun', 'Canada', 
    'Cap-Vert', 'Centrafrique', 'Chili', 'Chine', 'Chypre', 'Colombie', 'Comores', 
    'Congo-Brazzaville', 'Congo-Kinshasa', 'Corée du Nord', 'Corée du Sud', 'Costa Rica', 
    'Côte d\'Ivoire', 'Croatie', 'Cuba', 'Danemark', 'Djibouti', 'Dominique', 'Égypte', 
    'Émirats Arabes Unis', 'Équateur', 'Érythrée', 'Espagne', 'Estonie', 'Eswatini', 'États-Unis', 
    'Éthiopie', 'Fidji', 'Finlande', 'France', 'Gabon', 'Gambie', 'Géorgie', 'Ghana', 'Grèce', 
    'Grenade', 'Guatemala', 'Guinée', 'Guinée-Bissau', 'Guinée Équatoriale', 'Guyana', 'Haïti', 
    'Honduras', 'Hongrie', 'Inde', 'Indonésie', 'Irak', 'Iran', 'Irlande', 'Islande', 'Israël', 
    'Italie', 'Jamaïque', 'Japon', 'Jordanie', 'Kazakhstan', 'Kenya', 'Kirghizistan', 'Kiribati', 
    'Koweït', 'Laos', 'Lesotho', 'Lettonie', 'Liban', 'Liberia', 'Libye', 'Liechtenstein', 
    'Lituanie', 'Luxembourg', 'Macédoine du Nord', 'Madagascar', 'Malaisie', 'Malawi', 'Maldives', 
    'Mali', 'Malte', 'Maroc', 'Marshall', 'Maurice', 'Mauritanie', 'Mexique', 'Micronésie', 
    'Moldavie', 'Monaco', 'Mongolie', 'Monténégro', 'Mozambique', 'Namibie', 'Nauru', 'Népal', 
    'Nicaragua', 'Niger', 'Nigeria', 'Norvège', 'Nouvelle-Zélande', 'Oman', 'Ouganda', 
    'Ouzbékistan', 'Pakistan', 'Palaos', 'Palestine', 'Panama', 'Papouasie-Nouvelle-Guinée', 
    'Paraguay', 'Pays-Bas', 'Pérou', 'Philippines', 'Pologne', 'Portugal', 'Qatar', 
    'République Dominicaine', 'République Tchèque', 'Roumanie', 'Royaume-Uni', 'Russie', 'Rwanda', 
    'Saint-Christophe-et-Niévès', 'Saint-Marin', 'Saint-Vincent-et-les-Grenadines', 'Sainte-Lucie', 
    'Salomon', 'Salvador', 'Samoa', 'São Tomé-et-Principe', 'Sénégal', 'Serbie', 'Seychelles', 
    'Sierra Leone', 'Singapour', 'Slovaquie', 'Slovénie', 'Somalie', 'Soudan', 'Soudan du Sud', 
    'Sri Lanka', 'Suède', 'Suisse', 'Suriname', 'Syrie', 'Tadjikistan', 'Tanzanie', 'Tchad', 
    'Thaïlande', 'Timor Oriental', 'Togo', 'Tonga', 'Trinité-et-Tobago', 'Tunisie', 'Turkménistan', 
    'Turquie', 'Tuvalu', 'Ukraine', 'Uruguay', 'Vanuatu', 'Vatican', 'Venezuela', 'Vietnam', 
    'Yémen', 'Zambie', 'Zimbabwe'
  ];

  constructor(private clientService: ClientService) { }

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.clientService.getClients().subscribe({
      next: (data) => this.clients = data,
      error: (error) => console.error('Erreur lors du chargement des clients', error)
    });
  }

  initClient(): Client {
    return {
      nom: '',
      codeClient: '',
      secteur: '',
      pays: 'France',
      statut: 'Actif'
    };
  }

  openAddModal(): void {
    this.isEditing = false;
    this.currentClient = this.initClient();
    this.showModal = true;
  }

  openEditModal(client: Client): void {
    this.isEditing = true;
    this.currentClient = { ...client };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.currentClient = this.initClient();
  }

  saveClient(): void {
    // Validation
    if (!this.currentClient.nom || !this.currentClient.codeClient || 
        !this.currentClient.secteur || !this.currentClient.pays) {
      alert('Veuillez remplir tous les champs requis');
      return;
    }

    if (this.isEditing && this.currentClient.id) {
      this.clientService.updateClient(this.currentClient.id, this.currentClient).subscribe({
        next: () => {
          this.loadClients();
          this.closeModal();
          alert('Client modifié avec succès');
        },
        error: (error) => {
          console.error('Erreur lors de la mise à jour du client', error);
          alert('Erreur lors de la mise à jour du client: ' + (error.error?.message || error.message));
        }
      });
    } else {
      this.clientService.createClient(this.currentClient).subscribe({
        next: () => {
          this.loadClients();
          this.closeModal();
          alert('Client créé avec succès');
        },
        error: (error) => {
          console.error('Erreur lors de la création du client', error);
          console.error('Détails backend:', error.error);
          const msg = error.error?.message || error.error?.error || JSON.stringify(error.error) || error.message;
          alert('Erreur lors de la création du client: ' + msg);
        }
      });
    }
  }

  deleteClient(id: number | undefined): void {
    if (id && confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      this.clientService.deleteClient(id).subscribe({
        next: () => this.loadClients(),
        error: (error) => console.error('Erreur lors de la suppression du client', error)
      });
    }
  }

  get filteredClients(): Client[] {
    if (!this.searchTerm) return this.clients;
    return this.clients.filter(client =>
      client.nom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      client.codeClient.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      client.secteur.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      client.pays.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }
}
