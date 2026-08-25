try{ localStorage.setItem('sailplanner.v4', JSON.stringify({pal:'dusk'})); localStorage.setItem('sp_welcome','1'); }catch(e){}
setTimeout(()=>{
  const w=document.getElementById('welcome'); if(w) w.dataset.on='false';
  S.pal='dusk'; S.collapsed=true; S.ctrls=false; S.drawer=false; S.planOpen=false; S.mxOpen=false;
  document.documentElement.dataset.pal='dusk';
  all();
  setTimeout(()=>{ fitAll(); map.invalidateSize({pan:false}); },800);
},900);
