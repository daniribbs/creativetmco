/* ============================================================
   1. ACCORDION — PROCESSO
   ============================================================ */

   (function () {

    /* ----------------------------------------------------------
       Inicializa todos os accordions como fechados
       ---------------------------------------------------------- */
    function initAccordion() {
      document
        .querySelectorAll(".accordion-item-processo")
        .forEach(function (item) {
  
          item.classList.remove("is-open");
  
        });
    }
  
  
    /* ----------------------------------------------------------
       Executa a inicialização quando o DOM estiver pronto
       ---------------------------------------------------------- */
    if (document.readyState === "loading") {
  
      document.addEventListener(
        "DOMContentLoaded",
        initAccordion
      );
  
    } else {
  
      initAccordion();
  
    }
  
  
    /* ----------------------------------------------------------
       Delegação de evento:
  
       Permite clicar em qualquer parte do item para abrir/
       fechar o accordion.
  
       Links e botões são ignorados para não interferir
       em outras ações da página.
       ---------------------------------------------------------- */
    document.addEventListener("click", function (event) {
  
      /* Não interfere em links ou botões */
      if (event.target.closest("a, button")) {
        return;
      }
  
  
      /* Descobre qual accordion foi clicado */
      var item = event.target.closest(
        ".accordion-item-processo"
      );
  
  
      /* Se o clique não estiver dentro de um accordion,
         não faz nada */
      if (!item) {
        return;
      }
  
  
      /* Abre ou fecha o accordion */
      item.classList.toggle("is-open");
  
    });
  
  })();
  
  
