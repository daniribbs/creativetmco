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
    const repeatCount = 8;
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < repeatCount; i++) {
      originals.forEach(item => fragment.appendChild(item.cloneNode(true)));
    }

    track.innerHTML = '';
    track.appendChild(fragment);

    wrap.style.overflow = 'hidden';
    track.style.display = 'flex';
    track.style.flexWrap = 'nowrap';

    const totalWidth = track.scrollWidth;
    const containerWidth = wrap.offsetWidth || 1;

    if (totalWidth <= containerWidth * 1.2) return;

    // velocidade ↓ mais lenta (antes 40)
    const pxPerSecond = 30;
    const distance = totalWidth / 2;
    const duration = distance / pxPerSecond;

    const animName = 'logosMarquee_' + index;

    // agora começamos deslocado para a direita entrar pela esquerda
    const from = `-${distance}px`;
    const to   = `0`;

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

    // aplica animação
    track.style.animation = `${animName} ${duration}s linear infinite`;
  });
});
