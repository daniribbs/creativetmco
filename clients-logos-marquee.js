document.addEventListener('DOMContentLoaded', function () {
  if (window.__logosMarqueeInitialized) return;
  window.__logosMarqueeInitialized = true;

  const wraps = Array.from(document.querySelectorAll('.logo-wrap'));
  if (!wraps.length) return;

  wraps.forEach(function (wrap, index) {
    const track = wrap.querySelector('.logo-lista');
    if (!track) return;

    const originals = Array.from(track.children).filter(function (child) {
      return child.classList.contains('logo-cliente');
    });

    if (!originals.length) return;

    // duplica várias vezes pra formar um loop longo
    const repeatCount = 8; // ajusta se quiser mais/menos “fila”
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < repeatCount; i++) {
      originals.forEach(function (item) {
        fragment.appendChild(item.cloneNode(true));
      });
    }

    // substitui o conteúdo do track pelos clones
    track.innerHTML = '';
    track.appendChild(fragment);

    // estilos mínimos via JS (pode levar pro CSS se preferir)
    wrap.style.overflow = 'hidden';
    track.style.display = 'flex';
    track.style.flexWrap = 'nowrap';

    // calcula larguras depois de popular
    const totalWidth = track.scrollWidth;
    const containerWidth = wrap.offsetWidth || 1;

    // se a largura total não for muito maior que o container, nem anima
    if (totalWidth <= containerWidth * 1.2) return;

    // velocidade em px/s
    const pxPerSecond = 30; // deixa mais rápido/lento ajustando aqui
    const distance = totalWidth / 2; // metade pro loop fechar bem
    const duration = distance / pxPerSecond; // segundos

    const animName = 'logosMarquee_' + index;
    const from = '0';
    const to = '-' + distance + 'px';

    // remove style antigo se existir
    const styleId = 'style-logos-marquee-' + index;
    const oldStyle = document.getElementById(styleId);
    if (oldStyle) oldStyle.remove();

    const styleTag = document.createElement('style');
    styleTag.id = styleId;
    styleTag.textContent = `
      @keyframes ${animName} {
        0%   { transform: translateX(${from}); }
        100% { transform: translateX(${to}); }
      }
    `;
    document.head.appendChild(styleTag);

    // aplica animação diretamente no track
    track.style.animation = `${animName} ${duration}s linear infinite`;
  });
});
