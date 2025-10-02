<script>
document.addEventListener("DOMContentLoaded", function() {
  document.querySelectorAll('.portfolio-list-image').forEach(track => {
    const clone = track.innerHTML;
    for (let i = 0; i < 4; i++) { // repete 3 vezes
      track.innerHTML += clone;
    }
  });
});
</script>
<script>
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
</script>
