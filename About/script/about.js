/* ============================================================
   1. ACCORDION — PROCESSO (COM IMAGEM POR ITEM)
   ============================================================ */

   (function () {
    var ITEM_SELECTOR = ".accordion-item-processo";
    var IMAGE_SELECTOR = ".processo-image";
    var OPEN_CLASS = "is-open";
    var ACTIVE_CLASS = "is-active";
  
    function getItems() {
      return Array.prototype.slice.call(document.querySelectorAll(ITEM_SELECTOR));
    }
  
    function getImages() {
      return Array.prototype.slice.call(document.querySelectorAll(IMAGE_SELECTOR));
    }
  
    function showImage(i) {
      var images = getImages();
      if (!images[i]) return;
  
      images.forEach(function (img, n) {
        img.classList.toggle(ACTIVE_CLASS, n === i);
      });
    }
  
    function initAccordion() {
      getItems().forEach(function (item) {
        item.classList.remove(OPEN_CLASS);
      });
      showImage(0);
    }
  
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initAccordion);
    } else {
      initAccordion();
    }
  
    document.addEventListener("click", function (event) {
      if (event.target.closest("a, button")) return;
  
      var item = event.target.closest(ITEM_SELECTOR);
      if (!item) return;
  
      var items = getItems();
      var willOpen = !item.classList.contains(OPEN_CLASS);
  
      items.forEach(function (other) {
        if (other !== item) other.classList.remove(OPEN_CLASS);
      });
  
      item.classList.toggle(OPEN_CLASS, willOpen);
  
      if (willOpen) showImage(items.indexOf(item));
    });
  })();
  
  
  /* ============================================================
     2. GALERIA / CARROSSEL INFINITO
     (o fade da borda direita é feito 100% em CSS)
     ============================================================ */
  
  document.addEventListener("DOMContentLoaded", function () {
    const section = document.querySelector(".gallery-case");
    const wrap = document.querySelector(".gallery-case-wrap");
    const dotsWrap = document.querySelector(".gallery-case_dots");
  
    const btnPrev = document.querySelector(".arrow-slider.left, .arrow-slider-2.left");
    const btnNext = document.querySelector(".arrow-slider.right, .arrow-slider-2.right");
  
    if (!section || !wrap) return;
  
    const track = wrap;
  
    // Imagens originais
    let slides = Array.from(track.querySelectorAll(":scope > img"));
    if (slides.length < 2) return;
  
    const total = slides.length;
    const SETS = 3;
  
    // Clones para o loop infinito
    for (let c = 1; c < SETS; c++) {
      slides.forEach(function (slide) {
        const clone = slide.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        clone.dataset.clone = "true";
        track.appendChild(clone);
      });
    }
  
    const PROGRESS_MS = 6500;
    let index = 0;
    let step = 0;
    let timer = null;
    let gridWidth = 0;
    let slidesPerView = 2;
    let dots = [];
  
    let isDown = false;
    let startX = 0;
    let startY = 0;
    let startTranslate = 0;
    let currentTranslate = 0;
    let lock = null;
  
    let isInView = false;
    let isReady = false;
  
    const isMobile = function () {
      return window.matchMedia("(max-width: 991px)").matches;
    };
  
    function absMaxIndex() {
      return total * SETS - slidesPerView;
    }
  
    function stopAutoplay() {
      if (timer) clearTimeout(timer);
      timer = null;
    }
  
    function ensureAutoplay() {
      if (!isReady || !isInView) return;
      restartAutoplay();
    }
  
    function applyFullBleedAligned() {
      section.style.width = "";
      section.style.position = "";
      section.style.left = "";
      section.style.marginLeft = "";
      wrap.style.paddingLeft = "";
  
      const rect = section.getBoundingClientRect();
      const left = Math.max(0, rect.left);
  
      gridWidth = Math.max(0, rect.width);
      document.documentElement.style.setProperty("--grid-width", gridWidth + "px");
  
      section.style.position = "relative";
      section.style.left = -rect.left + "px";
      section.style.width = document.documentElement.clientWidth + "px";
  
      wrap.style.paddingLeft = left + "px";
      wrap.style.paddingRight = "0px";
    }
  
    function waitImages() {
      return Promise.all(
        slides.map(function (img) {
          if (img.complete) return Promise.resolve();
  
          return new Promise(function (resolve) {
            img.addEventListener("load", resolve, { once: true });
            img.addEventListener("error", resolve, { once: true });
          });
        })
      );
    }
  
    function getStep() {
      const any = slides[0];
      if (!any) return 625;
  
      const rect = any.getBoundingClientRect();
      const width = rect.width || any.offsetWidth || 625;
      const marginRight = parseFloat(getComputedStyle(any).marginRight) || 32;
  
      return Math.max(1, width + marginRight);
    }
  
    function recalcLimits() {
      const any = slides[0];
      const marginRight = parseFloat(getComputedStyle(any).marginRight) || 0;
      const count = Math.floor((gridWidth + marginRight) / step);
  
      slidesPerView = Math.max(1, Math.min(total, count || 1));
    }
  
    function setTransform(i, withTransition) {
      track.style.transition = withTransition ? "" : "none";
      currentTranslate = -i * step;
      track.style.transform = "translate3d(" + currentTranslate + "px, 0, 0)";
  
      if (!withTransition) {
        track.getBoundingClientRect();
        track.style.transition = "";
      }
    }
  
    function setTranslatePx(px, withTransition) {
      track.style.transition = withTransition ? "" : "none";
      currentTranslate = px;
      track.style.transform = "translate3d(" + currentTranslate + "px, 0, 0)";
  
      if (!withTransition) {
        track.getBoundingClientRect();
        track.style.transition = "";
      }
    }
  
    function getActualTranslate() {
      const transform = getComputedStyle(track).transform;
      if (!transform || transform === "none") return 0;
      return new DOMMatrixReadOnly(transform).m41;
    }
  
    function normalizeIndex() {
      if (index >= total) {
        while (index >= total) index -= total;
        setTransform(index, false);
      }
    }
  
    track.addEventListener("transitionend", function (event) {
      if (event.target !== track || event.propertyName !== "transform") return;
      normalizeIndex();
    });
  
    function buildDots() {
      if (!dotsWrap || isMobile()) return;
  
      dotsWrap.innerHTML = "";
      dots = [];
  
      for (let i = 0; i < total; i++) {
        const dot = document.createElement("div");
        dot.className = "gallery-dot";
        dot.setAttribute("role", "button");
        dot.setAttribute("tabindex", "0");
        dot.setAttribute("aria-label", "Ir para posição " + (i + 1));
  
        const fill = document.createElement("div");
        fill.className = "gallery-dot-fill";
        dot.appendChild(fill);
  
        dot.addEventListener("click", function () {
          goTo(i);
        });
  
        dot.addEventListener("keydown", function (event) {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            goTo(i);
          }
        });
  
        dotsWrap.appendChild(dot);
        dots.push(dot);
      }
    }
  
    function restartDotProgress() {
      if (isMobile() || !dots.length) return;
  
      dots.forEach(function (dot) {
        dot.classList.remove("is-active");
      });
  
      const active = dots[index % total];
      if (!active) return;
  
      void active.offsetWidth;
      active.classList.add("is-active");
    }
  
    function restartAutoplay() {
      if (!isInView) return;
      if (timer) clearTimeout(timer);
  
      restartDotProgress();
      timer = setTimeout(function () {
        next();
      }, PROGRESS_MS);
    }
  
    function next() {
      if (index + 1 > absMaxIndex()) {
        index -= total;
        setTranslatePx(getActualTranslate() + total * step, false);
      }
  
      index += 1;
      setTransform(index, true);
      restartAutoplay();
    }
  
    function prev() {
      if (index <= 0) {
        index = total;
        setTranslatePx(getActualTranslate() - total * step, false);
      }
  
      index -= 1;
      setTransform(index, true);
      restartAutoplay();
    }
  
    function goTo(i) {
      const base = Math.floor(index / total) * total;
  
      index = Math.min(
        absMaxIndex(),
        base + Math.max(0, Math.min(total - 1, i))
      );
  
      setTransform(index, true);
      restartAutoplay();
    }
  
    if (btnNext) {
      btnNext.addEventListener("click", function () {
        isInView = true;
        next();
      });
    }
  
    if (btnPrev) {
      btnPrev.addEventListener("click", function () {
        isInView = true;
        prev();
      });
    }
  
    [btnPrev, btnNext].forEach(function (btn) {
      if (!btn) return;
  
      btn.setAttribute("role", "button");
      btn.setAttribute("tabindex", "0");
  
      btn.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          isInView = true;
          if (btn === btnNext) next();
          else prev();
        }
      });
    });
  
    function clampIndexFromTranslate(px) {
      const raw = Math.round(Math.abs(px) / step);
      return Math.max(0, Math.min(absMaxIndex(), raw));
    }
  
    function pointerXY(event) {
      if (event.touches && event.touches[0]) {
        return { x: event.touches[0].clientX, y: event.touches[0].clientY };
      }
  
      if (event.changedTouches && event.changedTouches[0]) {
        return { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY };
      }
  
      return { x: event.clientX, y: event.clientY };
    }
  
    function onDown(event) {
      const target = event.target;
  
      if (
        target &&
        (target.closest(".arrow-slider") ||
          target.closest(".arrow-slider-2") ||
          target.closest(".gallery-dot"))
      ) {
        return;
      }
  
      isDown = true;
      lock = null;
  
      const point = pointerXY(event);
      startX = point.x;
      startY = point.y;
  
      stopAutoplay();
      track.classList.add("is-dragging");
  
      const cycle = total * step;
      let position = -getActualTranslate();
      position = ((position % cycle) + cycle) % cycle + cycle;
  
      setTranslatePx(-position, false);
      index = clampIndexFromTranslate(currentTranslate);
      startTranslate = currentTranslate;
    }
  
    function onMove(event) {
      if (!isDown) return;
  
      const point = pointerXY(event);
      const dx = point.x - startX;
      const dy = point.y - startY;
  
      if (!lock) {
        if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
          lock = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
        } else {
          return;
        }
      }
  
      if (lock === "y") return;
      if (event.cancelable) event.preventDefault();
  
      const minPx = -absMaxIndex() * step;
      const maxPx = 0;
      const nextPx = Math.max(minPx, Math.min(maxPx, startTranslate + dx));
  
      setTranslatePx(nextPx, false);
    }
  
    function onUp() {
      if (!isDown) return;
  
      isDown = false;
      track.classList.remove("is-dragging");
      index = clampIndexFromTranslate(currentTranslate);
      setTransform(index, true);
      ensureAutoplay();
    }
  
    track.addEventListener("touchstart", onDown, { passive: true });
    track.addEventListener("touchmove", onMove, { passive: false });
    track.addEventListener("touchend", onUp, { passive: true });
    track.addEventListener("touchcancel", onUp, { passive: true });
  
    track.addEventListener("mousedown", function (event) {
      event.preventDefault();
      onDown(event);
    });
  
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  
    applyFullBleedAligned();
  
    waitImages().then(function () {
      applyFullBleedAligned();
  
      step = getStep();
      recalcLimits();
  
      buildDots();
      setTransform(index, false);
      isReady = true;
  
      if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(
          function (entries) {
            const entry = entries[0];
  
            isInView =
              entry &&
              entry.isIntersecting &&
              entry.intersectionRatio >= 0.35;
  
            if (isInView) restartAutoplay();
            else stopAutoplay();
          },
          { threshold: [0, 0.35, 0.6, 1] }
        );
  
        observer.observe(section);
      } else {
        isInView = true;
        restartAutoplay();
      }
    });
  
    window.addEventListener("resize", function () {
      applyFullBleedAligned();
  
      const newStep = getStep();
      if (Math.abs(newStep - step) > 0.5) step = newStep;
  
      recalcLimits();
  
      if (dotsWrap) dotsWrap.innerHTML = "";
      dots = [];
      buildDots();
      normalizeIndex();
      setTransform(index, false);
      ensureAutoplay();
    });
  
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stopAutoplay();
      else ensureAutoplay();
    });
  });