(function () {
  function iniciar() {
    var wrapper = document.querySelector('.vimeo-embed-nativo');
    if (!wrapper) return;

    var iframe = wrapper.tagName === 'IFRAME' ? wrapper : wrapper.querySelector('iframe');
    if (!iframe) return;

    var origem = iframe.getAttribute('src') || iframe.getAttribute('data-src');
    if (!origem) return;

    var url = new URL(origem, window.location.href);
    url.searchParams.set('autoplay', '1');
    url.searchParams.set('muted', '1');
    url.searchParams.set('loop', '1');

    iframe.setAttribute('src', url.toString());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();