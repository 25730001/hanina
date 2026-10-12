var EX=[
{id:1,n:"푸시업",p:"가슴",l:"초급",e:"맨몸",s:"손을 어깨너비보다 넓게 짚기|몸을 일직선으로 유지하기|가슴이 바닥에 가까워질 때까지 내리기|팔을 펴며 올라오기",c:"허리가 꺾이지 않게 복부에 힘 주기|어깨가 귀 쪽으로 올라가지 않게 하기"},
{id:2,n:"덤벨 벤치프레스",p:"가슴",l:"중급",e:"덤벨",s:"벤치에 누워 덤벨을 가슴 옆에 두기|덤벨을 위로 밀어 올리기|천천히 가슴 높이까지 내리기",c:"손목이 꺾이지 않게 하기|너무 무거운 무게는 피하기"},
{id:3,n:"랫풀다운",p:"등",l:"초급",e:"머신",s:"패드에 허벅지를 고정하고 앉기|바를 넓게 잡기|가슴 쪽으로 당겼다가 천천히 올리기",c:"반동을 쓰지 않기|목 뒤로 당기지 않기"},
{id:4,n:"바벨 로우",p:"등",l:"중급",e:"바벨",s:"상체를 숙이고 바벨을 잡기|배꼽 쪽으로 당기기|천천히 내리기",c:"등을 둥글게 말지 않기|무릎을 살짝 굽히기"},
{id:5,n:"스쿼트",p:"하체",l:"초급",e:"맨몸",s:"발을 어깨너비로 벌리고 서기|엉덩이를 뒤로 빼며 앉기|허벅지가 수평이 되면 일어나기",c:"무릎이 안쪽으로 모이지 않게 하기|발뒤꿈치를 떼지 않기"},
{id:6,n:"레그프레스",p:"하체",l:"초급",e:"머신",s:"등받이에 등을 붙이고 앉기|발판을 밀어내기|무릎이 완전히 잠기기 전에 멈추고 돌아오기",c:"무릎을 끝까지 펴지 않기|허리가 뜨지 않게 하기"},
{id:7,n:"숄더프레스",p:"어깨",l:"중급",e:"덤벨",s:"덤벨을 어깨 높이로 들기|머리 위로 밀어 올리기|천천히 내리기",c:"허리를 과하게 젖히지 않기|팔꿈치를 완전히 잠그지 않기"},
{id:8,n:"사이드 레터럴 레이즈",p:"어깨",l:"초급",e:"덤벨",s:"덤벨을 몸 옆에 들고 서기|팔을 어깨 높이까지 옆으로 들기|천천히 내리기",c:"어깨를 으쓱하지 않기|가벼운 무게로 시작하기"}];
var PARTS=["가슴","등","하체","어깨"],LV=["초급","중급"],EQ=["맨몸","머신","덤벨","바벨"];
var screenJump=document.querySelector('#screen-jump');
var routePath=document.querySelector('#route-path');
var menuList=document.querySelector('#menu-list');
var screenView=document.querySelector('#screen-view');
var bottomNav=document.querySelector('#bottom-nav');
var S={scr:"home",id:1,q:"",f:{p:[],l:[],e:[]},sort:"name",tab:"favs",fav:[],rec:[],hid:0};
try{S.fav=JSON.parse(localStorage.getItem("favoriteExerciseIds")||"[]");S.rec=JSON.parse(localStorage.getItem("recentExerciseIds")||"[]")}catch(e){}
function save(){try{localStorage.setItem("favoriteExerciseIds",JSON.stringify(S.fav));localStorage.setItem("recentExerciseIds",JSON.stringify(S.rec))}catch(e){}}
function get(id){return EX.filter(function(x){return x.id==id})[0]}
function bds(x){return '<span class="bd">'+x.p+'</span><span class="bd">'+x.l+'</span><span class="bd">'+x.e+'</span>'}
function card(x,del){return '<div class="card" data-go="detail" data-id="'+x.id+'"><div class="img">IMG</div><div class="ci"><b>'+x.n+'</b><div>'+bds(x)+'</div></div>'+(del?'<button class="del" data-del="'+x.id+'">삭제</button>':'')+'</div>'}
function empty(t,d,b){return '<div class="empty"><b>'+t+'</b>'+d+(b||'')+'</div>'}
function list(){
  var r=EX.filter(function(x){
    var q=S.q.trim();
    if(q&&x.n.indexOf(q)<0&&x.e.indexOf(q)<0)return false;
    return (!S.f.p.length||S.f.p.indexOf(x.p)>=0)&&(!S.f.l.length||S.f.l.indexOf(x.l)>=0)&&(!S.f.e.length||S.f.e.indexOf(x.e)>=0)});
  r.sort(function(a,b){return S.sort=="name"?a.n.localeCompare(b.n,"ko"):(LV.indexOf(a.l)-LV.indexOf(b.l))||a.n.localeCompare(b.n,"ko")});
  return r}
