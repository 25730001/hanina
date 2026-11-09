/* =========================================================
   코어시크 coreseek — 헬스 초보자 운동 탐색
   1) 저장 JSON(data/exercises.json) 불러오기      ← 7주차
   2) 외부 데이터 호출(Free Exercise DB)로 정보 보강  ← 데이터 호출
   3) 상태(S) → results() → 정렬 → renderList()   ← 9주차
   ========================================================= */
var EX = [];
var PARTS = ["가슴","등","하체","어깨","팔","복근"], LV = ["초급","중급"], EQ = ["맨몸","머신","덤벨","바벨"];
var DATA_URL = './data/exercises.json';
/* 외부 공개 데이터(퍼블릭 도메인). 각 운동의 meta.sourceId로 연결 */
var API_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
var PAGE = 30;

var menuList = document.querySelector('#menu-list');
var screenView = document.querySelector('#screen-view');
var bottomNav = document.querySelector('#bottom-nav');

/* ---------- 상태 객체 (9주차 2.2) ----------
   q 검색어 · f 부위/난이도/기구(같은 그룹 OR) · filters 조건 버튼(AND)
   sort 정렬 · picked 선택 순서(결과 없음일 때 해제 제안) · api 외부 데이터 상태 */
var S = { scr: "home", id: 1, q: "", f: { p: [], l: [], e: [] }, filters: [], picked: [],
  sort: "name", tab: "favs", fav: [], rec: [], limit: PAGE, load: "loading", api: "idle" };
try { S.fav = JSON.parse(localStorage.getItem("favoriteExerciseIds") || "[]"); S.rec = JSON.parse(localStorage.getItem("recentExerciseIds") || "[]"); } catch (e) {}
function save() { try { localStorage.setItem("favoriteExerciseIds", JSON.stringify(S.fav)); localStorage.setItem("recentExerciseIds", JSON.stringify(S.rec)); } catch (e) {} }

/* ---------- 외부 데이터 값 → 한국어 ---------- */
var MUSCLE = { abdominals:"복근", abductors:"엉덩이 바깥", adductors:"허벅지 안쪽", biceps:"이두근", calves:"종아리", chest:"가슴", forearms:"전완근",
  glutes:"둔근", hamstrings:"햄스트링", lats:"광배근", "lower back":"허리", "middle back":"등 중앙", neck:"목", quadriceps:"대퇴사두근", shoulders:"어깨", traps:"승모근", triceps:"삼두근" };
var FORCE = { push: "밀기", pull: "당기기", "static": "버티기" };
var MECH = { compound: "복합", isolation: "고립" };

/* ---------- 필터 규칙표 (9주차 1.3) ----------
   조건 버튼(data-filter)   JSON 필드         통과 조건
   설명 있는 운동(guide)    description       값이 있음 (1~16번)
   미는 운동(push)          force(외부 데이터) '밀기'
   당기는 운동(pull)        force(외부 데이터) '당기기'
   여러 근육(compound)      mechanic(외부)     '복합'
   한 부위 집중(isolation)  mechanic(외부)     '고립'                       */
var FILTER_RULES = {
  guide:     function (x) { return !!x.description; },
  push:      function (x) { return x.force === "밀기"; },
  pull:      function (x) { return x.force === "당기기"; },
  compound:  function (x) { return x.mechanic === "복합"; },
  isolation: function (x) { return x.mechanic === "고립"; }
};
var FILTER_LABEL = { guide: "설명 있는 운동", push: "미는 운동", pull: "당기는 운동", compound: "여러 근육 함께", isolation: "한 부위 집중" };
var NEED_API = { push: 1, pull: 1, compound: 1, isolation: 1 };   // 외부 데이터가 있어야 쓸 수 있는 조건

