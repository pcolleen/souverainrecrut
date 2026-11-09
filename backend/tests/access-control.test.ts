import request from "supertest";
import { Role } from "@prisma/client";

import app from "../src/app";
import { prisma } from "../src/config/prisma";
import { bearer, createUserWithToken, resetDatabase } from "./helpers";

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

// Routes réservées aux administrateurs (le recruteur doit recevoir 403).
const adminOnlyRoutes: Array<[string, string]> = [
  ["get", "/v1/users"],
  ["delete", "/v1/jobs/id-quelconque"],
  ["delete", "/v1/candidates/id-quelconque"],
  ["delete", "/v1/applications/id-quelconque"],
];

// Routes protégées par authentification.
const protectedRoutes: Array<[string, string]> = [
  ["get", "/v1/users"],
  ["get", "/v1/candidates"],
  ["get", "/v1/jobs"],
  ["get", "/v1/applications"],
  ["get", "/v1/dashboard/stats"],
];

describe("Contrôle des accès", () => {
  it.each(protectedRoutes)(
    "%s %s : 401 sans token",
    async (method, path) => {
      const res = await (request(app) as any)[method](path);

      expect(res.status).toBe(401);
    }
  );

  it.each(adminOnlyRoutes)(
    "%s %s : 403 pour un recruteur",
    async (method, path) => {
      const { token } = await createUserWithToken(Role.RECRUITER);

      const res = await (request(app) as any)
        [method](path)
        .set("Authorization", bearer(token));

      expect(res.status).toBe(403);
      expect(res.body.error.message).toMatch(/Permissions insuffisantes/);
    }
  );

  it("autorise un recruteur sur les routes métier et un admin sur /users", async () => {
    const recruiter = await createUserWithToken(Role.RECRUITER);
    const admin = await createUserWithToken(Role.ADMIN);

    const jobs = await request(app)
      .get("/v1/jobs")
      .set("Authorization", bearer(recruiter.token));
    const users = await request(app)
      .get("/v1/users")
      .set("Authorization", bearer(admin.token));

    expect(jobs.status).toBe(200);
    expect(users.status).toBe(200);
  });
});
