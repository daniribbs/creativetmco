(function () {
  // ====== CONFIG ======
  const COOKIE_NAME = "tm_utms";
  const COOKIE_DAYS = 14;

  const KEYS = [
    "utm_source","utm_medium","utm_campaign","utm_term","utm_content",
    "gclid","fbclid","li_fat_id"
  ];

  // ====== COOKIE HELPERS ======
  function setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);

    // opcional: compartilha em subdomínios do seu domínio final
    const host = location.hostname;
    const domainAttr = host.endsWith("creativetm.co") ? ";domain=.creativetm.co" : "";

    document.cookie =
      name + "=" + encodeURIComponent(value) +
      ";expires=" + d.toUTCString() +
      ";path=/" +
      ";SameSite=Lax" +
      ";Secure" +
      domainAttr;
  }

  function getCookie(name) {
    const n = name + "=";
    const parts = document.cookie.split(";").map(s => s.trim());
    for (const p of parts) {
      if (p.indexOf(n) === 0) return decodeURIComponent(p.slice(n.length));
    }
    return "";
  }

  function safeJsonParse(str) {
    try { return JSON.parse(str); } catch(e) { return {}; }
  }

  // ====== CORE ======
  function readUrlParams() {
    const p = new URLSearchParams(window.location.search);
    const data = {};
    KEYS.forEach(k => {
      const v = p.get(k);
      if (v) data[k] = v;
    });
    return data;
  }

  function fillHiddenFields(data) {
    KEYS.forEach(k => {
      const el = document.querySelector('[name="'+k+'"], #' + k);
      if (el) el.value = (data && data[k]) ? data[k] : "";
    });
  }

  function getSaved() {
    const raw = getCookie(COOKIE_NAME);
    return raw ? safeJsonParse(raw) : {};
  }

  function save(newData) {
    const merged = Object.assign({}, getSaved(), newData);
    setCookie(COOKIE_NAME, JSON.stringify(merged), COOKIE_DAYS);
    fillHiddenFields(merged);
  }

  // 1) tenta salvar da URL imediatamente
  const fromUrl = readUrlParams();
  if (Object.keys(fromUrl).length) {
    save(fromUrl);
  }

  // 2) ao carregar o DOM, garante preencher os hidden fields com o cookie existente
  document.addEventListener("DOMContentLoaded", function () {
    fillHiddenFields(getSaved());
  });

})();
