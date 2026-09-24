(function(){
const SPEC_CHIPS=["內科","外科","骨科","兒科","婦科","眼科","耳鼻喉科","精神科","急症科","復康","腫瘤科","家庭醫學"];
const state={lang:localStorage.getItem("hkHospLang")||"tc",view:"list",q:"",sectors:[],regions:[],specs:[],ae:false,nearby:false,loc:null,sel:null,places:[]};
function toggle(arr,v){const i=arr.indexOf(v);if(i>=0)arr.splice(i,1);else arr.push(v);}
function km(a,b){const R=6371,dLat=(b.lat-a.lat)*Math.PI/180,dLng=(b.lng-a.lng)*Math.PI/180;const s=Math.sin(dLat/2)**2+Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLng/2)**2;return 2*R*Math.asin(Math.sqrt(s));}
function askLoc(){if(!navigator.geolocation)return;navigator.geolocation.getCurrentPosition(p=>{state.loc={lat:p.coords.latitude,lng:p.coords.longitude};paint();},()=>{state.nearby=false;paint();},{timeout:8000});}
const $=s=>document.querySelector(s);
function name(p){return state.lang==="tc"?p.tc:p.en;}
function filtered(){
  const q=state.q.trim().toLowerCase();
  const list=state.places.filter(p=>{
    if(state.sectors.length){
      const ok=(state.sectors.indexOf("pub")>=0&&p.pub)||(state.sectors.indexOf("pri")>=0&&!p.pub)||(state.sectors.indexOf("sop")>=0&&p.kind==="sop");
      if(!ok)return false;
    }
    if(state.regions.length&&state.regions.indexOf(p.region)<0)return false;
    if(state.ae&&!p.ae)return false;
    if(state.specs.length&&!state.specs.some(s=>(p.specs||"").indexOf(s)>=0))return false;
    if(q){
      const bag=(p.tc+" "+p.en+" "+p.addr+" "+(p.specs||"")).toLowerCase();
      if(bag.indexOf(q)<0)return false;
    }
    return true;
  }).map(p=>state.loc?Object.assign({},p,{_km:km(state.loc,{lat:p.lat,lng:p.lng})}):p);
  if(state.nearby&&state.loc) list.sort((a,b)=>(a._km||99)-(b._km||99));
  return list;
}
function chip(label,on,fn){const b=document.createElement("button");b.type="button";b.className="chip"+(on?" on":"");b.textContent=label;b.onclick=fn;return b;}
function filters(){
  const el=$("#filters"); if(!el)return; el.innerHTML="";
  const L=state.lang==="tc";
  function row(title){const w=document.createElement("div");w.className="filter-row";const lab=document.createElement("div");lab.className="filter-label";lab.textContent=title;const chips=document.createElement("div");chips.className="filter-chips";w.appendChild(lab);w.appendChild(chips);el.appendChild(w);return chips;}
  function add(box,label,on,fn){box.appendChild(chip(label,on,fn));}
  const r1=row(L?"分類（可多選）":"Type (multi-select)");
  add(r1,L?"附近":"Nearby",state.nearby,()=>{state.nearby=!state.nearby;if(state.nearby&&!state.loc)askLoc();else paint();});
  add(r1,L?"公立":"Public",state.sectors.indexOf("pub")>=0,()=>{toggle(state.sectors,"pub");paint();});
  add(r1,L?"私家":"Private",state.sectors.indexOf("pri")>=0,()=>{toggle(state.sectors,"pri");paint();});
  add(r1,L?"專科門診":"SOP",state.sectors.indexOf("sop")>=0,()=>{toggle(state.sectors,"sop");paint();});
  add(r1,L?"急症 / 24小時":"A&E / 24h",state.ae,()=>{state.ae=!state.ae;paint();});
  add(r1,L?"重設":"Reset",false,()=>{state.sectors=[];state.regions=[];state.specs=[];state.ae=false;state.nearby=false;paint();});
  const r2=row(L?"地區（可多選）":"Area (multi-select)");
  [["港島",L?"港島":"HK Island"],["九龍",L?"九龍":"Kowloon"],["新界",L?"新界":"N.T."]].forEach(([v,lab])=>add(r2,lab,state.regions.indexOf(v)>=0,()=>{toggle(state.regions,v);paint();}));
  const r3=row(L?"專科（可多選）":"Specialty (multi-select)");
  SPEC_CHIPS.forEach(s=>add(r3,s,state.specs.indexOf(s)>=0,()=>{toggle(state.specs,s);paint();}));
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
    const dist=p._km!=null?'<span class="km"> · '+p._km.toFixed(1)+(state.lang==="tc"?" 公里":" km")+"</span>":"";
    b.innerHTML='<div class="place-name">'+name(p)+'</div><div class="place-meta">'+p.region+dist+" · "+p.addr+'</div>'+tags(p)+'<div class="place-meta" style="margin-top:8px">'+(p.specs||"")+"</div>"+actions(p);
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
  if(state.loc) L.circleMarker([state.loc.lat,state.loc.lng],{radius:7,color:"#0b8a6e",fillOpacity:1}).addTo(map);
  if(b.length)map.fitBounds(b,{padding:[24,24],maxZoom:13});
  setTimeout(()=>map.invalidateSize(),80);
}
function renderAbout(){
  const L=state.lang==="tc";
  $("#view").innerHTML='<article class="detail"><div class="detail-hero"><h2>'+(L?"說明":"About")+'</h2></div><div class="block"><p style="margin:0;line-height:1.6">'+(L?"用專科篩選找出有該服務的醫院，再用「附近」按距離排序。危急請致電 999。":"Filter by specialty, then Nearby. Call 999 in an emergency.")+"</p></div></article>";
}
function paint(){
  document.documentElement.lang=state.lang==="tc"?"zh-Hant-HK":"en";
  $("#title").textContent=state.lang==="tc"?"香港醫院指南":"Hong Kong Hospitals";
  $("#subtitle").textContent=state.lang==="tc"?"按專科查詢 · 附近醫院":"Find by specialty · Nearby";
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
window.state=state;window.bind=bind;window.paint=paint;
})();
