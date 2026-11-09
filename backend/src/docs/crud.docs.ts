/**
 * Fabrique de documentation OpenAPI pour une ressource CRUD paginée.
 *
 * Les ressources Users, Candidates, Jobs et Applications exposent exactement
 * les mêmes cinq routes ; seuls les libellés et les exemples changent.
 * Ce module porte la structure commune, chaque ressource ne fournit que ses textes.
 */

type SchemaProperty = Record<string, unknown>;

export interface CrudDocsConfig {
  /** Tag Swagger (ex. « Users »). */
  tag: string;

  /** Chemin de la collection (ex. « /users »). */
  path: string;

  /** Libellé affiché quand la ressource est introuvable (404). */
  notFound: string;

  list: {
    summary: string;
    description: string;
    ok: string;
    /** Éléments donnés en exemple dans la réponse paginée. */
    items: object[];
  };

  create: {
    summary: string;
    created: string;
    properties: Record<string, SchemaProperty>;
    required: string[];
    /** Description de la réponse 409, si la création peut provoquer un conflit. */
    conflict?: string;
  };

  getOne: { summary: string; found: string };

  update: {
    summary: string;
    updated: string;
    /** Propriétés modifiables ; par défaut celles de la création, sans exemples. */
    properties?: Record<string, SchemaProperty>;
  };

  remove: { summary: string; removed: string };
}

const security = [{ bearerAuth: [] }];

const idParameter = [
  {
    in: "path",
    name: "id",
    required: true,
    schema: { type: "string" },
  },
];

const paginationParameters = [
  { in: "query", name: "page", schema: { type: "integer", default: 1 } },
  { in: "query", name: "limit", schema: { type: "integer", default: 10 } },
];

const jsonBody = (schema: object) => ({
  required: true,
  content: { "application/json": { schema } },
});

/** Retire l'exemple d'une propriété (les propriétés de modification n'en ont pas). */
const withoutExample = (property: SchemaProperty): SchemaProperty => {
  const copy = { ...property };
  delete copy.example;
  return copy;
};

export function crudDocs(config: CrudDocsConfig) {
  const { tag, path, notFound, list, create, getOne, update, remove } = config;

  const updateProperties =
    update.properties ??
    Object.fromEntries(
      Object.entries(create.properties).map(([name, property]) => [
        name,
        withoutExample(property),
      ])
    );

  const notFoundResponse = { description: notFound };

  return {
    [path]: {
      get: {
        tags: [tag],
        summary: list.summary,
        description: list.description,
        security,
        parameters: paginationParameters,
        responses: {
          200: {
            description: list.ok,
            content: {
              "application/json": {
                example: {
                  success: true,
                  data: list.items,
                  pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
                },
              },
            },
          },
          401: { description: "Authentification requise." },
        },
      },

      post: {
        tags: [tag],
        summary: create.summary,
        security,
        requestBody: jsonBody({
          type: "object",
          properties: create.properties,
          required: create.required,
        }),
        responses: {
          201: { description: create.created },
          400: { description: "Erreur de validation." },
          ...(create.conflict && { 409: { description: create.conflict } }),
        },
      },
    },

    [`${path}/{id}`]: {
      get: {
        tags: [tag],
        summary: getOne.summary,
        security,
        parameters: idParameter,
        responses: {
          200: { description: getOne.found },
          404: notFoundResponse,
        },
      },

      put: {
        tags: [tag],
        summary: update.summary,
        security,
        parameters: idParameter,
        requestBody: jsonBody({
          type: "object",
          properties: updateProperties,
        }),
        responses: {
          200: { description: update.updated },
          404: notFoundResponse,
        },
      },

      delete: {
        tags: [tag],
        summary: remove.summary,
        security,
        parameters: idParameter,
        responses: {
          200: { description: remove.removed },
          404: notFoundResponse,
        },
      },
    },
  };
}
