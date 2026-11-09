import request from "supertest";
import { Role } from "@prisma/client";

import app from "../src/app";
import { prisma } from "../src/config/prisma";
import {
  bearer,
  createCandidate,
  createJob,
  createUserWithToken,
  resetDatabase,
} from "./helpers";

beforeEach(resetDatabase);
afterEach(() => jest.restoreAllMocks());
afterAll(() => prisma.$disconnect());

describe("Santé et informations", () => {
  it("GET /v1/health : l'API est UP", async () => {
    const res = await request(app).get("/v1/health");

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("UP");
  });

  it("GET /v1/ready : prête quand la base répond", async () => {
    const res = await request(app).get("/v1/ready");

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      status: "READY",
      database: "CONNECTED",
    });
  });

  it("GET /v1/ready : 503 quand la base est indisponible", async () => {
    jest.spyOn(prisma, "$queryRaw").mockRejectedValueOnce(new Error("down"));

    const res = await request(app).get("/v1/ready");

    expect(res.status).toBe(503);
    expect(res.body.data.database).toBe("DISCONNECTED");
  });

  it("GET /v1/info et GET / retournent les informations de l'API", async () => {
    const info = await request(app).get("/v1/info");
    const root = await request(app).get("/");

    expect(info.body.data.name).toBe("SouverainRecrut API");
    expect(root.body.documentation).toBe("/api-docs");
  });

  it("retourne 404 JSON pour une route inconnue", async () => {
    const res = await request(app).get("/v1/route-inexistante");

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe("GET /v1/dashboard/stats", () => {
  it("retourne les compteurs de la base", async () => {
    const { user, token } = await createUserWithToken(Role.RECRUITER);
    const candidate = await createCandidate();
    const job = await createJob(user.id);
    await prisma.application.create({
      data: { candidateId: candidate.id, jobId: job.id },
    });

    const res = await request(app)
      .get("/v1/dashboard/stats")
      .set("Authorization", bearer(token));

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      users: 1,
      candidates: 1,
      jobs: 1,
      applications: 1,
      pendingApplications: 1,
    });
  });
});
