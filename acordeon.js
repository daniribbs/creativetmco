document.addEventListener('DOMContentLoaded', function () {
  const BREAKPOINT = 991;
  const cards = Array.from(document.querySelectorAll('.content-card-acordeon'));
  if (!cards.length) return;

  function isMobile() {
    return window.innerWidth <= BREAKPOINT;
  }

  function closeAll() {
    cards.forEach(function (card) {
      card.classList.remove('is-open');
    });
  }

  function toggleCard(card) {
    if (!isMobile()) return;

    const isOpen = card.classList.contains('is-open');

    if (isOpen) {
      // se já está aberto, fecha tudo
      closeAll();
    } else {
      // fecha todos e abre só este
      closeAll();
      card.classList.add('is-open');
    }
  }

  cards.forEach(function (card) {
    const topLine = card.querySelector('.acordeon-top-line');
    const action  = card.querySelector('.action-acordeon');

    function handleClick(e) {
      e.preventDefault();
      toggleCard(card);
    }

    // clique em toda a linha superior (slide + título)
    if (topLine) {
      topLine.addEventListener('click', handleClick);
    }

    // clique nos ícones de abrir/fechar
    if (action) {
      action.addEventListener('click', handleClick);
    }
  });

  // se o usuário aumentar a tela acima de 991px, garante tudo fechado
  window.addEventListener('resize', function () {
    if (!isMobile()) {
      closeAll();
    }
  });
});
