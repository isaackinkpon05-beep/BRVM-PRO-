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
  // Autoriser uniquement POST
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
    const body = JSON.parse(event.body || "{}");
    const productId = body.product;

    const product = PRODUCTS[productId];

    // Vérification du produit
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

    // Les clés restent uniquement côté serveur
    const masterKey = process.env.PAYDUNYA_MASTER_KEY;
    const privateKey = process.env.PAYDUNYA_PRIVATE_KEY;
    const token = process.env.PAYDUNYA_TOKEN;

    if (!masterKey || !privateKey || !token) {
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

    // Pour commencer : MODE TEST
    const endpoint =
      "https://app.paydunya.com/sandbox-api/v1/checkout-invoice/create";

    const siteUrl =
      process.env.SITE_URL ||
      "https://brvmprokifagolden.netlify.app";

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
          `Achat ${product.name}`,

        return_url:
          `${siteUrl}/?payment=success&product=${productId}`,

        cancel_url:
          `${siteUrl}/?payment=cancelled&product=${productId}`,

        callback_url:
          `${siteUrl}/.netlify/functions/paydunya-ipn`
      },

      store: {
        name: "BRVM PRO",
        tagline: "Éducation financière et BRVM",
        website_url: siteUrl
      }
    };

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

    const data = await response.json();

    if (!response.ok || data.response_code !== "00") {
      console.error("Erreur PayDunya :", data);

      return {
        statusCode: 502,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: "Impossible de créer le paiement.",
          details: data.response_text || "Erreur PayDunya"
        })
      };
    }

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

    console.error("Erreur serveur :", error);

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
