/* KarmDown content.js — Flim-styled viewer, RU/EN, realtime settings.
   Pkg A: raw mode, hljs highlight, scroll-spy + progress, GitHub alerts,
   width/font, scroll memory, reading time. Pkg B: lazy mermaid + KaTeX. */
(() => {
  if (window.__mvActive) return;
  const MD_RE = /\.(md|markdown|mdown|mkd|mdx)(\?.*)?(#.*)?$/i;
  const DEFAULTS = { enabled: true, theme: "auto", toc: true, mode: "preview", lang: "en", autoReload: true, remoteImages: false, width: "normal", font: "m" };

  const STR = {
    ru: {
      "views": "Режимы просмотра",
      "openFail": "Не удалось открыть файл.",
      "search": "Поиск",
      "export-html": "Экспорт HTML",
      "export-pdf": "Печать / PDF",
      "find": "Найти в документе",
      "previous": "Предыдущее совпадение",
      "next": "Следующее совпадение",
      "close": "Закрыть поиск",
      "noMatches": "Нет совпадений",
      "metadata": "Метаданные документа",
      "imageBlocked": "Изображение заблокировано — при необходимости включите внешние изображения в настройках",
      "exportFail": "Не удалось экспортировать документ.",
      "renderFail": "Не удалось безопасно отобразить документ. Откройте Исходник.",
      "diskChanged": "Файл изменился на диске. Черновик сохранён. Загрузка файла заменит ваши правки.",
      "loadDisk": "Загрузить с диска",
      "reloadFail": "Автообновление недоступно для этого файла. Обновите вкладку вручную.",
      "pdfHint": "Выберите «Сохранить как PDF» в окне печати.",

      preview: "Просмотр", split: "Сплит", edit: "Редактор", raw: "Исходник",
      toc: "Оглавление", theme: "Тема", copyMd: "Копировать MD", save: "Скачать .md",
      open: "Открыть",
      hint: "⌘/Ctrl+S — скачать • file:// нельзя перезаписать напрямую",
      editHead: "Редактирование — черновик хранится локально",
      noHeads: "Заголовков нет",
      draftFound: (d) => `Найден локальный черновик (${d}). Показать?`,
      restore: "Вернуть черновик", drop: "Удалить",
      restored: "Черновик восстановлен", dropped: "Черновик удалён",
      copied: "Markdown скопирован", copyFail: "Не удалось скопировать",
      saved: "Скачано. Замени им исходный файл — Chrome запрещает писать в file:// напрямую",
      opened: (f) => `Файл открыт: ${f}`,
      codeCopy: "копировать", codeOk: "скопировано ✓", codeFail: "ошибка",
      lines: (l, w, m, f) => `${l} строк • ${w} слов • ~${m} мин • ${f}`,
      editing: (l, w, m) => `${l} строк • ${w} слов • ~${m} мин • …`,
      tocTitle: "Оглавление",
    },
    en: {
      "views": "Viewing modes",
      "openFail": "Unable to open this file.",
      "search": "Find",
      "export-html": "Export HTML",
      "export-pdf": "Print / PDF",
      "find": "Find in document",
      "previous": "Previous match",
      "next": "Next match",
      "close": "Close search",
      "noMatches": "No matches",
      "metadata": "Document metadata",
      "imageBlocked": "Image blocked — enable remote images in settings if needed",
      "exportFail": "Unable to export this document.",
      "renderFail": "Unable to render safely. Use Raw mode.",
      "diskChanged": "File changed on disk. Your draft is preserved. Loading the file replaces your edits.",
      "loadDisk": "Load disk version",
      "reloadFail": "Auto-reload unavailable for this file. Reload the tab manually.",
      "pdfHint": "Choose Save as PDF in the print dialog.",

      preview: "Preview", split: "Split", edit: "Editor", raw: "Raw",
      toc: "Contents", theme: "Theme", copyMd: "Copy MD", save: "Download .md",
      open: "Open",
      hint: "⌘/Ctrl+S to download • file:// is read-only",
      editHead: "Editing — draft stored locally",
      noHeads: "No headings",
      draftFound: (d) => `Local draft found (${d}). Restore?`,
      restore: "Restore draft", drop: "Discard",
      restored: "Draft restored", dropped: "Draft discarded",
      copied: "Markdown copied", copyFail: "Copy failed",
      saved: "Downloaded. Replace the source file — Chrome forbids writing to file:// directly",
      opened: (f) => `File opened: ${f}`,
      codeCopy: "copy", codeOk: "copied ✓", codeFail: "error",
      lines: (l, w, m, f) => `${l} lines • ${w} words • ~${m} min read • ${f}`,
      editing: (l, w, m) => `${l} lines • ${w} words • ~${m} min read • …`,
      tocTitle: "Contents",
    }
  };

  function resolveLang(v) {
    if (v === "ru" || v === "en") return v;
    const b = (navigator.language || "en").toLowerCase();
    return b.startsWith("ru") ? "ru" : "en";
  }

  function isMarkdownPage() {
    if (globalThis.__kdStandalone) return true;
    const plain = /^(text\/(plain|markdown|x-markdown)|application\/octet-stream)/i.test(document.contentType || "");
    if (!plain && !(location.protocol === "file:" && !/html/i.test(document.contentType || ""))) return false;
    if (!globalThis.__kdManual && !KDCore.isMarkdownURL(location.href)) return false;
    if (document.getElementById("mv-root")) return false;
    return true;
  }

  function getRaw() {
    const pre = document.querySelector("body > pre");
    if (pre) return pre.textContent;
    return document.body ? document.body.innerText : "";
  }

  function slugify(s) {
    return s.toLowerCase().trim()
      .replace(/[«»“”„"]/g, "")
      .replace(/[^a-z0-9а-яёa-z_\- ]/gi, "")
      .replace(/\s+/g, "-").slice(0, 80) || "h";
  }

  function fileName() {
    try {
      const p = decodeURIComponent(location.pathname);
      return p.split("/").pop() || "document.md";
    } catch { return "document.md"; }
  }

  const extURL = (p) => { try { return chrome.runtime.getURL(p); } catch { return p; } };
  const _loaded = {};
  function loadScriptOnce(key, path) {
    if (window[key]) return Promise.resolve();
    if (_loaded[key]) return _loaded[key];
    _loaded[key] = chrome.runtime.sendMessage({ type: "library", key }).then(result => {
      if (!result?.ok || !globalThis[key]) throw new Error("Library unavailable");
    }).catch(error => { delete _loaded[key]; throw error; });
    return _loaded[key];
  }
  function loadCssOnce(key, path) {
    if (document.querySelector(`link[data-mv="${key}"]`)) return;
    const l = document.createElement("link");
    l.rel = "stylesheet"; l.href = extURL(path); l.dataset.mv = key;
    document.head.appendChild(l);
  }

  async function main() {
    if (!isMarkdownPage()) return;
    let cfg = {};
    try { cfg = await chrome.storage.sync.get(DEFAULTS); }
    catch { cfg = { ...DEFAULTS }; }
    if (!cfg.enabled && !globalThis.__kdStandalone) return;

    const raw0 = getRaw();
    window.__mvActive = true;

    loadCssOnce("viewer", "viewer.css");
    document.title = fileName().replace(/\.mdx?$/i, "") + " — KarmDown";
    document.body.innerHTML = "";
    document.body.style.margin = "0";

    let lang = resolveLang(cfg.lang);
    let T = STR[lang];

    const root = document.createElement("div");
    root.id = "mv-root";
    root.dataset.theme = cfg.theme || "auto";
    root.dataset.mode = cfg.mode || "preview";
    root.dataset.width = cfg.width || "normal";
    root.dataset.font = cfg.font || "m";
    root.innerHTML = `
      <div class="mv-bar">
        <img class="mv-brand-icon" src="${extURL("icons/icon32.png")}" width="30" height="30" alt="KarmDown">
        <div class="mv-file"></div>
        <div class="mv-sep"></div>
        <div class="mv-group modes" role="group">
          <button class="mv-btn" data-act="preview"></button>
          <button class="mv-btn" data-act="split"></button>
          <button class="mv-btn" data-act="edit"></button>
          <button class="mv-btn" data-act="raw"></button>
        </div>
        <div class="mv-group">
          <button class="mv-btn" data-act="toc"></button>
          <button class="mv-btn" data-act="theme" title="auto → light → dark"></button>
        </div>
        <div class="mv-group">
          <button class="mv-btn" data-act="open"></button>
          <button class="mv-btn" data-act="copy-md"></button>
          <button class="mv-btn" data-act="search"></button>
          <button class="mv-btn" data-act="export-html"></button>
          <button class="mv-btn" data-act="export-pdf"></button>
          <button class="mv-btn primary" data-act="save"></button>
          <input type="file" class="mv-file-input" accept=".md,.markdown,.mdown,.mkd,.mdx,.txt,text/markdown,text/plain" hidden>
        </div>
        <span class="mv-hint"></span>
      </div>
      <div class="mv-search" hidden><input type="search"><span class="mv-match-count" role="status" aria-live="polite"></span><button class="mv-btn" data-act="search-prev">↑</button><button class="mv-btn" data-act="search-next">↓</button><button class="mv-btn" data-act="search-close">×</button></div>
      <div class="mv-reload" hidden><span></span><button class="mv-btn" data-act="reload-disk"></button></div>
      <div class="mv-progress"></div>
      <div class="mv-banner"><span></span><button class="mv-btn" data-act="restore"></button><button class="mv-btn" data-act="drop-draft"></button></div>
      <div class="mv-body">
        <aside class="mv-toc"><h4></h4><div class="mv-toc-list"></div></aside>
        <div class="mv-main">
          <div class="mv-cols">
            <div class="mv-pane-doc"><article class="mv-doc"></article><pre class="mv-raw"></pre></div>
            <div class="mv-pane-edit">
              <div class="mv-edit-head"><span></span></div>
              <textarea id="mv-editor" spellcheck="false"></textarea>
              <div class="mv-status"></div>
            </div>
          </div>
        </div>
      </div>
      <div class="mv-toast"></div>
    `;
    document.body.appendChild(root);

    const $ = (s) => root.querySelector(s);
    const doc = $(".mv-doc"), rawPre = $(".mv-raw"), editor = $("#mv-editor"), tocBox = $(".mv-toc"),
          tocList = $(".mv-toc-list"), banner = $(".mv-banner"), status = $(".mv-status"),
          fileInput = $(".mv-file-input"), mainEl = $(".mv-main"), progress = $(".mv-progress");
    $(".mv-file").textContent = fileName();

    let raw = raw0;
    let currentName = fileName();
    editor.value = raw0;
    let draftKey = "draft:" + location.href;
    let draftTs = null;
    let mathStore = [];
    let mathPrefix = "";
    let diskRaw = raw0, pendingDisk = null, picked = false;
    let renderVersion = 0;
    let enhancements = Promise.resolve();
    const fileURL = location.href;
    $(".mv-file").title = fileURL;
    const searchBox = $(".mv-search"), searchInput = $(".mv-search input");
    let matches = [], activeMatch = -1;
    let hasMermaid = false;
    let spy = null;

    function toast(msg) {
      const t = root.querySelector(".mv-toast");
      if (!t) return;
      t.textContent = msg;
      t.classList.add("show");
      clearTimeout(t._h);
      t._h = setTimeout(() => t.classList.remove("show"), 3200);
    }

    function effectiveDark() {
      const t = root.dataset.theme;
      if (t === "dark") return true;
      if (t === "light") return false;
      return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
    }

    function applyLang() {
      lang = resolveLang(cfg.lang);
      T = STR[lang];
      document.documentElement.lang = lang;
      $(".modes").setAttribute("aria-label", T.views);
      $('[data-act="preview"]').textContent = T.preview;
      $('[data-act="split"]').textContent = T.split;
      $('[data-act="edit"]').textContent = T.edit;
      $('[data-act="raw"]').textContent = T.raw;
      $('[data-act="toc"]').textContent = T.toc;
      $('[data-act="copy-md"]').textContent = T.copyMd;
      $('[data-act="open"]').textContent = T.open;
      $('[data-act="save"]').textContent = T.save;
      $(".mv-hint").textContent = T.hint;
      $(".mv-edit-head span").textContent = T.editHead;
      $(".mv-toc h4").textContent = T.tocTitle;
      $('[data-act="restore"]').textContent = T.restore;
      $('[data-act="drop-draft"]').textContent = T.drop;
      for (const key of ["search", "export-html", "export-pdf"]) $('[data-act="' + key + '"]').textContent = T[key];
      searchInput.placeholder = T.find;
      searchInput.setAttribute("aria-label", T.find);
      for (const [act, label] of [["search-prev", T.previous], ["search-next", T.next], ["search-close", T.close]]) $('[data-act="' + act + '"]').setAttribute("aria-label", label);
      $('[data-act="reload-disk"]').textContent = T.loadDisk;
      $(".mv-reload span").textContent = T.diskChanged;
      editor.setAttribute("aria-label", T.editHead);
      paintTheme();
      paintStatus(false);
      if (draftTs) banner.querySelector("span").textContent = T.draftFound(new Date(draftTs).toLocaleString(lang));
    }

    let timer = null;
    function persistDraft() {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        try { await chrome.storage.local.set({ [draftKey]: { text: raw, ts: Date.now() } }); } catch {}
      }, 600);
    }

    function paintStatus(editing) {
      const words = (raw.match(/\S+/g) || []).length;
      const lines = raw.split("\n").length;
      const mins = Math.max(1, Math.round(words / 200));
      status.textContent = editing ? T.editing(lines, words, mins) : T.lines(lines, words, mins, currentName);
    }

    // ---- math: спрятать $..$ / $$..$$ от marked, вернуть после sanitize ----
    function protectMath(src) {
      const result = KDCore.protectMath(src);
      mathStore = result.items; mathPrefix = result.prefix;
      return result.source;
    }
    function restoreMath() {
      const nodes = [];
      const walker = document.createTreeWalker(doc, NodeFilter.SHOW_TEXT, { acceptNode(n) {
        if (!(n.nodeValue || "").includes(mathPrefix)) return NodeFilter.FILTER_SKIP;
        const p = n.parentElement;
        if (p && p.closest("pre,code")) return NodeFilter.FILTER_SKIP;
        return NodeFilter.FILTER_ACCEPT;
      }});
      const list = [];
      while (walker.nextNode()) list.push(walker.currentNode);
      list.forEach(tn => {
        const frag = document.createDocumentFragment();
        let last = 0;
        const re = new RegExp(mathPrefix + "(\\d+)END", "g");
        let m;
        while ((m = re.exec(tn.nodeValue))) {
          frag.appendChild(document.createTextNode(tn.nodeValue.slice(last, m.index)));
          const item = mathStore[+m[1]];
          if (item) {
            const el = document.createElement(item.display ? "div" : "span");
            el.className = "mv-math"; el.dataset.i = m[1]; el.textContent = "…";
            frag.appendChild(el); nodes.push(el);
          } else frag.appendChild(document.createTextNode(m[0]));
          last = m.index + m[0].length;
        }
        frag.appendChild(document.createTextNode(tn.nodeValue.slice(last)));
        tn.parentNode.replaceChild(frag, tn);
      });
      return nodes;
    }
    async function renderMath(nodes, version, items) {
      if (!nodes.length) return;
      try {
        await loadScriptOnce("katex", "vendor/katex/katex.min.js");
        loadCssOnce("katex", "vendor/katex/katex.min.css");
      } catch { return; }
      if (version !== renderVersion) return;
      nodes.forEach(el => {
        const item = items[+el.dataset.i];
        if (!item) return;
        try { window.katex.render(item.tex, el, { displayMode: item.display, throwOnError: false, trust: false, maxExpand: 500, maxSize: 20 }); }
        catch { el.textContent = item.tex; }
      });
    }

    // ---- GitHub alerts: > [!NOTE] ... ----
    const ALERTS = { NOTE: "note", TIP: "tip", IMPORTANT: "important", WARNING: "warning", CAUTION: "caution" };
    function enhanceAlerts() {
      doc.querySelectorAll("blockquote").forEach(bq => {
        const first = bq.firstElementChild;
        if (!first) return;
        const m = (first.textContent || "").match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/);
        if (!m) return;
        bq.classList.add("mv-alert", "mv-alert-" + ALERTS[m[1]]);
        const w = document.createTreeWalker(first, NodeFilter.SHOW_TEXT);
        if (w.nextNode()) w.currentNode.nodeValue = w.currentNode.nodeValue.replace(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/, "");
        const label = document.createElement("div");
        label.className = "mv-alert-title";
        label.textContent = m[1].charAt(0) + m[1].slice(1).toLowerCase();
        bq.insertBefore(label, bq.firstChild);
      });
    }

    async function highlightCode(version) {
      const blocks = [...doc.querySelectorAll("pre code[class*='language-']")].filter(c =>
        !/language-(mermaid|math|tex|latex)/.test(c.className || ""));
      if (!blocks.length) return;
      try { await loadScriptOnce("hljs", "vendor/hljs.min.js"); } catch { return; }
      if (version !== renderVersion) return;
      blocks.forEach(b => { try { window.hljs.highlightElement(b); } catch {} });
    }

    async function renderMermaid(version) {
      const blocks = [...doc.querySelectorAll("pre code.language-mermaid")];
      hasMermaid = blocks.length > 0;
      if (!hasMermaid) return;
      try { await loadScriptOnce("mermaid", "vendor/mermaid.min.js"); } catch { return; }
      if (version !== renderVersion) return;
      blocks.forEach(code => {
        const pre = code.closest("pre");
        if (!pre) return;
        const div = document.createElement("div");
        div.className = "mermaid mv-mermaid"; // оба класса: дефолтный селектор mermaid + наш стиль
        div.textContent = code.textContent;
        pre.replaceWith(div);
      });
      try {
        window.mermaid.initialize({ startOnLoad: false, securityLevel: "strict", maxTextSize: 50000, suppressErrorRendering: true, theme: effectiveDark() ? "dark" : "default" });
        await window.mermaid.run({ nodes: [...doc.querySelectorAll(".mv-mermaid")], suppressErrors: true });
      } catch {}
    }

    function setupSpy(heads) {
      try { if (spy) spy.disconnect(); } catch {}
      spy = null;
      const map = new Map();
      tocList.querySelectorAll("a").forEach(a => map.set(a.getAttribute("href").slice(1), a));
      if (!heads.length || !window.IntersectionObserver) return;
      spy = new IntersectionObserver((es) => {
        es.forEach(en => {
          if (en.isIntersecting) {
            tocList.querySelectorAll("a.active").forEach(x => x.classList.remove("active"));
            const link = map.get(en.target.id);
            if (link) link.classList.add("active");
          }
        });
      }, { root: mainEl, rootMargin: "-90px 0px -70% 0px" });
      heads.forEach(h => spy.observe(h));
    }

    function render() {
      rawPre.textContent = raw;
      const version = ++renderVersion;
      clearSearch();
      const metadata = KDCore.frontmatter(raw);
      if (!globalThis.DOMPurify || !globalThis.marked) { doc.textContent = T.renderFail; return; }
      let html;
      try { html = marked.parse(protectMath(metadata.body), { gfm: true, breaks: false }); }
      catch { doc.textContent = T.renderFail; return; }
      const safeHTML = DOMPurify.sanitize(html, { FORBID_TAGS: ["style", "iframe", "object", "embed", "form", "video", "audio", "source", "picture"], FORBID_ATTR: ["style", "srcset"], ADD_ATTR: ["target", "rel"] });
      // Reparse sanitized markup in an inert template. Returning DOM nodes from an
      // isolated world can retain page-world inline event handlers in Chromium.
      const template = document.createElement("template"); template.innerHTML = safeHTML;
      const fragment = template.content;
      fragment.querySelectorAll("img").forEach(image => {
        const src = image.getAttribute("src") || "";
        image.removeAttribute("src");
        try {
          const url = new URL(src, fileURL);
          const absolute = /^[a-z][a-z0-9+.-]*:|^\/\//i.test(src);
          const local = url.protocol === "file:" && (!url.hostname || url.hostname === "localhost") && location.protocol === "file:" && /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(url.pathname) && (!picked || absolute);
          const remote = /^(https?):$/.test(url.protocol) && cfg.remoteImages;
          const data = /^data:image\/(png|jpeg|gif|webp);base64,/i.test(src);
          if (local || remote || data) { image.src = url.href; image.referrerPolicy = "no-referrer"; }
          else { const text = document.createElement("span"); text.className = "mv-image-blocked"; text.textContent = T.imageBlocked + (image.alt ? ": " + image.alt : ""); image.replaceWith(text); }
        } catch { image.remove(); }
      });
      doc.replaceChildren(fragment);
      if (metadata.entries.length) {
        const panel = document.createElement("section"); panel.className = "mv-meta";
        const heading = document.createElement("div"); heading.className = "mv-meta-label"; heading.textContent = T.metadata; panel.appendChild(heading);
        const list = document.createElement("dl");
        for (const [key, value] of metadata.entries) {
          const label = document.createElement("dt"); label.textContent = key;
          const val = document.createElement("dd");
          if (key === "tags" && /^\[.*\]$/.test(value)) for (const tag of value.slice(1, -1).split(",").filter(x => x.trim())) { const chip = document.createElement("span"); chip.className = "mv-tag"; chip.textContent = tag.trim().replace(/^['"]|['"]$/g, ""); val.appendChild(chip); }
          else val.textContent = value;
          list.append(label, val);
        }
        panel.appendChild(list); doc.prepend(panel);
      }
      doc.querySelectorAll("a[href]").forEach(a => {
        const h = a.getAttribute("href") || "";
        if (/^(https?:)?\/\//i.test(h)) { a.target = "_blank"; a.rel = "noopener noreferrer"; }
      });
      const heads = [...doc.querySelectorAll("h1,h2,h3")];
      const used = new Set();
      tocList.innerHTML = "";
      heads.forEach(h => {
        let id = slugify(h.textContent || "");
        let n = 1; const base = id;
        while (used.has(id)) id = base + "-" + (++n);
        used.add(id); h.id = id;
        const lvl = h.tagName === "H1" ? 1 : h.tagName === "H2" ? 2 : 3;
        const a = document.createElement("a");
        a.href = "#" + id; a.textContent = h.textContent; a.className = "l" + lvl;
        a.onclick = (e) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); };
        tocList.appendChild(a);
      });
      if (!heads.length) tocList.innerHTML = `<span style="color:var(--mv-muted)">${T.noHeads}</span>`;
      setupSpy(heads);
      enhanceAlerts();
      paintStatus(false);
      rawPre.textContent = raw;

      doc.querySelectorAll("pre").forEach(pre => {
        if (pre.parentElement?.classList.contains("mv-code-wrap")) return;
        if (pre.querySelector("code.language-mermaid")) return; // mermaid заменит сам
        const wrap = document.createElement("div");
        wrap.className = "mv-code-wrap";
        pre.parentNode.insertBefore(wrap, pre);
        wrap.appendChild(pre);
        const b = document.createElement("button");
        b.className = "mv-copy"; b.textContent = T.codeCopy;
        b.onclick = async () => {
          try { await navigator.clipboard.writeText(pre.innerText); b.textContent = T.codeOk; }
          catch { b.textContent = T.codeFail; }
          setTimeout(() => b.textContent = T.codeCopy, 1500);
        };
        wrap.appendChild(b);
      });

      enhancements = Promise.allSettled([renderMath(restoreMath(), version, mathStore.slice()), highlightCode(version), renderMermaid(version)]);
      if (!searchBox.hidden) searchDocument();
    }

    function setMode(m, saveCfg = true) {
      root.dataset.mode = m;
      root.querySelectorAll('[data-act="preview"],[data-act="split"],[data-act="edit"],[data-act="raw"]')
        .forEach(b => b.classList.toggle("active", b.dataset.act === m));
      if (saveCfg) { cfg.mode = m; try { chrome.storage.sync.set({ mode: m }); } catch {} }
    }
    function setToc(show, saveCfg = true) {
      tocBox.classList.toggle("hidden", !show);
      root.querySelector('[data-act="toc"]').classList.toggle("active", show);
      if (saveCfg) { cfg.toc = show; try { chrome.storage.sync.set({ toc: show }); } catch {} }
    }
    function paintTheme() {
      const b = root.querySelector('[data-act="theme"]');
      if (b) b.textContent = `${T.theme}: ${root.dataset.theme}`;
    }
    function setTheme(next, saveCfg = true) {
      root.dataset.theme = next;
      paintTheme();
      if (saveCfg) { cfg.theme = next; try { chrome.storage.sync.set({ theme: next }); } catch {} }
    }
    function setWidth(w, saveCfg = true) {
      root.dataset.width = w;
      if (saveCfg) { cfg.width = w; try { chrome.storage.sync.set({ width: w }); } catch {} }
    }
    function setFont(f, saveCfg = true) {
      root.dataset.font = f;
      if (saveCfg) { cfg.font = f; try { chrome.storage.sync.set({ font: f }); } catch {} }
    }


    function clearSearch() {
      doc.querySelectorAll("mark.mv-found").forEach(mark => mark.replaceWith(document.createTextNode(mark.textContent)));
      doc.normalize(); matches = []; activeMatch = -1;
    }
    function searchDocument() {
      clearSearch();
      const query = searchInput.value.toLocaleLowerCase(lang);
      if (query) {
        const walker = document.createTreeWalker(doc, NodeFilter.SHOW_TEXT, { acceptNode(node) {
          return node.parentElement.closest("button,svg,.mv-math,.katex,.mv-mermaid") ? NodeFilter.FILTER_SKIP : NodeFilter.FILTER_ACCEPT;
        } });
        const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
        for (const node of nodes) {
          const value = node.nodeValue, lower = value.toLocaleLowerCase(lang), frag = document.createDocumentFragment();
          let pos = 0, index;
          while ((index = lower.indexOf(query, pos)) !== -1 && matches.length < 2000) {
            frag.appendChild(document.createTextNode(value.slice(pos, index)));
            const mark = document.createElement("mark"); mark.className = "mv-found"; mark.textContent = value.slice(index, index + query.length);
            frag.appendChild(mark); matches.push(mark); pos = index + query.length;
          }
          if (pos) { frag.appendChild(document.createTextNode(value.slice(pos))); node.replaceWith(frag); }
        }
      }
      if (matches.length) moveMatch(1); else $(".mv-match-count").textContent = query ? T.noMatches : "";
    }
    function moveMatch(delta) {
      if (!matches.length) return;
      matches[activeMatch]?.classList.remove("active");
      activeMatch = (activeMatch + delta + matches.length) % matches.length;
      matches[activeMatch].classList.add("active"); matches[activeMatch].scrollIntoView({ block: "center" });
      $(".mv-match-count").textContent = `${activeMatch + 1} / ${matches.length}${matches.length === 2000 ? "+" : ""}`;
    }
    function openSearch() { if (root.dataset.mode === "edit" || root.dataset.mode === "raw") setMode("preview"); searchBox.hidden = false; searchInput.focus(); searchInput.select(); searchDocument(); }
    function closeSearch() { searchBox.hidden = true; clearSearch(); }
    searchInput.addEventListener("input", searchDocument);
    searchInput.addEventListener("keydown", event => { if (event.key === "Enter") { event.preventDefault(); moveMatch(event.shiftKey ? -1 : 1); } });
    document.addEventListener("kd-toggle", () => setMode(root.dataset.mode === "raw" ? "preview" : "raw"));

    async function exportHTML() {
      await enhancements;
      const clone = doc.cloneNode(true);
      clone.querySelectorAll("button").forEach(node => node.remove());
      clone.querySelectorAll("mark.mv-found").forEach(node => node.replaceWith(document.createTextNode(node.textContent)));
      let css = await (await fetch(extURL("viewer.css"))).text();
      let mathCSS = await (await fetch(extURL("vendor/katex/katex.min.css"))).text();
      const fontURLs = [...new Set([...mathCSS.matchAll(/url\(([^)]+)\)/g)].map(match => match[1]))];
      for (const url of fontURLs) {
        const blob = await (await fetch(extURL("vendor/katex/" + url))).blob();
        const data = await new Promise(resolve => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.readAsDataURL(blob); });
        mathCSS = mathCSS.split('url(' + url + ')').join('url(' + data + ')');
      }
      // Explicitly enabled remote images remain URLs; local images are embedded when readable.
      for (const image of clone.querySelectorAll("img[src^='file:']")) {
        try {
          const result = await chrome.runtime.sendMessage({ type: "read-image", url: image.src });
          if (!result?.ok || !/^data:image\//.test(result.data)) throw new Error("Not an image");
          image.src = result.data;
        }
        catch { image.replaceWith(document.createTextNode(image.alt || T.imageBlocked)); }
      }
      css += "\nhtml,body,#mv-root,.mv-body,.mv-main{height:auto!important;overflow:visible!important}#mv-root{position:static!important;display:block!important;background:none!important} .mv-doc{max-width:960px;margin:auto;padding:40px}.mv-code-wrap{position:static}";
      const title = currentName.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
      const html = '<!doctype html><html lang="' + lang + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src data: https: http:; style-src \'unsafe-inline\'; font-src data:"><title>' + title + '</title><style>' + css + mathCSS + '</style></head><body><div id="mv-root" data-theme="' + (effectiveDark() ? 'dark' : 'light') + '">' + clone.outerHTML + '</div></body></html>';
      const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
      const a = document.createElement("a"); a.href = url; a.download = currentName.replace(/\.[^.]+$/, "") + ".html"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 5000);
    }
    let polling = false, readFailures = 0;
    setInterval(async () => {
      if (!cfg.autoReload || picked || !fileURL.startsWith("file:") || document.hidden || polling || readFailures >= 3) return;
      polling = true;
      try {
        const response = await chrome.runtime.sendMessage({ type: "read-file" });
        if (!response?.ok) throw new Error("read");
        readFailures = 0;
        const decision = KDCore.reloadDecision(raw, diskRaw, response.text);
        if (decision === "reload") { const top = mainEl.scrollTop; raw = diskRaw = response.text; editor.value = raw; render(); mainEl.scrollTop = top; }
        else if (decision === "conflict") { pendingDisk = response.text; $(".mv-reload").hidden = false; }
      } catch { if (++readFailures === 3) toast(T.reloadFail); }
      finally { polling = false; }
    }, 2000);

    // init
    applyLang();
    setMode(root.dataset.mode, false);
    setToc(cfg.toc !== false, false);
    root.querySelector('[data-act="toc"]').classList.toggle("active", cfg.toc !== false);

    async function offerDraft(original) {
      banner.classList.remove("show"); draftTs = null;
      try {
        const d = await chrome.storage.local.get({ [draftKey]: null });
        const saved = d[draftKey];
        if (!saved || typeof saved.text !== "string" || saved.text === original) return;
        draftTs = saved.ts;
        banner.classList.add("show");
        banner.querySelector("span").textContent = T.draftFound(new Date(saved.ts).toLocaleString(lang));
        banner.querySelector('[data-act="restore"]').onclick = () => {
          clearTimeout(deb); raw = saved.text; editor.value = raw; render(); banner.classList.remove("show"); toast(T.restored);
        };
        banner.querySelector('[data-act="drop-draft"]').onclick = async () => {
          clearTimeout(timer); await chrome.storage.local.remove(draftKey); draftTs = null; banner.classList.remove("show"); toast(T.dropped);
        };
      } catch { /* Local storage may be unavailable in a restricted profile. */ }
    }
    await offerDraft(raw0);

    // scroll: прогресс + память позиции
    const scrollKey = () => draftKey + ":scroll";
    let scrollSaveT = null;
    function onMainScroll() {
      const max = mainEl.scrollHeight - mainEl.clientHeight;
      progress.style.width = (max > 0 ? Math.min(100, mainEl.scrollTop / max * 100) : 0) + "%";
      clearTimeout(scrollSaveT);
      scrollSaveT = setTimeout(() => {
        try { chrome.storage.local.set({ [scrollKey()]: mainEl.scrollTop }); } catch {}
      }, 400);
    }
    mainEl.addEventListener("scroll", onMainScroll, { passive: true });

    root.addEventListener("click", async (e) => {
      const b = e.target.closest("[data-act]");
      if (!b) return;
      const act = b.dataset.act;
      if (act === "preview" || act === "split" || act === "edit" || act === "raw") setMode(act);
      else if (act === "toc") setToc(tocBox.classList.contains("hidden"));
      else if (act === "theme") {
        const order = ["auto", "light", "dark"];
        setTheme(order[(order.indexOf(root.dataset.theme) + 1) % order.length]);
      }
      else if (act === "copy-md") {
        try { await navigator.clipboard.writeText(raw); toast(T.copied); }
        catch { toast(T.copyFail); }
      }
      else if (act === "open") fileInput.click();
      else if (act === "save") save();
      else if (act === "search") openSearch();
      else if (act === "search-close") closeSearch();
      else if (act === "search-next") moveMatch(1);
      else if (act === "search-prev") moveMatch(-1);
      else if (act === "export-html") { try { await exportHTML(); } catch { toast(T.exportFail); } }
      else if (act === "export-pdf") { toast(T.pdfHint); window.print(); }
      else if (act === "reload-disk" && pendingDisk !== null) {
        clearTimeout(deb); raw = diskRaw = pendingDisk; pendingDisk = null; editor.value = raw; $(".mv-reload").hidden = true;
        clearTimeout(timer); await chrome.storage.local.remove(draftKey); render();
      }
    });

    function save() {
      const blob = new Blob([raw], { type: "text/markdown;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = currentName;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      toast(T.saved);
    }

    async function openFile(file) {
      if (!file) return;
      try {
        const text = await file.text();
        picked = true; pendingDisk = null; $(".mv-reload").hidden = true;
        clearTimeout(timer); clearTimeout(deb);
        raw = text;
        currentName = file.name || "document.md";
        editor.value = text;
        const fingerprint = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
        draftKey = "draft:picked:" + currentName + ":" + [...new Uint8Array(fingerprint)].map(n => n.toString(16).padStart(2, "0")).join("");
        draftTs = null;
        banner.classList.remove("show");
        document.title = currentName.replace(/\.mdx?$/i, "") + " — KarmDown";
        root.querySelector(".mv-file").textContent = currentName;
        root.querySelector(".mv-file").title = currentName;
        mainEl.scrollTop = 0;
        progress.style.width = "0%";
        render();
        await offerDraft(text);
        toast(T.opened(currentName));
      } catch { toast(T.openFail); }
    }
    fileInput.addEventListener("change", () => {
      openFile(fileInput.files && fileInput.files[0]);
      fileInput.value = "";
    });
    root.addEventListener("dragover", (e) => { e.preventDefault(); });
    root.addEventListener("drop", (e) => {
      e.preventDefault();
      const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) openFile(f);
    });

    let deb = null;
    editor.addEventListener("input", () => {
      raw = editor.value;
      persistDraft();
      clearTimeout(deb);
      deb = setTimeout(render, 180);
      paintStatus(true);
    });
    document.addEventListener("keydown", (e) => {
      const typing = e.target.closest?.("input,textarea,[contenteditable]");
      if (((e.key === "/" && !typing) || ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "f"))) { e.preventDefault(); openSearch(); }
      if (e.key === "Escape") closeSearch();
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") { e.preventDefault(); save(); }
    });

    // Realtime: настройки из popup применяются без перезагрузки
    try {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== "sync") return;
        let needLang = false;
        if (changes.enabled && !changes.enabled.newValue) { location.reload(); return; }
        if (changes.theme) {
          setTheme(changes.theme.newValue, false); cfg.theme = changes.theme.newValue;
          if (hasMermaid) render();
        }
        if (changes.toc) setToc(!!changes.toc.newValue, false), cfg.toc = !!changes.toc.newValue;
        if (changes.mode) setMode(changes.mode.newValue, false), cfg.mode = changes.mode.newValue;
        if (changes.width) setWidth(changes.width.newValue, false), cfg.width = changes.width.newValue;
        if (changes.font) setFont(changes.font.newValue, false), cfg.font = changes.font.newValue;
        if (changes.autoReload) cfg.autoReload = !!changes.autoReload.newValue;
        if (changes.remoteImages) { cfg.remoteImages = !!changes.remoteImages.newValue; render(); }
        if (changes.lang) { cfg.lang = changes.lang.newValue; needLang = true; }
        if (needLang) { applyLang(); render(); }
      });
    } catch {}

    render();
    try {
      const d = await chrome.storage.local.get({ [scrollKey()]: 0 });
      if (d[scrollKey()] > 0) requestAnimationFrame(() => { mainEl.scrollTop = d[scrollKey()]; onMainScroll(); });
    } catch {}
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", main);
  else main();
})();
