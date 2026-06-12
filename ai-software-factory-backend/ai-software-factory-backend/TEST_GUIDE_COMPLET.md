# ✅ Guide de Test Complet - Résolution Erreur 500

## 🔧 Modifications Effectuées

### 1. ✅ CORS activé
Le fichier `CorsConfig.java` a été **décommenté** pour autoriser les requêtes depuis Angular (http://localhost:4200).

### 2. ✅ Logs ajoutés
- `UserController.java` : Logs détaillés pour chaque requête
- `KeycloakUserService.java` : Gestion d'erreur améliorée
- Annotation `@CrossOrigin` ajoutée sur le controller

### 3. ✅ Gestion d'erreur améliorée
Le controller retourne maintenant un `ResponseEntity` avec des messages d'erreur clairs.

---

## 🧪 Tests à Faire dans Postman

### Test 1: Vérifier que le backend fonctionne

**1. Redémarrez votre application Spring Boot**
```powershell
cd C:\Users\malek\OneDrive\Bureau\pfeback
.\mvnw.cmd spring-boot:run
```

**2. Attendez le message:**
```
Started BackApplication in X.XXX seconds
```

---

### Test 2: Login (obtenir un token)

**Configuration Postman:**
```
POST http://localhost:8081/api/auth/login
Content-Type: application/json

Body:
{
  "email": "malekbdiri06@gmail.com",
  "password": "admin"
}
```

**✅ Réponse attendue (200 OK):**
```json
{
  "accessToken": "eyJhbGci...",
  "role": "ADMIN",
  "refreshToken": "eyJhbGci...",
  "roles": ["ADMIN", "offline_access"]
}
```

📝 **Copiez le `accessToken`**

---

### Test 3: Récupérer les utilisateurs

**Configuration Postman:**
```
GET http://localhost:8081/api/admin/users
Authorization: Bearer {votre_accessToken}
```

**Dans Postman:**
1. Méthode: `GET`
2. URL: `http://localhost:8081/api/admin/users`
3. Onglet **Authorization**:
   - Type: `Bearer Token`
   - Token: (collez votre accessToken)
4. **Send**

**✅ Réponse attendue (200 OK):**
```json
[
  {
    "id": "abc-123",
    "firstname": "Malek",
    "lastname": "Bdiri",
    "email": "malekbdiri06@gmail.com",
    "enabled": true,
    "role": "ADMIN"
  },
  {
    "id": "def-456",
    "firstname": "Malek",
    "lastname": "Bdiri",
    "email": "malek.bdiri@esprit.tn",
    "enabled": true,
    "role": "CHEF_DE_PROJET"
  }
]
```

---

## 🐛 Si vous obtenez toujours une erreur 500

### Vérifiez les logs dans la console Spring Boot

Cherchez ces lignes:
```
🔵 Début récupération des utilisateurs
🔵 Récupération de tous les utilisateurs du realm momsoft
✅ 3 utilisateurs trouvés
✅ 3 utilisateurs récupérés
```

### Erreurs possibles:

#### Erreur: "Keycloak realm not found"
**Cause:** Le realm `momsoft` n'existe pas dans Keycloak

**Solution:**
1. Ouvrez Keycloak: http://localhost:8080
2. Vérifiez que le realm `momsoft` existe
3. Vérifiez que les utilisateurs sont bien dans le realm `momsoft` (pas `master`)

#### Erreur: "Unauthorized" ou "Invalid credentials"
**Cause:** Configuration Keycloak incorrecte dans `application.properties`

**Solution:** Vérifiez `application.properties`:
```properties
keycloak.server-url=http://localhost:8080
keycloak.realm=momsoft
keycloak.admin-realm=master
keycloak.admin-username=admin
keycloak.admin-password=admin123
```

#### Erreur: "Connection refused"
**Cause:** Keycloak n'est pas démarré

**Solution:** Démarrez Keycloak sur le port 8080

---

## 🎯 Configuration Angular

Maintenant que le backend fonctionne, configurez Angular:

### Option 1: Utiliser proxy.conf.json (RECOMMANDÉ)

**Créez `proxy.conf.json` à la racine du projet Angular:**
```json
{
  "/api": {
    "target": "http://localhost:8081",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug"
  }
}
```

**Modifiez `angular.json`:**
```json
"serve": {
  "options": {
    "proxyConfig": "proxy.conf.json"
  }
}
```

**Redémarrez Angular:**
```bash
ng serve
```

**Dans votre code TypeScript:**
```typescript
// ✅ URL relative (le proxy redirige vers http://localhost:8081)
this.http.get('/api/admin/users', { headers })
```

### Option 2: URL complète (SANS proxy)

**Dans votre code TypeScript:**
```typescript
// ✅ URL complète
this.http.get('http://localhost:8081/api/admin/users', { headers })
```

---

## 📋 Checklist Complète

- [ ] Keycloak démarré sur http://localhost:8080 ✅
- [ ] Realm `momsoft` existe dans Keycloak ✅
- [ ] Utilisateurs créés dans le realm `momsoft` ✅
- [ ] Rôles créés (ADMIN, CHEF_DE_PROJET, EDITEUR, LECTEUR) ✅
- [ ] Rôles assignés aux utilisateurs ✅
- [ ] Backend Spring Boot redémarré ✅
- [ ] Test login Postman → Token reçu ✅
- [ ] Test GET users Postman → Liste des utilisateurs ✅
- [ ] CORS activé dans Spring Boot ✅
- [ ] Proxy Angular configuré ✅
- [ ] Angular redémarré ✅
- [ ] Token envoyé dans le header Authorization depuis Angular ✅

---

## 🚀 Code Angular Complet

### utilisateurs.service.ts

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UtilisateursService {
  // Avec proxy: '/api/admin/users'
  // Sans proxy: 'http://localhost:8081/api/admin/users'
  private apiUrl = '/api/admin/users';

  constructor(private http: HttpClient) {}

  getUsers(): Observable<any[]> {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      throw new Error('Token non trouvé - veuillez vous connecter');
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any[]>(this.apiUrl, { headers });
  }
}
```

### utilisateurs.component.ts

```typescript
import { Component, OnInit } from '@angular/core';
import { UtilisateursService } from './utilisateurs.service';

@Component({
  selector: 'app-utilisateurs',
  templateUrl: './utilisateurs.component.html'
})
export class UtilisateursComponent implements OnInit {
  users: any[] = [];
  loading = false;
  error: string | null = null;

  constructor(private userService: UtilisateursService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.error = null;

    this.userService.getUsers().subscribe({
      next: (data) => {
        console.log('✅ Utilisateurs chargés:', data);
        this.users = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Erreur:', error);
        
        if (error.status === 401) {
          this.error = 'Non authentifié - Veuillez vous reconnecter';
        } else if (error.status === 403) {
          this.error = 'Accès refusé - Permissions insuffisantes';
        } else if (error.status === 500) {
          this.error = 'Erreur serveur: ' + (error.error || error.message);
        } else if (error.status === 0) {
          this.error = 'Impossible de contacter le serveur - Vérifiez que le backend est démarré';
        } else {
          this.error = 'Erreur: ' + error.message;
        }
        
        this.loading = false;
      }
    });
  }
}
```

---

## 📝 Résumé des URLs

| Service | URL | Description |
|---------|-----|-------------|
| Keycloak | http://localhost:8080 | Serveur Keycloak |
| Backend API | http://localhost:8081 | Spring Boot |
| Frontend Angular | http://localhost:4200 | Application Angular |
| Login API | http://localhost:8081/api/auth/login | Endpoint de login |
| Users API | http://localhost:8081/api/admin/users | Endpoint des utilisateurs |

---

## ✅ Résultat Attendu

Après avoir suivi ce guide:

1. ✅ Login fonctionne dans Postman
2. ✅ GET /api/admin/users fonctionne dans Postman
3. ✅ CORS autorise les requêtes depuis Angular
4. ✅ Angular peut récupérer la liste des utilisateurs
5. ✅ Pas d'erreur 500

**🎉 Votre application est maintenant opérationnelle !**

---

## 🆘 Besoin d'Aide ?

Si vous avez toujours des problèmes:

1. Partagez les **logs complets** de Spring Boot (à partir de la ligne "🔵 Début récupération...")
2. Partagez la **réponse exacte** de Postman
3. Vérifiez que Keycloak est bien démarré et accessible sur http://localhost:8080


