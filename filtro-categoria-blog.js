
document.addEventListener("DOMContentLoaded", function () {
    const filterList = document.querySelector(".select-case-list");
    const cards = Array.from(document.querySelectorAll(".case-item"));
    const dropdown = document.querySelector(".select-cases-box");
    const dropdownLabel = dropdown?.querySelector(".drop-case_label .text-button-yel");
  
    if (!filterList || !cards.length) return;
  
    filterList.addEventListener("click", function (event) {
      const button = event.target.closest(".select-case-button");
  
      if (!button) return;
  
      event.preventDefault();
  
      const selectedCategory = button.getAttribute("servico")?.trim();
  
      if (!selectedCategory) return;
  
      // Filtra os cards
      cards.forEach(function (card) {
        const categoryElement = card.querySelector(
          ".case-rel-tags .stack-tag-item .case-rel_tag-text"
        );
  
        const cardCategory = categoryElement?.textContent.trim();
  
        const shouldShow =
          selectedCategory === "__all__" ||
          cardCategory?.toLowerCase() === selectedCategory.toLowerCase();
  
        card.style.display = shouldShow
          ? (card.dataset.origDisplay || "flex")
          : "none";
      });
  
      // Atualiza a opção selecionada
      filterList.querySelectorAll(".select-case-button").forEach(function (item) {
        item.classList.remove("is-active");
      });
  
      button.classList.add("is-active");
  
      // Atualiza o texto do dropdown
      if (dropdownLabel) {
        dropdownLabel.textContent = button.textContent.trim();
      }
  
      // Fecha o dropdown no mobile
      if (dropdown) {
        dropdown.classList.remove("is-open");
  
        const trigger = dropdown.querySelector(".drop-case_label");
        trigger?.setAttribute("aria-expanded", "false");
      }
    });
  });
  