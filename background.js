const libraries = {
  hljs: ['vendor/hljs.min.js'],
  katex: ['vendor/katex/katex.min.js'],
  mermaid: ['vendor/mermaid.min.js']
};
const markdownURL = value => { try { const u = new URL(value); return (u.protocol !== 'file:' || !u.hostname || u.hostname === 'localhost') && /^(file|https?):$/.test(u.protocol) && /\.(md|markdown|mdown|mkd|mdx)$/i.test(u.pathname); } catch { return false; } };
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (sender.id !== chrome.runtime.id || !sender.tab || sender.frameId !== 0) return;
  if (message?.type === 'library' && Object.hasOwn(libraries, message.key)) {
    chrome.scripting.executeScript({ target: { tabId: sender.tab.id, frameIds: [0] }, files: libraries[message.key] })
      .then(() => respond({ ok: true }), () => respond({ ok: false }));
    return true;
  }
  if (message?.type === 'read-image' && sender.url?.startsWith('file:') && markdownURL(sender.url)) {
    let url;
    try { url = new URL(message.url); } catch { respond({ ok: false }); return; }
    if (url.protocol !== 'file:' || (url.hostname && url.hostname !== 'localhost') || !/\.(png|jpe?g|gif|webp|avif|svg)$/i.test(url.pathname)) { respond({ ok: false }); return; }
    fetch(url.href).then(async response => {
      if (!response.ok) throw new Error('read');
      const blob = await response.blob();
      if (!/^image\//i.test(blob.type) || blob.size > 10_000_000) throw new Error('image');
      const bytes = new Uint8Array(await blob.arrayBuffer());
      const header = new TextDecoder().decode(bytes.slice(0, 1024));
      const image = (bytes[0] === 137 && header.slice(1, 4) === 'PNG') || (bytes[0] === 255 && bytes[1] === 216) || header.startsWith('GIF8') || (header.startsWith('RIFF') && header.slice(8, 12) === 'WEBP') || /<svg[\s>]/i.test(header) || /ftypavif|ftypavis/.test(header.slice(0, 32));
      if (!image) throw new Error('image');
      let binary = ''; for (let index = 0; index < bytes.length; index += 32768) binary += String.fromCharCode(...bytes.subarray(index, index + 32768));
      respond({ ok: true, data: 'data:' + blob.type + ';base64,' + btoa(binary) });
    }).catch(() => respond({ ok: false }));
    return true;
  }
  if (message?.type === 'read-file' && sender.url?.startsWith('file:') && markdownURL(sender.url)) {
    fetch(sender.url, { cache: 'no-store' }).then(async response => {
      if (!response.ok) throw new Error('read');
      const text = await response.text();
      respond(text.length <= 5_000_000 ? { ok: true, text } : { ok: false });
    }).catch(() => respond({ ok: false }));
    return true;
  }
});
chrome.commands.onCommand.addListener(async command => {
  if (command !== 'toggle-view') return;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    const result = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => {
      if (globalThis.__mvActive) { document.dispatchEvent(new Event('kd-toggle')); return true; }
      return false;
    } });
    if (result[0]?.result) return;
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['vendor/marked.min.js', 'vendor/dompurify.min.js', 'core.js'] });
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => { globalThis.__kdManual = true; } });
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
  } catch { /* Restricted browser pages are intentionally untouched. */ }
});
