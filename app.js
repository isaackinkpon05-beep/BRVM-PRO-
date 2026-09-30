/* =========================================================
   BRVM PRO — APPLICATION
   ========================================================= */

const products = {
  manuel: {
    name: "Manuel de présentation",
    price: 100
  },

  niveau1: {
    name: "Niveau 1",
    price: 1000
  },

  niveau2: {
    name: "Niveau 2",
    price: 2500
  },

  niveau3: {
    name: "Niveau 3",
    price: 5000
  }
};


/* =========================================================
   ÉLÉMENTS
   ========================================================= */

const modal = document.getElementById("paymentModal");
const closeModal = document.getElementById("closeModal");
const selectedProduct = document.getElementById("selectedProduct");

const buyButtons = document.querySelectorAll(".buy-button");


/* =========================================================
   OUVERTURE DU MODAL
   ========================================================= */

buyButtons.forEach((button) => {

  button.addEventListener("click", () => {

    const productId = button.dataset.product;
    const product = products[productId];

    if (!product) {
      return;
    }

    selectedProduct.textContent =
      `${product.name} — ${product.price.toLocaleString("fr-FR")} FCFA. ` +
      `Vous allez être redirigé vers le paiement sécurisé.`;

    modal.classList.add("active");

    /*
      IMPORTANT :
      Pour le moment, nous n'envoyons pas encore
      la demande à PayDunya.

      Cette partie sera remplacée par notre fonction
      Netlify "create-payment".
    */

    console.log("Produit sélectionné :", product);

  });

});


/* =========================================================
   FERMETURE DU MODAL
   ========================================================= */

closeModal.addEventListener("click", () => {

  modal.classList.remove("active");

});


/* =========================================================
   FERMETURE EN CLIQUANT À L'EXTÉRIEUR
   ========================================================= */

modal.addEventListener("click", (event) => {

  if (event.target === modal) {
    modal.classList.remove("active");
  }

});


/* =========================================================
   FERMETURE AVEC ESC
   ========================================================= */

document.addEventListener("keydown", (event) => {

  if (event.key === "Escape") {
    modal.classList.remove("active");
  }

});
