(function () {
    function iniciar() {
      var campo = document.getElementById('mensagem');
      if (!campo || campo.dataset.contador) return;
      campo.dataset.contador = '1';
  
      var LIMITE = 300;
      campo.setAttribute('maxlength', LIMITE);
  
      var wrapper = campo.parentElement;
      wrapper.style.position = 'relative';
  
      var contador = document.createElement('div');
      contador.className = 'contador-caracteres';
      contador.setAttribute('aria-live', 'polite');
      wrapper.appendChild(contador);
  
      function atualizar() {
        if (campo.value.length > LIMITE) {
          campo.value = campo.value.slice(0, LIMITE);
        }
        var total = campo.value.length;
        contador.textContent = total + '/' + LIMITE;
        contador.classList.toggle('limite', total >= LIMITE);
      }
  
      campo.addEventListener('input', atualizar);
      atualizar();
  
      var form = campo.closest('form');
      if (form) form.addEventListener('reset', function () { setTimeout(atualizar, 0); });
    }
  
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', iniciar);
    } else {
      iniciar();
    }
  })();