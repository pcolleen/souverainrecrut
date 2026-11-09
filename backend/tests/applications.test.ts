import request from "supertest";
import { ApplicationStatus, Role } from "@prisma/client";

import app from "../src/app";
import { prisma } from "../src/config/prisma";
import {
  bearer,
  createCandidate,
  createJob,
  createUserWithToken,
  resetDatabase,
} from "./helpers";

let candidateId: string;
let jobId: string;
let recruiterToken: string;
let adminToken: string;

beforeEach(async () => {
  await resetDatabase();
  const recruiter = await createUserWithToken(Role.RECRUITER);
  recruiterToken = recruiter.token;
  ({ token: adminToken } = await createUserWithToken(Role.ADMIN));
  candidateId = (await createCandidate()).id;
  jobId = (await createJob(recruiter.user.id)).id;
});
afterAll(() => prisma.$disconnect());

const recruiter = () => ({ Authorization: bearer(recruiterToken) });
const admin = () => ({ Authorization: bearer(adminToken) });

describe("/v1/applications", () => {
  it("crée une candidature avec le statut PENDING par défaut", async () => {
    const res = await request(app)
      .post("/v1/applications")
      .set(recruiter())
      .send({ candidateId, jobId });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe(ApplicationStatus.PENDING);
    expect(res.body.data.candidate.id).toBe(candidateId);
    expect(res.body.data.job.id).toBe(jobId);
  });

  it("refuse une candidature sans offre (400)", async () => {
    const res = await request(app)
      .post("/v1/applications")
      .set(recruiter())
      .send({ candidateId });

    expect(res.status).toBe(400);
  });

  it("liste les candidatures avec pagination", async () => {
    await prisma.application.create({ data: { candidateId, jobId } });

    const res = await request(app).get("/v1/applications").set(recruiter());

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.pagination.total).toBe(1);
  });

  it("met à jour le statut puis supprime la candidature (suppression admin)", async () => {
    const { id } = await prisma.application.create({
      data: { candidateId, jobId },
    });

    const found = await request(app).get(`/v1/applications/${id}`).set(recruiter());
    expect(found.status).toBe(200);

    const updated = await request(app)
      .put(`/v1/applications/${id}`)
      .set(recruiter())
      .send({ status: ApplicationStatus.ACCEPTED });
    expect(updated.status).toBe(200);
    expect(updated.body.data.status).toBe(ApplicationStatus.ACCEPTED);

    const deleted = await request(app).delete(`/v1/applications/${id}`).set(admin());
    expect(deleted.status).toBe(200);
    expect(await prisma.application.count()).toBe(0);
  });

  it("refuse un statut inconnu (400)", async () => {
    const { id } = await prisma.application.create({
      data: { candidateId, jobId },
    });

    const res = await request(app)
      .put(`/v1/applications/${id}`)
      .set(recruiter())
      .send({ status: "INCONNU" });

    expect(res.status).toBe(400);
  });

  it("retourne 404 pour une candidature inexistante", async () => {
    const res = await request(app)
      .get("/v1/applications/inconnue")
      .set(recruiter());

    expect(res.status).toBe(404);
  });
});
