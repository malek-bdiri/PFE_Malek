import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TRANSLATE_HTTP_LOADER_CONFIG, TranslateHttpLoader } from '@ngx-translate/http-loader';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthInterceptor } from './interceptors/auth.interceptor';

// Layout
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';

// Auth
import { LoginComponent } from './auth/login/login.component';

// Dashboard
import { AdminDashboardComponent } from './admin/admin-dashboard/admin-dashboard.component';

// Projets
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
import { PlanningGanttComponent } from './admin/planning/planning-gantt/planning-gantt.component';

// UIUX
import { UiuxComponent } from './admin/uiux/uiux.component';
import { UiuxNewComponent } from './admin/uiux/uiux-new/uiux-new.component';
import { UiuxDetailComponent } from './admin/uiux/uiux-detail/uiux-detail.component';
import { UiSpecDetailComponent } from './admin/uiux/ui-spec-detail/ui-spec-detail.component';

// Testing
import { TestingComponent } from './admin/testing/testing.component';
import { TestingNewComponent } from './admin/testing/testing-new/testing-new.component';
import { ScenarioDetailComponent } from './admin/testing/scenario-detail/scenario-detail.component';

// Parametres
import { ParametresComponent } from './admin/parametres/parametres.component';
import { ClientsComponent } from './admin/parametres/clients/clients.component';
import { ProduitsComponent } from './admin/parametres/produits/produits.component';
import { ModulesComponent } from './admin/parametres/modules/modules.component';
import { UtilisateursComponent } from './admin/parametres/utilisateurs/utilisateurs.component';
import { HardwareConfigurationComponent } from './admin/parametres/hardware/hardware-configuration.component';
import { CalendrierComponent } from './admin/parametres/calendrier/calendrier.component';
import { LicenceComponent } from './admin/parametres/licence/licence.component';
import { ComposantesTjmComponent } from './admin/parametres/composantes-tjm/composantes-tjm.component';

import { HeaderComponent } from './shared/header/header.component';
import { ChiffrageLicenceComponent } from './pages/chiffrage-licence/chiffrage-licence.component';
import { ToastComponent } from './shared/toast/toast.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    AdminLayoutComponent,
    AdminDashboardComponent,
    HeaderComponent,

    // Projets
    ProjetsComponent,
    ProjetDetailComponent,

    // Analyse Fonctionnelle
    AnalyseFonctionnelleComponent,
    AfdNewComponent,
    AnalyseNewComponent,
    AnalyseGeneratingComponent,
    AnalyseDetailComponent,

    // Planning
    PlanningComponent,
    PlanningNewComponent,
    PlanningStep2Component,
    PlanningDetailComponent,
    PlanningGanttComponent,

    // UIUX
    UiuxComponent,
    UiuxNewComponent,
    UiuxDetailComponent,
    UiSpecDetailComponent,

    // Testing
    TestingComponent,
    TestingNewComponent,
    ScenarioDetailComponent,

    // Parametres
    ParametresComponent,
    ClientsComponent,
    ProduitsComponent,
    ModulesComponent,
    UtilisateursComponent,
    HardwareConfigurationComponent,
    CalendrierComponent,
    LicenceComponent,
    ComposantesTjmComponent,
    ChiffrageLicenceComponent,
    ToastComponent,
  ],
  imports: [
    BrowserModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatSnackBarModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useClass: TranslateHttpLoader,
        deps: [HttpClient, TRANSLATE_HTTP_LOADER_CONFIG]
      }
    }),
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: TRANSLATE_HTTP_LOADER_CONFIG,
      useValue: { prefix: '/assets/i18n/', suffix: '.json' }
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }