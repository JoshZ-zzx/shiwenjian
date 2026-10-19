import { DATA } from '../data/annotations.js';
import { LESSONS } from '../data/lessons.js';
import { TEXTS } from '../data/texts.js';
import { esc, hl, keywords, classify, norm, normalizedMap } from './core.js';
'use strict';
// 页面状态、浏览器存储与交互控制。数据顺序与旧版一致，保留原有收藏编号。
const $=id=>document.getElementById(id);
const BOOKS=[...new Set(LESSONS.map(x=>x[0]))];
const rows=DATA.map((a,i)=>{const r={i,t:a[0],c:a[1],g:a[2],b:a[3],l:a[4]};r.keys=keywords(r);return r});
const byLesson=new Map();for(const r of rows){const k=r.b+'|'+r.l;if(!byLesson.has(k))byLesson.set(k,[]);byLesson.get(k).push(r)}
function readLocal(k,fallback){try{return JSON.parse(localStorage.getItem(k))??fallback}catch{return fallback}}
function saveLocal(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{$('storageHint').textContent='当前浏览器无法保存本地记录'}}
const storedSaved=readLocal('gushi.saved.v1',[]);
let saved=new Set((Array.isArray(storedSaved)?storedSaved:[]).filter(x=>Number.isInteger(x)&&rows[x]));
let recents=readLocal('gushi.recent.v1',[]);if(!Array.isArray(recents))recents=[];
let state={view:'index',q:'',scope:'all',book:'',lesson:'',scroll:0,depth:0};
let timer,activeWord=null,lastPanelTrigger=null;
const defaults=()=>({view:'index',q:'',scope:'all',book:'',lesson:'',scroll:0,depth:0});
function parseRoute(){try{const p=new URLSearchParams(location.hash.slice(1));const s={...defaults(),...Object.fromEntries(p)};if(!['index','search','reader','saved'].includes(s.view))s.view='index';if(!['all','term','clause','gloss'].includes(s.scope))s.scope='all';if(s.book&&!BOOKS.includes(s.book))s.book='';return s}catch{return defaults()}}
function route(s){const p=new URLSearchParams();for(const k of ['view','q','scope','book','lesson','focus'])if(s[k]!==undefined&&s[k]!=='')p.set(k,s[k]);return '#'+p}
function remember(){state.scroll=window.scrollY;try{history.replaceState({...state},'',route(state))}catch{}saveLocal('gushi.position.v1',state)}
function navigate(next,{replace=false}={}){clearTimeout(timer);remember();const depth=(Number(state.depth)||0)+(replace?0:1);state={...defaults(),...next,scroll:0,depth};try{history[replace?'replaceState':'pushState']({...state},'',route(state))}catch{location.hash=route(state)}render();window.scrollTo(0,0);saveLocal('gushi.position.v1',state)}
function recent(k){if(!k)return;recents=[k,...recents.filter(x=>x!==k)].slice(0,8);saveLocal('gushi.recent.v1',recents)}
function controls(){
 $('q').value=state.q;$('scope').value=state.scope;$('book').innerHTML='<option value="">全部册次</option>'+BOOKS.map(b=>`<option value="${esc(b)}">${esc(b)}</option>`).join('');$('book').value=state.book;
 $('lesson').innerHTML='<option value="">全部篇目</option>'+LESSONS.filter(x=>!state.book||x[0]===state.book).map(x=>`<option value="${esc(x[0]+'|'+x[1])}">${esc(x[1])}</option>`).join('');
 $('lesson').value=state.lesson||'';$('savedCount').textContent=saved.size;
}
function filtered(r){return (!state.book||r.b===state.book)&&(!state.lesson||r.b+'|'+r.l===state.lesson)}
function searchRows(k,scope){const groups=[[],[],[],[],[]];for(const r of rows){if(!filtered(r))continue;const n=classify(r,k,scope);if(n>=0)groups[n].push(r)}return groups}
function selection(r,k){return r.keys.find(x=>x.t===k)}
function card(r,k='',full=false){
 const a=selection(r,k),term=a?a.t:r.t,gloss=a?a.g:r.g;
 const short=gloss.length>65?gloss.slice(0,65)+'…':gloss;
 return `<details class="card" data-row="${r.i}" ${full?'open':''}><summary><div class="summarytop"><span class="term">${hl(term,k)}${a?'<span class="badge">注释关键词</span>':''}</span><span class="source">${esc(r.l)} · ${esc(r.b)}</span></div><div class="preview meaning">${hl(short,k)}</div><span class="reveal">展开后查看答案</span></summary><div class="cardbody"><p class="field"><small>原句</small>${hl(r.c,k)}</p>${a?`<p class="field"><small>关键词义 · 摘自本条注释</small><span class="meaning">${hl(a.g,k)}</span></p>`:''}<div class="field"><small>完整注释 · ${esc(r.t)}</small><div class="meaning">${hl(r.g,k)}</div><button class="reveal" data-action="reveal">显示释义</button></div><div class="actions"><button data-action="read" data-id="${r.i}">查看课文 ↗</button><button data-action="save" data-id="${r.i}" aria-pressed="${saved.has(r.i)}">${saved.has(r.i)?'★ 已收藏':'☆ 收藏'}</button><button data-action="compare" data-id="${r.i}" data-term="${esc(term)}">同词例句</button></div><div class="comparison"></div></div></details>`;
}
function lessonButton(x){return `<button class="lesson-card" data-action="lesson" data-book="${esc(x[0])}" data-lesson="${esc(x[0]+'|'+x[1])}"><span>${esc(x[1])}</span><small>${x[2]} 条注释 ↗</small></button>`}
function showIndex(){
 const ls=LESSONS.filter(x=>(!state.book||x[0]===state.book)&&(!state.lesson||x[0]+'|'+x[1]===state.lesson));
 $('meta').textContent=`课文目录 · ${ls.length} 篇`;
 $('out').innerHTML=`<section class="welcome"><h2>在原文里，读懂每个词。</h2><p>先选课文阅读，或搜索“信”“拔”“确实”。原文下方带点线的文字可以点击查注释。</p>${recents.length?'<div class="recent"><span class="count">最近查询</span>'+recents.map(k=>`<button data-action="query" data-query="${esc(k)}">${esc(k)}</button>`).join('')+'<button data-action="clearRecent">清空</button></div>':''}</section>`+BOOKS.filter(b=>ls.some(x=>x[0]===b)).map(b=>`<h2 class="book-heading">${esc(b)}<span>${ls.filter(x=>x[0]===b).length} 篇</span></h2><div class="lesson-grid">${ls.filter(x=>x[0]===b).map(lessonButton).join('')}</div>`).join('');
}
function showSearch(){
 const k=state.q.trim();if(!k){showIndex();return}const groups=searchRows(k,state.scope),count=groups.reduce((n,a)=>n+a.length,0);
 const titleHits=LESSONS.filter(x=>(!state.book||x[0]===state.book)&&(!state.lesson||x[0]+'|'+x[1]===state.lesson)&&x[1].replace(/[《》·]/g,'').includes(k.replace(/[《》·]/g,'')));
 $('meta').textContent=`“${k}” · ${count} 条注释${titleHits.length?' · '+titleHits.length+' 篇相关课文':''}`;
 const names=['精确词条','注释中的独立关键词','相关词条','原句匹配','释义匹配'];
 $('out').innerHTML=(titleHits.length?'<h2>相关课文</h2><div class="lesson-grid">'+titleHits.map(lessonButton).join('')+'</div>':'')+groups.map((g,i)=>g.length?`<section><h2>${names[i]} <span class="count">${g.length} 条</span></h2>${g.map(r=>card(r,k)).join('')}</section>`:'').join('')+(!count&&!titleHits.length?'<div class="empty">没有找到相应注释。可切换到“全部内容”，或减少筛选条件。</div>':'');
}
function paragraph(p,hits,pi){
 const m=normalizedMap(p),candidates=[];
 for(const r of hits){const c=norm(r.c);if(!c)continue;let start=0,at;
  while((at=m.text.indexOf(c,start))!==-1){
   const terms=[r.t,...r.keys.map(x=>x.t)].map(norm).filter(t=>t&&t.length<=12&&t!==c);
   let found=false;
   for(const t of terms){let ti=c.indexOf(t);while(ti!==-1){candidates.push({a:m.map[at+ti],z:m.map[at+ti+t.length-1]+1,ids:[r.i]});found=true;ti=c.indexOf(t,ti+t.length)}}
   if(!found)candidates.push({a:m.map[at],z:m.map[at+c.length-1]+1,ids:[r.i]});start=at+c.length;
  }
 }
 const grouped=new Map();for(const x of candidates){const key=x.a+':'+x.z;if(grouped.has(key))grouped.get(key).ids.push(...x.ids);else grouped.set(key,x)}
 const selected=[];for(const x of [...grouped.values()].sort((a,b)=>(a.z-a.a)-(b.z-b.a)||a.a-b.a))if(!selected.some(y=>x.a<y.z&&x.z>y.a))selected.push(x);
 selected.sort((a,b)=>a.a-b.a);let cursor=0,html='';for(const x of selected){html+=esc(p.slice(cursor,x.a))+`<button class="word" data-action="note" data-ids="${[...new Set(x.ids)].join(',')}" aria-label="查看 ${esc(p.slice(x.a,x.z))} 的注释">${esc(p.slice(x.a,x.z))}</button>`;cursor=x.z}return `<p id="p-${pi}">${html+esc(p.slice(cursor))}</p>`;
}
function showReader(){
 const tex=TEXTS[state.lesson];if(!tex){$('out').innerHTML='<div class="empty">未找到该篇课文，请返回目录。</div>';return}
 const hits=byLesson.get(state.lesson)||[];
 $('meta').textContent=`${state.book} · ${hits.length} 条注释`;
 $('out').innerHTML=`<article class="reader"><div class="reader-tools"><button data-action="back">← 返回上一页</button><span>点击带点线的词句查看注释</span><button data-action="font">字号 +</button></div><div class="reading"><h2 class="reader-title">${esc(tex.ti)}</h2><div class="author">${esc(tex.au||'')}</div>${tex.p.map((p,i)=>paragraph(p,hits,i)).join('')}</div><details style="margin-top:22px"><summary>本篇全部注释（${hits.length} 条）</summary>${hits.map(r=>card(r)).join('')}</details></article>`;
 if(state.focus!==undefined&&rows[+state.focus])requestAnimationFrame(()=>locate(rows[+state.focus]));
}
function locate(r){const tex=TEXTS[state.lesson];const clause=norm(r.c);let pi=tex.p.findIndex(p=>norm(p).includes(clause));let exact=pi>=0;if(pi<0)pi=tex.p.findIndex(p=>norm(p).includes(norm(r.t)));if(pi>=0){const el=$('p-'+pi);el?.classList.add('target');el?.scrollIntoView({block:'center'});const words=[...(el?.querySelectorAll(".word")||[])].filter(w=>w.dataset.ids.split(",").includes(String(r.i)));const word=words.find(w=>w.textContent===state.q)||words[0];if(word){word.classList.add('active');activeWord=word}openNotes([r.i]);if(!exact)$('panelContent').insertAdjacentHTML('afterbegin','<p class="muted">未能精确匹配原句，已定位到含该词的段落。</p>')}else{openNotes([r.i]);$('panelContent').insertAdjacentHTML('afterbegin','<p class="muted">原文未能精确定位，可对照完整注释阅读。</p>')}}
function closePanel(focus=false){$('panel').hidden=true;document.body.classList.remove('with-panel');activeWord?.classList.remove('active');activeWord=null;if(focus&&lastPanelTrigger?.isConnected)lastPanelTrigger.focus()}
function openNotes(ids,term=state.q){$('panelContent').innerHTML=ids.filter(i=>rows[i]).map(i=>card(rows[i],term,true)).join('');$('panel').hidden=false;document.body.classList.add('with-panel')}
function render(){closePanel();controls();if(state.view==='reader')showReader();else if(state.view==='search')showSearch();else if(state.view==='saved'){const hits=rows.filter(r=>saved.has(r.i)&&filtered(r));$('meta').textContent=`我的收藏 · ${hits.length} 条`;$('out').innerHTML=hits.length?hits.map(r=>card(r)).join(''):'<div class="empty">暂无收藏。展开一条注释后，点击“收藏”即可保存。</div>'}else showIndex()}
function readRow(id){const r=rows[id];if(!r)return;navigate({...state,view:'reader',book:r.b,lesson:r.b+'|'+r.l,focus:id})}
function applySearch(replace=false){const k=$('q').value.trim();const s={view:k?'search':'index',q:k,scope:$('scope').value,book:$('book').value,lesson:$('lesson').value};recent(k);navigate(s,{replace})}
function comparison(button,r,term){
 const box=button.closest('.cardbody').querySelector('.comparison');if(box.innerHTML){box.innerHTML='';button.setAttribute('aria-expanded','false');return}
 const hits=rows.filter(x=>x.i!==r.i&&(x.t===term||x.keys.some(k=>k.t===term)));
 box.innerHTML='<div class="compare"><h3>“'+esc(term)+'”的同词例句</h3>'+(hits.length?hits.map(x=>{const a=selection(x,term);return `<button data-action="read" data-id="${x.i}"><span class="source">${esc(x.l)}</span>${esc(x.c)}<span class="meaning">${esc(a?a.g:x.g)}</span></button>`}).join(''):'<p class="muted">暂无其他精确词条或独立关键词记录。</p>')+'</div>';button.setAttribute('aria-expanded','true');
}
function handleClick(e){const el=e.target.closest('[data-action]');if(!el)return;const a=el.dataset.action,id=Number(el.dataset.id);
 if(a==='lesson')navigate({...state,view:'reader',book:el.dataset.book,lesson:el.dataset.lesson,focus:undefined});
 if(a==='read'){const r=rows[id];if(state.view==='reader'&&r&&state.lesson===r.b+'|'+r.l){locate(r)}else readRow(id)}
 if(a==='query'){ $('q').value=el.dataset.query;applySearch() }
 if(a==='clearRecent'){recents=[];saveLocal('gushi.recent.v1',recents);render()}
 if(a==='save'){
  saved.has(id)?saved.delete(id):saved.add(id);saveLocal('gushi.saved.v1',[...saved]);$('savedCount').textContent=saved.size;
  document.querySelectorAll(`[data-action="save"][data-id="${id}"]`).forEach(b=>{b.textContent=saved.has(id)?'★ 已收藏':'☆ 收藏';b.setAttribute('aria-pressed',String(saved.has(id)))});
  if(state.view==='saved'&&!saved.has(id)){const detail=el.closest('.card');detail.remove();$('meta').textContent='我的收藏 · '+rows.filter(r=>saved.has(r.i)&&filtered(r)).length+' 条'}
 }
 if(a==='reveal')el.closest('.cardbody').classList.add('revealed');
 if(a==='compare')comparison(el,rows[id],el.dataset.term);
 if(a==='note'){activeWord?.classList.remove('active');activeWord=el;el.classList.add('active');lastPanelTrigger=el;openNotes(el.dataset.ids.split(',').map(Number),el.textContent)}
 if(a==='back'){if(Number(state.depth)>0)history.back();else navigate(defaults())}
 if(a==='font'){const large=el.textContent==='字号 +';document.querySelectorAll('.reading p').forEach(p=>p.style.fontSize=large?'24px':'');el.textContent=large?'字号 −':'字号 +'}
}
$('out').addEventListener('click',handleClick);$('panelContent').addEventListener('click',handleClick);
$('closePanel').onclick=()=>closePanel(true);document.addEventListener('keydown',e=>{if(e.key==='Escape')closePanel(true)});
$('search').addEventListener('submit',e=>{e.preventDefault();clearTimeout(timer);applySearch()});
let composing=false;$('q').addEventListener('compositionstart',()=>{composing=true;clearTimeout(timer)});$('q').addEventListener('compositionend',()=>{composing=false;schedule()});
function schedule(){clearTimeout(timer);if(!composing)timer=setTimeout(()=>applySearch(state.view==='search'),250)}$('q').addEventListener('input',schedule);
$('scope').onchange=()=>applySearch();$('book').onchange=()=>{$('lesson').value='';applySearch()};$('lesson').onchange=()=>applySearch();
$('home').onclick=()=>navigate(defaults());$('saved').onclick=()=>navigate({...defaults(),view:'saved'});
$('quiz').checked=!!readLocal('gushi.quiz.v1',false);document.body.classList.toggle('quiz',$('quiz').checked);$('quiz').onchange=()=>{document.body.classList.toggle('quiz',$('quiz').checked);saveLocal('gushi.quiz.v1',$('quiz').checked)};
window.addEventListener('popstate',e=>{clearTimeout(timer);state=e.state?.view?e.state:parseRoute();render();if(state.focus===undefined||state.scroll)requestAnimationFrame(()=>window.scrollTo(0,+state.scroll||0))});
window.addEventListener('pagehide',remember);
let scrollTimer;window.addEventListener('scroll',()=>{clearTimeout(scrollTimer);scrollTimer=setTimeout(remember,200)},{passive:true});
state=location.hash?(history.state?.view?{...parseRoute(),...history.state}:parseRoute()):({...readLocal('gushi.position.v1',null),depth:0,view:readLocal('gushi.position.v1',null)?.view||'index'});state={...defaults(),...state};
try{history.scrollRestoration='manual';history.replaceState(state,'',route(state))}catch{}
render();if(state.scroll)requestAnimationFrame(()=>window.scrollTo(0,+state.scroll||0));
