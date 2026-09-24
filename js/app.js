(function(){
const SPEC_CHIPS=["內科","外科","骨科","兒科","婦科","眼科","耳鼻喉科","精神科","急症科","復康","腫瘤科","家庭醫學"];
const state={lang:localStorage.getItem("hkHospLang")||"tc",view:"list",q:"",sector:"all",region:"all",spec:"all",ae:false,nearby:false,loc:null,sel:null,places:[]};
function km(a,b){const R=6371,dLat=(b.lat-a.lat)*Math.PI/180,dLng=(b.lng-a.lng)*Math.PI/180;const s=Math.sin(dLat/2)**2+Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLng/2)**2;return 2*R*Math.asin(Math.sqrt(s));}
function askLoc(){if(!navigator.geolocation)return;navigator.geolocation.getCurrentPosition(p=>{state.loc={lat:p.coords.latitude,lng:p.coords.longitude};paint();},()=>{state.nearby=false;paint();},{timeout:8000});}
const $=s=>document.querySelector(s);
function name(p){return state.lang==="tc"?p.tc:p.en;}
function filtered(){
  const q=state.q.trim().toLowerCase();
  const list=state.places.filter(p=>{
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
  }).map(p=>state.loc?Object.assign({},p,{_km:km(state.loc,{lat:p.lat,lng:p.lng})}):p);
  if(state.nearby&&state.loc) list.sort((a,b)=>(a._km||99)-(b._km||99));
  return list;
}
function chip(label,on,fn){const b=document.createElement("button");b.type="button";b.className="chip"+(on?" on":"");b.textContent=label;b.onclick=fn;return b;}
function filters(){
  const el=$("#filters"); if(!el)return; el.innerHTML="";
  const add=(l,on,fn)=>el.appendChild(chip(l,on,fn));
  const L=state.lang==="tc";
  add(L?"全部":"All",state.sector==="all"&&state.region==="all"&&!state.ae&&state.spec==="all"&&!state.nearby,()=>{state.sector="all";state.region="all";state.ae=false;state.spec="all";state.nearby=false;paint();});
  add(L?"附近":"Nearby",state.nearby,()=>{state.nearby=!state.nearby;if(state.nearby&&!state.loc)askLoc();else paint();});
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
  $("#view").innerHTML='<article class="detail"><div class="detail-hero"><h2>'+(L?"說明":"About")+'</h2></div><div class="block"><p style="margin:0;line-height:1.6">'+(L?"用專科篩選找出有該服務的醫院，再用「附近」按距離排序。資料為靜態名冊，並非即時急症室人流。危急請致電 999。":"Filter by specialty, then use Nearby to sort by distance. Call 999 in an emergency.")+"</p></div></article>";
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
const ACUTE="內科、外科、骨科、兒科、婦科、眼科、耳鼻喉科、急症科";
const PHONES={"東區尤德夫人那打素醫院":"2595 6111","瑪麗醫院":"2255 3838","律敦治醫院":"2291 2000","長洲醫院":"2981 9841","廣華醫院":"2332 2311","伊利沙伯醫院":"3506 8888","將軍澳醫院":"2208 0111","基督教聯合醫院":"3949 4000","明愛醫院":"3408 5678","北大嶼山醫院":"3465 5000","瑪嘉烈醫院":"2990 1111","仁濟醫院":"2417 8383","雅麗氏何妙齡那打素醫院":"2689 2000","北區醫院":"2683 8888","威爾斯親王醫院":"3505 2211","博愛醫院":"2486 8000","天水圍醫院":"3513 5000","屯門醫院":"2468 5111","香港兒童醫院":"3513 3513","香港眼科醫院":"2762 3000","葛量洪醫院":"2518 2111","東華醫院":"2589 8111","東華東院":"2162 6888","九龍醫院":"3129 6666","葵涌醫院":"2959 8111","青山醫院":"2456 7111","沙田醫院":"2636 7530","大埔醫院":"2607 6111","靈實醫院":"2703 8888","聖母醫院":"2354 2267","贊育醫院":"2589 2200"};
const SPEC_MAP={"香港眼科醫院":"眼科","屯門眼科中心":"眼科","香港兒童醫院":"兒科、小兒外科、兒童癌症","大口環根德公爵夫人兒童醫院":"兒科、骨科、復康","贊育醫院":"婦科、產科","葵涌醫院":"精神科","青山醫院":"精神科","葛量洪醫院":"內科、心臟科、胸肺科","九龍醫院":"內科、復康、精神科","沙田醫院":"內科、復康、紓緩治療","大埔醫院":"內科、復康、精神科","靈實醫院":"內科、復康、紓緩治療","黃竹坑醫院":"復康、紓緩治療","東華醫院":"內科、外科、復康","東華東院":"內科、復康","聖母醫院":"內科、家庭醫學","香港佛教醫院":"內科、復康","麥理浩復康院":"復康","戴麟趾康復中心":"復康","白普理寧養中心":"紓緩治療","春碭角慈氏護養院":"護養","沙田慈氏護養院":"護養","小欖醫院":"智障服務","鄧肇堅醫院":"家庭醫學","西灣河家庭醫學診所":"家庭醫學","油麻地賽馬會家庭醫學診所":"家庭醫學"};
const PRIVATE=[{"id":"gleneagles","tc":"港怡醫院","en":"Gleneagles Hospital Hong Kong","region":"港島","cluster":"私家醫院","addr":"香港黃竹坑南風徑號","lat":22.2486,"lng":114.1748,"ae":1,"pub":0,"kind":"hosp","phone":"3153 9000","web":"https://gleneagles.hk/","specs":"內科、外科、骨科、兒科、婦科、眼科、耳鼻喉科、急症科"},{"id":"hksh","tc":"養和醫院","en":"Hong Kong Sanatorium & Hospital","region":"港島","cluster":"私家醫院","addr":"香港跑馬地山村道2號","lat":22.2683,"lng":114.1836,"ae":1,"pub":0,"kind":"hosp","phone":"2572 0211","web":"https://www.hksh-hospital.com/","specs":"內科、外科、骨科、兒科、婦科、眼科、耳鼻喉科、腫瘤科、急症科"},{"id":"hkah-sr","tc":"香港港安醫院—司徒拔道","en":"Hong Kong Adventist Hospital – Stubbs Road","region":"港島","cluster":"私家醫院","addr":"香港司徒拔道40號","lat":22.2689,"lng":114.1849,"ae":1,"pub":0,"kind":"hosp","phone":"3651 8888","web":"https://www.hkah.org.hk/","specs":"內科、外科、心臟科、腫瘤科、急症科"},{"id":"canossa","tc":"嘉諾撒醫院","en":"Canossa Hospital","region":"港島","cluster":"私家醫院","addr":"香港舊山頂道1號","lat":22.2764,"lng":114.1547,"ae":1,"pub":0,"kind":"hosp","phone":"2522 2181","web":"https://www.canossahospital.org.hk/","specs":"內科、外科、骨科、婦科"},{"id":"stpauls","tc":"聖保禄醫院","en":"St. Paul's Hospital","region":"港島","cluster":"私家醫院","addr":"香港銅鑼灣東院道2號","lat":22.2778,"lng":114.1885,"ae":1,"pub":0,"kind":"hosp","phone":"2890 6008","web":"https://www.stpaul.org.hk/","specs":"內科、外科、骨科、兒科、婦科"},{"id":"matilda","tc":"明德國際醫院","en":"Matilda International Hospital","region":"港島","cluster":"私家醫院","addr":"香港山頂加列山道41號","lat":22.2625,"lng":114.1519,"ae":1,"pub":0,"kind":"hosp","phone":"2849 0111","web":"https://www.matilda.org/","specs":"內科、外科、婦科、產科"},{"id":"baptist","tc":"香港浸信會醫院","en":"Hong Kong Baptist Hospital","region":"九龍","cluster":"私家醫院","addr":"九龍窩打老道222號","lat":22.3345,"lng":114.1792,"ae":1,"pub":0,"kind":"hosp","phone":"2339 8888","web":"https://www.hkbh.org.hk/","specs":"內科、外科、骨科、兒科、婦科、腫瘤科、急症科"},{"id":"st-teresa","tc":"聖德肋撒醫院","en":"St. Teresa's Hospital","region":"九龍","cluster":"私家醫院","addr":"九龍太子道西327號","lat":22.3272,"lng":114.1883,"ae":0,"pub":0,"kind":"hosp","phone":"2200 3434","web":"https://www.sth.org.hk/","specs":"內科、外科、骨科、兒科、婦科"},{"id":"precious-blood","tc":"寶血醫院（明愛）","en":"Precious Blood Hospital","region":"九龍","cluster":"私家醫院","addr":"九龍深水埗青山道113號","lat":22.3311,"lng":114.1633,"ae":0,"pub":0,"kind":"hosp","phone":"3971 9900","web":"https://www.pbh.hk/","specs":"內科、外科、婦科"},{"id":"evangel","tc":"播道醫院","en":"Evangel Hospital","region":"九龍","cluster":"私家醫院","addr":"九龍亞皆老街222號","lat":22.3236,"lng":114.1864,"ae":0,"pub":0,"kind":"hosp","phone":"2711 5222","web":"https://www.evangel.org.hk/","specs":"內科、外科、家庭醫學"},{"id":"union","tc":"仁安醫院","en":"Union Hospital","region":"新界","cluster":"私家醫院","addr":"新界沙田大圍富健街18號","lat":22.3695,"lng":114.1788,"ae":1,"pub":0,"kind":"hosp","phone":"2608 3388","web":"https://www.union.org/","specs":"內科、外科、骨科、兒科、婦科、急症科"},{"id":"cuhkmc","tc":"香港中文大學醫院","en":"CUHK Medical Centre","region":"新界","cluster":"私家醫院","addr":"新界沙田澤祥街9號","lat":22.4146,"lng":114.2103,"ae":1,"pub":0,"kind":"hosp","phone":"3946 6888","web":"https://www.cuhkmc.hk/","specs":"內科、外科、骨科、兒科、婦科、腫瘤科、急症科"},{"id":"hkah-tw","tc":"香港港安醫院—荃灣","en":"Hong Kong Adventist Hospital – Tsuen Wan","region":"新界","cluster":"私家醫院","addr":"新界荃灣荃景圍199號","lat":22.3734,"lng":114.1056,"ae":1,"pub":0,"kind":"hosp","phone":"2275 6688","web":"https://www.twah.org.hk/","specs":"內科、外科、骨科、急症科"}];
function regionOf(c){return /島/.test(c)?"港島":(/新界/.test(c)?"新界":"九龍");}
function slug(en){return String(en||"").toLowerCase().replace(/&/g,"and").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,40);}
function norm(row,kind){const tc=row.institution_tc,ae=row.with_AE_service_tc==="是";return{id:slug(row.institution_eng),tc:tc,en:row.institution_eng,region:regionOf(row.cluster_tc),cluster:row.cluster_tc,addr:row.address_tc,lat:row.latitude,lng:row.longitude,ae:ae?1:0,pub:1,kind:kind,phone:PHONES[tc]||"",web:"https://www.ha.org.hk/",specs:ae?ACUTE:(SPEC_MAP[tc]||"請向院方查詢確實專科")};}
$("#view").innerHTML='<div class="empty">載入中…</div>';
function boot(list){state.places=list;bind();paint();}
Promise.all(["hosp","sop"].map(src=>fetch("/.netlify/functions/ha?src="+src).then(r=>{if(!r.ok)throw new Error(src);return r.json();})))
.then(([hosp,sop])=>{
  const by={};
  (hosp||[]).forEach(r=>{by[r.institution_tc]=norm(r,"hosp");});
  (sop||[]).forEach(r=>{if(!by[r.institution_tc]) by[r.institution_tc]=norm(r,"sop");});
  boot(Object.values(by).concat(PRIVATE));
}).catch(()=>boot(PRIVATE.slice()));
})();