/* ---------- 정렬 (9주차 2.1) ---------- */
function byName(a, b) { return a.name.localeCompare(b.name, "ko"); }
function easyScore(x) { return (x.difficulty === "초급" ? 4 : 0) + (x.equipment === "머신" ? 3 : x.equipment === "맨몸" ? 2 : x.equipment === "덤벨" ? 1 : 0) + (x.description ? 1 : 0); }
var SORTERS = {
  name:     byName,
  level:    function (a, b) { return LV.indexOf(a.difficulty) - LV.indexOf(b.difficulty) || byName(a, b); },
  beginner: function (a, b) { return easyScore(b) - easyScore(a) || byName(a, b); }   // 초급·머신·맨몸·설명 있는 운동 먼저
};
var SORT_LABEL = { name: "이름순", level: "난이도순", beginner: "초보자 추천순" };

/* ---------- 검색·필터 → 하나의 결과 배열 (9주차 1.2·1.4·2.2.2) ---------- */
function norm(t) { return String(t || "").replace(/\s/g, "").toLowerCase(); }
function haystack(x) { return norm(x.name + x.engName + x.category + x.equipment + (x.muscles || []).join("")); }
function results(st) {
  st = st || S;
  var q = norm(st.q);
  return EX.filter(function (x) {
    return (!st.f.p.length || st.f.p.indexOf(x.category) >= 0) &&
           (!st.f.l.length || st.f.l.indexOf(x.difficulty) >= 0) &&
           (!st.f.e.length || st.f.e.indexOf(x.equipment) >= 0) &&
           (!q || haystack(x).indexOf(q) >= 0) &&
           st.filters.every(function (k) { return FILTER_RULES[k](x); });
  });
}
function sorted() { var r = results(); r.sort(SORTERS[S.sort]); return r; }   // 원본 EX는 정렬하지 않음
function activeCount() { return S.f.p.length + S.f.l.length + S.f.e.length + S.filters.length; }

/* 조건 하나를 뺀 상태 복사본 — 결과 없음 해제 제안용 */
function without(t) {
  var a = t.split(":"), st = { q: S.q, f: { p: S.f.p.slice(), l: S.f.l.slice(), e: S.f.e.slice() }, filters: S.filters.slice() };
  if (a[0] === "c") st.filters = st.filters.filter(function (v) { return v !== a[1]; });
  else if (a[0] === "q") st.q = "";
  else st.f[a[0]] = st.f[a[0]].filter(function (v) { return v !== a[1]; });
  return st;
}
function tokenLabel(t) { var a = t.split(":"); return a[0] === "c" ? FILTER_LABEL[a[1]] : a[0] === "q" ? "검색어 “" + esc(S.q) + "”" : a[1]; }

