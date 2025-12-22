/**
 * tmco-menu-close-on-cta.js
 * Fecha o menu (desktop mega + mobile overlays) ao clicar nos CTAs/links do menu,
 * respeitando o contexto (não afeta links/botões iguais fora do menu).
 *
 * Regras:
 * - Desktop: qualquer .button-yellow_sm dentro da .mega fecha a mega.
 * - Mobile overlay serviços: .button-yellow_sm.no-bg fecha tudo.
 * - Mobile overlay principal: .button-yellow_sm.menu fecha tudo.
 * - Mobile overlay principal: links "Sobre" (#sobre) e "Cases" (#cases) fecham tudo.
 *   (mas NÃO fecha ao clicar em "Serviços", pois ele abre o overlay de serviços).
 *
 * Coloque ESTE script depois do tmco-menu.js (ou no Footer Code do Webflow).
 */
(function () {
  'use strict';

  const $one = (sel, ctx = document) => ctx.querySelector(sel);

  function updateToggleIcons() {
    const iconHamb = $one('.toggle .hamb');
    const iconClose = $one('.toggle .close');
    const overlayActive =
      document.body.classList.contains('tmco-mobile-open') ||
      document.body.classList.contains('tmco-services-open');

    if (iconHamb) iconHamb.style.display = overlayActive ? 'none' : 'block';
    if (iconClose) iconClose.style.display = overlayActive ? 'block' : 'none';
  }

  // Fecha a mega respeitando o tmco-menu.js (pra resetar locked/aria etc.)
  function closeMegaViaTriggerIfOpen() {
    const mega = $one('.mega');
    if (!mega || !mega.classList.contains('open')) return;

    // Preferível: clicar no gatilho "Serviços"
    const triggerA = $one('.nav__item.serv a');
    if (triggerA) {
      triggerA.click(); // como está aberto, o toggle fecha no tmco-menu.js
      return;
    }

    // Fallback
    mega.classList.remove('open');
    mega.style.display = 'none';
    mega.setAttribute('aria-hidden', 'true');
  }

  // Fecha overlays mobile (principal + serviços)
  function closeAllMobileOverlays() {
    const overlayStd = $one('.overlay.std');
    const overlayServices = $one('.overlay_services.overlay');

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

  // Helper: identifica se é o link "Serviços" do overlay principal
  function isServicesLinkInStdOverlay(a) {
    if (!a) return false;
    const li = a.closest('.overlay.std .nav__item.serv.mobile');
    // garante que é aquele item e não um CTA qualquer
    return !!li && a.classList.contains('nav__link');
  }

  // Delegação: pega cliques, mas só dentro do contexto do menu
  document.addEventListener(
    'click',
    function (e) {
      const a = e.target.closest('a');
      if (!a) return;

      const inMega = !!a.closest('.mega');
      const inOverlayStd = !!a.closest('.overlay.std');
      const inOverlayServices = !!a.closest('.overlay_services.overlay');

      // 1) Desktop: CTAs dentro da mega fecham a mega
      if (inMega) {
        const btn = a.closest('a.button-yellow_sm');
        if (btn) closeMegaViaTriggerIfOpen();
        return;
      }

      // 2) Mobile / overlay serviços: CTA no-bg fecha tudo
      if (inOverlayServices) {
        const btn = a.closest('a.button-yellow_sm');
        if (btn && btn.classList.contains('no-bg')) {
          closeAllMobileOverlays();
        }
        return;
      }

      // 3) Mobile / overlay principal
      if (inOverlayStd) {
        // 3.1 CTA "Fale com a gente" (button-yellow_sm.menu) fecha
        const btn = a.closest('a.button-yellow_sm');
        if (btn && btn.classList.contains('menu')) {
          closeAllMobileOverlays();
          return;
        }

        // 3.2 Links "Sobre" e "Cases" fecham também
        // (mas NÃO fecha no clique de "Serviços")
        if (a.classList.contains('nav__link')) {
          if (isServicesLinkInStdOverlay(a)) return; // deixa o tmco-menu.js abrir o overlay de serviços
          closeAllMobileOverlays();
          return;
        }
      }
    },
    true // capture: fecha antes de smooth-scroll/handlers, sem impedir navegação
  );
})();
