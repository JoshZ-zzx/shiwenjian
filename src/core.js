const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function hl(s,k){return k?String(s).split(k).map(esc).join('<mark>'+esc(k)+'</mark>'):esc(s)}

function keywords(r){
 const result=[];
 // 仅提取原句中确实存在、且以句号/分号分隔的明确解释项。
 for(const m of r.g.matchAll(/(?:^|[。；])([\u3400-\u9fff]{1,4})[，：]([^。；]+)/g)){
  if(r.c.includes(m[1])&&m[1]!==r.t)result.push({t:m[1],g:m[2]+'。'});
 }
 return result;
}

function classify(r,k,scope){
 if(scope==='all'||scope==='term'){
  if(r.t===k)return 0;if(r.keys.some(x=>x.t===k))return 1;
  if(r.t.includes(k)||r.keys.some(x=>x.t.includes(k)))return 2;
 }
 if((scope==='all'||scope==='clause')&&r.c.includes(k))return 3;
 if((scope==='all'||scope==='gloss')&&r.g.includes(k))return 4;
 return -1;
}

function norm(s){return s.replace(/[\s\p{P}\p{S}]/gu,'')}
function normalizedMap(s){let text='',map=[];for(let i=0;i<s.length;){const c=String.fromCodePoint(s.codePointAt(i));if(norm(c)){text+=c;for(let j=0;j<c.length;j++)map.push(i+j)}i+=c.length}map.push(s.length);return {text,map}}

export { esc, hl, keywords, classify, norm, normalizedMap };
