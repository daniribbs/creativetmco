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
   2. GALERIA / CARROSSEL (INFINITO)
   ============================================================ */

   document.addEventListener("DOMContentLoaded", function () {

    /* ----------------------------------------------------------
       ELEMENTOS PRINCIPAIS
       ---------------------------------------------------------- */
  
    const section = document.querySelector(".gallery-case");
    const wrap = document.querySelector(".gallery-case-wrap");
    const dotsWrap = document.querySelector(".gallery-case_dots");
  
    /* Aceita .arrow-slider e .arrow-slider-2 */
    const btnPrev = document.querySelector(
      ".arrow-slider.left, .arrow-slider-2.left"
    );
    const btnNext = document.querySelector(
      ".arrow-slider.right, .arrow-slider-2.right"
    );
  
    if (!section || !wrap) {
      return;
    }
  
    /* O próprio .gallery-case-wrap funciona como o trilho */
    const track = wrap;
  
    /* ----------------------------------------------------------
       LOCALIZA OS SLIDES ORIGINAIS
       ---------------------------------------------------------- */
  
    let slides = Array.from(track.querySelectorAll(".gallery-case_card"));
  
    if (slides.length === 0) {
      slides = Array.from(track.querySelectorAll(":scope > img"));
    }
  
    if (slides.length < 2) {
      return;
    }
  
    /* Quantidade de slides originais */
    const total = slides.length;
  
  
    /* ----------------------------------------------------------
       CLONES PARA O LOOP INFINITO
  
       O trilho fica com 3 conjuntos: original + 2 clones.
       O array "slides" continua com apenas os originais.
       ---------------------------------------------------------- */
  
    const SETS = 3;
  
    for (let c = 1; c < SETS; c++) {
      slides.forEach(function (slide) {
        const clone = slide.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        clone.dataset.clone = "true";
        track.appendChild(clone);
      });
    }
  
  
    /* ----------------------------------------------------------
       CONFIGURAÇÕES
       ---------------------------------------------------------- */
  
    const PROGRESS_MS = 6500;
  
  
    /* ----------------------------------------------------------
       ESTADO DA GALERIA
       ---------------------------------------------------------- */
  
    let index = 0;
    let step = 0;
    let timer = null;
    let gridWidth = 0;
    let slidesPerView = 2;
    let dots = [];
  
  
    /* ESTADO DO DRAG / SWIPE */
  
    let isDown = false;
    let startX = 0;
    let startY = 0;
    let startTranslate = 0;
    let currentTranslate = 0;
    let lock = null;
  
  
    const isMobile = () => {
      return window.matchMedia("(max-width: 991px)").matches;
    };
  
    let isInView = false;
    let isReady = false;
  
  
    /* Maior índice possível dentro do trilho com clones */
    function absMaxIndex() {
      return total * SETS - slidesPerView;
    }
  
  
    /* ==========================================================
       AUTOPLAY
       ========================================================== */
  
    function stopAutoplay() {
      if (timer) {
        clearTimeout(timer);
      }
      timer = null;
    }
  
    function ensureAutoplay() {
      if (!isReady) {
        return;
      }
      if (!isInView) {
        return;
      }
      restartAutoplay();
    }
  
  
    /* ==========================================================
       AJUSTE DE LARGURA / FULL BLEED
  
       Mede a posição real da seção e a desloca até x = 0,
       usando clientWidth (largura sem a barra de rolagem).
       ========================================================== */
  
    function applyFullBleedAligned() {
  
      /* Limpa ajustes anteriores para medir o layout original */
      section.style.width = "";
      section.style.position = "";
      section.style.left = "";
      section.style.marginLeft = "";
      wrap.style.paddingLeft = "";
  
      const rect = section.getBoundingClientRect();
  
      const left = Math.max(0, rect.left);
  
      gridWidth = Math.max(0, rect.width);
  
      /* Atualiza a variável CSS com a largura do grid */
      document.documentElement.style.setProperty(
        "--grid-width",
        gridWidth + "px"
      );
  
      /* Faz a seção ocupar toda a largura visível */
      section.style.position = "relative";
      section.style.left = -rect.left + "px";
      section.style.width = document.documentElement.clientWidth + "px";
  
      /* Mantém o primeiro slide alinhado ao grid */
      wrap.style.paddingLeft = left + "px";
      wrap.style.paddingRight = "0px";
    }
  
  
    /* ==========================================================
       ESPERA PELO CARREGAMENTO DAS IMAGENS
       ========================================================== */
  
    function waitImages() {
  
      const imgs = slides
        .map(function (slide) {
          return slide.tagName === "IMG" ? slide : slide.querySelector("img");
        })
        .filter(Boolean);
  
      return Promise.all(
        imgs.map(function (img) {
  
          if (img.complete) {
            return Promise.resolve();
          }
  
          return new Promise(function (resolve) {
            img.addEventListener("load", resolve, { once: true });
            img.addEventListener("error", resolve, { once: true });
          });
  
        })
      );
    }
  
  
    /* ==========================================================
       CALCULA O TAMANHO DE CADA PASSO
       ========================================================== */
  
    function getStep() {
  
      const any = slides[0];
  
      const w = any.getBoundingClientRect().width || 625;
  
      const mr = parseFloat(getComputedStyle(any).marginRight) || 0;
  
      /* Largura do slide + espaçamento */
      return w + mr;
    }
  
  
    /* ==========================================================
       CALCULA QUANTOS SLIDES CABEM NA TELA
       ========================================================== */
  
    function recalcLimits() {
  
      const any = slides[0];
  
      const mr = parseFloat(getComputedStyle(any).marginRight) || 0;
  
      const k = Math.floor((gridWidth + mr) / step);
  
      slidesPerView = Math.max(1, Math.min(total, k || 1));
    }
  
  
    /* ==========================================================
       MOVIMENTAÇÃO DO CARROSSEL
       ========================================================== */
  
    function setTransform(i, withTransition) {
  
      track.style.transition = withTransition ? "" : "none";
  
      currentTranslate = -i * step;
  
      track.style.transform =
        "translate3d(" + currentTranslate + "px, 0, 0)";
  
      /* Força atualização quando não há transição */
      if (!withTransition) {
        track.getBoundingClientRect();
        track.style.transition = "";
      }
    }
  
    /* Move para uma posição em pixels (usado no drag) */
    function setTranslatePx(px, withTransition) {
  
      track.style.transition = withTransition ? "" : "none";
  
      currentTranslate = px;
  
      track.style.transform =
        "translate3d(" + currentTranslate + "px, 0, 0)";
  
      if (!withTransition) {
        track.getBoundingClientRect();
        track.style.transition = "";
      }
    }
  
    /* Lê a posição real do trilho (inclusive no meio de uma animação) */
    function getActualTranslate() {
  
      const t = getComputedStyle(track).transform;
  
      if (!t || t === "none") {
        return 0;
      }
  
      return new DOMMatrixReadOnly(t).m41;
    }
  
  
    /* ==========================================================
       LOOP: VOLTA PARA O CONJUNTO ORIGINAL
  
       Quando o índice entra na área dos clones, salta (sem
       animação) para a posição equivalente nos originais.
       ========================================================== */
  
    function normalizeIndex() {
  
      if (index >= total) {
  
        while (index >= total) {
          index -= total;
        }
  
        setTransform(index, false);
      }
    }
  
    track.addEventListener("transitionend", function (e) {
  
      if (e.target !== track || e.propertyName !== "transform") {
        return;
      }
  
      normalizeIndex();
    });
  
  
    /* ==========================================================
       DOTS / INDICADORES (um por slide original)
       ========================================================== */
  
    function buildDots() {
  
      /* Dots não aparecem no mobile */
      if (!dotsWrap || isMobile()) {
        return;
      }
  
      dotsWrap.innerHTML = "";
  
      dots = [];
  
      for (let i = 0; i < total; i++) {
  
        const dot = document.createElement("div");
  
        dot.className = "gallery-dot";
        dot.setAttribute("role", "button");
        dot.setAttribute("tabindex", "0");
        dot.setAttribute("aria-label", "Ir para posição " + (i + 1));
  
        /* Parte interna que será preenchida */
        const fill = document.createElement("div");
  
        fill.className = "gallery-dot-fill";
  
        dot.appendChild(fill);
  
        dot.addEventListener("click", () => goTo(i));
  
        /* Enter ou Espaço também ativam o dot */
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
  
    /* Reinicia a animação do indicador ativo */
    function restartDotProgress() {
  
      if (isMobile()) {
        return;
      }
  
      if (!dots.length) {
        return;
      }
  
      dots.forEach(function (dot) {
        dot.classList.remove("is-active");
      });
  
      const active = dots[index % total];
  
      if (!active) {
        return;
      }
  
      /* Força reflow para reiniciar a animação CSS */
      void active.offsetWidth;
  
      active.classList.add("is-active");
    }
  
    /* Reinicia o timer do autoplay */
    function restartAutoplay() {
  
      if (!isInView) {
        return;
      }
  
      if (timer) {
        clearTimeout(timer);
      }
  
      restartDotProgress();
  
      timer = setTimeout(() => next(), PROGRESS_MS);
    }
  
  
    /* ==========================================================
       NAVEGAÇÃO
       ========================================================== */
  
    function next() {
  
      /* Só recua para os originais se faltar trilho à frente.
         Parte da posição real, então não há salto visível,
         mesmo com cliques rápidos durante a animação. */
      if (index + 1 > absMaxIndex()) {
        index -= total;
        setTranslatePx(getActualTranslate() + total * step, false);
      }
  
      index += 1;
  
      setTransform(index, true);
  
      restartAutoplay();
    }
  
    function prev() {
  
      /* No primeiro slide, salta para o mesmo slide nos clones
         (sem animação) e depois anima para trás */
      if (index <= 0) {
        index = total;
        setTranslatePx(getActualTranslate() - total * step, false);
      }
  
      index -= 1;
  
      setTransform(index, true);
  
      restartAutoplay();
    }
  
    function goTo(i) {
  
      /* Vai para o mesmo conjunto em que o índice atual está,
         evitando um salto longo ao clicar num dot */
      const base = Math.floor(index / total) * total;
  
      index = Math.min(absMaxIndex(), base + Math.max(0, Math.min(total - 1, i)));
  
      setTransform(index, true);
  
      restartAutoplay();
    }
  
  
    /* ==========================================================
       EVENTOS DAS SETAS
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
  
    /* Permite usar as setas com teclado */
    [btnPrev, btnNext].forEach(function (btn) {
  
      if (!btn) {
        return;
      }
  
      btn.setAttribute("role", "button");
      btn.setAttribute("tabindex", "0");
  
      btn.addEventListener("keydown", function (e) {
  
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
  
    /* Converte a posição atual em um índice de slide */
    function clampIndexFromTranslate(px) {
  
      const raw = Math.round(Math.abs(px) / step);
  
      return Math.max(0, Math.min(absMaxIndex(), raw));
    }
  
    /* Obtém a posição X/Y do mouse ou touch */
    function pointerXY(e) {
  
      if (e.touches && e.touches[0]) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
  
      if (e.changedTouches && e.changedTouches[0]) {
        return {
          x: e.changedTouches[0].clientX,
          y: e.changedTouches[0].clientY
        };
      }
  
      return { x: e.clientX, y: e.clientY };
    }
  
    /* Início do drag/swipe */
    function onDown(e) {
  
      const target = e.target;
  
      /* Não inicia drag ao clicar nas setas ou dots */
      if (
        target &&
        (
          target.closest(".arrow-slider") ||
          target.closest(".arrow-slider-2") ||
          target.closest(".gallery-dot")
        )
      ) {
        return;
      }
  
      isDown = true;
  
      lock = null;
  
      const p = pointerXY(e);
  
      startX = p.x;
      startY = p.y;
  
      /* Pausa o autoplay durante o drag */
      stopAutoplay();
  
      track.classList.add("is-dragging");
  
      /* Congela o trilho na posição real e o leva para o conjunto
         do meio, deixando espaço para arrastar nos dois sentidos.
         Os conjuntos são idênticos, então o salto é invisível. */
      const cycle = total * step;
  
      let pos = -getActualTranslate();
  
      pos = ((pos % cycle) + cycle) % cycle + cycle;
  
      setTranslatePx(-pos, false);
  
      index = clampIndexFromTranslate(currentTranslate);
  
      startTranslate = currentTranslate;
    }
  
    /* Movimento durante o drag/swipe */
    function onMove(e) {
  
      if (!isDown) {
        return;
      }
  
      const p = pointerXY(e);
  
      const dx = p.x - startX;
      const dy = p.y - startY;
  
      /* Descobre se o movimento é horizontal ou vertical */
      if (!lock) {
  
        if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
          lock = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
        } else {
          return;
        }
      }
  
      /* Movimento vertical: deixa o navegador controlar */
      if (lock === "y") {
        return;
      }
  
      /* Impede o scroll horizontal padrão */
      if (e.cancelable) {
        e.preventDefault();
      }
  
      /* Limites do trilho com clones */
      const minPx = -absMaxIndex() * step;
      const maxPx = 0;
  
      const nextPx = Math.max(minPx, Math.min(maxPx, startTranslate + dx));
  
      setTranslatePx(nextPx, false);
    }
  
    /* Final do drag/swipe */
    function onUp() {
  
      if (!isDown) {
        return;
      }
  
      isDown = false;
  
      track.classList.remove("is-dragging");
  
      /* Encaixa no slide mais próximo (também cobre um simples
         clique que congelou uma animação em andamento) */
      index = clampIndexFromTranslate(currentTranslate);
  
      setTransform(index, true);
  
      ensureAutoplay();
    }
  
  
    /* EVENTOS DE TOUCH */
  
    track.addEventListener("touchstart", onDown, { passive: true });
    track.addEventListener("touchmove", onMove, { passive: false });
    track.addEventListener("touchend", onUp, { passive: true });
    track.addEventListener("touchcancel", onUp, { passive: true });
  
  
    /* EVENTOS DE MOUSE */
  
    track.addEventListener("mousedown", function (e) {
      e.preventDefault();
      onDown(e);
    });
  
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  
  
    /* ==========================================================
       INICIALIZAÇÃO DA GALERIA
       ========================================================== */
  
    applyFullBleedAligned();
  
    waitImages().then(function () {
  
      /* Reaplica o alinhamento com imagens e layout já estáveis */
      applyFullBleedAligned();
  
      step = getStep();
  
      recalcLimits();
  
      buildDots();
  
      /* Posiciona no primeiro slide */
      setTransform(index, false);
  
      isReady = true;
  
      /* OBSERVER: o autoplay só roda com a galeria visível */
      if ("IntersectionObserver" in window) {
  
        const io = new IntersectionObserver(
          function (entries) {
  
            const entry = entries[0];
  
            isInView =
              entry &&
              entry.isIntersecting &&
              entry.intersectionRatio >= 0.35;
  
            if (isInView) {
              restartAutoplay();
            } else {
              stopAutoplay();
            }
  
          },
          { threshold: [0, 0.35, 0.6, 1] }
        );
  
        io.observe(section);
  
      } else {
  
        /* Fallback para navegadores sem IntersectionObserver */
        isInView = true;
  
        restartAutoplay();
      }
  
    });
  
  
    /* ==========================================================
       RESPONSIVIDADE / RESIZE
       ========================================================== */
  
    window.addEventListener("resize", function () {
  
      /* Recalcula o alinhamento */
      applyFullBleedAligned();
  
      /* Recalcula o tamanho dos slides */
      const newStep = getStep();
  
      if (Math.abs(newStep - step) > 0.5) {
        step = newStep;
      }
  
      recalcLimits();
  
      /* Recria os indicadores */
      if (dotsWrap) {
        dotsWrap.innerHTML = "";
      }
  
      dots = [];
  
      buildDots();
  
      /* Reposiciona o slide atual */
      normalizeIndex();
  
      setTransform(index, false);
  
      ensureAutoplay();
  
    });
  
  
    /* ==========================================================
       VISIBILIDADE DA ABA
       ========================================================== */
  
    document.addEventListener("visibilitychange", function () {
  
      if (document.hidden) {
        stopAutoplay();
      } else {
        ensureAutoplay();
      }
  
    });
  
  });