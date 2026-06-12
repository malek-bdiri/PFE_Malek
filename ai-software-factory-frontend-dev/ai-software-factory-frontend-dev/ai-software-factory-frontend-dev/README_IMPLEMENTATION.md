# MomSoft Frontend - Application d'authentification

## 🚀 Fonctionnalités implémentées

✅ Système d'authentification complet avec JWT
✅ Interface de connexion moderne avec Tailwind CSS
✅ Dashboard admin avec sidebar et navbar responsive
✅ Guard pour protéger les routes
✅ Intercepteur HTTP pour ajouter le token automatiquement
✅ Gestion de l'état utilisateur avec RxJS

## 📦 Installation

```bash
npm install
```

## 🏃 Lancement

```bash
npm start
```

L'application sera accessible sur `http://localhost:4200`

## 🎨 Technologies utilisées

- Angular 16
- Tailwind CSS
- RxJS
- TypeScript
- HttpClient

## 📁 Structure du projet

```
src/
├── app/
│   ├── admin/
│   │   └── admin-dashboard/    # Dashboard admin avec sidebar/navbar
│   ├── auth/
│   │   └── login/               # Page de connexion
│   ├── guards/
│   │   └── auth.guard.ts        # Protection des routes
│   ├── interceptors/
│   │   └── auth.interceptor.ts  # Ajout du token JWT
│   ├── models/
│   │   └── user.model.ts        # Modèles de données
│   ├── services/
│   │   └── auth.service.ts      # Service d'authentification
│   └── app.module.ts            # Module principal
└── assets/
    └── images/
        └── logo.svg             # Logo de l'application
```

## 🔑 Connexion

Par défaut, l'application se connecte à un backend Spring Boot sur `http://localhost:8080/api/auth`

**Identifiants de test (côté backend) :**
- Email: admin@momsoft.com
- Mot de passe: admin123

## 🎯 Routes

- `/login` - Page de connexion
- `/admin/dashboard` - Dashboard admin (protégé par AuthGuard)

## 🛠️ Configuration

### Backend URL
Modifier l'URL du backend dans `src/app/services/auth.service.ts` :
```typescript
private apiUrl = 'http://localhost:8080/api/auth';
```

### Logo
Remplacer le logo par défaut dans `src/assets/images/logo.svg` ou `logo.png`
