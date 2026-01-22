(() => {
  if (window.__tmcoMarqueeMultiV2) return;
  window.__tmcoMarqueeMultiV2 = true;

  const SPEED = 45;           // px/s
  const START_DELAY = 600;    // ms
  const REBUILD_AT  = 900;    // ms (recalibra 1x após “assentar”)
  const DT_MAX = (1/60) * 2;  // clamp ~33ms

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

    // estilos essenciais (independente do Webflow)
    track.style.transition = 'none';
    track.style.backfaceVisibility = 'hidden';
    track.style.transform = 'translate3d(0,0,0)';
    track.style.willChange = 'transform';
    track.style.display = 'flex';
    track.style.flexWrap = 'nowrap';

    // pega itens originais (não-clones)
    let originals = Array.from(track.children)
      .filter(el => !el.hasAttribute('data-tmco-clone'))
      .filter(el => el.matches?.(cfg.itemSel));

    if (!originals.length) {
      originals = Array.from(track.children).filter(el => !el.hasAttribute('data-tmco-clone'));
    }
    if (!originals.length) return;

    originals.forEach(it => {
      it.style.flex = '0 0 auto';
      it.style.flexShrink = '0';
    });

    const computed = getComputedStyle(track);
    const gap =
      (parseFloat(computed.gap || '0') || 0) ||
      (parseFloat(computed.columnGap || '0') || 0) ||
      0;

    function outerW(el){
      const r = el.getBoundingClientRect().width || 0;
      return r > 0 ? r : (el.offsetWidth || 0);
    }

    function clearClones(){
      Array.from(track.querySelectorAll('[data-tmco-clone="1"]')).forEach(n => n.remove());
    }

    function segmentWidth(){
      let w = 0;
      originals.forEach((el, i) => {
        w += outerW(el);
        if (i < originals.length - 1) w += gap;
      });
      // fallback se ainda não mediu (imagens)
      return Math.max(1, w);
    }

    function fillClones(){
      clearClones();

      const vw = wrapper.getBoundingClientRect().width || 1;
      const segW = segmentWidth();

      let totalW = segW;
      let safety = 0;

      // garante pelo menos 3x viewport (sem “buraco”)
      while (totalW < vw * 3 && safety < 80) {
        const frag = document.createDocumentFragment();
        originals.forEach(o => {
          const c = o.cloneNode(true);
          c.setAttribute('data-tmco-clone', '1');
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

    // ✅ mantém a posição inicial “como está”
    let x = 0;

    let lastTs = null;

    let dragging = false;
    let downX = 0;
    let startX = 0;

    function render(){
      track.style.transform = `translate3d(${x}px,0,0)`;
    }

    function wrap(){
      // mantem x dentro de (-segW, 0] (ou equivalente) sem quebrar o loop
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

    // resize (recalcula clones mantendo posição)
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

    // imagens carregando depois podem alterar largura: recalibra 1x (sem mexer no comportamento)
    let imgTo = null;
    const imgs = Array.from(track.querySelectorAll('img'));
    imgs.forEach(img => {
      if (img.complete) return;
      img.addEventListener('load', () => {
        clearTimeout(imgTo);
        imgTo = setTimeout(() => {
          const oldSegW = segW || 1;
          const frac = ((-x % oldSegW) + oldSegW) / oldSegW;

          segW = fillClones();
          x = -frac * segW;

          wrap();
          render();
          lastTs = null;
        }, 80);
      }, { once: true });
    });
  }
})();
