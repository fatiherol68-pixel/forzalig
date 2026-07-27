function MEDYA_ALGILA(url){
  if(url==null) return null;
  var u=String(url).trim(); if(!u) return null;
  var L=u.toLowerCase();
  if(L.indexOf("youtu")>=0){
    var yt=u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|live\/|embed\/|shorts\/|v\/))([A-Za-z0-9_-]{6,})/);
    var id=yt?yt[1]:null;
    return {platform:"youtube", ad:"YouTube", ik:"▶️", embed:id?("https://www.youtube-nocookie.com/embed/"+id):null, dis:u};
  }
  if(L.indexOf("facebook.com")>=0 || L.indexOf("fb.watch")>=0)
    return {platform:"facebook", ad:"Facebook", ik:"📘", embed:"https://www.facebook.com/plugins/video.php?show_text=false&href="+encodeURIComponent(u), dis:u};
  if(L.indexOf("instagram.com")>=0){
    var ig=u.match(/instagram\.com\/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/);
    return {platform:"instagram", ad:"Instagram", ik:"📸", embed:ig?("https://www.instagram.com/reel/"+ig[1]+"/embed/"):null, dis:u};
  }
  if(L.indexOf("tiktok.com")>=0){
    var tk=u.match(/tiktok\.com\/@[A-Za-z0-9_.\-]+\/video\/(\d+)/) || u.match(/tiktok\.com\/.*?\/(\d{8,})/) || u.match(/vm\.tiktok\.com\/([A-Za-z0-9]+)/);
    var tid=tk?tk[1]:null;
    return {platform:"tiktok", ad:"TikTok", ik:"🎵", embed:(tid&&/^\d+$/.test(tid))?("https://www.tiktok.com/embed/v2/"+tid):null, dis:u};
  }
  if(/\.(mp4|webm|ogg|m3u8|mov)(\?|#|$)/i.test(u))
    return {platform:"mp4", ad:"Video", ik:"🎞️", embed:u, dis:u, direkt:true};
  return {platform:"link", ad:"Bağlantı", ik:"🔗", embed:null, dis:u};
}

/* Inline 16:9 oynatıcı: iframe embed / yerleşik <video> / "dışarıda aç" yedeği */
function MedyaOynatici({algi, canli, T}){
  var [oran,setOran]=useState(null); // mp4 gerçek en/boy (auto yön)
  if(!algi) return null;
  var u=(algi.dis||"").toLowerCase();
  var iframeDikey = algi.platform==="tiktok"
    || (algi.platform==="instagram" && u.indexOf("/reel")>=0)
    || (algi.platform==="youtube" && (u.indexOf("/shorts/")>=0))
    || (algi.platform==="facebook" && u.indexOf("/reel")>=0);
  var dikey = algi.direkt ? (oran!=null ? oran<0.95 : false) : iframeDikey;
  var cerceve = dikey
    ? {position:"relative", width:"100%", maxWidth:340, margin:"0 auto", aspectRatio:"9/16", maxHeight:"74vh", background:"#000", borderRadius:12, overflow:"hidden", border:"1px solid "+T.line}
    : {position:"relative", width:"100%", aspectRatio:"16/9", background:"#000", borderRadius:12, overflow:"hidden", border:"1px solid "+T.line};
  var ic;
  if(algi.direkt){
    ic = <video src={algi.embed} controls playsInline onLoadedMetadata={e=>{ try{ var v=e.target; if(v.videoWidth&&v.videoHeight) setOran(v.videoWidth/v.videoHeight); }catch(_){} }} style={{width:"100%",height:"100%",objectFit:"contain",background:"#000"}}/>;
  } else if(algi.embed){
    ic = <iframe src={algi.embed} title={algi.ad} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen frameBorder="0" style={{position:"absolute",inset:0,width:"100%",height:"100%",border:0}}/>;
  } else {
    ic = <a href={algi.dis} target="_blank" rel="noopener noreferrer" style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,color:T.text,textDecoration:"none"}}>
      <span style={{fontSize:34}}>{algi.ik}</span>
      <span style={{fontSize:13,fontWeight:700}}>{algi.ad}'da aç ↗</span>
      <span style={{fontSize:11,color:T.textMut}}>Bu içerik burada oynatılamıyor</span>
    </a>;
  }
  return <div>
    <div style={cerceve}>
      {canli && <span style={{position:"absolute",top:8,left:8,zIndex:2,fontSize:9,fontWeight:800,background:"#F4525A",color:"#fff",padding:"3px 8px",borderRadius:6,letterSpacing:.4}}>🔴 CANLI</span>}
      {ic}
    </div>
    <div style={{display:"flex",alignItems:"center",gap:8,marginTop:7,fontSize:11,color:T.textMut}}>
      <span>{algi.ik} {algi.ad}</span>
      <a href={algi.dis} target="_blank" rel="noopener noreferrer" style={{marginLeft:"auto",color:T.accent2||T.accent,fontWeight:700,textDecoration:"none"}}>↗ {algi.ad}'da aç</a>
    </div>
  </div>;
}

