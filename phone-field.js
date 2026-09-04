(function () {
  var PHONE_SELECTOR =
    'input[name="telefone"]:not([type="hidden"]), input#telefone:not([type="hidden"])';

  var DDI_CACHE_KEY = 'ctm_detected_ddi_v3';
  var ddiDetectionPromise = null;

  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  function onlyDigits(value) {
    return String(value || '').replace(/\D/g, '');
  }

  /**
   * DDI padrão pela URL:
   *
   * /lps/sites-pt... = Portugal
   * qualquer outra URL = Brasil
   */
  function getDefaultDDI() {
    var path = String(window.location.pathname || '').toLowerCase();

    if (path.indexOf('/lps/sites-pt') === 0) {
      return '+351';
    }

    return '+55';
  }

  /**
   * Busca DDI salvo anteriormente.
   */
  function getCachedDDI() {
    try {
      var cached = localStorage.getItem(DDI_CACHE_KEY);

      if (cached && /^\+\d{1,3}$/.test(cached)) {
        return cached;
      }
    } catch (e) {}

    return null;
  }

  /**
   * Salva DDI para próximas páginas/visitas.
   */
  function saveCachedDDI(ddi) {
    try {
      localStorage.setItem(DDI_CACHE_KEY, ddi);
    } catch (e) {}
  }

  /**
   * Detecta o DDI pelo IP.
   *
   * IMPORTANTE:
   * esta função NÃO roda durante o carregamento.
   * Só será chamada quando o usuário interagir
   * com o telefone.
   */
  function detectDDIByIP() {
    var cached = getCachedDDI();

    if (cached) {
      return Promise.resolve(cached);
    }

    if (ddiDetectionPromise) {
      return ddiDetectionPromise;
    }

    if (!window.fetch) {
      return Promise.resolve(null);
    }

    ddiDetectionPromise = new Promise(function (resolve) {
      var controller =
        typeof AbortController !== 'undefined'
          ? new AbortController()
          : null;

      var finished = false;

      /**
       * Timeout curto.
       * Se a API demorar, simplesmente mantém
       * +55 ou +351.
       */
      var timeout = setTimeout(function () {
        if (finished) return;

        finished = true;

        if (controller) {
          try {
            controller.abort();
          } catch (e) {}
        }

        resolve(null);
      }, 1800);

      fetch('https://ipapi.co/country_calling_code/', {
        method: 'GET',
        signal: controller ? controller.signal : undefined
      })
        .then(function (response) {
          if (!response.ok) {
            throw new Error('Erro ao detectar DDI');
          }

          return response.text();
        })
        .then(function (value) {
          if (finished) return;

          finished = true;
          clearTimeout(timeout);

          var ddi = String(value || '').trim();

          if (!/^\+\d{1,3}$/.test(ddi)) {
            resolve(null);
            return;
          }

          saveCachedDDI(ddi);

          resolve(ddi);
        })
        .catch(function () {
          if (finished) return;

          finished = true;
          clearTimeout(timeout);

          resolve(null);
        });
    });

    return ddiDetectionPromise;
  }

  /**
   * Máscaras.
   */
  function maskLocalByDDI(cc, digits) {
    /**
     * Brasil
     */
    if (cc === '55') {
      var d = digits.slice(0, 11);

      if (d.length <= 2) {
        return d;
      }

      if (d.length <= 6) {
        return '(' + d.slice(0, 2) + ') ' + d.slice(2);
      }

      if (d.length <= 10) {
        return (
          '(' +
          d.slice(0, 2) +
          ') ' +
          d.slice(2, 6) +
          '-' +
          d.slice(6)
        );
      }

      return (
        '(' +
        d.slice(0, 2) +
        ') ' +
        d.slice(2, 7) +
        '-' +
        d.slice(7, 11)
      );
    }

    /**
     * EUA / Canadá
     */
    if (cc === '1') {
      var u = digits.slice(0, 10);

      if (u.length <= 3) {
        return u;
      }

      if (u.length <= 6) {
        return '(' + u.slice(0, 3) + ') ' + u.slice(3);
      }

      return (
        '(' +
        u.slice(0, 3) +
        ') ' +
        u.slice(3, 6) +
        '-' +
        u.slice(6, 10)
      );
    }

    /**
     * Portugal
     */
    if (cc === '351') {
      var p = digits.slice(0, 9);

      if (p.length <= 3) {
        return p;
      }

      if (p.length <= 6) {
        return p.slice(0, 3) + ' ' + p.slice(3);
      }

      return (
        p.slice(0, 3) +
        ' ' +
        p.slice(3, 6) +
        ' ' +
        p.slice(6, 9)
      );
    }

    /**
     * Demais países.
     *
     * Máscara genérica para não impedir
     * números internacionais válidos.
     */
    var x = digits.slice(0, 15);

    if (x.length <= 3) {
      return x;
    }

    if (x.length <= 6) {
      return x.slice(0, 3) + ' ' + x.slice(3);
    }

    if (x.length <= 10) {
      return (
        x.slice(0, 3) +
        ' ' +
        x.slice(3, 6) +
        '-' +
        x.slice(6)
      );
    }

    return (
      x.slice(0, 4) +
      ' ' +
      x.slice(4, 7) +
      '-' +
      x.slice(7)
    );
  }

  function normalizeCC(value) {
    var digits = onlyDigits(value).slice(0, 3);

    if (digits) {
      return '+' + digits;
    }

    return getDefaultDDI();
  }

  function getCC(ccInput) {
    var match = String(ccInput.value || '').match(
      /^\+([1-9]\d{0,2})/
    );

    if (match) {
      return match[1];
    }

    return onlyDigits(getDefaultDDI());
  }

  /**
   * Trata números internacionais colados.
   *
   * Ex.:
   * +5511987654321
   * +351912345678
   * +12125551234
   */
  function parseInternationalPhone(raw, currentDDI) {
    var value = String(raw || '').trim();

    if (value.charAt(0) !== '+') {
      return null;
    }

    var digits = onlyDigits(value);

    if (!digits) {
      return null;
    }

    /**
     * Primeiro testa o DDI atual.
     */
    var current = onlyDigits(currentDDI);

    if (
      current &&
      digits.indexOf(current) === 0 &&
      digits.length > current.length
    ) {
      return {
        ddi: current,
        phone: digits.slice(current.length)
      };
    }

    /**
     * DDIs de 1 dígito.
     */
    if (
      digits.charAt(0) === '1' ||
      digits.charAt(0) === '7'
    ) {
      return {
        ddi: digits.charAt(0),
        phone: digits.slice(1)
      };
    }

    /**
     * DDIs conhecidos de 2 dígitos.
     */
    var twoDigitDDIs = [
      '20',
      '27',
      '30',
      '31',
      '32',
      '33',
      '34',
      '36',
      '39',
      '40',
      '41',
      '43',
      '44',
      '45',
      '46',
      '47',
      '48',
      '49',
      '51',
      '52',
      '53',
      '54',
      '55',
      '56',
      '57',
      '58',
      '60',
      '61',
      '62',
      '63',
      '64',
      '65',
      '66',
      '81',
      '82',
      '84',
      '86',
      '90',
      '91',
      '92',
      '93',
      '94',
      '95',
      '98'
    ];

    var firstTwo = digits.slice(0, 2);

    if (twoDigitDDIs.indexOf(firstTwo) !== -1) {
      return {
        ddi: firstTwo,
        phone: digits.slice(2)
      };
    }

    /**
     * Caso contrário tenta DDI de 3 dígitos.
     */
    if (digits.length > 3) {
      return {
        ddi: digits.slice(0, 3),
        phone: digits.slice(3)
      };
    }

    return null;
  }

  /**
   * Limpa versões antigas do script.
   */
  function cleanupPreviousVersions() {
    var generatedDDIs = document.querySelectorAll(
      'input[name="country_code"], ' +
      'input[name="telefone_ddi"], ' +
      'input[data-ctm-phone-ddi="1"]'
    );

    for (var i = 0; i < generatedDDIs.length; i++) {
      var ddi = generatedDDIs[i];
      var wrapper = ddi.parentNode;

      var possibleTel = wrapper
        ? wrapper.querySelector(
            'input[name="telefone_local"], input#telefone'
          )
        : null;

      if (
        wrapper &&
        possibleTel &&
        wrapper.classList &&
        (
          wrapper.classList.contains('ctm-phone-wrap') ||
          wrapper.style.display === 'flex'
        )
      ) {
        wrapper.parentNode.insertBefore(
          possibleTel,
          wrapper
        );

        wrapper.parentNode.removeChild(wrapper);
      } else if (ddi.parentNode) {
        ddi.parentNode.removeChild(ddi);
      }
    }

    /**
     * Remove somente hidden criado pelo nosso script.
     */
    var generatedHiddens = document.querySelectorAll(
      'input[data-ctm-phone-hidden="1"]'
    );

    for (var h = 0; h < generatedHiddens.length; h++) {
      var hidden = generatedHiddens[h];

      if (hidden.parentNode) {
        hidden.parentNode.removeChild(hidden);
      }
    }

    /**
     * Restaura telefone_local.
     */
    var localFields = document.querySelectorAll(
      'input[name="telefone_local"]'
    );

    for (var l = 0; l < localFields.length; l++) {
      localFields[l].setAttribute(
        'name',
        'telefone'
      );

      localFields[l].removeAttribute(
        'data-ctm-phone-enhanced'
      );

      localFields[l].style.flex = '';
    }

    /**
     * Remove wrappers vazios.
     */
    var wrappers = document.querySelectorAll(
      '.ctm-phone-wrap'
    );

    for (var w = 0; w < wrappers.length; w++) {
      var wrap = wrappers[w];

      if (!wrap.children.length && wrap.parentNode) {
        wrap.parentNode.removeChild(wrap);
      }
    }
  }

  function enhancePhoneField(tel) {
    if (!tel) return;

    if (tel.type === 'hidden') {
      return;
    }

    if (
      tel.getAttribute('data-ctm-phone-enhanced') === '1'
    ) {
      return;
    }

    var form = tel.closest
      ? tel.closest('form')
      : null;

    if (!form) {
      return;
    }

    tel.setAttribute(
      'data-ctm-phone-enhanced',
      '1'
    );

    var originalName = 'telefone';

    /**
     * Define DDI inicial.
     *
     * Prioridade:
     * 1. cache de IP já existente
     * 2. padrão da URL
     */
    var cachedDDI = getCachedDDI();

    var initialDDI =
      cachedDDI ||
      getDefaultDDI();

    /**
     * Wrapper.
     */
    var wrapper = document.createElement('div');

    wrapper.className = 'ctm-phone-wrap';

    wrapper.style.display = 'flex';
    wrapper.style.gap = '6px';
    wrapper.style.alignItems = 'center';
    wrapper.style.width = '100%';

    /**
     * DDI.
     */
    var cc = document.createElement('input');

    cc.type = 'text';
    cc.name = 'telefone_ddi';

    cc.value = initialDDI;
    cc.placeholder = initialDDI;

    cc.inputMode = 'numeric';
    cc.autocomplete = 'tel-country-code';
    cc.maxLength = 4;

    cc.className = 'field-form w-input';

    cc.setAttribute(
      'data-ctm-phone-ddi',
      '1'
    );

    cc.setAttribute(
      'aria-label',
      'Código do país'
    );

    cc.style.width = '72px';
    cc.style.flex = '0 0 72px';

    /**
     * Campo hidden que será realmente enviado.
     *
     * Ex.:
     * +5511987654321
     */
    var hidden = document.createElement('input');

    hidden.type = 'hidden';
    hidden.name = originalName;

    hidden.setAttribute(
      'data-ctm-phone-hidden',
      '1'
    );

    form.insertBefore(
      hidden,
      form.firstChild
    );

    /**
     * Campo visível.
     */
    tel.setAttribute(
      'name',
      originalName + '_local'
    );

    tel.type = 'text';
    tel.inputMode = 'tel';
    tel.autocomplete = 'tel';

    tel.removeAttribute('pattern');
    tel.removeAttribute('title');

    tel.style.flex = '1';

    /**
     * Placeholder inicial.
     */
    if (!tel.placeholder) {
      if (initialDDI === '+351') {
        tel.placeholder = '912 345 678';
      } else if (initialDDI === '+55') {
        tel.placeholder = '(11) 98765-4321';
      }
    }

    var parent = tel.parentNode;

    parent.insertBefore(
      wrapper,
      tel
    );

    wrapper.appendChild(cc);
    wrapper.appendChild(tel);

    /**
     * Controle de interação.
     */
    var ddiManuallyChanged = false;
    var geoDetectionStarted = false;

    function updatePlaceholder() {
      if (tel.value) {
        return;
      }

      var ddi = cc.value;

      if (ddi === '+55') {
        tel.placeholder = '(11) 98765-4321';
      } else if (ddi === '+351') {
        tel.placeholder = '912 345 678';
      } else if (ddi === '+1') {
        tel.placeholder = '(212) 555-1234';
      } else {
        tel.placeholder = 'Telefone';
      }
    }

    function remask() {
      var code = getCC(cc);

      tel.value = maskLocalByDDI(
        code,
        onlyDigits(tel.value)
      );
    }

    function syncHidden() {
      var ddi =
        onlyDigits(cc.value) ||
        onlyDigits(getDefaultDDI());

      var phone = onlyDigits(tel.value);

      hidden.value = phone
        ? '+' + ddi + phone
        : '';
    }

    /**
     * Geolocalização iniciada SOMENTE
     * quando o usuário interagir com o campo.
     */
    function startGeoDetection() {
      if (geoDetectionStarted) {
        return;
      }

      geoDetectionStarted = true;

      /**
       * Já existe DDI em cache.
       * Não precisa fazer chamada externa.
       */
      if (cachedDDI) {
        return;
      }

      detectDDIByIP().then(function (detectedDDI) {
        if (!detectedDDI) {
          return;
        }

        /**
         * Se usuário alterou o DDI manualmente,
         * não sobrescreve.
         */
        if (ddiManuallyChanged) {
          return;
        }

        cc.value = detectedDDI;
        cc.placeholder = detectedDDI;

        updatePlaceholder();
        remask();
        syncHidden();
      });
    }

    /**
     * Usuário edita DDI.
     */
    cc.addEventListener(
      'input',
      function () {
        ddiManuallyChanged = true;

        cc.value = normalizeCC(cc.value);

        updatePlaceholder();
        remask();
        syncHidden();
      }
    );

    /**
     * Dispara geolocalização apenas no foco.
     */
    tel.addEventListener(
      'focus',
      startGeoDetection,
      {
        once: true
      }
    );

    cc.addEventListener(
      'focus',
      startGeoDetection,
      {
        once: true
      }
    );

    /**
     * Impede letras digitadas no telefone.
     *
     * Não bloqueia backspace,
     * delete, setas etc.
     */
    tel.addEventListener(
      'beforeinput',
      function (e) {
        if (
          e.inputType === 'insertText' &&
          /\D/.test(e.data || '')
        ) {
          e.preventDefault();
        }
      }
    );

    tel.addEventListener(
      'input',
      function () {
        remask();
        syncHidden();
      }
    );

    /**
     * Colar telefone.
     */
    tel.addEventListener(
      'paste',
      function (e) {
        e.preventDefault();

        /**
         * Colar também conta como interação,
         * mas não precisamos esperar a API.
         */
        startGeoDetection();

        var clipboard =
          e.clipboardData ||
          window.clipboardData;

        var text = clipboard
          ? clipboard.getData('text')
          : '';

        var raw = String(text || '').trim();

        /**
         * Número internacional.
         */
        if (raw.charAt(0) === '+') {
          var parsed = parseInternationalPhone(
            raw,
            cc.value
          );

          if (parsed) {
            ddiManuallyChanged = true;

            cc.value =
              '+' + parsed.ddi;

            cc.placeholder =
              '+' + parsed.ddi;

            tel.value =
              parsed.phone;

            updatePlaceholder();
            remask();
            syncHidden();

            return;
          }
        }

        /**
         * Número local.
         */
        tel.value =
          onlyDigits(raw);

        remask();
        syncHidden();
      }
    );

    /**
     * Garante valor atualizado antes
     * do envio pelo Webflow.
     */
    form.addEventListener(
      'submit',
      function () {
        syncHidden();
      },
      true
    );

    /**
     * Estado inicial.
     *
     * Não existe nenhuma chamada externa aqui.
     */
    updatePlaceholder();
    remask();
    syncHidden();
  }

  function init() {
    cleanupPreviousVersions();

    var forms =
      document.querySelectorAll('form');

    for (
      var i = 0;
      i < forms.length;
      i++
    ) {
      var form = forms[i];

      /**
       * Apenas um telefone por formulário.
       */
      var tel =
        form.querySelector(PHONE_SELECTOR);

      if (tel) {
        enhancePhoneField(tel);
      }
    }
  }

  ready(init);
})();
