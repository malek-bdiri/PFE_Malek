import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { LanguageService } from 'src/app/services/language.service';
import { User } from 'src/app/models/user.model';

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html'
})
export class AdminLayoutComponent implements OnInit {

  sidebarOpen = true;
  currentUser: User | null = null;
  showProfileDropdown = false;

  private allMenuItems = [
    { icon: 'home',     label: 'nav.dashboard',  route: '/admin/dashboard',  roles: ['ADMIN','CHEF_DE_PROJET','EDITEUR','LECTEUR'] },
    { icon: 'document', label: 'nav.projets',    route: '/admin/projets',    roles: ['ADMIN','CHEF_DE_PROJET','EDITEUR','LECTEUR'] },
    { icon: 'chart',    label: 'nav.planning',   route: '/admin/planning',   roles: ['ADMIN','CHEF_DE_PROJET','EDITEUR','LECTEUR'] },
    { icon: 'analyse',  label: 'nav.analyse',    route: '/admin/analyse',    roles: ['ADMIN','CHEF_DE_PROJET','EDITEUR','LECTEUR'] },
    { icon: 'uiux',     label: 'nav.uiux',       route: '/admin/uiux',       roles: ['ADMIN','CHEF_DE_PROJET','EDITEUR','LECTEUR'] },
    { icon: 'test',     label: 'nav.tests',      route: '/admin/tests',      roles: ['ADMIN','CHEF_DE_PROJET','EDITEUR','LECTEUR'] },
    { icon: 'settings', label: 'nav.parametres', route: '/admin/parametres', roles: ['ADMIN','CHEF_DE_PROJET'] }
  ];

  menuItems: typeof this.allMenuItems = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    public languageService: LanguageService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe((user: User | null) => {
      this.currentUser = user;
      const role = user?.role || '';
      this.menuItems = this.allMenuItems.filter(item => item.roles.includes(role));
    });
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  toggleProfileDropdown(): void {
    this.showProfileDropdown = !this.showProfileDropdown;
  }

  changeLanguage(code: string): void {
    this.languageService.changeLanguage(code);
  }

  setActiveMenu(index: number): void {}

  logout(): void {
    this.authService.logout();
  }
}