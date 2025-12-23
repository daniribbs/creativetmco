document.addEventListener('DOMContentLoaded', function () {
  if (window.__logosMarqueeInitialized) return;
  window.__logosMarqueeInitialized = true;

  const wraps = Array.from(document.querySelectorAll('.logo-wrap'));
  if (!wraps.length) return;

  // util: módulo positivo
  const mod = (n, m) => ((n % m) + m) % m;

  wraps.forEach(function (wrap, index) {
    const track = wrap.querySelector('.logo-lista');
    if (!track) return;

    const originals = Array.from(track.children).filter(function (child) {
      return child.classList.contains('logo-cliente');
    });
    if (!originals.length) return;

    // --- monta trilha (clones) ---
    const repeatCount = 8;
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < repeatCount; i++) {
      originals.forEach(function (item) {
        const clone = item.cloneNode(true);
        fragment.appendChild(clone);
      });
    }
    track.innerHTML = '';
    track.appendChild(fragment);

    // --- estilos mínimos ---
    wrap.style.overflow = 'hidden';
    wrap.style.cursor = 'grab';
    wrap.style.touchAction = 'pan-y'; // permite scroll vertical da página; drag horizontal fica com a gente

    track.style.display = 'flex';
    track.style.flexWrap = 'nowrap';
    track.style.willChange = 'transform';
    track.style.animation = 'none'; // garante que não brigue com keyframes antigos

    // evita "ghost drag" de imagens no desktop
    Array.from(track.querySelectorAll('img')).forEach(img => {
      img.draggable = false;
      img.style.userSelect = 'none';
      img.style.webkitUserDrag = 'none';
    });

    // --- calcula loop ---
    const totalWidth = track.scrollWidth;
    const containerWidth = wrap.offsetWidth || 1;
    if (totalWidth <= containerWidth * 1.2) return;

    const pxPerSecond = 30;
    const distance = totalWidth / 2; // continua sua lógica
    const durationMs = (distance / pxPerSecond) * 1000;

    // --- cria animação controlável ---
    // de 0 até -distance, em loop infinito
    const anim = track.animate(
      [{ transform: 'translateX(0px)' }, { transform: `translateX(${-distance}px)` }],
      { duration: durationMs, iterations: Infinity, easing: 'linear' }
    );

    // --- interação drag/swipe ---
    let dragging = false;
    let startX = 0;
    let startTime = 0;
    let moved = 0;

    // para inércia
    let lastX = 0;
    let lastT = 0;
    let velocity = 0;
    let inertiaRAF = null;

    function stopInertia() {
      if (inertiaRAF) cancelAnimationFrame(inertiaRAF);
      inertiaRAF = null;
    }

    function applyInertia() {
      // ajuste fino
      const friction = 0.92;     // quanto menor, para mais rápido
      const minV = 0.02;         // px/ms
      const maxMs = 900;         // tempo máximo de inércia

      const t0 = performance.now();
      let prev = t0;

      function step(now) {
        const dt = now - prev;
        prev = now;

        // se já parou ou passou tempo, volta autoplay
        if (Math.abs(velocity) < minV || (now - t0) > maxMs) {
          anim.play();
          stopInertia();
          return;
        }

        // deslocamento equivalente ao "scrub" na timeline
        const dx = velocity * dt; // px
        const newTime = startTime - (dx / distance) * durationMs;

        // atualiza startTime pra continuar integrando corretamente
        startTime = mod(newTime, durationMs);
        anim.currentTime = startTime;

        // aplica atrito
        velocity *= Math.pow(friction, dt / 16);

        inertiaRAF = requestAnimationFrame(step);
      }

      inertiaRAF = requestAnimationFrame(step);
    }

    // evita clique acidental após arrastar
    wrap.addEventListener('click', function (e) {
      if (wrap.__justDragged) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);

    wrap.addEventListener('pointerdown', function (e) {
      // só botão principal no mouse
      if (e.pointerType === 'mouse' && e.button !== 0) return;

      stopInertia();

      dragging = true;
      moved = 0;
      wrap.__justDragged = false;

      wrap.setPointerCapture(e.pointerId);
      wrap.style.cursor = 'grabbing';

      anim.pause();
      startX = e.clientX;
      startTime = mod(anim.currentTime || 0, durationMs);

      lastX = e.clientX;
      lastT = performance.now();
      velocity = 0;
    });

    wrap.addEventListener('pointermove', function (e) {
      if (!dragging) return;

      const x = e.clientX;
      const deltaX = x - startX;
      moved = Math.max(moved, Math.abs(deltaX));

      // scrub na timeline (arrastar pra direita move logos pra direita)
      const newTime = startTime - (deltaX / distance) * durationMs;
      anim.currentTime = mod(newTime, durationMs);

      // calcula velocidade pra inércia
      const now = performance.now();
      const dx = x - lastX;
      const dt = now - lastT || 16;
      velocity = dx / dt; // px/ms

      lastX = x;
      lastT = now;

      // se arrastou, evita scroll “puxando” seleção
      e.preventDefault();
    }, { passive: false });

    function endDrag() {
      if (!dragging) return;
      dragging = false;

      wrap.style.cursor = 'grab';

      // se moveu “de verdade”, bloqueia clique imediatamente após soltar
      if (moved > 6) {
        wrap.__justDragged = true;
        setTimeout(() => (wrap.__justDragged = false), 250);
      }

      // mantém a posição atual como startTime pra inércia
      startTime = mod(anim.currentTime || 0, durationMs);

      // Inércia opcional: se não quiser, comente as 2 linhas abaixo e descomente anim.play()
      anim.pause();
      applyInertia();

      // Sem inércia:
      // anim.play();
    }

    wrap.addEventListener('pointerup', endDrag);
    wrap.addEventListener('pointercancel', endDrag);

    // se o usuário sair da aba, evita ficar “pausado” por acidente
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) return;
      if (!dragging && !inertiaRAF) anim.play();
    });
  });
});
