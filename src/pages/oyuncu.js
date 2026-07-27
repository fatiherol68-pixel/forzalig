function KartimEditor({oyuncu:o, T, git, adminMi, oturum, sahip}){
  const [kariyer,setKariyer]=React.useState(null);
  const [fotolar,setFotolar]=React.useState([]);
  const [konsept,setKonsept]=React.useState(1);
  const [rarity,setRarity]=React.useState(null);
  const [aktif,setAktif]=React.useState(0);
  const [mesaj,setMesaj]=React.useState(""); const [bekle,setBekle]=React.useState(false);
  const ref=React.useRef(null);
  const cropsRef=React.useRef({});   // {fotoId:{konsept:crop}} — canlı kırpma (re-mount tetiklemez)
  const saveRef=React.useRef(null);  // en güncel kaydetme fonksiyonu
  const yetkili=!!(oturum && (adminMi || sahip || (o.sahip_user_id && o.sahip_user_id===oturum.id)));
  const yukle=async()=>{ const v=await Db.kartVeri(o.id); setFotolar(v.fotolar||[]); if(v.konsept) setKonsept(v.konsept); setRarity(v.rarity||null); };
  React.useEffect(()=>{ if(typeof o.id==="string"&&sb) Db.oyuncuKariyer(o.id).then(setKariyer); yukle(); },[o.id]);
  const d=React.useMemo(()=>kartVerisiYap(o,kariyer),[o,kariyer]);
  const fAktif=fotolar[aktif]||fotolar[0]||null;
  const foto=fAktif?{url:fAktif.url,crop:fAktif.crop,bg:fAktif.arka_plan}:(o.foto?{url:o.foto,crop:null,bg:"orijinal"}:null);
  const rk=rarity||(window.FLKART?window.FLKART.rarityFromOvr(d.ovr):"gold");
  const pendingRef=React.useRef(null);  // canlı sürüklenen crop (Uygula'ya kadar kaydedilmez)
  const kirpRef=React.useRef(null);     // FLKART kırpma handle'ı (slider/uygula/sıfırla)
  const [zoomPct,setZoomPct]=React.useState(120);
  const [remountKey,setRemountKey]=React.useState(0);
  saveRef.current=(cr)=>{ if(!fAktif) return; const id=fAktif.id; cropsRef.current[id]=cr; Db.kartFotoGuncelle(id,{crop:cr}); setFotolar(fs=>fs.map(x=>x.id===id?{...x,crop:cr}:x)); };
  React.useEffect(()=>{ if(!ref.current||!window.FLKART) return;
    // TEK kırpma: bu fotoğrafın kırpması (varsa canlı-taslak, yoksa kayıtlı). Konsept başına ayrı yok.
    const savedCrop = fAktif ? (cropsRef.current[fAktif.id] || ((fAktif.crop&&fAktif.crop.fx!==undefined)?fAktif.crop:null)) : null;
    pendingRef.current=null; kirpRef.current=null;
    window.FLKART.mount(ref.current,d,{konsept,rarity:rk,foto:foto?foto.url:null,crop:savedCrop,bg:foto?foto.bg:null,kirpMod:!!fAktif,
      onKirp:(cr)=>{ pendingRef.current=cr; },
      onReady:(h)=>{ kirpRef.current=h||null; if(h) setZoomPct(h.zoomPct()); }});
  },[d,konsept,rk,aktif,fotolar.length,remountKey,fAktif?fAktif.id:0,fAktif?fAktif.url:0,fAktif?fAktif.arka_plan:0]);
  const uygulaKirp=()=>{ const h=kirpRef.current; const cr=(h&&h.getCrop())||pendingRef.current; if(!cr){ setMesaj("Kartı sürükleyip yakınlaştırdıktan sonra Uygula'ya bas."); return; } saveRef.current(cr); const kad=((window.FLKART&&window.FLKART.KONSEPTLER)||[]).find(k=>k.k===konsept); setMesaj("✓ "+(kad?kad.ad:"")+" kırpması uygulandı — kart aynen böyle görünecek"); };
  const sifirlaKirp=async()=>{ if(!fAktif) return; const id=fAktif.id; delete cropsRef.current[id]; await Db.kartFotoGuncelle(id,{crop:null}); setFotolar(fs=>fs.map(x=>x.id===id?{...x,crop:null}:x)); setRemountKey(k=>k+1); setMesaj("✓ Otomatik kadraja döndü"); };
  const fotoYukleGiris=async(e)=>{ const f=e.target.files&&e.target.files[0]; e.target.value=""; if(!f)return; if(fotolar.length>=5){ setMesaj("En fazla 5 kart fotoğrafı."); return; } setBekle(true); setMesaj("Yükleniyor…"); const r=await fotoYukle(f,"kart",null); if(!r||!r.url){ setBekle(false); setMesaj("Foto yüklenemedi"); return; } const ins=await Db.kartFotoEkle(o.id,{url:r.url,sira:fotolar.length===0?0:fotolar.length}); setBekle(false); if(ins&&ins.ok){ setMesaj("✓ Fotoğraf eklendi"); await yukle(); setAktif(fotolar.length); } else setMesaj("Olmadı: "+((ins&&ins.hata)||"")); };
  const fotoSil=async(f,i)=>{ if(!confirm("Bu kart fotoğrafı silinsin mi?")) return; const r=await Db.kartFotoSil(f.id); if(r&&r.ok){ setMesaj("✓ Silindi"); if(aktif>=fotolar.length-1) setAktif(0); await yukle(); } else setMesaj("Olmadı: "+((r&&r.hata)||"")); };
  const varsayilanYap=async(f)=>{ // sira=0 yap, diğerlerini kaydır
    setBekle(true); await Db.kartFotoGuncelle(f.id,{sira:0}); let s=1; for(const x of fotolar){ if(x.id!==f.id){ await Db.kartFotoGuncelle(x.id,{sira:s++}); } } setBekle(false); setMesaj("✓ Varsayılan kart fotoğrafı ayarlandı"); setAktif(0); await yukle(); };
  const bgSec=async(bg)=>{ if(!fAktif){ setMesaj("Önce fotoğraf ekle"); return; } await Db.kartFotoGuncelle(fAktif.id,{arka_plan:bg}); setFotolar(fs=>fs.map(x=>x.id===fAktif.id?{...x,arka_plan:bg}:x)); };
  const konseptKaydet=async(k)=>{ setKonsept(k); await Db.kartAyarKaydet(o.id,{kart_konsept:k}); };
  const rarityKaydet=async(rr)=>{ setRarity(rr); await Db.kartAyarKaydet(o.id,{kart_rarity:rr}); };
  const RAR=(window.FLKART&&window.FLKART.RARITY)||{}; const BGL=(window.FLKART&&window.FLKART.BG_LIST)||[]; const K=(window.FLKART&&window.FLKART.KONSEPTLER)||[];
  if(!yetkili) return <div style={{maxWidth:460,margin:"0 auto",padding:"60px 24px",textAlign:"center",color:T.textMut}}><div style={{fontSize:40,marginBottom:12}}>🔒</div><div style={{fontSize:15,color:T.text,fontWeight:700}}>Bu kartı düzenleme yetkin yok</div><button onClick={()=>git({sayfa:"oyuncu",oyuncu:o})} className="tap" style={{marginTop:18,background:T.accent,color:T.bg0,border:0,borderRadius:11,padding:"11px 22px",fontSize:13,fontWeight:800}}>Karta dön</button></div>;
  const sec={fontSize:11,color:T.textMut,fontWeight:800,letterSpacing:.5,textTransform:"uppercase",margin:"18px 2px 9px"};
  return <div style={{maxWidth:480,margin:"0 auto",padding:"14px 14px 90px"}}>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
      <span onClick={()=>git({sayfa:"oyuncu",oyuncu:o})} className="tap" style={{fontSize:22,color:T.textSoft,cursor:"pointer"}}>‹</span>
      <span style={{flex:1,fontSize:19,fontWeight:800,color:T.text,fontFamily:T.fontDisplay}}>🎴 Kartım · {d.ad}</span>
    </div>
    {mesaj && <div style={{fontSize:12.5,color:mesaj[0]==="✓"?T.accent:T.gold,marginBottom:10}}>{mesaj}</div>}
    <div ref={ref} className="flkart"></div>
    {fAktif && <>
      <div style={{textAlign:"center",marginTop:8,fontSize:11.5,color:T.accent,fontWeight:700}}>✋ Fotoğrafı <b>parmakla kartın üstünde sürükle</b>, iki parmakla yakınlaştır — ne görürsen kart öyle olur <span style={{color:T.textMut,fontWeight:600}}>(tüm konseptlerde aynı)</span></div>
      <div style={{display:"flex",alignItems:"center",gap:10,margin:"11px 4px 0"}}>
        <span style={{fontSize:15}}>🔍</span>
        <input type="range" min="100" max="450" value={zoomPct} onChange={e=>{ const v=+e.target.value; setZoomPct(v); const h=kirpRef.current; if(h) h.zoomTo(v); }} style={{flex:1,accentColor:T.accent,height:24}}/>
        <span style={{fontSize:11,color:T.textMut,fontWeight:700,minWidth:34,textAlign:"right"}}>{zoomPct}%</span>
      </div>
      <div style={{display:"flex",gap:8,marginTop:11}}>
        <button onClick={sifirlaKirp} className="tap" style={{flex:"0 0 auto",padding:"11px 16px",borderRadius:11,background:T.bg2,color:T.textMut,border:"1px solid "+T.line,fontWeight:800,fontSize:12.5,cursor:"pointer"}}>↺ Sıfırla</button>
        <button onClick={uygulaKirp} className="tap" style={{flex:1,padding:"11px",borderRadius:11,background:T.accent,color:T.bg0,border:0,fontWeight:800,fontSize:13.5,cursor:"pointer"}}>✓ Uygula</button>
      </div>
    </>}
    <div style={sec}>Konsept</div>
    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{K.map(kc=><button key={kc.k} onClick={()=>konseptKaydet(kc.k)} className="tap" style={{fontSize:11.5,fontWeight:800,padding:"8px 13px",borderRadius:10,border:"1px solid "+(konsept===kc.k?T.accent:T.line),background:konsept===kc.k?T.accent+"22":T.bg1,color:konsept===kc.k?T.accent:T.textMut}}>{kc.ad}</button>)}</div>
    <div style={sec}>Kart Fotoğrafları · {fotolar.length}/5</div>
    <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
      {fotolar.map((f,i)=><div key={f.id} onClick={()=>setAktif(i)} className="tap" style={{position:"relative",width:60,height:80,borderRadius:9,overflow:"hidden",border:(aktif===i?"2px solid "+T.accent:"1px solid "+T.line),cursor:"pointer",flexShrink:0}}>
        <img src={f.url} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
        {i===0 && <span style={{position:"absolute",top:2,left:3,fontSize:11}}>⭐</span>}
        <div style={{position:"absolute",left:0,right:0,bottom:0,display:"flex",background:"rgba(0,0,0,.6)"}}><span onClick={e=>{e.stopPropagation();varsayilanYap(f);}} style={{flex:1,textAlign:"center",fontSize:11,padding:"2px 0",color:"#fff"}}>⭐</span><span onClick={e=>{e.stopPropagation();fotoSil(f,i);}} style={{flex:1,textAlign:"center",fontSize:11,padding:"2px 0",color:"#fff"}}>🗑</span></div>
      </div>)}
      {fotolar.length<5 && <label className="tap" style={{width:60,height:80,borderRadius:9,border:"1px dashed "+T.line,display:"grid",placeItems:"center",color:T.textMut,fontSize:24,cursor:"pointer",flexShrink:0}}>＋<input type="file" accept="image/*" onChange={fotoYukleGiris} style={{display:"none"}}/></label>}
    </div>
    <div style={{fontSize:10.5,color:T.textMut,marginTop:6}}>Fotoğraf otomatik yüz kadrajıyla yerleşir. ⭐ = varsayılan (kartta görünen).</div>
    <div style={sec}>Arka Plan {fAktif?"":"(önce foto ekle)"}</div>
    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{BGL.map(([k,lbl])=><button key={k} onClick={()=>bgSec(k)} className="tap" style={{fontSize:10.5,fontWeight:700,padding:"6px 10px",borderRadius:9,border:"1px solid "+((fAktif&&fAktif.arka_plan===k)?T.accent:T.line),background:(fAktif&&fAktif.arka_plan===k)?T.accent+"22":T.bg1,color:(fAktif&&fAktif.arka_plan===k)?T.accent:T.textMut}}>{lbl}</button>)}</div>
    {adminMi && <><div style={sec}>Rarity (Süper Admin)</div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        <button onClick={()=>rarityKaydet(null)} className="tap" style={{fontSize:10.5,fontWeight:700,padding:"6px 10px",borderRadius:9,border:"1px solid "+(!rarity?T.accent:T.line),background:!rarity?T.accent+"22":T.bg1,color:!rarity?T.accent:T.textMut}}>Otomatik (OVR)</button>
        {Object.keys(RAR).map(k=><button key={k} onClick={()=>rarityKaydet(k)} className="tap" style={{fontSize:10.5,fontWeight:700,padding:"6px 10px",borderRadius:9,border:"1px solid "+(rarity===k?T.accent:T.line),background:rarity===k?T.accent+"22":T.bg1,color:rarity===k?T.accent:T.textMut}}>{RAR[k].label}</button>)}
      </div></>}
    <div style={{fontSize:10.5,color:T.textMut,marginTop:14,textAlign:"center"}}>Değişiklikler otomatik kaydedilir.</div>
  </div>;
}

