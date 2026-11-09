import request from "supertest";
import { Role } from "@prisma/client";

import app from "../src/app";
import { prisma } from "../src/config/prisma";
import {
  bearer,
  createCandidate,
  createUserWithToken,
  resetDatabase,
} from "./helpers";

let recruiterToken: string;
let adminToken: string;

beforeEach(async () => {
  await resetDatabase();
  ({ token: recruiterToken } = await createUserWithToken(Role.RECRUITER));
  ({ token: adminToken } = await createUserWithToken(Role.ADMIN));
});
afterAll(() => prisma.$disconnect());

const recruiter = () => ({ Authorization: bearer(recruiterToken) });
const admin = () => ({ Authorization: bearer(adminToken) });

const payload = {
  fullName: "Mamadou Bah",
  email: "Mamadou@Example.com",
  phone: "+224620000001",
};

describe("/v1/candidates", () => {
  it("crée un candidat et normalise son email en minuscules", async () => {
    const res = await request(app)
      .post("/v1/candidates")
      .set(recruiter())
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.data.email).toBe("mamadou@example.com");
  });

  it("refuse un email déjà enregistré (409)", async () => {
    await createCandidate("mamadou@example.com");

    const res = await request(app)
      .post("/v1/candidates")
      .set(recruiter())
      .send(payload);

    expect(res.status).toBe(409);
  });

  it("refuse un corps invalide (400)", async () => {
    const res = await request(app)
      .post("/v1/candidates")
      .set(recruiter())
      .send({ fullName: "ab", email: "invalide" });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe("Erreur de validation.");
  });

  it("liste les candidats avec pagination", async () => {
    await createCandidate("a@test.com");
    await createCandidate("b@test.com");
    await createCandidate("c@test.com");

    const res = await request(app)
      .get("/v1/candidates?limit=2")
      .set(recruiter());

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination).toMatchObject({ total: 3, totalPages: 2 });
  });

  it("retourne, met à jour puis supprime un candidat (suppression admin)", async () => {
    const { id } = await createCandidate();

    const found = await request(app).get(`/v1/candidates/${id}`).set(recruiter());
    expect(found.status).toBe(200);

    const updated = await request(app)
      .put(`/v1/candidates/${id}`)
      .set(recruiter())
      .send({ fullName: "Nouveau Nom" });
    expect(updated.body.data.fullName).toBe("Nouveau Nom");

    const deleted = await request(app).delete(`/v1/candidates/${id}`).set(admin());
    expect(deleted.status).toBe(200);
    expect(await prisma.candidate.count()).toBe(0);
  });

  it("retourne 404 pour un candidat inexistant", async () => {
    const res = await request(app).get("/v1/candidates/inconnu").set(recruiter());

    expect(res.status).toBe(404);
  });
});
