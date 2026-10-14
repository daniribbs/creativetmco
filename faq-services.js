document.addEventListener("DOMContentLoaded", function () {
    const accordions = document.querySelectorAll(".accordion-2");
  
    accordions.forEach((accordion) => {
      accordion.addEventListener("click", function () {
        // Opcional: Se quiser que feche os outros quando um abrir, descomente a linha abaixo:
        // accordions.forEach(item => { if (item !== accordion) item.classList.remove('is-open'); });
  
        // Alterna a classe 'is-open' no item clicado
        this.classList.toggle("is-open");
      });
    });
  });