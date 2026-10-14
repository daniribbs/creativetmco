document.addEventListener("DOMContentLoaded", function () {
    const accordions = document.querySelectorAll(".accordion-2");
  
    accordions.forEach((accordion) => {
      accordion.addEventListener("click", function () {
        // Alterna a classe 'is-open' no item clicado
        this.classList.toggle("is-open");
      });
    });
  });