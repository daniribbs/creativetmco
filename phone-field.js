(function(){
  // Alvo do campo de telefone no Webflow
  const SELECTOR = '#telefone, input[name="telefone"]';

  function ready(fn){
    if(document.readyState !== 'loading'){ fn(); }
    else { document.addEventListener('DOMContentLoaded', fn); }
  }

  function onlyDigits(s){
    return (s || '').replace(/\D/g, '');
  }

  // Máscara local com hífen por DDI
  function maskLocalByDDI(cc, digits){
    if (cc === '55') {
      const d = digits.slice(0, 11);
      if (d.length <= 2) return d;
      if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`;
      if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
      return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7,11)}`;
    }

    if (cc === '1') {
      const d = digits.slice(0, 10);
      if (d.length <= 3) return d;
      if (d.length <= 6) return `(${d.slice(0,3)}) ${d.slice(3)}`;
      return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6,10)}`;
    }

    const d = digits.slice(0, 12);
    if (d.length <= 3) return d;
    if (d.length <= 6) return d.slice(0,3) + ' ' + d.slice(3);
    if (d.length <= 10) return d.slice(0,3) + ' ' + d.slice(3,6) + '-' + d.slice(6);
    return d.slice(0,4) + ' ' + d.slice(4,7) + '-' + d.slice(7,12);
  }

  function enhanceField(tel){
    if (!tel || tel._ctmEnhanced) return;

    tel._ctmEnhanced = true;

    // wrapper lado a lado
    var wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.gap = '6px';
    wrapper.style.alignItems = 'center';
    wrapper.style.width = '100%';

    // input DDI
    var cc = document.createElement('input');
    cc.type = 'text';
    cc.name = 'country_code';
    cc.placeholder = '+55';
    cc.inputMode = 'numeric';
    cc.autocomplete = 'tel-country-code';
    cc.maxLength = 4;
    cc.pattern = '^\\+?\\d{1,3}$';
    cc.style.width = '72px';
    cc.className = 'field-form w-input';

    // insere wrapper no lugar do campo original
    var parent = tel.parentNode;
    parent.insertBefore(wrapper, tel);
    wrapper.appendChild(cc);
    wrapper.appendChild(tel);

    // higiene no campo local
    ['pattern', 'title'].forEach(function(a){
      tel.removeAttribute(a);
    });

    tel.type = 'text';
    tel.inputMode = 'tel';
    tel.autocomplete = 'tel';
    tel.placeholder = tel.placeholder || 'Seu número';

    // hidden E.164
    var form = tel.closest('form');

    if (form && !tel._ctmHiddenE164) {
      var origName = tel.getAttribute('name') || 'telefone';

      var hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.name = origName;

      // evita duplicar telefone no submit
      tel.setAttribute('name', origName + '_local');

      form.insertBefore(hidden, form.firstChild);

      tel._ctmHiddenE164 = hidden;
    }

    // valida/normaliza DDI
    cc.addEventListener('input', function(){
      var v = (cc.value || '').replace(/[^\d+]/g, '');

      if (v.indexOf('+') > 0) {
        v = v.replace(/\+/g, '');
      }

      if (v && v[0] !== '+') {
        v = '+' + v.replace(/\+/g, '');
      }

      var sign = v.startsWith('+') ? '+' : '';
      v = sign + v.replace(/\D/g, '').slice(0, 3);

      cc.value = v;

      const code = (cc.value.match(/^\+([1-9]\d{0,2})/)?.[1]) || '55';
      tel.value = maskLocalByDDI(code, onlyDigits(tel.value));
    });

    // só números no campo local
    tel.addEventListener('beforeinput', function(e){
      if (e.inputType === 'insertText' && /\D/.test(e.data)) {
        e.preventDefault();
      }
    });

    function remaskLocal(){
      const code = (cc.value.match(/^\+([1-9]\d{0,2})/)?.[1]) || '55';
      tel.value = maskLocalByDDI(code, onlyDigits(tel.value));
    }

    tel.addEventListener('input', remaskLocal);

    tel.addEventListener('paste', function(e){
      e.preventDefault();

      var t = (e.clipboardData || window.clipboardData).getData('text') || '';
      var digits = onlyDigits(t);

      var m = t.trim().match(/^\+([1-9]\d{0,2})/);

      if (m && digits.startsWith(m[1])) {
        digits = digits.slice(m[1].length);
      }

      tel.value = digits;
      remaskLocal();
    });

    // DDI auto por IP
    function setCCOnce(val){
      if (!cc.value.trim()) {
        var code = String(val || '').replace(/[^\d]/g, '').slice(0, 3);

        if (code) {
          cc.value = '+' + code;
        }

        const dd = code || '55';

        if (!tel.value) {
          tel.placeholder = dd === '55'
            ? '(11) 98765-4321'
            : dd === '1'
              ? '(415) 555-1234'
              : 'Seu número';
        }

        tel.value = maskLocalByDDI(dd, onlyDigits(tel.value));
      }
    }

    fetch('https://ipwho.is/?fields=calling_code')
      .then(function(r){ return r.json(); })
      .then(function(d){
        if (d && d.calling_code) {
          setCCOnce(d.calling_code);
        }
      })
      .catch(function(){});

    fetch('https://ipapi.co/json/')
      .then(function(r){ return r.json(); })
      .then(function(d){
        if (d && d.country_calling_code) {
          setCCOnce(d.country_calling_code);
        }
      })
      .catch(function(){});

    // Submit → gera E.164 no hidden
    if (form) {
      form.addEventListener('submit', function(){
        var ccDigits = (cc.value || '').replace(/\D/g, '');
        var finalCC = ccDigits || '55';

        var raw = (tel.value || '').trim();
        var telDigits = onlyDigits(raw);

        var m = raw.match(/^\+([1-9]\d{0,2})/);

        if (m && telDigits.startsWith(m[1])) {
          telDigits = telDigits.slice(m[1].length);
        }

        if (tel._ctmHiddenE164) {
          tel._ctmHiddenE164.value = telDigits ? ('+' + finalCC + telDigits) : '';
        }
      });
    }
  }

  function enhanceAll(root){
    var fields = (root || document).querySelectorAll(SELECTOR);

    fields.forEach(function(tel){
      enhanceField(tel);
    });
  }

  ready(function(){
    enhanceAll(document);

    // útil caso o Webflow injete algum formulário depois do carregamento
    var observer = new MutationObserver(function(){
      enhanceAll(document);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
})();
