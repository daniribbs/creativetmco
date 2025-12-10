(function () {
  const BREAKPOINT = 991;

  // --- Slide (ícone + texto) ---
  function initSlideSwap() {
    var wraps = document.querySelectorAll('.slide-wrap');
    if (!wraps.length) return;

    wraps.forEach(function (wrap) {
      var ico    = wrap.querySelector('.ico-slide-impacto');
      var second = wrap.querySelector('.text-slide-impacto.second-line');

      if (!ico) return;

      var textWidth = 0;

      // mede a second-line via clone (funciona mesmo com display:none)
      if (second) {
        var clone = second.cloneNode(true);
        clone.style.position   = 'absolute';
        clone.style.visibility = 'hidden';
        clone.style.display    = 'inline-flex';
        clone.style.whiteSpace = 'nowrap';

        document.body.appendChild(clone);
        textWidth = clone.getBoundingClientRect().width;
        document.body.removeChild(clone);
      } else {
        // fallback: qualquer linha de texto
        var anyText = wrap.querySelector('.text-slide-impacto');
        if (anyText) {
          textWidth = anyText.getBoundingClientRect().width;
        }
      }

      // gap do slide-wrap
      var cs  = getComputedStyle(wrap);
      var gap = parseFloat(cs.columnGap || cs.gap || cs.gridColumnGap || '8') || 8;

      // largura real do ícone
      var icoRect = ico.getBoundingClientRect();

      // aplica variáveis CSS por card
      wrap.style.setProperty('--ico-w',  icoRect.width + 'px');
      if (textWidth) {
        wrap.style.setProperty('--text-w', textWidth + 'px');
      }
      wrap.style.setProperty('--gap',    gap + 'px');

      // hover (apenas desktop)
      wrap.addEventListener('mouseenter', function () {
        if (window.innerWidth >= 992) {
          wrap.classList.add('is-swapped');
        }
      });

      wrap.addEventListener('mouseleave', function () {
        wrap.classList.remove('is-swapped');
      });
    });
  }

  // --- Altura do texto do acordeon ---
  function initStateHeights() {
    var blocks = document.querySelectorAll('.acordeon-bottom-line');

    blocks.forEach(function (block) {
      var h = block.scrollHeight;
      block.style.setProperty('--state-h', h + 'px');
    });
  }

  // --- Lógica de acordeon (mobile) ---
  function initAccordion() {
    const cards = Array.from(document.querySelectorAll('.content-card-acordeon'));
    if (!cards.length) return;

    function isMobile() {
      return window.innerWidth <= BREAKPOINT;
    }

    function closeCard(card) {
      card.classList.remove('is-open');
      const grid = card.closest('.card-grid');
      if (grid) grid.classList.remove('has-open');
    }

    function openCard(card) {
      // fecha todos antes (acordeon exclusivo)
      cards.forEach(closeCard);
      card.classList.add('is-open');
      const grid = card.closest('.card-grid');
      if (grid) grid.classList.add('has-open');
    }

    function toggleCard(card) {
      if (!isMobile()) return; // desktop é só hover

      const isOpen = card.classList.contains('is-open');
      if (isOpen) {
        closeCard(card);
      } else {
        openCard(card);
      }
    }

    cards.forEach(function (card) {
      const topLine = card.querySelector('.acordeon-top-line');
      const action  = card.querySelector('.action-acordeon');

      function handleClick(e) {
        e.preventDefault();
        toggleCard(card);
      }

      if (topLine) {
        topLine.addEventListener('click', handleClick);
      }

      if (action) {
        action.addEventListener('click', handleClick);
      }
    });

    // se sair do mobile, limpa os estados
    window.addEventListener('resize', function () {
      if (!isMobile()) {
        cards.forEach(closeCard);
      }
    });
  }

  // --- Inicialização única ---
  function onReady() {
    initSlideSwap();
    initStateHeights();
    initAccordion();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }

})();
