
document.addEventListener('DOMContentLoaded', () => {
    if (window.__blogFiltersInit) return;
    window.__blogFiltersInit = true;
  
    const MOBILE_BP = 991;
    const mql = matchMedia(`(max-width: ${MOBILE_BP}px)`);
  
    // =========================
    // 1) FILTER (botões -> blog)
    // =========================
  
    const selectList = document.querySelector('.select-case-list');
    const blogItems = Array.from(document.querySelectorAll('.case-item'));
  
    if (selectList && blogItems.length) {
  
      // Salva display original dos cards
      blogItems.forEach(item => {
        if (!item.dataset.origDisplay) {
          item.dataset.origDisplay = getComputedStyle(item).display;
        }
      });
  
      // Pega os botões
      const filterLinks = Array.from(
        selectList.querySelectorAll('.select-case-button')
      );
  
      function getFilterValue(linkEl) {
        return (linkEl.getAttribute('servico') || '').trim();
      }
  
      // Lê a categoria dinâmica de cada post
      function getBlogCategory(blogItem) {
        const category = blogItem.querySelector('.case-rel_tag-text');
        return category ? category.textContent.trim() : '';
      }
  
      function showAll() {
        blogItems.forEach(item => {
          item.style.display = item.dataset.origDisplay;
        });
      }
  
      function applyFilter(value) {
        if (!value || value === '__all__') {
          return showAll();
        }
  
        const v = value.toLowerCase();
  
        blogItems.forEach(item => {
          const category = getBlogCategory(item).toLowerCase();
  
          item.style.display =
            category === v ? item.dataset.origDisplay : 'none';
        });
      }
  
      function setActive(linkEl) {
        filterLinks.forEach(a => a.classList.remove('is-active'));
        linkEl.classList.add('is-active');
      }
  
      filterLinks.forEach(link => {
        link.addEventListener('click', e => {
          e.preventDefault();
  
          const value = getFilterValue(link);
  
          setActive(link);
          applyFilter(value);
        });
      });
  
      // Inicial: mostra todos
      showAll();
    }
  
    // =========================
    // 2) MOBILE DROPDOWN
    // =========================
  
    const STYLE_ID = 'tmco-blog-mobile-dropdown-css';
  
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement('style');
      style.id = STYLE_ID;
  
      style.textContent = `
        .select-cases-box.is-mobile .select-case-wrap {
          display: none;
        }
  
        .select-cases-box.is-mobile.is-open .select-case-wrap {
          display: block;
        }
  
        .select-cases-box .ico-select-case {
          transition: transform 200ms ease;
          transform-origin: 50% 50%;
        }
  
        .select-cases-box.is-open .ico-select-case {
          transform: rotate(180deg);
        }
      `;
  
      document.head.appendChild(style);
    }
  
    const boxes = Array.from(
      document.querySelectorAll('.select-cases-box')
    );
  
    const isMobile = () => mql.matches;
  
    boxes.forEach(box => {
      const labelLink = box.querySelector('.drop-case_label');
      const labelText = box.querySelector('.drop-case_label .text-button-yel');
      const wrap = box.querySelector('.select-case-wrap');
      const list = box.querySelector('.select-case-list');
  
      if (!labelLink || !wrap || !list) return;
  
      labelLink.setAttribute('aria-expanded', 'false');
  
      const close = () => {
        box.classList.remove('is-open');
        labelLink.setAttribute('aria-expanded', 'false');
      };
  
      const toggle = () => {
        const willOpen = !box.classList.contains('is-open');
  
        box.classList.toggle('is-open', willOpen);
        labelLink.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      };
  
      labelLink.addEventListener('click', e => {
        if (!isMobile()) return;
  
        e.preventDefault();
        toggle();
      });
  
      list.addEventListener('click', e => {
        if (!isMobile()) return;
  
        const btn = e.target.closest('.select-case-button');
        if (!btn) return;
  
        if (labelText) {
          const selected = (btn.textContent || '').trim();
          const servico = (btn.getAttribute('servico') || '').trim();
  
          labelText.textContent =
            servico === '__all__' ? 'Filtre por categoria' : selected;
        }
  
        close();
      });
  
      document.addEventListener('click', e => {
        if (!isMobile()) return;
        if (!box.classList.contains('is-open')) return;
        if (box.contains(e.target)) return;
  
        close();
      });
  
      const applyMode = () => {
        if (isMobile()) {
          box.classList.add('is-mobile');
          close();
        } else {
          box.classList.remove('is-mobile');
          box.classList.remove('is-open');
          labelLink.setAttribute('aria-expanded', 'false');
        }
      };
  
      applyMode();
      mql.addEventListener('change', applyMode);
    });
  });
  