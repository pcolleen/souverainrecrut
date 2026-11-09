import { crudDocs } from "./crud.docs";

export const jobDocs = {
  paths: crudDocs({
    tag: "Jobs",
    path: "/jobs",
    notFound: "Offre introuvable.",

    list: {
      summary: "Lister les offres d'emploi",
      description: "Retourne la liste paginée des offres d'emploi.",
      ok: "Liste des offres.",
      items: [
        {
          id: "cmr0rce8a0003yws4haulp35i",
          title: "Développeur Full Stack",
          description: "Node.js / React",
          location: "Conakry",
          company: "SouverainTech",
          recruiterId: "cmr0rce840000yws4oao08la7",
        },
      ],
    },

    create: {
      summary: "Créer une offre d'emploi",
      created: "Offre créée.",
      properties: {
        title: { type: "string", example: "Développeur Backend" },
        description: {
          type: "string",
          example: "Développement d'API REST avec Node.js et Prisma.",
        },
        location: { type: "string", example: "Conakry" },
        company: { type: "string", example: "SouverainTech" },
        recruiterId: { type: "string", example: "cmr0rce840000yws4oao08la7" },
      },
      required: ["title", "description", "location", "company", "recruiterId"],
    },

    getOne: { summary: "Obtenir une offre d'emploi", found: "Offre trouvée." },

    update: {
      summary: "Modifier une offre d'emploi",
      updated: "Offre mise à jour.",
    },

    remove: {
      summary: "Supprimer une offre d'emploi",
      removed: "Offre supprimée.",
    },
  }),
};
