(function(){
const extra={"春碭角慈氏護養院":"護養","沙田慈氏護養院":"護養","麥理浩復康院":"復康","戴麟趾康復中心":"復康","白普理寧養中心":"紓緩治療","小欖醫院":"智障服務"};
const REGION_EN={"港島":"HK Island","九龍":"Kowloon","新界":"N.T."};
function prepare(){
  if(!window.state||!state.places)return;
  const en=state.lang==="en";
  state.places.forEach(function(p){
    if(extra[p.tc]) p.specs=extra[p.tc];
    if(!p.addrTc) p.addrTc=p.addr;
    if(!p.specsTc) p.specsTc=p.specs;
    if(!p.specsEn&&window.specToEn) p.specsEn=window.specToEn(p.specsTc||p.specs);
    p.addr=en?(p.addrEn||p.addrTc||""):(p.addrTc||"");
    p.specs=en?(p.specsEn||p.specsTc||""):(p.specsTc||"");
    p._regionShow=en?(REGION_EN[p.region]||p.region):p.region;
  });
  document.querySelectorAll(".tab span").forEach(function(sp,i){
    const labels=en?[["List","Map","About"],["目錄","地圖","說明"]][0]:["目錄","地圖","說明"];
  });
  const tabs=document.querySelectorAll(".tab span");
  const lab=en?["List","Map","About"]:["目錄","地圖","說明"];
  tabs.forEach(function(sp,i){if(lab[i])sp.textContent=lab[i];});
}
const prev=window.paint;
window.paint=function(){prepare();if(prev)prev();};
if(window.state&&state.places&&state.places.length)window.paint();
})();
