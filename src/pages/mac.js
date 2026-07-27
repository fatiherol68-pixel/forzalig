function MacSayfa({mac:m, turnuva, T, git, oturum, sahiplenme, yetkili}){
  const kadroVar = m.kadroA || m.kadroB;
  const goller = m.olaylar.filter(o=>o.tip==="gol");
  const aGol=m.skorA, bGol=m.skorB;
  const aGalip=aGol>bGol, bGalip=bGol>aGol, berabere=aGol===bGol;
  const oynandi = m.skorA!=null;
  const [yorumTohum,setYorumTohum]=useState(0);
  const yorum = oynandi ? macYorumUret(m, turnuva, yorumTohum) : null;
  // Skor değişiklik logu (madde 22) — ilişkisel maçlarda
  const [degisLog,setDegisLog]=useState([]);
  useEffect(()=>{ let a=true; (async()=>{ if(sb && typeof m.id==="string"){ const l=await Db.macLog(m.id); if(a) setDegisLog(l||[]); } })(); return ()=>{a=false;}; },[m.id]);

  // deterministik "rastgele" — aynı maç hep aynı görünsün
  const seed = ((typeof m.id==="string"?hash(m.id):(m.id||1))*2654435761)>>>0;
  const det = (n)=>{ let x=(seed + n*40503)>>>0; x=(x^(x>>>13))*0xC2B2AE35>>>0; return (x>>>0)/4294967296; };

  // gollere dakika ata (elle girilmişse onu kullan, yoksa deterministik)
  const golDakika = useMemo(()=>{
    return goller.map((g,i)=> (g.dk!=null&&g.dk!=="")?parseInt(g.dk): 1+Math.floor(det(i+1)*58));
  },[m.id, goller.length]);
  // timeline olayları: gol + sarı/kırmızı kart + oyuncu değişikliği, takım + dakika
  const timeline = useMemo(()=>{
    const goled=goller.map((g,i)=>({...g, dk:golDakika[i], tip:"gol", takimA: g.takim===m.takimA}));
    const kartlar=m.olaylar.filter(o=>o.tip==="sari"||o.tip==="kirmizi").map((k,i)=>({...k, dk:(k.dk!=null&&k.dk!=="")?parseInt(k.dk):5+Math.floor(det(100+i)*55), takimA:k.takim===m.takimA}));
    const degisik=m.olaylar.filter(o=>o.tip==="degisik" && (o.cikan||o.giren)).map((d,i)=>({...d, dk:(d.dk!=null&&d.dk!=="")?parseInt(d.dk):20+Math.floor(det(200+i)*50), takimA:d.takim===m.takimA}));
    return [...goled, ...kartlar, ...degisik].sort((a,b)=>a.dk-b.dk);
  },[m.id, goller.length, m.olaylar.length]);

  // istatistikler — kayıtlı varsa onu kullan, yoksa skordan deterministik üret (11 stat)
  const stat = useMemo(()=>{
    if(m.istatistik) return m.istatistik;
    const di=(n,min,max)=>min+Math.floor(det(n)*(max-min+1));
    let shA=44+Math.floor(det(15)*13); if(aGalip)shA=Math.max(shA,52); if(bGalip)shA=Math.min(shA,48);
    const sutA=aGol*2+di(11,3,8), sutB=bGol*2+di(12,3,8);
    return {
      sahiplikA:shA, sahiplikB:100-shA,
      sutA, sutB,
      isabetA:Math.min(sutA,aGol+di(13,1,4)), isabetB:Math.min(sutB,bGol+di(14,1,4)),
      kornerA:di(16,2,9), kornerB:di(17,2,9),
      ofsaytA:di(20,0,4), ofsaytB:di(21,0,4),
      pasA:di(22,280,520), pasB:di(23,280,520),
      pasIsabetA:di(24,68,88), pasIsabetB:di(25,68,88),
      faulA:di(18,5,16), faulB:di(19,5,16),
      kurtarisA:di(26,2,8), kurtarisB:di(27,2,8),
      kosuA:(di(28,58,68)/10).toFixed(1), kosuB:(di(29,58,68)/10).toFixed(1),
    };
  },[m.id, m.istatistik]);

  // head-to-head: bu iki takımın turnuvadaki diğer maçları
  const h2h = useMemo(()=>{
    if(!turnuva) return null;
    const ikili = turnuva.maclar.filter(x=>
      (x.takimA===m.takimA&&x.takimB===m.takimB)||(x.takimA===m.takimB&&x.takimB===m.takimA));
    let aG=0,bG=0,ber=0;
    ikili.forEach(x=>{
      const xa = x.takimA===m.takimA?x.skorA:x.skorB;
      const xb = x.takimA===m.takimA?x.skorB:x.skorA;
      if(xa>xb)aG++; else if(xb>xa)bG++; else ber++;
    });
    return {adet:ikili.length, aG, bG, ber, maclar:ikili};
  },[m.id]);

  // kadro listesi yardımcı
  const takimA = turnuva && (turnuva.takimlar.find(t=>t.id===m.takimAId)||turnuva.takimlar.find(t=>t.ad===m.takimA));
  const takimB = turnuva && (turnuva.takimlar.find(t=>t.id===m.takimBId)||turnuva.takimlar.find(t=>t.ad===m.takimB));
  const ilk11 = (kadro,takim)=>{ if(!kadro||!takim) return []; return kadro.yerlesim.filter(x=>x!=null).map(id=>takim.oyuncular.find(o=>o.id===id)).filter(Boolean); };
  // MVP oylaması için maç kadrosu (dizilişte varsa ilk11, yoksa takım kadrosu)
  const oylamaKadro = useMemo(()=>{
    let arr=[];
    if(m.kadroA && takimA) arr=arr.concat(ilk11(m.kadroA,takimA)); else if(takimA) arr=arr.concat(takimA.oyuncular||[]);
    if(m.kadroB && takimB) arr=arr.concat(ilk11(m.kadroB,takimB)); else if(takimB) arr=arr.concat(takimB.oyuncular||[]);
    // benzersiz
    const gor={}; return arr.filter(o=>o&&!gor[o.id]&&(gor[o.id]=1));
  },[m.id]);

  // --- sekme ---
  const [macTab,setMacTab]=useState("ozet");
  const [ligAltTab,setLigAltTab]=useState("puan");
  const [kadroTakim,setKadroTakim]=useState("A"); // mobilde gösterilen takım
  const [kadroPaylas,setKadroPaylas]=useState(null); // null | "menu" | "A" | "B" | "iki"
  const [darMi,setDarMi]=useState(()=> typeof window!=="undefined" && window.innerWidth<820);
  useEffect(()=>{ const f=()=>setDarMi(window.innerWidth<820); window.addEventListener("resize",f); return ()=>window.removeEventListener("resize",f); },[]);

  // (Maç Tahmini kaldırıldı — biten maçta anlamsızdı + uydurma veriydi. Yerine hero'da ForzaLig watermark.)

  // maç temposu etiketi
  const tempo=useMemo(()=>{
    const top=aGol+bGol, fark=Math.abs(aGol-bGol);
    if(top>=6) return {ik:"🔥",ad:"Gol Düellosu",alt:top+" gol, tempolu maç",renk:T.danger};
    if(fark>=4) return {ik:"💪",ad:"Tek Taraflı",alt:"farklı galibiyet",renk:T.accent2};
    if(fark===0&&top>0) return {ik:"⚖️",ad:"Çekişmeli",alt:"başa baş geçti",renk:T.gold};
    if(fark<=1&&top>=2) return {ik:"🎯",ad:"Nefes Kesen",alt:"tek farkla belirlendi",renk:T.accent};
    if(top===0) return {ik:"🛡️",ad:"Gol Perdesi",alt:"savunmalar kazandı",renk:T.textSoft};
    return {ik:"⚽",ad:"Standart Maç",alt:"normal tempo",renk:T.accent};
  },[m.id]);

  // dönüm noktası (son golden önceki kritik gol)
  const donum=useMemo(()=>{
    if(timeline.length<2) return null;
    // en geç atılan, skoru kopartan gol
    const son=timeline[timeline.length-1];
    return {dk:son.dk, oyuncu:son.oyuncu, takim:son.takimA?m.takimA:m.takimB};
  },[m.id, timeline.length]);

  // gol katkısı (gol+asist)
  const golKatki=useMemo(()=>{
    const map={};
    m.olaylar.filter(o=>o.tip==="gol").forEach(o=>{
      const tk=o.takim;
      if(o.oyuncu){ map[o.oyuncu]=map[o.oyuncu]||{ad:o.oyuncu,takim:tk,g:0,a:0}; map[o.oyuncu].g++; }
      if(o.asist){ map[o.asist]=map[o.asist]||{ad:o.asist,takim:tk,g:0,a:0}; map[o.asist].a++; }
    });
    return Object.values(map).sort((x,y)=>(y.g+y.a)-(x.g+x.a));
  },[m.id]);

  // lig etkisi (basit: bu maç sonrası takımların sırası)
  const ligEtki=useMemo(()=>{
    if(!turnuva||!oynandi) return null;
    const sirali=[...turnuva.takimlar].sort((a,b)=>(b.puan||0)-(a.puan||0));
    const siraA=sirali.findIndex(t=>t.id===m.takimAId)+1;
    const siraB=sirali.findIndex(t=>t.id===m.takimBId)+1;
    if(siraA===0&&siraB===0) return null;
    return {siraA, siraB};
  },[m.id, oynandi]);

  const macSekmeler=[["ozet","📋","Özet"],["ist","📊","İst."],["kadro","👥","Kadro"],["odul","🏅","Ödül"],["lig","🏆","Lig"]];

  return <div className="fade-in" style={{paddingBottom:90}}>
    {/* KAPAK + SKOR — premium çift-renk hero */}
    <div style={{position:"relative",isolation:"isolate",margin:"12px 14px 2px",borderRadius:20,overflow:"hidden",border:"1px solid "+T.line,boxShadow:"0 16px 40px rgba(0,0,0,.3)",background:`radial-gradient(120% 130% at 0% 0%, ${m.renkA}40, transparent 46%), radial-gradient(120% 130% at 100% 0%, ${m.renkB}40, transparent 46%), linear-gradient(160deg, ${T.bg1}, ${T.bg0} 78%)`,padding:"16px 14px 14px"}}>
      {/* A2 — silik ForzaLig marka watermark (içeriğin arkasında, okunabilirliği bozmaz) */}
      <div aria-hidden="true" style={{position:"absolute",inset:0,zIndex:-1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",pointerEvents:"none",overflow:"hidden"}}>
        <div style={{fontSize:"clamp(38px,15vw,82px)",fontWeight:900,letterSpacing:-2,color:T.text,opacity:.06,fontFamily:T.fontDisplay,lineHeight:1,whiteSpace:"nowrap"}}>ForzaLig</div>
        <div style={{fontSize:11,fontWeight:800,letterSpacing:5,color:T.text,opacity:.06,marginTop:4}}>FORZALIG.COM</div>
      </div>
      <div style={{textAlign:"center",fontSize:10,color:T.textSoft,fontWeight:600,letterSpacing:1,marginBottom:4}}>{turnuva?turnuva.ad+" · ":""}{m.hafta}. HAFTA</div>
      {/* tarih · saat · stad */}
      {(m.tarih||m.saat||m.stad) && <div style={{textAlign:"center",fontSize:10,color:T.textMut,marginBottom:12,display:"flex",justifyContent:"center",alignItems:"center",gap:6,flexWrap:"wrap"}}>
        {m.tarih && <span>📅 {m.tarih.includes("-")?m.tarih.split("-").reverse().join("."):m.tarih}</span>}
        {m.saat && <><span style={{color:T.line}}>·</span><span>🕐 {m.saat}</span></>}
        {m.stad && <><span style={{color:T.line}}>·</span><span>📍 {m.stad}</span></>}
      </div>}
      {!(m.tarih||m.saat||m.stad) && <div style={{marginBottom:12}}/>}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
        <div onClick={()=>{const tk=turnuva&&turnuva.takimlar.find(t=>t.ad===m.takimA); if(tk&&git)git({sayfa:"takim",takim:tk,turnuva});}} className={turnuva?"tap":""} style={{flex:1,textAlign:"center"}}><Logo renk={m.renkA} ad={m.takimA} boy={50}/><div style={{fontSize:12,fontWeight:700,color:aGalip?T.text:T.textSoft,marginTop:6}}>{m.takimA}</div></div>
        <div style={{padding:"0 12px",textAlign:"center"}}>
          {oynandi ? <>
            <div style={{fontSize:38,fontWeight:800,fontFamily:T.fontDisplay}}><span style={{color:aGalip?T.accent:T.text}}>{aGol}</span><span style={{color:T.textMut}}>-</span><span style={{color:bGalip?T.accent:T.text}}>{bGol}</span></div>
            <div style={{fontSize:9,color:berabere?T.gold:T.accent,fontWeight:700,background:(berabere?T.gold:T.accent)+"22",borderRadius:20,padding:"2px 10px",display:"inline-block",marginTop:4}}>{berabere?"BERABERE":aGalip?m.takimA.toUpperCase()+" KAZANDI":m.takimB.toUpperCase()+" KAZANDI"}</div>
          </> : <>
            <div style={{fontSize:30,fontWeight:800,color:T.textMut,fontFamily:T.fontDisplay}}>VS</div>
            <div style={{fontSize:9,color:T.textMut,marginTop:4}}>oynanmadı</div>
          </>}
        </div>
        <div onClick={()=>{const tk=turnuva&&turnuva.takimlar.find(t=>t.ad===m.takimB); if(tk&&git)git({sayfa:"takim",takim:tk,turnuva});}} className={turnuva?"tap":""} style={{flex:1,textAlign:"center"}}><Logo renk={m.renkB} ad={m.takimB} boy={50}/><div style={{fontSize:12,fontWeight:700,color:bGalip?T.text:T.textSoft,marginTop:6}}>{m.takimB}</div></div>
      </div>
      {/* GOLCÜLER — takımların altında, dakikayla */}
      {oynandi && (()=>{
        const golcu=(takimAd)=>{
          const harita={}; // ad → [dk,...]
          (m.olaylar||[]).filter(o=>o.tip==="gol" && o.takim===takimAd).forEach(o=>{ (harita[o.oyuncu]=harita[o.oyuncu]||[]).push(o.dk); });
          return Object.entries(harita).map(([ad,dks])=>({ad,dks:dks.sort((a,b)=>(a||0)-(b||0))}));
        };
        const gA=golcu(m.takimA), gB=golcu(m.takimB);
        if(gA.length===0 && gB.length===0) return null;
        const fmt=(dks)=> dks.map(d=>d!=null?d+"'":"").filter(Boolean).join(", ");
        return <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginTop:10,gap:8}}>
          <div style={{flex:1,textAlign:"right"}}>
            {gA.map((g,i)=><div key={i} style={{fontSize:10,color:T.textSoft,marginBottom:3}}>{g.ad} <span style={{color:T.textMut}}>{fmt(g.dks)}</span> ⚽</div>)}
          </div>
          <div style={{width:1,alignSelf:"stretch",background:T.line,opacity:0.5}}/>
          <div style={{flex:1,textAlign:"left"}}>
            {gB.map((g,i)=><div key={i} style={{fontSize:10,color:T.textSoft,marginBottom:3}}>⚽ {g.ad} <span style={{color:T.textMut}}>{fmt(g.dks)}</span></div>)}
          </div>
        </div>;
      })()}
    </div>

    {/* CANLI İZLE (Faz 7) */}
    <CanliYayin m={m} T={T}/>

    {/* AKSİYON BUTONLARI */}
    {git && <div style={{padding:"8px 14px 0",display:"flex",gap:8,flexWrap:"wrap"}}>
      {yetkili && <button onClick={()=>git({sayfa:"sihirbaz",mac:m,turnuva})} className="tap" style={{flex:1,padding:12,borderRadius:11,background:oynandi?T.bg1:T.accent,color:oynandi?T.accent:(T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0),fontSize:13,fontWeight:800,border:oynandi?"1px solid "+T.accent:"none"}}>⚡ {oynandi?"Maçı Düzenle":"Maçı Yönet"}</button>}
      {oynandi && <button onClick={()=>git({sayfa:"gazete",mac:m,turnuva})} className="tap" style={{flex:1,padding:12,borderRadius:11,background:T.gold+"14",color:T.gold,fontSize:13,fontWeight:700,border:"0.5px solid "+T.gold+"44"}}>📰 Gazete</button>}
      {oynandi && <button onClick={()=>git({sayfa:"skorkart",mac:m,turnuva})} className="tap" style={{flex:1,minWidth:"100%",padding:12,borderRadius:11,background:T.accent+"14",color:T.accent,fontSize:13,fontWeight:700,border:"0.5px solid "+T.accent+"44"}}>📲 Skor Kartı (paylaş)</button>}
    </div>}

    {/* SEKMELER */}
    <div style={{display:"flex",padding:"12px 8px 0",borderBottom:"1px solid "+T.line}}>
      {macSekmeler.map(([k,ik,l])=>
        <button key={k} onClick={()=>setMacTab(k)} className="tap sekme" style={{flex:1,background:"none",border:0,padding:"7px 0",color:macTab===k?T.accent:T.textMut,borderBottom:"2px solid "+(macTab===k?T.accent:"transparent"),fontWeight:macTab===k?700:600,borderRadius:"6px 6px 0 0"}}>
          <div style={{fontSize:15}}>{ik}</div>
          <div style={{fontSize:9,marginTop:1}}>{l}</div>
        </button>
      )}
    </div>

    {/* ===== ÖZET ===== */}
    {macTab==="ozet" && <div className="fade-in">
      {oynandi && <div style={{padding:"12px 14px 0",display:"flex",gap:8}}>
        <div style={{flex:1,background:`linear-gradient(135deg, ${tempo.renk}22, ${T.bg1})`,borderRadius:12,padding:12,border:"0.5px solid "+tempo.renk+"44",textAlign:"center"}}>
          <span style={{fontSize:20}}>{tempo.ik}</span> <span style={{fontSize:14,fontWeight:800,color:tempo.renk}}>{tempo.ad}</span>
          <div style={{fontSize:10,color:T.textMut,marginTop:2}}>{tempo.alt}</div>
        </div>
      </div>}

      {donum && <div style={{padding:"10px 14px 0"}}>
        <div style={{background:`linear-gradient(135deg, ${T.gold}18, ${T.bg1})`,borderRadius:12,padding:13,border:"0.5px solid "+T.gold+"44",display:"flex",alignItems:"center",gap:11}}>
          <span style={{fontSize:24}}>🎯</span>
          <div><div style={{fontSize:9,color:T.gold,fontWeight:700}}>MAÇIN KIRILMA ANI</div><div style={{fontSize:13,color:T.text,fontWeight:600}}>{donum.dk}' {donum.oyuncu}</div><div style={{fontSize:10,color:T.textMut}}>{donum.takim} skoru kopardı</div></div>
        </div>
      </div>}

      {m.mvp && <div style={{padding:"10px 14px 0"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,background:`linear-gradient(135deg, ${T.gold}22, ${T.bg1})`,borderRadius:14,padding:14,border:"0.5px solid "+T.gold+"44"}}>
          <div style={{position:"relative"}}>
            <div style={{width:48,height:48,borderRadius:"50%",overflow:"hidden",border:"2px solid "+T.gold}} dangerouslySetInnerHTML={{__html:svgAvatar(m.mvp,48)}}/>
            <span style={{position:"absolute",bottom:-4,right:-4,fontSize:16}}>⭐</span>
          </div>
          <div style={{flex:1}}><div style={{fontSize:10,color:T.gold,fontWeight:700,letterSpacing:.5}}>MAÇIN YILDIZI</div><div style={{fontSize:15,fontWeight:700,color:T.text}}>{m.mvp}</div><div style={{fontSize:11,color:T.textMut}}>{m.mvpTakim}</div></div>
        </div>
      </div>}

      {/* MVP OYLAMASI (maç oynandıysa) */}
      {oynandi && oylamaKadro.length>0 && <MvpOylama m={m} turnuva={turnuva} kadro={oylamaKadro} T={T} oturum={oturum} sahiplenme={sahiplenme}/>}

      {/* SKOR DEĞİŞİKLİK GEÇMİŞİ (madde 22) */}
      {degisLog.length>0 && <div style={{padding:"10px 14px 0"}}>
        <div style={{background:T.bg1,borderRadius:14,padding:"12px 13px",border:"0.5px solid "+T.line}}>
          <div style={{fontSize:10,color:T.textMut,fontWeight:700,marginBottom:10}}>📝 SKOR DEĞİŞİKLİK GEÇMİŞİ</div>
          {degisLog.map((l,i)=>
            <div key={i} style={{display:"flex",alignItems:"center",gap:8,fontSize:11,padding:"6px 0",borderTop:i>0?"0.5px solid "+T.line:"none"}}>
              <span style={{color:T.textMut,fontFamily:T.fontDisplay}}>{(l.eski_ev==null?"–":l.eski_ev)+"-"+(l.eski_dep==null?"–":l.eski_dep)}</span>
              <span style={{color:T.textMut}}>→</span>
              <span style={{color:T.text,fontWeight:800,fontFamily:T.fontDisplay}}>{(l.yeni_ev==null?"–":l.yeni_ev)+"-"+(l.yeni_dep==null?"–":l.yeni_dep)}</span>
              <span style={{marginLeft:"auto",fontSize:9.5,color:T.textMut}}>{l.zaman?new Date(l.zaman).toLocaleString("tr-TR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}):""}</span>
            </div>
          )}
          <div style={{fontSize:9,color:T.textMut,marginTop:8,lineHeight:1.5}}>Şeffaflık için her skor değişikliği kaydedilir (ne zaman · eski→yeni).</div>
        </div>
      </div>}

      {/* GOL DAKİKALARI */}
      {goller.length>0 && <div style={{padding:"10px 14px 0"}}>
        <div style={{background:T.bg1,borderRadius:14,padding:"14px 13px",border:"0.5px solid "+T.line}}>
          <div style={{fontSize:10,color:T.textMut,fontWeight:700,marginBottom:14}}>⚽ GOL DAKİKALARI</div>
          {(()=>{
            const golT=timeline.filter(o=>o.tip==="gol");
            const evG=golT.filter(o=>o.takimA), depG=golT.filter(o=>!o.takimA);
            const sira=(liste,renk,ust)=>
              <div style={{position:"relative",height:18}}>
                {liste.map((o,i)=>
                  <div key={i} title={o.oyuncu+" "+o.dk+"'"} style={{position:"absolute",left:Math.min(97,Math.max(3,o.dk/90*100))+"%",top:0,transform:"translateX(-50%)",display:"flex",flexDirection:"column",alignItems:"center"}}>
                    <div style={{width:10,height:10,borderRadius:"50%",background:renk,border:"2px solid "+T.bg1,boxShadow:"0 0 0 1px "+renk}}/>
                    <div style={{fontSize:7,color:renk,marginTop:1,fontWeight:700}}>{o.dk}'</div>
                  </div>
                )}
              </div>;
            return <div>
              {sira(evG, "#34D399", true)}
              <div style={{height:2,background:T.bg2,borderRadius:1,margin:"4px 0"}}/>
              {sira(depG, "#5B8DEF", false)}
            </div>;
          })()}
          <div style={{display:"flex",justifyContent:"space-between",marginTop:10,fontSize:9}}><span style={{color:"#34D399",fontWeight:600}}>● {m.takimA} {aGol}</span><span style={{color:"#5B8DEF",fontWeight:600}}>{m.takimB} {bGol} ●</span></div>
        </div>
      </div>}

      {/* ZAMAN ÇİZELGESİ */}
      <div style={{padding:"10px 14px 6px"}}>
        <div style={{margin:"0 4px 10px"}}>
          <span style={{fontSize:13,fontWeight:700,color:T.text}}>⏱️ Maç Akışı</span>
        </div>
        {timeline.length===0 ? <div style={{fontSize:12,color:T.textMut,textAlign:"center",padding:16,background:T.bg1,borderRadius:12}}>Olay kaydı yok</div> :
        <div className="prem-shadow" style={{background:T.bg1,borderRadius:14,padding:6,border:"0.5px solid "+T.line}}>
          {timeline.map((o,i)=>{
            const c = o.takimA?"#34D399":"#5B8DEF";
            const tkad = o.takimA?m.takimA:m.takimB;
            // OYUNCU DEĞİŞİKLİĞİ — çıkan ↓ giren ↑
            if(o.tip==="degisik"){
              return <div key={i} className="fade-in" style={{display:"flex",alignItems:"center",gap:9,padding:"10px 11px",borderLeft:"5px solid "+c,marginBottom:4,background:o.takimA?"rgba(52,211,153,.10)":"rgba(91,141,239,.10)",borderRadius:"0 8px 8px 0",animationDelay:(i*0.05)+"s"}}>
                <span style={{fontSize:13,fontWeight:800,color:c,width:30,fontFamily:T.fontDisplay}}>{o.dk}'</span>
                <span style={{fontSize:15}}>🔁</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}}>
                    {o.giren && <span style={{fontSize:12,color:T.text,fontWeight:600}}><span style={{color:"#34D399",fontWeight:800}}>↑</span> {o.giren}</span>}
                    <span style={{fontSize:10,color:c,fontWeight:800}}>{tkad}</span>
                  </div>
                  {o.cikan && <div style={{fontSize:10,color:T.textMut,marginTop:1}}><span style={{color:T.danger,fontWeight:800}}>↓</span> {o.cikan} çıktı</div>}
                </div>
              </div>;
            }
            const ik = o.tip==="sari"?"🟨":o.tip==="kirmizi"?"🟥":"⚽";
            const etiket = o.tip==="sari"?"Sarı kart":o.tip==="kirmizi"?"Kırmızı kart":null;
            return <div key={i} className="fade-in" style={{display:"flex",alignItems:"center",gap:9,padding:"10px 11px",borderLeft:"5px solid "+c,marginBottom:4,background:o.takimA?"rgba(52,211,153,.10)":"rgba(91,141,239,.10)",borderRadius:"0 8px 8px 0",animationDelay:(i*0.05)+"s"}}>
              <span style={{fontSize:13,fontWeight:800,color:c,width:30,fontFamily:T.fontDisplay}}>{o.dk}'</span>
              <span style={{fontSize:15}}>{ik}</span>
              <div style={{flex:1,minWidth:0}}>
                <div><span style={{fontSize:12,color:T.text,fontWeight:600}}>{o.oyuncu}</span><span style={{fontSize:10,color:c,marginLeft:6,fontWeight:800}}>{tkad}</span></div>
                {(o.asist||etiket) && <div style={{fontSize:10,color:T.textMut,marginTop:1}}>{etiket || ("🅰 Asist: "+o.asist)}</div>}
              </div>
            </div>;
          })}
        </div>}
      </div>

      {/* AI MAÇ YORUMU */}
      {oynandi && <div style={{padding:"10px 14px 6px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",margin:"0 4px 10px"}}>
          <span style={{fontSize:13,fontWeight:700,color:T.text}}>🎙️ Maç Yorumu</span>
          <button onClick={()=>setYorumTohum(y=>y+1)} className="tap" style={{fontSize:11,color:T.accent2,background:T.accent2+"1A",borderRadius:8,padding:"5px 10px",fontWeight:700,border:"1px solid "+T.accent2+"44"}}>🎲 Yeniden Üret</button>
        </div>
        <div style={{background:`linear-gradient(135deg, ${T.accent2}14, ${T.bg1})`,borderRadius:14,padding:16,border:"0.5px solid "+T.accent2+"44"}}>
          <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:8}}><span style={{fontSize:16}}>🤖</span><span style={{fontSize:10,color:T.accent2,fontWeight:700,letterSpacing:.5}}>FORZALİG SPİKER</span></div>
          {(Array.isArray(yorum)?yorum:[yorum]).map((p,i)=>
            <div key={i} style={{fontSize:13,lineHeight:1.8,color:T.textSoft,marginBottom:i<(yorum.length-1)?10:0}}>{p}</div>
          )}
        </div>
      </div>}
    </div>}

    {/* ===== İSTATİSTİK ===== */}
    {macTab==="ist" && <div className="fade-in">
      <div style={{padding:"12px 14px 6px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",margin:"0 4px 10px"}}>
          <span style={{fontSize:13,fontWeight:700,color:T.text}}>📊 İstatistikler {m.istatistik && <span style={{fontSize:10,color:T.accent,fontWeight:600}}>· kaydedildi</span>}</span>
          {git && yetkili && <button onClick={()=>git({sayfa:"istatistik",mac:m,turnuva})} className="tap" style={{fontSize:11,color:T.accent,background:T.accent+"1A",borderRadius:8,padding:"5px 10px",fontWeight:700,border:"1px solid "+T.accent+"44"}}>✏️ Düzenle</button>}
        </div>
        <div style={{background:T.bg1,borderRadius:14,padding:14,border:"0.5px solid "+T.line}}>
          <KiyasSatir et="Gol" a={aGol} b={bGol} T={T}/>
          {ISTATISTIK_SATIRLAR.map(([et,af,bf,yz,ters])=>
            <KiyasSatir key={et} et={et} a={parseFloat(stat[af])} b={parseFloat(stat[bf])} yuzde={yz} ters={ters} T={T}/>
          )}
        </div>
      </div>

      {/* GOL KATKISI */}
      {golKatki.length>0 && <div style={{padding:"6px 14px"}}>
        <div style={{background:T.bg1,borderRadius:14,padding:14,border:"0.5px solid "+T.line}}>
          <div style={{fontSize:11,color:T.gold,fontWeight:700,marginBottom:10}}>⚽ GOL KATKISI</div>
          {golKatki.map((p,i)=>{
            const oyuncuObj=()=>{ if(!turnuva)return null; for(const tk of turnuva.takimlar){const o=tk.oyuncular.find(x=>x.ad===p.ad); if(o)return {...o,takimAd:tk.ad,turnuva:turnuva.ad,_adaylar:tk.oyuncular};} return null; };
            return <div key={i} onClick={()=>{const o=oyuncuObj(); if(o&&git)git({sayfa:"oyuncu",oyuncu:o});}} className={turnuva?"tap satir-hover":""} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 6px",borderBottom:i<golKatki.length-1?"0.5px solid "+T.line:"none"}}>
              <div style={{width:28,height:28,borderRadius:"50%",overflow:"hidden",flexShrink:0}} dangerouslySetInnerHTML={{__html:svgAvatar(p.ad,28,p.foto)}}/>
              <div style={{flex:1,minWidth:0}}><div style={{fontSize:12,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.ad}</div><div style={{fontSize:9,color:T.textMut}}>{p.takim}</div></div>
              {p.g>0 && <span style={{fontSize:11,color:T.accent}}>{p.g} gol</span>}
              {p.a>0 && <span style={{fontSize:11,color:T.accent2}}>{p.a} asist</span>}
              <span style={{fontSize:15,fontWeight:800,color:T.gold,width:22,textAlign:"right"}}>{p.g+p.a}</span>
            </div>;
          })}
        </div>
      </div>}

      {/* LİG ETKİSİ */}
      {ligEtki && <div style={{padding:"6px 14px"}}>
        <div style={{background:`linear-gradient(135deg, ${T.accent}20, ${T.bg1})`,borderRadius:14,padding:14,border:"0.5px solid "+T.accent+"44"}}>
          <div style={{display:"flex",alignItems:"center",gap:11,marginBottom:10}}><span style={{fontSize:24}}>📈</span><div><div style={{fontSize:9,color:T.accent,fontWeight:700}}>MAÇ SONRASI</div><div style={{fontSize:13,color:T.text,fontWeight:700}}>Güncel lig sıralaması</div></div></div>
          <div style={{display:"flex",gap:8}}>
            <div style={{flex:1,background:T.bg0,borderRadius:9,padding:9,textAlign:"center"}}><div style={{fontSize:9,color:T.textMut,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{m.takimA}</div><div style={{fontSize:15,color:T.accent,fontWeight:800,marginTop:2}}>{ligEtki.siraA}. sıra</div></div>
            <div style={{flex:1,background:T.bg0,borderRadius:9,padding:9,textAlign:"center"}}><div style={{fontSize:9,color:T.textMut,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{m.takimB}</div><div style={{fontSize:15,color:T.accent2,fontWeight:800,marginTop:2}}>{ligEtki.siraB}. sıra</div></div>
          </div>
        </div>
      </div>}

      {/* GEÇMİŞ KARŞILAŞMALAR */}
      {h2h && h2h.adet>1 && <div style={{padding:"6px 14px 6px"}}>
        <div style={{background:T.bg1,borderRadius:14,padding:14,border:"0.5px solid "+T.line}}>
          <div style={{fontSize:11,color:T.gold,fontWeight:700,marginBottom:10}}>🤝 GEÇMİŞ KARŞILAŞMALAR</div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <div style={{textAlign:"center",flex:1}}><div style={{fontSize:22,fontWeight:800,color:T.accent,fontFamily:T.fontDisplay}}>{h2h.aG}</div><div style={{fontSize:10,color:T.textMut}}>{m.takimA}</div></div>
            <div style={{textAlign:"center",flex:1}}><div style={{fontSize:22,fontWeight:800,color:T.gold,fontFamily:T.fontDisplay}}>{h2h.ber}</div><div style={{fontSize:10,color:T.textMut}}>berabere</div></div>
            <div style={{textAlign:"center",flex:1}}><div style={{fontSize:22,fontWeight:800,color:T.accent2,fontFamily:T.fontDisplay}}>{h2h.bG}</div><div style={{fontSize:10,color:T.textMut}}>{m.takimB}</div></div>
          </div>
          {h2h.maclar.filter(x=>x.id!==m.id).slice(0,3).map(x=>
            <div key={x.id} onClick={()=>git&&git({sayfa:"mac",mac:x,turnuva})} className="tap" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"7px 0",borderTop:"0.5px solid "+T.line,fontSize:12}}>
              <span style={{color:T.textMut,flex:1,textAlign:"right",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{x.takimA}</span>
              <span style={{fontWeight:700,color:T.text,fontFamily:T.fontDisplay}}>{x.skorA}-{x.skorB}</span>
              <span style={{color:T.textMut,flex:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{x.takimB}</span>
            </div>
          )}
        </div>
      </div>}
    </div>}

    {/* ===== KADRO ===== */}
    {macTab==="kadro" && <div className="fade-in" style={{padding:"12px 14px"}}>
      {kadroVar && (takimA||takimB) ? (<>
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:8}}>
          <button onClick={()=>setKadroPaylas("menu")} className="tap" style={{background:"#25D36618",border:"0.5px solid #25D36655",borderRadius:8,padding:"6px 13px",fontSize:12,color:"#25D366",fontWeight:700}}>📤 Paylaş</button>
        </div>
        {darMi ? <>
          {/* MOBİL: takım sekmesi + tek kolon tam genişlik */}
          <div style={{display:"flex",gap:6,marginBottom:12,background:T.bg1,padding:3,borderRadius:10}}>
            {[["A",m.takimA,m.renkA],["B",m.takimB,m.renkB]].map(([k,ad,rk])=>
              <span key={k} onClick={()=>setKadroTakim(k)} className="tap" style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,fontSize:11,borderRadius:8,padding:"8px 0",fontWeight:kadroTakim===k?700:500,
                color:kadroTakim===k?(T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0):T.textMut, background:kadroTakim===k?T.accent:"transparent"}}>
                <Logo renk={rk} ad={ad} boy={16}/><span style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:110}}>{ad}</span>
              </span>
            )}
          </div>
          {kadroTakim==="A"
            ? <KadroKolon takim={takimA} renk={m.renkA} ad={m.takimA} dizilis={m.dizilisA} ilk11={ilk11(m.kadroA,takimA)} olaylar={m.olaylar} ratingler={m.ratingler} T={T} git={git} turnuva={turnuva} genis/>
            : <KadroKolon takim={takimB} renk={m.renkB} ad={m.takimB} dizilis={m.dizilisB} ilk11={ilk11(m.kadroB,takimB)} olaylar={m.olaylar} ratingler={m.ratingler} T={T} git={git} turnuva={turnuva} genis/>}
        </> :
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <KadroKolon takim={takimA} renk={m.renkA} ad={m.takimA} dizilis={m.dizilisA} ilk11={ilk11(m.kadroA,takimA)} olaylar={m.olaylar} ratingler={m.ratingler} T={T} git={git} turnuva={turnuva}/>
          <KadroKolon takim={takimB} renk={m.renkB} ad={m.takimB} dizilis={m.dizilisB} ilk11={ilk11(m.kadroB,takimB)} olaylar={m.olaylar} ratingler={m.ratingler} T={T} git={git} turnuva={turnuva}/>
        </div>
      }</>) : <BosUyari T={T} metin="Kadro kurulmamış. Yukarıdaki 🧩 Kadro butonuyla diziliş kur." />}
    </div>}

    {/* ===== KADRO PAYLAŞIM OVERLAY ===== */}
    {kadroPaylas==="menu" && <div onClick={()=>setKadroPaylas(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:60,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:T.bg1,borderRadius:"18px 18px 0 0",padding:"18px 16px 26px",width:"100%",maxWidth:480,borderTop:"0.5px solid "+T.line}}>
        <div style={{width:36,height:4,borderRadius:2,background:T.line,margin:"0 auto 16px"}}/>
        <div style={{fontSize:14,color:T.text,fontWeight:700,textAlign:"center",marginBottom:14}}>Neyi paylaşmak istersin?</div>
        <button onClick={()=>setKadroPaylas("A")} className="tap" style={{width:"100%",display:"flex",alignItems:"center",gap:11,background:T.bg2,borderRadius:11,padding:13,marginBottom:8,border:"0.5px solid "+T.line}}>
          <Logo renk={m.renkA} ad={m.takimA} boy={26}/><span style={{fontSize:13,color:T.text,fontWeight:600,flex:1,textAlign:"left"}}>{m.takimA}</span><span style={{color:T.textMut}}>›</span>
        </button>
        <button onClick={()=>setKadroPaylas("B")} className="tap" style={{width:"100%",display:"flex",alignItems:"center",gap:11,background:T.bg2,borderRadius:11,padding:13,marginBottom:8,border:"0.5px solid "+T.line}}>
          <Logo renk={m.renkB} ad={m.takimB} boy={26}/><span style={{fontSize:13,color:T.text,fontWeight:600,flex:1,textAlign:"left"}}>{m.takimB}</span><span style={{color:T.textMut}}>›</span>
        </button>
        <button onClick={()=>setKadroPaylas("iki")} className="tap" style={{width:"100%",display:"flex",alignItems:"center",gap:11,background:T.accent+"18",borderRadius:11,padding:13,border:"0.5px solid "+T.accent+"55"}}>
          <span style={{fontSize:20}}>⚔️</span><span style={{fontSize:13,color:T.text,fontWeight:600,flex:1,textAlign:"left"}}>İki takım birlikte</span><span style={{color:T.textMut}}>›</span>
        </button>
        <button onClick={()=>setKadroPaylas(null)} className="tap" style={{width:"100%",marginTop:12,padding:11,background:"none",border:0,color:T.textMut,fontSize:13}}>Vazgeç</button>
      </div>
    </div>}

    {(kadroPaylas==="A"||kadroPaylas==="B"||kadroPaylas==="iki") && <div style={{position:"fixed",inset:0,background:T.bg0,zIndex:60,overflowY:"auto"}}>
      <div style={{padding:"14px 14px 40px",maxWidth:480,margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <button onClick={()=>setKadroPaylas("menu")} className="tap" style={{background:"none",border:0,color:T.textSoft,fontSize:14}}>‹ Geri</button>
          <span style={{fontSize:13,color:T.text,fontWeight:700}}>Paylaşım Kartı</span>
          <button onClick={()=>setKadroPaylas(null)} className="tap" style={{background:"none",border:0,color:T.textMut,fontSize:18}}>✕</button>
        </div>
        <div style={{fontSize:11,color:T.textMut,textAlign:"center",marginBottom:12}}>Bu kartın ekran görüntüsünü alıp paylaşabilirsin 📲</div>

        {/* PAYLAŞIM KARTI */}
        <div style={{background:`linear-gradient(150deg, ${m.renkA}1a, ${T.bg1} 50%, ${m.renkB}1a)`,borderRadius:18,padding:"16px 12px",border:"1px solid "+T.gold+"44"}}>
          {turnuva && <div style={{textAlign:"center",fontSize:9,color:T.gold,fontWeight:700,marginBottom:2}}>{turnuva.ad.toUpperCase()}</div>}
          <div style={{textAlign:"center",fontSize:9,color:T.textMut,marginBottom:14}}>{m.hafta}. HAFTA{m.tarih?" · "+(m.tarih.includes("-")?m.tarih.split("-").reverse().join("."):m.tarih):""}</div>

          {kadroPaylas==="iki" ? <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <div><div style={{textAlign:"center",fontSize:11,color:T.text,fontWeight:700,marginBottom:6}}>{m.takimA} · {m.dizilisA||"—"}</div><KadroKolon takim={takimA} renk={m.renkA} ad={m.takimA} dizilis={m.dizilisA} ilk11={ilk11(m.kadroA,takimA)} olaylar={m.olaylar} ratingler={m.ratingler} T={T} turnuva={turnuva}/></div>
            <div><div style={{textAlign:"center",fontSize:11,color:T.text,fontWeight:700,marginBottom:6}}>{m.takimB} · {m.dizilisB||"—"}</div><KadroKolon takim={takimB} renk={m.renkB} ad={m.takimB} dizilis={m.dizilisB} ilk11={ilk11(m.kadroB,takimB)} olaylar={m.olaylar} ratingler={m.ratingler} T={T} turnuva={turnuva}/></div>
          </div> : (()=>{
            const A=kadroPaylas==="A";
            return <div>
              <div style={{textAlign:"center",fontSize:14,color:T.text,fontWeight:800,marginBottom:8}}>{A?m.takimA:m.takimB} <span style={{color:T.textMut,fontWeight:400,fontSize:11}}>({(A?m.dizilisA:m.dizilisB)||"—"})</span></div>
              <KadroKolon takim={A?takimA:takimB} renk={A?m.renkA:m.renkB} ad={A?m.takimA:m.takimB} dizilis={A?m.dizilisA:m.dizilisB} ilk11={ilk11(A?m.kadroA:m.kadroB,A?takimA:takimB)} olaylar={m.olaylar} ratingler={m.ratingler} T={T} turnuva={turnuva} genis/>
            </div>;
          })()}
          <div style={{display:"flex",justifyContent:"center",marginTop:12}}><FzImza variant="dark" boy={0.82}/></div>
        </div>
      </div>
    </div>}

    {/* ===== ÖDÜLLER ===== */}
    {macTab==="odul" && <div className="fade-in" style={{padding:"12px 14px"}}>
      {oynandi && m.oduller && MAC_ODUL_ETIKET.filter(([k])=>m.oduller[k]).length>0 ? <>
        <div style={{fontSize:11,color:T.gold,fontWeight:700,margin:"0 2px 10px"}}>🏅 MAÇ ÖDÜLLERİ</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
          {MAC_ODUL_ETIKET.filter(([k])=>m.oduller[k]).map(([k,ik,ad])=>
            <div key={k} style={{display:"flex",alignItems:"center",gap:8,background:T.bg1,borderRadius:11,padding:"9px 11px",border:"0.5px solid "+T.line}}>
              <span style={{fontSize:17}}>{ik}</span>
              <div style={{minWidth:0}}><div style={{fontSize:9,color:T.textMut,fontWeight:600}}>{ad}</div><div style={{fontSize:12,fontWeight:700,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{m.oduller[k]}</div></div>
            </div>
          )}
        </div>
      </> : <BosUyari T={T} metin="Henüz maç ödülü verilmedi." />}

      {oynandi && m.ratingler && Object.keys(m.ratingler).length>0 && <div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",margin:"0 2px 10px"}}>
          <span style={{fontSize:11,color:T.accent,fontWeight:700}}>⭐ OYUNCU REYTİNGLERİ</span>
          {git && yetkili && <button onClick={()=>git({sayfa:"rating",mac:m,turnuva})} className="tap" style={{fontSize:11,color:T.accent,background:T.accent+"1A",borderRadius:8,padding:"5px 10px",fontWeight:700,border:"1px solid "+T.accent+"44"}}>✏️ Düzenle</button>}
        </div>
        <div style={{background:T.bg1,borderRadius:14,padding:12,border:"0.5px solid "+T.line}}>
          {(()=>{
            const arr=Object.entries(m.ratingler).sort((a,b)=>b[1]-a[1]).slice(0,8);
            const rRenk=(r)=> r>=8.5?T.accent : r>=7?T.gold : r>=6?T.textSoft : T.danger;
            return arr.map(([ad,r],i)=>{
              const oyuncuObj=()=>{ if(!turnuva)return null; for(const tk of turnuva.takimlar){const o=tk.oyuncular.find(x=>x.ad===ad); if(o)return {...o,takimAd:tk.ad,turnuva:turnuva.ad,_adaylar:tk.oyuncular};} return null; };
              return <div key={ad} onClick={()=>{const o=oyuncuObj(); if(o&&git)git({sayfa:"oyuncu",oyuncu:o});}} className={turnuva?"tap satir-hover":""} style={{display:"flex",alignItems:"center",gap:9,padding:"6px 6px",borderBottom:i<arr.length-1?"0.5px solid "+T.line:"none"}}>
                <span style={{fontSize:11,color:T.textMut,width:16}}>{i+1}</span>
                <div style={{width:26,height:26,borderRadius:"50%",overflow:"hidden",flexShrink:0}} dangerouslySetInnerHTML={{__html:svgAvatar(ad,26)}}/>
                <span style={{flex:1,fontSize:12,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{ad}{i===0?" 🏅":""}</span>
                <span style={{fontSize:13,fontWeight:800,fontFamily:T.fontDisplay,color:"#06140d",background:rRenk(r),borderRadius:6,padding:"2px 8px"}}>{r.toFixed(1)}</span>
              </div>;
            });
          })()}
        </div>
      </div>}

      {oynandi && git && <div style={{marginTop:14,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <button onClick={()=>git({sayfa:"gazete",mac:m,turnuva})} className="tap" style={{padding:13,borderRadius:12,background:T.bg1,color:T.text,fontSize:13,fontWeight:700,border:"0.5px solid "+T.line}}>📰 Maç Gazetesi</button>
        <button onClick={()=>git({sayfa:"afis",mac:m,turnuva})} className="tap" style={{padding:13,borderRadius:12,background:T.bg1,color:T.text,fontSize:13,fontWeight:700,border:"0.5px solid "+T.line}}>🖼️ Maç Afişi</button>
        <button onClick={()=>git({sayfa:"skorkart",mac:m,turnuva})} className="tap" style={{padding:13,borderRadius:12,background:T.gold+"14",color:T.gold,fontSize:13,fontWeight:700,border:"0.5px solid "+T.gold+"44",gridColumn:"1 / -1"}}>📲 Skor Kartı (paylaş)</button>
      </div>}
    </div>}

    {/* ===== LİG (maçtan çıkmadan lig özeti) ===== */}
    {macTab==="lig" && turnuva && <div className="fade-in" style={{padding:"12px 14px"}}>
      {/* iç alt sekmeler */}
      <div style={{display:"flex",gap:4,marginBottom:13,background:T.bg1,padding:3,borderRadius:9}}>
        {[["puan","📊 Puan"],["gol","⚽ Gol"],["asist","🎯 Asist"],["odul","🏅 Ödül"]].map(([k,et])=>
          <span key={k} onClick={()=>setLigAltTab(k)} className="tap" style={{flex:1,textAlign:"center",fontSize:10,borderRadius:7,padding:"7px 0",fontWeight:ligAltTab===k?700:500,
            color:ligAltTab===k?(T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0):T.textMut, background:ligAltTab===k?T.accent:"transparent"}}>{et}</span>
        )}
      </div>

      {/* PUAN DURUMU */}
      {ligAltTab==="puan" && (()=>{
        const sirali=[...turnuva.takimlar].sort((a,b)=>(b.puan||0)-(a.puan||0)||((b.ag-b.yg)-(a.ag-a.yg))||(b.ag-a.ag));
        return <div>
          <div style={{display:"flex",alignItems:"center",gap:7,padding:"4px 10px",fontSize:8,color:T.textMut}}>
            <span style={{width:14}}>#</span><span style={{flex:1}}>TAKIM</span><span style={{width:22,textAlign:"center"}}>O</span><span style={{width:24,textAlign:"center"}}>A</span><span style={{width:24,textAlign:"center",color:T.gold}}>P</span>
          </div>
          {sirali.map((tk,i)=>{ const bizim=(tk.ad===m.takimA||tk.ad===m.takimB); const avr=(tk.ag||0)-(tk.yg||0);
            return <div key={tk.id} onClick={()=>git&&git({sayfa:"takim",takim:tk,turnuva})} className="tap" style={{display:"flex",alignItems:"center",gap:7,background:i===0?T.gold+"12":(bizim?T.accent+"10":T.bg1),borderRadius:8,padding:"8px 10px",marginBottom:3,borderLeft:i===0?"2px solid "+T.gold:(bizim?"2px solid "+T.accent:"2px solid transparent")}}>
              <span style={{width:14,fontSize:11,fontWeight:700,color:i===0?T.gold:T.textMut,textAlign:"center"}}>{i+1}</span>
              <Logo renk={tk.renk} ad={tk.ad} logo={tk.logo} renk2={tk.renk2} boy={18}/>
              <span style={{flex:1,fontSize:11,color:T.text,fontWeight:bizim?700:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{tk.ad}</span>
              <span style={{width:22,textAlign:"center",fontSize:10,color:T.textMut}}>{tk.o||0}</span>
              <span style={{width:24,textAlign:"center",fontSize:10,color:T.textMut}}>{avr>=0?"+"+avr:avr}</span>
              <span style={{width:24,textAlign:"center",fontSize:12,color:i===0?T.gold:T.text,fontWeight:700}}>{tk.puan||0}</span>
            </div>;
          })}
        </div>;
      })()}

      {/* GOL / ASİST — KralListe ile */}
      {ligAltTab==="gol" && <KralListe alan="gol" birim="gol" T={T} git={git} turnuva={turnuva}/>}
      {ligAltTab==="asist" && <KralListe alan="asist" birim="asist" T={T} git={git} turnuva={turnuva}/>}

      {/* ÖDÜL LİDERLERİ */}
      {ligAltTab==="odul" && (()=>{
        const ODL=[["altin","🥇 Altın Top"],["gumus","🥈 Gümüş Top"],["forvet","⚡ En İyi Forvet"],["ortasaha","⚙️ En İyi Orta Saha"],["defans","🛡️ En İyi Defans"],["kaleci","🧤 En İyi Kaleci"],["macinGolu","🎯 Maçın Golü"],["centilmen","🤝 Centilmen"],["enerjik","🔥 Enerjik"]];
        const sonuc=ODL.map(([alan,ad])=>({alan,ad,lider:Motor.turnuvaOdulKrali(turnuva,alan,1)[0]})).filter(x=>x.lider);
        if(sonuc.length===0) return <BosUyari T={T} metin="Henüz ödül verilmedi." />;
        return <div>{sonuc.map(({alan,ad,lider})=>
          <div key={alan} onClick={()=>git&&git({sayfa:"oyuncu",oyuncu:{...lider,turnuva:turnuva.ad}})} className="tap" style={{display:"flex",alignItems:"center",gap:11,background:T.bg1,borderRadius:11,padding:11,marginBottom:6,border:"0.5px solid "+T.line}}>
            <span style={{fontSize:20}}>{ad.split(" ")[0]}</span>
            <div style={{flex:1,minWidth:0}}><div style={{fontSize:10,color:T.textMut}}>{ad.slice(ad.indexOf(" ")+1)}</div><div style={{fontSize:13,color:T.text,fontWeight:600}}>{lider.ad}</div></div>
            <span style={{fontSize:20,fontWeight:800,color:T.gold,fontFamily:T.fontDisplay}}>{lider[alan]}</span>
          </div>
        )}</div>;
      })()}

      {git && <button onClick={()=>git({sayfa:"turnuva",turnuva})} className="tap" style={{width:"100%",marginTop:12,padding:11,borderRadius:11,background:T.accent+"15",color:T.accent,fontSize:12,fontWeight:700,border:"0.5px solid "+T.accent+"44"}}>🏆 Lig sayfasına git ›</button>}
    </div>}

  </div>;
}

/* İstatistik karşılaştırma barı — iki yöne dolan */
function KiyasSatir({et, a, b, yuzde, ters, T}){
  const top=a+b||1; const aO=a/top*100, bO=b/top*100;
  // ters: düşük olan iyi (faul) — renk değişmez ama yine de göster
  const aIyi = ters?a<b:a>b, bIyi = ters?b<a:b>a;
  return <div style={{marginBottom:11}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4,fontSize:12}}>
      <span style={{fontWeight:700,color:aIyi?T.accent:T.text,fontFamily:T.fontDisplay}}>{a}{yuzde?"%":""}</span>
      <span style={{fontSize:10,color:T.textMut,fontWeight:600}}>{et}</span>
      <span style={{fontWeight:700,color:bIyi?T.accent2:T.text,fontFamily:T.fontDisplay}}>{b}{yuzde?"%":""}</span>
    </div>
    <div style={{display:"flex",gap:3,height:6}}>
      <div style={{flex:1,display:"flex",justifyContent:"flex-end",background:T.bg2,borderRadius:"4px 0 0 4px",overflow:"hidden"}}>
        <div className="bar-grow" style={{width:aO+"%",height:"100%",background:T.accent,borderRadius:"4px 0 0 4px",transformOrigin:"right"}}/>
      </div>
      <div style={{flex:1,background:T.bg2,borderRadius:"0 4px 4px 0",overflow:"hidden"}}>
        <div className="bar-grow" style={{width:bO+"%",height:"100%",background:T.accent2,borderRadius:"0 4px 4px 0",transformOrigin:"left"}}/>
      </div>
    </div>
  </div>;
}

/* Kadro kolonu — diziliş + ilk 11, gol/asist/kart + rating */
function KadroKolon({takim, renk, ad, dizilis, ilk11, olaylar, ratingler, T, git, turnuva, genis}){
  // genis: mobilde tek takım tam genişlik → büyük avatar/font
  const AV = genis?40:30;          // avatar boyutu
  const FN = genis?9:7;            // isim font
  const RT = genis?9:7;            // rating font
  const xMin = genis?12:18, xSpan = genis?76:64; // yatay yayılım (geniş daha çok yer kullanır)
  const ol = olaylar||[];
  const golSay={}, asistSay={}, sariSet=new Set(), kirmiziSet=new Set();
  const cikanMap={}, girenMap={}; // ad → {dk, partner}
  ol.forEach(o=>{
    if(o.tip==="gol" && o.takim===ad){ golSay[o.oyuncu]=(golSay[o.oyuncu]||0)+1; if(o.asist) asistSay[o.asist]=(asistSay[o.asist]||0)+1; }
    else if(o.tip==="sari" && o.takim===ad){ sariSet.add(o.oyuncu); }
    else if(o.tip==="kirmizi" && o.takim===ad){ kirmiziSet.add(o.oyuncu); }
    else if(o.tip==="degisik" && o.takim===ad){
      if(o.cikan) cikanMap[o.cikan]={dk:o.dk, partner:o.giren};
      if(o.giren) girenMap[o.giren]={dk:o.dk, partner:o.cikan};
    }
  });
  const [secili,setSecili]=useState(null);

  // pozisyona göre satırlara böl
  const kaleci=ilk11.filter(o=>o.poz==="Kaleci");
  const defans=ilk11.filter(o=>o.poz==="Defans");
  const orta=ilk11.filter(o=>o.poz==="OrtaSaha");
  const forvet=ilk11.filter(o=>o.poz==="Forvet");
  const satirlar = genis
    ? [{l:kaleci,y:90},{l:defans,y:68},{l:orta,y:44},{l:forvet,y:20}]
    : [{l:kaleci,y:86},{l:defans,y:63},{l:orta,y:40},{l:forvet,y:16}];
  const kaptan = ilk11.length ? ilk11.reduce((a,b)=>b.ovr>a.ovr?b:a, ilk11[0]) : null;
  const pozRenk=(p)=> p==="Kaleci"?"#FBBF24":p==="Defans"?"#5B8DEF":p==="OrtaSaha"?T.accent:"#F87171";

  // yedekler: kadroda olmayan takım oyuncuları
  const ilkIds=new Set(ilk11.map(o=>o.id));
  const yedekler = takim ? takim.oyuncular.filter(o=>!ilkIds.has(o.id)).slice(0,6) : [];

  return <div style={{background:T.bg1,borderRadius:12,padding:"12px 10px",border:"0.5px solid "+T.line}}>
    <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:8}}>
      <Logo renk={renk} ad={ad} boy={20}/>
      <div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:700,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{ad}</div></div>
      {dizilis && <span style={{fontSize:10,color:T.gold,fontWeight:700}}>{dizilis}</span>}
    </div>
    {ilk11.length===0 ? <div style={{fontSize:11,color:T.textMut,padding:"8px 0",textAlign:"center"}}>Kadro yok</div> : <>
    {/* SAHA */}
    <div style={{position:"relative",width:"100%",paddingBottom:"125%",borderRadius:10,overflow:"hidden",background:"radial-gradient(ellipse at 50% 28%,#2a7a4e 0%,#16432b 58%,#0a2718 100%)",boxShadow:"inset 0 0 30px rgba(0,0,0,.55)"}}>
      <div style={{position:"absolute",inset:0,opacity:.22}}>
        <div style={{position:"absolute",top:"50%",left:"8%",right:"8%",height:1,background:"#fff"}}/>
        <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:36,height:36,borderRadius:"50%",border:"1px solid #fff"}}/>
        <div style={{position:"absolute",bottom:0,left:"28%",right:"28%",height:"11%",border:"1px solid #fff",borderBottom:"none"}}/>
        <div style={{position:"absolute",top:0,left:"28%",right:"28%",height:"11%",border:"1px solid #fff",borderTop:"none"}}/>
      </div>
      {satirlar.map(s=>{
        const n=s.l.length;
        return s.l.map((o,i)=>{
          const x = n===1?50 : xMin+(xSpan/(n-1))*i;
          const c=pozRenk(o.poz);
          const g=golSay[o.ad]||0;
          const isKap=kaptan&&o.id===kaptan.id;
          return <div key={o.id} onClick={()=>setSecili(o)} className="tap" style={{position:"absolute",left:x+"%",top:s.y+"%",transform:"translate(-50%,-50%)",display:"flex",flexDirection:"column",alignItems:"center",cursor:"pointer",zIndex:2}}>
            <div style={{position:"relative",width:AV,height:AV}}>
              <div style={{position:"absolute",inset:-2,borderRadius:"50%",background:"radial-gradient(circle,"+c+"44,transparent 70%)"}}/>
              <div style={{position:"relative",width:AV,height:AV,borderRadius:"50%",overflow:"hidden",border:"2px solid "+c,boxShadow:"0 3px 7px rgba(0,0,0,.5),0 0 7px "+c+"55"}} dangerouslySetInnerHTML={{__html:svgAvatar(o.ad,AV,o.foto)}}/>
              {isKap && <div style={{position:"absolute",top:-3,left:-3,width:12,height:12,borderRadius:"50%",background:"linear-gradient(135deg,#FFD970,#E0A020)",color:"#3a2800",fontSize:7,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>C</div>}
              {sariSet.has(o.ad) && <div style={{position:"absolute",top:-2,right:-2,width:6,height:9,background:"#F2C200",borderRadius:1,border:"1px solid #0a2718"}}/>}
              {kirmiziSet.has(o.ad) && <div style={{position:"absolute",top:-2,right:-2,width:6,height:9,background:"#E23B3B",borderRadius:1,border:"1px solid #0a2718"}}/>}
              {cikanMap[o.ad] && <div style={{position:"absolute",bottom:-3,left:-4,background:"#0a2718",borderRadius:"50%",width:13,height:13,display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid #E23B3B"}}><span style={{fontSize:8,color:"#E23B3B",fontWeight:800,lineHeight:1}}>↓</span></div>}
              {girenMap[o.ad] && <div style={{position:"absolute",bottom:-3,left:-4,background:"#0a2718",borderRadius:"50%",width:13,height:13,display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid #34D399"}}><span style={{fontSize:8,color:"#34D399",fontWeight:800,lineHeight:1}}>↑</span></div>}
            </div>
            <div style={{fontSize:FN,color:"#fff",marginTop:2,fontWeight:600,textShadow:"0 1px 2px #000",whiteSpace:"nowrap"}}><span style={{color:T.gold,fontWeight:800}}>{o.no}</span> {o.ad.split(" ")[0]}</div>
            {ratingler && ratingler[o.ad]!=null && (()=>{ const r=ratingler[o.ad]; const rc=r>=8.5?"#1a9c5b":r>=7?"#3ea76b":r>=6?"#c4a01e":"#d3504a";
              return <div style={{fontSize:RT,fontWeight:800,color:"#fff",background:rc,borderRadius:3,padding:"0 4px",marginTop:2,fontFamily:T.fontDisplay}}>{r.toFixed(1)}</div>; })()}
            {(g>0||asistSay[o.ad]>0) && <div style={{display:"flex",gap:2,marginTop:1}}>
              {g>0 && <div style={{fontSize:genis?8:6,background:T.accent,color:"#04210f",fontWeight:800,borderRadius:3,padding:"0 3px"}}>⚽{g>1?g:""}</div>}
              {asistSay[o.ad]>0 && <div style={{fontSize:genis?8:6,background:"#5B8DEF",color:"#06143a",fontWeight:800,borderRadius:3,padding:"0 3px"}}>👟{asistSay[o.ad]>1?asistSay[o.ad]:""}</div>}
            </div>}
          </div>;
        });
      })}
    </div>
    {/* YEDEKLER */}
    {yedekler.length>0 && <div style={{marginTop:8,paddingTop:8,borderTop:"0.5px solid "+T.line}}>
      <div style={{fontSize:8,color:T.textMut,fontWeight:700,marginBottom:6}}>🪑 YEDEKLER</div>
      {yedekler.map(o=>{
        const girdi=girenMap[o.ad]; // oyuna girdiyse {dk, partner}
        const r=ratingler?ratingler[o.ad]:null;
        const rc = r!=null ? (r>=8.5?"#1a9c5b":r>=7?"#3ea76b":r>=6?"#c4a01e":"#d3504a") : null;
        return <div key={o.id} onClick={()=>setSecili(o)} className="tap" style={{display:"flex",alignItems:"center",gap:8,padding:"5px 2px",opacity:girdi?1:0.55}}>
          <div style={{width:24,height:24,borderRadius:"50%",overflow:"hidden",border:"1.5px solid "+(girdi?"#34D399":T.line),flexShrink:0}} dangerouslySetInnerHTML={{__html:svgAvatar(o.ad,24,o.foto)}}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:10,color:T.text,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}><span style={{color:T.gold,fontWeight:800}}>{o.no}</span> {o.ad}</div>
            {girdi ? <div style={{fontSize:8,color:T.textMut,marginTop:1}}><span style={{color:"#34D399",fontWeight:700}}>↑ {girdi.dk!=null&&girdi.dk!==""?girdi.dk+"'":""}</span>{girdi.partner?" · "+girdi.partner+" yerine":""}</div>
              : <div style={{fontSize:8,color:T.textMut,marginTop:1}}>oyuna girmedi</div>}
          </div>
          {r!=null && <div style={{fontSize:9,fontWeight:800,color:"#fff",background:rc,borderRadius:3,padding:"1px 5px",fontFamily:T.fontDisplay,flexShrink:0}}>{r.toFixed(1)}</div>}
        </div>;
      })}
    </div>}
    </>}

    {/* KART POPUP */}
    {secili && <div onClick={()=>setSecili(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.72)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999,padding:20}}>
      <div onClick={e=>e.stopPropagation()} className="pop" style={{width:230,maxWidth:"100%"}}>
        <div style={{position:"relative",background:"linear-gradient(160deg,#1a4d3a,#0d2a20 65%,#06140f)",border:"2px solid "+pozRenk(secili.poz),borderRadius:18,padding:"18px 16px",overflow:"hidden"}}>
          <div className="saha-holo" style={{position:"absolute",inset:0,borderRadius:18,pointerEvents:"none"}}/>
          <div style={{position:"relative",zIndex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:26,fontWeight:800,color:pozRenk(secili.poz),lineHeight:.9}}>{secili.ovr}</div>
                <div style={{fontSize:10,color:pozRenk(secili.poz),fontWeight:700}}>{secili.poz==="Kaleci"?"GK":secili.poz==="Defans"?"DEF":secili.poz==="OrtaSaha"?"ORT":"FOR"}</div>
                <div style={{fontSize:10,color:"#fff",marginTop:3}}>#{secili.no}{kaptan&&secili.id===kaptan.id?" Ⓒ":""}</div>
              </div>
              <div style={{width:60,height:60,borderRadius:"50%",overflow:"hidden",border:"2px solid "+pozRenk(secili.poz)+"88"}} dangerouslySetInnerHTML={{__html:svgAvatar(secili.ad,60,secili.foto)}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:15,fontWeight:800,color:pozRenk(secili.poz),textTransform:"uppercase",lineHeight:1.1}}>{secili.ad}</div>
                <div style={{fontSize:10,color:"#9fd",marginTop:2}}>{ad}</div>
              </div>
            </div>
            <div style={{borderTop:"1px solid "+pozRenk(secili.poz)+"55",paddingTop:10}}>
              {[["HIZ",secili.pac],["ŞUT",secili.sho],["PAS",secili.pas],["DRİ",secili.dri],["DEF",secili.def],["FİZ",secili.phy]].map(([k,v])=>
                <div key={k} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                  <span style={{fontSize:10,color:"#aab",width:30}}>{k}</span>
                  <div style={{flex:1,height:7,background:"#1A2233",borderRadius:4,overflow:"hidden"}}><div className="bar-grow" style={{height:"100%",width:v+"%",background:v>=80?T.accent:v>=60?T.accent2:T.gold,borderRadius:4}}/></div>
                  <span style={{fontSize:11,color:"#fff",fontWeight:700,width:22,textAlign:"right"}}>{v}</span>
                </div>
              )}
            </div>
            {git && <button onClick={()=>{const o=secili;setSecili(null);git({sayfa:"oyuncu",oyuncu:{...o,takimAd:ad,turnuva:turnuva?.ad}});}} className="tap" style={{width:"100%",marginTop:10,background:pozRenk(secili.poz),color:"#06281d",border:0,borderRadius:10,padding:10,fontSize:12,fontWeight:700}}>Profile Git →</button>}
          </div>
        </div>
      </div>
    </div>}
  </div>;
}

function istatistikUret(skorA, skorB){
  const r=(min,max)=>min+Math.floor(Math.random()*(max-min+1));
  const aGalip=skorA>skorB, bGalip=skorB>skorA;
  const sutA=skorA*2+r(3,8), sutB=skorB*2+r(3,8);
  let shA=r(44,56); if(aGalip)shA=Math.max(shA,52); if(bGalip)shA=Math.min(shA,48);
  const pasA=r(280,520), pasB=r(280,520);
  return {
    sahiplikA:shA, sahiplikB:100-shA,
    sutA, sutB,
    isabetA:Math.min(sutA, skorA+r(1,4)), isabetB:Math.min(sutB, skorB+r(1,4)),
    kornerA:r(2,9), kornerB:r(2,9),
    ofsaytA:r(0,4), ofsaytB:r(0,4),
    pasA, pasB,
    pasIsabetA:r(68,88), pasIsabetB:r(68,88),
    faulA:r(5,16), faulB:r(5,16),
    kurtarisA:r(2,8), kurtarisB:r(2,8),
    kosuA:(r(58,68)/10).toFixed(1), kosuB:(r(58,68)/10).toFixed(1),
  };
}
// İstatistik satır tanımları (etiket, A-alanı, B-alanı, yüzde mi, düşük-iyi mi)
const ISTATISTIK_SATIRLAR=[
  ["Topla Oynama %","sahiplikA","sahiplikB",true,false],
  ["Toplam Şut","sutA","sutB",false,false],
  ["İsabetli Şut","isabetA","isabetB",false,false],
  ["Korner","kornerA","kornerB",false,false],
  ["Ofsayt","ofsaytA","ofsaytB",false,true],
  ["Toplam Pas","pasA","pasB",false,false],
  ["Pas İsabet %","pasIsabetA","pasIsabetB",true,false],
  ["Faul","faulA","faulB",false,true],
  ["Kurtarış","kurtarisA","kurtarisB",false,false],
  ["Koşu (km)","kosuA","kosuB",false,false],
];

/* ============================================================
   FAZ 5 — AI MAÇ YORUMU (otomatik, Anadolu/halı saha ağzı, kombinasyonel)
   tohum değişince farklı yorum çıkar (yeniden üret)
   ============================================================ */
/* ============================================================
   FATİHPRO — DEV MAÇ YORUM MOTORU (offline, kombinasyonel)
   Hedef: ~9/10 doğallık. Şablon kokusu minimum.
   Mantık: maç karakteri tespit → yapı taşı havuzlarından
   bağlama duyarlı seçim → akan 3 paragraf, klişe yasaklı.
   ============================================================ */
function macYorumUret(m,turnuva,tohum){
  var A=m.takimA,B=m.takimB,sA=m.skorA||0,sB=m.skorB||0;
  var galip=sA>sB?A:sB>sA?B:null,maglup=sA>sB?B:sB>sA?A:null;
  var fark=Math.abs(sA-sB),toplam=sA+sB;
  var s=((m.id||1)*2654435761^(tohum||0)*2246822519)>>>0;
  s=((s^s>>>15)*0x85EBCA77)>>>0;s=(s^s>>>13)>>>0;
  var R=function(){s=(s^s>>>13)*0xC2B2AE35>>>0;return (s>>>0)/4294967296;};
  for(var _wu=(tohum||0)%9;_wu-->0;)R();
  var pick=function(a){return a[Math.floor(R()*a.length)];};
  var _u={};
  var pickU=function(k,a){if(!a||!a.length)return"";if(!_u[k])_u[k]=[];var h=a.filter(function(x){return _u[k].indexOf(x)<0;});if(!h.length){_u[k]=[];h=a;}var x=h[Math.floor(R()*h.length)];_u[k].push(x);return x;};
  function gS_(a,b){return Math.max(a,b)+"-"+Math.min(a,b);}
  // ---- Faz 4: Turkce cekim motoru ----
  var cek=function(w,d){
    if(w==null)return"";w=String(w);if(!w)return w;
    var low=w.toLocaleLowerCase("tr");var V="aeıioöuü";var lastV=null,i;
    for(i=low.length-1;i>=0;i--){if(V.indexOf(low[i])>=0){lastV=low[i];break;}}
    if(lastV==null)return w;
    var lastCh=low[low.length-1];var vowelEnd=V.indexOf(lastCh)>=0;
    var sert="pçtkfhsş".indexOf(lastCh)>=0;
    var ap=/^[A-ZÇĞİÖŞÜ]/.test(w[0])?"'":"";
    var back="aıou".indexOf(lastV)>=0;
    var i4=(lastV==="a"||lastV==="ı")?"ı":(lastV==="e"||lastV==="i")?"i":(lastV==="o"||lastV==="u")?"u":"ü";
    var a2=back?"a":"e";
    switch(d){
      case"i":return w+ap+(vowelEnd?"y":"")+i4;
      case"e":return w+ap+(vowelEnd?"y":"")+a2;
      case"in":return w+ap+(vowelEnd?"n":"")+i4+"n";
      case"de":return w+ap+(sert?"t":"d")+a2;
      case"den":return w+ap+(sert?"t":"d")+a2+"n";
      case"le":return w+ap+(vowelEnd?"y":"")+"l"+a2;
      default:return w;
    }
  };
  // ---- veri hazirlama ----
  var olaylar=m.olaylar||[];
  var goller=olaylar.filter(function(o){return o.tip==="gol";});
  var kirmizilar=olaylar.filter(function(o){return o.tip==="kirmizi";});
  var ist=m.istatistik,od=m.oduller||{};
  var seed2=(m.id||1)*2654435761>>>0;
  var det=function(n){var x=(seed2+n*40503)>>>0;x=(x^x>>>13)*0xC2B2AE35>>>0;return (x>>>0)/4294967296;};
  var golD=goller.map(function(g,i){return Object.assign({},g,{dk:(g.dk!=null&&g.dk!=="")?parseInt(g.dk):1+Math.floor(det(i+1)*58)});}).sort(function(a,b){return a.dk-b.dk;});
  var kirmiziD=kirmizilar.map(function(k,i){return Object.assign({},k,{dk:(k.dk!=null&&k.dk!=="")?parseInt(k.dk):5+Math.floor(det(100+i)*55)});}).sort(function(a,b){return a.dk-b.dk;});
  var takimBul=function(ad){if(!ad||!turnuva||!turnuva.takimlar)return null;for(var i=0;i<turnuva.takimlar.length;i++){var t=turnuva.takimlar[i];if((t.oyuncular||[]).some(function(o){return o.ad===ad;}))return t.ad;}return null;};
  // ---- Faz 1: skor egrisi + kirilma ----
  var ca=0,cb=0,kron=[];
  golD.forEach(function(g){if(g.takim===A)ca++;else cb++;kron.push({dk:g.dk,oyuncu:g.oyuncu,asist:g.asist,takim:g.takim,ca:ca,cb:cb,fark:ca-cb});});
  var leadChanges=0,lastNZ=0;
  kron.forEach(function(k){var sg=k.fark>0?1:k.fark<0?-1:0;if(sg!==0){if(lastNZ!==0&&sg!==lastNZ)leadChanges++;lastNZ=sg;}});
  var galipTrailed=false,trailG=0,worst=null;
  if(galip){kron.forEach(function(k){var gf=galip===A?k.fark:-k.fark;if(gf<0){galipTrailed=true;if(-gf>trailG)trailG=-gf;if(!worst||gf<worst.gf)worst={gf:gf,ca:k.ca,cb:k.cb};}});}
  var geriDonus=!!galip&&galipTrailed&&trailG>=1;
  var deficitStr=worst?((galip===A?worst.ca:worst.cb)+"-"+(galip===A?worst.cb:worst.ca)):"";
  var kirilma=null;
  if(galip){for(var i=0;i<kron.length;i++){var gf=galip===A?kron[i].fark:-kron[i].fark;if(gf>0){var holds=true;for(var j=i;j<kron.length;j++){var gf2=galip===A?kron[j].fark:-kron[j].fark;if(gf2<=0){holds=false;break;}}if(holds){kirilma=kron[i];break;}}}}
  var drawLeader=null,drawOther=null;
  if(!galip&&toplam>0){var pos=kron.some(function(k){return k.fark>0;}),neg=kron.some(function(k){return k.fark<0;});if(pos&&!neg){drawLeader=A;drawOther=B;}else if(neg&&!pos){drawLeader=B;drawOther=A;}}
  // ---- oyuncu / kaleci olgulari ----
  var golSay={};goller.forEach(function(g){golSay[g.oyuncu]=(golSay[g.oyuncu]||0)+1;});
  var enCok=Object.entries(golSay).sort(function(a,b){return b[1]-a[1];})[0];
  var hattrick=!!enCok&&enCok[1]>=3,ciftGol=!!enCok&&enCok[1]===2;
  var asistciler=[];goller.forEach(function(g){if(g.asist&&asistciler.indexOf(g.asist)<0)asistciler.push(g.asist);});
  var sonGol=golD[golD.length-1],ilkGol=golD[0];
  var sonDakika=!!galip&&!!sonGol&&sonGol.dk>=50&&fark===1&&sonGol.takim===galip;
  var kaleciKahraman=null;
  if(od.kaleci){var kr=(m.kaleciler||[]).find(function(k){return k.ad===od.kaleci;});var say=kr?kr.kurtaris:0;var ktk=takimBul(od.kaleci);var yedi=ktk?(ktk===A?sB:sA):null;if(say>=4)kaleciKahraman={ad:od.kaleci,say:say,takim:ktk,yedi:yedi};}
  var kirmiziEtkili=null;
  if(kirmiziD.length){var kk=kirmiziD[0];kirmiziEtkili={oyuncu:kk.oyuncu,takim:kk.takim,dk:kk.dk,belirleyici:!!galip&&kk.takim===maglup&&fark>=3};}
  var rating=function(ad){return m.ratingler&&m.ratingler[ad]!=null?m.ratingler[ad]:null;};
  // ---- lig baglami / surpriz ----
  var ligCtx=null,surpriz=null;
  if(galip&&turnuva&&turnuva.takimlar){var gt=turnuva.takimlar.find(function(t){return t.ad===galip;});var mt=turnuva.takimlar.find(function(t){return t.ad===maglup;});if(gt&&gt.sira){if(gt.sira===1)ligCtx={t:"lider"};else if(gt.sira<=3)ligCtx={t:"zirve",s:gt.sira};}if(gt&&mt&&gt.sira&&mt.sira&&mt.sira+4<=gt.sira)surpriz={fav:maglup,fark:gt.sira-mt.sira};}
  // ---- Faz 2: olgular + agirlik ----
  var F=[];var add=function(tip,imp,data){F.push(Object.assign({tip:tip,imp:imp},data||{}));};
  if(toplam===0)add("golsuz",5);
  if(geriDonus)add("geridonus",8+Math.min(2,trailG));
  if(sonDakika)add("sondakika",8);
  if(kirmiziEtkili&&kirmiziEtkili.belirleyici)add("kirmizi",9);else if(kirmiziEtkili)add("kirmizi",5);
  if(hattrick)add("hattrick",8);else if(ciftGol)add("ciftgol",6);
  if(kaleciKahraman)add("kaleci",toplam===0?7:(kaleciKahraman.yedi!=null&&kaleciKahraman.yedi>=2?5:6+Math.min(2,kaleciKahraman.say-4)));
  if(leadChanges>=2)add("salinim",7);
  if(!galip&&toplam>=4)add("golduello_b",6);
  if(fark>=4&&!(kirmiziEtkili&&kirmiziEtkili.belirleyici))add("tektarafli",6);
  if(surpriz)add("surpriz",7);
  if(ligCtx)add("lig",6+(ligCtx.t==="lider"?1:0));
  if(fark===1&&toplam<=3&&galip&&!sonDakika)add("cekismeli",5);
  if(!F.length)add("normal",3);
  F.sort(function(a,b){return b.imp-a.imp;});
  var enUst=F[0].imp;var adaylar=F.filter(function(f){return f.imp>=enUst-1;});
  // Faz 5: aci rotasyonu (oturum ici defter)
  if(!macYorumUret._defter)macYorumUret._defter=[];
  var def=macYorumUret._defter;
  var taze=adaylar.filter(function(f){return def.indexOf(f.tip)<0;});
  var havuz=taze.length?taze:adaylar;
  var ana=havuz[Math.floor(R()*havuz.length)];
  def.push(ana.tip);if(def.length>6)def.shift();
  // ---- Faz 3: yuzey + gonderim cesitleme ----
  var anilan={};
  var oy=function(ad,rol){if(!ad)return"";anilan[ad]=(anilan[ad]||0)+1;if(anilan[ad]===1)return ad;return rol&&R()>0.4?rol:ad;};
  // ---- P1: sahne kuran acilis + aci (hali saha tonu) ----
  var p1=[];
  var rot=function(a){return a[(Math.floor(R()*a.length)+(tohum||0))%a.length];};
  var ky=kaleciKahraman?kaleciKahraman.yedi:null;
  var mood=function(){
    if(toplam>=5)return rot(["İlk düdükle birlikte tempo tavandaydı.","Maça iki taraf da fişi çekercesine hızlı girdi.","Başlar başlamaz goller gelmeye başladı, nefes aldırmadı.","Sahaya çıkışta top durmadan gidip geldi, tempo baştan açıktı."]);
    if(toplam===0)return rot(["İlk düdükten itibaren iki taraf da temkinliydi.","Maç ağır ağır ısındı, ipler baştan gergindi.","Baştan sona dişe diş, kontrollü bir maç oldu."]);
    return rot(["İlk düdükle birlikte tempo yüksekti.","Maça iki taraf da istekli girdi.","İlk dakikalardan itibaren top hızlı gidip geldi.","Sahaya çıkışta iki takım da canlıydı, kimse geri durmadı."]);
  };
  p1.push(mood());
  var kirilmaCumle=function(){if(!kirilma||!kirilma.oyuncu)return"";return pickU("kir",["İşte o an "+kirilma.dk+"'de geldi: "+cek(kirilma.oyuncu,"in")+" golüyle "+galip+" öne geçti ve bir daha bırakmadı.",kirilma.dk+"'de "+oy(kirilma.oyuncu)+" sahneye çıktı; "+galip+" o golden sonra önü bir daha bırakmadı."]);};
  var gidisat=function(){
    if(golD.length<3)return"";
    var cl=[],prevTk=null,prevAd=null,n=0;
    for(var gi=0;gi<golD.length&&n<4;gi++){
      var g=golD[gi],ad=g.oyuncu||"";if(!ad)continue;
      var sameTk=(g.takim===prevTk),sameAd=(ad===prevAd),son=(gi===golD.length-1),kel;
      if(n===0)kel=pickU("gd0",["buzu kırdı","skoru açtı","erken vurdu"]);
      else if(sameAd)kel=pickU("gdd",["bir daha vurdu","durmadı, yine buldu","peşini bırakmadı"]);
      else if(son&&sameTk)kel=pickU("gds",["fişi çekti","işi bitirdi","farkı taşıdı"]);
      else if(sameTk)kel=pickU("gdm",["farkı büyüttü","üstünlüğü artırdı","devam etti"]);
      else kel=pickU("gdc",["cevabı yapıştırdı","karşılık buldu","bir umut yaktı"]);
      cl.push(g.dk+"'de "+ad+" "+kel);
      prevTk=g.takim;prevAd=ad;n++;
    }
    if(golD.length>4)cl.push("gerisi de arkasından geldi");
    return cl.length?cl.join(", ")+".":"";
  };
  switch(ana.tip){
    case"geridonus":
      p1.push(rot(["Ama asıl olay sonraydı: "+galip+" "+(deficitStr?deficitStr+" geriye düştü":"skoru kaptırdı")+", herkes bitti derken pes etmedi ve "+(kirilma?kirilma.dk+"'de "+cek(kirilma.oyuncu,"in")+" golüyle ":"")+"maçı çevirdi.",(deficitStr?deficitStr+" geride kalınca ":"Skoru açamayınca ")+galip+" kopmadı; derken maç tersine döndü, işte o an her şey değişti."]));
      break;
    case"sondakika":
      p1.push(rot(["Maç beraberliğe giderken tam o anda "+cek(sonGol.oyuncu,"in")+" golü geldi; "+galip+" son düdüğe saniyeler kala fişi çekti.","Son dakikalara denge ile girilmişti, derken "+oy(sonGol.oyuncu)+" sahneye çıktı ve "+galip+" maçı tam o anda kopardı."]));
      break;
    case"kirmizi":
      p1.push(rot([kirmiziEtkili.dk+"'de gelen kırmızı kartla maç koptu; "+(galip?galip+" boşluğu affetmedi, rakip toparlanamadı":"kartlı maçta iki taraf da açılamadı")+".","İşin rengi "+kirmiziEtkili.dk+"'deki kırmızıyla değişti. "+(galip?galip+" bu andan sonra yüklenmeye devam etti":"buna rağmen kazanan çıkmadı")+"."]));
      break;
    case"hattrick":
      p1.push(rot(["Gecenin adamı belli: "+enCok[0]+". Üç gol atıp maçın fişini resmen çekti, rakip toparlanamadı.",enCok[0]+" adeta tek başına maça çıktı; hat-trick yaptı, "+galip+" onun sırtında güldü."]));
      break;
    case"ciftgol":
      p1.push(rot([enCok[0]+" iki golle maçın fişini çeken isim oldu; "+galip+" büyük ölçüde ona borçlu.","İki kez ağları havalandıran "+enCok[0]+", "+cek(galip,"in")+" gecesini tek başına yazdı."]));
      break;
    case"kaleci":
      p1.push(rot([cek(kaleciKahraman.ad,"in")+" gecesiydi bu; "+kaleciKahraman.say+" kurtarışla "+(ky===0?"kaleyi kapattı, tabelayı sıfırda tuttu":(ky==null||ky<=1?"çok kritik kurtarışlara imza attı":"gole çıkan onca topu çıkardı"))+".",kaleciKahraman.ad+" kalede duvar gibiydi; "+kaleciKahraman.say+" topa çıktı, "+(ky===0?"kalesini gole kapattı":(ky==null||ky<=1?"olmasa skor bambaşkaydı":"elinden geleni yaptı"))+"."]));
      break;
    case"salinim":
      p1.push(rot(["Bir o kaleye bir bu kaleye derken skor "+leadChanges+" kez el değiştirdi; kimse durduramadı. "+A+" "+sA+"-"+sB+" "+B+".",A+" "+sA+"-"+sB+" "+B+": önce biri öne geçti, derken öbürü cevap verdi; maç resmen gidip geldi."]));
      break;
    case"golduello_b":
      if(drawLeader)p1.push(rot([drawLeader+" iki kez öne geçti ama "+drawOther+" pes etmedi, her seferinde yetişti; "+sA+"-"+sB+".",drawLeader+" öne geçmesini bildi ama "+drawOther+" kopmadı, yakaladıkça yakaladı; "+sA+"-"+sB+"."]));
      else p1.push(rot([A+" ile "+B+" gol yemeyi göze alıp hücuma çıktı; karşılıklı gollerle keyifli bir "+sA+"-"+sB+" oldu.","Goller havada uçuştu; "+A+" ile "+B+" birbirine cevap vere vere "+sA+"-"+sB+" bitirdi."]));
      break;
    case"tektarafli":
      p1.push(rot([galip+" oyunu eline aldı ve yüklenmeye devam etti; "+maglup+" toparlanamadı, "+gS_(sA,sB)+".","Maç tek tarafa aktı resmen; "+galip+" bastırdıkça bastırdı, "+cek(maglup,"i")+" "+gS_(sA,sB)+" geçti."]));
      break;
    case"surpriz":
      p1.push(rot(["Kâğıt üzerinde "+surpriz.fav+" favoriydi ama saha başka söyledi; "+galip+" "+gS_(sA,sB)+" kazanıp herkesi şaşırttı.",galip+" sürprizi yaptı: "+cek(surpriz.fav,"i")+" "+gS_(sA,sB)+" geçti, kimse beklemiyordu."]));
      break;
    case"golsuz":
      p1.push(rot([A+" ile "+B+" gol atamadan ayrıldı ama mücadele eksik değildi; iki savunma da geçit vermedi.","Goller küstü bu akşam; "+A+" ve "+B+" birbirine üstünlük kuramadı, "+sA+"-"+sB+"."]));
      break;
    case"cekismeli":
      p1.push(rot([galip+" o tek golü bulup "+cek(maglup,"i")+" "+gS_(sA,sB)+" geçti; "+(kirilma?"işte o an "+kirilma.dk+"'de "+oy(kirilma.oyuncu)+" sahneye çıktı":"tek an her şeyi belirledi")+".","Dar ama çekişmeli bir maçtı; "+galip+" fişi tek golle çekti, "+maglup+" bastırdı ama olmadı."]));
      break;
    default:
      p1.push(rot([galip?galip+" kontrollü oynadı ve "+cek(maglup,"i")+" "+gS_(sA,sB)+" geçti; işini temiz bitirdi.":A+" "+sA+"-"+sB+" "+B+"; iki taraf da elinden geleni yaptı, denge bozulmadı.",galip?galip+" maçın genelinde üstündü ve "+gS_(sA,sB)+" kazandı; hak ettiğini aldı.":"Puanlar paylaşıldı; ne "+A+" ne "+B+" pes etti."]));
  }
  var gdEklendi=false;
  if(["salinim","golduello_b"].indexOf(ana.tip)<0){var gd=gidisat();if(gd){p1.push(gd);gdEklendi=true;}}
  if(!gdEklendi){
    if(ana.tip==="normal"&&kirilma&&kirilma.oyuncu&&toplam>=2&&R()>0.5)p1.push(kirilmaCumle());
    else if(ana.tip==="geridonus"&&kirilma&&kirilma.oyuncu&&R()>0.6)p1.push(kirilmaCumle());
  }
  // ---- P2: kahramanlar (samimi) ----
  var p2=[];
  if(["hattrick","ciftgol"].indexOf(ana.tip)<0&&enCok&&enCok[1]>=2)p2.push((enCok[1]>=3?enCok[0]+" üç gol attı":enCok[0]+" iki gol attı")+", maçın fişini çeken isim oldu.");
  if(asistciler.length&&(!enCok||asistciler[0]!==enCok[0]))p2.push(pickU("as",["O golün altında "+asistciler[0]+" vardı; asisti görmek bile keyifti.",cek(asistciler[0],"in")+" o pası olmasa gol yok; ayağı bir başkaydı."]));
  if(kaleciKahraman&&ana.tip!=="kaleci")p2.push(pickU("ok",[cek(kaleciKahraman.ad,"in")+" kurtarışları olmasa skor daha başkaydı; "+(ky===0?"kaleyi kapattı":"çok uğraştı")+".",kaleciKahraman.ad+" arkada duvar gibiydi, "+kaleciKahraman.say+" topa çıktı."]));
  if(m.mvp&&(!enCok||m.mvp!==enCok[0])&&asistciler.indexOf(m.mvp)<0&&(!kaleciKahraman||m.mvp!==kaleciKahraman.ad))p2.push(m.mvp+" sahanın her yerindeydi; maçın adamı seçilmesi kimseyi şaşırtmadı.");
  // ---- P3: sicak, degisken kapanis (istatistik yok) ----
  var p3=[];
  var kapanis="";
  if(galip){
    kapanis=rot(["Son düdük çaldığında sahadan gülerek ayrılan taraf "+galip+" oldu.",galip+" bu akşam işini bitirdi; keyifli, moralli bir galibiyet.","Maç bitince kazanan belliydi: "+galip+". Rakip elinden geleni yaptı ama olmadı.",galip+" üç puanı cebe koydu, saha çıkışı keyifliydi."]);
    if(ligCtx&&ligCtx.t==="lider")kapanis+=" Bu gidişle zirveyi kolay kolay bırakmaz.";
    else if(ligCtx&&ligCtx.t==="zirve")kapanis+=" Zirve yarışında iddiasını sürdürdü.";
  }else{
    kapanis=rot(["Son düdükte kazanan çıkmadı ama izleyen kazandı; iki taraf da başı dik ayrıldı.","Puanlar bölüşüldü; ne "+A+" ne "+B+" pes etti, güzel maçtı.","Berabere bitti ama tempo doyurdu; iki takım da alnının akıyla çıktı."]);
  }
  p3.push(kapanis);
  // ---- montaj ----
  var bag=function(arr){return arr.filter(function(x){return x&&x.trim();}).join(" ").replace(/\s+/g," ").trim();};
  var paras=[bag(p1),bag(p2),bag(p3)].filter(function(x){return x.length>0;});
  var zengin=toplam+F.length+(ana.imp>=8?2:0);
  if(zengin<4&&paras.length>1)paras=[bag(paras)];
  return paras;
}

function mansetUret(m, tohum){
  let s=((m.id||1)*99991 ^ (tohum||0)*7)>>>0;
  const sec=(arr)=>{ s=(s^(s>>>13))*0xC2B2AE35>>>0; return arr[Math.floor(((s>>>0)/4294967296)*arr.length)]; };
  const sA=m.skorA||0, sB=m.skorB||0;
  const galip=sA>sB?m.takimA:(sB>sA?m.takimB:null);
  const maglup=sA>sB?m.takimB:(sB>sA?m.takimA:null);
  const gS=Math.max(sA,sB), mS=Math.min(sA,sB), fark=Math.abs(sA-sB), toplam=sA+sB;
  const goller=(m.olaylar||[]).filter(o=>o.tip==="gol");
  const golSay={}; goller.forEach(g=>{golSay[g.oyuncu]=(golSay[g.oyuncu]||0)+1;});
  const yildiz=Object.entries(golSay).sort((a,b)=>b[1]-a[1])[0];
  let kategori, baslik, spot;
  // başlık seçimi (büyük harf, vurgulu)
  if(yildiz && yildiz[1]>=3){ kategori="Tek Adamlık Şov"; baslik=sec([`${yildiz[0].toUpperCase()} DURDURULAMADI`,`SAHNE ${yildiz[0].toUpperCase()}'IN`,`${yildiz[0].toUpperCase()} TEK BAŞINA YETTİ`]); }
  else if(!galip && toplam>=4){ kategori="Gol Düellosu"; baslik=sec(["GOLLER SUSMADI","KARŞILIKLI ŞÖLEN","KİMSE KAYBETMEDİ"]); }
  else if(!galip){ kategori="Dengeli Maç"; baslik=sec(["PUANLAR PAYLAŞILDI","TERAZİ BOZULMADI","KISMET YOK"]); }
  else if(toplam>=7){ kategori="Çılgın Maç"; baslik=sec([`GOL YAĞMURUNDA ${galip.toUpperCase()}`,`${toplam} GOLLÜ ÇILGINLIK`,`SAVUNMALAR UYUDU, ${galip.toUpperCase()} GÜLDÜ`]); }
  else if(fark>=4){ kategori="Tek Taraflı"; baslik=sec([`${galip.toUpperCase()} FIRTINASI`,`${galip.toUpperCase()} EZDİ GEÇTİ`,`${galip.toUpperCase()} GÖVDE GÖSTERİSİ`]); }
  else if(fark===1){ kategori="Kıl Payı"; baslik=sec([`${galip.toUpperCase()} KILPAYI GÜLDÜ`,`TEK GOL YETTİ`,`${galip.toUpperCase()} SON ANDA`]); }
  else { kategori="Maç Raporu"; baslik=sec([`${galip.toUpperCase()} GÜLDÜ`,`3 PUAN ${galip.toUpperCase()}'IN`,`${galip.toUpperCase()} İŞİNİ BİLDİ`]); }
  // spot cümlesi
  if(galip) spot=sec([`${galip}, ${maglup} karşısında ${gS}-${mS}'lik skorla sahadan güle oynaya ayrıldı.`,`${gS}-${mS}'lik sonuçla ${galip} üç puanın sahibi oldu.`,`${galip} kazandı, ${maglup} bu maçı hızlı unutmak isteyecek.`]);
  else spot=sec([`${sA}-${sB}'lik skorla iki takım da sahadan başı dik ayrıldı.`,`Kazananın çıkmadığı maçta puanlar bölüşüldü.`]);
  return { kategori, baslik, spot };
}

// Maç ödül kategorileri (maça kayıtlı oduller objesi için etiketler)
const MAC_ODUL_ETIKET=[
  ["mvp","🌟","Maçın Yıldızı"],["macinGolu","🎯","Maçın Golü"],["forvet","⚽","En İyi Forvet"],
  ["ortasaha","🎩","En İyi Orta Saha"],["defans","🛡️","En İyi Defans"],["kaleci","🧤","En İyi Kaleci"],
  ["altin","🥇","Altın Madalya"],["gumus","🥈","Gümüş Madalya"],["enerjik","⚡","En Enerjik"],["centilmen","🤝","Centilmen"],
];

// Maç sonu oyuncu rating'i otomatik hesapla (6.0-10.0). kadro: o maçta oynayanlar
function ratingHesapla(mac, takimA, takimB){
  const r={};
  const olaylar=mac.olaylar||[];
  const golSay={}, asistSay={}, sariSet=new Set(), kirmiziSet=new Set();
  olaylar.forEach(o=>{
    if(o.tip==="gol"){ golSay[o.oyuncu]=(golSay[o.oyuncu]||0)+1; if(o.asist)asistSay[o.asist]=(asistSay[o.asist]||0)+1; }
    else if(o.tip==="sari") sariSet.add(o.oyuncu);
    else if(o.tip==="kirmizi") kirmiziSet.add(o.oyuncu);
  });
  const sA=mac.skorA||0, sB=mac.skorB||0;
  const hesapla=(oyuncular, takimAd, kendiSkor, rakipSkor)=>{
    const galip=kendiSkor>rakipSkor, beraber=kendiSkor===rakipSkor;
    oyuncular.forEach(o=>{
      let p=6.0;
      p += (golSay[o.ad]||0)*0.85;
      p += (asistSay[o.ad]||0)*0.55;
      if(mac.mvp===o.ad) p+=1.4;
      if(o.poz==="Kaleci"){ p += galip?0.6:0; p -= rakipSkor*0.18; if(rakipSkor===0)p+=0.8; }
      if(galip)p+=0.5; else if(beraber)p+=0.15; else p-=0.2;
      if(sariSet.has(o.ad))p-=0.4;
      if(kirmiziSet.has(o.ad))p-=1.2;
      p += (o.ovr-70)/55; // yetenek hafif etki
      p = Math.max(4.5, Math.min(10, p));
      r[o.ad]=Math.round(p*10)/10;
    });
  };
  if(takimA) hesapla(takimA.oyuncular, takimA.ad, sA, sB);
  if(takimB) hesapla(takimB.oyuncular, takimB.ad, sB, sA);
  return r;
}

// Diziliş şablonları — her kişi sayısı için formasyon listesi.
// satir: kaleci HARİÇ, savunmadan ileriye doğru [{poz, n}] (slotlariUret kaleciyi otomatik ekler)
const DIZILIS_SABLON = {
  7: [
    {ad:"2-3-1", satir:[{poz:"Defans",n:2},{poz:"OrtaSaha",n:3},{poz:"Forvet",n:1}]},
    {ad:"3-2-1", satir:[{poz:"Defans",n:3},{poz:"OrtaSaha",n:2},{poz:"Forvet",n:1}]},
    {ad:"2-2-2", satir:[{poz:"Defans",n:2},{poz:"OrtaSaha",n:2},{poz:"Forvet",n:2}]},
    {ad:"3-1-2", satir:[{poz:"Defans",n:3},{poz:"OrtaSaha",n:1},{poz:"Forvet",n:2}]},
  ],
  8: [
    {ad:"3-3-1", satir:[{poz:"Defans",n:3},{poz:"OrtaSaha",n:3},{poz:"Forvet",n:1}]},
    {ad:"3-2-2", satir:[{poz:"Defans",n:3},{poz:"OrtaSaha",n:2},{poz:"Forvet",n:2}]},
    {ad:"2-3-2", satir:[{poz:"Defans",n:2},{poz:"OrtaSaha",n:3},{poz:"Forvet",n:2}]},
    {ad:"4-2-1", satir:[{poz:"Defans",n:4},{poz:"OrtaSaha",n:2},{poz:"Forvet",n:1}]},
  ],
  9: [
    {ad:"3-3-2", satir:[{poz:"Defans",n:3},{poz:"OrtaSaha",n:3},{poz:"Forvet",n:2}]},
    {ad:"4-3-1", satir:[{poz:"Defans",n:4},{poz:"OrtaSaha",n:3},{poz:"Forvet",n:1}]},
    {ad:"3-4-1", satir:[{poz:"Defans",n:3},{poz:"OrtaSaha",n:4},{poz:"Forvet",n:1}]},
    {ad:"4-2-2", satir:[{poz:"Defans",n:4},{poz:"OrtaSaha",n:2},{poz:"Forvet",n:2}]},
  ],
  10: [
    {ad:"4-3-2", satir:[{poz:"Defans",n:4},{poz:"OrtaSaha",n:3},{poz:"Forvet",n:2}]},
    {ad:"3-4-2", satir:[{poz:"Defans",n:3},{poz:"OrtaSaha",n:4},{poz:"Forvet",n:2}]},
    {ad:"4-4-1", satir:[{poz:"Defans",n:4},{poz:"OrtaSaha",n:4},{poz:"Forvet",n:1}]},
    {ad:"3-3-3", satir:[{poz:"Defans",n:3},{poz:"OrtaSaha",n:3},{poz:"Forvet",n:3}]},
  ],
  11: [
    {ad:"4-4-2", satir:[{poz:"Defans",n:4},{poz:"OrtaSaha",n:4},{poz:"Forvet",n:2}]},
    {ad:"4-3-3", satir:[{poz:"Defans",n:4},{poz:"OrtaSaha",n:3},{poz:"Forvet",n:3}]},
    {ad:"3-5-2", satir:[{poz:"Defans",n:3},{poz:"OrtaSaha",n:5},{poz:"Forvet",n:2}]},
    {ad:"4-5-1", satir:[{poz:"Defans",n:4},{poz:"OrtaSaha",n:5},{poz:"Forvet",n:1}]},
  ],
};

// Bir formasyondan slot listesi üret: [{poz, x%, y%}] (kaleci + satırlar)
function slotlariUret(sablon){
  const slots=[{poz:"Kaleci", x:50, y:88}];
  const yBaslangic=68, yBitis=16;
  const satirSay=sablon.satir.length;
  sablon.satir.forEach((s,si)=>{
    const y = satirSay===1?42 : yBaslangic - (yBaslangic-yBitis)*(si/(satirSay-1));
    for(let i=0;i<s.n;i++){
      const x = s.n===1?50 : 14 + (72/(s.n-1))*i;
      slots.push({poz:s.poz, x, y});
    }
  });
  return slots;
}

function MacKurulum({mac, turnuva, T, git, kaydet}){
  const takimA = turnuva.takimlar.find(t=>t.id===mac.takimAId) || turnuva.takimlar.find(t=>t.ad===mac.takimA);
  const takimB = turnuva.takimlar.find(t=>t.id===mac.takimBId) || turnuva.takimlar.find(t=>t.ad===mac.takimB);
  const [aktifTakim,setAktifTakim]=useState("A");
  const takim = aktifTakim==="A"?takimA:takimB;
  const renk = aktifTakim==="A"?mac.renkA:mac.renkB;

  // maç bilgileri
  const [tarih,setTarih]=useState(mac.tarih||"");
  const [saat,setSaat]=useState(mac.saat||"");
  const [stadyum,setStadyum]=useState(mac.stadyum||"");
  const [hakem,setHakem]=useState(mac.hakem||"");
  const [hakemHavuz,setHakemHavuz]=useState([]);   // kayıtlı hakemler (profiller · roller.hakem)
  const [hakemModal,setHakemModal]=useState(false);
  useEffect(()=>{ let a=true; Db.hakemHavuzu().then(h=>{ if(a) setHakemHavuz(h||[]); }); return ()=>{a=false;}; },[]);

  // kişi sayısı — LİG AYARINDAN gelir, iki takım da aynı (tutarlı)
  const ligKisi = turnuva.kisi || mac.kisiSayi?.A || 7;
  const [kisiSayi,setKisiSayi]=useState({A:ligKisi,B:ligKisi});
  const [formIdx,setFormIdx]=useState({A:0,B:0});
  const ks = kisiSayi[aktifTakim];
  const formListe = DIZILIS_SABLON[ks];
  const sablon = formListe[formIdx[aktifTakim]] || formListe[0];
  const slots = useMemo(()=>slotlariUret(sablon),[sablon]);

  // her takım için saha kadrosu: slotIdx → oyuncuId  ve yedekler
  // ilk kurulumda otomatik doldur (pozisyona uygun + ovr yüksek)
  const otomatikDiz = (tk, slotlar)=>{
    const havuz=[...tk.oyuncular].sort((a,b)=>b.ovr-a.ovr);
    const kullanildi=new Set();
    const yerlesim=slotlar.map(sl=>{
      let aday=havuz.find(o=>!kullanildi.has(o.id)&&o.poz===sl.poz) || havuz.find(o=>!kullanildi.has(o.id));
      if(aday) kullanildi.add(aday.id);
      return aday?aday.id:null;
    });
    const yedek=havuz.filter(o=>!kullanildi.has(o.id)).map(o=>o.id);
    return {yerlesim, yedek};
  };

  const [kadro,setKadro]=useState(()=>({
    A: otomatikDiz(takimA, slotlariUret(DIZILIS_SABLON[7][0])),
    B: otomatikDiz(takimB, slotlariUret(DIZILIS_SABLON[7][0])),
  }));

  // formasyon/kişi değişince aktif takımı yeniden diz
  const yenidenDiz = (yeniKs, yeniForm)=>{
    const sl=slotlariUret(DIZILIS_SABLON[yeniKs][yeniForm]);
    setKadro(k=>({...k, [aktifTakim]: otomatikDiz(takim, sl)}));
  };
  const kisiDegis=(yeni)=>{ setSecili(null); setKisiSayi(s=>({...s,[aktifTakim]:yeni})); setFormIdx(f=>({...f,[aktifTakim]:0})); yenidenDiz(yeni,0); };
  const formDegis=(idx)=>{ setSecili(null); setFormIdx(f=>({...f,[aktifTakim]:idx})); yenidenDiz(ks,idx); };

  const aktKadro = kadro[aktifTakim];
  const oyuncuBul=(id)=> takim.oyuncular.find(o=>o.id===id);

  // —— ORTAK TAKAS MANTIĞI ——
  // ref: {kaynak:'slot'|'yedek', idx}
  const takasYap = (a, b)=>{
    if(!a || !b) return;
    if(a.kaynak===b.kaynak && a.idx===b.idx) return; // aynı yer
    setKadro(k=>{
      const kk={...k}; const mevcut=k[aktifTakim]; const cur={yerlesim:[...mevcut.yerlesim], yedek:[...mevcut.yedek]};
      if(a.kaynak==="slot" && b.kaynak==="slot"){
        const x=cur.yerlesim[a.idx]; cur.yerlesim[a.idx]=cur.yerlesim[b.idx]; cur.yerlesim[b.idx]=x;
      } else if(a.kaynak==="yedek" && b.kaynak==="slot"){
        const gelen=cur.yedek[a.idx], giden=cur.yerlesim[b.idx];
        cur.yerlesim[b.idx]=gelen; cur.yedek.splice(a.idx,1); if(giden!=null) cur.yedek.push(giden);
      } else if(a.kaynak==="slot" && b.kaynak==="yedek"){
        const gelen=cur.yedek[b.idx], giden=cur.yerlesim[a.idx];
        cur.yerlesim[a.idx]=gelen; cur.yedek.splice(b.idx,1); if(giden!=null) cur.yedek.push(giden);
      } else { // yedek-yedek
        const x=cur.yedek[a.idx]; cur.yedek[a.idx]=cur.yedek[b.idx]; cur.yedek[b.idx]=x;
      }
      kk[aktifTakim]=cur; return kk;
    });
  };

  // —— TIKLA-SEÇ-TIKLA ——
  const [secili,setSecili]=useState(null); // {kaynak, idx}
  const tikla = (kaynak, idx)=>{
    if(!secili){ setSecili({kaynak,idx}); return; }
    takasYap(secili, {kaynak,idx});
    setSecili(null);
  };

  // Saha referansı (artık sürükleme yok — tıkla-seç-yerleştir)
  const sahaRef=useRef(null);
  const hedefSlot=null; // sürükleme kaldırıldı

  const sahadaSayi = aktKadro.yerlesim.filter(x=>x!=null).length;
  const seciliOyuncu = secili ? (secili.kaynak==="slot"?oyuncuBul(aktKadro.yerlesim[secili.idx]):oyuncuBul(aktKadro.yedek[secili.idx])) : null;

  // Sahadaki oyuncuyu yedeğe gönder (tek dokunuş kısayolu)
  const yedegeGonder = (slotIdx)=>{
    setKadro(k=>{ const kk={...k}; const m=k[aktifTakim]; const cur={yerlesim:[...m.yerlesim],yedek:[...m.yedek]};
      const giden=cur.yerlesim[slotIdx]; if(giden!=null){ cur.yerlesim[slotIdx]=null; cur.yedek.push(giden); }
      kk[aktifTakim]=cur; return kk; });
    setSecili(null);
  };

  const kaydetKadro=()=>{
    const paket={
      tarih, saat, stadyum, hakem,
      kadroA: kadro.A, kadroB: kadro.B,
      dizilisA: DIZILIS_SABLON[kisiSayi.A][formIdx.A].ad,
      dizilisB: DIZILIS_SABLON[kisiSayi.B][formIdx.B].ad,
    };
    kaydet(paket);
  };

  return <div className="fade-in" style={{paddingBottom:90}}>
    <Baslik ust="MAÇ KURULUMU" ana={`${mac.takimA} — ${mac.takimB}`} T={T}/>

    {/* MAÇ BİLGİLERİ */}
    <div style={{padding:"4px 14px"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <BilgiAlan ik="📅" et="Tarih" deger={tarih} onChange={setTarih} ph="19.06.2026" T={T}/>
        <BilgiAlan ik="⏰" et="Saat" deger={saat} onChange={setSaat} ph="20:30" T={T}/>
        <BilgiAlan ik="🏟️" et="Stadyum" deger={stadyum} onChange={setStadyum} ph="Saha adı" T={T}/>
        <BilgiAlan ik="👨‍⚖️" et="Hakem" deger={hakem} onChange={setHakem} ph="Hakem adı" T={T}/>
      </div>
      {hakemHavuz.length>0 && <button onClick={()=>setHakemModal(true)} className="tap" style={{marginTop:8,fontSize:11.5,fontWeight:700,color:T.accent2||T.accent,background:(T.accent2||T.accent)+"14",border:"0.5px solid "+(T.accent2||T.accent)+"40",borderRadius:9,padding:"7px 12px"}}>🧑‍⚖️ Havuzdan hakem seç ({hakemHavuz.length})</button>}
    </div>
    {hakemModal && <div onClick={()=>setHakemModal(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:1600,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} className="fade-in" style={{width:"100%",maxWidth:460,maxHeight:"72vh",overflowY:"auto",background:T.bg1,borderRadius:"18px 18px 0 0",padding:"16px 16px calc(20px + env(safe-area-inset-bottom))",border:"0.5px solid "+T.line}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}><span style={{fontSize:15,fontWeight:800,color:T.text}}>🧑‍⚖️ Hakem Havuzu</span><span onClick={()=>setHakemModal(false)} className="tap" style={{fontSize:13,color:T.textMut,cursor:"pointer"}}>Kapat</span></div>
        {hakemHavuz.map(h=><div key={h.user_id} onClick={()=>{ setHakem(h.ad||h.email||"Hakem"); setHakemModal(false); }} className="tap" style={{display:"flex",alignItems:"center",gap:11,padding:"10px 8px",borderRadius:10,borderBottom:"0.5px solid "+T.line}}>
          <div style={{width:34,height:34,borderRadius:"50%",overflow:"hidden",flexShrink:0,background:T.bg2}} dangerouslySetInnerHTML={{__html:svgAvatar(h.ad||"Hakem",34,h.foto)}}/>
          <div style={{flex:1,minWidth:0}}><div style={{fontSize:13.5,fontWeight:700,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{h.ad||h.email}</div><div style={{fontSize:11,color:T.textMut}}>{h.sehir||"—"}</div></div>
          <span style={{fontSize:12,color:T.accent,fontWeight:700}}>Seç ›</span>
        </div>)}
      </div>
    </div>}

    {/* TAKIM SEÇİCİ */}
    <div style={{display:"flex",gap:8,padding:"12px 14px 6px"}}>
      {[["A",takimA,mac.renkA],["B",takimB,mac.renkB]].map(([k,t,c])=>
        <div key={k} onClick={()=>{setAktifTakim(k);setSecili(null);}} className="tap" style={{flex:1,display:"flex",alignItems:"center",gap:8,padding:"10px 12px",borderRadius:11,
          background:aktifTakim===k?c+"22":T.bg1,border:"1px solid "+(aktifTakim===k?c:T.line)}}>
          <Logo renk={c} ad={t.ad} boy={26}/>
          <span style={{fontSize:13,fontWeight:700,color:aktifTakim===k?T.text:T.textMut,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.ad}</span>
        </div>
      )}
    </div>

    {/* KİŞİ SAYISI — LİG AYARINDAN (kilitli, tutarlılık için) */}
    <div style={{padding:"6px 14px"}}>
      <div style={{fontSize:10,color:T.textMut,fontWeight:700,marginBottom:6,letterSpacing:.4}}>SAHA KİŞİ SAYISI</div>
      <div style={{display:"flex",alignItems:"center",gap:8,background:T.bg1,border:"0.5px solid "+T.line,borderRadius:10,padding:"10px 13px"}}>
        <span style={{fontSize:18,fontWeight:800,color:T.accent,fontFamily:T.fontDisplay}}>{ligKisi}</span>
        <span style={{fontSize:12,color:T.text}}>kişilik</span>
        <span style={{flex:1}}></span>
        <span style={{fontSize:9,color:T.textMut}}>🔒 Lig ayarı · iki takım da {ligKisi} kişi</span>
      </div>
    </div>

    {/* FORMASYON */}
    <div style={{padding:"8px 14px"}}>
      <div style={{fontSize:10,color:T.textMut,fontWeight:700,marginBottom:6,letterSpacing:.4}}>DİZİLİŞ</div>
      <div style={{display:"flex",gap:6}}>
        {formListe.map((f,i)=>
          <div key={i} onClick={()=>formDegis(i)} className="tap" style={{flex:1,textAlign:"center",padding:"9px 0",borderRadius:9,fontSize:13,fontWeight:700,
            background:formIdx[aktifTakim]===i?T.gold+"22":T.bg1,color:formIdx[aktifTakim]===i?T.gold:T.textMut,border:"0.5px solid "+(formIdx[aktifTakim]===i?T.gold+"77":T.line)}}>{f.ad}</div>
        )}
      </div>
    </div>

    {/* SAHA */}
    <div style={{padding:"8px 14px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <span style={{fontSize:11,color:T.accent,fontWeight:700}}>⚽ SAHADA ({sahadaSayi}/{ks})</span>
        <span style={{fontSize:10,color:T.textMut}}>oyuncuya dokun → hedefe dokun</span>
      </div>

      {/* seçili bilgi çubuğu */}
      {seciliOyuncu && <div className="fade-in" style={{display:"flex",alignItems:"center",gap:9,background:T.accent+"1A",borderRadius:10,padding:"8px 11px",marginBottom:8,border:"1px solid "+T.accent+"55"}}>
        <Avatar o={seciliOyuncu} boy={28} T={T}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:12,fontWeight:700,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{seciliOyuncu.ad} seçili</div>
          <div style={{fontSize:10,color:T.textSoft}}>Yer değiştirmek için hedefe dokun</div>
        </div>
        {secili.kaynak==="slot" && <button onClick={()=>yedegeGonder(secili.idx)} className="tap" style={{fontSize:11,color:T.gold,background:T.gold+"22",borderRadius:8,padding:"5px 10px",fontWeight:600}}>↓ Yedeğe</button>}
        <button onClick={()=>setSecili(null)} className="tap" style={{fontSize:11,color:T.textMut,background:T.bg2,borderRadius:8,padding:"5px 10px",fontWeight:600}}>İptal</button>
      </div>}

      <div ref={sahaRef} style={{position:"relative",width:"100%",paddingBottom:"122%",borderRadius:14,overflow:"hidden",border:"1px solid "+T.line}}>
        {/* çim zemini + şeritler */}
        <div style={{position:"absolute",inset:0,background:"#1e7a40"}}>
          {[0,1,2,3,4,5,6,7].map(i=>
            <div key={i} style={{position:"absolute",left:0,right:0,top:(i*12.5)+"%",height:"12.5%",background:i%2===0?"rgba(0,0,0,.07)":"transparent"}}/>
          )}
        </div>
        {/* çizgiler */}
        <div style={{position:"absolute",inset:0,opacity:.55}}>
          <div style={{position:"absolute",top:"2.5%",bottom:"2.5%",left:"3%",right:"3%",border:"2px solid rgba(255,255,255,.6)",borderRadius:3}}/>
          <div style={{position:"absolute",top:"50%",left:"3%",right:"3%",height:2,background:"rgba(255,255,255,.6)"}}/>
          <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:"24%",paddingBottom:"24%",borderRadius:"50%",border:"2px solid rgba(255,255,255,.6)"}}/>
          <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:6,height:6,borderRadius:"50%",background:"rgba(255,255,255,.7)"}}/>
          <div style={{position:"absolute",bottom:"2.5%",left:"24%",right:"24%",height:"14%",border:"2px solid rgba(255,255,255,.6)",borderBottom:"none"}}/>
          <div style={{position:"absolute",bottom:"2.5%",left:"37%",right:"37%",height:"6%",border:"2px solid rgba(255,255,255,.6)",borderBottom:"none"}}/>
          <div style={{position:"absolute",top:"2.5%",left:"24%",right:"24%",height:"14%",border:"2px solid rgba(255,255,255,.6)",borderTop:"none"}}/>
          <div style={{position:"absolute",top:"2.5%",left:"37%",right:"37%",height:"6%",border:"2px solid rgba(255,255,255,.6)",borderTop:"none"}}/>
        </div>
        {/* slotlar */}
        {slots.map((sl,i)=>{
          const oid=aktKadro.yerlesim[i]; const o=oid!=null?oyuncuBul(oid):null;
          const aktif=hedefSlot===i;
          const buSecili = secili&&secili.kaynak==="slot"&&secili.idx===i;
          const hedefVurgu = secili && !buSecili; // bir şey seçiliyken tüm slotlar hedef olabilir
          return <div key={i} data-slot={i}
            onClick={()=>{ if(secili){ takasYap(secili,{kaynak:"slot",idx:i}); setSecili(null); } else if(o){ setSecili({kaynak:"slot",idx:i}); } }}
            style={{position:"absolute",top:sl.y+"%",left:sl.x+"%",transform:"translate(-50%,-50%)",width:50,height:62,borderRadius:10,cursor:"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",
            background:o?(buSecili?T.accent+"55":"transparent"):(hedefVurgu?"rgba(255,255,255,.2)":"rgba(255,255,255,.14)"),
            border:o?(buSecili?"2px solid "+T.accent:"none"):"1.5px dashed rgba(255,255,255,.55)",
            boxShadow:hedefVurgu&&!o?"0 0 0 2px "+T.accent+"55":"none"}}>
            {o ? <div style={{display:"flex",flexDirection:"column",alignItems:"center",opacity:buSecili?.55:1,pointerEvents:"none"}}>
              <div style={{width:34,height:34,borderRadius:"50%",overflow:"hidden",border:"2px solid "+(buSecili?T.accent:renk),boxShadow:"0 2px 5px rgba(0,0,0,.4)"}} dangerouslySetInnerHTML={{__html:svgAvatar(o.ad,34,o.foto)}}/>
              <div style={{fontSize:8,color:"#fff",fontWeight:600,marginTop:2,textShadow:"0 1px 2px #000",whiteSpace:"nowrap"}}>{o.ad.split(" ")[0]}</div>
              <div style={{fontSize:8,background:T.gold,color:"#1A1505",fontWeight:700,borderRadius:3,padding:"0 4px"}}>{o.ovr}</div>
            </div> : <span style={{fontSize:18,color:"rgba(255,255,255,.45)",pointerEvents:"none"}}>+</span>}
          </div>;
        })}
      </div>
    </div>

    {/* YEDEK KULÜBESİ */}
    <div style={{padding:"6px 14px"}} data-yedek-bos="1">
      <div style={{fontSize:11,color:T.textMut,fontWeight:700,marginBottom:8}}>🔄 YEDEK KULÜBESİ ({aktKadro.yedek.length}) <span style={{fontWeight:400,fontSize:10}}>— dokun ya da sahaya sürükle</span></div>
      <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:6}}>
        {aktKadro.yedek.length===0 ? <div style={{fontSize:11,color:T.textMut,padding:8}}>Tüm oyuncular sahada</div> :
          aktKadro.yedek.map((oid,i)=>{ const o=oyuncuBul(oid); if(!o) return null;
            const buSecili = secili&&secili.kaynak==="yedek"&&secili.idx===i;
            return <div key={oid}
              onClick={()=>{ if(secili){ takasYap(secili,{kaynak:"yedek",idx:i}); setSecili(null); } else { setSecili({kaynak:"yedek",idx:i}); } }}
              className="tap" style={{flexShrink:0,width:62,display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",
                background:buSecili?T.accent+"22":T.bg1,borderRadius:10,padding:"8px 4px",border:"1px solid "+(buSecili?T.accent:T.line)}}>
              <Avatar o={o} boy={32} T={T}/>
              <div style={{fontSize:10,color:T.text,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:"100%"}}>{o.ad.split(" ")[0]}</div>
              <div style={{fontSize:8,color:T.textMut}}>{o.poz==="OrtaSaha"?"OS":o.poz.slice(0,3)} · {o.ovr}</div>
            </div>;
          })}
      </div>
    </div>

    {/* KAYDET */}
    <div style={{padding:"12px 14px"}}>
      <button onClick={kaydetKadro} className="tap" style={{width:"100%",padding:"14px",borderRadius:12,background:T.accent,color:T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0,fontSize:14,fontWeight:700}}>✓ Kadroyu Kaydet</button>
    </div>
  </div>;
}

function BilgiAlan({ik, et, deger, onChange, ph, T}){
  return <div style={{background:T.bg1,borderRadius:11,padding:"9px 10px",border:"0.5px solid "+T.line}}>
    <div style={{fontSize:10,color:T.textMut,fontWeight:600,marginBottom:4}}>{ik} {et}</div>
    <input value={deger} onChange={e=>onChange(e.target.value)} placeholder={ph}
      style={{width:"100%",background:"transparent",border:"none",outline:"none",color:T.text,fontSize:13,fontWeight:600,fontFamily:"inherit"}}/>
  </div>;
}

/* ============================================================
   MAÇ İSTATİSTİK GİRİŞİ — 11 stat, otomatik üret, tıkla-düzenle, kaydet
   ============================================================ */
function MacIstatistik({mac:m, turnuva, T, git, onKaydet}){
  const [veri,setVeri]=useState(()=> { const base = m.istatistik || istatistikUret(m.skorA, m.skorB); return {...base, golA:m.skorA, golB:m.skorB}; });
  const [duzenlenen,setDuzenlenen]=useState(null); // hangi alan input modunda
  const aGalip=m.skorA>m.skorB, bGalip=m.skorB>m.skorA;

  const yenidenUret=()=>{ setVeri({...istatistikUret(m.skorA,m.skorB), golA:m.skorA, golB:m.skorB}); setDuzenlenen(null); };
  const degerYaz=(alan,val)=>{ setVeri(v=>({...v,[alan]:val})); };

  const Kutu=({alan,renk})=>{
    const aktif=duzenlenen===alan;
    return aktif ?
      <input autoFocus value={veri[alan]} onChange={e=>degerYaz(alan, e.target.value.replace(/[^0-9.,]/g,""))}
        onBlur={()=>setDuzenlenen(null)} onKeyDown={e=>{if(e.key==="Enter")setDuzenlenen(null);}}
        style={{width:54,textAlign:"center",background:T.bg0,border:"1.5px solid "+renk,borderRadius:8,color:T.text,fontSize:15,fontWeight:800,fontFamily:T.fontDisplay,outline:"none",padding:"6px 0"}}/>
      :
      <div onClick={()=>setDuzenlenen(alan)} className="tap" style={{width:54,textAlign:"center",background:T.bg0,border:"1px solid "+T.line,borderRadius:8,color:T.text,fontSize:15,fontWeight:800,fontFamily:T.fontDisplay,padding:"6px 0",cursor:"pointer"}}>{veri[alan]}</div>;
  };

  const Satir=({et,af,bf,yz,ters})=>{
    const a=parseFloat(veri[af])||0, b=parseFloat(veri[bf])||0, top=a+b||1;
    const aIyi=ters?a<b:a>b, bIyi=ters?b<a:b>a;
    return <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:9}}>
      <Kutu alan={af} renk={T.accent}/>
      <div style={{flex:1,textAlign:"center"}}>
        <div style={{fontSize:10,color:T.textMut,fontWeight:700,marginBottom:4,whiteSpace:"nowrap"}}>{et}{yz?" %":""}</div>
        <div style={{display:"flex",gap:3,height:7}}>
          <div style={{flex:1,display:"flex",justifyContent:"flex-end",background:T.bg2,borderRadius:"4px 0 0 4px",overflow:"hidden"}}>
            <div className="bar-grow" style={{width:(a/top*100)+"%",height:"100%",background:aIyi?T.accent:T.accent+"99",transformOrigin:"right"}}/>
          </div>
          <div style={{flex:1,background:T.bg2,borderRadius:"0 4px 4px 0",overflow:"hidden"}}>
            <div className="bar-grow" style={{width:(b/top*100)+"%",height:"100%",background:bIyi?T.accent2:T.accent2+"99",transformOrigin:"left"}}/>
          </div>
        </div>
      </div>
      <Kutu alan={bf} renk={T.accent2}/>
    </div>;
  };

  return <div className="fade-in" style={{paddingBottom:120}}>
    <Baslik ust="MAÇ İSTATİSTİKLERİ" ana="Otomatik üretildi — düzenleyebilirsin" T={T}/>

    {/* skor başlığı */}
    <div style={{margin:"4px 14px 10px",display:"flex",alignItems:"center",justifyContent:"space-between",background:T.bg1,borderRadius:14,padding:"14px",border:"0.5px solid "+T.line}}>
      <div style={{flex:1,textAlign:"center"}}><Logo renk={m.renkA} ad={m.takimA} boy={40}/><div style={{fontSize:12,fontWeight:aGalip?700:600,color:aGalip?T.text:T.textSoft,marginTop:6}}>{m.takimA}</div></div>
      <div style={{fontSize:30,fontWeight:800,fontFamily:T.fontDisplay,padding:"0 10px"}}><span style={{color:aGalip?T.accent:T.text}}>{m.skorA}</span><span style={{color:T.textMut}}> - </span><span style={{color:bGalip?T.accent:T.text}}>{m.skorB}</span></div>
      <div style={{flex:1,textAlign:"center"}}><Logo renk={m.renkB} ad={m.takimB} boy={40}/><div style={{fontSize:12,fontWeight:bGalip?700:600,color:bGalip?T.text:T.textSoft,marginTop:6}}>{m.takimB}</div></div>
    </div>

    <div style={{fontSize:10,color:T.textMut,textAlign:"center",marginBottom:8}}>💡 Bir kutuya dokun → değeri elle değiştir</div>

    {/* istatistik satırları */}
    <div style={{margin:"0 14px",background:T.bg1,borderRadius:14,padding:"14px 12px",border:"0.5px solid "+T.line}}>
      <Satir et="Gol" af="golA" bf="golB"/>
      {ISTATISTIK_SATIRLAR.map(([et,af,bf,yz,ters])=> <Satir key={et} et={et} af={af} bf={bf} yz={yz} ters={ters}/>)}
    </div>

    {/* aksiyonlar */}
    <div style={{position:"fixed",bottom:0,left:0,right:0,maxWidth:1080,margin:"0 auto",padding:"10px 14px calc(10px + env(safe-area-inset-bottom))",background:T.bg0+"F2",borderTop:"0.5px solid "+T.line,display:"flex",gap:8,zIndex:30}}>
      <button onClick={yenidenUret} className="tap" style={{flex:1,padding:"13px",borderRadius:11,background:T.bg2,color:T.text,fontSize:13,fontWeight:700,border:"1px solid "+T.line}}>🎲 Yeniden Üret</button>
      <button onClick={()=>git&&git({sayfa:"mac",mac:m,turnuva})} className="tap" style={{padding:"13px 16px",borderRadius:11,background:"transparent",color:T.textMut,fontSize:13,fontWeight:700,border:"1px solid "+T.line}}>İptal</button>
      <button onClick={()=>{ const temiz={...veri}; delete temiz.golA; delete temiz.golB; onKaydet(m, temiz); git&&git({sayfa:"mac",mac:{...m,istatistik:temiz},turnuva}); }} className="tap" style={{flex:1.4,padding:"13px",borderRadius:11,background:T.accent,color:T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0,fontSize:13,fontWeight:800}}>💾 Kaydet</button>
    </div>
  </div>;
}

/* TAKİP SAYFASI — sekmeli: Akış / Ligler / Futbolcular */
