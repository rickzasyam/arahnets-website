/* ============================================================
   ARAHNETS — i18n engine + language switcher
   Default language is Bahasa Indonesia and lives inline in the
   HTML; other languages are JSON dictionaries in /i18n applied
   over data-i18n / data-i18n-html / data-i18n-aria hooks.
   ============================================================ */
(() => {
  "use strict";

  const LANGS = {
    "id":    { html: "id",    short: "ID",  locale: "id-ID" },
    "en":    { html: "en",    short: "EN",  locale: "en-US" },
    "ja":    { html: "ja",    short: "JA",  locale: "ja-JP", font: "Noto+Sans+JP:wght@400;500;600;700" },
    "zh-CN": { html: "zh-CN", short: "简中", locale: "zh-CN", font: "Noto+Sans+SC:wght@400;500;600;700" },
    "zh-TW": { html: "zh-TW", short: "繁中", locale: "zh-TW", font: "Noto+Sans+TC:wght@400;500;600;700" }
  };
  const STORE = "arahnets-lang";
  const cache = {};
  let current = "id";

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* CJK webfonts are heavy — inject only when that language is chosen */
  const ensureFont = (lang) => {
    const meta = LANGS[lang];
    if (!meta.font || document.getElementById("font-" + lang)) return;
    const l = document.createElement("link");
    l.id = "font-" + lang;
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=" + meta.font + "&display=swap";
    document.head.appendChild(l);
  };

  const fetchDict = async (lang) => {
    if (cache[lang]) return cache[lang];
    const r = await fetch("i18n/" + lang + ".json", { cache: "no-cache" });
    if (!r.ok) throw new Error("i18n: failed to load " + lang);
    return (cache[lang] = await r.json());
  };

  const apply = (dict) => {
    $$("[data-i18n]").forEach((el) => {
      const v = dict[el.dataset.i18n];
      if (v != null) el.textContent = v;
    });
    $$("[data-i18n-html]").forEach((el) => {
      const v = dict[el.dataset.i18nHtml];
      if (v != null) el.innerHTML = v;
    });
    $$("[data-i18n-aria]").forEach((el) => {
      const v = dict[el.dataset.i18nAria];
      if (v != null) el.setAttribute("aria-label", v);
    });
    if (dict["meta.title"]) document.title = dict["meta.title"];
    const md = $('meta[name="description"]');
    if (md && dict["meta.desc"]) md.setAttribute("content", dict["meta.desc"]);
  };

  const setLang = async (lang) => {
    if (!LANGS[lang]) lang = "id";
    ensureFont(lang);
    let dict;
    try { dict = await fetchDict(lang); }
    catch (e) { console.warn(e); return; }
    current = lang;
    document.documentElement.lang = LANGS[lang].html;
    window.__i18nLocale = LANGS[lang].locale;
    apply(dict);
    const cur = $("#langCur");
    if (cur) cur.textContent = LANGS[lang].short;
    $$("#langMenu [role='option']").forEach((li) =>
      li.setAttribute("aria-selected", String(li.dataset.lang === lang)));
    try { localStorage.setItem(STORE, lang); } catch { /* private mode */ }
    document.dispatchEvent(new CustomEvent("i18n:applied", { detail: { lang, dict } }));
  };

  /* ---------- dropdown behaviour ---------- */
  const wrap = $("#lang"), btn = $("#langBtn"), menu = $("#langMenu");
  if (wrap && btn && menu) {
    const close = () => { menu.hidden = true;  btn.setAttribute("aria-expanded", "false"); };
    const open  = () => { menu.hidden = false; btn.setAttribute("aria-expanded", "true");  };
    btn.addEventListener("click", (e) => { e.stopPropagation(); menu.hidden ? open() : close(); });
    menu.addEventListener("click", (e) => {
      const li = e.target.closest("[data-lang]");
      if (!li) return;
      close();
      setLang(li.dataset.lang);
    });
    document.addEventListener("click", (e) => { if (!wrap.contains(e.target)) close(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  }

  /* ---------- boot ----------
     Business rule: first visit is always Bahasa Indonesia.
     A stored choice or an explicit ?lang= link overrides it. */
  const urlLang = new URLSearchParams(location.search).get("lang");
  let stored = null;
  try { stored = localStorage.getItem(STORE); } catch { /* private mode */ }
  const boot = urlLang || stored || "id";

  window.I18N = { set: setLang, get lang() { return current; } };
  window.__i18nLocale = "id-ID";

  if (boot !== "id") setLang(boot);
})();
