import { execSync } from "node:child_process";

/**
 * Applique les migrations sur la base de test (DATABASE_URL) avant la suite.
 */
export default async function globalSetup(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL est requis pour les tests (base PostgreSQL dédiée aux tests)."
    );
  }

  execSync("npx prisma migrate deploy", { stdio: "inherit" });
}
