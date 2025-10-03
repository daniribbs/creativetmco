/**
 * JS só alterna CLASSES + ARIA.
 * - Desktop:
 *   • Clique em “Serviços” abre/fecha .mega (latch).
 *   • Hover alterna painéis SOMENTE se não estiver “travado”.
 *   • Clique em item ativa e TRAVA (ignora hover até fechar mega).
 * - Mobile:
 *   • .toggle abre/fecha overlay principal; fecha overlay de serviços se estiver aberto.
 *   • .serv.mobile abre overlay de serviços.
 *   • .nav__item.serv.mobile.opened volta ao overlay principal.
 */

(function () {
  'use strict';

  const $ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const $one = (sel, ctx = document) => ctx.querySelector(sel);
  const isPointerFine = () => window.matchMedia('(pointer:fine)').matches;

  let servTriggerLi, servTriggerA, mega;
  let serviceItems, filteredItems, filteredContainer;
  let toggleBtn, overlayStd, overlayServices, servMobile, servMobileOpened;

  // Estado
  let locked = false;         // travado (ignora hover)
  let lastActiveSlug = null;

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    servTriggerLi   = $one('.nav__item.serv');
    servTriggerA    = servTriggerLi ? $one('a', servTriggerLi) : null;
    mega            = $one('.mega');

    serviceItems    = $('.service-item-menu');
    filteredItems   = $('.filtered-item');
    // container que envolve os painéis (para position:relative)
    filteredContainer = filteredItems.length ? filteredItems[0].parentElement : null;
    if (filteredContainer && getComputedStyle(filteredContainer).position === 'static') {
      filteredContainer.style.position = 'relative';
    }

    toggleBtn       = $one('.toggle');
    overlayStd      = $one('.overlay.std');
    overlayServices = $one('.overlay_services.overlay');
    servMobile      = $one('.serv.mobile');
    servMobileOpened= overlayServices ? overlayServices.querySelector('.nav__item.serv.mobile.opened') : null;

    bindDesktopTrigger();
    bindServiceItems();
    bindDesktopHoverDelegation();
    ensureInitialActive();

    bindMobile();
    bindGlobalClosers();
  }

  // ===== Desktop: trigger "Serviços" =====
  function bindDesktopTrigger() {
    if (!servTriggerA || !mega) return;

    servTriggerA.setAttribute('aria-haspopup', 'true');
    servTriggerA.setAttribute('aria-expanded', 'false');
    mega.setAttribute('aria-hidden', 'true');

    servTriggerA.addEventListener('click', (e) => {
      e.preventDefault();
      toggleMega();
    });

    if (isPointerFine()) {
      servTriggerLi.addEventListener('mouseenter', openMega);
      mega.addEventListener('mouseenter', openMega);
      // não fechamos em mouseleave
    }
  }

  function openMega() {
    if (!mega) return;
    mega.classList.add('is-open');
    mega.setAttribute('aria-hidden', 'false');
    if (servTriggerA) servTriggerA.setAttribute('aria-expanded', 'true');
  }
  function closeMega() {
    if (!mega) return;
    mega.classList.remove('is-open');
    mega.setAttribute('aria-hidden', 'true');
    if (servTriggerA) servTriggerA.setAttribute('aria-expanded', 'false');
    locked = false; // destrava
  }
  function toggleMega() {
    if (!mega) return;
    mega.classList.contains('is-open') ? closeMega() : openMega();
  }

  // ===== Items (click trava; teclado acessível) =====
  function bindServiceItems() {
    if (!serviceItems.length || !filteredItems.length) return;
    serviceItems.forEach((item) => {
      if (!item.hasAttribute('tabindex')) item.setAttribute('tabindex', '0');

      item.addEventListener('click', (e) => {
        const a = e.target.closest('a');
        if (a) e.preventDefault();
        e.preventDefault();

        activateItem(item);
        locked = true;            // trava até fechar mega
        if (isPointerFine()) openMega();
      });

      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          item.click();
        }
      });
    });
  }

  // ===== Hover delegado (somente desktop, destravado) =====
  function bindDesktopHoverDelegation() {
    if (!mega) return;
    mega.addEventListener('mouseover', (e) => {
      if (!isPointerFine()) return;
      if (!mega.classList.contains('is-open')) return;
      if (locked) return;
      if (document.body.classList.contains('tmco-services-open')) return;

      const item = e.target.closest('.service-item-menu');
      if (!item || !mega.contains(item)) return;

      const slug = item.getAttribute('data-slug') || '';
      if (slug && slug !== lastActiveSlug) {
        activateItem(item);
      }
    });
  }

  function ensureInitialActive() {
    if (!serviceItems.length || !filteredItems.length) return;
    let active = serviceItems.find(el => el.classList.contains('is-active')) || serviceItems[0];
    activateItem(active, { silent: true });
  }

  function activateItem(el, opts = {}) {
    const slug = el.getAttribute('data-slug');

    serviceItems.forEach(i => {
      i.classList.remove('is-active');
      i.setAttribute('aria-selected', 'false');
    });
    el.classList.add('is-active');
    el.setAttribute('aria-selected', 'true');

    filteredItems.forEach(panel => {
      const match = panel.getAttribute('data-slug') === slug;
      panel.classList.toggle('is-visible', !!match);
      panel.setAttribute('aria-hidden', match ? 'false' : 'true');
    });

    lastActiveSlug = slug || null;
  }

  // ===== Mobile =====
  function bindMobile() {
    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();

        // se serviços aberto, fechar primeiro
        if (document.body.classList.contains('tmco-services-open')) {
          document.body.classList.remove('tmco-services-open');
        }

        const opening = !document.body.classList.contains('tmco-mobile-open');
        if (opening) {
          document.body.classList.add('tmco-mobile-open');
          locked = false;
          closeMega();
        } else {
          closeAllOverlays();
        }
      });
    }

    if (servMobile && overlayServices) {
      servMobile.addEventListener('click', (e) => {
        e.preventDefault();
        document.body.classList.add('tmco-services-open');
        document.body.classList.remove('tmco-mobile-open'); // troca std -> serviços
        locked = false;
        closeMega();
      });
    }

    if (servMobileOpened && overlayServices) {
      servMobileOpened.addEventListener('click', (e) => {
        e.preventDefault();
        // volta: serviços -> principal
        document.body.classList.remove('tmco-services-open');
        document.body.classList.add('tmco-mobile-open');
      });
    }

    // Fechar ao clicar no fundo dos overlays
    if (overlayStd) {
      overlayStd.addEventListener('click', (e) => {
        if (e.target === overlayStd) closeAllOverlays();
      });
    }
    if (overlayServices) {
      overlayServices.addEventListener('click', (e) => {
        if (e.target === overlayServices) {
          document.body.classList.remove('tmco-services-open');
          document.body.classList.add('tmco-mobile-open'); // volta para principal
        }
      });
    }
  }

  function closeAllOverlays() {
    document.body.classList.remove('tmco-mobile-open', 'tmco-services-open');
  }

  // ===== Fechamentos globais =====
  function bindGlobalClosers() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        closeMega();
        closeAllOverlays();
      }
    });

    // Clique fora da mega fecha (quando aberta)
    document.addEventListener('click', (e) => {
      if (!mega || !mega.classList.contains('is-open')) return;
      const clickInsideMega = mega.contains(e.target);
      const clickOnTrigger  = servTriggerLi && servTriggerLi.contains(e.target);
      if (!clickInsideMega && !clickOnTrigger) {
        closeMega();
      }
    });
  }
})();
