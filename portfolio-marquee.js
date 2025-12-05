document.addEventListener("DOMContentLoaded", function() {
  document.querySelectorAll('.portfolio-list-image').forEach(track => {
    const clone = track.innerHTML;
    for (let i = 0; i < 4; i++) { // repete 3 vezes
      track.innerHTML += clone;
    }
  });
});


document.addEventListener('DOMContentLoaded', function () {

  /* --- CSS embutido temporariamente --- */
  const style = document.createElement('style');
  style.innerHTML = `
    .service-item-acordeon .acordeon-serv-description {
      display: none;
    }
    .service-item-acordeon .ico-acordeon.close {
      display: none;
    }
    .service-item-acordeon.is-open .acordeon-serv-description {
      display: block;
    }
    .service-item-acordeon.is-open .ico-acordeon.open {
      display: none;
    }
    .service-item-acordeon.is-open .ico-acordeon.close {
      display: block;
    }
  `;
  document.head.appendChild(style);

  /* --- Lógica do acordeon --- */
  const items = document.querySelectorAll('.service-item-acordeon');

  items.forEach(function (item) {
    const contentTrigger = item.querySelector('.acordeon-service-content');
    const actions = item.querySelector('.actions-acordoen');

    if (!contentTrigger || !actions) return;

    function toggleItem() {
      item.classList.toggle('is-open');
    }

    contentTrigger.addEventListener('click', toggleItem);

    actions.addEventListener('click', function (event) {
      const icon = event.target.closest('.ico-acordeon');
      if (!icon) return;
      toggleItem();
    });
  });
});
