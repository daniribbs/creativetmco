(() => {
  if (window.__tmcoMarqueeFinalSafeV2) return;
  window.__tmcoMarqueeFinalSafeV2 = true;

  const SPEED = 45;         // px/s
  const START_DELAY = 600;  // ms: começa parado e engata depois
  const REBUILD_AT  = 900;  // ms: recalibra 1x após “assentar”
  const DT_MAX = 1/60 * 2;  // clamp: no máx ~33ms por frame

  function boot(){
    const gallery = document.querySelector('.cases-image-gallery');
    if (!gallery) return;

    const first  = gallery.querySelector('.portfolio-wrapper-image.first-line');
    const second = gallery.querySelector('.portfolio-wrapper-image.second-line');

    if (first)  initLine(first,  +1); // esquerda -> direita
    if (second) initLine(second, -1); // direita -> esquerda
  }

  window.addEventListener('load', () => {
    boot();
    setTimeout(boot, 250);
    setTimeout(boot, 800);
  });

  function initLine(wrapper, dirSign){
    const track = wrapper.querySelector('.portfolio-list-image.case-page');
    if (!track) return;
    if (track.dataset.tmcoRunning === '1') return;
    track.dataset.tmcoRunning = '1';

    track.style.transition = 'none';
    track.style.backfaceVisibility = 'hidden';

    const originals = Array.from(track.children);
    if (!originals.length) return;

    // força não encolher
    originals.forEach(it => {
      it.style.flex = '0 0 auto';
      it.style.flexShrink = '0';
    });

    const gap = parseFloat(getComputedStyle(track).gap || '0') || 0;

    function outerW(el){ return el.getBoundingClientRect().width || 0; }

    function clearClones(){
      Array.from(track.querySelectorAll('[data-tmco-clone="1"]')).forEach(n => n.remove());
    }

    function segmentWidth(){
      // soma widths + gaps
      let w = 0;
      originals.forEach((el, i) => {
        w += outerW(el);
        if (i < originals.length - 1) w += gap;
      });
      return Math.max(1, w);
    }

    function fillClones(){
      clearClones();

      const vw = wrapper.getBoundingClientRect().width || 1;
      const segW = segmentWidth();

      let totalW = segW;
      let safety = 0;

      while (totalW < vw * 3 && safety < 60) {
        const frag = document.createDocumentFragment();
        originals.forEach(o => {
          const c = o.cloneNode(true);
          c.dataset.tmcoClone = '1';
          c.style.flex = '0 0 auto';
          c.style.flexShrink = '0';
          frag.appendChild(c);
        });
        track.appendChild(frag);
        totalW += segW;
        safety++;
      }

      return segW;
    }

    // ---- state ----
    let segW = fillClones();
    let x = (dirSign > 0) ? -segW : 0; // posição inicial (parado)
    let lastTs = null;

    let dragging = false;
    let downX = 0;
    let startX = 0;

    function render(){
      track.style.transform = `translate3d(${x}px,0,0)`;
    }
    function wrap(){
      while (x > 0) x -= segW;
      while (x <= -segW) x += segW;
    }

    // começa parado
    wrap();
    render();

    // animação com warm-up (evita “tranco” no primeiro movimento)
    let started = false;
    let warmUntil = 0;

    function tick(ts){
      if (!started) return; // segurança

      if (lastTs === null) {
        lastTs = ts;
        requestAnimationFrame(tick);
        return;
      }

      // warm-up: alguns frames sem mover (layout “assenta”)
      if (ts < warmUntil) {
        lastTs = ts;
        requestAnimationFrame(tick);
        return;
      }

      let dt = (ts - lastTs) / 1000;
      if (dt < 0) dt = 0;
      if (dt > DT_MAX) dt = DT_MAX; // clamp real
      lastTs = ts;

      if (!dragging) {
        x += (dirSign * SPEED) * dt;
        wrap();
        render();
      }

      requestAnimationFrame(tick);
    }

    // start suave
    setTimeout(() => {
      requestAnimationFrame((t0) => {
        // 2 frames “quietos” + 120ms de warm-up
        warmUntil = t0 + 120;
        lastTs = null;
        started = true;
        render();
        requestAnimationFrame(tick);
      });
    }, START_DELAY);

    // rebuild 1x sem “pulo”: preserva a fração da posição no loop
    setTimeout(() => {
      const oldSegW = segW || 1;

      // fração atual dentro do loop (0..1)
      const frac = ((-x % oldSegW) + oldSegW) / oldSegW;

      segW = fillClones();

      // mantém a mesma posição relativa após mudar segW
      x = -frac * segW;
      wrap();
      render();

      // zera dt (evita micro-pulo pós rebuild)
      lastTs = null;
    }, REBUILD_AT);

    // ---- drag ----
    wrapper.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      dragging = true;
      wrapper.setPointerCapture?.(e.pointerId);
      downX = e.clientX;
      startX = x;
      lastTs = null; // evita pulo ao soltar
    });

    window.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - downX;
      x = startX + dx;
      wrap();
      render();
    });

    function end(){
      if (!dragging) return;
      dragging = false;
      lastTs = null; // retoma suave, mesma direção
    }
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);

    // resize
    let to = null;
    window.addEventListener('resize', () => {
      clearTimeout(to);
      to = setTimeout(() => {
        const oldSegW = segW || 1;
        const frac = ((-x % oldSegW) + oldSegW) / oldSegW;

        segW = fillClones();
        x = -frac * segW;
        wrap();
        render();
        lastTs = null;
      }, 150);
    });
  }
})();
