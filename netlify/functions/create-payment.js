const PRODUCTS = {
  manuel: {
    name: "Manuel de présentation BRVM PRO",
    price: 100
  },

  niveau1: {
    name: "BRVM PRO - Niveau 1",
    price: 1000
  },

  niveau2: {
    name: "BRVM PRO - Niveau 2",
    price: 2500
  },

  niveau3: {
    name: "BRVM PRO - Niveau 3",
    price: 5000
  }
};

exports.handler = async (event) => {
  // Autoriser uniquement les requêtes POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        error: "Méthode non autorisée."
      })
    };
  }

  try {
    // Lire les données envoyées par le site
    const body = JSON.parse(event.body || "{}");
    const productId = body.product;

    // Vérifier que le produit existe
    const product = PRODUCTS[productId];

    if (!product) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: "Produit invalide."
        })
      };
    }

    // Récupérer les clés PayDunya depuis Netlify
    const masterKey = process.env.PAYDUNYA_MASTER_KEY;
    const privateKey = process.env.PAYDUNYA_PRIVATE_KEY;
    const token = process.env.PAYDUNYA_TOKEN;

    if (!masterKey || !privateKey || !token) {
      console.error("Clés PayDunya manquantes.");

      return {
        statusCode: 500,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: "Configuration PayDunya incomplète."
        })
      };
    }

    // Adresse de ton site
    const siteUrl =
      process.env.SITE_URL ||
      "https://classy-horse-acfa87.netlify.app";

    // Endpoint PayDunya en MODE TEST
    const endpoint =
      "https://app.paydunya.com/sandbox-api/v1/checkout-invoice/create";

    // Données envoyées à PayDunya
    const payload = {
      invoice: {
        items: {
          item_0: {
            name: product.name,
            quantity: 1,
            unit_price: product.price,
            total_price: product.price,
            description: "Ressource pédagogique BRVM PRO"
          }
        },

        total_amount: product.price,

        description:
          `Achat ${product.name}`
      },

      store: {
        name: "BRVM PRO",
        tagline: "Éducation financière et BRVM",
        website_url: siteUrl
      },

      custom_data: {
        product_id: productId,
        product_name: product.name
      },

      actions: {
        return_url:
          `${siteUrl}/?payment=success&product=${productId}`,

        cancel_url:
          `${siteUrl}/?payment=cancelled&product=${productId}`,

        callback_url:
          `${siteUrl}/.netlify/functions/paydunya-ipn`
      }
    };

    console.log("Création paiement PayDunya :", productId);

    // Envoyer la demande à PayDunya
    const response = await fetch(endpoint, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        "PAYDUNYA-MASTER-KEY": masterKey,
        "PAYDUNYA-PRIVATE-KEY": privateKey,
        "PAYDUNYA-TOKEN": token
      },

      body: JSON.stringify(payload)
    });

    // Lire la réponse PayDunya
    const data = await response.json();

    console.log(
      "Réponse PayDunya :",
      JSON.stringify({
        response_code: data.response_code,
        response_text: data.response_text,
        description: data.description
      })
    );

    // Vérifier la réponse
    if (!response.ok || data.response_code !== "00") {
      console.error(
        "Erreur PayDunya :",
        data.response_text || "Erreur inconnue"
      );

      return {
        statusCode: 502,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: "Impossible de créer le paiement.",
          details:
            data.response_text || "Erreur PayDunya"
        })
      };
    }

    // Paiement créé avec succès
    return {
      statusCode: 200,

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        success: true,
        product: productId,
        price: product.price,
        token: data.token,
        url: data.response_text
      })
    };

  } catch (error) {
    console.error(
      "Erreur serveur :",
      error.message
    );

    return {
      statusCode: 500,

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        error: "Erreur interne du serveur."
      })
    };
  }
};
