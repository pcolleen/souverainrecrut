// morgan écrit directement sur stdout : on le remplace par un middleware neutre.
jest.mock("morgan", () => () => (_req: unknown, _res: unknown, next: () => void) =>
  next()
);
