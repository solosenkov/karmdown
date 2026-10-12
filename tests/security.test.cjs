const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
test('worker refuses foreign frames and arbitrary library paths',async()=>{
 let listener;const calls=[];
 const chrome={runtime:{id:'test',onMessage:{addListener(fn){listener=fn}}},scripting:{executeScript(args){calls.push(args);return Promise.resolve()}},commands:{onCommand:{addListener(){}}}};
 vm.runInNewContext(fs.readFileSync('background.js','utf8'),{chrome,URL,fetch:()=>{throw Error('unexpected fetch')}});
 const sender={id:'test',tab:{id:7},frameId:0,url:'file:///tmp/document.md'};
 assert.equal(listener({type:'library',key:'../../secret'},sender,()=>{}),undefined);
 assert.equal(listener({type:'library',key:'hljs'},{...sender,frameId:1},()=>{}),undefined);
 assert.equal(listener({type:'library',key:'hljs'},{...sender,id:'other'},()=>{}),undefined);
 let response;assert.equal(listener({type:'library',key:'hljs'},sender,value=>{response=value}),true);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(calls.length,1);assert.equal(calls[0].files[0],'vendor/hljs.min.js');assert.equal(response.ok,true);
});
test('language defaults and new keys match in Russian and English',()=>{
 for(const filename of ['content.js','popup.js']){
  const source=fs.readFileSync(filename,'utf8');assert.match(source,/lang: "en"/);
  const start=source.indexOf(filename==='content.js'?'const STR =':'const I18N =');
  const opening=source.indexOf('{',start);let depth=0,end;
  // Use the dictionary literal only; functions are safe fixed product strings.
  let inString=null,escape=false;
  for(let i=opening;i<source.length;i++){const char=source[i];if(inString){if(escape){escape=false;continue}if(char==='\\'){escape=true;continue}if(char===inString)inString=null;continue}if(['"',"'",'`'].includes(char)){inString=char;continue}if(char==='{')depth++;if(char==='}'&&!--depth){end=i+1;break}}
  const dict=vm.runInNewContext('('+source.slice(opening,end)+')');
  assert.deepEqual(Object.keys(dict.en).sort(),Object.keys(dict.ru).sort());
 }
});
test('command toggles an existing viewer or injects only packaged scripts into the active tab',async()=>{
 const source=fs.readFileSync('background.js','utf8');
 for(const active of [true,false]){
  let listener;const calls=[];
  const chrome={runtime:{id:'test',onMessage:{addListener(){}}},commands:{onCommand:{addListener(fn){listener=fn}}},tabs:{query:async()=>[{id:42}]},scripting:{executeScript:async args=>{calls.push(args);return [{result:active}]}}};
  vm.runInNewContext(source,{chrome,URL});
  await listener('other-command');assert.equal(calls.length,0);
  await listener('toggle-view');assert.equal(calls.length,active?1:4);
  for(const call of calls)assert.equal(call.target.tabId,42);
  if(!active){assert.equal(calls[1].files.join(','),'vendor/marked.min.js,vendor/dompurify.min.js,core.js');assert.equal(calls[3].files[0],'content.js');}
 }
});
