import { Routes } from '@angular/router';
import { NouveauProjetComponent } from './nouveau-projet/nouveau-projet.component';

/**
 * Ajoutez cette route dans votre AppRoutingModule ou app.routes.ts
 */
export const ragRoutes: Routes = [
  {
    path: 'projet/nouveau',
    component: NouveauProjetComponent,
    // data: { title: 'Nouveau projet' }
  }
];

/*
 * ══════════════════════════════════════════════════════════════════
 *  INSTRUCTIONS D'INTÉGRATION
 * ══════════════════════════════════════════════════════════════════
 *
 * 1. Copiez les dossiers suivants dans votre projet Angular :
 *    - nouveau-projet/  → src/app/pages/nouveau-projet/
 *    - services/        → src/app/services/
 *    - models/          → src/app/models/
 *
 * 2. Dans app.routes.ts, importez et ajoutez ragRoutes :
 *
 *    import { ragRoutes } from './pages/nouveau-projet/rag.routes';
 *
 *    export const routes: Routes = [
 *      ...ragRoutes,
 *      // ... autres routes
 *    ];
 *
 * 3. Assurez-vous d'avoir HttpClientModule dans votre app.config.ts :
 *
 *    import { provideHttpClient } from '@angular/common/http';
 *
 *    export const appConfig: ApplicationConfig = {
 *      providers: [
 *        provideHttpClient(),
 *        provideRouter(routes),
 *      ]
 *    };
 *
 * 4. Lancez :
 *    - Python : cd python-rag && uvicorn src.api.main:app --port 8000 --reload
 *    - Spring Boot : mvn spring-boot:run (port 8081)
 *    - Angular : ng serve (port 4200)
 *
 * 5. Accédez à : http://localhost:4200/projet/nouveau
 */
