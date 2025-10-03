/**
 * tmco-menu.js — Menu Desktop + Mobile (display:flex)
 * - Desktop:
 *   - Clique em "Serviços" abre/fecha .mega (latch).
 *   - Hover em .service-item-menu alterna o painel imediatamente.
 *   - Não fecha ao sair com mouse; só por clique fora / ESC / novo clique.
 * - Mobile:
 *   - toggle abre/fecha overlay principal;
 *   - "serv mobile" abre overlay de serviços;
 *   - "nav__item serv mobile opened" fecha overlay serviços e volta ao principal;
 *   - toggle fecha overlay serviços se ele estiver aberto.
 * - Painéis alternados por data-slug.
 */

(function () {
  'use strict';

  const $ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const $one = (sel, ctx = document) => ctx.querySelector(sel);
  const isPointerFine = () => window.matchMedia('(pointer:fine)').matches;

  let servTriggerLi, servTriggerA, mega;
  let serviceItems, filteredItems;
  let toggleBtn, overlayStd, overlayServices, servMobile, servMobileOpened;

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    servTriggerLi     = $one('.nav__item.serv');
    servTriggerA      = servTriggerLi ? $one('a', servTriggerLi) : null;
    mega              = $one('.mega');

    serviceItems      = $('.service-item-menu');
    filteredItems     = $('.filtered-item');

    toggleBtn         = $one('.toggle');
    overlayStd        = $one('.overlay.std');
    overlayServices   = $one('.overlay_services.overlay');
    servMobile        = $one('.serv.mobile'); // trigger "Serviços" no overlay principal
    // dentro do overlay_services há um <li class="nav__item serv mobile opened">
    servMobileOpened  = overlayServices ? overlayServices.querySelector('.nav__item.serv.mobile.opened') : null;

    bindDesktopTrigger();
    bindServiceItems();
    ensureInitialActive();

    bindMobile();
    bindGlobalClosers();

    // Estado inicial (fallback, caso CSS não oculte)
    if (mega) {
      mega.style.display = 'none';
      mega.setAttribute('aria-hidden', 'true');
    }
    if (overlayStd) {
      overlayStd.style.display = '';
      overlayStd.setAttribute('aria-hidden', 'true');
    }
    if (overlayServices) {
      overlayServices.style.display = '';
      overlayServices.setAttribute('aria-hidden', 'true');
    }
  }

  // ===== Desktop: clique em "Serviços" abre/fecha (sticky) =====
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
      servTriggerLi.addEventListener('mouseenter', () => openMega());
      mega.addEventListener('mouseenter', () => openMega());
      // Não fechamos em mouseleave (latch). Fechamento só por clique fora / ESC / segundo clique.
    }
  }

  function openMega() {
    if (!mega) return;
    mega.classList.add('open');
    mega.style.display = 'flex';               // sempre flex
    mega.setAttribute('aria-hidden', 'false');
    if (servTriggerA) servTriggerA.setAttribute('aria-expanded', 'true');
  }

  function closeMega() {
    if (!mega) return;
    mega.classList.remove('open');
    mega.style.display = 'none';
    mega.setAttribute('aria-hidden', 'true');
    if (servTriggerA) servTriggerA.setAttribute('aria-expanded', 'false');
  }

  function toggleMega() {
    if (!mega) return;
    if (mega.classList.contains('open')) closeMega();
    else openMega();
  }

  // ===== Alternância de itens/painéis por data-slug =====
  function bindServiceItems() {
    if (!serviceItems.length || !filteredItems.length) return;

    serviceItems.forEach((item) => {
      if (!item.hasAttribute('tabindex')) item.setAttribute('tabindex', '0');

      // Clique ativa
      item.addEventListener('click', (e) => {
        const a = e.target.closest('a');
        if (a) e.preventDefault();
        e.preventDefault();

        activateItem(item);

        // No desktop, garantir mega aberta ao clicar
        if (isPointerFine()) openMega();
      });

      // Teclado
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          item.click();
        }
      });

      // HOVER (Desktop): alterna imediatamente
      item.addEventListener('mouseenter', () => {
        if (!isPointerFine()) return; // evita interferir no mobile
        activateItem(item);
        openMega(); // garante visível
      });
    });
  }

  function ensureInitialActive() {
    if (!serviceItems.length || !filteredItems.length) return;
    let active = serviceItems.find((el) => el.classList.contains('is-active'));
    if (!active) active = serviceItems[0];
    activateItem(active, { silent: true });
  }

  function activateItem(el, opts = {}) {
    const slug = el.getAttribute('data-slug');

    serviceItems.forEach((i) => {
      i.classList.remove('is-active');
      i.setAttribute('aria-selected', 'false');
    });
    el.classList.add('is-active');
    el.setAttribute('aria-selected', 'true');

    filteredItems.forEach((panel) => {
      const match = panel.getAttribute('data-slug') === slug;
      panel.style.display = match ? 'flex' : 'none';  // sempre flex
      panel.setAttribute('aria-hidden', match ? 'false' : 'true');
    });
  }

  // ===== Mobile: toggle & overlays =====
  function bindMobile() {
    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();

        // Se overlay de serviços estiver aberto, fecha antes de alternar principal
        if (document.body.classList.contains('tmco-services-open')) {
          closeOverlayServices(false);
        }

        const opening = !document.body.classList.contains('tmco-mobile-open');

        if (opening) {
          document.body.classList.add('tmco-mobile-open');
          if (overlayStd) {
            overlayStd.style.display = 'flex';
            overlayStd.setAttribute('aria-hidden', 'false');
          }
          closeOverlayServices(false);
          closeMega();
        } else {
          closeAllOverlays();
        }
      });
    }

    // Abrir overlay de serviços a partir do overlay principal
    if (servMobile && overlayServices) {
      servMobile.addEventListener('click', (e) => {
        e.preventDefault();
        openOverlayServices();
      });
    }

    // No overlay de serviços: clicar em "nav__item serv mobile opened" volta ao overlay principal
    if (servMobileOpened && overlayServices) {
      servMobileOpened.addEventListener('click', (e) => {
        e.preventDefault();
        closeOverlayServices(true);
      });
    }

    // Clique no fundo dos overlays fecha
    if (overlayStd) {
      overlayStd.addEventListener('click', (e) => {
        if (e.target === overlayStd) closeAllOverlays();
      });
    }
    if (overlayServices) {
      overlayServices.addEventListener('click', (e) => {
        if (e.target === overlayServices) {
          closeOverlayServices(true);
        }
      });
    }
  }

  function openOverlayServices() {
    if (!overlayServices) return;
    if (overlayStd) {
      overlayStd.style.display = 'none';
      overlayStd.setAttribute('aria-hidden', 'true');
    }
    overlayServices.style.display = 'flex';
    overlayServices.setAttribute('aria-hidden', 'false');
    document.body.classList.add('tmco-services-open');
  }

  function closeOverlayServices(backToMain) {
    if (!overlayServices) return;
    overlayServices.style.display = '';
    overlayServices.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('tmco-services-open');

    if (backToMain && overlayStd && document.body.classList.contains('tmco-mobile-open')) {
      overlayStd.style.display = 'flex';
      overlayStd.setAttribute('aria-hidden', 'false');
    }
  }

  function closeAllOverlays() {
    if (overlayStd) {
      overlayStd.style.display = '';
      overlayStd.setAttribute('aria-hidden', 'true');
    }
    if (overlayServices) {
      overlayServices.style.display = '';
      overlayServices.setAttribute('aria-hidden', 'true');
    }
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
      if (!mega || !mega.classList.contains('open')) return;
      const clickInsideMega = mega.contains(e.target);
      const clickOnTrigger  = servTriggerLi && servTriggerLi.contains(e.target);
      if (!clickInsideMega && !clickOnTrigger) {
        closeMega();
      }
    });
  }

})();
