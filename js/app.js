/* 香港醫院指南 */
(function(){
"use strict";
var H = window.HOSPITALS || [];
var REGIONS = ["港島","九龍","新界","離島"];
var TYPES = [["","全部"],["public","公立"],["private","私家"],["cm","中醫醫院"]];
var TYPE_NAME = {public:"公立",private:"私家",cm:"中醫醫院"};
var KIND_ORDER = ["綜合醫院","專科醫院","專科中心","中醫醫院","復康／療養","紓緩治療","護養院"];
var $ = function(id){ return document.getElementById(id); };

function blank(){ return {v:"list",es:"near",q:"",r:"",d:"",s:"",t:"",ae:false,sopc:false,acute:false,inst:false,sort:"area"}; }
var st = blank();
var openIds = {};   // 已展開「詳細」嘅卡片
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
  st.ae = p.get("ae") === "1"; st.sopc = p.get("sopc") === "1"; st.acute = p.get("acute") === "1"; st.inst = p.get("inst") === "1";
  st.sort = p.get("sort") || "area";
  st.v = p.get("v") === "er" ? "er" : "list";
  st.es = p.get("es") === "wait" ? "wait" : "near";
  if (REGIONS.indexOf(st.r) < 0) st.r = "";
  if (window.SPECS.indexOf(st.s) < 0) st.s = "";
}
function writeHash(){
  var p = new URLSearchParams();
  if (st.q) p.set("q", st.q); if (st.r) p.set("r", st.r); if (st.d) p.set("d", st.d);
  if (st.s) p.set("s", st.s); if (st.t) p.set("t", st.t);
  if (st.ae) p.set("ae","1"); if (st.sopc) p.set("sopc","1"); if (st.acute) p.set("acute","1"); if (st.inst) p.set("inst","1");
  if (st.sort !== "area") p.set("sort", st.sort);
  if (st.v === "er"){ p = new URLSearchParams(); p.set("v","er"); if (st.r) p.set("r", st.r); if (st.es === "wait") p.set("es","wait"); }
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
  document.querySelectorAll("#tabs button").forEach(function(b){ var on = b.getAttribute("data-v") === st.v; b.classList.toggle("on", on); b.setAttribute("aria-selected", on); });
  $("erView").hidden = st.v !== "er"; $("dirView").hidden = st.v === "er";
  document.body.setAttribute("data-v", st.v);
  seg($("erRegion"), [["","全港"]].concat(REGIONS.map(function(r){ return [r, r]; })), st.r, function(v){ st.r = v; update(); });
  seg($("erSortSeg"), [["near","按距離"],["wait","按等候時間"]], st.es, function(v){ st.es = v; if (v === "near") useNear(); else update(); });
  $("q").value = st.q;
  seg($("fRegion"), [["","全部"]].concat(REGIONS.map(function(r){ return [r, r]; })), st.r, function(v){ st.r = v; if (st.d && districtsOf(v).indexOf(st.d) < 0) st.d = ""; update(); });
  seg($("fType"), TYPES, st.t, function(v){ st.t = v; update(); });
  var ds = districtsOf(st.r);
  if (ds.indexOf(st.d) < 0) st.d = "";
  $("fDistrict").innerHTML = '<option value="">全部地區</option>' + ds.map(function(d){ return '<option' + (d === st.d ? " selected" : "") + '>' + esc(d) + '</option>'; }).join("");
  $("fSpec").innerHTML = '<option value="">全部專科</option>' + window.SPECS.map(function(s){ return '<option' + (s === st.s ? " selected" : "") + '>' + esc(s) + '</option>'; }).join("");
  $("fAe").checked = st.ae; $("fSopc").checked = st.sopc; $("fAcute").checked = st.acute; $("fInst").checked = st.inst;
  $("fSort").value = st.sort;
}

/* ---------- 篩選 + 排序 ---------- */
function match(h, ignoreInst){
  if (h.inst && !st.inst && !ignoreInst && !st.q) return false;
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
function tel(h){ return "tel:" + h.phone.replace(/\s/g,""); }
function kmTxt(h){ return h._km == null ? "" : "約 " + (h._km < 10 ? h._km.toFixed(1) : Math.round(h._km)) + " 公里"; }
function waitLevel(w){ return !w || w.t45n == null ? "" : w.t45n <= 1.5 ? " lv-ok" : w.t45n <= 3.5 ? " lv-mid" : " lv-hi"; }
function card(h){
  var w = waitOf(h), open = !!openIds[h.id];
  var typeCls = h.type === "public" ? "b-pub" : h.type === "private" ? "b-pri" : "b-cm";
  var b = '<span class="bdg ' + typeCls + '">' + TYPE_NAME[h.type] + '</span>';
  if (h.ae) b += '<span class="bdg b-ae">' + (h.type === "public" ? "急症室 24 小時" : "24 小時門診／急症") + '</span>';
  if (h.sopc) b += '<span class="bdg b-sopc">' + (h.type === "public" ? "專科門診（需轉介）" : "專科門診") + '</span>';
  if (st.s) b += '<span class="bdg b-hit">' + esc(st.s) + '</span>';
  b += '<span class="bdg b-kind">' + esc(h.kind) + '</span>';

  var wait = "";
  if (h.ae && h.type === "public" && w){
    wait = '<div class="wait' + waitLevel(w) + '"><span class="wv">急症室等候 <b>' + esc(w.t45) + '</b></span>' +
      (w.t3 ? '<span class="wv wv2">緊急個案 ' + esc(w.t3) + '</span>' : '') + '<small>次緊急／非緊急，一半病人喺此時間內睇到醫生 · 更新 ' + esc(w.time || waitTime) + '</small></div>';
  }
  var specs = h.specs.length ? '<div class="specs">' + h.specs.map(function(s){ return '<span class="sp' + (s === st.s ? " on" : "") + '">' + esc(s) + '</span>'; }).join("") + '</div>' : "";
  var dist = (st.sort === "near" && here) ? '<span class="dist">' + kmTxt(h) + '</span>' : "";
  var meta = esc(h.region) + ' · ' + esc(h.district) + (h.cluster ? ' · 醫管局' + esc(h.cluster) + '聯網' : '');

  return '<article class="card' + (open ? " open" : "") + '" id="h-' + esc(h.id) + '">' +
    '<div class="c-head"><h2 class="c-name">' + esc(h.name) + '<span class="c-en">' + esc(h.en) + '</span></h2>' + dist + '</div>' +
    '<div class="c-meta">' + meta + '</div>' +
    '<div class="badges">' + b + '</div>' + wait +
    '<div class="c-addr">' + I.pin + '<span>' + esc(h.addr) + '</span></div>' +
    '<div class="more" id="more-' + esc(h.id) + '">' +
      (specs ? '<div class="more-h">主要專科</div>' + specs : '') +
      '<div class="info">' +
        '<div>' + I.tel + '<a href="' + tel(h) + '">' + esc(h.phone) + '</a></div>' +
        (h.opd ? '<div>' + I.clock + '<span>' + esc(h.opd) + '</span></div>' : '') +
        (h.web ? '<div>' + I.web + '<a href="' + esc(h.web) + '" target="_blank" rel="noopener">醫院網站</a></div>' : '') +
      '</div>' +
      (h.note ? '<p class="note">' + esc(h.note) + '</p>' : '') +
      '<div class="acts acts2"><button type="button" class="act" data-map="' + esc(h.id) + '" aria-expanded="false">' + I.map + '顯示地圖</button></div>' +
    '</div>' +
    '<div class="acts">' +
      '<a class="act pri" href="' + tel(h) + '">' + I.tel + '致電</a>' +
      '<a class="act" href="' + gmapLink(h) + '" target="_blank" rel="noopener">' + I.go + '導航</a>' +
      '<button type="button" class="act act-more" data-more="' + esc(h.id) + '" aria-expanded="' + open + '" aria-controls="more-' + esc(h.id) + '">' + (open ? "收起" : "詳細") + '<span class="chev" aria-hidden="true"></span></button>' +
    '</div></article>';
}

/* ---------- 急症室一覽 ---------- */
function erRow(h){
  var w = waitOf(h), pub = h.type === "public";
  var waitHtml = pub
    ? (w ? '<div class="er-wait' + waitLevel(w) + '"><b>' + esc(w.t45) + '</b><span>' + (w.t3 ? "緊急 " + esc(w.t3) : "次緊急／非緊急") + '</span></div>'
         : '<div class="er-wait na"><span>等候時間暫缺</span></div>')
    : '<div class="er-wait na"><span>' + esc(h.opd || "24 小時門診") + '</span></div>';
  return '<div class="er-row">' +
    '<div class="er-main"><b class="er-name">' + esc(h.name) + '</b><span class="er-meta">' + esc(h.region) + ' · ' + esc(h.district) + '</span></div>' +
    '<div class="er-dist">' + (here ? kmTxt(h) : "") + '</div>' + waitHtml +
    '<div class="er-acts"><a class="act pri" href="' + tel(h) + '">' + I.tel + '致電</a><a class="act" href="' + gmapLink(h) + '" target="_blank" rel="noopener">' + I.go + '導航</a></div>' +
  '</div>';
}
function renderEr(){
  var list = H.filter(function(h){ return h.ae && (!st.r || h.region === st.r); });
  if (here) list.forEach(function(h){ h._km = km(here, h); });
  function cmpWait(a, b){
    var wa = waitOf(a), wb = waitOf(b);
    var va = wa && wa.t45n != null ? wa.t45n : Infinity, vb = wb && wb.t45n != null ? wb.t45n : Infinity;
    return va - vb || a.name.localeCompare(b.name, "zh-HK");
  }
  var cmp = st.es === "near" && here ? function(a, b){ return a._km - b._km; } : st.es === "near" ? function(a, b){ return REGIONS.indexOf(a.region) - REGIONS.indexOf(b.region) || a.district.localeCompare(b.district, "zh-HK"); } : cmpWait;
  var pub = list.filter(function(h){ return h.type === "public"; }).sort(cmp);
  // 私家冇等候時間數據：有位置就按距離，冇就按地區
  var pri = list.filter(function(h){ return h.type !== "public"; }).sort(here ? function(a, b){ return a._km - b._km; } : function(a, b){ return REGIONS.indexOf(a.region) - REGIONS.indexOf(b.region) || a.district.localeCompare(b.district, "zh-HK"); });
  var hint = st.es === "near" && !here ? '<p class="er-hint">未取得你嘅位置，暫時按地區排列。撳「按距離」再試，或者喺瀏覽器允許定位。</p>' : '';
  $("erList").innerHTML = hint +
    '<h2 class="er-h">公立醫院急症室 <span>' + pub.length + ' 間 · 24 小時</span></h2>' +
    '<p class="er-legend"><i class="lg ok"></i>1.5 小時內 <i class="lg mid"></i>2–3.5 小時 <i class="lg hi"></i>超過 3.5 小時（次緊急／非緊急，一半病人等候時間）</p>' +
    '<div class="er-box">' + (pub.length ? pub.map(erRow).join("") : '<p class="er-empty">呢個區域冇公立急症室。</p>') + '</div>' +
    '<h2 class="er-h">私家醫院 24 小時門診／急症 <span>' + pri.length + ' 間 · 收費較高，請先致電查詢</span></h2>' +
    '<div class="er-box">' + (pri.length ? pri.map(erRow).join("") : '<p class="er-empty">呢個區域冇私家 24 小時門診。</p>') + '</div>';
}

function summary(n){
  var tags = [];
  if (st.r) tags.push(st.r); if (st.d) tags.push(st.d); if (st.t) tags.push(TYPE_NAME[st.t]);
  if (st.s) tags.push(st.s); if (st.ae) tags.push("24 小時急症"); if (st.sopc) tags.push("專科門診");
  if (st.acute) tags.push("綜合醫院"); if (st.inst) tags.push("包括院舍"); if (st.q) tags.push("「" + st.q + "」");
  var sortTxt = st.sort === "near" ? (here ? "按距離排序" : "按距離排序（未取得位置）") : st.sort === "wait" ? "按急症室等候時間排序" : "按地區排序";
  var hid = st.inst || st.q ? 0 : H.filter(function(h){ return h.inst && match(h, true); }).length;
  var more = hid ? '<span class="hid">另有 ' + hid + ' 間療養／護養院舍已隱藏 <button type="button" class="link-btn" data-inst>顯示</button></span>' : '';
  return '<b>' + n + '</b> 間醫院' + (tags.length ? '　' + tags.map(function(t){ return '<span class="tag">' + esc(t) + '</span>'; }).join("") : '　（全部）') + '　<span>' + sortTxt + '</span>' + more;
}

function render(){
  var list = sortList(H.filter(function(h){ return match(h); }));
  $("summary").innerHTML = summary(list.length);
  $("list").innerHTML = list.length ? list.map(card).join("") :
    '<div class="empty">搵唔到符合條件嘅醫院。<br>試下放寬地區或專科，或者<button type="button" class="link-btn" data-reset>清除篩選</button>。</div>';
}
function renderAll(){ if (st.v === "er") renderEr(); else render(); }
function update(){ writeHash(); syncControls(); renderAll(); }

/* ---------- 地圖 ---------- */
$("list").addEventListener("click", function(e){
  if (e.target.closest("[data-reset]")) { reset(); return; }
  var mb = e.target.closest("[data-more]");
  if (mb){
    var id = mb.getAttribute("data-more"), cc = mb.closest(".card"), op = !cc.classList.contains("open");
    cc.classList.toggle("open", op); if (op) openIds[id] = 1; else delete openIds[id];
    mb.setAttribute("aria-expanded", op); mb.firstChild.textContent = op ? "收起" : "詳細";
    return;
  }
  var btn = e.target.closest("[data-map]"); if (!btn) return;
  var c = btn.closest(".card"), m = c.querySelector(".map");
  if (m){ m.remove(); btn.setAttribute("aria-expanded","false"); btn.lastChild.textContent = "顯示地圖"; return; }
  var h = H.filter(function(x){ return x.id === btn.getAttribute("data-map"); })[0];
  var div = document.createElement("div"); div.className = "map";
  div.innerHTML = '<iframe loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="' + esc(h.name) + '地圖" src="' + gmapEmbed(h) + '"></iframe>';
  c.querySelector(".acts2").before(div);
  btn.setAttribute("aria-expanded","true"); btn.lastChild.textContent = "收起地圖";
});

/* ---------- 位置 ---------- */
function locate(done){
  if (here) { done(true); return; }
  if (!navigator.geolocation) { done(false); return; }
  $(st.v === "er" ? "erList" : "summary").insertAdjacentHTML("afterbegin", '<p class="er-hint" data-loc>正在取得你嘅位置…</p>');
  navigator.geolocation.getCurrentPosition(function(p){
    here = {lat:p.coords.latitude, lng:p.coords.longitude}; done(true);
  }, function(){ done(false); }, {enableHighAccuracy:false, timeout:10000, maximumAge:300000});
}
function useNear(fallback){
  locate(function(ok){
    document.querySelectorAll("[data-loc]").forEach(function(e){ e.remove(); });
    if (st.v === "er"){ update(); return; }
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
      renderAll();
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
$("fInst").addEventListener("change", function(e){ st.inst = e.target.checked; update(); });
$("summary").addEventListener("click", function(e){ if (e.target.closest("[data-inst]")){ st.inst = true; update(); } });
$("fSort").addEventListener("change", function(e){
  st.sort = e.target.value;
  if (st.sort === "near") useNear("area"); else update();
});
function reset(){ var v = st.v; st = blank(); st.v = v; update(); }
$("btnReset").addEventListener("click", reset);
$("btnAe").addEventListener("click", function(){
  st = blank(); st.v = "er"; st.es = "near";
  update(); useNear();
  $("aedInfo").scrollIntoView({behavior:"smooth", block:"start"});
});
$("tabs").addEventListener("click", function(e){
  var b = e.target.closest("button"); if (!b) return;
  st.v = b.getAttribute("data-v");
  if (st.v === "er" && st.es === "near" && !here){ update(); useNear(); } else update();
});
window.addEventListener("hashchange", function(){ readHash(); syncControls(); renderAll(); });

$("checked").textContent = window.DATA_CHECKED || "";
readHash();
if (st.sort === "near") st.sort = "area"; // 打開時唔自動問位置
syncControls(); renderAll(); loadWaits();
if (st.v === "er" && st.es === "near") useNear();
})();
