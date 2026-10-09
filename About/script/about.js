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
   2. GALERIA / CARROSSEL (ROLAGEM INFINITA)
   ============================================================ */

   document.addEventListener("DOMContentLoaded", function () {
    const section = document.querySelector(".gallery-case");
    const wrap = document.querySelector(".gallery-case-wrap");
    const dotsWrap = document.querySelector(".gallery-case_dots");
  
    const btnPrev = document.querySelector(".arrow-slider.left, .arrow-slider-2.left");
    const btnNext = document.querySelector(".arrow-slider.right, .arrow-slider-2.right");
  
    if (!section || !wrap) return;
  
    const track = wrap;
  
    // Localiza os elementos originais
    let originalSlides = Array.from(track.querySelectorAll(".gallery-case_card"));
    if (originalSlides.length === 0) {
      originalSlides = Array.from(track.querySelectorAll(":scope > img"));
    }
  
    if (originalSlides.length < 2) return;
  
    const PROGRESS_MS = 6500;
  
    /* ----------------------------------------------------------
       CLONAGEM DOS SLIDES PARA LOOP INFINITO
       ---------------------------------------------------------- */
    const firstClone = originalSlides[0].cloneNode(true);
    const lastClone = originalSlides[originalSlides.length - 1].cloneNode(true);
  
    firstClone.classList.add("is-clone");
    lastClone.classList.add("is-clone");
  
    // Insere o último clone no início e o primeiro clone no final
    track.appendChild(firstClone);
    track.insertBefore(lastClone, originalSlides[0]);
  
    const allSlides = Array.from(track.children);
  
    /* ----------------------------------------------------------
       ESTADO DA GALERIA
       ---------------------------------------------------------- */
    let currentIndex = 1; // Inicia no índice 1 (primeiro slide real)
    let step = 0;
    let timer = null;
    let gridWidth = 0;
    let paddingLeftVal = 0;
    let dots = [];
    let isTransitioning = false;
  
    /* ----------------------------------------------------------
       ESTADO DO DRAG / SWIPE
       ---------------------------------------------------------- */
    let isDown = false;
    let startX = 0;
    let startY = 0;
    let startTranslate = 0;
    let currentTranslate = 0;
    let lock = null;
  
    const isMobile = () => window.matchMedia("(max-width: 991px)").matches;
  
    let isInView = false;
    let isReady = false;
  
    /* ==========================================================
       AJUSTE DE LARGURA / FULL BLEED COM ALINHAMENTO
       ========================================================== */
    function applyFullBleedAligned() {
      section.style.width = "";
      section.style.marginLeft = "";
  
      const rect = section.getBoundingClientRect();
      paddingLeftVal = Math.max(0, rect.left);
      gridWidth = Math.max(0, rect.width);
  
      document.documentElement.style.setProperty("--grid-width", gridWidth + "px");
  
      section.style.width = "100vw";
      section.style.marginLeft = "calc(50% - 50vw)";
  
      // Aplica o padding esquerdo no container para manter o alinhamento com o grid
      wrap.style.paddingLeft = paddingLeftVal + "px";
    }
  
    /* ==========================================================
       CÁLCULO DO PASSO (STEP)
       ========================================================== */
    function getStep() {
      const any = originalSlides[0];
      const w = any.getBoundingClientRect().width || 625;
      const mr = parseFloat(getComputedStyle(any).marginRight) || 0;
      return w + mr;
    }
  
    function waitImages() {
      const imgs = allSlides
        .map((slide) => (slide.tagName === "IMG" ? slide : slide.querySelector("img")))
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
  
    /* ==========================================================
       MOVIMENTAÇÃO DO CARROSSEL
       ========================================================== */
    function setTransform(i, withTransition = true) {
      if (withTransition) {
        track.style.transition = "transform 550ms cubic-bezier(.2, .8, .2, 1)";
        isTransitioning = true;
      } else {
        track.style.transition = "none";
        isTransitioning = false;
      }
  
      // Calcula a posição considerando o deslocamento do clone inicial
      currentTranslate = -i * step;
      track.style.transform = `translate3d(${currentTranslate}px, 0, 0)`;
  
      if (!withTransition) {
        track.getBoundingClientRect(); // Força repaint
      }
    }
  
    // Quando a transição suave termina, verifica se precisa de um salto invisível (reset do loop)
    track.addEventListener("transitionend", () => {
      isTransitioning = false;
  
      // Se chegou ao clone do final -> salta instantaneamente para o slide 1 real
      if (currentIndex >= allSlides.length - 1) {
        currentIndex = 1;
        setTransform(currentIndex, false);
      }
  
      // Se chegou ao clone do início -> salta instantaneamente para o último slide real
      if (currentIndex <= 0) {
        currentIndex = originalSlides.length;
        setTransform(currentIndex, false);
      }
    });
  
    /* ==========================================================
       INDICADORES (DOTS)
       ========================================================== */
    function buildDots() {
      if (!dotsWrap || isMobile()) return;
  
      dotsWrap.innerHTML = "";
      dots = [];
  
      for (let i = 0; i < originalSlides.length; i++) {
        const dot = document.createElement("div");
        dot.className = "gallery-dot";
        dot.setAttribute("role", "button");
        dot.setAttribute("tabindex", "0");
        dot.setAttribute("aria-label", "Ir para posição " + (i + 1));
  
        const fill = document.createElement("div");
        fill.className = "gallery-dot-fill";
        dot.appendChild(fill);
  
        dot.addEventListener("click", () => goTo(i));
        dot.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            goTo(i);
          }
        });
  
        dotsWrap.appendChild(dot);
        dots.push(dot);
      }
    }
  
    function updateDots() {
      if (isMobile() || !dots.length) return;
  
      // Mapeia o índice atual para o intervalo dos slides reais (0 a originalSlides.length - 1)
      let realIndex = (currentIndex - 1 + originalSlides.length) % originalSlides.length;
  
      dots.forEach((dot) => dot.classList.remove("is-active"));
  
      const active = dots[realIndex];
      if (active) {
        void active.offsetWidth; // Reinicia animação CSS
        active.classList.add("is-active");
      }
    }
  
    /* ==========================================================
       AUTOPLAY
       ========================================================== */
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
  
    /* ==========================================================
       CONTROLES DE NAVEGAÇÃO
       ========================================================== */
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
      currentIndex = i + 1; // +1 devido ao clone inicial
      setTransform(currentIndex, true);
      restartAutoplay();
    }
  
    /* ==========================================================
       EVENTOS DAS SETAS E TECLADO
       ========================================================== */
    if (btnNext) {
      btnNext.addEventListener("click", () => {
        isInView = true;
        next();
      });
    }
  
    if (btnPrev) {
      btnPrev.addEventListener("click", () => {
        isInView = true;
        prev();
      });
    }
  
    [btnPrev, btnNext].forEach((btn) => {
      if (!btn) return;
      btn.setAttribute("role", "button");
      btn.setAttribute("tabindex", "0");
      btn.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          isInView = true;
          btn === btnNext ? next() : prev();
        }
      });
    });
  
    /* ==========================================================
       DRAG / SWIPE
       ========================================================== */
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
      const threshold = step * 0.18; // Sensibilidade do swipe
  
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
  
    track.addEventListener("mousedown", (e) => {
      e.preventDefault();
      onDown(e);
    });
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  
    /* ==========================================================
       INICIALIZAÇÃO DA GALERIA
       ========================================================== */
    applyFullBleedAligned();
  
    waitImages().then(() => {
      step = getStep();
      buildDots();
  
      // Posiciona imediatamente no primeiro slide real (índice 1), sem transição
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
  
    /* ==========================================================
       RESPONSIVIDADE E VISIBILIDADE
       ========================================================== */
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