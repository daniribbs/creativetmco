document.addEventListener("DOMContentLoaded", function () {
    const items = document.querySelectorAll(".conteudo-item-faq");
  
    items.forEach((item) => {
      item.addEventListener("click", function () {
        this.classList.toggle("is-open");
      });
    });
  });