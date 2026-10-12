/* Pure parsing helpers shared by the viewer and regression tests. */
(function (root) {
  const api = {
    isMarkdownURL(value) {
      try { const u = new URL(value); return (u.protocol !== 'file:' || !u.hostname || u.hostname === 'localhost') && ['file:', 'http:', 'https:'].includes(u.protocol) && /\.(md|markdown|mdown|mkd|mdx)$/i.test(u.pathname); } catch { return false; }
    },
    frontmatter(source) {
      const match = source.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
      if (!match) return { body: source, entries: [] };
      const entries = [];
      for (const line of match[1].split(/\r?\n/)) {
        const pair = line.match(/^([\w.-]+):\s*(.*)$/);
        if (pair) { let value = pair[2]; if (/^(["']).*\1$/.test(value)) value = value.slice(1, -1); entries.push([pair[1], value]); }
        else if (/^\s+\S/.test(line) && entries.length) entries[entries.length - 1][1] += '\n' + line;
      }
      // No partial YAML interpretation: unsupported top-level syntax remains Markdown.
      if (match[1].split(/\r?\n/).some(line => line.trim() && !/^\s|^[\w.-]+:|^#/.test(line))) return { body: source, entries: [] };
      return { body: source.slice(match[0].length), entries };
    },
    protectMath(source) {
      const items = [];
      const prefix = 'KDMATH' + Math.random().toString(36).slice(2) + 'X';
      const parts = source.split(/(^[ \t]*(?:`{3,}|~{3,})[^\n]*\n[\s\S]*?^[ \t]*(?:`{3,}|~{3,})[^\n]*$|`+[^`\n]*`+)/gm);
      const token = (tex, display) => { items.push({ tex: tex.trim(), display }); return prefix + (items.length - 1) + 'END'; };
      const processed = parts.map((part, index) => index % 2 ? part : part
        .replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => '\n\n' + token(tex, true) + '\n\n')
        .replace(/(^|[^$\\\n])\$(?!\d)([^$\n]+?)\$(?!\$|\d)/gm, (_, pre, tex) => pre + token(tex, false))).join('');
      return { source: processed, items, prefix };
    },
    reloadDecision(current, previous, next) {
      if (next === previous) return 'unchanged';
      return current === previous ? 'reload' : 'conflict';
    }
  };
  root.KDCore = api;
  if (typeof module !== 'undefined') module.exports = api;
})(globalThis);
