// Chargé avant chaque fichier de test, avant l'import de l'application.
// dotenv ne remplace pas une variable déjà définie : ces valeurs priment.
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "secret-de-test";
process.env.API_VERSION = "v1";
// Évite le message d'information de dotenv dans la sortie des tests.
process.env.DOTENV_CONFIG_QUIET = "true";