/* ---------- 화면 조각 ---------- */
function get(id) { return EX.filter(function (x) { return x.id == id; })[0]; }
function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
/* 썸네일 태그: 누르면 그 조건으로 바로 필터 (선택된 태그는 진하게) */
function tagBtn(key, v) { return '<button class="bd' + (S.f[key].indexOf(v) >= 0 ? " on" : "") + '" data-tagf="' + key + ":" + v + '" aria-label="' + v + ' 운동만 보기">' + esc(v) + "</button>"; }
function bds(x) { return tagBtn("p", x.category) + tagBtn("l", x.difficulty) + tagBtn("e", x.equipment); }
function card(x, del) {
  return '<div class="card" data-go="detail" data-id="' + x.id + '"><div class="img"><img src="' + esc(x.image) + '" alt="' + esc(x.name) + ' 대표 이미지" loading="lazy"></div>'
    + '<div class="ci"><b>' + esc(x.name) + "</b><div>" + bds(x) + "</div></div>"
    + (del ? '<button class="del" data-del="' + x.id + '">삭제</button>' : "") + "</div>";
}
function empty(t, d, b) { return '<div class="empty"><b>' + t + "</b>" + d + (b || "") + "</div>"; }
function grp(label, key, arr) {
  return '<div class="grp"><span>' + label + "</span>" + arr.map(function (v) {
    return '<button class="chip' + (S.f[key].indexOf(v) >= 0 ? " on" : "") + '" data-f="' + key + ":" + v + '">' + v + "</button>";
  }).join("") + "</div>";
}
function conds() {
  return '<div class="grp"><span>조건</span>' + Object.keys(FILTER_RULES).map(function (k) {
    var on = S.filters.indexOf(k) >= 0, off = NEED_API[k] && S.api !== "ok";
    return '<button class="chip' + (on ? " on" : "") + '" data-filter="' + k + '" aria-pressed="' + on + '"' + (off ? " disabled" : "") + ">" + FILTER_LABEL[k] + "</button>";
  }).join("") + "</div>";
}
function apiNote() {
  if (S.api === "loading") return '<p class="note">외부 데이터(Free Exercise DB) 불러오는 중… 동작 조건은 잠시 후 사용할 수 있어요.</p>';
  if (S.api === "error") return '<p class="note">외부 데이터를 불러오지 못해 동작 조건(미는·당기는 등)은 쓸 수 없어요. <button class="link" data-api>다시 불러오기</button></p>';
  return "";
}
function items(a) { return (a && a.length) ? a.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") : ""; }
function tag(m, k) { var t = (m.real || []).indexOf(k) >= 0 ? "real" : ((m.dummy || []).indexOf(k) >= 0 ? "dummy" : ""); return t ? '<span class="tag ' + t + '">' + (t == "real" ? "실제" : "더미") + "</span>" : ""; }

/* ---------- 결과 목록 (9주차 renderList: 건수·카드·결과 없음을 한 번에) ---------- */
function listHTML() {
  var r = sorted(), n = activeCount(), shown = r.slice(0, S.limit);
  var bar = '<div class="bar"><span id="count">검색 결과 ' + r.length + "건" + (n ? " · 조건 " + n + "개" : "") + "</span>"
    + '<span class="tools"><select data-sort aria-label="정렬">' + Object.keys(SORTERS).map(function (k) {
        return '<option value="' + k + '"' + (S.sort == k ? " selected" : "") + ">" + SORT_LABEL[k] + "</option>";
      }).join("") + '</select><button data-reset aria-label="전체 조건 초기화">↺</button></span></div>';
  if (!r.length) {
    var tokens = S.picked.slice(); if (S.q) tokens.unshift("q:");
    var rm = tokens.slice().reverse().filter(function (t) { return results(without(t)).length; })[0];
    var tip = rm ? '<p class="suggest">‘' + tokenLabel(rm) + "’ 조건을 해제하면 " + results(without(rm)).length + '건을 볼 수 있어요.</p><button data-unset="' + rm + '">' + tokenLabel(rm) + " 해제</button>" : "<br>";
    return bar + empty("검색 결과가 없어요", "조건을 바꾸거나 필터를 초기화해 보세요.", tip + "<button data-reset>필터 초기화</button>");
  }
  return bar + shown.map(function (x) { return card(x); }).join("")
    + (r.length > shown.length ? '<button class="more" data-more>더 보기 (' + shown.length + "/" + r.length + ")</button>" : "");
}
function renderList(reset) {
  if (reset) S.limit = PAGE;
  var box = document.querySelector("#results");
  if (S.scr === "explore" && box) box.innerHTML = listHTML();   // 검색창은 그대로 두고 목록만 다시 그림
  else render();
}

/* 홈 추천: 초급 운동을 초보자 추천순으로 정렬한 뒤 부위·기구가 골고루 섞이도록 번갈아 고름 */
function homePicks(n) {
  var pool = EX.filter(function (x) { return x.difficulty == "초급"; }).sort(SORTERS.beginner), out = [], round = 0;
  while (out.length < n && round < 10) {
    PARTS.forEach(function (p) {
      if (out.length >= n) return;
      var used = function (eq) { return out.filter(function (o) { return o.equipment === eq; }).length; };
      var cand = pool.filter(function (y) { return y.category === p && out.indexOf(y) < 0; });
      var x = cand.slice().sort(function (a, b) { return used(a.equipment) - used(b.equipment); })[0];   // 기구도 골고루
      if (x) out.push(x);
    });
    round++;
  }
  return out;
}
/* 홈 전용 2열 타일 카드 */
function tile(x) {
  return '<div class="tile" data-go="detail" data-id="' + x.id + '"><div class="img"><img src="' + esc(x.image) + '" alt="' + esc(x.name) + ' 대표 이미지" loading="lazy"></div>'
    + "<b>" + esc(x.name) + "</b><div>" + bds(x) + "</div></div>";
}
var VIEWS = {
  home: function () {
    var rec = homePicks(8);
    return '<p class="intro">운동 방법과 주의사항을 쉽고 빠르게 찾아보는 운동 가이드 · 운동 ' + EX.length + "개</p>"
      + '<input class="in" id="home-search" data-s placeholder="🔍 운동명·기구명 검색" aria-label="운동 검색">'
      + '<h3>부위별 바로가기</h3><div class="row">' + PARTS.map(function (p) { return '<button class="chip" data-part="' + p + '">' + p + "</button>"; }).join("") + "</div>"
      + '<h3>초보자 추천 운동<a data-go="explore">더보기</a></h3><div class="grid">' + rec.map(tile).join("") + "</div>";
  },
  /* 검색 보드(검색창 + 부위·난이도·기구·조건)를 목록 위에 한 덩어리로 */
  explore: function () {
    return '<section class="board"><div class="filters">' + grp("부위", "p", PARTS) + grp("난이도", "l", LV) + grp("기구", "e", EQ) + conds() + "</div>" + apiNote()
      + '<input class="in" id="search-input" placeholder="🔍 운동명·기구·근육 검색" aria-label="운동 검색" value="' + esc(S.q) + '"></section>'
      + '<div id="results">' + listHTML() + "</div>";
  },
  detail: function () {
    var x = get(S.id);
    if (!x) return empty("운동을 찾을 수 없어요", "목록에서 다시 선택해 주세요.", '<br><button data-go="explore">운동 탐색하기</button>');
    var on = S.fav.indexOf(x.id) >= 0, m = x.meta || {}, unk = (m.unknown || []).length;
    return '<button class="back" data-go="explore">← 목록으로</button><div class="hero"><span class="bg" style="background-image:url(\'' + esc(x.image) + '\')"></span><img src="' + esc(x.image) + '" alt="' + esc(x.name) + ' 대표 이미지"></div><h2 class="title">' + esc(x.name) + '</h2><div class="eng">' + esc(x.engName) + '</div><div><span class="bd src">JSON</span>' + (x.api ? '<span class="bd src">API</span>' : "") + bds(x) + "</div>"
      + '<p class="meta">저장 JSON 사용 · ' + (x.api ? "외부 데이터 연동(Free Exercise DB)" : "외부 데이터 미연동") + " · 실제 " + (m.real || []).length + "개 · 더미 " + (m.dummy || []).length + "개" + (unk ? " · 정보 없음 " + unk + "개" : "") + " 필드</p>"
      + '<p class="desc">' + (x.description ? esc(x.description) + tag(m, "description") : '<span class="none">설명 정보 없음</span>') + "</p>"
      + (x.api ? '<h3><span>쓰는 근육<span class="tag real">API</span></span></h3><ul><li>주로: ' + esc(x.primary.join(", ")) + "</li>" + (x.secondary.length ? "<li>함께: " + esc(x.secondary.join(", ")) + "</li>" : "") + "<li>동작: " + esc([x.force, x.mechanic].filter(Boolean).join(" · ") || "정보 없음") + "</li></ul>" : "")
      + "<h3><span>기구 설정" + tag(m, "setup") + "</span></h3>" + (x.setup && x.setup.length ? "<ul>" + items(x.setup) + "</ul>" : '<p class="none">정보 없음</p>')
      + "<h3><span>운동 방법" + tag(m, "steps") + "</span></h3>" + (m.stepsLang == "en" ? '<p class="note">영문 원문입니다.</p>' : (m.stepsLang == "ko" ? '<p class="note">원문(영어)을 한국어로 옮긴 내용입니다.</p>' : "")) + "<ol>" + items(x.steps) + "</ol>"
      + "<h3><span>주의사항" + tag(m, "tips") + "</span></h3>" + (x.tips && x.tips.length ? "<ul>" + items(x.tips) + "</ul>" : '<p class="none">정보 없음</p>')
      + '<button class="save' + (on ? " on" : "") + '" data-save="' + x.id + '">' + (on ? "★ 관심 운동 저장됨" : "☆ 관심 운동 저장") + "</button>"
      + '<p class="src-foot">출처: Free Exercise DB (퍼블릭 도메인). 더미 표시 항목은 실습용 AI 작성 내용입니다.</p>';
  },
  my: function () {
    var f = S.tab == "favs", ids = (f ? S.fav : S.rec).filter(function (i) { return get(i); });
    return '<div class="tabs"><button data-tab="favs" class="' + (f ? "on" : "") + '">관심 운동</button><button data-tab="recent" class="' + (f ? "" : "on") + '">최근 본 운동</button></div>'
      + (ids.length ? ids.map(function (i) { return card(get(i), f); }).join("") : empty(f ? "저장한 운동이 없어요" : "최근 본 운동이 없어요", f ? "운동 상세에서 저장 버튼을 눌러 보세요." : "운동 상세를 보면 여기에 자동으로 쌓여요.", '<br><button data-go="explore">운동 탐색하기</button>'));
  }
};

function render() {
  if (S.load == "loading") { screenView.innerHTML = empty("운동 정보를 불러오는 중이에요", "잠시만 기다려 주세요."); return; }
  if (S.load == "error") { screenView.innerHTML = empty("운동 정보를 불러오지 못했어요", "data/exercises.json을 찾지 못했거나, 파일을 직접 열어서 불러오지 못했을 수 있어요. 웹 주소(GitHub Pages)에서 열어 보세요.", "<br><button data-retry>다시 시도</button>"); return; }
  var typing = document.activeElement && document.activeElement.id === "search-input";
  screenView.innerHTML = VIEWS[S.scr]();
  if (typing) { var si = document.querySelector("#search-input"); if (si) { si.focus(); si.setSelectionRange(si.value.length, si.value.length); } }   // 입력 중이면 커서 유지
  var navOn = S.scr == "detail" ? "explore" : S.scr;
  Array.prototype.forEach.call(bottomNav.children, function (b) { b.className = b.getAttribute("data-go") == navOn ? "on" : ""; });
  screenView.scrollTop = 0;
}

/* ---------- 데이터 불러오기 ---------- */
function loadData() {
  S.load = "loading"; render();
  fetch(DATA_URL)
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (d) { EX = d; S.load = "ok"; console.log("[코어시크] 저장 JSON " + EX.length + "건"); render(); loadApi(); })
    .catch(function () { S.load = "error"; render(); });
}
/* 외부 데이터 호출: 화면은 먼저 보여주고, 도착하면 근육·동작 정보를 붙임 */
function loadApi() {
  S.api = "loading"; if (S.scr === "explore") render();
  fetch(API_URL)
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (list) {
      var byId = {}; list.forEach(function (o) { byId[o.id] = o; });
      var n = 0;
      EX.forEach(function (x) {
        var o = byId[(x.meta || {}).sourceId]; if (!o) return;
        x.primary = (o.primaryMuscles || []).map(function (m) { return MUSCLE[m] || m; });
        x.secondary = (o.secondaryMuscles || []).map(function (m) { return MUSCLE[m] || m; });
        x.muscles = x.primary.concat(x.secondary);
        x.force = FORCE[o.force] || null; x.mechanic = MECH[o.mechanic] || null; x.api = true; n++;
      });
      S.api = "ok"; console.log("[코어시크] 외부 데이터 연동 " + n + "건");
      if (S.scr === "explore" || S.scr === "detail") render();
    })
    .catch(function (err) { S.api = "error"; console.warn("[코어시크] 외부 데이터 호출 실패", err); if (S.scr === "explore") render(); });
}

