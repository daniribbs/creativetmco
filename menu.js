/**
 * tmco-menu.js
 * Manipulação do menu (desktop + mobile) - pronto para Webflow
 *
 * Instruções: inclua este arquivo no final do body. Não depende de libs.
 *
 * Behaviors implemented:
 * - Inicializa item ativo (usa .is-active ou primeiro item)
 * - Hover / focus / click para alternar detalhes na .mega (desktop)
 * - Toggle mobile menu (.toggle) e overlays (.overlay, .overlay_services)
 * - Click em .service-item-menu atualiza painel .filtered-item via data-slug
 * - Suporte a keyboard (ESC fecha), ARIA attributes
 */

(function () {
  'use strict';

  // --- Helpers ---
  const $ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const $one = (sel, ctx = document) => ctx.querySelector(sel);

  // Debounce small utility
  function debounce(fn, wait = 50) {
    let t;
    return (...a) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...a), wait);
    };
  }

  // --- Selectors (based on seu markup) ---
  const CLASS_SERVICE_ITEM = '.service-item-menu';
  const CLASS_FILTERED_ITEM = '.filtered-item';
  const SELECTOR_SERV_TRIGGER = '.serv'; // o item do nav que abre o mega
  const MEGA = '.mega';
  const TOGGLE = '.toggle';
  const OVERLAY = '.overlay.std';
  const OVERLAY_SERVICES = '.overlay_services.overlay';
  const NAV_LIST_MOBILE = '.nav_list_mobile';

  // Namespace to avoid collisions
  const ns = {
    serviceItems: [],
    filteredItems: [],
    servTrigger: null,
    megaEl: null,
    toggleBtn: null,
    overlay: null,
    overlayServices: null,
  };

  // --- Initialization ---
  function init() {
    ns.serviceItems = $(CLASS_SERVICE_ITEM);
    ns.filteredItems = $(CLASS_FILTERED_ITEM);
    ns.servTrigger = $one(SELECTOR_SERV_TRIGGER);
    ns.megaEl = $one(MEGA);
    ns.toggleBtn = $one(TOGGLE);
    ns.overlay = $one(OVERLAY);
    ns.overlayServices = $one(OVERLAY_SERVICES);

    // Basic ARIA setup
    if (ns.servTrigger) {
      ns.servTrigger.setAttribute('aria-haspopup', 'true');
      ns.servTrigger.setAttribute('aria-expanded', 'false');
    }
    if (ns.megaEl) ns.megaEl.setAttribute('aria-hidden', 'true');

    bindServiceItems();
    bindMegaHoverAndFocus();
    bindMobileToggle();
    bindDocCloseHandlers();
    ensureInitialActive();
  }

  // --- Ensure initial active item (use .is-active if exists, else first) ---
  function ensureInitialActive() {
    let active = ns.serviceItems.find(el => el.classList.contains('is-active'));
    if (!active && ns.serviceItems.length) {
      active = ns.serviceItems[0];
      active.classList.add('is-active');
    }
    if (active) setActiveByElement(active, { announce: false });
  }

  // --- Set active by element (service-item-menu) ---
  function setActiveByElement(el, opts = {}) {
    const slug = el.getAttribute('data-slug');
    // remove is-active
    ns.serviceItems.forEach(i => i.classList.remove('is-active'));
    el.classList.add('is-active');

    // update corresponding filtered item
    ns.filteredItems.forEach(fi => {
      const matches = fi.getAttribute('data-slug') === slug;
      fi.style.display = matches ? 'flex' : 'none';
    });

    // announce for accessibility if needed
    if (opts.announce && ns.megaEl) {
      // set aria attributes
      ns.serviceItems.forEach(i => i.setAttribute('aria-selected', 'false'));
      el.setAttribute('aria-selected', 'true');
    }
  }

  // --- Click / touch / keyboard for service items ---
  function bindServiceItems() {
    ns.serviceItems.forEach(item => {
      // make items keyboard focusable if not already
      if (!item.hasAttribute('tabindex')) item.setAttribute('tabindex', '0');

      // click / touch
      item.addEventListener('click', e => {
        e.preventDefault();
        setActiveByElement(item, { announce: true });
        // if in mobile overlay, keep overlay open or close? We'll keep open.
        // But for desktop, ensure mega visible
        showMega();
      });

      // keyboard activation (Enter / Space)
      item.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          item.click();
        }
      });
    });
  }

  // --- Desktop hover/focus behavior for showing mega panel ---
  function bindMegaHoverAndFocus() {
    if (!ns.servTrigger || !ns.megaEl) return;

    // show/hide helpers (debounced to avoid flicker)
    const show = debounce(() => {
      ns.megaEl.style.display = ''; // allow CSS to handle layout
      ns.megaEl.setAttribute('aria-hidden', 'false');
      ns.servTrigger.setAttribute('aria-expanded', 'true');
      ns.megaEl.classList.add('open');
    }, 30);

    const hide = debounce(() => {
      // only hide if not focused inside
      if (document.activeElement && ns.megaEl.contains(document.activeElement)) return;
      ns.megaEl.style.display = '';
      ns.megaEl.setAttribute('aria-hidden', 'true');
      ns.servTrigger.setAttribute('aria-expanded', 'false');
      ns.megaEl.classList.remove('open');
    }, 150);

    // Hover on trigger shows mega
    ns.servTrigger.addEventListener('mouseenter', show);
    ns.servTrigger.addEventListener('mouseleave', hide);

    // Hover on mega keep it open
    ns.megaEl.addEventListener('mouseenter', show);
    ns.megaEl.addEventListener('mouseleave', hide);

    // Focus support (keyboard)
    ns.servTrigger.addEventListener('focus', show);
    ns.servTrigger.addEventListener('blur', () => setTimeout(hide, 120));
    ns.megaEl.addEventListener('focusin', show);
    ns.megaEl.addEventListener('focusout', () => setTimeout(hide, 120));

    // If user clicks the servTrigger link, toggle mega (useful if they click rather than hover)
    const anchorInside = $one('a', ns.servTrigger);
    if (anchorInside) {
      anchorInside.addEventListener('click', (e) => {
        // If mega is open, close it; else open it.
        const isOpen = ns.megaEl.classList.contains('open');
        e.preventDefault();
        if (isOpen) {
          hide();
        } else {
          show();
        }
      });
    }
  }

  // --- Mobile toggle & overlays ---
  function bindMobileToggle() {
    if (ns.toggleBtn) {
      ns.toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const opened = document.body.classList.toggle('tmco-mobile-open'); // body class to identify open state
        if (opened) {
          if (ns.overlay) ns.overlay.style.display = 'block';
          if (ns.overlay) ns.overlay.setAttribute('aria-hidden', 'false');
        } else {
          if (ns.overlay) ns.overlay.style.display = '';
          if (ns.overlay) ns.overlay.setAttribute('aria-hidden', 'true');
        }
      });
    }

    // Clicking the services item in mobile (serv mobile) should open overlay_services
    const servMobile = $one('.serv.mobile');
    if (servMobile && ns.overlayServices) {
      servMobile.addEventListener('click', (e) => {
        e.preventDefault();
        // open services overlay
        ns.overlayServices.style.display = 'block';
        ns.overlayServices.setAttribute('aria-hidden', 'false');
        // hide main overlay if present
        if (ns.overlay) {
          ns.overlay.style.display = 'none';
          ns.overlay.setAttribute('aria-hidden', 'true');
        }
        // add class for mobile view
        document.body.classList.add('tmco-services-open');
      });
    }

    // Close overlays when clicking on overlay background (but not when clicking inside nav list)
    if (ns.overlay) {
      ns.overlay.addEventListener('click', (e) => {
        // if clicked directly on overlay (not on child), close
        if (e.target === ns.overlay) {
          closeAllOverlays();
        }
      });
    }
    if (ns.overlayServices) {
      ns.overlayServices.addEventListener('click', (e) => {
        if (e.target === ns.overlayServices) {
          ns.overlayServices.style.display = '';
          ns.overlayServices.setAttribute('aria-hidden', 'true');
          document.body.classList.remove('tmco-services-open');
          // restore main overlay if toggle is open
          if (document.body.classList.contains('tmco-mobile-open') && ns.overlay) {
            ns.overlay.style.display = 'block';
            ns.overlay.setAttribute('aria-hidden', 'false');
          }
        }
      });
    }
  }

  function closeAllOverlays() {
    if (ns.overlay) {
      ns.overlay.style.display = '';
      ns.overlay.setAttribute('aria-hidden', 'true');
    }
    if (ns.overlayServices) {
      ns.overlayServices.style.display = '';
      ns.overlayServices.setAttribute('aria-hidden', 'true');
    }
    document.body.classList.remove('tmco-mobile-open', 'tmco-services-open');
  }

  // --- Document-level close handlers (ESC, click outside) ---
  function bindDocCloseHandlers() {
    // ESC to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        // close mega and overlays
        if (ns.megaEl) {
          ns.megaEl.style.display = '';
          ns.megaEl.setAttribute('aria-hidden', 'true');
          ns.megaEl.classList.remove('open');
          if (ns.servTrigger) ns.servTrigger.setAttribute('aria-expanded', 'false');
        }
        closeAllOverlays();
      }
    });

    // click outside the mega to close (desktop)
    document.addEventListener('click', (ev) => {
      const target = ev.target;
      if (!ns.megaEl || !ns.servTrigger) return;
      if (ns.megaEl.contains(target) || ns.servTrigger.contains(target)) {
        // click inside -> do nothing
        return;
      }
      // click outside -> close mega (but only if it is open)
      if (ns.megaEl.classList.contains('open')) {
        ns.megaEl.style.display = '';
        ns.megaEl.setAttribute('aria-hidden', 'true');
        ns.megaEl.classList.remove('open');
        ns.servTrigger.setAttribute('aria-expanded', 'false');
      }
    }, true);
  }

  // --- Utility: set active by slug (public) ---
  function setActiveBySlug(slug) {
    const el = ns.serviceItems.find(i => i.getAttribute('data-slug') === slug);
    if (el) setActiveByElement(el, { announce: true });
  }

  // --- Expose some debug methods (on window.tmcoMenu) ---
  window.tmcoMenu = {
    init,
    setActiveBySlug,
    setActiveByElement,
    closeAllOverlays
  };

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
