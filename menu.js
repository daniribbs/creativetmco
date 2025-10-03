/**
 * tmco-menu.js — Menu Desktop + Mobile (com display:flex)
 * - Desktop: clique em "Serviços" abre/fecha a .mega (latch). Não fecha ao mover o mouse.
 * - Mobile: toggle abre/fecha overlay principal; "serv mobile opened" volta do overlay de serviços para o principal.
 * - Ao clicar no toggle com overlay_services aberto, fecha overlay_services também.
 * - Alternância de painéis por data-slug.
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

    // Estado inicial (se o CSS não tiver feito)
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
      // Não fechamos em mouseleave — só por clique fora / ESC / segundo clique.
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

      item.addEventListener('click', (e) => {
        const a = e.target.closest('a');
        if (a) e.preventDefault();
        e.preventDefault();

        activateItem(item);

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

        // ✅ Ajuste pedido: se overlay_services estiver aberto, feche-o ao clicar no toggle
        if (document.body.classList.contains('tmco-services-open')) {
          closeOverlayServices(false); // fecha o overlay de serviços primeiro
        }

        const opening = !document.body.classList.contains('tmco-mobile-open');

        if (opening) {
          // Abrir overlay principal
          document.body.classList.add('tmco-mobile-open');
          if (overlayStd) {
            overlayStd.style.display = 'flex';        // flex
            overlayStd.setAttribute('aria-hidden', 'false');
          }
          // Garantia extra: overlay serviços fechado
          closeOverlayServices(false);
          // Fechar mega no fundo
          closeMega();
        } else {
          // Fechar tudo ao fechar via toggle
          closeAllOverlays();
        }
      });
    }

    // Abrir overlay de serviços a partir do overlay principal ("Serviços" mobile)
    if (servMobile && overlayServices) {
      servMobile.addEventListener('click', (e) => {
        e.preventDefault();
        openOverlayServices();
      });
    }

    // Clicar em "nav__item serv mobile opened" volta do overlay de serviços para o principal
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
    // Esconde overlay principal, mostra overlay de serviços
    if (overlayStd) {
      overlayStd.style.display = 'none';
      overlayStd.setAttribute('aria-hidden', 'true');
    }
    overlayServices.style.display = 'flex';           // flex
    overlayServices.setAttribute('aria-hidden', 'false');
    document.body.classList.add('tmco-services-open');
  }

  function closeOverlayServices(backToMain) {
    if (!overlayServices) return;
    overlayServices.style.display = '';
    overlayServices.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('tmco-services-open');

    if (backToMain && overlayStd && document.body.classList.contains('tmco-mobile-open')) {
      overlayStd.style.display = 'flex';              // flex
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

    // Clique fora da mega fecha (quando aberta). Mover do trigger para a mega NÃO fecha.
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
