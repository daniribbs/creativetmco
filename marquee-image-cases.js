(() => {
  if (window.__tmcoMarqueeMultiV1) return;
  window.__tmcoMarqueeMultiV1 = true;

  const SPEED = 45;           // px/s
  const START_DELAY = 600;    // ms
  const REBUILD_AT  = 900;    // ms
  const DT_MAX = (1/60) * 2;  // clamp ~33ms
  const IMG_WAIT_MS = 3500;   // espera máx imgs (lazy/gif)

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

    if (first)  initLine(first,  +1, cfg); // 1ª linha: pra direita
    if (second) initLine(second, -1, cfg); // 2ª linha: pra esquerda
  }

  function initLine(wrapper, dirSign, cfg){
    const track = wrapper.querySelector(cfg.trackSel);
    if (!track) return;

    // evita duplicar init
    const key = 'tmcoRunning';
    if (track.dataset[key] === '1') return;
    track.dataset[key] = '1';

    // estilos essenciais (não depender do Webflow)
    track.style.transition = 'none';
    track.style.backfaceVisibility = 'hidden';
    track.style.willChange = 'transform';
    track.style.display = 'flex';
    track.style.flexWrap = 'nowrap';
    track.style.justifyContent = 'flex-start';

    // pega só os "originais" (sem clones)
    let originals = Array.from(track.children).filter(el => el.matches?.(cfg.itemSel));
    if (!originals.length) originals = Array.from(track.children);
    if (!originals.length) return;

    originals.forEach(it => {
      it.style.flex = '0 0 auto';
      it.style.flexShrink = '0';
    });

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

    function appendCloneSet(){
      track.appendChild(makeCloneFrag());
    }

    function prependCloneSet(){
      track.insertBefore(makeCloneFrag(), track.firstChild);
    }

    // segW = distância entre o 1º original e o 1º clone (inclui gaps/margens reais)
    function measureSegW(){
      const firstOrig = originals[0];
      const firstClone = track.querySelector('[data-tmco-clone="1"]');
      if (!firstOrig || !firstClone) return 1;
      const w = (firstClone.offsetLeft - firstOrig.offsetLeft);
      return (w > 1) ? w : 1;
    }

    function fillClones(segW){
      const vw = wrapper.getBoundingClientRect().width || 1;
      let safety = 0;

      // garante largura suficiente (sem buracos durante o loop/drag)
      while ((track.scrollWidth || 0) < vw * 3 && safety < 80) {
        appendCloneSet();
        safety++;
      }

      // se a linha for pra direita, precisa ter conteúdo antes do "0"
      // (pra não abrir vazio no lado esquerdo quando x aumenta)
      if (dirSign > 0) {
        // 1 segmento à esquerda normalmente basta (x fica perto de -segW)
        prependCloneSet();
      }

      // depois de prepend, pode precisar completar largura de novo
      safety = 0;
      while ((track.scrollWidth || 0) < vw * 3 && safety < 80) {
        appendCloneSet();
        safety++;
      }
    }

    function waitImages(){
      const imgs = [];
      originals.forEach(el => imgs.push(...el.querySelectorAll('img')));
      const pending = imgs.filter(img => !img.complete);

      if (!pending.length) return Promise.resolve();

      return new Promise(resolve => {
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          resolve();
        };
        const t = setTimeout(finish, IMG_WAIT_MS);

        pending.forEach(img => {
          const on = () => {
            img.removeEventListener('load', on);
            img.removeEventListener('error', on);
            const still = pending.filter(i => !i.complete);
            if (!still.length) {
              clearTimeout(t);
              finish();
            }
          };
          img.addEventListener('load', on);
          img.addEventListener('error', on);
        });
      });
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
      // mantém em uma faixa estável e evita “colar” no 0 à força
      while (x > 0) x -= segW;
      while (x < -segW) x += segW;
    }

    function rebuildPreservingAnchor(refEl){
      // âncora atual (com transform vigente)
      const anchorDesired = measureAnchor(refEl);

      // evita flicker durante rebuild
      const prevVis = track.style.visibility;
      track.style.visibility = 'hidden';

      clearClones();

      // sempre cria 1 set de clones pra medir segW
      appendCloneSet();
      segW = measureSegW();

      fillClones(segW);

      // com DOM novo, mede onde o ref está (sem ajuste)
      const anchorNow = measureAnchor(refEl);

      // ajuste de x para manter “exatamente onde estava”
      x = x + (anchorDesired - anchorNow);

      // normaliza sem mudar o visual (segmento repete)
      wrap();
      render();

      track.style.visibility = prevVis || 'visible';
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
          warmUntil = t0 + 120;
          lastTs = null;
          started = true;
          render();
          requestAnimationFrame(tick);
        });
      }, START_DELAY);
    }

    // ====== INIT: espera imagens e começa SEM mudar o visual ======
    (async () => {
      await waitImages();

      // espera layout assentar 2 frames
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

      const refEl = originals[0];
      if (!refEl) return;

      // garante que antes de qualquer clone, a posição “original” está intacta:
      // (não aplicamos transform aqui ainda)
      const anchorOriginal = measureAnchor(refEl);

      // monta loop e ajusta para manter a mesma âncora
      const prevVis = track.style.visibility;
      track.style.visibility = 'hidden';

      clearClones();
      appendCloneSet();
      segW = measureSegW();
      fillClones(segW);

      const anchorAfter = measureAnchor(refEl);

      // ✅ define x para deixar o card exatamente onde estava
      x = (anchorOriginal - anchorAfter);

      // não força x=0; só normaliza de forma segura
      wrap();
      render();

      track.style.visibility = prevVis || 'visible';

      // rebuild 1x (sem “pulo”, preserva âncora)
      setTimeout(() => rebuildPreservingAnchor(refEl), REBUILD_AT);

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

      // autoplay
      startTicker();
    })();
  }
})();
