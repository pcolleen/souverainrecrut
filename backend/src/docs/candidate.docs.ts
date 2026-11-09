import { crudDocs } from "./crud.docs";

export const candidateDocs = {
  paths: crudDocs({
    tag: "Candidates",
    path: "/candidates",
    notFound: "Candidat introuvable.",

    list: {
      summary: "Lister les candidats",
      description: "Retourne la liste paginée des candidats.",
      ok: "Liste des candidats.",
      items: [
        {
          id: "cmr0rce880001yws4aobnd3rl",
          fullName: "Mamadou Bah",
          email: "mamadou@example.com",
          phone: "+224620000001",
        },
      ],
    },

    create: {
      summary: "Créer un candidat",
      created: "Candidat créé.",
      conflict: "Email déjà utilisé.",
      properties: {
        fullName: { type: "string", example: "Jean Dupont" },
        email: { type: "string", example: "jean@example.com" },
        phone: { type: "string", example: "+33123456789" },
      },
      required: ["fullName", "email", "phone"],
    },

    getOne: { summary: "Obtenir un candidat", found: "Candidat trouvé." },

    update: {
      summary: "Modifier un candidat",
      updated: "Candidat mis à jour.",
    },

    remove: {
      summary: "Supprimer un candidat",
      removed: "Candidat supprimé.",
    },
  }),
};
