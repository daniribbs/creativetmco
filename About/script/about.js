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
     2. GALERIA / CARROSSEL
     ============================================================ */
  
  document.addEventListener("DOMContentLoaded", function () {
  
    /* ----------------------------------------------------------
       ELEMENTOS PRINCIPAIS DA GALERIA
       ---------------------------------------------------------- */
  
    const section = document.querySelector(".gallery-case");
  
    const wrap = document.querySelector(
      ".gallery-case-wrap"
    );
  
    const dotsWrap = document.querySelector(
      ".gallery-case_dots"
    );
  
  
    /* ----------------------------------------------------------
       LOCALIZA AS SETAS
  
       Aceita tanto:
       .arrow-slider
       quanto:
       .arrow-slider-2
       ---------------------------------------------------------- */
  
    const btnPrev = document.querySelector(
      ".arrow-slider.left, .arrow-slider-2.left"
    );
  
    const btnNext = document.querySelector(
      ".arrow-slider.right, .arrow-slider-2.right"
    );
  
  
    /* ----------------------------------------------------------
       Se a estrutura principal não existir, encerra o script
       ---------------------------------------------------------- */
  
    if (!section || !wrap) {
      return;
    }
  
  
    /* ----------------------------------------------------------
       O próprio .gallery-case-wrap funciona como o trilho
       ---------------------------------------------------------- */
  
    const track = wrap;
  
  
    /* ----------------------------------------------------------
       LOCALIZA OS SLIDES
  
       Primeiro procura elementos .gallery-case_card.
  
       Caso não encontre, procura imagens <img> diretamente
       dentro do wrap.
       ---------------------------------------------------------- */
  
    let slides = Array.from(
      track.querySelectorAll(".gallery-case_card")
    );
  
  
    if (slides.length === 0) {
  
      slides = Array.from(
        track.querySelectorAll(":scope > img")
      );
  
    }
  
  
    /* ----------------------------------------------------------
       Se houver menos de 2 slides, não existe carrossel
       ---------------------------------------------------------- */
  
    if (slides.length < 2) {
      return;
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
  
    let maxIndex = 0;
  
    let dots = [];
  
  
    /* ==========================================================
       ESTADO DO DRAG / SWIPE
       ========================================================== */
  
    let isDown = false;
  
    let startX = 0;
  
    let startY = 0;
  
    let startTranslate = 0;
  
    let currentTranslate = 0;
  
    let lock = null;
  
  
    /* ----------------------------------------------------------
       Verifica se está em tablet/mobile
       ---------------------------------------------------------- */
  
    const isMobile = () => {
      return window.matchMedia(
        "(max-width: 991px)"
      ).matches;
    };
  
  
    /* ----------------------------------------------------------
       Controle de visibilidade e inicialização
       ---------------------------------------------------------- */
  
    let isInView = false;
  
    let isReady = false;
  
  
    /* ==========================================================
       AUTOPLAY
       ========================================================== */
  
    /* ----------------------------------------------------------
       Para o autoplay
       ---------------------------------------------------------- */
  
    function stopAutoplay() {
  
      if (timer) {
        clearTimeout(timer);
      }
  
      timer = null;
    }
  
  
    /* ----------------------------------------------------------
       Inicia/reinicia o autoplay somente quando:
  
       - A galeria estiver pronta
       - A galeria estiver visível na tela
       ---------------------------------------------------------- */
  
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
       ========================================================== */
  
    /* ----------------------------------------------------------
       Faz a galeria ocupar a largura da viewport, mantendo
       o alinhamento com o grid original da página.
       ---------------------------------------------------------- */
  
    function applyFullBleedAligned() {
  
      section.style.width = "";
  
      section.style.marginLeft = "";
  
  
      const rect = section.getBoundingClientRect();
  
      const left = Math.max(0, rect.left);
  
      gridWidth = Math.max(0, rect.width);
  
  
      /* Atualiza a variável CSS com a largura do grid */
      document.documentElement.style.setProperty(
        "--grid-width",
        gridWidth + "px"
      );
  
  
      /* Faz a seção ocupar toda a viewport */
      section.style.width = "100vw";
  
      section.style.marginLeft =
        "calc(50% - 50vw)";
  
  
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
  
          return slide.tagName === "IMG"
            ? slide
            : slide.querySelector("img");
  
        })
        .filter(Boolean);
  
  
      return Promise.all(
  
        imgs.map(function (img) {
  
          /* Imagem já carregada */
          if (img.complete) {
            return Promise.resolve();
          }
  
  
          /* Aguarda carregamento */
          return new Promise(function (resolve) {
  
            img.addEventListener(
              "load",
              resolve,
              { once: true }
            );
  
            img.addEventListener(
              "error",
              resolve,
              { once: true }
            );
  
          });
  
        })
  
      );
    }
  
  
    /* ==========================================================
       CALCULA O TAMANHO DE CADA PASSO
       ========================================================== */
  
    function getStep() {
  
      const any = slides[0];
  
      const w =
        any.getBoundingClientRect().width || 625;
  
      const mr =
        parseFloat(
          getComputedStyle(any).marginRight
        ) || 0;
  
  
      /* Largura do slide + espaçamento */
      return w + mr;
    }
  
  
    /* ==========================================================
       CALCULA QUANTOS SLIDES CABEM NA TELA
       ========================================================== */
  
    function recalcLimits() {
  
      const any = slides[0];
  
      const mr =
        parseFloat(
          getComputedStyle(any).marginRight
        ) || 0;
  
  
      const k = Math.floor(
        (gridWidth + mr) / step
      );
  
  
      slidesPerView = Math.max(
        1,
        Math.min(
          slides.length,
          k || 1
        )
      );
  
  
      /* Define o último índice possível */
      maxIndex = Math.max(
        0,
        slides.length - slidesPerView
      );
  
  
      /* Garante que o índice atual não ultrapasse o limite */
      if (index > maxIndex) {
        index = maxIndex;
      }
    }
  
  
    /* ==========================================================
       MOVIMENTAÇÃO DO CARROSSEL
       ========================================================== */
  
    /* ----------------------------------------------------------
       Move para determinado slide usando índice
       ---------------------------------------------------------- */
  
    function setTransform(i, withTransition) {
  
      track.style.transition =
        withTransition ? "" : "none";
  
  
      currentTranslate = -i * step;
  
  
      track.style.transform =
        "translate3d(" +
        currentTranslate +
        "px, 0, 0)";
  
  
      /* Força atualização quando não há transição */
      if (!withTransition) {
  
        track.getBoundingClientRect();
  
        track.style.transition = "";
  
      }
    }
  
  
    /* ----------------------------------------------------------
       Move o carrossel para uma posição específica em pixels
  
       Usado principalmente durante o drag/swipe.
       ---------------------------------------------------------- */
  
    function setTranslatePx(px, withTransition) {
  
      track.style.transition =
        withTransition ? "" : "none";
  
  
      currentTranslate = px;
  
  
      track.style.transform =
        "translate3d(" +
        currentTranslate +
        "px, 0, 0)";
  
  
      if (!withTransition) {
  
        track.getBoundingClientRect();
  
        track.style.transition = "";
  
      }
    }
  
  
    /* ==========================================================
       DOTS / INDICADORES
       ========================================================== */
  
    function buildDots() {
  
      /* Dots não aparecem no mobile */
      if (!dotsWrap || isMobile()) {
        return;
      }
  
  
      dotsWrap.innerHTML = "";
  
      dots = [];
  
  
      /* Quantidade de posições possíveis */
      const totalPositions =
        maxIndex + 1;
  
  
      for (
        let i = 0;
        i < totalPositions;
        i++
      ) {
  
        const dot =
          document.createElement("div");
  
  
        dot.className = "gallery-dot";
  
        dot.setAttribute(
          "role",
          "button"
        );
  
        dot.setAttribute(
          "tabindex",
          "0"
        );
  
        dot.setAttribute(
          "aria-label",
          "Ir para posição " + (i + 1)
        );
  
  
        /* Parte interna que será preenchida */
        const fill =
          document.createElement("div");
  
  
        fill.className =
          "gallery-dot-fill";
  
  
        dot.appendChild(fill);
  
  
        /* Clique no indicador */
        dot.addEventListener(
          "click",
          () => goTo(i)
        );
  
  
        /* Acessibilidade:
           Enter ou Espaço também ativam o dot */
        dot.addEventListener(
          "keydown",
          (e) => {
  
            if (
              e.key === "Enter" ||
              e.key === " "
            ) {
  
              e.preventDefault();
  
              goTo(i);
  
            }
  
          }
        );
  
  
        dotsWrap.appendChild(dot);
  
        dots.push(dot);
      }
    }
  
  
    /* ----------------------------------------------------------
       Reinicia a animação do indicador ativo
       ---------------------------------------------------------- */
  
    function restartDotProgress() {
  
      if (isMobile()) {
        return;
      }
  
      if (!dots.length) {
        return;
      }
  
  
      /* Remove o estado ativo de todos */
      dots.forEach(function (dot) {
  
        dot.classList.remove(
          "is-active"
        );
  
      });
  
  
      const active = dots[index];
  
  
      if (!active) {
        return;
      }
  
  
      /* Remove e adiciona novamente para reiniciar
         a animação CSS */
      active.classList.remove(
        "is-active"
      );
  
  
      void active.offsetWidth;
  
  
      active.classList.add(
        "is-active"
      );
    }
  
  
    /* ----------------------------------------------------------
       Reinicia o timer do autoplay
       ---------------------------------------------------------- */
  
    function restartAutoplay() {
  
      if (!isInView) {
        return;
      }
  
  
      if (timer) {
        clearTimeout(timer);
      }
  
  
      restartDotProgress();
  
  
      timer = setTimeout(
        () => next(),
        PROGRESS_MS
      );
    }
  
  
    /* ==========================================================
       PRÓXIMO SLIDE
       ========================================================== */
  
    function next() {
  
      /* Se chegou ao final,
         volta para o primeiro slide */
      if (index >= maxIndex) {
  
        index = 0;
  
        setTransform(
          index,
          false
        );
  
        restartAutoplay();
  
        return;
      }
  
  
      index += 1;
  
  
      setTransform(
        index,
        true
      );
  
  
      restartAutoplay();
    }
  
  
    /* ==========================================================
       SLIDE ANTERIOR
       ========================================================== */
  
    function prev() {
  
      /* Se está no primeiro,
         vai para o último */
      if (index <= 0) {
  
        index = maxIndex;
  
        setTransform(
          index,
          false
        );
  
        restartAutoplay();
  
        return;
      }
  
  
      index -= 1;
  
  
      setTransform(
        index,
        true
      );
  
  
      restartAutoplay();
    }
  
  
    /* ==========================================================
       IR PARA UM SLIDE ESPECÍFICO
       ========================================================== */
  
    function goTo(i) {
  
      index = Math.max(
        0,
        Math.min(
          maxIndex,
          i
        )
      );
  
  
      setTransform(
        index,
        true
      );
  
  
      restartAutoplay();
    }
  
  
    /* ==========================================================
       EVENTOS DAS SETAS
       ========================================================== */
  
    if (btnNext) {
  
      btnNext.addEventListener(
        "click",
        () => {
  
          isInView = true;
  
          next();
  
        }
      );
  
    }
  
  
    if (btnPrev) {
  
      btnPrev.addEventListener(
        "click",
        () => {
  
          isInView = true;
  
          prev();
  
        }
      );
  
    }
  
  
    /* ----------------------------------------------------------
       Permite usar as setas com teclado
       ---------------------------------------------------------- */
  
    [btnPrev, btnNext].forEach(function (btn) {
  
      if (!btn) {
        return;
      }
  
  
      btn.setAttribute(
        "role",
        "button"
      );
  
      btn.setAttribute(
        "tabindex",
        "0"
      );
  
  
      btn.addEventListener(
        "keydown",
        function (e) {
  
          if (
            e.key === "Enter" ||
            e.key === " "
          ) {
  
            e.preventDefault();
  
            isInView = true;
  
  
            btn === btnNext
              ? next()
              : prev();
  
          }
  
        }
      );
  
    });
  
  
    /* ==========================================================
       DRAG / SWIPE
       ========================================================== */
  
    /* ----------------------------------------------------------
       Converte a posição atual em um índice de slide
       ---------------------------------------------------------- */
  
    function clampIndexFromTranslate(px) {
  
      const raw =
        Math.round(
          Math.abs(px) / step
        );
  
  
      return Math.max(
        0,
        Math.min(
          maxIndex,
          raw
        )
      );
    }
  
  
    /* ----------------------------------------------------------
       Obtém a posição X/Y do mouse ou touch
       ---------------------------------------------------------- */
  
    function pointerXY(e) {
  
      if (
        e.touches &&
        e.touches[0]
      ) {
  
        return {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        };
  
      }
  
  
      if (
        e.changedTouches &&
        e.changedTouches[0]
      ) {
  
        return {
          x: e.changedTouches[0].clientX,
          y: e.changedTouches[0].clientY
        };
  
      }
  
  
      return {
        x: e.clientX,
        y: e.clientY
      };
    }
  
  
    /* ----------------------------------------------------------
       Início do drag/swipe
       ---------------------------------------------------------- */
  
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
  
      startTranslate =
        currentTranslate;
  
  
      /* Pausa o autoplay durante o drag */
      stopAutoplay();
  
  
      track.classList.add(
        "is-dragging"
      );
  
  
      track.style.transition = "none";
    }
  
  
    /* ----------------------------------------------------------
       Movimento durante o drag/swipe
       ---------------------------------------------------------- */
  
    function onMove(e) {
  
      if (!isDown) {
        return;
      }
  
  
      const p = pointerXY(e);
  
  
      const dx =
        p.x - startX;
  
      const dy =
        p.y - startY;
  
  
      /* Descobre se o movimento é horizontal ou vertical */
      if (!lock) {
  
        if (
          Math.abs(dx) > 6 ||
          Math.abs(dy) > 6
        ) {
  
          lock =
            Math.abs(dx) >
            Math.abs(dy)
              ? "x"
              : "y";
  
        } else {
  
          return;
  
        }
      }
  
  
      /* Se for movimento vertical,
         deixa o navegador controlar */
      if (lock === "y") {
        return;
      }
  
  
      /* Impede o scroll horizontal padrão */
      if (e.cancelable) {
        e.preventDefault();
      }
  
  
      /* Limites do carrossel */
      const minPx =
        -maxIndex * step;
  
      const maxPx = 0;
  
  
      /* Calcula a nova posição */
      const nextPx = Math.max(
        minPx,
        Math.min(
          maxPx,
          startTranslate + dx
        )
      );
  
  
      setTranslatePx(
        nextPx,
        false
      );
    }
  
  
    /* ----------------------------------------------------------
       Final do drag/swipe
       ---------------------------------------------------------- */
  
    function onUp() {
  
      if (!isDown) {
        return;
      }
  
  
      isDown = false;
  
  
      track.classList.remove(
        "is-dragging"
      );
  
  
      /* Se não houve movimento horizontal,
         apenas retoma o autoplay */
      if (lock !== "x") {
  
        ensureAutoplay();
  
        return;
  
      }
  
  
      /* Descobre qual slide ficou mais próximo */
      index =
        clampIndexFromTranslate(
          currentTranslate
        );
  
  
      /* Faz o encaixe final */
      setTransform(
        index,
        true
      );
  
  
      ensureAutoplay();
    }
  
  
    /* ==========================================================
       EVENTOS DE TOUCH
       ========================================================== */
  
    track.addEventListener(
      "touchstart",
      onDown,
      { passive: true }
    );
  
  
    track.addEventListener(
      "touchmove",
      onMove,
      { passive: false }
    );
  
  
    track.addEventListener(
      "touchend",
      onUp,
      { passive: true }
    );
  
  
    track.addEventListener(
      "touchcancel",
      onUp,
      { passive: true }
    );
  
  
    /* ==========================================================
       EVENTOS DE MOUSE
       ========================================================== */
  
    track.addEventListener(
      "mousedown",
      function (e) {
  
        e.preventDefault();
  
        onDown(e);
  
      }
    );
  
  
    window.addEventListener(
      "mousemove",
      onMove
    );
  
  
    window.addEventListener(
      "mouseup",
      onUp
    );
  
  
    /* ==========================================================
       INICIALIZAÇÃO DA GALERIA
       ========================================================== */
  
    applyFullBleedAligned();
  
  
    /* ----------------------------------------------------------
       Aguarda as imagens antes de calcular os tamanhos
       ---------------------------------------------------------- */
  
    waitImages().then(function () {
  
      step = getStep();
  
      recalcLimits();
  
  
      /* Cria os indicadores */
      buildDots();
  
  
      /* Posiciona no primeiro slide */
      setTransform(
        index,
        false
      );
  
  
      isReady = true;
  
  
      /* ========================================================
         OBSERVER
  
         O autoplay só funciona quando a galeria está
         suficientemente visível na tela.
         ======================================================== */
  
      if (
        "IntersectionObserver" in window
      ) {
  
        const io =
          new IntersectionObserver(
  
            function (entries) {
  
              const entry =
                entries[0];
  
  
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
  
            {
              threshold: [
                0,
                0.35,
                0.6,
                1
              ]
            }
  
          );
  
  
        io.observe(section);
  
      } else {
  
        /* Fallback para navegadores sem
           IntersectionObserver */
        isInView = true;
  
        restartAutoplay();
  
      }
  
    });
  
  
    /* ==========================================================
       RESPONSIVIDADE / RESIZE
       ========================================================== */
  
    window.addEventListener(
      "resize",
      function () {
  
        /* Recalcula o alinhamento */
        applyFullBleedAligned();
  
  
        /* Recalcula o tamanho dos slides */
        const newStep =
          getStep();
  
  
        if (
          Math.abs(
            newStep - step
          ) > 0.5
        ) {
  
          step = newStep;
  
        }
  
  
        /* Recalcula os limites */
        recalcLimits();
  
  
        /* Recria os indicadores */
        if (dotsWrap) {
  
          dotsWrap.innerHTML = "";
  
        }
  
  
        dots = [];
  
  
        buildDots();
  
  
        /* Reposiciona o slide atual */
        setTransform(
          index,
          false
        );
  
  
        ensureAutoplay();
  
      }
    );
  
  
    /* ==========================================================
       VISIBILIDADE DA ABA
       ========================================================== */
  
    /* ----------------------------------------------------------
       Quando o usuário troca de aba:
  
       - pausa o autoplay
  
       Quando volta:
  
       - retoma o autoplay
       ---------------------------------------------------------- */
  
    document.addEventListener(
      "visibilitychange",
      function () {
  
        if (document.hidden) {
  
          stopAutoplay();
  
        } else {
  
          ensureAutoplay();
  
        }
  
      }
    );
  
  });