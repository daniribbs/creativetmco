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

  const items = Array.from(document.querySelectorAll('.service-item-acordeon'));
  const imageItems = Array.from(document.querySelectorAll('.image-service-acordeon-item'));
  const isFinePointer = window.matchMedia && window.matchMedia('(pointer:fine)').matches;

  // função para mostrar a imagem correspondente ao item ativo
  function showImageForItem(item) {
    if (!imageItems.length || !item) return;

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

    if (!target) target = imageItems[0];

    imageItems.forEach(function (imgItem) {
      imgItem.classList.remove('is-visible');
    });
    if (target) {
      target.classList.add('is-visible');
    }
  }

  // abre um item e fecha todos os outros
  function openItemExclusive(item) {
    if (!item) return;
    items.forEach(function (it) {
      if (it !== item) it.classList.remove('is-open');
    });
    if (!item.classList.contains('is-open')) {
      item.classList.add('is-open');
    }
    showImageForItem(item);
  }

  items.forEach(function (item) {
    const contentTrigger = item.querySelector('.acordeon-service-content');
    const actions = item.querySelector('.actions-acordoen');

    if (!contentTrigger || !actions) return;

    function toggleItem() {
      const isOpen = item.classList.contains('is-open');

      if (isOpen) {
        // se clicar no que já está aberto, fecha (nenhum aberto)
        item.classList.remove('is-open');
      } else {
        // abre este e fecha os outros
        openItemExclusive(item);
      }
    }

    // clique no conteúdo abre/fecha
    contentTrigger.addEventListener('click', toggleItem);

    // clique nos ícones também
    actions.addEventListener('click', function (event) {
      const icon = event.target.closest('.ico-acordeon');
      if (!icon) return;
      toggleItem();
    });

    // HOVER (apenas desktop / pointer fino): abre/troca sem precisar clicar
    if (isFinePointer) {
      item.addEventListener('mouseenter', function () {
        openItemExclusive(item);
      });
    }
  });

  // estado inicial: primeira imagem visível e primeiro acordeon aberto
  if (items.length && imageItems.length) {
    openItemExclusive(items[0]);
  }
});
