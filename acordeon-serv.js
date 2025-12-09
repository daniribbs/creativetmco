document.addEventListener('DOMContentLoaded', function () {

  /* --- CSS embutido temporariamente --- */
  const style = document.createElement('style');
  style.innerHTML = `
    .service-item-acordeon .acordeon-serv-description {
      display: none;
    }
    .service-item-acordeon .ico-acordeon.close {
      display: none;
    }
    .service-item-acordeon.is-open .acordeon-serv-description {
      display: block;
    }
    .service-item-acordeon.is-open .ico-acordeon.open {
      display: none;
    }
    .service-item-acordeon.is-open .ico-acordeon.close {
      display: block;
    }

    /* imagens do acordeon: por padrão todas escondidas, só a .is-visible aparece */
    .image-service-acordeon-item {
      display: none;
    }
    .image-service-acordeon-item.is-visible {
      display: block;
    }
  `;
  document.head.appendChild(style);

  /* --- Lógica do acordeon --- */
  const items = document.querySelectorAll('.service-item-acordeon');
  const imageItems = document.querySelectorAll('.image-service-acordeon-item');

  // função para mostrar a imagem correspondente ao item clicado
  function showImageForItem(item) {
    if (!imageItems.length || !item) return;

    // tentamos casar pelo data-slug ou pelo texto do título vs atributo "service"
    const itemSlug  = (item.getAttribute('data-slug') || '').trim().toLowerCase();
    const titleEl   = item.querySelector('.acordeon-serv-title-item');
    const itemTitle = titleEl ? titleEl.textContent.trim().toLowerCase() : '';

    let target = null;

    imageItems.forEach(function (imgItem) {
      const imgSlug    = (imgItem.getAttribute('data-slug') || '').trim().toLowerCase();
      const imgService = (imgItem.getAttribute('service') || '').trim().toLowerCase();

      const matchBySlug    = imgSlug && itemSlug && imgSlug === itemSlug;
      const matchByService = imgService && itemTitle && imgService === itemTitle;

      if (!target && (matchBySlug || matchByService)) {
        target = imgItem;
      }
    });

    // fallback: se nada casou, usa a primeira imagem
    if (!target) target = imageItems[0];

    // esconde todas e mostra só a escolhida
    imageItems.forEach(function (imgItem) {
      imgItem.classList.remove('is-visible');
    });
    if (target) {
      target.classList.add('is-visible');
    }
  }

  items.forEach(function (item, index) {
    const contentTrigger = item.querySelector('.acordeon-service-content');
    const actions = item.querySelector('.actions-acordoen');

    if (!contentTrigger || !actions) return;

    function toggleItem() {
      item.classList.toggle('is-open');
      // sempre que clicar nesse item, atualiza a imagem para ele
      showImageForItem(item);
    }

    contentTrigger.addEventListener('click', toggleItem);

    actions.addEventListener('click', function (event) {
      const icon = event.target.closest('.ico-acordeon');
      if (!icon) return;
      toggleItem();
    });
  });

  // estado inicial: primeira imagem visível (se existir)
  if (items.length && imageItems.length) {
    showImageForItem(items[0]);
  }
});