function go(s, id) {
  S.scr = s; S.limit = PAGE;
  if (s == "detail") { S.id = +id; S.rec = [S.id].concat(S.rec.filter(function (i) { return i != S.id; })).slice(0, 10); save(); }
  menuList.classList.remove("open"); render();
}
function only(key, v) { S.f = { p: [], l: [], e: [] }; S.f[key] = [v]; S.filters = []; S.q = ""; S.picked = [key + ":" + v]; go("explore"); }
function toggle(arr, v) { var k = arr.indexOf(v); if (k >= 0) arr.splice(k, 1); else arr.push(v); return k < 0; }
function pick(tok, added) { S.picked = S.picked.filter(function (t) { return t !== tok; }); if (added) S.picked.push(tok); }
function resetAll() { S.f = { p: [], l: [], e: [] }; S.filters = []; S.q = ""; S.picked = []; S.sort = "name"; S.limit = PAGE; render(); }

/* ---------- 이벤트 → 상태 변경 → 다시 그리기 ---------- */
document.addEventListener("click", function (e) {
  var t = e.target.closest("[data-go],[data-part],[data-f],[data-tagf],[data-filter],[data-unset],[data-del],[data-tab],[data-save],[data-reset],[data-menu],[data-level],[data-equip],[data-mytab],[data-more],[data-retry],[data-api]");
  if (!t) return;
  var d = t.dataset;
  if (d.retry !== undefined) { loadData(); return; }
  if (d.api !== undefined) { loadApi(); return; }
  if (d.more !== undefined) { S.limit += PAGE; renderList(); return; }
  if (d.del) { e.stopPropagation(); S.fav = S.fav.filter(function (i) { return i != d.del; }); save(); render(); return; }
  if (d.save) { var i = +d.save, k = S.fav.indexOf(i); if (k >= 0) S.fav.splice(k, 1); else S.fav.unshift(i); save(); render(); return; }
  if (d.menu !== undefined) { menuList.classList.toggle("open"); return; }
  if (d.level) { only("l", d.level); return; }
  if (d.equip) { only("e", d.equip); return; }
  if (d.part) { only("p", d.part); return; }
  if (d.mytab) { S.tab = d.mytab; go("my"); return; }
  if (d.tagf) {   // 썸네일 태그(복근·초급·맨몸 등) → 그 조건으로 필터
    e.stopPropagation();
    var a = d.tagf.split(":");
    if (S.scr !== "explore") { only(a[0], a[1]); return; }
    pick(d.tagf, toggle(S.f[a[0]], a[1])); render(); return;
  }
  if (d.f) { var b = d.f.split(":"); pick(d.f, toggle(S.f[b[0]], b[1])); S.limit = PAGE; render(); return; }
  if (d.filter) { pick("c:" + d.filter, toggle(S.filters, d.filter)); S.limit = PAGE; render(); return; }
  if (d.unset) {
    var st = without(d.unset); S.q = st.q; S.f = st.f; S.filters = st.filters;
    S.picked = S.picked.filter(function (x) { return x !== d.unset; }); S.limit = PAGE; render(); return;
  }
  if (d.tab) { S.tab = d.tab; render(); return; }
  if (d.reset !== undefined) { resetAll(); return; }
  if (d.go) { go(d.go, d.id); }
});
/* 탐색 화면 검색창: 입력할 때마다 목록만 다시 그림 (공백·대소문자 무시) */
document.addEventListener("input", function (e) {
  if (e.target.id === "search-input") { S.q = e.target.value; renderList(true); }
});
/* 홈 검색창: Enter → 탐색 화면으로 */
document.addEventListener("keydown", function (e) {
  if (e.key == "Enter" && e.target.hasAttribute("data-s")) { S.q = e.target.value; S.f = { p: [], l: [], e: [] }; S.filters = []; S.picked = []; go("explore"); }
});
document.addEventListener("change", function (e) {
  if (e.target.hasAttribute("data-sort")) { S.sort = e.target.value; renderList(true); }
});
document.addEventListener("error", function (e) { if (e.target.tagName == "IMG") e.target.classList.add("broken"); }, true);
loadData();
