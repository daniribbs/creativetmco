(() => {
  if (window.__tmcoMarqueeMultiV1) return;
  window.__tmcoMarqueeMultiV1 = true;

  const SPEED = 45;          // px/s
  const START_DELAY = 600;   // ms
  const REBUILD_AT  = 900;   // ms: recalibra 1x após “assentar”
  const DT_MAX = (1/60) * 2; // clamp ~33ms

  // ✅ início “no meio do loop” (evita começar colado na esquerda)
  // use valores entre 0.12 e 0.88
  const START_PHASE_FIRST  = 0.33; // 1ª linha
  const START_PHASE_SECOND = 0.62; // 2ª linha

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

    // garante estilos essenciais
    track.style.transition = 'none';
    track.style.backfaceVisibility = 'hidden';
    track.style.transform = 'translate3d(0,0,0)';
    track.style.willChange = 'transform';
    track.style.display = 'flex';
    track.style.flexWrap = 'nowrap';
    track.style.justifyContent = 'flex-start'; // evita space-between/center “abrindo buracos”

    // itens originais = filhos que batem com itemSel (ou todos os filhos se não achar)
    let originals = Array.from(track.children).filter(el => el.matches(cfg.itemSel));
    if (!originals.length) originals = Array.from(track.children);
    if (!originals.length) return;

    originals.forEach(it => {
      it.style.flex = '0 0 auto';
      it.style.flexShrink = '0';
    });

    function clearClones(){
      Array.from(track.querySelectorAll('[data-tmco-clone="1"]')).forEach(n => n.remove());
    }

    function appendCloneSet(){
      const frag = document.createDocumentFragment();
      originals.forEach(o => {
        const c = o.cloneNode(true);
        c.dataset.tmcoClone = '1';
        c.style.flex = '0 0 auto';
        c.style.flexShrink = '0';
        frag.appendChild(c);
      });
      track.appendChild(frag);
    }

    function segmentWidthFallback(){
      let w = 0;
      originals.forEach((el) => { w += el.getBoundingClientRect().width || 0; });
      return Math.max(1, w);
    }

    // ✅ Clona e calcula segW do jeito mais confiável:
    // diferença de offsetLeft entre o primeiro item original e o primeiro clone
    function fillClonesAndMeasure(){
      clearClones();

      // sempre garante pelo menos 1 set de clone (loop perfeito)
      appendCloneSet();

      const firstOrig = originals[0];
      const firstClone = track.querySelector('[data-tmco-clone="1"]');

      let segW = 0;
      if (firstOrig && firstClone) {
        segW = (firstClone.offsetLeft - firstOrig.offsetLeft);
      }
      if (!(segW > 1)) segW = segmentWidthFallback();

      const vw = wrapper.getBoundingClientRect().width || 1;

      // garante largura suficiente (sem “buraco” no início / durante drag)
      let safety = 0;
      while ((track.scrollWidth || 0) < vw * 3 && safety < 80) {
        appendCloneSet();
        safety++;
      }

      return segW;
    }

    // ---- state ----
    let segW = fillClonesAndMeasure();

    // ✅ início em “phase”, não em 0 (evita começar na esquerda)
    const phase = (dirSign > 0) ? START_PHASE_FIRST : START_PHASE_SECOND;
    let x = -Math.max(0.12, Math.min(0.88, phase)) * segW;

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

    // start suave
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
    function rebuildPreservingX(){
      const oldSegW = segW || 1;
      const frac = ((-x % oldSegW) + oldSegW) / oldSegW;

      segW = fillClonesAndMeasure();

      x = -frac * segW;
      wrap();
      render();
      lastTs = null;
    }

    setTimeout(rebuildPreservingX, REBUILD_AT);

    // ✅ extra: quando imagens carregarem, recalibra 1x (ajuda muito com lazy/gif)
    // sem amarrar ao scroll vertical
    let imgRebuildQueued = false;
    const imgs = Array.from(wrapper.querySelectorAll('img'));
    imgs.forEach(img => {
      if (img.complete) return;
      img.addEventListener('load', () => {
        if (imgRebuildQueued) return;
        imgRebuildQueued = true;
        setTimeout(() => {
          rebuildPreservingX();
        }, 80);
      }, { once: true });
    });

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
        rebuildPreservingX();
      }, 150);
    });
  }
})();
