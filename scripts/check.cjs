const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const assert=require('node:assert/strict');
for(const file of ['core.js','content.js','background.js','popup.js','viewer-entry.js'])execFileSync(process.execPath,['--check',file]);
const manifest=JSON.parse(fs.readFileSync('manifest.json','utf8'));
assert.equal(manifest.name,'KarmDown — Markdown Viewer & Editor');
assert.ok(manifest.description.length<=132);
assert.deepEqual(manifest.permissions,['storage','scripting','activeTab']);
assert.deepEqual(manifest.host_permissions,['file://*/*']);
assert.deepEqual(manifest.content_scripts[0].matches,['file://*/*']);
assert.ok(!manifest.content_scripts[0].css);
assert.ok(manifest.content_scripts[0].include_globs.includes('*.Md*'));
const sums=JSON.parse(fs.readFileSync('vendor/checksums.json','utf8'));
for(const [name,sha]of Object.entries(sums))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(name)).digest('hex'),sha,`Modified vendor asset ${name}`);
for(const filename of ['content.js','popup.js','popup.html','viewer.html','background.js','README.md','PRIVACY.md']){
 const text=fs.readFileSync(filename,'utf8');assert.doesNotMatch(text,/\/Users\/|MarkView|markdown-extesn|api[_-]?key\s*[:=]\s*["'][^"']+["']/i);
}
assert.doesNotMatch(fs.readFileSync('vendor/katex/katex.min.css','utf8'),/\.ttf|\.woff\)/);
execFileSync(process.execPath,['--test','tests/core.test.cjs','tests/security.test.cjs'],{stdio:'inherit'});
console.log('Manifest, syntax, packaging guards and vendor checksums passed.');
