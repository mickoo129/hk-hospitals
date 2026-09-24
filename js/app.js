(function(){
const SPEC_CHIPS=["內科","外科","骨科","兒科","婦科","眼科","耳鼻喉科","精神科","急症科","復康","腫瘤科","家庭醫學"];
const state={lang:localStorage.getItem("hkHospLang")||"tc",view:"list",q:"",sector:"all",region:"all",spec:"all",ae:false,sel:null,places:[]};
const $=s=>document.querySelector(s);
function name(p){return state.lang==="tc"?p.tc:p.en;}
function filtered(){
  const q=state.q.trim().toLowerCase();
  return state.places.filter(p=>{
    if(state.sector==="pub"&&!p.pub)return false;
    if(state.sector==="pri"&&p.pub)return false;
    if(state.sector==="sop"&&p.kind!=="sop")return false;
    if(state.region!=="all"&&p.region!==state.region)return false;
    if(state.ae&&!p.ae)return false;
    if(state.spec!=="all"&&(p.specs||"").indexOf(state.spec)<0)return false;
    if(q){
      const bag=(p.tc+" "+p.en+" "+p.addr+" "+(p.specs||"")).toLowerCase();
      if(bag.indexOf(q)<0)return false;
    }
    return true;
  });
}
function chip(label,on,fn){const b=document.createElement("button");b.type="button";b.className="chip"+(on?" on":"");b.textContent=label;b.onclick=fn;return b;}
function filters(){
  const el=$("#filters"); if(!el)return; el.innerHTML="";
  const add=(l,on,fn)=>el.appendChild(chip(l,on,fn));
  const L=state.lang==="tc";
  add(L?"全部":"All",state.sector==="all"&&state.region==="all"&&!state.ae&&state.spec==="all",()=>{state.sector="all";state.region="all";state.ae=false;state.spec="all";paint();});
  add(L?"公立":"Public",state.sector==="pub",()=>{state.sector=state.sector==="pub"?"all":"pub";paint();});
  add(L?"私家":"Private",state.sector==="pri",()=>{state.sector=state.sector==="pri"?"all":"pri";paint();});
  add(L?"專科門診":"SOP",state.sector==="sop",()=>{state.sector=state.sector==="sop"?"all":"sop";paint();});
  add(L?"急症 / 24小時":"A&E / 24h",state.ae,()=>{state.ae=!state.ae;paint();});
  add(L?"港島":"HK Island",state.region==="港島",()=>{state.region=state.region==="港島"?"all":"港島";paint();});
  add(L?"九龍":"Kowloon",state.region==="九龍",()=>{state.region=state.region==="九龍"?"all":"九龍";paint();});
  add(L?"新界":"N.T.",state.region==="新界",()=>{state.region=state.region==="新界"?"all":"新界";paint();});
  SPEC_CHIPS.forEach(s=>add(s,state.spec===s,()=>{state.spec=state.spec===s?"all":s;paint();}));
}
function actions(p){
  const tel=p.phone?("tel:"+p.phone.replace(/\s/g,"")):"";
  const maps="https://maps.apple.com/?ll="+p.lat+","+p.lng+"&q="+encodeURIComponent(name(p));
  const callLbl=state.lang==="tc"?"致電":"Call";
  const call=p.phone?('<a class="btn" href="'+tel+'" onclick="event.stopPropagation()">'+callLbl+"</a>"):('<a class="btn" style="opacity:.4;pointer-events:none">'+callLbl+"</a>");
  return '<div class="actions">'+call+'<a class="btn ghost" href="'+maps+'" target="_blank" rel="noopener" onclick="event.stopPropagation()">'+(state.lang==="tc"?"地圖":"Map")+'</a><a class="btn ghost" href="'+p.web+'" target="_blank" rel="noopener" onclick="event.stopPropagation()">'+(state.lang==="tc"?"網站":"Site")+"</a></div>";
}
function tags(p){
  const L=state.lang==="tc";
  return '<div class="tags"><span class="tag '+(p.pub?"pub":"pri")+'">'+(p.pub?(L?"公立":"Public"):(L?"私家":"Private"))+'</span>'+(p.ae?'<span class="tag ae">'+(L?"急症":"A&E")+"</span>":"")+(p.kind==="sop"?'<span class="tag">'+(L?"專科門診":"SOP")+"</span>":"")+"</div>";
}
function renderList(){
  const rows=filtered(); const root=$("#view");
  if(!rows.length){root.innerHTML='<div class="empty">'+(state.lang==="tc"?"沒有符合條件的結果。":"No matching results.")+"</div>";return;}
  root.innerHTML='<div class="section-title">'+rows.length+'</div><div class="card-list"></div>';
  const wrap=root.querySelector(".card-list");
  rows.forEach(p=>{
    const b=document.createElement("button"); b.type="button"; b.className="place-card";
    b.innerHTML='<div class="place-name">'+name(p)+'</div><div class="place-meta">'+p.region+" · "+p.addr+'</div>'+tags(p)+'<div class="place-meta" style="margin-top:8px">'+(p.specs||"")+"</div>"+actions(p);
    b.onclick=()=>{state.sel=p.id;state.view="detail";paint();};
    wrap.appendChild(b);
  });
}
function renderDetail(){
  const p=state.places.find(x=>x.id===state.sel); const root=$("#view");
  if(!p){state.view="list";renderList();return;}
  const L=state.lang==="tc";
  root.innerHTML='<button class="back" id="backBtn" type="button">‹ '+(L?"返回":"Back")+'</button><article class="detail"><div class="detail-hero"><h2>'+name(p)+"</h2><div class=\"place-meta\" style=\"margin-top:8px\">"+(L?p.en:p.tc)+"</div>"+tags(p)+actions(p)+'</div><ul class="kv"><li><span>'+(L?"類別":"Type")+"</span><span>"+(p.pub?(L?"公立":"Public"):(L?"私家":"Private"))+"</span></li><li><span>"+(L?"醫院聯網":"Cluster")+"</span><span>"+p.cluster+"</span></li><li><span>"+(L?"地址":"Address")+"</span><span>"+p.addr+"</span></li><li><span>"+(L?"電話":"Phone")+"</span><span>"+(p.phone||(L?"未有公開電話":"Not listed"))+"</span></li><li><span>"+(L?"急症室":"A&E")+"</span><span>"+(p.ae?(L?"有":"Yes"):(L?"沒有":"No"))+"</span></li><li><span>"+(L?"專科":"Specialties")+"</span><span>"+(p.specs||"—")+"</span></li></ul><div class=\"notice\">"+(L?"專科名單為公開資料整理，實際門診以院方公布為準。危急請致電 999。":"Specialty list is compiled from public information. Call 999 in an emergency.")+"</div></article>";
  $("#backBtn").onclick=()=>{state.view="list";state.sel=null;paint();};
}
function renderMap(){
  $("#view").innerHTML='<div id="map"></div>';
  const map=L.map("map").setView([22.35,114.15],11);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19}).addTo(map);
  const b=[];
  filtered().forEach(p=>{if(p.lat==null)return;b.push([p.lat,p.lng]);L.marker([p.lat,p.lng]).addTo(map).bindPopup("<b>"+name(p)+"</b><br>"+p.addr+"<br>"+(p.specs||""));});
  if(b.length)map.fitBounds(b,{padding:[24,24],maxZoom:13});
  setTimeout(()=>map.invalidateSize(),80);
}
function renderAbout(){
  const L=state.lang==="tc";
  $("#view").innerHTML='<article class="detail"><div class="detail-hero"><h2>'+(L?"說明":"About")+'</h2></div><div class="block"><p style="margin:0;line-height:1.6">'+(L?"本網站整理全港公立醫院、私家醫院及醫院管理局專科門診地點，並標示各院主要專科。資料為靜態名冊，並非即時急症室輪候。專科以公開資料歸納，個別服務請向院方確認。危急請致電 999。":"Directory of public hospitals, private hospitals and HA specialist clinics in Hong Kong, with main specialties. This is a static directory, not a live A&E queue. Call 999 in an emergency.")+"</p></div></article>";
}
function paint(){
  document.documentElement.lang=state.lang==="tc"?"zh-Hant-HK":"en";
  $("#title").textContent=state.lang==="tc"?"香港醫院指南":"Hong Kong Hospitals";
  $("#subtitle").textContent=state.lang==="tc"?"公立 · 私家 · 專科門診":"Public · Private · Specialist clinics";
  $("#search").placeholder=state.lang==="tc"?"搜尋醫院、診所或專科":"Search hospital, clinic or specialty";
  $("#btnTc").classList.toggle("on",state.lang==="tc");
  $("#btnEn").classList.toggle("on",state.lang==="en");
  document.querySelectorAll(".tab").forEach(el=>{
    el.classList.toggle("on",el.dataset.view===state.view||(state.view==="detail"&&el.dataset.view==="list"));
  });
  filters();
  if(state.view==="list")renderList();
  else if(state.view==="detail")renderDetail();
  else if(state.view==="map")renderMap();
  else renderAbout();
}
function bind(){
  $("#search").oninput=e=>{state.q=e.target.value;if(state.view==="detail")state.view="list";paint();};
  $("#btnTc").onclick=()=>{state.lang="tc";localStorage.setItem("hkHospLang","tc");paint();};
  $("#btnEn").onclick=()=>{state.lang="en";localStorage.setItem("hkHospLang","en");paint();};
  document.querySelectorAll(".tab").forEach(el=>{el.onclick=()=>{state.view=el.dataset.view;state.sel=null;paint();};});
}
$("#view").innerHTML='<div class="empty">載入中…</div>';
fetch("data/places.json").then(r=>r.json()).then(data=>{state.places=data;bind();paint();}).catch(()=>{
  $("#view").innerHTML='<div class="empty">未能載入名冊。</div>';
});
})();
