/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.ts"],

  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.test.json",
        // TS151002 : avertissement lié à module NodeNext ; on garde la
        // vérification de types plutôt que d'activer isolatedModules.
        diagnostics: { ignoreCodes: [151002] },
      },
    ],
  },

  // Applique les migrations Prisma sur la base de test avant la suite.
  globalSetup: "<rootDir>/tests/global-setup.ts",
  // Variables d'environnement requises avant l'import de l'application.
  setupFiles: ["<rootDir>/tests/env-setup.ts"],
  // Désactive les logs HTTP de morgan pendant les tests.
  setupFilesAfterEnv: ["<rootDir>/tests/silence-logger.ts"],

  // Couverture : rapport lcov lu par SonarQube.
  collectCoverageFrom: [
    "src/**/*.ts",
    // Point d'entrée (app.listen) : démarrage du serveur, pas de logique métier.
    "!src/server.ts",
    "!src/**/*.d.ts",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "text-summary", "lcov"],
};
