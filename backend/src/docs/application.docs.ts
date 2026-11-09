import { crudDocs } from "./crud.docs";

const statusProperty = (example: string) => ({
  type: "string",
  enum: ["PENDING", "REVIEW", "ACCEPTED", "REJECTED"],
  example,
});

export const applicationDocs = {
  paths: crudDocs({
    tag: "Applications",
    path: "/applications",
    notFound: "Candidature introuvable.",

    list: {
      summary: "Lister les candidatures",
      description: "Retourne la liste paginée des candidatures.",
      ok: "Liste des candidatures.",
      items: [
        {
          id: "cmr0rce8c0005yws40qkwhdwa",
          candidateId: "cmr0rce880001yws4aobnd3rl",
          jobId: "cmr0rce8a0003yws4haulp35i",
          status: "PENDING",
          candidate: {
            id: "cmr0rce880001yws4aobnd3rl",
            fullName: "Mamadou Bah",
            email: "mamadou@example.com",
          },
          job: {
            id: "cmr0rce8a0003yws4haulp35i",
            title: "Développeur Full Stack",
            company: "SouverainTech",
          },
        },
      ],
    },

    create: {
      summary: "Créer une candidature",
      created: "Candidature créée.",
      properties: {
        candidateId: { type: "string", example: "cmr0rce880001yws4aobnd3rl" },
        jobId: { type: "string", example: "cmr0rce8a0003yws4haulp35i" },
        status: statusProperty("PENDING"),
      },
      required: ["candidateId", "jobId"],
    },

    getOne: {
      summary: "Obtenir une candidature",
      found: "Candidature trouvée.",
    },

    // Seul le statut est modifiable (avec un autre exemple qu'à la création).
    update: {
      summary: "Modifier une candidature",
      updated: "Candidature mise à jour.",
      properties: { status: statusProperty("REVIEW") },
    },

    remove: {
      summary: "Supprimer une candidature",
      removed: "Candidature supprimée.",
    },
  }),
};
