const {test} = require('node:test');
const assert = require('node:assert/strict');
const core = require('../core.js');
test('only supported file/http Markdown URLs auto-render', () => {
  for (const url of ['file:///tmp/a.MD', 'https://example.com/a.md?q=1', 'https://example.com/a.markdown#h']) assert.equal(core.isMarkdownURL(url), true);
  for (const url of ['https://example.com/a.md/other', 'https://example.com/?a=x.md', 'chrome://extensions', 'file://server/share.md', 'https://example.com/index.html']) assert.equal(core.isMarkdownURL(url), false);
});
test('frontmatter starts at the beginning, preserves nested YAML as literal text', () => {
  const result = core.frontmatter('---\ntitle: "Test <img>"\ntags: [one, two]\nconfig:\n  nested: true\n---\n# Hello');
  assert.equal(result.body, '# Hello');
  assert.equal(result.entries[0][1], 'Test <img>');
  assert.equal(result.entries[2][1], '\n  nested: true');
  assert.equal(core.frontmatter('before\n---\ntitle: x\n---').entries.length, 0);
  assert.equal(core.frontmatter('---\ntitle: x').entries.length, 0);
});
test('math does not corrupt fenced/inline code or monetary amounts', () => {
  const result = core.protectMath('`$x$`\n```js\nconst s = "$x$";\n```\n$E=mc^2$\n$$x^2$$\n$10 and $20');
  assert.equal(result.items.length, 2);
  assert.match(result.source, /`\$x\$`/);
  assert.match(result.source, /const s = "\$x\$"/);
  assert.match(result.source, /\$10 and \$20/);
});
test('reload never replaces an edited or restored draft', () => {
  assert.equal(core.reloadDecision('disk', 'disk', 'new'), 'reload');
  assert.equal(core.reloadDecision('edit', 'disk', 'new'), 'conflict');
  assert.equal(core.reloadDecision('edit', 'disk', 'disk'), 'unchanged');
});
