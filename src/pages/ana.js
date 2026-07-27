function AnaSayfa({turnuvalar, T, git}){
  // Öne çıkan turnuva = en çok maç oynanmış (en aktif) lig
  const aktifTurnuva = useMemo(()=>{
    // Sadece takımı OLAN ligler (takımsız yeni lig lider/puan okurken çökmesin)
    const dolu = turnuvalar.filter(t=>t.takimlar && t.takimlar.length>0);
    if(!dolu.length) return null;
    return [...dolu].sort((a,b)=>b.maclar.length-a.maclar.length)[0];
  },[turnuvalar]);
  // Hook'lar erken return'DEN ÖNCE olmalı (Rules of Hooks) — null'a karşı korumalı
  const yukselenTakim = useMemo(()=>{
    if(!aktifTurnuva || !aktifTurnuva.takimlar) return null;
    const puanla=(t)=>(t.form||[]).slice(-5).reduce((s,f)=>s+(f==="G"?3:f==="B"?1:0),0);
    return [...aktifTurnuva.takimlar].map(t=>({t,p:puanla(t)})).sort((a,b)=>b.p-a.p)[0];
  },[aktifTurnuva]);

  const tumO = Motor.tumOyuncular(turnuvalar);
  const topTakim = turnuvalar.reduce((s,t)=>s+t.takimlar.length,0);
  const topMac = turnuvalar.reduce((s,t)=>s+t.maclar.length,0);

  // saate göre selamlama
  const saat = new Date().getHours();
  const selam = saat<5?"İyi geceler":saat<12?"Günaydın":saat<18?"Merhaba":saat<23?"İyi akşamlar":"İyi geceler";
  const bugun = new Date().toLocaleDateString("tr-TR",{day:"numeric",month:"long",year:"numeric",weekday:"long"});

  if(!aktifTurnuva) return <div className="fade-in" style={{padding:"34px 20px 80px",maxWidth:460,margin:"0 auto"}}>
    <div style={{textAlign:"center",marginBottom:22}}>
      <div style={{fontSize:44,marginBottom:10}}>⚽</div>
      <div style={{fontSize:20,color:T.text,fontWeight:800,fontFamily:T.fontDisplay}}>Hoş geldin!</div>
      <div style={{fontSize:13,color:T.textMut,lineHeight:1.6,marginTop:6}}>Ne yapmak istersin? İstediğini seç — sonradan değişir.</div>
    </div>
    {[
      {ik:"🔍",bas:"Ligleri keşfet",alt:"Açık ligleri gez, bir takıma katıl",go:()=>git&&git({sayfa:"ligler"}),vurgu:true},
      {ik:"🛡️",bas:"Takımını kur",alt:"Kalıcı takım — her ligde tekrar kullan",go:()=>git&&git({sayfa:"kuluplerim"})},
      {ik:"🏆",bas:"Lig aç",alt:"Kendi ligini veya turnuvanı düzenle",go:()=>git&&git({sayfa:"ligkur"})},
    ].map((a,i)=><div key={i} onClick={a.go} className="tap kart-hover" style={{display:"flex",alignItems:"center",gap:13,background:T.bg1,border:"1px solid "+(a.vurgu?T.accent+"55":T.line),borderRadius:16,padding:"15px",marginBottom:10,cursor:"pointer"}}>
      <div style={{width:46,height:46,borderRadius:13,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,background:(a.vurgu?T.accent:T.gold)+"22",color:a.vurgu?T.accent:T.gold}}>{a.ik}</div>
      <div style={{flex:1,minWidth:0}}><div style={{fontSize:15.5,fontWeight:800,color:T.text}}>{a.bas}</div><div style={{fontSize:11.5,color:T.textMut,marginTop:2}}>{a.alt}</div></div>
      <span style={{color:T.textMut,fontSize:20}}>›</span>
    </div>)}
  </div>;

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

  // TÜM LİGLERİN ENLERİ (vitrin)
  const vitrin = Motor.enlerVitrin(turnuvalar);
  const oyuncuGit=(o)=>{ if(o&&git)git({sayfa:"oyuncu",oyuncu:{...o}}); };
  const takimGit=(tk)=>{ if(tk&&git){ const t=turnuvalar.find(x=>x.ad===tk.turnuva); git({sayfa:"takim",takim:tk,turnuva:t}); } };

  // ÖNE ÇIKANLAR — haftanın oyuncusu (en çok gol+asist) + yükselen takım (son formu iyi)
  const haftaninOyuncusu = golK[0] || asistK[0] || null;

  return <div className="fade-in main-area" style={{paddingBottom:90}}>

    {/* KARŞILAMA — premium kokpit hero */}
    <div style={{padding:"14px 14px 4px"}}>
      <div style={{position:"relative",overflow:"hidden",borderRadius:20,padding:"20px 20px 18px",border:"1px solid "+T.accent+"3a",
        background:"radial-gradient(120% 140% at 90% 2%,"+T.accent+"2e,transparent 52%), linear-gradient(155deg,"+T.bg1+","+T.bg0+" 66%)",boxShadow:"0 18px 50px rgba(0,0,0,.35)"}}>
        <div style={{position:"absolute",right:-30,top:-40,width:190,height:190,borderRadius:"50%",pointerEvents:"none",background:"radial-gradient(circle at 40% 35%,"+T.accent+",transparent 62%)",opacity:.26,filter:"blur(6px)"}}/>
        <div style={{position:"relative",display:"flex",alignItems:"center",gap:7,fontSize:10.5,fontWeight:800,letterSpacing:.8,textTransform:"uppercase",color:T.accent}}>
          <span style={{width:7,height:7,borderRadius:"50%",background:T.accent,boxShadow:"0 0 8px "+T.accent}} className="fz-nabiz"/>
          {aktifTurnuva.ad}
        </div>
        <div style={{position:"relative",fontSize:26,fontWeight:800,color:T.text,fontFamily:T.fontDisplay,lineHeight:1.05,marginTop:8,letterSpacing:-.5}}>{selam}, hoş geldin! 👋</div>
        <div style={{position:"relative",fontSize:12,color:T.textSoft,marginTop:7}}>{bugun}</div>
        <div style={{position:"relative",display:"flex",gap:16,marginTop:14}}>
          <div><span style={{fontSize:18,fontWeight:800,color:T.text,fontFamily:T.fontDisplay}}>{topTakim}</span><span style={{fontSize:10,color:T.textMut,marginLeft:4}}>takım</span></div>
          <div><span style={{fontSize:18,fontWeight:800,color:T.text,fontFamily:T.fontDisplay}}>{tumO.length}</span><span style={{fontSize:10,color:T.textMut,marginLeft:4}}>oyuncu</span></div>
          <div><span style={{fontSize:18,fontWeight:800,color:T.text,fontFamily:T.fontDisplay}}>{topMac}</span><span style={{fontSize:10,color:T.textMut,marginLeft:4}}>maç</span></div>
        </div>
      </div>
    </div>

    {/* FAZ 4 — HIZLI LİG GEÇİŞİ: birden çok lig varsa yatay şeritle tek dokunuşta gir */}
    {turnuvalar.length>1 && git && <div style={{padding:"2px 0 4px"}}>
      <div style={{display:"flex",gap:8,overflowX:"auto",padding:"4px 14px 8px",WebkitOverflowScrolling:"touch"}}>
        {turnuvalar.map(lg=>{
          const enAktif=lg.id===aktifTurnuva.id;
          return <button key={lg.id} onClick={()=>git({sayfa:"turnuva",turnuva:lg})} className="tap" style={{flexShrink:0,display:"flex",alignItems:"center",gap:7,background:enAktif?T.accent+"1c":T.bg1,border:"0.5px solid "+(enAktif?T.accent+"66":T.line),borderRadius:20,padding:"6px 12px 6px 6px",cursor:"pointer"}}>
            <Logo renk={lg.renk} ad={lg.ad} logo={lg.logo} renk2={lg.renk2} boy={24}/>
            <span style={{fontSize:12,fontWeight:enAktif?800:600,color:enAktif?T.accent:T.textSoft,whiteSpace:"nowrap",maxWidth:130,overflow:"hidden",textOverflow:"ellipsis"}}>{lg.ad}</span>
          </button>;
        })}
      </div>
    </div>}

    {/* ÖNE ÇIKANLAR */}
    {(haftaninOyuncusu || yukselenTakim) && <div style={{padding:"6px 14px 0"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {haftaninOyuncusu && <div onClick={()=>oyuncuGit({...haftaninOyuncusu,turnuva:tk.ad})} className="tap prem-tap vav-hero" style={{position:"relative",overflow:"hidden",background:`linear-gradient(120deg, ${T.gold}3a, ${T.bg1} 38%, ${T.gold}26 70%, ${T.bg1})`,border:"0.5px solid "+T.gold+"55",borderRadius:14,padding:12,boxShadow:`0 6px 20px ${T.gold}2a`}}>
          <div className="vav-supurme"/>
          <div style={{fontSize:9,color:T.gold,fontWeight:800,marginBottom:8,letterSpacing:.3,position:"relative"}}>👑 ÖNE ÇIKAN OYUNCU</div>
          <div style={{display:"flex",alignItems:"center",gap:8,position:"relative"}}>
            <div className="vav-suzul"><Avatar o={haftaninOyuncusu} boy={34} T={T}/></div>
            <div style={{minWidth:0}}>
              <div style={{fontSize:12,color:T.text,fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{haftaninOyuncusu.ad}</div>
              <div style={{fontSize:9,color:T.gold}}><b className="vav-parla" style={{fontSize:12,fontFamily:T.fontDisplay}}>{haftaninOyuncusu.gol||0}</b> gol · <b className="vav-parla" style={{fontSize:12,fontFamily:T.fontDisplay}}>{haftaninOyuncusu.asist||0}</b> asist</div>
            </div>
          </div>
        </div>}
        {yukselenTakim && yukselenTakim.t && <div onClick={()=>takimGit({...yukselenTakim.t,turnuva:tk.ad})} className="tap prem-tap vav-hero" style={{position:"relative",overflow:"hidden",background:`linear-gradient(120deg, #34D3993a, ${T.bg1} 38%, #34D39926 70%, ${T.bg1})`,border:"0.5px solid #34D39955",borderRadius:14,padding:12,boxShadow:"0 6px 20px #34D3992a"}}>
          <div className="vav-supurme"/>
          <div style={{fontSize:9,color:"#34D399",fontWeight:800,marginBottom:8,letterSpacing:.3,position:"relative"}}>📈 YÜKSELEN TAKIM</div>
          <div style={{display:"flex",alignItems:"center",gap:8,position:"relative"}}>
            <div className="vav-suzul"><Logo renk={yukselenTakim.t.renk} ad={yukselenTakim.t.ad} logo={yukselenTakim.t.logo} renk2={yukselenTakim.t.renk2} boy={32}/></div>
            <div style={{minWidth:0}}>
              <div style={{fontSize:12,color:T.text,fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{yukselenTakim.t.ad}</div>
              <div style={{fontSize:9,color:"#34D399"}}>son 5 maçta <b className="vav-parla" style={{fontSize:12,fontFamily:T.fontDisplay}}>{yukselenTakim.p}</b> puan</div>
            </div>
          </div>
        </div>}
      </div>
    </div>}

    {/* TÜM LİGLERİN ENLERİ */}
    <div style={{padding:"6px 14px 0"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",margin:"0 2px 10px"}}>
        <span style={{fontSize:14,color:T.text,fontWeight:800}}>🏆 Liglerin Enleri</span>
        {git && <span onClick={()=>git({sayfa:"tumenler"})} className="tap" style={{fontSize:11,color:T.accent,fontWeight:600}}>Tüm Enler →</span>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <EnKart et="⚽ GOL KRALI" o={vitrin.gol} deg={vitrin.gol&&vitrin.gol.gol} br="" renk={T.accent} T={T} onClick={()=>oyuncuGit(vitrin.gol)}/>
        <EnKart et="🎯 ASİST KRALI" o={vitrin.asist} deg={vitrin.asist&&vitrin.asist.asist} br="" renk="#34D399" T={T} onClick={()=>oyuncuGit(vitrin.asist)}/>
        <EnKart et="🧤 EN İYİ KALECİ" o={vitrin.kaleci} deg={vitrin.kaleci&&vitrin.kaleci.kurtaris} br="kurtarış" renk="#7c4dff" T={T} onClick={()=>oyuncuGit(vitrin.kaleci)}/>
        <EnKart et="⭐ EN ÇOK MVP" o={vitrin.mvp} deg={vitrin.mvp&&vitrin.mvp.mvp} br="kez" renk={T.gold} T={T} onClick={()=>oyuncuGit(vitrin.mvp)}/>
        <EnKart et="🏆 EN GOLCÜ TAKIM" o={vitrin.golcuTakim} deg={vitrin.golcuTakim&&vitrin.golcuTakim.ag} br="gol" renk={T.accent} T={T} takim onClick={()=>takimGit(vitrin.golcuTakim)}/>
        <EnKart et="📈 EN FORMDA" o={vitrin.formEn} deg={vitrin.formEn&&("OVR "+vitrin.formEn.ovr)} br="" renk="#27ae60" T={T} onClick={()=>oyuncuGit(vitrin.formEn)}/>
      </div>
    </div>

    {/* 2-KOLON GRID (telefonda tek kolon) */}
    <div className="ana-grid" style={{padding:"12px 14px 6px"}}>

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

    {/* DİĞER TURNUVALAR (çok turnuva varsa) */}
    {turnuvalar.length>1 && <div style={{padding:"16px 14px 6px"}}>
      <div style={{fontSize:13,fontWeight:700,color:T.text,margin:"0 4px 8px"}}>📋 Diğer Turnuvalar</div>
      {turnuvalar.filter(t=>t.id!==tk.id).map(t=>
        <div key={t.id} onClick={()=>git({sayfa:"turnuva",turnuva:t})} className="tap" style={{display:"flex",alignItems:"center",gap:12,background:T.bg1,borderRadius:12,padding:"12px 14px",marginBottom:8,border:"0.5px solid "+T.line}}>
          <Logo renk={t.renk} ad={t.ad} logo={t.logo} renk2={t.renk2} boy={40}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:14,fontWeight:600,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.ad}</div>
            <div style={{fontSize:11,color:T.textMut}}>{t.sehir} · {t.takimlar.length} takım · {t.maclar.length} maç</div>
          </div>
          <span style={{color:T.textMut,fontSize:18}}>›</span>
        </div>
      )}
    </div>}
  </div>;
}

function MiniIstatBanner({buyuk, etiket, renk, T}){
  return <div style={{flex:1,textAlign:"center"}}>
    <div style={{fontSize:18,fontWeight:800,color:renk,fontFamily:T.fontDisplay,lineHeight:1}}>{buyuk}</div>
    <div style={{fontSize:9,color:T.textMut,marginTop:2}}>{etiket}</div>
  </div>;
}

function OneCikan({ik, et, ana, alt, T, onClick}){
  return <div onClick={onClick} className={onClick?"kart-hover":""} style={{background:T.bg1,borderRadius:11,padding:"11px 10px",border:"0.5px solid "+T.line}}>
    <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:6}}><span style={{fontSize:13}}>{ik}</span><span style={{fontSize:9,color:T.textMut,fontWeight:700,letterSpacing:.3}}>{et}</span></div>
    <div style={{fontSize:11.5,fontWeight:700,color:T.text,lineHeight:1.25}}>{ana}</div>
    {alt && <div style={{fontSize:10,color:T.textSoft,marginTop:3}}>{alt}</div>}
  </div>;
}

function KpiMini({ik, buyuk, et, renk, T, onClick}){
  return <div onClick={onClick} className={onClick?"kart-hover":""} style={{background:T.bg1,borderRadius:13,padding:"14px 13px",border:"0.5px solid "+T.line}}>
    <div style={{fontSize:16,marginBottom:6}}>{ik}</div>
    <div style={{lineHeight:1}}>{typeof buyuk==="number" ? <Sayac hedef={buyuk} T={T} renk={renk} boy={24}/> : <span style={{fontSize:24,fontWeight:800,color:renk,fontFamily:T.fontDisplay}}>{buyuk}</span>}</div>
    <div style={{fontSize:10,color:T.textMut,marginTop:4}}>{et}</div>
  </div>;
}

function LiderMiniKart({ik, et, o, alan, birim, renk, T, git}){
  return <div onClick={()=>git({sayfa:"oyuncu",oyuncu:o})} className="tap" style={{background:T.bg1,borderRadius:12,padding:"11px 13px",border:"0.5px solid "+T.line}}>
    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:9}}><span style={{fontSize:13}}>{ik}</span><span style={{fontSize:10,color:T.textMut,fontWeight:700,letterSpacing:.4}}>{et}</span></div>
    <div style={{display:"flex",alignItems:"center",gap:10}}>
      <Avatar o={o} boy={36} T={T}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13,fontWeight:600,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{o.ad}</div>
        <div style={{display:"flex",alignItems:"center",gap:5,marginTop:1}}><span style={{width:6,height:6,borderRadius:"50%",background:o.takimRenk||T.textMut}}/><span style={{fontSize:11,color:T.textMut}}>{o.takimAd}</span></div>
      </div>
      <div style={{textAlign:"right"}}><div style={{fontSize:19,fontWeight:800,color:renk,fontFamily:T.fontDisplay,lineHeight:1}}>{o[alan]}</div><div style={{fontSize:9,color:T.textMut}}>{birim}</div></div>
    </div>
  </div>;
}

/* TURNUVA SAYFASI — puan durumu + krallar + grafik */
