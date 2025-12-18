(function () {
  const WRAP_SELECTOR = '.wrap-faq';
  const ITEM_SELECTOR = '.card-faq .content-acordeon';
  const TITLE_SELECTOR = '.acordeon-title';
  const BTN_SELECTOR = '.buttons-acordeon';
  const DESC_SELECTOR = '.acordeon-description';

  function ready(fn){
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function setHeights(items){
    items.forEach(function(item){
      const desc = item.querySelector(DESC_SELECTOR);
      if (!desc) return;

      // mede o conteúdo interno de forma confiável
      // (scrollHeight funciona mesmo fechado, desde que não seja display:none)
      const h = desc.scrollHeight || 0;
      desc.style.setProperty('--state-h', h + 'px');
    });
  }

  function closeItem(item){
    item.classList.remove('is-open');
  }

  function openItem(item, allItems){
    // acordeon exclusivo
    allItems.forEach(function(other){
      if (other !== item) closeItem(other);
    });
    item.classList.add('is-open');
  }

  function toggleItem(item, allItems){
    const isOpen = item.classList.contains('is-open');
    if (isOpen) closeItem(item);
    else openItem(item, allItems);
  }

  ready(function(){
    const wrap = document.querySelector(WRAP_SELECTOR);
    if (!wrap) return;

    const items = Array.from(wrap.querySelectorAll(ITEM_SELECTOR));
    if (!items.length) return;

    // mede alturas na carga
    setHeights(items);

    // clique no título OU nos botões abre/fecha
    items.forEach(function(item){
      const title = item.querySelector(TITLE_SELECTOR);
      const btn = item.querySelector(BTN_SELECTOR);

      function handler(e){
        e.preventDefault();
        toggleItem(item, items);
      }

      if (title) title.addEventListener('click', handler);
      if (btn) btn.addEventListener('click', handler);
    });

    // recalcula alturas ao redimensionar (e quando fontes/linha mudarem)
    let t = null;
    window.addEventListener('resize', function(){
      clearTimeout(t);
      t = setTimeout(function(){
        setHeights(items);
      }, 150);
    });
  });
})();
