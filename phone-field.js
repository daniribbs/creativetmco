(function(){
  var SELECTOR = 'input[name="telefone"]:not([type="hidden"]), #telefone:not([type="hidden"])';

  function ready(fn){
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  function onlyDigits(s){
    return String(s || '').replace(/\D/g, '');
  }

  function maskLocalByDDI(cc, digits){
    if (cc === '55') {
      var br = digits.slice(0, 11);

      if (br.length <= 2) return br;
      if (br.length <= 6) return '(' + br.slice(0,2) + ') ' + br.slice(2);
      if (br.length <= 10) return '(' + br.slice(0,2) + ') ' + br.slice(2,6) + '-' + br.slice(6);

      return '(' + br.slice(0,2) + ') ' + br.slice(2,7) + '-' + br.slice(7,11);
    }

    if (cc === '1') {
      var us = digits.slice(0, 10);

      if (us.length <= 3) return us;
      if (us.length <= 6) return '(' + us.slice(0,3) + ') ' + us.slice(3);

      return '(' + us.slice(0,3) + ') ' + us.slice(3,6) + '-' + us.slice(6,10);
    }

    var d = digits.slice(0, 12);

    if (d.length <= 3) return d;
    if (d.length <= 6) return d.slice(0,3) + ' ' + d.slice(3);
    if (d.length <= 10) return d.slice(0,3) + ' ' + d.slice(3,6) + '-' + d.slice(6);

    return d.slice(0,4) + ' ' + d.slice(4,7) + '-' + d.slice(7,12);
  }

  function getCountryCode(ccInput){
    var match = String(ccInput.value || '').match(/^\+([1-9]\d{0,2})/);
    return match ? match[1] : '55';
  }

  function normalizeCC(value){
    var digits = onlyDigits(value).slice(0, 3);
    return digits ? '+' + digits : '';
  }

  function enhanceField(tel){
    if (!tel) return;
    if (tel.type === 'hidden') return;
    if (tel.getAttribute('data-ctm-phone-enhanced') === '1') return;
    if (tel.getAttribute('data-ctm-phone-hidden') === '1') return;

    tel.setAttribute('data-ctm-phone-enhanced', '1');

    var form = tel.closest ? tel.closest('form') : null;
    var originalName = tel.getAttribute('name') || 'telefone';

    var wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.gap = '6px';
    wrapper.style.alignItems = 'center';
    wrapper.style.width = '100%';

    var cc = document.createElement('input');
    cc.type = 'text';
    cc.name = originalName + '_ddi';
    cc.placeholder = '+55';
    cc.value = '+55';
    cc.inputMode = 'numeric';
    cc.autocomplete = 'tel-country-code';
    cc.maxLength = 4;
    cc.pattern = '^\\+?\\d{1,3}$';
    cc.className = 'field-form w-input';
    cc.style.width = '72px';
    cc.style.flex = '0 0 72px';
    cc.setAttribute('aria-label', 'Código do país');

    var parent = tel.parentNode;
    parent.insertBefore(wrapper, tel);
    wrapper.appendChild(cc);
    wrapper.appendChild(tel);

    tel.style.flex = '1';

    tel.removeAttribute('pattern');
    tel.removeAttribute('title');

    tel.type = 'text';
    tel.inputMode = 'tel';
    tel.autocomplete = 'tel';
    tel.placeholder = tel.placeholder || '(11) 98765-4321';

    var hidden = null;

    if (form) {
      hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.name = originalName;
      hidden.setAttribute('data-ctm-phone-hidden', '1');

      tel.setAttribute('name', originalName + '_local');

      form.insertBefore(hidden, form.firstChild);
    }

    function remaskLocal(){
      var code = getCountryCode(cc);
      tel.value = maskLocalByDDI(code, onlyDigits(tel.value));
    }

    function syncHidden(){
      if (!hidden) return;

      var ccDigits = onlyDigits(cc.value) || '55';
      var telDigits = onlyDigits(tel.value);

      hidden.value = telDigits ? '+' + ccDigits + telDigits : '';
    }

    cc.addEventListener('input', function(){
      cc.value = normalizeCC(cc.value);
      remaskLocal();
      syncHidden();
    });

    tel.addEventListener('beforeinput', function(e){
      if (e.inputType === 'insertText' && /\D/.test(e.data || '')) {
        e.preventDefault();
      }
    });

    tel.addEventListener('input', function(){
      remaskLocal();
      syncHidden();
    });

    tel.addEventListener('paste', function(e){
      e.preventDefault();

      var text = (e.clipboardData || window.clipboardData).getData('text') || '';
      var raw = text.trim();
      var digits = onlyDigits(raw);

      var match = raw.match(/^\+([1-9]\d{0,2})/);

      if (match) {
        cc.value = '+' + match[1];

        if (digits.indexOf(match[1]) === 0) {
          digits = digits.slice(match[1].length);
        }
      }

      tel.value = digits;
      remaskLocal();
      syncHidden();
    });

    if (form) {
      form.addEventListener('submit', function(){
        syncHidden();
      }, true);
    }

    remaskLocal();
    syncHidden();
  }

  function enhanceAll(){
    var fields = document.querySelectorAll(SELECTOR);

    for (var i = 0; i < fields.length; i++) {
      enhanceField(fields[i]);
    }
  }

  ready(function(){
    enhanceAll();

    // rodadas leves para casos em que o Webflow renderiza algum form depois
    setTimeout(enhanceAll, 500);
    setTimeout(enhanceAll, 1500);
  });
})();
