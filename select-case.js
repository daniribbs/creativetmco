document.addEventListener('DOMContentLoaded', () => {
  if (window.__casesFiltersAndDropdownInit) return;
  window.__casesFiltersAndDropdownInit = true;

  const MOBILE_BP = 991; // <-- mobile é 991px (como você pediu)
  const mql = matchMedia(`(max-width: ${MOBILE_BP}px)`);

  // =========================
  // 1) FILTER (botões -> grid)
  // =========================
  const selectList = document.querySelector('.select-case-list');
  const caseItems  = Array.from(document.querySelectorAll('.case-item'));

  if (selectList && caseItems.length) {
    // salva display original pra restaurar certinho
    caseItems.forEach((item) => {
      if (!item.dataset.origDisplay) {
        item.dataset.origDisplay = getComputedStyle(item).display || 'block';
      }
    });

    // cria botão "Todos" se ainda não existir
    const hasAll = !!selectList.querySelector('.select-case-button[servico="__all__"]');
    if (!hasAll) {
      const allItem = document.createElement('div');
      allItem.className = 'select-case-item w-dyn-item';
      allItem.setAttribute('role', 'listitem');
      allItem.innerHTML = `
        <a servico="__all__" href="#" class="select-case-button w-inline-block is-active">
          <div class="text-button-white">Todos</div>
        </a>
      `;
      selectList.insertBefore(allItem, selectList.firstChild);
    }

    // agora pega todos os botões (inclui "Todos") - escopado ao selectList
    const filterLinks = Array.from(selectList.querySelectorAll('.select-case-button'));

    function getFilterValue(linkEl) {
      return (linkEl.getAttribute('servico') || '').trim();
    }

    function getCaseTags(caseItemEl) {
      // pega apenas tags do stack (evita .country)
      return Array.from(caseItemEl.querySelectorAll('.stack-tag-item .case-rel_tag-text'))
        .map(el => el.textContent.trim())
        .filter(Boolean);
    }

    function showAll() {
      caseItems.forEach(item => (item.style.display = item.dataset.origDisplay));
    }

    function applyFilter(value) {
      if (!value || value === '__all__') return showAll();

      const v = value.toLowerCase();

      caseItems.forEach((item) => {
        const tags = getCaseTags(item).map(t => t.toLowerCase());
        const match = tags.includes(v);
        item.style.display = match ? item.dataset.origDisplay : 'none';
      });
    }

    function setActive(linkEl) {
      filterLinks.forEach(a => a.classList.remove('is-active'));
      linkEl.classList.add('is-active');
    }

    filterLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const value = getFilterValue(link);
        setActive(link);
        applyFilter(value);
      });
    });

    // inicial: mostra tudo
    showAll();
  }

  // =================================
  // 2) MOBILE DROPDOWN (até 991px)
  // =================================
  const STYLE_ID = 'tmco-cases-mobile-dropdown-css';
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      /* dropdown mobile (ativado via .is-mobile no box) */
      .select-cases-box.is-mobile .select-case-wrap { display: none; }
      .select-cases-box.is-mobile.is-open .select-case-wrap { display: block; }

      .select-cases-box .ico-select-case {
        transition: transform 200ms ease;
        transform-origin: 50% 50%;
      }
      .select-cases-box.is-open .ico-select-case { transform: rotate(180deg); }
    `;
    document.head.appendChild(style);
  }

  const boxes = Array.from(document.querySelectorAll('.select-cases-box'));
  if (!boxes.length) return;

  const isMobile = () => mql.matches;

  boxes.forEach((box) => {
    const labelLink = box.querySelector('.drop-case_label');
    const labelText = box.querySelector('.drop-case_label .text-button-yel');
    const wrap      = box.querySelector('.select-case-wrap');
    const list      = box.querySelector('.select-case-list');

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

    // clique no rótulo
    labelLink.addEventListener('click', (e) => {
      if (!isMobile()) return; // no desktop deixa normal
      e.preventDefault();
      toggle();
    });

    // clique em uma opção
    list.addEventListener('click', (e) => {
      if (!isMobile()) return;

      const btn = e.target.closest('.select-case-button');
      if (!btn) return;

      // atualiza o texto do "rótulo" com o selecionado
      if (labelText) {
        const selected = (btn.textContent || '').trim();
        const servico = (btn.getAttribute('servico') || '').trim();
        labelText.textContent = servico === '__all__' ? 'Filtre por serviço' : selected;
      }

      // fecha após selecionar (sem impedir o JS do filtro)
      close();
    });

    // fecha ao clicar fora
    document.addEventListener('click', (e) => {
      if (!isMobile()) return;
      if (!box.classList.contains('is-open')) return;
      if (box.contains(e.target)) return;
      close();
    });

    // alterna modo mobile/desktop (pra não quebrar em resize)
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
    mql.addEventListener('change', applyMode); // <-- 991px aqui também
  });
});
