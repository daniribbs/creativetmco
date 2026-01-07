(() => {
  if (window.__tmcoMarqueeMultiV1) return;
  window.__tmcoMarqueeMultiV1 = true;

  const SPEED = 45;         // px/s
  const START_DELAY = 600;  // ms: começa parado e engata depois
  const REBUILD_AT  = 900;  // ms: recalibra 1x após “assentar”
  const DT_MAX = (1/60) * 2; // clamp ~33ms

  window.addEventListener('load', () => {
    boot();
    setTimeout(boot, 250);
    setTimeout(boot, 800);
  });

  function boot(){
    // 1) NOVA seção full width
    document.querySelectorAll('.full-sec').forEach(sec => {
      initGalleryInSection(sec, {
        wrapperSel: '.portfolio-wrapper-image',
        secondWrapperSel: '.portfolio-wrapper-image.second-line',
        trackSel: '.portfolio-list-image',
        itemSel: '.portfolio-item-image'
      });
    });

    // 2) Seção antiga (se ainda existir)
    document.querySelectorAll('.cases-image-gallery').forEach(sec => {
      initGalleryInSection(sec, {
        wrapperSel: '.portfolio-wrapper-image',
        secondWrapperSel: '.portfolio-wrapper-image.second-line',
        trackSel: '.portfolio-list-image.case-page, .portfolio-list-image',
        itemSel: '.portfolio-item-image.case-page, .portfolio-item-image'
      });
    });
  }

  function initGalleryInSection(section, cfg){
    const wrappers = Array.from(section.querySelectorAll(cfg.wrapperSel));
    if (!wrappers.length) return;

    const second = section.querySelector(cfg.secondWrapperSel) || wrappers[1] || null;
    const first  = wrappers.find(w => w !== second) || wrappers[0] || null;

    if (first)  initLine(first,  +1, cfg); // esquerda -> direita
    if (second) initLine(second, -1, cfg); // direita -> esquerda
  }

  function initLine(wrapper, dirSign, cfg){
    const track = wrapper.querySelector(cfg.trackSel);
    if (!track) return;

    // evita duplicar init
    const key = 'tmcoRunning';
    if (track.dataset[key] === '1') return;
    track.dataset[key] = '1';

    // garante estilos essenciais (sem depender do Webflow)
    track.style.transition = 'none';
    track.style.backfaceVisibility = 'hidden';
    track.style.transform = 'translate3d(0,0,0)';
    track.style.willChange = 'transform';
    track.style.display = 'flex';
    track.style.flexWrap = 'nowrap';

    // itens originais = filhos que batem com itemSel (ou todos os filhos se não achar)
    let originals = Array.from(track.children).filter(el => el.matches(cfg.itemSel));
    if (!originals.length) originals = Array.from(track.children);
    if (!originals.length) return;

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

      // 3x viewport pra arrastar sem “buraco”
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
    let x = (dirSign > 0) ? -segW : 0; // start parado
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

    wrap();
    render();

    let started = false;
    let warmUntil = 0;

    function tick(ts){
      if (!started) return;

      if (lastTs === null) {
        lastTs = ts;
        requestAnimationFrame(tick);
        return;
      }

      if (ts < warmUntil) {
        lastTs = ts;
        requestAnimationFrame(tick);
        return;
      }

      let dt = (ts - lastTs) / 1000;
      if (dt < 0) dt = 0;
      if (dt > DT_MAX) dt = DT_MAX;
      lastTs = ts;

      if (!dragging) {
        x += (dirSign * SPEED) * dt;
        wrap();
        render();
      }

      requestAnimationFrame(tick);
    }

    // start suave (parado -> move)
    setTimeout(() => {
      requestAnimationFrame((t0) => {
        warmUntil = t0 + 120;
        lastTs = null;
        started = true;
        render();
        requestAnimationFrame(tick);
      });
    }, START_DELAY);

    // rebuild 1x preservando posição relativa (sem “pulo”)
    setTimeout(() => {
      const oldSegW = segW || 1;
      const frac = ((-x % oldSegW) + oldSegW) / oldSegW;

      segW = fillClones();

      x = -frac * segW;
      wrap();
      render();
      lastTs = null;
    }, REBUILD_AT);

    // ---- drag ----
    wrapper.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      dragging = true;
      wrapper.setPointerCapture?.(e.pointerId);
      downX = e.clientX;
      startX = x;
      lastTs = null;
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
      lastTs = null;
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
