/* 香港醫院指南 */
(function(){
"use strict";
var H = window.HOSPITALS || [];
var REGIONS = ["港島","九龍","新界","離島"];
var TYPES = [["","全部"],["public","公立"],["private","私家"],["cm","中醫醫院"]];
var TYPE_NAME = {public:"公立",private:"私家",cm:"中醫醫院"};
var KIND_ORDER = ["綜合醫院","專科醫院","專科中心","中醫醫院","復康／療養","紓緩治療","護養院"];
var $ = function(id){ return document.getElementById(id); };

function blank(){ return {v:"list",es:"near",q:"",r:"",d:"",s:"",t:"",ae:false,sopc:false,acute:false,inst:false,fav:false,sort:"area",h:""}; }
var st = blank();
var here = null;      // {lat,lng}
var waits = {};       // 醫院名 → {t3, t45, t45n, time}
var waitTime = "";   // 醫管局原文更新時間
var waitAt = null;    // 解析後嘅 Date
var sop = {}, sopInfo = null;      // 專科門診新症輪候：sop[聯網][專科] = {u,s,st,stMax}
var ops = {}, opsInfo = null;      // 手術輪候：ops.cataract[聯網] = {med,p90,wl}
var gopc = [], gopcInfo = null;    // 普通科（家庭醫學）診所籌額
var surge = {}, surgeInfo = null;  // 服務需求高峰期：surge[醫院名] = {...}
var FAV_KEY = "hkh-fav", fav = {};
try { (JSON.parse(localStorage.getItem(FAV_KEY) || "[]") || []).forEach(function(id){ fav[id] = 1; }); } catch (e) {}
function saveFav(){ try { localStorage.setItem(FAV_KEY, JSON.stringify(Object.keys(fav))); } catch (e) {} }
var INS_URL = "https://hkmedical-insurance.netlify.app/";

/* ---------- 工具 ---------- */
function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
function norm(s){ return String(s || "").replace(/[\s　()（）\-–—．.]/g,"").toLowerCase(); }
function km(a, b){
  var R = 6371, toR = Math.PI/180;
  var dLa = (b.lat-a.lat)*toR, dLo = (b.lng-a.lng)*toR;
  var x = Math.sin(dLa/2)*Math.sin(dLa/2) + Math.cos(a.lat*toR)*Math.cos(b.lat*toR)*Math.sin(dLo/2)*Math.sin(dLo/2);
  return 2*R*Math.asin(Math.sqrt(x));
}
/* 地圖：有官方座標（geo）就用座標（最準），冇就用英文搜尋字（mq）。
   唔用中文地址做搜尋，Google 會讀錯（例如威爾斯親王醫院曾經顯示咗葵芳）。 */
function mapQuery(h){ return h.geo ? h.lat + "," + h.lng : (h.mq || h.en + ", Hong Kong"); }
function gmapLink(h){ return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(mapQuery(h)); }
function dirLink(h){ return "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(mapQuery(h)) + "&travelmode=transit"; }
function gmapEmbed(h){ return "https://maps.google.com/maps?q=" + encodeURIComponent(mapQuery(h)) + "&hl=zh-TW&z=17&output=embed"; }
var I = {
  pin:'<svg viewBox="0 0 24 24"><path d="M12 21s-7-6.1-7-11.5a7 7 0 0 1 14 0C19 14.9 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
  tel:'<svg viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
  web:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
  clock:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  map:'<svg viewBox="0 0 24 24"><path d="m9 4-6 2v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14"/></svg>',
  go:'<svg viewBox="0 0 24 24"><path d="M7 17 17 7M8 7h9v9"/></svg>',
  train:'<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 11h14M9 21l1.5-4M15 21l-1.5-4"/><circle cx="9" cy="14" r=".6"/><circle cx="15" cy="14" r=".6"/></svg>',
  cash:'<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg>',
  route:'<svg viewBox="0 0 24 24"><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5"/></svg>',
  close:'<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  star:'<svg viewBox="0 0 24 24"><path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/></svg>'
};
function mtrTxt(v){ return String(v || ""); }
function favBtn(h){ var on = !!fav[h.id]; return '<button type="button" class="fav' + (on ? " on" : "") + '" data-fav="' + esc(h.id) + '" aria-pressed="' + on + '" aria-label="' + (on ? "取消收藏" : "收藏") + esc(h.name) + '" title="' + (on ? "取消收藏" : "收藏") + '">' + I.star + '</button>'; }

/* ---------- 網址狀態（方便分享篩選結果） ---------- */
function readHash(){
  var p = new URLSearchParams(location.hash.replace(/^#/,""));
  st.q = p.get("q") || ""; st.r = p.get("r") || ""; st.d = p.get("d") || "";
  st.s = p.get("s") || ""; st.t = p.get("t") || "";
  st.ae = p.get("ae") === "1"; st.sopc = p.get("sopc") === "1"; st.acute = p.get("acute") === "1"; st.inst = p.get("inst") === "1";
  st.sort = p.get("sort") || "area";
  st.v = p.get("v") === "er" ? "er" : "list";
  st.es = p.get("es") === "wait" ? "wait" : "near";
  st.h = p.get("h") || "";
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
  if (st.h) p.set("h", st.h);
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
  $("fAe").checked = st.ae; $("fSopc").checked = st.sopc; $("fAcute").checked = st.acute; $("fInst").checked = st.inst; $("fFav").checked = st.fav;
  $("favN").textContent = Object.keys(fav).length ? "（" + Object.keys(fav).length + "）" : "";
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
  if (st.fav && !fav[h.id]) return false;
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
function badgesOf(h, w){
  var typeCls = h.type === "public" ? "b-pub" : h.type === "private" ? "b-pri" : "b-cm";
  var b = (w && w.rescue ? '<span class="bdg b-rescue">多名病人正在搶救中</span>' : '') + '<span class="bdg ' + typeCls + '">' + TYPE_NAME[h.type] + '</span>';
  if (h.ae) b += '<span class="bdg b-ae">' + (h.type === "public" ? "急症室 24 小時" : "24 小時門診／急症") + '</span>';
  if (h.sopc) b += '<span class="bdg b-sopc">' + (h.type === "public" ? "專科門診（需轉介）" : "專科門診") + '</span>';
  if (st.s && h.specs.indexOf(st.s) >= 0) b += '<span class="bdg b-hit">' + esc(st.s) + '</span>';
  return b + '<span class="bdg b-kind">' + esc(h.kind) + '</span>';
}
function waitBox(h, w){
  if (!(h.ae && h.type === "public" && w)) return "";
  return '<div class="wait' + waitLevel(w) + '"><span class="wv">急症室等候 <b>' + esc(w.t45) + '</b></span>' +
    (w.t3 ? '<span class="wv wv2">緊急個案 ' + esc(w.t3) + '</span>' : '') + '<small>次緊急／非緊急，一半病人喺此時間內睇到醫生 · <span class="w-age">' + ageText() + '</span></small></div>';
}
function metaOf(h){ return esc(h.region) + ' · ' + esc(h.district) + (h.cluster ? ' · 醫管局' + esc(h.cluster) + '聯網' : ''); }
function card(h){
  var w = waitOf(h), sg = surgeOf(h);
  var dist = (st.sort === "near" && here) ? '<span class="dist">' + kmTxt(h) + '</span>' : "";
  var sopHit = st.s && h.type === "public" && h.sopc ? sopLine(h, st.s) : "";
  return '<article class="card" id="h-' + esc(h.id) + '">' +
    '<div class="c-head"><h2 class="c-name"><button type="button" class="c-open" data-open="' + esc(h.id) + '">' + esc(h.name) + '</button><span class="c-en">' + esc(h.en) + '</span></h2><div class="c-side">' + dist + favBtn(h) + '</div></div>' +
    '<div class="c-meta">' + metaOf(h) + '</div>' +
    '<div class="badges">' + badgesOf(h, w) + '</div>' + waitBox(h, w) + (sg ? '<p class="surge-l">' + sg + '</p>' : '') +
    (sopHit ? '<p class="sop-hit">' + sopHit + '</p>' : '') +
    '<div class="c-addr">' + I.pin + '<span>' + esc(h.addr) + '</span></div>' +
    (h.mtr ? '<div class="c-addr c-mtr">' + I.train + '<span>' + esc(mtrTxt(h.mtr)) + '</span></div>' : '') +
    '<div class="acts">' +
      '<a class="act pri" href="' + tel(h) + '">' + I.tel + '致電</a>' +
      '<a class="act" href="' + dirLink(h) + '" target="_blank" rel="noopener" title="用 Google 地圖由你而家位置計公共交通路線">' + I.route + '路線</a>' +
      '<button type="button" class="act act-more" data-open="' + esc(h.id) + '" aria-haspopup="dialog">詳細</button>' +
    '</div></article>';
}

/* ---------- 詳細：彈出視窗 ---------- */
function detailHtml(h){
  var w = waitOf(h), sg = surgeOf(h);
  var specs = h.specs.length ? '<div class="specs">' + h.specs.map(function(s){ return '<span class="sp' + (s === st.s ? " on" : "") + '">' + esc(s) + '</span>'; }).join("") + '</div>' : "";
  return '<div class="d-head"><div class="d-title"><h2 id="dTitle">' + esc(h.name) + '</h2><span class="c-en">' + esc(h.en) + '</span><div class="c-meta">' + metaOf(h) + '</div></div>' +
      '<div class="d-tools">' + favBtn(h) + '<button type="button" class="d-close" data-close aria-label="關閉">' + I.close + '</button></div></div>' +
    '<div class="d-body">' +
      '<div class="badges">' + badgesOf(h, w) + '</div>' + waitBox(h, w) + (sg ? '<p class="surge-l">' + sg + '</p>' : '') +
      '<div class="d-acts">' +
        '<a class="act pri" href="' + tel(h) + '">' + I.tel + '致電 ' + esc(h.phone) + '</a>' +
        '<a class="act" href="' + dirLink(h) + '" target="_blank" rel="noopener">' + I.route + '由我位置去（公共交通）</a>' +
        (h.web ? '<a class="act" href="' + esc(h.web) + '" target="_blank" rel="noopener">' + I.web + '醫院網站</a>' : '') +
      '</div>' +
      '<div class="d-grid">' +
        '<div class="d-col">' +
          '<div class="info">' +
            '<div>' + I.pin + '<span>' + esc(h.addr) + '</span></div>' +
            (h.mtr ? '<div class="c-mtr">' + I.train + '<span>' + esc(mtrTxt(h.mtr)) + '<small class="fee-n">醫院公佈嘅交通資料；實際路線可撳「由我位置去」</small></span></div>' : '') +
            (h.opd ? '<div>' + I.clock + '<span>' + esc(h.opd) + '</span></div>' : '') +
            (h.fee ? '<div>' + I.cash + '<span>門診／急症診金：' + esc(h.fee) + '<small class="fee-n">唔包藥物、檢查及治療；資料：' + esc(window.FEE_CHECKED || "") + '，以醫院公佈為準</small></span></div>' : '') +
          '</div>' +
          (specs ? '<div class="more-h">主要專科</div>' + specs : '') +
          (h.note ? '<p class="note">' + esc(h.note) + '</p>' : '') +
          waitBlock(h) +
          (h.type === "private" ? '<p class="ins-link">睇私家醫院，醫保包唔包？<a href="' + INS_URL + '" target="_blank" rel="noopener">用「醫保對照」比較自願醫保 ↗</a></p>' : '') +
        '</div>' +
        '<div class="d-col d-mapcol"><div class="map"><iframe loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="' + esc(h.name) + '地圖" src="' + gmapEmbed(h) + '"></iframe></div></div>' +
      '</div>' +
    '</div>';
}
var dlg = null, dlgId = "", dlgPushed = false;
function hospById(id){ for (var i = 0; i < H.length; i++) if (H[i].id === id) return H[i]; return null; }
function showDetail(id, push){
  var h = hospById(id); if (!h) return;
  dlg = dlg || $("hDlg");
  var same = dlgId === id && dlg.open;
  dlgId = id;
  if (!same) dlg.innerHTML = detailHtml(h);
  if (!dlg.open){
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
    document.body.classList.add("dlg-open");
    dlg.scrollTop = 0;
  }
  if (push){ st.h = id; var u = new URLSearchParams(location.hash.replace(/^#/,"")); u.set("h", id); history.pushState(null, "", "#" + u.toString()); dlgPushed = true; }
}
function refreshDetail(){   // 數據更新後，開住嘅視窗只更新文字部分，唔重載地圖
  if (!dlg || !dlg.open || !dlgId) return;
  var h = hospById(dlgId), body = dlg.querySelector(".d-col"); if (!h || !body) return;
  var tmp = document.createElement("div"); tmp.innerHTML = detailHtml(h);
  dlg.querySelector(".badges").outerHTML = tmp.querySelector(".badges").outerHTML;
  var ow = dlg.querySelector(".d-body > .wait"), nw = tmp.querySelector(".d-body > .wait");
  if (ow && nw) ow.outerHTML = nw.outerHTML; else if (!ow && nw) dlg.querySelector(".d-body .badges").insertAdjacentHTML("afterend", nw.outerHTML);
  body.innerHTML = tmp.querySelector(".d-col").innerHTML;
}
function hideDetail(fromHistory){
  if (!dlg || !dlg.open) return;
  if (dlg.close) dlg.close(); else dlg.removeAttribute("open");
}
function closeRequested(){
  if (dlgPushed){ dlgPushed = false; history.back(); return; }   // 返回上一頁會觸發 hashchange 再關
  st.h = ""; writeHash(); hideDetail();
}

/* ---------- 急症室一覽 ---------- */
function erRow(h){
  var w = waitOf(h), pub = h.type === "public";
  var waitHtml = pub
    ? (w ? '<div class="er-wait' + waitLevel(w) + '"><b>' + esc(w.t45) + '</b><span>' + (w.t3 ? "緊急 " + esc(w.t3) : "次緊急／非緊急") + '</span></div>'
         : '<div class="er-wait na"><span>等候時間暫缺</span></div>')
    : '<div class="er-wait na"><span>' + esc(h.opd || "24 小時門診") + (h.fee ? '<br><b class="er-fee">' + esc(h.fee) + '</b>' : '') + '</span></div>';
  var sg = surgeOf(h, true);
  return '<div class="er-row' + (fav[h.id] ? " is-fav" : "") + '">' +
    '<div class="er-main"><button type="button" class="er-name" data-open="' + esc(h.id) + '">' + esc(h.name) + '</button><span class="er-meta">' + esc(h.region) + ' · ' + esc(h.district) +
      (sg ? ' · ' + sg : '') + '</span>' +
      (w && w.rescue ? '<span class="bdg b-rescue">多名病人正在搶救中</span>' : '') + '</div>' +
    '<div class="er-dist">' + (here ? kmTxt(h) : "") + '</div>' + waitHtml +
    '<div class="er-acts"><a class="act pri" href="' + tel(h) + '">' + I.tel + '致電</a><a class="act" href="' + dirLink(h) + '" target="_blank" rel="noopener" title="用 Google 地圖由你而家位置計公共交通路線">' + I.route + '路線</a>' + favBtn(h) + '</div>' +
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
  var hint = st.es === "near" && !here ? '<p class="er-hint">未取得你嘅位置，暫時按地區排列。撳「按距離」再試，或者喺瀏覽器允許定位。</p>' : (st.es === "near" ? accHint() : '');
  $("erList").innerHTML = hint + guideHtml() + surgeBanner() +
    '<h2 class="er-h">公立醫院急症室 <span>' + pub.length + ' 間 · 24 小時</span></h2>' +
    '<p class="er-legend"><i class="lg ok"></i>1.5 小時內 <i class="lg mid"></i>2–3.5 小時 <i class="lg hi"></i>超過 3.5 小時（次緊急／非緊急，一半病人等候時間）</p>' +
    '<div class="er-box">' + (pub.length ? pub.map(erRow).join("") : '<p class="er-empty">呢個區域冇公立急症室。</p>') + '</div>' +
    '<h2 class="er-h">私家醫院 24 小時門診／急症 <span>' + pri.length + ' 間 · 收費較高，請先致電查詢</span></h2>' +
    '<div class="er-box">' + (pri.length ? pri.map(erRow).join("") : '<p class="er-empty">呢個區域冇私家 24 小時門診。</p>') + '</div>' +
    '<p class="er-note">私家診金唔包藥物、檢查及治療，資料：' + esc(window.FEE_CHECKED || "") + '，以醫院公佈為準。睇私家醫院，醫保包唔包？<a href="' + INS_URL + '" target="_blank" rel="noopener">用「醫保對照」比較 ↗</a></p>' +
    gopcHtml();
}

/* ---------- 「我應該去急症室嗎？」 ---------- */
function guideHtml(){
  return '<details class="guide" id="guide"' + (guideOpen ? " open" : "") + '><summary><b>我應該去急症室嗎？</b><span>分流級別、收費同其他選擇</span></summary>' +
    '<div class="guide-body">' +
    '<p>急症室按<b>病情緩急</b>而唔係先到先得睇症。護士會先評估，分做五級：</p>' +
    '<ol class="triage">' +
      '<li class="t1"><b>第 I 類 危殆</b><span>例如心跳停頓、昏迷、嚴重創傷、休克。<b>即刻打 999</b>，會即時處理。</span></li>' +
      '<li class="t2"><b>第 II 類 危急</b><span>例如嚴重胸痛、呼吸非常困難、中風徵狀（面歪、手腳無力、口齒不清）、大量出血。應盡快召救護車。</span></li>' +
      '<li class="t3"><b>第 III 類 緊急</b><span>例如骨折、劇烈痛楚、持續嘔吐或腹痛。</span></li>' +
      '<li class="t4"><b>第 IV、V 類 次緊急／非緊急</b><span>例如傷風感冒、輕微損傷、長期病拎藥。輪候時間最長，<b>可以考慮普通科門診或私家診所</b>（見本頁下面）。</span></li>' +
    '</ol>' +
    '<p class="guide-h">公立醫院收費（合資格人士，2026 年 1 月 1 日起）</p>' +
    '<ul class="fees">' +
      '<li>急症室：第 I、II 類<b>免費</b>，其他每次 <b>$400</b></li>' +
      '<li>普通科（家庭醫學）門診：每次 <b>$150</b></li>' +
      '<li>專科門診：每次 <b>$250</b></li>' +
      '<li>全年公營醫療收費設 <b>$10,000</b> 上限；有經濟困難可以申請醫療費用減免</li>' +
    '</ul>' +
    '<p class="guide-n">以上只係一般參考，唔係醫療建議；有懷疑就應該求醫。收費以醫管局公佈為準。</p>' +
    '</div></details>';
}
var guideOpen = false;
document.addEventListener("toggle", function(e){ if (e.target && e.target.id === "guide") guideOpen = e.target.open; }, true);

/* ---------- 專科門診新症輪候 ---------- */
var SOP_SPEC = {"婦科":"婦產科"};
function clusterKey(c){ return String(c || "").replace(/醫院聯網$/,""); }
function sopLine(h, spec, full){
  var d = sop[h.cluster] && sop[h.cluster][spec]; if (!d) return "";
  var t = esc(h.cluster) + '聯網' + esc(spec) + '新症輪候：穩定 <b>' + esc(d.st) + '</b>';
  if (full) t = esc(spec) + '：穩定 <b>' + esc(d.st) + '</b>';
  if (full) return t + '<span> · 半緊急 ' + esc(d.s) + ' · 緊急 ' + esc(d.u) + '</span>';
  return t + '<span>（半緊急 ' + esc(d.s) + '、緊急 ' + esc(d.u) + (d.stMax ? '；穩定最長 ' + esc(d.stMax) : '') + '）</span>';
}
function waitBlock(h){
  if (h.type !== "public" || !h.cluster) return "";
  var rows = [];
  if (h.sopc && sop[h.cluster]) h.specs.forEach(function(sp){ var l = sopLine(h, sp, true); if (l) rows.push('<li>' + l + '</li>'); });
  var surg = [];
  [["cataract","白內障手術","眼科"],["joint","全關節置換手術","骨科"]].forEach(function(x){
    var d = ops[x[0]] && ops[x[0]][h.cluster];
    if (d && h.specs.indexOf(x[2]) >= 0 && h.kind === "綜合醫院") surg.push('<li>' + x[1] + '：中位數 <b>' + d.med + ' 個月</b><span>（九成病人喺 ' + d.p90 + ' 個月內做完；聯網輪候中 ' + d.wl.toLocaleString("en") + ' 人）</span></li>');
  });
  if (!rows.length && !surg.length) return "";
  return '<div class="waits">' +
    (rows.length ? '<div class="more-h">專科門診新症輪候（' + esc(h.cluster) + '聯網，中位數）</div><ul>' + rows.join("") + '</ul>' +
      '<p class="waits-n">醫管局 ' + esc(sopInfo.period) + ' 數字，每季更新（下次：' + esc(sopInfo.next) + '）。穩定新症一般要喺住址所屬聯網排期。</p>' : '') +
    (surg.length ? '<div class="more-h">手術輪候（' + esc(h.cluster) + '聯網）</div><ul>' + surg.join("") + '</ul>' +
      '<p class="waits-n">醫管局 ' + esc(opsInfo.period) + ' 已完成手術嘅輪候時間，每季更新。</p>' : '') +
    '</div>';
}

/* ---------- 服務需求高峰期 ---------- */
var SURGE_ALIAS = {"律敦治及鄧肇堅醫院":"律敦治醫院"};
function surgeFresh(){
  if (!surgeInfo) return false;
  var d = new Date(surgeInfo.date + "T00:00:00+08:00");
  return Date.now() - d.getTime() < 3 * 86400000;   // 最近三日內嘅數據先顯示（高峰期過咗醫管局唔會更新）
}
function surgeOf(h, short){
  if (!surgeFresh() || h.type !== "public") return "";
  var x = surge[h.aeName || h.name] || surge[h.name]; if (!x || x.med == null) return "";
  var cls = x.med >= 110 ? " hi" : x.med >= 100 ? " mid" : "";
  return '<span class="occ' + cls + '">內科病床使用率 ' + x.med + '%</span>' + (short ? '' : '<span class="occ-n">（' + esc(surgeInfo.dateTxt) + '）</span>');
}
function surgeBanner(){
  if (!surgeFresh()) return "";
  var t = surge["醫院管理局公立急症醫院"]; if (!t) return "";
  return '<div class="surge"><b>醫管局服務需求高峰期</b><span>' + esc(surgeInfo.dateTxt) + '：全港公立急症室首次求診 <b>' + (t.ae || 0).toLocaleString("en") + '</b> 人次，' +
    '內科病床使用率 <b>' + t.med + '%</b>' + (t.ped != null ? '、兒科 <b>' + t.ped + '%</b>' : '') + '。急症室可能特別擠迫，非緊急情況可以考慮普通科門診或私家診所。</span></div>';
}

/* ---------- 普通科（家庭醫學）門診 ---------- */
var DIST_REGION = {"中西區":"港島","灣仔區":"港島","東區":"港島","南區":"港島","油尖旺區":"九龍","深水埗區":"九龍","九龍城區":"九龍","黃大仙區":"九龍","觀塘區":"九龍",
  "荃灣區":"新界","屯門區":"新界","元朗區":"新界","北區":"新界","大埔區":"新界","沙田區":"新界","西貢區":"新界","葵青區":"新界","離島區":"離島"};
var WD = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"], WD_TC = ["日","一","二","三","四","五","六"];
var gopcOpen = {};
function gopcHtml(){
  if (!gopc.length) return "";
  var wd = new Date(new Date().toLocaleString("en-US", {timeZone:"Asia/Hong_Kong"})).getDay();
  var by = {}, order = [];
  gopc.forEach(function(c){
    var reg = DIST_REGION[c.d] || "";
    if (st.r && reg !== st.r) return;
    if (!by[c.d]){ by[c.d] = []; order.push(c.d); }
    by[c.d].push(c);
  });
  order.sort(function(a, b){ return REGIONS.indexOf(DIST_REGION[a]) - REGIONS.indexOf(DIST_REGION[b]) || a.localeCompare(b, "zh-HK"); });
  var html = order.map(function(d){
    var rows = by[d].map(function(c){
      var q = c.q[WD[wd]], n = parseFloat(q);
      var qTxt = isNaN(n) ? (q || "—") : "約 " + Math.round(n) + " 個";
      return '<li><div class="gp-main"><b>' + esc(c.n) + '</b><span>' + esc(c.s) + '</span></div>' +
        '<div class="gp-q' + (isNaN(n) ? " na" : "") + '"><small>星期' + WD_TC[wd] + '平均籌額</small>' + esc(qTxt) + '</div>' +
        '<a class="act" href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(c.n) + '" target="_blank" rel="noopener">' + I.go + '地圖</a></li>';
    }).join("");
    return '<details class="gp-d" data-gd="' + esc(d) + '"' + (gopcOpen[d] ? " open" : "") + '><summary>' + esc(d) + '<span>' + by[d].length + ' 間</span></summary><ul class="gp-list">' + rows + '</ul></details>';
  }).join("");
  return '<h2 class="er-h" id="gopc">唔係急症？普通科（家庭醫學）門診 <span>醫管局 · 每次 $150</span></h2>' +
    '<div class="gp-intro"><p>傷風感冒、發燒、輕微不適，可以預約公立普通科門診，通常唔使喺急症室等幾個鐘。用 <b>HA Go</b> 手機程式或各區電話預約系統預約；部分診所夜晚、星期日及公眾假期都有應診。</p>' +
    '<p class="waits-n">籌額係醫管局公佈過去 4 星期（' + esc(gopcInfo.period) + '）每日平均數，每星期一更新，唔代表而家仲有冇籌。</p></div>' +
    (html || '<p class="er-empty">呢個區域冇資料。</p>');
}

function summary(n){
  var tags = [];
  if (st.r) tags.push(st.r); if (st.d) tags.push(st.d); if (st.t) tags.push(TYPE_NAME[st.t]);
  if (st.s) tags.push(st.s); if (st.ae) tags.push("24 小時急症"); if (st.sopc) tags.push("專科門診");
  if (st.acute) tags.push("綜合醫院"); if (st.inst) tags.push("包括院舍"); if (st.fav) tags.push("我嘅收藏"); if (st.q) tags.push("「" + st.q + "」");
  var sortTxt = st.sort === "near" ? (here ? "按距離排序" : "按距離排序（未取得位置）") : st.sort === "wait" ? "按急症室等候時間排序" : "按地區排序";
  var hid = st.inst || st.q || st.fav ? 0 : H.filter(function(h){ return h.inst && match(h, true); }).length;
  var more = hid ? '<span class="hid">另有 ' + hid + ' 間療養／護養院舍已隱藏 <button type="button" class="link-btn" data-inst>顯示</button></span>' : '';
  return '<b>' + n + '</b> 間醫院' + (tags.length ? '　' + tags.map(function(t){ return '<span class="tag">' + esc(t) + '</span>'; }).join("") : '　（全部）') + '　<span>' + sortTxt + '</span>' + more;
}

function render(){
  var list = sortList(H.filter(function(h){ return match(h); }));
  $("summary").innerHTML = summary(list.length) + (st.sort === "near" ? accHint() : "");
  $("list").innerHTML = list.length ? list.map(card).join("") :
    (st.fav && !Object.keys(fav).length
      ? '<div class="empty">你未收藏任何醫院。<br>喺醫院卡片右上角撳星號 ☆ 就可以收藏，下次喺呢度一撳就搵到。</div>'
      : '<div class="empty">搵唔到符合條件嘅醫院。<br>試下放寬地區或專科，或者<button type="button" class="link-btn" data-reset>清除篩選</button>。</div>');
}
function renderAll(){ if (st.v === "er") renderEr(); else render(); refreshDetail(); }
function update(){ writeHash(); syncControls(); renderAll(); }

/* ---------- 開詳細 ---------- */
document.addEventListener("click", function(e){
  var o = e.target.closest("[data-open]");
  if (o){ e.preventDefault(); showDetail(o.getAttribute("data-open"), true); return; }
  if (e.target.closest("[data-close]")){ closeRequested(); return; }
  if (e.target === dlg){ closeRequested(); return; }   // 撳視窗外面（背景）
});
$("list").addEventListener("click", function(e){ if (e.target.closest("[data-reset]")) reset(); });
$("hDlg").addEventListener("cancel", function(e){ e.preventDefault(); closeRequested(); });   // Esc
// 列印：開咗醫院詳細就只印嗰間（視窗喺最上層，直接印會疊住頁尾）
window.addEventListener("beforeprint", function(){ $("printDetail").innerHTML = dlg && dlg.open ? dlg.innerHTML.replace(/<iframe[^>]*><\/iframe>/g, "") : ""; });
window.addEventListener("afterprint", function(){ $("printDetail").innerHTML = ""; });
$("hDlg").addEventListener("close", function(){ document.body.classList.remove("dlg-open"); dlgId = ""; });

/* ---------- 位置 ---------- */
/* 部機回報嘅位置誤差（米）。手機有 GPS 通常幾十米；電腦、Wi-Fi 版 iPad 靠 Wi-Fi 或 IP 估，可以差幾公里 */
var ACC_WARN = 1000;
function accText(m){ return m >= 1000 ? "約 " + (m >= 10000 ? Math.round(m / 1000) : (m / 1000).toFixed(1)) + " 公里" : "約 " + Math.round(m) + " 米"; }
function accHint(){
  if (!here || !(here.acc > ACC_WARN)) return "";
  return '<p class="er-hint acc-hint"><b>位置可能唔準：</b>你部機估嘅位置誤差' + accText(here.acc) + '，距離只供參考。電腦同只有 Wi-Fi 嘅 iPad 冇 GPS，可以' +
    (st.v === "er" ? '用上面嘅掣揀返你所在區域' : '用「區域」或「地區」篩選') + '，或者用手機開呢頁。撳「路線」之後，亦可以喺 Google 地圖改起點。</p>';
}
function locate(done){
  if (here) { done(true); return; }
  if (!navigator.geolocation) { done(false); return; }
  $(st.v === "er" ? "erList" : "summary").insertAdjacentHTML("afterbegin", '<p class="er-hint" data-loc>正在取得你嘅位置…</p>');
  navigator.geolocation.getCurrentPosition(function(p){
    here = {lat:p.coords.latitude, lng:p.coords.longitude, acc:p.coords.accuracy}; done(true);
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
/* 解析醫管局更新時間：「2026年10月31日 下午12時30分」或「31/10/2026 12:30 PM」 */
function parseHaTime(t){
  var m = String(t || "").match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日\s*(上午|下午|中午)?\s*(\d{1,2})\s*[時:：]\s*(\d{1,2})/);
  var y, mo, d, ap, h, mi;
  if (m){ y=+m[1]; mo=+m[2]; d=+m[3]; ap=m[4]||""; h=+m[5]; mi=+m[6]; if (ap === "下午" && h < 12) h += 12; if (ap === "上午" && h === 12) h = 0; }
  else {
    m = String(t || "").match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM|上午|下午)?/i);
    if (!m) return null;
    d=+m[1]; mo=+m[2]; y=+m[3]; h=+m[4]; mi=+m[5]; ap=(m[6]||"").toUpperCase();
    if ((ap === "PM" || ap === "下午") && h < 12) h += 12; if ((ap === "AM" || ap === "上午") && h === 12) h = 0;
  }
  // 醫管局時間係香港時間（UTC+8），唔理用家部機設乜時區
  return new Date(Date.UTC(y, mo - 1, d, h - 8, mi));
}
function ageMin(){ return waitAt ? Math.max(0, Math.round((Date.now() - waitAt.getTime()) / 60000)) : null; }
function ageText(){
  var a = ageMin();
  if (a == null) return waitTime ? "更新 " + esc(waitTime) : "";
  var hhmm = new Intl.DateTimeFormat("zh-HK", {timeZone:"Asia/Hong_Kong", hour:"numeric", minute:"2-digit", hour12:true}).format(waitAt);
  return (a < 1 ? "啱啱更新" : a < 60 ? "約 " + a + " 分鐘前更新" : "約 " + Math.floor(a/60) + " 小時" + (a % 60 ? " " + (a % 60) + " 分鐘" : "") + "前更新") + "（" + hhmm + "）";
}
function paintInfo(){
  var el = $("aedInfo");
  if (!waitTime){ return; }
  var a = ageMin(), stale = a != null && a > 45;
  el.classList.toggle("stale", stale);
  el.innerHTML = '急症室等候時間：醫管局即時數據，<b class="w-age">' + ageText() + '</b>。' +
    (stale ? '醫管局數據好似暫時冇更新，請以 HA Go 或醫院現場資訊為準。' : '頁面開住會每 5 分鐘自動更新。') +
    '只供參考；急症室按病情緩急次序診症，危急病人會優先處理。';
}
function tickAge(){
  paintInfo();
  document.querySelectorAll(".w-age").forEach(function(e){ e.textContent = ageText(); });
}
var lastLoad = 0, loading = false;
function loadWaits(){
  if (loading) return; loading = true; lastLoad = Date.now();
  fetch("/.netlify/functions/aed", {cache:"no-store"}).then(function(r){ if (!r.ok) throw 0; return r.json(); }).then(function(j){
    var arr = Array.isArray(j) ? j : (j.waitTime || j.waitingTime || Object.keys(j).map(function(k){ return j[k]; }).filter(Array.isArray)[0] || []);
    var t = j.updateTime || (arr[0] && arr[0].updateTime) || "";
    if (!arr.length) throw 0;
    var changed = t !== waitTime;
    waits = {};
    arr.forEach(function(x){
      if (!x || !x.hospName) return;
      var t45 = x.t45p50 != null ? x.t45p50 : x.topWait;
      waits[norm(x.hospName)] = { t3: fmt(x.t3p50, "分鐘"), t45: fmt(t45, "小時"), t45n: toHours(t45), time: x.updateTime || t,
        rescue: /搶救|resuscitation/i.test(String(x.t1wt || "") + String(x.t2wt || "")) };
    });
    waitTime = t; waitAt = parseHaTime(t);
    paintInfo();
    if (changed) renderAll(); else tickAge();   // 數據冇變就只更新「幾多分鐘前」，唔重畫（唔會跳位）
  }).catch(function(){
    if (waitTime){ tickAge(); return; }   // 之前讀到過就保留舊數據
    $("aedInfo").innerHTML = '暫時未能載入急症室即時等候時間，可用醫管局「HA Go」或<a href="https://www.ha.org.hk/" target="_blank" rel="noopener">醫管局網站</a>查看。';
  }).then(function(){ loading = false; });
}
function fmtDate(v){ var m = String(v || "").match(/(\d{4})-?(\d{2})-?(\d{2})/); return m ? m[1] + " 年 " + (+m[2]) + " 月 " + (+m[3]) + " 日" : ""; }
function getJson(src){ return fetch("/.netlify/functions/aed?src=" + src).then(function(r){ if (!r.ok) throw 0; return r.json(); }); }
function loadExtra(){
  getJson("sopc").then(function(arr){
    var out = {}, next = "", from = "", to = "";
    arr.forEach(function(x){
      if (/下次更新/.test(x.Category)){ next = x.Value; return; }
      var c = clusterKey(x.cluster), sp = SOP_SPEC[x.specialty] || x.specialty;
      if (c === "醫管局合計") return;
      from = x.date_id_from; to = x.date_id_to;
      var o = (out[c] = out[c] || {}); o = (o[sp] = o[sp] || {});
      var v = String(x.Value || "").replace(/\s+/g, " ");
      if (x.Category === "緊急新症 - 中位數") o.u = v;
      else if (x.Category === "半緊急新症 - 中位數") o.s = v;
      else if (x.Category === "穩定新症 - 中位數") o.st = v;
      else if (x.Category === "穩定新症 - 最長") o.stMax = v;
    });
    Object.keys(out).forEach(function(c){ Object.keys(out[c]).forEach(function(sp){ if (!out[c][sp].st) delete out[c][sp]; }); });
    sop = out; sopInfo = { next: next || "下季", period: fmtDate(from) + " 至 " + fmtDate(to) };
    renderAll();
  }).catch(function(){});
  Promise.all([getJson("cataract"), getJson("joint")]).then(function(r){
    var period = "";
    [["cataract", r[0], "cataract"], ["joint", r[1], "totalJointReplacement"]].forEach(function(x){
      var j = x[1], o = {}, wl = {};
      (j[x[2] + "BookingInWaitlist"] || []).forEach(function(y){ wl[clusterKey(y.cluster)] = y.bookingWL; });
      (j[x[2] + "SurgeryPerformed"] || []).forEach(function(y){
        var c = clusterKey(y.cluster); period = fmtDate(y.periodFrom) + " 至 " + fmtDate(y.periodTo);
        o[c] = { med: y.medianWT, p90: y["90PctlWT"], wl: wl[c] || 0 };
      });
      ops[x[0]] = o;
    });
    opsInfo = { period: period }; renderAll();
  }).catch(function(){});
  getJson("gopc").then(function(arr){
    var p = arr[0] && arr[0].Period;
    gopc = arr.filter(function(x){ return x && x.Clinic; }).map(function(x){
      return { d: x.District, n: x.Clinic, s: x["Doctor Consultation Sessions"] || "",
        q: {Sunday:x.Sunday, Monday:x.Monday, Tuesday:x.Tuesday, Wednesday:x.Wednesday, Thursday:x.Thursday, Friday:x.Friday, Saturday:x.Saturday} };
    });
    gopcInfo = { period: p ? fmtDate(p.from) + " 至 " + fmtDate(p.to) : "" };
    if (st.v === "er") renderEr();
  }).catch(function(){});
  loadSurge();
}
function loadSurge(){
  getJson("surge").then(function(arr){
    var o = {}, date = "";
    arr.forEach(function(x){ date = x.date; o[SURGE_ALIAS[x.hospital] || x.hospital] = { ae: x.ae_first_attend, med: x.med_bed_occ_rate, ped: x.ped_bed_occ_rate }; });
    var was = surgeFresh();
    surge = o; surgeInfo = date ? { date: date, dateTxt: fmtDate(date) } : null;
    if (was || surgeFresh()) renderAll();
  }).catch(function(){});
}
setInterval(function(){ if (!document.hidden) loadSurge(); }, 60 * 60 * 1000);

var REFRESH = 5 * 60 * 1000;
setInterval(function(){ if (!document.hidden) loadWaits(); }, REFRESH);
setInterval(tickAge, 30 * 1000);
// 手機鎖咗屏／轉咗 app 再返嚟：超過 5 分鐘就即刻更新
document.addEventListener("visibilitychange", function(){ if (!document.hidden){ tickAge(); if (Date.now() - lastLoad > REFRESH) loadWaits(); } });

/* ---------- 綁定 ---------- */
var qTimer;
$("q").addEventListener("input", function(e){ clearTimeout(qTimer); qTimer = setTimeout(function(){ st.q = e.target.value.trim(); writeHash(); render(); }, 150); });
$("fDistrict").addEventListener("change", function(e){ st.d = e.target.value; update(); });
$("fSpec").addEventListener("change", function(e){ st.s = e.target.value; update(); });
$("fAe").addEventListener("change", function(e){ st.ae = e.target.checked; update(); });
$("fSopc").addEventListener("change", function(e){ st.sopc = e.target.checked; update(); });
$("fAcute").addEventListener("change", function(e){ st.acute = e.target.checked; update(); });
$("fInst").addEventListener("change", function(e){ st.inst = e.target.checked; update(); });
$("fFav").addEventListener("change", function(e){ st.fav = e.target.checked; update(); });
document.addEventListener("click", function(e){
  var f = e.target.closest("[data-fav]"); if (!f) return;
  var id = f.getAttribute("data-fav");
  if (fav[id]) delete fav[id]; else fav[id] = 1;
  saveFav();
  var on = !!fav[id];
  document.querySelectorAll('[data-fav="' + id + '"]').forEach(function(b){ b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); b.title = on ? "取消收藏" : "收藏"; });
  $("favN").textContent = Object.keys(fav).length ? "（" + Object.keys(fav).length + "）" : "";
  if (st.fav && st.v === "list") render();
  if (st.v === "er") renderEr();
});
$("erList").addEventListener("toggle", function(e){ var d = e.target.getAttribute && e.target.getAttribute("data-gd"); if (d){ if (e.target.open) gopcOpen[d] = 1; else delete gopcOpen[d]; } }, true);
$("summary").addEventListener("click", function(e){ if (e.target.closest("[data-inst]")){ st.inst = true; update(); } });
$("fSort").addEventListener("change", function(e){
  st.sort = e.target.value;
  if (st.sort === "near") useNear("area"); else update();
});
function reset(){ var v = st.v, hh = st.h; st = blank(); st.v = v; st.h = hh; update(); }
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
function syncDetail(){ if (st.h && hospById(st.h)) showDetail(st.h, false); else { dlgPushed = false; hideDetail(); } }
window.addEventListener("hashchange", function(){ readHash(); syncControls(); renderAll(); syncDetail(); });
window.addEventListener("popstate", function(){ readHash(); syncDetail(); });

$("checked").textContent = window.DATA_CHECKED || "";
readHash();
if (st.sort === "near") st.sort = "area"; // 打開時唔自動問位置
syncControls(); renderAll(); loadWaits(); loadExtra(); syncDetail();
if (st.v === "er" && st.es === "near") useNear();
})();
