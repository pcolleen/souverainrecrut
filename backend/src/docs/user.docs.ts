import { crudDocs } from "./crud.docs";

export const userDocs = {
  paths: crudDocs({
    tag: "Users",
    path: "/users",
    notFound: "Utilisateur introuvable.",

    list: {
      summary: "Lister les utilisateurs",
      description: "Retourne la liste paginée des utilisateurs.",
      ok: "Liste des utilisateurs.",
      items: [
        {
          id: "cmr0rce840000yws4oao08la7",
          firstName: "Alice",
          lastName: "Diallo",
          email: "alice@souverainrecrut.com",
          role: "RECRUITER",
        },
      ],
    },

    create: {
      summary: "Créer un utilisateur",
      created: "Utilisateur créé.",
      conflict: "Email déjà utilisé.",
      properties: {
        firstName: { type: "string", example: "Alice" },
        lastName: { type: "string", example: "Diallo" },
        email: { type: "string", example: "alice@souverainrecrut.com" },
        password: { type: "string", example: "password123" },
        role: {
          type: "string",
          enum: ["ADMIN", "RECRUITER"],
          example: "RECRUITER",
        },
      },
      required: ["firstName", "lastName", "email", "password", "role"],
    },

    getOne: { summary: "Obtenir un utilisateur", found: "Utilisateur trouvé." },

    update: {
      summary: "Modifier un utilisateur",
      updated: "Utilisateur mis à jour.",
    },

    remove: {
      summary: "Supprimer un utilisateur",
      removed: "Utilisateur supprimé.",
    },
  }),
};
