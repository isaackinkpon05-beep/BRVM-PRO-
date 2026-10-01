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
        success: false,
        error: "Méthode non autorisée."
      })
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");

    // Vérification du produit
    const product = PRODUCTS[body.product];

    if (!product) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          success: false,
          error: "Produit invalide."
        })
      };
    }

    // La clé secrète doit être configurée dans Netlify
    const secretKey = process.env.FEDAPAY_SECRET_KEY;

    if (!secretKey) {
      console.error("FEDAPAY_SECRET_KEY est absente.");

      return {
        statusCode: 500,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          success: false,
          error: "La clé secrète FedaPay n'est pas configurée."
        })
      };
    }

    // Informations client facultatives
    const customer = {};

    if (body.firstname) {
      customer.firstname = body.firstname;
    }

    if (body.lastname) {
      customer.lastname = body.lastname;
    }

    if (body.email) {
      customer.email = body.email;
    }

    if (body.phone) {
      customer.phone_number = {
        number: body.phone,
        country: "bj"
      };
    }

    // Création de la transaction FedaPay
    const transactionResponse = await fetch(
      "https://api.fedapay.com/v1/transactions",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${secretKey}`
        },

        body: JSON.stringify({
          description: `Achat ${product.name}`,
          amount: product.price,
          currency: {
            iso: "XOF"
          },

          customer: customer
        })
      }
    );

    const transactionData = await transactionResponse.json();

    console.log(
      "Réponse création transaction FedaPay :",
      transactionData
    );

    if (!transactionResponse.ok) {
      return {
        statusCode: 502,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          success: false,
          error:
            transactionData.message ||
            "FedaPay a refusé la création de la transaction."
        })
      };
    }

    // Récupération de la transaction
    const transaction =
      transactionData["v1/transaction"] ||
      transactionData.transaction ||
      transactionData;

    const transactionId = transaction.id;

    if (!transactionId) {
      console.error(
        "Identifiant de transaction absent :",
        transactionData
      );

      return {
        statusCode: 502,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          success: false,
          error:
            "FedaPay n'a pas retourné l'identifiant de la transaction."
        })
      };
    }

    // Génération du token de paiement
    const tokenResponse = await fetch(
      `https://api.fedapay.com/v1/transactions/${transactionId}/token`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${secretKey}`
        }
      }
    );

    const tokenData = await tokenResponse.json();

    console.log(
      "Réponse token FedaPay :",
      tokenData
    );

    if (!tokenResponse.ok) {
      return {
        statusCode: 502,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          success: false,
          error:
            tokenData.message ||
            "Impossible de générer le lien de paiement FedaPay."
        })
      };
    }

    // FedaPay peut retourner différentes structures
    const paymentUrl =
      tokenData.url ||
      tokenData.payment_url ||
      tokenData.token?.url;

    const token =
      tokenData.token ||
      tokenData.payment_token;

    if (!paymentUrl && !token) {
      console.error(
        "Lien/token de paiement absent :",
        tokenData
      );

      return {
        statusCode: 502,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          success: false,
          error:
            "FedaPay n'a pas retourné de lien de paiement."
        })
      };
    }

    // Réponse envoyée au site
    return {
      statusCode: 200,

      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },

      body: JSON.stringify({
        success: true,
        product: body.product,
        name: product.name,
        price: product.price,
        transactionId: transactionId,
        token: token || null,
        paymentUrl: paymentUrl || null
      })
    };

  } catch (error) {
    console.error(
      "Erreur create-payment :",
      error
    );

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
