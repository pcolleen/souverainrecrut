# Intégration continue – SouverainRecrut (backend)

Chaîne CI du backend : tests, analyse qualité, image Docker, scan de sécurité, publication.

```
GitHub (Dev) ─► Jenkins ─► Tests + couverture ─► SonarQube / Quality Gate
                                                     │
                 Docker Hub ◄─ Trivy ◄─ Build image ◄┘
```

## Contenu du dossier

| Fichier | Rôle |
|---|---|
| `Jenkinsfile` | Pipeline Jenkins (versionné avec le code) |
| `sonar/sonar-project.properties` | Configuration de l'analyse SonarQube |
| `docker-compose.tools.yml` | Jenkins + SonarQube (+ leurs bases) + base jetable pour les tests |
| `Dockerfile.jenkins` | Image Jenkins : Node 22, CLI Docker, sonar-scanner, plugins |
| `docker-compose.dev.yml` / `Dockerfile.dev` | Environnement de développement local sans installer Node |
| `.env.example` | Variables du compose (copier vers `.env`, jamais commité) |

Le `Dockerfile` de l'application est dans `backend/` (contexte de build naturel) avec son `.dockerignore`.

## Prérequis

Docker (avec le plugin Compose) et Git. Aucune installation de Node, Jenkins ou SonarQube sur la machine.

## Démarrer les outils

```bash
cd integration-continue
cp .env.example .env
# Renseigner SONAR_DB_PASSWORD (openssl rand -base64 24) et DOCKER_GID (stat -c '%g' /var/run/docker.sock)
docker compose -f docker-compose.tools.yml --env-file .env up -d --build
```

- Jenkins : http://localhost:8080
- SonarQube : http://localhost:9000

## Configuration manuelle (une seule fois)

**SonarQube**
1. Se connecter (`admin` / `admin`), changer le mot de passe.
2. Créer un projet local : clé et nom `souverainrecrut-backend`, branche principale `Dev`.
3. Générer un token (*My Account › Security*).

**Jenkins**
1. Assistant d'installation : « Select plugins to install » (les plugins nécessaires sont déjà dans l'image).
2. *Credentials › Global* : ajouter un *Secret text* d'ID `sonar-token` contenant le token SonarQube.
3. *Administrer Jenkins › System › SonarQube servers* : nom `sonar`, URL `http://sonarqube:9000`
   (nom du service sur le réseau Docker, pas `localhost`), token `sonar-token`, injection des variables d'environnement cochée.
4. Créer un job *Pipeline* : *Pipeline script from SCM*, Git, URL du dépôt, branche `*/Dev`,
   chemin du script `integration-continue/Jenkinsfile`.

La pipeline interroge GitHub toutes les 5 minutes (`pollSCM`) : Jenkins étant local, GitHub ne peut pas le joindre par webhook.

## Étapes de la pipeline

| Étape | Contenu | Bloque si… |
|---|---|---|
| Checkout, Installation, Prisma | `npm ci`, `prisma generate` | échec |
| Tests | Jest + Supertest sur PostgreSQL, rapport `coverage/lcov.info` | un test échoue |
| Analyse SonarQube | `sonar-scanner` + attente du Quality Gate | Quality Gate rouge |
| Image Docker | build multi-stage, tag `<version>-<sha court>` (ex. `1.0.0-21c7b79`) | échec du build |
| Scan Trivy | rapport JSON archivé, HIGH/CRITICAL affichés | faille **CRITICAL** corrigeable |
| Publication Docker Hub | `docker push` | ignorée si `DOCKERHUB_NAMESPACE` est vide |

Politique de sécurité de l'image : seules les failles CRITICAL pour lesquelles un correctif existe font échouer la pipeline.
Les failles HIGH sont visibles et archivées mais non bloquantes ; la faille résiduelle connue (`deepmerge-ts`, outillage Prisma 6)
ne se corrige qu'avec une montée de version majeure de Prisma, volontairement hors périmètre.

## Activer la publication sur Docker Hub

1. Créer un compte sur hub.docker.com puis un token (*Account settings › Personal access tokens*, droits **Read & Write**).
2. Jenkins › *Credentials* : ajouter un *Username with password* d'ID `dockerhub` (identifiant + token).
3. Renseigner `DOCKERHUB_NAMESPACE=<identifiant Docker Hub>` dans `integration-continue/.env`.
4. Recréer Jenkins **quand aucun build ne tourne** : `docker compose -f docker-compose.tools.yml --env-file .env up -d`.

Le token n'est jamais écrit dans le dépôt ni affiché dans les logs (masqué par Jenkins, passé à `docker login --password-stdin`).

## Développer sans installer Node

```bash
cd integration-continue
docker compose -f docker-compose.dev.yml run --rm node npm ci
docker compose -f docker-compose.dev.yml run --rm node npm run test:coverage
```

## Image Docker

```bash
docker build -t souverainrecrut-backend:local backend
# Migrations Prisma (l'image ne contient pas npm) :
docker run --rm -e DATABASE_URL=... souverainrecrut-backend:local node node_modules/prisma/build/index.js migrate deploy
```

L'image s'exécute sous un utilisateur non-root, expose le port 4500 et déclare un `HEALTHCHECK` sur `/v1/health`.
Aucun secret n'est embarqué : `DATABASE_URL` et `JWT_SECRET` sont fournis à l'exécution.

## Limites assumées

- Jenkins monte le socket Docker de l'hôte (droits root sur l'hôte) : acceptable pour un TP local, pas en production.
- Pas de webhook GitHub (Jenkins local) : déclenchement par scrutation, délai de 5 minutes au plus.
- Compte Docker Hub : la publication reste désactivée tant qu'il n'est pas configuré.
