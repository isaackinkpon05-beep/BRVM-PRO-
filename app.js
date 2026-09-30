const products = {
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

const modal = document.getElementById("paymentModal");
const closeModal = document.getElementById("closeModal");
const selectedProduct = document.getElementById("selectedProduct");

const buyButtons = document.querySelectorAll(".buy-button");


/* =========================================================
   ACHAT
   ========================================================= */

buyButtons.forEach((button) => {

  button.addEventListener("click", async () => {

    const productId = button.dataset.product;
    const product = products[productId];

    if (!product) {
      alert("Produit introuvable.");
      return;
    }

    selectedProduct.textContent =
      `${product.name} — ${product.price.toLocaleString("fr-FR")} FCFA`;

    modal.classList.add("active");

    button.disabled = true;

    try {

      const response = await fetch(
        "/.netlify/functions/create-payment",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            product: productId
          })
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success || !data.url) {

        console.error("Erreur paiement :", data);

        throw new Error(
          data.error || "Impossible de créer le paiement."
        );
      }

      /*
       * PayDunya nous donne l'URL
       * vers laquelle envoyer le client.
       */

      window.location.href = data.url;

    } catch (error) {

      console.error(error);

      modal.classList.remove("active");

      alert(
        "Le paiement n'est pas encore disponible. " +
        "Nous sommes en train de terminer la configuration."
      );

    } finally {

      button.disabled = false;

    }

  });

});


/* =========================================================
   FERMER LA FENÊTRE
   ========================================================= */

closeModal.addEventListener("click", () => {

  modal.classList.remove("active");

});


/* =========================================================
   CLIQUER EN DEHORS
   ========================================================= */

modal.addEventListener("click", (event) => {

  if (event.target === modal) {
    modal.classList.remove("active");
  }

});


/* =========================================================
   TOUCHE ESC
   ========================================================= */

document.addEventListener("keydown", (event) => {

  if (event.key === "Escape") {
    modal.classList.remove("active");
  }

});
