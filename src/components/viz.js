function Logo({renk, boy=40, ad, logo, renk2}){
  return <div style={{width:boy,height:boy,flexShrink:0,borderRadius:"50%",overflow:"hidden"}} dangerouslySetInnerHTML={{__html: svgAmblem(ad||"F", renk, boy, logo, renk2)}}/>;
}

function Avatar({o, boy=44, T}){
  return <div style={{width:boy,height:boy,borderRadius:"50%",overflow:"hidden",flexShrink:0}} dangerouslySetInnerHTML={{__html: svgAvatar(o.ad, boy, o.foto)}}/>;
}

function FormRozet({form, T}){
  const map={G:T.accent,M:T.danger,B:T.gold};
  return <div style={{display:"flex",gap:3}}>{form.slice(-5).map((f,i)=>
    <span key={i} style={{width:16,height:16,borderRadius:4,background:map[f]+"33",color:map[f],fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{f}</span>
  )}</div>;
}

function MiniBar({deger, max, renk, T}){
  const oran = max>0 ? Math.min(100,(deger/max)*100) : 0;
  return <div style={{flex:1,height:7,background:T.bg2,borderRadius:4,overflow:"hidden"}}>
    <div className="bar-grow" style={{width:oran+"%",height:"100%",background:renk,borderRadius:4}}/>
  </div>;
}

/* Chart.js'i yalnızca ilk grafik gerektiğinde yükle (açılış hızı için ~200KB tasarruf) */
let _chartYuk=null;
function chartYukle(){
  if(window.Chart) return Promise.resolve();
  if(_chartYuk) return _chartYuk;
  _chartYuk=new Promise((res,rej)=>{
    const s=document.createElement("script");
    s.src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js";
    s.async=true; s.onload=res; s.onerror=rej;
    document.head.appendChild(s);
  });
  return _chartYuk;
}

/* Chart.js sarmalayıcı — her grafik tipi için tek parça */
function Grafik({tip, data, options, yukseklik=180}){
  const ref=useRef(null);
  const chartRef=useRef(null);
  const [hazir,setHazir]=useState(!!window.Chart);
  useEffect(()=>{
    let iptal=false;
    if(!window.Chart) chartYukle().then(()=>{ if(!iptal) setHazir(true); }).catch(()=>{});
    return ()=>{ iptal=true; };
  },[]);
  useEffect(()=>{
    if(!ref.current || !window.Chart) return;
    if(chartRef.current) chartRef.current.destroy();
    chartRef.current=new window.Chart(ref.current,{type:tip,data,options:{responsive:true,maintainAspectRatio:false,...options}});
    return ()=>{ if(chartRef.current) chartRef.current.destroy(); };
  },[hazir,tip,JSON.stringify(data),JSON.stringify(options)]);
  return <div style={{height:yukseklik,position:"relative"}}><canvas ref={ref}/></div>;
}

/* FIFA kart parçası */
function FifaKart({o, T}){
  const yildiz = o.ovr>=85?5:o.ovr>=78?4:o.ovr>=68?3:o.ovr>=58?2:1;
  // kart tipi
  let kartBg, anaRenk, altRenk;
  if(o.ovr>=90){ kartBg="linear-gradient(160deg,#9B5DE5,#6930C3 55%,#3C096C)"; anaRenk="#F0E6FF"; altRenk="#E0CCFF"; } // elmas/icon
  else if(o.ovr>=85){ kartBg="linear-gradient(160deg,#F5D77E,#E5B84B 50%,#B8902E)"; anaRenk="#3A2E08"; altRenk="#5A4810"; } // altın
  else if(o.ovr>=72){ kartBg="linear-gradient(160deg,#D8DDE3,#AEB6BF 55%,#7E8896)"; anaRenk="#2A2E33"; altRenk="#444A52"; } // gümüş
  else { kartBg="linear-gradient(160deg,#C9885A,#A66B3C 55%,#7A4E29)"; anaRenk="#3A2410"; altRenk="#5A3A1A"; } // bronz

  return <div className="pop" style={{width:210,borderRadius:"50% 50% 16px 16px/14% 14% 4% 4%",padding:"18px 16px 16px",background:kartBg,position:"relative",overflow:"hidden",boxShadow:"0 10px 30px rgba(0,0,0,.35)"}}>
    {/* parlama */}
    <div style={{position:"absolute",top:0,left:"-60%",width:"60%",height:"100%",background:"linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent)",transform:"skewX(-20deg)",animation:"sweep 3.5s ease-in-out infinite"}}/>
    <style>{`@keyframes sweep{0%{left:-60%}55%,100%{left:130%}}`}</style>

    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",position:"relative",zIndex:1}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:38,fontWeight:800,lineHeight:.9,color:anaRenk,fontFamily:T.fontDisplay}}>{o.ovr}</div>
        <div style={{fontSize:13,fontWeight:700,color:altRenk}}>{o.poz.slice(0,3).toUpperCase()}</div>
        <div style={{fontSize:11,color:altRenk,marginTop:3}}>{"★".repeat(yildiz)}</div>
        <div style={{fontSize:10,color:altRenk,marginTop:3,fontWeight:600}}>🇹🇷</div>
      </div>
      <div style={{filter:"drop-shadow(0 6px 10px rgba(0,0,0,.35))",marginTop:4}}><Avatar o={o} boy={104} T={T}/></div>
    </div>

    <div style={{textAlign:"center",fontSize:17,fontWeight:800,color:anaRenk,letterSpacing:.5,margin:"10px 0 8px",textTransform:"uppercase",fontFamily:T.fontDisplay,position:"relative",zIndex:1,borderTop:"1px solid "+altRenk+"55",paddingTop:8}}>{o.ad}</div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px 16px",fontSize:13,position:"relative",zIndex:1,padding:"0 8px"}}>
      {[["HIZ",o.pac],["DRİ",o.dri],["ŞUT",o.sho],["SAV",o.def],["PAS",o.pas],["FİZ",o.phy]].map(([k,v])=>
        <div key={k} style={{display:"flex",justifyContent:"space-between",color:anaRenk}}><b style={{fontWeight:800}}>{v}</b><span style={{opacity:.65,fontWeight:600}}>{k}</span></div>
      )}
    </div>
  </div>;
}

/* Radar grafiği parçası */
function Radar({o, T, boy=150}){
  const stats=[o.pac,o.sho,o.pas,o.dri,o.def,o.phy];
  const cx=boy/2, cy=boy/2, r=boy/2-22;
  const pts=stats.map((s,i)=>{ const a=-Math.PI/2+i*Math.PI/3; const v=Math.max(.1,s/100); return [cx+r*v*Math.cos(a), cy+r*v*Math.sin(a)];});
  const grid=[0,1,2,3,4,5].map(i=>{ const a=-Math.PI/2+i*Math.PI/3; return [cx+r*Math.cos(a), cy+r*Math.sin(a)];});
  const etiket=["HIZ","ŞUT","PAS","DRI","SAV","FIZ"];
  return <svg width={boy} height={boy}>
    <polygon points={grid.map(p=>p.join(",")).join(" ")} fill="none" stroke={T.line} strokeWidth="1"/>
    <polygon points={grid.map((p,i)=>{const a=-Math.PI/2+i*Math.PI/3;return [cx+r*0.5*Math.cos(a),cy+r*0.5*Math.sin(a)].join(",")}).join(" ")} fill="none" stroke={T.line} strokeWidth="0.5"/>
    <polygon className="pop" points={pts.map(p=>p.join(",")).join(" ")} fill={T.accent+"44"} stroke={T.accent} strokeWidth="2"/>
    {grid.map((p,i)=><text key={i} x={cx+(r+12)*Math.cos(-Math.PI/2+i*Math.PI/3)} y={cy+(r+12)*Math.sin(-Math.PI/2+i*Math.PI/3)} fontSize="9" fill={T.textSoft} textAnchor="middle" dominantBaseline="middle">{etiket[i]}</text>)}
  </svg>;
}

/* Sparkline parçası */
function Sparkline({seri, T, w=120, h=34}){
  if(!seri||seri.length<2) return null;
  const max=Math.max(...seri,1);
  const pts=seri.map((v,i)=>[(w/(seri.length-1))*i, h-(h-6)*(v/max)-3]);
  const alan = pts.map(p=>p.join(",")).join(" ")+` ${w},${h} 0,${h}`;
  return <svg width={w} height={h}>
    <polygon className="bar-grow" points={alan} fill={T.accent+"22"}/>
    <polyline className="bar-grow" points={pts.map(p=>p.join(",")).join(" ")} fill="none" stroke={T.accent} strokeWidth="2"/>
    {pts.map((p,i)=><circle key={i} cx={p[0]} cy={p[1]} r="2.5" fill={T.accent}/>)}
  </svg>;
}

/* Sayaç animasyonu — sayı 0'dan yukarı sayar */
function Sayac({hedef, T, renk, boy=22}){
  const [n,setN]=useState(0);
  useEffect(()=>{
    let cur=0; const adim=Math.max(1,Math.ceil(hedef/24));
    const id=setInterval(()=>{ cur+=adim; if(cur>=hedef){cur=hedef;clearInterval(id);} setN(cur); },24);
    return ()=>clearInterval(id);
  },[hedef]);
  return <span style={{fontSize:boy,fontWeight:800,color:renk,fontFamily:T.fontDisplay}}>{n}</span>;
}

/* Dairesel dolan halka (hedef ilerleme) */
function Halka({oran, etiket, alt, T, renk, boy=92}){
  const [g,setG]=useState(0);
  const r=boy/2-8, cevre=2*Math.PI*r;
  useEffect(()=>{ const id=setTimeout(()=>setG(oran),100); return ()=>clearTimeout(id); },[oran]);
  return <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
    <div style={{position:"relative",width:boy,height:boy}}>
      <svg width={boy} height={boy} style={{transform:"rotate(-90deg)"}}>
        <circle cx={boy/2} cy={boy/2} r={r} fill="none" stroke={T.bg2} strokeWidth="7"/>
        <circle cx={boy/2} cy={boy/2} r={r} fill="none" stroke={renk} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={cevre} strokeDashoffset={cevre*(1-g)} style={{transition:"stroke-dashoffset 1.1s cubic-bezier(.2,.8,.3,1)"}}/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <span style={{fontSize:18,fontWeight:800,color:T.text,fontFamily:T.fontDisplay}}>{Math.round(oran*100)}%</span>
      </div>
    </div>
    <div style={{fontSize:11,color:T.text,fontWeight:600,marginTop:6,textAlign:"center"}}>{etiket}</div>
    <div style={{fontSize:10,color:T.textMut}}>{alt}</div>
  </div>;
}

/* Dikey bar grafiği (aylık gol gibi) */
function BarGrafik({seri, etiketler, T, renk, h=110}){
  const max=Math.max(...seri,1);
  return <div style={{display:"flex",alignItems:"flex-end",gap:6,height:h,padding:"0 4px"}}>
    {seri.map((v,i)=>
      <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
        <div style={{fontSize:10,color:T.textSoft,fontWeight:600}}>{v}</div>
        <div className="bar-grow" style={{width:"100%",height:(v/max)*(h-30)+"px",minHeight:3,background:renk,borderRadius:"5px 5px 0 0",transformOrigin:"bottom"}}/>
        <div style={{fontSize:9,color:T.textMut}}>{etiketler[i]}</div>
      </div>
    )}
  </div>;
}

/* Karşılaştırma çubuğu (lig ortalamasına göre) */
function KiyasBar({etiket, deger, ort, T, renk}){
  const yuzde = ort>0 ? Math.round((deger/ort-1)*100) : 0;
  const oran = ort>0 ? Math.min(1,deger/(ort*2)) : 0;
  const [w,setW]=useState(0);
  useEffect(()=>{ const id=setTimeout(()=>setW(oran*100),100); return ()=>clearTimeout(id); },[oran]);
  return <div style={{marginBottom:10}}>
    <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:4}}>
      <span style={{color:T.textSoft}}>{etiket}</span>
      <span style={{color:yuzde>=0?T.accent:T.danger,fontWeight:600}}>{yuzde>=0?"+":""}{yuzde}% <span style={{color:T.textMut}}>lig ort.</span></span>
    </div>
    <div style={{height:8,background:T.bg2,borderRadius:5,overflow:"hidden"}}>
      <div style={{width:w+"%",height:"100%",background:renk,borderRadius:5,transition:"width 1s cubic-bezier(.2,.8,.3,1)"}}/>
    </div>
  </div>;
}