function OyuncuSayfa({oyuncu:o, T, takipOyuncu, oyuncuTakip, adminMod, git, turnuvalar, oturum, sahiplenme, onSahiplen, onTransfer, saltOkunur, adminMi}){
  const [duzenle,setDuzenle]=useState(false);
  const [sahipYuk,setSahipYuk]=useState(false);
  const [sahipMesaj,setSahipMesaj]=useState("");
  const [kariyer,setKariyer]=useState(null); // Faz 4: tüm sezonların toplamı (player_id bazlı)
  const [ayrMsj,setAyrMsj]=useState(""); const [ayrYuk,setAyrYuk]=useState(false); // Faz 5: ayrılma talebi (Q16)
  // TRANSFER — kaptan istek gönderir, lig yöneticisi onaylar
  const [transferAcik,setTransferAcik]=useState(false);
  const [transferHedef,setTransferHedef]=useState("");
  const [transferMesaj,setTransferMesaj]=useState("");
  const [eskiTakimlar,setEskiTakimlar]=useState([]);
  // Transfer pazarı — "takım arıyorum"
  const [musaitAcik,setMusaitAcik]=useState(false);
  const [musait,setMusait]=useState(!!o.musait);
  const [musaitSehir,setMusaitSehir]=useState(o.musait_sehir||"");
  const [musaitNot,setMusaitNot]=useState(o.musait_not||"");
  const [musaitYuk,setMusaitYuk]=useState(false);
  const musaitKaydet=async(yeniDurum)=>{
    setMusaitYuk(true);
    const r=await Db.oyuncuMusaitAyar(o.id, yeniDurum, musaitSehir, musaitNot);
    setMusaitYuk(false);
    if(r&&r.ok){ setMusait(yeniDurum); o.musait=yeniDurum; if(yeniDurum) setMusaitAcik(false); }
    else alert("Kaydedilemedi: "+((r&&r.hata)||"yetki yok"));
  };
  const oyLig=(turnuvalar||[]).find(t=>t.takimlar.some(tk=>tk.oyuncular.some(p=>p.id===o.id)));
  const oyTakim=oyLig?oyLig.takimlar.find(tk=>tk.oyuncular.some(p=>p.id===o.id)):null;
  const transferHedefler=oyLig?oyLig.takimlar.filter(tk=>tk.id!==(oyTakim&&oyTakim.id)):[];
  const benimLigim = !!(oturum && oyLig && oyLig.yonetici_id && oyLig.yonetici_id===oturum.id);
  const kaptanMi = !!(oturum && oyTakim && oyTakim.yonetici_id && oyTakim.yonetici_id===oturum.id);
  const transferYapilabilir = !saltOkunur && oturum && oyLig && oyLig.iliskisel && (benimLigim || kaptanMi) && transferHedefler.length>0 && onTransfer;
  const transferYap=async()=>{
    if(!transferHedef){ setTransferMesaj("Hedef takım seç."); return; }
    setTransferMesaj("Gönderiliyor…");
    const r=await onTransfer(o, transferHedef);
    if(r&&r.ok&&r.beklemede){ setTransferMesaj("✅ Transfer isteği gönderildi. Lig yöneticisi onaylayacak."); setTimeout(()=>setTransferAcik(false),2500); }
    else if(r&&r.ok){ setTransferMesaj("✅ "+r.yeniTakim+" takımına transfer edildi."); setTimeout(()=>{ setTransferAcik(false); git({sayfa:"ana"}); },1200); }
    else setTransferMesaj("❌ "+((r&&r.hata)||"olmadı"));
  };
  useEffect(()=>{
    if(typeof o.id==="string" && sb){ Db.oyuncuTransferGecmisi(o.id).then(g=>{ if(g.length){ const takimAd=(tid)=>{ if(!oyLig) return tid; const t=oyLig.takimlar.find(x=>x.id===tid); return t?t.ad:tid; }; setEskiTakimlar(g.map(x=>({id:x.id, eskiAd:takimAd(x.eski_takim_id), yeniAd:takimAd(x.yeni_takim_id), tarih:x.yonetici_onay_t}))); } }); }
  },[o.id]);
  useEffect(()=>{ if(typeof o.id==="string" && sb){ Db.oyuncuKariyer(o.id).then(setKariyer); } else setKariyer(null); },[o.id]);
  const benimMi = (oturum && o.sahip_user_id && o.sahip_user_id===oturum.id) || (sahiplenme && (sahiplenme.oyuncu_id===o.id || sahiplenme.oyuncu_ad===o.ad));
  const ayrilmaGonder=async()=>{ if(!oyLig||typeof o.id!=="string"){ setAyrMsj("Bu oyuncuda ayrılma talebi kullanılamaz."); return; } if(!confirm((oyTakim?oyTakim.ad:"takım")+" takımından ayrılma talebi gönderilsin mi? Lig yöneticisi onaylarsa takımdan ayrılırsın, istatistiklerin korunur.")) return; setAyrYuk(true); const r=await Db.ayrilmaTalep(o.id, oyLig.id); setAyrYuk(false); setAyrMsj(r&&r.ok?"✅ Ayrılma talebin gönderildi. Yönetici onayını bekliyor.":"❌ "+((r&&r.hata)||"olmadı")); };
  const sahiplen=async()=>{
    if(!oturum){ setSahipMesaj("Sahiplenmek için giriş yapmalısın."); return; }
    setSahipYuk(true); setSahipMesaj("");
    let r;
    if(typeof o.id==="string" && sb){                 // ilişkisel oyuncu → RPC
      const rr=await Db.oyuncuSahiplenRel(o.id);
      r = rr.hata ? {hata:rr.hata} : rr.ok ? {ok:true} : {hata:"Bu oyuncu zaten biri tarafından sahiplenilmiş."};
    } else {                                           // eski sistem
      const turnuva = (turnuvalar||[]).find(t=>t.ad===o.turnuva) || null;
      r=await onSahiplen(o, turnuva);
    }
    setSahipYuk(false);
    setSahipMesaj(r&&r.ok ? "⭐ Kariyerine eklendi! Profil'den görebilirsin." : (r&&r.hata)||"Olmadı, tekrar dene.");
  };
  // Kendi fotoğrafını değiştir (sahiplendiğin oyuncu → RLS: sahip_user_id güncelleyebilir)
  const [fotoYuk2,setFotoYuk2]=useState(false); const [,setFotoTik]=useState(0);
  const kendiFotoDegistir=async(e)=>{
    const f=e.target.files&&e.target.files[0]; if(!f)return;
    setFotoYuk2(true);
    const r=await fotoYukle(f,"oyuncu",o.foto);
    if(r&&r.url){ o.foto=r.url; const pid=o.player_id||(typeof o.id==="string"?o.id:null);
      if(sb && pid){ try{ await sb.from('oyuncular').update({foto:r.url}).eq('player_id',pid); }catch(err){} }
      setFotoTik(x=>x+1);
    } else alert((r&&r.hata)||"Fotoğraf yüklenemedi (giriş gerekli).");
    setFotoYuk2(false); e.target.value="";
  };
  // karşılaştırma adayları: oyuncunun bulunduğu ligdeki tüm oyuncular (yoksa _adaylar fallback)
  const adaylar=useMemo(()=>{
    if(turnuvalar && o.turnuva){
      const lig=turnuvalar.find(t=>t.ad===o.turnuva);
      if(lig){ const arr=[]; lig.takimlar.forEach(tk=>tk.oyuncular.forEach(p=>arr.push(p))); if(arr.length>1) return arr; }
    }
    return o._adaylar||[];
  },[o.id]);
  const [d,setD]=useState(null);
  const [sekme,setSekme]=useState("akis");
  const [bilgiAcik,setBilgiAcik]=useState(false);
  const [bd,setBd]=useState(null); // bilgi düzenleme taslağı
  const sistemDeger=useRef(null);
  useEffect(()=>{
    sistemDeger.current={id:o.id, pac:o.pac,sho:o.sho,pas:o.pas,dri:o.dri,def:o.def,phy:o.phy, ovr:o.ovr, deger:o.deger};
  },[o.id]);
  const acDuzenle=()=>{ setD({...o, yildizManuel: o.yildizManuel||0}); setDuzenle(true); };
  const acBilgi=()=>{ setBd({ad:o.ad,poz:o.poz,no:o.no,ayak:o.ayak||"Sağ",dogum:o.dogum||"",boy:o.boy||"",kilo:o.kilo||"",uyruk:o.uyruk||"",saglik:o.saglik||"Sağlam",foto:o.foto||null}); setBilgiAcik(true); };
  const kaydetBilgi=()=>{
    o.ad=bd.ad||o.ad; o.poz=bd.poz; o.no=parseInt(bd.no)||o.no; o.ayak=bd.ayak;
    o.dogum=bd.dogum; o.boy=parseInt(bd.boy)||o.boy; o.kilo=parseInt(bd.kilo)||o.kilo;
    o.uyruk=bd.uyruk||o.uyruk; o.saglik=bd.saglik; o.foto=bd.foto!==undefined?bd.foto:o.foto;
    const y=parseInt((bd.dogum.split(".")[2]||bd.dogum.split("-")[0]||"")); if(y>1950&&y<2020)o.yas=2026-y;
    o._manuel=true; setBilgiAcik(false);
  };
  const kaydet=()=>{ Object.assign(o,d); o.ovr=d.ovr||Math.round((d.pac+d.sho+d.pas+d.dri+d.def+d.phy)/6); o._manuel=true; setDuzenle(false); };
  const otomatikYap=()=>{
    const s=sistemDeger.current; if(!s) return;
    setD({...d, pac:s.pac,sho:s.sho,pas:s.pas,dri:s.dri,def:s.def,phy:s.phy, ovr:s.ovr, deger:s.deger, yildizManuel:0});
  };

  const formSeri=useMemo(()=>Array.from({length:8},()=>rnd(4)),[o.id]);
  const aylikGol=useMemo(()=>Array.from({length:6},()=>rnd(o.gol>5?5:4)),[o.id]);
  const goat=o.gol*3+o.asist*2+o.mvp*5;
  const takipte = takipOyuncu && takipOyuncu.includes(o.id);
  const golOrt=o.mac>0?(o.gol/o.mac):0;
  // per-90: oynama dakikası varsa onu, yoksa maç×60'ı kullan
  const toplamDk = o.dk>0 ? o.dk : (o.mac||0)*60;
  const katki = o.gol+o.asist;
  const per90 = toplamDk>0 ? (katki*90/toplamDk) : 0;
  const yildiz = (o.yildizManuel&&o.yildizManuel>0) ? o.yildizManuel : (o.ovr>=85?5:o.ovr>=78?4:o.ovr>=68?3:o.ovr>=58?2:1);

  const oduller=[
    {ik:"🌟",ad:"MVP",s:o.mvp},{ik:"🥇",ad:"Altın",s:o.altin},{ik:"🥈",ad:"Gümüş",s:o.gumus},
    {ik:"⚽",ad:"Forvet",s:o.forvet},{ik:"🎯",ad:"OrtaSaha",s:o.ortasaha},{ik:"🛡️",ad:"Defans",s:o.defans},
    {ik:"🧤",ad:"Kaleci",s:o.kaleci},{ik:"🤝",ad:"Centilmen",s:o.centilmen},{ik:"⚡",ad:"Enerjik",s:o.enerjik},
    {ik:"🔥",ad:"Maçın Golü",s:o.macinGolu},{ik:"🏆",ad:"Toplam",s:o.mvp+o.altin+o.gumus+o.forvet},{ik:"📈",ad:"Gol Ort",s:golOrt.toFixed(1)}
  ];

  const rozetler=[
    {ikon:"⚽",ad:"İlk Gol",aclk:"İlk golünü attı",k:o.gol>=1},
    {ikon:"🎩",ad:"Hat-trick",aclk:"1 maçta 3 gol",k:o.gol>=3},
    {ikon:"⭐",ad:"İlk MVP",aclk:"İlk MVP'sini aldı",k:o.mvp>=1},
    {ikon:"🥇",ad:"Maçın Forveti",aclk:"1 kez maçın forveti",k:o.forvet>=1},
    {ikon:"🔥",ad:"Maçın Golü",aclk:"1 kez maçın golü",k:o.macinGolu>=1},
    {ikon:"💯",ad:"10 Gol Kulübü",aclk:"10 gole ulaştı",k:o.gol>=10},
    {ikon:"🚀",ad:"Gol Makinesi",aclk:"20 gole ulaştı",k:o.gol>=20},
    {ikon:"🧤",ad:"Duvar",aclk:"15 kurtarış",k:o.kurtaris>=15},
    {ikon:"👑",ad:"GOAT",aclk:"50 GOAT puanı",k:goat>=50},
    {ikon:"💎",ad:"Efsane",aclk:"90+ reyting",k:o.ovr>=90},
    {ikon:"🛡️",ad:"Centilmen",aclk:"Temiz sicil",k:(o.sari+o.kirmizi)===0},
    {ikon:"⚡",ad:"Enerjik",aclk:"Enerjik oyuncu",k:o.enerjik>=1},
    {ikon:"🎖️",ad:"Veteran",aclk:"50+ maç oynadı",k:(o.mac||0)>=50},
    {ikon:"🐐",ad:"Golcü Efsane",aclk:"50 gole ulaştı",k:(o.gol||0)>=50},
    {ikon:"🎯",ad:"Asist Kralı",aclk:"20 asist yaptı",k:(o.asist||0)>=20},
    {ikon:"🧱",ad:"Aşılmaz",aclk:"30 kurtarış",k:(o.kurtaris||0)>=30},
    {ikon:"⭐",ad:"MVP Ustası",aclk:"5 kez MVP",k:(o.mvp||0)>=5},
  ];
  const kazanilan=rozetler.filter(r=>r.k).length;

  const hedefler=[
    {ikon:"⭐",ad:"MVP Adayı",cur:o.mvp,hedef:3},
    {ikon:"💯",ad:"10 Gol Kulübü",cur:o.gol,hedef:10},
    {ikon:"⚽",ad:"10 Maç",cur:o.mac,hedef:10},
    {ikon:"🚀",ad:"Gol Makinesi",cur:o.gol,hedef:20},
    {ikon:"👑",ad:"MVP Efsanesi",cur:o.mvp,hedef:10},
  ];

  const sonMaclar=useMemo(()=>Array.from({length:Math.min(o.mac,5)||0},(_,i)=>({
    rakip:pick(TAKIM_ADLARI), benim:rnd(5), rakipS:rnd(4),
    gol:rnd(3), kart:Math.random()>0.7
  })),[o.id]);

  // AKIŞ - otomatik olay kartları (oyuncu verisinden üretilir)
  const akisOlaylar=useMemo(()=>{
    const ev=[];
    if(o.mvp>0) ev.push({tip:"odul",renk:T.gold,et:"ÖDÜL",ad:"Maçın yıldızı (MVP) seçildi",alt:o.mvp+" kez MVP oldu",za:"yakın"});
    if(o.gol>=3) ev.push({tip:"mac",renk:T.accent,et:"PERFORMANS",ad:"Hat-trick başarısı",alt:"Bir maçta 3 gol attı",za:"bu sezon"});
    if(o.forvet>0) ev.push({tip:"odul",renk:T.accent,et:"ÖDÜL",ad:"Maçın forveti seçildi",alt:o.forvet+" kez forvet ödülü",za:"bu sezon"});
    if(o.gol>=10) ev.push({tip:"rozet",renk:T.accent2,et:"ROZET",ad:"Yeni rozet: 10 Gol Kulübü",alt:"10 gol barajını geçti",za:"bu sezon"});
    if(o.gol>=20) ev.push({tip:"rozet",renk:T.accent2,et:"ROZET",ad:"Yeni rozet: Gol Makinesi",alt:"20 gol barajını geçti",za:"bu sezon"});
    if(o.kaleci>0) ev.push({tip:"odul",renk:T.gold,et:"ÖDÜL",ad:"En iyi kaleci seçildi",alt:o.kaleci+" kez kaleci ödülü",za:"bu sezon"});
    if(o.asist>=5) ev.push({tip:"mac",renk:T.accent,et:"PERFORMANS",ad:"Asist krallığı yolunda",alt:o.asist+" asist yaptı",za:"bu sezon"});
    if((o.sari+o.kirmizi)===0 && o.mac>0) ev.push({tip:"odul",renk:T.accent,et:"FAIR PLAY",ad:"Temiz sicil",alt:"Hiç kart görmedi",za:"bu sezon"});
    if(ev.length===0) ev.push({tip:"mac",renk:T.textMut,et:"BİLGİ",ad:"Henüz öne çıkan olay yok",alt:"Maçlar oynandıkça burada görünecek",za:""});
    return ev;
  },[o.id]);

  const SEKMELER=[["akis","Akış"],["genel","Genel"],["ist","İstatistik"],["mac","Maç Geçmişi"],["lisans","🎫 Lisans"]];
  const renkCifti = T.renkCifti||["#000","#fff"];

  return <div className="fade-in" style={{paddingBottom:90}}>
    {/* ===== VAV HERO ===== */}
    <div className="vav-hero" style={{position:"relative",padding:"20px 16px 18px",background:"linear-gradient(120deg,"+T.accent+"45 0%,"+T.bg1+" 32%,"+T.accent+"26 58%,"+T.bg1+" 100%)",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0,background:"repeating-linear-gradient(115deg,transparent,transparent 22px,"+T.accent+"08 22px,"+T.accent+"08 24px)",pointerEvents:"none"}}/>
      <div className="vav-supurme"/>
      {/* süzülen avatar + büyük başlık */}
      <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
        <div className="vav-suzul" style={{width:76,height:76,borderRadius:"50%",overflow:"hidden",border:"3px solid "+T.accent+"88",boxShadow:"0 0 22px "+T.accent+"55",flexShrink:0,background:T.bg2}} dangerouslySetInnerHTML={{__html:svgAvatar(o.ad,76,o.foto)}}/>
        <div style={{minWidth:0}}>
          <div style={{fontSize:24,fontWeight:800,color:T.text,fontFamily:T.fontDisplay,lineHeight:1.15,display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}>{o.ad} <span style={{color:T.accent,fontSize:14}}>✔</span></div>
          <div style={{fontSize:11,color:T.textSoft,marginTop:4}}>{o.poz} · {o.takimAd}</div>
          <div style={{fontSize:12,marginTop:3,display:"flex",alignItems:"center",gap:8}}>
            <span><span style={{color:T.gold}}>{"★".repeat(yildiz)}</span><span style={{color:T.line}}>{"★".repeat(5-yildiz)}</span></span>
            <span style={{fontSize:10,color:T.textMut}}>OVR <b style={{color:T.gold,fontFamily:T.fontDisplay,fontSize:12}}>{o.ovr}</b></span>
          </div>
        </div>
      </div>
      {/* parlayan büyük sayılar + ışıklı çubuklar */}
      <div style={{display:"flex",gap:12,marginTop:16,position:"relative"}}>
        {[["GOL",o.gol,"#34D399"],["ASİST",o.asist,T.accent],["MVP",o.mvp,T.gold]].map(([k,v,c])=>
          <div key={k} style={{flex:1,textAlign:"center"}}>
            <div className="vav-parla" style={{fontSize:27,fontWeight:800,color:c,fontFamily:T.fontDisplay,lineHeight:1}}>{v}</div>
            <div style={{fontSize:8.5,color:T.textSoft,letterSpacing:1,marginTop:4,fontWeight:700}}>{k}</div>
            <div className="vav-bar" style={{height:3,borderRadius:2,background:c+"4D",marginTop:6}}/>
          </div>
        )}
      </div>
    </div>

    {/* AKSIYON */}
    <div style={{display:"flex",justifyContent:"flex-end",gap:7,padding:"10px 14px 0"}}>
      {adaylar.length>1 && git && <button onClick={()=>git({sayfa:"h2h",tip:"oyuncu",a:o,aday:adaylar,turnuva:o.turnuva})} className="tap" style={{background:"transparent",color:T.gold,border:"1px solid "+T.gold,borderRadius:20,padding:"0 14px",fontSize:12,fontWeight:700}}>⚔️ Karşılaştır</button>}
      {oyuncuTakip && <button onClick={()=>oyuncuTakip(o.id)} className="tap" style={{background:takipte?T.accent:"transparent",color:takipte?(renkCifti[1]==="#FFFFFF"?"#fff":T.bg0):T.accent,border:"1px solid "+T.accent,borderRadius:20,padding:"0 16px",fontSize:12,fontWeight:700}}>{takipte?"✓ Takipte":"+ Takip et"}</button>}
    </div>
    {/* TRANSFER — kaptan/yönetici transfer isteği gönderir */}
    {transferYapilabilir && <div style={{padding:"10px 14px 0"}}>
      {!transferAcik
        ? <button onClick={()=>{setTransferAcik(true); setTransferMesaj(""); setTransferHedef("");}} className="tap" style={{width:"100%",background:T.accent2+"18",color:T.accent2,border:"1px solid "+T.accent2+"66",borderRadius:12,padding:12,fontSize:13,fontWeight:800}}>🔄 Transfer İsteği Gönder ({oyTakim?oyTakim.ad:""} → ?)</button>
        : <div style={{background:T.bg1,border:"0.5px solid "+T.accent2+"55",borderRadius:12,padding:13}}>
            <div style={{fontSize:12,color:T.text,fontWeight:700,marginBottom:8}}>🔄 {o.ad} → hangi takıma?</div>
            <select value={transferHedef} onChange={e=>setTransferHedef(e.target.value)} style={{width:"100%",background:T.bg0,border:"0.5px solid "+T.line,borderRadius:10,padding:11,color:T.text,fontSize:13,outline:"none",fontFamily:"inherit",marginBottom:9}}>
              <option value="">— Hedef takım seç —</option>
              {transferHedefler.map(tk=><option key={tk.id} value={tk.id}>{tk.ad}</option>)}
            </select>
            <div style={{fontSize:10,color:T.textMut,marginBottom:10,lineHeight:1.5}}>Eski takımdaki golleri/istatistikleri orada kalır, kariyer toplamına eklenmeye devam eder.{oyLig&&oyLig.iliskisel?" Lig yöneticisi onaylarsa transfer tamamlanır.":""}</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={transferYap} className="tap" style={{flex:1,background:T.accent2,color:"#04070C",border:0,borderRadius:10,padding:11,fontSize:13,fontWeight:800}}>{oyLig&&oyLig.iliskisel?"İsteği Gönder":"Transferi Onayla"}</button>
              <button onClick={()=>setTransferAcik(false)} className="tap" style={{background:T.bg2,color:T.textMut,border:"0.5px solid "+T.line,borderRadius:10,padding:"11px 14px",fontSize:13,fontWeight:700}}>Vazgeç</button>
            </div>
            {transferMesaj && <div style={{fontSize:11,color:/✅/.test(transferMesaj)?T.accent:/❌/.test(transferMesaj)?T.danger:T.textSoft,textAlign:"center",marginTop:8}}>{transferMesaj}</div>}
          </div>}
    </div>}
    {/* SAHİPLENME (self-claim) KALDIRILDI — kariyer artık sadece takım daveti ile oluşur. */}
    {oturum && (benimMi||adminMi) && <div style={{padding:"10px 14px 0",display:"flex",gap:8,alignItems:"stretch"}}>
      <div style={{flex:1,background:(benimMi?T.gold:T.danger)+"14",color:benimMi?T.gold:T.danger,border:"1px solid "+(benimMi?T.gold:T.danger)+"55",borderRadius:12,padding:12,fontSize:13,fontWeight:800,textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center"}}>{benimMi?"⭐ Bu senin kariyerin":"🛡️ Süper Admin"}</div>
      <label className="tap" title="Fotoğrafı değiştir" style={{flexShrink:0,background:T.accent+"18",color:T.accent,border:"1px solid "+T.accent+"66",borderRadius:12,padding:"0 16px",fontSize:13,fontWeight:800,cursor:"pointer",display:"flex",alignItems:"center"}}>{fotoYuk2?"⏳ Yükleniyor":"📷 Fotoğraf"}
        <input type="file" accept="image/*" onChange={kendiFotoDegistir} style={{display:"none"}}/></label>
    </div>}
    {/* TRANSFER PAZARI — "takım arıyorum" (kendi kartın VEYA lig yöneticisi) */}
    {oturum && (benimMi || benimLigim) && typeof o.id==="string" && <div style={{padding:"10px 14px 0"}}>
      {musait
        ? <div style={{background:T.gold+"14",border:"1px solid "+T.gold+"55",borderRadius:12,padding:12}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:18}}>🔁</span>
              <div style={{flex:1}}><div style={{fontSize:13,color:T.gold,fontWeight:800}}>Transfer pazarındasın</div><div style={{fontSize:10.5,color:T.textMut}}>Kaptanlar seni "takım arayanlar" listesinde görüyor.</div></div>
            </div>
            <button onClick={()=>musaitKaydet(false)} disabled={musaitYuk} className="tap" style={{width:"100%",marginTop:9,background:T.bg2,color:T.textSoft,border:"0.5px solid "+T.line,borderRadius:10,padding:9,fontSize:12,fontWeight:700}}>{musaitYuk?"…":"Listeden çık"}</button>
          </div>
        : !musaitAcik
          ? <button onClick={()=>setMusaitAcik(true)} className="tap" style={{width:"100%",background:"transparent",color:T.gold,border:"1px dashed "+T.gold+"66",borderRadius:12,padding:12,fontSize:13,fontWeight:800}}>🔁 Takım arıyorum (transfer pazarına ekle)</button>
          : <div style={{background:T.bg1,border:"0.5px solid "+T.gold+"44",borderRadius:12,padding:13}}>
              <div style={{fontSize:12,color:T.text,fontWeight:700,marginBottom:8}}>🔁 Transfer pazarına eklen</div>
              <input value={musaitSehir} onChange={e=>setMusaitSehir(e.target.value)} placeholder="Şehir (ör: İstanbul / Kartal)" style={{width:"100%",boxSizing:"border-box",background:T.bg0,border:"0.5px solid "+T.line,borderRadius:10,padding:10,color:T.text,fontSize:13,outline:"none",fontFamily:"inherit",marginBottom:8}}/>
              <input value={musaitNot} onChange={e=>setMusaitNot(e.target.value)} placeholder="Kısa not (ör: Kaleci, hafta içi müsait)" style={{width:"100%",boxSizing:"border-box",background:T.bg0,border:"0.5px solid "+T.line,borderRadius:10,padding:10,color:T.text,fontSize:13,outline:"none",fontFamily:"inherit",marginBottom:10}}/>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>musaitKaydet(true)} disabled={musaitYuk} className="tap" style={{flex:1,background:T.gold,color:"#04070C",border:0,borderRadius:10,padding:11,fontSize:13,fontWeight:800}}>{musaitYuk?"…":"Pazara Ekle"}</button>
                <button onClick={()=>setMusaitAcik(false)} className="tap" style={{background:T.bg2,color:T.textMut,border:"0.5px solid "+T.line,borderRadius:10,padding:"11px 14px",fontSize:13,fontWeight:700}}>Vazgeç</button>
              </div>
            </div>}
    </div>}

    {/* STAT ÖZET BARI — hero altında hızlı bakış */}
    <div style={{margin:"12px 14px 2px",background:"linear-gradient(160deg,"+T.bg1+","+T.bg2+")",border:"0.5px solid "+T.line,borderRadius:14,padding:"13px 14px",display:"flex",gap:13,alignItems:"center"}}>
      <div style={{textAlign:"center",paddingRight:13,borderRight:"1px solid "+T.line,flexShrink:0}}>
        <div style={{fontSize:32,fontWeight:800,fontFamily:T.fontDisplay,color:T.gold,lineHeight:1}}>{o.ovr}</div>
        <div style={{fontSize:9,color:T.textSoft,letterSpacing:1,marginTop:2}}>{o.poz.slice(0,3).toUpperCase()}</div>
      </div>
      <div style={{flex:1,display:"grid",gridTemplateColumns:"1fr 1fr",gap:"7px 12px"}}>
        {[["HIZ",o.pac,"#34D399"],["ŞUT",o.sho,T.gold],["PAS",o.pas,T.accent2],["DRİ",o.dri,"#34D399"],["DEF",o.def,T.danger],["FİZ",o.phy,T.accent2]].map(([k,v,c])=>
          <div key={k} style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:9,color:T.textMut,width:22,fontWeight:700}}>{k}</span>
            <span style={{flex:1,height:5,background:T.bg0,borderRadius:3,overflow:"hidden"}}><i style={{display:"block",height:"100%",borderRadius:3,width:Math.min(100,v)+"%",background:c}}/></span>
            <span style={{fontSize:10,fontWeight:700,fontFamily:T.fontDisplay,width:18,textAlign:"right",color:T.text}}>{v}</span>
          </div>
        )}
      </div>
    </div>

    {/* SEKME ŞERİDİ */}
    <div style={{display:"flex",gap:0,padding:"8px 8px 0",borderBottom:"1px solid "+T.line,overflowX:"auto",position:"sticky",top:0,background:T.bg0,zIndex:5}}>
      {SEKMELER.map(([k,ad])=>
        <button key={k} onClick={()=>setSekme(k)} className="tap" style={{background:"none",border:0,padding:"9px 13px",color:sekme===k?T.accent:T.textMut,borderBottom:"2px solid "+(sekme===k?T.accent:"transparent"),fontWeight:sekme===k?700:600,fontSize:12,whiteSpace:"nowrap"}}>{ad}</button>
      )}
    </div>

    {adminMod && <div style={{padding:"10px 14px 0",display:"flex",justifyContent:"center",gap:8}}>
      <button onClick={acDuzenle} className="tap" style={{display:"flex",alignItems:"center",gap:6,background:T.bg1,border:"0.5px solid "+T.line,color:T.text,borderRadius:10,padding:"7px 14px",fontSize:11,fontWeight:600}}>⚙️ Statları Düzelt</button>
      <button onClick={acBilgi} className="tap" style={{display:"flex",alignItems:"center",gap:6,background:T.bg1,border:"0.5px solid "+T.line,color:T.text,borderRadius:10,padding:"7px 14px",fontSize:11,fontWeight:600}}>✏️ Bilgileri Düzenle</button>
    </div>}
    {duzenle && d && <StatDuzeltModal o={o} d={d} setD={setD} T={T} kaydet={kaydet} kapat={()=>setDuzenle(false)} otomatikYap={otomatikYap}/>}
    {bilgiAcik && bd && <BilgiDuzeltModal o={o} bd={bd} setBd={setBd} T={T} kaydet={kaydetBilgi} kapat={()=>setBilgiAcik(false)}/>}

    {/* ===== AKIŞ ===== */}
    {sekme==="akis" && <div className="fade-in" style={{padding:"12px 14px",display:"flex",flexDirection:"column",gap:9}}>
      {akisOlaylar.map((e,i)=>
        <div key={i} style={{background:T.bg1,borderRadius:12,padding:"11px 12px",border:"0.5px solid "+T.line,borderLeft:"3px solid "+e.renk}}>
          <div style={{fontSize:9,color:e.renk,fontWeight:700,letterSpacing:.5}}>{e.et}{e.za?" · "+e.za:""}</div>
          <div style={{fontSize:13,color:T.text,fontWeight:600,marginTop:3}}>{e.ad}</div>
          {e.alt && <div style={{fontSize:11,color:T.textMut,marginTop:2}}>{e.alt}</div>}
        </div>
      )}
    </div>}

    {/* ===== GENEL ===== */}
    {sekme==="genel" && <div className="fade-in">
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"14px 0 10px",gap:10}}>
        <FifaKart o={o} T={T}/>
        {!adminMod && o._manuel && <div style={{fontSize:10,color:T.textMut}}>✏️ Admin tarafından düzenlendi</div>}
      </div>
      {eskiTakimlar.length>0 && <div style={{padding:"0 14px 6px"}}>
        <div style={{background:T.bg1,borderRadius:12,padding:"11px 12px",border:"0.5px solid "+T.line}}>
          <div style={{fontSize:11,color:T.accent2,fontWeight:700,marginBottom:8}}>🔄 TRANSFER GEÇMİŞİ</div>
          {eskiTakimlar.map((t,i)=><div key={t.id} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderTop:i?"0.5px solid "+T.line:"none"}}>
            <span style={{fontSize:12,color:T.textSoft}}>{t.eskiAd}</span>
            <span style={{fontSize:10,color:T.accent2}}>→</span>
            <span style={{fontSize:12,color:T.text,fontWeight:600}}>{t.yeniAd}</span>
            {t.tarih && <span style={{fontSize:9,color:T.textMut,marginLeft:"auto"}}>{new Date(t.tarih).toLocaleDateString("tr-TR")}</span>}
          </div>)}
        </div>
      </div>}
      {kariyer && (kariyer.sezon_sayisi>0 || kariyer.gol>0 || kariyer.asist>0) && <div style={{padding:"0 14px 6px"}}>
        <div style={{background:"linear-gradient(135deg,"+T.gold+"12,"+T.bg1+")",borderRadius:12,padding:"12px 13px",border:"0.5px solid "+T.gold+"33"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <div style={{fontSize:11,color:T.gold,fontWeight:800,letterSpacing:.3}}>🏆 KARİYER · TÜM SEZONLAR</div>
            <div style={{fontSize:9.5,color:T.textMut}}>{kariyer.sezon_sayisi||0} sezon · {kariyer.etkili_mac||0} maç</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7}}>
            {[["Gol",kariyer.gol||0,"#34D399"],["Asist",kariyer.asist||0,T.accent],["🟨",kariyer.sari||0,T.gold],["🟥",kariyer.kirmizi||0,T.danger]].map(([k,v,c],i)=>
              <div key={i} style={{background:T.bg0,borderRadius:9,padding:"9px 4px",textAlign:"center"}}>
                <div style={{fontSize:18,fontWeight:900,color:c,fontFamily:T.fontDisplay}}>{v}</div>
                <div style={{fontSize:8.5,color:T.textMut,marginTop:1}}>{k}</div>
              </div>)}
          </div>
          <div style={{fontSize:9,color:T.textMut,marginTop:8,lineHeight:1.5}}>Sezon istatistiği yukarıdaki kartta; bu bölüm tüm liglerin toplamıdır. Yeni sezon puanları sıfırlasa da kariyer birikmeye devam eder.</div>
        </div>
      </div>}
      {benimMi && oyTakim && !saltOkunur && typeof o.id==="string" && <div style={{padding:"0 14px 8px"}}>
        <button onClick={ayrilmaGonder} disabled={ayrYuk} className="tap" style={{width:"100%",background:"none",border:"0.5px solid "+T.gold+"66",color:T.gold,borderRadius:10,padding:"10px",fontSize:12,fontWeight:700,opacity:ayrYuk?.6:1}}>🚪 {oyTakim.ad} takımından ayrılma talebi gönder</button>
        {ayrMsj && <div style={{fontSize:11,color:/✅/.test(ayrMsj)?T.accent:T.danger,textAlign:"center",marginTop:7}}>{ayrMsj}</div>}
      </div>}
      <div style={{padding:"0 14px 6px"}}>
        <button onClick={()=>alert("Kart paylaşma özelliği yakında eklenecek.")} className="tap" style={{width:"100%",background:T.bg1,border:"0.5px solid "+T.line,color:T.accent,borderRadius:10,padding:"10px",fontSize:12,fontWeight:700}}>📤 Kartı Paylaş <span style={{fontSize:9,color:T.textMut,fontWeight:500}}>· yakında</span></button>
      </div>
      <div style={{padding:"6px 14px"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,background:T.bg1,borderRadius:12,padding:"12px",border:"0.5px solid "+T.line}}>
          {[["YAŞ",o.yas],["BOY",o.boy?o.boy+" cm":"—"],["KİLO",o.kilo?o.kilo+" kg":"—"],["DEĞER","€"+o.deger+"M"]].map(([k,v],i)=>
            <div key={k} style={{textAlign:"center",borderRight:i<3?"0.5px solid "+T.line:"none"}}>
              <div style={{fontSize:9,color:T.textMut}}>{k}</div>
              <div style={{fontSize:14,fontWeight:700,color:i===3?T.accent:T.text,marginTop:2}}>{v}</div>
            </div>
          )}
        </div>
      </div>
      <div style={{padding:"6px 14px"}}>
        <div style={{background:T.bg1,borderRadius:12,padding:"13px 12px",border:"0.5px solid "+T.line}}>
          <div style={{fontSize:11,color:T.gold,fontWeight:700,marginBottom:10}}>📊 SEZON İSTATİSTİKLERİ</div>
          {/* her oyuncuda aynı: ne girildiyse o görünür, mevki önemsiz */}
          <div style={{display:"flex",gap:6,marginBottom:8}}>
            {[["MAÇ",o.mac||0,T.text],["DAKİKA",toplamDk,T.text],["GOL",o.gol,"#34D399"],["ASİST",o.asist,T.accent2||T.accent]].map(([k,v,c])=>
              <div key={k} style={{flex:1,background:T.bg2,borderRadius:9,padding:"10px 4px",textAlign:"center"}}>
                <SayacSayi deger={v} style={{fontSize:17,fontWeight:800,color:c,fontFamily:T.fontDisplay,display:"block"}}/>
                <div style={{fontSize:8,color:T.textMut,marginTop:1}}>{k}</div>
              </div>
            )}
          </div>
          {/* ikinci satır: kurtarış + kart (kim ne yaptıysa) */}
          <div style={{display:"flex",gap:6,marginBottom:10}}>
            {[["KURTARIŞ",o.kurtaris||0,T.gold],["MVP",o.mvp||0,T.gold],["SARI",o.sari||0,"#E2B100"],["KIRMIZI",o.kirmizi||0,T.danger]].map(([k,v,c])=>
              <div key={k} style={{flex:1,background:T.bg2,borderRadius:9,padding:"10px 4px",textAlign:"center"}}>
                <SayacSayi deger={v} style={{fontSize:17,fontWeight:800,color:v>0?c:T.textMut,fontFamily:T.fontDisplay,display:"block"}}/>
                <div style={{fontSize:8,color:T.textMut,marginTop:1}}>{k}</div>
              </div>
            )}
          </div>
          {/* verim */}
          <div style={{fontSize:9,color:T.textMut,fontWeight:600,margin:"4px 2px 6px"}}>VERİM</div>
          {[["⚽ Gol / maç",golOrt.toFixed(2),T.text],["📈 Katkı / 90 dk",per90.toFixed(2),T.gold],["⏱️ Dakika / maç",(o.mac>0?Math.round(toplamDk/o.mac):0),T.text],...(o.kurtaris>0?[["🧤 Kurtarış / maç",(o.mac>0?(o.kurtaris/o.mac).toFixed(1):"0"),T.text]]:[])].map(([et,v,c])=>
            <div key={et} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:T.bg2,borderRadius:8,padding:"8px 11px",marginBottom:4}}>
              <span style={{fontSize:11,color:T.textSoft}}>{et}</span>
              <span style={{fontSize:13,fontWeight:700,color:c,fontFamily:T.fontDisplay}}>{v}</span>
            </div>
          )}
          <div style={{fontSize:9,color:T.textMut,textAlign:"center",marginTop:8,lineHeight:1.5}}>Katkı/90 = (gol+asist) × 90 ÷ dakika · az oynayanın verimini gösterir{toplamDk===0?" · dakika için maçı sihirbazla kaydet (kadro+süre)":""}</div>
        </div>
      </div>
      <div style={{padding:"6px 14px"}}>
        <div style={{background:T.bg1,borderRadius:14,padding:14,border:"0.5px solid "+T.line}}>
          <div style={{fontSize:11,color:T.gold,fontWeight:700,marginBottom:12}}>🏆 ÖDÜLLER</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
            {oduller.map((od,i)=>
              <div key={i} className="pop" style={{background:T.bg2,borderRadius:10,padding:"10px 4px",textAlign:"center"}}>
                <div style={{fontSize:18}}>{od.ik}</div>
                <div style={{fontSize:15,fontWeight:800,color:T.accent,fontFamily:T.fontDisplay,marginTop:2}}>{od.s}</div>
                <div style={{fontSize:8,color:T.textMut,marginTop:1}}>{od.ad}</div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div style={{padding:"6px 14px"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <div style={{background:T.bg1,borderRadius:14,padding:14,border:"0.5px solid "+T.line}}>
            <div style={{fontSize:11,color:T.danger,fontWeight:700,marginBottom:8}}>📋 DİSİPLİN</div>
            <div style={{fontSize:12,color:T.text,lineHeight:1.9}}>
              {(o.sari+o.kirmizi)===0?<span style={{color:T.accent}}>✓ Temiz sicil</span>:<>🟨 {o.sari} sarı<br/>🟥 {o.kirmizi} kırmızı</>}
            </div>
          </div>
          <div style={{background:T.gold+"14",borderRadius:14,padding:14,border:"0.5px solid "+T.gold+"33"}}>
            <div style={{fontSize:11,color:T.gold,fontWeight:700,marginBottom:8}}>👑 GOAT PUANI</div>
            <div style={{fontSize:26,fontWeight:800,color:T.gold,fontFamily:T.fontDisplay}}>{goat}</div>
            <div style={{fontSize:10,color:T.textMut}}>Gol ort: {golOrt.toFixed(2)}</div>
          </div>
        </div>
      </div>
    </div>}

    {/* ===== İSTATİSTİK ===== */}
    {sekme==="ist" && <div className="fade-in">
      <div style={{padding:"12px 14px 6px"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          {[["MAÇ",o.mac,T.text],["GOL",o.gol,T.accent],["ASİST",o.asist,T.accent2],["KURTARIŞ",o.kurtaris,T.gold],["SARI",o.sari,T.gold],["KIRMIZI",o.kirmizi,T.danger]].map(([k,v,c])=>
            <div key={k} className="pop" style={{background:T.bg1,borderRadius:12,padding:"14px 8px",textAlign:"center",border:"0.5px solid "+T.line}}>
              <Sayac hedef={v} T={T} renk={c} boy={22}/>
              <div style={{fontSize:9,color:T.textMut,marginTop:3}}>{k}</div>
            </div>
          )}
        </div>
      </div>
      <div style={{padding:"6px 14px"}}>
        <div className="prem-shadow" style={{background:T.bg1,borderRadius:14,padding:14,border:"0.5px solid "+T.line}}>
          <div style={{fontSize:11,color:T.accent,fontWeight:700,marginBottom:12}}>⚡ YETENEKLER</div>
          {[["HIZ",o.pac],["ŞUT",o.sho],["PAS",o.pas],["DRİBLİNG",o.dri],["SAVUNMA",o.def],["FİZİK",o.phy]].map(([k,v])=>
            <div key={k} style={{display:"flex",alignItems:"center",gap:10,marginBottom:9}}>
              <span style={{fontSize:11,color:T.textSoft,width:64}}>{k}</span>
              <div style={{flex:1,height:9,background:T.bg2,borderRadius:5,overflow:"hidden"}}>
                <div className="bar-grow" style={{width:v+"%",height:"100%",background:v>=85?"#34D399":v>=70?T.accent2:v>=55?T.gold:T.danger,borderRadius:5}}/>
              </div>
              <span style={{fontSize:12,fontWeight:700,color:v>=85?"#34D399":T.text,width:24,textAlign:"right"}}>{v}</span>
            </div>
          )}
        </div>
      </div>
      <div style={{padding:"6px 14px"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <div style={{background:T.bg1,borderRadius:14,padding:14,border:"0.5px solid "+T.line}}>
            <div style={{fontSize:11,color:T.textMut,fontWeight:600,marginBottom:6}}>YETENEK RADARI</div>
            <div style={{display:"flex",justifyContent:"center"}}><Radar o={o} T={T} boy={140}/></div>
          </div>
          <div style={{background:T.bg1,borderRadius:14,padding:14,border:"0.5px solid "+T.line}}>
            <div style={{fontSize:11,color:T.textMut,fontWeight:600,marginBottom:6}}>AYLIK GOL</div>
            <BarGrafik seri={aylikGol} etiketler={["Oca","Şub","Mar","Nis","May","Haz"]} T={T} renk={T.accent} h={120}/>
          </div>
        </div>
      </div>
      <div style={{padding:"6px 14px"}}>
        <div style={{background:T.bg1,borderRadius:14,padding:14,border:"0.5px solid "+T.line}}>
          <div style={{fontSize:11,color:T.textMut,fontWeight:600,marginBottom:12}}>LİG ORTALAMASINA GÖRE</div>
          <KiyasBar etiket="Gol" deger={o.gol} ort={7} T={T} renk={T.accent}/>
          <KiyasBar etiket="Asist" deger={o.asist} ort={5} T={T} renk={T.accent2}/>
          <KiyasBar etiket="Reyting (OVR)" deger={o.ovr} ort={72} T={T} renk={T.gold}/>
        </div>
      </div>
      <div style={{padding:"6px 14px"}}>
        <div style={{background:T.bg1,borderRadius:14,padding:14,border:"0.5px solid "+T.line}}>
          <div style={{fontSize:11,color:T.textMut,fontWeight:600,marginBottom:8}}>FORM TRENDİ (son 8 maç)</div>
          <Sparkline seri={formSeri} T={T} w={300} h={70}/>
        </div>
      </div>
    </div>}

    {/* ===== MAÇ GEÇMİŞİ ===== */}
    {sekme==="mac" && <div className="fade-in">
      <div style={{padding:"12px 14px 6px"}}>
        <div style={{background:T.bg1,borderRadius:14,padding:14,border:"0.5px solid "+T.line}}>
          <div style={{fontSize:11,color:T.accent2,fontWeight:700,marginBottom:10}}>⚽ SON MAÇLAR</div>
          {sonMaclar.length===0 ? <div style={{fontSize:12,color:T.textMut}}>Henüz maç yok</div> :
            sonMaclar.map((m,i)=>{ const galip=m.benim>m.rakipS;
              return <div key={i} className="tap" style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:i<sonMaclar.length-1?"0.5px solid "+T.line:"none"}}>
                <div style={{width:6,height:32,borderRadius:3,background:galip?T.accent:(m.benim===m.rakipS?T.textMut:T.danger)}}/>
                <div style={{flex:1}}><div style={{fontSize:12,color:T.text}}>{o.takimAd} <span style={{color:T.accent}}>{m.benim}-{m.rakipS}</span> {m.rakip}</div><div style={{fontSize:10,color:T.textMut,marginTop:2}}>{m.gol>0?m.gol+" gol":"oynadı"}{m.kart?" · 🟥":""}</div></div>
                <span style={{color:T.textMut,fontSize:16}}>›</span>
              </div>;
            })}
        </div>
      </div>
      <div style={{padding:"6px 14px"}}>
        <div style={{fontSize:13,fontWeight:700,color:T.text,margin:"0 2px 10px"}}>🎯 Sezon Hedefleri</div>
        <div style={{display:"flex",justifyContent:"space-around",background:T.bg1,borderRadius:14,padding:"16px 8px",border:"0.5px solid "+T.line}}>
          <Halka oran={Math.min(1,o.gol/20)} etiket="20 Gol" alt={o.gol+"/20"} T={T} renk={T.accent}/>
          <Halka oran={Math.min(1,o.asist/15)} etiket="15 Asist" alt={o.asist+"/15"} T={T} renk={T.accent2}/>
          <Halka oran={Math.min(1,o.mac/22)} etiket="22 Maç" alt={o.mac+"/22"} T={T} renk={T.gold}/>
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
                <span style={{fontSize:11,color:T.gold,fontWeight:600}}>{kalan} daha</span>
              </div>
              <div style={{height:7,background:T.bg2,borderRadius:5,overflow:"hidden"}}>
                <div className="bar-grow" style={{width:(oran*100)+"%",height:"100%",background:T.gold,borderRadius:5}}/>
              </div>
              <div style={{fontSize:9,color:T.textMut,marginTop:2}}>{h.cur}/{h.hedef} · %{Math.round(oran*100)}</div>
            </div>;
          })}
        </div>
      </div>
      <div style={{padding:"6px 14px"}}>
        <div style={{background:T.bg1,borderRadius:14,padding:14,border:"0.5px solid "+T.line}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <span style={{fontSize:11,color:T.accent,fontWeight:700}}>🏅 BAŞARI ROZETLERİ</span>
            <span style={{fontSize:11,color:T.gold,fontWeight:600}}>{kazanilan} rozet</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {rozetler.filter(r=>r.k).map((r,i)=>
              <div key={i} className="pop" style={{display:"flex",alignItems:"center",gap:8,background:T.danger+"14",borderRadius:10,padding:"9px 11px",border:"0.5px solid "+T.danger+"33"}}>
                <span style={{fontSize:18}}>{r.ikon}</span>
                <div><div style={{fontSize:11,color:T.text,fontWeight:600}}>{r.ad}</div><div style={{fontSize:9,color:T.textMut}}>{r.aclk}</div></div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div style={{padding:"6px 14px"}}>
        <div style={{background:T.bg1,borderRadius:14,padding:14,border:"0.5px solid "+T.line}}>
          <div style={{fontSize:11,color:T.accent,fontWeight:700,marginBottom:10}}>📋 POZİSYON & DURUM</div>
          {[["Mevki",o.poz],["Kullandığı Ayak",o.ayak||"—"],["Oynadığı Bölge",o.bolge],["Yaş",String((o.yas||yasHesap(o.dogum))||"—")],["Sağlık",o.saglik==="Sağlam"?"💚 Sağlam":"🤕 Sakat"],["Forma No","#"+o.no],["Lisans No",o.lisNo||"—"]].map(([k,v],i,arr)=>
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:i<arr.length-1?"0.5px solid "+T.line:"none"}}>
              <span style={{fontSize:12,color:T.textMut}}>{k}</span>
              <span style={{fontSize:12,color:T.text,fontWeight:500}}>{v}</span>
            </div>
          )}
        </div>
      </div>
      {/* ROZETLER */}
      <div style={{padding:"6px 14px 14px"}}>
        <div className="prem-shadow" style={{background:T.bg1,borderRadius:14,padding:14,border:"0.5px solid "+T.line}}>
          <div style={{fontSize:11,color:T.gold,fontWeight:700,marginBottom:12}}>🏅 BAŞARILAR</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {(()=>{
              const rz=[];
              const g=o.gol||0, a=o.asist||0, mvp=o.mvp||0, kurt=o.kurtaris||0, mac=o.mac||0;
              rz.push({ik:"⚽",ad:"İlk Gol",ac:g>=1});
              rz.push({ik:"🎩",ad:"Golcü",ad2:"10 Gol",ac:g>=10});
              rz.push({ik:"💥",ad:"30 Gol Kulübü",ac:g>=30});
              rz.push({ik:"🎯",ad:"Asist Ustası",ad2:"10 Asist",ac:a>=10});
              rz.push({ik:"⭐",ad:"Yıldız",ad2:"MVP",ac:mvp>=1});
              rz.push({ik:"🏆",ad:"Efsane",ad2:"5 MVP",ac:mvp>=5});
              if(o.poz==="Kaleci"){ rz.push({ik:"🧤",ad:"Kaleye Kilit",ad2:"20 Kurtarış",ac:kurt>=20}); }
              rz.push({ik:"🔥",ad:"Tecrübeli",ad2:"20 Maç",ac:mac>=20});
              return rz.map((r,i)=>
                <div key={i} style={{flex:"1 1 78px",minWidth:78,textAlign:"center",borderRadius:11,padding:"11px 5px",
                  background:r.ac?`linear-gradient(135deg, ${T.gold}1e, transparent)`:T.bg2,
                  border:"1px solid "+(r.ac?T.gold+"44":T.line),opacity:r.ac?1:.45}}>
                  <div style={{fontSize:20,marginBottom:3,filter:r.ac?"none":"grayscale(1)"}}>{r.ac?r.ik:"🔒"}</div>
                  <div style={{fontSize:9,color:r.ac?T.gold:T.textMut,fontWeight:700,lineHeight:1.2}}>{r.ad}</div>
                  {r.ad2 && <div style={{fontSize:8,color:T.textMut,marginTop:1}}>{r.ad2}</div>}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>}

    {sekme==="lisans" && <LisansKarti o={o} turnuva={turnuvalar&&turnuvalar.find(t=>t.ad===o.turnuva)} T={T}/>}

  </div>;
}

/* BİLGİLERİ DÜZENLE MODAL — kimlik bilgileri (ayak, doğum, boy vb.) */
function BilgiDuzeltModal({o, bd, setBd, T, kaydet, kapat}){
  const g=(k,v)=>setBd({...bd,[k]:v});
  const inp={width:"100%",background:T.bg2,border:"0.5px solid "+T.line,borderRadius:10,padding:"10px",color:T.text,fontSize:13,fontWeight:600,fontFamily:"inherit",outline:"none",boxSizing:"border-box"};
  const lbl={fontSize:11,color:T.textMut,fontWeight:700,marginBottom:5};
  const pozlar=["Kaleci","Defans","OrtaSaha","Forvet"];
  const pozAd={Kaleci:"Kaleci",Defans:"Defans",OrtaSaha:"Orta Saha",Forvet:"Forvet"};
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={kapat}>
    <div onClick={e=>e.stopPropagation()} className="fade-in" style={{background:T.bg1,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:480,maxHeight:"88vh",overflowY:"auto",padding:"18px 16px 24px",border:"0.5px solid "+T.line}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
        <span style={{fontSize:16,fontWeight:700,color:T.text,fontFamily:T.fontDisplay}}>✏️ Bilgileri Düzenle</span>
        <button onClick={kapat} className="tap" style={{fontSize:20,color:T.textMut,background:"none",border:0}}>✕</button>
      </div>
      <div style={{fontSize:11,color:T.textMut,marginBottom:14}}>Lisans No: {o.lisNo||"—"} (değişmez)</div>

      <div style={{display:"flex",justifyContent:"center",marginBottom:14}}>
        <div style={{position:"relative"}}>
          <div style={{width:76,height:76,borderRadius:"50%",overflow:"hidden",border:"2px solid "+T.accent+"66",background:T.bg2}} dangerouslySetInnerHTML={{__html:svgAvatar(bd.ad||o.ad||"?",76,bd.foto)}}/>
          <label className="tap" title="Fotoğraf ekle/değiştir" style={{position:"absolute",bottom:0,right:0,background:T.accent,color:T.bg0,borderRadius:"50%",width:26,height:26,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,cursor:"pointer",border:"2px solid "+T.bg1}}>📷
            <input type="file" accept="image/*" onChange={async e=>{ const f=e.target.files&&e.target.files[0]; if(!f)return; const r=await fotoYukle(f,"oyuncu"); if(r&&r.url) g("foto",r.url); else alert((r&&r.hata)||"Fotoğraf yüklenemedi (giriş gerekli)."); e.target.value=""; }} style={{display:"none"}}/></label>
          {bd.foto && <div onClick={()=>g("foto",null)} className="tap" title="Fotoğrafı kaldır" style={{position:"absolute",top:0,right:0,background:T.danger,color:"#fff",borderRadius:"50%",width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,cursor:"pointer",border:"2px solid "+T.bg1}}>✕</div>}
        </div>
      </div>

      <div style={{marginBottom:12}}><div style={lbl}>AD SOYAD</div><input value={bd.ad} onChange={e=>g("ad",e.target.value)} style={inp}/></div>

      <div style={{display:"flex",gap:10,marginBottom:12}}>
        <div style={{flex:2}}><div style={lbl}>MEVKİ</div>
          <div style={{display:"flex",gap:4}}>
            {pozlar.map(p=><span key={p} onClick={()=>g("poz",p)} className="tap" style={{flex:1,textAlign:"center",fontSize:10,padding:"9px 2px",borderRadius:8,background:bd.poz===p?T.accent:T.bg2,color:bd.poz===p?"#fff":T.textMut,fontWeight:bd.poz===p?700:500}}>{pozAd[p]}</span>)}
          </div>
        </div>
        <div style={{width:70}}><div style={lbl}>FORMA NO</div><input type="number" value={bd.no} onChange={e=>g("no",e.target.value)} style={inp}/></div>
      </div>

      <div style={{marginBottom:12}}><div style={lbl}>KULLANDIĞI AYAK</div>
        <div style={{display:"flex",gap:6}}>
          {["Sağ","Sol","Çift"].map(a=><span key={a} onClick={()=>g("ayak",a)} className="tap" style={{flex:1,textAlign:"center",fontSize:12,padding:"10px",borderRadius:9,background:bd.ayak===a?"#34D399":T.bg2,color:bd.ayak===a?"#06140d":T.textMut,fontWeight:bd.ayak===a?700:500}}>{a}</span>)}
        </div>
      </div>

      <div style={{marginBottom:12}}><div style={lbl}>DOĞUM TARİHİ (GG.AA.YYYY)</div><input value={bd.dogum} onChange={e=>g("dogum",e.target.value)} placeholder="01.01.1990" style={inp}/></div>

      <div style={{display:"flex",gap:10,marginBottom:12}}>
        <div style={{flex:1}}><div style={lbl}>BOY (cm)</div><input type="number" value={bd.boy} onChange={e=>g("boy",e.target.value)} style={inp}/></div>
        <div style={{flex:1}}><div style={lbl}>KİLO (kg)</div><input type="number" value={bd.kilo} onChange={e=>g("kilo",e.target.value)} style={inp}/></div>
      </div>

      <div style={{display:"flex",gap:10,marginBottom:16}}>
        <div style={{flex:1}}><div style={lbl}>UYRUK</div><input value={bd.uyruk} onChange={e=>g("uyruk",e.target.value)} placeholder="Türkiye" style={inp}/></div>
        <div style={{flex:1}}><div style={lbl}>SAĞLIK</div>
          <div style={{display:"flex",gap:6}}>
            {["Sağlam","Sakat"].map(s=><span key={s} onClick={()=>g("saglik",s)} className="tap" style={{flex:1,textAlign:"center",fontSize:11,padding:"10px 2px",borderRadius:9,background:bd.saglik===s?(s==="Sağlam"?"#34D399":T.danger):T.bg2,color:bd.saglik===s?"#fff":T.textMut,fontWeight:bd.saglik===s?700:500}}>{s==="Sağlam"?"💚":"🤕"} {s}</span>)}
          </div>
        </div>
      </div>

      <button onClick={kaydet} className="tap" style={{width:"100%",padding:13,borderRadius:12,background:T.accent,color:"#fff",fontSize:14,fontWeight:700,border:0}}>✓ Kaydet</button>
    </div>
  </div>;
}

/* STAT DÜZELT MODAL — sadece admin (FatihPro FC26 düzenleme ekranı referansı) */
function StatDuzeltModal({o, d, setD, T, kaydet, kapat, otomatikYap}){
  const stat=(k,v)=> setD({...d,[k]:Math.max(30,Math.min(99,v))});
  const ovrHesap=Math.round((d.pac+d.sho+d.pas+d.dri+d.def+d.phy)/6);
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={kapat}>
    <div onClick={e=>e.stopPropagation()} className="fade-in" style={{background:T.bg1,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:480,maxHeight:"88vh",overflowY:"auto",padding:"18px 16px 24px",border:"0.5px solid "+T.line}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
        <span style={{fontSize:16,fontWeight:700,color:T.text,fontFamily:T.fontDisplay}}>🎮 FIFA Kart Düzenle</span>
        <button onClick={kapat} className="tap" style={{fontSize:20,color:T.textMut}}>✕</button>
      </div>
      <div style={{fontSize:12,color:T.textMut,marginBottom:14}}>{o.ad} · {o.poz} · #{o.no}</div>

      {/* OVR / Yıldız / Değer */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
        <div style={{background:T.bg2,borderRadius:10,padding:"10px",textAlign:"center"}}>
          <div style={{fontSize:9,color:T.textMut}}>OVR</div>
          <div style={{fontSize:22,fontWeight:800,color:T.accent,fontFamily:T.fontDisplay}}>{d.ovr||ovrHesap}</div>
        </div>
        <div style={{background:T.bg2,borderRadius:10,padding:"10px",textAlign:"center"}}>
          <div style={{fontSize:9,color:T.textMut,marginBottom:4}}>YILDIZ</div>
          <div style={{display:"flex",justifyContent:"center",gap:2}}>
            {[1,2,3,4,5].map(n=><span key={n} onClick={()=>setD({...d,yildizManuel:n})} style={{fontSize:16,cursor:"pointer",color:n<=(d.yildizManuel||0)?T.gold:T.line}}>★</span>)}
          </div>
        </div>
        <div style={{background:T.bg2,borderRadius:10,padding:"10px",textAlign:"center"}}>
          <div style={{fontSize:9,color:T.textMut}}>DEĞER (M€)</div>
          <input type="number" value={d.deger} onChange={e=>setD({...d,deger:parseFloat(e.target.value)||0})} style={{width:"100%",background:"transparent",border:"none",color:T.gold,fontSize:16,fontWeight:700,textAlign:"center",fontFamily:T.fontDisplay}}/>
        </div>
      </div>

      {/* 6 stat slider */}
      <div style={{fontSize:11,color:T.accent,fontWeight:700,marginBottom:10}}>6 ANA İSTATİSTİK (30–99)</div>
      {[["pac","HIZ"],["sho","ŞUT"],["pas","PAS"],["dri","DRİBLİNG"],["def","DEFANS"],["phy","FİZİK"]].map(([k,l])=>
        <div key={k} style={{marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
            <span style={{fontSize:12,color:T.textSoft}}>{l}</span>
            <span style={{fontSize:14,fontWeight:700,color:T.gold}}>{d[k]}</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <button onClick={()=>stat(k,d[k]-1)} className="tap" style={{width:28,height:28,borderRadius:7,background:T.bg2,color:T.text,fontSize:16}}>−</button>
            <input type="range" min="30" max="99" value={d[k]} onChange={e=>stat(k,parseInt(e.target.value))} style={{flex:1,accentColor:T.accent}}/>
            <button onClick={()=>stat(k,d[k]+1)} className="tap" style={{width:28,height:28,borderRadius:7,background:T.bg2,color:T.text,fontSize:16}}>+</button>
          </div>
        </div>
      )}

      {/* butonlar */}
      <div style={{display:"flex",gap:8,marginTop:18}}>
        <button onClick={otomatikYap} className="tap" style={{flex:1,background:T.bg2,color:T.textSoft,borderRadius:10,padding:"12px",fontSize:13,fontWeight:600}}>↻ Otomatik Yap</button>
        <button onClick={()=>{ if(!d.ovr)setD({...d,ovr:ovrHesap}); kaydet(); }} className="tap" style={{flex:1,background:T.accent,color:T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0,borderRadius:10,padding:"12px",fontSize:13,fontWeight:700}}>💾 Kaydet</button>
      </div>
      <div style={{fontSize:10,color:T.textMut,textAlign:"center",marginTop:10}}>"Otomatik Yap": sistemin hesapladığı gerçek değerlere döner</div>
    </div>
  </div>;
}

/* MAÇ SAYFASI */
/* FAZ 10 — Maçın Adamı oylaması (B+C hibrit) */
function MvpOylama({m, turnuva, kadro, T, oturum, sahiplenme}){
  const slug = turnuva && turnuva.paylasimSlug;
  const [oylar,setOylar]=useState([]);
  const [benimOyum,setBenimOyum]=useState(null);
  const [yuk,setYuk]=useState(!!slug);
  const [gonder,setGonder]=useState(false);
  const [mesaj,setMesaj]=useState("");
  const benId = sahiplenme && sahiplenme.oyuncu_id;
  const kadromda = benId!=null && kadro.some(o=>o.id===benId);
  const oyVerebilir = !!(slug && oturum && kadromda);

  useEffect(()=>{
    if(!slug){ setYuk(false); return; }
    let a=true;
    (async()=>{
      const list=await Oy.oylar(slug, m.id);
      if(!a) return;
      setOylar(list);
      if(oturum){ const b=list.find(x=>x.oyveren_id===oturum.id); setBenimOyum(b?b.secilen_id:null); }
      setYuk(false);
    })();
    return ()=>{ a=false; };
  },[slug, m.id, oturum]);

  const oyla=async(sec)=>{
    if(!oyVerebilir || gonder) return;
    if(benId===sec.id){ setMesaj("Kendine oy veremezsin."); return; }
    setGonder(true); setMesaj("");
    const r=await Oy.oyla(slug, m.id, oturum.id, sec);
    setGonder(false);
    if(r.ok){ const list=await Oy.oylar(slug, m.id); setOylar(list); setBenimOyum(sec.id); setMesaj("Oyun kaydedildi ✓"); }
    else { let e=r.hata||""; if(/schema cache|find the table|does not exist/i.test(e)) e="Sunucu tabloyu yeni fark ediyor — 1 dk sonra dene."; else if(/permission denied/i.test(e)) e="İzin hatası — bana haber ver."; setMesaj("Olmadı: "+e); }
  };

  // sayım + sıralama
  const sayim={}; oylar.forEach(o=>{ sayim[o.secilen_id]=(sayim[o.secilen_id]||0)+1; });
  const sirali=kadro.map(o=>({o, oy:sayim[o.id]||0})).sort((a,b)=>b.oy-a.oy);
  const toplam=oylar.length;
  const ESIK=2;
  let mvp=null, otomatik=false;
  if(toplam>=ESIK && sirali[0] && sirali[0].oy>0){ mvp=sirali[0].o; }
  else { otomatik=true; mvp = kadro.find(o=>o.ad===m.mvp) || [...kadro].sort((a,b)=>(b.ovr||0)-(a.ovr||0))[0] || null; }
  const mvpOy = mvp ? (sayim[mvp.id]||0) : 0;

  if(!slug){
    // yayınlanmamış lig → oylama yok, sadece bilgi
    return <div style={{padding:"10px 14px 0"}}>
      <div style={{background:T.bg1,border:"0.5px dashed "+T.line,borderRadius:12,padding:12,fontSize:11,color:T.textMut,textAlign:"center",lineHeight:1.6}}>
        ⭐ <b style={{color:T.textSoft}}>Maçın Adamı oylaması</b> için ligi <b style={{color:T.accent}}>herkese açık</b> yap (lig sayfası → 🔗 Paylaş). Sonra o maçta oynayanlar oy verebilir.
      </div>
    </div>;
  }

  return <div style={{padding:"10px 14px 0"}}>
    <div style={{background:`linear-gradient(135deg, ${T.gold}1a, ${T.bg1})`,borderRadius:14,padding:14,border:"0.5px solid "+T.gold+"44"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
        <span style={{fontSize:15}}>⭐</span>
        <span style={{fontFamily:T.fontDisplay,fontSize:14,fontWeight:800,color:T.text}}>Maçın Adamı</span>
        <span style={{marginLeft:"auto",fontSize:10,color:T.textMut}}>{toplam} oy</span>
      </div>

      {yuk ? <div style={{fontSize:12,color:T.textMut,textAlign:"center",padding:10}}>Yükleniyor…</div> : <>
        {/* MVP kartı */}
        {mvp && <div style={{display:"flex",alignItems:"center",gap:11,background:T.gold+"14",borderRadius:11,padding:10,marginBottom:10}}>
          <div style={{width:42,height:42,borderRadius:"50%",overflow:"hidden",border:"2px solid "+T.gold,flexShrink:0}} dangerouslySetInnerHTML={{__html:svgAvatar(mvp.ad,42,mvp.foto)}}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:9,color:T.gold,fontWeight:800,letterSpacing:.5}}>🏆 ÖNDE</div>
            <div style={{fontSize:14,fontWeight:800,color:T.text}}>{mvp.ad}</div>
            <div style={{fontSize:10,color:T.textMut}}>{otomatik?"otomatik (yeterli oy yok) · istatistik lideri":mvpOy+" oy"}</div>
          </div>
        </div>}

        {/* oy verme */}
        {oyVerebilir ? <>
          <div style={{fontSize:10,color:T.textMut,fontWeight:700,margin:"2px 0 7px"}}>{benimOyum?"OYUNU DEĞİŞTİREBİLİRSİN":"KİMİ SEÇİYORSUN?"}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            {kadro.map(o=>{ const ben=o.id===benId; const secili=benimOyum===o.id;
              return <div key={o.id} onClick={()=>!ben&&oyla(o)} className={ben?"":"tap"} style={{display:"flex",alignItems:"center",gap:7,background:secili?T.accent+"22":T.bg0,border:"1px solid "+(secili?T.accent:T.line),borderRadius:9,padding:"7px 8px",opacity:ben?.4:1,cursor:ben?"default":"pointer"}}>
                <div style={{width:24,height:24,borderRadius:"50%",overflow:"hidden",flexShrink:0}} dangerouslySetInnerHTML={{__html:svgAvatar(o.ad,24,o.foto)}}/>
                <span style={{fontSize:11,color:T.text,flex:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{ben?"Sen":o.ad.split(" ")[0]} {ben?"":( sayim[o.id]?"· "+sayim[o.id]:"")}</span>
                {secili && <span style={{fontSize:11,color:T.accent}}>✓</span>}
              </div>;
            })}
          </div>
          {mesaj && <div style={{fontSize:11,color:/kaydedildi|✓/.test(mesaj)?T.accent:T.danger,textAlign:"center",marginTop:9}}>{mesaj}</div>}
          <div style={{fontSize:9,color:T.textMut,textAlign:"center",marginTop:9,lineHeight:1.5}}>🔒 1 kişi 1 oy · kendine veremezsin · yönetici düzeltebilir</div>
        </> : <div style={{fontSize:11,color:T.textMut,textAlign:"center",padding:"4px 0",lineHeight:1.6}}>
          {!oturum ? "Oy vermek için giriş yap." : !sahiplenme ? "Oy vermek için bu maçtaki oyuncunu sahiplen (oyuncu sayfası → ⭐ bu oyuncu benim)." : !kadromda ? "Bu maçta oynamadığın için sadece sonucu görebilirsin." : "Sonuç görünüyor."}
        </div>}
      </>}
    </div>
  </div>;
}

