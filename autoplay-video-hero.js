document.addEventListener("DOMContentLoaded", function () {
    const videoWrapper = document.querySelector('.vimeo-embed-nativo');
    if (!videoWrapper) return;
  
    const iframe = videoWrapper.tagName === 'IFRAME'
      ? videoWrapper
      : videoWrapper.querySelector('iframe');
    if (!iframe) return;
  
    const url = new URL(iframe.getAttribute('src'), window.location.href);
    url.searchParams.set('background', '1');
    url.searchParams.set('autoplay', '1');
    url.searchParams.set('muted', '1');
    url.searchParams.set('loop', '1');
    url.searchParams.set('controls', '0');
  
    iframe.setAttribute('src', url.toString());
    iframe.style.pointerEvents = 'none';
  });