/* Rozet vitrini */
function Rozet({ikon, ad, kazanildi, T}){
  return <div className="pop" style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,opacity:kazanildi?1:0.3,filter:kazanildi?"none":"grayscale(1)"}}>
    <div style={{width:46,height:46,borderRadius:"50%",background:kazanildi?T.gold+"22":T.bg2,border:"1.5px solid "+(kazanildi?T.gold:T.line),display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{ikon}</div>
    <span style={{fontSize:9,color:kazanildi?T.text:T.textMut,textAlign:"center",lineHeight:1.2,maxWidth:54}}>{ad}</span>
  </div>;
}

/* Saha dizilişi — futbol sahası + formalar (FatihPro İlk 11 referansı) */
function SahaDizilis({takim, T, git, turnuva}){
  // SON MAÇ KADROSUNU bul (yoksa OVR'ye göre otomatik)
  const sonMac = useMemo(()=>{
    if(!turnuva||!turnuva.maclar) return null;
    const oynanan = turnuva.maclar.filter(m=>m.oynandi && (m.takimAId===takim.id||m.takimBId===takim.id) && (m.kadroA||m.kadroB));
    if(oynanan.length===0) return null;
    return oynanan[oynanan.length-1];
  },[takim.id, turnuva]);

  let ilk11=[], dizilisAd="";
  if(sonMac){
    const benimA = sonMac.takimAId===takim.id;
    const kadro = benimA ? sonMac.kadroA : sonMac.kadroB;
    dizilisAd = benimA ? sonMac.dizilisA : sonMac.dizilisB;
    if(kadro && kadro.yerlesim){
      ilk11 = kadro.yerlesim.filter(x=>x!=null).map(id=>takim.oyuncular.find(o=>o.id===id)).filter(Boolean);
    }
  }
  const otomatik = ilk11.length===0;
  if(otomatik){
    const sirali=[...takim.oyuncular].sort((a,b)=>b.ovr-a.ovr);
    const kaleci=sirali.filter(o=>o.poz==="Kaleci").slice(0,1);
    const defans=sirali.filter(o=>o.poz==="Defans").slice(0,4);
    const orta=sirali.filter(o=>o.poz==="OrtaSaha").slice(0,3);
    const forvet=sirali.filter(o=>o.poz==="Forvet").slice(0,3);
    ilk11=[...kaleci,...defans,...orta,...forvet];
    dizilisAd=`${defans.length}-${orta.length}-${forvet.length}`;
  }
  const kisiSayi = ilk11.length;
  const kaleciler=ilk11.filter(o=>o.poz==="Kaleci");
  const defanslar=ilk11.filter(o=>o.poz==="Defans");
  const ortalar=ilk11.filter(o=>o.poz==="OrtaSaha");
  const forvetler=ilk11.filter(o=>o.poz==="Forvet");
  if(!dizilisAd) dizilisAd=`${defanslar.length}-${ortalar.length}-${forvetler.length}`;
  const kaptan = ilk11.length ? ilk11.reduce((a,b)=>b.ovr>a.ovr?b:a, ilk11[0]) : null;

  const satirlar=[
    {liste:kaleciler, y:88},
    {liste:defanslar, y:66},
    {liste:ortalar, y:44},
    {liste:forvetler, y:18},
  ];
  const konumlar=[];
  satirlar.forEach(s=>{
    const n=s.liste.length;
    s.liste.forEach((o,i)=>{
      const x = n===1?50 : 15+(70/(n-1))*i;
      konumlar.push({o, x, y:s.y});
    });
  });

  const pozRenk=(poz)=> poz==="Kaleci"?"#FBBF24":poz==="Defans"?"#5B8DEF":poz==="OrtaSaha"?T.accent:"#F87171";
  const pozYazi=(poz)=> poz==="Kaleci"?"#1A1505":poz==="Defans"?"#06204a":poz==="OrtaSaha"?"#06281d":"#4a0808";

  // TOP + AKTİF state (animasyon)
  const [topPos,setTopPos]=useState(konumlar.length?{x:konumlar[0].x,y:konumlar[0].y}:{x:50,y:50});
  const [iz,setIz]=useState(null); // pas izi {x1,y1,x2,y2,key}
  const [aktifIdx,setAktifIdx]=useState(-1);
  const [acilis,setAcilis]=useState(true); // açılış animasyonu sadece 1 kez
  const [secili,setSecili]=useState(null);  // tıklanan oyuncu (kart popup)
  const piRef=useRef(0);
  const prevRef=useRef(null);

  useEffect(()=>{
    // açılış animasyonunu bir kere oynat, sonra kapat
    const at=setTimeout(()=>setAcilis(false), 900);
    return ()=>clearTimeout(at);
  },[takim.id]);

  useEffect(()=>{
    if(konumlar.length<2) return;
    const tick=()=>{
      const idx=piRef.current%konumlar.length;
      const k=konumlar[idx];
      // pas izi: önceki konumdan yenisine
      if(prevRef.current){
        setIz({x1:prevRef.current.x, y1:prevRef.current.y, x2:k.x, y2:k.y, key:Date.now()});
      }
      setTopPos({x:k.x,y:k.y});
      setTimeout(()=>{ setAktifIdx(idx); },900);
      prevRef.current={x:k.x,y:k.y};
      piRef.current++;
    };
    const t0=setTimeout(tick,1000);
    const iv=setInterval(tick,1700);
    return ()=>{ clearTimeout(t0); clearInterval(iv); };
  },[takim.id, konumlar.length]);

  let globalIdx=-1;

  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
      <span style={{fontSize:11,color:T.accent,fontWeight:700}}>⚽ {otomatik?"İLK 11 (otomatik)":"SON MAÇ KADROSU"}</span>
      <span style={{fontSize:11,color:T.gold,fontWeight:600}}>{dizilisAd} · {kisiSayi} kişi</span>
    </div>
    <div style={{position:"relative",width:"100%",paddingBottom:"125%",borderRadius:12,overflow:"hidden",background:"repeating-linear-gradient(180deg,#1a5c2e 0 9%,#175227 9% 18%)"}}>
      <div style={{position:"absolute",inset:0,opacity:.22}}>
        <div style={{position:"absolute",top:"50%",left:0,right:0,height:1,background:"#fff"}}/>
        <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:58,height:58,borderRadius:"50%",border:"1px solid #fff"}}/>
        <div style={{position:"absolute",bottom:0,left:"25%",right:"25%",height:"13%",border:"1px solid #fff",borderBottom:"none"}}/>
        <div style={{position:"absolute",top:0,left:"25%",right:"25%",height:"13%",border:"1px solid #fff",borderTop:"none"}}/>
      </div>
      {iz && <svg key={iz.key} style={{position:"absolute",inset:0,width:"100%",height:"100%",zIndex:4,pointerEvents:"none"}} preserveAspectRatio="none" viewBox="0 0 100 100">
        <line x1={iz.x1} y1={iz.y1} x2={iz.x2} y2={iz.y2} stroke={T.accent} strokeWidth="0.8" strokeLinecap="round" style={{animation:"pasIz 1.1s ease-out forwards"}}/>
      </svg>}
      <div style={{position:"absolute",left:`calc(${topPos.x}% - 6px)`,top:`calc(${topPos.y}% - 6px)`,width:12,height:12,borderRadius:"50%",background:"radial-gradient(circle at 35% 35%,#fff,#aaa)",boxShadow:"0 0 8px 2px #ffffff88,0 2px 5px rgba(0,0,0,.5)",zIndex:5,transition:"left 1.1s cubic-bezier(.45,0,.25,1),top 1.1s cubic-bezier(.45,0,.25,1)"}}/>
      <div style={{position:"absolute",inset:0}}>
        {satirlar.map(s=>{
          const n=s.liste.length;
          return s.liste.map((o,i)=>{
            globalIdx++;
            const idx=globalIdx;
            const x = n===1?50 : 15+(70/(n-1))*i;
            const renk=pozRenk(o.poz);
            const aktif = idx===aktifIdx;
            const isKaptan = kaptan && o.id===kaptan.id;
            return <div key={o.id} onClick={()=>setSecili(o)}
              className={"tap"+(acilis?" saha-oyuncu":"")} style={{position:"absolute",left:x+"%",top:s.y+"%",transform:"translate(-50%,-50%)",display:"flex",flexDirection:"column",alignItems:"center",cursor:"pointer",zIndex:aktif?6:3,animationDelay:(idx*0.07)+"s"}}>
              <div style={{position:"relative"}}>
                {aktif && <div style={{position:"absolute",top:"50%",left:"50%",width:34,height:34,borderRadius:"50%",border:"2px solid "+T.accent,transform:"translate(-50%,-50%)",animation:"sahaDalga .6s ease-out",pointerEvents:"none"}}/>}
                {isKaptan && <div style={{position:"absolute",top:-4,right:-6,width:14,height:14,borderRadius:"50%",background:T.gold,color:"#1A1505",fontSize:8,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",zIndex:4,border:"1.5px solid "+T.bg0}}>C</div>}
                <div style={{width:34,height:34,borderRadius:"50%",overflow:"hidden",border:"2px solid "+renk,transition:"transform .35s, box-shadow .35s",transform:aktif?"scale(1.3)":"scale(1)",boxShadow:aktif?"0 0 16px 4px "+T.accent:"none"}} dangerouslySetInnerHTML={{__html:svgAvatar(o.ad,34,o.foto)}}/>
              </div>
              <div style={{fontSize:8,color:"#fff",fontWeight:600,marginTop:3,textShadow:"0 1px 2px #000",whiteSpace:"nowrap"}}>{o.ad.split(" ")[0]}</div>
              <div style={{fontSize:8,background:renk,color:pozYazi(o.poz),fontWeight:700,borderRadius:3,padding:"0 5px",marginTop:1}}>#{o.no}</div>
            </div>;
          });
        })}
      </div>
    </div>
    <div style={{display:"flex",justifyContent:"center",gap:10,marginTop:8,fontSize:9,color:T.textMut,flexWrap:"wrap"}}>
      <span><span style={{display:"inline-block",width:8,height:8,borderRadius:2,background:"#FBBF24",marginRight:3}}/>Kaleci</span>
      <span><span style={{display:"inline-block",width:8,height:8,borderRadius:2,background:"#5B8DEF",marginRight:3}}/>Defans</span>
      <span><span style={{display:"inline-block",width:8,height:8,borderRadius:2,background:T.accent,marginRight:3}}/>Orta</span>
      <span><span style={{display:"inline-block",width:8,height:8,borderRadius:2,background:"#F87171",marginRight:3}}/>Forvet</span>
      <span><b style={{color:T.gold}}>C</b> Kaptan</span>
    </div>

    {/* KART POPUP - tıklayınca açılır */}
    {secili && <div onClick={()=>setSecili(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.72)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999,padding:20}}>
      <div onClick={e=>e.stopPropagation()} className="pop" style={{width:230,maxWidth:"100%"}}>
        <div style={{position:"relative",background:"linear-gradient(160deg,#1a4d3a,#0d2a20 65%,#06140f)",border:"2px solid "+T.accent,borderRadius:18,padding:"18px 16px",overflow:"hidden"}}>
          <div className="saha-holo" style={{position:"absolute",inset:0,borderRadius:18,pointerEvents:"none"}}/>
          <div style={{position:"relative",zIndex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:26,fontWeight:800,color:T.accent,lineHeight:.9}}>{secili.ovr}</div>
                <div style={{fontSize:10,color:T.accent,fontWeight:700}}>{secili.poz==="Kaleci"?"GK":secili.poz==="Defans"?"DEF":secili.poz==="OrtaSaha"?"ORT":"FOR"}</div>
                <div style={{fontSize:10,color:"#fff",marginTop:3}}>#{secili.no}{kaptan&&secili.id===kaptan.id?" Ⓒ":""}</div>
              </div>
              <div style={{width:60,height:60,borderRadius:"50%",overflow:"hidden",border:"2px solid "+T.accent+"88"}} dangerouslySetInnerHTML={{__html:svgAvatar(secili.ad,60,secili.foto)}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:15,fontWeight:800,color:T.accent,textTransform:"uppercase",lineHeight:1.1}}>{secili.ad}</div>
                <div style={{fontSize:10,color:"#9fd",marginTop:2}}>{takim.ad}</div>
              </div>
            </div>
            <div style={{borderTop:"1px solid "+T.accent+"55",paddingTop:10}}>
              {[["HIZ",secili.pac],["ŞUT",secili.sho],["PAS",secili.pas],["DRİ",secili.dri],["DEF",secili.def],["FİZ",secili.phy]].map(([k,v])=>
                <div key={k} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                  <span style={{fontSize:10,color:"#aab",width:30}}>{k}</span>
                  <div style={{flex:1,height:7,background:"#1A2233",borderRadius:4,overflow:"hidden"}}><div className="bar-grow" style={{height:"100%",width:v+"%",background:v>=80?T.accent:v>=60?T.accent2:T.gold,borderRadius:4}}/></div>
                  <span style={{fontSize:11,color:"#fff",fontWeight:700,width:22,textAlign:"right"}}>{v}</span>
                </div>
              )}
            </div>
            <button onClick={()=>{const o=secili;setSecili(null);git({sayfa:"oyuncu",oyuncu:{...o,takimAd:takim.ad,turnuva:turnuva.ad,_adaylar:takim.oyuncular}});}} className="tap" style={{width:"100%",marginTop:10,background:T.accent,color:T.bg0,border:0,borderRadius:10,padding:10,fontSize:12,fontWeight:700}}>Profile Git →</button>
          </div>
        </div>
      </div>
    </div>}
  </div>;
}

