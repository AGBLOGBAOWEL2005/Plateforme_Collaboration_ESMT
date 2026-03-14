# Rapport du projet



Ce document décrit **comment configurer et lancer le projet** (backend Django + frontend Angular) et fournit une **vue d'ensemble des modèles de données** et des **routes API disponibles**.

---

## A. Instructions pour configurer et lancer le projet

### 1) Prérequis

- **Python 3.11+** (ou 3.10+)
- **Node.js 18+** (pour Angular)
- **npm 10+**
- (Optionnel) **PlantUML + Java** si tu veux exporter un diagramme MCD/MLD.

### 2) Configurer l'environnement Python (backend Django)

1. Depuis la racine du projet (`.../projet`), créer/activer un environnement virtuel :

   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

2. Installer les dépendances Python du projet :

   > Le projet utilise Django + Django REST Framework + JWT + CORS. Si tu n'as pas de `requirements.txt`, installe les packages suivants :

   ```powershell
   pip install django djangorestframework djangorestframework-simplejwt django-cors-headers
   ```

3. (Optionnel) Si tu veux gérer les images/fichiers médias dans `media/`, vérifie que ce dossier existe et est accessible en écriture.

4. Appliquer les migrations :

   ```powershell
   python manage.py migrate
   ```

5. Créer un superutilisateur (facultatif, utile pour accéder à l’admin Django) :

   ```powershell
   python manage.py createsuperuser
   ```

6. Lancer le serveur Django :

   ```powershell
   python manage.py runserver
   ```

   Le backend sera disponible par défaut sur : `http://127.0.0.1:8000/`.

### 3) Configurer et lancer le frontend Angular

1. Aller dans le dossier `angular_front` :

   ```powershell
   cd angular_front
   ```

2. Installer les dépendances npm :

   ```powershell
   npm install
   ```

3. Démarrer l'application Angular :

   ```powershell
   npm start
   ```

   Le frontend démarrera généralement sur : `http://localhost:4200/`.

> ⚠️ Le backend Django attend par défaut les requêtes venant de `http://localhost:4200` (CORS configuré dans `collaboration_app/settings.py`).

---

## B. Modèles de données (MCD / MLD)

### Principaux modèles (apps)

#### 1) `utilisateur` (modèle : `Utilisateur`)
- Hérite de `AbstractUser`.
- Champs supplémentaires :
  - `role` (ADMIN / PROFESSEUR / ETUDIANT)
  - `photo` (ImageField, répertoire `media/profiles/`)
  - `prenom`, `nom`

#### 2) `gestion_projets`
- `Projet`
  - `titre`, `description`, `date_debut`, `date_fin`
  - `createur` (FK → `Utilisateur`)
  - Relations : documents (`DocumentProjet`), tâches (`Tache`)

- `DocumentProjet`
  - `projet` (FK → `Projet`)
  - `fichier` (FileField, répertoire `media/projets/documents/`)
  - `nom_document`, `date_upload`

- `Tache`
  - `titre`, `description`, `date_limite`, `statut`, `fichier_rendu`
  - `projet` (FK → `Projet`)
  - `assigned_to` (FK → `Utilisateur`)
  - Enregistrement automatique de `date_fin_reelle` quand le statut passe à `TERMINE`

#### 3) `communication`
- `Conversation`
  - `type` (PRIVE / PROJET)
  - `project` (FK optionnelle vers `Projet`)
  - `participants` (M2M vers `Utilisateur`)

- `Message`
  - `conversation` (FK → `Conversation`)
  - `sender` (FK → `Utilisateur`)
  - `contenu`, `date_envoi`, `lu`
  - `message_parent` (self-FK pour réponses)

- `Reaction`
  - `message` (FK → `Message`)
  - `user` (FK → `Utilisateur`)
  - `emoji`
  - Contrat d’unicité : `(message, user, emoji)`

- `Notification`
  - `user` (FK → `Utilisateur`)
  - `notification` (texte), `date_notification`, `lu`

#### 4) `evaluation`
- Fournit une API de calcul de primes basées sur les tâches des enseignants.

---

## C. Routes API disponibles

### Auth / JWT
- **POST** `/api/token/` → obtenir un JWT (access + refresh)
- **POST** `/api/token/refresh/` → rafraîchir le jeton JWT

### Utilisateurs
- **GET /api/users/users/** → lister tous les utilisateurs (JWT requis)
- **POST /api/users/users/** → créer un utilisateur (JWT requis)
- **POST /api/users/register/** → inscription (création d’un compte)
- **POST /api/users/session-login/** → session Django (login via cookie)
- **GET /api/users/me/** → infos du compte courant
- **PATCH /api/users/me/** → modifier son profil (mot de passe possible)

### Projets (`gestion_projets`)
- **GET /api/projets/projets/** → lister les projets accessibles (créateur / membre / admin)
- **POST /api/projets/projets/** → créer un projet (utilisateur connecté)
- **GET /api/projets/projets/{id}/** → consulter un projet
- **PATCH /api/projets/projets/{id}/** → modifier un projet
- **DELETE /api/projets/projets/{id}/** → supprimer un projet

### Tâches (`gestion_projets`)
- **GET /api/projets/taches/** → lister les tâches visibles (admin / assignee / créateur)
- **POST /api/projets/taches/** → créer une tâche (seul le créateur du projet ou un admin)
- **GET /api/projets/taches/{id}/** → consulter une tâche
- **PATCH /api/projets/taches/{id}/** → mettre à jour (statut, fichier rendu, etc.)
- **DELETE /api/projets/taches/{id}/** → supprimer une tâche

### Documents (`gestion_projets`)
- **GET /api/projets/documents/** → lister les documents de projet accessibles
- **POST /api/projets/documents/** → uploader un document
- **GET /api/projets/documents/{id}/** → détails du document
- **DELETE /api/projets/documents/{id}/** → supprimer le document

### Communication (`communication`)
- **GET /api/communication/conversations/** → lister les conversations de l’utilisateur
- **POST /api/communication/conversations/** → créer une conversation
- **GET /api/communication/conversations/{id}/** → détails d’une conversation
- **GET /api/communication/messages/** → lister les messages visibles (filtre `?conversation=<id>` possible)
- **POST /api/communication/messages/** → envoyer un message (champ `conversation` requis)
- **POST /api/communication/messages/{id}/react/** → réagir à un message (envoie `emoji`)
- **GET /api/communication/notifications/** → lister les notifications de l’utilisateur

### Évaluation (`evaluation`)
- **GET /api/evaluation/primes/** → stats et calcul de primes pour les enseignants
  - Query params possibles : `periode=[trimestre|annee]`, `trimestre=[T1|T2|T3|T4]`, `annee=YYYY`

---

## D. Notes utiles

- **Authentification** : la plupart des endpoints requièrent un token JWT (`Authorization: Bearer <token>`), sauf ceux explicitement déclarés `AllowAny`.
- **Médias (fichiers)** : accessibles en HTTP via la configuration `MEDIA_URL` (`/media/`) lorsque le serveur Django tourne.
- **Angular** : le frontend communique avec le backend via `http://localhost:8000/api/...` (base définie dans le code front).

Si tu veux que je génère un diagramme MCD/MLD (image) directement dans le repo, dis-le et je l’ajoute (PlantUML ou un fichier exporté).
