document.addEventListener("DOMContentLoaded", function() {
  const menus = document.querySelectorAll('.service-item-menu');
  const details = document.querySelectorAll('.filtered-item');

  // Função para mostrar detalhe
  function showDetail(slug) {
    details.forEach(detail => {
      detail.style.display = detail.getAttribute('data-slug') === slug ? 'flex' : 'none';
    });
  }

  // Começa mostrando o primeiro
  if (details.length > 0) {
    showDetail(details[0].getAttribute('data-slug'));
    menus[0].classList.add('is-active');
  }

  menus.forEach(menu => {
    const slug = menu.getAttribute('data-slug');

    // Hover -> troca o detalhe
    menu.addEventListener('mouseenter', () => {
      showDetail(slug);
    });

    // Click -> fixa como ativo
    menu.addEventListener('click', () => {
      menus.forEach(m => m.classList.remove('is-active'));
      menu.classList.add('is-active');
      showDetail(slug);
    });
  });
});
