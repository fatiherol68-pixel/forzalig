function SayacSayi(props){
  const {deger, sure, style, ondalik} = props;
  const sur = sure || 800;
  const ond = ondalik || 0;
  const [g,setG]=useState(0);
  useEffect(()=>{
    const hedef=parseFloat(deger)||0;
    if(hedef===0){ setG(0); return; }
    let bas=null, id;
    const adim=(t)=>{
      if(!bas)bas=t;
      const gecen=t-bas;
      const oran=gecen*(1/sur);
      const p=oran>1?1:oran;
      const e=1-Math.pow(1-p,3);
      setG(hedef*e);
      if(p!==1) id=requestAnimationFrame(adim);
    };
    id=requestAnimationFrame(adim);
    return ()=>cancelAnimationFrame(id);
  },[deger]);
  const gosterim = ond>0 ? g.toFixed(ond) : Math.round(g);
  return React.createElement("span", {style:style}, gosterim);
}

/* Premium stat çubuğu */
function PremBar(props){
  const {deger, max, renk, T} = props;
  const payda = max||99;
  const yuzde=Math.min(100, parseFloat(deger)*(100/payda));
  return React.createElement("div", {className:"prem-bar-track"},
    React.createElement("div", {className:"prem-bar-fill bar-grow", style:{width:yuzde+"%",background:renk||T.accent}})
  );
}

/* Skeleton satır — yüklenirken iskelet (online/ağır listeler için) */
function SkeletonSatir(props){
  const T=props.T;
  const st=(w,h,r)=>React.createElement("div",{className:"skel",style:{width:w,height:h,borderRadius:r||6}});
  return React.createElement("div",{style:{display:"flex",alignItems:"center",gap:11,background:T.bg1,borderRadius:12,padding:"11px 12px",marginBottom:6,border:"0.5px solid "+T.line}},
    st(34,34,"50%"),
    React.createElement("div",{style:{flex:1}},
      st("55%",10),
      React.createElement("div",{style:{height:6}}),
      st("35%",8)
    ),
    st(26,22)
  );
}

