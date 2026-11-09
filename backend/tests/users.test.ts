import bcrypt from "bcrypt";
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

let adminToken: string;

beforeEach(async () => {
  await resetDatabase();
  ({ token: adminToken } = await createUserWithToken(Role.ADMIN));
});
afterAll(() => prisma.$disconnect());

const auth = () => ({ Authorization: bearer(adminToken) });

const newUser = {
  firstName: "Alice",
  lastName: "Martin",
  email: "alice@test.com",
  password: "motdepasse8",
};

describe("/v1/users (administrateur)", () => {
  it("crée un utilisateur RECRUITER par défaut avec un mot de passe haché", async () => {
    const res = await request(app).post("/v1/users").set(auth()).send(newUser);

    expect(res.status).toBe(201);
    expect(res.body.data.role).toBe(Role.RECRUITER);

    const stored = await prisma.user.findUniqueOrThrow({
      where: { email: newUser.email },
    });
    expect(stored.password).not.toBe(newUser.password);
    expect(await bcrypt.compare(newUser.password, stored.password)).toBe(true);
  });

  it("refuse un email déjà utilisé (409)", async () => {
    await request(app).post("/v1/users").set(auth()).send(newUser);

    const res = await request(app).post("/v1/users").set(auth()).send(newUser);

    expect(res.status).toBe(409);
  });

  it("refuse un corps invalide (400) en listant les champs en erreur", async () => {
    const res = await request(app)
      .post("/v1/users")
      .set(auth())
      .send({ ...newUser, email: "pas-un-email", password: "court" });

    expect(res.status).toBe(400);
    const fields = res.body.error.details.map((d: { field: string }) => d.field);
    expect(fields).toEqual(expect.arrayContaining(["email", "password"]));
  });

  it("liste les utilisateurs avec pagination", async () => {
    await prisma.user.createMany({
      data: [1, 2].map((i) => ({
        firstName: "User",
        lastName: `N${i}`,
        email: `user${i}@test.com`,
        password: PASSWORD,
      })),
    });

    // 3 utilisateurs au total (admin + 2), 2 par page.
    const res = await request(app)
      .get("/v1/users?page=1&limit=2")
      .set(auth());

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination).toEqual({
      page: 1,
      limit: 2,
      total: 3,
      totalPages: 2,
    });
  });

  it("retourne, met à jour puis supprime un utilisateur", async () => {
    const created = await request(app)
      .post("/v1/users")
      .set(auth())
      .send(newUser);
    const id = created.body.data.id;

    const found = await request(app).get(`/v1/users/${id}`).set(auth());
    expect(found.status).toBe(200);
    expect(found.body.data.email).toBe(newUser.email);

    const updated = await request(app)
      .put(`/v1/users/${id}`)
      .set(auth())
      .send({ firstName: "Alicia" });
    expect(updated.status).toBe(200);
    expect(updated.body.data.firstName).toBe("Alicia");

    const deleted = await request(app).delete(`/v1/users/${id}`).set(auth());
    expect(deleted.status).toBe(200);

    const gone = await request(app).get(`/v1/users/${id}`).set(auth());
    expect(gone.status).toBe(404);
  });

  it.each([
    ["get", undefined],
    ["put", { firstName: "Nouveau" }],
    ["delete", undefined],
  ])("%s sur un utilisateur inexistant : 404", async (method, body) => {
    const req = (request(app) as any)[method]("/v1/users/inconnu").set(auth());

    const res = await (body ? req.send(body) : req);

    expect(res.status).toBe(404);
  });
});
