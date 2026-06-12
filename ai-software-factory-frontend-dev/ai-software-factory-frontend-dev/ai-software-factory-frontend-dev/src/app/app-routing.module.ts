import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './auth/login/login.component';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { AdminDashboardComponent } from './admin/admin-dashboard/admin-dashboard.component';
import { ProjetsComponent } from './admin/projets/projets.component';
import { ProjetDetailComponent } from './admin/projets/projet-detail/projet-detail.component';

// Analyse Fonctionnelle
import { AnalyseFonctionnelleComponent } from './admin/analyse-fonctionnelle/analyse-fonctionnelle.component';
import { AfdNewComponent } from './admin/analyse-fonctionnelle/afd-new/afd-new.component';
import { AnalyseNewComponent } from './admin/analyse-fonctionnelle/analyse-new/analyse-new.component';
import { AnalyseGeneratingComponent } from './admin/analyse-fonctionnelle/analyse-generating/analyse-generating.component';
import { AnalyseDetailComponent } from './admin/analyse-fonctionnelle/analyse-detail/analyse-detail.component';

// Planning
import { PlanningComponent } from './admin/planning/planning.component';
import { PlanningNewComponent } from './admin/planning/planning-new/planning-new.component';
import { PlanningStep2Component } from './admin/planning/planning-step2/planning-step2.component';
import { PlanningDetailComponent } from './admin/planning/planning-detail/planning-detail.component';

// UIUX
import { UiuxComponent } from './admin/uiux/uiux.component';
import { UiuxNewComponent } from './admin/uiux/uiux-new/uiux-new.component';
import { UiuxDetailComponent } from './admin/uiux/uiux-detail/uiux-detail.component';
import { UiSpecDetailComponent } from './admin/uiux/ui-spec-detail/ui-spec-detail.component';

import { ParametresComponent } from './admin/parametres/parametres.component';
import { TestingComponent } from './admin/testing/testing.component';
import { ScenarioDetailComponent } from './admin/testing/scenario-detail/scenario-detail.component';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },

  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      // Default redirect to dashboard
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },

      // Projets
      { path: 'projets', component: ProjetsComponent },
      { path: 'projets/:id', component: ProjetDetailComponent },

      // Analyse
      { path: 'analyse', component: AnalyseFonctionnelleComponent },
      { path: 'analyse/new', component: AnalyseNewComponent },
      { path: 'analyse/afd-new', component: AfdNewComponent },
      { path: 'analyse/generating/:id', component: AnalyseGeneratingComponent },
      { path: 'analyse/:id', component: AnalyseDetailComponent },
      { path: 'analyse/:analysisId/afd/new', component: AfdNewComponent },

      // Planning
      { path: 'planning', component: PlanningComponent },
      { path: 'planning/new', component: PlanningNewComponent },
      { path: 'planning/step2', component: PlanningStep2Component },
      { path: 'planning/:id', component: PlanningDetailComponent },

      // UIUX
      { path: 'uiux', component: UiuxComponent },
      { path: 'uiux/new', component: UiuxNewComponent },
      { path: 'uiux/:id', component: UiuxDetailComponent },
      { path: 'uiux/:id/ui-spec/:specId', component: UiSpecDetailComponent },

      // Tests
      { path: 'tests', component: TestingComponent },
      { path: 'tests/:id', component: ScenarioDetailComponent },

      // Parametres
      { path: 'parametres', component: ParametresComponent }
    ]
  },

  { path: '**', redirectTo: '/admin/dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}