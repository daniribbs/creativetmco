(function () {
  function clamp(v, min, max) {
    return Math.min(max, Math.max(min, v));
  }

  document.addEventListener('DOMContentLoaded', function () {
    const cards = document.querySelectorAll('.case-cascade-item');
    if (!cards.length) return;

    let ticking = false;

    function updateCards() {
      const vh = window.innerHeight;

      cards.forEach(function (card) {
        const rect = card.getBoundingClientRect();

        // Quando o topo do card estiver ~20% da viewport pra baixo,
        // começamos a aplicar o efeito
        const start = vh * 0.2;
        // Quando o topo já tiver passado bem pra cima (fora da tela),
        // consideramos progresso = 1
        const end = -rect.height * 0.5;

        const y = rect.top;
        let progress = (start - y) / (start - end);
        progress = clamp(progress, 0, 1);

        // 1 → 0.85 (encolhe um pouco)
        const scale = 1 - 0.15 * progress;
        // 1 → 0.4 (vai desaparecendo)
        const opacity = 1 - 0.6 * progress;

        card.style.transform = 'scale(' + scale + ')';
        card.style.opacity = opacity;
      });

      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(updateCards);
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll);
    window.addEventListener('resize', updateCards);
    updateCards();
  });
})();
