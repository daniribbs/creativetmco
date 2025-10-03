/**
 * tmco-menu.js — Menu Desktop + Mobile para seu markup
 * Requisitos do HTML (presentes no seu snippet):
 * - Item trigger desktop: <li class="nav__item serv"><a class="nav__link aa">Serviços...</a></li>
 * - Mega container: .mega
 * - Itens de serviço: .service-item-menu[data-slug]
 * - Painéis de conteúdo: .filtered-item[data-slug]
 * - Toggle mobile: .toggle
 * - Overlay mobile principal: .overlay.std
 * - Overlay serviços mobile: .overlay_services.overlay
 */

(function () {
  'use strict';

  // Helpers
  const $ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const $one = (sel, ctx = document) => ctx.querySelector(sel);
  const isPointerFine = () => window.matchMedia('(pointer:fine)').matches; // desktop-ish

  // Elementos-chave
  let servTriggerA, servTriggerLi, mega, serviceItems, filteredItems, toggleBtn, overlayStd, overlayServices, servMobile;

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    servTriggerLi   = $one('.nav__item.serv');
    servTriggerA    = servTriggerLi ? $one('a', servTriggerLi) : null;
    mega            = $one('.mega');

    serviceItems    = $('.service-item-menu');       // lista (esq.)
    filteredItems   = $('.filtered-item');           // painéis (dir.)

    toggleBtn       = $one('.toggle');
    overlayStd      = $one('.overlay.std');
    overlayServices = $one('.overlay_services.overlay');
    servMobile      = $one('.serv.mobile'); // trigger “Serviços” dentro do overlay std

    bindDesktopTrigger();
    bindServiceItems();
    ensureInitialActive();

    bindMobile();
    bindGlobalClosers();
  }

  // ===== Desktop: abrir/fechar mega pelo clique em "Serviços" =====
  function bindDesktopTrigger() {
    if (!servTriggerA || !mega) return;

    // Preparar ARIA
    servTriggerA.setAttribute('aria-haspopup', 'true');
    servTriggerA.setAttribute('aria-expanded', 'false');
    mega.setAttribute('aria-hidden', 'true');

    // Clique abre/fecha
    servTriggerA.addEventListener('click', (e) => {
      e.preventDefault();
      toggleMega();
    });

    // Em ponteiro "fino" (desktop), manter aberto ao passar mouse
    if (isPointerFine()) {
      const show = () => openMega();
      const hide = (evt) => {
        // Fecha apenas se cursor sair de ambos: trigger e mega
        if (!mega.contains(evt.relatedTarget) && !servTriggerLi.contains(evt.relatedTarget)) {
          closeMega();
        }
      };
      servTriggerLi.addEventListener('mouseenter', show);
      servTriggerLi.addEventListener('mouseleave', hide);
      mega.addEventListener('mouseenter', show);
      mega.addEventListener('mouseleave', hide);
      // Foco por teclado
      servTriggerA.addEventListener('focus', show);
      mega.addEventListener('focusin', show);
      servTriggerA.addEventListener('blur', (e) => hide(e));
      mega.addEventListener('focusout', (e) => hide(e));
    }
  }

  function openMega() {
    if (!mega) return;
    mega.classList.add('open');
    mega.style.display = 'block';
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
      // Acessível via teclado
      if (!item.hasAttribute('tabindex')) item.setAttribute('tabindex', '0');

      item.addEventListener('click', (e) => {
        // Alguns desses itens podem estar dentro de <a>; previna navegação indesejada
        if (e.target && e.target.closest('a')) e.preventDefault();
        e.preventDefault();
        activateItem(item);
        // Garantir mega aberto no desktop ao clicar
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
      panel.style.display = match ? 'flex' : 'none';
      panel.setAttribute('aria-hidden', match ? 'false' : 'true');
    });

    if (!opts.silent && !isPointerFine()) {
      // Em mobile, ao trocar item, permanece no overlay services
    }
  }

  // ===== Mobile: toggle e overlays =====
  function bindMobile() {
    // Botão hamburguer abre/fecha overlay principal
    if (toggleBtn && overlayStd) {
      toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const opened = document.body.classList.toggle('tmco-mobile-open');
        if (opened) {
          overlayStd.style.display = 'block';
          overlayStd.setAttribute('aria-hidden', 'false');
          closeMega(); // evitar mega aberto atrás
        } else {
          overlayStd.style.display = '';
          overlayStd.setAttribute('aria-hidden', 'true');
        }
      });

      // Clicar no fundo do overlay fecha
      overlayStd.addEventListener('click', (e) => {
        if (e.target === overlayStd) closeAllOverlays();
      });
    }

    // Ao clicar em "Serviços" dentro do overlay principal, abre overlay de serviços
    if (servMobile && overlayServices) {
      servMobile.addEventListener('click', (e) => {
        e.preventDefault();
        openOverlayServices();
      });

      overlayServices.addEventListener('click', (e) => {
        if (e.target === overlayServices) {
          // Fecha overlay serviços e volta para overlay principal (se menu ainda aberto)
          closeOverlayServices(true);
        }
      });
    }

    // Em mobile, clique em um .service-item-menu dentro do overlay_services mantém overlay aberto
    // (o bindServiceItems já cuida da ativação; aqui só garantimos que o overlay_services esteja visível)
    if (overlayServices) {
      overlayServices.addEventListener('click', (e) => {
        const item = e.target.closest('.service-item-menu');
        if (item) {
          // já ativado por bindServiceItems; nada extra aqui
        }
      });
    }
  }

  function openOverlayServices() {
    if (!overlayServices) return;
    // Fechar overlay principal visualmente
    if (overlayStd) {
      overlayStd.style.display = 'none';
      overlayStd.setAttribute('aria-hidden', 'true');
    }
    overlayServices.style.display = 'block';
    overlayServices.setAttribute('aria-hidden', 'false');
    document.body.classList.add('tmco-services-open');
  }

  function closeOverlayServices(backToMain) {
    if (!overlayServices) return;
    overlayServices.style.display = '';
    overlayServices.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('tmco-services-open');

    if (backToMain && overlayStd && document.body.classList.contains('tmco-mobile-open')) {
      overlayStd.style.display = 'block';
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

  // ===== Fechamentos globais (ESC + clique fora da mega) =====
  function bindGlobalClosers() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        closeMega();
        closeAllOverlays();
      }
    });

    // Click fora da mega fecha (somente se aberta)
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
