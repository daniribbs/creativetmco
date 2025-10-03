/**
 * tmco-menu.js — Menu Desktop + Mobile (display:flex)
 * Extras agora:
 * - Alterna ícones do .toggle: .hamb <-> .close conforme overlays ativos.
 */

(function () {
  'use strict';

  const $ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const $one = (sel, ctx = document) => ctx.querySelector(sel);
  const isPointerFine = () => window.matchMedia('(pointer:fine)').matches;

  let servTriggerLi, servTriggerA, mega;
  let serviceItems, filteredItems;
  let toggleBtn, overlayStd, overlayServices, servMobile, servMobileOpened;

  // Ícones do toggle
  let iconHamb, iconClose;

  // Estado de travamento e cache (desktop)
  let locked = false;
  let lastActiveSlug = null;

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
    servMobile        = $one('.serv.mobile');
    servMobileOpened  = overlayServices ? overlayServices.querySelector('.nav__item.serv.mobile.opened') : null;

    // ícones do toggle
    iconHamb  = $one('.toggle .hamb');
    iconClose = $one('.toggle .close');

    bindDesktopTrigger();
    bindServiceItems();
    bindDesktopHoverDelegation();
    ensureInitialActive();

    bindMobile();
    bindGlobalClosers();

    // Estado inicial (fallback)
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

    // ícones iniciais
    updateToggleIcons();
  }

  // ===== Controle dos ícones do toggle =====
  function updateToggleIcons() {
    const overlayActive =
      document.body.classList.contains('tmco-mobile-open') ||
      document.body.classList.contains('tmco-services-open');

    if (iconHamb)  iconHamb.style.display  = overlayActive ? 'none'  : 'block';
    if (iconClose) iconClose.style.display = overlayActive ? 'block' : 'none';
  }

  // ===== Desktop: clique em "Serviços" abre/fecha (latch) =====
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
      // não fechamos em mouseleave; fechamento só por clique fora / ESC / segundo clique
    }
  }

  function openMega() {
    if (!mega) return;
    mega.classList.add('open');
    mega.style.display = 'flex';
    mega.setAttribute('aria-hidden', 'false');
    if (servTriggerA) servTriggerA.setAttribute('aria-expanded', 'true');
  }

  function closeMega() {
    if (!mega) return;
    mega.classList.remove('open');
    mega.style.display = 'none';
    mega.setAttribute('aria-hidden', 'true');
    if (servTriggerA) servTriggerA.setAttribute('aria-expanded', 'false');
    locked = false; // destrava hover ao fechar
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

      // Clique ativa e TRAVA
      item.addEventListener('click', (e) => {
        const a = e.target.closest('a');
        if (a) e.preventDefault();
        e.preventDefault();

        activateItem(item);
        locked = true; // ignora hovers posteriores até fechar a mega

        if (isPointerFine()) openMega();
      });

      // Teclado
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          item.click();
        }
      });
    });
  }

  // ===== Hover delegado na mega (desktop, somente destravado) =====
  function bindDesktopHoverDelegation() {
    if (!mega) return;

    mega.addEventListener('mouseover', (e) => {
      if (!isPointerFine()) return;
      if (!mega.classList.contains('open')) return;
      if (locked) return;
      if (document.body.classList.contains('tmco-services-open')) return;

      const item = e.target.closest('.service-item-menu');
      if (!item || !mega.contains(item)) return;

      const slug = item.getAttribute('data-slug') || '';
      if (slug && slug !== lastActiveSlug) {
        lastActiveSlug = slug;
        activateItem(item);
      }
    });
  }

  function ensureInitialActive() {
    if (!serviceItems.length || !filteredItems.length) return;
    let active = serviceItems.find((el) => el.classList.contains('is-active'));
    if (!active) active = serviceItems[0];
    lastActiveSlug = active ? active.getAttribute('data-slug') : null;
    activateItem(active, { silent: true });
  }

  function activateItem(el, opts = {}) {
    if (!el) return;
    const slug = el.getAttribute('data-slug');

    serviceItems.forEach((i) => {
      i.classList.remove('is-active');
      i.setAttribute('aria-selected', 'false');
    });
    el.classList.add('is-active');
    el.setAttribute('aria-selected', 'true');

    filteredItems.forEach((panel) => {
      const match = panel.getAttribute('data-slug') === slug;
      panel.style.display = match ? 'flex' : 'none';
      panel.setAttribute('aria-hidden', match ? 'false' : 'true');
    });

    lastActiveSlug = slug || null;
  }

  // ===== Mobile: toggle & overlays =====
  function bindMobile() {
    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();

        // se overlay de serviços estiver aberto, fecha antes de alternar principal
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
          locked = false;         // entrando no fluxo mobile, destrava
          closeOverlayServices(false);
          closeMega();
        } else {
          closeAllOverlays();
        }

        updateToggleIcons();
      });
    }

    // Abrir overlay de serviços a partir do overlay principal
    if (servMobile && overlayServices) {
      servMobile.addEventListener('click', (e) => {
        e.preventDefault();
        openOverlayServices();
      });
    }

    // No overlay de serviços: "nav__item serv mobile opened" volta ao overlay principal
    if (servMobileOpened && overlayServices) {
      servMobileOpened.addEventListener('click', (e) => {
        e.preventDefault();
        closeOverlayServices(true);
      });
    }

    // Clique no fundo dos overlays fecha
    if (overlayStd) {
      overlayStd.addEventListener('click', (e) => {
        if (e.target === overlayStd) {
          closeAllOverlays();
          updateToggleIcons();
        }
      });
    }
    if (overlayServices) {
      overlayServices.addEventListener('click', (e) => {
        if (e.target === overlayServices) {
          closeOverlayServices(true);
          updateToggleIcons();
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
    locked = false;
    updateToggleIcons();
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
    updateToggleIcons();
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
    updateToggleIcons();
  }

  // ===== Fechamentos globais =====
  function bindGlobalClosers() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        closeMega();
        closeAllOverlays(); // já chama updateToggleIcons()
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
