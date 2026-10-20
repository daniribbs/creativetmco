(function () {
    var SPEED = 40; // px por segundo
  
    function init() {
      var win = document.querySelector('.container-imagem');
      var cols = Array.prototype.slice.call(
        document.querySelectorAll(
          '.carrossel-vertical-1, .carrossel-vertical-2'
        )
      );
  
      if (!win || !cols.length) {
        console.warn('[aura] container-imagem ou colunas do carrossel não encontradas');
        return;
      }
  
      if (getComputedStyle(win).position === 'static') {
        win.style.position = 'relative';
      }
  
      if (!win.querySelector('.aura-fade')) {
        var fade = document.createElement('div');
        fade.className = 'aura-fade';
        win.appendChild(fade);
      }
  
      var data = cols.map(function (col, i) {
        col.querySelectorAll('img').forEach(function (img) {
          img.loading = 'eager';
        });
  
        return {
          col: col,
          orig: Array.prototype.slice.call(col.children),
          dist: 0,
          dir: i % 2 === 0 ? -1 : 1,
          pos: 0
        };
      });
  
      function build() {
        data.forEach(function (d) {
          d.col.querySelectorAll('[data-clone]').forEach(function (n) {
            n.remove();
          });
  
          function addSet() {
            d.orig.forEach(function (el) {
              var clone = el.cloneNode(true);
              clone.setAttribute('data-clone', '');
              clone.setAttribute('aria-hidden', 'true');
              d.col.appendChild(clone);
            });
          }
  
          addSet();
  
          var firstClone = d.col.querySelector('[data-clone]');
          d.dist = firstClone.offsetTop - d.orig[0].offsetTop;
  
          if (d.dist <= 0) return;
  
          var needed = Math.ceil(win.clientHeight / d.dist) + 1;
          for (var k = 1; k < needed; k++) {
            addSet();
          }
  
          d.pos = 0;
        });
  
        console.log(
          '[aura] distâncias do loop:',
          data.map(function (d) { return d.dist; })
        );
      }
  
      build();

      var last = performance.now();

      function tick(now) {
        var dt = (now - last) / 1000;
        last = now;

        data.forEach(function (d) {
          if (d.dist <= 0) return;

          d.pos = (d.pos + SPEED * dt) % d.dist;
          var y = d.dir === -1 ? -d.pos : d.pos - d.dist;

          d.col.style.transform = 'translate3d(0,' + y + 'px,0)';
        });

        requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);

      window.addEventListener('load', build);

      var resizeTimer;
      window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(build, 200);
      });

      window.addEventListener('orientationchange', function () {
        setTimeout(build, 300);
      });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  })();