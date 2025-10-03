/* tmco-menu.js — classes only (desktop + mobile) */
(function(){
  'use strict';

  const $  = (s,c=document)=>Array.from(c.querySelectorAll(s));
  const $1 = (s,c=document)=>c.querySelector(s);
  const isFine = ()=> matchMedia('(pointer:fine)').matches;

  let locked = false;   // após clique em item, hover não alterna
  let lastSlug = null;

  function bindOnce(el, ev, fn){
    if(!el) return;
    const k = `tmco-bound-${ev}`;
    if (el.dataset[k]) return;
    el.addEventListener(ev, fn);
    el.dataset[k] = '1';
  }

  function openMega(mega, triggerA){
    if(!mega) return;
    mega.classList.add('is-open');
    mega.setAttribute('aria-hidden', 'false');
    if (triggerA) triggerA.setAttribute('aria-expanded','true');
  }
  function closeMega(mega, triggerA){
    if(!mega) return;
    mega.classList.remove('is-open');
    mega.setAttribute('aria-hidden', 'true');
    if (triggerA) triggerA.setAttribute('aria-expanded','false');
    locked = false;
  }
  function toggleMega(mega, triggerA){
    mega.classList.contains('is-open') ? closeMega(mega, triggerA) : openMega(mega, triggerA);
  }

  function activateItem(el, items, panels){
    if(!el) return;
    const slug = el.getAttribute('data-slug') || '';
    items.forEach(i => { i.classList.remove('is-active'); i.setAttribute('aria-selected','false'); });
    el.classList.add('is-active'); el.setAttribute('aria-selected','true');

    panels.forEach(p => {
      const vis = p.getAttribute('data-slug') === slug;
      p.classList.toggle('is-visible', vis);
      p.setAttribute('aria-hidden', vis ? 'false' : 'true');
    });

    lastSlug = slug;
  }

  function init(){
    const servLi  = $1('.nav__item.serv');
    const servA   = servLi ? $1('a', servLi) : null;
    const mega    = $1('.mega');

    const items   = $('.service-item-menu');
    const panels  = $('.filtered-item');

    const toggleBtn = $1('.toggle');
    const ovStd     = $1('.overlay.std');
    const ovServ    = $1('.overlay_services.overlay');

    // Fallback amplo para o "Serviços" dentro do overlay principal:
    // primeiro tenta '.serv.mobile', senão procura um link com texto "Serviços"
    let servMob = $1('.serv.mobile') || $1('.overlay.std .nav__item.serv.mobile') || Array.from(document.querySelectorAll('.overlay.std a, .overlay.std .nav__item')).find(n => n.textContent?.trim().toLowerCase().startsWith('servi'));
    // Dentro do overlay de serviços, o item "opened" que volta pro principal:
    let servMobOpened = ovServ ? (ovServ.querySelector('.nav__item.serv.mobile.opened') || Array.from(ovServ.querySelectorAll('a, .nav__item')).find(n => n.textContent?.trim().toLowerCase().startsWith('servi'))) : null;

    // Container dos painéis precisa ser relative
    if (panels.length){
      const wrap = panels[0].parentElement;
      if (wrap && getComputedStyle(wrap).position === 'static'){
        wrap.style.position = 'relative';
      }
    }

    // Trigger "Serviços" (desktop)
    if (servA && mega){
      servA.setAttribute('aria-haspopup','true');
      servA.setAttribute('aria-expanded','false');
      mega.setAttribute('aria-hidden','true');

      bindOnce(servA, 'click', (e)=>{ e.preventDefault(); toggleMega(mega, servA); });

      if (isFine()){
        bindOnce(servLi, 'mouseenter', ()=> openMega(mega, servA));
        bindOnce(mega,   'mouseenter', ()=> openMega(mega, servA));
      }
    }

    // Itens da lista (click trava; teclado)
    items.forEach(it=>{
      if (!it.hasAttribute('tabindex')) it.setAttribute('tabindex','0');

      bindOnce(it, 'click', (e)=>{
        const a = e.target.closest('a'); if (a) e.preventDefault();
        e.preventDefault();
        activateItem(it, items, panels);
        locked = true;
        if (isFine()) openMega(mega, servA);
      });

      bindOnce(it, 'keydown', (e)=>{
        if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); it.click(); }
      });
    });

    // Hover delegado na mega (desktop, só se não travado)
    if (mega){
      bindOnce(mega, 'mouseover', (e)=>{
        if (!isFine()) return;
        if (!mega.classList.contains('is-open')) return;
        if (locked) return;
        if (document.body.classList.contains('tmco-services-open')) return;
        const it = e.target.closest('.service-item-menu');
        if (!it || !mega.contains(it)) return;
        const slug = it.getAttribute('data-slug') || '';
        if (slug && slug !== lastSlug) activateItem(it, items, panels);
      });
    }

    // Estado inicial
    if (items.length && panels.length){
      const active = items.find(i=>i.classList.contains('is-active')) || items[0];
      activateItem(active, items, panels);
    }

    // ===== MOBILE =====

    // Toggle abre/fecha overlay principal; fecha overlay serviços se estiver aberto
    if (toggleBtn){
      bindOnce(toggleBtn, 'click', (e)=>{
        e.preventDefault();

        if (document.body.classList.contains('tmco-services-open')){
          document.body.classList.remove('tmco-services-open');
        }

        const opening = !document.body.classList.contains('tmco-mobile-open');
        if (opening){
          document.body.classList.add('tmco-mobile-open');
          locked = false;
          closeMega(mega, servA);
        } else {
          document.body.classList.remove('tmco-mobile-open','tmco-services-open');
        }
      });
    }

    // “Serviços” no overlay principal => abre overlay de serviços
    if (servMob && ovServ){
      bindOnce(servMob, 'click', (e)=>{
        e.preventDefault();
        document.body.classList.add('tmco-services-open');
        document.body.classList.remove('tmco-mobile-open');
        locked = false;
        closeMega(mega, servA);
      });
    }

    // “Serviços (opened)” no overlay de serviços => volta pro overlay principal
    if (servMobOpened && ovServ){
      bindOnce(servMobOpened, 'click', (e)=>{
        e.preventDefault();
        document.body.classList.remove('tmco-services-open');
        document.body.classList.add('tmco-mobile-open');
      });
    }

    // Clicar no fundo dos overlays
    if (ovStd){
      bindOnce(ovStd, 'click', (e)=>{ if (e.target === ovStd) document.body.classList.remove('tmco-mobile-open','tmco-services-open'); });
    }
    if (ovServ){
      bindOnce(ovServ, 'click', (e)=>{ if (e.target === ovServ){ document.body.classList.remove('tmco-services-open'); document.body.classList.add('tmco-mobile-open'); }});
    }

    // ESC + clique fora fecham mega/overlays
    bindOnce(document, 'keydown', (e)=>{ if (e.key === 'Escape' || e.key === 'Esc'){ closeMega(mega, servA); document.body.classList.remove('tmco-mobile-open','tmco-services-open'); }});
    bindOnce(document, 'click',   (e)=>{
      if (!mega || !mega.classList.contains('is-open')) return;
      const insideMega = mega.contains(e.target);
      const onTrigger  = servLi && servLi.contains(e.target);
      if (!insideMega && !onTrigger) closeMega(mega, servA);
    });
  }

  // Rodar após o Webflow e com fallback
  function boot(){ if(boot._ran) return; boot._ran = true; init(); }
  window.Webflow = window.Webflow || [];
  window.Webflow.push(boot);
  if (document.readyState !== 'loading') setTimeout(boot, 0);
  else document.addEventListener('DOMContentLoaded', boot);

  // Debug opcional
  window.tmcoMenuDebug = {
    status:()=>({
      megaOpen: $1('.mega')?.classList.contains('is-open'),
      items: $('.service-item-menu').length,
      panels: $('.filtered-item').length,
      mobileOpen: document.body.classList.contains('tmco-mobile-open'),
      servicesOpen: document.body.classList.contains('tmco-services-open')
    }),
    open: ()=> $1('.mega')?.classList.add('is-open'),
    close:()=> $1('.mega')?.classList.remove('is-open')
  };
})();
