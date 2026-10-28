/* 香港醫院指南 */
(function(){
"use strict";
var H = window.HOSPITALS || [];
var REGIONS = ["港島","九龍","新界","離島"];
var TYPES = [["","全部"],["public","公立"],["private","私家"],["cm","中醫醫院"]];
var TYPE_NAME = {public:"公立",private:"私家",cm:"中醫醫院"};
var KIND_ORDER = ["綜合醫院","專科醫院","專科中心","中醫醫院","復康／療養","紓緩治療","護養院"];
var $ = function(id){ return document.getElementById(id); };

var st = {q:"",r:"",d:"",s:"",t:"",ae:false,sopc:false,acute:false,sort:"area"};
var here = null;      // {lat,lng}
var waits = {};       // 醫院名 → {t3, t45, t45n, time}
var waitTime = "";

/* ---------- 工具 ---------- */
function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
function norm(s){ return String(s || "").replace(/[\s　()（）\-–—．.]/g,"").toLowerCase(); }
function km(a, b){
  var R = 6371, toR = Math.PI/180;
  var dLa = (b.lat-a.lat)*toR, dLo = (b.lng-a.lng)*toR;
  var x = Math.sin(dLa/2)*Math.sin(dLa/2) + Math.cos(a.lat*toR)*Math.cos(b.lat*toR)*Math.sin(dLo/2)*Math.sin(dLo/2);
  return 2*R*Math.asin(Math.sqrt(x));
}
function mapQuery(h){ return h.name + " " + h.addr; }
function gmapLink(h){ return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(mapQuery(h)); }
function gmapEmbed(h){ return "https://maps.google.com/maps?q=" + encodeURIComponent(mapQuery(h)) + "&hl=zh-TW&z=16&output=embed"; }
var I = {
  pin:'<svg viewBox="0 0 24 24"><path d="M12 21s-7-6.1-7-11.5a7 7 0 0 1 14 0C19 14.9 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
  tel:'<svg viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
  web:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
  clock:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  map:'<svg viewBox="0 0 24 24"><path d="m9 4-6 2v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14"/></svg>',
  go:'<svg viewBox="0 0 24 24"><path d="M7 17 17 7M8 7h9v9"/></svg>'
};

/* ---------- 網址狀態（方便分享篩選結果） ---------- */
function readHash(){
  var p = new URLSearchParams(location.hash.replace(/^#/,""));
  st.q = p.get("q") || ""; st.r = p.get("r") || ""; st.d = p.get("d") || "";
  st.s = p.get("s") || ""; st.t = p.get("t") || "";
  st.ae = p.get("ae") === "1"; st.sopc = p.get("sopc") === "1"; st.acute = p.get("acute") === "1";
  st.sort = p.get("sort") || "area";
  if (REGIONS.indexOf(st.r) < 0) st.r = "";
  if (window.SPECS.indexOf(st.s) < 0) st.s = "";
}
function writeHash(){
  var p = new URLSearchParams();
  if (st.q) p.set("q", st.q); if (st.r) p.set("r", st.r); if (st.d) p.set("d", st.d);
  if (st.s) p.set("s", st.s); if (st.t) p.set("t", st.t);
  if (st.ae) p.set("ae","1"); if (st.sopc) p.set("sopc","1"); if (st.acute) p.set("acute","1");
  if (st.sort !== "area") p.set("sort", st.sort);
  var h = p.toString();
  history.replaceState(null, "", h ? "#" + h : location.pathname + location.search);
}

/* ---------- 篩選介面 ---------- */
function seg(el, items, cur, onPick){
  el.innerHTML = items.map(function(it){
    return '<button type="button" data-v="' + esc(it[0]) + '"' + (it[0] === cur ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + '>' + esc(it[1]) + '</button>';
  }).join("");
  el.onclick = function(e){ var b = e.target.closest("button"); if (b) onPick(b.getAttribute("data-v")); };
}
function districtsOf(r){
  var out = [];
  H.forEach(function(h){ if ((!r || h.region === r) && out.indexOf(h.district) < 0) out.push(h.district); });
  return out.sort(function(a,b){ return a.localeCompare(b, "zh-HK"); });
}
function syncControls(){
  $("q").value = st.q;
  seg($("fRegion"), [["","全部"]].concat(REGIONS.map(function(r){ return [r, r]; })), st.r, function(v){ st.r = v; if (st.d && districtsOf(v).indexOf(st.d) < 0) st.d = ""; update(); });
  seg($("fType"), TYPES, st.t, function(v){ st.t = v; update(); });
  var ds = districtsOf(st.r);
  if (ds.indexOf(st.d) < 0) st.d = "";
  $("fDistrict").innerHTML = '<option value="">全部地區</option>' + ds.map(function(d){ return '<option' + (d === st.d ? " selected" : "") + '>' + esc(d) + '</option>'; }).join("");
  $("fSpec").innerHTML = '<option value="">全部專科</option>' + window.SPECS.map(function(s){ return '<option' + (s === st.s ? " selected" : "") + '>' + esc(s) + '</option>'; }).join("");
  $("fAe").checked = st.ae; $("fSopc").checked = st.sopc; $("fAcute").checked = st.acute;
  $("fSort").value = st.sort;
}

/* ---------- 篩選 + 排序 ---------- */
function match(h){
  if (st.r && h.region !== st.r) return false;
  if (st.d && h.district !== st.d) return false;
  if (st.t && h.type !== st.t) return false;
  if (st.s && h.specs.indexOf(st.s) < 0) return false;
  if (st.ae && !h.ae) return false;
  if (st.sopc && !h.sopc) return false;
  if (st.acute && h.kind !== "綜合醫院") return false;
  if (st.q){
    var hay = norm([h.name, h.en, h.region, h.district, h.cluster, h.addr, h.kind, h.specs.join(" "), TYPE_NAME[h.type]].join(" "));
    var words = st.q.trim().split(/\s+/);
    for (var i = 0; i < words.length; i++) if (hay.indexOf(norm(words[i])) < 0) return false;
  }
  return true;
}
function waitOf(h){ var w = h.ae && waits[norm(h.aeName || "")] || waits[norm(h.en)]; return w || null; }
function sortList(list){
  var typeO = {public:0, cm:1, private:2};
  function area(a, b){
    return REGIONS.indexOf(a.region) - REGIONS.indexOf(b.region)
      || a.district.localeCompare(b.district, "zh-HK")
      || typeO[a.type] - typeO[b.type]
      || (b.ae - a.ae)
      || KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind)
      || a.name.localeCompare(b.name, "zh-HK");
  }
  if (st.sort === "near" && here){
    list.forEach(function(h){ h._km = km(here, h); });
    return list.sort(function(a,b){ return a._km - b._km; });
  }
  if (st.sort === "wait"){
    return list.sort(function(a,b){
      var wa = waitOf(a), wb = waitOf(b);
      var va = wa && wa.t45n != null ? wa.t45n : Infinity, vb = wb && wb.t45n != null ? wb.t45n : Infinity;
      return va - vb || area(a, b);
    });
  }
  return list.sort(area);
}

/* ---------- 畫卡片 ---------- */
function card(h){
  var w = waitOf(h);
  var typeCls = h.type === "public" ? "b-pub" : h.type === "private" ? "b-pri" : "b-cm";
  var b = '<span class="bdg ' + typeCls + '">' + TYPE_NAME[h.type] + '</span>';
  if (h.ae) b += '<span class="bdg b-ae">' + (h.type === "public" ? "急症室 24 小時" : "24 小時門診／急症") + '</span>';
  if (h.sopc) b += '<span class="bdg b-sopc">' + (h.type === "public" ? "專科門診（需轉介）" : "專科門診") + '</span>';
  b += '<span class="bdg b-kind">' + esc(h.kind) + '</span>';

  var wait = "";
  if (h.ae && h.type === "public" && w){
    wait = '<div class="wait"><small class="wl">急症室等候時間（一半病人會喺以下時間內睇到醫生）</small>' +
      '<span class="wv">次緊急／非緊急 <b>' + esc(w.t45) + '</b></span>' +
      (w.t3 ? '<span class="wv">緊急 <b>' + esc(w.t3) + '</b></span>' : '') + '<small>醫管局即時數據 · 更新 ' + esc(w.time || waitTime) + '</small></div>';
  }
  var specs = h.specs.length ? '<div class="specs">' + h.specs.map(function(s){ return '<span class="sp' + (s === st.s ? " on" : "") + '">' + esc(s) + '</span>'; }).join("") + '</div>' : "";
  var dist = (st.sort === "near" && here && h._km != null) ? '<span class="dist">約 ' + (h._km < 10 ? h._km.toFixed(1) : Math.round(h._km)) + ' 公里</span>' : "";
  var meta = esc(h.region) + ' · ' + esc(h.district) + (h.cluster ? ' · 醫管局' + esc(h.cluster) + '聯網' : '');

  return '<article class="card" id="h-' + esc(h.id) + '">' +
    '<div class="c-head"><h2 class="c-name">' + esc(h.name) + '<span class="c-en">' + esc(h.en) + '</span></h2>' + dist + '</div>' +
    '<div class="c-meta">' + meta + '</div>' +
    '<div class="badges">' + b + '</div>' + wait + specs +
    '<div class="info">' +
      '<div>' + I.pin + '<span>' + esc(h.addr) + '</span></div>' +
      '<div>' + I.tel + '<a href="tel:' + esc(h.phone.replace(/\s/g,"")) + '">' + esc(h.phone) + '</a></div>' +
      (h.opd ? '<div>' + I.clock + '<span>' + esc(h.opd) + '</span></div>' : '') +
    '</div>' +
    (h.note ? '<p class="note">' + esc(h.note) + '</p>' : '') +
    '<div class="acts">' +
      '<a class="act pri" href="tel:' + esc(h.phone.replace(/\s/g,"")) + '">' + I.tel + '致電</a>' +
      '<button type="button" class="act" data-map="' + esc(h.id) + '" aria-expanded="false">' + I.map + '顯示地圖</button>' +
      '<a class="act" href="' + gmapLink(h) + '" target="_blank" rel="noopener">' + I.go + 'Google 地圖</a>' +
      (h.web ? '<a class="act" href="' + esc(h.web) + '" target="_blank" rel="noopener">' + I.web + '網站</a>' : '') +
    '</div></article>';
}

function summary(n){
  var tags = [];
  if (st.r) tags.push(st.r); if (st.d) tags.push(st.d); if (st.t) tags.push(TYPE_NAME[st.t]);
  if (st.s) tags.push(st.s); if (st.ae) tags.push("24 小時急症"); if (st.sopc) tags.push("專科門診");
  if (st.acute) tags.push("綜合醫院"); if (st.q) tags.push("「" + st.q + "」");
  var sortTxt = st.sort === "near" ? (here ? "按距離排序" : "按距離排序（未取得位置）") : st.sort === "wait" ? "按急症室等候時間排序" : "按地區排序";
  return '<b>' + n + '</b> 間醫院' + (tags.length ? '　' + tags.map(function(t){ return '<span class="tag">' + esc(t) + '</span>'; }).join("") : '　（全部）') + '　<span>' + sortTxt + '</span>';
}

function render(){
  var list = sortList(H.filter(match));
  $("summary").innerHTML = summary(list.length);
  $("list").innerHTML = list.length ? list.map(card).join("") :
    '<div class="empty">搵唔到符合條件嘅醫院。<br>試下放寬地區或專科，或者<button type="button" class="link-btn" data-reset>清除篩選</button>。</div>';
}
function update(){ writeHash(); syncControls(); render(); }

/* ---------- 地圖 ---------- */
$("list").addEventListener("click", function(e){
  if (e.target.closest("[data-reset]")) { reset(); return; }
  var btn = e.target.closest("[data-map]"); if (!btn) return;
  var c = btn.closest(".card"), m = c.querySelector(".map");
  if (m){ m.remove(); btn.setAttribute("aria-expanded","false"); btn.lastChild.textContent = "顯示地圖"; return; }
  var h = H.filter(function(x){ return x.id === btn.getAttribute("data-map"); })[0];
  var div = document.createElement("div"); div.className = "map";
  div.innerHTML = '<iframe loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="' + esc(h.name) + '地圖" src="' + gmapEmbed(h) + '"></iframe>';
  c.querySelector(".acts").before(div);
  btn.setAttribute("aria-expanded","true"); btn.lastChild.textContent = "收起地圖";
});

/* ---------- 位置 ---------- */
function locate(done){
  if (here) { done(true); return; }
  if (!navigator.geolocation) { done(false); return; }
  $("summary").innerHTML = "正在取得你嘅位置…";
  navigator.geolocation.getCurrentPosition(function(p){
    here = {lat:p.coords.latitude, lng:p.coords.longitude}; done(true);
  }, function(){ done(false); }, {enableHighAccuracy:false, timeout:10000, maximumAge:300000});
}
function useNear(fallback){
  locate(function(ok){
    if (!ok){
      st.sort = fallback || "area";
      update();
      $("aedInfo").textContent = "未能取得位置（可能未允許定位）。" + (st.sort === "wait" ? "已改為按急症室等候時間排序。" : "");
      return;
    }
    update();
  });
}

/* ---------- 急症室即時等候時間 ---------- */
function fmt(v, unit){
  if (v == null || v === "") return "";
  var s = String(v).trim();
  return /^[\d.]+$/.test(s) ? s + " " + unit : s;
}
function toHours(v){
  if (v == null) return null;
  var s = String(v), n = parseFloat(s.replace(/[^\d.]/g,""));
  if (isNaN(n)) return null;
  if (/分鐘|min/i.test(s)) n = n / 60;
  if (/少於|<|&lt;/.test(s)) n = n - 0.01;
  return n;
}
function loadWaits(){
  fetch("/.netlify/functions/aed", {cache:"no-store"}).then(function(r){ if (!r.ok) throw 0; return r.json(); }).then(function(j){
    var arr = Array.isArray(j) ? j : (j.waitTime || j.waitingTime || Object.keys(j).map(function(k){ return j[k]; }).filter(Array.isArray)[0] || []);
    arr.forEach(function(x){
      if (!x || !x.hospName) return;
      var t45 = x.t45p50 != null ? x.t45p50 : x.topWait;
      waits[norm(x.hospName)] = { t3: fmt(x.t3p50, "分鐘"), t45: fmt(t45, "小時"), t45n: toHours(t45), time: x.updateTime || "" };
      if (x.updateTime) waitTime = x.updateTime;
    });
    if (j.updateTime) waitTime = j.updateTime;
    if (arr.length){
      $("aedInfo").textContent = "急症室等候時間來自醫管局即時數據（" + waitTime + "），只供參考；急症室按病情緩急次序診症，危急病人會優先處理。";
      render();
    }
  }).catch(function(){
    $("aedInfo").innerHTML = '暫時未能載入急症室即時等候時間，可用醫管局「HA Go」或<a href="https://www.ha.org.hk/" target="_blank" rel="noopener">醫管局網站</a>查看。';
  });
}

/* ---------- 綁定 ---------- */
var qTimer;
$("q").addEventListener("input", function(e){ clearTimeout(qTimer); qTimer = setTimeout(function(){ st.q = e.target.value.trim(); writeHash(); render(); }, 150); });
$("fDistrict").addEventListener("change", function(e){ st.d = e.target.value; update(); });
$("fSpec").addEventListener("change", function(e){ st.s = e.target.value; update(); });
$("fAe").addEventListener("change", function(e){ st.ae = e.target.checked; update(); });
$("fSopc").addEventListener("change", function(e){ st.sopc = e.target.checked; update(); });
$("fAcute").addEventListener("change", function(e){ st.acute = e.target.checked; update(); });
$("fSort").addEventListener("change", function(e){
  st.sort = e.target.value;
  if (st.sort === "near") useNear("area"); else update();
});
function reset(){ st = {q:"",r:"",d:"",s:"",t:"",ae:false,sopc:false,acute:false,sort:"area"}; $("aedInfo").textContent = ""; update(); }
$("btnReset").addEventListener("click", reset);
$("btnAe").addEventListener("click", function(){
  st = {q:"",r:"",d:"",s:"",t:"",ae:true,sopc:false,acute:false,sort:"near"};
  useNear("wait");
  $("summary").scrollIntoView({behavior:"smooth", block:"start"});
});
window.addEventListener("hashchange", function(){ readHash(); syncControls(); render(); });

$("checked").textContent = window.DATA_CHECKED || "";
readHash();
if (st.sort === "near") st.sort = "area"; // 打開時唔自動問位置
syncControls(); render(); loadWaits();
})();