/* ============================================================
   2. GALERIA / CARROSSEL (INFINITO SEM ESPAÇO VAZIO)
   ============================================================ */

   document.addEventListener("DOMContentLoaded", function () {
    const section = document.querySelector(".gallery-case");
    const wrap = document.querySelector(".gallery-case-wrap");
    const dotsWrap = document.querySelector(".gallery-case_dots");
  
    const btnPrev = document.querySelector(".arrow-slider.left, .arrow-slider-2.left");
    const btnNext = document.querySelector(".arrow-slider.right, .arrow-slider-2.right");
  
    if (!section || !wrap) return;
  
    const track = wrap;
  
    let originalSlides = Array.from(track.querySelectorAll(".gallery-case_card"));
    if (originalSlides.length === 0) {
      originalSlides = Array.from(track.querySelectorAll(":scope > img"));
    }
  
    if (originalSlides.length < 2) return;
  
    const N = originalSlides.length;
    const PROGRESS_MS = 6500;
  
    /* ----------------------------------------------------------
       CLONAGEM DUPLA / MÚLTIPLA
       Clonamos o conjunto para preencher a tela perfeitamente
       ---------------------------------------------------------- */
    // Clones no início (últimos itens)
    const headClones = originalSlides.map((el) => {
      const c = el.cloneNode(true);
      c.classList.add("is-clone");
      return c;
    });
  
    // Clones no final (primeiros itens)
    const tailClones = originalSlides.map((el) => {
      const c = el.cloneNode(true);
      c.classList.add("is-clone");
      return c;
    });
  
    // Inserção no DOM: [headClones ... originalSlides ... tailClones]
    headClones.forEach((clone) => track.insertBefore(clone, originalSlides[0]));
    tailClones.forEach((clone) => track.appendChild(clone));
  
    const allSlides = Array.from(track.children);
  
    /* ----------------------------------------------------------
       ESTADO
       ---------------------------------------------------------- */
    // O primeiro slide original agora fica no índice N
    let currentIndex = N; 
    let step = 0;
    let timer = null;
    let dots = [];
    let isTransitioning = false;
  
    // Drag / Swipe
    let isDown = false;
    let startX = 0;
    let startY = 0;
    let startTranslate = 0;
    let currentTranslate = 0;
    let lock = null;
  
    const isMobile = () => window.matchMedia("(max-width: 991px)").matches;
    let isInView = false;
    let isReady = false;
  
    /* ----------------------------------------------------------
       FULL BLEED / ALINHAMENTO
       ---------------------------------------------------------- */
    function applyFullBleedAligned() {
      section.style.width = "";
      section.style.marginLeft = "";
  
      const rect = section.getBoundingClientRect();
      const left = Math.max(0, rect.left);
      const gridWidth = Math.max(0, rect.width);
  
      document.documentElement.style.setProperty("--grid-width", gridWidth + "px");
  
      section.style.width = "100vw";
      section.style.marginLeft = "calc(50% - 50vw)";
      wrap.style.paddingLeft = left + "px";
    }
  
    function getStep() {
      const any = originalSlides[0];
      const w = any.getBoundingClientRect().width || 625;
      const mr = parseFloat(getComputedStyle(any).marginRight) || 0;
      return w + mr;
    }
  
    function waitImages() {
      const imgs = allSlides
        .map((s) => (s.tagName === "IMG" ? s : s.querySelector("img")))
        .filter(Boolean);
  
      return Promise.all(
        imgs.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.addEventListener("load", resolve, { once: true });
            img.addEventListener("error", resolve, { once: true });
          });
        })
      );
    }
  
    /* ----------------------------------------------------------
       TRANSFORMAÇÕES E RESET INVISÍVEL
       ---------------------------------------------------------- */
    function setTransform(i, withTransition = true) {
      if (withTransition) {
        track.style.transition = "transform 550ms cubic-bezier(.2, .8, .2, 1)";
        isTransitioning = true;
      } else {
        track.style.transition = "none";
        isTransitioning = false;
      }
  
      currentTranslate = -i * step;
      track.style.transform = `translate3d(${currentTranslate}px, 0, 0)`;
  
      if (!withTransition) {
        track.getBoundingClientRect(); // Reflow imediato
      }
    }
  
    // Quando chega no final da animação, fazemos o salto transparente
    track.addEventListener("transitionend", () => {
      isTransitioning = false;
  
      // Se avançou além dos itens originais -> reseta para a posição equivalente central
      if (currentIndex >= N * 2) {
        currentIndex -= N;
        setTransform(currentIndex, false);
      }
      // Se recuou antes dos itens originais -> reseta para a posição equivalente central
      else if (currentIndex < N) {
        currentIndex += N;
        setTransform(currentIndex, false);
      }
    });
  
    /* ----------------------------------------------------------
       INDICADORES (DOTS)
       ---------------------------------------------------------- */
    function buildDots() {
      if (!dotsWrap || isMobile()) return;
  
      dotsWrap.innerHTML = "";
      dots = [];
  
      for (let i = 0; i < N; i++) {
        const dot = document.createElement("div");
        dot.className = "gallery-dot";
        dot.setAttribute("role", "button");
        dot.setAttribute("tabindex", "0");
        dot.setAttribute("aria-label", "Ir para posição " + (i + 1));
  
        const fill = document.createElement("div");
        fill.className = "gallery-dot-fill";
        dot.appendChild(fill);
  
        dot.addEventListener("click", () => goTo(i));
        dotsWrap.appendChild(dot);
        dots.push(dot);
      }
    }
  
    function updateDots() {
      if (isMobile() || !dots.length) return;
  
      const realIndex = (currentIndex % N + N) % N;
  
      dots.forEach((dot) => dot.classList.remove("is-active"));
  
      const active = dots[realIndex];
      if (active) {
        void active.offsetWidth;
        active.classList.add("is-active");
      }
    }
  
    /* ----------------------------------------------------------
       AUTOPLAY
       ---------------------------------------------------------- */
    function stopAutoplay() {
      if (timer) clearTimeout(timer);
      timer = null;
    }
  
    function restartAutoplay() {
      if (!isInView || !isReady) return;
      stopAutoplay();
      updateDots();
      timer = setTimeout(() => next(), PROGRESS_MS);
    }
  
    function ensureAutoplay() {
      if (isReady && isInView) restartAutoplay();
    }
  
    /* ----------------------------------------------------------
       NAVEGAÇÃO
       ---------------------------------------------------------- */
    function next() {
      if (isTransitioning) return;
      currentIndex++;
      setTransform(currentIndex, true);
      restartAutoplay();
    }
  
    function prev() {
      if (isTransitioning) return;
      currentIndex--;
      setTransform(currentIndex, true);
      restartAutoplay();
    }
  
    function goTo(i) {
      if (isTransitioning) return;
      currentIndex = N + i; // Direciona para o slide dentro do bloco original
      setTransform(currentIndex, true);
      restartAutoplay();
    }
  
    /* ----------------------------------------------------------
       SETAS
       ---------------------------------------------------------- */
    if (btnNext) btnNext.addEventListener("click", () => { isInView = true; next(); });
    if (btnPrev) btnPrev.addEventListener("click", () => { isInView = true; prev(); });
  
    /* ----------------------------------------------------------
       DRAG / SWIPE
       ---------------------------------------------------------- */
    function pointerXY(e) {
      if (e.touches && e.touches[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      if (e.changedTouches && e.changedTouches[0]) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
      return { x: e.clientX, y: e.clientY };
    }
  
    function onDown(e) {
      const target = e.target;
      if (target && (target.closest(".arrow-slider") || target.closest(".arrow-slider-2") || target.closest(".gallery-dot"))) return;
  
      isDown = true;
      lock = null;
      const p = pointerXY(e);
      startX = p.x;
      startY = p.y;
      startTranslate = currentTranslate;
  
      stopAutoplay();
      track.classList.add("is-dragging");
      track.style.transition = "none";
    }
  
    function onMove(e) {
      if (!isDown) return;
      const p = pointerXY(e);
      const dx = p.x - startX;
      const dy = p.y - startY;
  
      if (!lock) {
        if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
          lock = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
        } else return;
      }
  
      if (lock === "y") return;
      if (e.cancelable) e.preventDefault();
  
      currentTranslate = startTranslate + dx;
      track.style.transform = `translate3d(${currentTranslate}px, 0, 0)`;
    }
  
    function onUp() {
      if (!isDown) return;
      isDown = false;
      track.classList.remove("is-dragging");
  
      if (lock !== "x") {
        ensureAutoplay();
        return;
      }
  
      const movedPx = currentTranslate - startTranslate;
      const threshold = step * 0.18;
  
      if (movedPx < -threshold) {
        currentIndex++;
      } else if (movedPx > threshold) {
        currentIndex--;
      }
  
      setTransform(currentIndex, true);
      ensureAutoplay();
    }
  
    track.addEventListener("touchstart", onDown, { passive: true });
    track.addEventListener("touchmove", onMove, { passive: false });
    track.addEventListener("touchend", onUp, { passive: true });
    track.addEventListener("touchcancel", onUp, { passive: true });
  
    track.addEventListener("mousedown", (e) => { e.preventDefault(); onDown(e); });
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  
    /* ----------------------------------------------------------
       INICIALIZAÇÃO
       ---------------------------------------------------------- */
    applyFullBleedAligned();
  
    waitImages().then(() => {
      step = getStep();
      buildDots();
  
      // Posiciona exatamente no primeiro slide do bloco central (índice N)
      setTransform(currentIndex, false);
  
      isReady = true;
  
      if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver(
          (entries) => {
            const entry = entries[0];
            isInView = entry && entry.isIntersecting && entry.intersectionRatio >= 0.35;
            if (isInView) restartAutoplay();
            else stopAutoplay();
          },
          { threshold: [0, 0.35, 0.6, 1] }
        );
        io.observe(section);
      } else {
        isInView = true;
        restartAutoplay();
      }
    });
  
    window.addEventListener("resize", () => {
      applyFullBleedAligned();
      step = getStep();
      buildDots();
      setTransform(currentIndex, false);
      ensureAutoplay();
    });
  
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopAutoplay();
      else ensureAutoplay();
    });
  });