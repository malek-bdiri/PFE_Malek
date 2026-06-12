# 🔧 SOLUTION DÉFINITIVE - Erreur 401 Unauthorized

## 🔴 Problème

Vous obtenez une erreur **401 Unauthorized** depuis Angular, et dans Postman vous utilisez la **mauvaise URL**.

---

## ✅ Corrections Effectuées

### 1. **SecurityConfig.java corrigé** ✅
Les endpoints `/api/auth/**` sont maintenant publics (pas besoin de token pour le login).

### 2. **CORS activé** ✅
Angular peut maintenant faire des requêtes vers le backend.

### 3. **UserController avec logs** ✅
Pour déboguer les problèmes.

---

## 🚀 GUIDE DE TEST COMPLET

### Étape 1: Redémarrer Spring Boot

```powershell
# Arrêtez l'application (Ctrl+C)
cd C:\Users\malek\OneDrive\Bureau\pfeback
.\mvnw.cmd spring-boot:run
```

Attendez: `Started BackApplication in X.XXX seconds`

---

### Étape 2: Test Postman - LOGIN

#### ❌ URL INCORRECTE (ce que vous utilisez):
```
http://localhost:8081/realms/momsoft/protocol/openid-connect/token
```

#### ✅ URL CORRECTE (à utiliser):
```
http://localhost:8081/api/auth/login
```

#### Configuration Postman pour LOGIN:

**1. Créez une nouvelle requête**

**2. Méthode:** `POST`

**3. URL:** 
```
http://localhost:8081/api/auth/login
```

**4. Onglet Headers:**
```
Content-Type: application/json
```

**5. Onglet Body:**
- Sélectionnez `raw`
- Sélectionnez `JSON` dans le menu déroulant
- Collez:
```json
{
  "email": "malekbdiri06@gmail.com",
  "password": "admin"
}
```

**6. Cliquez sur "Send"**

#### ✅ Réponse attendue (200 OK):
```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MDg3MjM4MTYsImlhdCI6MTcwODcyMDIxNiwianRpIjoiYWJjZGVmIiwiaXNzIjoiaHR0cDovL2xvY2FsaG9zdDo4MDgwL3JlYWxtcy9tb21zb2Z0Iiwic3ViIjoiMTIzNDU2Nzg5MCIsInR5cCI6IkJlYXJlciIsImF6cCI6Im1vbXNvZnQtcmVzdC1hcGkiLCJzZXNzaW9uX3N0YXRlIjoieHl6IiwiYWNyIjoiMSIsInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJBRE1JTiIsIm9mZmxpbmVfYWNjZXNzIiwidW1hX2F1dGhvcml6YXRpb24iXX0sInNjb3BlIjoicHJvZmlsZSBlbWFpbCIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwibmFtZSI6Ik1hbGVrIEJkaXJpIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiYWRtaW4iLCJnaXZlbl9uYW1lIjoiTWFsZWsiLCJmYW1pbHlfbmFtZSI6IkJkaXJpIiwiZW1haWwiOiJtYWxla2JkaXJpMDZAZ21haWwuY29tIn0...",
  "role": "ADMIN",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "roles": [
    "ADMIN",
    "offline_access",
    "uma_authorization",
    "default-roles-momsoft"
  ]
}
```

**📝 COPIEZ LE `accessToken` !**

---

### Étape 3: Test Postman - GET USERS

#### Configuration Postman pour GET USERS:

**1. Créez une nouvelle requête**

**2. Méthode:** `GET`

**3. URL:** 
```
http://localhost:8081/api/admin/users
```

**4. Onglet Authorization:**
- Type: `Bearer Token`
- Token: **COLLEZ LE ACCESS TOKEN DU LOGIN**

**OU dans l'onglet Headers:**
```
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

**5. Cliquez sur "Send"**

#### ✅ Réponse attendue (200 OK):
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
  {
    "id": "user-id-456",
    "firstname": "Malek",
    "lastname": "Bdiri",
    "email": "malek.bdiri@esprit.tn",
    "enabled": true,
    "role": "CHEF_DE_PROJET"
  },
  {
    "id": "user-id-789",
    "firstname": "Malek",
    "lastname": "Bdiri",
    "email": "malekbdiri05@gmail.com",
    "enabled": true,
    "role": "EDITEUR"
  }
]
```

#### Vérifiez les logs Spring Boot:
```
🔵 Début récupération des utilisateurs
🔵 Récupération de tous les utilisateurs du realm momsoft
✅ 3 utilisateurs trouvés
✅ 3 utilisateurs récupérés
```

---

### Étape 4: Corriger Angular

Une fois que Postman fonctionne, corrigez Angular.

#### A. Configuration du Service Angular

