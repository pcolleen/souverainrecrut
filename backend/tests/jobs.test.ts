import request from "supertest";
import { Role } from "@prisma/client";

import app from "../src/app";
import { prisma } from "../src/config/prisma";
import {
  bearer,
  createJob,
  createUserWithToken,
  resetDatabase,
} from "./helpers";

let recruiterId: string;
let recruiterToken: string;
let adminToken: string;

beforeEach(async () => {
  await resetDatabase();
  const recruiter = await createUserWithToken(Role.RECRUITER);
  recruiterId = recruiter.user.id;
  recruiterToken = recruiter.token;
  ({ token: adminToken } = await createUserWithToken(Role.ADMIN));
});
afterAll(() => prisma.$disconnect());

const recruiter = () => ({ Authorization: bearer(recruiterToken) });
const admin = () => ({ Authorization: bearer(adminToken) });

describe("/v1/jobs", () => {
  it("crée une offre rattachée au recruteur", async () => {
    const res = await request(app)
      .post("/v1/jobs")
      .set(recruiter())
      .send({
        title: "Développeur Node",
        description: "Description suffisamment longue.",
        location: "Rennes",
        company: "SouverainRecrut",
        recruiterId,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.recruiterId).toBe(recruiterId);
  });

  it("refuse une offre invalide (400)", async () => {
    const res = await request(app)
      .post("/v1/jobs")
      .set(recruiter())
      .send({ title: "ab" });

    expect(res.status).toBe(400);
    expect(res.body.error.details.length).toBeGreaterThan(1);
  });

  it("liste les offres avec pagination", async () => {
    await createJob(recruiterId, "Offre 1");
    await createJob(recruiterId, "Offre 2");

    const res = await request(app).get("/v1/jobs?page=1&limit=1").set(recruiter());

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.pagination.total).toBe(2);
  });

  it("retourne, met à jour puis supprime une offre (suppression admin)", async () => {
    const { id } = await createJob(recruiterId);

    const found = await request(app).get(`/v1/jobs/${id}`).set(recruiter());
    expect(found.status).toBe(200);

    const updated = await request(app)
      .put(`/v1/jobs/${id}`)
      .set(recruiter())
      .send({ title: "Titre modifié" });
    expect(updated.body.data.title).toBe("Titre modifié");

    const deleted = await request(app).delete(`/v1/jobs/${id}`).set(admin());
    expect(deleted.status).toBe(200);
    expect(await prisma.job.count()).toBe(0);
  });

  it("retourne 404 pour une offre inexistante", async () => {
    const res = await request(app).get("/v1/jobs/inconnue").set(recruiter());

    expect(res.status).toBe(404);
  });
});
