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
    const product = PRODUCTS[body.product];

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

    const masterKey = process.env.PAYDUNYA_MASTER_KEY;
    const privateKey = process.env.PAYDUNYA_PRIVATE_KEY;
    const token = process.env.PAYDUNYA_TOKEN;

    if (!masterKey || !privateKey || !token) {
      console.error("Une ou plusieurs clés PayDunya sont absentes.");

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

    const endpoint =
      "https://app.paydunya.com/sandbox-api/v1/checkout-invoice/create";

    const payload = {
      invoice: {
        total_amount: product.price,
        description: `Achat ${product.name}`,

        items: {
          item_0: {
            name: product.name,
            quantity: 1,
            unit_price: product.price,
            total_price: product.price,
            description: "Ressource pédagogique BRVM PRO"
          }
        }
      },

      store: {
        name: "BRVM PRO"
      }
    };

    console.log("Envoi de la facture PayDunya :", body.product);

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

    console.log(
      "PayDunya response_code :",
      data.response_code
    );

    console.log(
      "PayDunya response_text :",
      data.response_text
    );

    if (data.response_code !== "00") {
      return {
        statusCode: 502,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          success: false,
          error:
            data.response_text ||
            "PayDunya a refusé la création de la facture."
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
        product: body.product,
        price: product.price,
        token: data.token,
        url: data.response_text
      })
    };

  } catch (error) {
    console.error("Erreur create-payment :", error);

    return {
      statusCode: 500,

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        success: false,
        error: "Erreur interne du serveur."
      })
    };
  }
};