**utilisateurs.service.ts:**

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UtilisateursService {
  // ✅ URL correcte vers le backend
  private apiUrl = 'http://localhost:8081/api/admin/users';

  constructor(private http: HttpClient) {}

  getUsers(): Observable<any[]> {
    // Récupérer le token depuis localStorage
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      console.error('❌ Token non trouvé dans localStorage');
      throw new Error('Non authentifié - Veuillez vous connecter');
    }

    console.log('🔵 Envoi requête avec token:', token.substring(0, 20) + '...');

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.get<any[]>(this.apiUrl, { headers });
  }
}
```

#### B. Vérifier que le token est stocké après le login

**auth.service.ts (ou login.component.ts):**

```typescript
login(email: string, password: string) {
  this.http.post('http://localhost:8081/api/auth/login', { email, password })
    .subscribe({
      next: (response: any) => {
        console.log('✅ Login réussi:', response);
        
        // ✅ IMPORTANT: Stocker le token
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        localStorage.setItem('role', response.role);
        
        // Rediriger vers la page des utilisateurs
        this.router.navigate(['/utilisateurs']);
      },
      error: (error) => {
        console.error('❌ Erreur login:', error);
      }
    });
}
```

#### C. Vérifier dans la console du navigateur

Ouvrez la console (F12) et vérifiez:

```javascript
// Vérifier que le token est stocké
console.log('Token:', localStorage.getItem('accessToken'));
```

Si le token est `null`, c'est que le login n'a pas fonctionné ou que vous n'avez pas stocké le token.

---

## 🐛 Diagnostic des Erreurs

### Erreur 401 dans Postman
**Cause:** Token manquant ou invalide

**Solutions:**
1. ✅ Vérifiez que vous avez fait le login avant
2. ✅ Vérifiez que le token est dans le header `Authorization: Bearer {token}`
3. ✅ Vérifiez que le token n'est pas expiré (refaites un login)

### Erreur 401 depuis Angular
**Cause:** Token non envoyé ou mal formaté

**Solutions:**
1. ✅ Vérifiez que le token est dans localStorage
   ```typescript
   const token = localStorage.getItem('accessToken');
   console.log('Token:', token);
   ```

2. ✅ Vérifiez que le header est bien envoyé
   ```typescript
   const headers = new HttpHeaders({
     'Authorization': `Bearer ${token}`
   });
   console.log('Headers:', headers);
   ```

3. ✅ Vérifiez dans l'onglet Network (F12) que le header est présent
   - Ouvrez F12
   - Onglet Network
   - Faites la requête
   - Cliquez sur la requête
   - Onglet Headers
   - Vérifiez que `Authorization: Bearer ...` est présent

### Erreur 403 Forbidden
**Cause:** L'utilisateur n'a pas le rôle ADMIN

**Solution:** 
1. Allez dans Keycloak
2. Realm `momsoft` → Users → Sélectionnez l'utilisateur
3. Role mapping → Assign role → Sélectionnez `ADMIN`

### Erreur 500 Internal Server Error
**Cause:** Erreur dans le backend (Keycloak non accessible, etc.)

**Solution:**
1. Vérifiez les logs Spring Boot dans la console
2. Vérifiez que Keycloak est démarré sur http://localhost:8080
3. Vérifiez que le realm `momsoft` existe

---

## 📋 Checklist Complète

### Backend:
- [ ] Spring Boot redémarré ✅
- [ ] Keycloak démarré sur port 8080 ✅
- [ ] Realm `momsoft` existe ✅
- [ ] Utilisateurs créés ✅
- [ ] Rôles créés (ADMIN, CHEF_DE_PROJET, EDITEUR, LECTEUR) ✅
- [ ] Rôles assignés aux utilisateurs ✅

### Postman:
- [ ] Login fonctionne avec URL `/api/auth/login` ✅
- [ ] Token reçu ✅
- [ ] GET /api/admin/users fonctionne avec le token ✅
- [ ] Liste des utilisateurs retournée ✅

### Angular:
- [ ] URL correcte: `http://localhost:8081/api/admin/users` ✅
- [ ] Token stocké dans localStorage après login ✅
- [ ] Token envoyé dans le header Authorization ✅
- [ ] Pas d'erreur 401 ✅

---

## 🎯 Résumé des URLs

| Description | URL | Méthode |
|-------------|-----|---------|
| **Login** | `http://localhost:8081/api/auth/login` | POST |
| **Get Users** | `http://localhost:8081/api/admin/users` | GET (avec token) |
| **Keycloak** | `http://localhost:8080` | - |
| **Frontend** | `http://localhost:4200` | - |

---

## ✅ Test Final

Si tout est configuré correctement:

1. ✅ Login Postman → Token reçu
2. ✅ GET Users Postman → Liste des utilisateurs
3. ✅ Login Angular → Token stocké dans localStorage
4. ✅ GET Users Angular → Liste affichée dans l'interface

**🎉 Votre application fonctionne !**

---

## 🆘 Toujours bloqué ?

Partagez:
1. La **réponse exacte** du login Postman
2. Les **logs Spring Boot** (depuis le démarrage)
3. Le contenu de **localStorage** dans Angular (F12 → Application → Local Storage)
4. Les **erreurs dans la console** Angular (F12 → Console)