function Donut({dilimler, T, boy=110}){
  const toplam=dilimler.reduce((s,d)=>s+d.deger,0)||1;
  let aci=0; const r=boy/2-6, cx=boy/2, cy=boy/2;
  const yaylar=dilimler.map(d=>{
    const oran=d.deger/toplam; const bas=aci; aci+=oran*360;
    const x1=cx+r*Math.cos((bas-90)*Math.PI/180), y1=cy+r*Math.sin((bas-90)*Math.PI/180);
    const x2=cx+r*Math.cos((aci-90)*Math.PI/180), y2=cy+r*Math.sin((aci-90)*Math.PI/180);
    const buyuk=oran>0.5?1:0;
    return {d:`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${buyuk} 1 ${x2} ${y2} Z`, renk:d.renk};
  });
  return <svg width={boy} height={boy}>
    {yaylar.map((y,i)=><path key={i} className="pop" d={y.d} fill={y.renk}/>)}
    <circle cx={cx} cy={cy} r={r*0.55} fill={T.bg1}/>
    <text x={cx} y={cy} fontSize="16" fontWeight="800" fill={T.text} textAnchor="middle" dominantBaseline="central">{toplam}</text>
  </svg>;
}

/* Gol krallığı podyumu */
function Podyum({liste, T}){
  const ilk3=liste.slice(0,3);
  const siralama=[ilk3[1],ilk3[0],ilk3[2]].filter(Boolean);
  const yuk=[58,80,44]; const madalya=["🥈","🥇","🥉"]; const idx=[1,0,2];
  return <div style={{display:"flex",alignItems:"flex-end",justifyContent:"center",gap:8}}>
    {siralama.map((o,i)=> o &&
      <div key={o.id} style={{display:"flex",flexDirection:"column",alignItems:"center",flex:1}}>
        <div className={i===1?"vav-suzul":""} style={{width:36,height:36,borderRadius:"50%",overflow:"hidden",border:(i===1?"2.5px solid "+T.gold:"2px solid "+T.gold),marginBottom:4,boxShadow:i===1?"0 0 14px "+T.gold+"88":"none"}} dangerouslySetInnerHTML={{__html:svgAvatar(o.ad,36,o.foto)}}/>
        <div style={{fontSize:10,color:T.text,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:"100%"}}>{o.ad.split(" ")[0]}</div>
        <div className={i===1?"vav-parla":""} style={{fontSize:9,color:i===1?T.gold:T.accent,fontWeight:i===1?800:400}}>{o.gol} gol</div>
        <div className={"bar-grow"+(i===1?" vav-bar":"")} style={{width:"100%",height:yuk[i],background:i===1?`linear-gradient(180deg,${T.gold},${T.gold}cc)`:T.bg2,borderRadius:"6px 6px 0 0",marginTop:4,display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:4,transformOrigin:"bottom",boxShadow:i===1?"0 -4px 18px "+T.gold+"55":"none"}}>
          <span style={{fontSize:i===1?19:16}}>{madalya[i]}</span>
        </div>
      </div>
    )}
  </div>;
}

