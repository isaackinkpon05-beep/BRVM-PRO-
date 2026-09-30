const crypto = require("crypto");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed"
    };
  }

  try {
    /*
     * PayDunya envoie les données IPN
     * dans le champ "data".
     */
    const body = event.body || "";

    const params = new URLSearchParams(body);
    const dataString = params.get("data");

    if (!dataString) {
      return {
        statusCode: 400,
        body: "Données IPN manquantes"
      };
    }

    let data;

    try {
      data = JSON.parse(dataString);
    } catch (error) {
      return {
        statusCode: 400,
        body: "Format des données IPN invalide"
      };
    }

    const masterKey = process.env.PAYDUNYA_MASTER_KEY;

    if (!masterKey) {
      console.error("PAYDUNYA_MASTER_KEY manquante");

      return {
        statusCode: 500,
        body: "Configuration serveur incomplète"
      };
    }

    /*
     * Vérification du hash PayDunya.
     */
    const receivedHash = data.hash;

    const expectedHash = crypto
      .createHash("sha512")
      .update(masterKey)
      .digest("hex");

    if (receivedHash !== expectedHash) {
      console.error("Hash IPN invalide");

      return {
        statusCode: 403,
        body: "IPN non authentifiée"
      };
    }

    /*
     * Récupération des informations du paiement.
     */
    const status = data.status;

    const invoice = data.invoice || {};

    const amount = Number(invoice.total_amount || 0);

    const token = invoice.token || null;

    const items = invoice.items || {};

    console.log("IPN PayDunya reçue");
    console.log("Statut :", status);
    console.log("Montant :", amount);
    console.log("Token :", token);

    /*
     * Le paiement est considéré comme confirmé
     * uniquement lorsque PayDunya indique completed.
     */
    if (status === "completed") {

      /*
       * IMPORTANT :
       * C'est ici que nous ajouterons ensuite
       * l'enregistrement de l'achat et l'autorisation
       * de téléchargement du PDF.
       */

      console.log("Paiement confirmé :", token);

      return {
        statusCode: 200,
        body: "OK"
      };
    }

    console.log("Paiement non terminé :", status);

    return {
      statusCode: 200,
      body: "Notification reçue"
    };

  } catch (error) {

    console.error("Erreur IPN :", error);

    return {
      statusCode: 500,
      body: "Erreur interne"
    };
  }
};
