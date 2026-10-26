document.addEventListener("DOMContentLoaded", function () {
    const cards = Array.from(document.querySelectorAll('.portfolio-list > [class*="sticky-"]'));
    if (cards.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  
    const clamp = (v) => Math.min(1, Math.max(0, v));
    const ease = (t) => t * t * (3 - 2 * t); // smoothstep: início e fim suaves
    let ticking = false;
  
    function update() {
      const vh = window.innerHeight;
  
      cards.forEach((card, i) => {
        const inner = card.querySelector('.portfolio-card');
        const next = cards[i + 1];
        if (!inner || !next) return; // o último card não recua
  
        const nextTop = next.getBoundingClientRect().top;
        const nextStickyTop = parseFloat(getComputedStyle(next).top) || 0;
  
        // 0 quando o próximo card entra na tela, 1 quando ele trava em cima
        const progress = clamp((vh - nextTop) / (vh - nextStickyTop));
        inner.style.setProperty('--p', ease(progress).toFixed(3));
      });
  
      ticking = false;
    }
  
    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }
  
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  });