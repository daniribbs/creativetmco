/**
 * tmco-menu-close-on-cta.js
 * Fecha o menu (desktop mega + mobile overlays) ao clicar nos CTAs de contato do menu,
 * respeitando o contexto (não afeta botões iguais fora do menu).
 *
 * Coloque ESTE script depois do tmco-menu.js (ou no Footer Code do Webflow).
 */
(function () {
  'use strict';

  const $one = (sel, ctx = document) => ctx.querySelector(sel);

  // Fecha a mega respeitando o tmco-menu.js (pra resetar locked/aria etc.)
  function closeMegaViaTriggerIfOpen() {
    const mega = $one('.mega');
    if (!mega || !mega.classList.contains('open')) return;

    // Preferível: clicar no gatilho "Serviços" (usa o próprio closeMega do arquivo principal)
    const triggerA = $one('.nav__item.serv a');
    if (triggerA) {
      triggerA.click(); // como está aberto, o toggle fecha e destrava (locked=false) no tmco-menu.js
      return;
    }

    // Fallback: fecha na marra (caso raro)
    mega.classList.remove('open');
    mega.style.display = 'none';
    mega.setAttribute('aria-hidden', 'true');
  }

  // Fecha overlays mobile (principal + serviços) + ajusta ícones do toggle
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

    // Atualiza ícones do toggle (replica a lógica do tmco-menu.js)
    const iconHamb = $one('.toggle .hamb');
    const iconClose = $one('.toggle .close');
    const overlayActive =
      document.body.classList.contains('tmco-mobile-open') ||
      document.body.classList.contains('tmco-services-open');

    if (iconHamb) iconHamb.style.display = overlayActive ? 'none' : 'block';
    if (iconClose) iconClose.style.display = overlayActive ? 'block' : 'none';
  }

  // Delegação: pega cliques nos CTAs, mas só dentro do contexto do menu
  document.addEventListener(
    'click',
    function (e) {
      const a = e.target.closest('a.button-yellow_sm');
      if (!a) return;

      const inMega = !!a.closest('.mega');
      const inOverlayStd = !!a.closest('.overlay.std');
      const inOverlayServices = !!a.closest('.overlay_services.overlay');

      // 1) Desktop: qualquer .button-yellow_sm dentro da mega fecha a mega
      if (inMega) {
        closeMegaViaTriggerIfOpen();
        return;
      }

      // 2) Mobile / overlay serviços: apenas .button-yellow_sm.no-bg fecha tudo
      if (inOverlayServices && a.classList.contains('no-bg')) {
        closeAllMobileOverlays();
        return;
      }

      // 3) Mobile / overlay principal: apenas .button-yellow_sm.menu fecha tudo
      if (inOverlayStd && a.classList.contains('menu')) {
        closeAllMobileOverlays();
        return;
      }
    },
    true // capture: fecha antes de handlers de smooth scroll/rotas, sem impedir navegação
  );
})();
