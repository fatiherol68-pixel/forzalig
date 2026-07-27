function MacSihirbaz({mac:m, turnuva, T, git, sihirbazKaydet}){
  const A=turnuva.takimlar.find(t=>t.id===m.takimAId)||turnuva.takimlar.find(t=>t.ad===m.takimA);
  const B=turnuva.takimlar.find(t=>t.id===m.takimBId)||turnuva.takimlar.find(t=>t.ad===m.takimB);
  const [adim,setAdim]=useState(1);
  const [dakikaAcik,setDakikaAcik]=useState(false);
  const [medya,setMedya]=useState(m.medya?{...m.medya}:{});

  // —— KADRO MANTIĞI (her iki takım) ——
  const otomatikDiz=(tk, slotlar)=>{
    if(!tk) return {yerlesim:[], yedek:[]};
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

  // her takım: kişi sayısı LİG AYARINDAN (iki takım da aynı, tutarlı)
  const ligKisi = turnuva.kisi || 7;
  const [kisiSayi,setKisiSayi]=useState({A:ligKisi,B:ligKisi});
  const [formIdx,setFormIdx]=useState({A:0,B:0});
  const [kadro,setKadro]=useState(()=>({
    A: (m.kadroA&&Array.isArray(m.kadroA.yerlesim)&&m.kadroA.yerlesim.length-1===ligKisi)?{yerlesim:[...m.kadroA.yerlesim],yedek:[...(m.kadroA.yedek||[])]}:otomatikDiz(A, slotlariUret(DIZILIS_SABLON[ligKisi][0])),
    B: (m.kadroB&&Array.isArray(m.kadroB.yerlesim)&&m.kadroB.yerlesim.length-1===ligKisi)?{yerlesim:[...m.kadroB.yerlesim],yedek:[...(m.kadroB.yedek||[])]}:otomatikDiz(B, slotlariUret(DIZILIS_SABLON[ligKisi][0])),
  }));

  // —— SKOR / OLAYLAR ——
  const [olaylar,setOlaylar]=useState(m.olaylar?m.olaylar.map(o=>({...o})):[]);
  const golSayA=olaylar.filter(o=>o.tip==="gol"&&o.takim===m.takimA).length;
  const golSayB=olaylar.filter(o=>o.tip==="gol"&&o.takim===m.takimB).length;

  // —— ÖDÜLLER / MVP ——
  const [mvp,setMvp]=useState(m.mvp||null);
  const [mvpId,setMvpId]=useState(m.mvpId||null);
  const [mvpTk,setMvpTk]=useState(m.mvpTakim||null);
  const [oduller,setOduller]=useState(m.oduller?{...m.oduller}:{});
  const [odullerId,setOdullerId]=useState(m.odullerId?{...m.odullerId}:{});
  const [sure,setSure]=useState(m.sure?String(m.sure):"60"); // maç süresi (dk)
  const [tarih,setTarih]=useState(m.tarih||"");
  const [saat,setSaat]=useState(m.saat||"");
  const [stad,setStad]=useState(m.stad||"");
  // çoklu kaleci kurtarışları: [{ad, kurtaris}] — elle eklenir
  const [kaleciList,setKaleciList]=useState(()=> Array.isArray(m.kaleciler)?m.kaleciler.map(k=>({...k})):[]);

  const tumOyuncular=[...(A?A.oyuncular:[]),...(B?B.oyuncular:[])];
  // Player ID omurgası: stabil kimlik (player_id||id) — aynı isim karışmaz
  const sid=(p)=>p?String(p.player_id||p.id):"";
  const olayCoklu=(i,obj)=> setOlaylar(p=>p.map((o,x)=>x===i?{...o,...obj}:o));
  const sahadakiId=(tk)=> kadro[tk].yerlesim.filter(x=>x!=null);
  const oyuncuBulId=(id)=> tumOyuncular.find(o=>o.id===id);
  // O maçta GERÇEKTEN oynayan oyuncular: sahadaki 11 + değişiklikle sonradan giren yedekler.
  // tk: "A"/"B". Dönüş: o takımın oynayan oyuncu OBJELERİ (kadro sırasına yakın).
  const oynayanlar=(tk)=>{
    const t=tk==="A"?A:B; const takimAd=tk==="A"?m.takimA:m.takimB;
    if(!t) return [];
    const idSet=new Set(sahadakiId(tk)); // sahaya çıkanlar (id)
    // değişiklikte "giren" olarak işaretlenmiş oyuncuları ekle (ad ile)
    olaylar.forEach(o=>{ if(o.tip==="degisik" && o.takim===takimAd && o.giren){ const og=t.oyuncular.find(p=>p.ad===o.giren); if(og) idSet.add(og.id); } });
    // kadro yerleşim sırasını koru, sonra giren yedekler
    const sirali=[];
    kadro[tk].yerlesim.forEach(id=>{ if(id!=null && idSet.has(id)){ const o=oyuncuBulId(id); if(o){sirali.push(o); idSet.delete(id);} } });
    // kalan (sonradan giren) yedekler
    t.oyuncular.forEach(o=>{ if(idSet.has(o.id)){ sirali.push(o); idSet.delete(o.id); } });
    return sirali.length ? sirali : (t.oyuncular||[]).slice();
  };
  // Ödül seçimi için oyuncuları mevkiye göre grupla: oncelikPoz üstte, sonra kalanlar.
  // Dönüş: [{poz, oyuncular:[...]}] — her mevki kendi içinde ovr'ye göre sıralı.
  const POZ_SIRA=["Kaleci","Defans","OrtaSaha","Forvet"];
  const POZ_AD={Kaleci:"🧤 Kaleciler",Defans:"🛡️ Defans",OrtaSaha:"🎩 Orta Saha",Forvet:"⚽ Forvet"};
  const mevkiGruplu=(tk, oncelikPoz)=>{
    const liste=oynayanlar(tk);
    const sira = oncelikPoz ? [oncelikPoz, ...POZ_SIRA.filter(p=>p!==oncelikPoz)] : POZ_SIRA;
    return sira.map(poz=>({
      poz, ad:POZ_AD[poz],
      oyuncular: liste.filter(o=>o.poz===poz).sort((a,b)=>b.ovr-a.ovr)
    })).filter(g=>g.oyuncular.length>0);
  };

  // iki takım da kadrolu mu? (en az kaleci+1, ve hiç oyuncu yoksa engelle)
  const kadroTamam = (tk)=>{ const t=tk==="A"?A:B; if(!t||t.oyuncular.length===0) return false; return sahadakiId(tk).length>=2; };
  const ikiKadroTamam = kadroTamam("A") && kadroTamam("B");

  // ——— ADIM 1: KADRO ———
  const [aktifTakim,setAktifTakim]=useState("A");
  const takim=aktifTakim==="A"?A:B;
  const renk=aktifTakim==="A"?m.renkA:m.renkB;
  const ks=kisiSayi[aktifTakim];
  const formListe=DIZILIS_SABLON[ks];
  const sablon=formListe[formIdx[aktifTakim]]||formListe[0];
  const slots=useMemo(()=>slotlariUret(sablon),[sablon]);
  const aktKadro=kadro[aktifTakim];
  const oyuncuBul=(id)=> takim?takim.oyuncular.find(o=>o.id===id):null;
  const [secili,setSecili]=useState(null);

  const yenidenDiz=(yeniKs,yeniForm)=>{
    const sl=slotlariUret(DIZILIS_SABLON[yeniKs][yeniForm]);
    setKadro(k=>({...k,[aktifTakim]:otomatikDiz(takim,sl)}));
  };
  const kisiDegis=(yeni)=>{ setSecili(null); setKisiSayi(s=>({...s,[aktifTakim]:yeni})); setFormIdx(f=>({...f,[aktifTakim]:0})); yenidenDiz(yeni,0); };
  const formDegis=(idx)=>{ setSecili(null); setFormIdx(f=>({...f,[aktifTakim]:idx})); yenidenDiz(ks,idx); };

  const takasYap=(a,b)=>{
    if(!a||!b) return;
    if(a.kaynak===b.kaynak && a.idx===b.idx) return;
    setKadro(k=>{
      const kk={...k}; const mevcut=k[aktifTakim]; const cur={yerlesim:[...mevcut.yerlesim],yedek:[...mevcut.yedek]};
      if(a.kaynak==="slot"&&b.kaynak==="slot"){ const x=cur.yerlesim[a.idx]; cur.yerlesim[a.idx]=cur.yerlesim[b.idx]; cur.yerlesim[b.idx]=x; }
      else if(a.kaynak==="yedek"&&b.kaynak==="slot"){ const gelen=cur.yedek[a.idx],giden=cur.yerlesim[b.idx]; cur.yerlesim[b.idx]=gelen; cur.yedek.splice(a.idx,1); if(giden!=null)cur.yedek.push(giden); }
      else if(a.kaynak==="slot"&&b.kaynak==="yedek"){ const gelen=cur.yedek[b.idx],giden=cur.yerlesim[a.idx]; cur.yerlesim[a.idx]=gelen; cur.yedek.splice(b.idx,1); if(giden!=null)cur.yedek.push(giden); }
      else { const x=cur.yedek[a.idx]; cur.yedek[a.idx]=cur.yedek[b.idx]; cur.yedek[b.idx]=x; }
      kk[aktifTakim]=cur; return kk;
    });
  };
  const yedegeGonder=(slotIdx)=>{
    setKadro(k=>{ const kk={...k}; const mm=k[aktifTakim]; const cur={yerlesim:[...mm.yerlesim],yedek:[...mm.yedek]};
      const giden=cur.yerlesim[slotIdx]; if(giden!=null){ cur.yerlesim[slotIdx]=null; cur.yedek.push(giden); } kk[aktifTakim]=cur; return kk; });
    setSecili(null);
  };
  const sahadaSayi=aktKadro.yerlesim.filter(x=>x!=null).length;
  const seciliOyuncu=secili?(secili.kaynak==="slot"?oyuncuBul(aktKadro.yerlesim[secili.idx]):oyuncuBul(aktKadro.yedek[secili.idx])):null;

  // ——— ADIM 2/3: OLAY MANTIĞI ———
  const olayEkle=(takim,tip)=> setOlaylar(p=>[...p,{oyuncu:"",takim,tip,asist:null,dk:""}]);
  const olaySil=(i)=> setOlaylar(p=>p.filter((_,x)=>x!==i));
  const olayDegis=(i,alan,val)=> setOlaylar(p=>p.map((o,x)=>x===i?{...o,[alan]:val}:o));
  const golTekrar=(o)=> setOlaylar(p=>[...p,{oyuncu:o.oyuncu,oyuncuId:o.oyuncuId||null,takim:o.takim,tip:"gol",asist:null,asistId:null,dk:""}]);
  // değişiklik: tip:"degisik" — cikan(oyuncu) / giren(asist alanını "giren" gibi kullanmıyoruz; ayrı alan)
  const degisEkle=(takim)=> setOlaylar(p=>[...p,{cikan:"",giren:"",takim,tip:"degisik",dk:""}]);
  const odulSec=(alan,id)=>{ const p=tumOyuncular.find(x=>sid(x)===String(id)); setOduller(o=>({...o,[alan]:p?p.ad:undefined})); setOdullerId(o=>({...o,[alan]:id||undefined})); };

  // —— KAYDET ——
  const tamamla=()=>{
    const temizOlay=olaylar.filter(o=>{
      if(o.tip==="degisik") return o.cikan||o.giren;
      return o.oyuncu;
    }).map(o=>{ const c={...o, dk:o.dk?parseInt(o.dk):null}; delete c._ao; return c; });
    // kaleci kurtarışları (elle eklenenler)
    const kaleciler=kaleciList.filter(k=>k.ad||k.id).map(k=>({ad:k.ad, id:k.id||null, kurtaris:parseInt(k.kurtaris)||0}));
    const paketKadro={
      kadroA: kadro.A, kadroB: kadro.B,
      dizilisA: DIZILIS_SABLON[kisiSayi.A][formIdx.A].ad,
      dizilisB: DIZILIS_SABLON[kisiSayi.B][formIdx.B].ad,
      sure: parseInt(sure)||60,
      kaleciler,
      tarih, saat, stad,
    };
    sihirbazKaydet(turnuva, m, golSayA, golSayB, temizOlay, mvp, mvpTk, oduller, paketKadro, {mvpId, odullerId, medya});
    git({sayfa:"mac",mac:m,turnuva});
  };

  // ——— ADIM GEÇİŞ ———
  const ileri=()=>{ setAdim(a=>Math.min(4,a+1)); window.scrollTo(0,0); };
  const geriAdim=()=>{ if(adim===1){ git({sayfa:"mac",mac:m,turnuva}); return; } setAdim(a=>a-1); window.scrollTo(0,0); };

  const ADIMLAR=["Kadro","Skor & Olaylar","Ödüller","Kaydet"];

  // —————————— RENDER ——————————
  return <div className="fade-in" style={{paddingBottom:96}}>
    <Baslik ust="MAÇI YÖNET" ana={`${m.takimA} — ${m.takimB}`} T={T}/>

    {/* İLERLEME ÇUBUĞU */}
    <div style={{padding:"4px 14px 10px"}}>
      <div style={{display:"flex",alignItems:"center",gap:0}}>
        {ADIMLAR.map((ad,i)=>{ const no=i+1; const aktif=no===adim; const tamam=no<adim;
          return <React.Fragment key={no}>
            <div onClick={()=>{ if(no<=adim || (no>1&&ikiKadroTamam)) setAdim(no); }} className="tap"
              style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,cursor:(no<=adim||ikiKadroTamam)?"pointer":"default",minWidth:0,flexShrink:0}}>
              <div style={{width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,fontFamily:T.fontDisplay,
                background:aktif?T.accent:tamam?T.accent+"33":T.bg2,color:aktif?(T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0):tamam?T.accent:T.textMut,
                border:"1.5px solid "+(aktif||tamam?T.accent:T.line)}}>{tamam?"✓":no}</div>
              <span style={{fontSize:8,fontWeight:700,color:aktif?T.accent:T.textMut,whiteSpace:"nowrap"}}>{ad}</span>
            </div>
            {no<4 && <div style={{flex:1,height:2,background:no<adim?T.accent:T.line,margin:"0 2px",marginBottom:14}}/>}
          </React.Fragment>;
        })}
      </div>
    </div>

    {/* ====== ADIM 1: KADRO ====== */}
    {adim===1 && <div className="fade-in">
      {/* takım seçici */}
      <div style={{display:"flex",gap:8,padding:"4px 14px 6px"}}>
        {[["A",A,m.renkA],["B",B,m.renkB]].map(([k,t,c])=>{
          const dolu=kadroTamam(k);
          return <div key={k} onClick={()=>{setAktifTakim(k);setSecili(null);}} className="tap" style={{flex:1,display:"flex",alignItems:"center",gap:8,padding:"10px 12px",borderRadius:11,
            background:aktifTakim===k?c+"22":T.bg1,border:"1px solid "+(aktifTakim===k?c:T.line)}}>
            <Logo renk={c} ad={t?t.ad:"?"} boy={26}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:700,color:aktifTakim===k?T.text:T.textMut,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t?t.ad:"?"}</div>
              <div style={{fontSize:9,color:dolu?T.accent:T.danger,fontWeight:700}}>{dolu?"✓ hazır":"⚠ eksik"}</div>
            </div>
          </div>;
        })}
      </div>

      {(!takim || takim.oyuncular.length===0) ?
        <div style={{margin:"10px 14px",padding:"22px 16px",background:T.danger+"14",borderRadius:12,border:"1px solid "+T.danger+"44",textAlign:"center"}}>
          <div style={{fontSize:13,fontWeight:700,color:T.danger,marginBottom:6}}>⚠️ Bu takımın oyuncusu yok</div>
          <div style={{fontSize:11,color:T.textMut,lineHeight:1.6}}>Önce takım sayfasından oyuncu ekle, sonra buraya dön.</div>
        </div>
      : <>
        {/* kişi sayısı — LİG AYARINDAN (kilitli) */}
        <div style={{padding:"6px 14px"}}>
          <div style={{fontSize:10,color:T.textMut,fontWeight:700,marginBottom:6,letterSpacing:.4}}>SAHA KİŞİ SAYISI</div>
          <div style={{display:"flex",alignItems:"center",gap:8,background:T.bg1,border:"0.5px solid "+T.line,borderRadius:10,padding:"10px 13px"}}>
            <span style={{fontSize:18,fontWeight:800,color:T.accent,fontFamily:T.fontDisplay}}>{ligKisi}</span>
            <span style={{fontSize:12,color:T.text}}>kişilik</span>
            <span style={{flex:1}}></span>
            <span style={{fontSize:9,color:T.textMut}}>🔒 Lig ayarı · iki takım da {ligKisi} kişi</span>
          </div>
        </div>
        {/* formasyon */}
        <div style={{padding:"8px 14px"}}>
          <div style={{fontSize:10,color:T.textMut,fontWeight:700,marginBottom:6,letterSpacing:.4}}>DİZİLİŞ</div>
          <div style={{display:"flex",gap:6}}>
            {formListe.map((f,i)=>
              <div key={i} onClick={()=>formDegis(i)} className="tap" style={{flex:1,textAlign:"center",padding:"9px 0",borderRadius:9,fontSize:13,fontWeight:700,
                background:formIdx[aktifTakim]===i?T.gold+"22":T.bg1,color:formIdx[aktifTakim]===i?T.gold:T.textMut,border:"0.5px solid "+(formIdx[aktifTakim]===i?T.gold+"77":T.line)}}>{f.ad}</div>
            )}
          </div>
        </div>
        {/* saha */}
        <div style={{padding:"8px 14px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <span style={{fontSize:11,color:T.accent,fontWeight:700}}>⚽ SAHADA ({sahadaSayi}/{ks})</span>
            <span style={{fontSize:10,color:T.textMut}}>oyuncuya dokun → hedefe dokun</span>
          </div>
          {seciliOyuncu && <div className="fade-in" style={{display:"flex",alignItems:"center",gap:9,background:T.accent+"1A",borderRadius:10,padding:"8px 11px",marginBottom:8,border:"1px solid "+T.accent+"55"}}>
            <Avatar o={seciliOyuncu} boy={28} T={T}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:700,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{seciliOyuncu.ad} seçili</div>
              <div style={{fontSize:10,color:T.textSoft}}>Yer değiştirmek için hedefe dokun</div>
            </div>
            {secili.kaynak==="slot" && <button onClick={()=>yedegeGonder(secili.idx)} className="tap" style={{fontSize:11,color:T.gold,background:T.gold+"22",borderRadius:8,padding:"5px 10px",fontWeight:600}}>↓ Yedeğe</button>}
            <button onClick={()=>setSecili(null)} className="tap" style={{fontSize:11,color:T.textMut,background:T.bg2,borderRadius:8,padding:"5px 10px",fontWeight:600}}>İptal</button>
          </div>}
          <div style={{position:"relative",width:"100%",paddingBottom:"122%",borderRadius:14,overflow:"hidden",border:"1px solid "+T.line}}>
            <div style={{position:"absolute",inset:0,background:"#1e7a40"}}>
              {[0,1,2,3,4,5,6,7].map(i=> <div key={i} style={{position:"absolute",left:0,right:0,top:(i*12.5)+"%",height:"12.5%",background:i%2===0?"rgba(0,0,0,.07)":"transparent"}}/>)}
            </div>
            <div style={{position:"absolute",inset:0,opacity:.55}}>
              <div style={{position:"absolute",top:"2.5%",bottom:"2.5%",left:"3%",right:"3%",border:"2px solid rgba(255,255,255,.6)",borderRadius:3}}/>
              <div style={{position:"absolute",top:"50%",left:"3%",right:"3%",height:2,background:"rgba(255,255,255,.6)"}}/>
              <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:"24%",paddingBottom:"24%",borderRadius:"50%",border:"2px solid rgba(255,255,255,.6)"}}/>
              <div style={{position:"absolute",bottom:"2.5%",left:"24%",right:"24%",height:"14%",border:"2px solid rgba(255,255,255,.6)",borderBottom:"none"}}/>
              <div style={{position:"absolute",bottom:"2.5%",left:"37%",right:"37%",height:"6%",border:"2px solid rgba(255,255,255,.6)",borderBottom:"none"}}/>
              <div style={{position:"absolute",top:"2.5%",left:"24%",right:"24%",height:"14%",border:"2px solid rgba(255,255,255,.6)",borderTop:"none"}}/>
              <div style={{position:"absolute",top:"2.5%",left:"37%",right:"37%",height:"6%",border:"2px solid rgba(255,255,255,.6)",borderTop:"none"}}/>
            </div>
            {slots.map((sl,i)=>{
              const oid=aktKadro.yerlesim[i]; const o=oid!=null?oyuncuBul(oid):null;
              const buSecili=secili&&secili.kaynak==="slot"&&secili.idx===i;
              const hedefVurgu=secili&&!buSecili;
              return <div key={i}
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
        {/* yedek kulübesi */}
        <div style={{padding:"6px 14px"}}>
          <div style={{fontSize:11,color:T.textMut,fontWeight:700,marginBottom:8}}>🔄 YEDEK KULÜBESİ ({aktKadro.yedek.length})</div>
          <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:6}}>
            {aktKadro.yedek.length===0 ? <div style={{fontSize:11,color:T.textMut,padding:8}}>Tüm oyuncular sahada</div> :
              aktKadro.yedek.map((oid,i)=>{ const o=oyuncuBul(oid); if(!o) return null;
                const buSecili=secili&&secili.kaynak==="yedek"&&secili.idx===i;
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
      </>}

      {!ikiKadroTamam && <div style={{margin:"4px 14px",padding:"10px 12px",background:T.gold+"14",borderRadius:10,border:"1px solid "+T.gold+"44",fontSize:11,color:T.gold,fontWeight:600,textAlign:"center"}}>
        ℹ️ Kadro zorunlu değil — dilersen kurmadan İleri'ye basıp skoru girebilirsin.
      </div>}
    </div>}

    {/* ====== ADIM 2: SKOR & OLAYLAR (gol + kart + değişiklik) ====== */}
    {adim===2 && <div className="fade-in">
      <div style={{margin:"4px 14px 12px",background:T.bg1,borderRadius:16,padding:"18px 14px",border:"0.5px solid "+T.line}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
          <div style={{flex:1,textAlign:"center"}}><Logo renk={m.renkA} ad={m.takimA} boy={40}/><div style={{fontSize:12,fontWeight:600,color:T.text,marginTop:6,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{m.takimA}</div></div>
          <div style={{fontSize:34,fontWeight:800,fontFamily:T.fontDisplay,color:T.text,minWidth:30,textAlign:"center"}}>{golSayA}</div>
          <span style={{fontSize:22,color:T.textMut}}>-</span>
          <div style={{fontSize:34,fontWeight:800,fontFamily:T.fontDisplay,color:T.text,minWidth:30,textAlign:"center"}}>{golSayB}</div>
          <div style={{flex:1,textAlign:"center"}}><Logo renk={m.renkB} ad={m.takimB} boy={40}/><div style={{fontSize:12,fontWeight:600,color:T.text,marginTop:6,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{m.takimB}</div></div>
        </div>
        <div style={{textAlign:"center",fontSize:10,color:T.textMut,marginTop:8}}>Skor, eklediğin gollerden otomatik hesaplanır · kart ve değişiklik isteğe bağlı</div>
      </div>
      {/* maç süresi */}
      <div style={{margin:"0 14px 12px",display:"flex",alignItems:"center",gap:10,background:T.bg1,borderRadius:11,padding:"10px 12px",border:"0.5px solid "+T.line}}>
        <span style={{fontSize:16}}>⏱️</span>
        <div style={{flex:1}}>
          <div style={{fontSize:11,color:T.text,fontWeight:600}}>Maç Süresi</div>
          <div style={{fontSize:9,color:T.textMut}}>oynama dakikaları ve per-90 için</div>
        </div>
        {[40,50,60,90].map(n=>
          <span key={n} onClick={()=>setSure(String(n))} className="tap" style={{fontSize:12,fontWeight:700,borderRadius:8,padding:"6px 9px",
            color:String(n)===sure?(T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0):T.textMut, background:String(n)===sure?T.accent:T.bg2}}>{n}</span>
        )}
        <input value={sure} onChange={e=>setSure(e.target.value.replace(/[^0-9]/g,"").slice(0,3))} style={{width:42,textAlign:"center",background:T.bg2,border:"0.5px solid "+T.line,borderRadius:8,padding:"6px 2px",color:T.text,fontSize:12,fontWeight:700,outline:"none",fontFamily:"inherit"}}/>
        <span style={{fontSize:10,color:T.textMut}}>dk</span>
      </div>
      {/* tarih / saat / stad */}
      <div style={{margin:"0 14px 12px",background:T.bg1,borderRadius:11,padding:"10px 12px",border:"0.5px solid "+T.line}}>
        <div style={{fontSize:11,color:T.text,fontWeight:600,marginBottom:8}}>📅 Maç Bilgileri <span style={{color:T.textMut,fontWeight:400,fontSize:9}}>(isteğe bağlı)</span></div>
        <div style={{display:"flex",gap:8,marginBottom:8}}>
          <div style={{flex:1}}>
            <div style={{fontSize:9,color:T.textMut,marginBottom:3}}>Tarih</div>
            <input type="date" value={tarih} onChange={e=>setTarih(e.target.value)} style={{width:"100%",background:T.bg2,border:"0.5px solid "+T.line,borderRadius:8,padding:"8px",color:T.text,fontSize:11,outline:"none",fontFamily:"inherit"}}/>
          </div>
          <div style={{width:100}}>
            <div style={{fontSize:9,color:T.textMut,marginBottom:3}}>Saat</div>
            <input type="time" value={saat} onChange={e=>setSaat(e.target.value)} style={{width:"100%",background:T.bg2,border:"0.5px solid "+T.line,borderRadius:8,padding:"8px",color:T.text,fontSize:11,outline:"none",fontFamily:"inherit"}}/>
          </div>
        </div>
        <div>
          <div style={{fontSize:9,color:T.textMut,marginBottom:3}}>📍 Saha / Stad</div>
          <input value={stad} onChange={e=>setStad(e.target.value)} placeholder="Örn: Fatih Halı Saha" style={{width:"100%",background:T.bg2,border:"0.5px solid "+T.line,borderRadius:8,padding:"8px",color:T.text,fontSize:11,outline:"none",fontFamily:"inherit"}}/>
        </div>
      </div>
      {/* dakika toggle (isteğe bağlı) */}
      <div style={{padding:"0 14px 10px"}}>
        <button onClick={()=>setDakikaAcik(v=>!v)} className="tap" style={{width:"100%",height:44,borderRadius:12,background:dakikaAcik?T.accent+"18":T.bg1,color:dakikaAcik?T.accent:T.textMut,fontSize:13,fontWeight:700,border:"1px solid "+(dakikaAcik?T.accent+"55":T.line),display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>{dakikaAcik?"⏱ Dakika alanı açık — kapat":"⏱ Dakikaları gir (isteğe bağlı)"}</button>
      </div>
      {/* her takım için: gol + kart + değişiklik tek blokta */}
      {[["A",A,m.takimA],["B",B,m.takimB]].map(([k,tk,ad])=>{
        const oynayan=oynayanlar(k); // sahadaki 11 + sonradan giren
        return <div key={k} style={{padding:"0 14px 14px"}}>
          <div style={{fontSize:13,fontWeight:800,color:T.text,marginBottom:8,display:"flex",alignItems:"center",gap:7}}><Logo renk={k==="A"?m.renkA:m.renkB} ad={ad} boy={20}/>{ad}</div>
          {/* goller */}
          {olaylar.map((o,i)=> (o.takim===ad && o.tip==="gol") && <SihirbazGolKutu key={"g"+i} o={o} i={i} oynayan={oynayan} T={T} olayDegis={olayDegis} olaySil={olaySil} golTekrar={golTekrar} dakikaAcik={dakikaAcik}/>)}
          {/* kartlar */}
          {olaylar.map((o,i)=> (o.takim===ad && (o.tip==="sari"||o.tip==="kirmizi")) && <SihirbazKartKutu key={"k"+i} o={o} i={i} oynayan={oynayan} T={T} olayDegis={olayDegis} olaySil={olaySil} dakikaAcik={dakikaAcik}/>)}
          {/* değişiklikler — çıkan: sahadaki, giren: tüm kadro (yedek dahil) */}
          {olaylar.map((o,i)=> (o.takim===ad && o.tip==="degisik") && <SihirbazDegisKutu key={"d"+i} o={o} i={i} takim={tk} oynayan={oynayan} T={T} olayDegis={olayDegis} olaySil={olaySil}/>)}
          {/* ekleme butonları */}
          <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}>
            <button onClick={()=>olayEkle(ad,"gol")} className="tap" style={{flex:"1 1 30%",padding:"9px 4px",borderRadius:9,background:T.accent+"18",color:T.accent,fontSize:11,fontWeight:700,border:"1px dashed "+T.accent+"55"}}>+ ⚽ Gol</button>
            <button onClick={()=>olayEkle(ad,"sari")} className="tap" style={{flex:"1 1 22%",padding:"9px 4px",borderRadius:9,background:"#E0A80018",color:"#E0A800",fontSize:11,fontWeight:700,border:"1px dashed #E0A80055"}}>+ 🟨</button>
            <button onClick={()=>olayEkle(ad,"kirmizi")} className="tap" style={{flex:"1 1 22%",padding:"9px 4px",borderRadius:9,background:T.danger+"18",color:T.danger,fontSize:11,fontWeight:700,border:"1px dashed "+T.danger+"55"}}>+ 🟥</button>
            <button onClick={()=>degisEkle(ad)} className="tap" style={{flex:"1 1 100%",padding:"9px",borderRadius:9,background:T.gold+"18",color:T.gold,fontSize:11,fontWeight:700,border:"1px dashed "+T.gold+"55"}}>+ 🔁 Oyuncu Değişikliği</button>
          </div>
        </div>;
      })}
    </div>}

    {/* ====== ADIM 3: ÖDÜLLER ====== */}
    {adim===3 && <div className="fade-in">
      <div style={{padding:"8px 14px 4px",fontSize:11,color:T.textMut}}>İsteğe bağlı — sadece maçta oynayan (sahadaki + sonradan giren) oyuncular listelenir.</div>
      {/* MVP */}
      <div style={{padding:"6px 14px"}}>
        <div style={{fontSize:12,fontWeight:700,color:T.gold,marginBottom:8}}>🌟 Maçın Yıldızı (MVP)</div>
        <select value={mvpId||(mvp?sid(tumOyuncular.find(p=>p.ad===mvp)):"")} onChange={e=>{ const id=e.target.value; const o=tumOyuncular.find(p=>sid(p)===id); setMvpId(id||null); setMvp(o?o.ad:null); setMvpTk(o?((A&&A.oyuncular.includes(o))?m.takimA:m.takimB):null); }}
          style={{width:"100%",background:T.bg1,border:"0.5px solid "+T.gold+"55",borderRadius:10,padding:"10px",color:T.text,fontSize:13,outline:"none",fontFamily:"inherit"}}>
          <option value="">MVP seç...</option>
          {[["A",A,m.takimA],["B",B,m.takimB]].map(([k,tk,ad])=> tk && <optgroup key={k} label={ad}>
            {mevkiGruplu(k).map(g=> g.oyuncular.map(o=> <option key={o.id} value={sid(o)}>{g.poz==="Kaleci"?"🧤 ":g.poz==="Defans"?"🛡️ ":g.poz==="OrtaSaha"?"🎩 ":"⚽ "}{o.ad}</option>))}
          </optgroup>)}
        </select>
      </div>
      {/* diğer ödüller */}
      <div style={{padding:"8px 14px"}}>
        <div style={{fontSize:11,fontWeight:700,color:T.text,marginBottom:8}}>🏅 Maç Ödülleri</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {MAC_ODUL_ETIKET.filter(([alan])=>alan!=="mvp").map(([alan,ik,etiket])=>{
            const oncelik={forvet:"Forvet",ortasaha:"OrtaSaha",defans:"Defans",kaleci:"Kaleci"}[alan]||null;
            return <div key={alan}>
              <div style={{fontSize:10,color:T.textMut,marginBottom:3,fontWeight:600}}>{ik} {etiket}</div>
              <select value={odullerId[alan]||(oduller[alan]?sid(tumOyuncular.find(p=>p.ad===oduller[alan])):"")} onChange={e=>odulSec(alan,e.target.value)} style={{width:"100%",background:T.bg1,border:"0.5px solid "+T.line,borderRadius:8,padding:"7px",color:oduller[alan]?T.text:T.textMut,fontSize:11,outline:"none",fontFamily:"inherit"}}>
                <option value="">— yok —</option>
                {[["A",A,m.takimA],["B",B,m.takimB]].map(([k,tk,ad])=> tk && <optgroup key={k} label={ad}>
                  {mevkiGruplu(k,oncelik).map(g=> g.oyuncular.map(o=> <option key={o.id} value={sid(o)}>{g.poz==="Kaleci"?"🧤 ":g.poz==="Defans"?"🛡️ ":g.poz==="OrtaSaha"?"🎩 ":"⚽ "}{o.ad}</option>))}
                </optgroup>)}
              </select>
            </div>;
          })}
        </div>
      </div>
      {/* KALECİ KURTARIŞLARI — tamamen elle: ekle, oyuncu seç, kurtarış gir */}
      <div style={{padding:"8px 14px 4px"}}>
        <div style={{fontSize:11,fontWeight:700,color:T.text,marginBottom:8}}>🧤 Kaleci Kurtarışları <span style={{color:T.textMut,fontWeight:400,fontSize:10}}>(kaleyi koruyanı seç, kurtarış yaz)</span></div>
        {kaleciList.map((kl,i)=>
          <div key={i} style={{display:"flex",alignItems:"center",gap:7,background:T.bg1,borderRadius:9,padding:"8px 10px",marginBottom:5}}>
            <span style={{fontSize:13}}>🧤</span>
            <select value={kl.id||(kl.ad?sid(tumOyuncular.find(p=>p.ad===kl.ad)):"")} onChange={e=>{ const id=e.target.value; const p=tumOyuncular.find(x=>sid(x)===id); setKaleciList(pp=>pp.map((x,xi)=>xi===i?{...x,id:id||null,ad:p?p.ad:""}:x)); }} style={{flex:1,minWidth:0,background:T.bg2,border:"0.5px solid "+T.line,borderRadius:7,padding:"7px",color:T.text,fontSize:11,outline:"none",fontFamily:"inherit"}}>
              <option value="">Kaleciyi seç...</option>
              {[["A",A,m.takimA],["B",B,m.takimB]].map(([k,tk,ad])=> tk && <optgroup key={k} label={ad}>
                {mevkiGruplu(k,"Kaleci").map(g=> g.oyuncular.map(o=> <option key={o.id} value={sid(o)}>{g.poz==="Kaleci"?"🧤 ":g.poz==="Defans"?"🛡️ ":g.poz==="OrtaSaha"?"🎩 ":"⚽ "}{o.ad}</option>))}
              </optgroup>)}
            </select>
            <span style={{fontSize:10,color:T.textMut}}>kurtarış</span>
            <input value={kl.kurtaris||""} onChange={e=>{ const v=e.target.value.replace(/[^0-9]/g,"").slice(0,2); setKaleciList(p=>p.map((x,xi)=>xi===i?{...x,kurtaris:v}:x)); }} placeholder="0" style={{width:44,textAlign:"center",background:T.bg2,border:"0.5px solid "+T.line,borderRadius:7,padding:"6px 2px",color:T.text,fontSize:12,fontWeight:700,outline:"none",fontFamily:"inherit"}}/>
            <button onClick={()=>setKaleciList(p=>p.filter((_,xi)=>xi!==i))} className="tap" style={{color:T.danger,fontSize:14,background:"none",border:"none",padding:"0 2px"}}>✕</button>
          </div>
        )}
        <button onClick={()=>setKaleciList(p=>[...p,{ad:"",kurtaris:""}])} className="tap" style={{width:"100%",padding:"9px",borderRadius:9,background:T.gold+"18",color:T.gold,fontSize:11,fontWeight:700,border:"1px dashed "+T.gold+"55"}}>+ 🧤 Kaleci Ekle</button>
      </div>
    </div>}

    {/* ====== ADIM 5: ÖZET + KAYDET ====== */}
    {adim===4 && <div className="fade-in" style={{padding:"6px 14px"}}>
      <div style={{background:T.bg1,borderRadius:16,padding:"16px 14px",border:"0.5px solid "+T.line,marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
          <div style={{flex:1,textAlign:"center"}}><Logo renk={m.renkA} ad={m.takimA} boy={36}/><div style={{fontSize:11,fontWeight:600,color:T.text,marginTop:5}}>{m.takimA}</div><div style={{fontSize:8,color:T.textMut,marginTop:2}}>{DIZILIS_SABLON[kisiSayi.A][formIdx.A].ad}</div></div>
          <div style={{fontSize:38,fontWeight:800,fontFamily:T.fontDisplay,color:T.accent}}>{golSayA}</div>
          <span style={{fontSize:22,color:T.textMut}}>-</span>
          <div style={{fontSize:38,fontWeight:800,fontFamily:T.fontDisplay,color:T.accent}}>{golSayB}</div>
          <div style={{flex:1,textAlign:"center"}}><Logo renk={m.renkB} ad={m.takimB} boy={36}/><div style={{fontSize:11,fontWeight:600,color:T.text,marginTop:5}}>{m.takimB}</div><div style={{fontSize:8,color:T.textMut,marginTop:2}}>{DIZILIS_SABLON[kisiSayi.B][formIdx.B].ad}</div></div>
        </div>
      </div>
      {/* özet satırları */}
      <SihirbazOzetSatir ik="⚽" et="Gol" deger={`${olaylar.filter(o=>o.tip==="gol").length} gol`} T={T}/>
      <SihirbazOzetSatir ik="🟨" et="Sarı kart" deger={`${olaylar.filter(o=>o.tip==="sari").length}`} T={T}/>
      <SihirbazOzetSatir ik="🟥" et="Kırmızı kart" deger={`${olaylar.filter(o=>o.tip==="kirmizi").length}`} T={T}/>
      <SihirbazOzetSatir ik="🔁" et="Değişiklik" deger={`${olaylar.filter(o=>o.tip==="degisik").length}`} T={T}/>
      <SihirbazOzetSatir ik="🌟" et="MVP" deger={mvp||"—"} T={T}/>
      <SihirbazOzetSatir ik="🏅" et="Ödül" deger={`${Object.values(oduller).filter(Boolean).length} ödül`} T={T}/>
      <MacMedyaKart medya={medya} setMedya={setMedya} T={T}/>
      <div style={{marginTop:10,padding:"10px 12px",background:T.accent+"12",borderRadius:10,border:"1px solid "+T.accent+"33",fontSize:11,color:T.textSoft,lineHeight:1.6}}>
        ✓ Kaydedince oyuncu reytingleri otomatik hesaplanır, puan durumu ve krallar güncellenir.
      </div>
    </div>}

    {/* ====== ALT NAVİGASYON ====== */}
    <div style={{position:"fixed",bottom:0,left:0,right:0,maxWidth:1080,margin:"0 auto",padding:"10px 14px calc(10px + env(safe-area-inset-bottom))",background:T.bg0+"F2",borderTop:"0.5px solid "+T.line,display:"flex",gap:8,zIndex:30,backdropFilter:"blur(8px)"}}>
      <button onClick={geriAdim} className="tap" style={{padding:"13px 18px",borderRadius:11,background:"transparent",color:T.textMut,fontSize:13,fontWeight:700,border:"1px solid "+T.line}}>{adim===1?"İptal":"‹ Geri"}</button>
      {adim<4
        ? <button onClick={ileri} className="tap" style={{flex:1,padding:"13px",borderRadius:11,background:T.accent,color:(T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0),fontSize:14,fontWeight:800,border:"none"}}>İleri ›</button>
        : <button onClick={tamamla} className="tap" style={{flex:1,padding:"13px",borderRadius:11,background:T.accent,color:T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0,fontSize:14,fontWeight:800,border:"none"}}>✓ Maçı Kaydet</button>}
    </div>
  </div>;
}

// — Sihirbaz alt kutuları —
function SihirbazGolKutu({o,i,oynayan,T,olayDegis,olaySil,golTekrar,dakikaAcik}){
  const AC=T.accent2||"#5AA9E6"; const liste=oynayan||[];
  return <div style={{display:"flex",alignItems:"center",gap:7,background:T.bg2,borderRadius:11,padding:"7px 9px",marginBottom:7}}>
    <span style={{fontSize:16,minWidth:20,textAlign:"center"}}>⚽</span>
    {dakikaAcik && <input value={o.dk||""} onChange={e=>olayDegis(i,"dk",e.target.value.replace(/[^0-9]/g,"").slice(0,3))} placeholder="dk'" inputMode="numeric" style={{width:52,height:44,textAlign:"center",background:T.bg1,border:"0.5px solid "+T.line,borderRadius:9,padding:"0 2px",color:T.text,fontSize:15,outline:"none",fontFamily:"inherit"}}/>}
    <select value={o.oyuncuId||(o.oyuncu?(liste.reduce((a,x)=>x.ad===o.oyuncu?String(x.player_id||x.id):a,"")):"")} onChange={e=>{ const id=e.target.value; const p=liste.find(x=>String(x.player_id||x.id)===id); olayDegis(i,"oyuncuId",id||null); olayDegis(i,"oyuncu",p?p.ad:""); }} style={{flex:1,minWidth:0,height:44,background:T.bg1,border:"0.5px solid "+T.line,borderRadius:9,padding:"0 10px",color:T.text,fontSize:15,fontWeight:600,outline:"none",fontFamily:"inherit"}}>
      <option value="">Golcü...</option>
      {liste.map(p=><option key={p.id} value={String(p.player_id||p.id)}>{p.ad}</option>)}
    </select>
    {(o.asist||o._ao
      ? <select value={o.asistId||(o.asist?(liste.reduce((a,x)=>x.ad===o.asist?String(x.player_id||x.id):a,"")):"")} onChange={e=>{ const id=e.target.value; const p=liste.find(x=>String(x.player_id||x.id)===id); olayDegis(i,"asistId",id||null); olayDegis(i,"asist",p?p.ad:null); }} style={{width:98,height:44,background:T.bg1,border:"0.5px solid "+AC+"55",borderRadius:9,padding:"0 8px",color:AC,fontSize:13,outline:"none",fontFamily:"inherit"}}>
        <option value="">🅰 yok</option>
        {liste.map(p=><option key={p.id} value={String(p.player_id||p.id)}>🅰 {p.ad.split(" ")[0]}</option>)}
      </select>
      : <button onClick={()=>olayDegis(i,"_ao",true)} className="tap" style={{height:40,padding:"0 11px",borderRadius:9,background:AC+"1A",color:AC,border:"1px solid "+AC+"44",fontSize:13,fontWeight:700,whiteSpace:"nowrap"}}>🅰 asist</button>)}
    {o.oyuncu && <button onClick={()=>golTekrar(o)} className="tap" title="Aynı oyuncuya +1" style={{color:T.accent,fontSize:13,fontWeight:800,background:T.accent+"22",border:"1px solid "+T.accent+"44",borderRadius:8,padding:"0 10px",height:40}}>+1</button>}
    <button onClick={()=>olaySil(i)} className="tap" style={{color:T.danger,fontSize:18,background:"none",border:"none",width:34,height:40}}>✕</button>
  </div>;
}
function SihirbazKartKutu({o,i,oynayan,T,olayDegis,olaySil,dakikaAcik}){
  const liste=oynayan||[];
  return <div style={{display:"flex",alignItems:"center",gap:7,background:T.bg2,borderRadius:11,padding:"7px 9px",marginBottom:7}}>
    <span style={{fontSize:16,minWidth:20,textAlign:"center"}}>{o.tip==="sari"?"🟨":"🟥"}</span>
    {dakikaAcik && <input value={o.dk||""} onChange={e=>olayDegis(i,"dk",e.target.value.replace(/[^0-9]/g,"").slice(0,3))} placeholder="dk'" inputMode="numeric" style={{width:52,height:44,textAlign:"center",background:T.bg1,border:"0.5px solid "+T.line,borderRadius:9,padding:"0 2px",color:T.text,fontSize:15,outline:"none",fontFamily:"inherit"}}/>}
    <select value={o.oyuncuId||(o.oyuncu?(liste.reduce((a,x)=>x.ad===o.oyuncu?String(x.player_id||x.id):a,"")):"")} onChange={e=>{ const id=e.target.value; const p=liste.find(x=>String(x.player_id||x.id)===id); olayDegis(i,"oyuncuId",id||null); olayDegis(i,"oyuncu",p?p.ad:""); }} style={{flex:1,minWidth:0,height:44,background:T.bg1,border:"0.5px solid "+T.line,borderRadius:9,padding:"0 10px",color:T.text,fontSize:15,fontWeight:600,outline:"none",fontFamily:"inherit"}}>
      <option value="">Oyuncu...</option>
      {liste.map(p=><option key={p.id} value={String(p.player_id||p.id)}>{p.ad}</option>)}
    </select>
    <button onClick={()=>olaySil(i)} className="tap" style={{color:T.danger,fontSize:18,background:"none",border:"none",width:34,height:40}}>✕</button>
  </div>;
}
function SihirbazDegisKutu({o,i,takim,oynayan,T,olayDegis,olaySil}){
  // çıkan: o an oynayanlardan; giren: tüm kadro (yedek dahil — henüz oynamayanlar)
  const girenAdaylar = takim?takim.oyuncular:[];
  return <div style={{background:T.bg2,borderRadius:9,padding:"8px 9px",marginBottom:6}}>
    <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:5}}>
      <span style={{fontSize:13,minWidth:18,textAlign:"center"}}>🔁</span>
      <input value={o.dk||""} onChange={e=>olayDegis(i,"dk",e.target.value.replace(/[^0-9]/g,"").slice(0,3))} placeholder="dk" style={{width:34,textAlign:"center",background:T.bg1,border:"0.5px solid "+T.line,borderRadius:7,padding:"6px 2px",color:T.text,fontSize:11,outline:"none",fontFamily:"inherit"}}/>
      <span style={{fontSize:10,color:T.textMut,flex:1}}>Oyuncu değişikliği</span>
      <button onClick={()=>olaySil(i)} className="tap" style={{color:T.danger,fontSize:14,background:"none",border:"none",padding:"0 2px"}}>✕</button>
    </div>
    <div style={{display:"flex",alignItems:"center",gap:5}}>
      <span style={{fontSize:11,color:T.danger,fontWeight:700,minWidth:18}}>↓</span>
      <select value={o.cikan||""} onChange={e=>olayDegis(i,"cikan",e.target.value)} style={{flex:1,minWidth:0,background:T.bg1,border:"0.5px solid "+T.line,borderRadius:7,padding:"6px",color:T.text,fontSize:11,outline:"none",fontFamily:"inherit"}}>
        <option value="">Çıkan...</option>
        {(oynayan||[]).map(p=><option key={p.id} value={p.ad}>{p.ad}</option>)}
      </select>
      <span style={{fontSize:11,color:T.accent,fontWeight:700,minWidth:18}}>↑</span>
      <select value={o.giren||""} onChange={e=>olayDegis(i,"giren",e.target.value)} style={{flex:1,minWidth:0,background:T.bg1,border:"0.5px solid "+T.line,borderRadius:7,padding:"6px",color:T.text,fontSize:11,outline:"none",fontFamily:"inherit"}}>
        <option value="">Giren...</option>
        {girenAdaylar.map(p=><option key={p.id} value={p.ad}>{p.ad}</option>)}
      </select>
    </div>
  </div>;
}
function SihirbazOzetSatir({ik,et,deger,T}){
  return <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:T.bg1,borderRadius:10,marginBottom:6,border:"0.5px solid "+T.line}}>
    <span style={{fontSize:15,minWidth:20,textAlign:"center"}}>{ik}</span>
    <span style={{flex:1,fontSize:12,color:T.textMut,fontWeight:600}}>{et}</span>
    <span style={{fontSize:12,color:T.text,fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:160}}>{deger}</span>
  </div>;
}

/* ============================================================
   ANA UYGULAMA
   ============================================================ */
