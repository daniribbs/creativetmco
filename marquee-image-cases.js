(() => {
  if (window.__tmcoMarqueeMultiV1) return;
  window.__tmcoMarqueeMultiV1 = true;

  const SPEED = 45;           // px/s
  const START_DELAY = 0;      // ✅ começa rápido (antes era 600)
  const REBUILD_AT  = 450;    // ✅ rebuild mais cedo (antes era 900)
  const DT_MAX = (1/60) * 2;  // clamp ~33ms

  window.addEventListener('load', () => {
    boot();
    setTimeout(boot, 250);
    setTimeout(boot, 800);
  });

  function boot(){
    document.querySelectorAll('.full-sec').forEach(sec => {
      initGalleryInSection(sec, {
        wrapperSel: '.portfolio-wrapper-image',
        secondWrapperSel: '.portfolio-wrapper-image.second-line',
        trackSel: '.portfolio-list-image',
        itemSel: '.portfolio-item-image'
      });
    });

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

    if (first)  initLine(first,  +1, cfg); // 1ª linha: direita
    if (second) initLine(second, -1, cfg); // 2ª linha: esquerda
  }

  function initLine(wrapper, dirSign, cfg){
    const track = wrapper.querySelector(cfg.trackSel);
    if (!track) return;

    const key = 'tmcoRunning';
    if (track.dataset[key] === '1') return;
    track.dataset[key] = '1';

    track.style.transition = 'none';
    track.style.backfaceVisibility = 'hidden';
    track.style.willChange = 'transform';
    track.style.display = 'flex';
    track.style.flexWrap = 'nowrap';
    track.style.justifyContent = 'flex-start';

    let originals = Array.from(track.children).filter(el => el.matches?.(cfg.itemSel));
    if (!originals.length) originals = Array.from(track.children);
    if (!originals.length) return;

    originals.forEach(it => {
      it.style.flex = '0 0 auto';
      it.style.flexShrink = '0';
    });

    function raf2(){
      return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    }

    function measureAnchor(refEl){
      const w = wrapper.getBoundingClientRect();
      const r = refEl.getBoundingClientRect();
      return r.left - w.left;
    }

    function clearClones(){
      Array.from(track.querySelectorAll('[data-tmco-clone="1"]')).forEach(n => n.remove());
    }

    function makeCloneFrag(){
      const frag = document.createDocumentFragment();
      originals.forEach(o => {
        const c = o.cloneNode(true);
        c.dataset.tmcoClone = '1';
        c.style.flex = '0 0 auto';
        c.style.flexShrink = '0';
        frag.appendChild(c);
      });
      return frag;
    }

    function appendCloneSet(){ track.appendChild(makeCloneFrag()); }
    function prependCloneSet(){ track.insertBefore(makeCloneFrag(), track.firstChild); }

    function measureSegW(){
      const firstOrig = originals[0];
      const firstClone = track.querySelector('[data-tmco-clone="1"]');
      if (!firstOrig || !firstClone) return 0;
      const w = firstClone.offsetLeft - firstOrig.offsetLeft;
      return (w > 1) ? w : 0;
    }

    function segmentWidthFallback(){
      // fallback: soma larguras (quando offsetLeft ainda não “pegou”)
      let w = 0;
      originals.forEach(el => {
        const bw = el.getBoundingClientRect().width || el.offsetWidth || 0;
        w += bw;
      });
      return Math.max(1, w);
    }

    function fillClones(segW){
      const vw = wrapper.getBoundingClientRect().width || 1;
      let safety = 0;

      while ((track.scrollWidth || 0) < vw * 3 && safety < 80) {
        appendCloneSet();
        safety++;
      }

      if (dirSign > 0) {
        // conteúdo à esquerda pra linha que vai pra direita
        prependCloneSet();
      }

      safety = 0;
      while ((track.scrollWidth || 0) < vw * 3 && safety < 80) {
        appendCloneSet();
        safety++;
      }
    }

    // ---- animação state ----
    let segW = 1;
    let x = 0;
    let lastTs = null;

    let dragging = false;
    let downX = 0;
    let startX = 0;

    function render(){
      track.style.transform = `translate3d(${x}px,0,0)`;
    }

    function wrap(){
      while (x > 0) x -= segW;
      while (x < -segW) x += segW;
    }

    function rebuildPreservingAnchor(refEl){
      const anchorDesired = measureAnchor(refEl);

      clearClones();
      appendCloneSet();

      segW = measureSegW() || segmentWidthFallback();
      fillClones(segW);

      const anchorNow = measureAnchor(refEl);
      x = x + (anchorDesired - anchorNow);

      wrap();
      render();
      lastTs = null;
    }

    function startTicker(){
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

      setTimeout(() => {
        requestAnimationFrame((t0) => {
          warmUntil = t0 + 80;
          lastTs = null;
          started = true;
          render();
          requestAnimationFrame(tick);
        });
      }, START_DELAY);
    }

    // ✅ debounce de rebuild quando imagens forem carregando
    let rebuildTo = null;
    function queueRebuild(refEl, ms = 120){
      clearTimeout(rebuildTo);
      rebuildTo = setTimeout(() => rebuildPreservingAnchor(refEl), ms);
    }

    (async () => {
      // só assenta layout (não espera imagens)
      await raf2();

      const refEl = originals[0];
      if (!refEl) return;

      const anchorOriginal = measureAnchor(refEl);

      track.style.visibility = 'hidden';

      clearClones();
      appendCloneSet();

      // tenta medir segW “de verdade”; se ainda não der, usa fallback e segue
      segW = measureSegW() || segmentWidthFallback();
      fillClones(segW);

      const anchorAfter = measureAnchor(refEl);

      // ✅ mantém exatamente a posição original
      x = (anchorOriginal - anchorAfter);
      wrap();
      render();

      track.style.visibility = 'visible';

      // começa rápido
      startTicker();

      // rebuild “padrão” logo cedo
      setTimeout(() => rebuildPreservingAnchor(refEl), REBUILD_AT);

      // rebuild conforme imagens carregam (lazy/gif)
      const imgs = Array.from(wrapper.querySelectorAll('img'));
      imgs.forEach(img => {
        if (img.complete) return;
        img.addEventListener('load', () => queueRebuild(refEl, 80), { once: true });
        img.addEventListener('error', () => queueRebuild(refEl, 120), { once: true });
      });

      // resize preservando âncora
      let to = null;
      window.addEventListener('resize', () => {
        clearTimeout(to);
        to = setTimeout(() => rebuildPreservingAnchor(refEl), 150);
      });

      // drag
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

    })();
  }
})();
