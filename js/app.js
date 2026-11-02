var EX=[];
var PARTS=["가슴","등","하체","어깨","팔","복근"],LV=["초급","중급"],EQ=["맨몸","머신","덤벨","바벨"];
var DATA_URL='./data/exercises.json';
var searchInput=document.querySelector('#search-input');
var menuList=document.querySelector('#menu-list');
var screenView=document.querySelector('#screen-view');
var bottomNav=document.querySelector('#bottom-nav');
var S={scr:"home",id:1,q:"",f:{p:[],l:[],e:[]},sort:"name",tab:"favs",fav:[],rec:[],limit:30,load:"loading"};
try{S.fav=JSON.parse(localStorage.getItem("favoriteExerciseIds")||"[]");S.rec=JSON.parse(localStorage.getItem("recentExerciseIds")||"[]")}catch(e){}
function save(){try{localStorage.setItem("favoriteExerciseIds",JSON.stringify(S.fav));localStorage.setItem("recentExerciseIds",JSON.stringify(S.rec))}catch(e){}}
function get(id){return EX.filter(function(x){return x.id==id})[0]}
function esc(t){return String(t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function bds(x){return '<span class="bd src">JSON</span><span class="bd">'+esc(x.category)+'</span><span class="bd">'+esc(x.difficulty)+'</span><span class="bd">'+esc(x.equipment)+'</span>'}
function card(x,del){return '<div class="card" data-go="detail" data-id="'+x.id+'"><div class="img"><img src="'+esc(x.image)+'" alt="'+esc(x.name)+' 대표 이미지" loading="lazy"></div><div class="ci"><b>'+esc(x.name)+'</b><div>'+bds(x)+'</div></div>'+(del?'<button class="del" data-del="'+x.id+'">삭제</button>':'')+'</div>'}
function empty(t,d,b){return '<div class="empty"><b>'+t+'</b>'+d+(b||'')+'</div>'}
function list(){
  var q=S.q.trim().toLowerCase();
  var r=EX.filter(function(x){
    if(q&&x.name.toLowerCase().indexOf(q)<0&&x.engName.toLowerCase().indexOf(q)<0&&x.equipment.indexOf(q)<0)return false;
    return (!S.f.p.length||S.f.p.indexOf(x.category)>=0)&&(!S.f.l.length||S.f.l.indexOf(x.difficulty)>=0)&&(!S.f.e.length||S.f.e.indexOf(x.equipment)>=0)});
  r.sort(function(a,b){return S.sort=="name"?a.name.localeCompare(b.name,"ko"):(LV.indexOf(a.difficulty)-LV.indexOf(b.difficulty))||a.name.localeCompare(b.name,"ko")});
  return r}
function grp(label,key,arr){return '<div class="grp"><span>'+label+'</span>'+arr.map(function(v){return '<button class="chip'+(S.f[key].indexOf(v)>=0?' on':'')+'" data-f="'+key+':'+v+'">'+v+'</button>'}).join('')+'</div>'}
function items(a){return (a&&a.length)?a.map(function(t){return '<li>'+esc(t)+'</li>'}).join(''):''}
function tag(m,k){var t=(m.real||[]).indexOf(k)>=0?'real':((m.dummy||[]).indexOf(k)>=0?'dummy':'');return t?'<span class="tag '+t+'">'+(t=='real'?'실제':'더미')+'</span>':''}
var VIEWS={
home:function(){
  var rec=EX.filter(function(x){return x.difficulty=="초급"}).slice(0,3);
  return '<p class="intro">운동 방법과 주의사항을 쉽고 빠르게 찾아보는 운동 가이드 · 운동 '+EX.length+'개</p>'
  +'<h3>부위별 바로가기</h3><div class="row">'+PARTS.map(function(p){return '<button class="chip" data-part="'+p+'">'+p+'</button>'}).join('')+'</div>'
  +'<h3>초보자 추천 운동<a data-go="explore">더보기</a></h3>'+rec.map(function(x){return card(x)}).join('')},
explore:function(){
  var r=list(),shown=r.slice(0,S.limit);
  return '<div class="filters">'+grp("부위","p",PARTS)+grp("난이도","l",LV)+grp("기구","e",EQ)+'</div>'
  +'<div class="bar"><span>검색 결과 '+r.length+'건</span><select data-sort><option value="name"'+(S.sort=="name"?' selected':'')+'>이름순</option><option value="level"'+(S.sort=="level"?' selected':'')+'>난이도순</option></select></div>'
  +(r.length?shown.map(function(x){return card(x)}).join('')+(r.length>shown.length?'<button class="more" data-more>더 보기 ('+shown.length+'/'+r.length+')</button>':''):empty("검색 결과가 없어요","조건을 바꾸거나 필터를 초기화해 보세요.",'<br><button data-reset>필터 초기화</button>'))},
detail:function(){
  var x=get(S.id),on=S.fav.indexOf(x.id)>=0,m=x.meta||{};
  var unk=(m.unknown||[]).length;
  return '<button class="back" data-go="explore">← 목록으로</button><div class="hero"><img src="'+esc(x.image)+'" alt="'+esc(x.engName)+'"></div><h2 class="title">'+esc(x.name)+'</h2><div class="eng">'+esc(x.engName)+'</div><div>'+bds(x)+'</div>'
  +'<p class="meta">저장 JSON 사용 · API 미연동 · 실제 '+(m.real||[]).length+'개 · 더미 '+(m.dummy||[]).length+'개'+(unk?' · 정보 없음 '+unk+'개':'')+' 필드</p>'
  +'<p class="desc">'+(x.description?esc(x.description)+tag(m,'description'):'<span class="none">설명 정보 없음</span>')+'</p>'
  +'<h3><span>기구 설정'+tag(m,'setup')+'</span></h3>'+(x.setup&&x.setup.length?'<ul>'+items(x.setup)+'</ul>':'<p class="none">정보 없음</p>')
  +'<h3><span>운동 방법'+tag(m,'steps')+'</span></h3>'+(m.stepsLang=="en"?'<p class="note">영문 원문입니다.</p>':'')+'<ol>'+items(x.steps)+'</ol>'
  +'<h3><span>주의사항'+tag(m,'tips')+'</span></h3>'+(x.tips&&x.tips.length?'<ul>'+items(x.tips)+'</ul>':'<p class="none">정보 없음</p>')
  +'<button class="save'+(on?' on':'')+'" data-save="'+x.id+'">'+(on?'★ 관심 운동 저장됨':'☆ 관심 운동 저장')+'</button>'
  +'<p class="src-foot">출처: Free Exercise DB (퍼블릭 도메인). 더미 표시 항목은 실습용 AI 작성 내용입니다.</p>'},
my:function(){
  var f=S.tab=="favs",ids=(f?S.fav:S.rec).filter(function(i){return get(i)});
  return '<div class="tabs"><button data-tab="favs" class="'+(f?'on':'')+'">관심 운동</button><button data-tab="recent" class="'+(f?'':'on')+'">최근 본 운동</button></div>'
  +(ids.length?ids.map(function(i){return card(get(i),f)}).join(''):empty(f?"저장한 운동이 없어요":"최근 본 운동이 없어요",f?"운동 상세에서 저장 버튼을 눌러 보세요.":"운동 상세를 보면 여기에 자동으로 쌓여요.",'<br><button data-go="explore">운동 탐색하기</button>'))}
};
function render(){
  if(S.load=="loading"){screenView.innerHTML=empty("운동 정보를 불러오는 중이에요","잠시만 기다려 주세요.");return}
  if(S.load=="error"){screenView.innerHTML=empty("운동 정보를 불러오지 못했어요","data/exercises.json을 찾지 못했거나, 파일을 직접 열어서 불러오지 못했을 수 있어요. 웹 주소(GitHub Pages)에서 열어 보세요.",'<br><button data-retry>다시 시도</button>');return}
  screenView.innerHTML=VIEWS[S.scr]();
  searchInput.value=S.scr=="explore"?S.q:"";
  var navOn=S.scr=="detail"?"explore":S.scr;
  Array.prototype.forEach.call(bottomNav.children,function(b){b.className=b.getAttribute("data-go")==navOn?"on":""});
  screenView.scrollTop=0}
function loadData(){
  S.load="loading";render();
  fetch(DATA_URL).then(function(r){if(!r.ok)throw new Error(r.status);return r.json()}).then(function(d){EX=d;S.load="ok";render()}).catch(function(){S.load="error";render()})}
function go(s,id){
  S.scr=s;S.limit=30;
  if(s=="detail"){S.id=+id;S.rec=[S.id].concat(S.rec.filter(function(i){return i!=S.id})).slice(0,10);save()}
  menuList.classList.remove("open");render()}
document.addEventListener("click",function(e){
  var t=e.target.closest("[data-go],[data-part],[data-f],[data-del],[data-tab],[data-save],[data-reset],[data-menu],[data-level],[data-equip],[data-mytab],[data-more],[data-retry]");
  if(!t)return;
  var d=t.dataset;
  if(d.retry!==undefined){loadData();return}
  if(d.more!==undefined){S.limit+=30;render();return}
  if(d.del){e.stopPropagation();S.fav=S.fav.filter(function(i){return i!=d.del});save();render();return}
  if(d.save){var i=+d.save,k=S.fav.indexOf(i);if(k>=0)S.fav.splice(k,1);else S.fav.unshift(i);save();render();return}
  if(d.menu!==undefined){menuList.classList.toggle("open");return}
  if(d.level){S.f={p:[],l:[d.level],e:[]};S.q="";go("explore");return}
  if(d.equip){S.f={p:[],l:[],e:[d.equip]};S.q="";go("explore");return}
  if(d.mytab){S.tab=d.mytab;go("my");return}
  if(d.part){S.f={p:[d.part],l:[],e:[]};S.q="";go("explore");return}
  if(d.f){var a=d.f.split(":"),arr=S.f[a[0]],k2=arr.indexOf(a[1]);if(k2>=0)arr.splice(k2,1);else arr.push(a[1]);S.limit=30;render();return}
  if(d.tab){S.tab=d.tab;render();return}
  if(d.reset!==undefined){S.f={p:[],l:[],e:[]};S.q="";S.limit=30;render();return}
  if(d.go){go(d.go,d.id)}});
document.addEventListener("keydown",function(e){
  if(e.key=="Enter"&&e.target.hasAttribute("data-s")){S.q=e.target.value;S.f={p:[],l:[],e:[]};go("explore")}});
document.addEventListener("change",function(e){
  if(e.target.hasAttribute("data-sort")){S.sort=e.target.value;S.limit=30;render()}});
document.addEventListener("error",function(e){if(e.target.tagName=="IMG")e.target.classList.add("broken")},true);
loadData();
