import { Request, Response } from "express";

import { errorMiddleware } from "../src/middlewares/error.middleware";
import { authorize } from "../src/middlewares/authorize.middleware";
import { buildPaginationMeta, getPagination } from "../src/utils/pagination";

describe("getPagination", () => {
  it("applique les valeurs par défaut", () => {
    expect(getPagination()).toEqual({ page: 1, limit: 10, skip: 0 });
  });

  it("calcule le décalage et borne page et limite", () => {
    expect(getPagination("3", "20").skip).toBe(40);
    expect(getPagination("0", "1000")).toMatchObject({ page: 1, limit: 100 });
    expect(getPagination("-5", "0")).toMatchObject({ page: 1, limit: 1 });
  });
});

describe("buildPaginationMeta", () => {
  it("arrondit le nombre de pages à l'entier supérieur", () => {
    expect(buildPaginationMeta(1, 10, 21).totalPages).toBe(3);
  });
});

describe("errorMiddleware", () => {
  it("masque le détail d'une erreur inattendue (500)", () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });

    errorMiddleware(
      new Error("détail interne sensible"),
      {} as Request,
      { status } as unknown as Response,
      jest.fn()
    );

    expect(status).toHaveBeenCalledWith(500);
    expect(JSON.stringify(json.mock.calls[0][0])).not.toContain(
      "détail interne sensible"
    );
  });
});

describe("authorize", () => {
  it("retourne 401 si aucun utilisateur n'est authentifié", () => {
    const next = jest.fn();

    authorize("ADMIN" as never)({} as Request, {} as Response, next);

    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 401 });
  });
});