/* SVG avatar üreteci — her oyuncu benzersiz yüz */
function svgAvatar(ad, boy, foto){
  // GÜVENLİK: foto HTML attribute'una gömülüyor → kaçış karakterlerini temizle (XSS önlemi).
  // Sadece http(s)/data görsel URL'lerine izin ver; " ' < > backtick'i tamamen at.
  if(foto){ const f=String(foto).replace(/["'<>`\\]/g,""); if(/^(https?:|data:image\/)/i.test(f)) return `<img src="${f}" alt="" width="${boy}" height="${boy}" loading="lazy" decoding="async" style="width:${boy}px;height:${boy}px;object-fit:cover;display:block">`; }
  const h=hash(ad);
  const tenler=["#F2C9A0","#E8B589","#D89B6C","#C68642","#A06A3C","#8D5524"];
  const saclar=["#1A1A1A","#2C1810","#4A2C18","#6B4423","#8B6914","#3A3A3A","#5A3825"];
  const ten=tenler[h%tenler.length];
  const sac=saclar[(h>>3)%saclar.length];
  const sacTip=(h>>6)%3; // 0 kısa, 1 dalgalı, 2 dazlak
  const arka=`hsl(${h%360},45%,30%)`;
  return `<svg width="${boy}" height="${boy}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs><clipPath id="c${h}"><circle cx="50" cy="50" r="50"/></clipPath></defs>
    <g clip-path="url(#c${h})">
      <rect width="100" height="100" fill="${arka}"/>
      <ellipse cx="50" cy="92" rx="34" ry="30" fill="${ten}"/>
      <circle cx="50" cy="46" r="26" fill="${ten}"/>
      ${sacTip===0?`<path d="M24 44 Q24 16 50 16 Q76 16 76 44 Q76 30 50 30 Q24 30 24 44Z" fill="${sac}"/>`:''}
      ${sacTip===1?`<path d="M22 46 Q20 14 50 14 Q80 14 78 46 Q72 34 70 40 Q66 28 58 34 Q54 24 46 32 Q40 26 36 36 Q30 32 28 42 Q24 40 22 46Z" fill="${sac}"/>`:''}
      ${sacTip===2?`<path d="M30 34 Q38 22 50 22 Q62 22 70 34 Q60 30 50 30 Q40 30 30 34Z" fill="${sac}"/>`:''}
      <circle cx="41" cy="46" r="2.6" fill="#2A2A2A"/>
      <circle cx="59" cy="46" r="2.6" fill="#2A2A2A"/>
      <path d="M44 56 Q50 60 56 56" stroke="#00000044" stroke-width="2" fill="none" stroke-linecap="round"/>
    </g>
  </svg>`;
}

/* SVG amblem üreteci — her takım benzersiz logo */
function svgAmblem(ad, renk, boy, logo, renkIki){
  if(logo){ const f=String(logo).replace(/["'<>`\\]/g,""); if(/^(https?:|data:image\/)/i.test(f)) return `<img src="${f}" alt="" width="${boy}" height="${boy}" loading="lazy" decoding="async" style="width:${boy}px;height:${boy}px;object-fit:cover;display:block;border-radius:50%">`; }
  const h=hash(ad);
  const tip=h%3; // kalkan, daire, baklava
  const harf=ad.replace(/[^A-Za-zÇĞİÖŞÜçğıöşü]/g,"")[0]||"F";
  const renk2=renkIki||ikinciRenk(renk); // takımın 2. rengi (seçili yoksa türetilir)
  let sekil;
  if(tip===0) sekil=`<path d="M50 6 L88 20 V52 Q88 82 50 96 Q12 82 12 52 V20Z" fill="${renk}" stroke="${renk2}" stroke-width="3"/>`;
  else if(tip===1) sekil=`<circle cx="50" cy="50" r="44" fill="${renk}" stroke="${renk2}" stroke-width="3"/><circle cx="50" cy="50" r="34" fill="none" stroke="#ffffff55" stroke-width="2"/>`;
  else sekil=`<path d="M50 6 L94 50 L50 94 L6 50Z" fill="${renk}" stroke="${renk2}" stroke-width="3"/>`;
  return `<svg width="${boy}" height="${boy}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    ${sekil}
    <text x="50" y="50" font-size="40" font-weight="800" fill="#fff" text-anchor="middle" dominant-baseline="central" font-family="sans-serif">${harf}</text>
  </svg>`;
}

/* ForzaLig MARKA İMZASI — tüm paylaşılabilir yüzeylerde tek, tutarlı, premium lockup.
   Ekran görüntüsü/sosyal paylaşımda "bu ForzaLig'e ait" ilk bakışta belli olsun (bedava marka).
   variant: dark (koyu zemin) · ink (açık zemin) · gazete (koyu gazete bandı, serif) · ghost (filigran) */
function FzImza({variant="dark", url=true, boy=1, stil}){
  const V={
    dark:  { gGrad:"linear-gradient(135deg,#22E07A,#12B45F)", gCol:"#04140c", gSh:"0 3px 12px -3px rgba(34,224,122,.55)", gBd:"0", nm:"#EAF3EE", nmFont:"'Sora','Inter',sans-serif", u:"#7fd9a8", op:1 },
    ink:   { gGrad:"#141414", gCol:"#F7F4EC", gSh:"none", gBd:"0", nm:"#141414", nmFont:"Georgia,'Times New Roman',serif", u:"#6b6358", op:1 },
    gazete:{ gGrad:"#F7F4EC", gCol:"#1a1a1a", gSh:"none", gBd:"0", nm:"#F7F4EC", nmFont:"Georgia,'Times New Roman',serif", u:"#9a9284", op:1 },
    ghost: { gGrad:"rgba(255,255,255,.14)", gCol:"#fff", gSh:"none", gBd:"1px solid rgba(255,255,255,.3)", nm:"#fff", nmFont:"'Sora','Inter',sans-serif", u:"rgba(255,255,255,.72)", op:.6 }
  }[variant]||{};
  const gb=Math.round(28*boy), gr=Math.round(9*boy);
  return <div style={{display:"inline-flex",alignItems:"center",gap:Math.round(8*boy),opacity:V.op,...(stil||{})}}>
    <div style={{width:gb,height:gb,borderRadius:gr,display:"grid",placeItems:"center",fontSize:Math.round(15*boy),background:V.gGrad,color:V.gCol,boxShadow:V.gSh,border:V.gBd,flexShrink:0}}>⚽</div>
    <div style={{display:"flex",flexDirection:"column",lineHeight:1.05,textAlign:"left"}}>
      <span style={{fontWeight:850,fontSize:Math.round(15*boy),letterSpacing:"-.01em",color:V.nm,fontFamily:V.nmFont}}>ForzaLig</span>
      {url && <span style={{fontSize:Math.round(9*boy),fontWeight:600,letterSpacing:".12em",textTransform:"uppercase",color:V.u,marginTop:2}}>forzalig.com</span>}
    </div>
  </div>;
}

// ===== FAZ 3 — Maç skor kartını GERÇEK görsel (PNG) olarak üret + paylaş =====
// Web Share API (files) varsa doğrudan WhatsApp/Instagram'a yollar; yoksa PNG indirir.