function grp(label,key,arr){return '<div class="grp"><span>'+label+'</span>'+arr.map(function(v){return '<button class="chip'+(S.f[key].indexOf(v)>=0?' on':'')+'" data-f="'+key+':'+v+'">'+v+'</button>'}).join('')+'</div>'}
var VIEWS={
home:function(){
  var rec=EX.filter(function(x){return x.l=="초급"}).slice(0,3);
  return '<p class="intro">운동 방법과 주의사항을 쉽고 빠르게 찾아보는 운동 가이드</p><input class="in" data-s placeholder="운동명·기구명 검색">'
  +'<h3>부위별 바로가기</h3><div class="row">'+PARTS.map(function(p){return '<button class="chip" data-part="'+p+'">'+p+'</button>'}).join('')+'</div>'
  +'<h3>초보자 추천 운동<a data-go="explore">더보기</a></h3>'+rec.map(function(x){return card(x)}).join('')},
explore:function(){
  var r=list();
  return '<input class="in" data-s value="'+S.q+'" placeholder="운동명·기구명 검색">'
  +'<div class="filters">'+grp("부위","p",PARTS)+grp("난이도","l",LV)+grp("기구","e",EQ)+'</div>'
  +'<div class="bar"><span>검색 결과 '+r.length+'건</span><select data-sort><option value="name"'+(S.sort=="name"?' selected':'')+'>이름순</option><option value="level"'+(S.sort=="level"?' selected':'')+'>난이도순</option></select></div>'
  +(r.length?r.map(function(x){return card(x)}).join(''):empty("검색 결과가 없어요","조건을 바꾸거나 필터를 초기화해 보세요.",'<br><button data-reset>필터 초기화</button>'))},
detail:function(){
  var x=get(S.id),on=S.fav.indexOf(x.id)>=0;
  return '<button class="back" data-go="explore">← 목록으로</button><div class="hero">운동 이미지 영역</div><h2 class="title">'+x.n+'</h2><div>'+bds(x)+'</div>'
  +'<h3>운동 방법</h3><ol>'+x.s.split("|").map(function(t){return '<li>'+t+'</li>'}).join('')+'</ol>'
  +'<h3>주의사항</h3><ul>'+x.c.split("|").map(function(t){return '<li>'+t+'</li>'}).join('')+'</ul>'
  +'<button class="save'+(on?' on':'')+'" data-save="'+x.id+'">'+(on?'★ 관심 운동 저장됨':'☆ 관심 운동 저장')+'</button>'},
my:function(){
  var f=S.tab=="favs",ids=f?S.fav:S.rec;
  return '<div class="tabs"><button data-tab="favs" class="'+(f?'on':'')+'">관심 운동</button><button data-tab="recent" class="'+(f?'':'on')+'">최근 본 운동</button></div>'
  +(ids.length?ids.map(function(i){return card(get(i),f)}).join(''):empty(f?"저장한 운동이 없어요":"최근 본 운동이 없어요",f?"운동 상세에서 저장 버튼을 눌러 보세요.":"운동 상세를 보면 여기에 자동으로 쌓여요.",'<br><button data-go="explore">운동 탐색하기</button>'))}
};
var PATH={home:"/",explore:"/exercises",detail:"/exercises/:id",my:"/my/favorites · /my/recent"};
var JUMPS=[["home","홈"],["explore","운동 탐색"],["detail","운동 상세"],["empty","결과 없음"],["favs","관심 운동"],["recent","최근 본 운동"]];
function render(){
  screenView.innerHTML=VIEWS[S.scr]();
  var navOn=S.scr=="detail"?"explore":S.scr;
  Array.prototype.forEach.call(bottomNav.children,function(b,i){b.className=b.getAttribute("data-go")==navOn?"on":""});
  var key=S.scr=="my"?S.tab:(S.scr=="explore"&&S.q=="zzz"?"empty":S.scr);
  screenJump.innerHTML=JUMPS.map(function(j){return '<button data-jump="'+j[0]+'" class="'+(j[0]==key?'on':'')+'">'+j[1]+'</button>'}).join('');
  var p=PATH[S.scr];
  if(S.scr=="explore"){var qs=[];if(S.f.p.length)qs.push("part="+S.f.p.join(","));if(S.f.l.length)qs.push("level="+S.f.l.join(","));if(S.f.e.length)qs.push("equipment="+S.f.e.join(","));if(S.q)qs.push("q="+S.q);p+=qs.length?"?"+qs.join("&"):""}
  if(S.scr=="detail")p="/exercises/"+S.id;
  if(S.scr=="my")p=S.tab=="favs"?"/my/favorites":"/my/recent";
  routePath.textContent="경로: "+p;
  window.scrollTo(0,0)}
