(function(){
const extra={"春碭角慈氏護養院":"護養","沙田慈氏護養院":"護養","麥理浩復康院":"復康","戴麟趾康復中心":"復康","白普理寧養中心":"紓緩治療","小欖醫院":"智障服務","香港紅十字會輸血服務中心":"輸血服務"};
function fill(){
  if(!window.state||!state.places)return;
  state.places.forEach(function(p){
    if(extra[p.tc]){
      p.specs=extra[p.tc];
      p.specsEn=window.specToEn?window.specToEn(p.specs):p.specs;
    }
  });
}
const prev=window.paint;
window.paint=function(){fill();if(prev)prev();};
if(state&&state.places&&state.places.length)window.paint();
})();
