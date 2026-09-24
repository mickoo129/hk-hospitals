(function(){
function apply(){
  if(!window.state||!state.places)return;
  state.places.forEach(function(p){
    if(!p._addrTc){p._addrTc=p.addr;p._specsTc=p.specs;p._clusterTc=p.cluster;}
    if(state.lang==="en"){
      p.addr=p.addrEn||p._addrTc;
      p.specs=p.specsEn||(window.specToEn?window.specToEn(p._specsTc):p._specsTc);
      p.cluster=p.clusterEn||p._clusterTc;
    }else{
      p.addr=p._addrTc;
      p.specs=p._specsTc;
      p.cluster=p._clusterTc;
    }
  });
}
const prev=window.paint;
window.paint=function(){apply();if(prev)prev();};
if(window.state&&state.places&&state.places.length) window.paint();
})();