/* Akıllı buton + inline expand + (çoklu ise) segment sekme. Modal yok. */
function CanliYayin({m, T}){
  var medya = m.medya||{};
  var ham=[
    {k:"canli", et:"Canlı Yayın", ik:"📺", url:medya.canli, canli:!!medya.canliAcik},
    {k:"tamMac", et:"Tam Maç", ik:"🎬", url:medya.tamMac, canli:false},
    {k:"roportaj", et:"Röportaj", ik:"🎤", url:medya.roportaj, canli:false}
  ];
  var slotlar=ham.map(function(s){ return Object.assign({}, s, {algi: s.url?MEDYA_ALGILA(s.url):null}); }).filter(function(s){ return s.algi; });
  var canliVar = slotlar.filter(function(s){ return s.k==="canli" && s.canli; })[0];
  var [acik,setAcik]=useState(null);
  var kutuRef=useRef(null);
  useEffect(function(){ if(acik&&kutuRef.current){ var t=setTimeout(function(){ try{ kutuRef.current.scrollIntoView({behavior:"smooth",block:"center"}); }catch(e){} },140); return function(){ clearTimeout(t); }; } },[acik]);
  if(!slotlar.length){
    return <div style={{padding:"10px 14px 0"}}>
      <div className="tap" style={{width:"100%",padding:11,borderRadius:11,background:T.bg2,color:T.textMut,fontSize:13,fontWeight:700,border:"0.5px solid "+T.line,textAlign:"center",cursor:"default"}}>📺 Yayın yakında</div>
    </div>;
  }
  var acikSlot = acik ? slotlar.filter(function(s){ return s.k===acik; })[0] : null;
  var acKapa=function(){ setAcik(function(p){ return p? null : (canliVar?canliVar.k:slotlar[0].k); }); };
  var btnStil = canliVar
    ? {background:"linear-gradient(135deg,#F4525A,#C1121F)", color:"#fff", border:"1.5px solid #ff6b70"}
    : {background:(T.accent+"22"), color:T.accent, border:"1.5px solid "+T.accent+"66"};
  return <div style={{padding:"10px 14px 0"}} ref={kutuRef}>
    <button onClick={acKapa} className="tap" style={Object.assign({width:"100%",height:50,borderRadius:13,fontSize:15,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",gap:9}, btnStil)}>
      {canliVar && <span style={{width:9,height:9,borderRadius:"50%",background:"#fff",animation:"flPulse 1.3s infinite"}}></span>}
      {canliVar ? "🔴 Canlı Yayında" : "▶ Maçı İzle"}
      <span style={{marginLeft:6,fontSize:12,opacity:.8,transition:"transform .25s",transform:acik?"rotate(180deg)":"none"}}>▾</span>
    </button>
    {!acik && <div style={{display:"flex",gap:6,justifyContent:"center",marginTop:8,flexWrap:"wrap"}}>
      {slotlar.map(function(s){ return <span key={s.k} style={{fontSize:10.5,fontWeight:700,padding:"3px 9px",borderRadius:999,display:"inline-flex",alignItems:"center",gap:5,background:T.bg2,border:"1px solid "+T.line,color:T.soft||T.textSoft}}>
        <span style={{width:6,height:6,borderRadius:"50%",background:(s.canli?"#F4525A":T.accent)}}></span>{s.ik} {s.et}</span>; })}
    </div>}
    <div style={{maxHeight:acik?680:0, opacity:acik?1:0, overflow:"hidden", transition:"max-height .28s ease, opacity .28s ease", marginTop:acik?10:0}}>
      {slotlar.length>1 && <div style={{display:"flex",gap:6,marginBottom:9}}>
        {slotlar.map(function(s){ var on=acik===s.k; return <button key={s.k} onClick={function(){ setAcik(s.k); }} className="tap" style={{flex:1,height:38,borderRadius:10,fontSize:12,fontWeight:700,border:"1px solid "+(on?(s.canli?"#F4525A":T.accent):T.line),background:on?(s.canli?"#F4525A22":T.accent+"1e"):T.bg1,color:on?(s.canli?"#ff7a7f":T.accent):T.textMut,display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>{s.ik} {s.et}</button>; })}
      </div>}
      {acikSlot && <MedyaOynatici algi={acikSlot.algi} canli={acikSlot.canli} T={T}/>}
    </div>
  </div>;
}

/* Admin medya kartı — Skor Girişi içinde. Kontrollü: {medya, setMedya}. */
function MacMedyaKart({medya, setMedya, T}){
  var AC=T.accent2||"#5AA9E6";
  var [acik,setAcik]=useState(false);
  var doluSay=["canli","tamMac","roportaj"].filter(function(k){ return medya&&medya[k]; }).length;
  var alan=function(k,et,ik){
    var url=(medya&&medya[k])||"";
    var algi=url?MEDYA_ALGILA(url):null;
    return <div key={k} style={{marginBottom:10}}>
      <div style={{fontSize:11,fontWeight:700,color:T.textSoft,marginBottom:5,display:"flex",alignItems:"center",gap:6}}>{ik} {et}</div>
      <input value={url} onChange={function(e){ setMedya(Object.assign({}, medya, {[k]:e.target.value})); }} placeholder="Bağlantı yapıştır…" inputMode="url" style={{width:"100%",height:40,borderRadius:9,background:T.bg0,border:"1px solid "+(algi?AC+"66":T.line),padding:"0 11px",color:T.text,fontSize:12,outline:"none",fontFamily:"inherit"}}/>
      {algi && <div style={{fontSize:10.5,color:AC,marginTop:4,display:"flex",alignItems:"center",gap:5}}>✓ {algi.ik} {algi.ad} algılandı</div>}
      {k==="canli" && url && <div style={{display:"flex",alignItems:"center",gap:8,marginTop:7,fontSize:11.5,color:T.textSoft}}>
        <button onClick={function(){ setMedya(Object.assign({}, medya, {canliAcik:!(medya&&medya.canliAcik)})); }} className="tap" style={{width:38,height:22,borderRadius:22,border:"1px solid "+((medya&&medya.canliAcik)?"#ff6b70":T.line2||T.line),background:(medya&&medya.canliAcik)?"#F4525A":T.bg3||T.bg2,position:"relative",padding:0}}>
          <span style={{position:"absolute",top:1,left:(medya&&medya.canliAcik)?17:1,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left .16s"}}></span>
        </button>
        🔴 Şu an canlı
      </div>}
    </div>;
  };
  return <div style={{padding:"6px 14px 6px"}}>
    <div onClick={function(){ setAcik(function(a){ return !a; }); }} className="tap" style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",marginBottom:acik?10:0}}>
      <span style={{fontSize:12,fontWeight:700,color:T.text}}>🎥 Maç Medyası <span style={{color:T.textMut,fontWeight:400}}>{doluSay?("· "+doluSay+" bağlantı"):"(isteğe bağlı)"}</span></span>
      <span style={{color:T.accent,fontSize:13}}>{acik?"▲":"▼ aç"}</span>
    </div>
    {acik && <div style={{background:T.bg1,border:"1px solid "+T.line,borderRadius:12,padding:12}}>
      {alan("canli","Canlı Yayın Linki","📺")}
      {alan("tamMac","Tam Maç Linki","🎬")}
      {alan("roportaj","Röportaj Linki","🎤")}
      <div style={{fontSize:10.5,color:T.textMut,lineHeight:1.5,marginTop:2}}>YouTube · Facebook · Instagram · TikTok · MP4 — link yapıştır, platform otomatik algılanır.</div>
    </div>}
  </div>;
}

function SkorGir({mac:m, turnuva, T, git, skorKaydet}){
  const A=turnuva.takimlar.find(t=>t.id===m.takimAId)||turnuva.takimlar.find(t=>t.ad===m.takimA);
  const B=turnuva.takimlar.find(t=>t.id===m.takimBId)||turnuva.takimlar.find(t=>t.ad===m.takimB);
  const [sA,setSA]=useState(m.skorA!=null?String(m.skorA):"0");
  const [sB,setSB]=useState(m.skorB!=null?String(m.skorB):"0");
  const [olaylar,setOlaylar]=useState(m.olaylar?[...m.olaylar]:[]);
  const [mvp,setMvp]=useState(m.mvp||null);
  const [mvpId,setMvpId]=useState(m.mvpId||null);
  const [mvpTk,setMvpTk]=useState(m.mvpTakim||null);
  const [oduller,setOduller]=useState(m.oduller?{...m.oduller}:{});
  const [odullerId,setOdullerId]=useState(m.odullerId?{...m.odullerId}:{});
  const [odulAcik,setOdulAcik]=useState(false);
  const [dakikaAcik,setDakikaAcik]=useState(false);
  const AC=T.accent2||"#5AA9E6";

  const tumOyuncular=[...(A?A.oyuncular:[]),...(B?B.oyuncular:[])];
  // Player ID omurgası: seçim anında STABİL kimlik (player_id||id) yakalanır; isim gösterim için kalır (aynı isim karışmaz)
  const sid=(p)=>p?String(p.player_id||p.id):"";
  const idBulAd=(ad)=>{ const o=tumOyuncular.find(p=>p.ad===ad); return o?sid(o):null; };
  const olayEkle=(takim, tip)=> setOlaylar(p=>[...p,{oyuncu:"", oyuncuId:null, takim, tip, asist:null, asistId:null, dk:""}]);
  const olaySil=(i)=> setOlaylar(p=>p.filter((_,x)=>x!==i));
  const olayDegis=(i,alan,val)=> setOlaylar(p=>p.map((o,x)=>x===i?{...o,[alan]:val}:o));
  const olayCoklu=(i,obj)=> setOlaylar(p=>p.map((o,x)=>x===i?{...o,...obj}:o));
  // aynı oyuncuya hızlı +1 gol (hat-trick kolaylığı)
  const golTekrar=(o)=> setOlaylar(p=>[...p,{oyuncu:o.oyuncu, oyuncuId:o.oyuncuId||idBulAd(o.oyuncu), takim:o.takim, tip:"gol", asist:null, asistId:null, dk:""}]);
  const odulSec=(alan,id)=>{ const p=tumOyuncular.find(x=>sid(x)===String(id)); setOduller(o=>({...o,[alan]:p?p.ad:undefined})); setOdullerId(o=>({...o,[alan]:id||undefined})); };

  // ödül tanımları
  const ODULLER=[
    ["altin","🥇 Altın Futbolcu"],["gumus","🥈 Gümüş Futbolcu"],
    ["forvet","⚡ En İyi Forvet"],["ortasaha","⚙️ En İyi Orta Saha"],
    ["defans","🛡️ En İyi Defans"],["kaleci","🧤 En İyi Kaleci"],
    ["macinGolu","🎯 Maçın Golü"],["centilmen","🤝 Centilmen"],["enerjik","🔥 Enerjik"],
  ];

  const kaydet=()=>{
    const temiz=olaylar.filter(o=>o.oyuncu||o.oyuncuId).map(o=>{ const c={...o, dk: o.dk?parseInt(o.dk):null}; delete c._ao; return c; });
    skorKaydet(turnuva, m, parseInt(sA)||0, parseInt(sB)||0, temiz, mvp, mvpTk, oduller, {mvpId, odullerId});
    git({sayfa:"mac",mac:m,turnuva});
  };

  const OlayKutu=({o,i})=>{
    const takimAd=o.takim;
    const takim=takimAd===m.takimA?A:B;
    const tipEtiket={gol:"⚽",sari:"🟨",kirmizi:"🟥"}[o.tip];
    return <div style={{display:"flex",alignItems:"center",gap:5,background:T.bg2,borderRadius:9,padding:"7px 9px",marginBottom:6}}>
      <span style={{fontSize:16,minWidth:20,textAlign:"center"}}>{tipEtiket}</span>
      {dakikaAcik && <input value={o.dk||""} onChange={e=>olayDegis(i,"dk",e.target.value.replace(/[^0-9]/g,"").slice(0,3))} placeholder="dk'" inputMode="numeric" style={{width:52,height:44,textAlign:"center",background:T.bg1,border:"0.5px solid "+T.line,borderRadius:9,padding:"0 2px",color:T.text,fontSize:15,outline:"none",fontFamily:"inherit"}}/>}
      <select value={o.oyuncuId||(takim&&o.oyuncu?sid(takim.oyuncular.find(x=>x.ad===o.oyuncu)):"")} onChange={e=>{ const id=e.target.value; const p=(takim?takim.oyuncular:[]).find(x=>sid(x)===id); olayCoklu(i,{oyuncuId:id||null, oyuncu:p?p.ad:""}); }} style={{flex:1,minWidth:0,height:44,background:T.bg1,border:"0.5px solid "+T.line,borderRadius:9,padding:"0 10px",color:T.text,fontSize:15,fontWeight:600,outline:"none",fontFamily:"inherit"}}>
        <option value="">Oyuncu seç...</option>
        {(takim?takim.oyuncular:[]).map(p=><option key={p.id} value={sid(p)}>{p.ad}</option>)}
      </select>
      {o.tip==="gol" && (o.asist||o._ao
        ? <select value={o.asistId||(takim&&o.asist?sid(takim.oyuncular.find(x=>x.ad===o.asist)):"")} onChange={e=>{ const id=e.target.value; const p=(takim?takim.oyuncular:[]).find(x=>sid(x)===id); olayCoklu(i,{asistId:id||null, asist:p?p.ad:null}); }} style={{width:98,height:44,background:T.bg1,border:"0.5px solid "+AC+"55",borderRadius:9,padding:"0 8px",color:AC,fontSize:13,outline:"none",fontFamily:"inherit"}}>
          <option value="">🅰 yok</option>
          {(takim?takim.oyuncular:[]).map(p=><option key={p.id} value={sid(p)}>🅰 {p.ad.split(" ")[0]}</option>)}
        </select>
        : <button onClick={()=>olayCoklu(i,{_ao:true})} className="tap" style={{height:40,padding:"0 11px",borderRadius:9,background:AC+"1A",color:AC,border:"1px solid "+AC+"44",fontSize:13,fontWeight:700,whiteSpace:"nowrap"}}>🅰 asist</button>)}
      {o.tip==="gol" && o.oyuncu && <button onClick={()=>golTekrar(o)} className="tap" title="Aynı oyuncuya +1 gol" style={{color:T.accent,fontSize:13,fontWeight:800,background:T.accent+"22",border:"1px solid "+T.accent+"44",borderRadius:8,padding:"0 10px",height:40,whiteSpace:"nowrap"}}>+1</button>}
      <button onClick={()=>olaySil(i)} className="tap" style={{color:T.danger,fontSize:18,background:"none",border:"none",width:34,height:40}}>✕</button>
    </div>;
  };

  return <div className="fade-in" style={{paddingBottom:120}}>
    <Baslik ust="SKOR GİRİŞİ" ana={`${m.hafta}. Hafta`} T={T}/>

    {/* skor */}
    <div style={{margin:"4px 14px 12px",background:T.bg1,borderRadius:16,padding:"18px 14px",border:"0.5px solid "+T.line}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
        <div style={{flex:1,textAlign:"center"}}><Logo renk={m.renkA} ad={m.takimA} boy={42}/><div style={{fontSize:12,fontWeight:600,color:T.text,marginTop:6}}>{m.takimA}</div></div>
        <input value={sA} onChange={e=>setSA(e.target.value.replace(/[^0-9]/g,""))} style={{width:50,textAlign:"center",fontSize:30,fontWeight:800,fontFamily:T.fontDisplay,background:T.bg0,border:"1.5px solid "+T.line,borderRadius:10,color:T.text,outline:"none",padding:"6px 0"}}/>
        <span style={{fontSize:24,color:T.textMut}}>-</span>
        <input value={sB} onChange={e=>setSB(e.target.value.replace(/[^0-9]/g,""))} style={{width:50,textAlign:"center",fontSize:30,fontWeight:800,fontFamily:T.fontDisplay,background:T.bg0,border:"1.5px solid "+T.line,borderRadius:10,color:T.text,outline:"none",padding:"6px 0"}}/>
        <div style={{flex:1,textAlign:"center"}}><Logo renk={m.renkB} ad={m.takimB} boy={42}/><div style={{fontSize:12,fontWeight:600,color:T.text,marginTop:6}}>{m.takimB}</div></div>
      </div>
    </div>

    {/* dakika toggle (isteğe bağlı) */}
    <div style={{padding:"0 14px 10px"}}>
      <button onClick={()=>setDakikaAcik(v=>!v)} className="tap" style={{width:"100%",height:44,borderRadius:12,background:dakikaAcik?T.accent+"18":T.bg1,color:dakikaAcik?T.accent:T.textMut,fontSize:13,fontWeight:700,border:"1px solid "+(dakikaAcik?T.accent+"55":T.line),display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>{dakikaAcik?"⏱ Dakika alanı açık — kapat":"⏱ Dakikaları gir (isteğe bağlı)"}</button>
    </div>

    {/* olaylar — A takımı */}
    <div style={{padding:"0 14px 6px"}}>
      <div style={{fontSize:12,fontWeight:700,color:T.text,marginBottom:8}}>{m.takimA}</div>
      {olaylar.map((o,i)=> o.takim===m.takimA && <OlayKutu key={i} o={o} i={i}/>)}
      <div style={{marginBottom:14}}>
        <button onClick={()=>olayEkle(m.takimA,"gol")} className="tap" style={{width:"100%",height:48,borderRadius:12,background:T.accent+"22",color:T.accent,fontSize:15,fontWeight:800,border:"1.5px solid "+T.accent+"55",marginBottom:8}}>＋ ⚽ Gol ekle</button>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>olayEkle(m.takimA,"sari")} className="tap" style={{flex:1,height:42,borderRadius:11,background:"#E0A80018",color:"#E0A800",fontSize:13,fontWeight:700,border:"1px solid #E0A80044"}}>🟨 Sarı</button>
          <button onClick={()=>olayEkle(m.takimA,"kirmizi")} className="tap" style={{flex:1,height:42,borderRadius:11,background:T.danger+"18",color:T.danger,fontSize:13,fontWeight:700,border:"1px solid "+T.danger+"44"}}>🟥 Kırmızı</button>
        </div>
      </div>
    </div>

    {/* olaylar — B takımı */}
    <div style={{padding:"0 14px 6px"}}>
      <div style={{fontSize:12,fontWeight:700,color:T.text,marginBottom:8}}>{m.takimB}</div>
      {olaylar.map((o,i)=> o.takim===m.takimB && <OlayKutu key={i} o={o} i={i}/>)}
      <div style={{marginBottom:14}}>
        <button onClick={()=>olayEkle(m.takimB,"gol")} className="tap" style={{width:"100%",height:48,borderRadius:12,background:T.accent+"22",color:T.accent,fontSize:15,fontWeight:800,border:"1.5px solid "+T.accent+"55",marginBottom:8}}>＋ ⚽ Gol ekle</button>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>olayEkle(m.takimB,"sari")} className="tap" style={{flex:1,height:42,borderRadius:11,background:"#E0A80018",color:"#E0A800",fontSize:13,fontWeight:700,border:"1px solid #E0A80044"}}>🟨 Sarı</button>
          <button onClick={()=>olayEkle(m.takimB,"kirmizi")} className="tap" style={{flex:1,height:42,borderRadius:11,background:T.danger+"18",color:T.danger,fontSize:13,fontWeight:700,border:"1px solid "+T.danger+"44"}}>🟥 Kırmızı</button>
        </div>
      </div>
    </div>

    {/* MVP */}
    <div style={{padding:"0 14px 6px"}}>
      <div style={{fontSize:12,fontWeight:700,color:T.gold,marginBottom:8}}>⭐ Maçın Yıldızı</div>
      <select value={mvpId||(mvp?sid(tumOyuncular.find(p=>p.ad===mvp)):"")} onChange={e=>{ const id=e.target.value; const o=tumOyuncular.find(p=>sid(p)===id); setMvpId(id||null); setMvp(o?o.ad:null); setMvpTk(o?(A&&A.oyuncular.includes(o)?m.takimA:m.takimB):null); }}
        style={{width:"100%",background:T.bg1,border:"0.5px solid "+T.gold+"55",borderRadius:10,padding:"10px",color:T.text,fontSize:13,outline:"none",fontFamily:"inherit"}}>
        <option value="">MVP seç...</option>
        {tumOyuncular.map(p=><option key={p.id} value={sid(p)}>{p.ad}</option>)}
      </select>
    </div>

    {/* MAÇ ÖDÜLLERİ */}
    <div style={{padding:"6px 14px 6px"}}>
      <div onClick={()=>setOdulAcik(a=>!a)} className="tap" style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",marginBottom:odulAcik?10:0}}>
        <span style={{fontSize:12,fontWeight:700,color:T.text}}>🏅 Maç Ödülleri <span style={{color:T.textMut,fontWeight:400}}>(isteğe bağlı)</span></span>
        <span style={{color:T.accent,fontSize:13}}>{odulAcik?"▲":"▼ aç"}</span>
      </div>
      {odulAcik && <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {ODULLER.map(([alan,etiket])=>
          <div key={alan}>
            <div style={{fontSize:10,color:T.textMut,marginBottom:3,fontWeight:600}}>{etiket}</div>
            <select value={odullerId[alan]||(oduller[alan]?sid(tumOyuncular.find(p=>p.ad===oduller[alan])):"")} onChange={e=>odulSec(alan,e.target.value)} style={{width:"100%",background:T.bg1,border:"0.5px solid "+T.line,borderRadius:8,padding:"7px",color:oduller[alan]?T.text:T.textMut,fontSize:11,outline:"none",fontFamily:"inherit"}}>
              <option value="">— yok —</option>
              {tumOyuncular.map(p=><option key={p.id} value={sid(p)}>{p.ad}</option>)}
            </select>
          </div>
        )}
      </div>}
    </div>

    {/* kaydet */}
    <div style={{position:"fixed",bottom:0,left:0,right:0,maxWidth:1080,margin:"0 auto",padding:"10px 14px calc(10px + env(safe-area-inset-bottom))",background:T.bg0+"F2",borderTop:"0.5px solid "+T.line,display:"flex",gap:8,zIndex:30}}>
      <button onClick={()=>git({sayfa:"mac",mac:m,turnuva})} className="tap" style={{padding:"13px 18px",borderRadius:11,background:"transparent",color:T.textMut,fontSize:13,fontWeight:700,border:"1px solid "+T.line}}>İptal</button>
      <button onClick={kaydet} className="tap" style={{flex:1,padding:"13px",borderRadius:11,background:T.accent,color:T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0,fontSize:14,fontWeight:800}}>💾 Skoru Kaydet</button>
    </div>
  </div>;
}

/* ============================================================
   FAZ 5 — MAÇ GAZETESİ (premium spor gazetesi)
   ============================================================ */
/* ============================================================
   MAÇ GAZETESİ — DİNAMİK GÖRÜNÜM SİSTEMİ
   - Tek veri modeli (gazeteVeri) + tek analiz motoru (gazeteAnaliz).
   - N görünüm bileşeni; yeni görünüm = 1 bileşen + GZ_GORUNUMLER'e 1 kayıt.
   - İçerik maç verisine göre dinamik uzar/kısalır; premium dergi hissi.
   - Yetki: Süper Admin / Lig Yöneticisi / Üye (panelde role göre kontrol).
   - Marka: her görünümde ForzaLig watermark + görünür logo.
   ============================================================ */

// ---- kalıcılık ----
var GZ_SIS_KEY="fz_gz_sistem";   // {varsayilan, kapali:[id]}  — süper admin (cihaz)
var GZ_USR_KEY="fz_gz_gorunum";  // son seçilen görünüm — kullanıcı (cihaz)
function gzSisOku(){ try{ return JSON.parse(localStorage.getItem(GZ_SIS_KEY))||{}; }catch(e){ return {}; } }
function gzSisYaz(o){ try{ localStorage.setItem(GZ_SIS_KEY, JSON.stringify(o||{})); }catch(e){} }
function gzUsrOku(){ try{ return localStorage.getItem(GZ_USR_KEY)||""; }catch(e){ return ""; } }
function gzUsrYaz(id){ try{ if(id) localStorage.setItem(GZ_USR_KEY, id); }catch(e){} }

// ---- ortak veri modeli (tüm görünümler bunu alır) ----
function gazeteVeri(m, turnuva, tohum){
  var sA=m.skorA||0, sB=m.skorB||0;
  var galip=sA>sB?m.takimA:(sB>sA?m.takimB:null);
  var goller=(m.olaylar||[]).filter(function(o){return o.tip==="gol";});
  var seed=(m.id||1)*2654435761>>>0;
  var det=function(n){ var x=(seed+n*40503)>>>0; x=(x^(x>>>13))*0xC2B2AE35>>>0; return (x>>>0)/4294967296; };
  var dk=goller.map(function(g,i){return (g.dk!=null&&g.dk!=="")?parseInt(g.dk):1+Math.floor(det(i+1)*58);});
  var golKron=goller.map(function(g,i){return Object.assign({},g,{dk:dk[i]});}).sort(function(a,b){return a.dk-b.dk;});
  var olayKron=(m.olaylar||[]).map(function(o,i){return Object.assign({},o,{dk:(o.dk!=null&&o.dk!=="")?parseInt(o.dk):1+Math.floor(det(i+50)*58)});}).sort(function(a,b){return a.dk-b.dk;});
  var golSay={}; goller.forEach(function(g){golSay[g.oyuncu]=(golSay[g.oyuncu]||0)+1;});
  var yildiz=m.mvp||((Object.entries(golSay).sort(function(a,b){return b[1]-a[1];})[0])||["",0])[0];
  var aGoller=golKron.filter(function(g){return g.takim===m.takimA;});
  var bGoller=golKron.filter(function(g){return g.takim===m.takimB;});
  var ODUL_TANIM=[["altin","Altın"],["gumus","Gümüş"],["macinGolu","Maçın Golü"],["forvet","Forvet"],["ortasaha","Orta Saha"],["defans","Defans"],["kaleci","Kaleci"],["enerjik","Enerjik"],["centilmen","Centilmen"]];
  var od=m.oduller||{}; var oduller=[]; if(m.mvp) oduller.push(["Yıldız",m.mvp]);
  ODUL_TANIM.forEach(function(p){ if(od[p[0]]) oduller.push([p[1],od[p[0]]]); });
  var ratingArr=m.ratingler?Object.entries(m.ratingler).sort(function(a,b){return b[1]-a[1];}).slice(0,6):[];
  var puanTablo=(turnuva&&turnuva.takimlar)?turnuva.takimlar.slice().sort(function(a,b){return b.puan-a.puan||(b.ag-b.yg)-(a.ag-a.yg);}).slice(0,6):[];
  var manset=mansetUret(m,tohum);
  var yorum=macYorumUret(m,turnuva,tohum);
  return { m:m, turnuva:turnuva, sA:sA, sB:sB, galip:galip, goller:goller, golKron:golKron, olayKron:olayKron,
    golSay:golSay, yildiz:yildiz, aGoller:aGoller, bGoller:bGoller, oduller:oduller.slice(0,6), ratingArr:ratingArr,
    puanTablo:puanTablo, manset:manset, yorumParcalar:Array.isArray(yorum)?yorum:[yorum],
    ist:m.istatistik, tarih:m.tarih||new Date().toLocaleDateString("tr-TR"), lg:turnuva?turnuva.ad:"", hafta:m.hafta,
    renkA:m.renkA, renkB:m.renkB, takimA:m.takimA, takimB:m.takimB,
    mvpRating:(m.ratingler&&m.mvp&&m.ratingler[m.mvp])?m.ratingler[m.mvp]:null };
}

// ---- analiz motoru: dönüm noktaları + taktik + öne çıkanlar + istatistik + lig etkisi ----
function gazeteAnaliz(v){
  var m=v.m, A=v.takimA, B=v.takimB, sA=v.sA, sB=v.sB, galip=v.galip;
  var maglup=galip?(galip===A?B:A):null, fark=Math.abs(sA-sB), toplam=sA+sB;
  var gol=v.golKron;
  var ca=0,cb=0,akis=[];
  gol.forEach(function(g){ if(g.takim===A)ca++; else cb++; akis.push({dk:g.dk,oyuncu:g.oyuncu,takim:g.takim,ca:ca,cb:cb,fark:ca-cb}); });

  // ---- DÖNÜM NOKTALARI ----
  var donum=[];
  if(akis.length){
    var ilk=akis[0];
    donum.push({dk:ilk.dk,tip:"acilis",metin:(ilk.takim)+" buzu kırdı — "+ilk.oyuncu+" skoru açtı ("+ilk.ca+"-"+ilk.cb+")."});
    var koptu=null; for(var i=0;i<akis.length;i++){ if(Math.abs(akis[i].fark)>=2){ koptu=akis[i]; break; } }
    if(koptu) donum.push({dk:koptu.dk,tip:"kopus",metin:(koptu.fark>0?A:B)+" farkı ikiye taşıdı; maç bu golle koptu ("+koptu.ca+"-"+koptu.cb+")."});
    var prev=0;
    akis.forEach(function(k,ix){ var sg=k.fark>0?1:k.fark<0?-1:0;
      if(ix>0){ if(sg===0&&prev!==0) donum.push({dk:k.dk,tip:"esitlik",metin:k.oyuncu+" eşitliği yakaladı ("+k.ca+"-"+k.cb+")."});
        else if(sg!==0&&prev!==0&&sg!==prev) donum.push({dk:k.dk,tip:"donus",metin:(sg>0?A:B)+" öne geçti — "+k.oyuncu+" perdeyi çevirdi ("+k.ca+"-"+k.cb+")."}); }
      prev=sg; });
    var son=gol[gol.length-1];
    if(galip&&son.dk>=50&&fark===1&&son.takim===galip) donum.push({dk:son.dk,tip:"final",metin:son.oyuncu+" son bölümde fişi çekti; "+galip+" nefesleri tuttu ("+son.dk+"')."});
  }
  (v.olayKron||[]).filter(function(o){return o.tip==="kirmizi";}).forEach(function(k){ donum.push({dk:k.dk,tip:"kirmizi",metin:(k.oyuncu||"Bir oyuncu")+" kırmızı gördü; "+(k.takim)+" sayıca eksik kaldı."}); });
  donum.sort(function(a,b){return a.dk-b.dk;});
  var gr={}; donum=donum.filter(function(d){var key=d.dk+"_"+d.tip; if(gr[key])return false; gr[key]=1; return true;});

  // ---- TAKTİK DEĞERLENDİRME ----
  var ist=v.ist, taktik=[];
  if(ist&&ist.sahiplikA!=null){
    var hakim=ist.sahiplikA>ist.sahiplikB?A:B, hy=Math.max(ist.sahiplikA,ist.sahiplikB);
    if(galip&&hakim!==galip&&hy>=55) taktik.push({b:"Verimlilik kazandı",m:hakim+" topu daha çok tuttu (%"+hy+") ama sonucu "+galip+" yazdı; az pozisyonu değere çevirmesini bildi."});
    else if(galip&&hakim===galip&&hy>=57) taktik.push({b:"Oyunu ele aldı",m:galip+" hem topa sahip oldu (%"+hy+") hem sonucu aldı; baştan sona kontrollü bir üstünlük."});
    else if(!galip) taktik.push({b:"Orta sahada denge",m:"Topa sahip olma neredeyse eşitti (%"+ist.sahiplikA+" - %"+ist.sahiplikB+"); iki taraf da üstünlüğü kalıcı kılamadı."});
  }
  if(ist&&ist.sutA!=null){
    var vA=(sA>0&&ist.sutA)?Math.round(sA/ist.sutA*100):0, vB=(sB>0&&ist.sutB)?Math.round(sB/ist.sutB*100):0;
    var etkili=vA>=vB?A:B, ev=Math.max(vA,vB);
    if(ev>=25) taktik.push({b:"Şutta soğukkanlılık",m:etkili+" bulduğu az sayıda net pozisyonu çok iyi değerlendirdi (gol/şut verimi ~%"+ev+")."});
  }
  if(galip&&(galip===A?sB:sA)===0&&toplam>0) taktik.push({b:"Arka kapı kapalı",m:galip+" kalesini gole kapattı; savunma hattı doksan dakika ayakta kaldı."});
  if(fark>=3) taktik.push({b:"Tek taraflı tablo",m:galip+" ritmi baştan kurdu; "+maglup+" oyuna ortak olamadan fark açıldı."});
  else if(fark===1&&galip) taktik.push({b:"Detayların maçı",m:"Tek gol her şeyi belirledi; "+galip+" kritik anı doğru okudu, "+maglup+" son vuruşta eksik kaldı."});
  else if(!galip&&toplam===0) taktik.push({b:"Savunmalar kazandı",m:"Goller küstü; iki savunma da rakip hücumu geçit vermeden söndürdü."});
  var kaleciAd=(m.oduller&&m.oduller.kaleci)?m.oduller.kaleci:null;
  var krec=kaleciAd?(m.kaleciler||[]).find(function(k){return k.ad===kaleciAd;}):null;
  if(krec&&krec.kurtaris>=4) taktik.push({b:"Kaleci duvarı",m:kaleciAd+" "+krec.kurtaris+" kurtarışla arkada güven verdi; skorun asıl bekçisiydi."});
  taktik=taktik.slice(0,4);

  // ---- ÖNE ÇIKAN OYUNCULAR ----
  var oyuncular=[], eklendi={};
  var rat=function(ad){ return (m.ratingler&&m.ratingler[ad]!=null)?m.ratingler[ad]:null; };
  var pushOy=function(ad,et,satir){ if(!ad||eklendi[ad])return; eklendi[ad]=1; oyuncular.push({ad:ad,etiket:et,rating:rat(ad),satir:satir}); };
  if(v.yildiz){ var gg=v.golSay[v.yildiz]||0, aa=v.goller.filter(function(g){return g.asist===v.yildiz;}).length; var s=[]; if(gg)s.push(gg+" gol"); if(aa)s.push(aa+" asist");
    pushOy(v.yildiz,"Maçın Adamı", s.length?s.join(" · ")+" ile sahnenin ortasındaydı.":"Sahanın her yerinde belirleyiciydi."); }
  var enCok=Object.entries(v.golSay).sort(function(a,b){return b[1]-a[1];})[0];
  if(enCok&&enCok[1]>=1) pushOy(enCok[0], enCok[1]>=3?"Hat-trick":enCok[1]===2?"Çifte gol":"Golcü", enCok[1]>=2?enCok[1]+" golle farkı yaratan isim oldu.":"Ağları sarsan isim oldu.");
  if(krec&&krec.kurtaris>=3) pushOy(kaleciAd,"Kaleci",krec.kurtaris+" kurtarışla kaleyi ayakta tuttu.");
  var asMap={}; v.goller.forEach(function(g){ if(g.asist) asMap[g.asist]=(asMap[g.asist]||0)+1; });
  var enAs=Object.entries(asMap).sort(function(a,b){return b[1]-a[1];})[0];
  if(enAs&&enAs[1]>=2) pushOy(enAs[0],"Asist Kralı",enAs[1]+" asistle üretimin merkezindeydi.");
  v.ratingArr.forEach(function(r){ if(oyuncular.length<4) pushOy(r[0],"Yüksek Reyting","Reytingiyle maçın en iyilerinden biriydi."); });
  oyuncular=oyuncular.slice(0,4);

  // ---- DETAYLI İSTATİSTİK ----
  var istat=[];
  if(ist){ ISTATISTIK_SATIRLAR.forEach(function(row){ var a=ist[row[1]], b=ist[row[2]]; if(a==null||b==null)return; istat.push({et:row[0],a:a,b:b,yuzde:row[3]}); }); }

  // ---- LİG ETKİSİ ----
  var lig=[];
  if(v.turnuva&&v.turnuva.takimlar&&v.turnuva.takimlar.length){
    var sirali=v.turnuva.takimlar.slice().sort(function(a,b){return b.puan-a.puan||(b.ag-b.yg)-(a.ag-a.yg);});
    var rankOf=function(ad){ for(var i=0;i<sirali.length;i++) if(sirali[i].ad===ad) return i+1; return null; };
    [A,B].forEach(function(ad){ var t=sirali.find(function(x){return x.ad===ad;}); if(!t)return; var r=rankOf(ad);
      var kazandi=galip===ad, kaybetti=galip&&galip!==ad, satir="";
      if(r===1) satir=kazandi?"Bu galibiyetle zirvedeki koltuğunu sağlamlaştırdı.":(kaybetti?"Kaybına rağmen liderliği bu hafta korudu.":"Beraberlikle zirvedeki yerini sürdürdü.");
      else if(r&&r<=3) satir=kazandi?(r+". sıraya tutunup zirve yarışını sıcak tuttu."):(kaybetti?("Zirve yarışında "+r+". sırada; kayıp puan can sıktı."):(r+". sırada yoluna devam etti."));
      else if(r) satir=kazandi?(r+". sıraya yükselerek yukarıyı zorlamaya başladı."):(kaybetti?(r+". sırada; bu sonuç tabloda geriye itti."):(r+". sıradaki yerini korudu."));
      lig.push({ad:ad,konum:r,puan:t.puan,oynanan:t.o,satir:satir,kazandi:kazandi,renk:ad===A?v.renkA:v.renkB});
    });
  }

  var ozet=(v.manset&&v.manset.kategori)||(fark>=3?"Tek taraflı üstünlük":(!galip?(toplam===0?"Golsüz denge":"Puanlar paylaşıldı"):fark===1?"Nefes kesen final":"Kontrollü galibiyet"));
  return { ozet:ozet, donum:donum, taktik:taktik, oyuncular:oyuncular, istat:istat, lig:lig, puanTablo:v.puanTablo };
}

// ---- MARKA: watermark (arka plan) ----
function GzWatermark(props){
  var c=props.color||"#ffffff", op=props.opacity!=null?props.opacity:0.05;
  return <div aria-hidden="true" style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none",zIndex:0}}>
    <div style={{position:"absolute",top:props.top!=null?props.top:"34%",left:"50%",transform:"translate(-50%,-50%) rotate(-16deg)",fontSize:props.size||96,fontWeight:900,letterSpacing:-3,color:c,opacity:op,whiteSpace:"nowrap",fontFamily:"'Anton','Arial Black',sans-serif",lineHeight:1}}>FORZALIG</div>
    <div style={{position:"absolute",bottom:"6%",left:"50%",transform:"translateX(-50%)",fontSize:13,fontWeight:800,letterSpacing:7,color:c,opacity:Math.min(0.08,op*1.2),fontFamily:"'Oswald','Arial Narrow',sans-serif",whiteSpace:"nowrap"}}>FORZALIG.COM</div>
  </div>;
}
// ---- MARKA: görünür rozet (her görünümün üstünde) ----
function GzMarka(props){
  var c=props.color||"#fff", acc=props.accent||"#34d399", sub=props.sub||"#8b95a3";
  return <div style={{display:"flex",alignItems:"center",gap:9,position:"relative",zIndex:1}}>
    <div style={{width:26,height:26,borderRadius:8,display:"grid",placeItems:"center",fontSize:14,background:"linear-gradient(135deg,"+acc+","+acc+"bb)",color:"#04140c",flexShrink:0,boxShadow:"0 3px 10px -3px "+acc+"88"}}>⚽</div>
    <div style={{lineHeight:1.05}}>
      <div style={{fontSize:14,fontWeight:850,letterSpacing:-0.2,color:c}}>Forza<span style={{color:acc}}>Lig</span></div>
      <div style={{fontSize:8.5,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:sub,marginTop:1}}>Maç Gazetesi</div>
    </div>
    {props.sag && <div style={{marginLeft:"auto",textAlign:"right"}}>{props.sag}</div>}
  </div>;
}

// ---- paylaşılan detay bloğu: TÜM zengin bölümler, palete göre boyanır ----
function GzDetay(props){
  var v=props.v, p=props.pal, av=p.accent, a=gazeteAnaliz(v);
  var H=function(t,ust){ return <div style={{fontSize:11,letterSpacing:1.5,textTransform:"uppercase",fontWeight:800,color:av,marginBottom:9,marginTop:ust!=null?ust:0,display:"flex",alignItems:"center",gap:8}}><span>{t}</span><span style={{flex:1,height:1,background:p.line}}/></div>; };
  var toplamBar=function(x,y){ var t=(Number(x)||0)+(Number(y)||0); return t>0?[(Number(x)||0)/t*100,(Number(y)||0)/t*100]:[50,50]; };
  return <div style={{padding:"2px 2px 6px"}}>

    {/* SPİKER ANLATIMI */}
    {v.yorumParcalar.length>0 && <div style={{marginBottom:20}}>
      {H("Spiker Anlatımı")}
      {v.yorumParcalar.map(function(par,i){ return <p key={i} style={{fontSize:14,lineHeight:1.62,color:p.ink,margin:"0 0 9px",opacity:.93}}>{i===0?<span style={{fontFamily:"Georgia,serif",fontSize:34,fontWeight:800,float:"left",lineHeight:.82,paddingRight:7,paddingTop:2,color:av}}>{par.charAt(0)}</span>:null}{i===0?par.slice(1):par}</p>; })}
      <div style={{fontSize:10.5,letterSpacing:.5,textTransform:"uppercase",color:p.mut,fontWeight:700}}>✍ ForzaLig Spiker</div>
    </div>}

    {/* MAÇIN DÖNÜM NOKTALARI */}
    {a.donum.length>0 && <div style={{marginBottom:20}}>
      {H("Maçın Dönüm Noktaları")}
      <div style={{position:"relative"}}>
        <div style={{position:"absolute",left:26,top:6,bottom:6,width:2,background:p.line}}/>
        {a.donum.map(function(d,i){ var renk=d.tip==="kirmizi"?"#ef4444":d.tip==="kopus"||d.tip==="final"?av:p.ink;
          return <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",padding:"6px 0",position:"relative"}}>
            <div style={{width:38,flexShrink:0,fontSize:12,fontWeight:800,color:av,fontVariantNumeric:"tabular-nums",textAlign:"right"}}>{d.dk}'</div>
            <div style={{width:11,height:11,borderRadius:"50%",background:renk,border:"2px solid "+p.bg,flexShrink:0,marginTop:3,zIndex:1}}/>
            <div style={{fontSize:13,lineHeight:1.5,color:p.ink,opacity:.92}}>{d.metin}</div>
          </div>; })}
      </div>
    </div>}

    {/* TAKTİK / AI ANALİZ */}
    {a.taktik.length>0 && <div style={{marginBottom:20}}>
      {H("Taktik Değerlendirme")}
      <div style={{display:"grid",gap:8}}>
        {a.taktik.map(function(t,i){ return <div key={i} style={{background:p.card,border:"1px solid "+p.line,borderRadius:12,padding:"11px 13px"}}>
          <div style={{fontSize:12.5,fontWeight:800,color:av,marginBottom:3}}>{t.b}</div>
          <div style={{fontSize:13,lineHeight:1.5,color:p.ink,opacity:.9}}>{t.m}</div>
        </div>; })}
      </div>
    </div>}

    {/* ÖNE ÇIKAN OYUNCULAR */}
    {a.oyuncular.length>0 && <div style={{marginBottom:20}}>
      {H("Öne Çıkan Oyuncular")}
      <div style={{display:"grid",gap:8}}>
        {a.oyuncular.map(function(o,i){ return <div key={i} style={{display:"flex",alignItems:"center",gap:11,background:p.card,border:"1px solid "+p.line,borderRadius:12,padding:"9px 11px"}}>
          <div style={{width:38,height:38,borderRadius:"50%",overflow:"hidden",flexShrink:0,border:"2px solid "+av+"66"}} dangerouslySetInnerHTML={{__html:svgAvatar(o.ad,38)}}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:7}}><span style={{fontSize:13.5,fontWeight:800,color:p.ink,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{o.ad}</span><span style={{fontSize:9,letterSpacing:.6,textTransform:"uppercase",color:av,fontWeight:800,flexShrink:0}}>{o.etiket}</span></div>
            <div style={{fontSize:11.5,color:p.mut,marginTop:1,lineHeight:1.35}}>{o.satir}</div>
          </div>
          {o.rating!=null && <div style={{textAlign:"center",flexShrink:0}}><div style={{fontSize:17,fontWeight:800,color:av,fontVariantNumeric:"tabular-nums",lineHeight:1}}>{o.rating.toFixed(1)}</div><div style={{fontSize:8,letterSpacing:1,color:p.mut,textTransform:"uppercase"}}>Reyting</div></div>}
        </div>; })}
      </div>
    </div>}

    {/* DETAYLI İSTATİSTİK */}
    {a.istat.length>0 && <div style={{marginBottom:20}}>
      {H("Detaylı İstatistik")}
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,fontSize:11,fontWeight:800}}>
        <span style={{color:v.renkA,display:"flex",alignItems:"center",gap:6}}><Logo renk={v.renkA} ad={v.takimA} boy={16}/>{v.takimA}</span>
        <span style={{color:v.renkB,display:"flex",alignItems:"center",gap:6}}>{v.takimB}<Logo renk={v.renkB} ad={v.takimB} boy={16}/></span>
      </div>
      {a.istat.map(function(s,i){ var w=toplamBar(s.a,s.b);
        return <div key={i} style={{marginBottom:9}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:12,marginBottom:4}}>
            <span style={{fontWeight:800,color:p.ink,fontVariantNumeric:"tabular-nums"}}>{s.a}{s.yuzde?"%":""}</span>
            <span style={{fontSize:10.5,letterSpacing:.5,textTransform:"uppercase",color:p.mut}}>{s.et}</span>
            <span style={{fontWeight:800,color:p.ink,fontVariantNumeric:"tabular-nums"}}>{s.b}{s.yuzde?"%":""}</span>
          </div>
          <div style={{display:"flex",height:6,borderRadius:4,overflow:"hidden",background:p.line,gap:2}}>
            <span style={{width:w[0]+"%",background:v.renkA,borderRadius:"4px 0 0 4px"}}/>
            <span style={{width:w[1]+"%",background:v.renkB,borderRadius:"0 4px 4px 0"}}/>
          </div>
        </div>; })}
    </div>}

    {/* LİG ETKİSİ */}
    {a.lig.length>0 && <div>
      {H("Lig Etkisi")}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
        {a.lig.map(function(l,i){ return <div key={i} style={{background:p.card,border:"1px solid "+(l.kazandi?av+"55":p.line),borderRadius:12,padding:"11px"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
            <Logo renk={l.renk} ad={l.ad} boy={22}/>
            <div style={{minWidth:0}}><div style={{fontSize:12,fontWeight:800,color:p.ink,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{l.ad}</div><div style={{fontSize:10,color:p.mut}}>{l.konum}. sıra · {l.puan} puan</div></div>
          </div>
          <div style={{fontSize:11.5,color:p.ink,opacity:.85,lineHeight:1.4}}>{l.satir}</div>
        </div>; })}
      </div>
      {a.puanTablo.length>0 && <div style={{background:p.card,border:"1px solid "+p.line,borderRadius:12,overflow:"hidden"}}>
        {a.puanTablo.map(function(t,i){ var vurgu=t.ad===v.takimA||t.ad===v.takimB;
          return <div key={t.id} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 12px",borderBottom:i<a.puanTablo.length-1?"1px solid "+p.line:"none",background:vurgu?av+"12":"transparent"}}>
            <span style={{width:16,fontSize:12,fontWeight:800,color:vurgu?av:p.mut,fontVariantNumeric:"tabular-nums"}}>{i+1}</span>
            <span style={{flex:1,fontSize:12.5,color:p.ink,fontWeight:vurgu?700:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.ad}</span>
            <span style={{fontSize:10.5,color:p.mut,fontVariantNumeric:"tabular-nums"}}>{t.o} O · {(t.ag-t.yg>0?"+":"")+(t.ag-t.yg)} AV</span>
            <span style={{fontSize:14,fontWeight:800,color:p.ink,width:22,textAlign:"right",fontVariantNumeric:"tabular-nums"}}>{t.puan}</span>
          </div>; })}
      </div>}
    </div>}
  </div>;
}

/* ===== 1) CARBON — sade, premium ===== */
function GzCarbon(props){ var v=props.v;
  var pal={bg:"#08090b",card:"#101319",ink:"#f2f4f7",mut:"#5b636e",line:"#1a1d22",accent:"#34d399"};
  return <div style={{background:pal.bg,color:pal.ink,padding:"18px 20px 26px",position:"relative"}}>
    <GzWatermark color="#ffffff" opacity={0.05}/>
    <div style={{position:"relative",zIndex:1}}>
    <GzMarka color={pal.ink} accent={pal.accent} sub={pal.mut} sag={<div style={{fontSize:10,letterSpacing:1.5,color:pal.mut,textTransform:"uppercase"}}>{v.lg||"Maç"}{v.hafta?" · "+v.hafta+".H":""}</div>}/>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",margin:"22px 0 5px"}}>
      <div style={{textAlign:"center",flex:1}}><Logo renk={v.renkA} ad={v.takimA} boy={46}/><div style={{fontSize:11,color:"#aab3bf",marginTop:8,fontWeight:600}}>{v.takimA}</div></div>
      <div style={{fontSize:50,fontWeight:200,letterSpacing:-2,fontVariantNumeric:"tabular-nums",lineHeight:1}}>{v.sA}<span style={{opacity:.35,margin:"0 3px"}}>–</span>{v.sB}</div>
      <div style={{textAlign:"center",flex:1}}><Logo renk={v.renkB} ad={v.takimB} boy={46}/><div style={{fontSize:11,color:"#aab3bf",marginTop:8,fontWeight:600}}>{v.takimB}</div></div>
    </div>
    <div style={{textAlign:"center",fontSize:10,letterSpacing:2,textTransform:"uppercase",color:v.galip?pal.accent:pal.mut,margin:"10px 0 20px"}}>{v.galip?v.galip+" kazandı":"Berabere bitti"}</div>
    {v.golKron.length>0 && <div style={{borderTop:"1px solid "+pal.line,marginBottom:20}}>
      {v.golKron.map(function(g,i){ return <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 2px",borderBottom:"1px solid "+pal.line}}>
        <span style={{fontSize:12,color:pal.mut,width:30,fontVariantNumeric:"tabular-nums"}}>{g.dk}'</span>
        <span style={{flex:1,fontSize:14,fontWeight:600}}>{g.oyuncu}{g.asist?<span style={{color:pal.mut,fontWeight:400,fontSize:12}}> · {g.asist} asist</span>:""}</span>
        <span style={{fontSize:10,color:pal.mut}}>{g.takim===v.takimA?v.takimA:v.takimB}</span><span style={{opacity:.5}}>⚽</span>
      </div>; })}
    </div>}
    <GzDetay v={v} pal={pal}/>
    </div>
  </div>;
}

/* ===== 2) EDITORIAL — dergi / hikaye ===== */
function GzEditorial(props){ var v=props.v;
  var pal={bg:"#12100e",card:"#1b1712",ink:"#efe9e1",mut:"#b3a99c",line:"#2a2621",accent:"#d9724a"};
  var spot=v.manset&&v.manset.spot?v.manset.spot:(v.yorumParcalar[0]||"");
  return <div style={{background:pal.bg,color:pal.ink,position:"relative"}}>
    <GzWatermark color="#efe9e1" opacity={0.045}/>
    <div style={{position:"relative",zIndex:1}}>
    <div style={{padding:"16px 20px 16px",borderBottom:"1px solid "+pal.line}}>
      <GzMarka color={pal.ink} accent={pal.accent} sub={pal.mut}/>
      <div style={{fontSize:10,letterSpacing:2,textTransform:"uppercase",color:pal.accent,fontWeight:800,marginTop:16}}>{(v.manset&&v.manset.kategori)||"Maç Raporu"}{v.hafta?" · "+v.hafta+". Hafta":""}</div>
      <div style={{fontFamily:"Georgia,'Times New Roman',serif",fontWeight:800,fontSize:29,lineHeight:1.03,margin:"9px 0 9px",letterSpacing:-.3}}>{(v.manset&&(v.manset.baslik||v.manset))||"Maç Sonucu"}</div>
      <div style={{fontSize:13,color:pal.mut,lineHeight:1.55}}>{spot}</div>
    </div>
    <div style={{display:"flex",alignItems:"center",gap:14,padding:"14px 20px",borderBottom:"1px solid "+pal.line}}>
      <Logo renk={v.renkA} ad={v.takimA} boy={34}/>
      <div style={{fontSize:28,fontWeight:800,fontVariantNumeric:"tabular-nums",fontFamily:"Georgia,serif"}}>{v.sA} – {v.sB}</div>
      <Logo renk={v.renkB} ad={v.takimB} boy={34}/>
      <div style={{marginLeft:"auto",fontSize:11,color:"#7c7367",textAlign:"right",lineHeight:1.3}}>{v.takimA}<br/>{v.takimB}</div>
    </div>
    <div style={{padding:"16px 20px 4px"}}><GzDetay v={v} pal={pal}/></div>
    </div>
  </div>;
}

/* ===== 3) DATALAB — analitik ===== */
function GzDataLab(props){ var v=props.v; var ist=v.ist;
  var pal={bg:"#07090c",card:"#0d1219",ink:"#d7dee6",mut:"#5a6472",line:"#1a2230",accent:"#4ade80"};
  var mono={fontFamily:"ui-monospace,'SF Mono',Menlo,monospace"};
  var tiles=[];
  if(ist&&ist.sahiplikB!=null) tiles.push(["%"+ist.sahiplikB,"Topa sahip (dep.)"]);
  if(ist&&ist.sutB!=null) tiles.push([String(ist.sutB),"Şut"+(ist.isabetB!=null?" · "+ist.isabetB+" isabet":"")]);
  if(ist&&ist.kornerB!=null) tiles.push([String(ist.kornerB),"Korner"]);
  tiles.push([String(v.goller.length),"Toplam gol"]);
  return <div style={{background:pal.bg,color:pal.ink,padding:16,position:"relative",...mono}}>
    <GzWatermark color="#4ade80" opacity={0.05}/>
    <div style={{position:"relative",zIndex:1}}>
    <GzMarka color="#fff" accent={pal.accent} sub={pal.mut}/>
    <div style={{fontFamily:"-apple-system,sans-serif",fontSize:11,letterSpacing:1,color:pal.mut,textTransform:"uppercase",marginTop:14}}>{(v.galip||v.takimA)+" "+v.sA+"–"+v.sB}{v.hafta?" · "+v.hafta+". Hafta":""}</div>
    <div style={{fontFamily:"-apple-system,sans-serif",fontSize:18,fontWeight:800,margin:"2px 0 12px",color:"#fff"}}>Maç Analizi</div>
    <div style={{background:pal.card,border:"1px solid "+pal.line,borderRadius:12,padding:12,marginBottom:12}}>
      <div style={{fontFamily:"-apple-system,sans-serif",fontSize:9,color:pal.mut,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Goller · dakikaya göre</div>
      <div style={{position:"relative",height:54}}>
        <div style={{position:"absolute",top:27,left:0,right:0,height:1,background:pal.line}}/>
        {v.golKron.map(function(g,i){ var x=Math.min(96,(g.dk/60)*100); var ev=g.takim===v.takimA;
          return <div key={i} style={{position:"absolute",left:x+"%",transform:"translateX(-50%)",top:ev?4:"auto",bottom:ev?"auto":4,background:ev?"#38bdf8":pal.accent,color:"#04120a",fontSize:9,fontWeight:800,padding:"2px 5px",borderRadius:4,...mono}}>{g.dk}'</div>; })}
        {v.golKron.length===0 && <div style={{position:"absolute",inset:0,display:"grid",placeItems:"center",color:pal.mut,fontSize:11}}>gol yok</div>}
      </div>
      <div style={{fontFamily:"-apple-system,sans-serif",fontSize:10,color:pal.mut,marginTop:8}}><span style={{color:"#38bdf8"}}>■</span> {v.takimA} &nbsp; <span style={{color:pal.accent}}>■</span> {v.takimB}</div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
      {tiles.map(function(t,i){ return <div key={i} style={{background:pal.card,border:"1px solid "+pal.line,borderRadius:12,padding:12}}>
        <div style={{fontFamily:"-apple-system,sans-serif",fontSize:22,fontWeight:800,color:pal.accent,fontVariantNumeric:"tabular-nums"}}>{t[0]}</div>
        <div style={{fontFamily:"-apple-system,sans-serif",fontSize:9,color:pal.mut,letterSpacing:.5,textTransform:"uppercase",marginTop:2}}>{t[1]}</div>
      </div>; })}
    </div>
    <div style={{fontFamily:"-apple-system,sans-serif"}}><GzDetay v={v} pal={pal}/></div>
    </div>
  </div>;
}

/* ===== 4) CINEMATIC — hero + kayan sayfa ===== */
function GzCinematic(props){ var v=props.v;
  var pal={bg:"#0a0d12",card:"#12161d",ink:"#eef2f7",mut:"#7c8794",line:"#151a20",accent:"#a855f7"};
  var kahraman=v.galip||v.takimA;
  var baslik=(v.manset&&(v.manset.baslik||v.manset))||"Maç Sonucu";
  return <div style={{background:"#05070a",color:pal.ink}}>
    <div style={{position:"relative",height:296,overflow:"hidden",background:"radial-gradient(120% 90% at 30% 10%, "+(v.renkB||"#7c3aed")+"55, transparent 60%),radial-gradient(120% 90% at 90% 20%, "+(v.renkA||"#2563eb")+"44, transparent 55%),linear-gradient(180deg,#0b1020,#05070a)"}}>
      <div style={{position:"absolute",inset:0,display:"grid",placeItems:"center",opacity:.5}}><Logo renk={v.renkB} ad={kahraman} boy={150}/></div>
      <GzWatermark color="#ffffff" opacity={0.06} top="30%"/>
      <div style={{position:"absolute",top:14,left:16,zIndex:2}}><GzMarka color="#fff" accent={pal.accent} sub="#c9b8e8"/></div>
      <div style={{position:"absolute",left:0,right:0,bottom:0,padding:20,zIndex:2}}>
        <span style={{display:"inline-flex",alignItems:"center",gap:8,background:"#00000066",backdropFilter:"blur(6px)",border:"1px solid #ffffff22",borderRadius:10,padding:"6px 11px",fontSize:11,fontWeight:700}}>FT <span style={{fontSize:16,fontWeight:900,fontVariantNumeric:"tabular-nums"}}>{v.sA}–{v.sB}</span> · {kahraman}</span>
        <div style={{fontFamily:"'Arial Black',Impact,sans-serif",fontWeight:900,fontSize:31,lineHeight:.96,letterSpacing:-.5,margin:"10px 0 0",textTransform:"uppercase",textShadow:"0 6px 24px #000a"}}>{baslik}</div>
      </div>
    </div>
    <div style={{background:pal.bg,borderRadius:"20px 20px 0 0",borderTop:"1px solid #ffffff10",marginTop:-16,position:"relative",zIndex:1,padding:"14px 18px 28px"}}>
      <div style={{width:38,height:4,borderRadius:3,background:"#2a323c",margin:"0 auto 14px"}}/>
      {v.golKron.length>0 && <div style={{marginBottom:6}}>
        {v.golKron.map(function(g,i){ return <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"9px 0",borderBottom:"1px solid "+pal.line}}>
          <div style={{width:34,height:34,borderRadius:"50%",overflow:"hidden",flexShrink:0}} dangerouslySetInnerHTML={{__html:svgAvatar(g.oyuncu,34)}}/>
          <span style={{flex:1,fontSize:14,fontWeight:700}}>{g.oyuncu}<span style={{color:pal.mut,fontWeight:400,fontSize:11}}> · {g.takim===v.takimA?v.takimA:v.takimB}</span></span>
          <span style={{fontSize:12,color:pal.mut,fontVariantNumeric:"tabular-nums"}}>{g.dk}'</span>
        </div>; })}
      </div>}
      <div style={{marginTop:12}}><GzDetay v={v} pal={pal}/></div>
    </div>
  </div>;
}

/* ===== 5) GLASS — cam / gradient ===== */
function GzGlass(props){ var v=props.v;
  var glass={background:"#ffffff14",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",border:"1px solid #ffffff2e",borderRadius:18,boxShadow:"0 8px 32px #0004,inset 0 1px 0 #ffffff33",padding:16,marginBottom:12};
  var pal={bg:"#ffffff12",card:"#ffffff12",ink:"#ffffff",mut:"#ffffffb0",line:"#ffffff26",accent:"#ffffff"};
  var H=function(t){ return <div style={{fontSize:10,letterSpacing:1.5,color:"#ffffffc8",textTransform:"uppercase",fontWeight:800,marginBottom:8}}>{t}</div>; };
  return <div style={{position:"relative",overflow:"hidden",background:"radial-gradient(80% 60% at 15% 0%, "+(v.renkA||"#7c3aed")+", transparent 60%),radial-gradient(80% 60% at 100% 30%, "+(v.renkB||"#2563eb")+", transparent 55%),radial-gradient(90% 70% at 50% 100%, #db2777aa, transparent 60%), #0a0a16",color:"#fff",padding:"16px 16px 30px"}}>
    <GzWatermark color="#ffffff" opacity={0.07}/>
    <div style={{position:"relative",zIndex:1}}>
    <GzMarka color="#fff" accent="#fff" sub="#ffffffb0"/>
    <div style={{fontSize:10,letterSpacing:2,color:"#ffffffb0",textTransform:"uppercase",textAlign:"center",margin:"14px 0 12px"}}>{v.lg}{v.hafta?" · "+v.hafta+". Hafta":""}</div>
    <div style={{...glass,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{textAlign:"center",flex:1}}><Logo renk={v.renkA} ad={v.takimA} boy={40}/><div style={{fontSize:10.5,marginTop:8,color:"#ffffffd0",fontWeight:600}}>{v.takimA}</div></div>
      <div style={{fontSize:40,fontWeight:800,fontVariantNumeric:"tabular-nums",textShadow:"0 2px 20px #0006"}}>{v.sA}–{v.sB}</div>
      <div style={{textAlign:"center",flex:1}}><Logo renk={v.renkB} ad={v.takimB} boy={40}/><div style={{fontSize:10.5,marginTop:8,color:"#ffffffd0",fontWeight:600}}>{v.takimB}</div></div>
    </div>
    {v.golKron.length>0 && <div style={glass}>{H("Goller")}
      {v.golKron.map(function(g,i){ return <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:i<v.golKron.length-1?"1px solid #ffffff1a":"none",fontSize:12.5}}>
        <span style={{color:"#ffffffb0",width:28,fontVariantNumeric:"tabular-nums",fontSize:11}}>{g.dk}'</span><span style={{flex:1,fontWeight:600}}>{g.oyuncu}</span><span>⚽</span>
      </div>; })}
    </div>}
    <div style={glass}><GzDetay v={v} pal={pal}/></div>
    </div>
  </div>;
}

/* ===== 6) STORY — dikey, paylaşılabilir (wildcard) ===== */
function GzStory(props){ var v=props.v; var a=gazeteAnaliz(v);
  var cap=(v.manset&&(v.manset.baslik||v.manset))||(v.galip?v.galip+" kazandı":"Maç bitti");
  var sub=(v.yorumParcalar[0]||"");
  var chips=[]; var enCok=Object.entries(v.golSay).sort(function(a,b){return b[1]-a[1];})[0];
  if(enCok&&enCok[1]>0) chips.push("⚽ "+enCok[0]+(enCok[1]>1?" ×"+enCok[1]:""));
  if(v.yildiz) chips.push("🌟 "+v.yildiz+(v.mvpRating?" "+v.mvpRating.toFixed(1):""));
  if(a.donum.length){ var kop=a.donum.find(function(d){return d.tip==="kopus"||d.tip==="final";}); if(kop) chips.push("🔑 "+kop.dk+"' dönüm"); }
  if(v.oduller.length>1) chips.push("🏅 "+v.oduller.length+" ödül");
  var paylas=function(){ var metin=v.takimA+" "+v.sA+"–"+v.sB+" "+v.takimB+" · "+cap;
    try{ if(navigator.share){ navigator.share({title:"ForzaLig",text:metin,url:location.href}); return; } }catch(e){}
    try{ navigator.clipboard.writeText(metin+" "+location.href); alert("Kopyalandı ✓ İstediğin yere yapıştır."); }catch(e){} };
  return <div style={{position:"relative",overflow:"hidden",minHeight:560,background:"linear-gradient(160deg,"+(v.renkA||"#1a0b2e")+"55,"+(v.renkB||"#3b0d3d")+"cc 55%,#5b1030)",color:"#fff"}}>
    <div style={{position:"absolute",inset:0,background:"linear-gradient(160deg,#1a0b2e,#3b0d3daa 55%,#5b1030)"}}/>
    <GzWatermark color="#ffffff" opacity={0.06}/>
    <div style={{position:"relative",zIndex:1,padding:"20px 22px 22px",display:"flex",flexDirection:"column",minHeight:560}}>
      <GzMarka color="#fff" accent="#ffd9f0" sub="#ffffffb0" sag={<span style={{fontSize:10,letterSpacing:1.5,color:"#ffffffb0",textTransform:"uppercase"}}>{v.lg}{v.hafta?" · "+v.hafta+".H":""}</span>}/>
      <div style={{display:"flex",alignItems:"center",gap:10,marginTop:16}}>
        <Logo renk={v.renkA} ad={v.takimA} boy={32}/><span style={{fontSize:11,color:"#ffffffb0"}}>vs</span><Logo renk={v.renkB} ad={v.takimB} boy={32}/>
      </div>
      <div style={{fontSize:82,fontWeight:900,lineHeight:.9,letterSpacing:-3,marginTop:"auto",fontVariantNumeric:"tabular-nums",background:"linear-gradient(180deg,#fff,#ffd9f0)",WebkitBackgroundClip:"text",backgroundClip:"text",color:"transparent"}}>{v.sA}–{v.sB}</div>
      <div style={{fontSize:20,fontWeight:800,lineHeight:1.12,marginTop:8}}>{cap}</div>
      {sub && <div style={{fontSize:13,color:"#ffffffcc",marginTop:10,lineHeight:1.5}}>{sub.length>170?sub.slice(0,168)+"…":sub}</div>}
      <div style={{display:"flex",gap:8,marginTop:14,flexWrap:"wrap"}}>
        {chips.map(function(c,i){ return <span key={i} style={{background:"#ffffff1e",border:"1px solid #ffffff33",borderRadius:999,padding:"6px 12px",fontSize:12,fontWeight:700,backdropFilter:"blur(8px)"}}>{c}</span>; })}
      </div>
      <button onClick={paylas} className="tap" style={{marginTop:16,display:"flex",alignItems:"center",justifyContent:"center",gap:8,height:46,borderRadius:14,background:"#fff",color:"#3b0d3d",fontWeight:800,fontSize:14,border:"none",width:"100%"}}>↗ Story olarak paylaş</button>
      <div style={{textAlign:"center",fontSize:10,letterSpacing:3,textTransform:"uppercase",color:"#ffffff99",marginTop:12,fontWeight:800}}>forzalig.com</div>
    </div>
  </div>;
}

// ---- REGİSTRY: yeni görünüm eklemek = buraya 1 satır ----
var GZ_GORUNUMLER=[
  {id:"carbon",   ad:"Carbon",    ikon:"⚫", aciklama:"Sade, premium",     bilesen:GzCarbon},
  {id:"editorial",ad:"Editorial", ikon:"📖", aciklama:"Dergi hikâyesi",    bilesen:GzEditorial},
  {id:"datalab",  ad:"DataLab",   ikon:"📊", aciklama:"Analitik",          bilesen:GzDataLab},
  {id:"cinematic",ad:"Cinematic", ikon:"🎬", aciklama:"Sinematik",         bilesen:GzCinematic},
  {id:"story",    ad:"Story",     ikon:"📱", aciklama:"Paylaşılabilir",    bilesen:GzStory},
  {id:"glass",    ad:"Glass",     ikon:"🧊", aciklama:"Cam / modern",      bilesen:GzGlass}
];
function gzBul(id){ for(var i=0;i<GZ_GORUNUMLER.length;i++) if(GZ_GORUNUMLER[i].id===id) return GZ_GORUNUMLER[i]; return null; }

// ---- Görünüm paneli (role göre kontroller) ----
function GorunumPanel(props){
  var T=props.T, kapat=props.kapat, aktif=props.aktif, sec=props.sec;
  var adminMi=props.adminMi, yetkili=props.yetkili, turnuva=props.turnuva, sistem=props.sistem;
  var kapali=sistem.kapali||[];
  var uyeAcik=!(turnuva&&turnuva.gzUyeAcik===false);
  var [tik,setTik]=useState(0); var yenile=function(){ setTik(function(x){return x+1;}); };
  var liste=GZ_GORUNUMLER.filter(function(g){ return adminMi || kapali.indexOf(g.id)<0; });
  return <div onClick={kapat} style={{position:"fixed",inset:0,zIndex:120,background:"rgba(0,0,0,.55)",backdropFilter:"blur(3px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
    <div onClick={function(e){e.stopPropagation();}} className="fade-in" style={{width:"100%",maxWidth:460,background:T.bg0,borderRadius:"20px 20px 0 0",border:"0.5px solid "+T.line,maxHeight:"86vh",overflowY:"auto",padding:"6px 14px 24px"}}>
      <div style={{width:40,height:4,borderRadius:3,background:T.line,margin:"9px auto 12px"}}/>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
        <div style={{fontSize:16,fontWeight:800,color:T.text}}>🎨 Görünüm</div>
        <button onClick={kapat} className="tap" style={{fontSize:13,color:T.textMut,background:T.bg1,border:"0.5px solid "+T.line,borderRadius:9,padding:"5px 11px",fontWeight:700}}>Kapat</button>
      </div>
      <div style={{fontSize:12,color:T.textMut,marginBottom:12,lineHeight:1.5}}>Aynı maç verisi — sadece tasarım değişir. Seçimin cihazında hatırlanır.</div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
        {liste.map(function(g){ var secili=g.id===aktif; var pasif=kapali.indexOf(g.id)>=0;
          return <button key={g.id} onClick={function(){ sec(g.id); }} className="tap" style={{textAlign:"left",padding:"12px 12px",borderRadius:14,background:secili?T.accent+"1c":T.bg1,border:"1.5px solid "+(secili?T.accent:T.line),position:"relative",opacity:pasif?.5:1}}>
            <div style={{fontSize:20,marginBottom:5}}>{g.ikon}</div>
            <div style={{fontSize:13.5,fontWeight:800,color:secili?T.accent:T.text}}>{g.ad}{secili?" ✓":""}</div>
            <div style={{fontSize:11,color:T.textMut,marginTop:1}}>{g.aciklama}</div>
            {pasif && <div style={{fontSize:9,color:T.danger,marginTop:3,fontWeight:700}}>KAPALI</div>}
          </button>; })}
      </div>

      {yetkili && <div style={{marginTop:18,padding:14,background:T.bg1,borderRadius:14,border:"0.5px solid "+T.line}}>
        <div style={{fontSize:12,fontWeight:800,color:T.accent2,letterSpacing:.5,marginBottom:2}}>🏆 LİG YÖNETİCİSİ</div>
        <div style={{fontSize:11.5,color:T.textMut,marginBottom:11,lineHeight:1.5}}>Bu lig için varsayılan görünümü belirle; istersen üyeler kendi görünümünü seçebilsin.</div>
        <button onClick={function(){ props.ligVarsayilan(aktif); yenile(); }} className="tap" style={{width:"100%",padding:11,borderRadius:11,background:T.accent,color:(T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0),fontSize:13,fontWeight:800,border:"none",marginBottom:9}}>“{(gzBul(aktif)||{}).ad}” görünümünü lig varsayılanı yap</button>
        <label style={{display:"flex",alignItems:"center",gap:10,fontSize:12.5,color:T.text,cursor:"pointer"}}>
          <input type="checkbox" checked={uyeAcik} onChange={function(e){ props.uyeKilit(!e.target.checked); yenile(); }} style={{width:18,height:18}}/>
          Üyeler görünümü değiştirebilsin
        </label>
        {turnuva&&turnuva.gzGorunum && <div style={{fontSize:11,color:T.textMut,marginTop:9}}>Şu anki lig varsayılanı: <b style={{color:T.textSoft}}>{(gzBul(turnuva.gzGorunum)||{}).ad||turnuva.gzGorunum}</b></div>}
      </div>}

      {adminMi && <div style={{marginTop:14,padding:14,background:T.danger+"0f",borderRadius:14,border:"0.5px solid "+T.danger+"33"}}>
        <div style={{fontSize:12,fontWeight:800,color:T.danger,letterSpacing:.5,marginBottom:2}}>👑 SÜPER ADMIN</div>
        <div style={{fontSize:11.5,color:T.textMut,marginBottom:11,lineHeight:1.5}}>Görünümleri sistem genelinde aç/kapa ve varsayılanı belirle.</div>
        <button onClick={function(){ var s=gzSisOku(); s.varsayilan=aktif; gzSisYaz(s); yenile(); }} className="tap" style={{width:"100%",padding:11,borderRadius:11,background:T.text,color:T.bg0,fontSize:13,fontWeight:800,border:"none",marginBottom:11}}>“{(gzBul(aktif)||{}).ad}” sistem varsayılanı olsun</button>
        <div style={{fontSize:10.5,color:T.textMut,letterSpacing:1,textTransform:"uppercase",marginBottom:7}}>Görünümler</div>
        {GZ_GORUNUMLER.map(function(g){ var s=gzSisOku(); var acikG=(s.kapali||[]).indexOf(g.id)<0; var vars=(s.varsayilan||"carbon")===g.id;
          return <div key={g.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid "+T.line}}>
            <span style={{fontSize:16}}>{g.ikon}</span>
            <span style={{flex:1,fontSize:13,color:T.text,fontWeight:600}}>{g.ad}{vars?<span style={{fontSize:10,color:T.accent,fontWeight:800}}> · varsayılan</span>:""}</span>
            <button onClick={function(){ var ss=gzSisOku(); var k=(ss.kapali||[]).slice(); var ix=k.indexOf(g.id); if(ix>=0)k.splice(ix,1); else { if(vars){ alert("Varsayılan görünüm kapatılamaz."); return; } k.push(g.id); } ss.kapali=k; gzSisYaz(ss); yenile(); }} className="tap" style={{fontSize:11.5,fontWeight:800,padding:"5px 12px",borderRadius:9,border:"1px solid "+(acikG?T.accent+"55":T.danger+"55"),background:(acikG?T.accent:T.danger)+"18",color:acikG?T.accent:T.danger}}>{acikG?"Açık":"Kapalı"}</button>
          </div>; })}
      </div>}
    </div>
  </div>;
}

// ---- SHELL: MacGazete (dış kabuk) ----
function MacGazete(props){
  var m=props.mac, turnuva=props.turnuva, T=props.T, git=props.git;
  var oturum=props.oturum, adminMi=!!props.adminMi, yetkili=!!props.yetkili, gazeteAyar=props.gazeteAyar;
  var [tohum,setTohum]=useState(0);
  var [panel,setPanel]=useState(false);
  // lig varsayılanını yerel önbellekten hidrate et (yayında değilse sunucuda tutulmaz)
  if(turnuva && turnuva.gzGorunum==null){ try{ var _lc=JSON.parse(localStorage.getItem('fz_gz_lig_'+turnuva.id)); if(_lc){ if(_lc.gzGorunum!=null)turnuva.gzGorunum=_lc.gzGorunum; if(_lc.gzUyeAcik!=null)turnuva.gzUyeAcik=_lc.gzUyeAcik; } }catch(e){} }
  var sistem=gzSisOku(); var kapali=sistem.kapali||[];
  var uyeKilitli = turnuva && turnuva.gzUyeAcik===false && !yetkili && !adminMi;
  var ligVar = turnuva && turnuva.gzGorunum;
  var sistemVar = sistem.varsayilan;
  var gecerli=function(id){ if(id && gzBul(id) && (adminMi || kapali.indexOf(id)<0)) return id; return null; };
  var baslangic = uyeKilitli
      ? (gecerli(ligVar)||gecerli(sistemVar)||"carbon")
      : (gecerli(gzUsrOku())||gecerli(ligVar)||gecerli(sistemVar)||"carbon");
  var [aktif,setAktif]=useState(function(){ return gecerli(baslangic)||"carbon"; });
  var sec=function(id){ if(!gzBul(id)) return; setAktif(id); if(!uyeKilitli) gzUsrYaz(id); setPanel(false); };

  var v=gazeteVeri(m,turnuva,tohum);
  var akt=gzBul(aktif)||GZ_GORUNUMLER[0];
  var Gorunum=akt.bilesen;

  var ligVarsayilan=function(id){ if(!turnuva) return; turnuva.gzGorunum=id; if(gazeteAyar) gazeteAyar(turnuva,{gzGorunum:id}); };
  var uyeKilit=function(kilit){ if(!turnuva) return; turnuva.gzUyeAcik=!kilit; if(gazeteAyar) gazeteAyar(turnuva,{gzUyeAcik:!kilit}); };
  var gorunumButonu = !uyeKilitli;

  return <div className="fade-in" style={{paddingBottom:90}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",gap:8}}>
      <FzImza variant="dark" boy={0.82}/>
      <div style={{display:"flex",gap:6}}>
        <button onClick={function(){ setTohum(function(t){return t+1;}); }} className="tap" style={{fontSize:11,color:T.textMut,background:T.bg1,borderRadius:9,padding:"6px 10px",fontWeight:700,border:"0.5px solid "+T.line}}>↻ Yeniden Üret</button>
        {gorunumButonu && <button onClick={function(){ setPanel(true); }} className="tap" style={{fontSize:11.5,color:T.accent,background:T.accent+"18",borderRadius:9,padding:"6px 12px",fontWeight:800,border:"1px solid "+T.accent+"44"}}>🎨 {akt.ad}</button>}
      </div>
    </div>

    <div style={{margin:"0 10px",borderRadius:18,overflow:"hidden",boxShadow:"0 10px 40px -14px rgba(0,0,0,.55)"}}>
      <Gorunum v={v} m={m} turnuva={turnuva} T={T} tohum={tohum}/>
    </div>

    <div style={{padding:"12px 14px"}}>
      <button onClick={function(){ git({sayfa:"mac",mac:m,turnuva:turnuva}); }} className="tap" style={{width:"100%",padding:"12px",borderRadius:11,background:T.bg1,color:T.text,fontSize:13,fontWeight:700,border:"0.5px solid "+T.line}}>‹ Maça Dön</button>
    </div>

    {panel && <GorunumPanel T={T} kapat={function(){ setPanel(false); }} aktif={aktif} sec={sec} adminMi={adminMi} yetkili={yetkili} turnuva={turnuva} sistem={gzSisOku()} ligVarsayilan={ligVarsayilan} uyeKilit={uyeKilit}/>}
  </div>;
}

function MacAfis({mac:m, turnuva, T, git}){
  const [stil,setStil]=useState("premium");
  const sA=m.skorA||0, sB=m.skorB||0;
  const galip=sA>sB?m.takimA:(sB>sA?m.takimB:null);
  const goller=(m.olaylar||[]).filter(o=>o.tip==="gol");
  const golSay={}; goller.forEach(g=>{golSay[g.oyuncu]=(golSay[g.oyuncu]||0)+1;});
  const yildiz=m.mvp||(Object.entries(golSay).sort((a,b)=>b[1]-a[1])[0]||["",0])[0];
  const golListe=Object.entries(golSay).map(([ad,n])=>n>1?`${ad} (${n})`:ad);
  const tarih=m.tarih||new Date().toLocaleDateString("tr-TR");
  const lg=turnuva?turnuva.ad:"";

  return <div className="fade-in" style={{paddingBottom:90}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px"}}>
      <span style={{fontSize:11,color:T.textMut,fontWeight:700,letterSpacing:1}}>MAÇ SONU AFİŞİ</span>
      <div style={{display:"flex",gap:5}}>
        <button onClick={()=>setStil("premium")} className="tap" style={{fontSize:11,padding:"5px 10px",borderRadius:8,fontWeight:700,background:stil==="premium"?T.accent:T.bg1,color:stil==="premium"?(T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0):T.textMut,border:"0.5px solid "+T.line}}>Premium</button>
        <button onClick={()=>setStil("skor")} className="tap" style={{fontSize:11,padding:"5px 10px",borderRadius:8,fontWeight:700,background:stil==="skor"?T.accent:T.bg1,color:stil==="skor"?(T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0):T.textMut,border:"0.5px solid "+T.line}}>Skorboard</button>
      </div>
    </div>

    {stil==="premium" ?
      /* PREMIUM */
      <div style={{margin:"0 14px",borderRadius:18,overflow:"hidden",background:`linear-gradient(160deg, ${m.renkA}26, ${T.bg0} 45%, ${m.renkB}26)`,border:"1px solid "+T.line,position:"relative"}}>
        <div style={{padding:"20px 18px",textAlign:"center"}}>
          <div style={{fontSize:10,color:T.accent,letterSpacing:3,fontWeight:700}}>MAÇ SONUCU</div>
          <div style={{fontSize:9,color:T.textMut,letterSpacing:1,marginTop:2}}>{lg} · {m.hafta}. Hafta</div>

          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,margin:"20px 0"}}>
            <div style={{flex:1}}><Logo renk={m.renkA} ad={m.takimA} boy={56}/><div style={{fontSize:13,fontWeight:700,color:galip===m.takimA?T.text:T.textSoft,marginTop:8}}>{m.takimA}</div></div>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:46,fontWeight:900,fontFamily:T.fontDisplay,lineHeight:1}}><span style={{color:sA>sB?T.accent:T.text}}>{sA}</span><span style={{color:T.textMut,fontSize:30}}> </span><span style={{color:sB>sA?T.accent:T.text}}>{sB}</span></div>
              {galip && <div style={{fontSize:9,color:T.gold,fontWeight:700,marginTop:4,letterSpacing:1}}>{galip.toUpperCase()} 🏆</div>}
            </div>
            <div style={{flex:1}}><Logo renk={m.renkB} ad={m.takimB} boy={56}/><div style={{fontSize:13,fontWeight:700,color:galip===m.takimB?T.text:T.textSoft,marginTop:8}}>{m.takimB}</div></div>
          </div>

          {yildiz && <div style={{background:T.bg1+"CC",borderRadius:14,padding:"12px",margin:"0 auto 12px",maxWidth:240,border:"0.5px solid "+T.gold+"55"}}>
            <div style={{fontSize:9,color:T.gold,letterSpacing:1.5,fontWeight:700}}>⭐ MAÇIN YILDIZI</div>
            <div style={{width:50,height:50,borderRadius:"50%",overflow:"hidden",margin:"8px auto",border:"2px solid "+T.gold}} dangerouslySetInnerHTML={{__html:svgAvatar(yildiz,50)}}/>
            <div style={{fontSize:14,fontWeight:700,color:T.text}}>{yildiz}</div>
          </div>}

          {golListe.length>0 && <div style={{borderTop:"0.5px solid "+T.line,paddingTop:10}}>
            <div style={{fontSize:9,color:T.textMut,letterSpacing:1,marginBottom:5}}>⚽ GOLLER</div>
            <div style={{fontSize:12,color:T.text,lineHeight:1.7}}>{golListe.join(" · ")}</div>
          </div>}
        </div>
        <div style={{background:T.bg1,padding:"8px",display:"flex",justifyContent:"center"}}><FzImza variant="dark" boy={0.78}/></div>
      </div>
      :
      /* SKORBOARD */
      <div style={{margin:"0 14px",borderRadius:16,overflow:"hidden",background:T.bg1,border:"1px solid "+T.line}}>
        <div style={{background:T.accent,padding:"8px",textAlign:"center"}}><span style={{fontSize:11,color:T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0,fontWeight:800,letterSpacing:2}}>MAÇ BİTTİ</span></div>
        <div style={{padding:"18px"}}>
          <div style={{display:"flex",alignItems:"center",marginBottom:14}}>
            <Logo renk={m.renkA} ad={m.takimA} boy={40}/>
            <span style={{flex:1,fontSize:15,fontWeight:700,marginLeft:10,color:galip===m.takimA?T.accent:T.text}}>{m.takimA}</span>
            <span style={{fontSize:32,fontWeight:900,fontFamily:T.fontDisplay,color:galip===m.takimA?T.accent:T.text}}>{sA}</span>
          </div>
          <div style={{display:"flex",alignItems:"center",marginBottom:14}}>
            <Logo renk={m.renkB} ad={m.takimB} boy={40}/>
            <span style={{flex:1,fontSize:15,fontWeight:700,marginLeft:10,color:galip===m.takimB?T.accent:T.text}}>{m.takimB}</span>
            <span style={{fontSize:32,fontWeight:900,fontFamily:T.fontDisplay,color:galip===m.takimB?T.accent:T.text}}>{sB}</span>
          </div>
          {golListe.length>0 && <div style={{borderTop:"0.5px solid "+T.line,paddingTop:10,marginBottom:8}}>
            <div style={{fontSize:9,color:T.textMut,letterSpacing:1,marginBottom:4}}>⚽ GOLLER</div>
            <div style={{fontSize:12,color:T.textSoft,lineHeight:1.6}}>{golListe.join(" · ")}</div>
          </div>}
          {yildiz && <div style={{fontSize:12,color:T.text}}>⭐ Yıldız: <b style={{color:T.gold}}>{yildiz}</b></div>}
          <div style={{fontSize:9,color:T.textMut,marginTop:10,letterSpacing:1}}>{lg} · {tarih}</div>
        </div>
      </div>
    }

    <div style={{padding:"12px 14px"}}>
      <div style={{fontSize:11,color:T.textMut,textAlign:"center",marginBottom:10}}>📲 Ekran görüntüsü alıp WhatsApp / Instagram'da paylaşabilirsin</div>
      <button onClick={()=>git({sayfa:"mac",mac:m,turnuva})} className="tap" style={{width:"100%",padding:"12px",borderRadius:11,background:T.bg1,color:T.text,fontSize:13,fontWeight:700,border:"0.5px solid "+T.line}}>‹ Maça Dön</button>
    </div>
  </div>;
}

/* ============================================================
   FAZ 5 — OYUNCU REYTİNG DÜZENLE (yönetici)
   ============================================================ */
function RatingDuzenle({mac:m, turnuva, T, git, ratingKaydet, skorKaydet}){
  const A=turnuva.takimlar.find(t=>t.id===m.takimAId)||turnuva.takimlar.find(t=>t.ad===m.takimA);
  const B=turnuva.takimlar.find(t=>t.id===m.takimBId)||turnuva.takimlar.find(t=>t.ad===m.takimB);
  const [veri,setVeri]=useState(()=> ({...(m.ratingler||{})}));

  const degis=(ad,delta)=> setVeri(v=>{ const y=Math.max(1,Math.min(10, Math.round(((v[ad]||6)+delta)*10)/10)); return {...v,[ad]:y}; });
  const yazVal=(ad,val)=>{ const n=parseFloat(val); setVeri(v=>({...v,[ad]: isNaN(n)?val:Math.max(1,Math.min(10,n))})); };
  const otomatik=()=>{ setVeri(ratingHesapla(m, A, B)); };
  const kaydet=()=>{ const temiz={}; Object.entries(veri).forEach(([k,v])=>{ temiz[k]=typeof v==="number"?v:(parseFloat(v)||6); }); ratingKaydet(m, temiz); git({sayfa:"mac",mac:{...m,ratingler:temiz},turnuva}); };

  const rRenk=(r)=> r>=8.5?T.accent : r>=7?T.gold : r>=6?T.textSoft : T.danger;
  const kolon=(takim, renk, ad)=> takim ? <div style={{marginBottom:14}}>
    <div style={{display:"flex",alignItems:"center",gap:8,margin:"0 4px 8px"}}><Logo renk={renk} ad={ad} boy={22}/><span style={{fontSize:13,fontWeight:700,color:T.text}}>{ad}</span></div>
    {takim.oyuncular.map(o=>{
      const r=veri[o.ad]!=null?(typeof veri[o.ad]==="number"?veri[o.ad]:parseFloat(veri[o.ad])||6):6;
      return <div key={o.id} style={{display:"flex",alignItems:"center",gap:8,background:T.bg1,borderRadius:10,padding:"8px 10px",marginBottom:5,border:"0.5px solid "+T.line}}>
        <span style={{width:16,height:16,borderRadius:4,background:T.bg2,color:T.textSoft,fontSize:8,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{o.poz==="Kaleci"?"K":o.poz==="Defans"?"D":o.poz==="OrtaSaha"?"O":"F"}</span>
        <span style={{flex:1,fontSize:12,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{o.ad}</span>
        <button onClick={()=>degis(o.ad,-0.5)} className="tap" style={{width:26,height:26,borderRadius:7,background:T.bg2,color:T.text,fontSize:16,border:"none",fontWeight:700,lineHeight:1}}>−</button>
        <span style={{fontSize:14,fontWeight:800,fontFamily:T.fontDisplay,color:"#06140d",background:rRenk(r),borderRadius:6,padding:"3px 9px",minWidth:38,textAlign:"center"}}>{r.toFixed(1)}</span>
        <button onClick={()=>degis(o.ad,0.5)} className="tap" style={{width:26,height:26,borderRadius:7,background:T.bg2,color:T.text,fontSize:16,border:"none",fontWeight:700,lineHeight:1}}>+</button>
      </div>;
    })}
  </div> : null;

  return <div className="fade-in" style={{paddingBottom:120}}>
    <Baslik ust="OYUNCU REYTİNGLERİ" ana="Düzenle" T={T}/>
    <div style={{padding:"4px 14px 0"}}>
      <div style={{fontSize:11,color:T.textMut,marginBottom:10}}>Sistem otomatik hesapladı. +/− ile düzeltebilirsin. (1.0 – 10.0)</div>
      {kolon(A, m.renkA, m.takimA)}
      {kolon(B, m.renkB, m.takimB)}
    </div>
    <div style={{position:"fixed",bottom:0,left:0,right:0,maxWidth:1080,margin:"0 auto",padding:"10px 14px calc(10px + env(safe-area-inset-bottom))",background:T.bg0+"F2",borderTop:"0.5px solid "+T.line,display:"flex",gap:8,zIndex:30}}>
      <button onClick={otomatik} className="tap" style={{flex:1,padding:"13px",borderRadius:11,background:T.bg2,color:T.text,fontSize:13,fontWeight:700,border:"1px solid "+T.line}}>🔄 Otomatik</button>
      <button onClick={()=>git({sayfa:"mac",mac:m,turnuva})} className="tap" style={{padding:"13px 16px",borderRadius:11,background:"transparent",color:T.textMut,fontSize:13,fontWeight:700,border:"1px solid "+T.line}}>İptal</button>
      <button onClick={kaydet} className="tap" style={{flex:1.4,padding:"13px",borderRadius:11,background:T.accent,color:T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0,fontSize:14,fontWeight:800}}>💾 Kaydet</button>
    </div>
  </div>;
}

/* ============================================================
   MAÇ GİRİŞ SİHİRBAZI — 5 adımda tek akış
   Adım 1 Kadro (tam: formasyon+saha+takas, iki takım zorunlu)
   Adım 2 Skor + Goller
   Adım 3 Kart + Değişiklik (isteğe bağlı)
   Adım 4 Ödüller (isteğe bağlı)
   Adım 5 Özet + Kaydet
   ============================================================ */
