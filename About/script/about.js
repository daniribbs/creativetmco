/* ============================================================
   1. ACCORDION — PROCESSO
   ============================================================ */
   (function () {
    const ITEM_SELECTOR = ".accordion-item-processo";
    const IMAGE_SELECTOR = ".processo-image";
  
    function initAccordion() {
      const items = Array.from(document.querySelectorAll(ITEM_SELECTOR));
      const images = Array.from(document.querySelectorAll(IMAGE_SELECTOR));
  
      items.forEach(item => item.classList.remove("is-open"));
      images.forEach((img, index) => img.classList.toggle("is-active", index === 0));
  
      document.addEventListener("click", event => {
        if (event.target.closest("a, button")) return;
  
        const item = event.target.closest(ITEM_SELECTOR);
        if (!item) return;
  
        const index = items.indexOf(item);
        const willOpen = !item.classList.contains("is-open");
  
        items.forEach(other => other.classList.toggle("is-open", other === item && willOpen));
        if (willOpen && images[index]) {
          images.forEach((img, i) => img.classList.toggle("is-active", i === index));
        }
      });
    }
  
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initAccordion, { once: true });
    } else {
      initAccordion();
    }
  })();
  
  /* ============================================================
     2. GALERIA / CARROSSEL INFINITO
     Classes esperadas:
     viewport: .gallery-case
     trilho:   .gallery-case-wrap
     slides:   .gallery-case_card (ou imagens diretas)
     dots:     .gallery-case_dots
     setas:    .arrow-slider.left / .arrow-slider.right
               ou .arrow-slider-2.left / .arrow-slider-2.right
     ============================================================ */
  (function () {
    function initGallery() {
      const section = document.querySelector(".gallery-case");
      const track = document.querySelector(".gallery-case-wrap");
      const dotsWrap = document.querySelector(".gallery-case_dots");
      const prevButton = document.querySelector(".arrow-slider.left, .arrow-slider-2.left");
      const nextButton = document.querySelector(".arrow-slider.right, .arrow-slider-2.right");
  
      if (!section || !track) return;
      if (track.dataset.galleryInitialized === "true") return;
      track.dataset.galleryInitialized = "true";
  
      const originals = Array.from(track.querySelectorAll(":scope > .gallery-case_card, :scope > img"));
      if (originals.length < 2) return;
  
      const total = originals.length;
      const autoplayDelay = 6500;
      let index = 0;
      let step = 0;
      let timer = null;
      let isInView = true;
      let isDragging = false;
      let startX = 0;
      let startY = 0;
      let startTranslate = 0;
      let currentTranslate = 0;
      let dragAxis = null;
      let dots = [];
      let resizeTimer = null;
  
      // Clones dos dois lados: permite navegar sem chegar a uma extremidade visível.
      const beforeClones = originals.map(slide => {
        const clone = slide.cloneNode(true);
        clone.dataset.galleryClone = "true";
        clone.setAttribute("aria-hidden", "true");
        return clone;
      });
      const afterClones = originals.map(slide => {
        const clone = slide.cloneNode(true);
        clone.dataset.galleryClone = "true";
        clone.setAttribute("aria-hidden", "true");
        return clone;
      });
  
      beforeClones.reverse().forEach(clone => track.insertBefore(clone, track.firstChild));
      afterClones.forEach(clone => track.appendChild(clone));
  
      function allSlides() {
        return Array.from(track.querySelectorAll(":scope > .gallery-case_card, :scope > img"));
      }
  
      function getStep() {
        const first = allSlides()[0];
        if (!first) return 1;
        const style = getComputedStyle(first);
        return first.getBoundingClientRect().width + (parseFloat(style.marginRight) || 0);
      }
  
      // Faz o viewport chegar às duas bordas da tela, preservando o alinhamento inicial.
      function applyFullBleed() {
        // Limpa os ajustes anteriores antes de medir a posição original do grid.
        section.style.left = "";
        section.style.width = "";
        track.style.paddingLeft = "";
        track.style.paddingRight = "";
  
        const rect = section.getBoundingClientRect();
        const originalLeft = Math.max(0, rect.left);
        const viewportWidth = document.documentElement.clientWidth;
  
        // O viewport ocupa a tela inteira; o primeiro slide continua alinhado ao grid.
        section.style.width = viewportWidth + "px";
        section.style.maxWidth = "none";
        section.style.position = "relative";
        section.style.left = (-rect.left) + "px";
        section.style.marginRight = "0";
        track.style.paddingLeft = originalLeft + "px";
        track.style.paddingRight = "0px";
      }
  
      function setTranslate(px, animate = true) {
        track.style.transition = animate ? "" : "none";
        currentTranslate = px;
        track.style.transform = `translate3d(${px}px, 0, 0)`;
        if (!animate) {
          track.getBoundingClientRect();
          track.style.transition = "";
        }
      }
  
      function positionForIndex(i) {
        // index 0 representa o primeiro slide original; há um conjunto clonado antes dele.
        return -(total + i) * step;
      }
  
      function normalize() {
        if (index >= total) {
          index = index % total;
          setTranslate(positionForIndex(index), false);
        } else if (index < 0) {
          index = (index % total + total) % total;
          setTranslate(positionForIndex(index), false);
        }
        updateDots(false);
      }
  
      function updateDots(animate = true) {
        if (!dots.length) return;
        dots.forEach((dot, i) => {
          dot.classList.toggle("is-active", i === ((index % total) + total) % total);
          const fill = dot.querySelector(".gallery-dot-fill");
          if (fill && animate && i === ((index % total) + total) % total) {
            fill.style.animation = "none";
            void fill.offsetWidth;
            fill.style.animation = "";
          }
        });
      }
  
      function stopAutoplay() {
        if (timer) clearTimeout(timer);
        timer = null;
      }
  
      function startAutoplay() {
        stopAutoplay();
        if (!isInView || document.hidden || isDragging) return;
        updateDots(true);
        timer = setTimeout(() => move(1), autoplayDelay);
      }
  
      function move(direction) {
        index += direction;
        setTranslate(positionForIndex(index), true);
        startAutoplay();
      }
  
      function goTo(i) {
        index = i;
        setTranslate(positionForIndex(index), true);
        startAutoplay();
      }
  
      function buildDots() {
        if (!dotsWrap) return;
        dotsWrap.innerHTML = "";
        dots = [];
  
        for (let i = 0; i < total; i++) {
          const dot = document.createElement("button");
          dot.type = "button";
          dot.className = "gallery-dot";
          dot.setAttribute("aria-label", `Ir para imagem ${i + 1}`);
          dot.setAttribute("aria-current", i === 0 ? "true" : "false");
  
          const fill = document.createElement("span");
          fill.className = "gallery-dot-fill";
          dot.appendChild(fill);
  
          dot.addEventListener("click", () => goTo(i));
          dotsWrap.appendChild(dot);
          dots.push(dot);
        }
        updateDots(false);
      }
  
      if (prevButton) {
        prevButton.setAttribute("role", "button");
        prevButton.setAttribute("tabindex", "0");
        prevButton.addEventListener("click", () => move(-1));
        prevButton.addEventListener("keydown", e => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            move(-1);
          }
        });
      }
  
      if (nextButton) {
        nextButton.setAttribute("role", "button");
        nextButton.setAttribute("tabindex", "0");
        nextButton.addEventListener("click", () => move(1));
        nextButton.addEventListener("keydown", e => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            move(1);
          }
        });
      }
  
      track.addEventListener("transitionend", event => {
        if (event.target !== track || event.propertyName !== "transform") return;
        normalize();
      });
  
      function pointer(event) {
        if (event.touches && event.touches[0]) {
          return { x: event.touches[0].clientX, y: event.touches[0].clientY };
        }
        if (event.changedTouches && event.changedTouches[0]) {
          return { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY };
        }
        return { x: event.clientX, y: event.clientY };
      }
  
      function onDown(event) {
        if (event.target.closest(".gallery-dot, .arrow-slider, .arrow-slider-2")) return;
        isDragging = true;
        dragAxis = null;
        stopAutoplay();
        const p = pointer(event);
        startX = p.x;
        startY = p.y;
        const matrix = new DOMMatrixReadOnly(getComputedStyle(track).transform);
        startTranslate = matrix.m41;
        currentTranslate = startTranslate;
        track.classList.add("is-dragging");
      }
  
      function onMove(event) {
        if (!isDragging) return;
        const p = pointer(event);
        const dx = p.x - startX;
        const dy = p.y - startY;
  
        if (!dragAxis && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
          dragAxis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
        }
        if (dragAxis !== "x") return;
        if (event.cancelable) event.preventDefault();
        setTranslate(startTranslate + dx, false);
      }
  
      function onUp() {
        if (!isDragging) return;
        isDragging = false;
        track.classList.remove("is-dragging");
  
        const moved = currentTranslate - startTranslate;
        if (Math.abs(moved) > Math.min(50, step * 0.15)) {
          index += moved < 0 ? 1 : -1;
        }
        setTranslate(positionForIndex(index), true);
        startAutoplay();
      }
  
      track.addEventListener("mousedown", onDown);
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
      track.addEventListener("touchstart", onDown, { passive: true });
      track.addEventListener("touchmove", onMove, { passive: false });
      track.addEventListener("touchend", onUp, { passive: true });
      track.addEventListener("touchcancel", onUp, { passive: true });
  
      // Pausa o autoplay fora da área visível.
      if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(entries => {
          isInView = !!entries[0] && entries[0].isIntersecting;
          if (isInView) startAutoplay();
          else stopAutoplay();
        }, { threshold: 0.1 });
        observer.observe(section);
      }
  
      function refresh() {
        applyFullBleed();
        step = getStep();
        setTranslate(positionForIndex(index), false);
        updateDots(false);
      }
  
      // Aguarda imagens para medir corretamente as larguras.
      const images = originals.flatMap(slide => {
        if (slide.tagName === "IMG") return [slide];
        return Array.from(slide.querySelectorAll("img"));
      });
  
      Promise.all(images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.addEventListener("load", resolve, { once: true });
          img.addEventListener("error", resolve, { once: true });
        });
      })).then(() => {
        applyFullBleed();
        step = getStep();
        buildDots();
        setTranslate(positionForIndex(0), false);
        startAutoplay();
      });
  
      window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(refresh, 120);
      });
  
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) stopAutoplay();
        else startAutoplay();
      });
    }
  
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initGallery, { once: true });
    } else {
      initGallery();
    }
  })();