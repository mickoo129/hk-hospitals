(function(){
const L=localStorage.getItem("hkHospLang")||"tc";
const T={
tc:{all:"全部",pub:"公立",pri:"私家",ae:"急症 / 24小時",hk:"港島",kl:"九龍",nt:"新界",call:"致電",map:"地圖",site:"網站",back:"返回",empty:"沒有符合條件的結果。",about:"本網站列出全港主要公立及私家醫院的地址與電話，方便查閱。並非即時急症室輪候系統。危急請致電 999。"},
en:{all:"All",pub:"Public",pri:"Private",ae:"A&E / 24h",hk:"HK Island",kl:"Kowloon",nt:"N.T.",call:"Call",map:"Map",site:"Website",back:"Back",empty:"No matching results.",about:"Directory of major public and private hospitals in Hong Kong. Not a live A&E queue. Call 999 in an emergency."}
};
function t(k){return T[state.lang][k];}
const H=[
["pyneh","東區尤德夫人那打素醫院","Pamela Youde Nethersole Eastern Hospital","港島","25956111","香港柴灣樂民道3號",22.2694,114.2365,1,1],
["qmh","瑪麗醫院","Queen Mary Hospital","港島","22553838","香港薄扶林道102號",22.2703,114.1312,1,1],
["rhtsk","律敦治醫院","Ruttonjee Hospital","港島","22912000","香港灣仔皇后大道東266號",22.2758,114.1754,1,1],
["sjh","長洲醫院","St. John Hospital","港島","29819841","長洲東灣",22.2080,114.0295,1,1],
["kwh","廣華醫院","Kwong Wah Hospital","九龍","23322311","九龍窩打老道25號",22.3152,114.1724,1,1],
["qeh","伊利沙伯醫院","Queen Elizabeth Hospital","九龍","35068888","九龍加士居道30號",22.3095,114.1754,1,1],
["tkoh","將軍澳醫院","Tseung Kwan O Hospital","新界","22080111","將軍澳坑口道路8號",22.3174,114.2703,1,1],
["uch","基督教聯合醫院","United Christian Hospital","九龍","39494000","九龍觀塘協和街130號",22.3227,114.2276,1,1],
["cmc","明愛醫院","Caritas Medical Centre","九龍","34085678","九龍深水埕永康街111號",22.3407,114.1524,1,1],
["nlth","北大嶼山醫院","North Lantau Hospital","新界","34655000","東涌松仁路8號",22.2816,113.9393,1,1],
["pmh","瑪嘉烈醫院","Princess Margaret Hospital","新界","29901111","葰涌荔景瑪嘉烈醫院路2-10號",22.3400,114.1347,1,1],
["ych","仁濟醫院","Yan Chai Hospital","新界","24178383","荃灣仁濟醫院路7-11號",22.3696,114.1196,1,1],
["ahnh","雅麗氏何妙齡那打素醫院","Alice Ho Miu Ling Nethersole Hospital","新界","26892000","大埔全安路11號",22.4586,114.1748,1,1],
["ndh","北區醫院","North District Hospital","新界","26838888","上水保健路9號",22.4968,114.1246,1,1],
["pwh","威爾斯親王醫院","Prince of Wales Hospital","新界","35052211","沙田銀城街30-32號",22.3795,114.2018,1,1],
["poh","博愛醫院","Pok Oi Hospital","新界","24868000","元朗坳頭",22.4446,114.0416,1,1],
["tswh","天水圍醫院","Tin Shui Wai Hospital","新界","35135000","天水圍天壇街11號",22.4587,113.9956,1,1],
["tmh","屯門醫院","Tuen Mun Hospital","新界","24685111","屯門青松觀路23號",22.4073,113.9764,1,1],
["hkch","香港兒童醫院","Hong Kong Children's Hospital","九龍","35133513","九龍啟德承啟道1號",22.3167,114.2138,0,1],
["hkeh","香港眼科醫院","Hong Kong Eye Hospital","九龍","27623000","九龍亞皆老街147K",22.3234,114.1849,0,1],
["glen","港怡醫院","Gleneagles Hospital Hong Kong","港島","31539000","香港黃竹坑南風徑1號",22.2486,114.1748,1,0,"https://gleneagles.hk/"],
["hksh","養和醫院","Hong Kong Sanatorium & Hospital","港島","25720211","香港跑馬地山村道2號",22.2683,114.1836,1,0,"https://www.hksh-hospital.com/"],
["hkah","香港港安醫院—司徒拔道","HK Adventist Hospital – Stubbs Road","港島","36518888","香港司徒拔道40號",22.2689,114.1849,1,0,"https://www.hkah.org.hk/"],
["cano","嘉諾撒醫院","Canossa Hospital","港島","25222181","香港舊山頂道1號",22.2764,114.1547,1,0,"https://www.canossahospital.org.hk/"],
["stpa","聖保禄醫院","St. Paul's Hospital","港島","28906008","香港銅鑼灣東院道2號",22.2778,114.1885,1,0,"https://www.stpaul.org.hk/"],
["mati","明德國際醫院","Matilda International Hospital","港島","28490111","香港山頂加列山道41號",22.2625,114.1519,1,0,"https://www.matilda.org/"],
["bapt","香港浸信會醫院","Hong Kong Baptist Hospital","九龍","23398888","九龍窩打老道222號",22.3345,114.1792,1,0,"https://www.hkbh.org.hk/"],
["stte","聖德肋撒醫院","St. Teresa's Hospital","九龍","22003434","九龍太子道西327號",22.3272,114.1883,0,0,"https://www.sth.org.hk/"],
["pbh","寶血醫院（明愛）","Precious Blood Hospital","九龍","39719900","九龍深水埕青山道113號",22.3311,114.1633,0,0,"https://www.pbh.hk/"],
["evan","播道醫院","Evangel Hospital","九龍","27115222","九龍亞皆老街222號",22.3236,114.1864,0,0,"https://www.evangel.org.hk/"],
["unio","仁安醫院","Union Hospital","新界","26083388","沙田大圍富健街18號",22.3695,114.1788,1,0,"https://www.union.org/"],
["cuhk","香港中文大學醫院","CUHK Medical Centre","新界","39466888","沙田澤祥街9號",22.4146,114.2103,1,0,"https://www.cuhkmc.hk/"],
["twah","香港港安醫院—荃灣","HK Adventist Hospital – Tsuen Wan","新界","22756688","荃灣荃景圍199號",22.3734,114.1056,1,0,"https://www.twah.org.hk/"]
];
const state={lang:L,view:"list",q:"",sector:"all",region:"all",ae:false,sel:null};
const $ = s => document.querySelector(s);
function name(h){return state.lang==="tc"?h[1]:h[2];}
function list(){
  const q=state.q.trim().toLowerCase();
  return H.filter(h=>{
    if(state.sector==="pub"&&h[9]!==1)return false;
    if(state.sector==="pri"&&h[9]!==0)return false;
    if(state.region!=="all"&&h[3]!==state.region)return false;
    if(state.ae&&!h[8])return false;
    if(q&&!(h[1]+h[2]+h[5]).toLowerCase().includes(q))return false;
    return true;
  });
}
function chip(label,on,fn){const b=document.createElement("button");b.type="button";b.className="chip"+(on?" on":"");b.textContent=label;b.onclick=fn;return b;}
function filters(){
  const el=$("#filters");el.innerHTML="";
  const add=(l,on,fn)=>el.appendChild(chip(l,on,fn));
  add(t("all"),state.sector==="all"&&state.region==="all"&&!state.ae,()=>{state.sector="all";state.region="all";state.ae=false;paint();});
  add(t("pub"),state.sector==="pub",()=>{state.sector=state.sector==="pub"?"all":"pub";paint();});
  add(t("pri"),state.sector==="pri",()=>{state.sector=state.sector==="pri"?"all":"pri";paint();});
  add(t("ae"),state.ae,()=>{state.ae=!state.ae;paint();});
  add(t("hk"),state.region==="港島",()=>{state.region=state.region==="港島"?"all":"港島";paint();});
  add(t("kl"),state.region==="九龍",()=>{state.region=state.region==="九龍"?"all":"九龍";paint();});
  add(t("nt"),state.region==="新界",()=>{state.region=state.region==="新界"?"all":"新界";paint();});
}
function actions(h){
  const tel="tel:"+h[4];
  const maps="https://maps.apple.com/?ll="+h[6]+","+h[7]+"&q="+encodeURIComponent(name(h));
  const web=h[10]||"https://www.ha.org.hk/";
  return '<div class="actions"><a class="btn" href="'+tel+'" onclick="event.stopPropagation()">'+t("call")+'</a><a class="btn ghost" href="'+maps+'" target="_blank" onclick="event.stopPropagation()">'+t("map")+'</a><a class="btn ghost" href="'+web+'" target="_blank" onclick="event.stopPropagation()">'+t("site")+'</a></div>';
}
function renderList(){
  const rows=list();const root=$("#view");
  if(!rows.length){root.innerHTML='<div class="empty">'+t("empty")+'</div>';return;}
  root.innerHTML='<div class="section-title">'+rows.length+'</div><div class="card-list"></div>';
  const wrap=root.querySelector(".card-list");
  rows.forEach(h=>{
    const b=document.createElement("button");b.type="button";b.className="place-card";
    b.innerHTML='<div class="place-name">'+name(h)+'</div><div class="place-meta">'+h[3]+' · '+h[5]+'</div><div class="tags"><span class="tag '+(h[9]?"pub":"pri")+'">'+(h[9]?t("pub"):t("pri"))+'</span>'+(h[8]?'<span class="tag ae">'+t("ae")+'</span>':'')+'</div>'+actions(h);
    b.onclick=()=>{state.sel=h[0];state.view="detail";paint();};
    wrap.appendChild(b);
  });
}
function renderDetail(){
  const h=H.find(x=>x[0]===state.sel);const root=$("#view");
  if(!h){state.view="list";renderList();return;}
  root.innerHTML='<button class="back" id="backBtn" type="button">‹ '+t("back")+'</button><article class="detail"><div class="detail-hero"><h2>'+name(h)+'</h2><div class="place-meta" style="margin-top:8px">'+(state.lang==="tc"?h[2]:h[1])+'</div>'+actions(h)+'</div><ul class="kv"><li><span>'+(state.lang==="tc"?"地址":"Address")+'</span><span>'+h[5]+'</span></li><li><span>'+(state.lang==="tc"?"電話":"Phone")+'</span><span>'+h[4].replace(/(\d{4})(\d{4})/,"$1 $2")+'</span></li></ul><div class="notice">'+(state.lang==="tc"?"危急請致電 999。":"Call 999 in an emergency.")+'</div></article>';
  $("#backBtn").onclick=()=>{state.view="list";state.sel=null;paint();};
}
function renderAbout(){
  $("#view").innerHTML='<article class="detail"><div class="detail-hero"><h2>'+(state.lang==="tc"?"說明":"About")+'</h2></div><div class="block"><p style="margin:0;line-height:1.6">'+t("about")+'</p></div></article>';
}
function renderMap(){
  $("#view").innerHTML='<div id="map"></div>';
  const map=L.map("map").setView([22.35,114.15],11);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19}).addTo(map);
  const b=[];
  list().forEach(h=>{b.push([h[6],h[7]]);L.marker([h[6],h[7]]).addTo(map).bindPopup("<b>"+name(h)+"</b><br>"+h[5]);});
  if(b.length)map.fitBounds(b,{padding:[24,24],maxZoom:13});
  setTimeout(()=>map.invalidateSize(),80);
}
function paint(){
  document.documentElement.lang=state.lang==="tc"?"zh-Hant-HK":"en";
  $("#title").textContent=state.lang==="tc"?"香港醫院指南":"Hong Kong Hospitals";
  $("#subtitle").textContent=state.lang==="tc"?"公立 · 私家醫院名冊":"Public · Private directory";
  $("#search").placeholder=state.lang==="tc"?"搜尋醫院名稱或地址":"Search hospital or address";
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
$("#search").oninput=e=>{state.q=e.target.value;if(state.view==="detail")state.view="list";paint();};
$("#btnTc").onclick=()=>{state.lang="tc";localStorage.setItem("hkHospLang","tc");paint();};
$("#btnEn").onclick=()=>{state.lang="en";localStorage.setItem("hkHospLang","en");paint();};
document.querySelectorAll(".tab").forEach(el=>{el.onclick=()=>{state.view=el.dataset.view;state.sel=null;paint();};});
paint();
})();
