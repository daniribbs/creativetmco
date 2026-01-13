(function(){
  // Alvo do campo de telefone no Webflow
  const SELECTOR = '#telefone, input[name="telefone"]';

  function ready(fn){
    if(document.readyState!=='loading'){ fn(); }
    else { document.addEventListener('DOMContentLoaded', fn); }
  }
  function onlyDigits(s){ return (s||'').replace(/\D/g,''); }

  // Máscara local com hífen por DDI
  function maskLocalByDDI(cc, digits){
    if (cc === '55') {
      const d = digits.slice(0,11);
      if (d.length <= 2) return d;
      if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`;
      if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
      return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7,11)}`;
    }
    if (cc === '1') {
      const d = digits.slice(0,10);
      if (d.length <= 3) return d;
      if (d.length <= 6) return `(${d.slice(0,3)}) ${d.slice(3)}`;
      return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6,10)}`;
    }
    const d = digits.slice(0,12);
    if (d.length <= 3) return d;
    if (d.length <= 6) return d.slice(0,3) + ' ' + d.slice(3);
    if (d.length <= 10) return d.slice(0,3) + ' ' + d.slice(3,6) + '-' + d.slice(6);
    return d.slice(0,4) + ' ' + d.slice(4,7) + '-' + d.slice(7,12);
  }

  function enhanceOnce(root){
    var tel = (root||document).querySelector(SELECTOR);
    if(!tel || tel._ctmEnhanced) return;
    tel._ctmEnhanced = true;

    // wrapper (lado a lado)
    var wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.gap = '6px';
    wrapper.style.alignItems = 'center';
    wrapper.style.width = '100%';

    // input DDI (esquerda)
    var cc = document.createElement('input');
    cc.type = 'text';
    cc.id = 'country_code';
    cc.name = 'country_code';
    cc.placeholder = '+55';
    cc.inputMode = 'numeric';
    cc.autocomplete = 'tel-country-code';
    cc.maxLength = 4;
    cc.pattern = '^\\+?\\d{1,3}$';
    cc.style.width = '72px';
    cc.className = 'field-form w-input';

    // insere antes do campo original
    var parent = tel.parentNode;
    parent.insertBefore(wrapper, tel);
    wrapper.appendChild(cc);
    wrapper.appendChild(tel);

    // higiene no campo local
    ['pattern','title'].forEach(a=>tel.removeAttribute(a));
    tel.type = 'text';
    tel.inputMode = 'tel';
    tel.autocomplete = 'tel';
    tel.placeholder = tel.placeholder || 'Seu número';

    // ======= NOVO: hidden E.164 (não altera o input visível) =======
    var form = tel.closest('form');
    if(form && !tel._ctmHiddenE164){
      var origName = tel.getAttribute('name') || 'telefone';

      // cria hidden com o nome original
      var hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.name = origName;

      // muda o nome do campo visível para não duplicar o "telefone" no submit
      tel.setAttribute('name', origName + '_local');

      // insere hidden antes do tel (qualquer lugar dentro do form serve)
      form.insertBefore(hidden, form.firstChild);

      tel._ctmHiddenE164 = hidden;
    }

    // valida/normaliza DDI
    cc.addEventListener('input', function(){
      var v = (cc.value||'').replace(/[^\d+]/g,'');
      if (v.indexOf('+') > 0) v = v.replace(/\+/g,'');
      if (v && v[0] !== '+') v = '+' + v.replace(/\+/g,'');
      var sign = v.startsWith('+') ? '+' : '';
      v = sign + v.replace(/\D/g,'').slice(0,3);
      cc.value = v;

      const code = (cc.value.match(/^\+([1-9]\d{0,2})/)?.[1]) || '55';
      tel.value = maskLocalByDDI(code, onlyDigits(tel.value));
    });

    // só números no local; máscara com hífen
    tel.addEventListener('beforeinput', function(e){
      if (e.inputType==='insertText' && /\D/.test(e.data)) e.preventDefault();
    });

    function remaskLocal(){
      const code = (cc.value.match(/^\+([1-9]\d{0,2})/)?.[1]) || '55';
      tel.value = maskLocalByDDI(code, onlyDigits(tel.value));
    }
    tel.addEventListener('input', remaskLocal);

    tel.addEventListener('paste', function(e){
      e.preventDefault();
      var t = (e.clipboardData||window.clipboardData).getData('text')||'';

      // pega só dígitos; se vier em E.164 (+CC...), remove o CC do começo
      var digits = onlyDigits(t);
      var m = t.trim().match(/^\+([1-9]\d{0,2})/);
      if(m && digits.startsWith(m[1])) digits = digits.slice(m[1].length);

      tel.value = digits;
      remaskLocal();
    });

    // DDI auto (IP → fallback Brasil)
    function setCCOnce(val){
      if(!cc.value.trim()){
        var code = String(val||'').replace(/[^\d]/g,'').slice(0,3);
        if(code) cc.value = '+' + code;

        const dd = code || '55';
        if (!tel.value) tel.placeholder = (dd==='55') ? '(11) 98765-4321'
                              : (dd==='1') ? '(415) 555-1234'
                              : 'Seu número';
        tel.value = maskLocalByDDI(dd, onlyDigits(tel.value));
      }
    }
    fetch('https://ipwho.is/?fields=calling_code').then(r=>r.json())
      .then(d=>{ if(d && d.calling_code){ setCCOnce(d.calling_code); } })
      .catch(()=>{});
    fetch('https://ipapi.co/json/').then(r=>r.json())
      .then(d=>{ if(d && d.country_calling_code){ setCCOnce(d.country_calling_code); } })
      .catch(()=>{});

    // Submit → gera E.164 no HIDDEN (não altera tel.value, evita +55 infinito)
    if(form && !form._ctmPhoneHook){
      form.addEventListener('submit', function(){
        var ccDigits  = (cc.value || '').replace(/\D/g,'');
        var finalCC   = ccDigits || '55';

        // telDigits é sempre "local" (sem +CC) por causa do hidden approach,
        // mas ainda assim normalizamos se o usuário colou E.164 no campo.
        var raw = (tel.value || '').trim();
        var telDigits = onlyDigits(raw);

        // se o usuário colou algo tipo +55..., remove o CC colado
        var m = raw.match(/^\+([1-9]\d{0,2})/);
        if(m && telDigits.startsWith(m[1])) telDigits = telDigits.slice(m[1].length);

        // seta no hidden (o que o Webflow vai enviar)
        if(tel._ctmHiddenE164){
          tel._ctmHiddenE164.value = telDigits ? ('+' + finalCC + telDigits) : '';
        }
      });

      form._ctmPhoneHook = true;
    }
  }

  ready(function(){ enhanceOnce(document); });
})();
