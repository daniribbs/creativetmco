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

  // função para mostrar a imagem correspondente ao item
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

  function closeAllItems() {
    items.forEach(function (it) {
      it.classList.remove('is-open');
    });
  }

  function openItemExclusive(item) {
    if (!item) return;
    closeAllItems();
    item.classList.add('is-open');
    showImageForItem(item);
  }

  function toggleItem(item) {
    const isOpen = item.classList.contains('is-open');

    if (isOpen) {
      // se já estiver aberto, fecha (nenhum aberto) e mantém a imagem atual
      item.classList.remove('is-open');
    } else {
      // abre este e fecha os outros + atualiza imagem
      openItemExclusive(item);
    }
  }

  items.forEach(function (item) {
    const contentTrigger = item.querySelector('.acordeon-service-content');
    const actions = item.querySelector('.actions-acordoen');

    if (!contentTrigger || !actions) return;

    // clique na área de conteúdo
    contentTrigger.addEventListener('click', function (e) {
      e.preventDefault();
      toggleItem(item);
    });

    // clique nos ícones
    actions.addEventListener('click', function (e) {
      const icon = e.target.closest('.ico-acordeon');
      if (!icon) return;
      e.preventDefault();
      toggleItem(item);
    });
  });

  // estado inicial:
  // - todos os acordeons fechados
  // - somente a primeira imagem visível
  if (items.length && imageItems.length) {
    showImageForItem(items[0]); // imagem inicial = primeira
    // nenhum .is-open adicionado
  }
});
