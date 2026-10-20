document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.item-servico').forEach(function (card) {
    var texto = card.querySelector('.text-block-2');
    var cta = card.querySelector('.cta');
    if (!texto || !cta) return;

    var reveal = document.createElement('div');
    reveal.className = 'reveal';
    var inner = document.createElement('div');
    inner.className = 'reveal-inner';

    texto.before(reveal);
    reveal.appendChild(inner);
    inner.appendChild(texto);
    inner.appendChild(cta);
  });
});