# Image de production du backend SouverainRecrut.
#
# Multi-stage : les outils de compilation et les dépendances de développement
# restent dans les étapes intermédiaires, l'image finale ne contient que le
# nécessaire à l'exécution, sous un utilisateur non-root.
#
# Build : docker build -t souverainrecrut-backend:<tag> backend

ARG NODE_IMAGE=node:22.23.4-bookworm-slim

# ---------------------------------------------------------------------------
# Base : Node 22 + OpenSSL (requis par le moteur Prisma)
# ---------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS base
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---------------------------------------------------------------------------
# Compilation TypeScript (dépendances de développement incluses)
# ---------------------------------------------------------------------------
FROM base AS builder
# Les dépendances d'abord : cette couche reste en cache tant que package*.json ne change pas.
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src
RUN npx prisma generate && npm run build

# ---------------------------------------------------------------------------
# Dépendances de production uniquement (+ client Prisma généré)
# ---------------------------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY prisma.config.ts ./
COPY prisma ./prisma
RUN npx prisma generate

# ---------------------------------------------------------------------------
# Image finale
# ---------------------------------------------------------------------------
FROM base AS runner

ENV NODE_ENV=production \
    PORT=4500

# Le dépôt ne contient aucun secret : DATABASE_URL, JWT_SECRET... sont fournis à l'exécution.
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
# Schéma et migrations : permettent `prisma migrate deploy` depuis cette même image.
COPY --chown=node:node package.json prisma.config.ts ./
COPY --chown=node:node prisma ./prisma

# npm, npx, corepack et yarn ne servent pas à l'exécution : on les retire pour réduire
# la surface d'attaque (leurs dépendances embarquées ressortent sinon dans les scans).
# Migrations : node node_modules/prisma/build/index.js migrate deploy
RUN rm -rf /usr/local/lib/node_modules /opt/yarn-* \
    /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
    /usr/local/bin/yarn /usr/local/bin/yarnpkg

USER node

EXPOSE 4500

# Sonde de vie via Node (l'image ne contient pas curl).
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4500)+'/'+(process.env.API_VERSION||'v1')+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/server.js"]
