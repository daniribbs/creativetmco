(function () {
  const WRAP_SELECTOR = ".container-faq";
  const ITEM_SELECTOR = ".item-faq";
  const DESC_SELECTOR = ".resposta";

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  function setHeights(items) {
    items.forEach(function (item) {
      const desc = item.querySelector(DESC_SELECTOR);
      if (!desc) return;

      const clone = desc.cloneNode(true);
      const width = desc.getBoundingClientRect().width || desc.parentElement.clientWidth;
      clone.style.cssText =
        "position:absolute;visibility:hidden;display:block;max-height:none;height:auto;overflow:visible;opacity:1;padding-top:12px;width:" +
        width +
        "px;";
      desc.parentNode.appendChild(clone);
      const h = clone.scrollHeight || 0;
      clone.remove();
      desc.style.setProperty("--state-h", h + "px");
    });
  }

  function closeItem(item) {
    item.classList.remove("is-open");
  }

  function openItem(item, allItems) {
    allItems.forEach(function (other) {
      if (other !== item) closeItem(other);
    });
    item.classList.add("is-open");
  }

  function toggleItem(item, allItems) {
    if (item.classList.contains("is-open")) closeItem(item);
    else openItem(item, allItems);
  }

  ready(function () {
    const wraps = Array.from(document.querySelectorAll(WRAP_SELECTOR));
    const items = wraps.length
      ? wraps.flatMap(function (wrap) {
          return Array.from(wrap.querySelectorAll(ITEM_SELECTOR));
        })
      : Array.from(document.querySelectorAll(ITEM_SELECTOR));

    if (!items.length) return;

    setHeights(items);

    items.forEach(function (item) {
      item.addEventListener("click", function (e) {
        if (e.target.closest("a")) return;
        toggleItem(item, items);
      });
    });

    let t = null;
    window.addEventListener("resize", function () {
      clearTimeout(t);
      t = setTimeout(function () {
        setHeights(items);
      }, 150);
    });
  });
})();
