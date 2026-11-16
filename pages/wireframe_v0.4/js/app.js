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
  sort: "beginner", tab: "favs", fav: [], rec: [], limit: PAGE, load: "loading", api: "idle",
  more: false,                                   // 난이도·기구·조건 펼침 여부 (기본은 접힘)
  reviews: {}, draft: { star: 0, parts: [], text: "" } };   // 내가 쓴 후기, 작성 중인 후기
var DEFAULT_SORT = "beginner";
try {
  S.fav = JSON.parse(localStorage.getItem("favoriteExerciseIds") || "[]");
  S.rec = JSON.parse(localStorage.getItem("recentExerciseIds") || "[]");
  S.reviews = JSON.parse(localStorage.getItem("exerciseReviews") || "{}");
} catch (e) {}
function save() {
  try {
    localStorage.setItem("favoriteExerciseIds", JSON.stringify(S.fav));
    localStorage.setItem("recentExerciseIds", JSON.stringify(S.rec));
    localStorage.setItem("exerciseReviews", JSON.stringify(S.reviews));
  } catch (e) {}
}

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
var FILTER_LABEL = { guide: "설명이 있는 운동", push: "미는 운동", pull: "당기는 운동", compound: "여러 근육 같이", isolation: "한 부위만 집중" };
var NEED_API = { push: 1, pull: 1, compound: 1, isolation: 1 };   // 외부 데이터가 있어야 쓸 수 있는 조건

/* ---------- 정렬 (9주차 2.1) ---------- */
function byName(a, b) { return a.name.localeCompare(b.name, "ko"); }
function easyScore(x) { return (x.difficulty === "초급" ? 4 : 0) + (x.equipment === "머신" ? 3 : x.equipment === "맨몸" ? 2 : x.equipment === "덤벨" ? 1 : 0) + (x.description ? 1 : 0); }
/* 헬스 초보자 서비스에 맞춘 정렬 기준 (선택 상자에 이 순서대로 보임) */
var SORTERS = {
  beginner: function (a, b) { return easyScore(b) - easyScore(a) || (b.popularity || 0) - (a.popularity || 0) || byName(a, b); },   // 기본값
  popular:  function (a, b) { return (b.popularity ?? -1) - (a.popularity ?? -1) || byName(a, b); },
  rating:   function (a, b) { return (avgStar(b) ?? -1) - (avgStar(a) ?? -1) || (b.popularity || 0) - (a.popularity || 0) || byName(a, b); },
  level:    function (a, b) { return LV.indexOf(a.difficulty) - LV.indexOf(b.difficulty) || byName(a, b); },
  name:     byName
};
var SORT_LABEL = { beginner: "초보자 추천순", popular: "많이 찾는 순", rating: "별점 높은 순", level: "쉬운 운동부터", name: "이름 가나다순" };

/* ---------- 운동 후기 ---------- */
function reviewsOf(x) {
  var mine = (S.reviews[x.id] || []).map(function (r, i) { return { rating: r.rating, parts: r.parts, text: r.text, mine: true, idx: i }; });
  var samples = (x.sampleReviews || []).map(function (r) { return { rating: r.rating, parts: r.parts, text: r.text, sample: true }; });
  return mine.concat(samples);
}
function avgStar(x) {
  var r = reviewsOf(x); if (!r.length) return null;
  return Math.round(r.reduce(function (s, v) { return s + v.rating; }, 0) / r.length * 10) / 10;
}
function stars(n) { var s = ""; for (var i = 1; i <= 5; i++) s += i <= Math.round(n) ? "★" : "☆"; return s; }
function effectParts(x) { return x.api && x.muscles.length ? x.muscles.filter(function (m, i, a) { return a.indexOf(m) === i; }) : [x.category]; }

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
function tokenLabel(t) { var a = t.split(":"); return a[0] === "c" ? FILTER_LABEL[a[1]] : a[0] === "q" ? "검색어" : a[1]; }

