document.addEventListener('DOMContentLoaded', function () {
  const roots = Array.from(document.querySelectorAll('.gallery-rel'));
  if (!roots.length) return;
  roots.forEach(initGalleryRel);

  function initGalleryRel(root){
    if (root.dataset.galleryRelInit === '1') return;
    root.dataset.galleryRelInit = '1';

    const wrap     = root.querySelector('.rel-cases-wrap');
    const track    = root.querySelector('.rel-cases-list');
    const dotsWrap = root.querySelector('.gallery-case_dots');
    const btnPrev  = root.querySelector('.arrow-slider.left');
    const btnNext  = root.querySelector('.arrow-slider.right');

    if (!wrap || !track) return;

    const slides = Array.from(track.querySelectorAll('.rel-cases-item'));
    if (slides.length < 2) return;

    const PROGRESS_MS = 6500;

    // focus = card/dot ativo (0..slides.length-1)
    let focus = 0;

    // index = posição do track (0..maxIndex)
    let index = 0;

    let step = 0;
    let slidesPerView = 3;
    let maxIndex = 0;

    let timer = null;
    let autoplayToken = 0;
    let dots = [];

    const isMobile = () => window.matchMedia('(max-width: 991px)').matches;

    // suprime clique só após drag real
    let suppressClickUntil = 0;
    root.addEventListener('click', (e) => {
      if (Date.now() < suppressClickUntil) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);

    function waitImages(){
      const imgs = slides.map(s => s.querySelector('img')).filter(Boolean);
      return Promise.all(imgs.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(res => {
          img.addEventListener('load', res, { once:true });
          img.addEventListener('error', res, { once:true });
        });
      }));
    }

    function ensureMeasured(){
      if (step >= 10) return true;
      updateSizes();
      return step >= 10;
    }

    function updateSizes(){
      const w = Math.max(0, wrap.getBoundingClientRect().width);
      document.documentElement.style.setProperty('--grid-width', w + 'px');

      const any = slides[0];
      const cardW = any.getBoundingClientRect().width || 0;
      const mr = parseFloat(getComputedStyle(any).marginRight) || 0;
      step = cardW + mr;

      slidesPerView = isMobile() ? 1 : 3;

      // ✅ CHAVE: permitir alinhar QUALQUER card à esquerda no desktop
      // adiciona espaço à direita equivalente a (slidesPerView - 1) cards
      if (!isMobile() && step >= 10){
        track.style.paddingRight = ((slidesPerView - 1) * step) + 'px';
      } else {
        track.style.paddingRight = '0px';
      }

      // ✅ agora o track pode ir até o último card
      maxIndex = Math.max(0, slides.length - 1);

      focus = Math.max(0, Math.min(slides.length - 1, focus));
      index = indexFromFocus(focus);
      index = Math.max(0, Math.min(maxIndex, index));
    }

    // 1:1 -> card N vira leftmost (com o padding-right isso funciona até o último)
    function indexFromFocus(f){
      return Math.max(0, Math.min(maxIndex, f));
    }

    function setTransform(i, withTransition){
      if (!ensureMeasured()) return;
      track.style.transition = withTransition ? '' : 'none';
      track.style.transform = 'translate3d(' + (-i * step) + 'px,0,0)';
      if (!withTransition){
        track.getBoundingClientRect();
        track.style.transition = '';
      }
    }

    function setTranslatePx(px){
      track.style.transition = 'none';
      track.style.transform = 'translate3d(' + px + 'px,0,0)';
    }

    function getCurrentTranslate(){
      const tr = getComputedStyle(track).transform;
      if (!tr || tr === 'none') return 0;
      const m = tr.includes('matrix3d') ? tr.match(/matrix3d\((.+)\)/) : tr.match(/matrix\((.+)\)/);
      if (!m) return 0;
      const parts = m[1].split(',').map(s => parseFloat(s.trim()));
      return tr.includes('matrix3d') ? (parts[12] || 0) : (parts[4] || 0);
    }

    // ===== DOTS =====
    function buildDots(){
      if (!dotsWrap || isMobile()) return;

      dotsWrap.innerHTML = '';
      dots = [];

      for (let i = 0; i < slides.length; i++){
        const dot = document.createElement('div');
        dot.className = 'gallery-dot';
        dot.setAttribute('role','button');
        dot.setAttribute('tabindex','0');
        dot.setAttribute('aria-label','Ir para o card ' + (i + 1));

        const fill = document.createElement('div');
        fill.className = 'gallery-dot-fill';
        dot.appendChild(fill);

        dot.addEventListener('click', () => goToCard(i));
        dot.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            goToCard(i);
          }
        });

        dotsWrap.appendChild(dot);
        dots.push(dot);
      }
    }

    function restartDotProgress(){
      if (isMobile()) return;
      if (!dots.length) return;

      dots.forEach(d => d.classList.remove('is-active'));
      const active = dots[focus];
      if (!active) return;

      active.classList.remove('is-active');
      void active.offsetWidth; // reset
      active.classList.add('is-active');
    }

    // ✅ autoplay confiável (não depende de animationend)
    function restartAutoplay(){
      autoplayToken++;
      if (timer) clearTimeout(timer);
      timer = null;

      restartDotProgress();

      const myToken = autoplayToken;
      timer = setTimeout(() => {
        if (myToken !== autoplayToken) return;
        next();
      }, PROGRESS_MS);
    }

    function applyFocus(f, withTransition){
      focus = Math.max(0, Math.min(slides.length - 1, f));
      index = indexFromFocus(focus);
      setTransform(index, withTransition);
    }

    function next(){
      if (!ensureMeasured()) return;

      if (focus >= slides.length - 1){
        focus = 0;
        index = 0;
        setTransform(0, false);
        restartAutoplay();
        return;
      }
      applyFocus(focus + 1, true);
      restartAutoplay();
    }

    function prev(){
      if (!ensureMeasured()) return;

      if (focus <= 0){
        focus = slides.length - 1;
        index = indexFromFocus(focus);
        setTransform(index, false);
        restartAutoplay();
        return;
      }
      applyFocus(focus - 1, true);
      restartAutoplay();
    }

    function goToCard(i){
      if (!ensureMeasured()) return;
      applyFocus(i, true);
      restartAutoplay();
    }

    // setas
    if (btnNext) btnNext.addEventListener('click', next);
    if (btnPrev) btnPrev.addEventListener('click', prev);

    // ===== Drag/Swipe (sem matar clique) =====
    const THRESHOLD = 12;
    const SUPPRESS_MIN_DRAG = 18;

    let isDown = false;
    let lock = null;
    let startX = 0;
    let startY = 0;
    let startTranslate = 0;
    let didDragX = false;
    let dragDistance = 0;

    function clamp(px){
      const minPx = -maxIndex * step;
      const maxPx = 0;
      return Math.max(minPx, Math.min(maxPx, px));
    }

    function onPointerDown(e){
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      const t = e.target;
      if (t && (t.closest('.arrow-slider') || t.closest('.gallery-dot'))) return;
      if (!ensureMeasured()) return;

      isDown = true;
      lock = null;
      didDragX = false;
      dragDistance = 0;

      startX = e.clientX;
      startY = e.clientY;
      startTranslate = getCurrentTranslate();

      autoplayToken++;
      if (timer) clearTimeout(timer);
    }

    function onPointerMove(e){
      if (!isDown) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (!lock){
        if (Math.abs(dx) >= THRESHOLD || Math.abs(dy) >= THRESHOLD){
          lock = (Math.abs(dx) > Math.abs(dy)) ? 'x' : 'y';
          if (lock === 'x'){
            didDragX = true;
            track.classList.add('is-dragging');
            track.style.transition = 'none';
            try { track.setPointerCapture(e.pointerId); } catch(_) {}
          }
        } else return;
      }

      if (lock === 'y') return;
      if (e.cancelable) e.preventDefault();

      dragDistance = Math.max(dragDistance, Math.abs(dx));
      setTranslatePx(clamp(startTranslate + dx));
    }

    function onPointerUp(e){
      if (!isDown) return;
      isDown = false;

      track.classList.remove('is-dragging');
      track.style.transition = '';

      if (didDragX){
        suppressClickUntil = (dragDistance >= SUPPRESS_MIN_DRAG) ? (Date.now() + 350) : 0;

        const px = getCurrentTranslate();
        const raw = Math.round(Math.abs(px) / step);
        index = Math.max(0, Math.min(maxIndex, raw));

        setTransform(index, true);
        focus = index; // leftmost vira o foco
      }

      restartAutoplay();
      try { track.releasePointerCapture(e.pointerId); } catch(_) {}
    }

    track.addEventListener('pointerdown', onPointerDown, { passive: true });
    track.addEventListener('pointermove', onPointerMove, { passive: false });
    track.addEventListener('pointerup', onPointerUp, { passive: true });
    track.addEventListener('pointercancel', onPointerUp, { passive: true });

    // init
    function initLayout(){
      updateSizes();

      if (dotsWrap) dotsWrap.innerHTML = '';
      dots = [];
      buildDots();

      index = indexFromFocus(focus);
      setTransform(index, false);
      restartAutoplay();
    }

    waitImages().then(() => {
      requestAnimationFrame(() => requestAnimationFrame(initLayout));
    });

    window.addEventListener('resize', initLayout);

    document.addEventListener('visibilitychange', () => {
      autoplayToken++;
      if (timer) clearTimeout(timer);
      timer = null;
      if (!document.hidden) restartAutoplay();
    });

    if ('ResizeObserver' in window){
      const ro = new ResizeObserver(initLayout);
      ro.observe(wrap);
    }
  }
});
