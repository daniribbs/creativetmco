document.addEventListener("DOMContentLoaded", function () {
    const accordions = document.querySelectorAll(".item-faq");
  
    items.forEach((item) => {
      item.addEventListener("click", function () {
        this.classList.toggle("is-open");
      });
    });
  });