/* Sezon ısı haritası (hafta hafta sonuç) */
function IsiHarita({form, T}){
  const renk=(f)=> f==="G"?T.accent : f==="M"?T.danger : T.gold;
  return <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
    {form.map((f,i)=>
      <div key={i} className="pop" title={f} style={{width:22,height:22,borderRadius:5,background:renk(f),display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#fff"}}>{f}</div>
    )}
  </div>;
}


/* ============================================================
   SAYFALAR
   ============================================================ */
function Baslik({ust, ana, T, ikon}){
  return <div style={{padding:"12px 14px 8px"}}>
    <div style={{position:"relative",overflow:"hidden",borderRadius:16,padding:"14px 16px",border:"1px solid "+T.line,
      background:"radial-gradient(120% 160% at 92% 0%,"+T.accent+"22,transparent 55%), linear-gradient(160deg,"+T.bg1+","+T.bg0+" 80%)"}}>
      <div style={{position:"relative",display:"flex",alignItems:"center",gap:11}}>
        {ikon && <div style={{width:40,height:40,borderRadius:12,flexShrink:0,background:T.accent+"1e",border:"1px solid "+T.accent+"3a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{ikon}</div>}
        <div style={{minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:7}}>
            <span style={{width:14,height:2,borderRadius:2,background:T.accent}}/>
            <span style={{fontSize:10.5,color:T.accent,letterSpacing:1,fontWeight:800}}>{ust}</span>
          </div>
          <div style={{fontSize:21,fontWeight:800,color:T.text,fontFamily:T.fontDisplay,marginTop:4,lineHeight:1.1}}>{ana}</div>
        </div>
      </div>
    </div>
  </div>;
}

/* ANA SAYFA — tüm turnuvaların enleri */
function EnKart({et, o, deg, br, renk, T, takim, onClick}){
  if(!o) return <div style={{background:T.bg1,border:"0.5px solid "+T.line,borderRadius:11,padding:11,opacity:.5}}>
    <div style={{fontSize:9,color:T.textMut,fontWeight:700,marginBottom:8}}>{et}</div>
    <div style={{fontSize:11,color:T.textMut}}>henüz veri yok</div>
  </div>;
  return <div onClick={onClick} className="kart-hover" style={{background:T.bg1,border:"0.5px solid "+T.line,borderRadius:11,padding:11}}>
    <div style={{fontSize:9,color:T.textMut,fontWeight:700,marginBottom:8}}>{et}</div>
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      {takim ? <Logo renk={o.renk} ad={o.ad} logo={o.logo} renk2={o.renk2} boy={30}/> : <div style={{width:30,height:30,borderRadius:"50%",overflow:"hidden",flexShrink:0}} dangerouslySetInnerHTML={{__html:svgAvatar(o.ad,30,o.foto)}}/>}
      <div style={{flex:1,minWidth:0}}><div style={{fontSize:12,color:T.text,fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{o.ad}</div><div style={{fontSize:9,color:T.textMut,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{takim?(o.turnuva||""):(o.takimAd||o.turnuva||"")}</div></div>
    </div>
    <div style={{fontSize:20,fontWeight:800,color:renk,fontFamily:T.fontDisplay,marginTop:6}}>{deg}{br&&<span style={{fontSize:10,color:T.textMut,fontWeight:400}}> {br}</span>}</div>
  </div>;
}

