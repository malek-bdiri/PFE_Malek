import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-parametres',
  templateUrl: './parametres.component.html',
  styleUrls: ['./parametres.component.css']
})
export class ParametresComponent implements OnInit {
  activeTab = 'clients';

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    const role = this.authService.currentUserValue?.role;
    if (role === 'EDITEUR' || role === 'LECTEUR') {
      this.router.navigate(['/admin']);
    }
  }

  get isReadOnly(): boolean {
    return this.authService.currentUserValue?.role === 'CHEF_DE_PROJET';
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }
}