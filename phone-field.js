(function(){
  var PHONE_SELECTOR = 'input[name="telefone"]:not([type="hidden"]), input#telefone:not([type="hidden"])';

  function ready(fn){
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  function onlyDigits(value){
    return String(value || '').replace(/\D/g, '');
  }

  function maskLocalByDDI(cc, digits){
    if (cc === '55') {
      var d = digits.slice(0, 11);

      if (d.length <= 2) return d;
      if (d.length <= 6) return '(' + d.slice(0,2) + ') ' + d.slice(2);
      if (d.length <= 10) return '(' + d.slice(0,2) + ') ' + d.slice(2,6) + '-' + d.slice(6);

      return '(' + d.slice(0,2) + ') ' + d.slice(2,7) + '-' + d.slice(7,11);
    }

    if (cc === '1') {
      var u = digits.slice(0, 10);

      if (u.length <= 3) return u;
      if (u.length <= 6) return '(' + u.slice(0,3) + ') ' + u.slice(3);

      return '(' + u.slice(0,3) + ') ' + u.slice(3,6) + '-' + u.slice(6,10);
    }

    var x = digits.slice(0, 12);

    if (x.length <= 3) return x;
    if (x.length <= 6) return x.slice(0,3) + ' ' + x.slice(3);
    if (x.length <= 10) return x.slice(0,3) + ' ' + x.slice(3,6) + '-' + x.slice(6);

    return x.slice(0,4) + ' ' + x.slice(4,7) + '-' + x.slice(7,12);
  }

  function normalizeCC(value){
    var digits = onlyDigits(value).slice(0, 3);
    return digits ? '+' + digits : '+55';
  }

  function getCC(ccInput){
    var match = String(ccInput.value || '').match(/^\+([1-9]\d{0,2})/);
    return match ? match[1] : '55';
  }

  function cleanupPreviousVersions(){
    /**
     * Remove campos DDI criados por versões anteriores.
     */
    var generatedDDIs = document.querySelectorAll(
      'input[name="country_code"], input[name="telefone_ddi"], input[data-ctm-phone-ddi="1"]'
    );

    for (var i = 0; i < generatedDDIs.length; i++) {
      var ddi = generatedDDIs[i];
      var wrapper = ddi.parentNode;
      var possibleTel = wrapper ? wrapper.querySelector('input[name="telefone_local"], input#telefone') : null;

      if (
        wrapper &&
        possibleTel &&
        wrapper.classList &&
        (
          wrapper.classList.contains('ctm-phone-wrap') ||
          wrapper.style.display === 'flex'
        )
      ) {
        wrapper.parentNode.insertBefore(possibleTel, wrapper);
        wrapper.parentNode.removeChild(wrapper);
      } else if (ddi.parentNode) {
        ddi.parentNode.removeChild(ddi);
      }
    }

    /**
     * Remove hidden criado por versões anteriores.
     */
    var generatedHiddens = document.querySelectorAll(
      'input[data-ctm-phone-hidden="1"], form input[type="hidden"][name="telefone"]'
    );

    for (var h = 0; h < generatedHiddens.length; h++) {
      var hidden = generatedHiddens[h];

      if (hidden.parentNode) {
        hidden.parentNode.removeChild(hidden);
      }
    }

    /**
     * Restaura o campo visível para name="telefone".
     */
    var localFields = document.querySelectorAll('input[name="telefone_local"]');

    for (var l = 0; l < localFields.length; l++) {
      localFields[l].setAttribute('name', 'telefone');
      localFields[l].removeAttribute('data-ctm-phone-enhanced');
      localFields[l].style.flex = '';
    }

    /**
     * Remove wrappers vazios que possam ter sobrado.
     */
    var wrappers = document.querySelectorAll('.ctm-phone-wrap');

    for (var w = 0; w < wrappers.length; w++) {
      var wrap = wrappers[w];

      if (!wrap.children.length && wrap.parentNode) {
        wrap.parentNode.removeChild(wrap);
      }
    }
  }

  function enhancePhoneField(tel){
    if (!tel) return;
    if (tel.type === 'hidden') return;
    if (tel.getAttribute('data-ctm-phone-enhanced') === '1') return;

    var form = tel.closest ? tel.closest('form') : null;
    if (!form) return;

    tel.setAttribute('data-ctm-phone-enhanced', '1');

    var originalName = 'telefone';

    var wrapper = document.createElement('div');
    wrapper.className = 'ctm-phone-wrap';
    wrapper.style.display = 'flex';
    wrapper.style.gap = '6px';
    wrapper.style.alignItems = 'center';
    wrapper.style.width = '100%';

    var cc = document.createElement('input');
    cc.type = 'text';
    cc.name = 'telefone_ddi';
    cc.value = '+55';
    cc.placeholder = '+55';
    cc.inputMode = 'numeric';
    cc.autocomplete = 'tel-country-code';
    cc.maxLength = 4;
    cc.className = 'field-form w-input';
    cc.setAttribute('data-ctm-phone-ddi', '1');
    cc.setAttribute('aria-label', 'Código do país');

    cc.style.width = '72px';
    cc.style.flex = '0 0 72px';

    var hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.name = originalName;
    hidden.setAttribute('data-ctm-phone-hidden', '1');

    form.insertBefore(hidden, form.firstChild);

    tel.setAttribute('name', originalName + '_local');
    tel.type = 'text';
    tel.inputMode = 'tel';
    tel.autocomplete = 'tel';
    tel.removeAttribute('pattern');
    tel.removeAttribute('title');
    tel.style.flex = '1';

    if (!tel.placeholder) {
      tel.placeholder = '(11) 98765-4321';
    }

    var parent = tel.parentNode;
    parent.insertBefore(wrapper, tel);
    wrapper.appendChild(cc);
    wrapper.appendChild(tel);

    function remask(){
      var code = getCC(cc);
      tel.value = maskLocalByDDI(code, onlyDigits(tel.value));
    }

    function syncHidden(){
      var ddi = onlyDigits(cc.value) || '55';
      var phone = onlyDigits(tel.value);

      hidden.value = phone ? '+' + ddi + phone : '';
    }

    cc.addEventListener('input', function(){
      cc.value = normalizeCC(cc.value);
      remask();
      syncHidden();
    });

    tel.addEventListener('beforeinput', function(e){
      if (e.inputType === 'insertText' && /\D/.test(e.data || '')) {
        e.preventDefault();
      }
    });

    tel.addEventListener('input', function(){
      remask();
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
      remask();
      syncHidden();
    });

    form.addEventListener('submit', function(){
      syncHidden();
    }, true);

    remask();
    syncHidden();
  }

  function init(){
    cleanupPreviousVersions();

    var forms = document.querySelectorAll('form');

    for (var i = 0; i < forms.length; i++) {
      var form = forms[i];

      /**
       * Pega só 1 telefone por formulário.
       * Isso evita que campos gerados virem novos telefones.
       */
      var tel = form.querySelector(PHONE_SELECTOR);

      if (tel) {
        enhancePhoneField(tel);
      }
    }
  }

  ready(init);
})();
