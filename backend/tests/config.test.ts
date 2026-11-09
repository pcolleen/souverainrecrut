// Tests de la configuration lue au chargement des modules : chaque cas recharge
// le module dans un registre isolé avec un environnement contrôlé.

// dotenv est neutralisé : un éventuel fichier .env local ne doit pas fausser les cas.
jest.mock("dotenv", () => ({
  __esModule: true,
  default: { config: jest.fn() },
}));

const ENV_KEYS = [
  "PORT",
  "NODE_ENV",
  "DATABASE_URL",
  "JWT_SECRET",
  "API_VERSION",
  "FRONTEND_URL",
];

/**
 * Exécute `fn` avec un environnement contrôlé, puis restaure l'environnement d'origine.
 */
function withEnv<T>(vars: Record<string, string>, fn: () => T): T {
  const saved = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));

  ENV_KEYS.forEach((key) => delete process.env[key]);
  Object.assign(process.env, vars);

  try {
    return fn();
  } finally {
    ENV_KEYS.forEach((key) => {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    });
  }
}

describe("config/env", () => {
  const loadEnv = (vars: Record<string, string>) =>
    withEnv(vars, () => {
      let env: unknown;
      jest.isolateModules(() => {
        env = require("../src/config/env").env;
      });
      return env;
    });

  it("applique les valeurs par défaut quand aucune variable n'est définie", () => {
    expect(loadEnv({})).toEqual({
      port: 4500,
      nodeEnv: "development",
      databaseUrl: "",
      jwtSecret: "",
      apiVersion: "v1",
      frontendUrl: "http://localhost:5173",
    });
  });

  it("utilise les variables d'environnement quand elles sont définies", () => {
    expect(
      loadEnv({
        PORT: "5000",
        NODE_ENV: "production",
        DATABASE_URL: "postgresql://u:p@db:5432/app",
        JWT_SECRET: "secret",
        API_VERSION: "v2",
        FRONTEND_URL: "https://app.example.com",
      })
    ).toEqual({
      port: 5000,
      nodeEnv: "production",
      databaseUrl: "postgresql://u:p@db:5432/app",
      jwtSecret: "secret",
      apiVersion: "v2",
      frontendUrl: "https://app.example.com",
    });
  });
});

describe("middlewares/logger", () => {
  // morgan est remplacé par un espion : on vérifie le format de log choisi.
  jest.mock("morgan", () => ({
    __esModule: true,
    default: jest.fn(() => jest.fn()),
  }));

  const morganFormatFor = (nodeEnv: string) =>
    withEnv({ NODE_ENV: nodeEnv }, () => {
      let format: unknown;
      jest.isolateModules(() => {
        require("../src/middlewares/logger.middleware");
        format = require("morgan").default.mock.calls[0][0];
      });
      return format;
    });

  it("utilise le format détaillé en production", () => {
    expect(morganFormatFor("production")).toBe("combined");
  });

  it("utilise le format court hors production", () => {
    expect(morganFormatFor("development")).toBe("dev");
  });
});