function go(s,id){
  S.scr=s;
  if(s=="detail"){S.id=+id;S.rec=[S.id].concat(S.rec.filter(function(i){return i!=S.id})).slice(0,10);save()}
  menuList.className="menu";render()}
document.addEventListener("click",function(e){
  var t=e.target.closest("[data-go],[data-part],[data-f],[data-del],[data-tab],[data-save],[data-reset],[data-menu],[data-jump]");
  if(!t)return;
  var d=t.dataset;
  if(d.del){e.stopPropagation();S.fav=S.fav.filter(function(i){return i!=d.del});save();render();return}
  if(d.save){var i=+d.save,k=S.fav.indexOf(i);if(k>=0)S.fav.splice(k,1);else S.fav.unshift(i);save();render();return}
  if(d.menu!==undefined){menuList.classList.toggle("open");return}
  if(d.part){S.f={p:[d.part],l:[],e:[]};S.q="";go("explore");return}
  if(d.f){var a=d.f.split(":"),arr=S.f[a[0]],k2=arr.indexOf(a[1]);if(k2>=0)arr.splice(k2,1);else arr.push(a[1]);render();return}
  if(d.tab){S.tab=d.tab;render();return}
  if(d.reset!==undefined){S.f={p:[],l:[],e:[]};S.q="";render();return}
  if(d.jump){var j=d.jump;
    if(j=="favs"||j=="recent"){S.tab=j;go("my")}
    else if(j=="empty"){S.q="zzz";S.f={p:[],l:[],e:[]};go("explore")}
    else{if(j=="explore")S.q="";go(j,S.id)}return}
  if(d.go){go(d.go,d.id)}});
document.addEventListener("keydown",function(e){
  if(e.key=="Enter"&&e.target.hasAttribute("data-s")){S.q=e.target.value;go("explore")}});
document.addEventListener("change",function(e){
  if(e.target.hasAttribute("data-sort")){S.sort=e.target.value;render()}});
render();
