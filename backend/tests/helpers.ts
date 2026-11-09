import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";

import { prisma } from "../src/config/prisma";

export const PASSWORD = "password123";

/**
 * Vide toutes les tables entre deux tests.
 */
export async function resetDatabase(): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "applications", "jobs", "candidates", "users" RESTART IDENTITY CASCADE'
  );
}

/**
 * Crée un utilisateur en base et retourne l'utilisateur et un JWT valide.
 */
export async function createUserWithToken(
  role: Role,
  email = `${role.toLowerCase()}@test.com`
) {
  const user = await prisma.user.create({
    data: {
      firstName: "Test",
      lastName: role,
      email,
      // Coût faible : suffisant pour les tests, bien plus rapide.
      password: await bcrypt.hash(PASSWORD, 4),
      role,
    },
  });

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET as string
  );

  return { user, token };
}

export const bearer = (token: string) => `Bearer ${token}`;

export async function createCandidate(email = "candidat@test.com") {
  return prisma.candidate.create({
    data: { fullName: "Candidat Test", email },
  });
}

export async function createJob(recruiterId: string, title = "Développeur Node") {
  return prisma.job.create({
    data: {
      title,
      description: "Description de l'offre de test.",
      location: "Rennes",
      company: "SouverainRecrut",
      recruiterId,
    },
  });
}
