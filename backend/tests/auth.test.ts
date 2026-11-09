import request from "supertest";
import { Role } from "@prisma/client";

import app from "../src/app";
import { prisma } from "../src/config/prisma";
import {
  PASSWORD,
  bearer,
  createUserWithToken,
  resetDatabase,
} from "./helpers";

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

describe("POST /v1/auth/login", () => {
  it("retourne un token et l'utilisateur sans son mot de passe", async () => {
    const { user } = await createUserWithToken(Role.RECRUITER);

    const res = await request(app)
      .post("/v1/auth/login")
      .send({ email: user.email, password: PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user.email).toBe(user.email);
    expect(res.body.data.user).not.toHaveProperty("password");
  });

  it.each([
    ["mot de passe incorrect", "recruiter@test.com", "mauvais-mot-de-passe"],
    ["email inconnu", "inconnu@test.com", PASSWORD],
  ])("refuse la connexion : %s", async (_cas, email, password) => {
    await createUserWithToken(Role.RECRUITER);

    const res = await request(app)
      .post("/v1/auth/login")
      .send({ email, password });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe("Email ou mot de passe invalide.");
  });
});

describe("GET /v1/auth/me", () => {
  it("retourne le profil de l'utilisateur connecté", async () => {
    const { user, token } = await createUserWithToken(Role.ADMIN);

    const res = await request(app)
      .get("/v1/auth/me")
      .set("Authorization", bearer(token));

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: user.id, role: Role.ADMIN });
    expect(res.body.data).not.toHaveProperty("password");
  });

  it.each([
    ["sans en-tête Authorization", undefined],
    ["schéma différent de Bearer", "Basic abc"],
    ["token invalide", "Bearer pas.un.jwt"],
  ])("refuse l'accès : %s", async (_cas, authorization) => {
    const req = request(app).get("/v1/auth/me");
    if (authorization) req.set("Authorization", authorization);

    const res = await req;

    expect(res.status).toBe(401);
  });

  it("retourne 404 si l'utilisateur du token n'existe plus", async () => {
    const { user, token } = await createUserWithToken(Role.RECRUITER);
    await prisma.user.delete({ where: { id: user.id } });

    const res = await request(app)
      .get("/v1/auth/me")
      .set("Authorization", bearer(token));

    expect(res.status).toBe(404);
  });
});
