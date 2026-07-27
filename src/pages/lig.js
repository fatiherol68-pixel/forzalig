function LigGenel({turnuva, T, git}){
  const aktifTurnuva = turnuva;
  const tumOArr=[]; turnuva.takimlar.forEach(tk=>tk.oyuncular.forEach(o=>tumOArr.push(o)));
  const tumO = tumOArr;
  const topTakim = turnuva.takimlar.length;
  const topMac = turnuva.maclar.length;

  // saate göre selamlama
  const saat = new Date().getHours();
  const selam = saat<5?"İyi geceler":saat<12?"Günaydın":saat<18?"Merhaba":saat<23?"İyi akşamlar":"İyi geceler";
  const bugun = new Date().toLocaleDateString("tr-TR",{day:"numeric",month:"long",year:"numeric",weekday:"long"});

  if(!turnuva.takimlar.length) return <BosUyari T={T} metin="Henüz takım yok. Yönet sekmesinden takım ekle." />;

  const tk = aktifTurnuva;
  const lider = tk.takimlar[0];
  const ikinci = tk.takimlar[1]||lider;
  const fark = lider.puan-ikinci.puan;
  const golK = Motor.turnuvaGolKrallari(tk,3);
  const asistK = Motor.turnuvaAsist(tk,3);
  const kurtarisK = Motor.turnuvaKurtaris(tk,2);
  const ilk5 = tk.takimlar.slice(0,5);
  const sonMaclar = [...tk.maclar].reverse().slice(0,5);

  // bu hafta öne çıkanlar
  const enGolluMac = [...tk.maclar].sort((a,b)=>(b.skorA+b.skorB)-(a.skorA+a.skorB))[0];
  const enFarkliMac = [...tk.maclar].sort((a,b)=>Math.abs(b.skorA-b.skorB)-Math.abs(a.skorA-a.skorB))[0];
  const topGolLig = tk.maclar.reduce((s,m)=>s+m.skorA+m.skorB,0);
  const ortGolLig = (topGolLig/Math.max(1,tk.maclar.length)).toFixed(1);
  const enCokGolTakim = [...tk.takimlar].sort((a,b)=>b.ag-a.ag)[0];
  const enCokYiyen = [...tk.takimlar].sort((a,b)=>b.yg-a.yg)[0];

  // akıllı özet cümleleri
  const ozet = [
    {ik:"🏆", t: fark>0?`${lider.ad} liderlikte — ikinci sıraya ${fark} puan fark var.`:`${lider.ad} liderlikte — ikinci ile eşit puanda.`},
    golK[0] && {ik:"⚽", t:`Gol kralı: ${golK[0].ad} (${golK[0].gol} gol) — maç başı ${(golK[0].gol/Math.max(1,golK[0].mac)).toFixed(1)} ortalama.`},
    {ik:"💥", t:`En golcü takım ${enCokGolTakim.ad} — ${enCokGolTakim.ag} gol attı.`},
    {ik:"⚠️", t:`${enCokYiyen.ad} savunmada zorlanıyor — ${enCokYiyen.yg} gol yedi.`},
  ].filter(Boolean);

  return <div className="fade-in main-area" style={{paddingBottom:20}}>
    {/* SEZONU BİTİR / ŞAMPİYON */}
    {turnuva.maclar.some(m=>m.oynandi) && git && <div style={{padding:"10px 14px 0"}}>
      <button onClick={()=>git({sayfa:"sezonsonu",turnuva})} className="tap" style={{width:"100%",padding:13,borderRadius:12,background:T.gold+"18",color:T.gold,fontSize:13,fontWeight:800,border:"1px solid "+T.gold+"55",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>🏆 Sezon Sonu / Şampiyon</button>
    </div>}
    {/* 2-KOLON GRID (telefonda tek kolon) */}
    <div className="ana-grid" style={{padding:"6px 14px"}}>

      {/* === SOL KOLON === */}
      <div style={{display:"flex",flexDirection:"column",gap:14}}>

        {/* HAFTANIN ÖNE ÇIKANI — lider banner */}
        <div onClick={()=>git({sayfa:"takim",takim:lider,turnuva:tk})} className="tap"
          style={{background:`linear-gradient(135deg, ${T.accent}22, ${T.bg1})`,borderRadius:16,padding:"18px 18px 16px",border:"0.5px solid "+T.accent+"44",overflow:"hidden"}}>
          <div style={{fontSize:10,color:T.accent,fontWeight:700,letterSpacing:.6,marginBottom:8,display:"inline-block",background:T.accent+"22",padding:"3px 9px",borderRadius:20}}>HAFTANIN ÖNE ÇIKANI</div>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <Logo renk={lider.renk} ad={lider.ad} logo={lider.logo} renk2={lider.renk2} boy={56}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:20,fontWeight:800,color:T.text,fontFamily:T.fontDisplay,lineHeight:1.1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{lider.ad} zirvede!</div>
              <div style={{fontSize:12,color:T.textSoft,marginTop:3}}>{lider.o} maçta {lider.g} galibiyet. {fark>0?`2. sıraya ${fark} puan fark.`:"Liderlik eşit puanda."}</div>
            </div>
          </div>
          <div style={{display:"flex",gap:14,marginTop:14,paddingTop:12,borderTop:"0.5px solid "+T.line}}>
            <MiniIstatBanner buyuk={lider.puan} etiket="puan" renk={T.gold} T={T}/>
            <MiniIstatBanner buyuk={lider.ag} etiket="attı" renk={T.accent} T={T}/>
            <MiniIstatBanner buyuk={lider.yg} etiket="yedi" renk={T.danger} T={T}/>
            <MiniIstatBanner buyuk={(lider.ag-lider.yg>=0?"+":"")+(lider.ag-lider.yg)} etiket="averaj" renk={T.accent2} T={T}/>
          </div>
        </div>

        {/* BU HAFTA ÖNE ÇIKANLAR (3 kart) */}
        <div>
          <div style={{fontSize:13,fontWeight:700,color:T.text,margin:"0 4px 8px"}}>⭐ Öne Çıkanlar</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
            <OneCikan ik="⚽" et="EN GOLLÜ" ana={enGolluMac?`${enGolluMac.takimA} ${enGolluMac.skorA}-${enGolluMac.skorB} ${enGolluMac.takimB}`:"-"} alt={enGolluMac?(enGolluMac.skorA+enGolluMac.skorB)+" gol":""} T={T} onClick={enGolluMac&&git?()=>git({sayfa:"mac",mac:enGolluMac,turnuva:tk}):null}/>
            <OneCikan ik="🎯" et="EN FARKLI" ana={enFarkliMac?`${enFarkliMac.takimA} ${enFarkliMac.skorA}-${enFarkliMac.skorB} ${enFarkliMac.takimB}`:"-"} alt={enFarkliMac?Math.abs(enFarkliMac.skorA-enFarkliMac.skorB)+" fark":""} T={T} onClick={enFarkliMac&&git?()=>git({sayfa:"mac",mac:enFarkliMac,turnuva:tk}):null}/>
            <OneCikan ik="📊" et="LİG TEMPOSU" ana={tk.maclar.length+" maç"} alt={topGolLig+" gol · ort "+ortGolLig} T={T}/>
          </div>
        </div>

        {/* PUAN DURUMU İLK 5 */}
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"0 4px 8px"}}>
            <span style={{fontSize:13,fontWeight:700,color:T.text}}>🏆 Puan Durumu — İlk 5</span>
            <span onClick={()=>git({sayfa:"turnuva",turnuva:tk})} className="tap" style={{fontSize:11,color:T.accent,fontWeight:600}}>Tüm Liste ›</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"20px 1fr 26px 36px 30px",gap:4,padding:"0 10px 6px",fontSize:9,color:T.textMut,fontWeight:700}}>
            <span>#</span><span>TAKIM</span><span style={{textAlign:"center"}}>O</span><span style={{textAlign:"center"}}>AV</span><span style={{textAlign:"center"}}>P</span>
          </div>
          {ilk5.map(t=>
            <div key={t.id} onClick={()=>git({sayfa:"takim",takim:t,turnuva:tk})} className="tap" style={{display:"grid",gridTemplateColumns:"20px 1fr 26px 36px 30px",gap:4,alignItems:"center",background:t.sira===1?T.gold+"14":T.bg1,borderRadius:9,padding:"8px 10px",marginBottom:4,fontSize:12}}>
              <span style={{color:t.sira===1?T.gold:T.textSoft,fontWeight:700}}>{t.sira}</span>
              <div style={{display:"flex",alignItems:"center",gap:7,minWidth:0}}><Logo renk={t.renk} ad={t.ad} logo={t.logo} renk2={t.renk2} boy={20}/><span style={{color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.ad}</span></div>
              <span style={{textAlign:"center",color:T.textSoft}}>{t.o}</span>
              <span style={{textAlign:"center",color:(t.ag-t.yg)>=0?T.accent:T.danger}}>{(t.ag-t.yg)>=0?"+":""}{t.ag-t.yg}</span>
              <span style={{textAlign:"center",color:T.gold,fontWeight:800,fontFamily:T.fontDisplay,background:T.gold+"18",borderRadius:6,padding:"3px 0"}}>{t.puan}</span>
            </div>
          )}
        </div>

        {/* GOL KRALI (ilk 3) */}
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"0 4px 8px"}}>
            <span style={{fontSize:13,fontWeight:700,color:T.text}}>⚽ Gol Kralı</span>
            <span onClick={()=>git({sayfa:"turnuva",turnuva:tk})} className="tap" style={{fontSize:11,color:T.accent,fontWeight:600}}>Tüm Liste ›</span>
          </div>
          {golK.map((o,i)=>
            <div key={o.id} onClick={()=>git({sayfa:"oyuncu",oyuncu:o})} className="tap" style={{display:"flex",alignItems:"center",gap:11,background:i===0?T.accent+"12":T.bg1,borderRadius:10,padding:"8px 12px",marginBottom:4,border:i===0?"0.5px solid "+T.accent+"33":"0.5px solid "+T.line}}>
              <span style={{width:14,color:i===0?T.accent:T.textMut,fontWeight:700,fontSize:13}}>{i+1}</span>
              <Avatar o={o} boy={i===0?38:30} T={T}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{o.ad}</div>
                <div style={{display:"flex",alignItems:"center",gap:5,marginTop:1}}><span style={{width:6,height:6,borderRadius:"50%",background:o.takimRenk||T.textMut}}/><span style={{fontSize:11,color:T.textMut}}>{o.takimAd}</span></div>
              </div>
              <span style={{fontSize:18,fontWeight:800,color:T.accent,fontFamily:T.fontDisplay}}>{o.gol}</span>
            </div>
          )}
        </div>
      </div>

      {/* === SAĞ KOLON (özet) === */}
      <div style={{display:"flex",flexDirection:"column",gap:14}}>

        {/* 4 KPI 2x2 */}
        <div className="kpi-2x2">
          <KpiMini ik="🏟️" buyuk={topMac} et="maç oynandı" renk={T.accent} T={T}/>
          <KpiMini ik="👥" buyuk={tumO.length} et="aktif oyuncu" renk={T.accent2} T={T}/>
          <KpiMini ik="🏅" buyuk={topTakim} et="takım sayısı" renk={T.gold} T={T}/>
          <KpiMini ik="⚽" buyuk={topGolLig} et={"toplam gol · ort "+ortGolLig} renk={T.danger} T={T}/>
        </div>

        {/* AKILLI ÖZET */}
        <div style={{background:T.bg1,borderRadius:14,padding:"14px",border:"0.5px solid "+T.line}}>
          <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:10}}>
            <span style={{fontSize:14}}>✨</span>
            <span style={{fontSize:12,fontWeight:700,color:T.text}}>Akıllı Özet</span>
            <span style={{fontSize:8,color:T.bg0,background:T.accent,fontWeight:800,padding:"2px 6px",borderRadius:5,letterSpacing:.5}}>AI</span>
          </div>
          {ozet.map((o,i)=>
            <div key={i} style={{display:"flex",gap:9,padding:"8px 0",borderTop:i>0?"0.5px solid "+T.line:"none"}}>
              <span style={{fontSize:14,flexShrink:0}}>{o.ik}</span>
              <span style={{fontSize:12,color:T.textSoft,lineHeight:1.4}}>{o.t}</span>
            </div>
          )}
        </div>

        {/* SON MAÇLAR */}
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"0 4px 8px"}}>
            <span style={{fontSize:13,fontWeight:700,color:T.text}}>🕐 Son Maçlar</span>
            <span onClick={()=>git({sayfa:"turnuva",turnuva:tk})} className="tap" style={{fontSize:11,color:T.accent,fontWeight:600}}>Tüm Maçlar ›</span>
          </div>
          {sonMaclar.map(m=>{
            const aG=m.skorA>m.skorB, bG=m.skorB>m.skorA;
            return <div key={m.id} onClick={()=>git({sayfa:"mac",mac:m,turnuva:tk})} className="tap" style={{display:"flex",alignItems:"center",gap:8,background:T.bg1,borderRadius:10,padding:"9px 11px",marginBottom:4,border:"0.5px solid "+T.line}}>
              <Logo renk={m.renkA} ad={m.takimA} boy={20}/>
              <span style={{flex:1,fontSize:12,color:aG?T.text:T.textSoft,fontWeight:aG?700:400,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",textAlign:"right"}}>{m.takimA}</span>
              <span style={{fontSize:13,fontWeight:800,fontFamily:T.fontDisplay,color:T.text,background:T.bg2,borderRadius:6,padding:"2px 8px",whiteSpace:"nowrap"}}>{m.skorA}-{m.skorB}</span>
              <span style={{flex:1,fontSize:12,color:bG?T.text:T.textSoft,fontWeight:bG?700:400,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{m.takimB}</span>
              <Logo renk={m.renkB} ad={m.takimB} boy={20}/>
            </div>;
          })}
        </div>

        {/* ASİST + KALECİ liderleri mini */}
        <div style={{display:"grid",gridTemplateColumns:"1fr",gap:10}}>
          {asistK[0] && <LiderMiniKart ik="🎯" et="ASİST KRALI" o={asistK[0]} alan="asist" birim="asist" renk={T.accent2} T={T} git={git}/>}
          {kurtarisK[0] && <LiderMiniKart ik="🧤" et="EN İYİ KALECİ" o={kurtarisK[0]} alan="kurtaris" birim="kurtarış" renk={T.gold} T={T} git={git}/>}
        </div>
      </div>
    </div>

  </div>;
}

/* KUPA — eleme şeması (bracket) */
function KupaBracket({turnuva, T, git, yonetim}){
  const maclar=turnuva.maclar||[];
  if(maclar.length===0){
    return <div style={{padding:"30px 24px",textAlign:"center"}}>
      <div style={{fontSize:38,marginBottom:10}}>🏆</div>
      <div style={{fontSize:15,color:T.text,fontWeight:700,marginBottom:6}}>Kupa henüz başlamadı</div>
      <div style={{fontSize:12,color:T.textMut,lineHeight:1.6,maxWidth:300,margin:"0 auto"}}>Takımları ekle, sonra <b style={{color:T.accent}}>Yönet</b> sekmesinden <b>fikstür oluştur</b> — eşleşmeler burada çıkar.</div>
    </div>;
  }
  const turlar={}; maclar.forEach(m=>{ const t=m.tur||1; (turlar[t]=turlar[t]||[]).push(m); });
  const turNolar=Object.keys(turlar).map(Number).sort((a,b)=>a-b);
  const sonTurNo=turNolar[turNolar.length-1];
  const sonMac=turlar[sonTurNo];
  const sonGalip=sonMac.map(kupaGalip);
  const tumBitti=sonGalip.every(g=>g);
  const sampiyon=(sonMac.length===1 && tumBitti)?sonGalip[0]:null;
  const sonrakiOlur=tumBitti && sonGalip.length>1;

  return <div className="fade-in" style={{padding:"12px 14px 20px"}}>
    {sampiyon && <div className="vav-hero" style={{position:"relative",overflow:"hidden",textAlign:"center",background:"linear-gradient(120deg,"+T.gold+"3a,"+T.bg1+" 55%,"+T.gold+"26)",border:"1px solid "+T.gold+"66",borderRadius:16,padding:"18px 14px",marginBottom:16}}>
      <div className="vav-supurme"/>
      <div style={{position:"relative",zIndex:1}}>
        <div style={{fontSize:30,marginBottom:4}}>🏆</div>
        <div style={{fontSize:10,color:T.gold,fontWeight:800,letterSpacing:1}}>ŞAMPİYON</div>
        <div className="vav-parla" style={{fontSize:22,fontWeight:800,color:T.gold,fontFamily:T.fontDisplay}}>{sampiyon.ad}</div>
      </div>
    </div>}
    {turNolar.slice().reverse().map(tn=>{
      const ms=turlar[tn];
      return <div key={tn} style={{marginBottom:16}}>
        <div style={{fontSize:11,color:T.gold,fontWeight:800,marginBottom:8,letterSpacing:.5}}>{kupaTurAd(ms.length)}</div>
        {ms.map(m=>{
          const g=kupaGalip(m);
          const beraber=!m.bye && m.oynandi && m.skorA===m.skorB;
          const aKazandi=g&&g.id===m.takimAId, bKazandi=g&&g.id===m.takimBId;
          return <div key={m.id} style={{background:T.bg1,border:"0.5px solid "+T.line,borderRadius:11,padding:"9px 11px",marginBottom:7}}>
            <div onClick={()=>!m.bye&&git({sayfa:"mac",mac:m,turnuva})} className={m.bye?"":"tap"} style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{flex:1,fontWeight:aKazandi?800:500,color:aKazandi?T.accent:T.text,fontSize:13,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{aKazandi?"✓ ":""}{m.takimA}</span>
              <span style={{fontFamily:T.fontDisplay,fontWeight:800,fontSize:14,color:m.oynandi?T.text:T.textMut,minWidth:46,textAlign:"center",background:T.bg2,borderRadius:7,padding:"3px 0"}}>{m.bye?"BAY":m.oynandi?`${m.skorA}-${m.skorB}`:"– : –"}</span>
              <span style={{flex:1,textAlign:"right",fontWeight:bKazandi?800:500,color:bKazandi?T.accent:T.text,fontSize:13,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{m.takimB}{bKazandi?" ✓":""}</span>
            </div>
            {beraber && <div style={{marginTop:8,paddingTop:8,borderTop:"0.5px solid "+T.line}}>
              <div style={{fontSize:10,color:T.gold,marginBottom:6,textAlign:"center"}}>⚽ Beraberlik — penaltı galibi kim?</div>
              <div style={{display:"flex",gap:6}}>
                {[m.takimA,m.takimB].map(ad=><button key={ad} onClick={()=>yonetim&&yonetim.penGalipSec&&yonetim.penGalipSec(turnuva,m,ad)} disabled={!yonetim} className="tap" style={{flex:1,padding:"8px",borderRadius:8,fontSize:11,fontWeight:700,background:m.penGalip===ad?T.accent:T.bg2,color:m.penGalip===ad?T.bg0:T.textSoft,border:"0.5px solid "+(m.penGalip===ad?T.accent:T.line),opacity:yonetim?1:.6}}>{ad}</button>)}
              </div>
            </div>}
          </div>;
        })}
      </div>;
    })}
    {yonetim && sonrakiOlur && <button onClick={()=>yonetim.kupaSonraki(turnuva)} className="tap vav-bar" style={{width:"100%",background:T.gold,color:T.bg0,border:0,borderRadius:12,padding:13,fontSize:14,fontWeight:800,marginTop:4}}>Sonraki Turu Oluştur →</button>}
    {yonetim && !tumBitti && !sampiyon && <div style={{fontSize:11,color:T.textMut,textAlign:"center",marginTop:8}}>Bu turdaki maçları bitirince "sonraki tur" açılır.</div>}
  </div>;
}

/* YARDIMCI (YEDEK) LİG YÖNETİCİLERİ — asıl sahip ekler/çıkarır; yardımcı sadece bu ligi yönetir */
function YardimciYonetim({turnuva, T, oturum, sahip}){
  const [liste,setListe]=useState([]);
  const [mail,setMail]=useState("");
  const [yuk,setYuk]=useState(true);
  const [mesaj,setMesaj]=useState("");
  const yukle=()=>{ Db.yardimciListe(turnuva.id).then(l=>{ setListe(l||[]); setYuk(false); }); };
  useEffect(()=>{ yukle(); },[turnuva.id]);
  const ekle=async()=>{ const e=(mail||"").trim().toLowerCase(); if(!e) return; setMesaj(""); const r=await Db.yardimciEkle(turnuva.id, e); if(r&&r.ok){ setMail(""); setMesaj("✓ Eklendi"); yukle(); } else setMesaj("⚠️ "+((r&&r.hata)||"olmadı")); };
  const cikar=async(u)=>{ if(!confirm((u.ad||u.email)+" yardımcı yöneticilikten çıkarılsın mı?")) return; const r=await Db.yardimciKaldir(turnuva.id, u.user_id); if(r&&r.ok){ setListe(p=>p.filter(x=>x.user_id!==u.user_id)); } else setMesaj("⚠️ "+((r&&r.hata)||"olmadı")); };
  return <div style={{padding:"6px 14px 24px"}}>
    <div style={{background:"linear-gradient(180deg,"+T.bg1+","+T.bg2+")",border:"1px solid "+T.line,borderRadius:16,padding:16}}>
      <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:8}}>
        <span style={{width:34,height:34,borderRadius:10,background:T.accent+"1e",display:"grid",placeItems:"center",fontSize:17}}>👥</span>
        <div style={{minWidth:0}}><div style={{fontSize:14,fontWeight:800,color:T.text}}>Yardımcı Yöneticiler</div><div style={{fontSize:10.5,color:T.textMut}}>Bu ligi seninle birlikte yönetenler (yedek)</div></div>
      </div>
      <div style={{fontSize:11.5,color:T.textSoft,lineHeight:1.55,background:T.bg0,borderRadius:10,padding:"10px 12px",margin:"4px 0 12px",border:"0.5px solid "+T.line}}>
        💡 Yardımcı yönetici <b style={{color:T.text}}>sadece bu ligi</b> yönetir (takım / maç / oyuncu). <b style={{color:T.text}}>Kendine lig hakkı almaz</b>, yeni lig kuramaz. İstediğin an çıkarabilirsin.
      </div>
      {yuk ? <div style={{fontSize:12,color:T.textMut,textAlign:"center",padding:12}}>Yükleniyor…</div> : <>
        {liste.length===0 && <div style={{fontSize:12,color:T.textMut,textAlign:"center",padding:"10px 0"}}>Henüz yardımcı yönetici yok.</div>}
        {liste.map(u=>
          <div key={u.user_id} style={{display:"flex",alignItems:"center",gap:10,background:T.bg0,border:"0.5px solid "+T.line,borderRadius:11,padding:"9px 12px",marginBottom:6}}>
            <span style={{width:30,height:30,borderRadius:"50%",background:T.accent2+"22",display:"grid",placeItems:"center",fontSize:13,color:T.accent2,fontWeight:800,flexShrink:0}}>{((u.ad||u.email||"?").charAt(0)||"?").toUpperCase()}</span>
            <div style={{flex:1,minWidth:0}}><div style={{fontSize:12.5,fontWeight:600,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{u.ad||u.email}</div><div style={{fontSize:10,color:T.textMut,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{u.email}</div></div>
            <span style={{fontSize:9,fontWeight:800,color:T.accent2,background:T.accent2+"1a",borderRadius:6,padding:"3px 7px",whiteSpace:"nowrap"}}>YARDIMCI</span>
            {sahip && <button onClick={()=>cikar(u)} className="tap" style={{fontSize:11,color:T.danger,background:"none",border:"0.5px solid "+T.line,borderRadius:8,padding:"5px 9px",fontWeight:700}}>Çıkar</button>}
          </div>
        )}
        {sahip
          ? <div style={{display:"flex",gap:8,marginTop:10}}>
              <input value={mail} onChange={e=>setMail(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter") ekle(); }} placeholder="yardimci@mail.com" style={{flex:1,minWidth:0,background:T.bg0,border:"0.5px solid "+T.line,borderRadius:10,padding:"11px",color:T.text,fontSize:13,outline:"none",fontFamily:"inherit"}}/>
              <button onClick={ekle} className="tap" style={{background:T.accent,color:T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0,border:0,borderRadius:10,padding:"0 18px",fontSize:13,fontWeight:800}}>+ Ekle</button>
            </div>
          : <div style={{fontSize:11,color:T.textMut,marginTop:8,lineHeight:1.5}}>Sen bu ligin <b style={{color:T.accent2}}>yardımcı yöneticisisin</b>. Yeni yardımcı ekleme yetkisi ligin asıl sahibinde.</div>}
        {mesaj && <div style={{fontSize:11.5,color:/✓/.test(mesaj)?T.accent:T.danger,textAlign:"center",marginTop:8}}>{mesaj}</div>}
      </>}
    </div>
  </div>;
}

/* Düz metni (Word/not defterinden yapıştırılan) başlık + madde bloklarına ayır */
function _kuralAyristir(metin){
  const bloklar=[];
  (metin||"").replace(/\r/g,"").split("\n").forEach(ham=>{
    const s=ham.trim(); let m;
    if(!s){ bloklar.push({t:"bos"}); return; }
    if(m=s.match(/^#{1,3}\s+(.*)/)){ bloklar.push({t:"h",x:m[1]}); return; }
    if(m=s.match(/^(\d+)[\.\)]\s+(.*)/)){ bloklar.push({t:"h",x:m[2],n:m[1]}); return; }
    if(m=s.match(/^[-•*·]\s+(.*)/)){ bloklar.push({t:"li",x:m[1]}); return; }
    if(/:$/.test(s) && s.length<=46){ bloklar.push({t:"h",x:s.replace(/:$/,"")}); return; }
    if(s.length<=46 && s===s.toLocaleUpperCase("tr") && /[A-ZÇĞİÖŞÜ]/.test(s)){ bloklar.push({t:"h",x:s}); return; }
    bloklar.push({t:"p",x:s});
  });
  return bloklar;
}
function LigKurallar({turnuva, T, yonetim}){
  const yonetici=!!yonetim;
  const [kur,setKur]=React.useState(turnuva.kurallar||"");
  const [duzenle,setDuzenle]=React.useState(false);
  const [metin,setMetin]=React.useState(turnuva.kurallar||"");
  const [kayit,setKayit]=React.useState("");
  const kaydet=()=>{ const v=(metin||"").trim(); setKur(v); turnuva.kurallar=v; if(yonetim&&yonetim.ligGuncelle) yonetim.ligGuncelle(turnuva,{kurallar:v}); setDuzenle(false); setKayit("✓ Kaydedildi ve yayınlandı"); setTimeout(()=>setKayit(""),2600); };
  let no=0; const bloklar=_kuralAyristir(kur);
  return <div className="fade-in" style={{padding:"12px 14px"}}>
    {kayit && <div style={{fontSize:12,color:T.accent,fontWeight:700,marginBottom:10,textAlign:"center"}}>{kayit}</div>}
    {duzenle
      ? <div style={{background:T.bg1,border:"1px dashed "+T.accent+"66",borderRadius:14,padding:14}}>
          <div style={{fontSize:12,color:T.textMut,marginBottom:9,display:"flex",alignItems:"center",gap:7}}>📋 Word / not defterinden kopyalayıp buraya yapıştır — otomatik düzenli görünür.</div>
          <textarea value={metin} onChange={e=>setMetin(e.target.value)} placeholder={"Örnek:\n1. Genel\n- Maçlar Cuma 20:00 başlar\n- Takım en az 5 oyuncu\n2. Ödemeler\n- Saha ücreti kişi 50 TL"} style={{width:"100%",minHeight:220,background:T.bg2,border:"0.5px solid "+T.line,borderRadius:11,padding:13,color:T.text,fontSize:13.5,lineHeight:1.6,outline:"none",fontFamily:"inherit",resize:"vertical"}}/>
          <div style={{fontSize:10.5,color:T.textMut,margin:"7px 2px 12px",lineHeight:1.5}}>İpucu: <b style={{color:T.textSoft}}>1.</b> veya <b style={{color:T.textSoft}}>#</b> ile başlayan satır → başlık · <b style={{color:T.textSoft}}>-</b> ile başlayan satır → madde.</div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={kaydet} className="tap" style={{flex:1.4,background:T.accent,color:T.renkCifti&&T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0,border:0,borderRadius:11,padding:"11px",fontSize:13,fontWeight:800}}>💾 Kaydet ve yayınla</button>
            <button onClick={()=>{ setMetin(kur); setDuzenle(false); }} className="tap" style={{flex:1,background:T.bg2,color:T.textSoft,border:"0.5px solid "+T.line,borderRadius:11,padding:"11px",fontSize:13,fontWeight:700}}>Vazgeç</button>
          </div>
        </div>
      : <>
          {yonetici && <div style={{display:"flex",justifyContent:"flex-end",marginBottom:10}}>
            <button onClick={()=>{ setMetin(kur); setDuzenle(true); }} className="tap" style={{fontSize:12,color:T.accent,background:T.accent+"14",border:"0.5px solid "+T.accent+"44",borderRadius:9,padding:"7px 13px",fontWeight:800}}>✍️ {kur?"Düzenle":"Kural ekle"}</button>
          </div>}
          {!kur
            ? <BosUyari T={T} metin={yonetici?"Henüz kural yok. “Kural ekle” ile Word'den kopyala-yapıştır yapabilirsin.":"Lig yöneticisi henüz kural eklemedi."} ikon="📋"/>
            : <div style={{background:T.bg1,border:"0.5px solid "+T.line,borderRadius:14,padding:"20px 20px"}}>
                <div style={{fontSize:17,fontWeight:850,color:T.text,letterSpacing:"-.3px",marginBottom:14,paddingBottom:12,borderBottom:"1px solid "+T.line}}>{turnuva.ad} · Kuralları</div>
                {bloklar.map((b,i)=>{
                  if(b.t==="bos") return <div key={i} style={{height:7}}/>;
                  if(b.t==="h"){ no++; return <div key={i} style={{fontSize:13.5,fontWeight:800,color:T.accent,margin:(i?"15px":"0")+" 0 7px",display:"flex",alignItems:"center",gap:8}}>{b.n&&<span style={{width:20,height:20,borderRadius:6,background:T.accent+"1f",color:T.accent,display:"grid",placeItems:"center",fontSize:11,fontWeight:800,flexShrink:0}}>{b.n}</span>}<span>{b.x}</span></div>; }
                  if(b.t==="li") return <div key={i} style={{fontSize:13,color:T.textSoft,display:"flex",gap:9,lineHeight:1.55,padding:"3px 0"}}><span style={{flexShrink:0,width:5,height:5,borderRadius:"50%",background:T.accent,marginTop:8}}/><span>{b.x}</span></div>;
                  return <div key={i} style={{fontSize:13,color:T.textSoft,lineHeight:1.6,padding:"2px 0"}}>{b.x}</div>;
                })}
              </div>}
        </>}
  </div>;
}
function TurnuvaSayfa({turnuva, T, git, takipLig, ligTakip, yonetim, oturum, saltOkunur, onPaylas, onPaylasKaldir, ilkTab}){
  const [tab,setTab]=useState((ilkTab&&yonetim)?ilkTab:"genel");
  const [paylasAcik,setPaylasAcik]=useState(false);
  const [paylasUrl,setPaylasUrl]=useState(turnuva.paylasimSlug?PAYLASIM_URL(turnuva.paylasimSlug):"");
  const [paylasYuk,setPaylasYuk]=useState(false);
  const [paylasHata,setPaylasHata]=useState("");
  const [kopyalandi,setKopyalandi]=useState(false);
  const paylasAc=async()=>{
    setPaylasAcik(true); setPaylasHata("");
    if(!turnuva.paylasimSlug){
      setPaylasYuk(true);
      const r=await onPaylas(turnuva);
      setPaylasYuk(false);
      if(r&&r.url){ setPaylasUrl(r.url); } else { setPaylasHata((r&&r.hata)||"Yayınlanamadı."); }
    } else { setPaylasUrl(PAYLASIM_URL(turnuva.paylasimSlug)); }
  };
  const kopyala=()=>{ try{ navigator.clipboard.writeText(paylasUrl); setKopyalandi(true); setTimeout(()=>setKopyalandi(false),1800); }catch(e){} };
  const cihazPaylas=()=>{ try{ if(navigator.share) navigator.share({title:turnuva.ad+" · ForzaLig", text:turnuva.ad+" ligini ForzaLig'de gör:", url:paylasUrl}); else kopyala(); }catch(e){} };
  const yayindanKaldir=async()=>{ await onPaylasKaldir(turnuva); setPaylasUrl(""); setPaylasAcik(false); };
  const [kralTab,setKralTab]=useState("gol");
  const [kralGrup,setKralGrup]=useState(-1); // -1 = tümü, 0,1,2.. grup
  const gruplu = turnuva.format==="gruplu";
  const grupSayisi = gruplu ? Math.max(1,...turnuva.takimlar.map(t=>(t.grup||0)+1)) : 0;
  const grupAd=(gi)=> String.fromCharCode(65+gi)+" Grubu";
  // oyuncunun grubunu bul (takımından)
  const oyuncuGrubu=(oy)=>{ const tk=turnuva.takimlar.find(t=>t.oyuncular.some(p=>p.id===oy.id)); return tk?(tk.grup||0):-1; };
  const grupFiltrele=(liste)=> kralGrup<0 ? liste : liste.filter(o=>oyuncuGrubu(o)===kralGrup);
  const [onbirTip,setOnbirTip]=useState("altin");
  // Krallar/ödül grup filtresi: grup seçiliyse SADECE o grubun takımlarından hesapla
  const kralTurnuva = (gruplu && kralGrup>=0) ? {...turnuva, takimlar: turnuva.takimlar.filter(t=>(t.grup||0)===kralGrup)} : turnuva;
  const golK=Motor.turnuvaGolKrallari(kralTurnuva,5);
  const asistK=Motor.turnuvaAsist(kralTurnuva,5);
  const kurtarisK=Motor.turnuvaKurtaris(kralTurnuva,5);
  const takipte = takipLig && takipLig.includes(turnuva.id);

  // durum hesabı
  const oynanan=turnuva.maclar.filter(m=>m.oynandi).length;
  const toplamMac=turnuva.maclar.length;
  const haftalar=[...new Set(turnuva.maclar.filter(m=>m.oynandi).map(m=>m.hafta))];
  const sonHafta=haftalar.length?Math.max(...haftalar):0;
  let durumYazi="HAZIRLIK", durumRenk=T.textMut;
  if(oynanan>0 && toplamMac>0 && oynanan>=toplamMac){ durumYazi="BİTTİ"; durumRenk=T.textMut; }
  else if(oynanan>0){ durumYazi="DEVAM"; durumRenk=T.accent; }

  const lider=[...turnuva.takimlar].sort((a,b)=>(b.puan||0)-(a.puan||0))[0];
  const formatAd={serbest:"Serbest",tek:"Tek Devre",cift:"Çift Devre",gruplu:"Gruplu",kupa:"🏆 Kupa"}[turnuva.format]||"Serbest";

  // AKIŞ olayları (otomatik)
  const akisOlaylar=useMemo(()=>{
    const ev=[];
    const sonMaclar=turnuva.maclar.filter(m=>m.oynandi).slice(-1);
    sonMaclar.forEach(m=>{
      ev.push({renk:T.accent,et:"⚽ HAFTANIN MAÇI",ad:`${m.takimA} ${m.skorA}-${m.skorB} ${m.takimB}`,alt:"gazeteyi gör →",mac:m});
    });
    if(lider && oynanan>0) ev.push({renk:T.accent2,et:"📈 LİDER",ad:`${lider.ad} zirvede`,alt:`${lider.puan} puanla 1. sıra`});
    if(golK[0]) ev.push({renk:T.gold,et:"👑 GOL KRALI",ad:`${golK[0].ad} ${golK[0].gol} golle önde`,alt:""});
    if(sonHafta>0) ev.push({renk:T.accent,et:"🏁 HAFTA",ad:`${sonHafta}. hafta oynandı`,alt:`ligde toplam ${turnuva.maclar.filter(m=>m.oynandi).reduce((s,m)=>s+m.skorA+m.skorB,0)} gol`});
    if(ev.length===0) ev.push({renk:T.textMut,et:"BİLGİ",ad:"Henüz maç oynanmadı",alt:"maçlar oynandıkça burada görünecek"});
    return ev;
  },[turnuva.id, oynanan]);

  const onbir=Motor.ideal11(turnuva, onbirTip);
  const pozKisa=(p)=>p==="Kaleci"?"K":p==="Defans"?"D":p==="OrtaSaha"?"O":"F";
  const ist=useMemo(()=>Motor.ligIstatistik(turnuva),[turnuva.id, oynanan]);

  const kupaMi = turnuva.format==="kupa";
  const sekmeler = kupaMi
    ? [["kupa","🏆 Kupa"],["genel","Genel"],["kadro","🏅 Kadro"],["krallar","Krallar"],["enler","🏆 Enler"],["ist","İstatistik"]]
    : [["genel","Genel"],["akis","Akış"],["kadro","🏅 Kadro"],["puan","Puan Durumu"],["takimlar","🛡️ Takımlar"],["fikstur","Fikstür"],["kurallar","📋 Kurallar"],["krallar","Krallar"],["enler","🏆 Enler"],["ist","İstatistik"]];
  if(yonetim) sekmeler.push(["yonet","⚙️ Yönet"]);
  useEffect(()=>{ if(kupaMi) setTab("kupa"); },[]);

  // ödüller (krallar alt sekmesi için)
  const ODULLER=[["altin","🥇 Altın Top"],["gumus","🥈 Gümüş Top"],["forvet","⚡ En İyi Forvet"],["ortasaha","⚙️ En İyi Orta Saha"],["defans","🛡️ En İyi Defans"],["kaleci","🧤 En İyi Kaleci"],["macinGolu","🎯 Maçın Golü"],["centilmen","🤝 Centilmen"],["enerjik","🔥 Enerjik"]];

  return <div className="fade-in" style={{paddingBottom:90}}>
    {/* PREMIUM KAPAK HERO */}
    <div style={{padding:"12px 14px 0"}}>
      <div style={{position:"relative",overflow:"hidden",borderRadius:20,padding:"15px 16px 14px",border:"1px solid "+turnuva.renk+"55",
        background:"radial-gradient(120% 150% at 88% 0%,"+turnuva.renk+"4d,transparent 55%), linear-gradient(160deg,"+T.bg1+","+T.bg0+" 72%)",boxShadow:"0 18px 46px rgba(0,0,0,.34)"}}>
        <div style={{position:"absolute",inset:0,pointerEvents:"none",opacity:.55,background:"repeating-linear-gradient(115deg,transparent,transparent 22px,"+T.accent+"0A 22px,"+T.accent+"0A 24px)"}}/>
        {/* durum + stat şerit */}
        <div style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
          <span style={{display:"inline-flex",alignItems:"center",gap:6,fontSize:9.5,fontWeight:800,letterSpacing:.6,color:durumRenk,background:durumRenk+"1e",border:"1px solid "+durumRenk+"44",borderRadius:20,padding:"4px 10px"}}>
            {durumYazi==="DEVAM" && <span className="fz-nabiz" style={{width:6,height:6,borderRadius:"50%",background:durumRenk}}/>}{durumYazi}
          </span>
          <div style={{display:"flex",gap:14,textAlign:"center"}}>
            {[["TAKIM",turnuva.takimlar.length],["HAFTA",sonHafta||"—"],["MAÇ",oynanan+"/"+toplamMac]].map(([k,v])=>
              <div key={k}><div style={{fontSize:15,fontWeight:800,color:T.text,fontFamily:T.fontDisplay,lineHeight:1}}>{v}</div><div style={{fontSize:7.5,color:T.textSoft,letterSpacing:.5,marginTop:2}}>{k}</div></div>
            )}
          </div>
        </div>
        {/* logo + başlık */}
        <div style={{position:"relative",display:"flex",alignItems:"center",gap:13,marginTop:14}}>
          <div style={{borderRadius:15,overflow:"hidden",flexShrink:0,boxShadow:"0 8px 20px rgba(0,0,0,.4)"}}><Logo renk={turnuva.renk} ad={turnuva.ad} logo={turnuva.logo} renk2={turnuva.renk2} boy={54}/></div>
          <div style={{minWidth:0}}>
            <div style={{fontSize:20,fontWeight:800,color:T.text,fontFamily:T.fontDisplay,lineHeight:1.05,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{turnuva.ad}</div>
            <div style={{fontSize:11,color:T.textSoft,marginTop:3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>📍 {turnuva.sehir}{turnuva.ilce?" · "+turnuva.ilce:""} · ⚽ {turnuva.kisi} kişi · {formatAd}</div>
          </div>
        </div>
        {/* aksiyonlar */}
        <div style={{position:"relative",display:"flex",gap:8,marginTop:14,flexWrap:"wrap"}}>
          {!saltOkunur && oturum && turnuva.iliskisel && <button onClick={()=>git({sayfa:"sohbet",turnuva})} className="tap" style={{background:"transparent",color:T.accent2,border:"1px solid "+T.accent2,borderRadius:20,padding:"0 14px",height:32,fontSize:12,fontWeight:700}}>💬 Sohbet</button>}
          {!saltOkunur && oturum && <button onClick={paylasAc} className="tap" style={{background:turnuva.paylasimSlug?T.accent:"transparent",color:turnuva.paylasimSlug?(T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0):T.gold,border:"1px solid "+(turnuva.paylasimSlug?T.accent:T.gold),borderRadius:20,padding:"0 14px",height:32,fontSize:12,fontWeight:700}}>{turnuva.paylasimSlug?"🔗 Paylaşımda":"🔗 Paylaş"}</button>}
          {ligTakip && <button onClick={()=>ligTakip(turnuva.id)} className="tap" style={{background:takipte?T.accent:"transparent",color:takipte?(T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0):T.accent,border:"1px solid "+T.accent,borderRadius:20,padding:"0 16px",height:32,fontSize:12,fontWeight:700}}>{takipte?"✓ Takipte":"+ Takip et"}</button>}
        </div>
      </div>
    </div>

    {/* PAYLAŞ MODAL */}
    {paylasAcik && <div onClick={()=>setPaylasAcik(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:1500,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} className="fade-in" style={{width:"100%",maxWidth:460,background:T.bg1,borderRadius:"18px 18px 0 0",padding:"18px 18px calc(24px + env(safe-area-inset-bottom))",border:"0.5px solid "+T.line}}>
        <div style={{width:40,height:4,background:T.line,borderRadius:2,margin:"0 auto 14px"}}/>
        <div style={{fontFamily:T.fontDisplay,fontSize:17,fontWeight:800,color:T.text,marginBottom:4}}>🔗 Ligi Paylaş</div>
        <div style={{fontSize:12,color:T.textMut,marginBottom:16}}>Bu linke tıklayan herkes ligi <b style={{color:T.accent}}>giriş yapmadan</b> görebilir (salt-okunur).</div>
        {paylasYuk ? <div style={{textAlign:"center",padding:20,color:T.textMut,fontSize:13}}>⚽ Yayınlanıyor…</div> :
         paylasHata ? <div style={{fontSize:12,color:T.danger,background:T.danger+"18",borderRadius:10,padding:12,marginBottom:12}}>{paylasHata}</div> :
         <>
          {(()=>{ const d=qrData(paylasUrl); return d ? <div style={{display:"flex",justifyContent:"center",marginBottom:12}}>
            <div style={{background:"#fff",padding:10,borderRadius:12}}><img src={d} alt="QR" style={{width:150,height:150,display:"block",imageRendering:"pixelated"}}/></div>
          </div> : null; })()}
          <div style={{display:"flex",gap:8,alignItems:"center",background:T.bg0,border:"0.5px solid "+T.line,borderRadius:11,padding:"11px 12px",marginBottom:12}}>
            <span style={{flex:1,fontSize:12,color:T.textSoft,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{paylasUrl}</span>
            <button onClick={kopyala} className="tap" style={{background:T.accent,color:T.bg0,border:0,borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:700,whiteSpace:"nowrap"}}>{kopyalandi?"Kopyalandı ✓":"Kopyala"}</button>
          </div>
          <button onClick={cihazPaylas} className="tap" style={{width:"100%",background:T.accent,color:T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0,border:0,borderRadius:12,padding:13,fontSize:14,fontWeight:800,marginBottom:8}}>📲 Paylaş</button>
          <button onClick={yayindanKaldir} className="tap" style={{width:"100%",background:"transparent",color:T.danger,border:"0.5px solid "+T.danger+"55",borderRadius:12,padding:11,fontSize:12.5,fontWeight:600}}>Yayından kaldır</button>
         </>}
        <button onClick={()=>setPaylasAcik(false)} className="tap" style={{width:"100%",background:"transparent",color:T.textMut,border:0,padding:10,fontSize:12.5,marginTop:6}}>Kapat</button>
      </div>
    </div>}
    {/* SPONSOR BARI */}
    {turnuva.sponsorAd && <div style={{margin:"6px 14px 2px",display:"flex",alignItems:"center",gap:10,background:"linear-gradient(120deg,"+T.gold+"1f,"+T.bg1+")",border:"1px solid "+T.gold+"44",borderRadius:12,padding:"9px 12px"}}>
      <div style={{width:34,height:34,borderRadius:9,background:T.gold+"2a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{turnuva.sponsorEmoji||"🏟️"}</div>
      <div style={{flex:1,minWidth:0}}><div style={{fontSize:12.5,fontWeight:700,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{turnuva.sponsorAd}</div><div style={{fontSize:9.5,color:T.textMut}}>bu ligin sponsoru</div></div>
      <span style={{fontSize:9,color:T.gold,fontWeight:800,letterSpacing:.5}}>SPONSOR</span>
    </div>}

    <div style={{display:"flex",padding:"8px 8px 0",borderBottom:"1px solid "+T.line,overflowX:"auto"}}>
      {sekmeler.map(([k,l])=>
        <button key={k} onClick={()=>setTab(k)} className="tap" style={{background:"none",border:0,padding:"9px 11px",color:tab===k?T.accent:T.textMut,borderBottom:"2px solid "+(tab===k?T.accent:"transparent"),fontWeight:tab===k?700:600,fontSize:12,whiteSpace:"nowrap"}}>{l}</button>
      )}
    </div>

    {/* ===== GENEL (zengin özet) ===== */}
    {tab==="kupa" && <KupaBracket turnuva={turnuva} T={T} git={git} yonetim={yonetim}/>}

    {tab==="genel" && (turnuva.takimlar.length>0 ? <LigGenel turnuva={turnuva} T={T} git={git}/> : <BosUyari T={T} metin="Henüz takım yok. Yönet sekmesinden takım ekle." />)}

    {tab==="kadro" && (turnuva.takimlar.length>0 ? <KadroEkrani turnuva={turnuva} T={T} git={git}/> : <BosUyari T={T} metin="Henüz takım yok. Yönet sekmesinden takım ekle." />)}

    {/* ===== AKIŞ ===== */}
    {tab==="akis" && <div className="fade-in" style={{padding:"12px 14px",display:"flex",flexDirection:"column",gap:9}}>
      {/* Haftanın Kadrosu — teaser (tam ekran Kadro sekmesinde) */}
      <div onClick={()=>setTab("kadro")} className="tap" style={{cursor:"pointer",background:"linear-gradient(135deg,"+T.gold+"22,"+T.bg1+")",borderRadius:12,padding:13,border:"0.5px solid "+T.gold+"55",display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:40,height:40,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:21,background:"radial-gradient(circle at 35% 30%,#F0CB6E,"+T.gold+" 60%,#6f531b)",boxShadow:"0 0 0 3px "+T.gold+"33"}}>🥇</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:9,fontWeight:800,letterSpacing:1.2,color:T.gold,textTransform:"uppercase"}}>{sonHafta?sonHafta+". HAFTA":"HAFTANIN"}</div>
          <div style={{fontSize:15,fontWeight:800,color:T.text,fontFamily:T.fontDisplay}}>Altın & Gümüş Kadro</div>
          <div style={{fontSize:10.5,color:T.textMut,marginTop:1}}>Performans reytingine göre haftanın 11'i · dokun →</div>
        </div>
        <span style={{fontSize:20,color:T.gold,flexShrink:0}}>›</span>
      </div>
      {akisOlaylar.map((e,i)=>
        <div key={i} onClick={()=>e.mac&&git({sayfa:"gazete",mac:e.mac,turnuva})} className={e.mac?"tap":""} style={{background:T.bg1,borderRadius:11,padding:11,border:"0.5px solid "+T.line,borderLeft:"3px solid "+e.renk,cursor:e.mac?"pointer":"default"}}>
          <div style={{fontSize:9,color:e.renk,fontWeight:700}}>{e.et}</div>
          <div style={{fontSize:13,color:T.text,fontWeight:600,marginTop:3}}>{e.ad}</div>
          {e.alt && <div style={{fontSize:11,color:T.textMut,marginTop:2}}>{e.alt}</div>}
        </div>
      )}
    </div>}

    {tab==="puan" && (turnuva.takimlar.length>0 ? <PuanDurumu turnuva={turnuva} T={T} git={git}/> : <BosUyari T={T} metin="Henüz takım yok. Yönet sekmesinden takım ekle." />)}

    {tab==="fikstur" && (turnuva.maclar.length>0 ? <MaclarSayfa turnuva={turnuva} T={T} git={git}/> : <BosUyari T={T} metin="Henüz maç yok. Yönet sekmesinden maç ekle." />)}

    {/* ===== KRALLAR (alt geçişli) ===== */}
    {tab==="krallar" && <div className="fade-in" style={{padding:"12px 14px"}}>
      {gruplu && grupSayisi>1 && <div style={{display:"flex",gap:5,marginBottom:10,flexWrap:"wrap"}}>
        <span onClick={()=>setKralGrup(-1)} className="tap" style={{fontSize:10.5,padding:"5px 11px",borderRadius:13,background:kralGrup===-1?T.accent:T.bg2,color:kralGrup===-1?"#fff":T.textMut,fontWeight:kralGrup===-1?700:500}}>Tümü</span>
        {Array.from({length:grupSayisi}).map((_,gi)=>
          <span key={gi} onClick={()=>setKralGrup(gi)} className="tap" style={{fontSize:10.5,padding:"5px 11px",borderRadius:13,background:kralGrup===gi?T.accent:T.bg2,color:kralGrup===gi?"#fff":T.textMut,fontWeight:kralGrup===gi?700:500}}>{grupAd(gi)}</span>
        )}
      </div>}
      <div style={{display:"flex",gap:6,marginBottom:14}}>
        {[["gol","⚽ Gol"],["asist","🎯 Asist"],["kurtaris","🧤 Kurtarış"],["odul","🏆 Ödül"]].map(([k,l])=>
          <button key={k} onClick={()=>setKralTab(k)} className="tap" style={{flex:1,padding:"7px 2px",borderRadius:8,fontSize:11,fontWeight:700,background:kralTab===k?T.accent:T.bg1,color:kralTab===k?T.bg0:T.textMut,border:"0.5px solid "+T.line}}>{l}</button>
        )}
      </div>
      {kralTab==="gol" && <KralListe liste={golK} alan="gol" birim="gol" T={T} git={git} turnuva={kralTurnuva}/>}
      {kralTab==="asist" && <KralListe liste={asistK} alan="asist" birim="asist" T={T} git={git} turnuva={kralTurnuva}/>}
      {kralTab==="kurtaris" && <KralListe liste={kurtarisK} alan="kurtaris" birim="kurtarış" T={T} git={git} turnuva={kralTurnuva}/>}
      {kralTab==="odul" && <div>
        {ODULLER.map(([alan,ad])=>{
          const lider=Motor.turnuvaOdulKrali(kralTurnuva, alan, 1)[0];
          return lider ? <div key={alan} onClick={()=>git({sayfa:"oyuncu",oyuncu:{...lider,turnuva:turnuva.ad}})} className="tap" style={{display:"flex",alignItems:"center",gap:11,background:T.bg1,borderRadius:11,padding:11,marginBottom:7,border:"0.5px solid "+T.line}}>
            <span style={{fontSize:20}}>{ad.split(" ")[0]}</span>
            <div style={{flex:1,minWidth:0}}><div style={{fontSize:10,color:T.textMut}}>{ad.slice(ad.indexOf(" ")+1)}</div><div style={{fontSize:13,color:T.text,fontWeight:600}}>{lider.ad}</div></div>
            <span style={{fontSize:20,fontWeight:800,color:T.gold,fontFamily:T.fontDisplay,flexShrink:0}}>{lider[alan]}</span>
          </div> : null;
        })}
        {ODULLER.every(([alan])=>!Motor.turnuvaOdulKrali(kralTurnuva,alan,1)[0]) && <BosUyari T={T} metin="Henüz ödül verilmedi. Maçlarda ödül seçtikçe burada görünür." />}
      </div>}
    </div>}

    {tab==="enler" && <div className="fade-in" style={{paddingTop:4}}>
      <TumEnler turnuvalar={[turnuva]} T={T} git={git} gomulu/>
    </div>}

    {/* ===== İSTATİSTİK ===== */}
    {tab==="ist" && <LigIstatistik turnuva={turnuva} ist={ist} T={T} git={git} onbirAltin={Motor.ideal11(turnuva,"altin")} pozKisa={pozKisa}/>}

    {tab==="takimlar" && <div className="fade-in" style={{padding:"12px 14px"}}>
      {(turnuva.takimlar||[]).length===0
        ? <BosUyari T={T} metin="Henüz takım yok. Yönet sekmesinden takım ekle." />
        : <><div style={{fontSize:11,color:T.textMut,fontWeight:700,marginBottom:10}}>LİGDEKİ TAKIMLAR · {turnuva.takimlar.length}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
            {turnuva.takimlar.map(t=>
              <div key={t.id} onClick={()=>git({sayfa:"takim",takim:t,turnuva})} className="tap kart-hover" style={{display:"flex",alignItems:"center",gap:11,background:T.bg1,border:"0.5px solid "+T.line,borderRadius:13,padding:"11px 12px"}}>
                <Logo renk={t.renk} ad={t.ad} logo={t.logo} renk2={t.renk2} boy={38}/>
                <div style={{minWidth:0,flex:1}}>
                  <div style={{fontSize:13.5,fontWeight:800,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.ad}</div>
                  <div style={{fontSize:10.5,color:T.textMut,marginTop:1}}>{(t.oyuncular||[]).length} oyuncu</div>
                </div>
                <span style={{color:T.textMut,fontSize:15}}>›</span>
              </div>)}
          </div></>}
    </div>}

    {tab==="kurallar" && <LigKurallar turnuva={turnuva} T={T} yonetim={yonetim}/>}

    {tab==="yonet" && yonetim && <><YonetimPaneli turnuva={turnuva} T={T} git={git} yonetim={yonetim} oturum={oturum}/><YardimciYonetim turnuva={turnuva} T={T} oturum={oturum} sahip={!!(oturum && ((turnuva.yonetici_id===oturum.id) || yonetim.adminMi))}/></>}
  </div>;
}

/* KRAL LİSTESİ — gol/asist/kurtarış ortak */
function KralListe({liste, alan, birim, T, git, turnuva}){
  const dkOf=(o)=> o.dk>0?o.dk:(o.mac||0)*60;
  // tüm oyunculardan kendi listesini üret, toplam değere göre sırala
  let kaynak=[];
  if(turnuva){ turnuva.takimlar.forEach(tk=>tk.oyuncular.forEach(o=>{ if((o[alan]||0)>0) kaynak.push({...o,takimAd:tk.ad,takimRenk:tk.renk}); })); }
  else kaynak=[...(liste||[])];
  if(kaynak.length===0) return <BosUyari T={T} metin="Henüz veri yok." />;
  kaynak.sort((a,b)=>b[alan]-a[alan]);
  const sirali=kaynak.slice(0,15);
  return <div className="stagger">
    {sirali.map((o,i)=>{
      const dk=dkOf(o);
      const birinci=i===0;
      const podyum=i<3;
      const madalya=i===0?"🥇":i===1?"🥈":i===2?"🥉":null;
      return <div key={o.id} onClick={()=>git({sayfa:"oyuncu",oyuncu:{...o,turnuva:turnuva.ad}})} className="tap prem-tap" style={{position:"relative",display:"flex",alignItems:"center",gap:11,
        background:birinci?`linear-gradient(90deg, ${T.gold}20, ${T.bg1} 60%)`:podyum?T.accent+"0e":T.bg1,
        borderRadius:12,padding:"11px 12px",marginBottom:6,border:"0.5px solid "+(birinci?T.gold+"55":podyum?T.accent+"2a":T.line),overflow:"hidden",
        boxShadow:birinci?`0 6px 20px ${T.gold}22`:"0 3px 12px rgba(0,0,0,.22)"}}>
        {birinci && <div style={{position:"absolute",left:0,top:0,bottom:0,width:3,background:T.gold}}/>}
        <span style={{width:22,textAlign:"center",fontSize:madalya?15:13,fontWeight:800,color:birinci?T.gold:T.textMut}}>{madalya||(i+1)}</span>
        <div style={{position:"relative"}}>
          <div style={{borderRadius:"50%",border:birinci?"2px solid "+T.gold:"none",padding:birinci?1:0}}><Avatar o={o} boy={birinci?38:34} T={T}/></div>
          {birinci && <span style={{position:"absolute",top:-8,left:"50%",transform:"translateX(-50%)",fontSize:14}}>👑</span>}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:birinci?14:13,color:T.text,fontWeight:birinci?800:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{o.ad}</div>
          <div style={{fontSize:10,color:birinci?T.gold:T.textMut,marginTop:2}}>{o.takimAd} · {o.mac||0} maç · {dk} dk</div>
        </div>
        <div style={{display:"flex",alignItems:"baseline",gap:4,flexShrink:0}}>
          <SayacSayi deger={o[alan]} style={{fontSize:birinci?26:22,fontWeight:800,color:birinci?T.gold:T.accent,fontFamily:T.fontDisplay}}/>
          <span style={{fontSize:10,color:T.textMut}}>{birim}</span>
        </div>
      </div>;
    })}
  </div>;
}

/* LİG İSTATİSTİK */
// ============ KADRO EKRANI — Haftanın/Ayın/Sezonun Altın & Gümüş Kadrosu ============
function KadroEkrani({turnuva, T, git}){
  const pen=React.useMemo(()=>Motor.kadroPencereler(turnuva),[turnuva.id, turnuva.maclar.length]);
  const [pencere,setPencere]=React.useState("hafta");
  const [kademe,setKademe]=React.useState("altin");
  const [hi,setHi]=React.useState(Math.max(0,pen.haftalar.length-1));
  const [ai,setAi]=React.useState(Math.max(0,pen.aylar.length-1));
  const [sec,setSec]=React.useState(null);
  const [ipucu,setIpucu]=React.useState("");
  React.useEffect(()=>{ setHi(Math.max(0,pen.haftalar.length-1)); setAi(Math.max(0,pen.aylar.length-1)); },[pen.haftalar.length, pen.aylar.length]);

  const maclar = pencere==="sezon" ? pen.tum
    : pencere==="hafta" ? pen.tum.filter(m=>m.hafta===pen.haftalar[hi])
    : (pen.aylar[ai]?pen.aylar[ai].maclar:[]);
  const puanMap=React.useMemo(()=>Motor.kadroPuan(turnuva, maclar),[turnuva.id, pencere, hi, ai, maclar.length]);
  const slots=React.useMemo(()=>Motor.kadroSec(turnuva, puanMap, kademe),[puanMap, kademe, turnuva.kisi]);
  const hepsi=[]; slots.forEach(s=>s.list.forEach(r=>hepsi.push(r)));
  const kaptan=hepsi.slice().sort((a,b)=>b.puan-a.puan)[0]||null;
  const seciliRec = hepsi.find(r=>r.oy.id===sec) || kaptan;

  // tema
  const altin=kademe==="altin";
  const AC=altin?T.gold:"#C6D0DB", AC2=altin?"#F0CB6E":"#EAF0F6", INK="#1A1505";
  const pk={Kaleci:"KL",Defans:"DEF",OrtaSaha:"OS",Forvet:"FW"};
  const wWord = pencere==="hafta"?"HAFTANIN":pencere==="ay"?"AYIN":"SEZONUN";
  const eyebrow = pencere==="hafta" ? (pen.haftalar[hi]?pen.haftalar[hi]+". HAFTA":"HAFTA")
    : pencere==="ay" ? (pen.aylar[ai]?pen.aylar[ai].label.toUpperCase():"AY")
    : "TÜM SEZON";
  const dizAd={5:"1-2-1-1",6:"1-2-2-1",7:"1-3-2-1",8:"1-3-3-1",9:"1-3-3-2",10:"1-4-3-2",11:"1-4-3-3"}[Math.max(5,Math.min(11,turnuva.kisi||8))];

  const stat=(rec)=>{ if(rec.poz==="Kaleci") return rec.kurtaris?(rec.kurtaris+" krt"+(rec.temiz?" · "+rec.temiz+" temiz":"")):(rec.puan?"+"+rec.puan:"—"); const p=[]; if(rec.gol)p.push(rec.gol+"G"); if(rec.asist)p.push(rec.asist+"A"); if(rec.temiz)p.push(rec.temiz+"T"); return p.join(" ")||(rec.puan?"+"+rec.puan:"—"); };
  const neden=(rec)=>{ const ks=Object.keys(rec.k).filter(e=>rec.k[e]>0).sort((a,b)=>rec.k[b]-rec.k[a]); const t=ks[0]||""; const W=pencere==="hafta"?"hafta":pencere==="ay"?"ay":"sezon"; const m={"Gol":"Bu "+W+" attığı gollerle hücumun en keskin ucu oldu.","Asist":"Bu "+W+" yaptığı asistlerle oyunu adeta o kurdu.","Gol yememe":"Arkada duvar gibiydi; kalesini defalarca temiz tuttu.","Kurtarış":"Kritik kurtarışlarıyla takımını ayakta tuttu.","MVP":"Çıktığı maçlara damga vurup MVP seçildi.","Altın Oyuncu":"Maç yöneticisi tarafından sahanın en iyisi seçildi.","Galibiyet":"Takımının galibiyet serisinin motoru oldu."}; return m[t]||"İstikrarlı performansıyla kadroya adını yazdırdı."; };
  const paylas=()=>{ const metin=wWord+" "+(altin?"ALTIN":"GÜMÜŞ")+" KADROSU · "+turnuva.ad+" · "+eyebrow; if(navigator.share){ navigator.share({title:"ForzaLig Kadro",text:metin}).catch(()=>{}); } else { try{ navigator.clipboard.writeText(metin); }catch(e){} } setIpucu("Ekran görüntüsü alıp paylaşabilirsin 📸"); setTimeout(()=>setIpucu(""),2600); };

  const seg=(aktifMi,renkli)=>({flex:1,padding:"7px 4px",borderRadius:9,fontSize:11.5,fontWeight:800,border:0,cursor:"pointer",whiteSpace:"nowrap",
    background:aktifMi?(renkli?AC:T.bg2):"transparent",color:aktifMi?(renkli?INK:T.text):T.textMut,boxShadow:aktifMi&&!renkli?("inset 0 0 0 1px "+T.line):"none"});
  const nav=(dir,tur)=>{ if(tur==="hafta"){ setHi(v=>Math.max(0,Math.min(pen.haftalar.length-1,v+dir))); } else { setAi(v=>Math.max(0,Math.min(pen.aylar.length-1,v+dir))); } setSec(null); };

  // token
  const Token=(rec)=>{ const isCap=kaptan&&rec.oy.id===kaptan.oy.id, seciliMi=seciliRec&&rec.oy.id===seciliRec.oy.id;
    return <button key={rec.oy.id} onClick={()=>setSec(rec.oy.id)} className="tap" style={{background:"transparent",border:0,padding:0,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:1,width:"clamp(52px,20vw,72px)"}}>
      <div style={{position:"relative"}}>
        {isCap && <div style={{position:"absolute",top:-15,left:"50%",transform:"translateX(-50%)",zIndex:5,whiteSpace:"nowrap",fontSize:7.5,fontWeight:800,letterSpacing:.4,color:INK,background:"linear-gradient(90deg,"+AC+","+AC2+")",padding:"2px 5px",borderRadius:4}}>{wWord} OYUNCUSU</div>}
        <div style={{position:"absolute",top:-6,left:"50%",transform:"translateX(-50%)",zIndex:4,fontSize:11.5,fontWeight:800,color:INK,background:"linear-gradient(180deg,"+AC2+","+AC+")",borderRadius:6,padding:"1px 5px",fontFamily:T.fontDisplay}}>{rec.puan}</div>
        <div style={{width:46,height:46,borderRadius:"50%",overflow:"hidden",margin:"7px auto 0",boxShadow:seciliMi?("0 0 0 2.5px "+T.text+",0 0 0 4.5px "+AC):("0 0 0 2.5px "+AC)}} dangerouslySetInnerHTML={{__html:svgAvatar(rec.oy.ad,46,rec.oy.foto)}}/>
        {isCap && <div style={{position:"absolute",bottom:-2,right:2,width:16,height:16,borderRadius:"50%",background:AC,color:INK,fontSize:9,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",zIndex:5}}>C</div>}
      </div>
      <div style={{fontSize:10.5,fontWeight:700,color:T.text,marginTop:2,maxWidth:"100%",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{rec.oy.ad.split(" ")[0]}</div>
      <div style={{fontSize:8.5,fontWeight:600,color:T.textMut,display:"flex",gap:3,alignItems:"center"}}><b style={{color:AC,fontWeight:800}}>{pk[rec.poz]}</b> {stat(rec)}</div>
    </button>;
  };

  const aktifVar = Object.keys(puanMap).some(k=>{ const r=puanMap[k]; return r.mac>0 || r.puan!==0; });
  const bosVeri = maclar.length===0 || !aktifVar || hepsi.length===0;

  return <div className="fade-in" style={{padding:"12px 12px 30px",maxWidth:560,margin:"0 auto"}}>
    {/* board */}
    <div style={{borderRadius:18,overflow:"hidden",background:"linear-gradient(180deg,"+T.bg1+","+T.bg0+")",border:"1px solid "+AC+"55",boxShadow:"0 20px 50px -24px "+AC+"66, inset 0 30px 60px -50px "+AC+"88"}}>
      {/* crest */}
      <div style={{display:"flex",alignItems:"center",gap:11,padding:"15px 15px 8px"}}>
        <div style={{width:42,height:42,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0,background:"radial-gradient(circle at 35% 30%,"+AC2+","+AC+" 60%,"+(altin?"#6f531b":"#54626c")+")",boxShadow:"0 0 0 3px "+AC+"40"}}>{altin?"🥇":"🥈"}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:9.5,fontWeight:800,letterSpacing:1.6,color:AC,textTransform:"uppercase"}}>{wWord} · {eyebrow}</div>
          <div style={{fontSize:21,fontWeight:800,color:T.text,fontFamily:T.fontDisplay,letterSpacing:.3,lineHeight:1.05}}>{altin?"ALTIN":"GÜMÜŞ"} KADRO</div>
        </div>
        <div style={{textAlign:"right",flexShrink:0}}>
          <div style={{fontSize:14,fontWeight:800,color:AC,fontFamily:T.fontDisplay}}>EN İYİ {turnuva.kisi||8}</div>
          <div style={{fontSize:9,fontWeight:600,color:T.textMut,letterSpacing:.5}}>{dizAd}</div>
        </div>
      </div>
      {/* meta */}
      <div style={{display:"flex",flexWrap:"wrap",gap:"4px 12px",padding:"0 15px 12px",borderBottom:"1px solid "+T.line,fontSize:11,color:T.textMut,fontWeight:600}}>
        <span>🏆 {turnuva.ad}</span><span>⚔️ <b style={{color:T.text}}>{maclar.length}</b> maç</span><span>👥 {turnuva.takimlar.reduce((s,t)=>s+t.oyuncular.length,0)} oyuncu</span>
      </div>
      {/* kontroller */}
      <div style={{display:"flex",flexDirection:"column",gap:8,padding:"12px 15px"}}>
        <div style={{display:"flex",gap:6}}>
          {[["hafta","Hafta"],["ay","Ay"],["sezon","Sezon"]].map(([k,l])=>
            <button key={k} onClick={()=>{setPencere(k);setSec(null);}} className="tap" style={seg(pencere===k,false)}>{l}</button>)}
        </div>
        <div style={{display:"flex",gap:6}}>
          <button onClick={()=>{setKademe("altin");setSec(null);}} className="tap" style={seg(altin,true)}>🥇 Altın Kadro</button>
          <button onClick={()=>{setKademe("gumus");setSec(null);}} className="tap" style={seg(!altin,true)}>🥈 Gümüş Kadro</button>
        </div>
        {pencere!=="sezon" && (pencere==="hafta"?pen.haftalar.length:pen.aylar.length)>1 &&
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:14,marginTop:2}}>
            <button onClick={()=>nav(-1,pencere)} className="tap" style={{background:T.bg2,border:"1px solid "+T.line,color:T.text,width:34,height:30,borderRadius:8,fontSize:16,fontWeight:800,cursor:"pointer"}}>‹</button>
            <span style={{fontSize:12,fontWeight:700,color:T.text,minWidth:120,textAlign:"center"}}>{pencere==="hafta"?(pen.haftalar[hi]+". Hafta"):(pen.aylar[ai]?pen.aylar[ai].label:"")}</span>
            <button onClick={()=>nav(1,pencere)} className="tap" style={{background:T.bg2,border:"1px solid "+T.line,color:T.text,width:34,height:30,borderRadius:8,fontSize:16,fontWeight:800,cursor:"pointer"}}>›</button>
          </div>}
      </div>
      {/* saha */}
      {bosVeri
        ? <div style={{padding:"40px 20px",textAlign:"center",color:T.textMut,fontSize:12.5}}>Bu {pencere==="hafta"?"hafta":pencere==="ay"?"ay":"sezon"} için yeterli maç/veri yok.<br/>Maçlar oynanıp skor + ödüller girildikçe kadro burada oluşur.</div>
        : <div style={{margin:"0 12px 12px",borderRadius:14,overflow:"hidden",position:"relative",aspectRatio:"74/96",
            background:"repeating-linear-gradient(0deg,#0f3d25 0 9%,#0b2f1d 9% 18%)",boxShadow:"inset 0 0 0 2px rgba(233,240,235,.14),inset 0 -50px 100px rgba(0,0,0,.45)"}}>
            <div style={{position:"absolute",inset:0,background:"radial-gradient(70% 40% at 50% 6%,"+AC+"22,transparent 60%)"}}/>
            <div style={{position:"absolute",left:"29%",top:0,width:"42%",height:"11%",border:"2px solid rgba(233,240,235,.14)",borderTop:0}}/>
            <div style={{position:"absolute",left:"29%",bottom:0,width:"42%",height:"11%",border:"2px solid rgba(233,240,235,.14)",borderBottom:0}}/>
            <div style={{position:"absolute",left:"34%",top:"42%",width:"32%",aspectRatio:"1",borderRadius:"50%",border:"2px solid rgba(233,240,235,.12)"}}/>
            <div style={{position:"absolute",left:"6%",right:"6%",top:"50%",borderTop:"2px solid rgba(233,240,235,.12)"}}/>
            <div style={{position:"relative",zIndex:2,height:"100%",display:"flex",flexDirection:"column",justifyContent:"space-between",padding:"5% 3% 4%"}}>
              {slots.slice().reverse().map((s,i)=>
                <div key={i} style={{display:"flex",justifyContent:"center",gap:"3%"}}>{s.list.map(Token)}</div>)}
            </div>
          </div>}
      {/* detay */}
      {!bosVeri && seciliRec && (()=>{ const r=seciliRec, mx=Math.max(1,...Object.values(r.k).map(v=>Math.abs(v)));
        const oy=r.oy, sezonOdul=[]; if(oy.mvp)sezonOdul.push("⭐ "+oy.mvp+" MVP"); if(oy.altin)sezonOdul.push("🥇 "+oy.altin+" Altın"); if(oy.gumus)sezonOdul.push("🥈 "+oy.gumus+" Gümüş");
        return <div style={{margin:"0 12px 14px",background:T.bg2,border:"1px solid "+T.line,borderRadius:14,padding:14}}>
          <div style={{display:"flex",gap:11,alignItems:"center"}}>
            <div style={{width:50,height:50,borderRadius:"50%",overflow:"hidden",flexShrink:0,boxShadow:"0 0 0 2.5px "+AC}} dangerouslySetInnerHTML={{__html:svgAvatar(oy.ad,50,oy.foto)}}/>
            <div style={{flex:1,minWidth:0}}>
              <div onClick={()=>git({sayfa:"oyuncu",oyuncu:{...oy,turnuva:turnuva.ad}})} className="tap" style={{fontSize:16,fontWeight:800,color:T.text,cursor:"pointer",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{oy.ad}</div>
              <div style={{fontSize:11.5,fontWeight:600,color:T.textMut,marginTop:1}}><b style={{color:AC,fontWeight:800}}>{pk[r.poz]}</b> · {r.takimAd} · {r.mac} maç</div>
            </div>
            <div style={{textAlign:"center",flexShrink:0}}><div style={{fontSize:25,fontWeight:800,color:AC,fontFamily:T.fontDisplay,lineHeight:1}}>{r.puan}</div><div style={{fontSize:7.5,fontWeight:700,letterSpacing:.6,color:T.textMut,textTransform:"uppercase"}}>{pencere==="hafta"?"HAFTA":pencere==="ay"?"AY":"SEZON"} PUANI</div></div>
          </div>
          <div style={{fontStyle:"italic",fontSize:13,color:T.textSoft,borderLeft:"2px solid "+AC,padding:"2px 0 2px 11px",margin:"11px 0"}}>“{neden(r)}”</div>
          <div style={{fontSize:9,fontWeight:800,letterSpacing:1,color:T.textMut,textTransform:"uppercase",marginBottom:6}}>Seçilme nedeni · puan kırılımı</div>
          {Object.keys(r.k).sort((a,b)=>r.k[b]-r.k[a]).map(et=>{ const v=r.k[et], neg=v<0;
            return <div key={et} style={{display:"grid",gridTemplateColumns:"104px 1fr 30px",alignItems:"center",gap:8,marginBottom:6}}>
              <span style={{fontSize:10.5,color:T.textMut,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{et}</span>
              <span style={{height:7,borderRadius:4,background:T.bg0,overflow:"hidden"}}><span style={{display:"block",height:"100%",width:Math.max(6,Math.round(Math.abs(v)/mx*100))+"%",borderRadius:4,background:neg?"linear-gradient(90deg,#5a2b25,"+T.danger+")":"linear-gradient(90deg,"+AC+"88,"+AC+")"}}/></span>
              <span style={{fontSize:11,fontWeight:800,textAlign:"right",color:neg?T.danger:T.text,fontFamily:T.fontDisplay}}>{v>0?"+":""}{v}</span>
            </div>; })}
          {sezonOdul.length>0 && <div style={{display:"flex",alignItems:"center",gap:8,background:AC+"14",border:"1px solid "+AC+"44",borderRadius:10,padding:"8px 10px",marginTop:10}}>
            <span style={{fontSize:15}}>🏅</span><span style={{fontSize:11.5,fontWeight:700,color:T.text}}>Sezon boyunca: {sezonOdul.join(" · ")}</span></div>}
          {/* tüm kadro */}
          <div style={{borderTop:"1px solid "+T.line,marginTop:12,paddingTop:10}}>
            <div style={{fontSize:9,fontWeight:800,letterSpacing:1,color:T.textMut,textTransform:"uppercase",marginBottom:5}}>Tüm kadro · dokunarak incele</div>
            {hepsi.map(x=><div key={x.oy.id} onClick={()=>setSec(x.oy.id)} className="tap" style={{display:"flex",alignItems:"center",gap:9,padding:"6px 7px",borderRadius:9,cursor:"pointer",background:x.oy.id===seciliRec.oy.id?AC+"18":"transparent"}}>
              <span style={{width:28,fontSize:9.5,fontWeight:800,color:AC,textAlign:"center",flexShrink:0}}>{pk[x.poz]}</span>
              <span style={{flex:1,fontSize:12,fontWeight:600,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{x.oy.ad} <span style={{color:T.textMut,fontWeight:500,fontSize:10.5}}>· {x.takimAd}</span></span>
              <span style={{fontSize:12.5,fontWeight:800,color:AC,fontFamily:T.fontDisplay}}>{x.puan}</span>
            </div>)}
          </div>
        </div>; })()}
      {/* paylaş */}
      {!bosVeri && <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,padding:"12px 15px",borderTop:"1px solid "+T.line}}>
        <button onClick={paylas} className="tap" style={{background:"linear-gradient(180deg,"+AC2+","+AC+")",color:INK,border:0,borderRadius:10,padding:"10px 15px",fontSize:12.5,fontWeight:800,cursor:"pointer"}}>📸 Görsel Olarak Paylaş</button>
        <span style={{fontSize:10,fontWeight:700,color:T.textMut}}>{ipucu||"forzalig.com"}</span>
      </div>}
    </div>
    <div style={{fontSize:10.5,color:T.textMut,textAlign:"center",marginTop:12,lineHeight:1.6,padding:"0 10px"}}>
      Kadro; <b style={{color:T.textSoft}}>otomatik istatistik</b> (gol, asist, gol yememe, kurtarış, sonuç, kart) + <b style={{color:T.textSoft}}>maç yöneticisinin ödülleri</b> (MVP, Altın/Gümüş Oyuncu, en iyi mevki vb.) birleşerek hesaplanan performans puanına göre otomatik oluşur.
    </div>
  </div>;
}

function LigIstatistik({turnuva, ist, T, git, onbirAltin, pozKisa}){
  const haftaArr=Object.entries(ist.haftaGol).sort((a,b)=>a[0]-b[0]);
  const maxGol=Math.max(1,...haftaArr.map(h=>h[1]));
  return <div className="fade-in" style={{padding:"12px 14px"}}>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
      {[["⚽ Toplam Gol",ist.toplamGol,T.accent],["📊 Maç Başı Ort",ist.macBasi,T.accent2],["🥅 En Golcü",ist.enGolcu?ist.enGolcu.ad+" · "+ist.enGolcu.at:"—",T.gold],["🛡️ En İyi Defans",ist.enDefans?ist.enDefans.ad+" · "+ist.enDefans.ye:"—",T.accent]].map(([k,v,c],idx)=>
        <div key={idx} style={{background:T.bg1,borderRadius:11,padding:12,border:"0.5px solid "+T.line}}>
          <div style={{fontSize:10,color:T.textMut}}>{k}</div>
          <div style={{fontSize:idx<2?16:13,fontWeight:800,color:c,marginTop:4,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{v}</div>
        </div>
      )}
    </div>
    {/* haftalık gol */}
    {haftaArr.length>0 && <div style={{background:T.bg1,borderRadius:11,padding:12,border:"0.5px solid "+T.line,marginBottom:12}}>
      <div style={{fontSize:10,color:T.textMut,marginBottom:10}}>HAFTALIK GOL DAĞILIMI</div>
      <div style={{display:"flex",alignItems:"flex-end",gap:6,height:80}}>
        {haftaArr.map(([h,g])=>
          <div key={h} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
            <div className="bar-grow" style={{width:"100%",background:T.accent,borderRadius:"3px 3px 0 0",height:(g/maxGol*64)+"px"}}/>
            <span style={{fontSize:8,color:T.textMut}}>{h}.h</span>
          </div>
        )}
      </div>
    </div>}
    {/* Sezon kadrosu artık 🏅 Kadro sekmesinde (performans reytingi) */}
    {/* ev/deplasman + seri */}
    <div style={{background:T.bg1,borderRadius:11,padding:12,border:"0.5px solid "+T.line,marginBottom:12}}>
      <div style={{fontSize:10,color:T.textMut,marginBottom:8}}>TAKIM KARŞILAŞTIRMA — HÜCUM / SAVUNMA</div>
      {ist.liste.slice(0,5).map(t=>
        <div key={t.ad} style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
          <span style={{fontSize:11,color:T.text,width:70,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.ad}</span>
          <div style={{flex:1,display:"flex",gap:2,alignItems:"center"}}>
            <div style={{flex:1,height:7,background:T.bg2,borderRadius:4,overflow:"hidden",display:"flex",justifyContent:"flex-end"}}><div style={{width:Math.min(100,t.at*4)+"%",height:"100%",background:T.accent,borderRadius:4}}/></div>
            <span style={{fontSize:9,color:T.accent,width:18,textAlign:"center"}}>{t.at}</span>
            <span style={{fontSize:9,color:T.danger,width:18,textAlign:"center"}}>{t.ye}</span>
            <div style={{flex:1,height:7,background:T.bg2,borderRadius:4,overflow:"hidden"}}><div style={{width:Math.min(100,t.ye*4)+"%",height:"100%",background:T.danger,borderRadius:4}}/></div>
          </div>
        </div>
      )}
      <div style={{display:"flex",justifyContent:"center",gap:16,fontSize:9,color:T.textMut,marginTop:4}}><span style={{color:T.accent}}>● Attığı</span><span style={{color:T.danger}}>● Yediği</span></div>
    </div>
    {/* ilginç veriler */}
    <div style={{background:T.bg1,borderRadius:11,padding:12,border:"0.5px solid "+T.line}}>
      <div style={{fontSize:10,color:T.textMut,marginBottom:8}}>İLGİNÇ VERİLER</div>
      {[ist.enFarkli&&["🔥 En farklı galibiyet",ist.enFarkli.skor],ist.enGollu&&["⚡ En gollü maç",ist.enGollu.skor],ist.enSert&&["🟥 En sert takım",ist.enSert.ad+" · "+ist.enSert.kart+" kart"],ist.enCentilmen&&["🤝 En centilmen",ist.enCentilmen.ad]].filter(Boolean).map(([k,v],i)=>
        <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"0.5px solid "+T.line,fontSize:11}}>
          <span style={{color:T.textMut}}>{k}</span>
          <span style={{color:T.text,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:"55%",textAlign:"right"}}>{v}</span>
        </div>
      )}
    </div>
  </div>;
}

function BosUyari({T, metin, ikon, aksiyon, aksiyonMetin}){
  return <div className="fade-in" style={{padding:"36px 30px",textAlign:"center"}}>
    <div style={{fontSize:38,marginBottom:12,opacity:.65}}>{ikon||"⚽"}</div>
    <div style={{color:T.textSoft,fontSize:13,lineHeight:1.6,maxWidth:260,margin:"0 auto"}}>{metin}</div>
    {aksiyon && <button onClick={aksiyon} className="tap prem-tap" style={{marginTop:16,background:T.accent,color:T.renkCifti&&T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0,fontSize:12,fontWeight:700,padding:"10px 20px",borderRadius:11,boxShadow:`0 6px 16px ${T.accent}33`}}>{aksiyonMetin||"Başla"}</button>}
  </div>;
}

/* FAZ 4 — Yönetim paneli: takım ekle/sil, maç ekle/fikstür, skor gir/sil */
function YonetimPaneli({turnuva, T, git, yonetim, oturum}){
  const [yeniTakimAd,setYeniTakimAd]=useState("");
  const [macA,setMacA]=useState("");
  const [macB,setMacB]=useState("");
  const [excelAcik,setExcelAcik]=useState(false);
  const [excelMetin,setExcelMetin]=useState("");
  const [excelSonuc,setExcelSonuc]=useState(null);
  // Takımlarımdan seç-ekle (kalıcı kulüp → lige, kadro otomatik)
  const [kulupListe,setKulupListe]=useState(null); // null=henüz yüklenmedi
  const [kulupYuk,setKulupYuk]=useState(false);
  const [kulupMsj,setKulupMsj]=useState("");
  const kuluplariGetir=async()=>{ setKulupYuk(true); const l=(await Db.kuluplerim(oturum&&oturum.id))||[]; const mevcut=new Set((turnuva.takimlar||[]).map(t=>t.kulup_id).filter(Boolean)); setKulupListe(l.filter(k=>!mevcut.has(k.id))); setKulupYuk(false); };
  const kulupEkleLige=async(k)=>{ if(!yonetim.kulupLigeEkle) return; setKulupMsj("Ekleniyor…"); const r=await yonetim.kulupLigeEkle(turnuva, k.id); if(r&&r.ok){ setKulupMsj("✓ "+k.ad+" eklendi — oyuncular otomatik geldi"); setKulupListe(p=>(p||[]).filter(x=>x.id!==k.id)); } else setKulupMsj("Olmadı: "+((r&&r.hata)||"")); };
  const [oyDavet,setOyDavet]=useState(null); // {ad, link} — takıma özel oyuncu davet linki penceresi
  const [ysOnay,setYsOnay]=useState(false); // yeni sezon iki-adımlı onay
  // transfer istekleri
  const [bekTransfer,setBekTransfer]=useState([]);
  const [trfYuk,setTrfYuk]=useState(false);
  const [trfMesaj,setTrfMesaj]=useState("");
  const iliskisel2 = turnuva.iliskisel && typeof turnuva.id==="string";
  useEffect(()=>{
    if(iliskisel2 && sb){ Db.ligBekleyenTransferler(turnuva.id).then(d=>setBekTransfer(d||[])); }
  },[turnuva.id]);
  const trfOnayla=async(t)=>{ setTrfYuk(true); setTrfMesaj(""); const r=await yonetim.transferKabulEt(t); setTrfYuk(false); if(r&&r.ok){ setBekTransfer(p=>p.filter(x=>x.id!==t.id)); setTrfMesaj("✓ Transfer onaylandı"); } else setTrfMesaj("Hata: "+((r&&r.hata)||"")); };
  const trfReddet=async(t)=>{ setTrfYuk(true); setTrfMesaj(""); const r=await yonetim.transferRedEt(t.id); setTrfYuk(false); if(r&&r.ok){ setBekTransfer(p=>p.filter(x=>x.id!==t.id)); setTrfMesaj("Transfer reddedildi"); } else setTrfMesaj("Hata: "+((r&&r.hata)||"")); };
  // bekleyen katılım istekleri (davet onay akışı)
  const [bekKatilim,setBekKatilim]=useState([]);
  const [katYuk,setKatYuk]=useState(false);
  const [katMesaj,setKatMesaj]=useState("");
  useEffect(()=>{ if(iliskisel2 && sb){ Db.bekleyenKatilimlar(turnuva.id).then(d=>setBekKatilim(d||[])); } },[turnuva.id]);
  const katOnayla=async(k)=>{ setKatYuk(true); setKatMesaj(""); const r=await Db.katilimOnayla(k.ot_id); setKatYuk(false); if(r&&r.ok){ setBekKatilim(p=>p.filter(x=>x.ot_id!==k.ot_id)); setKatMesaj("✓ Onaylandı — oyuncu eklendi (yenileyince kadroda görünür)"); Db.logla(oturum,"Katılım onayladı",k.ad_soyad||""); } else setKatMesaj("Hata: "+((r&&r.hata)||"yetki yok")); };
  const katReddet=async(k)=>{ setKatYuk(true); setKatMesaj(""); const r=await Db.katilimReddet(k.ot_id); setKatYuk(false); if(r&&r.ok){ setBekKatilim(p=>p.filter(x=>x.ot_id!==k.ot_id)); setKatMesaj("İstek reddedildi"); } else setKatMesaj("Hata: "+((r&&r.hata)||"")); };
  // bekleyen AYRILMA talepleri (Q16)
  const [bekAyrilma,setBekAyrilma]=useState([]);
  const [ayrYuk,setAyrYuk]=useState(false);
  const [ayrMesaj,setAyrMesaj]=useState("");
  useEffect(()=>{ if(iliskisel2 && sb){ Db.bekleyenAyrilmalar(turnuva.id).then(d=>setBekAyrilma(d||[])); } },[turnuva.id]);
  const ayrOnayla=async(a)=>{ setAyrYuk(true); setAyrMesaj(""); const r=await Db.ayrilmaOnayla(a.ot_id); setAyrYuk(false); if(r&&r.ok){ setBekAyrilma(p=>p.filter(x=>x.ot_id!==a.ot_id)); setAyrMesaj("✓ Ayrılma onaylandı (yenileyince kadrodan çıkar)"); Db.logla(oturum,"Ayrılma onayladı",a.ad_soyad||""); } else setAyrMesaj("Hata: "+((r&&r.hata)||"yetki yok")); };
  const ayrReddet=async(a)=>{ setAyrYuk(true); setAyrMesaj(""); const r=await Db.ayrilmaReddet(a.ot_id); setAyrYuk(false); if(r&&r.ok){ setBekAyrilma(p=>p.filter(x=>x.ot_id!==a.ot_id)); setAyrMesaj("Talep reddedildi, oyuncu takımda kaldı"); } else setAyrMesaj("Hata: "+((r&&r.hata)||"")); };
  // lig bilgileri düzenleme
  const [ligAcik,setLigAcik]=useState(false);
  const [lAd,setLAd]=useState(turnuva.ad||"");
  const [lSehir,setLSehir]=useState(turnuva.sehir||"");
  const [lIlce,setLIlce]=useState(turnuva.ilce||"");
  const [lRenk,setLRenk]=useState(turnuva.renk||RENKLER[0]);
  const [lBaslangic,setLBaslangic]=useState(turnuva.baslangic||"");
  const [lHedef,setLHedef]=useState(turnuva.hedefTakim||0);
  const [lKisi,setLKisi]=useState(turnuva.kisi||7);
  const [lSponsor,setLSponsor]=useState(turnuva.sponsorAd||"");
  const [lSponsorE,setLSponsorE]=useState(turnuva.sponsorEmoji||"🏟️");
  const ligKaydet=()=>{
    if(!lAd.trim())return;
    yonetim.ligGuncelle(turnuva, {ad:lAd.trim(), sehir:lSehir.trim(), ilce:lIlce.trim(), renk:lRenk, baslangic:lBaslangic, hedefTakim:lHedef, kisi:lKisi, sponsorAd:lSponsor.trim(), sponsorEmoji:lSponsorE});
    setLigAcik(false);
  };
  const tk=turnuva.takimlar;

  // DAVET LİNKLERİ (Faz 4)
  const [davetLink,setDavetLink]=useState("");
  const [davetKopya,setDavetKopya]=useState(false);
  const iliskisel = turnuva.iliskisel && typeof turnuva.id==="string";
  const takimDavetiUret=async()=>{
    setDavetLink("üretiliyor…");
    const r=await Db.davetOlustur(turnuva.id,'takim');
    if(r.ok){ setDavetLink(DAVET_URL(r.token)); setDavetKopya(false); } else setDavetLink("Hata: "+(r.hata||""));
  };
  const oyuncuDavetiUret=async(takimId, takimAd)=>{
    setOyDavet({ad:takimAd||"Takım", link:"üretiliyor…"});
    const r=await Db.davetOlustur(turnuva.id,'oyuncu',takimId);
    setOyDavet({ad:takimAd||"Takım", link: r.ok?DAVET_URL(r.token):("Hata: "+(r.hata||""))});
  };
  const davetKopyala=()=>{ try{ navigator.clipboard.writeText(davetLink); setDavetKopya(true); setTimeout(()=>setDavetKopya(false),1500); }catch(e){} };

  const takimEkleYap=(bos)=>{ if(!yeniTakimAd.trim())return; yonetim.takimEkle(turnuva, yeniTakimAd.trim(), bos); setYeniTakimAd(""); };
  const macEkleYap=()=>{ if(!macA||!macB||macA===macB)return; yonetim.macEkle(turnuva, macA, macB); setMacA(""); setMacB(""); };

  // Excel/tablo metnini ayrıştır (satır=oyuncu, sütun=TAB veya virgül/noktalı virgül)
  const excelAyristir=(metin)=>{
    return metin.split(/\r?\n/).map(s=>s.trim()).filter(s=>s.length>0)
      .map(satir=>{
        const sutun = satir.includes("\t") ? satir.split("\t") : (satir.includes(";")?satir.split(";"):satir.split(/\s{2,}|,/));
        return sutun.map(x=>x.trim());
      })
      .filter(s=> s[0] && !/(takım|takim).*ad.*soyad/i.test(s.join(" "))); // başlık satırını atla
  };
  const excelEkleYap=async()=>{
    const satirlar=excelAyristir(excelMetin);
    if(satirlar.length===0){ setExcelSonuc({hata:"Veri bulunamadı"}); return; }
    const s=await yonetim.excelTopluEkle(turnuva, satirlar);
    setExcelSonuc(s); setExcelMetin("");
  };

  return <div className="fade-in">
    {/* TAKIMA ÖZEL OYUNCU DAVET LİNKİ — net pencere (hangi takım olduğu bellidir) */}
    {oyDavet && <div onClick={()=>setOyDavet(null)} style={{position:"fixed",inset:0,zIndex:3000,background:"rgba(0,0,0,.62)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:360,background:T.bg1,border:"1px solid "+T.line,borderRadius:16,padding:18}}>
        <div style={{fontSize:14,fontWeight:800,color:T.text,marginBottom:4}}>🔗 {oyDavet.ad} — Oyuncu Davet Linki</div>
        <div style={{fontSize:10.5,color:T.textMut,marginBottom:11,lineHeight:1.5}}>Bu linki oyuncuya (WhatsApp'tan) yolla. Açan kişi bilgilerini girip <b>katılım isteği</b> gönderir; sen aşağıdaki <b>“Bekleyen Katılım İstekleri”</b>nden onaylarsın.</div>
        <div style={{background:T.bg0,border:"0.5px solid "+T.line,borderRadius:10,padding:"10px",fontSize:11,color:T.accent2,wordBreak:"break-all",lineHeight:1.4,marginBottom:11}}>{oyDavet.link}</div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>{ try{ navigator.clipboard.writeText(oyDavet.link); setDavetKopya(true); setTimeout(()=>setDavetKopya(false),1500); }catch(e){} }} className="tap" style={{flex:1,background:T.accent,color:"#04070C",border:0,borderRadius:10,padding:"11px",fontSize:13,fontWeight:800}}>{davetKopya?"✓ Kopyalandı":"📋 Kopyala"}</button>
          <button onClick={()=>setOyDavet(null)} className="tap" style={{background:T.bg2,color:T.textSoft,border:"0.5px solid "+T.line,borderRadius:10,padding:"11px 16px",fontSize:13,fontWeight:700}}>Kapat</button>
        </div>
      </div>
    </div>}
    {/* VAV HERO BAŞLIK */}
    <div className="vav-hero" style={{position:"relative",overflow:"hidden",padding:"20px 16px 16px",marginBottom:6,background:"linear-gradient(120deg,"+turnuva.renk+"4d 0%,"+T.bg0+" 40%,"+turnuva.renk+"26 68%,"+T.bg0+")"}}>
      <div className="vav-supurme"/>
      <div style={{position:"relative",display:"flex",alignItems:"center",gap:12}}>
        <div className="vav-suzul" style={{width:44,height:44,borderRadius:13,background:turnuva.renk+"2a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,boxShadow:"0 0 18px "+turnuva.renk+"55"}}>🛠️</div>
        <div style={{minWidth:0}}>
          <div style={{fontSize:11,color:turnuva.renk,letterSpacing:1,fontWeight:700}}>YÖNET</div>
          <div style={{fontSize:20,fontWeight:800,color:T.text,fontFamily:T.fontDisplay,lineHeight:1.1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{turnuva.ad}</div>
        </div>
      </div>
    </div>
    <div style={{padding:"6px 14px 12px"}}>
    {/* DAVET LİNKLERİ (Faz 4) — takım kaptanlarına iş dağıt */}
    {iliskisel && <div style={{background:"linear-gradient(120deg,"+T.accent2+"14,"+T.bg1+")",border:"0.5px solid "+T.accent2+"44",borderRadius:12,padding:13,marginBottom:14}}>
      <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:3}}>🔗 Davet Linkleri</div>
      <div style={{fontSize:10.5,color:T.textMut,marginBottom:10,lineHeight:1.5}}>Takım kaptanlarına link yolla → kendi takımlarını & oyuncularını <b>kendileri</b> girsin. Sen 96 oyuncu girmezsin.</div>
      <button onClick={takimDavetiUret} className="tap" style={{width:"100%",background:T.accent2,color:"#04070C",border:0,borderRadius:10,padding:"10px",fontSize:12.5,fontWeight:800,marginBottom:davetLink?8:0}}>🛡️ Takım Davet Linki Oluştur</button>
      {davetLink && <div style={{background:T.bg0,border:"0.5px solid "+T.line,borderRadius:9,padding:"9px 10px",marginTop:4}}>
        <div style={{fontSize:10.5,color:T.accent2,wordBreak:"break-all",lineHeight:1.4}}>{davetLink}</div>
        <button onClick={davetKopyala} className="tap" style={{marginTop:7,background:davetKopya?T.accent:T.bg2,color:davetKopya?"#04070C":T.textSoft,border:"0.5px solid "+T.line,borderRadius:8,padding:"6px 12px",fontSize:11,fontWeight:700}}>{davetKopya?"✓ Kopyalandı":"📋 Kopyala"}</button>
        <div style={{fontSize:9.5,color:T.textMut,marginTop:6,lineHeight:1.4}}>Bu linki WhatsApp'tan kaptana yolla. Açan kişi üye olup takımını kurar.</div>
      </div>}
    </div>}
    {/* BEKLEYEN TRANSFER İSTEKLERİ */}
    {/* BEKLEYEN KATILIM İSTEKLERİ (davet onay akışı) */}
    {iliskisel2 && bekKatilim.length>0 && <div style={{background:"linear-gradient(120deg,"+T.accent+"14,"+T.bg1+")",border:"0.5px solid "+T.accent+"44",borderRadius:12,padding:13,marginBottom:14}}>
      <div style={{fontSize:13,fontWeight:700,color:T.accent,marginBottom:8}}>🙋 Bekleyen Katılım İstekleri <span style={{fontSize:11}}>({bekKatilim.length})</span></div>
      {bekKatilim.map(k=>
        <div key={k.ot_id} style={{display:"flex",alignItems:"center",gap:9,background:T.bg0,borderRadius:10,padding:"9px 11px",marginBottom:6}}>
          <div style={{width:34,height:34,borderRadius:"50%",overflow:"hidden",flexShrink:0}} dangerouslySetInnerHTML={{__html:svgAvatar(k.ad_soyad||"?",34,k.foto)}}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:12.5,color:T.text,fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{k.ad_soyad}</div>
            <div style={{fontSize:10,color:T.textMut}}>{k.poz||"Oyuncu"}{k.forma_no?" · #"+k.forma_no:""} → {k.takim_ad}</div>
          </div>
          <button onClick={()=>katOnayla(k)} disabled={katYuk} className="tap" style={{background:T.accent,color:"#04070C",border:0,borderRadius:8,padding:"7px 11px",fontSize:12,fontWeight:800,opacity:katYuk?.6:1}}>✓ Onayla</button>
          <button onClick={()=>katReddet(k)} disabled={katYuk} className="tap" style={{background:"none",color:T.danger,border:"0.5px solid "+T.danger+"55",borderRadius:8,padding:"7px 10px",fontSize:12,fontWeight:700,opacity:katYuk?.6:1}}>✗</button>
        </div>
      )}
      {katMesaj && <div style={{fontSize:11,color:/✓/.test(katMesaj)?T.accent:T.danger,textAlign:"center",marginTop:6}}>{katMesaj}</div>}
    </div>}
    {/* BEKLEYEN AYRILMA TALEPLERİ (Q16) */}
    {iliskisel2 && bekAyrilma.length>0 && <div style={{background:"linear-gradient(120deg,"+T.gold+"14,"+T.bg1+")",border:"0.5px solid "+T.gold+"44",borderRadius:12,padding:13,marginBottom:14}}>
      <div style={{fontSize:13,fontWeight:700,color:T.gold,marginBottom:8}}>🚪 Bekleyen Ayrılma Talepleri <span style={{fontSize:11}}>({bekAyrilma.length})</span></div>
      {bekAyrilma.map(a=>
        <div key={a.ot_id} style={{display:"flex",alignItems:"center",gap:9,background:T.bg0,borderRadius:10,padding:"9px 11px",marginBottom:6}}>
          <div style={{width:34,height:34,borderRadius:"50%",overflow:"hidden",flexShrink:0}} dangerouslySetInnerHTML={{__html:svgAvatar(a.ad_soyad||"?",34,a.foto)}}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:12.5,color:T.text,fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{a.ad_soyad}</div>
            <div style={{fontSize:10,color:T.textMut}}>{a.takim_ad} takımından ayrılmak istiyor</div>
          </div>
          <button onClick={()=>ayrOnayla(a)} disabled={ayrYuk} className="tap" style={{background:T.gold,color:"#1A1505",border:0,borderRadius:8,padding:"7px 11px",fontSize:12,fontWeight:800,opacity:ayrYuk?.6:1}}>✓ Onayla</button>
          <button onClick={()=>ayrReddet(a)} disabled={ayrYuk} className="tap" style={{background:"none",color:T.danger,border:"0.5px solid "+T.danger+"55",borderRadius:8,padding:"7px 10px",fontSize:12,fontWeight:700,opacity:ayrYuk?.6:1}}>✗</button>
        </div>
      )}
      {ayrMesaj && <div style={{fontSize:11,color:/✓/.test(ayrMesaj)?T.accent:T.textSoft,textAlign:"center",marginTop:6}}>{ayrMesaj}</div>}
    </div>}
    {iliskisel2 && <div style={{background:bekTransfer.length?"linear-gradient(120deg,"+T.gold+"14,"+T.bg1+")":T.bg1,border:"0.5px solid "+(bekTransfer.length?T.gold+"44":T.line),borderRadius:12,padding:13,marginBottom:14}}>
      <div style={{fontSize:13,fontWeight:700,color:bekTransfer.length?T.gold:T.text,marginBottom:bekTransfer.length?8:0}}>🔄 Bekleyen Transfer İstekleri {bekTransfer.length>0 && <span style={{fontSize:11}}>({bekTransfer.length})</span>}</div>
      {bekTransfer.length===0
        ? <div style={{fontSize:11,color:T.textMut,marginTop:4}}>Bekleyen transfer isteği yok.</div>
        : bekTransfer.map(t=>{
            const eskiTk=turnuva.takimlar.find(x=>x.id===t.eski_takim_id);
            const yeniTk=turnuva.takimlar.find(x=>x.id===t.yeni_takim_id);
            return <div key={t.id} style={{background:T.bg0,borderRadius:10,padding:"10px 11px",marginBottom:6,border:"0.5px solid "+T.line}}>
              <div style={{fontSize:12,color:T.text,fontWeight:700}}>{t.oyuncular?t.oyuncular.ad_soyad:"Oyuncu"}</div>
              <div style={{fontSize:11,color:T.textSoft,marginTop:2}}>{eskiTk?eskiTk.ad:"?"} <span style={{color:T.accent2}}>→</span> {yeniTk?yeniTk.ad:"?"}</div>
              {t.talep_tarihi && <div style={{fontSize:9,color:T.textMut,marginTop:2}}>{new Date(t.talep_tarihi).toLocaleDateString("tr-TR")}</div>}
              <div style={{display:"flex",gap:7,marginTop:8}}>
                <button onClick={()=>trfOnayla(t)} disabled={trfYuk} className="tap" style={{flex:1,background:T.accent,color:"#04070C",border:0,borderRadius:8,padding:"8px",fontSize:12,fontWeight:800,opacity:trfYuk?.6:1}}>✓ Onayla</button>
                <button onClick={()=>trfReddet(t)} disabled={trfYuk} className="tap" style={{flex:1,background:T.bg2,color:T.danger,border:"0.5px solid "+T.danger+"55",borderRadius:8,padding:"8px",fontSize:12,fontWeight:700,opacity:trfYuk?.6:1}}>✗ Reddet</button>
              </div>
            </div>;
          })}
      {trfMesaj && <div style={{fontSize:11,color:/✓/.test(trfMesaj)?T.accent:T.danger,textAlign:"center",marginTop:6}}>{trfMesaj}</div>}
    </div>}
    {/* LİG BİLGİLERİNİ DÜZENLE */}
    <div style={{background:T.bg1,borderRadius:12,border:"0.5px solid "+T.line,marginBottom:14,overflow:"hidden"}}>
      <div onClick={()=>setLigAcik(a=>!a)} className="tap" style={{display:"flex",alignItems:"center",gap:8,padding:"12px 13px",cursor:"pointer"}}>
        <span style={{width:30,height:30,borderRadius:8,background:turnuva.renk+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>⚙️</span>
        <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:T.text}}>Lig Bilgilerini Düzenle</div><div style={{fontSize:10,color:T.textMut}}>Ad, logo rengi, konum, tarih, hedef takım</div></div>
        <span style={{fontSize:14,color:T.textMut,transform:ligAcik?"rotate(180deg)":"none",transition:"transform .2s"}}>▾</span>
      </div>
      {ligAcik && <div className="fade-in" style={{padding:"0 13px 14px"}}>
        <div style={{fontSize:11,color:T.textMut,fontWeight:700,marginBottom:6}}>LİG ADI</div>
        <input value={lAd} onChange={e=>setLAd(e.target.value)} style={{width:"100%",background:T.bg2,border:"0.5px solid "+T.line,borderRadius:10,padding:"11px",color:T.text,fontSize:14,fontWeight:600,fontFamily:"inherit",outline:"none",marginBottom:12,boxSizing:"border-box"}}/>
        <div style={{display:"flex",gap:10,marginBottom:12}}>
          <div style={{flex:1}}>
            <div style={{fontSize:11,color:T.textMut,fontWeight:700,marginBottom:6}}>ŞEHİR</div>
            <input value={lSehir} onChange={e=>setLSehir(e.target.value)} style={{width:"100%",background:T.bg2,border:"0.5px solid "+T.line,borderRadius:10,padding:"11px",color:T.text,fontSize:13,fontWeight:600,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:11,color:T.textMut,fontWeight:700,marginBottom:6}}>İLÇE</div>
            <input value={lIlce} onChange={e=>setLIlce(e.target.value)} placeholder="Örn: Kartal" style={{width:"100%",background:T.bg2,border:"0.5px solid "+T.line,borderRadius:10,padding:"11px",color:T.text,fontSize:13,fontWeight:600,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginBottom:12}}>
          <div style={{flex:1}}>
            <div style={{fontSize:11,color:T.textMut,fontWeight:700,marginBottom:6}}>BAŞLANGIÇ TARİHİ</div>
            <input type="date" value={lBaslangic} onChange={e=>setLBaslangic(e.target.value)} style={{width:"100%",background:T.bg2,border:"0.5px solid "+T.line,borderRadius:10,padding:"10px",color:T.text,fontSize:13,fontWeight:600,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:11,color:T.textMut,fontWeight:700,marginBottom:6}}>HEDEF TAKIM</div>
            <div style={{display:"flex",alignItems:"center",gap:6,background:T.bg2,border:"0.5px solid "+T.line,borderRadius:10,padding:"5px 7px"}}>
              <button onClick={()=>setLHedef(Math.max(0,lHedef-1))} className="tap" style={{width:28,height:28,borderRadius:7,background:T.bg1,color:T.text,fontSize:15,fontWeight:700}}>−</button>
              <span style={{flex:1,textAlign:"center",fontSize:14,fontWeight:700,color:T.text}}>{lHedef||"—"}</span>
              <button onClick={()=>setLHedef(Math.min(64,lHedef+1))} className="tap" style={{width:28,height:28,borderRadius:7,background:T.bg1,color:T.text,fontSize:15,fontWeight:700}}>+</button>
            </div>
          </div>
        </div>
        <div style={{fontSize:11,color:T.textMut,fontWeight:700,marginBottom:6}}>SAHA KİŞİ SAYISI</div>
        <div style={{display:"flex",gap:6,marginBottom:14}}>
          {[7,8,9,10,11].map(n=>
            <button key={n} onClick={()=>setLKisi(n)} className="tap" style={{flex:1,padding:"10px 0",borderRadius:9,fontSize:14,fontWeight:800,fontFamily:T.fontDisplay,
              background:lKisi===n?T.accent:T.bg2,color:lKisi===n?(T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0):T.textMut,border:"0.5px solid "+(lKisi===n?T.accent:T.line)}}>{n}</button>
          )}
        </div>
        <div style={{fontSize:9,color:T.textMut,marginBottom:12,marginTop:-8}}>ℹ️ Tüm maçlarda iki takım da bu sayıda olur.</div>

        <div style={{fontSize:11,color:T.gold,fontWeight:700,marginBottom:6}}>💰 SPONSOR <span style={{color:T.textMut,fontWeight:400}}>(opsiyonel)</span></div>
        <div style={{display:"flex",gap:8,marginBottom:6}}>
          <div style={{display:"flex",gap:4,flexShrink:0}}>
            {["🏟️","⚽","🥤","🍕","🏢","👕"].map(e=><button key={e} onClick={()=>setLSponsorE(e)} className="tap" style={{width:36,height:40,borderRadius:9,fontSize:17,background:lSponsorE===e?T.gold+"33":T.bg2,border:"0.5px solid "+(lSponsorE===e?T.gold:T.line)}}>{e}</button>)}
          </div>
          <input value={lSponsor} onChange={e=>setLSponsor(e.target.value)} placeholder="Örn: Kartal Halı Saha" style={{flex:1,minWidth:0,background:T.bg2,border:"0.5px solid "+T.line,borderRadius:10,padding:"10px",color:T.text,fontSize:13,fontWeight:600,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
        </div>
        <div style={{fontSize:9,color:T.textMut,marginBottom:14}}>Lig sayfasında "bu ligin sponsoru" olarak görünür. Boş bırakırsan çıkmaz.</div>

        <div style={{fontSize:11,color:T.textMut,fontWeight:700,marginBottom:6}}>LOGO RENGİ</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
          {RENKLER.slice(0,8).map(r=>
            <span key={r} onClick={()=>setLRenk(r)} className="tap" style={{width:32,height:32,borderRadius:"50%",background:r,cursor:"pointer",border:lRenk===r?"3px solid "+T.text:"2px solid "+T.line}}/>
          )}
        </div>
        <button onClick={ligKaydet} disabled={!lAd.trim()} className="tap" style={{width:"100%",padding:"12px",borderRadius:11,background:lAd.trim()?T.accent:T.bg2,color:lAd.trim()?(T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0):T.textMut,fontSize:14,fontWeight:800,border:"none"}}>💾 Değişiklikleri Kaydet</button>
      </div>}
    </div>

    {/* EXCEL TOPLU EKLE */}
    <div style={{background:T.accent+"0E",borderRadius:12,border:"0.5px solid "+T.accent+"33",marginBottom:14,overflow:"hidden"}}>
      <div onClick={()=>setExcelAcik(a=>!a)} className="tap" style={{display:"flex",alignItems:"center",gap:8,padding:"12px 13px",cursor:"pointer"}}>
        <span style={{width:30,height:30,borderRadius:8,background:"#34D39922",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>📋</span>
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:700,color:T.text}}>Excel'den Toplu Ekle</div>
          <div style={{fontSize:10,color:T.textMut}}>Tablodan kopyala-yapıştır, takımlar+oyuncular otomatik</div>
        </div>
        <span style={{color:T.accent,fontSize:14}}>{excelAcik?"▲":"▼"}</span>
      </div>
      {excelAcik && <div style={{padding:"0 13px 13px"}}>
        <div style={{fontSize:10,color:T.textMut,marginBottom:6,lineHeight:1.5}}>Sütun sırası: <b style={{color:T.textSoft}}>Takım · Ad Soyad · Doğum · Mevki · No · Ayak · Boy · Kilo · Uyruk</b><br/>Excel/Sheets'ten satırları kopyalayıp aşağı yapıştır (sadece Takım + Ad Soyad zorunlu).</div>
        <textarea value={excelMetin} onChange={e=>{setExcelMetin(e.target.value);setExcelSonuc(null);}} placeholder={"Aslanlar\tAlp Araz\t14.03.1995\tForvet\t9\tSağ\t182\t76\tTürkiye\nAslanlar\tBurak Kaya\t22.07.1998\tOrta Saha\t8\tSol\t178\t72\tTürkiye"}
          style={{width:"100%",minHeight:120,background:T.bg0,border:"0.5px solid "+T.line,borderRadius:10,padding:"10px",color:T.text,fontSize:12,fontFamily:"monospace",outline:"none",boxSizing:"border-box",resize:"vertical"}}/>
        {excelMetin.trim() && <div style={{fontSize:10,color:T.textMut,margin:"6px 2px"}}>{excelAyristir(excelMetin).length} satır algılandı</div>}
        <button onClick={excelEkleYap} disabled={!excelMetin.trim()} className="tap" style={{width:"100%",marginTop:8,padding:"11px",borderRadius:10,background:excelMetin.trim()?T.accent:T.bg2,color:excelMetin.trim()?(T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0):T.textMut,fontSize:13,fontWeight:700,border:"none"}}>✓ İçe Aktar</button>
        {excelSonuc && (excelSonuc.hata ? <div style={{fontSize:11,color:T.danger,marginTop:8,textAlign:"center"}}>{excelSonuc.hata}</div> :
          <div style={{fontSize:11,color:T.accent,marginTop:8,textAlign:"center",fontWeight:600}}>✓ {excelSonuc.eklenenTakim} takım, {excelSonuc.eklenenOyuncu} oyuncu eklendi</div>)}
      </div>}
    </div>

    {/* TAKIMLAR */}
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><span style={{width:28,height:28,borderRadius:8,background:"#7c4dff22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>🛡️</span><span style={{fontSize:13,fontWeight:700,color:T.text}}>Takımlar ({tk.length})</span></div>
    <input value={yeniTakimAd} onChange={e=>setYeniTakimAd(e.target.value)} placeholder="Yeni takım adı"
      onKeyDown={e=>{if(e.key==="Enter")takimEkleYap(true);}}
      style={{width:"100%",background:T.bg1,border:"0.5px solid "+T.line,borderRadius:10,padding:"10px",color:T.text,fontSize:13,fontFamily:"inherit",outline:"none",marginBottom:6,boxSizing:"border-box"}}/>
    <div style={{display:"flex",gap:6,marginBottom:10}}>
      <button onClick={()=>takimEkleYap(true)} className="tap vav-bar" style={{position:"relative",overflow:"hidden",flex:1,padding:"10px",borderRadius:10,background:T.accent,color:T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0,fontSize:12,fontWeight:700,border:"none"}}>+ Boş Takım (oyuncuları gir)</button>
      <button onClick={()=>takimEkleYap(false)} className="tap" style={{padding:"10px 12px",borderRadius:10,background:T.bg2,color:T.textSoft,fontSize:12,fontWeight:700,border:"0.5px solid "+T.line}}>🎲 Hazır 12</button>
    </div>
    {/* TAKIMLARIMDAN SEÇ-EKLE — kalıcı kulüp + kadrosu lige otomatik gelir (Q4) */}
    <div style={{marginBottom:12}}>
      {kulupListe===null
        ? <button onClick={kuluplariGetir} disabled={kulupYuk} className="tap" style={{width:"100%",padding:"10px",borderRadius:10,background:T.bg1,border:"0.5px dashed "+T.accent+"66",color:T.accent,fontSize:12,fontWeight:700}}>{kulupYuk?"Yükleniyor…":"📋 Takımlarımdan Seç (oyuncular otomatik gelir)"}</button>
        : kulupListe.length===0
          ? <div style={{fontSize:11,color:T.textMut,textAlign:"center",padding:"8px"}}>Eklenebilecek başka kayıtlı takımın yok. Yukarıdan yeni takım adı yazarak ekleyebilirsin.</div>
          : <div style={{background:T.bg1,border:"0.5px solid "+T.line,borderRadius:10,padding:8}}>
              <div style={{fontSize:10.5,color:T.textMut,marginBottom:6,padding:"0 2px"}}>Dokun → takım ve kadrosu bu lige otomatik eklensin:</div>
              {kulupListe.map(k=><button key={k.id} onClick={()=>kulupEkleLige(k)} className="tap" style={{display:"flex",alignItems:"center",gap:9,width:"100%",padding:"9px 10px",marginBottom:5,background:T.bg0,border:"0.5px solid "+T.line,borderRadius:9,textAlign:"left"}}>
                <span style={{width:26,height:26,borderRadius:7,background:(k.renk||T.accent)+"22",color:k.renk||T.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,flexShrink:0}}>{(k.ad||"?").slice(0,1).toUpperCase()}</span>
                <span style={{flex:1,fontSize:12.5,fontWeight:600,color:T.text}}>{k.ad}</span>
                <span style={{fontSize:16,color:T.accent,fontWeight:700}}>+</span>
              </button>)}
            </div>}
      {kulupMsj && <div style={{fontSize:11,color:kulupMsj[0]==="✓"?T.accent:T.textMut,marginTop:6,textAlign:"center",fontWeight:600}}>{kulupMsj}</div>}
    </div>
    {tk.map(t=>
      <div key={t.id} style={{display:"flex",alignItems:"center",gap:9,background:T.bg1,borderRadius:10,padding:"9px 11px",marginBottom:6,border:"0.5px solid "+T.line}}>
        <label className="tap" title="Ana renk" style={{cursor:"pointer",flexShrink:0,position:"relative"}}>
          <Logo renk={t.renk} ad={t.ad} logo={t.logo} renk2={t.renk2} boy={26}/>
          <input type="color" value={t.renk||"#34D399"} onChange={e=>yonetim.takimDuzenle(turnuva,t.id,{renk:e.target.value})} style={{position:"absolute",inset:0,opacity:0,width:26,height:26,cursor:"pointer"}}/>
        </label>
        <label className="tap" title="2. renk (zorunlu)" style={{cursor:"pointer",flexShrink:0,position:"relative",width:16,height:16,borderRadius:"50%",background:t.renk2||ikinciRenk(t.renk),border:"1.5px solid "+T.bg0}}>
          <input type="color" value={t.renk2||ikinciRenk(t.renk)} onChange={e=>yonetim.takimDuzenle(turnuva,t.id,{renk2:e.target.value})} style={{position:"absolute",inset:0,opacity:0,cursor:"pointer"}}/>
        </label>
        <label className="tap" title={t.logo?"Logoyu değiştir":"Logo yükle"} style={{cursor:"pointer",flexShrink:0,fontSize:13,opacity:t.logo?1:.6}}>
          {t.logo?"🖼️":"📷"}
          <input type="file" accept="image/*" onChange={async e=>{ const f=e.target.files&&e.target.files[0]; if(!f)return; const r=await fotoYukle(f,"logo",t.logo); if(r&&r.url) yonetim.takimDuzenle(turnuva,t.id,{logo:r.url}); else alert((r&&r.hata)||"Yüklenemedi"); e.target.value=""; }} style={{display:"none"}}/>
        </label>
        <span onClick={()=>git({sayfa:"takim",takim:t,turnuva})} className="tap" style={{flex:1,fontSize:13,color:T.text,fontWeight:600,cursor:"pointer",minWidth:0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.ad}</span>
        <button onClick={()=>{ const y=prompt("Takım adı:", t.ad); if(y&&y.trim()) yonetim.takimDuzenle(turnuva,t.id,{ad:y.trim()}); }} className="tap" title="Adı düzenle" style={{color:T.textMut,fontSize:12,background:"none",border:"none",padding:"0 3px"}}>✏️</button>
        {turnuva.format==="gruplu" ?
          <select value={t.grup||0} onChange={e=>yonetim.grupTasi(turnuva,t.id,parseInt(e.target.value))} style={{background:T.bg2,border:"0.5px solid "+T.line,borderRadius:7,padding:"4px 6px",color:T.accent,fontSize:11,fontWeight:700,outline:"none",fontFamily:"inherit"}}>
            {Array.from({length:turnuva.grupSayi||2},(_,gi)=><option key={gi} value={gi}>{"ABCDEFGHIJ"[gi]} Gr.</option>)}
          </select>
          : <span onClick={()=>git({sayfa:"takim",takim:t,turnuva})} className="tap" style={{fontSize:10,color:T.accent,cursor:"pointer",whiteSpace:"nowrap"}}>{t.oyuncular.length} oyuncu ›</span>}
        {iliskisel && typeof t.id==="string" && <button onClick={()=>oyuncuDavetiUret(t.id, t.ad)} className="tap" title="Oyuncu davet linki" style={{color:T.accent2,fontSize:13,background:"none",border:"none",padding:"0 4px"}}>🔗</button>}
        <button onClick={()=>{ if(confirm(t.ad+" takımını sil?")) yonetim.takimSil(turnuva,t.id); }} className="tap" style={{color:T.danger,fontSize:13,background:"none",border:"none",padding:"0 4px"}}>🗑</button>
      </div>
    )}

    {/* GRUPLU: dağıtım butonları */}
    {turnuva.format==="gruplu" && tk.length>=2 && <div style={{background:T.bg1,borderRadius:11,padding:"11px",border:"0.5px solid "+T.line,marginTop:8}}>
      <div style={{fontSize:11,color:T.textMut,fontWeight:700,marginBottom:7}}>GRUPLARA OTOMATİK DAĞIT</div>
      <div style={{display:"flex",gap:6}}>
        <button onClick={()=>yonetim.dagit(turnuva,"dengeli")} className="tap" style={{flex:1,padding:"9px",borderRadius:9,background:T.accent+"22",color:T.accent,fontSize:12,fontWeight:700,border:"1px solid "+T.accent+"44"}}>⚖️ Güce Göre Dengeli</button>
        <button onClick={()=>yonetim.dagit(turnuva,"kura")} className="tap" style={{flex:1,padding:"9px",borderRadius:9,background:T.accent2+"22",color:T.accent2,fontSize:12,fontWeight:700,border:"1px solid "+T.accent2+"44"}}>🎲 Kura</button>
      </div>
      <div style={{fontSize:10,color:T.textMut,marginTop:7}}>Dağıttıktan sonra yukarıdan tek tek grup da değiştirebilirsin.</div>
    </div>}

    {/* FİKSTÜR / MAÇ EKLE */}
    {tk.length>=2 && <>
      <div style={{display:"flex",alignItems:"center",gap:8,margin:"18px 0 8px"}}><span style={{width:28,height:28,borderRadius:8,background:"#EF9F2722",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>📅</span><span style={{fontSize:13,fontWeight:700,color:T.text}}>Maçlar ({turnuva.maclar.length})</span></div>

      {/* otomatik fikstür */}
      <div style={{background:T.bg1,borderRadius:11,padding:"11px",border:"0.5px solid "+T.line,marginBottom:10}}>
        <div style={{fontSize:11,color:T.textMut,fontWeight:700,marginBottom:7}}>OTOMATİK FİKSTÜR ÜRET</div>
        <div style={{display:"flex",gap:6}}>
          <button onClick={()=>{ if(turnuva.maclar.length===0||confirm("Mevcut maçlar silinip yeniden üretilecek. Devam?")) yonetim.fikstürYap(turnuva,false); }} className="tap" style={{flex:1,padding:"9px",borderRadius:9,background:T.accent+"22",color:T.accent,fontSize:12,fontWeight:700,border:"1px solid "+T.accent+"44"}}>Tek Devre</button>
          <button onClick={()=>{ if(turnuva.maclar.length===0||confirm("Mevcut maçlar silinip yeniden üretilecek. Devam?")) yonetim.fikstürYap(turnuva,true); }} className="tap" style={{flex:1,padding:"9px",borderRadius:9,background:T.accent2+"22",color:T.accent2,fontSize:12,fontWeight:700,border:"1px solid "+T.accent2+"44"}}>Çift Devre</button>
        </div>
      </div>

      {/* serbest maç ekle */}
      <div style={{background:T.bg1,borderRadius:11,padding:"11px",border:"0.5px solid "+T.line,marginBottom:10}}>
        <div style={{fontSize:11,color:T.textMut,fontWeight:700,marginBottom:7}}>ELLE MAÇ EKLE</div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <select value={macA} onChange={e=>setMacA(e.target.value)} style={{flex:1,background:T.bg0,border:"0.5px solid "+T.line,borderRadius:8,padding:"9px",color:T.text,fontSize:12,outline:"none",fontFamily:"inherit"}}>
            <option value="">Ev sahibi</option>
            {tk.map(t=><option key={t.id} value={t.id}>{t.ad}</option>)}
          </select>
          <span style={{color:T.textMut,fontSize:12}}>vs</span>
          <select value={macB} onChange={e=>setMacB(e.target.value)} style={{flex:1,background:T.bg0,border:"0.5px solid "+T.line,borderRadius:8,padding:"9px",color:T.text,fontSize:12,outline:"none",fontFamily:"inherit"}}>
            <option value="">Deplasman</option>
            {tk.map(t=><option key={t.id} value={t.id}>{t.ad}</option>)}
          </select>
          <button onClick={macEkleYap} className="tap" style={{padding:"9px 13px",borderRadius:8,background:T.accent,color:T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0,fontSize:12,fontWeight:700,border:"none"}}>+</button>
        </div>
      </div>

      {/* maç listesi — skor gir / sil */}
      {turnuva.maclar.map(mc=>
        <div key={mc.id} style={{display:"flex",alignItems:"center",gap:8,background:T.bg1,borderRadius:10,padding:"9px 11px",marginBottom:6,border:"0.5px solid "+T.line}}>
          <span style={{fontSize:9,color:T.textMut,width:24}}>{turnuva.format==="gruplu"?"ABCDEFGHIJ"[mc.grup||0]:mc.hafta+".H"}</span>
          <span style={{flex:1,fontSize:12,color:T.text,textAlign:"right",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{mc.takimA}</span>
          <span onClick={()=>git({sayfa:"sihirbaz",mac:mc,turnuva})} className="tap" style={{fontWeight:800,fontFamily:T.fontDisplay,fontSize:14,color:mc.oynandi?T.text:T.textMut,minWidth:42,textAlign:"center",cursor:"pointer",background:T.bg2,borderRadius:7,padding:"3px 0"}}>{mc.oynandi?`${mc.skorA}-${mc.skorB}`:"– : –"}</span>
          <span style={{flex:1,fontSize:12,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{mc.takimB}</span>
          <button onClick={()=>{ if(confirm("Maçı sil?")) yonetim.macSil(turnuva,mc.id); }} className="tap" style={{color:T.danger,fontSize:12,background:"none",border:"none",padding:"0 2px"}}>🗑</button>
        </div>
      )}
      <div style={{fontSize:10,color:T.textMut,textAlign:"center",marginTop:6}}>Skoru girmek için ortadaki kutuya dokun</div>
    </>}

    {/* KURAL KİLİDİ (madde 20) + ARŞİV/SİL (madde 21) */}
    {turnuva.maclar.some(m=>m.oynandi) && <div style={{margin:"14px 0 4px",background:"linear-gradient(120deg,"+T.gold+"14,"+T.bg1+")",border:"0.5px solid "+T.gold+"44",borderRadius:11,padding:"11px 13px"}}>
      <div style={{fontSize:12,color:T.text,fontWeight:700}}>🔒 Kurallar kilitli</div>
      <div style={{fontSize:10.5,color:T.textMut,marginTop:3,lineHeight:1.5}}>Maç oynandığı için <b>puan sistemi · averaj · fikstür tipi</b> değiştirilemez. Lig adı, logo, bitiş tarihi serbest.</div>
    </div>}

    {typeof turnuva.id==="string" && yonetim.yeniSezon && <div style={{margin:"14px 0 4px",background:"linear-gradient(135deg,"+T.accent+"14,"+T.bg1+")",border:"0.5px solid "+T.accent+"44",borderRadius:11,padding:"12px 13px"}}>
      <div style={{fontSize:12.5,color:T.text,fontWeight:800,marginBottom:3}}>🗓️ Yeni Sezon</div>
      <div style={{fontSize:10.5,color:T.textMut,marginBottom:9,lineHeight:1.5}}>Bu sezonu bitir, <b>aynı takımlar ve kadrolarla</b> yeni sezona geç. Geçmiş ve kariyer korunur, puan durumu sıfırlanır. Yeni lig hakkı gerekmez.</div>
      {!ysOnay
        ? <button onClick={()=>setYsOnay(true)} className="tap" style={{width:"100%",background:T.accent,color:T.renkCifti&&T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0,border:"none",borderRadius:9,padding:"11px",fontSize:12.5,fontWeight:800}}>🚀 Yeni Sezonu Başlat →</button>
        : <div style={{background:T.gold+"14",border:"1px solid "+T.gold+"55",borderRadius:10,padding:"11px 12px"}}>
            <div style={{fontSize:11.5,color:T.gold,fontWeight:800,marginBottom:5}}>⚠️ Emin misin?</div>
            <div style={{fontSize:10.5,color:T.textSoft,lineHeight:1.5,marginBottom:9}}>Bu sezon <b>arşivlenecek</b> (geçmiş korunur). Aynı takımlar ve kadrolar yeni sezona <b>otomatik eklenecek</b>, puan durumu <b>sıfırlanacak</b>. Yanlışlıkla başlatma!</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>{ setYsOnay(false); yonetim.yeniSezon(turnuva); }} className="tap" style={{flex:1,background:T.accent,color:T.renkCifti&&T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0,border:"none",borderRadius:9,padding:"10px",fontSize:12,fontWeight:800}}>✓ Evet, yeni sezon başlat</button>
              <button onClick={()=>setYsOnay(false)} className="tap" style={{background:T.bg2,color:T.textSoft,border:"0.5px solid "+T.line,borderRadius:9,padding:"10px 14px",fontSize:12,fontWeight:700}}>Vazgeç</button>
            </div>
          </div>}
    </div>}

    <div style={{margin:"14px 0 4px",background:T.bg1,border:"0.5px solid "+T.danger+"33",borderRadius:11,padding:"12px 13px"}}>
      <div style={{fontSize:11,color:T.danger,fontWeight:800,marginBottom:8}}>⚠️ TEHLİKELİ BÖLGE</div>
      {turnuva.durum==="arsiv"
        ? <button onClick={()=>yonetim.ligArsivle(turnuva,false)} className="tap" style={{width:"100%",background:T.accent+"18",color:T.accent,border:"0.5px solid "+T.accent+"55",borderRadius:9,padding:"10px",fontSize:12.5,fontWeight:700,marginBottom:8}}>♻️ Ligi tekrar aktif yap</button>
        : <button onClick={()=>{ if(confirm("Ligi arşivle? Puan/maç geçmişi korunur, listeden gizlenir. İstediğinde geri açarsın.")) yonetim.ligArsivle(turnuva,true); }} className="tap" style={{width:"100%",background:T.gold+"18",color:T.gold,border:"0.5px solid "+T.gold+"55",borderRadius:9,padding:"10px",fontSize:12.5,fontWeight:700,marginBottom:8}}>📦 Ligi Arşivle</button>}
      {!turnuva.maclar.some(m=>m.oynandi)
        ? <button onClick={()=>{ if(confirm("Ligi TAMAMEN sil? Bu geri alınamaz. (Maç oynanmadığı için silinebilir)")) yonetim.ligSilTam(turnuva); }} className="tap" style={{width:"100%",background:"none",color:T.danger,border:"0.5px solid "+T.danger+"55",borderRadius:9,padding:"10px",fontSize:12.5,fontWeight:700}}>🗑️ Ligi tamamen sil</button>
        : (yonetim.adminMi
            ? <button onClick={()=>{ if(confirm("SÜPER ADMIN — \""+turnuva.ad+"\" ligini çöp kutusuna at?\n\n90 gün içinde Admin Panel → Sistem → Çöp Kutusu'ndan GERİ ALABİLİRSİN. 90 gün sonra otomatik kalıcı silinir.")) yonetim.ligSilAdmin(turnuva); }} className="tap" style={{width:"100%",background:T.gold+"18",color:T.gold,border:"0.5px solid "+T.gold+"88",borderRadius:9,padding:"10px",fontSize:12,fontWeight:800}}>🗑️ Süper Admin: Ligi çöp kutusuna at (90 gün geri alınabilir)</button>
            : <div style={{fontSize:10,color:T.textMut,textAlign:"center",lineHeight:1.5}}>Maç oynandığı için lig <b>silinemez</b> — sadece arşivlenebilir (madde 22). Kalıcı silme yalnızca Süper Admin'de.</div>)}
    </div>
    </div>
  </div>;
}

/* ============================================================
   PUAN DURUMU — FatihPro referansı (tam sütun) + web grafikleri
   ============================================================ */
function PuanDurumu({turnuva, T, git}){
  // GRUPLU LİG: her grup için ayrı tablo + filtre
  const [pGrup,setPGrup]=useState(-1); // -1 tümü
  if(turnuva.format==="gruplu"){
    const g=turnuva.grupSayi||2;
    const harfler="ABCDEFGHIJ";
    const gosterilecek = pGrup<0 ? Array.from({length:g},(_,i)=>i) : [pGrup];
    return <div className="fade-in" style={{padding:"10px 14px"}}>
      <div style={{fontSize:12,color:T.textMut,marginBottom:10}}>📋 {g} gruplu lig · her grup kendi içinde</div>
      {g>1 && <div style={{display:"flex",gap:5,marginBottom:12,flexWrap:"wrap"}}>
        <span onClick={()=>setPGrup(-1)} className="tap" style={{fontSize:10.5,padding:"5px 11px",borderRadius:13,background:pGrup===-1?T.accent:T.bg2,color:pGrup===-1?"#fff":T.textMut,fontWeight:pGrup===-1?700:500}}>Tümü</span>
        {Array.from({length:g},(_,gi)=>
          <span key={gi} onClick={()=>setPGrup(gi)} className="tap" style={{fontSize:10.5,padding:"5px 11px",borderRadius:13,background:pGrup===gi?T.accent:T.bg2,color:pGrup===gi?"#fff":T.textMut,fontWeight:pGrup===gi?700:500}}>{harfler[gi]} Grubu</span>
        )}
      </div>}
      {gosterilecek.map(gi=>{
        const grupTk=turnuva.takimlar.filter(t=>(t.grup||0)===gi)
          .sort((a,b)=> b.puan-a.puan || (b.ag-b.yg)-(a.ag-a.yg) || b.ag-a.ag);
        return <div key={gi} style={{marginBottom:18}}>
          <div style={{display:"flex",alignItems:"center",gap:8,margin:"0 4px 8px"}}>
            <span style={{width:26,height:26,borderRadius:8,background:turnuva.renk,color:"#fff",fontWeight:800,fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>{harfler[gi]}</span>
            <span style={{fontSize:14,fontWeight:700,color:T.text}}>{harfler[gi]} Grubu</span>
            <span style={{fontSize:11,color:T.textMut}}>({grupTk.length} takım)</span>
          </div>
          {grupTk.length===0 ? <div style={{fontSize:12,color:T.textMut,padding:"10px 14px",background:T.bg1,borderRadius:10}}>Bu gruba takım atanmadı</div> :
          <GrupTablo takimlar={grupTk} T={T} git={git} turnuva={turnuva}/>}
        </div>;
      })}
    </div>;
  }
  return <PuanDurumuTekli turnuva={turnuva} T={T} git={git}/>;
}

/* Grup tablosu (gruplu lig için sade tablo) */
function GrupTablo({takimlar, T, git, turnuva}){
  const son5=(t)=>(t.form||[]).slice(-5);
  return <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
    <div style={{minWidth:380}}>
      <div style={{display:"grid",gridTemplateColumns:"18px minmax(90px,1fr) 22px 22px 22px 26px 50px 28px",gap:2,padding:"0 8px 6px",fontSize:9,color:T.textMut,fontWeight:700}}>
        <span>#</span><span>TAKIM</span><span style={{textAlign:"center"}}>O</span><span style={{textAlign:"center"}}>G</span><span style={{textAlign:"center"}}>B</span><span style={{textAlign:"center"}}>M</span><span style={{textAlign:"center"}}>SON5</span><span style={{textAlign:"center"}}>P</span>
      </div>
      {takimlar.map((t,i)=>{
        const sira=i+1; const av=t.ag-t.yg;
        const ust = sira<=2;
        const lider = sira===1;
        const vurgu = lider ? T.gold : T.accent;
        return <div key={t.id} onClick={()=>git({sayfa:"takim",takim:t,turnuva})} className="tap prem-tap"
          style={{position:"relative",display:"grid",gridTemplateColumns:"18px minmax(90px,1fr) 22px 22px 22px 26px 50px 28px",gap:2,alignItems:"center",
            background:lider?`linear-gradient(90deg, ${T.gold}1c, ${T.bg1} 60%)`:ust?T.accent+"10":T.bg1,borderRadius:9,padding:"8px 8px 8px 11px",marginBottom:4,fontSize:11,overflow:"hidden",
            boxShadow:lider?`0 4px 16px ${T.gold}22`:"none"}}>
          <div style={{position:"absolute",left:0,top:0,bottom:0,width:3,background:ust?vurgu:"transparent"}}/>
          <span style={{color:ust?vurgu:T.textSoft,fontWeight:700}}>{lider?"🏆":sira}</span>
          <div style={{display:"flex",alignItems:"center",gap:6,minWidth:0}}><Logo renk={t.renk} ad={t.ad} logo={t.logo} renk2={t.renk2} boy={20}/><span style={{color:T.text,fontWeight:lider?700:400,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.ad}</span></div>
          <span style={{textAlign:"center",color:T.textSoft}}>{t.o}</span>
          <span style={{textAlign:"center",color:"#34D399"}}>{t.g}</span>
          <span style={{textAlign:"center",color:T.gold}}>{t.b}</span>
          <span style={{textAlign:"center",color:T.danger}}>{t.m}</span>
          <span style={{display:"flex",gap:2,justifyContent:"center"}}>
            {son5(t).map((f,x)=><span key={x} style={{width:8,height:8,borderRadius:2,background:f==="G"?"#34D399":f==="M"?T.danger:T.gold}}/>)}
          </span>
          <span style={{textAlign:"center",color:vurgu,fontWeight:800,fontFamily:T.fontDisplay,background:vurgu+"1e",borderRadius:6,padding:"3px 0"}}>{t.puan}</span>
        </div>;
      })}
    </div>
  </div>;
}

function PuanDurumuTekli({turnuva, T, git}){
  const takimlar = turnuva.takimlar; // zaten sıralı: puan→averaj→atılan gol
  const n = takimlar.length;
  const lider = takimlar[0];
  const ikinci = takimlar[1]||lider;
  const fark = lider.puan - ikinci.puan;
  const oynanan = takimlar.reduce((s,t)=>s+t.o,0)/2;
  const toplamMac = n*(n-1)/2;
  const ilerleme = toplamMac?Math.round(oynanan/toplamMac*100):0;
  const puanGruplari={}; takimlar.forEach(t=>{puanGruplari[t.puan]=(puanGruplari[t.puan]||0)+1;});
  const enKalabalik = Math.max(...Object.values(puanGruplari));
  const enCokGol = [...takimlar].sort((a,b)=>b.ag-a.ag)[0];
  const enAzYiyen = [...takimlar].sort((a,b)=>a.yg-b.yg)[0];

  // FatihPro bölge mantığı (dinamik)
  const dusmeAdet = n>=8?2 : n>=5?1 : 0;
  const sampSinir = Math.min(3,n);
  const dusmeSinir = n - dusmeAdet;
  const son5=(t)=>(t.form||[]).slice(-5);

  // WEB GRAFİĞİ: hafta hafta kümülatif puan yarışı (ilk 5)
  const yaris = useMemo(()=>{
    const map={}; takimlar.forEach(t=>map[t.ad]={ad:t.ad,renk:t.renk,seri:[0]});
    const haftalar=[...new Set(turnuva.maclar.map(m=>m.hafta))].sort((a,b)=>a-b);
    let kos={}; takimlar.forEach(t=>kos[t.ad]=0);
    haftalar.forEach(h=>{
      turnuva.maclar.filter(m=>m.hafta===h).forEach(m=>{
        if(m.skorA>m.skorB) kos[m.takimA]+=3;
        else if(m.skorB>m.skorA) kos[m.takimB]+=3;
        else { kos[m.takimA]+=1; kos[m.takimB]+=1; }
      });
      takimlar.forEach(t=> map[t.ad].seri.push(kos[t.ad]));
    });
    return {haftaSayisi:haftalar.length, map};
  },[turnuva.id]);

  const cizilecek = takimlar.slice(0,5);
  const yarisData = {
    labels: Array.from({length:yaris.haftaSayisi+1},(_,i)=> i===0?"":(i+"")),
    datasets: cizilecek.map(t=>({
      label: t.ad.length>11?t.ad.slice(0,11)+"…":t.ad,
      data: yaris.map[t.ad].seri,
      borderColor:t.renk, backgroundColor:t.renk+"22",
      borderWidth:t.sira===1?3:2, tension:.35, pointRadius:0, pointHoverRadius:4,
    }))
  };
  const yarisOpt = {
    plugins:{ legend:{ labels:{ color:T.textSoft, boxWidth:9, font:{size:10}, usePointStyle:true } } },
    scales:{ x:{ ticks:{color:T.textMut,font:{size:9}}, grid:{display:false} },
             y:{ ticks:{color:T.textMut,font:{size:9}}, grid:{color:T.line} } }
  };

  return <div className="fade-in" style={{padding:"10px 14px"}}>

    {/* 4 KPI ŞERİDİ */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
      <KpiKutu T={T} ikon="👑" etiket="Lider" deger={lider.ad.length>11?lider.ad.slice(0,11)+"…":lider.ad} alt={lider.puan+" puan · "+lider.o+" maç"} renk={T.gold}/>
      <KpiKutu T={T} ikon="📊" etiket="Lider Farkı" deger={fark===0?"Eşit":("+"+fark)} alt={fark===0?"2. ile eşit puanda":("2. sıraya "+fark+" puan")} renk={T.accent}/>
      <KpiKutu T={T} ikon="⏳" etiket="Sezon İlerlemesi" deger={"%"+ilerleme} alt={Math.round(oynanan)+"/"+toplamMac+" maç oynandı"} renk={T.accent2} oran={ilerleme}/>
      <KpiKutu T={T} ikon="🤝" etiket="Eşit Puan" deger={enKalabalik>1?enKalabalik+" takım":"Yok"} alt={enKalabalik>1?"kıyasıya yarış":"tüm puanlar farklı"} renk={T.danger}/>
    </div>

    {/* PUAN YARIŞI ÇİZGİSİ (WEB GÜCÜ) */}
    <div style={{background:T.bg1,borderRadius:14,padding:"12px 12px 6px",marginBottom:14,border:"0.5px solid "+T.line}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
        <div style={{fontSize:13,fontWeight:700,color:T.text}}>📈 Şampiyonluk Yarışı</div>
        <div style={{fontSize:10,color:T.textMut}}>ilk 5 · hafta hafta puan</div>
      </div>
      <Grafik tip="line" data={yarisData} options={yarisOpt} yukseklik={170}/>
    </div>

    {/* PUAN TABLOSU — FatihPro tam sütun: # takım M G B Mğ AG YG Av P SON5 */}
    <div style={{fontSize:13,fontWeight:700,color:T.text,margin:"0 4px 8px"}}>🏆 Puan Tablosu</div>
    <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
      <div style={{minWidth:430}}>
        <div style={{display:"grid",gridTemplateColumns:"20px minmax(96px,1fr) 22px 22px 22px 26px 26px 56px 30px",gap:2,padding:"0 8px 6px",fontSize:9,color:T.textMut,fontWeight:700,letterSpacing:.2}}>
          <span>#</span><span>TAKIM</span>
          <span style={{textAlign:"center"}}>O</span><span style={{textAlign:"center"}}>G</span>
          <span style={{textAlign:"center"}}>B</span><span style={{textAlign:"center"}}>M</span>
          <span style={{textAlign:"center"}}>AV</span><span style={{textAlign:"center"}}>SON 5</span>
          <span style={{textAlign:"center"}}>P</span>
        </div>
        {takimlar.map(t=>{
          const samp=t.sira<=sampSinir, dusme=t.sira>dusmeSinir;
          const lider=t.sira===1;
          const seritRenk = samp?T.gold : dusme?T.danger : "transparent";
          const av=t.ag-t.yg;
          return <div key={t.id} onClick={()=>git({sayfa:"takim",takim:t,turnuva})} className={"tap prem-tap"+(lider?" vav-hero":"")}
            style={{position:"relative",display:"grid",gridTemplateColumns:"20px minmax(96px,1fr) 22px 22px 22px 26px 26px 56px 30px",gap:2,alignItems:"center",
              background:lider?`linear-gradient(120deg, ${T.gold}3a, ${T.bg1} 42%, ${T.gold}22 70%, ${T.bg1})`:samp?T.gold+"12":dusme?T.danger+"10":T.bg1,borderRadius:9,padding:"8px 8px 8px 11px",marginBottom:4,fontSize:11,overflow:"hidden",
              boxShadow:lider?`0 4px 20px ${T.gold}33`:"none"}}>
            {lider && <div className="vav-supurme"/>}
            <div style={{position:"absolute",left:0,top:0,bottom:0,width:lider?4:3,background:seritRenk,zIndex:1}}/>
            <span style={{color:samp?T.gold:dusme?T.danger:T.textSoft,fontWeight:700,position:"relative"}}>{lider?"🏆":t.sira}</span>
            <div style={{display:"flex",alignItems:"center",gap:6,minWidth:0,position:"relative"}}><Logo renk={t.renk} ad={t.ad} logo={t.logo} renk2={t.renk2} boy={20}/><span style={{color:T.text,fontWeight:lider?700:400,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.ad}</span></div>
            <span style={{textAlign:"center",color:T.textSoft,position:"relative"}}>{t.o}</span>
            <span style={{textAlign:"center",color:"#34D399",position:"relative"}}>{t.g}</span>
            <span style={{textAlign:"center",color:T.gold,position:"relative"}}>{t.b}</span>
            <span style={{textAlign:"center",color:T.danger,position:"relative"}}>{t.m}</span>
            <span style={{textAlign:"center",color:av>=0?"#34D399":T.danger,fontWeight:600,position:"relative"}}>{av>=0?"+":""}{av}</span>
            <span style={{display:"flex",gap:2,justifyContent:"center",position:"relative"}}>
              {son5(t).map((f,i)=><span key={i} className="pop" style={{width:9,height:9,borderRadius:2,background:f==="G"?"#34D399":f==="M"?T.danger:T.gold}}/>)}
            </span>
            <span className={samp?"vav-parla":""} style={{textAlign:"center",color:T.gold,fontWeight:800,fontFamily:T.fontDisplay,background:T.gold+(lider?"2a":samp?"22":"18"),borderRadius:6,padding:"3px 0",position:"relative"}}>{t.puan}</span>
          </div>;
        })}
      </div>
    </div>

    {/* BÖLGE AÇIKLAMA */}
    <div style={{display:"flex",gap:14,justifyContent:"center",margin:"8px 0 16px",fontSize:10,color:T.textMut}}>
      <span style={{display:"flex",alignItems:"center",gap:5}}><span style={{width:8,height:8,borderRadius:2,background:T.gold}}/>Şampiyonluk/Avrupa</span>
      {dusmeAdet>0 && <span style={{display:"flex",alignItems:"center",gap:5}}><span style={{width:8,height:8,borderRadius:2,background:T.danger}}/>Düşme hattı</span>}
    </div>

    {/* PODYUM */}
    <div style={{fontSize:13,fontWeight:700,color:T.text,margin:"0 4px 10px"}}>🥇 Zirve</div>
    <div style={{background:T.bg1,borderRadius:14,padding:"16px 12px 8px",marginBottom:16,border:"0.5px solid "+T.line}}>
      <TakimPodyum liste={takimlar.slice(0,3)} T={T}/>
    </div>

    {/* HÜCUM / DEFANS LİDERLERİ */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
      <div onClick={()=>git({sayfa:"takim",takim:enCokGol,turnuva})} className="tap" style={{background:T.accent+"12",borderRadius:12,padding:"12px",border:"0.5px solid "+T.accent+"33"}}>
        <div style={{fontSize:18}}>💥</div>
        <div style={{fontSize:9,color:T.textMut,fontWeight:600,marginTop:4}}>EN GOLCÜ</div>
        <div style={{fontSize:12,fontWeight:700,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{enCokGol.ad}</div>
        <div style={{fontSize:16,fontWeight:800,color:T.accent,fontFamily:T.fontDisplay}}>{enCokGol.ag} <span style={{fontSize:10,color:T.textMut,fontWeight:400}}>gol</span></div>
      </div>
      <div onClick={()=>git({sayfa:"takim",takim:enAzYiyen,turnuva})} className="tap" style={{background:T.accent2+"12",borderRadius:12,padding:"12px",border:"0.5px solid "+T.accent2+"33"}}>
        <div style={{fontSize:18}}>🛡️</div>
        <div style={{fontSize:9,color:T.textMut,fontWeight:600,marginTop:4}}>EN AZ GOL YİYEN</div>
        <div style={{fontSize:12,fontWeight:700,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{enAzYiyen.ad}</div>
        <div style={{fontSize:16,fontWeight:800,color:T.accent2,fontFamily:T.fontDisplay}}>{enAzYiyen.yg} <span style={{fontSize:10,color:T.textMut,fontWeight:400}}>yedi</span></div>
      </div>
    </div>

    {/* LİDER SEZON ISI HARİTASI */}
    <div style={{fontSize:13,fontWeight:700,color:T.text,margin:"0 4px 10px"}}>🔥 Lider Sezon Akışı — {lider.ad}</div>
    <div style={{background:T.bg1,borderRadius:14,padding:14,border:"0.5px solid "+T.line}}>
      <IsiHarita form={lider.form||[]} T={T}/>
      <div style={{display:"flex",gap:14,marginTop:10,fontSize:10,color:T.textMut}}>
        <span><b style={{color:T.accent}}>G</b> Galibiyet</span>
        <span><b style={{color:T.gold}}>B</b> Beraberlik</span>
        <span><b style={{color:T.danger}}>M</b> Mağlubiyet</span>
      </div>
    </div>
  </div>;
}

function KpiKutu({ikon, etiket, deger, alt, renk, T, oran}){
  return <div style={{background:T.bg1,borderRadius:13,padding:"12px 13px",border:"0.5px solid "+T.line}}>
    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
      <span style={{fontSize:15}}>{ikon}</span>
      <span style={{fontSize:10,color:T.textMut,fontWeight:600,letterSpacing:.4}}>{etiket}</span>
    </div>
    <div style={{fontSize:17,fontWeight:800,color:renk,fontFamily:T.fontDisplay,lineHeight:1.1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{deger}</div>
    <div style={{fontSize:10,color:T.textSoft,marginTop:2}}>{alt}</div>
    {oran!=null && <div style={{height:4,background:T.bg2,borderRadius:3,overflow:"hidden",marginTop:7}}>
      <div className="bar-grow" style={{width:oran+"%",height:"100%",background:renk,borderRadius:3}}/>
    </div>}
  </div>;
}

function TakimPodyum({liste, T}){
  const ilk3=liste.slice(0,3);
  const siralama=[ilk3[1],ilk3[0],ilk3[2]].filter(Boolean);
  const yuk=[58,82,44]; const madalya=["🥈","🥇","🥉"];
  return <div style={{display:"flex",alignItems:"flex-end",justifyContent:"center",gap:10}}>
    {siralama.map((t,i)=> t &&
      <div key={t.id} style={{display:"flex",flexDirection:"column",alignItems:"center",flex:1,minWidth:0}}>
        <Logo renk={t.renk} ad={t.ad} logo={t.logo} renk2={t.renk2} boy={i===1?40:32}/>
        <div style={{fontSize:10,color:T.text,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:"100%",marginTop:4}}>{t.ad}</div>
        <div style={{fontSize:10,color:T.gold,fontWeight:700}}>{t.puan} P</div>
        <div className="bar-grow" style={{width:"100%",height:yuk[i],background:i===1?T.gold:T.bg2,borderRadius:"6px 6px 0 0",marginTop:5,display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:5,transformOrigin:"bottom"}}>
          <span style={{fontSize:17}}>{madalya[i]}</span>
        </div>
      </div>
    )}
  </div>;
}

/* ============================================================
   KRALLAR — podyum + zengin liste (gol/asist/kurtarış)
   ============================================================ */
function KrallarSayfa({golK, asistK, kurtarisK, turnuva, T, git}){
  const [alt,setAlt]=useState("gol");
  const [krallarSira,setKrallarSira]=useState("toplam"); // toplam | mac | per90
  const tablar=[["gol","⚽ Gol","gol",T.accent],["asist","🎯 Asist","asist",T.accent2],["kurtaris","🧤 Kurtarış","kurtaris",T.gold],["odul","🏅 Ödüller",null,T.danger]];
  const aktif = tablar.find(x=>x[0]===alt);
  // gol/asist için dakika + per90 yardımcıları
  const dkOf=(o)=> o.dk>0?o.dk:(o.mac||0)*60;
  const per90Of=(o,alan)=>{ const d=dkOf(o); return d>0?(o[alan]*90/d):0; };
  const perMacOf=(o,alan)=> o.mac>0?(o[alan]/o.mac):0;

  return <div className="fade-in" style={{padding:"12px 14px"}}>
    {/* alt sekme */}
    <div style={{display:"flex",gap:6,marginBottom:14}}>
      {tablar.map(([k,l,,c])=>
        <div key={k} onClick={()=>setAlt(k)} className="tap" style={{flex:1,textAlign:"center",fontSize:11.5,fontWeight:600,padding:"9px 0",borderRadius:10,
          background:alt===k?c+"1F":T.bg1,color:alt===k?c:T.textMut,border:"0.5px solid "+(alt===k?c+"55":T.line)}}>{l}</div>
      )}
    </div>

    {alt==="odul" ? <OdulMerkezi turnuva={turnuva} T={T} git={git}/> : (()=>{
      const alan = aktif[2], renk = aktif[3];
      const golAsist = (alt==="gol"||alt==="asist");
      // liste: gol/asist seçilen sıralamaya göre tüm oyunculardan; kurtarış prop'tan
      let liste;
      if(golAsist){
        const tumO=[]; turnuva.takimlar.forEach(tk=>tk.oyuncular.forEach(o=>tumO.push({...o,takimAd:tk.ad,takimRenk:tk.renk})));
        liste=tumO.filter(o=>(o[alan]||0)>0);
        if(krallarSira==="toplam") liste.sort((a,b)=>b[alan]-a[alan]);
        else if(krallarSira==="mac") liste.sort((a,b)=>perMacOf(b,alan)-perMacOf(a,alan));
        else liste.sort((a,b)=>per90Of(b,alan)-per90Of(a,alan));
        liste=liste.slice(0,10);
      } else {
        liste = kurtarisK;
      }
      if(liste.length===0) return <div style={{textAlign:"center",color:T.textMut,fontSize:12,padding:30}}>Henüz veri yok</div>;
      // bar için max değer (seçili ölçüte göre)
      const olcut=(o)=> !golAsist?o[alan] : krallarSira==="toplam"?o[alan] : krallarSira==="mac"?perMacOf(o,alan) : per90Of(o,alan);
      const max = olcut(liste[0])||1;
      return <>
        {/* sıralama çipleri — sadece gol/asist */}
        {golAsist && <div style={{display:"flex",gap:5,marginBottom:12}}>
          {[["toplam","Toplam"],["mac","/maç"],["per90","/90 dk"]].map(([k,et])=>
            <span key={k} onClick={()=>setKrallarSira(k)} className="tap" style={{flex:1,textAlign:"center",fontSize:11,borderRadius:9,padding:"7px 0",fontWeight:krallarSira===k?700:500,
              color:krallarSira===k?(T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0):T.textMut, background:krallarSira===k?renk:T.bg1,border:"0.5px solid "+(krallarSira===k?renk:T.line)}}>{et}</span>
          )}
        </div>}
        <div style={{background:T.bg1,borderRadius:14,padding:"18px 12px 10px",marginBottom:14,border:"0.5px solid "+T.line}}>
          <KralPodyum liste={liste.slice(0,3)} alan={alan} renk={renk} T={T} git={git}/>
        </div>
        {liste.map((o,i)=>{
          const dk=dkOf(o);
          const sagDeger = !golAsist?o[alan] : krallarSira==="toplam"?o[alan] : krallarSira==="mac"?perMacOf(o,alan).toFixed(2) : per90Of(o,alan).toFixed(1);
          const altBilgi = golAsist ? (krallarSira==="toplam"?`${perMacOf(o,alan).toFixed(1)}/maç` : krallarSira==="mac"?`${o[alan]} toplam` : `${per90Of(o,alan).toFixed(1)}/90 🔥`) : `${o.mac>0?(o[alan]/o.mac).toFixed(1):"0"}/maç`;
          return <div key={o.id} onClick={()=>git({sayfa:"oyuncu",oyuncu:o})} className="tap" style={{display:"flex",alignItems:"center",gap:11,background:i<3?renk+"10":T.bg1,borderRadius:11,padding:"9px 12px",marginBottom:5,border:"0.5px solid "+(i<3?renk+"33":T.line)}}>
            <span style={{width:16,color:i<3?renk:T.textMut,fontSize:13,fontWeight:700,textAlign:"center"}}>{i+1}</span>
            <Avatar o={o} boy={34} T={T}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,color:T.text,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{o.ad}</div>
              <div style={{display:"flex",alignItems:"center",gap:5,marginTop:2}}>
                <span style={{width:7,height:7,borderRadius:"50%",background:o.takimRenk||T.textMut,flexShrink:0}}/>
                <span style={{fontSize:11,color:T.textMut,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{o.takimAd} · {o.mac||0} maç · {dk} dk</span>
              </div>
              <div style={{height:4,background:T.bg2,borderRadius:3,overflow:"hidden",marginTop:5}}>
                <div className="bar-grow" style={{width:(olcut(o)/max*100)+"%",height:"100%",background:renk,borderRadius:3}}/>
              </div>
            </div>
            <div style={{textAlign:"right",minWidth:24}}>
              <span style={{fontSize:18,fontWeight:800,color:renk,fontFamily:T.fontDisplay}}>{sagDeger}</span>
              <div style={{fontSize:8,color:(golAsist&&krallarSira==="per90")?T.gold:T.textMut}}>{altBilgi}</div>
            </div>
          </div>;
        })}
      </>;
    })()}
  </div>;
}

/* ÖDÜL MERKEZİ — tüm maç ödüllerinin sezon liderleri */
function OdulMerkezi({turnuva, T, git}){
  const oduller=[
    {alan:"mvp",       ik:"🌟", ad:"Maçın Yıldızı", aclk:"En çok MVP", renk:T.gold},
    {alan:"macinGolu", ik:"🔥", ad:"Maçın Golü",    aclk:"En çok maçın golü", renk:T.accent},
    {alan:"forvet",    ik:"⚽", ad:"En İyi Forvet",  aclk:"En çok forvet ödülü", renk:T.accent},
    {alan:"ortasaha",  ik:"🎯", ad:"En İyi Orta Saha", aclk:"En çok orta saha ödülü", renk:T.accent2},
    {alan:"defans",    ik:"🛡️", ad:"En İyi Defans",  aclk:"En çok defans ödülü", renk:T.accent2},
    {alan:"kaleci",    ik:"🧤", ad:"En İyi Kaleci",  aclk:"En çok kaleci ödülü", renk:T.gold},
    {alan:"altin",     ik:"🥇", ad:"Altın Madalya",  aclk:"En çok altın", renk:T.gold},
    {alan:"gumus",     ik:"🥈", ad:"Gümüş Madalya",  aclk:"En çok gümüş", renk:T.textSoft},
    {alan:"enerjik",   ik:"⚡", ad:"En Enerjik",     aclk:"En çok enerjik ödülü", renk:T.danger},
    {alan:"centilmen", ik:"🤝", ad:"Centilmen",      aclk:"En çok centilmenlik", renk:T.accent2},
  ];

  // her ödül için lideri çek
  const veri = oduller.map(o=>({...o, lider: Motor.turnuvaOdulKrali(turnuva, o.alan, 3)})).filter(o=>o.lider.length>0);

  if(veri.length===0) return <div style={{textAlign:"center",color:T.textMut,fontSize:12,padding:30}}>Henüz ödül verisi yok</div>;

  // en çok toplam ödül alan oyuncu (vitrin)
  const hepsi=[];
  turnuva.takimlar.forEach(tk=>tk.oyuncular.forEach(o=>hepsi.push({...o, takimAd:tk.ad, takimRenk:tk.renk,
    toplamOdul:(o.mvp||0)+(o.macinGolu||0)+(o.forvet||0)+(o.ortasaha||0)+(o.defans||0)+(o.kaleci||0)+(o.altin||0)+(o.gumus||0)+(o.enerjik||0)+(o.centilmen||0)})));
  const vitrin=[...hepsi].sort((a,b)=>b.toplamOdul-a.toplamOdul).slice(0,3);

  return <>
    {/* VİTRİN — en çok ödül toplayan oyuncu */}
    {vitrin[0]?.toplamOdul>0 && <div style={{background:`linear-gradient(135deg, ${T.gold}22, ${T.bg1})`,borderRadius:16,padding:"16px",marginBottom:16,border:"0.5px solid "+T.gold+"44"}}>
      <div style={{fontSize:10,color:T.gold,fontWeight:700,letterSpacing:.6,marginBottom:10}}>🏆 SEZONUN EN ÇOK ÖDÜL TOPLAYANI</div>
      <div onClick={()=>git({sayfa:"oyuncu",oyuncu:vitrin[0]})} className="tap" style={{display:"flex",alignItems:"center",gap:13}}>
        <div style={{position:"relative"}}>
          <div style={{width:54,height:54,borderRadius:"50%",overflow:"hidden",border:"2px solid "+T.gold}} dangerouslySetInnerHTML={{__html:svgAvatar(vitrin[0].ad,54,vitrin[0].foto)}}/>
          <span style={{position:"absolute",bottom:-4,right:-4,fontSize:18}}>👑</span>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:17,fontWeight:800,color:T.text,fontFamily:T.fontDisplay,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{vitrin[0].ad}</div>
          <div style={{display:"flex",alignItems:"center",gap:5,marginTop:2}}><span style={{width:7,height:7,borderRadius:"50%",background:vitrin[0].takimRenk}}/><span style={{fontSize:12,color:T.textMut}}>{vitrin[0].takimAd}</span></div>
        </div>
        <div style={{textAlign:"right"}}><div style={{fontSize:26,fontWeight:800,color:T.gold,fontFamily:T.fontDisplay,lineHeight:1}}>{vitrin[0].toplamOdul}</div><div style={{fontSize:9,color:T.textMut}}>toplam ödül</div></div>
      </div>
      {/* takipçiler */}
      {vitrin.slice(1).map(v=> v.toplamOdul>0 &&
        <div key={v.id} onClick={()=>git({sayfa:"oyuncu",oyuncu:v})} className="tap" style={{display:"flex",alignItems:"center",gap:9,marginTop:9,paddingTop:9,borderTop:"0.5px solid "+T.line}}>
          <Avatar o={v} boy={26} T={T}/>
          <span style={{flex:1,fontSize:12,color:T.textSoft,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{v.ad}</span>
          <span style={{fontSize:13,fontWeight:700,color:T.textSoft}}>{v.toplamOdul} ödül</span>
        </div>
      )}
    </div>}

    {/* ÖDÜL KARTLARI GRID */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
      {veri.map(o=>{
        const lider=o.lider[0];
        return <div key={o.alan} onClick={()=>git({sayfa:"oyuncu",oyuncu:lider})} className="tap" style={{background:T.bg1,borderRadius:13,padding:"13px 12px",border:"0.5px solid "+T.line,position:"relative",overflow:"hidden"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:9}}>
            <span style={{fontSize:20}}>{o.ik}</span>
            <span style={{fontSize:18,fontWeight:800,color:o.renk,fontFamily:T.fontDisplay,background:o.renk+"18",borderRadius:7,padding:"2px 8px"}}>{lider[o.alan]}</span>
          </div>
          <div style={{fontSize:11,color:T.textMut,fontWeight:600,marginBottom:6}}>{o.ad}</div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <Avatar o={lider} boy={30} T={T}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12.5,fontWeight:700,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{lider.ad}</div>
              <div style={{display:"flex",alignItems:"center",gap:4,marginTop:1}}><span style={{width:6,height:6,borderRadius:"50%",background:lider.takimRenk}}/><span style={{fontSize:10,color:T.textMut,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{lider.takimAd}</span></div>
            </div>
          </div>
          {/* takip eden 2 isim */}
          {o.lider.length>1 && <div style={{marginTop:8,paddingTop:8,borderTop:"0.5px solid "+T.line,display:"flex",flexDirection:"column",gap:3}}>
            {o.lider.slice(1,3).map((p,idx)=>
              <div key={p.id} style={{display:"flex",alignItems:"center",gap:5,fontSize:10,color:T.textMut}}>
                <span style={{width:11,textAlign:"center"}}>{idx+2}</span>
                <span style={{flex:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.ad}</span>
                <span style={{fontWeight:700,color:T.textSoft}}>{p[o.alan]}</span>
              </div>
            )}
          </div>}
        </div>;
      })}
    </div>
  </>;
}

function KralPodyum({liste, alan, renk, T, git}){
  const birim = alan==="gol"?"gol":alan==="asist"?"asist":"kurtarış";
  const ilk3=liste.slice(0,3);
  const siralama=[ilk3[1],ilk3[0],ilk3[2]].filter(Boolean);
  const yuk=[54,76,42]; const madalya=["🥈","🥇","🥉"]; const boy=[40,52,40];
  return <div style={{display:"flex",alignItems:"flex-end",justifyContent:"center",gap:10}}>
    {siralama.map((o,i)=> o &&
      <div key={o.id} onClick={()=>git({sayfa:"oyuncu",oyuncu:o})} className="tap" style={{display:"flex",flexDirection:"column",alignItems:"center",flex:1,minWidth:0}}>
        <div style={{position:"relative"}}>
          <div style={{width:boy[i],height:boy[i],borderRadius:"50%",overflow:"hidden",border:"2px solid "+(i===1?T.gold:renk)}} dangerouslySetInnerHTML={{__html:svgAvatar(o.ad,boy[i],o.foto)}}/>
          <span style={{position:"absolute",bottom:-4,right:-4,fontSize:16}}>{madalya[i]}</span>
        </div>
        <div style={{fontSize:11,color:T.text,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:"100%",marginTop:6}}>{o.ad.split(" ")[0]}</div>
        <div style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:6,height:6,borderRadius:"50%",background:o.takimRenk||T.textMut}}/><span style={{fontSize:9,color:T.textMut,whiteSpace:"nowrap",maxWidth:60,overflow:"hidden",textOverflow:"ellipsis"}}>{o.takimAd}</span></div>
        <div style={{fontSize:13,color:renk,fontWeight:800,fontFamily:T.fontDisplay}}>{o[alan]} <span style={{fontSize:9,color:T.textMut,fontWeight:400}}>{birim}</span></div>
        <div className="bar-grow" style={{width:"100%",height:yuk[i],background:i===1?renk:T.bg2,borderRadius:"6px 6px 0 0",marginTop:5,transformOrigin:"bottom"}}/>
      </div>
    )}
  </div>;
}

/* ============================================================
   MAÇLAR — hafta filtresi + galip vurgu + MVP + skor renk
   ============================================================ */
function SkorKart({mac:m, turnuva, T, git}){
  const [onizleme,setOnizleme]=useState("");   // üretilmiş PNG dataURL
  const [durum,setDurum]=useState("");          // kısa geri bildirim
  const [mesgul,setMesgul]=useState(false);
  // sayfa açılınca kartı bir kez üret → önizleme göster
  useEffect(()=>{ let a=true; (async()=>{
    try{ const c=await skorKartiCanvas(m,turnuva); if(a) setOnizleme(c.toDataURL("image/png")); }catch(e){}
  })(); return ()=>{a=false;}; },[m.id]);
  const paylas=async()=>{
    if(mesgul) return; setMesgul(true); setDurum("");
    const r=await skorKartiPaylas(m,turnuva);
    setMesgul(false);
    setDurum(r==="paylasildi"?"Paylaşıldı ✅":r==="indirildi"?"Görsel indirildi ✅ (galerinden paylaşabilirsin)":r==="iptal"?"":"Bir sorun oldu, tekrar dene");
  };
  return <div className="fade-in" style={{padding:"16px 14px 90px"}}>
    <div style={{fontSize:12,color:T.textMut,textAlign:"center",marginBottom:14,lineHeight:1.5}}>Hazır maç kartı 📲<br/><span style={{fontSize:11}}>Paylaş'a bas — WhatsApp, Instagram, her yere gider.</span></div>
    {/* GERÇEK GÖRSEL ÖNİZLEME (canvas'tan üretilen PNG) */}
    <div style={{borderRadius:18,overflow:"hidden",border:"1px solid "+T.gold+"44",background:T.bg1,minHeight:200,display:"flex",alignItems:"center",justifyContent:"center"}}>
      {onizleme
        ? <img src={onizleme} alt="Maç skor kartı" style={{width:"100%",display:"block"}}/>
        : <div style={{padding:40,color:T.textMut,fontSize:12}}>Kart hazırlanıyor…</div>}
    </div>
    {/* AKSİYONLAR */}
    <div style={{display:"flex",gap:8,marginTop:14}}>
      <button onClick={paylas} disabled={!onizleme||mesgul} className="tap" style={{flex:2,padding:14,borderRadius:12,background:onizleme?T.accent:T.bg2,color:onizleme?(T.renkCifti&&T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0):T.textMut,fontSize:14,fontWeight:800,border:"none",opacity:mesgul?0.6:1}}>{mesgul?"…":"📲 Paylaş"}</button>
      <button onClick={()=>{ if(!onizleme)return; const a=document.createElement("a"); a.href=onizleme; a.download="forzalig-skor.png"; document.body.appendChild(a); a.click(); a.remove(); setDurum("İndirildi ✅"); }} disabled={!onizleme} className="tap" style={{flex:1,padding:14,borderRadius:12,background:T.bg1,color:T.text,fontSize:14,fontWeight:700,border:"0.5px solid "+T.line}}>⬇️ İndir</button>
    </div>
    {durum && <div style={{textAlign:"center",fontSize:12,color:T.accent,marginTop:10,fontWeight:600}}>{durum}</div>}
    <div style={{textAlign:"center",fontSize:10,color:T.textMut,marginTop:14,lineHeight:1.6}}>Not: Paylaş bazı tarayıcılarda görseli doğrudan gönderir; desteklemiyorsa otomatik indirir, sonra galerinden paylaşırsın.</div>
  </div>;
}

function Karsilastir({tip, a, b, aday, turnuva, T, git}){
  // tip: "oyuncu" — a ve b oyuncu objeleri; aday: seçim listesi (b yoksa)
  const [secB,setSecB]=useState(b||null);
  const [ara,setAra]=useState("");
  if(!secB){
    const q=ara.trim().toLocaleLowerCase("tr");
    const liste=(aday||[]).filter(o=>o.id!==a.id).filter(o=>!q||o.ad.toLocaleLowerCase("tr").includes(q)).sort((x,y)=>((y.gol||0)+(y.asist||0))-((x.gol||0)+(x.asist||0)));
    return <div className="fade-in" style={{padding:"16px 14px 90px"}}>
      <div style={{fontSize:14,color:T.text,fontWeight:700,marginBottom:4}}>⚔️ {a.ad} ile kimi karşılaştıralım?</div>
      <div style={{fontSize:11,color:T.textMut,marginBottom:12}}>Karşılaştırmak için bir oyuncu seç</div>
      <div style={{display:"flex",alignItems:"center",gap:8,background:T.bg1,borderRadius:10,padding:"8px 12px",marginBottom:10,border:"0.5px solid "+T.line}}>
        <span style={{fontSize:14,color:T.textMut}}>🔍</span>
        <input value={ara} onChange={e=>setAra(e.target.value)} placeholder="Oyuncu ara..." style={{flex:1,background:"none",border:0,color:T.text,fontSize:13,outline:"none",fontFamily:"inherit"}}/>
      </div>
      {liste.slice(0,40).map(o=>
        <div key={o.id} onClick={()=>setSecB(o)} className="tap" style={{display:"flex",alignItems:"center",gap:10,background:T.bg1,borderRadius:10,padding:"9px 11px",marginBottom:5,border:"0.5px solid "+T.line}}>
          <div style={{width:30,height:30,borderRadius:"50%",overflow:"hidden"}} dangerouslySetInnerHTML={{__html:svgAvatar(o.ad,30,o.foto)}}/>
          <span style={{flex:1,fontSize:13,color:T.text}}>{o.ad}</span>
          <span style={{fontSize:11,color:T.textMut}}>{o.gol||0}G {o.asist||0}A</span>
        </div>
      )}
      {liste.length===0 && <div style={{textAlign:"center",color:T.textMut,fontSize:12,padding:24}}>Oyuncu bulunamadı</div>}
    </div>;
  }
  const dk=(o)=> o.dk>0?o.dk:(o.mac||0)*60;
  const k90=(o)=>{ const d=dk(o); return d>0?(((o.gol||0)+(o.asist||0))/d*90).toFixed(2):"0"; };
  const satir=(et,va,vb,terA,format)=>{
    const fa=format?format(va):va, fb=format?format(vb):vb;
    const aIyi=parseFloat(va)>parseFloat(vb), bIyi=parseFloat(vb)>parseFloat(va);
    return <div style={{display:"flex",alignItems:"center",padding:"9px 0",borderTop:"0.5px solid "+T.line}}>
      <span style={{width:54,fontSize:15,fontWeight:800,color:aIyi?T.accent:T.text,fontFamily:T.fontDisplay,textAlign:"left"}}>{fa}</span>
      <span style={{flex:1,textAlign:"center",fontSize:10,color:T.textMut}}>{et}</span>
      <span style={{width:54,fontSize:15,fontWeight:800,color:bIyi?T.accent:T.text,fontFamily:T.fontDisplay,textAlign:"right"}}>{fb}</span>
    </div>;
  };
  return <div className="fade-in" style={{padding:"16px 14px 90px"}}>
    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-around",marginBottom:14}}>
      <div style={{textAlign:"center",flex:1}}><div style={{width:48,height:48,borderRadius:"50%",overflow:"hidden",margin:"0 auto 6px"}} dangerouslySetInnerHTML={{__html:svgAvatar(a.ad,48,a.foto)}}/><div style={{fontSize:12,color:T.text,fontWeight:700}}>{a.ad}</div><div style={{fontSize:9,color:T.textMut}}>{a.poz}</div></div>
      <div style={{padding:"16px 6px 0",fontSize:11,color:T.textMut,fontWeight:700}}>VS</div>
      <div style={{textAlign:"center",flex:1}}><div style={{width:48,height:48,borderRadius:"50%",overflow:"hidden",margin:"0 auto 6px"}} dangerouslySetInnerHTML={{__html:svgAvatar(secB.ad,48,secB.foto)}}/><div style={{fontSize:12,color:T.text,fontWeight:700}}>{secB.ad}</div><div style={{fontSize:9,color:T.textMut}}>{secB.poz}</div></div>
    </div>
    <div style={{background:T.bg1,borderRadius:12,padding:"4px 14px 10px",border:"0.5px solid "+T.line}}>
      {satir("OVR",a.ovr||0,secB.ovr||0)}
      {satir("GOL",a.gol||0,secB.gol||0)}
      {satir("ASİST",a.asist||0,secB.asist||0)}
      {satir("MAÇ",a.mac||0,secB.mac||0)}
      {satir("KATKI/90",k90(a),k90(secB))}
      {(a.poz==="Kaleci"||secB.poz==="Kaleci") && satir("KURTARIŞ",a.kurtaris||0,secB.kurtaris||0)}
    </div>
    {git && <button onClick={()=>setSecB(null)} className="tap" style={{width:"100%",marginTop:12,padding:11,borderRadius:11,background:T.bg1,color:T.textSoft,fontSize:12,fontWeight:600,border:"0.5px solid "+T.line}}>↺ Başka oyuncu seç</button>}
  </div>;
}

function SezonSonu({turnuva, T, git}){
  const sirali=[...turnuva.takimlar].sort((a,b)=>(b.puan||0)-(a.puan||0)||((b.ag-b.yg)-(a.ag-a.yg)));
  const sampiyon=sirali[0];
  const golK=Motor.turnuvaGolKrallari(turnuva,1)[0];
  const asistK=Motor.turnuvaAsist(turnuva,1)[0];
  const kaleciK=Motor.turnuvaKurtaris(turnuva,1)[0];
  const altin=Motor.turnuvaOdulKrali(turnuva,"altin",1)[0];
  // sezonun 11'i: mevkiye göre en iyi ovr'ler (kaleci 1, defans 4, orta 4, forvet 2)
  const tumO=[]; turnuva.takimlar.forEach(tk=>tk.oyuncular.forEach(o=>tumO.push(o)));
  const mevki=(p)=>tumO.filter(o=>o.poz===p).sort((a,b)=>(b.ovr||0)-(a.ovr||0));
  const onbir=[...mevki("Kaleci").slice(0,1),...mevki("Defans").slice(0,4),...mevki("OrtaSaha").slice(0,4),...mevki("Forvet").slice(0,2)];
  const pozRenk=(p)=> p==="Kaleci"?"#FBBF24":p==="Defans"?"#5B8DEF":p==="OrtaSaha"?T.accent:"#F87171";

  return <div className="fade-in" style={{paddingBottom:90}}>
    {/* ŞAMPİYON */}
    <div className="vav-hero" style={{position:"relative",overflow:"hidden",background:`linear-gradient(135deg, ${T.gold}3a 0%, ${T.bg0} 42%, ${T.gold}20 70%, ${T.bg0})`,padding:"30px 16px 24px",textAlign:"center"}}>
      <div className="vav-supurme"/>
      {/* konfeti parıltıları */}
      {[["8%","12%",T.gold,"2.4s"],["88%","18%",T.accent,"3.1s"],["18%","64%","#34D399","2.8s"],["80%","70%",T.gold,"3.4s"],["50%","8%","#F87171","2.2s"],["68%","44%",T.accent2||T.accent,"3.6s"]].map(([l,t,c,d],i)=>
        <div key={i} className="vav-parla" style={{position:"absolute",left:l,top:t,width:6,height:6,borderRadius:i%2?"50%":"1px",background:c,color:c,animationDuration:d,pointerEvents:"none"}}/>
      )}
      <div style={{position:"relative"}}>
        <div style={{fontSize:12,color:T.gold,fontWeight:800,letterSpacing:2,marginBottom:14}} className="vav-parla">🏆 ŞAMPİYON</div>
        <div className="vav-suzul" style={{display:"inline-block",position:"relative",borderRadius:16,boxShadow:"0 0 30px "+T.gold+"66"}}>
          <Logo renk={sampiyon.renk} ad={sampiyon.ad} logo={sampiyon.logo} renk2={sampiyon.renk2} boy={80}/>
        </div>
        <div style={{fontSize:24,color:T.text,fontWeight:800,marginTop:14,fontFamily:T.fontDisplay}}>{sampiyon.ad}</div>
        <div style={{fontSize:12,color:T.textMut,marginTop:4}}>{sampiyon.puan} puan · {sampiyon.o||0} maç · {sampiyon.ag||0} gol</div>
        <div style={{fontSize:11,color:T.gold,marginTop:8}}>{turnuva.ad} · sezon tamamlandı</div>
      </div>
    </div>

    {/* ÖDÜLLER */}
    <div style={{padding:"6px 14px"}}>
      <div style={{fontSize:11,color:T.accent,fontWeight:700,margin:"10px 2px 8px"}}>🏅 SEZON ÖDÜLLERİ</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {[["⚽ Gol Kralı",golK,"gol"],["🎯 Asist Kralı",asistK,"asist"],["🧤 En İyi Kaleci",kaleciK,"kurtaris"],["🥇 Altın Top",altin,"altin"]].map(([et,o,alan],i)=>
          o && <div key={i} onClick={()=>git&&git({sayfa:"oyuncu",oyuncu:{...o,turnuva:turnuva.ad}})} className="tap" style={{background:T.bg1,borderRadius:12,padding:11,border:"0.5px solid "+T.line,display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:34,height:34,borderRadius:"50%",overflow:"hidden",flexShrink:0}} dangerouslySetInnerHTML={{__html:svgAvatar(o.ad,34,o.foto)}}/>
            <div style={{minWidth:0,flex:1}}><div style={{fontSize:9,color:T.textMut}}>{et}</div><div style={{fontSize:12,color:T.text,fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{o.ad}</div></div>
            <span style={{fontSize:16,fontWeight:800,color:T.gold,fontFamily:T.fontDisplay}}>{o[alan]}</span>
          </div>
        )}
      </div>
    </div>

    {/* SEZONUN 11'İ */}
    {onbir.length>=7 && <div style={{padding:"10px 14px 0"}}>
      <div style={{fontSize:11,color:T.accent,fontWeight:700,margin:"6px 2px 10px"}}>⭐ SEZONUN 11'İ</div>
      <div style={{background:"radial-gradient(ellipse at 50% 30%,#2a7a4e 0%,#16432b 60%,#0a2718 100%)",borderRadius:14,padding:"16px 8px",position:"relative"}}>
        {[["Forvet",mevki("Forvet").slice(0,2)],["OrtaSaha",mevki("OrtaSaha").slice(0,4)],["Defans",mevki("Defans").slice(0,4)],["Kaleci",mevki("Kaleci").slice(0,1)]].map(([poz,list],ri)=>
          <div key={poz} style={{display:"flex",justifyContent:"space-around",marginBottom:ri<3?18:0}}>
            {list.map(o=>
              <div key={o.id} onClick={()=>git&&git({sayfa:"oyuncu",oyuncu:{...o,turnuva:turnuva.ad}})} className="tap" style={{textAlign:"center"}}>
                <div style={{width:36,height:36,borderRadius:"50%",overflow:"hidden",border:"2px solid "+pozRenk(poz),margin:"0 auto"}} dangerouslySetInnerHTML={{__html:svgAvatar(o.ad,36,o.foto)}}/>
                <div style={{fontSize:8,color:"#fff",marginTop:3,fontWeight:600,textShadow:"0 1px 2px #000"}}>{o.ad.split(" ")[0]}</div>
                <div style={{fontSize:8,color:T.gold,fontWeight:700}}>{o.ovr}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>}

    {/* TAM PUAN DURUMU */}
    <div style={{padding:"14px 14px 0"}}>
      <div style={{fontSize:11,color:T.accent,fontWeight:700,margin:"0 2px 8px"}}>📊 FİNAL PUAN DURUMU</div>
      {sirali.map((tk,i)=>
        <div key={tk.id} style={{display:"flex",alignItems:"center",gap:8,background:i===0?T.gold+"12":T.bg1,borderRadius:9,padding:"8px 11px",marginBottom:3,borderLeft:i===0?"2px solid "+T.gold:"2px solid transparent"}}>
          <span style={{width:16,fontSize:11,fontWeight:700,color:i===0?T.gold:T.textMut,textAlign:"center"}}>{i+1}</span>
          <Logo renk={tk.renk} ad={tk.ad} logo={tk.logo} renk2={tk.renk2} boy={20}/>
          <span style={{flex:1,fontSize:12,color:T.text,fontWeight:i===0?700:400}}>{tk.ad}</span>
          <span style={{fontSize:13,fontWeight:800,color:i===0?T.gold:T.text,fontFamily:T.fontDisplay}}>{tk.puan||0}</span>
        </div>
      )}
    </div>
  </div>;
}

function MaclarSayfa({turnuva, T, git}){
  const haftalar = useMemo(()=>[...new Set(turnuva.maclar.map(m=>m.hafta))].sort((a,b)=>b-a),[turnuva.id]);
  const [hafta,setHafta]=useState("hepsi");
  const [fGrup,setFGrup]=useState(-1); // -1 tümü
  const gruplu = turnuva.format==="gruplu";
  const grupSayisi = gruplu ? Math.max(1,...turnuva.takimlar.map(t=>(t.grup||0)+1)) : 0;
  const grupAd=(gi)=> String.fromCharCode(65+gi)+" Grubu";
  const maclar = useMemo(()=>{
    let list = hafta==="hepsi" ? [...turnuva.maclar].reverse() : turnuva.maclar.filter(m=>m.hafta===hafta);
    if(gruplu && fGrup>=0) list = list.filter(m=>(m.grup||0)===fGrup);
    return list;
  },[hafta,turnuva.id,fGrup]);

  // maç kartı (tek)
  const MacKart=(m)=>{
    const aGalip=m.skorA>m.skorB, bGalip=m.skorB>m.skorA, berabere=m.skorA===m.skorB;
    const yesil="#34D399";
    // A4 — yayın linki varsa "İzle" çipi (yoksa gösterme). Canlı yayın açıksa kırmızı "CANLI".
    const md=m.medya||{}; const videoLink=md.canli||md.tamMac||md.roportaj; const canliAcik=!!(md.canliAcik&&md.canli);
    return <div key={m.id} onClick={()=>git({sayfa:"mac",mac:m,turnuva})} className="tap prem-tap" style={{background:T.bg1,borderRadius:14,padding:"13px",marginBottom:8,border:"0.5px solid "+T.line,position:"relative",overflow:"hidden",boxShadow:"0 5px 18px rgba(0,0,0,.28)"}}>
      {(m.tarih||m.saat||m.stad) && <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:7,fontSize:9,color:T.textMut,marginBottom:9,flexWrap:"wrap"}}>
        {(m.tarih||m.saat) && <span style={{color:T.accent}}>📅 {m.tarih?(m.tarih.includes("-")?m.tarih.split("-").reverse().join("."):m.tarih):""}{m.saat?" "+m.saat:""}</span>}
        {m.stad && <><span style={{color:T.line}}>·</span><span>📍 {m.stad}</span></>}
      </div>}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,flex:1,minWidth:0}}>
          <Logo renk={m.renkA} ad={m.takimA} boy={26}/>
          <span style={{fontSize:12.5,color:aGalip?T.text:T.textSoft,fontWeight:aGalip?700:400,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{m.takimA}</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:7,padding:"0 10px"}}>
          {m.oynandi ? <>
            <span style={{fontSize:22,fontWeight:800,color:aGalip?yesil:berabere?T.gold:T.textMut,fontFamily:T.fontDisplay,minWidth:16,textAlign:"center"}}>{m.skorA}</span>
            <span style={{fontSize:12,color:T.textMut}}>-</span>
            <span style={{fontSize:22,fontWeight:800,color:bGalip?yesil:berabere?T.gold:T.textMut,fontFamily:T.fontDisplay,minWidth:16,textAlign:"center"}}>{m.skorB}</span>
          </> : <span style={{fontSize:13,fontWeight:800,color:T.textMut,fontFamily:T.fontDisplay,background:T.bg2,borderRadius:7,padding:"4px 10px"}}>VS</span>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,flex:1,minWidth:0,justifyContent:"flex-end"}}>
          <span style={{fontSize:12.5,color:bGalip?T.text:T.textSoft,fontWeight:bGalip?700:400,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{m.takimB}</span>
          <Logo renk={m.renkB} ad={m.takimB} boy={26}/>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontSize:10,color:T.textMut,marginTop:8,flexWrap:"wrap"}}>
        <span>{m.hafta}. hafta</span>
        {m.oynandi && m.mvp && <><span style={{color:T.line}}>·</span><span style={{color:T.gold}}>⭐ {m.mvp}</span></>}
        {!m.oynandi && <><span style={{color:T.line}}>·</span><span style={{color:T.textSoft}}>oynanmadı</span></>}
        {videoLink && <span onClick={(e)=>{ e.stopPropagation(); git({sayfa:"mac",mac:m,turnuva}); }} className="tap" style={{color:canliAcik?"#F4525A":(T.accent2||T.accent),background:(canliAcik?"#F4525A":(T.accent2||T.accent))+"1c",border:"0.5px solid "+(canliAcik?"#F4525A":(T.accent2||T.accent))+"55",borderRadius:20,padding:"3px 10px",fontWeight:800,fontSize:10.5}}>{canliAcik?"🔴 CANLI":"▶ İzle"}</span>}
      </div>
    </div>;
  };

  // toplam istatistik şeridi
  const topGol = turnuva.maclar.reduce((s,m)=>s+m.skorA+m.skorB,0);
  const ortGol = (topGol/Math.max(1,turnuva.maclar.length)).toFixed(1);

  return <div className="fade-in" style={{padding:"12px 14px"}}>
    {/* özet şerit */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
      <MiniIstat T={T} buyuk={turnuva.maclar.length} etiket="maç" renk={T.accent}/>
      <MiniIstat T={T} buyuk={topGol} etiket="gol" renk={T.gold}/>
      <MiniIstat T={T} buyuk={ortGol} etiket="maç başı gol" renk={T.accent2}/>
    </div>

    {/* grup filtresi (gruplu ligde) */}
    {gruplu && grupSayisi>1 && <div style={{display:"flex",gap:5,marginBottom:10,flexWrap:"wrap"}}>
      <span onClick={()=>setFGrup(-1)} className="tap" style={{fontSize:10.5,padding:"5px 11px",borderRadius:13,background:fGrup===-1?T.accent:T.bg2,color:fGrup===-1?"#fff":T.textMut,fontWeight:fGrup===-1?700:500}}>Tümü</span>
      {Array.from({length:grupSayisi}).map((_,gi)=>
        <span key={gi} onClick={()=>setFGrup(gi)} className="tap" style={{fontSize:10.5,padding:"5px 11px",borderRadius:13,background:fGrup===gi?T.accent:T.bg2,color:fGrup===gi?"#fff":T.textMut,fontWeight:fGrup===gi?700:500}}>{grupAd(gi)}</span>
      )}
    </div>}

    {/* hafta filtresi */}
    <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:8,marginBottom:10}}>
      <FiltreCip aktif={hafta==="hepsi"} onClick={()=>setHafta("hepsi")} T={T}>Tümü</FiltreCip>
      {haftalar.map(h=><FiltreCip key={h} aktif={hafta===h} onClick={()=>setHafta(h)} T={T}>{h}. hafta</FiltreCip>)}
    </div>

    {/* maçlar — gruplu + Tümü ise grup başlıklı, değilse düz */}
    {gruplu && fGrup<0 ? Array.from({length:grupSayisi}).map((_,gi)=>{
      const gMaclar=maclar.filter(m=>(m.grup||0)===gi);
      if(gMaclar.length===0) return null;
      return <div key={gi}>
        <div style={{fontSize:11,fontWeight:800,color:T.accent,margin:"6px 2px 8px",display:"flex",alignItems:"center",gap:6}}>
          <span style={{background:T.accent,color:"#fff",borderRadius:6,width:18,height:18,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:10}}>{String.fromCharCode(65+gi)}</span>
          {grupAd(gi)}
        </div>
        {gMaclar.map(MacKart)}
      </div>;
    }) : maclar.map(MacKart)}
    {maclar.length===0 && <div style={{textAlign:"center",color:T.textMut,fontSize:12,padding:30}}>Bu haftada maç yok</div>}
  </div>;
}

function MiniIstat({buyuk, etiket, renk, T}){
  return <div style={{background:T.bg1,borderRadius:11,padding:"10px",textAlign:"center",border:"0.5px solid "+T.line}}>
    <div style={{fontSize:20,fontWeight:800,color:renk,fontFamily:T.fontDisplay,lineHeight:1}}>{buyuk}</div>
    <div style={{fontSize:9,color:T.textMut,marginTop:3}}>{etiket}</div>
  </div>;
}

function FiltreCip({aktif, onClick, T, children}){
  return <div onClick={onClick} className="tap" style={{whiteSpace:"nowrap",fontSize:11,fontWeight:600,padding:"6px 12px",borderRadius:18,cursor:"pointer",
    background:aktif?T.accent:T.bg1,color:aktif?(T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0):T.textSoft,border:"0.5px solid "+(aktif?T.accent:T.line)}}>{children}</div>;
}

/* TAKIM SAYFASI */
function TakimSayfa({takim, turnuva, T, git, takipTakim, takimTakip, oturum, adminMi}){
  const [sekme,setSekme]=useState("akis");
  // Kaptan kendi takımının logosunu değiştirebilir (RLS: takim_yoneticim)
  const takimBenim = !!(oturum && ((takim.yonetici_id && takim.yonetici_id===oturum.id) || adminMi));
  const [logoYuk,setLogoYuk]=useState(false); const [,setLogoTik]=useState(0);
  // Teknik Direktör (takıma bağlı rol — yönetici/admin atar)
  const [td,setTd]=useState(takim.td||null);
  const [tdModal,setTdModal]=useState(false);
  const [tdAd,setTdAd]=useState("");
  const tdKaydet=async(obj)=>{ takim.td=obj; setTd(obj); setTdModal(false); if(sb && typeof takim.id==="string"){ try{ await sb.from('takimlar').update({td:obj}).eq('id',takim.id); }catch(e){} } };
  const logoDegistir=async(e)=>{
    const f=e.target.files&&e.target.files[0]; if(!f)return;
    setLogoYuk(true);
    const r=await fotoYukle(f,"logo",takim.logo);
    if(r&&r.url){ takim.logo=r.url;
      if(sb && typeof takim.id==="string"){ try{ await sb.from('takimlar').update({logo:r.url}).eq('id',takim.id); }catch(err){} }
      setLogoTik(x=>x+1);
    } else alert((r&&r.hata)||"Logo yüklenemedi (giriş gerekli).");
    setLogoYuk(false); e.target.value="";
  };
  const takimTakipte = takipTakim && takipTakim.includes(takim.id);
  const [fikGor,setFikGor]=useState("sonuc"); // fikstür/sonuç geçişi
  const sirali=[...takim.oyuncular].sort((a,b)=>b.ovr-a.ovr);
  const enGolcu=[...takim.oyuncular].sort((a,b)=>b.gol-a.gol)[0]||{};
  const enAsist=[...takim.oyuncular].sort((a,b)=>b.asist-a.asist)[0]||{};
  const enMvp=[...takim.oyuncular].sort((a,b)=>b.mvp-a.mvp)[0]||{};
  const enKurtaris=[...takim.oyuncular].sort((a,b)=>b.kurtaris-a.kurtaris)[0]||{};
  const enMac=[...takim.oyuncular].sort((a,b)=>b.mac-a.mac)[0]||{};
  const golKrali=[...takim.oyuncular].filter(o=>o.gol>0).sort((a,b)=>b.gol-a.gol);
  const ortGuc=Math.round(takim.oyuncular.reduce((s,o)=>s+o.ovr,0)/takim.oyuncular.length);
  const ortStat=(k)=>Math.round(takim.oyuncular.reduce((s,o)=>s+o[k],0)/takim.oyuncular.length);
  const kadroDeger=takim.oyuncular.reduce((s,o)=>s+o.deger,0).toFixed(1);
  const guvNotu = ortGuc>=85?"A+":ortGuc>=78?"A":ortGuc>=70?"B+":ortGuc>=62?"B":"C";

  const pozSay={Kaleci:0,Defans:0,OrtaSaha:0,Forvet:0};
  takim.oyuncular.forEach(o=>pozSay[o.poz]++);

  const tRozetler=[
    {ikon:"🥈",ad:"Vice-Şampiyon",aclk:"Sıralama",k:takim.sira<=2},
    {ikon:"⚽",ad:"Hücum Takımı",aclk:"Çok gol",k:takim.ag>=15},
    {ikon:"🛡️",ad:"Demir Defans",aclk:"Az gol yedi",k:takim.yg<=10},
    {ikon:"🔥",ad:"Güçlü Hücum",aclk:"Gol makinesi",k:takim.ag>=20},
    {ikon:"🏆",ad:"Lider",aclk:"1. sıra",k:takim.sira===1},
    {ikon:"⚡",ad:"Yenilmez",aclk:"Az mağlubiyet",k:takim.m<=2},
  ];
  const hedefler=[
    {ikon:"⚽",ad:"Hücum Hattı",cur:takim.ag,hedef:40,birim:"gol"},
    {ikon:"⚡",ad:"Form",cur:takim.g,hedef:takim.o||5,birim:"galibiyet"},
    {ikon:"🎯",ad:"Deneyimli",cur:takim.o,hedef:10,birim:"maç"},
    {ikon:"🏆",ad:"Galibiyet Avcısı",cur:takim.g,hedef:10,birim:"galibiyet"},
  ];
  const kimya=Math.min(100, 40+takim.o*8);
  const kimyaMetin = kimya>=90?"Oturmuş Takım":kimya>=70?"Uyumlu Kadro":kimya>=50?"Gelişen Uyum":"Yeni Kadro";

  // takımın maçları (fikstür/sonuç)
  const takimMaclari = useMemo(()=>{
    if(!turnuva||!turnuva.maclar) return [];
    return turnuva.maclar.filter(m=>m.takimAId===takim.id||m.takimBId===takim.id);
  },[takim.id, turnuva]);
  const oynananlar = takimMaclari.filter(m=>m.oynandi);
  const gelecekler = takimMaclari.filter(m=>!m.oynandi);

  // AKIŞ olayları (otomatik)
  const akisOlaylar=useMemo(()=>{
    const ev=[];
    const son3 = oynananlar.slice(-3).reverse();
    son3.forEach(m=>{
      const benimA=m.takimAId===takim.id;
      const bizS=benimA?m.skorA:m.skorB, rkS=benimA?m.skorB:m.skorA;
      const rakip=benimA?m.takimB:m.takimA;
      const sonuc=bizS>rkS?"galibiyet":bizS<rkS?"mağlubiyet":"beraberlik";
      const renk=bizS>rkS?T.accent:bizS<rkS?T.danger:T.gold;
      ev.push({renk,et:"MAÇ",ad:`${takim.ad} ${bizS}-${rkS} ${rakip}`,alt:sonuc+" · gazeteyi gör →",mac:m});
    });
    if(takim.sira===1) ev.push({renk:"#5B8DEF",et:"ZİRVE",ad:"Liderliğe yükseldi",alt:"puan durumunda 1. sıra"});
    if(takim.g>=3) ev.push({renk:T.gold,et:"SERİ",ad:`${takim.g} galibiyet topladı`,alt:"formda gidiyor"});
    if(enGolcu.gol>0) ev.push({renk:T.accent,et:"OYUNCU",ad:`${enGolcu.ad} gol kralı`,alt:`takımın en golcüsü: ${enGolcu.gol} gol`});
    if(ev.length===0) ev.push({renk:T.textMut,et:"BİLGİ",ad:"Henüz maç oynanmadı",alt:"maçlar oynandıkça burada görünecek"});
    return ev;
  },[takim.id]);

  const SEKMELER=[["akis","Akış"],["genel","Genel"],["kadro","Kadro"],["fikstur","Fikstür"],["ist","İstatistik"]];

  return <div className="fade-in" style={{paddingBottom:90,position:"relative"}}>
    {/* TAKIM RENGİ ATMOSFERİ */}
    <div style={{position:"absolute",top:0,left:0,right:0,height:280,background:"linear-gradient(180deg,"+takim.renk+"1c,transparent)",pointerEvents:"none",zIndex:0}}/>
    <div style={{position:"relative",zIndex:1}}>
    {/* ===== VAV HERO ===== */}
    <div className="vav-hero" style={{position:"relative",padding:"20px 16px 18px",background:"linear-gradient(120deg,"+takim.renk+"59 0%,"+T.bg1+" 32%,"+takim.renk+"30 58%,"+T.bg1+" 100%)",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0,background:"repeating-linear-gradient(115deg,transparent,transparent 22px,"+takim.renk+"0C 22px,"+takim.renk+"0C 24px)",pointerEvents:"none"}}/>
      <div className="vav-supurme"/>
      {/* süzülen amblem + büyük başlık */}
      <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
        <div className="vav-suzul" style={{border:"3px solid "+takim.renk+"88",borderRadius:16,overflow:"hidden",boxShadow:"0 0 24px "+takim.renk+"66",flexShrink:0,background:T.bg2,position:"relative"}}><Logo renk={takim.renk} ad={takim.ad} logo={takim.logo} renk2={takim.renk2} boy={70}/>
          {takimBenim && <label className="tap" title="Logoyu değiştir" style={{position:"absolute",bottom:0,right:0,background:T.accent,color:T.bg0,width:24,height:24,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,cursor:"pointer",border:"2px solid "+T.bg0}}>{logoYuk?"⏳":"📷"}
            <input type="file" accept="image/*" onChange={logoDegistir} style={{display:"none"}}/></label>}</div>
        <div style={{minWidth:0}}>
          <div style={{fontSize:24,fontWeight:800,color:T.text,fontFamily:T.fontDisplay,lineHeight:1.15,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>{takim.ad} <span style={{fontSize:11,background:T.accent+"22",color:T.accent,fontWeight:700,borderRadius:6,padding:"2px 8px"}}>{guvNotu}</span></div>
          <div style={{fontSize:11,color:T.textSoft,marginTop:4}}>{takim.oyuncular.length} oyuncu · {takim.o} maç · ort. güç <b style={{color:takim.renk,fontFamily:T.fontDisplay}}>{ortGuc}</b></div>
          {(td||takimBenim) && <div style={{display:"flex",alignItems:"center",gap:6,marginTop:7,flexWrap:"wrap"}}>
            <span style={{fontSize:10.5,fontWeight:700,color:T.gold,background:T.gold+"1c",borderRadius:6,padding:"3px 9px"}}>🎯 TD: {td?td.ad:"atanmadı"}</span>
            {takimBenim && <button onClick={()=>{setTdAd(td?td.ad:"");setTdModal(true);}} className="tap" style={{fontSize:10,fontWeight:700,color:T.accent,background:"none",border:"0.5px solid "+T.line,borderRadius:6,padding:"3px 9px"}}>{td?"Değiştir":"Ata"}</button>}
          </div>}
        </div>
      </div>
      {tdModal && <div onClick={()=>setTdModal(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.62)",zIndex:1600,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
        <div onClick={e=>e.stopPropagation()} className="fade-in" style={{width:"100%",maxWidth:460,maxHeight:"78vh",overflowY:"auto",background:T.bg1,borderRadius:"18px 18px 0 0",padding:"16px 16px calc(20px + env(safe-area-inset-bottom))",border:"0.5px solid "+T.line}}>
          <div style={{fontSize:15,fontWeight:800,color:T.text,marginBottom:4}}>🎯 Teknik Direktör Ata</div>
          <div style={{fontSize:11.5,color:T.textMut,marginBottom:12,lineHeight:1.5}}>Ligdeki bir kişiyi seç ya da ismini yaz. (Üyelikte sorulmaz — takıma buradan atanır.)</div>
          <div style={{display:"flex",gap:7,marginBottom:12}}>
            <input value={tdAd} onChange={e=>setTdAd(e.target.value)} placeholder="Teknik direktör adı" style={{flex:1,background:T.bg0,border:"0.5px solid "+T.line,borderRadius:10,padding:"11px 12px",color:T.text,fontSize:13.5,outline:"none",fontFamily:"inherit"}}/>
            <button onClick={()=>tdAd.trim()&&tdKaydet({ad:tdAd.trim()})} className="tap" style={{background:T.accent,color:T.renkCifti&&T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0,border:0,borderRadius:10,padding:"0 16px",fontSize:13,fontWeight:800}}>Kaydet</button>
          </div>
          {td && <button onClick={()=>tdKaydet(null)} className="tap" style={{width:"100%",background:"none",color:T.danger,border:"0.5px solid "+T.danger+"44",borderRadius:10,padding:"9px",fontSize:12.5,fontWeight:700,marginBottom:12}}>TD'yi kaldır</button>}
          <div style={{fontSize:10,color:T.textMut,fontWeight:700,margin:"2px 2px 8px"}}>LİGDEKİ KİŞİLER</div>
          {(turnuva&&turnuva.takimlar||[]).flatMap(tk=>(tk.oyuncular||[]).map(o=>({o,tk}))).slice(0,60).map(({o,tk})=><div key={tk.id+"|"+o.id} onClick={()=>tdKaydet({ad:o.ad,foto:o.foto||null})} className="tap" style={{display:"flex",alignItems:"center",gap:10,padding:"8px 6px",borderRadius:9,borderBottom:"0.5px solid "+T.line}}>
            <div style={{width:30,height:30,borderRadius:"50%",overflow:"hidden",flexShrink:0,background:T.bg2}} dangerouslySetInnerHTML={{__html:svgAvatar(o.ad,30,o.foto)}}/>
            <div style={{flex:1,minWidth:0}}><div style={{fontSize:12.5,fontWeight:600,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{o.ad}</div><div style={{fontSize:10,color:T.textMut}}>{tk.ad}</div></div>
            <span style={{fontSize:11,color:T.accent,fontWeight:700}}>Seç</span>
          </div>)}
        </div>
      </div>}
      {/* parlayan büyük sayılar + ışıklı çubuklar */}
      <div style={{display:"flex",gap:12,marginTop:16,position:"relative"}}>
        {[["GALİBİYET",takim.g,"#34D399"],["PUAN",takim.puan,T.gold],["SIRA",takim.sira+".",takim.sira===1?T.gold:T.accent]].map(([k,v,c])=>
          <div key={k} style={{flex:1,textAlign:"center"}}>
            <div className="vav-parla" style={{fontSize:27,fontWeight:800,color:c,fontFamily:T.fontDisplay,lineHeight:1}}>{v}</div>
            <div style={{fontSize:8.5,color:T.textSoft,letterSpacing:1,marginTop:4,fontWeight:700}}>{k}</div>
            <div className="vav-bar" style={{height:3,borderRadius:2,background:c+"4D",marginTop:6}}/>
          </div>
        )}
      </div>
    </div>
    {/* AKSIYON */}
    <div style={{display:"flex",justifyContent:"flex-end",gap:8,padding:"10px 14px 0"}}>
      {oturum && turnuva && turnuva.iliskisel && (takimBenim || (takim.oyuncular||[]).some(o=>o.sahip_user_id&&o.sahip_user_id===oturum.id)) &&
        <button onClick={()=>git({sayfa:"sohbet",turnuva,takim})} className="tap" style={{background:"transparent",color:T.accent2,border:"1px solid "+T.accent2,borderRadius:20,padding:"0 16px",height:34,fontSize:12,fontWeight:700}}>💬 Sohbet</button>}
      <button onClick={()=>takimTakip&&takimTakip(takim.id)} className="tap" style={{background:takimTakipte?T.accent:"transparent",color:takimTakipte?(T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0):T.accent,border:"1px solid "+T.accent,borderRadius:20,padding:"0 16px",height:34,fontSize:12,fontWeight:700}}>{takimTakipte?"✓ Takipte":"+ Takip et"}</button>
    </div>
    {/* SEKME ŞERİDİ */}
    <div style={{display:"flex",padding:"8px 8px 0",borderBottom:"1px solid "+T.line,overflowX:"auto"}}>
      {SEKMELER.map(([k,ad])=>
        <button key={k} onClick={()=>setSekme(k)} className="tap" style={{background:"none",border:0,padding:"9px 12px",color:sekme===k?T.accent:T.textMut,borderBottom:"2px solid "+(sekme===k?T.accent:"transparent"),fontWeight:sekme===k?700:600,fontSize:12,whiteSpace:"nowrap"}}>{ad}</button>
      )}
    </div>

    {/* ===== AKIŞ ===== */}
    {sekme==="akis" && <div className="fade-in" style={{padding:"12px 14px",display:"flex",flexDirection:"column",gap:9}}>
      {akisOlaylar.map((e,i)=>
        <div key={i} onClick={()=>e.mac&&git({sayfa:"gazete",mac:e.mac,turnuva})} className={e.mac?"tap":""} style={{background:T.bg1,borderRadius:12,padding:"11px 12px",border:"0.5px solid "+T.line,borderLeft:"3px solid "+e.renk,cursor:e.mac?"pointer":"default"}}>
          <div style={{fontSize:9,color:e.renk,fontWeight:700,letterSpacing:.5}}>{e.et}</div>
          <div style={{fontSize:13,color:T.text,fontWeight:600,marginTop:3}}>{e.ad}</div>
          {e.alt && <div style={{fontSize:11,color:T.textMut,marginTop:2}}>{e.alt}</div>}
        </div>
      )}
    </div>}

    {/* ===== GENEL ===== */}
    {sekme==="genel" && <div className="fade-in">
      <div style={{padding:"12px 14px 6px"}}>
        <div style={{fontSize:11,color:T.accent,fontWeight:700,margin:"0 2px 10px"}}>📊 SEZON ÖZETİ</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}>
          {[["🗓️","MAÇ",takim.o,T.text],["✓","GALİBİYET",takim.g,T.accent],["○","BERABERE",takim.b,T.gold],["✕","MAĞLUP",takim.m,T.danger],["⚽","ATILAN",takim.ag,T.accent],["🥅","YENİLEN",takim.yg,T.danger],["📈","AVERAJ",(takim.ag-takim.yg>=0?"+":"")+(takim.ag-takim.yg),T.accent2],["🏆","PUAN",takim.puan,T.gold]].map(([ik,k,v,c])=>
            <div key={k} className="pop" style={{background:T.bg1,borderRadius:11,padding:"12px 4px",textAlign:"center",border:"0.5px solid "+T.line}}>
              <div style={{fontSize:13,marginBottom:2}}>{ik}</div>
              <div style={{fontSize:18,fontWeight:800,color:c,fontFamily:T.fontDisplay}}>{v}</div>
              <div style={{fontSize:8,color:T.textMut,marginTop:1}}>{k}</div>
            </div>
          )}
        </div>
      </div>
      <div style={{padding:"6px 14px"}}>
        <div style={{background:T.bg1,borderRadius:14,padding:14,border:"0.5px solid "+T.line}}>
          <div style={{fontSize:11,color:T.accent,fontWeight:700,marginBottom:12}}>💪 TAKIM GÜCÜ</div>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <div style={{flexShrink:0}}><Halka oran={ortGuc/100} etiket="Genel Güç" alt={""} T={T} renk={T.gold} boy={92}/></div>
            <div style={{flex:1}}>
              {[["Hücum",ortStat("sho")],["Orta Saha",ortStat("pas")],["Savunma",ortStat("def")],["Hız",ortStat("pac")],["Fizik",ortStat("phy")]].map(([k,v])=>
                <div key={k} style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
                  <span style={{fontSize:10,color:T.textSoft,width:56}}>{k}</span>
                  <div style={{flex:1,height:7,background:T.bg2,borderRadius:4,overflow:"hidden"}}><div className="bar-grow" style={{width:v+"%",height:"100%",background:v>=70?T.accent:T.gold,borderRadius:4}}/></div>
                  <span style={{fontSize:11,fontWeight:700,color:T.text,width:22,textAlign:"right"}}>{v}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div style={{padding:"6px 14px"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <div style={{background:T.bg1,borderRadius:14,padding:14,border:"0.5px solid "+T.line}}>
            <div style={{fontSize:10,color:T.textMut,fontWeight:600,marginBottom:8}}>📋 SON 5 FORM</div>
            <FormRozet form={takim.form} T={T}/>
          </div>
          <div style={{background:T.bg1,borderRadius:14,padding:14,border:"0.5px solid "+T.line}}>
            <div style={{fontSize:10,color:T.danger,fontWeight:600,marginBottom:8}}>⚠️ DİSİPLİN</div>
            <div style={{fontSize:12,color:T.text}}>🟨 {takim.oyuncular.reduce((s,o)=>s+o.sari,0)} · 🟥 {takim.oyuncular.reduce((s,o)=>s+o.kirmizi,0)}</div>
          </div>
        </div>
      </div>
      <div style={{padding:"6px 14px"}}>
        <div style={{background:T.bg1,borderRadius:14,padding:14,border:"0.5px solid "+T.line}}>
          <div style={{fontSize:11,color:T.accent,fontWeight:700,marginBottom:12}}>🏅 TAKIM ROZETLERİ</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
            {tRozetler.filter(r=>r.k).map((r,i)=>
              <div key={i} className="pop" style={{background:T.danger+"12",borderRadius:10,padding:"10px 8px",textAlign:"center",border:"0.5px solid "+T.danger+"33"}}>
                <div style={{fontSize:18}}>{r.ikon}</div>
                <div style={{fontSize:10,color:T.text,fontWeight:600,marginTop:3}}>{r.ad}</div>
                <div style={{fontSize:8,color:T.textMut}}>{r.aclk}</div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div style={{padding:"6px 14px"}}>
        <div style={{background:T.bg1,borderRadius:14,padding:14,border:"0.5px solid "+T.line}}>
          <div style={{fontSize:11,color:T.accent,fontWeight:700,marginBottom:12}}>🎯 SIRADAKİ HEDEFLER</div>
          {hedefler.map((h,i)=>{
            const oran=Math.min(1,h.cur/h.hedef); const kalan=Math.max(0,h.hedef-h.cur);
            return <div key={i} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:12,color:T.text}}>{h.ikon} {h.ad}</span>
                <span style={{fontSize:11,color:T.gold,fontWeight:600}}>{kalan} {h.birim} daha</span>
              </div>
              <div style={{height:7,background:T.bg2,borderRadius:5,overflow:"hidden"}}><div className="bar-grow" style={{width:(oran*100)+"%",height:"100%",background:T.gold,borderRadius:5}}/></div>
              <div style={{fontSize:9,color:T.textMut,marginTop:2}}>{h.cur}/{h.hedef} · %{Math.round(oran*100)}</div>
            </div>;
          })}
        </div>
      </div>
      <div style={{padding:"6px 14px"}}>
        <div style={{background:T.bg1,borderRadius:14,padding:14,border:"0.5px solid "+T.line}}>
          <div style={{fontSize:11,color:T.accent,fontWeight:700,marginBottom:12}}>🤝 TAKIM KİMYASI</div>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <Halka oran={kimya/100} etiket="" alt="" T={T} renk={T.accent} boy={84}/>
            <div style={{flex:1}}>
              <div style={{fontSize:14,color:T.text,fontWeight:600}}>{kimyaMetin}</div>
              <div style={{fontSize:11,color:T.textMut,marginTop:3,lineHeight:1.5}}>{kimya>=90?"Kadro büyük ölçüde sabit kalıyor. Oyuncular birbirine alışkın, uyum yüksek.":"Kadro birlikte oynadıkça uyum artıyor."}</div>
            </div>
          </div>
        </div>
      </div>
    </div>}

    {/* ===== KADRO ===== */}
    {sekme==="kadro" && <div className="fade-in">
      <div style={{padding:"12px 14px 6px"}}>
        <div style={{background:T.bg1,borderRadius:14,padding:14,border:"0.5px solid "+T.line}}>
          <SahaDizilis takim={takim} T={T} git={git} turnuva={turnuva}/>
        </div>
      </div>
      <div style={{padding:"6px 14px"}}>
        <div style={{background:T.bg1,borderRadius:14,padding:14,border:"0.5px solid "+T.line}}>
          <div style={{fontSize:10,color:T.textMut,fontWeight:600,marginBottom:10}}>📊 POZİSYON DAĞILIMI</div>
          {[["Kaleci",pozSay.Kaleci],["Defans",pozSay.Defans],["Orta Saha",pozSay.OrtaSaha],["Forvet",pozSay.Forvet]].map(([k,v])=>
            <div key={k} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <span style={{fontSize:10,color:T.textSoft,width:56}}>{k}</span>
              <div style={{flex:1,height:6,background:T.bg2,borderRadius:3,overflow:"hidden"}}><div className="bar-grow" style={{width:(v/takim.oyuncular.length*100)+"%",height:"100%",background:T.accent2,borderRadius:3}}/></div>
              <span style={{fontSize:11,color:T.text,fontWeight:600,width:16,textAlign:"right"}}>{v}</span>
            </div>
          )}
        </div>
      </div>
      <div style={{padding:"6px 14px"}}>
        <div style={{fontSize:11,color:T.accent,fontWeight:700,margin:"4px 2px 10px"}}>👥 KADRO ({takim.oyuncular.length})</div>
        {sirali.map(o=>
          <div key={o.id} onClick={()=>git({sayfa:"oyuncu",oyuncu:{...o,takimAd:takim.ad,turnuva:turnuva.ad}})} className="tap" style={{display:"flex",alignItems:"center",gap:11,background:T.bg1,borderRadius:10,padding:"8px 12px",marginBottom:5}}>
            <span style={{width:24,fontSize:11,color:T.textMut,textAlign:"center"}}>{o.no}</span>
            <Avatar o={o} boy={32} T={T}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,color:T.text,fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{o.ad}</div>
              <div style={{fontSize:10,color:T.textMut}}>{o.poz} · {o.yas} yaş</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:11,color:T.accent}}>{o.gol}⚽</span>
              <span style={{width:28,height:28,borderRadius:7,background:o.ovr>=85?T.gold:T.bg2,color:o.ovr>=85?"#1A1505":T.textSoft,fontSize:12,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{o.ovr}</span>
            </div>
          </div>
        )}
      </div>
    </div>}

    {/* ===== FİKSTÜR ===== */}
    {sekme==="fikstur" && <div className="fade-in" style={{padding:"12px 14px"}}>
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        <button onClick={()=>setFikGor("sonuc")} className="tap" style={{flex:1,padding:"9px",borderRadius:10,fontSize:12,fontWeight:700,background:fikGor==="sonuc"?T.accent:T.bg1,color:fikGor==="sonuc"?T.bg0:T.textMut,border:"0.5px solid "+T.line}}>Sonuçlar ({oynananlar.length})</button>
        <button onClick={()=>setFikGor("fikstur")} className="tap" style={{flex:1,padding:"9px",borderRadius:10,fontSize:12,fontWeight:700,background:fikGor==="fikstur"?T.accent:T.bg1,color:fikGor==="fikstur"?T.bg0:T.textMut,border:"0.5px solid "+T.line}}>Fikstür ({gelecekler.length})</button>
      </div>
      {(fikGor==="sonuc"?oynananlar:gelecekler).length===0 ?
        <div style={{textAlign:"center",padding:"30px 0",color:T.textMut,fontSize:13}}>{fikGor==="sonuc"?"Henüz oynanmış maç yok":"Gelecek maç yok"}</div> :
        (fikGor==="sonuc"?oynananlar:gelecekler).map(m=>{
          const benimA=m.takimAId===takim.id;
          const bizS=benimA?m.skorA:m.skorB, rkS=benimA?m.skorB:m.skorA;
          const rakip=benimA?m.takimB:m.takimA;
          const galip=m.oynandi && bizS>rkS, berabere=m.oynandi && bizS===rkS;
          return <div key={m.id} onClick={()=>git({sayfa:"mac",mac:m,turnuva})} className="tap" style={{display:"flex",alignItems:"center",gap:10,background:T.bg1,borderRadius:11,padding:"10px 12px",marginBottom:7,border:"0.5px solid "+T.line}}>
            {m.oynandi && <div style={{width:6,height:30,borderRadius:3,background:galip?T.accent:berabere?T.gold:T.danger}}/>}
            <div style={{fontSize:10,color:T.textMut,width:36}}>{m.hafta}. hafta</div>
            <div style={{flex:1,fontSize:13,color:T.text,fontWeight:500}}>{takim.ad} {m.oynandi?<span style={{color:T.accent,fontWeight:700}}>{bizS}-{rkS}</span>:<span style={{color:T.textMut}}>vs</span>} {rakip}</div>
            <span style={{color:T.textMut,fontSize:16}}>›</span>
          </div>;
        })}
    </div>}

    {/* ===== İSTATİSTİK ===== */}
    {sekme==="ist" && <div className="fade-in">
      <div style={{padding:"12px 14px 6px"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <div style={{background:T.bg1,borderRadius:14,padding:14,border:"0.5px solid "+T.line}}>
            <div style={{fontSize:10,color:T.textMut,fontWeight:600,marginBottom:10}}>⚔️ HÜCUM / SAVUNMA</div>
            <div style={{marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,marginBottom:3}}><span style={{color:T.accent}}>Attığı</span><span style={{color:T.text,fontWeight:700}}>{takim.ag}</span></div>
              <div style={{height:8,background:T.bg2,borderRadius:4,overflow:"hidden"}}><div className="bar-grow" style={{width:Math.min(100,takim.ag*3)+"%",height:"100%",background:T.accent,borderRadius:4}}/></div>
            </div>
            <div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,marginBottom:3}}><span style={{color:T.danger}}>Yediği</span><span style={{color:T.text,fontWeight:700}}>{takim.yg}</span></div>
              <div style={{height:8,background:T.bg2,borderRadius:4,overflow:"hidden"}}><div className="bar-grow" style={{width:Math.min(100,takim.yg*3)+"%",height:"100%",background:T.danger,borderRadius:4}}/></div>
            </div>
          </div>
          <div style={{background:T.bg1,borderRadius:14,padding:14,border:"0.5px solid "+T.line,display:"flex",flexDirection:"column",alignItems:"center"}}>
            <div style={{fontSize:10,color:T.textMut,fontWeight:600,marginBottom:6,alignSelf:"flex-start"}}>🍩 G / B / M</div>
            <Donut dilimler={[{deger:takim.g,renk:T.accent},{deger:takim.b,renk:T.gold},{deger:takim.m,renk:T.danger}]} T={T} boy={100}/>
            <div style={{display:"flex",gap:10,marginTop:8,fontSize:10}}>
              <span style={{color:T.accent}}>● {takim.g}G</span><span style={{color:T.gold}}>● {takim.b}B</span><span style={{color:T.danger}}>● {takim.m}M</span>
            </div>
          </div>
        </div>
      </div>
      {golKrali.length>0 && <div style={{padding:"6px 14px"}}>
        <div style={{background:T.bg1,borderRadius:14,padding:"14px 14px 0",border:"0.5px solid "+T.line}}>
          <div style={{fontSize:10,color:T.textMut,fontWeight:600,marginBottom:10}}>🥇 GOL KRALLIĞI</div>
          <Podyum liste={golKrali} T={T}/>
        </div>
      </div>}
      <div style={{padding:"6px 14px"}}>
        <div style={{background:T.gold+"14",borderRadius:14,padding:16,border:"1px solid "+T.gold+"44",textAlign:"center"}}>
          <div style={{fontSize:10,color:T.gold,fontWeight:700,letterSpacing:1}}>🏆 TAKIM MVP</div>
          <div style={{display:"flex",justifyContent:"center",margin:"8px 0"}}>
            <div style={{width:60,height:60,borderRadius:"50%",overflow:"hidden",border:"3px solid "+T.gold}} dangerouslySetInnerHTML={{__html:svgAvatar(enMvp.ad||"",60)}}/>
          </div>
          <div style={{fontSize:15,fontWeight:700,color:T.text}}>{enMvp.ad}</div>
          <div style={{fontSize:11,color:T.textMut}}>{enMvp.poz} · {enMvp.mvp} MVP</div>
        </div>
      </div>
      <div style={{padding:"6px 14px"}}>
        <div style={{fontSize:11,color:T.accent,fontWeight:700,margin:"4px 2px 10px"}}>🏅 TAKIM LİDERLERİ</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {[["👑","Gol Kralı",enGolcu,enGolcu.gol,"gol",T.gold],["🎯","Asist Kralı",enAsist,enAsist.asist,"asist",T.accent2],["⭐","En MVP",enMvp,enMvp.mvp,"mvp",T.gold],["🧤","En Kaleci",enKurtaris,enKurtaris.kurtaris,"kurtarış",T.accent2],["🏃","En Çok Maç",enMac,enMac.mac,"maç",T.text],["💎","En Değerli",sirali[0],"€"+(sirali[0]?.deger||0)+"M","",T.gold]].map(([ik,ad,o,v,birim,c],i)=>
            <div key={i} className="pop" style={{background:c+"12",borderRadius:11,padding:"11px 12px",border:"0.5px solid "+c+"33"}}>
              <div style={{fontSize:9,color:c,fontWeight:700,marginBottom:3}}>{ik} {ad}</div>
              <div style={{fontSize:12,color:T.text,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{o?.ad||"-"}</div>
              <div style={{fontSize:10,color:T.textMut}}>{v} {birim}</div>
            </div>
          )}
        </div>
      </div>
      <div style={{padding:"6px 14px"}}>
        <div style={{background:T.gold+"12",borderRadius:14,padding:14,border:"0.5px solid "+T.gold+"33"}}>
          <div style={{fontSize:10,color:T.gold,fontWeight:600,marginBottom:6}}>💰 KADRO DEĞERİ</div>
          <div style={{fontSize:24,fontWeight:800,color:T.gold,fontFamily:T.fontDisplay}}>€{kadroDeger}M</div>
          <div style={{fontSize:10,color:T.textMut,marginTop:4}}>En değerli: {sirali[0]?.ad}</div>
        </div>
      </div>
    </div>}

    </div>
  </div>;
}

/* OYUNCU SAYFASI — FIFA kart + radar + istatistik + grafik */
function LisansKarti({o, turnuva, T}){
  // rol rengi: kaleci yeşil, diğerleri kırmızı (sporcu)
  const kaleci = o.poz==="Kaleci";
  const rolRenk = kaleci ? "#1d9e75" : "#e2574b";
  const rolAd = kaleci ? "KALECİ" : "SPORCU";
  // sezon: lig tarihinden
  const sezon = (()=>{
    if(!turnuva) return "";
    const b=turnuva.baslangic||turnuva.tarih, s=turnuva.bitis;
    const yil=(t)=>{ if(!t)return null; const m=(""+t).match(/(20\d\d)/); return m?m[1]:null; };
    const y1=yil(b), y2=yil(s);
    if(y1&&y2&&y1!==y2) return y1+" - "+y2;
    if(y1) return y1;
    return "";
  })();
  const ligAd = turnuva ? turnuva.ad : (o.turnuva||"");
  const [kopya,setKopya]=useState(false);
  const kopyala=()=>{ try{ navigator.clipboard.writeText(o.lisNo||""); setKopya(true); setTimeout(()=>setKopya(false),1500); }catch(e){} };

  const pozGoster=(p)=> p==="OrtaSaha"?"Orta Saha":p||"";
  const Sat=({k,v})=> <div style={{display:"flex",padding:"7px 11px",borderBottom:"0.5px solid "+T.line}}>
    <span style={{fontSize:10,color:T.textMut,fontWeight:700,width:82,flexShrink:0}}>{k}</span>
    <span style={{fontSize:11.5,color:T.text,fontWeight:600}}>{v}</span>
  </div>;

  return <div className="fade-in" style={{padding:"14px",position:"relative"}}>
    {/* rol rengi parıltı */}
    <div style={{position:"absolute",top:0,left:"14px",right:"14px",height:120,background:"radial-gradient(circle at 30% 0%,"+rolRenk+"33,transparent 70%)",filter:"blur(20px)",pointerEvents:"none"}}/>
    {/* KART */}
    <div className="prem-shadow-lg" style={{position:"relative",background:"rgba(255,255,255,.045)",backdropFilter:"blur(14px)",WebkitBackdropFilter:"blur(14px)",border:"1px solid "+rolRenk+"cc",borderRadius:16,overflow:"hidden"}}>
      <div style={{background:"linear-gradient(135deg,"+rolRenk+","+rolRenk+"cc)",padding:"9px 13px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"relative",overflow:"hidden"}}>
        <span style={{fontSize:12,fontWeight:800,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",zIndex:1}}>{(ligAd||"LİG").toLocaleUpperCase("tr")} · LİSANS</span>
        <span style={{fontSize:10,fontWeight:800,color:"#fff",background:"rgba(0,0,0,.25)",borderRadius:5,padding:"2px 9px",flexShrink:0,marginLeft:8,zIndex:1}}>{rolAd}</span>
        <div className="saha-holo" style={{position:"absolute",inset:0}}/>
      </div>
      <div style={{display:"flex",padding:13,gap:12}}>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,flexShrink:0}}>
          <div style={{width:74,height:74,borderRadius:11,overflow:"hidden",border:"2px solid "+rolRenk}} dangerouslySetInnerHTML={{__html:svgAvatar(o.ad,74,o.foto)}}/>
          <Logo renk={o.renk||(turnuva&&turnuva.takimlar.find(tk=>tk.oyuncular.some(p=>p.id===o.id))?.renk)||"#888"} ad={o.takimAd||""} boy={54}/>
        </div>
        <div style={{flex:1,minWidth:0,border:"0.5px solid "+T.line,borderRadius:8,overflow:"hidden",alignSelf:"flex-start"}}>
          <Sat k="ADI SOYADI" v={(o.ad||"").toLocaleUpperCase("tr")}/>
          {(o.yas||o.dogum) && <Sat k="YAŞ" v={String((o.yas||yasHesap(o.dogum))||"—")}/>}
          <Sat k="MEVKİ" v={pozGoster(o.poz)+(o.no?" · No "+o.no:"")}/>
          {o.ayak && <Sat k="AYAK" v={o.ayak}/>}
          {(o.boy||o.kilo) && <Sat k="BOY / KİLO" v={(o.boy?o.boy+" cm":"")+(o.boy&&o.kilo?" · ":"")+(o.kilo?o.kilo+" kg":"")}/>}
          {o.takimAd && <Sat k="TAKIM" v={o.takimAd}/>}
          {sezon && <Sat k="SEZON" v={sezon}/>}
        </div>
      </div>
      {/* lisans no */}
      <div onClick={kopyala} className="tap" style={{background:T.bg0,padding:"9px 13px",display:"flex",alignItems:"center",gap:8,borderTop:"0.5px solid "+T.line,cursor:"pointer"}}>
        <span style={{fontSize:9,color:T.textMut,fontWeight:700}}>LİSANS NO</span>
        <span style={{fontSize:12,color:rolRenk,fontWeight:800,fontFamily:T.fontDisplay,letterSpacing:.5,flex:1}}>{o.lisNo||"—"}</span>
        <span style={{fontSize:9,color:kopya?"#34D399":T.textMut}}>{kopya?"✓ kopyalandı":"📋 kopyala"}</span>
      </div>
      <div style={{background:rolRenk+"14",padding:"7px",display:"flex",justifyContent:"center"}}><FzImza variant="dark" boy={0.72}/></div>
    </div>
    <div style={{fontSize:9,color:T.textMut,textAlign:"center",marginTop:12,lineHeight:1.6}}>
      Bu kart oyuncunun kimlik bilgilerini gösterir.<br/>Gerçek fotoğraf ve dijital doğrulama online sürümde eklenecek.
    </div>
  </div>;
}

// ============ OYUNCU KARTI (premium kart · gerçek veri) ============
function kartVerisiYap(o, kariyer){
  const num=(x,f)=>{ const n=parseInt(x); return isNaN(n)?f:n; };
  const ovr=num(o.ovr,60); const st=(v,f)=>Math.max(30,Math.min(99,num(v,f)));
  return {
    ad:(o.ad||o.gorunen_ad||"Oyuncu"), pos:(o.poz||o.pos||"OYN"), ovr,
    id:String(o.forma_no||0).padStart(2,"0"),
    serial:"FL-"+String(o.id||"000000").replace(/-/g,"").slice(0,6).toUpperCase()+"-2027",
    nat:"TR",
    stats:[["HIZ",st(o.pac,ovr-2)],["ŞUT",st(o.sho,ovr-4)],["PAS",st(o.pas,ovr-6)],["DRİ",st(o.dri,ovr-3)],["DEF",st(o.def,ovr-10)],["FİZ",st(o.phy,ovr-4)]],
    kariyer: kariyer
      ? [["MAÇ",kariyer.etkili_mac||0,0],["GOL",kariyer.gol||0,1],["ASİST",kariyer.asist||0,0],["SARI",kariyer.sari||0,0],["KIRMIZI",kariyer.kirmizi||0,0],["SEZON",kariyer.sezon_sayisi||0,1]]
      : [["MAÇ",0,0],["GOL",0,1],["ASİST",0,0],["SARI",0,0],["KIRMIZI",0,0],["SEZON",0,1]]
  };
}
function OyuncuKart({oyuncu:o, kariyer, T, git, adminMi, oturum, embedded, duzenlenebilir}){
  const ref=React.useRef(null);
  const [konsept,setKonsept]=React.useState(1);
  const [rarity,setRarity]=React.useState(null);
  const [fotolar,setFotolar]=React.useState([]);
  const duzenle=duzenlenebilir!=null ? duzenlenebilir : !!(oturum && (adminMi || (o.sahip_user_id && o.sahip_user_id===oturum.id)));
  React.useEffect(()=>{ let a=true; (async()=>{ const v=await Db.kartVeri(o.id); if(!a)return; setFotolar(v.fotolar||[]); if(v.konsept) setKonsept(v.konsept); setRarity(v.rarity||null); })(); return ()=>{a=false;}; },[o.id]);
  const d=React.useMemo(()=>kartVerisiYap(o,kariyer),[o,kariyer]);
  const foto=React.useMemo(()=>{ const f=fotolar[0]; return f?{url:f.url,crop:f.crop,bg:f.arka_plan}:(o.foto?{url:o.foto,crop:null,bg:"orijinal"}:null); },[fotolar,o.foto]);
  const rk=rarity||(window.FLKART?window.FLKART.rarityFromOvr(d.ovr):"gold");
  React.useEffect(()=>{ if(!ref.current||!window.FLKART) return; window.FLKART.mount(ref.current,d,{konsept,rarity:rk,foto:foto?foto.url:null,crop:foto?foto.crop:null,bg:foto?foto.bg:null}); },[d,konsept,rk,foto]);
  const K=(window.FLKART&&window.FLKART.KONSEPTLER)||[];
  const rlbl=(window.FLKART&&window.FLKART.RARITY[rk]&&window.FLKART.RARITY[rk].label)||rk;
  return <div style={{padding:embedded?"0":"6px 0 4px"}}>
    <div ref={ref} className="flkart"></div>
    <div style={{display:"flex",gap:6,justifyContent:"center",flexWrap:"wrap",marginTop:12}}>
      {K.map(kc=><button key={kc.k} onClick={()=>setKonsept(kc.k)} className="tap" style={{fontSize:11,fontWeight:800,padding:"7px 12px",borderRadius:10,border:"1px solid "+(konsept===kc.k?T.accent:T.line),background:konsept===kc.k?T.accent+"22":T.bg1,color:konsept===kc.k?T.accent:T.textMut,cursor:"pointer"}}>{kc.ad}</button>)}
    </div>
    <div style={{textAlign:"center",fontSize:10.5,color:T.textMut,marginTop:8}}>Rarity: <b style={{color:T.gold}}>{rlbl}</b> · {rarity?"elle atandı":"OVR'a göre"} · karta tıkla → çevir</div>
    {duzenle && git && <div style={{textAlign:"center",marginTop:11}}>
      <button onClick={()=>git({sayfa:"kartim",oyuncu:o,sahip:true})} className="tap" style={{fontSize:12.5,fontWeight:800,padding:"10px 18px",borderRadius:11,background:T.accent2,color:"#04070C",border:0,cursor:"pointer"}}>✏️ Kartı Düzenle</button>
    </div>}
  </div>;
}
// ============ KARTIM EDİTÖRÜ (foto/arka plan/konsept/rarity) ============
// ---- Manuel kırpma (sürükle + zoom) — çerçeve = aktif konseptin foto kutusu oranı (birebir WYSIWYG) ----
function KartKirp({url, crop, T, onApply, onKapat, aspect, konseptAd}){
  const oran=(aspect&&aspect>0.15&&aspect<3)?aspect:0.66;
  const fRef=React.useRef(null), iRef=React.useRef(null);
  const cs=React.useRef({s:1,cover:1,tx:0,ty:0,iw:1,ih:1});
  const [zoom,setZoom]=React.useState(120);
  const draw=()=>{ const im=iRef.current; if(im) im.style.transform="translate3d("+cs.current.tx+"px,"+cs.current.ty+"px,0) scale("+cs.current.s+")"; };
  const clamp=()=>{ const f=fRef.current; if(!f)return; const Fw=f.clientWidth,Fh=f.clientHeight,dw=cs.current.iw*cs.current.s,dh=cs.current.ih*cs.current.s; cs.current.tx=Math.min(0,Math.max(Fw-dw,cs.current.tx)); cs.current.ty=Math.min(0,Math.max(Fh-dh,cs.current.ty)); };
  const setZ=(z,cx,cy)=>{ const f=fRef.current; if(!f)return; const Fw=f.clientWidth,Fh=f.clientHeight; cx=cx==null?Fw/2:cx; cy=cy==null?Fh/2:cy; const ix=(cx-cs.current.tx)/cs.current.s, iy=(cy-cs.current.ty)/cs.current.s; cs.current.s=Math.max(cs.current.cover, cs.current.cover*z); cs.current.tx=cx-ix*cs.current.s; cs.current.ty=cy-iy*cs.current.s; clamp(); draw(); };
  React.useEffect(()=>{ const im=new Image(); im.onload=()=>{ const f=fRef.current; if(!f)return; const iw=im.naturalWidth,ih=im.naturalHeight; cs.current.iw=iw; cs.current.ih=ih; const Fw=f.clientWidth,Fh=f.clientHeight; cs.current.cover=Math.max(Fw/iw,Fh/ih); let z=1.2,fx=.5,fy=.42; if(crop){ z=crop.zoom||1.2; fx=crop.fx; fy=crop.fy; } cs.current.s=cs.current.cover*z; cs.current.tx=Fw/2-fx*iw*cs.current.s; cs.current.ty=Fh/2-fy*ih*cs.current.s; clamp(); draw(); setZoom(Math.round(z*100)); }; im.src=url; },[url]);
  const dr=React.useRef({on:false,x:0,y:0});
  const down=e=>{ dr.current={on:true,x:e.clientX,y:e.clientY}; try{ e.currentTarget.setPointerCapture(e.pointerId); }catch(_){} };
  const move=e=>{ if(!dr.current.on)return; cs.current.tx+=e.clientX-dr.current.x; cs.current.ty+=e.clientY-dr.current.y; dr.current.x=e.clientX; dr.current.y=e.clientY; clamp(); draw(); };
  const up=()=>{ dr.current.on=false; };
  const wheel=e=>{ e.preventDefault(); const r=fRef.current.getBoundingClientRect(); const zz=Math.max(1,Math.min(4,(zoom/100)*(e.deltaY<0?1.08:.926))); setZoom(Math.round(zz*100)); setZ(zz,e.clientX-r.left,e.clientY-r.top); };
  const pinch=React.useRef(0);
  const tmove=e=>{ if(e.touches.length!==2)return; e.preventDefault(); const dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY,dist=Math.hypot(dx,dy); if(pinch.current){ const z=Math.max(1,Math.min(4,(zoom/100)*(dist/pinch.current))); setZoom(Math.round(z*100)); const r=fRef.current.getBoundingClientRect(); setZ(z,(e.touches[0].clientX+e.touches[1].clientX)/2-r.left,(e.touches[0].clientY+e.touches[1].clientY)/2-r.top); } pinch.current=dist; };
  const uygula=()=>{ const f=fRef.current; const Fw=f.clientWidth,Fh=f.clientHeight; const fx=((Fw/2-cs.current.tx)/cs.current.s)/cs.current.iw, fy=((Fh/2-cs.current.ty)/cs.current.s)/cs.current.ih; onApply({ fx:Math.max(0,Math.min(1,fx)), fy:Math.max(0,Math.min(1,fy)), zoom:cs.current.s/cs.current.cover }); };
  return <div onClick={e=>{ if(e.target===e.currentTarget) onKapat(); }} style={{position:"fixed",inset:0,zIndex:2000,background:"rgba(3,5,9,.85)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
    <div style={{width:"min(340px,92vw)",background:"#0c111e",border:"1px solid "+T.line,borderRadius:18,padding:16}}>
      <div style={{fontSize:13,fontWeight:800,color:T.text,marginBottom:2}}>✂ Fotoğrafı Kırp{konseptAd?" · "+konseptAd:""}</div>
      <div style={{fontSize:11,color:T.textMut,marginBottom:12}}>Sürükle · tekerlek/parmakla yakınlaştır · çerçevede görünen = kartta görünen ({konseptAd||"bu konsept"})</div>
      <div ref={fRef} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onWheel={wheel} onTouchMove={tmove} onTouchEnd={()=>{pinch.current=0;}} style={{position:"relative",width:oran<0.75?Math.round(320*oran)+"px":"100%",maxWidth:"100%",margin:"0 auto",aspectRatio:oran+" / 1",borderRadius:12,overflow:"hidden",background:"#05070c",border:"1px solid "+T.line,cursor:"grab",touchAction:"none"}}>
        <img ref={iRef} src={url} alt="" draggable="false" style={{position:"absolute",top:0,left:0,transformOrigin:"0 0",userSelect:"none",pointerEvents:"none"}}/>
        <div style={{position:"absolute",inset:0,pointerEvents:"none",background:"linear-gradient(180deg,rgba(0,0,0,.3),transparent 24%,transparent 58%,rgba(0,0,0,.75))"}}/>
        <div style={{position:"absolute",inset:8,border:"1px dashed rgba(255,255,255,.28)",borderRadius:10,pointerEvents:"none"}}/>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:10,margin:"14px 0"}}><span>➖</span><input type="range" min="100" max="400" value={zoom} onChange={e=>{ setZoom(+e.target.value); setZ(+e.target.value/100); }} style={{flex:1,accentColor:T.accent,height:22}}/><span>➕</span></div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={onKapat} className="tap" style={{flex:"0 0 auto",padding:"11px 14px",borderRadius:11,background:T.bg2,color:T.textMut,border:"1px solid "+T.line,fontWeight:800,fontSize:12.5}}>İptal</button>
        <button onClick={uygula} className="tap" style={{flex:1,padding:"11px",borderRadius:11,background:T.accent,color:T.bg0,border:0,fontWeight:800,fontSize:12.5}}>Uygula</button>
      </div>
    </div>
  </div>;
}

