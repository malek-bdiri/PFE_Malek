# 🔧 Solution - Erreur 500 "GET http://localhost:4200/api/admin/users"

## 🔴 Problème Identifié

Votre application Angular appelle l'API sur le **mauvais port** :
```
❌ http://localhost:4200/api/admin/users (port Angular)
✅ http://localhost:8081/api/admin/users (port Spring Boot)
```

---

## ✅ Solution 1: Configurer un Proxy Angular (RECOMMANDÉ)

Cette solution permet à Angular de rediriger automatiquement les appels `/api/*` vers le backend Spring Boot.

### Étape 1: Créer le fichier proxy.conf.json

Dans votre projet Angular (à la racine), créez le fichier **`proxy.conf.json`** :

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

### Étape 2: Modifier angular.json

Ouvrez **`angular.json`** et modifiez la section `serve` :

```json
{
  "projects": {
    "votre-projet": {
      "architect": {
        "serve": {
          "options": {
            "proxyConfig": "proxy.conf.json"
          }
        }
      }
    }
  }
}
```

### Étape 3: Redémarrer Angular

```bash
# Arrêtez Angular (Ctrl+C)
# Redémarrez avec:
ng serve
```

### Étape 4: Utiliser les URLs relatives dans votre code Angular

Dans **`utilisateurs.component.ts`** :

```typescript
// ✅ CORRECT - URL relative
this.http.get('/api/admin/users')

// ❌ INCORRECT - URL absolue avec mauvais port
this.http.get('http://localhost:4200/api/admin/users')
```

---

## ✅ Solution 2: Utiliser l'URL complète (TEMPORAIRE)

Si vous ne voulez pas configurer le proxy, changez directement l'URL dans votre code Angular.

### Dans utilisateurs.component.ts:

**Avant (❌):**
```typescript
this.http.get('http://localhost:4200/api/admin/users')
// ou
this.http.get('/api/admin/users')
```

**Après (✅):**
```typescript
this.http.get('http://localhost:8081/api/admin/users')
```

### Créer un environnement:

**src/environments/environment.ts:**
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8081'
};
```

**Dans utilisateurs.component.ts:**
```typescript
import { environment } from '../environments/environment';

// ...

this.http.get(`${environment.apiUrl}/api/admin/users`)
```

---

## 🔧 Solution 3: Activer CORS dans Spring Boot

Votre backend doit autoriser les requêtes depuis Angular (http://localhost:4200).

### Vérifier CorsConfig.java

Le fichier existe déjà, mais vérifions qu'il autorise bien Angular.

---

## 🧪 Test de l'API avec Postman

Avant de tester depuis Angular, vérifiez que l'API fonctionne avec Postman :

### 1. Login d'abord (pour obtenir le token)

```
POST http://localhost:8081/api/auth/login
Content-Type: application/json

{
  "email": "malekbdiri06@gmail.com",
  "password": "admin"
}
```

Copiez le `accessToken`.

### 2. Appel GET Users

```
GET http://localhost:8081/api/admin/users
Authorization: Bearer {votre_token}
```

✅ **Résultat attendu (200 OK):**
```json
[
  {
    "id": "user-id-123",
    "firstname": "Malek",
    "lastname": "Bdiri",
    "email": "malekbdiri06@gmail.com",
    "enabled": true,
    "role": "ADMIN"
  },
  ...
]
```

---

## 🐛 Si vous obtenez toujours une erreur 500

### Vérifier les logs Spring Boot

Dans la console où vous avez lancé `mvnw spring-boot:run`, cherchez l'erreur exacte.

### Erreurs possibles:

#### Erreur: "No realm level roles found"

**Cause:** Les rôles ne sont pas créés dans Keycloak.

**Solution:** Créez les rôles dans Keycloak:
1. Ouvrez Keycloak Admin: http://localhost:8080
2. Realm `momsoft` → **Realm roles**
3. Créez: ADMIN, CHEF_DE_PROJET, EDITEUR, LECTEUR

#### Erreur: "Unauthorized" ou "Access Denied"

**Cause:** Le token n'est pas envoyé ou est invalide.

**Solution:** Vérifiez que votre service Angular envoie bien le token dans le header:

```typescript
const headers = new HttpHeaders({
  'Authorization': `Bearer ${this.token}`
});

this.http.get('/api/admin/users', { headers })
```

---

## 📝 Code complet pour Angular

### utilisateurs.service.ts (Service)

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UtilisateursService {
  private apiUrl = 'http://localhost:8081/api/admin/users'; // ou '/api/admin/users' avec proxy

  constructor(private http: HttpClient) {}

  getUsers(): Observable<any[]> {
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any[]>(this.apiUrl, { headers });
  }

  createUser(user: any): Observable<string> {
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post<string>(this.apiUrl, user, { headers });
  }
}
```

### utilisateurs.component.ts (Component)

```typescript
import { Component, OnInit } from '@angular/core';
import { UtilisateursService } from './utilisateurs.service';

@Component({
  selector: 'app-utilisateurs',
  templateUrl: './utilisateurs.component.html',
  styleUrls: ['./utilisateurs.component.css']
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
        this.users = data;
        this.loading = false;
        console.log('✅ Utilisateurs chargés:', data);
      },
      error: (error) => {
        this.error = 'Erreur lors du chargement des utilisateurs';
        this.loading = false;
        console.error('❌ Erreur:', error);
        
        // Afficher plus de détails sur l'erreur
        if (error.status === 401) {
          console.error('🔴 Non authentifié - Token invalide ou expiré');
        } else if (error.status === 403) {
          console.error('🔴 Accès refusé - Rôle insuffisant');
        } else if (error.status === 500) {
          console.error('🔴 Erreur serveur:', error.error);
        }
      }
    });
  }
}
```

---

## 🎯 Checklist de Résolution

- [ ] Backend Spring Boot démarré sur port 8081
- [ ] Keycloak démarré sur port 8080
- [ ] Rôles créés dans Keycloak (ADMIN, CHEF_DE_PROJET, etc.)
- [ ] Test de l'API avec Postman → Fonctionne ✅
- [ ] CORS activé dans Spring Boot
- [ ] Proxy Angular configuré (proxy.conf.json)
- [ ] Angular redémarré après configuration du proxy
- [ ] Token stocké dans localStorage après login
- [ ] Token envoyé dans le header Authorization
- [ ] URL correcte utilisée dans Angular

---

## 🚀 Résumé Rapide

### Configuration proxy.conf.json (à la racine du projet Angular):
```json
{
  "/api": {
    "target": "http://localhost:8081",
    "secure": false,
    "changeOrigin": true
  }
}
```

### Modifier angular.json:
```json
"serve": {
  "options": {
    "proxyConfig": "proxy.conf.json"
  }
}
```

### Redémarrer Angular:
```bash
ng serve
```

### Utiliser URL relative dans le code:
```typescript
this.http.get('/api/admin/users', { headers })
```

**✅ Cela devrait résoudre votre problème !**

Si vous avez toujours une erreur, envoyez-moi les logs complets de Spring Boot pour que je puisse identifier l'erreur exacte.