/* ---------- 화면 조각 ---------- */
function get(id) { return EX.filter(function (x) { return x.id == id; })[0]; }
/* 받침에 따라 을/를 고르기 */
function eul(w) { w = String(w || ""); var c = w.charCodeAt(w.length - 1) - 0xac00; return c >= 0 && c <= 11171 && c % 28 ? "을" : "를"; }
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
  if (S.api === "loading") return '<p class="note">근육 정보를 받아오고 있어요. 조금 뒤면 미는 운동, 당기는 운동 같은 조건도 쓸 수 있어요.</p>';
  if (S.api === "error") return '<p class="note">근육 정보를 받아오지 못해서 지금은 미는 운동, 당기는 운동 같은 조건을 쓸 수 없어요. <button class="link" data-api>다시 받아오기</button></p>';
  return "";
}
function items(a) { return (a && a.length) ? a.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") : ""; }
function tag(m, k) { var t = (m.real || []).indexOf(k) >= 0 ? "real" : ((m.dummy || []).indexOf(k) >= 0 ? "dummy" : ""); return t ? '<span class="tag ' + t + '">' + (t == "real" ? "실제" : "더미") + "</span>" : ""; }

/* ---------- 결과 목록 (9주차 renderList: 건수·카드·결과 없음을 한 번에) ---------- */
function listHTML() {
  var r = sorted(), n = activeCount(), shown = r.slice(0, S.limit);
  var bar = '<div class="bar"><span id="count">' + (!r.length ? "맞는 운동이 없어요" : n ? "조건 " + n + "개, 운동 " + r.length + "개" : S.q ? "운동 " + r.length + "개를 찾았어요" : "전체 운동 " + r.length + "개") + "</span>"
    + '<span class="tools"><select data-sort aria-label="정렬">' + Object.keys(SORTERS).map(function (k) {
        return '<option value="' + k + '"' + (S.sort == k ? " selected" : "") + ">" + SORT_LABEL[k] + "</option>";
      }).join("") + '</select><button data-reset aria-label="전체 조건 초기화">↺</button></span></div>';
  /* 더미 필드로 거르는 조건이면 실습용 값이라는 안내를 함께 보여 줌 */
  if (S.filters.indexOf("guide") >= 0) bar += '<p class="note">설명이 있는 운동은 16개예요. 이 설명은 수업 실습용으로 AI가 쓴 예시라서 전문가 검수를 거치지 않았어요.</p>';
  if (!r.length) {
    var tokens = S.picked.slice(); if (S.q) tokens.unshift("q:");
    var rm = tokens.slice().reverse().filter(function (t) { return results(without(t)).length; })[0];
    var tip = rm ? '<p class="suggest">' + tokenLabel(rm) + " 조건을 빼면 " + results(without(rm)).length + '개가 나와요.</p><button data-unset="' + rm + '">' + tokenLabel(rm) + " 빼기</button>" : "<br>";
    return bar + empty("딱 맞는 운동이 없어요", "고른 조건을 조금만 줄여 볼까요?", tip + "<button data-reset>처음부터 다시</button>");
  }
  return bar + shown.map(function (x) { return card(x); }).join("")
    + (r.length > shown.length ? '<button class="more" data-more>운동 더 보기</button>' : "");
}
function renderList(reset) {
  if (reset) S.limit = PAGE;   // 조건이 바뀌면 처음 30개부터
  render(!reset);              // 더 보기는 스크롤 유지, 입력 중인 검색창 커서는 render()가 지켜 줌
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
/* 상세 상단 별점 한 줄 */
function rateLine(x) {
  var a = avgStar(x), n = reviewsOf(x).length;
  return '<p class="rate">' + (a == null ? '<span class="none">아직 후기가 없어요</span>' : '<b>' + stars(a) + " " + a + "</b> 후기 " + n + "개") + "</p>";
}
/* 운동 후기: 별점, 효과를 느낀 부위, 한 줄 후기 */
function reviewBox(x) {
  var list = reviewsOf(x), a = avgStar(x), cnt = {};
  list.forEach(function (r) { r.parts.forEach(function (p) { cnt[p] = (cnt[p] || 0) + 1; }); });
  var top = Object.keys(cnt).sort(function (p, q) { return cnt[q] - cnt[p]; }).slice(0, 3);
  var dr = S.draft, opts = effectParts(x);
  var h = '<h3><span>운동 후기' + (x.sampleReviews ? '<span class="tag dummy">예시 포함</span>' : "") + "</span></h3>";
  if (list.length) {
    h += '<div class="rv-sum"><div class="rv-avg"><b>' + a + '</b><span>' + stars(a) + "</span><small>후기 " + list.length + "개</small></div>"
      + '<div class="rv-parts"><small>효과를 느낀 부위</small>' + top.map(function (p) {
          return '<div class="rv-row"><span>' + esc(p) + '</span><span class="rk-bar"><i style="width:' + Math.round(cnt[p] / list.length * 100) + '%"></i></span><em>' + cnt[p] + "명</em></div>";
        }).join("") + "</div></div>";
  }
  h += '<div class="rv-form"><b>해 보니 어땠나요?</b><div class="stars" role="radiogroup" aria-label="별점">'
    + [1, 2, 3, 4, 5].map(function (n) { return '<button data-star="' + n + '" aria-label="' + n + '점"' + (n <= dr.star ? ' class="on"' : "") + ">" + (n <= dr.star ? "★" : "☆") + "</button>"; }).join("")
    + '</div><small>효과를 느낀 부위 (여러 개 골라도 돼요)</small><div class="row">'
    + opts.map(function (p) { return '<button class="chip' + (dr.parts.indexOf(p) >= 0 ? " on" : "") + '" data-rpart="' + esc(p) + '">' + esc(p) + "</button>"; }).join("")
    + '</div><textarea id="review-text" maxlength="100" rows="2" placeholder="한 줄로 남겨 주세요. 예) 무릎 대고 시작하니 할 만했어요">' + esc(dr.text) + "</textarea>"
    + (dr.err ? '<p class="err">' + dr.err + "</p>" : "")
    + '<button class="rv-send" data-rsend>후기 남기기</button><p class="note">후기는 이 기기에만 저장돼요.</p></div>';
  h += list.length ? '<ul class="rv-list">' + list.map(function (r) {
      return "<li><div><b>" + stars(r.rating) + "</b> " + r.parts.map(function (p) { return '<span class="bd">' + esc(p) + "</span>"; }).join("")
        + (r.sample ? '<span class="tag dummy">예시</span>' : '<span class="tag real">내 후기</span>') + "</div><p>" + esc(r.text || "") + "</p>"
        + (r.mine ? '<button class="link" data-rdel="' + r.idx + '">삭제</button>' : "") + "</li>";
    }).join("") + "</ul>" : '<p class="none">아직 후기가 없어요. 첫 후기를 남겨 주세요.</p>';
  return h;
}
/* 전체 메뉴: 홈·탭·탐색 화면에 없는 것만 (사용법, 내 기록 관리, 데이터 출처) */
var menuBody = document.querySelector("#menu-body");
function drawerHTML() {
  var nRev = Object.keys(S.reviews).reduce(function (s, k) { return s + S.reviews[k].length; }, 0);
  var has = S.fav.length + S.rec.length + nRev;
  return '<h4>이렇게 써 보세요</h4><ol class="how">'
    + "<li><b>운동할 부위를 골라요</b>홈이나 탐색에서 가슴, 등, 하체 같은 부위를 누르면 돼요.</li>"
    + "<li><b>조건으로 좁혀요</b>난이도, 기구, 미는 운동 같은 조건을 더하면 나에게 맞는 운동만 남아요.</li>"
    + "<li><b>방법을 보고 남겨요</b>운동을 열어 순서와 조심할 점을 보고, 저장하거나 후기를 남겨요.</li></ol>"
    + '<h4>내 기록</h4><div class="mine"><span><b>' + S.fav.length + '</b>저장한 운동</span><span><b>' + S.rec.length + '</b>최근 본 운동</span><span><b>' + nRev + "</b>남긴 후기</span></div>"
    + (has ? '<button class="wipe' + (S.wipe ? " on" : "") + '" data-wipe>' + (S.wipe ? "한 번 더 누르면 모두 지워져요" : "이 기기에 남은 기록 지우기") + "</button>"
           : '<p class="note">아직 남은 기록이 없어요. 기록은 이 기기에만 저장돼요.</p>')
    + '<h4>데이터 출처</h4><p class="src-note">운동 목록과 운동 방법, 쓰는 근육 정보는 누구나 쓸 수 있게 공개된 Free Exercise DB에서 가져왔어요. 1~16번 운동의 설명, 기구 맞추기, 조심할 점과 인기 수치, 예시 후기는 수업 실습용으로 만든 값이에요.</p>';
}
function openMenu() { S.wipe = false; menuBody.innerHTML = drawerHTML(); menuList.classList.toggle("open"); }
var VIEWS = {
  home: function () {
    var rec = homePicks(6);
    var top = EX.slice().sort(SORTERS.popular).slice(0, 5), max = top.length ? top[0].popularity : 1;
    return '<section class="hello"><b>헬스장이 처음이라면, 코어시크</b>'
      + '<p>운동 이름을 몰라도 괜찮아요. 운동할 부위나 기구만 고르면 하는 방법과 조심할 점을 알려 드려요.</p>'
      + '<input class="in" id="home-search" data-s placeholder="🔍 어떤 운동을 찾고 있나요?" aria-label="운동 검색"></section>'
      + '<h3>오늘은 어디를 운동할까요?</h3><div class="row">' + PARTS.map(function (p) { return '<button class="chip" data-part="' + p + '">' + p + "</button>"; }).join("") + "</div>"
      + '<h3>요즘 많이 찾는 운동<a data-sortgo="popular">전체 순위</a></h3><ol class="rank">' + top.map(function (x, i) {
          return '<li data-go="detail" data-id="' + x.id + '"><em>' + (i + 1) + '</em><span class="rk-name">' + esc(x.name) + '<small>' + x.category + " " + x.equipment + '</small></span>'
            + '<span class="rk-bar"><i style="width:' + Math.round(x.popularity / max * 100) + '%"></i></span><span class="rk-num">' + x.popularity.toLocaleString() + "</span></li>";
        }).join("") + '</ol><p class="note">순위 수치는 수업 실습용 예시 값이에요.</p>'
      + '<h3>처음이라면 이 운동부터<a data-go="explore">전체 보기</a></h3><div class="grid">' + rec.map(tile).join("") + "</div>";
  },
  /* 검색 보드(검색창 + 부위·난이도·기구·조건)를 목록 위에 한 덩어리로 */
  explore: function () {
    var hidden = S.f.l.length + S.f.e.length + S.filters.length;
    return '<section class="board"><div class="filters">' + grp("부위", "p", PARTS)
      + (S.more ? grp("난이도", "l", LV) + grp("기구", "e", EQ) + conds() : "") + "</div>" + (S.more ? apiNote() : "")
      + '<button class="fold" data-fold aria-expanded="' + S.more + '">' + (S.more ? "간단히 보기 ▲" : "난이도, 기구, 조건 더 고르기 ▼" + (hidden ? " <em>" + hidden + "개 선택</em>" : "")) + "</button>"
      + '<input class="in" id="search-input" placeholder="🔍 운동 이름이나 기구, 근육으로 찾기" aria-label="운동 검색" value="' + esc(S.q) + '"></section>'
      + '<div id="results">' + listHTML() + "</div>";
  },
  detail: function () {
    var x = get(S.id);
    if (!x) return empty("이 운동을 찾지 못했어요", "목록으로 돌아가서 다시 골라 주세요.", '<br><button data-go="explore">목록으로</button>');
    var on = S.fav.indexOf(x.id) >= 0, m = x.meta || {}, unk = (m.unknown || []).length;
    return '<button class="back" data-go="explore">← 목록으로</button><div class="hero"><span class="bg" style="background-image:url(\'' + esc(x.image) + '\')"></span><img src="' + esc(x.image) + '" alt="' + esc(x.name) + ' 대표 이미지"></div><h2 class="title">' + esc(x.name) + '</h2><div class="eng">' + esc(x.engName) + '</div><div><span class="bd src">JSON</span>' + (x.api ? '<span class="bd src">API</span>' : "") + bds(x) + "</div>"
      + rateLine(x)
      + '<p class="meta">저장해 둔 JSON 파일' + (x.api ? "과 Free Exercise DB에서" : "에서") + " 가져온 정보예요. 실제 정보 " + (m.real || []).length + "개" + ((m.dummy || []).length ? ", 실습용 예시 " + m.dummy.length + "개" : "") + (unk ? ", 아직 비어 있는 항목 " + unk + "개" : "") + "가 있어요.</p>"
      + '<p class="desc">' + (x.description ? esc(x.description) + tag(m, "description") : '<span class="none">아직 설명이 없어요.</span>') + "</p>"
      + (x.api ? '<h3><span>쓰는 근육<span class="tag real">API</span></span></h3><ul><li>주로 ' + esc(x.primary.join(", ")) + eul(x.primary[x.primary.length - 1]) + " 써요</li>" + (x.secondary.length ? "<li>" + esc(x.secondary.join(", ")) + "도 같이 써요</li>" : "") + ([x.force, x.mechanic].filter(Boolean).length ? "<li>" + esc([x.force, x.mechanic].filter(Boolean).join(", ")) + " 운동이에요</li>" : "") + "</ul>" : "")
      + "<h3><span>기구 맞추기" + tag(m, "setup") + "</span></h3>" + (x.setup && x.setup.length ? "<ul>" + items(x.setup) + "</ul>" : '<p class="none">아직 정리된 내용이 없어요.</p>')
      + "<h3><span>운동 방법" + tag(m, "steps") + "</span></h3>" + (m.stepsLang == "en" ? '<p class="note">영어 원문 그대로예요.</p>' : (m.stepsLang == "ko" ? '<p class="note">영어 원문을 우리말로 옮겼어요.</p>' : "")) + "<ol>" + items(x.steps) + "</ol>"
      + "<h3><span>이것만 조심하세요" + tag(m, "tips") + "</span></h3>" + (x.tips && x.tips.length ? "<ul>" + items(x.tips) + "</ul>" : '<p class="none">아직 정리된 내용이 없어요.</p>')
      + reviewBox(x)
      + '<button class="save' + (on ? " on" : "") + '" data-save="' + x.id + '">' + (on ? "★ 저장했어요" : "☆ 저장해 두기") + "</button>"
      + '<p class="src-foot">운동 정보는 누구나 쓸 수 있게 공개된 Free Exercise DB에서 가져왔어요. 더미라고 붙은 글은 수업 실습용으로 AI가 쓴 내용이에요.</p>';
  },
  my: function () {
    var f = S.tab == "favs", ids = (f ? S.fav : S.rec).filter(function (i) { return get(i); });
    return '<div class="tabs"><button data-tab="favs" class="' + (f ? "on" : "") + '">관심 운동</button><button data-tab="recent" class="' + (f ? "" : "on") + '">최근 본 운동</button></div>'
      + (ids.length ? ids.map(function (i) { return card(get(i), f); }).join("") : empty(f ? "아직 저장한 운동이 없어요" : "아직 본 운동이 없어요", f ? "마음에 드는 운동을 저장해 두면 여기서 바로 꺼내 볼 수 있어요." : "운동을 열어 보면 여기에 하나씩 남아요.", '<br><button data-go="explore">운동 둘러보기</button>'));
  }
};

function render(keepScroll) {
  if (S.load == "loading") { screenView.innerHTML = empty("운동 정보를 가져오고 있어요", "잠깐만 기다려 주세요."); return; }
  if (S.load == "error") { screenView.innerHTML = empty("운동 정보를 가져오지 못했어요", "파일을 바로 열면 운동 정보를 읽을 수 없어요. GitHub Pages 주소로 들어와 주세요.", "<br><button data-retry>다시 불러오기</button>"); return; }
  var typing = document.activeElement && document.activeElement.id === "search-input";
  screenView.innerHTML = VIEWS[S.scr]();
  if (typing) { var si = document.querySelector("#search-input"); if (si) { si.focus(); si.setSelectionRange(si.value.length, si.value.length); } }   // 입력 중이면 커서 유지
  var navOn = S.scr == "detail" ? "explore" : S.scr;
  Array.prototype.forEach.call(bottomNav.children, function (b) { b.className = b.getAttribute("data-go") == navOn ? "on" : ""; });
  if (!keepScroll) screenView.scrollTop = 0;
}

/* ---------- 데이터 불러오기 ---------- */
function loadData() {
  S.load = "loading"; render();
  fetch(DATA_URL, { cache: "no-cache" })   // 항상 최신 JSON 확인
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
  if (s == "detail") { if (S.id !== +id) S.draft = { star: 0, parts: [], text: "" }; S.id = +id; S.rec = [S.id].concat(S.rec.filter(function (i) { return i != S.id; })).slice(0, 10); save(); }
  menuList.classList.remove("open"); render();
}
function only(key, v) { S.f = { p: [], l: [], e: [] }; S.f[key] = [v]; S.filters = []; S.q = ""; S.picked = [key + ":" + v]; if (key !== "p") S.more = true; go("explore"); }
function toggle(arr, v) { var k = arr.indexOf(v); if (k >= 0) arr.splice(k, 1); else arr.push(v); return k < 0; }
function pick(tok, added) { S.picked = S.picked.filter(function (t) { return t !== tok; }); if (added) S.picked.push(tok); }
function resetAll() { S.f = { p: [], l: [], e: [] }; S.filters = []; S.q = ""; S.picked = []; S.sort = DEFAULT_SORT; renderList(true); }

/* ---------- 이벤트 → 상태 변경 → 다시 그리기 ---------- */
document.addEventListener("click", function (e) {
  var t = e.target.closest("[data-go],[data-part],[data-f],[data-tagf],[data-filter],[data-unset],[data-del],[data-tab],[data-save],[data-reset],[data-menu],[data-level],[data-equip],[data-mytab],[data-more],[data-retry],[data-api],[data-fold],[data-sortgo],[data-star],[data-rpart],[data-rsend],[data-rdel],[data-wipe]");
  if (!t) return;
  var d = t.dataset;
  if (d.retry !== undefined) { loadData(); return; }
  if (d.fold !== undefined) { S.more = !S.more; render(true); return; }
  if (d.sortgo) { S.f = { p: [], l: [], e: [] }; S.filters = []; S.q = ""; S.picked = []; S.sort = d.sortgo; go("explore"); return; }
  if (d.star) { S.draft.star = +d.star; S.draft.err = ""; render(true); return; }
  if (d.rpart) { toggle(S.draft.parts, d.rpart); render(true); return; }
  if (d.rsend !== undefined) {
    if (!S.draft.star) { S.draft.err = "별점을 먼저 골라 주세요."; render(true); return; }
    (S.reviews[S.id] = S.reviews[S.id] || []).unshift({ rating: S.draft.star, parts: S.draft.parts.slice(), text: S.draft.text.trim().slice(0, 100) });
    S.draft = { star: 0, parts: [], text: "" }; save(); render(true); return;
  }
  if (d.rdel) { (S.reviews[S.id] || []).splice(+d.rdel, 1); save(); render(true); return; }
  if (d.api !== undefined) { loadApi(); return; }
  if (d.more !== undefined) { S.limit += PAGE; renderList(); return; }
  if (d.del) { e.stopPropagation(); S.fav = S.fav.filter(function (i) { return i != d.del; }); save(); render(); return; }
  if (d.save) { var i = +d.save, k = S.fav.indexOf(i); if (k >= 0) S.fav.splice(k, 1); else S.fav.unshift(i); save(); render(); return; }
  if (d.menu !== undefined) { if (menuList.classList.contains("open")) menuList.classList.remove("open"); else openMenu(); return; }
  if (d.wipe !== undefined) {   // 두 번 눌러야 지워지게 (실수 방지)
    if (!S.wipe) { S.wipe = true; menuBody.innerHTML = drawerHTML(); return; }
    S.fav = []; S.rec = []; S.reviews = {}; S.wipe = false; save(); menuBody.innerHTML = drawerHTML(); render(true); return;
  }
  if (d.level) { only("l", d.level); return; }
  if (d.equip) { only("e", d.equip); return; }
  if (d.part) { only("p", d.part); return; }
  if (d.mytab) { S.tab = d.mytab; go("my"); return; }
  if (d.tagf) {   // 썸네일 태그(복근·초급·맨몸 등) → 그 조건으로 필터
    e.stopPropagation();
    var a = d.tagf.split(":");
    if (S.scr !== "explore") { only(a[0], a[1]); return; }
    pick(d.tagf, toggle(S.f[a[0]], a[1])); renderList(true); return;
  }
  if (d.f) { var b = d.f.split(":"); pick(d.f, toggle(S.f[b[0]], b[1])); renderList(true); return; }
  if (d.filter) { pick("c:" + d.filter, toggle(S.filters, d.filter)); renderList(true); return; }
  if (d.unset) {
    var st = without(d.unset); S.q = st.q; S.f = st.f; S.filters = st.filters;
    S.picked = S.picked.filter(function (x) { return x !== d.unset; }); renderList(true); return;
  }
  if (d.tab) { S.tab = d.tab; render(); return; }
  if (d.reset !== undefined) { resetAll(); return; }
  if (d.go) { go(d.go, d.id); }
});
/* 탐색 화면 검색창: 입력할 때마다 목록만 다시 그림 (공백·대소문자 무시) */
document.addEventListener("input", function (e) {
  if (e.target.id === "search-input") { S.q = e.target.value; renderList(true); }
  if (e.target.id === "review-text") { S.draft.text = e.target.value; }   // 후기 입력은 다시 그리지 않음
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
