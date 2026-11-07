const fs = require('fs');
const vm = require('vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('model-matcher.js', 'utf8');
const database = JSON.parse(fs.readFileSync('model.json'));
// 独立沙箱覆盖缓存、失败重试及原始 EXIF 回退，不依赖网络。
async function main() {
 let requests = 0;
 let fail = false;
 const context = vm.createContext({AbortController, setTimeout, clearTimeout, fetch: async () => {
  requests++;
  if(fail) throw new Error('offline');
  return {ok:true, json:async()=>database};
 }});
 const matcher = vm.runInContext(source + '\nModelMatcher;', context);
 for (const [Make, Model, expected] of [
  ['sony', ' ilce-7m4\0', 'SONY Alpha 7 IV'],
  ['SONY CORPORATION', 'ILCE-1M2', 'SONY Alpha 1 II'],
  ['Xiaomi', '25010PN30G', 'Xiaomi 15 Ultra'],
  ['Canon', 'Canon EOS M50m2', 'Canon EOS M50 Mark II'],
  ['Canon', ' ILCE-1M2 ', ' ILCE-1M2 '],
  ['', 'Unknown model', 'Unknown model'],
  ['SONY', '', '']
 ]) assert.equal((await matcher.resolve({Make,Model})).name, expected);
 assert.equal(requests,1);
 const conflict=matcher.lookup({Sony:{X:'A'}, SONY:{X:'B'}},{Make:'sony',Model:'X'});
 assert.equal(conflict.name,'X'); assert.equal(conflict.matched,false);
 fail=true;
 const retry=vm.runInContext(source.replace('const ModelMatcher', 'const RetryMatcher')+'\nRetryMatcher;',context);
 assert.equal((await retry.resolve({Make:'SONY',Model:'ILCE-1M2'})).name,'ILCE-1M2');
 fail=false;
 assert.equal((await retry.resolve({Make:'SONY',Model:'ILCE-1M2'})).matched,true);
 console.log('PASS: model matching, aliases, ambiguity, fallback, caching and failed-load retry.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
