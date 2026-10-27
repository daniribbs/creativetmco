(function () {
    'use strict';
  
    var mq = window.matchMedia('(max-width: 991px)'); 
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    var body = document.body;
  
    function cssVar(name) {
      return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    }
    function toMs(v, fallback) {
      if (!v) return fallback;
      return v.indexOf('ms') > -1 ? parseFloat(v) : parseFloat(v) * 1000;
    }
  
    function estado() {
      var serv = body.classList.contains('tmco-services-open');
      var main = body.classList.contains('tmco-mobile-open');
      return { std: main || serv, serv: serv };
    }
  
    function cancelar(el) {
      if (el && el._tmcoCancel) el._tmcoCancel();
    }
  
    function subir(el) {
      if (!el || el._tmcoAnim || reduce.matches || !el.animate) return;
  
      var duracao = toMs(cssVar('--tmco-menu-out'), 700);
      var easing = cssVar('--tmco-menu-ease') || 'cubic-bezier(.65,0,.35,1)';
      var displayOriginal = el.style.getPropertyValue('display');
  
      // mantém o overlay visível enquanto sobe
      el.style.setProperty('display', 'flex', 'important');
      el.style.setProperty('pointer-events', 'none', 'important');
  
      var anim = el.animate(
        [
          { transform: 'translateY(0)', visibility: 'visible' },
          { transform: 'translateY(-100%)', visibility: 'visible' }
        ],
        { duration: duracao, easing: easing, fill: 'forwards' }
      );
      el._tmcoAnim = anim;
  
      function limpar() {
        anim.cancel();
        el._tmcoAnim = null;
        el._tmcoCancel = null;
        el.style.removeProperty('pointer-events');
        if (displayOriginal) el.style.setProperty('display', displayOriginal);
        else el.style.removeProperty('display');
      }
  
      el._tmcoCancel = limpar;    
    }
  
    var anterior = estado();
  
    new MutationObserver(function () {
      var atual = estado();
      var std = document.querySelector('.overlay.std');
      var serv = document.querySelector('.overlay_services.overlay');
  
      if (mq.matches) {
        if (anterior.std && !atual.std) subir(std);
        if (anterior.serv && !atual.serv) subir(serv);
      }
      if (atual.std) cancelar(std);
      if (atual.serv) cancelar(serv);
  
      anterior = atual;
    }).observe(body, { attributes: true, attributeFilter: ['class'] });
  })();