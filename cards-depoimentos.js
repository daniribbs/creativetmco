  /* ============================================================
   SLIDER DE DEPOIMENTOS (1 card por vez, infinito)
   ============================================================ */
(function () {
  function mod(n, m) {
    return ((n % m) + m) % m;
  }

  function cssMs(name, fallback) {
    var v = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue(name)
    );
    return isNaN(v) ? fallback : v;
  }

  function initSlider(track) {
    /* A lista (track) e o wrapper (viewport) vêm da própria estrutura do Webflow */
    var viewport = track.parentElement;
    if (!viewport) return;

    /* Sobe na árvore até achar o bloco que contém o gallery-case_ui */
    var root = viewport.parentElement;
    while (root && !root.querySelector(".gallery-case_ui")) {
      root = root.parentElement;
    }
    if (!root) return;

    var ui = root.querySelector(".gallery-case_ui");
    var dotsWrap = root.querySelector(".gallery-case_dots");
    var btnPrev = root.querySelector(".arrow-slider.left, .arrow-slider-2.left");
    var btnNext = root.querySelector(".arrow-slider.right, .arrow-slider-2.right");

    var PROGRESS_MS = cssMs("--progress-ms", 6500);
    var SLIDE_MS = cssMs("--slide-ms", 900);
    var DRAG_THRESHOLD = 0.2; // % da largura do card para trocar ao arrastar

    var originals = Array.prototype.slice.call(
      track.querySelectorAll(":scope > .testimonial-card")
    );
    var total = originals.length;

    if (total < 2) {
      if (ui) ui.style.display = "none";
      return;
    }

    /* ---------- Clones: [clones][originais][clones] ---------- */
    function makeClone(el) {
      var c = el.cloneNode(true);
      c.setAttribute("aria-hidden", "true");
      c.dataset.clone = "true";
      return c;
    }

    var before = document.createDocumentFragment();
    var after = document.createDocumentFragment();
    originals.forEach(function (el) { before.appendChild(makeClone(el)); });
    originals.forEach(function (el) { after.appendChild(makeClone(el)); });
    track.insertBefore(before, track.firstChild);
    track.appendChild(after);

    var slides = Array.prototype.slice.call(track.children);

    /* ---------- Estado ---------- */
    var index = total; // começa no primeiro card "real"
    var step = 0;
    var animating = false;
    var animTimer = null;
    var autoTimer = null;
    var inView = false;
    var dragging = false;
    var startX = 0;
    var dx = 0;
    var dots = [];
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---------- Medidas ---------- */
    function measure() {
      step = slides[1].offsetLeft - slides[0].offsetLeft;
      if (step <= 0) step = viewport.offsetWidth;
    }

    function setPos(i, animate) {
      track.style.transition = animate ? "" : "none";
      track.style.transform = "translate3d(" + (-i * step) + "px, 0, 0)";
      if (!animate) {
        track.getBoundingClientRect(); // força reflow
        track.style.transition = "";
      }
    }

    /* ---------- Movimento ---------- */
    function settle() {
      if (!animating) return;
      animating = false;
      clearTimeout(animTimer);

      // Salta sem animação de volta para o conjunto do meio
      if (index >= total * 2) {
        index -= total;
        setPos(index, false);
      } else if (index < total) {
        index += total;
        setPos(index, false);
      }
    }

    function move(newIndex) {
      if (animating) return;
      if (newIndex === index) {
        restartAutoplay();
        return;
      }
      animating = true;
      index = newIndex;
      track.style.transition = "";
      setPos(index, true);
      clearTimeout(animTimer);
      animTimer = setTimeout(settle, SLIDE_MS + 80); // fallback do transitionend
      restartAutoplay();
    }

    function next() { move(index + 1); }
    function prev() { move(index - 1); }
    function goTo(i) { move(total + i); }

    track.addEventListener("transitionend", function (e) {
      if (e.target === track && e.propertyName === "transform") settle();
    });

    /* ---------- Dots (usa o CSS do gallery-dot) ---------- */
    function buildDots() {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = "";
      dots = [];
      for (var i = 0; i < total; i++) {
        (function (n) {
          var dot = document.createElement("div");
          dot.className = "gallery-dot";
          dot.setAttribute("role", "button");
          dot.setAttribute("tabindex", "0");
          dot.setAttribute("aria-label", "Ir para depoimento " + (n + 1));

          var fill = document.createElement("div");
          fill.className = "gallery-dot-fill";
          dot.appendChild(fill);

          dot.addEventListener("click", function () { goTo(n); });
          dot.addEventListener("keydown", function (e) {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              goTo(n);
            }
          });

          dotsWrap.appendChild(dot);
          dots.push(dot);
        })(i);
      }
    }

    function markActiveDot() {
      if (!dots.length) return;
      dots.forEach(function (d) { d.classList.remove("is-active"); });
      var active = dots[mod(index, total)];
      if (!active) return;
      void active.offsetWidth; // reinicia a animação do preenchimento
      active.classList.add("is-active");
    }

    /* ---------- Autoplay ---------- */
    function stopAutoplay() {
      clearTimeout(autoTimer);
      autoTimer = null;
    }

    function restartAutoplay() {
      stopAutoplay();
      markActiveDot();
      if (reduceMotion || !inView || document.hidden || dragging) return;
      autoTimer = setTimeout(next, PROGRESS_MS);
    }

    /* ---------- Setas ---------- */
    [btnPrev, btnNext].forEach(function (btn) {
      if (!btn) return;
      btn.setAttribute("role", "button");
      btn.setAttribute("tabindex", "0");
      btn.addEventListener("click", function () {
        btn === btnNext ? next() : prev();
      });
      btn.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          btn === btnNext ? next() : prev();
        }
      });
    });

    /* ---------- Arrastar (mouse + touch) ---------- */
    viewport.addEventListener("pointerdown", function (e) {
      if (animating) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      dragging = true;
      startX = e.clientX;
      dx = 0;
      stopAutoplay();
      track.classList.add("is-dragging");
      track.style.transition = "none";
      try { viewport.setPointerCapture(e.pointerId); } catch (err) {}
    });

    viewport.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      dx = e.clientX - startX;
      track.style.transform =
        "translate3d(" + (-index * step + dx) + "px, 0, 0)";
    });

    function endDrag() {
      if (!dragging) return;
      dragging = false;
      track.classList.remove("is-dragging");
      track.style.transition = "";

      var limit = step * DRAG_THRESHOLD;
      if (dx < -limit) {
        next();
      } else if (dx > limit) {
        prev();
      } else {
        setPos(index, true);
        restartAutoplay();
      }
    }

    viewport.addEventListener("pointerup", endDrag);
    viewport.addEventListener("pointercancel", endDrag);

    /* ---------- Visibilidade ---------- */
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        inView ? restartAutoplay() : stopAutoplay();
      }, { threshold: 0.35 }).observe(root);
    } else {
      inView = true;
    }

    document.addEventListener("visibilitychange", function () {
      document.hidden ? stopAutoplay() : restartAutoplay();
    });

    /* ---------- Resize ---------- */
    window.addEventListener("resize", function () {
      measure();
      setPos(index, false);
    });

    /* ---------- Init ---------- */
    measure();
    setPos(index, false);
    buildDots();
    restartAutoplay();
  }

  function initAll() {
    /* Cada lista que tem .testimonial-card como filho direto vira um slider */
    var tracks = [];
    Array.prototype.forEach.call(
      document.querySelectorAll(".w-dyn-items > .testimonial-card"),
      function (card) {
        if (tracks.indexOf(card.parentElement) === -1) {
          tracks.push(card.parentElement);
        }
      }
    );
    tracks.forEach(initSlider);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();