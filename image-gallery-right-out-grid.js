document.addEventListener('DOMContentLoaded', function () {
  const section  = document.querySelector('.gallery-case');
  const wrap     = document.querySelector('.gallery-case-wrap');
  const track    = document.querySelector('.gallery-case_cards');
  const dotsWrap = document.querySelector('.gallery-case_dots');
  const btnPrev  = document.querySelector('.arrow-slider.left');
  const btnNext  = document.querySelector('.arrow-slider.right');

  if (!section || !wrap || !track) return;

  const slides = Array.from(track.querySelectorAll('.gallery-case_card'));
  if (slides.length < 2) return;

  const PROGRESS_MS = 6500;

  let index = 0;
  let step = 0;
  let timer = null;

  let gridWidth = 0;
  let slidesPerView = 2;
  let maxIndex = 0;

  let dots = [];

  // drag/swipe state (desktop + mobile)
  let isDown = false;
  let startX = 0;
  let startY = 0;
  let startTranslate = 0;
  let currentTranslate = 0;
  let lock = null; // 'x' | 'y' | null

  const isMobile = () => window.matchMedia('(max-width: 991px)').matches;

  function applyFullBleedAligned(){
    section.style.width = '';
    section.style.marginLeft = '';

    const rect = section.getBoundingClientRect();
    const left = Math.max(0, rect.left);
    gridWidth = Math.max(0, rect.width);

    // manda a largura real do grid pro CSS (desktop e mobile também, ajuda)
    document.documentElement.style.setProperty('--grid-width', gridWidth + 'px');

    section.style.width = '100vw';
    section.style.marginLeft = 'calc(50% - 50vw)';

    wrap.style.paddingLeft = left + 'px';
    wrap.style.paddingRight = '0px';
  }

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

  function getStep(){
    const any = slides[0];
    const w  = any.getBoundingClientRect().width || 625;
    const mr = parseFloat(getComputedStyle(any).marginRight) || 0;
    return w + mr;
  }

  function recalcLimits(){
    const any = slides[0];
    const mr = parseFloat(getComputedStyle(any).marginRight) || 0;

    const k = Math.floor((gridWidth + mr) / step);
    slidesPerView = Math.max(1, Math.min(slides.length, k || 1));

    maxIndex = Math.max(0, slides.length - slidesPerView);
    if (index > maxIndex) index = maxIndex;
  }

  function setTransform(i, withTransition){
    track.style.transition = withTransition ? '' : 'none';
    currentTranslate = -i * step;
    track.style.transform = 'translate3d(' + currentTranslate + 'px,0,0)';
    if (!withTransition){
      track.getBoundingClientRect();
      track.style.transition = '';
    }
  }

  function setTranslatePx(px, withTransition){
    track.style.transition = withTransition ? '' : 'none';
    currentTranslate = px;
    track.style.transform = 'translate3d(' + currentTranslate + 'px,0,0)';
    if (!withTransition){
      track.getBoundingClientRect();
      track.style.transition = '';
    }
  }

  function buildDots(){
    // dots só no desktop (>= 992)
    if (!dotsWrap || isMobile()) return;

    dotsWrap.innerHTML = '';
    dots = [];

    const totalPositions = maxIndex + 1;

    for (let i = 0; i < totalPositions; i++){
      const dot = document.createElement('div');
      dot.className = 'gallery-dot';
      dot.setAttribute('role','button');
      dot.setAttribute('tabindex','0');
      dot.setAttribute('aria-label','Ir para posição ' + (i + 1));

      const fill = document.createElement('div');
      fill.className = 'gallery-dot-fill';
      dot.appendChild(fill);

      dot.addEventListener('click', () => goTo(i));
      dot.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          goTo(i);
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
    const active = dots[index];
    if (!active) return;
    active.classList.remove('is-active');
    void active.offsetWidth;
    active.classList.add('is-active');
  }

  function restartAutoplay(){
    if (timer) clearTimeout(timer);
    restartDotProgress();
    timer = setTimeout(() => next(), PROGRESS_MS);
  }

  function next(){
    if (index >= maxIndex) {
      index = 0;
      setTransform(index, false);
      restartAutoplay();
      return;
    }
    index += 1;
    setTransform(index, true);
    restartAutoplay();
  }

  function prev(){
    if (index <= 0) {
      index = maxIndex;
      setTransform(index, false);
      restartAutoplay();
      return;
    }
    index -= 1;
    setTransform(index, true);
    restartAutoplay();
  }

  function goTo(i){
    index = Math.max(0, Math.min(maxIndex, i));
    setTransform(index, true);
    restartAutoplay();
  }

  // binds setas
  if (btnNext) btnNext.addEventListener('click', () => next());
  if (btnPrev) btnPrev.addEventListener('click', () => prev());

  [btnPrev, btnNext].forEach(btn => {
    if(!btn) return;
    btn.setAttribute('role','button');
    btn.setAttribute('tabindex','0');
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        btn === btnNext ? next() : prev();
      }
    });
  });

  // ------- Drag/Swipe (desktop + mobile) -------
  function clampIndexFromTranslate(px){
    const raw = Math.round(Math.abs(px) / step);
    return Math.max(0, Math.min(maxIndex, raw));
  }

  function pointerXY(e){
    if (e.touches && e.touches[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    if (e.changedTouches && e.changedTouches[0]) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  }

  function onDown(e){
    // não iniciar drag se clicou numa seta/dot
    const target = e.target;
    if (target && (target.closest('.arrow-slider') || target.closest('.gallery-dot'))) return;

    isDown = true;
    lock = null;

    const p = pointerXY(e);
    startX = p.x;
    startY = p.y;
    startTranslate = currentTranslate;

    if (timer) clearTimeout(timer);

    track.classList.add('is-dragging');
    track.style.transition = 'none';
  }

  function onMove(e){
    if (!isDown) return;

    const p = pointerXY(e);
    const dx = p.x - startX;
    const dy = p.y - startY;

    // decide intenção: horizontal vs vertical
    if (!lock){
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6){
        lock = (Math.abs(dx) > Math.abs(dy)) ? 'x' : 'y';
      } else {
        return;
      }
    }

    // se é vertical, não mexe no carrossel
    if (lock === 'y') return;

    // se estamos no touch e é horizontal, previne scroll (só se cancelável)
    if (e.cancelable) e.preventDefault();

    // arrasta (limitado)
    const minPx = -maxIndex * step;
    const maxPx = 0;
    const nextPx = Math.max(minPx, Math.min(maxPx, startTranslate + dx));

    setTranslatePx(nextPx, false);
  }

  function onUp(){
    if (!isDown) return;

    isDown = false;
    track.classList.remove('is-dragging');

    // se não travou em horizontal, só volta autoplay sem “snap”
    if (lock !== 'x'){
      restartAutoplay();
      return;
    }

    // snap
    index = clampIndexFromTranslate(currentTranslate);
    setTransform(index, true);

    restartAutoplay();
  }

  // Touch
  track.addEventListener('touchstart', onDown, { passive: true });
  track.addEventListener('touchmove', onMove, { passive: false });
  track.addEventListener('touchend', onUp, { passive: true });
  track.addEventListener('touchcancel', onUp, { passive: true });

  // Mouse (desktop drag)
  track.addEventListener('mousedown', (e) => { e.preventDefault(); onDown(e); });
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);

  // init
  applyFullBleedAligned();

  waitImages().then(() => {
    step = getStep();
    recalcLimits();

    buildDots(); // só desktop
    setTransform(index, false);
    restartAutoplay();
  });

  window.addEventListener('resize', () => {
    applyFullBleedAligned();

    const newStep = getStep();
    if (Math.abs(newStep - step) > 0.5) step = newStep;

    recalcLimits();

    // rebuild dots (desktop only)
    if (dotsWrap) dotsWrap.innerHTML = '';
    dots = [];
    buildDots();

    setTransform(index, false);
    restartAutoplay();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (timer) clearTimeout(timer);
    } else {
      restartAutoplay();
    }
  });
});
