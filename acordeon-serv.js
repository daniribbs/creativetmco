document.addEventListener('DOMContentLoaded', function () {
  const items = Array.from(document.querySelectorAll('.service-item-acordeon'));
  const imageItems = Array.from(document.querySelectorAll('.image-service-acordeon-item'));

  // Mostra a imagem correspondente ao item com transição suave
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

      if (!target && (matchBySlug || matchByService)) target = imgItem;
    });

    if (!target) target = imageItems[0];

    imageItems.forEach(function (imgItem) {
      imgItem.classList.remove('is-visible');
    });

    // Pequeno delay para garantir que o navegador processe a troca de classe se necessário
    setTimeout(function() {
      target.classList.add('is-visible');
    }, 20);
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
      item.classList.remove('is-open');
      return;
    }

    openItemExclusive(item);
  }

  items.forEach(function (item) {
    const contentTrigger = item.querySelector('.acordeon-service-content');
    const actions = item.querySelector('.actions-acordoen');

    if (contentTrigger) {
      contentTrigger.addEventListener('click', function (e) {
        e.preventDefault();
        toggleItem(item);
      });
    }

    if (actions) {
      actions.addEventListener('click', function (e) {
        const icon = e.target.closest('.ico-acordeon');
        if (!icon) return;
        e.preventDefault();
        toggleItem(item);
      });
    }
  });

  // Estado inicial: abre o primeiro e exibe a imagem correspondente de forma suave
  if (items.length && imageItems.length) {
    items[0].classList.add('is-open');
    showImageForItem(items[0]);
  }
});