
(function(){
  var RARITY={
    bronze:{a:'#e6935a',b:'#f2bd93',g:'rgba(224,138,74,.4)',tone:'rgba(224,138,74,.12)',holo:.72,foil:.06,glow:.26,label:'BRONZE'},
    silver:{a:'#d3dae4',b:'#f2f6fb',g:'rgba(207,214,223,.4)',tone:'rgba(207,214,223,.12)',holo:.8,foil:.12,glow:.3,label:'SILVER'},
    gold:{a:'#f5d67b',b:'#c9a24a',g:'rgba(245,214,123,.42)',tone:'rgba(245,214,123,.14)',holo:.86,foil:.16,glow:.34,label:'GOLD'},
    elite:{a:'#8ab4ff',b:'#cfe0ff',g:'rgba(138,180,255,.45)',tone:'rgba(138,180,255,.14)',holo:.92,foil:.24,glow:.42,label:'ELITE'},
    legend:{a:'#ff5f9e',b:'#ffd36e',g:'rgba(255,95,158,.5)',tone:'rgba(255,95,158,.15)',holo:1,foil:.4,glow:.52,label:'LEGEND'},
    totw:{a:'#eef2f7',b:'#aab3c0',g:'rgba(233,237,243,.4)',tone:'rgba(18,26,44,.28)',holo:.9,foil:.3,glow:.36,label:'TOTW'},
    hof:{a:'#f5d67b',b:'#7c5cff',g:'rgba(124,92,255,.48)',tone:'rgba(124,92,255,.15)',holo:1,foil:.36,glow:.48,label:'HALL OF FAME'},
    mvp:{a:'#ffcc00',b:'#ff9500',g:'rgba(255,204,0,.5)',tone:'rgba(255,178,0,.16)',holo:.96,foil:.34,glow:.5,label:'MVP'},
    galaxy:{a:'#a06bff',b:'#5ad1ff',g:'rgba(160,107,255,.5)',tone:'rgba(120,90,255,.18)',holo:1,foil:.42,glow:.52,label:'GALAXY'},
    carbon:{a:'#ff3b30',b:'#c8ccd2',g:'rgba(255,59,48,.4)',tone:'rgba(255,59,48,.1)',holo:.82,foil:.14,glow:.32,label:'CARBON'},
    fire:{a:'#ff5a2c',b:'#ffb347',g:'rgba(255,90,44,.5)',tone:'rgba(255,90,44,.16)',holo:.9,foil:.34,glow:.52,label:'FIRE'},
    ice:{a:'#7fe6ff',b:'#e2f8ff',g:'rgba(127,230,255,.46)',tone:'rgba(127,230,255,.14)',holo:.94,foil:.32,glow:.48,label:'ICE'},
    black:{a:'#c9a24a',b:'#8a8f98',g:'rgba(201,162,74,.38)',tone:'rgba(0,0,0,.22)',holo:.8,foil:.18,glow:.3,label:'BLACK EDITION'},
    neon:{a:'#39ff14',b:'#00e5ff',g:'rgba(57,255,20,.5)',tone:'rgba(57,255,20,.14)',holo:1,foil:.44,glow:.56,label:'NEON'}
  };
  var KONSEPTLER=[{k:1,ad:'Glass'},{k:2,ad:'Carbon'},{k:3,ad:'Stadium'},{k:4,ad:'Cinematic'},{k:5,ad:'Cyber'}];
  var BG={orijinal:null,seffaf:'transparent',siyah:'#05070c',stadyum:'linear-gradient(180deg,#8fb6ff44,#12233f 42%,#0e5a2a 100%)',gece:'radial-gradient(120% 80% at 50% -10%,#20315a,#060a14 62%),linear-gradient(0deg,#0a3a1e,transparent 42%)',duman:'radial-gradient(65% 60% at 50% 42%,#41474f,#0a0b0e)',altin:'radial-gradient(62% 52% at 50% 30%,#f5d67b66,#1a1408 72%)',neon:'radial-gradient(60% 60% at 28% 20%,#00e5ff55,transparent),radial-gradient(60% 60% at 82% 82%,#c766ff55,#05030f)',gradient:'linear-gradient(160deg,#2c3f74,#0a0e1a)',bokeh:'radial-gradient(circle at 22% 28%,#ffffff2a 0 7px,transparent 8px),radial-gradient(circle at 72% 62%,#ffffff1c 0 12px,transparent 13px),linear-gradient(#13233f,#060a14)',carbon:'repeating-linear-gradient(45deg,#15171b 0 3px,#0c0d10 3px 6px)',flarena:'radial-gradient(120% 70% at 50% -8%,#153a55,transparent 55%),linear-gradient(180deg,#0c2718,#0a3a1e)',flpremium:'radial-gradient(80% 55% at 50% 25%,#f5d67b22,transparent),linear-gradient(160deg,#141210,#08070a 55%,#000)',fldark:'radial-gradient(90% 60% at 50% 20%,#12203a,#04060c 70%)',flelite:'radial-gradient(80% 60% at 50% 25%,#7c5cff2e,transparent),linear-gradient(160deg,#120a2e,#05030f)'};
  var BG_LIST=[['orijinal','Orijinal'],['seffaf','Şeffaf'],['siyah','Siyah'],['stadyum','Stadyum'],['gece','Gece'],['duman','Duman'],['altin','Altın'],['neon','Neon'],['gradient','Gradient'],['bokeh','Bokeh'],['carbon','Carbon'],['flarena','FL Arena'],['flpremium','FL Premium'],['fldark','FL Dark'],['flelite','FL Elite']];
  var FLAGS={TR:"<svg viewBox='0 0 30 20'><rect width='30' height='20' fill='#e30a17'/><circle cx='11' cy='10' r='5' fill='#fff'/><circle cx='12.5' cy='10' r='4' fill='#e30a17'/><path d='M17 10l4.7-1.5-2.9 4 0-5 2.9 4Z' fill='#fff'/></svg>"};
  function flag(nat){ return FLAGS[nat]||FLAGS.TR; }
  function logo(c){ c=c||'var(--flk-b)'; return "<svg viewBox='0 0 40 40'><path d='M20 2 36 8V20c0 10-7 16-16 19C11 36 4 30 4 20V8Z' fill='none' stroke='"+c+"' stroke-width='2.4'/><path d='M20 12l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8Z' fill='"+c+"'/></svg>"; }
  function rarityFromOvr(ovr){ ovr=+ovr||0; if(ovr>=90)return 'legend'; if(ovr>=86)return 'gold'; if(ovr>=82)return 'elite'; if(ovr>=78)return 'silver'; return 'bronze'; }
  function esc(s){ return String(s==null?'':s).replace(/[<>&"]/g,function(c){return{'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c];}); }
  // ---- portre fallback (foto yoksa) ----
  function fallbackPortrait(d){
    var initial=esc((d.ad||'?').trim().charAt(0).toUpperCase());
    var svg="<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 400'><defs><radialGradient id='g' cx='50%' cy='30%' r='80%'><stop offset='0' stop-color='#2a3450'/><stop offset='1' stop-color='#0a0e18'/></radialGradient></defs><rect width='300' height='400' fill='url(#g)'/><text x='150' y='210' text-anchor='middle' font-size='150' font-weight='900' fill='#ffffff22' font-family='Arial'>"+initial+"</text></svg>";
    return "data:image/svg+xml,"+encodeURIComponent(svg);
  }
  // ---- ÖN YÜZLER ----
  function statRows(d){ return d.stats; }
  function FRONT(d){
    var ph="<img class='flk-ph' src='"+d.foto+"' alt=''>";
    var bg="<div class='flk-bg'></div>";
    var scrim="<div class='flk-scrim'></div>";
    var s=d.stats, k=d.konsept||1;
    if(k===1) return "<div class='flk-pad'></div><div class='flk-win'>"+bg+ph+scrim+"</div>"+
      "<div class='top'><div class='ovr flk-chip'><span class='n'>"+d.ovr+"</span><span class='p'>"+esc(d.pos)+"</span></div><div class='br flk-chip'>"+logo('#fff')+"<span>ForzaLig</span></div></div>"+
      "<div class='flag flk-flag'>"+flag(d.nat)+"</div>"+
      "<div class='low' data-depth='4'><div class='nm flk-fit'>"+esc(d.ad)+"</div><div class='sea'>SEASON "+d.season+"</div><div class='st'>"+s.map(function(x){return "<div class='s'><div class='v'>"+x[1]+"</div><div class='k'>"+x[0]+"</div></div>";}).join('')+"</div><div class='ft'><div class='rr'>RARITY<b>"+d.rarityLabel+"</b></div><div class='flk-holo'></div><div class='id'>ID<b>#"+d.id+"</b></div></div></div>";
    if(k===2) return "<div class='carb'></div><div class='flk-photo' data-depth='8'>"+bg+ph+scrim+"</div><div class='rl' data-depth='5'></div>"+
      "<div class='top'>"+logo('var(--flk-a)')+"<b>Forza<i>Lig</i></b></div><div class='flag flk-flag'>"+flag(d.nat)+"</div>"+
      "<div class='ovr' data-depth='13'><span><span class='n'>"+d.ovr+"</span><span class='p'>"+esc(d.pos)+"</span></span></div>"+
      "<div class='tele' data-depth='4'>"+s.map(function(x){return "<div class='row'><div class='lab'><span>"+x[0]+"</span><b>"+x[1]+"</b></div><div class='bar'><i style='width:"+Math.min(100,x[1])+"%'></i></div></div>";}).join('')+"</div>"+
      "<div class='nm-w' data-depth='3'><div class='nm flk-fit'>"+esc(d.ad)+"</div><div class='sea'>SEASON "+d.season+"</div></div>"+
      "<div class='ft'><div class='m'>RARITY<b>"+d.rarityLabel+"</b></div><div class='flk-holo'></div><div class='m' style='text-align:right'>ID<b>#"+d.id+"</b></div></div>";
    if(k===3) return "<div class='flk-photo' data-depth='8'>"+bg+ph+scrim+"</div><div class='fl'></div>"+
      "<div class='ovr flk-chip' data-depth='12'><div class='n'>"+d.ovr+"</div><div class='p'>"+esc(d.pos)+"</div></div>"+
      "<div class='br flk-chip'>"+logo('var(--flk-a)')+"<span>FORZALİG</span></div><div class='flag flk-flag'>"+flag(d.nat)+"</div>"+
      "<div class='low' data-depth='4'><div class='nm flk-fit'>"+esc(d.ad)+"</div><div class='sea'>SEASON "+d.season+"</div><div class='st'>"+s.map(function(x){return "<div class='s'><div class='v'>"+x[1]+"</div><div class='k'>"+x[0]+"</div></div>";}).join('')+"</div><div class='ft'><div class='rr'>RARITY<b>"+d.rarityLabel+"</b></div><div class='id'>ID<b>#"+d.id+"</b></div><div class='flk-holo'></div></div></div>";
    if(k===4) return "<div class='flk-photo' data-depth='7'>"+bg+ph+scrim+"</div><div class='sp'></div><div class='bar t'></div><div class='bar b'></div><div class='cn tl'></div><div class='cn tr'></div><div class='cn bl'></div><div class='cn brr'></div>"+
      "<div class='top'><div class='lg'>"+logo('var(--flk-a)')+"FORZALİG</div><div class='sea'>SEASON "+d.season+"</div></div><div class='flag flk-flag'>"+flag(d.nat)+"</div>"+
      "<div class='seal' data-depth='11'><div class='n'>"+d.ovr+"</div><div class='p'>"+esc(d.pos)+"</div></div>"+
      "<div class='low' data-depth='4'><div class='nm flk-fit'>"+esc(d.ad)+"</div><div class='sub'>FORZALİG ORIGINALS</div><div class='st'>"+s.map(function(x){return "<div class='s'><div class='v'>"+x[1]+"</div><div class='k'>"+x[0]+"</div></div>";}).join('')+"</div><div class='cr'><span>RARITY · "+d.rarityLabel+"</span><div class='flk-holo'></div><span>ID #"+d.id+"</span></div></div>";
    return "<div class='gr'></div><div class='flk-photo' data-depth='8'>"+bg+ph+scrim+"</div><div class='brk tl'></div><div class='brk brr'></div>"+
      "<div class='top'><div class='lg'>"+logo('var(--flk-a)')+"FORZALIG</div><div class='sea'>SEASON_"+d.season+"</div></div><div class='flag flk-flag'>"+flag(d.nat)+"</div>"+
      "<div class='ovr' data-depth='12'><div class='n'>"+d.ovr+"</div><div class='p'>"+esc(d.pos)+"</div></div>"+
      "<div class='low' data-depth='4'><div class='nm flk-fit'>"+esc(d.ad)+"</div><div class='tg'>// ID #"+d.id+" · RARITY_"+d.rarityLabel+"</div><div class='st'>"+s.map(function(x){return "<div class='s'><div class='lab'><span>"+x[0]+"</span><b>"+x[1]+"</b></div><div class='bar'><i style='width:"+Math.min(100,x[1])+"%'></i></div></div>";}).join('')+"</div><div class='ft'><div class='m'>SERIAL<b>"+d.serial+"</b></div><div class='flk-holo'></div></div></div>";
  }
  function BACK(d){
    var rows=d.kariyer.map(function(c){return "<div class='row'><span>"+c[0]+"</span><b class='"+(c[2]?'hot':'')+"'>"+c[1]+"</b></div>";}).join('');
    return "<div class='flk-rfx'></div><div class='h'>KARİYER</div><div class='nm flk-fit'>"+esc(d.ad)+"</div><div class='gr2'>"+rows+"</div><div class='vf'><div class='qrbox'><canvas class='flk-qr' width='42' height='42'></canvas></div><div class='vt'><b>"+esc(d.ad)+"</b><span>"+d.serial+"</span></div><div class='ok'>DOĞRULAMA<br>AKTİF ✓</div></div>";
  }
  function drawQR(cv,seed){ var ctx=cv.getContext('2d'),N=21,px=cv.width/N; ctx.clearRect(0,0,cv.width,cv.height); var s=12457+(seed||0); function rnd(){ s=(s*1103515245+12345)&0x7fffffff; return (s>>8)/0x7fffff; } ctx.fillStyle='#0a0a0a'; for(var y=0;y<N;y++)for(var x=0;x<N;x++){ if(rnd()>.55) ctx.fillRect(x*px,y*px,px,px); } function f(ox,oy){ ctx.fillStyle='#0a0a0a'; ctx.fillRect(ox*px,oy*px,7*px,7*px); ctx.fillStyle='#fff'; ctx.fillRect((ox+1)*px,(oy+1)*px,5*px,5*px); ctx.fillStyle='#0a0a0a'; ctx.fillRect((ox+2)*px,(oy+2)*px,3*px,3*px); } f(0,0); f(N-7,0); f(0,N-7); }
  function fitText(root){ [].forEach.call(root.querySelectorAll('.flk-fit'),function(el){ el.style.fontSize=''; var max=parseFloat(getComputedStyle(el).fontSize)||18,sz=max,g=0; while(el.scrollWidth>el.clientWidth+.5&&sz>9&&g<80){ sz-=.5; el.style.fontSize=sz+'px'; g++; } }); }
  function analyze(img){ var cw=72,ch=Math.max(1,Math.round(72*img.naturalHeight/img.naturalWidth)); var cv=document.createElement('canvas'); cv.width=cw; cv.height=ch; var ctx=cv.getContext('2d'); ctx.drawImage(img,0,0,cw,ch); var d; try{ d=ctx.getImageData(0,0,cw,ch).data; }catch(e){ return {fx:.5,fy:.24,fh:.32,topL:120,botL:120}; } var rs=new Array(ch).fill(0),cwt=new Array(cw).fill(0),tL=0,tN=0,bL=0,bN=0; for(var y=0;y<ch;y++)for(var x=0;x<cw;x++){ var i=(y*cw+x)*4,r=d[i],g2=d[i+1],b=d[i+2],lum=.299*r+.587*g2+.114*b; if(y<ch*.18){tL+=lum;tN++;} if(y>ch*.6){bL+=lum;bN++;} var mx=Math.max(r,g2,b),mn=Math.min(r,g2,b); if(r>70&&g2>40&&b>25&&r>=g2&&g2>=b*.85&&(r-b)>12&&(mx-mn)>12&&(mx-mn)<160&&lum>45&&lum<235){ rs[y]++; cwt[x]++; } } var best=0,by=Math.round(ch*.22); for(var y2=0;y2<ch;y2++){ var sum=0; for(var kk=-1;kk<=1;kk++){ var yy=y2+kk; if(yy>=0&&yy<ch)sum+=rs[yy]; } var w=sum*(1-y2/ch*.35); if(w>best){best=w;by=y2;} } var top=by,bot=by,thr=Math.max(2,best*.32); for(var y3=by;y3>=0;y3--){ if(rs[y3]>=thr)top=y3; else if(by-y3>2)break; } for(var y4=by;y4<ch;y4++){ if(rs[y4]>=thr)bot=y4; else if(y4-by>ch*.28)break; } var fh=(bot-top)/ch; if(!(fh>.05))fh=.3; var fy=(top+(bot-top)*.42)/ch; var cs=0,csum=0; for(var x2=0;x2<cw;x2++){ cs+=cwt[x2]*x2; csum+=cwt[x2]; } var fx=csum>4?cs/csum/cw:.5; fx=Math.max(.32,Math.min(.68,fx)); return {fx:fx,fy:Math.max(.12,Math.min(.5,fy)),fh:Math.max(.12,Math.min(.6,fh)),topL:tN?tL/tN:120,botL:bN?bL/bN:120}; }
  function place(box,img,an,crop,bg){ var cw=box.clientWidth,chh=box.clientHeight; if(!cw||!chh)return; var bl=box.querySelector('.flk-bg'); if(bl){ var bgv=(bg&&BG[bg]!==undefined)?BG[bg]:null; bl.style.background=(!bg||bg==='orijinal')?'transparent':(bgv||'transparent'); bl.style.display=(!bg||bg==='orijinal')?'none':'block'; } var iw=img.naturalWidth,ih=img.naturalHeight,cover=Math.max(cw/iw,chh/ih),fx,fy,zoom,focusY; if(crop){ fx=crop.fx;fy=crop.fy;zoom=crop.zoom;focusY=.5; } else { fx=an.fx;fy=an.fy;focusY=.32; zoom=Math.max(1.25,Math.min(2.8,.36*chh/(Math.max(an.fh,.12)*ih*cover))); } var s=cover*zoom,dw=iw*s,dh=ih*s,left=cw*.5-fx*dw,top=chh*focusY-fy*dh; left=Math.min(0,Math.max(cw-dw,left)); top=Math.min(0,Math.max(chh-dh,top)); [].forEach.call(box.querySelectorAll('.flk-ph'),function(p){ p.classList.add('fit'); p.style.width=dw+'px'; p.style.height=dh+'px'; p.style.left=left+'px'; p.style.top=top+'px'; }); var scr=box.querySelector('.flk-scrim'); if(scr&&an){ var strong=Math.max(.42,Math.min(.74,.42+(an.botL-70)/260)),topA=Math.max(0,Math.min(.24,(an.topL-110)/300)); scr.style.background='linear-gradient(180deg,rgba(0,0,0,'+topA.toFixed(2)+') 0%,rgba(0,0,0,0) 30%,rgba(0,0,0,0) 50%,rgba(0,0,0,'+(strong*.45).toFixed(2)+') 70%,rgba(0,0,0,'+strong.toFixed(2)+') 100%)'; } }
  function applyRarity(host,rk){ var R=RARITY[rk]||RARITY.gold; var s=host.style; s.setProperty('--flk-a',R.a); s.setProperty('--flk-b',R.b); s.setProperty('--flk-g',R.g); s.setProperty('--flk-tone',R.tone); s.setProperty('--flk-holo',R.holo); s.setProperty('--flk-foil','0'); s.setProperty('--flk-rglow',R.glow); return R; }
  function bind(card){
    var dx=0,dy=0,moved=false;
    card.addEventListener('pointerdown',function(e){ dx=e.clientX; dy=e.clientY; moved=false; });
    card.addEventListener('pointermove',function(e){ if(Math.abs(e.clientX-dx)>6||Math.abs(e.clientY-dy)>6) moved=true; });
    card.addEventListener('click',function(){ if(!moved) card.classList.toggle('flip'); });
    if(window.matchMedia&&window.matchMedia('(pointer:fine)').matches){
      var depth=[].slice.call(card.querySelectorAll('[data-depth]')),raf=null,tx=0,ty=0;
      var apply=function(){ raf=null; card.style.setProperty('--flk-ry',(tx*9).toFixed(2)+'deg'); card.style.setProperty('--flk-rx',(-ty*9).toFixed(2)+'deg'); depth.forEach(function(el){ var dd=parseFloat(el.getAttribute('data-depth'))||0; el.style.transform='translate3d('+(-tx*dd).toFixed(1)+'px,'+(-ty*dd).toFixed(1)+'px,0)'; }); };
      card.addEventListener('pointermove',function(e){ var r=card.getBoundingClientRect(); tx=(e.clientX-r.left)/r.width-.5; ty=(e.clientY-r.top)/r.height-.5; if(!raf) raf=requestAnimationFrame(apply); });
      card.addEventListener('pointerleave',function(){ card.style.setProperty('--flk-ry','0deg'); card.style.setProperty('--flk-rx','0deg'); depth.forEach(function(el){ el.style.transform='translate3d(0,0,0)'; }); });
    }
  }
  // ---- MOUNT ----
  function mount(host,d,opts){
    opts=opts||{}; d=Object.assign({},d);
    d.konsept=opts.konsept||d.konsept||1;
    var rk=opts.rarity||d.rarityKey||rarityFromOvr(d.ovr); rk=RARITY[rk]?rk:'gold';
    d.rarityLabel=RARITY[rk].label; d.season=d.season||'2027'; d.id=d.id||'0000'; d.serial=d.serial||('FL-'+d.id+'-2027'); d.nat=d.nat||'TR';
    var hasFoto=!!opts.foto; d.foto=opts.foto||fallbackPortrait(d);
    host.className='flkart flk-c'+d.konsept;
    host.innerHTML="<div class='flk-card'><div class='flk-inner'><div class='flk-face'>"+FRONT(d)+"<div class='flk-rfx'></div><div class='flk-sweep'></div></div><div class='flk-face flk-back'>"+BACK(d)+"</div></div></div>";
    var R=applyRarity(host,rk);
    var card=host.querySelector('.flk-card');
    if(!opts.kirpMod) bind(card);   // kırpma modunda flip/tilt kapalı (kart doğrudan sürüklenir)
    [].forEach.call(host.querySelectorAll('.flk-qr'),function(cv){ drawQR(cv,(d.id+'').split('').reduce(function(a,c){return a+c.charCodeAt(0);},0)); });
    requestAnimationFrame(function(){ fitText(host); });
    setTimeout(function(){ fitText(host); },70);
    // crop konsepte göre çözülür (her konseptin kendi kırpması)
    var effCrop=opts.crop; if(effCrop && typeof effCrop==='object' && effCrop.fx===undefined){ effCrop=effCrop[d.konsept]||effCrop[''+d.konsept]||null; }
    // foto yerleştir
    // Kırpma modunda: kartı HEMEN sürüklenebilir yap (touch-action:none) → parmak ilk andan itibaren sayfayı kaydırmaz.
    if(opts.kirpMod){ card.style.touchAction='none'; card.style.cursor='grab'; }
    var box=host.querySelector('.flk-win, .flk-photo'); if(box){ var img=new Image(); img.onload=function(){ var an=analyze(img); place(box,img,an,effCrop,opts.bg); requestAnimationFrame(function(){ place(box,img,an,effCrop,opts.bg); if(opts.kirpMod&&opts.onKirp&&!host.__flkKirp){ host.__flkKirp=attachKirp(card,box,img.naturalWidth,img.naturalHeight,opts.onKirp); if(host.__flkKirp&&opts.onReady) opts.onReady(host.__flkKirp); } }); setTimeout(function(){ place(box,img,an,effCrop,opts.bg); if(opts.kirpMod&&opts.onKirp&&!host.__flkKirp){ host.__flkKirp=attachKirp(card,box,img.naturalWidth,img.naturalHeight,opts.onKirp); if(host.__flkKirp&&opts.onReady) opts.onReady(host.__flkKirp); } },110); }; img.src=d.foto; }
    return {rarity:rk, R:R};
  }
  // Canlı kart üzerinde kırpma. onChange(crop) CANLI çağrılır (önizleme).
  // Handle döner: {getCrop, zoomTo(pct), zoomPct(), reset()} — slider/Uygula/Sıfırla için.
  function attachKirp(card,box,iw,ih,onChange){
    if(!iw||!ih) return null; var imgs=box.querySelectorAll('.flk-ph'); if(!imgs.length) return null;
    var cw=box.clientWidth, chh=box.clientHeight, cover=Math.max(cw/iw,chh/ih);
    var s=(parseFloat(imgs[0].style.width)||iw*cover)/iw, left=parseFloat(imgs[0].style.left)||0, top=parseFloat(imgs[0].style.top)||0;
    function apply(){ var dw=iw*s,dh=ih*s; left=Math.min(0,Math.max(cw-dw,left)); top=Math.min(0,Math.max(chh-dh,top)); [].forEach.call(imgs,function(p){ p.style.width=dw+'px'; p.style.height=dh+'px'; p.style.left=left+'px'; p.style.top=top+'px'; }); }
    if(s<cover) s=cover;   // kutuyu her zaman doldur
    apply();
    var s0=s,l0=left,t0=top;  // sıfırlama için başlangıç
    function crop(){ var dw=iw*s,dh=ih*s; return {fx:Math.max(0,Math.min(1,(cw*.5-left)/dw)),fy:Math.max(0,Math.min(1,(chh*.5-top)/dh)),zoom:s/cover}; }
    function emit(){ if(onChange) onChange(crop()); }
    function zoomAt(ns,cx,cy){ cx=cx==null?cw/2:cx; cy=cy==null?chh/2:cy; var ix=(cx-left)/s,iy=(cy-top)/s; ns=Math.max(cover,Math.min(cover*4.5,ns)); left=cx-ix*ns; top=cy-iy*ns; s=ns; apply(); emit(); }
    // ---- TAMAMEN POINTER TABANLI: tek parmak/fare = sürükle, iki parmak = pinch zoom.
    //      touch-action:none → sayfa kaydırma çalmaz. Ölü buton yok, per-konsept yok.
    card.style.cursor='grab'; card.style.touchAction='none';
    var pts={}, dn=false, px=0, py=0, pdist=0;
    function ids(){ return Object.keys(pts); }
    function dist2(){ var k=ids(); if(k.length<2) return 0; var a=pts[k[0]],b=pts[k[1]]; return Math.hypot(a.x-b.x,a.y-b.y); }
    function cen2(){ var k=ids(); var a=pts[k[0]],b=pts[k[1]]; return {x:(a.x+b.x)/2,y:(a.y+b.y)/2}; }
    card.addEventListener('pointerdown',function(e){ pts[e.pointerId]={x:e.clientX,y:e.clientY}; try{card.setPointerCapture(e.pointerId);}catch(_){} var k=ids(); if(k.length===1){ dn=true; px=e.clientX; py=e.clientY; card.style.cursor='grabbing'; } else if(k.length>=2){ dn=false; pdist=dist2(); } });
    card.addEventListener('pointermove',function(e){ if(!pts[e.pointerId]) return; pts[e.pointerId]={x:e.clientX,y:e.clientY}; var k=ids(); if(k.length>=2){ var nd=dist2(); if(pdist){ var r=box.getBoundingClientRect(), c=cen2(); zoomAt(s*(nd/pdist), c.x-r.left, c.y-r.top); } pdist=nd; } else if(dn){ left+=e.clientX-px; top+=e.clientY-py; px=e.clientX; py=e.clientY; apply(); emit(); } });
    function up(e){ delete pts[e.pointerId]; try{card.releasePointerCapture(e.pointerId);}catch(_){} var k=ids(); if(k.length<2) pdist=0; if(k.length===0){ dn=false; card.style.cursor='grab'; } else if(k.length===1){ dn=true; px=pts[k[0]].x; py=pts[k[0]].y; } }
    card.addEventListener('pointerup',up); card.addEventListener('pointercancel',up);
    card.addEventListener('wheel',function(e){ e.preventDefault(); var r=box.getBoundingClientRect(); zoomAt(s*(e.deltaY<0?1.08:.926), e.clientX-r.left, e.clientY-r.top); },{passive:false});
    return { getCrop:crop, zoomTo:function(pct){ zoomAt(cover*(pct/100)); }, zoomPct:function(){ return Math.round(s/cover*100); },
      reset:function(){ s=s0; left=l0; top=t0; apply(); emit(); } };
  }
  // aktif konseptin foto kutusu oranını (w/h) döndür — kırpma çerçevesi bununla eşleşir
  function kutuOrani(host){ var b=host&&host.querySelector('.flk-win, .flk-photo'); if(b&&b.clientWidth&&b.clientHeight) return b.clientWidth/b.clientHeight; return 0.66; }
  window.FLKART={ RARITY:RARITY, KONSEPTLER:KONSEPTLER, BG:BG, BG_LIST:BG_LIST, rarityFromOvr:rarityFromOvr, mount:mount, analyze:analyze, place:place, drawQR:drawQR, fitText:fitText, kutuOrani:kutuOrani };
})();
