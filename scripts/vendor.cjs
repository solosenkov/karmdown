const fs = require('node:fs');
const path = require('node:path');
const {buildSync} = require('esbuild');
const crypto=require('node:crypto');
const bundled=[];
const copy = (source, target) => { fs.mkdirSync(path.dirname(target), {recursive:true}); fs.copyFileSync(source,target); };
copy('node_modules/marked/lib/marked.umd.js', 'vendor/marked.min.js');
copy('node_modules/dompurify/dist/purify.min.js', 'vendor/dompurify.min.js');
copy('node_modules/katex/dist/katex.min.js', 'vendor/katex/katex.min.js');
let css = fs.readFileSync('node_modules/katex/dist/katex.min.css','utf8');
css = css.replace(/url\([^)]*\.woff\) format\("woff"\),?/g,'').replace(/,?url\([^)]*\.ttf\) format\("truetype"\)/g,'');
fs.writeFileSync('vendor/katex/katex.min.css',css);
fs.rmSync('vendor/katex/fonts',{recursive:true,force:true}); fs.mkdirSync('vendor/katex/fonts');
for (const name of fs.readdirSync('node_modules/katex/dist/fonts').filter(name => name.endsWith('.woff2'))) copy('node_modules/katex/dist/fonts/'+name, 'vendor/katex/fonts/'+name);
bundled.push(buildSync({metafile:true,stdin:{contents:'import mermaid from "mermaid"; globalThis.mermaid = mermaid;',resolveDir:process.cwd()},bundle:true,minify:true,target:'chrome116',platform:'browser',format:'iife',outfile:'vendor/mermaid.min.js',legalComments:'linked'}));
bundled.push(buildSync({metafile:true,stdin:{contents:'import hljs from "highlight.js/lib/common"; globalThis.hljs = hljs;',resolveDir:process.cwd()},bundle:true,minify:true,target:'chrome116',platform:'browser',format:'iife',outfile:'vendor/hljs.min.js',legalComments:'linked'}));
fs.rmSync('vendor/mermaid-bridge.js',{force:true});
const notices = ['# Third-party licenses\n\nAll executable dependencies are bundled locally. Mermaid transitive license notices are also retained beside its bundle.\n'];
const packageRoots = new Set(['node_modules/marked','node_modules/dompurify','node_modules/katex','node_modules/mermaid','node_modules/highlight.js']);
for(const result of bundled)for(const file of Object.keys(result.metafile.inputs)){
 if(!file.includes('node_modules/'))continue;
 const pieces=file.split('/');const start=pieces.lastIndexOf('node_modules');
 const base=pieces.slice(0,start+(pieces[start+1].startsWith('@')?3:2)).join('/');packageRoots.add(base);
}
for (const base of [...packageRoots].sort()) {
 const pkg=base;
 const metadata=JSON.parse(fs.readFileSync(base+'/package.json','utf8'));
 const license=fs.readdirSync(base).find(name=>/^(license|licence|copying)(?:\.|$)/i.test(name));
 if(!license) throw new Error('Missing license: '+pkg);
 notices.push('## '+pkg+' '+metadata.version+'\n\n'+fs.readFileSync(base+'/'+license,'utf8'));
}
fs.writeFileSync('THIRD_PARTY_NOTICES.md',notices.join('\n\n'));

const sums={};
function hashDir(dir){for(const name of fs.readdirSync(dir)){const file=dir+'/'+name;if(fs.statSync(file).isDirectory())hashDir(file);else if(name!=='checksums.json')sums[file]=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');}}
hashDir('vendor');fs.writeFileSync('vendor/checksums.json',JSON.stringify(sums,null,2)+'\n');
console.log('Vendored '+packageRoots.size+' packages with complete license notices.');
