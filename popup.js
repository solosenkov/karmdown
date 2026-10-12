const I18N = {
  ru: {
    autoReload: 'Автообновление',
    remoteImages: 'Внешние картинки',
    clearData: 'Удалить черновики',
    cleared: 'Локальные черновики и позиции чтения удалены.',
    clearConfirm: 'Удалить все локальные черновики и позиции чтения?',
    auto: 'Авто',
    light: 'Светлая',
    dark: 'Тёмная',
    remoteHint: 'Внешние картинки обращаются к серверу изображения. По умолчанию выключены.',
    openViewer: 'Открыть Markdown-файл',

    sub: "Красивый просмотр file://*.md + редактор.",
    enabled: "Включено", theme: "Тема", toc: "Оглавление", mode: "Режим",
    preview: "Просмотр", split: "Сплит", edit: "Редактор", raw: "Исходник",
    width: "Ширина", narrow: "Узко", normal: "Норма", wide: "Широко", full: "Во весь экран",
    font: "Шрифт", fontS: "Мелкий", fontM: "Средний", fontL: "Крупный",
    lang: "Язык · Lang", warnT: "Важно для file://",
    warnB: "Открой chrome://extensions → KarmDown → «Детали» → включи «Разрешить открывать локальные файлы по ссылкам».",
    reload: "Обновить вкладку",
  },
  en: {
    autoReload: 'Live reload',
    remoteImages: 'Remote images',
    clearData: 'Clear local drafts',
    cleared: 'Local drafts and reading positions cleared.',
    clearConfirm: 'Delete all local drafts and reading positions?',
    auto: 'Auto',
    light: 'Light',
    dark: 'Dark',
    remoteHint: 'Remote images contact the image host. Off by default.',
    openViewer: 'Open Markdown file',

    sub: "Beautiful file://*.md viewer + editor.",
    enabled: "Enabled", theme: "Theme", toc: "Contents", mode: "Mode",
    preview: "Preview", split: "Split", edit: "Editor", raw: "Raw",
    width: "Width", narrow: "Narrow", normal: "Normal", wide: "Wide", full: "Full bleed",
    font: "Font", fontS: "Small", fontM: "Medium", fontL: "Large",
    lang: "Language · Язык", warnT: "Required for file://",
    warnB: "Open chrome://extensions → KarmDown → Details → enable “Allow access to file URLs”.",
    reload: "Reload tab",
  }
};
function resolveLang(v) {
  if (v === "ru" || v === "en") return v;
  return (navigator.language || "en").toLowerCase().startsWith("ru") ? "ru" : "en";
}
function applyI18n(lang) {
  const T = I18N[lang];
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const k = el.dataset.i18n;
    if (T[k]) el.textContent = T[k];
  });
  for (const key of ["enabled", "toc", "autoReload", "remoteImages"]) {
    const button = document.getElementById(key);
    button.setAttribute("aria-label", T[key]);
    button.setAttribute("aria-checked", String(button.classList.contains("on")));
  }
}
async function load() {
  const s = await chrome.storage.sync.get({ enabled: true, theme: "auto", toc: true, mode: "preview", lang: "en", autoReload: true, remoteImages: false, width: "normal", font: "m" });
  const en = document.getElementById("enabled");
  const toc = document.getElementById("toc");
  en.classList.toggle("on", !!s.enabled);
  toc.classList.toggle("on", !!s.toc);
  document.getElementById("theme").value = s.theme;
  document.getElementById("mode").value = s.mode;
  document.getElementById("lang").value = s.lang;
  document.getElementById("width").value = s.width;
  document.getElementById("font").value = s.font;
  applyI18n(resolveLang(s.lang));

  for (const key of ["autoReload", "remoteImages"]) {
    const button = document.getElementById(key);
    button.classList.toggle("on", !!s[key]);
    button.onclick = () => { const value = !button.classList.contains("on"); button.classList.toggle("on", value); button.setAttribute("aria-checked", String(value)); chrome.storage.sync.set({ [key]: value }); };
  }
  applyI18n(resolveLang(s.lang));
  document.getElementById("openViewer").onclick = () => chrome.tabs.create({ url: chrome.runtime.getURL("viewer.html") });
  document.getElementById("clearData").onclick = async () => { const T = I18N[resolveLang(document.getElementById("lang").value)]; if (confirm(T.clearConfirm)) { await chrome.storage.local.clear(); document.getElementById("feedback").textContent = T.cleared; } };
  en.onclick = () => {
    const v = !en.classList.contains("on");
    en.classList.toggle("on", v);
    en.setAttribute("aria-checked", String(v));
    chrome.storage.sync.set({ enabled: v });
  };
  toc.onclick = () => {
    const v = !toc.classList.contains("on");
    toc.classList.toggle("on", v);
    toc.setAttribute("aria-checked", String(v));
    chrome.storage.sync.set({ toc: v });
  };
  document.getElementById("theme").onchange = (e) => chrome.storage.sync.set({ theme: e.target.value });
  document.getElementById("mode").onchange = (e) => chrome.storage.sync.set({ mode: e.target.value });
  document.getElementById("width").onchange = (e) => chrome.storage.sync.set({ width: e.target.value });
  document.getElementById("font").onchange = (e) => chrome.storage.sync.set({ font: e.target.value });
  document.getElementById("lang").onchange = (e) => {
    chrome.storage.sync.set({ lang: e.target.value });
    applyI18n(resolveLang(e.target.value));
  };
  document.getElementById("reload").onclick = async () => {
    await chrome.tabs.reload();
  };

  // realtime: если настройки поменяли в тулбаре viewer — popup обновляется сам
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;
    for (const key of ["enabled", "toc", "autoReload", "remoteImages"]) if (changes[key]) {
      const button = document.getElementById(key); button.classList.toggle("on", !!changes[key].newValue); button.setAttribute("aria-checked", String(!!changes[key].newValue));
    }
    if (changes.enabled) en.classList.toggle("on", !!changes.enabled.newValue);
    if (changes.toc) toc.classList.toggle("on", !!changes.toc.newValue);
    if (changes.theme) document.getElementById("theme").value = changes.theme.newValue;
    if (changes.mode) document.getElementById("mode").value = changes.mode.newValue;
    if (changes.width) document.getElementById("width").value = changes.width.newValue;
    if (changes.font) document.getElementById("font").value = changes.font.newValue;
    if (changes.lang) {
      document.getElementById("lang").value = changes.lang.newValue;
      applyI18n(resolveLang(changes.lang.newValue));
    }
  });
}
load();
