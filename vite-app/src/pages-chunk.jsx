import React from 'react';
// ForzaLig sayfa kümesi — talep-üzerine (git ile gidilince). Bağımlılıklar main'den enjekte.
export function make(D){
  const { AnketKart, Avatar, BarGrafik, Baslik, BilgiAlan, BilgiDuzeltModal, BosPazar, BosUyari, CanliYayin, DAVET_URL, DIZILIS_SABLON, Db, Donut, FL_EMOJILER, FifaKart, FormRozet, FzImza, HAKEM_GOREVLER, Halka, ISTATISTIK_SATIRLAR, IlanVerModal, IlanYanitModal, KadroKolon, KiyasBar, KiyasSatir, KpiMini, KralListe, KupaBracket, LiderMiniKart, LigIstatistik, LigKurallar, LisansKarti, Logo, MAC_ODUL_ETIKET, MacMedyaKart, MacSatir, MaclarSayfa, MiniIstatBanner, Motor, MvpOylama, OneCikan, PAYLASIM_URL, PAYLASIM_URL_TEMIZ, Paylas, Podyum, PuanDurumu, PushAyar, RENK_TEMA, Radar, STILLER, SahaDizilis, Sayac, SayacSayi, SezonSerisi, SihirbazDegisKutu, SihirbazGolKutu, SihirbazKartKutu, SihirbazOzetSatir, Sparkline, StatDuzeltModal, TAKIM_ADLARI, TakipLigIcerik, YardimciYonetim, YeniSezonPop, YonetimPaneli, fmtEuro, fotoYukle, hakemDurustur, hakemGorevSonraki, hakemParse, hash, kalanSure, kufurVar, macYorumUret, pick, posAd, qrData, rnd, sb, sesYukle, slotlariUret, svgAmblem, svgAvatar, tarihISO, trTarih, useEffect, useMemo, useRef, useState, yasHesap } = D;

function ProfilSayfa({turnuvalar, T, takipLig, takipOyuncu, takipTakim, git, kapiAc, oturum, cikisYap, sahiplenme, onSahiplenmeBirak, adminMi, profil, destekBilgi, bildirimListe}){
  const kariyereGit=()=>{
    if(!sahiplenme) return;
    // yerelde oyuncuyu bul
    let bulunan=null, bulunanT=null;
    turnuvalar.forEach(t=>t.takimlar.forEach(tk=>tk.oyuncular.forEach(o=>{ if(o.id===sahiplenme.oyuncu_id||o.ad===sahiplenme.oyuncu_ad){ bulunan=o; bulunanT=t; } })));
    if(bulunan){ git({sayfa:"oyuncu",oyuncu:{...bulunan,turnuva:bulunanT.ad}}); }
    else if(sahiplenme.lig_slug){ window.location.href=PAYLASIM_URL(sahiplenme.lig_slug); }
  };
  const tumOyuncular=useMemo(()=>Motor.tumOyuncular(turnuvalar),[turnuvalar]);
  const [kztMac,setKztMac]=useState(null);   // Kariyer Zaman Tüneli — oyuncunun tarihli maçları (null=henüz yüklenmedi)
  // takip edilen oyuncu/takım/lig sayıları
  const takipOyuncuList = tumOyuncular.filter(o=> (takipOyuncu||[]).includes(o.id));
  const takipTakimList=[]; turnuvalar.forEach(t=>t.takimlar.forEach(tk=>{ if((takipTakim||[]).includes(tk.id)) takipTakimList.push({...tk,turnuva:t.ad,_t:t}); }));
  const takipLigList = turnuvalar.filter(t=>(takipLig||[]).includes(t.id));
  const toplamTakip = takipOyuncuList.length+takipTakimList.length+takipLigList.length;
  // genel istatistik özeti
  const toplamMac = turnuvalar.reduce((s,t)=>s+t.maclar.filter(m=>m.oynandi).length,0);
  const toplamGol = turnuvalar.reduce((s,t)=>s+t.maclar.reduce((a,m)=>a+(m.oynandi?(m.skorA||0)+(m.skorB||0):0),0),0);

  const Sat=({ik,metin,sag,onClick})=> <div onClick={onClick} className="tap satir-hover" style={{display:"flex",alignItems:"center",gap:11,background:T.bg1,border:"0.5px solid "+T.line,borderRadius:11,padding:"12px 13px",marginBottom:6}}>
    <span style={{fontSize:18}}>{ik}</span><span style={{flex:1,fontSize:13,color:T.text}}>{metin}</span>
    {sag!=null && <span style={{fontSize:11,color:T.textMut,marginRight:4}}>{sag}</span>}<span style={{fontSize:12,color:T.textMut}}>›</span>
  </div>;

  const sg = destekBilgi||null;                          // Destek (salt-okunur) görünümü — hedef kullanıcı bağlamı
  const sgProfil = sg ? (sg.profil||{}) : null;
  const bakUid = sg ? sg.uid : (oturum && oturum.id);    // kariyer/oyuncu eşleşmesi bu uid ile yapılır
  const kullaniciAd = sg ? (sg.ad||"Kullanıcı") : (oturum ? ((oturum.user_metadata&&oturum.user_metadata.ad)||oturum.email.split("@")[0]) : "Misafir");
  // Sahiplendiğin oyuncu + takımı + ligi → kariyer & takım kartlarında göster
  let benimOyuncum=null, benimTakim=null, benimTakimT=null;
  if(bakUid){ for(const t of (turnuvalar||[])){ for(const tk of (t.takimlar||[])){ const f=(tk.oyuncular||[]).find(o=>o.sahip_user_id&&o.sahip_user_id===bakUid); if(f){benimOyuncum=f;benimTakim=tk;benimTakimT=t;break;} } if(benimOyuncum)break; } }
  // Ligde oyuncu değilsen (serbest/kulüp) kendi oyuncu profilini çek → profilden düzenleme için
  const [serbestOyuncum,setSerbestOyuncum]=useState(null);
  useEffect(()=>{ let a=true;
    if(oturum && oturum.id && !benimOyuncum){ Db.benimOyuncu(oturum.id).then(o=>{ if(a) setSerbestOyuncum(o); }); } else { setSerbestOyuncum(null); }
    return ()=>{ a=false; };
  },[oturum && oturum.id, !!benimOyuncum]);
  // Foto önceliği: sahiplenilen oyuncu kartı → yüklenen profil fotosu → Google (avatar_url/picture) → varsayılan
  const gFoto = oturum&&oturum.user_metadata ? (oturum.user_metadata.avatar_url||oturum.user_metadata.picture) : null;
  const profilFoto = sg ? ((benimOyuncum&&benimOyuncum.foto)||(sgProfil&&sgProfil.foto)||null)
                        : ((benimOyuncum&&benimOyuncum.foto) || (profil&&profil.foto) || gFoto || null);
  const beyaz = T.renkCifti&&T.renkCifti[1]==="#FFFFFF";
  const QA=({ik,l,onClick,renk,rozet})=> <div onClick={onClick} className="tap" style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:7,background:T.bg1,border:"0.5px solid "+T.line,borderRadius:15,padding:"14px 4px",cursor:"pointer",position:"relative"}}>
    <span style={{width:38,height:38,borderRadius:11,background:(renk||T.accent)+"1e",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{ik}</span>
    <span style={{fontSize:11,color:T.textSoft,fontWeight:600}}>{l}</span>
    {rozet>0 && <span style={{position:"absolute",top:8,right:"calc(50% - 24px)",background:T.danger,color:"#fff",fontSize:9,fontWeight:800,borderRadius:8,padding:"0 5px",minWidth:15,textAlign:"center"}}>{rozet>99?"99+":rozet}</span>}
  </div>;
  // PROFİL TAMAMLAMA (V5) — mevcut verilerden türetilir; yeni tablo/kolon YOK
  const ptAdimlar=[
    {ad:"Profil fotoğrafı", ok:!!profilFoto},
    {ad:"Oyuncu kariyeri", ok:!!benimOyuncum},
    {ad:"Bir takıma bağlan", ok:!!benimTakim},
    {ad:"İlk maçını oyna", ok:!!(benimOyuncum && (benimOyuncum.mac||0)>0)},
  ];
  const ptTamam=ptAdimlar.filter(a=>a.ok).length;
  const ptYuzde=Math.round(ptTamam/ptAdimlar.length*100);
  // ROLLERİM (V5) — mevcut profil.roller + adminMi'den türetilir; yeni tablo/kolon YOK
  const _roller = sg ? ((sgProfil&&sgProfil.roller)||{}) : ((profil&&profil.roller)||{});
  const _rolAdmin = sg ? !!sg.adminMi : !!adminMi;
  const rollerListe=[];
  if(_rolAdmin) rollerListe.push({ik:"🛡️", ad:"Süper Admin", renk:T.danger});
  if(_roller.hakem) rollerListe.push({ik:"🧑‍⚖️", ad:_roller.hakem_pasif?"Hakem · pasif":"Hakem", renk:_roller.hakem_pasif?T.textMut:(T.accent2||T.accent)});
  if(_roller.futbolcu || benimOyuncum) rollerListe.push({ik:"⚽", ad:"Futbolcu", renk:T.accent});
  // KARİYER ZAMAN TÜNELİ (V5) — mevcut maclar tablosundan tarihli olaylar çekilir; yeni tablo YOK.
  useEffect(()=>{ let a=true; const tId=benimTakim&&benimTakim.id, ad=benimOyuncum&&benimOyuncum.ad;
    if(oturum && tId && ad){ Db.oyuncuKariyerMaclari(tId, ad).then(l=>{ if(a) setKztMac(Array.isArray(l)?l:[]); }).catch(()=>{ if(a) setKztMac([]); }); }
    else setKztMac(null);
    return ()=>{a=false;};
  },[benimTakim&&benimTakim.id, benimOyuncum&&benimOyuncum.ad, oturum]);
  const _kztPd=(t)=>{ try{ let s=""+t; s=s.includes("-")?s:s.split(".").reverse().join("-"); const d=new Date(s); return isNaN(d.getTime())?0:d.getTime(); }catch(e){ return 0; } };
  const _kztFmt=(t)=>{ const s=""+t; const m=s.includes("-")?s.split("-"):s.split(".").reverse(); if(m.length<3) return s; const A=["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"]; return (parseInt(m[2],10)||"")+" "+(A[(parseInt(m[1],10)||1)-1]||"")+" "+m[0]; };
  const kztTarihli=(kztMac||[]).filter(m=>m.tarih && (""+m.tarih).length>=8).sort((a,b)=>_kztPd(b.tarih)-_kztPd(a.tarih));
  const kztOlay=[];
  kztTarihli.forEach(m=>{ if(m.mvp) kztOlay.push({t:m.tarih, ik:"⭐", ad:"Maçın adamı seçildin"}); if((m.gol||0)>0) kztOlay.push({t:m.tarih, ik:"⚽", ad:m.gol+" gol"+((m.asist||0)>0?" + "+m.asist+" asist":"")+" attın"}); });
  if(kztTarihli.length){ const ilk=kztTarihli[kztTarihli.length-1]; kztOlay.push({t:ilk.tarih, ik:"🏁", ad:"İlk maçına çıktın"}); }
  const kztGoster=kztOlay.slice(0,12);
  // BENİ BEKLEYENLER (V5) — mevcut bildirimlerden; yeni veri yok. Destek görünümünde gizli.
  const okunmamisB = (bildirimListe||[]).filter(b=>b&&b.okundu===false).length;
  // SON KULLANDIKLARIM (V5) — git() localStorage'a yazar; buradan okunur. Yeni veri yok.
  let sonKullanilan=[]; try{ const _s=JSON.parse(localStorage.getItem("fl_son")||"[]"); if(Array.isArray(_s)) sonKullanilan=_s.filter(x=>x&&x.ad&&x.nav); }catch(e){ sonKullanilan=[]; }
  // KARİYER YOLCULUĞU (V5) — mevcut istatistiklerden kilometre taşları. Not: tarih-damgalı değil (o ayrı bir DB kolonu ister).
  const ky=[]; if(benimOyuncum){ const o=benimOyuncum;
    ky.push({ik:"⚽", ad:"Kariyerine başladın", alt:o.poz||"Oyuncu"});
    if(benimTakim) ky.push({ik:"🛡️", ad:benimTakim.ad+" formasını giydin", alt:"takıma katıldın"});
    if(benimTakimT) ky.push({ik:"🏆", ad:benimTakimT.ad, alt:"ligde mücadele"});
    if((o.mac||0)>0) ky.push({ik:"🏃", ad:"Sahaya çıktın", alt:(o.mac||0)+" maç"});
    if((o.gol||0)>0) ky.push({ik:"🥅", ad:"Gol sevincini yaşadın", alt:"toplam "+(o.gol||0)+" gol"});
    if((o.gol||0)>=10) ky.push({ik:"🔟", ad:(o.gol||0)+" gole ulaştın", alt:"golcü kimliği"});
    if((o.asist||0)>0) ky.push({ik:"🅰️", ad:(o.asist||0)+" asist", alt:"paylaşımcı"});
    if((o.mvp||0)>0) ky.push({ik:"⭐", ad:(o.mvp||0)+"× maçın adamı", alt:"MVP"});
    if((o.ovr||0)>0) ky.push({ik:"📈", ad:"Genel reyting "+(o.ovr||0), alt:"performans"});
  }
  // YÖNETİM KISAYOLLARI (V5) — Yönetim, Profil içinden; sadece süper admin (destek görünümünde gizli).
  const yonKisa=[{ik:"👥",ad:"İnsanlar",sekme:"uyeler"},{ik:"🏆",ad:"Lig & Maç",sekme:"ligler"},{ik:"🗳️",ad:"İletişim",sekme:"anket"},{ik:"🛡️",ad:"Moderasyon",sekme:"mod"},{ik:"⚙️",ad:"Sistem",sekme:"sistem"}];
  return <div className="fade-in main-area" style={{paddingBottom:90}}>
    {/* HEADER */}
    <div className="vav-hero" style={{position:"relative",overflow:"hidden",padding:"20px 16px 16px",background:"linear-gradient(120deg,"+T.accent+"3a,"+T.bg0+" 45%,"+(T.accent2||T.accent)+"22 75%,"+T.bg0+")"}}>
      <div className="vav-supurme"/>
      <div style={{position:"relative",zIndex:1,display:"flex",alignItems:"center",gap:13}}>
        <div className="vav-suzul" style={{width:60,height:60,borderRadius:"50%",overflow:"hidden",border:"2px solid "+T.accent,flexShrink:0,boxShadow:"0 0 18px "+T.accent+"55"}} dangerouslySetInnerHTML={{__html:svgAvatar(kullaniciAd,60,profilFoto)}}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:20,fontWeight:800,color:T.text,fontFamily:T.fontDisplay,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{kullaniciAd}</div>
          <div style={{fontSize:11,color:sg?T.gold:T.textSoft,marginTop:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{sg?"👁 Destek görünümü · salt-okunur":(oturum?oturum.email:"giriş yapılmadı")}</div>
          {oturum && !sg && <div style={{fontSize:10,color:T.accent,marginTop:3}}>☁ bulutta senkron</div>}
        </div>
        {sg
          ? <span style={{fontSize:9,fontWeight:800,color:T.gold,background:T.gold+"1e",border:"0.5px solid "+T.gold+"55",borderRadius:20,padding:"5px 10px",flexShrink:0}}>SALT-OKUNUR</span>
          : oturum
          ? <button onClick={()=>git({sayfa:"ayar"})} className="tap" aria-label="Ayarlar" style={{width:40,height:40,borderRadius:12,background:T.bg1,border:"0.5px solid "+T.line,color:T.textSoft,fontSize:19,flexShrink:0}}>⚙️</button>
          : (kapiAc && <button onClick={()=>kapiAc("tanitim")} className="tap" style={{background:T.accent,color:T.bg0,border:0,borderRadius:20,padding:"8px 14px",fontSize:12,fontWeight:800}}>Giriş</button>)}
      </div>
    </div>

    <div style={{padding:"0 14px"}}>
      {/* ROLLERİM (V5) — kimlik şeridi; mevcut rollerden türetilir, yeni veri yok */}
      {oturum && rollerListe.length>0 && <div style={{display:"flex",flexWrap:"wrap",gap:7,margin:"14px 0 0"}}>
        {rollerListe.map((r,i)=><span key={i} style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:11,fontWeight:800,color:r.renk,background:r.renk+"14",border:"0.5px solid "+r.renk+"44",borderRadius:20,padding:"5px 11px"}}>{r.ik} {r.ad}</span>)}
      </div>}
      {/* BENİ BEKLEYENLER (V5) — mevcut bildirimlerden; destek görünümünde gizli */}
      {oturum && !sg && okunmamisB>0 && <>
        <div style={{fontSize:11,color:T.textMut,fontWeight:800,letterSpacing:0.8,margin:"16px 2px 9px"}}>BENİ BEKLEYENLER</div>
        <div onClick={()=>git({sayfa:"bildirim"})} className="tap kart-hover" style={{display:"flex",alignItems:"center",gap:12,background:"linear-gradient(135deg,"+T.gold+"1e,"+T.bg1+" 60%)",border:"0.5px solid "+T.gold+"44",borderRadius:14,padding:"13px 14px",cursor:"pointer"}}>
          <span style={{width:40,height:40,flexShrink:0,borderRadius:12,background:T.gold+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:19}}>🔔</span>
          <div style={{flex:1,minWidth:0}}><div style={{fontSize:13.5,fontWeight:800,color:T.text}}>{okunmamisB} okunmamış bildirim</div><div style={{fontSize:11,color:T.textMut,marginTop:1}}>dokun → hepsini gör</div></div>
          <span style={{background:T.danger,color:"#fff",fontSize:11,fontWeight:800,borderRadius:9,padding:"2px 8px",minWidth:20,textAlign:"center"}}>{okunmamisB>99?"99+":okunmamisB}</span>
        </div>
      </>}
      {/* KARİYER KARTIM */}
      {oturum && benimOyuncum ? <>
        <div style={{fontSize:11,color:T.textMut,fontWeight:800,letterSpacing:0.8,margin:"16px 2px 9px"}}>KARİYERİM</div>
        <div onClick={()=>git({sayfa:"oyuncu",oyuncu:{...benimOyuncum,turnuva:benimTakimT&&benimTakimT.ad}})} className="tap kart-hover" style={{position:"relative",overflow:"hidden",display:"flex",gap:14,alignItems:"center",background:"linear-gradient(135deg,"+T.accent+"26,"+T.bg1+" 60%)",border:"0.5px solid "+T.accent+"44",borderRadius:18,padding:15,cursor:"pointer"}}>
          <div style={{width:60,height:60,borderRadius:16,overflow:"hidden",border:"1.5px solid "+T.accent+"66",flexShrink:0}} dangerouslySetInnerHTML={{__html:svgAvatar(benimOyuncum.ad,60,benimOyuncum.foto)}}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:16.5,fontWeight:800,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{benimOyuncum.ad}</div>
            <div style={{fontSize:11.5,color:T.textMut,marginTop:2}}>{benimOyuncum.poz||"Oyuncu"}{benimTakim?" · "+benimTakim.ad:""}</div>
            <div style={{display:"flex",gap:16,marginTop:9}}>
              <div><b style={{fontSize:15,color:T.text,fontWeight:900}}>{benimOyuncum.mac||0}</b><span style={{fontSize:9,color:T.textMut,marginLeft:3}}>Maç</span></div>
              <div><b style={{fontSize:15,color:T.text,fontWeight:900}}>{benimOyuncum.gol||0}</b><span style={{fontSize:9,color:T.textMut,marginLeft:3}}>Gol</span></div>
              <div><b style={{fontSize:15,color:T.text,fontWeight:900}}>{benimOyuncum.asist||0}</b><span style={{fontSize:9,color:T.textMut,marginLeft:3}}>Asist</span></div>
            </div>
          </div>
          {benimOyuncum.ovr>0 && <div style={{flexShrink:0,textAlign:"center",background:T.gold,borderRadius:12,padding:"7px 11px"}}><div style={{fontSize:22,fontWeight:900,color:"#3a2600",lineHeight:1,fontFamily:T.fontDisplay}}>{benimOyuncum.ovr}</div><div style={{fontSize:8,fontWeight:800,color:"#5a3d00"}}>GENEL</div></div>}
        </div>
      </> : oturum && sahiplenme ? <>
        <div style={{fontSize:11,color:T.textMut,fontWeight:800,letterSpacing:0.8,margin:"16px 2px 9px"}}>KARİYERİM</div>
        <div onClick={kariyereGit} className="tap kart-hover" style={{display:"flex",alignItems:"center",gap:12,background:T.gold+"14",border:"0.5px solid "+T.gold+"55",borderRadius:16,padding:14,cursor:"pointer"}}>
          <span style={{fontSize:24}}>⭐</span>
          <div style={{flex:1,minWidth:0}}><div style={{fontSize:14,color:T.text,fontWeight:700}}>{sahiplenme.oyuncu_ad}</div><div style={{fontSize:10.5,color:T.gold}}>{sahiplenme.lig_ad||"kart & istatistiklerim"} · aç →</div></div>
          <button onClick={(e)=>{e.stopPropagation();onSahiplenmeBirak&&onSahiplenmeBirak();}} className="tap" style={{fontSize:10,color:T.textMut,background:"none",border:"0.5px solid "+T.line,borderRadius:8,padding:"5px 8px"}}>bırak</button>
        </div>
      </> : (oturum && serbestOyuncum) ? <div onClick={()=>git&&git({sayfa:"oyuncu",oyuncu:{...serbestOyuncum, ad:serbestOyuncum.ad_soyad||serbestOyuncum.takma_ad, sahip_user_id:oturum.id}})} className="tap kart-hover" style={{margin:"16px 0 0",display:"flex",alignItems:"center",gap:12,background:"linear-gradient(120deg,"+T.accent+"18,"+T.bg1+" 62%)",border:"0.5px solid "+T.accent+"55",borderRadius:16,padding:14,cursor:"pointer"}}>
        <div style={{width:52,height:52,borderRadius:14,overflow:"hidden",border:"1.5px solid "+T.accent+"66",flexShrink:0}} dangerouslySetInnerHTML={{__html:svgAvatar(serbestOyuncum.ad_soyad||"?",52,serbestOyuncum.foto||gFoto)}}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:14.5,fontWeight:800,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>⚽ Oyuncu Kartım</div>
          <div style={{fontSize:11,color:T.accent,marginTop:2,fontWeight:700}}>Fotoğraf · boy · kilo · doğum · ayak — düzenle →</div>
        </div>
        <span style={{fontSize:20,color:T.accent}}>›</span>
      </div> : oturum ? <div style={{margin:"16px 0 0",background:"linear-gradient(120deg,"+T.gold+"12,"+T.bg1+")",border:"0.5px solid "+T.gold+"33",borderRadius:16,padding:"15px 15px"}}>
        <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:6}}><span style={{fontSize:20}}>⚽</span><div style={{fontSize:13,color:T.text,fontWeight:700}}>Henüz bir oyuncu kariyerin yok</div></div>
        <div style={{fontSize:11.5,color:T.textMut,lineHeight:1.55}}>Bir takıma/kulübe katılıp bilgilerini girdiğinde kartın otomatik burada oluşur.</div>
      </div> : null}

      {/* SÜPER ADMIN — oyuncu yönetimi kısayolu */}
      {oturum && adminMi && git && <div onClick={()=>git({sayfa:"ligler"})} className="tap kart-hover" style={{margin:"10px 0 0",display:"flex",alignItems:"center",gap:12,background:T.bg1,border:"0.5px solid "+T.line,borderRadius:16,padding:14,cursor:"pointer"}}>
        <span style={{width:44,height:44,borderRadius:12,flexShrink:0,background:T.danger+"1e",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🛡️</span>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13.5,fontWeight:800,color:T.text}}>Oyuncuları yönet <span style={{fontSize:10,color:T.danger,fontWeight:800}}>· admin</span></div>
          <div style={{fontSize:10.5,color:T.textMut,marginTop:2}}>Keşfet'te oyuncu ara → dokun → bilgi/kart düzenle</div>
        </div>
        <span style={{fontSize:20,color:T.textMut}}>›</span>
      </div>}

      {/* TAKIMIM */}
      {oturum && benimTakim && <>
        <div style={{fontSize:11,color:T.textMut,fontWeight:800,letterSpacing:0.8,margin:"18px 2px 9px"}}>TAKIMIM</div>
        <div onClick={()=>git({sayfa:"takim",takim:{...benimTakim,turnuva:benimTakimT&&benimTakimT.ad},turnuva:benimTakimT})} className="tap kart-hover" style={{display:"flex",alignItems:"center",gap:13,background:T.bg1,border:"0.5px solid "+T.line,borderRadius:16,padding:14,cursor:"pointer"}}>
          <Logo renk={benimTakim.renk} ad={benimTakim.ad} logo={benimTakim.logo} renk2={benimTakim.renk2} boy={48}/>
          <div style={{flex:1,minWidth:0}}><div style={{fontSize:15.5,fontWeight:800,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{benimTakim.ad}</div><div style={{fontSize:11,color:T.textMut,marginTop:2}}>{benimTakimT?benimTakimT.ad:""}</div></div>
          <span style={{fontSize:20,color:T.textMut}}>›</span>
        </div>
      </>}

      {/* LİGİM */}
      {oturum && benimTakimT && <>
        <div style={{fontSize:11,color:T.textMut,fontWeight:800,letterSpacing:0.8,margin:"18px 2px 9px"}}>LİGİM</div>
        <div onClick={()=>git({sayfa:"turnuva",turnuva:benimTakimT})} className="tap kart-hover" style={{display:"flex",alignItems:"center",gap:13,background:"linear-gradient(135deg,"+T.gold+"1e,"+T.bg1+" 60%)",border:"0.5px solid "+T.gold+"44",borderRadius:16,padding:14,cursor:"pointer"}}>
          <span style={{width:48,height:48,borderRadius:14,flexShrink:0,background:T.gold+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>🏆</span>
          <div style={{flex:1,minWidth:0}}><div style={{fontSize:15.5,fontWeight:800,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{benimTakimT.ad}</div><div style={{fontSize:11,color:T.textMut,marginTop:2}}>{(benimTakimT.takimlar||[]).length} takım · lige git</div></div>
          <span style={{fontSize:20,color:T.textMut}}>›</span>
        </div>
      </>}

      {/* KARİYER ZAMAN TÜNELİ (V5) — tarihli gerçek olaylar (maclar tablosundan) */}
      {oturum && kztGoster.length>0 && <>
        <div style={{fontSize:11,color:T.textMut,fontWeight:800,letterSpacing:0.8,margin:"18px 2px 9px"}}>KARİYER ZAMAN TÜNELİ</div>
        <div style={{background:T.bg1,border:"0.5px solid "+T.line,borderRadius:16,padding:"6px 14px 10px"}}>
          {kztGoster.map((k,i)=><div key={i} style={{display:"flex",gap:12,alignItems:"stretch",padding:"7px 0"}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",flexShrink:0}}>
              <span style={{width:30,height:30,borderRadius:"50%",background:T.gold+"1e",border:"1px solid "+T.gold+"55",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>{k.ik}</span>
              {i<kztGoster.length-1 && <span style={{width:2,flex:1,minHeight:12,background:T.line,marginTop:2}}/>}
            </div>
            <div style={{flex:1,minWidth:0,paddingTop:4}}>
              <div style={{fontSize:12.5,fontWeight:700,color:T.text}}>{k.ad}</div>
              <div style={{fontSize:10.5,color:T.gold,marginTop:1,fontWeight:700}}>📅 {_kztFmt(k.t)}</div>
            </div>
          </div>)}
        </div>
      </>}

      {/* KARİYER YOLCULUĞU (V5) — kilometre taşları (tarih-damgasız); yalnızca tarihli olay yoksa */}
      {oturum && benimOyuncum && ky.length>0 && kztGoster.length===0 && <>
        <div style={{fontSize:11,color:T.textMut,fontWeight:800,letterSpacing:0.8,margin:"18px 2px 9px"}}>KARİYER YOLCULUĞU</div>
        <div style={{background:T.bg1,border:"0.5px solid "+T.line,borderRadius:16,padding:"6px 14px 10px"}}>
          {ky.map((k,i)=><div key={i} style={{display:"flex",gap:12,alignItems:"stretch",padding:"7px 0"}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",flexShrink:0}}>
              <span style={{width:30,height:30,borderRadius:"50%",background:T.accent+"1e",border:"1px solid "+T.accent+"55",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>{k.ik}</span>
              {i<ky.length-1 && <span style={{width:2,flex:1,minHeight:12,background:T.line,marginTop:2}}/>}
            </div>
            <div style={{flex:1,minWidth:0,paddingTop:5}}>
              <div style={{fontSize:13,fontWeight:700,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{k.ad}</div>
              <div style={{fontSize:10.5,color:T.textMut,marginTop:1}}>{k.alt}</div>
            </div>
          </div>)}
        </div>
      </>}
      {/* HIZLI ERİŞİM */}
      {oturum && <>
        <div style={{fontSize:11,color:T.textMut,fontWeight:800,letterSpacing:0.8,margin:"18px 2px 9px"}}>HIZLI ERİŞİM</div>
        <div style={{display:"flex",gap:10}}>
          <QA ik="💬" l="Sohbet" renk={T.accent2} onClick={()=>git({sayfa:"sohbet"})}/>
          <QA ik="🔔" l="Bildirim" renk={T.gold} onClick={()=>git({sayfa:"bildirim"})}/>
          <QA ik="⭐" l="Takip" renk={T.accent} rozet={toplamTakip} onClick={()=>git({sayfa:"takip"})}/>
          <QA ik="🏆" l="En'ler" renk={T.purple||"#7c4dff"} onClick={()=>git({sayfa:"tumenler"})}/>
        </div>
      </>}

      {/* SON KULLANDIKLARIM (V5) — son bakılan lig/oyuncu (localStorage); destek görünümünde gizli */}
      {oturum && !sg && sonKullanilan.length>0 && <>
        <div style={{fontSize:11,color:T.textMut,fontWeight:800,letterSpacing:0.8,margin:"18px 2px 9px"}}>SON KULLANDIKLARIM</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
          {sonKullanilan.map((s,i)=><button key={i} onClick={()=>{ try{ git(s.nav); }catch(e){} }} className="tap" style={{display:"inline-flex",alignItems:"center",gap:6,background:T.bg1,border:"0.5px solid "+T.line,borderRadius:20,padding:"7px 12px",color:T.textSoft,fontSize:11.5,fontWeight:600,cursor:"pointer"}}>
            <span>{s.tur==="turnuva"?"🏆":"👤"}</span><span style={{maxWidth:130,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.ad}</span>
          </button>)}
        </div>
      </>}

      {/* TAKIMLARIM — kalıcı kulüp yönetimi (Aşama 4-7) */}
      {oturum && <div onClick={()=>git({sayfa:"kuluplerim"})} className="tap kart-hover" style={{display:"flex",alignItems:"center",gap:12,background:T.bg1,border:"1px solid "+T.line,borderRadius:15,padding:"14px 15px",marginTop:16,cursor:"pointer"}}>
        <div style={{width:44,height:44,flexShrink:0,borderRadius:12,background:T.gold+"22",border:"1px solid "+T.gold+"55",display:"flex",alignItems:"center",justifyContent:"center",fontSize:21}}>🛡️</div>
        <div style={{flex:1,minWidth:0}}><div style={{fontSize:15.5,fontWeight:800,color:T.text}}>Takımlarım</div><div style={{fontSize:11.5,color:T.textMut,marginTop:2}}>Kalıcı takımını kur, her ligde kullan</div></div>
        <span style={{color:T.textMut,fontSize:20}}>›</span>
      </div>}

      {/* 🆘 Sorun bildir — kullanıcı-başlatan destek + otomatik teşhis */}
      {oturum && <div onClick={()=>git({sayfa:"sorun"})} className="tap satir-hover" style={{display:"flex",alignItems:"center",gap:11,background:T.bg1,border:"0.5px solid "+T.line,borderRadius:12,padding:"12px 13px",marginTop:9,cursor:"pointer"}}>
        <span style={{fontSize:17}}>🆘</span>
        <div style={{flex:1,minWidth:0}}><div style={{fontSize:13.5,fontWeight:700,color:T.text}}>Sorun bildir</div><div style={{fontSize:11,color:T.textMut}}>Bir aksaklık mı var? Bize anlat</div></div>
        <span style={{color:T.textMut,fontSize:18}}>›</span>
      </div>}

      {/* PROFİL TAMAMLAMA (V5) — sadece giriş yapan + destek görünümü değilken + eksik varsa */}
      {oturum && !sg && ptYuzde<100 && <>
        <div style={{fontSize:11,color:T.textMut,fontWeight:800,letterSpacing:0.8,margin:"18px 2px 9px"}}>PROFİL TAMAMLAMA</div>
        <div style={{display:"flex",alignItems:"center",gap:14,background:"linear-gradient(135deg,"+T.accent+"14,"+T.bg1+")",border:"0.5px solid "+T.accent+"33",borderRadius:16,padding:15}}>
          <div style={{position:"relative",width:64,height:64,flexShrink:0,borderRadius:"50%",background:"conic-gradient("+T.accent+" "+ptYuzde+"%,"+T.bg0+" 0)"}}>
            <div style={{position:"absolute",inset:6,borderRadius:"50%",background:T.bg1,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:900,color:T.text,fontFamily:T.fontDisplay}}>%{ptYuzde}</div>
          </div>
          <div style={{flex:1,minWidth:0}}>
            {ptAdimlar.map((a,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:11.5,padding:"3px 0",color:T.textSoft}}><span>{a.ad}</span><span style={{color:a.ok?T.accent:T.gold,fontWeight:700}}>{a.ok?"✓":"Eksik"}</span></div>)}
          </div>
        </div>
      </>}

      {/* YÖNETİM — Profil içinden hızlı giriş; sadece süper admin (destek görünümünde gizli) */}
      {oturum && !sg && adminMi && <>
        <div style={{fontSize:11,color:T.textMut,fontWeight:800,letterSpacing:0.8,margin:"18px 2px 9px"}}>YÖNETİM — HIZLI GİRİŞ</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
          {yonKisa.map((y,i)=><button key={i} onClick={()=>git({sayfa:"admin",adminSekme:y.sekme})} className="tap kart-hover" style={{flex:"1 1 28%",display:"flex",flexDirection:"column",alignItems:"center",gap:6,background:"linear-gradient(140deg,"+T.danger+"12,"+T.bg1+")",border:"0.5px solid "+T.danger+"33",borderRadius:13,padding:"13px 6px",color:T.textSoft,cursor:"pointer"}}>
            <span style={{fontSize:19}}>{y.ik}</span><span style={{fontSize:10.5,fontWeight:800,color:T.text}}>{y.ad}</span>
          </button>)}
        </div>
      </>}

      {/* ÖZET */}
      <div style={{fontSize:11,color:T.textMut,fontWeight:800,letterSpacing:0.8,margin:"18px 2px 9px"}}>ÖZET</div>
      <div style={{display:"flex",gap:9}}>
        <div style={{flex:1,background:T.bg1,border:"0.5px solid "+T.line,borderRadius:13,padding:"13px 4px",textAlign:"center"}}><div style={{fontSize:20,fontWeight:900,color:T.accent,fontFamily:T.fontDisplay}}>{toplamTakip}</div><div style={{fontSize:9,color:T.textMut}}>Takip</div></div>
        <div style={{flex:1,background:T.bg1,border:"0.5px solid "+T.line,borderRadius:13,padding:"13px 4px",textAlign:"center"}}><div style={{fontSize:20,fontWeight:900,color:T.gold,fontFamily:T.fontDisplay}}>{toplamMac}</div><div style={{fontSize:9,color:T.textMut}}>Maç</div></div>
        <div style={{flex:1,background:T.bg1,border:"0.5px solid "+T.line,borderRadius:13,padding:"13px 4px",textAlign:"center"}}><div style={{fontSize:20,fontWeight:900,color:"#34D399",fontFamily:T.fontDisplay}}>{toplamGol}</div><div style={{fontSize:9,color:T.textMut}}>Gol</div></div>
        <div style={{flex:1,background:T.bg1,border:"0.5px solid "+T.line,borderRadius:13,padding:"13px 4px",textAlign:"center"}}><div style={{fontSize:20,fontWeight:900,color:T.purple||"#7c4dff",fontFamily:T.fontDisplay}}>{turnuvalar.length}</div><div style={{fontSize:9,color:T.textMut}}>Lig</div></div>
      </div>

      {/* HESAP */}
      <div style={{fontSize:11,color:T.textMut,fontWeight:800,letterSpacing:0.8,margin:"18px 2px 9px"}}>HESAP</div>
      {sg ? <div style={{background:T.gold+"12",border:"0.5px solid "+T.gold+"44",borderRadius:12,padding:"12px 13px",fontSize:12,color:T.textSoft,lineHeight:1.5}}>
        👁 <b style={{color:T.gold}}>Destek görünümü</b> — bu kullanıcının profilini <b>salt-okunur</b> izliyorsun. Ayarlar, çıkış ve hesap işlemleri güvenlik için devre dışı.
        <div style={{marginTop:6,fontSize:11,color:T.textMut}}>Durum: {sg.adminMi?"🛡️ Süper Admin":"👤 Normal kullanıcı"}</div>
      </div>
      : oturum ? <>
        {adminMi && <div onClick={()=>git({sayfa:"admin"})} className="tap satir-hover" style={{display:"flex",alignItems:"center",gap:11,background:"linear-gradient(120deg,"+T.danger+"18,"+T.bg1+")",border:"0.5px solid "+T.danger+"44",borderRadius:12,padding:"12px 13px",marginBottom:7}}>
          <span style={{fontSize:18}}>🛡️</span><span style={{flex:1,fontSize:13,color:T.text,fontWeight:700}}>Süper Admin Paneli</span><span style={{fontSize:9,color:T.danger,fontWeight:700}}>ADMIN</span><span style={{fontSize:12,color:T.textMut}}>›</span>
        </div>}
        <Sat ik="⚙️" metin="Uygulama Ayarları" onClick={()=>git({sayfa:"ayar"})}/>
        <Sat ik="🚪" metin="Çıkış Yap" onClick={()=>cikisYap&&cikisYap()}/>
      </> : <Sat ik="🔑" metin="Giriş Yap / Üye Ol" onClick={()=>kapiAc&&kapiAc("tanitim")}/>}

      <div style={{fontSize:9,color:T.textMut,textAlign:"center",margin:"22px 0",lineHeight:1.6}}>ForzaLig · halı saha ligin cebinde ⚽</div>
    </div>
  </div>;
}

function Kesfet({turnuvalar, T, git, ligKurAc, ligKurYetki, saltOkunur, yukleniyor, oturum, takimKurabilir, adminMi, onYeniSezon}){
  const [tab,setTab]=useState("lig");
  const [ara,setAra]=useState("");
  const [sira,setSira]=useState("gol"); // takım/oyuncu sıralama
  const [mevki,setMevki]=useState("hepsi");
  const q=ara.trim().toLocaleLowerCase("tr");
  const aktifTurnuvalar=turnuvalar.filter(t=>t&&(t.durum||'aktif')!=='arsiv'); // arşivlenen (bitmiş) sezonlar katalogda görünmez
  // FAZ 9 — herkese açık (paylaşılan) ligler
  const [acikLigler,setAcikLigler]=useState([]);
  useEffect(()=>{ if(!sb) return; let a=true; Paylas.liste().then(l=>{ if(a) setAcikLigler(l||[]); }); return ()=>{a=false;}; },[]);

  // ---- SEZON SERİSİ: hangi kart çok-sezonlu (açılır liste) ----
  const [seriByLig,setSeriByLig]=useState({});   // ligId → seri_id
  const [seriSay,setSeriSay]=useState({});        // seri_id → sezon adedi
  const [acikSeri,setAcikSeri]=useState(null);    // açık akordeon (lig id)
  const [sezonMap,setSezonMap]=useState({});      // seri_id → sezon dizisi (lazy)
  const [yeniSezonHedef,setYeniSezonHedef]=useState(null); // YeniSezonPop için turnuva
  useEffect(()=>{ if(!sb) return; let a=true; Db.serilerHam().then(rows=>{ if(!a) return;
    const byLig={}, say={}; (rows||[]).forEach(r=>{ byLig[r.id]=r.seri_id; say[r.seri_id]=(say[r.seri_id]||0)+1; });
    setSeriByLig(byLig); setSeriSay(say);
  }); return ()=>{a=false;}; },[turnuvalar.length]);
  const sezonAcTikla=async(t, sid)=>{
    if(acikSeri===t.id){ setAcikSeri(null); return; }
    setAcikSeri(t.id);
    if(!sezonMap[sid]){ const d=await Db.sezonSerisi(sid, t.id); setSezonMap(p=>({...p,[sid]:d||[]})); }
  };
  const sezonaGit=async(sid)=>{ try{ const L=await Db.ligYukle(sid); if(L) git({sayfa:"turnuva",turnuva:L}); }catch(e){} };
  const sezonBaslatKatalog=async(t, kimlik)=>{ setYeniSezonHedef(null); if(onYeniSezon) await onYeniSezon(t, kimlik); };
  // Katalog kartları: her SERİ tek kart (aktif/en yüksek sezon). Arşiv sezonlar üstte değil, açılır listede.
  const gosterilecekLigler=useMemo(()=>{
    const bySeri={}, tekil=[];
    (turnuvalar||[]).forEach(t=>{ if(!t) return;
      const sid=seriByLig[t.id]||t.seriId;
      if(sid && seriSay[sid]>1){ (bySeri[sid]=bySeri[sid]||[]).push(t); }
      else if((t.durum||'aktif')!=='arsiv'){ tekil.push(t); }
    });
    const seriKart=Object.keys(bySeri).map(sid=>{ const s=[...bySeri[sid]].sort((a,b)=>(b.sezonNo||0)-(a.sezonNo||0)); return s.find(x=>(x.durum||'aktif')!=='arsiv')||s[0]; });
    return [...seriKart, ...tekil];
  },[turnuvalar, seriByLig, seriSay]);
  // Kendi yayınladığın ligler zaten üstte canlı kart olarak var → 'AÇIK' kopyası olarak TEKRAR gösterme (katalog karışmasın)
  const acikGoster=useMemo(()=> (acikLigler||[]).filter(l=> !(oturum && l.sahip_id && l.sahip_id===oturum.id)), [acikLigler, oturum]);

  // tüm takımlar
  const tumTakimlar=useMemo(()=>{
    const arr=[]; turnuvalar.forEach(t=>t.takimlar.forEach(tk=>arr.push({...tk,turnuva:t.ad,_t:t}))); return arr;
  },[turnuvalar]);
  // tüm oyuncular
  const tumOyuncular=useMemo(()=> Motor.tumOyuncular(turnuvalar),[turnuvalar]);
  // tüm maçlar
  const tumMaclar=useMemo(()=>{ const arr=[]; turnuvalar.forEach(t=>t.maclar.forEach(m=>arr.push({...m,_lig:t.ad,_t:t}))); return arr; },[turnuvalar]);
  // takım durum (şampiyon/lider)
  const takimDurum=useMemo(()=>{
    const map={};
    turnuvalar.forEach(t=>{
      const sirali=[...t.takimlar].sort((a,b)=>(b.puan||0)-(a.puan||0));
      const oynanan=t.maclar.filter(m=>m.oynandi).length;
      const bitti=t.maclar.length>0 && oynanan>=t.maclar.length;
      if(sirali[0] && oynanan>0) map[t.ad+"|"+sirali[0].ad]= bitti?"sampiyon":"lider";
    });
    return map;
  },[turnuvalar]);

  const takimFiltre=tumTakimlar.filter(tk=>!q||tk.ad.toLocaleLowerCase("tr").includes(q));
  const takimSirali=[...takimFiltre].sort((a,b)=> sira==="alfabe"?a.ad.localeCompare(b.ad,"tr") : sira==="mac"?(b.o||0)-(a.o||0) : (b.ag||0)-(a.ag||0));
  const oyuncuFiltre=tumOyuncular.filter(o=>(!q||o.ad.toLocaleLowerCase("tr").includes(q)) && (mevki==="hepsi"||o.poz===mevki));
  const oyuncuSirali=[...oyuncuFiltre].sort((a,b)=> sira==="alfabe"?a.ad.localeCompare(b.ad,"tr") : sira==="mac"?(b.mac||0)-(a.mac||0) : sira==="asist"?(b.asist||0)-(a.asist||0) : (b.gol||0)-(a.gol||0));
  const oynananlar=tumMaclar.filter(m=>m.oynandi).sort((a,b)=>(b.hafta||0)-(a.hafta||0));
  const yaklasanlar=tumMaclar.filter(m=>!m.oynandi).sort((a,b)=>(a.hafta||0)-(b.hafta||0));

  const SiraBtn=({k,etiket})=> <span onClick={()=>setSira(k)} className="tap" style={{fontSize:10,padding:"4px 9px",borderRadius:12,background:sira===k?T.accent:T.bg2,color:sira===k?"#fff":T.textMut,fontWeight:sira===k?700:500}}>{etiket}</span>;
  const MevkiBtn=({k,etiket})=> <span onClick={()=>setMevki(k)} className="tap" style={{fontSize:10,padding:"4px 9px",borderRadius:12,background:mevki===k?"#34D399":T.bg2,color:mevki===k?"#06140d":T.textMut,fontWeight:mevki===k?700:500}}>{etiket}</span>;

  return <div className="fade-in main-area" style={{paddingBottom:90}}>
    {/* sekmeler */}
    <div style={{display:"flex",background:T.bg1,borderBottom:"0.5px solid "+T.line,position:"sticky",top:0,zIndex:5}}>
      {[["lig","🏆 Ligler"],["takim","👥 Takımlar"],["oyuncu","⚽ Oyuncular"],["mac","📅 Maçlar"]].map(([k,l])=>
        <button key={k} onClick={()=>{setTab(k);setAra("");setSira("gol");setMevki("hepsi");}} className="tap sekme" style={{flex:1,background:"none",border:0,padding:"12px 0",fontSize:11,color:tab===k?T.accent:T.textMut,borderBottom:"2px solid "+(tab===k?T.accent:"transparent"),fontWeight:tab===k?700:500}}>{l}</button>
      )}
    </div>

    {/* arama */}
    {tab==="oyuncu" && <div style={{padding:"12px 14px 4px"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,background:T.bg1,borderRadius:10,padding:"8px 12px",border:"0.5px solid "+T.line}}>
        <span style={{fontSize:14,color:T.textMut}}>🔍</span>
        <input value={ara} onChange={e=>setAra(e.target.value)} placeholder="Oyuncu ara..." style={{flex:1,background:"none",border:0,color:T.text,fontSize:13,outline:"none",fontFamily:"inherit"}}/>
      </div>
      <div style={{display:"flex",gap:5,marginTop:8,flexWrap:"wrap"}}>
        <SiraBtn k="gol" etiket="En golcü"/><SiraBtn k="asist" etiket="En asist"/><SiraBtn k="mac" etiket="En çok maç"/><SiraBtn k="alfabe" etiket="A-Z"/>
      </div>
      {tab==="oyuncu" && <div style={{display:"flex",gap:5,marginTop:6,flexWrap:"wrap"}}>
        <MevkiBtn k="hepsi" etiket="Hepsi"/><MevkiBtn k="Kaleci" etiket="🧤 Kaleci"/><MevkiBtn k="Defans" etiket="🛡️ Defans"/><MevkiBtn k="OrtaSaha" etiket="🎩 Orta"/><MevkiBtn k="Forvet" etiket="⚽ Forvet"/>
      </div>}
    </div>}

    {/* LİGLER — premium katalog */}
    {tab==="lig" && <div style={{padding:"12px 14px"}}>
      {/* Transfer Pazarı hero */}
      {!saltOkunur && <div onClick={()=>git({sayfa:"pazar"})} className="tap kart-hover" style={{position:"relative",overflow:"hidden",borderRadius:18,border:"1px solid "+T.accent+"55",background:"radial-gradient(120% 140% at 85% 20%,"+T.accent+"3a,"+T.bg1+" 55%)",padding:"16px 15px",marginBottom:14,display:"flex",alignItems:"center",gap:13,cursor:"pointer"}}>
        <div style={{width:46,height:46,flexShrink:0,borderRadius:13,background:T.accent+"22",border:"1px solid "+T.accent+"55",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>🔁</div>
        <div style={{flex:1,minWidth:0}}><div style={{fontSize:16,fontWeight:800,color:T.text}}>Transfer Pazarı</div><div style={{fontSize:11.5,color:T.textMut,marginTop:2}}>Takım arayan oyuncular &amp; transferler</div></div>
        <span style={{flexShrink:0,background:T.accent,color:T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0,fontWeight:800,fontSize:12.5,padding:"9px 15px",borderRadius:11}}>Keşfet</span>
      </div>}

      {/* Arama — lig/şehir */}
      <div style={{display:"flex",alignItems:"center",gap:8,background:T.bg1,border:"1px solid "+T.accent+"40",borderRadius:13,padding:"12px 13px",marginBottom:12}}>
        <span style={{fontSize:15,opacity:.7}}>🔎</span>
        <input value={ara} onChange={e=>setAra(e.target.value)} placeholder="Lig veya şehir ara…" style={{flex:1,background:"none",border:0,color:T.text,fontSize:13.5,outline:"none",fontFamily:"inherit"}}/>
        {ara && <span onClick={()=>setAra("")} className="tap" style={{fontSize:15,color:T.textMut,cursor:"pointer"}}>✕</span>}
      </div>

      {/* Başlık + Lig Kur */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",margin:"4px 2px 12px"}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <span style={{fontSize:17,fontWeight:800,color:T.text,fontFamily:T.fontDisplay}}>Lig Kataloğu</span>
          {(gosterilecekLigler.length+acikGoster.length)>0 && <span style={{fontSize:11,fontWeight:700,color:T.accent,background:T.accent+"1e",border:"0.5px solid "+T.accent+"44",padding:"3px 9px",borderRadius:20}}>{gosterilecekLigler.length+acikGoster.length} Lig</span>}
        </div>
        {ligKurAc && (ligKurYetki
          ? <button onClick={ligKurAc} className="tap" style={{display:"flex",alignItems:"center",gap:6,background:T.accent,color:T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0,border:0,borderRadius:11,padding:"9px 14px",fontSize:12.5,fontWeight:800}}>+ Lig Kur</button>
          : <button title="Lig oluşturma yetkiniz bulunmuyor." aria-disabled="true" onClick={e=>{e.preventDefault();e.stopPropagation();}} style={{display:"flex",alignItems:"center",gap:6,background:T.accent,color:T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0,border:0,borderRadius:11,padding:"9px 14px",fontSize:12.5,fontWeight:800,opacity:.4,cursor:"not-allowed"}}>+ Lig Kur</button>)}
      </div>

      {/* Herkese açık ligler */}
      {acikGoster.filter(l=>!q||((l.ad||"")+" "+(l.sehir||"")).toLocaleLowerCase("tr").includes(q)).map(l=>
        <a key={l.slug} href={PAYLASIM_URL(l.slug)} className="tap kart-hover" style={{display:"flex",gap:12,alignItems:"center",background:T.bg1,borderRadius:16,padding:13,marginBottom:10,border:"0.5px solid "+T.gold+"44",textDecoration:"none",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",inset:0,left:"auto",width:"55%",background:"radial-gradient(90% 120% at 90% 30%,"+T.gold+"22,transparent 60%)",pointerEvents:"none"}}/>
          <div style={{width:52,height:52,borderRadius:14,background:"linear-gradient(145deg,"+T.gold+","+T.gold+"99)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,position:"relative",zIndex:1}}>🏟️</div>
          <div style={{flex:1,minWidth:0,position:"relative",zIndex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:7}}><span style={{fontSize:15,fontWeight:800,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{l.ad}</span><span style={{fontSize:9,fontWeight:800,color:T.gold,background:T.gold+"1e",border:"0.5px solid "+T.gold+"44",padding:"1px 6px",borderRadius:10,flexShrink:0}}>AÇIK</span></div>
            <div style={{fontSize:11,color:T.textMut,marginTop:3}}>📍 {l.sehir||"halı saha ligi"}</div>
          </div>
          <span style={{fontSize:20,color:T.gold,position:"relative",zIndex:1}}>›</span>
        </a>
      )}

      {/* Kullanıcının ligleri — zengin kartlar */}
      {gosterilecekLigler.length===0 && acikGoster.length===0 && (yukleniyor
        ? <div style={{textAlign:"center",padding:"26px 20px"}}>
            {[0,1].map(i=><div key={i} className="skel" style={{height:76,borderRadius:16,marginBottom:10}}/>)}
            <div style={{fontSize:12,color:T.textMut,marginTop:4}}>⏳ Ligler yükleniyor…</div>
          </div>
        : <div style={{fontSize:12.5,color:T.textMut,textAlign:"center",padding:"30px 20px",lineHeight:1.6}}>Henüz lig yok.<br/>{ligKurAc?"Yukarıdan kendi ligini kurabilirsin.":"Bir lige katıldığında burada görünür."}</div>)}
      {gosterilecekLigler.filter(t=>!q||((t.ad||"")+" "+(t.sehir||"")).toLocaleLowerCase("tr").includes(q)).map(t=>{
        const oynanan=t.maclar.filter(m=>m.oynandi).length;
        // Tembel (özet) ligler: takimlar/maclar dizileri boş gelir → sayıları özet alanlarından göster (0/0 görünmesin)
        const takimGoster=(t.takimSay!=null?t.takimSay:t.takimlar.length);
        const macGoster=(t.maclar.length? oynanan : (t.macSay!=null?t.macSay:0));
        const lider=[...t.takimlar].sort((a,b)=>(b.puan||0)-(a.puan||0))[0];
        const ilkTakimlar=(t.takimlar||[]).slice(0,3);
        const sid=seriByLig[t.id];
        const cokSezon=!!(sid && seriSay[sid]>1);
        const acik=acikSeri===t.id;
        const yetkili=!!(adminMi || (oturum && t.yonetici_id===oturum.id));
        const liste=cokSezon?(sezonMap[sid]||null):null;
        return <div key={t.id} style={{marginBottom:11}}>
         <div onClick={cokSezon?()=>sezonAcTikla(t,sid):()=>git({sayfa:"turnuva",turnuva:t})} className="tap kart-hover" style={{position:"relative",overflow:"hidden",background:T.bg1,borderRadius:acik?"18px 18px 0 0":18,padding:14,border:"0.5px solid "+(acik?t.renk+"55":T.line),borderBottom:acik?"0":("0.5px solid "+T.line),cursor:"pointer",transition:"border-radius .2s"}}>
          <div style={{position:"absolute",inset:0,left:"auto",width:"58%",background:"radial-gradient(90% 120% at 92% 35%,"+(t.renk||T.accent)+"26,transparent 62%)",pointerEvents:"none"}}/>
          <div style={{display:"flex",gap:13,alignItems:"center",position:"relative",zIndex:1}}>
            <Logo renk={t.renk} ad={t.ad} logo={t.logo} renk2={t.renk2} boy={54}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:16,fontWeight:800,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.ad}</div>
              <div style={{display:"flex",gap:8,marginTop:6,flexWrap:"wrap",alignItems:"center"}}>
                {t.sehir && <span style={{fontSize:11,color:T.textMut}}>📍 {t.sehir}</span>}
                <span style={{fontSize:11,color:T.textMut}}>👥 {takimGoster} takım</span>
                {cokSezon
                  ? <span style={{fontSize:10,fontWeight:800,color:t.renk,background:t.renk+"1e",border:"0.5px solid "+t.renk+"55",borderRadius:20,padding:"2px 8px"}}>🗓️ {seriSay[sid]} Sezon</span>
                  : <span style={{fontSize:11,color:T.textMut}}>⚽ {macGoster} maç</span>}
              </div>
              {lider && oynanan>0 && <div style={{fontSize:11,color:T.gold,marginTop:6,fontWeight:700}}>🏆 {lider.ad}</div>}
            </div>
            {!cokSezon && yetkili && <button onClick={e=>{e.stopPropagation(); setYeniSezonHedef(t);}} className="tap" title="Bu ligde yeni sezon aç" style={{flexShrink:0,display:"flex",alignItems:"center",gap:5,background:t.renk+"1e",color:t.renk,border:"0.5px solid "+t.renk+"66",borderRadius:20,padding:"7px 12px",fontSize:11,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>➕ Sezon</button>}
            {!cokSezon && !yetkili && ilkTakimlar.length>0 && <div style={{display:"flex",flexShrink:0,paddingLeft:4}}>{ilkTakimlar.map((tk,i)=><div key={i} style={{marginLeft:i?-10:0,borderRadius:9,overflow:"hidden",border:"2px solid "+T.bg1}}><Logo renk={tk.renk} ad={tk.ad} logo={tk.logo} renk2={tk.renk2} boy={28}/></div>)}</div>}
            <span style={{fontSize:18,color:cokSezon&&acik?t.renk:T.textMut,flexShrink:0,transition:"transform .3s",transform:cokSezon&&acik?"rotate(90deg)":"none"}}>›</span>
          </div>
         </div>
         {cokSezon && <div style={{display:"grid",gridTemplateRows:acik?"1fr":"0fr",transition:"grid-template-rows .34s cubic-bezier(.4,0,.2,1)"}}>
          <div style={{overflow:"hidden"}}>
           <div style={{background:T.bg1,border:"0.5px solid "+t.renk+"55",borderTop:0,borderRadius:"0 0 18px 18px",padding:"4px 13px 12px"}}>
            <div style={{fontSize:9,letterSpacing:.6,fontWeight:700,color:T.textMut,margin:"8px 4px 6px"}}>SEZONLAR</div>
            {liste==null
              ? <div style={{padding:"14px",textAlign:"center",fontSize:11.5,color:T.textMut}}>⏳ Sezonlar yükleniyor…</div>
              : <div style={{position:"relative",paddingLeft:6}}>
                  <div style={{position:"absolute",left:19,top:10,bottom:12,width:2,background:T.line2,borderRadius:2}}/>
                  {liste.map(s=>{ const canli=s.durum!=='arsiv';
                    return <div key={s.id} onClick={()=>sezonaGit(s.id)} className="tap" style={{position:"relative",display:"flex",alignItems:"center",gap:11,padding:"7px 2px",cursor:"pointer"}}>
                      <div style={{position:"relative",zIndex:1,flexShrink:0,boxShadow:"0 0 0 4px "+T.bg1,borderRadius:"50%"}}>
                        {s.logo ? <Logo renk={s.renk} ad={s.ad} logo={s.logo} boy={28}/>
                          : <div style={{width:28,height:28,borderRadius:"50%",background:s.renk,display:"grid",placeItems:"center",fontSize:12,fontWeight:800,color:"#fff"}}>{s.sezonNo}</div>}
                      </div>
                      <div style={{flex:1,minWidth:0,background:T.bg2,border:"0.5px solid "+(canli?s.renk+"55":T.line),borderRadius:11,padding:"8px 11px"}}>
                        <div style={{display:"flex",alignItems:"center",gap:7}}>
                          <span style={{fontSize:8.5,fontWeight:800,color:s.renk,background:s.renk+"1e",borderRadius:20,padding:"2px 7px",flexShrink:0}}>S{s.sezonNo}</span>
                          <span style={{fontSize:12.5,fontWeight:800,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.ad}</span>
                        </div>
                        <div style={{fontSize:10.5,marginTop:3,fontWeight:600,display:"flex",alignItems:"center",gap:5,color:canli?T.accent:T.textMut}}>
                          {canli ? <><span style={{width:6,height:6,borderRadius:"50%",background:T.accent,display:"inline-block"}}/>Şu an aktif sezon</>
                            : (s.sampiyon ? <span style={{color:T.gold,fontWeight:700}}>🏆 Şampiyon: {s.sampiyon.ad}</span> : "📦 Arşiv · tamamlandı")}
                        </div>
                      </div>
                      <span style={{fontSize:15,color:T.textMut,flexShrink:0}}>›</span>
                    </div>;
                  })}
                </div>}
            {yetkili && <div onClick={()=>setYeniSezonHedef(t)} className="tap" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:7,marginTop:8,marginLeft:34,padding:"11px",border:"1px dashed "+t.renk+"66",borderRadius:11,color:t.renk,fontSize:12,fontWeight:700,cursor:"pointer",background:t.renk+"0d"}}>➕ Yeni sezon aç <span style={{fontSize:9.5,color:T.textMut,fontWeight:600,background:T.bg2,borderRadius:20,padding:"2px 7px"}}>👑 yalnız yetkili</span></div>}
           </div>
          </div>
         </div>}
        </div>;
      })}
    </div>}

    {/* TAKIMLAR */}
    {tab==="takim" && (oturum
      ? <div style={{padding:"4px 12px"}}><Kuluplerim embedded T={T} oturum={oturum} git={git} turnuvalar={turnuvalar} takimKurabilir={takimKurabilir} adminMi={adminMi}/></div>
      : <div style={{fontSize:12.5,color:T.textMut,textAlign:"center",padding:"40px 20px",lineHeight:1.6}}>Takımları görmek ve yönetmek için giriş yap.</div>)}

    {/* OYUNCULAR */}
    {tab==="oyuncu" && <div style={{padding:"4px 14px"}}>
      {oyuncuSirali.length===0 && <div style={{fontSize:12,color:T.textMut,textAlign:"center",padding:24}}>Oyuncu bulunamadı</div>}
      {oyuncuSirali.slice(0,200).map((o,i)=>
        <div key={i} onClick={()=>git({sayfa:"oyuncu",oyuncu:{...o}})} className="tap satir-hover" style={{display:"flex",alignItems:"center",gap:11,background:T.bg1,borderRadius:11,padding:"9px 12px",marginBottom:5,border:"0.5px solid "+T.line}}>
          <div style={{position:"relative",flexShrink:0}}>
            <div style={{width:34,height:34,borderRadius:"50%",overflow:"hidden"}} dangerouslySetInnerHTML={{__html:svgAvatar(o.ad,34,o.foto)}}/>
            {o.ovr>0 && <span style={{position:"absolute",bottom:-3,right:-4,fontSize:8,fontWeight:800,background:T.gold,color:"#06140d",borderRadius:6,padding:"0px 4px",fontFamily:T.fontDisplay}}>{o.ovr}</span>}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              <span style={{fontSize:13,color:T.text,fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{o.ad}</span>
              {(o.mvp||0)>0 && <span style={{fontSize:8,color:T.gold,whiteSpace:"nowrap",flexShrink:0}}>⭐{o.mvp}</span>}
            </div>
            <div style={{fontSize:9,color:T.textMut}}>{o.takimAd} · {o.poz||""}</div>
          </div>
          <div style={{textAlign:"right",marginRight:2}}><div style={{fontSize:13,color:T.accent,fontWeight:800,fontFamily:T.fontDisplay}}>{o.gol||0}</div><div style={{fontSize:8,color:T.textMut}}>gol</div></div>
          <div style={{textAlign:"right"}}><div style={{fontSize:13,color:"#34D399",fontWeight:800,fontFamily:T.fontDisplay}}>{o.asist||0}</div><div style={{fontSize:8,color:T.textMut}}>asist</div></div>
          <span style={{fontSize:11,color:T.textMut}}>›</span>
        </div>
      )}
      {oyuncuSirali.length>200 && <div style={{fontSize:10,color:T.textMut,textAlign:"center",padding:10}}>İlk 200 gösteriliyor · aramayla daralt</div>}
    </div>}

    {/* MAÇLAR */}
    {tab==="mac" && <div style={{padding:"10px 14px"}}>
      {tumMaclar.length===0 && <div style={{fontSize:12,color:T.textMut,textAlign:"center",padding:24}}>Henüz maç yok</div>}
      {yaklasanlar.length>0 && <>
        <div style={{fontSize:11,fontWeight:800,color:"#34D399",margin:"4px 2px 7px"}}>📅 YAKLAŞAN ({yaklasanlar.length})</div>
        {yaklasanlar.slice(0,15).map((m,i)=> <MacSatir key={"y"+i} m={m} T={T} git={git}/>)}
      </>}
      {oynananlar.length>0 && <>
        <div style={{fontSize:11,fontWeight:800,color:T.accent,margin:"14px 2px 7px"}}>⚽ SON OYNANANLAR ({oynananlar.length})</div>
        {oynananlar.slice(0,30).map((m,i)=> <MacSatir key={"o"+i} m={m} T={T} git={git}/>)}
      </>}
    </div>}

    {yeniSezonHedef && <YeniSezonPop turnuva={yeniSezonHedef} T={T} onKapat={()=>setYeniSezonHedef(null)} onBaslat={(kimlik)=>sezonBaslatKatalog(yeniSezonHedef, kimlik)}/>}
  </div>;
}

function TumEnler({turnuvalar, T, git, gomulu}){
  const SEKMELER=[
    {ad:"Hücum", ik:"⚽", renk:T.accent, tip:"o", items:[
      ["gol","⚽","Gol Kralı","en çok gol",""],["asist","🅰️","Asist Kralı","en çok asist",""],["katki","✨","Katkı Kralı","gol + asist",""],
      ["macBasiGol","📊","Keskin Nişancı","maç başına gol","ond"],["hattrick","🎩","Hat-trick Ustası","1 maçta 3+ gol",""],["ciftGol","⚡","Çiftçi","1 maçta 2 gol",""],
    ]},
    {ad:"Kaleci", ik:"🧤", renk:"#7c4dff", tip:"o", items:[
      ["kurtaris","🧤","Eldiven","en çok kurtarış",""],["macBasiKurtaris","📊","Refleks","maç başına kurtarış","ond"],["rating","⭐","Güvenilir Kale","en iyi OVR",""],
    ]},
    {ad:"Mevki", ik:"🎯", renk:"#34D399", tip:"o", items:[
      ["forvet","⚽","En İyi Forvet","forvet OVR",""],["ortasaha","🎩","En İyi Orta Saha","orta saha OVR",""],["defans","🛡️","En İyi Defans","defans OVR",""],
    ]},
    {ad:"Kariyer", ik:"👑", renk:T.gold, tip:"o", items:[
      ["mac","🏃","Vazgeçilmez","en çok maç",""],["dakika","⏱️","Sahanın Adamı","en çok dakika","dk"],["mvp","⭐","Yıldız","en çok MVP",""],
      ["odul","🏅","Koleksiyoncu","en çok ödül",""],
    ]},
    {ad:"Disiplin", ik:"🟨", renk:"#e2574b", tip:"o", items:[
      ["centilmen","🕊️","Centilmen","en az kart",""],["sari","🟨","Sinirli","en çok sarı",""],["kirmizi","🟥","Asabi","en çok kırmızı",""],
    ]},
    {ad:"Zaman", ik:"⏱️", renk:"#22c3a6", tip:"o", items:[
      ["erken","🥷","Erken Vuran","ilk çeyrek gol",""],["son","🌙","Son Dakikacı","son dilim gol",""],
      ["ilkYari","🌅","İlk Yarı Adamı","ilk yarı golü",""],["ikinciYari","🌃","İkinci Yarı Adamı","ikinci yarı golü",""],
    ]},
    {ad:"Eğlenceli", ik:"🎭", renk:T.pink||"#D4537E", tip:"o", items:[
      ["supermen","🦸","Süpermen","gol+asist+OVR","yildiz"],["kasap","🔪","Kasap","en çok kart","kart"],
      ["beygir","🐎","Beygir","maç+dakika","yildiz"],["bencil","🎯","Bencil Golcü","çok gol, 0 asist","gol"],
      ["ozverili","🤝","Özverili","çok asist, 0 gol","asist"],["dengeli","⚖️","Dengeli","gol = asist","gol"],
      ["gizliCevher","💎","Gizli Cevher","az maç, çok verim","ond"],
    ]},
    {ad:"İlginç", ik:"🔥", renk:"#f0993f", tip:"o", items:[
      ["tekAdam","🎰","Tek Adam","takımın gol oranı","yildiz"],["cokYonlu","📊","Çok Yönlü","gol+asist+kurtarış","yildiz"],
      ["devAvcisi","🆚","Dev Avcısı","lidere karşı gol",""],["soguk","🧊","Soğukkanlı","yüksek OVR, az kart","yildiz"],
      ["yukselen","📈","Yükselen","düşük OVR, çok gol","yildiz"],["uykucu","💤","Uykucu","yüksek OVR, az gol","yildiz"],
      ["yildiz","🎖️","Sezonun Yıldızı","MVP+gol+ödül","yildiz"],["sanssiz","⚰️","Şanssız","çok maç, 0 ödül","mac"],
      ["surpriz","🎲","Sürpriz","farklı maçta gol","mac"],
    ]},
    {ad:"Takım", ik:"👥", renk:T.accent, tip:"t", items:[
      ["golcuTakim","🏆","En Golcü Takım","attığı gol","gol"],["azYiyen","🛡️","En Az Gol Yiyen","yediği gol","gol"],
      ["averaj","📊","En İyi Averaj","gol farkı",""],["centilmenTakim","🤝","En Centilmen Takım","en az kart",""],
    ]},
    {ad:"Lig", ik:"🏟️", renk:T.gold, tip:"l", items:[
      ["golcuLig","⚽","En Golcü Lig","maç başına gol","ond"],["cekismeli","🔥","En Çekişmeli Lig","puan farkı","p"],
      ["cokTakim","👥","En Çok Takımlı","takım","takım"],["cokMac","📅","En Çok Maçlı","maç","maç"],
    ]},
  ];
  const TUM_SEKMELER=SEKMELER;
  const GORUNEN = gomulu ? TUM_SEKMELER.filter(s=>s.tip!=="l") : TUM_SEKMELER;
  const [sekme,setSekme]=useState(0);
  const [acik,setAcik]=useState(null);
  const aktif=GORUNEN[sekme];

  const oyVal=(o,kat,fmt)=>{
    if(fmt==="ond"){
      if(kat==="macBasiGol") return ((o.gol||0)/(o.mac||1)).toFixed(2);
      if(kat==="macBasiKurtaris") return ((o.kurtaris||0)/(o.mac||1)).toFixed(1);
      if(kat==="gizliCevher"){ const d=o.dk>0?o.dk:(o.mac||0)*60; return d>0?(((o.gol||0)+(o.asist||0))/d*90).toFixed(2):"0"; }
    }
    if(fmt==="kart") return (o.sari||0)+(o.kirmizi||0);
    if(fmt==="gol") return o.gol||0;
    if(fmt==="asist") return o.asist||0;
    if(fmt==="mac") return o.mac||0;
    // yıldızlı (karma puan) kategoriler — gerçek skor göster
    if(fmt==="yildiz"){
      if(kat==="supermen") return ((o.gol||0)+(o.asist||0))+Math.round((o.ovr||0)/10);
      if(kat==="beygir") return (o.mac||0);
      if(kat==="cokYonlu") return (o.gol||0)+(o.asist||0)+(o.kurtaris||0);
      if(kat==="tekAdam") return (o.gol||0);
      if(kat==="soguk") return (o.ovr||0);
      if(kat==="yukselen") return (o.gol||0);
      if(kat==="uykucu") return (o.ovr||0);
      if(kat==="yildiz") return (o.mvp||0)*5+(o.gol||0)+Object.values(o.oduller||{}).filter(Boolean).length*2;
      return "★";
    }
    if(kat==="dakika") return o.dk>0?o.dk:(o.mac||0)*60;
    if(kat==="katki") return (o.gol||0)+(o.asist||0);
    if(kat==="kurtaris") return o.kurtaris||0;
    if(kat==="mac") return o.mac||0;
    if(kat==="mvp") return o.mvp||0;
    if(kat==="odul") return Object.values(o.oduller||{}).filter(Boolean).length;
    if(kat==="sari") return o.sari||0;
    if(kat==="kirmizi") return o.kirmizi||0;
    if(kat==="centilmen") return (o.sari||0)+(o.kirmizi||0);
    if(kat==="gol") return o.gol||0;
    if(kat==="asist") return o.asist||0;
    if(["rating","forvet","ortasaha","defans"].includes(kat)) return o.ovr||0;
    if(kat==="kasap") return (o.sari||0)+(o.kirmizi||0);
    if(o._m){
      if(kat==="hattrick") return o._m.hat||0;
      if(kat==="ciftGol") return o._m.cift||0;
      if(kat==="erken") return o._m.erken||0;
      if(kat==="son") return o._m.son||0;
      if(kat==="ilkYari") return o._m.ilkYari||0;
      if(kat==="ikinciYari") return o._m.ikinciYari||0;
      if(kat==="devAvcisi") return o._m.devGol||0;
      if(kat==="surpriz") return o._m.golMaclar?o._m.golMaclar.size:0;
    }
    if(kat==="hattrick"||kat==="ciftGol"||kat==="erken"||kat==="son"||kat==="ilkYari"||kat==="ikinciYari"||kat==="devAvcisi"){ return "0"; }
    return o.gol||0;
  };
  const takimVal=(t,kat)=>{
    if(kat==="golcuTakim") return t.ag||0;
    if(kat==="azYiyen") return t.yg||0;
    if(kat==="averaj"){ const a=(t.ag||0)-(t.yg||0); return (a>=0?"+":"")+a; }
    if(kat==="centilmenTakim") return t._kart!=null?t._kart:0;
    return "";
  };
  const ligVal=(l,kat)=>{
    if(kat==="golcuLig") return l._ortGol.toFixed(1);
    if(kat==="cekismeli") return l._fark;
    if(kat==="cokTakim") return l._takim;
    if(kat==="cokMac") return l._mac;
    return "";
  };

  const liste=(kat)=> aktif.tip==="t" ? Motor.enlerTakimListe(turnuvalar,kat,10)
                    : aktif.tip==="l" ? Motor.enlerLigListe(turnuvalar,kat,10)
                    : Motor.enListe(turnuvalar,kat,10);

  return <div className={gomulu?"":"fade-in main-area"} style={{paddingBottom:gomulu?10:90}}>
    {!gomulu && <div style={{padding:"12px 14px 0"}}>
      <div style={{position:"relative",overflow:"hidden",borderRadius:16,padding:"14px 16px",border:"1px solid "+T.line,
        background:"radial-gradient(120% 160% at 92% 0%,"+T.gold+"26,transparent 55%), linear-gradient(160deg,"+T.bg1+","+T.bg0+" 80%)"}}>
        <div style={{position:"relative",display:"flex",alignItems:"center",gap:11}}>
          {git && <span onClick={()=>git({sayfa:"ana"})} className="tap" style={{fontSize:20,color:T.textSoft,marginRight:-2}}>‹</span>}
          <div style={{width:40,height:40,borderRadius:12,flexShrink:0,background:T.gold+"1e",border:"1px solid "+T.gold+"3a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🏆</div>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:7}}><span style={{width:14,height:2,borderRadius:2,background:T.gold}}/><span style={{fontSize:10.5,color:T.gold,letterSpacing:1,fontWeight:800}}>REKORLAR</span></div>
            <div style={{fontSize:21,fontWeight:800,color:T.text,fontFamily:T.fontDisplay,marginTop:4,lineHeight:1.1}}>Tüm Enler</div>
          </div>
        </div>
      </div>
    </div>}
    {/* sekmeler — 2 sıra (flex wrap) */}
    <div style={{display:"flex",flexWrap:"wrap",gap:5,padding:"12px 14px 8px"}}>
      {GORUNEN.map((s,i)=>
        <span key={i} onClick={()=>{setSekme(i);setAcik(null);}} className="tap" style={{padding:"6px 11px",borderRadius:15,fontSize:10.5,whiteSpace:"nowrap",fontWeight:sekme===i?700:500,
          background:sekme===i?aktif.renk:T.bg2, color:sekme===i?"#fff":T.textMut, transition:"all .2s"}}>{s.ik} {s.ad}</span>
      )}
    </div>
    {/* filtre (Faz 7) — sadece genel modda */}
    {!gomulu && <div style={{margin:"0 14px 8px",display:"flex",alignItems:"center",gap:6,background:T.bg1,borderRadius:9,padding:"7px 11px",opacity:.5,border:"0.5px solid "+T.line}}>
      <span style={{fontSize:10,color:T.textMut,flex:1}}>🔍 Tüm ligler · Tüm zamanlar</span>
      <span style={{fontSize:9,color:T.textMut,background:T.bg0,borderRadius:6,padding:"2px 7px"}}>yakında</span>
    </div>}
    {gomulu && <div style={{margin:"0 14px 8px",fontSize:10,color:T.textMut}}>Bu ligin oyuncularından hesaplanır</div>}
    {/* içerik — PREMIUM */}
    <div style={{padding:"0 14px"}}>
      {aktif.items.map(([kat,ik,lakap,aciklama,fmt])=>{
        const arr=liste(kat);
        const lider=arr[0];
        const acikMi=acik===kat;
        const renk=aktif.renk;
        const valFn=(x)=> aktif.tip==="t"?takimVal(x,kat) : aktif.tip==="l"?ligVal(x,kat) : oyVal(x,kat,fmt);
        return <div key={kat} style={{marginBottom:7}}>
          <div onClick={()=>setAcik(acikMi?null:kat)} className="tap" style={{display:"flex",alignItems:"center",gap:11,background:lider?`linear-gradient(100deg, ${renk}14, ${T.bg1} 55%)`:T.bg1,border:"0.5px solid "+(lider?renk+"40":T.line),borderRadius:12,padding:11}}>
            <div style={{width:38,height:38,borderRadius:11,background:renk+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{ik}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,color:lider?"#fff":T.textSoft,fontWeight:800}}>{lakap}</div>
              {aciklama && <div style={{display:"inline-block",fontSize:8,color:renk,background:renk+"1f",borderRadius:5,padding:"1px 6px",marginTop:3,fontWeight:600}}>{aciklama}</div>}
            </div>
            {lider ? <div style={{display:"flex",alignItems:"center",gap:7,flexShrink:0}}>
              {aktif.tip==="o" ? <div style={{width:30,height:30,borderRadius:"50%",overflow:"hidden",border:"2px solid "+renk}} dangerouslySetInnerHTML={{__html:svgAvatar(lider.ad,30,lider.foto)}}/> : aktif.tip==="t" ? <Logo renk={lider.renk} ad={lider.ad} logo={lider.logo} renk2={lider.renk2} boy={30}/> : <span style={{fontSize:22}}>🏟️</span>}
              <div style={{textAlign:"right"}}><div style={{fontSize:10.5,color:T.text,fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:64}}>{lider.ad}</div><div style={{fontSize:13,color:renk,fontWeight:800,fontFamily:T.fontDisplay}}>{valFn(lider)}</div></div>
            </div> : <span style={{fontSize:10,color:T.textMut}}>veri yok</span>}
            <span style={{fontSize:11,color:T.textMut,transform:acikMi?"rotate(90deg)":"none",transition:"transform .2s",flexShrink:0}}>›</span>
          </div>
          {acikMi && <div style={{padding:"6px 0 4px"}}>
            {arr.length<=1 && <div style={{fontSize:11,color:T.textMut,textAlign:"center",padding:10}}>{arr.length===0?"Henüz veri yok":"Tek aday var"}</div>}
            {arr.map((x,i)=>{
              const tikla=()=>{ if(!git)return;
                if(aktif.tip==="t"){ const t=turnuvalar.find(z=>z.ad===x.turnuva); git({sayfa:"takim",takim:x,turnuva:t}); }
                else if(aktif.tip==="l"){ const t=turnuvalar.find(z=>z.ad===x.ad); if(t)git({sayfa:"turnuva",turnuva:t}); }
                else { git({sayfa:"oyuncu",oyuncu:{...x}}); }
              };
              return <div key={i} onClick={tikla} className="tap satir-hover" style={{display:"flex",alignItems:"center",gap:9,padding:"6px 11px"}}>
                <span style={{fontSize:11,color:i===0?T.gold:T.textMut,fontWeight:700,width:16}}>{i+1}</span>
                {aktif.tip==="t" ? <Logo renk={x.renk} ad={x.ad} logo={x.logo} renk2={x.renk2} boy={24}/> : aktif.tip==="l" ? <span style={{fontSize:16,width:24,textAlign:"center"}}>🏟️</span> : <div style={{width:24,height:24,borderRadius:"50%",overflow:"hidden",flexShrink:0}} dangerouslySetInnerHTML={{__html:svgAvatar(x.ad,24,x.foto)}}/>}
                <div style={{flex:1,minWidth:0}}><div style={{fontSize:12,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{x.ad}</div>{aktif.tip==="o" && <div style={{fontSize:9,color:T.textMut}}>{x.takimAd} · {x.turnuva}</div>}{aktif.tip==="t" && <div style={{fontSize:9,color:T.textMut}}>{x.turnuva}</div>}</div>
                <span style={{fontSize:13,color:renk,fontWeight:800,fontFamily:T.fontDisplay}}>{valFn(x)}</span>
              </div>;
            })}
          </div>}
        </div>;
      })}
    </div>
  </div>;
}

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
          <div className="stagger">
          {golK.map((o,i)=>
            <div key={o.id} onClick={()=>git({sayfa:"oyuncu",oyuncu:o})} className="tap" style={{display:"flex",alignItems:"center",gap:11,background:i===0?T.accent+"12":T.bg1,borderRadius:10,padding:"8px 12px",marginBottom:4,border:i===0?"0.5px solid "+T.accent+"33":"0.5px solid "+T.line}}>
              <span style={{width:16,textAlign:"center",color:i===0?T.accent:T.textMut,fontWeight:700,fontSize:i<3?14:13}}>{i<3?["🥇","🥈","🥉"][i]:(i+1)}</span>
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

function TurnuvaSayfa({turnuva, T, git, takipLig, ligTakip, yonetim, oturum, saltOkunur, onPaylas, onPaylasKaldir, ilkTab}){
  if(turnuva && turnuva._ozet) return <div className="fade-in" style={{padding:"80px 24px",textAlign:"center",color:T.textMut,fontSize:13.5}}>⏳ Lig yükleniyor…</div>;
  const [tab,setTab]=useState((ilkTab&&yonetim)?ilkTab:"genel");
  const [paylasAcik,setPaylasAcik]=useState(false);
  const [paylasUrl,setPaylasUrl]=useState(turnuva.paylasimSlug?PAYLASIM_URL_TEMIZ(turnuva.paylasimSlug):"");
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
    } else { setPaylasUrl(PAYLASIM_URL_TEMIZ(turnuva.paylasimSlug)); }
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

    {tab==="genel" && <SezonSerisi turnuva={turnuva} T={T} git={git}/>}
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
        {[["gol","⚽ Gol"],["asist","🎯 Asist"],["kurtaris","🧤 Kurtarış"],["odul","🏆 Ödül"],["deger","💎 Değer"]].map(([k,l])=>
          <button key={k} onClick={()=>setKralTab(k)} className="tap" style={{flex:1,padding:"7px 2px",borderRadius:8,fontSize:10.5,fontWeight:700,background:kralTab===k?T.accent:T.bg1,color:kralTab===k?T.bg0:T.textMut,border:"0.5px solid "+T.line}}>{l}</button>
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
      {kralTab==="deger" && (()=>{
        var oys=[]; (kralTurnuva.takimlar||[]).forEach(function(tk){ (tk.oyuncular||[]).forEach(function(o){ oys.push(Object.assign({},o,{_takimAd:tk.ad,_renk:tk.renk})); }); });
        if(!oys.length) return <BosUyari T={T} metin="Henüz oyuncu yok. Kadrolar dolunca değer sıralaması burada görünür." />;
        var enDeger=oys.slice().sort(function(a,b){ return ((b.degerG!=null?b.degerG:b.deger)||0)-((a.degerG!=null?a.degerG:a.deger)||0); }).slice(0,10);
        var enKazanan=oys.slice().sort(function(a,b){ return (b.degerP||0)-(a.degerP||0); }).filter(function(o){return (o.degerP||0)>0;}).slice(0,5);
        var takimSira=(kralTurnuva.takimlar||[]).map(function(tk){ return {ad:tk.ad,renk:tk.renk,logo:tk.logo,v:(tk.oyuncular||[]).reduce(function(s,o){return s+(o.degerG!=null?o.degerG:(o.deger||0));},0),n:(tk.oyuncular||[]).length}; }).sort(function(a,b){return b.v-a.v;});
        var baslik=function(t,alt){ return <div style={{fontSize:11,color:T.accent,fontWeight:800,margin:"14px 2px 8px",letterSpacing:.3}}>{t}{alt?<span style={{color:T.textMut,fontWeight:500}}> · {alt}</span>:null}</div>; };
        var satir=function(i,ad,alt,val,renk,tik,vc){ return <div key={i+ad} onClick={tik} className={tik?"tap":""} style={{display:"flex",alignItems:"center",gap:11,background:T.bg1,borderRadius:11,padding:"9px 11px",marginBottom:6,border:"0.5px solid "+(i===0?T.gold+"44":T.line)}}>
          <div style={{width:24,height:24,borderRadius:7,flexShrink:0,display:"grid",placeItems:"center",fontFamily:T.fontDisplay,fontWeight:800,fontSize:13,background:i===0?T.gold+"22":T.bg2,color:i===0?T.gold:T.textMut}}>{i+1}</div>
          <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,color:T.text,fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{ad}</div>{alt?<div style={{fontSize:10.5,color:T.textMut}}>{alt}</div>:null}</div>
          <span style={{fontFamily:T.fontDisplay,fontWeight:800,fontSize:15,color:vc||T.gold,flexShrink:0}}>{val}</span>
        </div>; };
        return <div className="fade-in">
          {baslik("💎 En Değerli Oyuncular")}
          {enDeger.map(function(o,i){ return satir(i, o.ad, (posAd(o.poz)+" · "+(o._takimAd||"")), fmtEuro(o.degerG!=null?o.degerG:o.deger), o._renk, function(){ git({sayfa:"oyuncu",oyuncu:Object.assign({},o,{turnuva:turnuva.ad})}); }); })}
          {enKazanan.length>0 && baslik("📈 En Çok Değer Kazanan","temel değerin üstünde")}
          {enKazanan.map(function(o,i){ return satir(i, o.ad, (posAd(o.poz)+" · "+(o._takimAd||"")), "+"+fmtEuro(o.degerP), o._renk, function(){ git({sayfa:"oyuncu",oyuncu:Object.assign({},o,{turnuva:turnuva.ad})}); }, T.accent2||T.accent); })}
          {baslik("🏆 En Değerli Takımlar","kadro toplam değeri")}
          {takimSira.map(function(t,i){ return satir(i, t.ad, (t.n+" oyuncu · ort. "+fmtEuro(t.v/(t.n||1))), fmtEuro(t.v), t.renk, null); })}
          <div style={{fontSize:9.5,color:T.textMut,textAlign:"center",marginTop:12,lineHeight:1.5}}>Değer = temel (750 Bin €) + pozisyona duyarlı performans + ödül/rozet bonusları. Maç oynandıkça otomatik güncellenir.</div>
        </div>;
      })()}
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

    {tab==="yonet" && yonetim && <><YonetimPaneli turnuva={turnuva} T={T} git={git} yonetim={yonetim} oturum={oturum} onPaylas={onPaylas}/><YardimciYonetim turnuva={turnuva} T={T} oturum={oturum} sahip={!!(oturum && ((turnuva.yonetici_id===oturum.id) || yonetim.adminMi))}/></>}
  </div>;
}

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
  const kadroDeger=takim.oyuncular.reduce((s,o)=>s+(o.degerG!=null?o.degerG:(o.deger||0)),0);
  const enDegerli=[...takim.oyuncular].sort((a,b)=>((b.degerG!=null?b.degerG:b.deger)||0)-((a.degerG!=null?a.degerG:a.deger)||0))[0]||{};
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
          <div style={{fontSize:10,color:T.textMut,fontWeight:700,margin:"2px 2px 8px"}}>KİŞİLER <span style={{fontWeight:400}}>(kadro + lig · yazınca filtrelenir)</span></div>
          {(()=>{
            const q=(tdAd||"").trim().toLocaleLowerCase("tr");
            // Önce takımın KENDİ kadrosu, sonra ligdeki diğerleri (isim/id ile tekilleştir)
            const kendi=(takim.oyuncular||[]).map(o=>({o,tk:takim}));
            const ligdekiler=(turnuva&&turnuva.takimlar||[]).flatMap(tk=>(tk.oyuncular||[]).map(o=>({o,tk})));
            const gorulen=new Set(); const hepsi=[];
            [...kendi,...ligdekiler].forEach(x=>{ const k=String((x.o&&(x.o.id||x.o.player_id||x.o.ad))||""); if(k&&!gorulen.has(k)){ gorulen.add(k); hepsi.push(x); } });
            const suzulmus=(q ? hepsi.filter(x=>String((x.o&&x.o.ad)||"").toLocaleLowerCase("tr").includes(q)) : hepsi).slice(0,60);
            if(!suzulmus.length) return <div style={{fontSize:11.5,color:T.textMut,textAlign:"center",padding:"14px 0"}}>{q?"Eşleşen kişi yok — yukarıya adı yazıp Kaydet'e bas.":"Liste boş."}</div>;
            return suzulmus.map(({o,tk})=><div key={(tk.id||"t")+"|"+(o.id||o.player_id||o.ad)} onClick={()=>tdKaydet({ad:o.ad,foto:o.foto||null})} className="tap" style={{display:"flex",alignItems:"center",gap:10,padding:"8px 6px",borderRadius:9,borderBottom:"0.5px solid "+T.line}}>
              <div style={{width:30,height:30,borderRadius:"50%",overflow:"hidden",flexShrink:0,background:T.bg2}} dangerouslySetInnerHTML={{__html:svgAvatar(o.ad,30,o.foto)}}/>
              <div style={{flex:1,minWidth:0}}><div style={{fontSize:12.5,fontWeight:600,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{o.ad}</div><div style={{fontSize:10,color:T.textMut}}>{(tk&&tk.id===takim.id)?"bu takım · kadro":(tk&&tk.ad)||""}</div></div>
              <span style={{fontSize:11,color:T.accent,fontWeight:700}}>Seç</span>
            </div>);
          })()}
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
          {[["👑","Gol Kralı",enGolcu,enGolcu.gol,"gol",T.gold],["🎯","Asist Kralı",enAsist,enAsist.asist,"asist",T.accent2],["⭐","En MVP",enMvp,enMvp.mvp,"mvp",T.gold],["🧤","En Kaleci",enKurtaris,enKurtaris.kurtaris,"kurtarış",T.accent2],["🏃","En Çok Maç",enMac,enMac.mac,"maç",T.text],["💎","En Değerli",enDegerli,fmtEuro(enDegerli.degerG!=null?enDegerli.degerG:(enDegerli.deger||0)),"",T.gold]].map(([ik,ad,o,v,birim,c],i)=>
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
          <div style={{fontSize:10,color:T.gold,fontWeight:600,marginBottom:6}}>💰 KADRO DEĞERİ <span style={{color:T.textMut,fontWeight:500}}>· aktif kadro</span></div>
          <div style={{fontSize:24,fontWeight:800,color:T.gold,fontFamily:T.fontDisplay}}>{fmtEuro(kadroDeger)}</div>
          <div style={{fontSize:10,color:T.textMut,marginTop:4}}>Oyuncu başına ort. {fmtEuro(kadroDeger/(takim.oyuncular.length||1))} · En değerli: {enDegerli?.ad||"—"}</div>
        </div>
      </div>
    </div>}

    </div>
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
    sistemDeger.current={id:o.id, pac:o.pac,sho:o.sho,pas:o.pas,dri:o.dri,def:o.def,phy:o.phy, ovr:o.ovr, deger:(o.degerG!=null?Math.round(o.degerG):o.deger)};
  },[o.id]);
  const acDuzenle=()=>{ setD({...o, deger:Math.round(o.degerG!=null?o.degerG:(o.deger||750000)), yildizManuel: o.yildizManuel||0}); setDuzenle(true); };
  const acBilgi=()=>{ setBd({ad:o.ad,poz:o.poz,no:o.no,ayak:o.ayak||"Sağ",dogum:o.dogum||"",boy:o.boy||"",kilo:o.kilo||"",uyruk:o.uyruk||"",saglik:o.saglik||"Sağlam",foto:o.foto||null}); setBilgiAcik(true); };
  const kaydetBilgi=()=>{
    o.ad=bd.ad||o.ad; o.poz=bd.poz; o.no=parseInt(bd.no)||o.no; o.ayak=bd.ayak;
    o.dogum=bd.dogum; o.boy=parseInt(bd.boy)||o.boy; o.kilo=parseInt(bd.kilo)||o.kilo;
    o.uyruk=bd.uyruk||o.uyruk; o.saglik=bd.saglik; o.foto=bd.foto!==undefined?bd.foto:o.foto;
    const y=parseInt((bd.dogum.split(".")[2]||bd.dogum.split("-")[0]||"")); if(y>1950&&y<2020)o.yas=2026-y;
    o._manuel=true; setBilgiAcik(false);
    // KALICI: sahip veya admin ise Supabase'e yaz (RLS: sahip_user_id / admin_mi)
    const pid=o.player_id||(typeof o.id==="string"?o.id:null);
    if(pid && sb){ Db.oyuncuGuncelle(pid, { ad_soyad:o.ad, poz:o.poz, forma_no:o.no, dogum:tarihISO(o.dogum), boy:o.boy, kilo:o.kilo, ayak:o.ayak, uyruk:o.uyruk, saglik:o.saglik, foto:o.foto }); }
  };
  const kaydet=()=>{
    const perf=(o.degerP||0); const eskiG=(o.degerG!=null?o.degerG:o.deger);
    Object.assign(o,d); o.ovr=d.ovr||Math.round((d.pac+d.sho+d.pas+d.dri+d.def+d.phy)/6); o._manuel=true;
    // DEĞER (Faz 1): admin GÜNCEL değeri belirler → temel = güncel − performans (İşlem 1). Supabase'e KALICI yazılır.
    const hedef=Math.round(parseFloat(d.deger)||0); const yeniTemel=Math.max(0, hedef-perf);
    o.deger=yeniTemel; o.degerTemel=yeniTemel; o.degerP=perf; o.degerG=yeniTemel+perf;
    const spid=o.player_id||(typeof o.id==="string"?o.id:null);
    if(spid && sb){ Db.oyuncuGuncelle(spid,{deger:yeniTemel, ovr:o.ovr, nitelik:{pac:d.pac,sho:d.sho,pas:d.pas,dri:d.dri,def:d.def,phy:d.phy}}); Db.degerLog(spid,{onceki:eskiG,yeni:o.degerG,temel:yeniTemel,kaynak:"manuel",aciklama:"Süper admin değer düzenledi"}); }
    setDuzenle(false);
  };
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

  // KARİYER ZAMAN TÜNELİ — bellekteki (yüklü/demo) maçlardan GERÇEK olaylar; tarih varsa tarih, yoksa hafta. Yeni veri YOK.
  const kztOlay=useMemo(()=>{
    let tk=null, tur=null;
    for(const t of (turnuvalar||[])){ for(const k of (t.takimlar||[])){ if((k.oyuncular||[]).some(p=>p&&(p.id===o.id||p.ad===o.ad))){ tk=k; tur=t; break; } } if(tk) break; }
    if(!tur||!tk) return [];
    const maclar=(tur.maclar||[]).filter(m=>m&&m.oynandi && (m.takimAId===tk.id||m.takimBId===tk.id||m.takimA===tk.ad||m.takimB===tk.ad));
    const pd=(t)=>{ try{ let s=""+t; s=s.includes("-")?s:s.split(".").reverse().join("-"); const d=new Date(s); return isNaN(d.getTime())?0:d.getTime(); }catch(e){ return 0; } };
    const fmt=(t)=>{ const s=""+t; const m=s.includes("-")?s.split("-"):s.split(".").reverse(); if(m.length<3) return s; const A=["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"]; return (parseInt(m[2],10)||"")+" "+(A[(parseInt(m[1],10)||1)-1]||"")+" "+m[0]; };
    const eord=(m)=>{ const tarihli=m.tarih&&(""+m.tarih).length>=8; return tarihli?pd(m.tarih):(1000000+(m.hafta||0)); };
    const elbl=(m)=>{ const tarihli=m.tarih&&(""+m.tarih).length>=8; return tarihli?fmt(m.tarih):(m.hafta?(m.hafta+". Hafta"):""); };
    const olay=[];
    maclar.forEach(m=>{ const ev=Array.isArray(m.olaylar)?m.olaylar:[];
      const gol=ev.filter(x=>x&&x.tip==='gol'&&(x.oyuncuId===o.id||x.oyuncu===o.ad)).length;
      const asist=ev.filter(x=>x&&x.tip==='gol'&&(x.asistId===o.id||x.asist===o.ad)).length;
      const mvp=(m.mvpId===o.id||m.mvp===o.ad);
      if(mvp) olay.push({ik:"⭐",ad:"Maçın adamı seçildi",lbl:elbl(m),ord:eord(m)});
      if(gol>0) olay.push({ik:"⚽",ad:gol+" gol"+(asist>0?" + "+asist+" asist":""),lbl:elbl(m),ord:eord(m)});
    });
    olay.sort((a,b)=>b.ord-a.ord);
    if(maclar.length){ let ilk=maclar[0]; maclar.forEach(m=>{ if(eord(m)<eord(ilk)) ilk=m; }); olay.push({ik:"🏁",ad:"İlk maçına çıktı",lbl:elbl(ilk),ord:-1}); }
    return olay.slice(0,14);
  },[o&&o.id, o&&o.ad, turnuvalar]);

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

    {(adminMod || adminMi || benimMi) && <div style={{padding:"10px 14px 0",display:"flex",justifyContent:"center",gap:8,flexWrap:"wrap"}}>
      <button onClick={acDuzenle} className="tap" style={{display:"flex",alignItems:"center",gap:6,background:T.bg1,border:"0.5px solid "+T.line,color:T.text,borderRadius:10,padding:"7px 14px",fontSize:11,fontWeight:600}}>⚙️ Statları Düzelt</button>
      <button onClick={acBilgi} className="tap" style={{display:"flex",alignItems:"center",gap:6,background:T.bg1,border:"0.5px solid "+T.line,color:T.text,borderRadius:10,padding:"7px 14px",fontSize:11,fontWeight:600}}>✏️ Bilgileri Düzenle</button>
    </div>}
    {duzenle && d && <StatDuzeltModal o={o} d={d} setD={setD} T={T} kaydet={kaydet} kapat={()=>setDuzenle(false)} otomatikYap={otomatikYap}/>}
    {bilgiAcik && bd && <BilgiDuzeltModal o={o} bd={bd} setBd={setBd} T={T} kaydet={kaydetBilgi} kapat={()=>setBilgiAcik(false)}/>}

    {/* ===== AKIŞ ===== */}
    {sekme==="akis" && <div className="fade-in" style={{padding:"12px 14px",display:"flex",flexDirection:"column",gap:9}}>
      {/* KARİYER ZAMAN TÜNELİ (V5) — gerçek maç olayları (tarih/hafta). Boşsa gösterilmez. */}
      {kztOlay.length>0 && <div style={{background:T.bg1,borderRadius:12,padding:"6px 13px 10px",border:"0.5px solid "+T.line}}>
        <div style={{fontSize:10,color:T.gold,fontWeight:800,letterSpacing:.7,padding:"9px 0 4px"}}>🏆 KARİYER ZAMAN TÜNELİ</div>
        {kztOlay.map((k,i)=><div key={i} style={{display:"flex",gap:11,alignItems:"stretch",padding:"6px 0"}}>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",flexShrink:0}}>
            <span style={{width:28,height:28,borderRadius:"50%",background:T.gold+"1e",border:"1px solid "+T.gold+"55",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>{k.ik}</span>
            {i<kztOlay.length-1 && <span style={{width:2,flex:1,minHeight:10,background:T.line,marginTop:2}}/>}
          </div>
          <div style={{flex:1,minWidth:0,paddingTop:3}}>
            <div style={{fontSize:12.5,fontWeight:700,color:T.text}}>{k.ad}</div>
            {k.lbl && <div style={{fontSize:10.5,color:T.gold,marginTop:1,fontWeight:700}}>📅 {k.lbl}</div>}
          </div>
        </div>)}
      </div>}
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
          {[["YAŞ",o.yas],["BOY",o.boy?o.boy+" cm":"—"],["KİLO",o.kilo?o.kilo+" kg":"—"],["DEĞER",fmtEuro(o.degerG!=null?o.degerG:(o.deger||750000))]].map(([k,v],i)=>
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
              return <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:i<sonMaclar.length-1?"0.5px solid "+T.line:"none"}}>
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

function MacSayfa({mac:m, turnuva, T, git, oturum, sahiplenme, yetkili}){
  const kadroVar = m.kadroA || m.kadroB;
  const macHakemleri = hakemParse(m.hakemler!=null?m.hakemler:m.hakem);   // maç hakemleri (0–4) + görev
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
      {(m.tarih||m.saat||m.stad||macHakemleri.length>0) && <div style={{textAlign:"center",fontSize:10,color:T.textMut,marginBottom:12,display:"flex",justifyContent:"center",alignItems:"center",gap:6,flexWrap:"wrap"}}>
        {m.tarih && <span>📅 {m.tarih.includes("-")?m.tarih.split("-").reverse().join("."):m.tarih}</span>}
        {m.saat && <><span style={{color:T.line}}>·</span><span>🕐 {m.saat}</span></>}
        {m.stad && <><span style={{color:T.line}}>·</span><span>📍 {m.stad}</span></>}
        {macHakemleri.length>0 && <><span style={{color:T.line}}>·</span><span title={macHakemleri.map(h=>h.ad+(h.gorev?" ("+h.gorev+")":"")).join(", ")}>🧑‍⚖️ {macHakemleri.length===1?macHakemleri[0].ad:macHakemleri.map(h=>h.ad).join(", ")}</span></>}
      </div>}
      {!(m.tarih||m.saat||m.stad||macHakemleri.length>0) && <div style={{marginBottom:12}}/>}
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
    <CanliYayin m={m} T={T} git={git} turnuva={turnuva}/>

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
  const [hakemler,setHakemler]=useState(()=>hakemParse(mac.hakemler!=null?mac.hakemler:mac.hakem));  // [{ad,gorev,uid}] · 0–4
  const [hakemHavuz,setHakemHavuz]=useState([]);   // kayıtlı hakemler (profiller · roller.hakem · aktif)
  const [hakemModal,setHakemModal]=useState(false);
  const [hakemManuel,setHakemManuel]=useState("");
  const [hakemAra2,setHakemAra2]=useState("");
  useEffect(()=>{ let a=true; Db.hakemHavuzu().then(h=>{ if(a) setHakemHavuz(h||[]); }); return ()=>{a=false;}; },[]);
  const hakemEkle=(ad,uid)=>{ ad=(ad||"").trim(); if(!ad) return; if(hakemler.length>=4){ return; } if(uid&&hakemler.some(h=>h.uid===uid)){ setHakemModal(false); return; } setHakemler(l=>[...l,{ad,gorev:hakemGorevSonraki(l),...(uid?{uid}:{})}]); };
  const hakemGorevDegis=(i,g)=>setHakemler(l=>l.map((h,x)=>x===i?{...h,gorev:g}:h));
  const hakemCikar=(i)=>setHakemler(l=>l.filter((_,x)=>x!==i));

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
      tarih, saat, stadyum, hakem:hakemDurustur(hakemler), hakemler,
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
      </div>
      {/* HAKEMLER — 0–4 hakem + görev (opsiyonel) */}
      <div style={{marginTop:12,background:T.bg1,border:"0.5px solid "+T.line,borderRadius:12,padding:"11px 12px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:hakemler.length?8:0}}>
          <span style={{fontSize:11.5,fontWeight:800,color:T.text,letterSpacing:.3}}>🧑‍⚖️ HAKEMLER <span style={{color:T.textMut,fontWeight:600}}>· {hakemler.length}/4</span></span>
          {hakemler.length<4 && <button onClick={()=>{setHakemManuel("");setHakemAra2("");setHakemModal(true);}} className="tap" style={{fontSize:11,fontWeight:800,color:T.bg0,background:T.accent,border:0,borderRadius:8,padding:"6px 12px"}}>+ Hakem Ekle</button>}
        </div>
        {hakemler.length===0
          ? <div style={{fontSize:11.5,color:T.textMut,textAlign:"center",padding:"10px 6px"}}>Hakem henüz atanmadı. <span style={{color:T.textSoft}}>“+ Hakem Ekle” ile 4’e kadar hakem atayabilirsin (zorunlu değil).</span></div>
          : hakemler.map((h,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderTop:i>0?"0.5px solid "+T.line:"none"}}>
              <div style={{width:26,height:26,borderRadius:"50%",background:T.accent+"22",color:T.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,flexShrink:0}}>{i+1}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12.5,fontWeight:700,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{h.ad}</div>
                <select value={h.gorev||"Orta Hakem"} onChange={e=>hakemGorevDegis(i,e.target.value)} style={{marginTop:3,fontSize:10.5,color:T.accent2||T.accent,background:T.bg2,border:"0.5px solid "+T.line,borderRadius:6,padding:"2px 4px",fontFamily:"inherit",outline:"none",maxWidth:"100%"}}>
                  {HAKEM_GOREVLER.map(g=><option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <button onClick={()=>hakemCikar(i)} className="tap" title="Kaldır" style={{fontSize:12,background:T.danger+"14",border:"0.5px solid "+T.danger+"40",borderRadius:7,padding:"5px 8px",color:T.danger,flexShrink:0}}>✕</button>
            </div>)}
      </div>
    </div>
    {hakemModal && <div onClick={()=>setHakemModal(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:1600,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} className="fade-in" style={{width:"100%",maxWidth:460,maxHeight:"78vh",overflowY:"auto",background:T.bg1,borderRadius:"18px 18px 0 0",padding:"16px 16px calc(20px + env(safe-area-inset-bottom))",border:"0.5px solid "+T.line}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}><span style={{fontSize:15,fontWeight:800,color:T.text}}>🧑‍⚖️ Hakem Ekle <span style={{fontSize:11,color:T.textMut,fontWeight:600}}>· {hakemler.length}/4</span></span><span onClick={()=>setHakemModal(false)} className="tap" style={{fontSize:13,color:T.textMut,cursor:"pointer"}}>Kapat</span></div>
        <div style={{display:"flex",gap:7,marginBottom:12}}>
          <input value={hakemManuel} onChange={e=>setHakemManuel(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter"&&hakemManuel.trim()){ const son=hakemler.length+1>=4; hakemEkle(hakemManuel); setHakemManuel(""); if(son) setHakemModal(false); } }} placeholder="İsimle ekle (kayıtsız hakem)…" style={{flex:1,boxSizing:"border-box",background:T.bg2,border:"0.5px solid "+T.line,borderRadius:9,padding:"9px 11px",color:T.text,fontSize:12.5,outline:"none",fontFamily:"inherit"}}/>
          <button onClick={()=>{ if(hakemManuel.trim()){ const son=hakemler.length+1>=4; hakemEkle(hakemManuel); setHakemManuel(""); if(son) setHakemModal(false); } }} className="tap" style={{fontSize:12,fontWeight:800,color:T.bg0,background:T.accent,border:0,borderRadius:9,padding:"0 14px"}}>Ekle</button>
        </div>
        <div style={{fontSize:10,color:T.textMut,fontWeight:700,letterSpacing:.4,marginBottom:6}}>KAYITLI HAKEM HAVUZU{hakemHavuz.length>0?" · "+hakemHavuz.length:""}</div>
        {hakemHavuz.length===0
          ? <div style={{fontSize:11.5,color:T.textMut,textAlign:"center",padding:"12px 8px"}}>Kayıtlı hakem yok. Admin panelinde <b style={{color:T.textSoft}}>🧑‍⚖️ Hakemler</b> sekmesinden üyelere hakem yetkisi verebilirsin.</div>
          : <>
            <input value={hakemAra2} onChange={e=>setHakemAra2(e.target.value)} placeholder="🔍 Hakem ara…" style={{width:"100%",boxSizing:"border-box",background:T.bg2,border:"0.5px solid "+T.line,borderRadius:9,padding:"8px 11px",color:T.text,fontSize:12,outline:"none",fontFamily:"inherit",marginBottom:8}}/>
            {hakemHavuz.filter(h=>{ const q=hakemAra2.trim().toLowerCase(); return !q||((h.ad||h.email||"").toLowerCase().indexOf(q)>-1)||((h.sehir||"").toLowerCase().indexOf(q)>-1); }).map(h=>{ const ekli=hakemler.some(x=>x.uid&&x.uid===h.user_id); const dolu=hakemler.length>=4; return (
              <div key={h.user_id} onClick={()=>{ if(ekli||dolu) return; const son=hakemler.length+1>=4; hakemEkle(h.ad||h.email||"Hakem",h.user_id); if(son) setHakemModal(false); }} className={(ekli||dolu)?"":"tap"} style={{display:"flex",alignItems:"center",gap:11,padding:"9px 6px",borderRadius:10,borderBottom:"0.5px solid "+T.line,opacity:(ekli||dolu)?.45:1}}>
                <div style={{width:34,height:34,borderRadius:"50%",overflow:"hidden",flexShrink:0,background:T.bg2}} dangerouslySetInnerHTML={{__html:svgAvatar(h.ad||"Hakem",34,h.foto)}}/>
                <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:700,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{h.ad||h.email}</div><div style={{fontSize:11,color:T.textMut}}>{h.sehir||"—"}</div></div>
                <span style={{fontSize:12,color:ekli?T.textMut:T.accent,fontWeight:700}}>{ekli?"✓ ekli":"Ekle ›"}</span>
              </div>);
            })}
          </>}
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

function TakipSayfa({T, turnuvalar, takipLig, takipOyuncu, takipTakim, ligTakip, oyuncuTakip, takimTakip, git}){
  const [sekme,setSekme]=useState("akis");
  const [seciliLig,setSeciliLig]=useState(null);
  const [ligTab,setLigTab]=useState("puan");

  const ligler=turnuvalar.filter(t=>takipLig.includes(t.id));
  const oyuncular=Motor.tumOyuncular(turnuvalar).filter(o=>takipOyuncu.includes(o.id));
  // takip edilen takımlar (turnuvasıyla birlikte)
  const takimlar=[];
  turnuvalar.forEach(t=> t.takimlar.forEach(tk=>{ if((takipTakim||[]).includes(tk.id)) takimlar.push({takim:tk, turnuva:t}); }));

  // —— sıradaki maç (ilk oynanmamış) ——
  const siradaki=useMemo(()=>{
    for(const t of ligler){
      const m=t.maclar.find(mc=>!mc.oynandi);
      if(m) return {mac:m,turnuva:t};
    }
    return null;
  },[turnuvalar,takipLig]);

  // —— ÖNE ÇIKANLAR: akıllı özet (döküm değil) ——
  const oneCikan=useMemo(()=>{
    const ilgilendiren=[]; // takip ettiğin oyuncu/takım hareketi
    const dikkat=[];       // hat-trick, kırmızı, gol yağmuru
    const sonuclar=[];     // son maç skorları

    // takip edilen oyuncu/takım id setleri
    const takOyuncuSet=new Set(takipOyuncu||[]);
    const takTakimSet=new Set(takipTakim||[]);

    ligler.forEach(t=>{
      const oynanmis=t.maclar.filter(mc=>mc.oynandi).sort((a,b)=>b.hafta-a.hafta);
      oynanmis.forEach(mc=>{
        const A=t.takimlar.find(x=>x.id===mc.takimAId)||t.takimlar.find(x=>x.ad===mc.takimA);
        const B=t.takimlar.find(x=>x.id===mc.takimBId)||t.takimlar.find(x=>x.ad===mc.takimB);
        const toplamGol=(mc.skorA||0)+(mc.skorB||0);
        const skor=`${mc.takimA} ${mc.skorA}-${mc.skorB} ${mc.takimB}`;

        // golcü sayımı (bu maç)
        const golSay={};
        (mc.olaylar||[]).filter(o=>o.tip==="gol").forEach(o=>{ golSay[o.oyuncu]=(golSay[o.oyuncu]||0)+1; });

        // — DİKKAT ÇEKEN —
        Object.entries(golSay).forEach(([ad,n])=>{ if(n>=3) dikkat.push({ik:"🎩",baslik:`${ad} hat-trick!`,alt:`${n} gol · ${skor}`,renk:T.danger,mac:mc,turnuva:t,hafta:mc.hafta}); });
        (mc.olaylar||[]).filter(o=>o.tip==="kirmizi").forEach(o=>{ dikkat.push({ik:"🟥",baslik:`${o.oyuncu} kırmızı gördü`,alt:`${o.dk?o.dk+"' · ":""}${skor}`,renk:T.danger,mac:mc,turnuva:t,hafta:mc.hafta}); });
        if(toplamGol>=6) dikkat.push({ik:"⚡",baslik:`Gol yağmuru: ${toplamGol} gol`,alt:`${t.ad} · ${skor}`,renk:T.gold,mac:mc,turnuva:t,hafta:mc.hafta});

        // — SENİ İLGİLENDİREN —
        // takip ettiğin oyuncu gol/asist
        (mc.olaylar||[]).forEach(o=>{
          if(o.tip==="gol"){
            const golcu=[...(A?A.oyuncular:[]),...(B?B.oyuncular:[])].find(p=>p.ad===o.oyuncu);
            if(golcu && takOyuncuSet.has(golcu.id)){
              const n=golSay[o.oyuncu];
              // her oyuncu için tek satır (ilk görüşte ekle)
              if(!ilgilendiren.find(x=>x.key===mc.id+"-"+golcu.id))
                ilgilendiren.push({key:mc.id+"-"+golcu.id,ik:"⭐",baslik:`${o.oyuncu} ${n>1?n+" gol attı":"gol attı"}`,alt:`takip ettiğin futbolcu · ${skor}`,renk:"#34D399",mac:mc,turnuva:t,hafta:mc.hafta});
            }
          }
        });
        // takip ettiğin takım kazandı/lider
        [A,B].forEach((tk,idx)=>{
          if(tk && takTakimSet.has(tk.id)){
            const benimSkor=idx===0?mc.skorA:mc.skorB, rakipSkor=idx===0?mc.skorB:mc.skorA;
            if(benimSkor>rakipSkor){
              // lider mi kontrol
              const sirali=[...t.takimlar].sort((a,b)=>(b.puan||0)-(a.puan||0)||((b.ag-b.yg)-(a.ag-a.yg)));
              const lider=sirali[0] && sirali[0].id===tk.id;
              ilgilendiren.push({key:mc.id+"-tk"+tk.id,ik:"🏆",baslik:`${tk.ad} kazandı${lider?", lider":""}`,alt:`takip ettiğin takım · ${mc.hafta}. hafta · ${skor}`,renk:T.gold,mac:mc,turnuva:t,hafta:mc.hafta});
            }
          }
        });

        // — SON SONUÇLAR —
        sonuclar.push({takimA:mc.takimA,takimB:mc.takimB,skorA:mc.skorA,skorB:mc.skorB,renkA:mc.renkA,renkB:mc.renkB,mac:mc,turnuva:t,hafta:mc.hafta});
      });
    });

    return {
      ilgilendiren: ilgilendiren.sort((a,b)=>b.hafta-a.hafta).slice(0,6),
      dikkat: dikkat.sort((a,b)=>b.hafta-a.hafta).slice(0,6),
      sonuclar: sonuclar.sort((a,b)=>b.hafta-a.hafta).slice(0,5),
    };
  },[turnuvalar,takipLig,takipOyuncu,takipTakim]);

  const ozetVar = oneCikan.ilgilendiren.length||oneCikan.dikkat.length||oneCikan.sonuclar.length;

  // —— oyuncu krallık sırası rozeti ——
  const golK=Motor.golKrallari(turnuvalar,99);
  const asistK=Motor.asistKrallari(turnuvalar,99);
  const oyuncuRozet=(o)=>{
    const gi=golK.findIndex(x=>x.id===o.id);
    const ai=asistK.findIndex(x=>x.id===o.id);
    if(gi===0) return {et:"GOL KRALI",ik:"🥇",renk:T.gold};
    if(ai===0) return {et:"ASİST KRALI",ik:"🥇",renk:T.accent2||T.accent};
    if(gi>=0&&gi<3) return {et:`${gi+1}. GOL`,ik:gi===1?"🥈":"🥉",renk:T.gold};
    if(ai>=0&&ai<3) return {et:`${ai+1}. ASİST`,ik:ai===1?"🥈":"🥉",renk:T.accent2||T.accent};
    return null;
  };
  // —— oyuncu form: son maçlardaki rating ——
  const oyuncuForm=(o)=>{
    const t=turnuvalar.find(x=>x.id===o.turnuvaId); if(!t) return [];
    const rtg=[];
    t.maclar.filter(mc=>mc.oynandi && mc.ratingler && mc.ratingler[o.ad]!=null)
      .slice(-5).forEach(mc=> rtg.push(mc.ratingler[o.ad]));
    return rtg;
  };
  const formRenk=(r)=> r>=7.5?"#34D399" : r>=6.5?T.gold : r>=5.5?"#9aa0a8" : T.danger;

  // —— lig durum rozeti ——
  const ligDurum=(t)=>{
    const oynanan=t.maclar.filter(m=>m.oynandi).length, toplam=t.maclar.length;
    const bugun=new Date(); bugun.setHours(0,0,0,0);
    if(t.baslangic){ const bd=new Date(t.baslangic); bd.setHours(0,0,0,0); const gf=Math.round((bd-bugun)/86400000);
      if(gf>0) return {yazi:gf+" GÜN",renk:T.gold}; }
    if(toplam>0 && oynanan>=toplam) return {yazi:"BİTTİ",renk:T.textMut};
    if(oynanan>0) return {yazi:"● BAŞLADI",renk:T.accent};
    return {yazi:"HAZIRLIK",renk:T.textMut};
  };

  // varsayılan seçili lig
  const aktifLig = seciliLig ? ligler.find(t=>t.id===seciliLig) : ligler[0];

  const SekmeBtn=({k,ik,et})=> <span onClick={()=>setSekme(k)} className="tap" style={{flex:1,fontSize:10,textAlign:"center",padding:"8px 0",borderRadius:8,fontWeight:sekme===k?700:500,whiteSpace:"nowrap",
    color:sekme===k?(T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0):T.textMut, background:sekme===k?T.accent:"transparent"}}>{ik} {et}</span>;

  return <div className="fade-in" style={{paddingBottom:90}}>
    <Baslik ust="TAKİP" ana="Akışım" T={T}/>

    {/* ÜST SEKMELER */}
    <div style={{padding:"4px 14px 8px"}}>
      <div style={{display:"flex",gap:3,background:T.bg1,padding:3,borderRadius:11}}>
        <SekmeBtn k="akis" ik="✨" et="Öne Çıkan"/>
        <SekmeBtn k="ligler" ik="🏆" et="Lig"/>
        <SekmeBtn k="takimlar" ik="⚽" et="Takım"/>
        <SekmeBtn k="oyuncular" ik="👤" et="Futbolcu"/>
      </div>
    </div>

    {/* ========== AKIŞ ========== */}
    {sekme==="akis" && <div className="fade-in" style={{padding:"0 14px"}}>
      {/* sayaçlar */}
      <div style={{display:"flex",gap:6,marginBottom:12}}>
        {[[ligler.length,"lig",T.accent],[takimlar.length,"takım",T.accent],[oyuncular.length,"futbolcu",T.accent2||T.accent]].map(([n,et,c],i)=>
          <div key={i} style={{flex:1,background:T.bg1,borderRadius:9,padding:"9px 4px",textAlign:"center"}}>
            <div style={{fontSize:18,fontWeight:800,color:c,fontFamily:T.fontDisplay}}>{n}</div>
            <div style={{fontSize:9,color:T.textMut}}>{et}</div>
          </div>
        )}
      </div>

      {/* sıradaki maç */}
      {siradaki && <div style={{background:T.bg1,borderRadius:11,padding:11,marginBottom:14,border:"0.5px solid "+T.gold+"33"}}>
        <div style={{fontSize:10,color:T.gold,fontWeight:700,marginBottom:7}}>⏰ SIRADAKİ MAÇ</div>
        <div onClick={()=>git({sayfa:"mac",mac:siradaki.mac,turnuva:siradaki.turnuva})} className="tap" style={{display:"flex",alignItems:"center",gap:8}}>
          <Logo renk={siradaki.mac.renkA} ad={siradaki.mac.takimA} boy={26}/>
          <span style={{fontSize:12,color:T.text,fontWeight:600,flex:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{siradaki.mac.takimA}</span>
          <span style={{fontSize:11,color:T.textMut}}>vs</span>
          <span style={{fontSize:12,color:T.text,fontWeight:600,flex:1,textAlign:"right",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{siradaki.mac.takimB}</span>
          <Logo renk={siradaki.mac.renkB} ad={siradaki.mac.takimB} boy={26}/>
        </div>
        <div style={{fontSize:10,color:T.textMut,marginTop:6,textAlign:"center"}}>{siradaki.mac.hafta}. hafta · {siradaki.turnuva.ad}</div>
      </div>}

      {ligler.length===0 ?
        <div style={{background:T.bg1,borderRadius:12,padding:20,textAlign:"center",border:"0.5px solid "+T.line}}>
          <div style={{fontSize:13,color:T.textMut,lineHeight:1.6,marginBottom:12}}>Henüz lig takip etmiyorsun. Bir lig takip et, öne çıkanları burada gör.</div>
          <button onClick={()=>setSekme("ligler")} className="tap" style={{fontSize:12,color:T.accent,background:T.accent+"18",borderRadius:9,padding:"8px 16px",fontWeight:700,border:"1px solid "+T.accent+"44"}}>🏆 Ligler sekmesine git</button>
        </div> :
      !ozetVar ?
        <div style={{background:T.bg1,borderRadius:12,padding:20,textAlign:"center",border:"0.5px solid "+T.line}}>
          <div style={{fontSize:13,color:T.textMut,lineHeight:1.6}}>Henüz oynanmış maç yok. Maçlar oynandıkça öne çıkanlar burada belirir.</div>
        </div> :
      <>
        {/* SENİ İLGİLENDİREN */}
        {oneCikan.ilgilendiren.length>0 && <>
          <div style={{fontSize:12,fontWeight:700,color:T.text,margin:"2px 2px 8px"}}>⭐ Seni İlgilendiren</div>
          {oneCikan.ilgilendiren.map((o,i)=>
            <div key={i} onClick={()=>git({sayfa:"mac",mac:o.mac,turnuva:o.turnuva})} className="tap" style={{background:T.bg1,borderRadius:"0 11px 11px 0",padding:"10px 11px",marginBottom:5,borderLeft:"3px solid "+o.renk}}>
              <div style={{fontSize:11,color:T.text,fontWeight:600}}>{o.ik} {o.baslik}</div>
              <div style={{fontSize:10,color:T.textSoft,marginTop:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{o.alt}</div>
            </div>
          )}
        </>}

        {/* DİKKAT ÇEKEN */}
        {oneCikan.dikkat.length>0 && <>
          <div style={{fontSize:12,fontWeight:700,color:T.text,margin:"14px 2px 8px"}}>🔥 Dikkat Çeken</div>
          {oneCikan.dikkat.map((o,i)=>
            <div key={i} onClick={()=>git({sayfa:"mac",mac:o.mac,turnuva:o.turnuva})} className="tap" style={{background:T.bg1,borderRadius:"0 11px 11px 0",padding:"10px 11px",marginBottom:5,borderLeft:"3px solid "+o.renk}}>
              <div style={{fontSize:11,color:T.text,fontWeight:600}}>{o.ik} {o.baslik}</div>
              <div style={{fontSize:10,color:T.textSoft,marginTop:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{o.alt}</div>
            </div>
          )}
        </>}

        {/* SON SONUÇLAR */}
        {oneCikan.sonuclar.length>0 && <>
          <div style={{fontSize:12,fontWeight:700,color:T.text,margin:"14px 2px 8px"}}>🏆 Son Sonuçlar</div>
          {oneCikan.sonuclar.map((s,i)=>
            <div key={i} onClick={()=>git({sayfa:"mac",mac:s.mac,turnuva:s.turnuva})} className="tap" style={{display:"flex",alignItems:"center",gap:7,background:T.bg1,borderRadius:10,padding:"8px 11px",marginBottom:4}}>
              <Logo renk={s.renkA} ad={s.takimA} boy={18}/>
              <span style={{fontSize:11,color:T.text,flex:1,textAlign:"right",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.takimA}</span>
              <span style={{fontSize:12,fontWeight:800,fontFamily:T.fontDisplay,color:T.text,background:T.bg2,borderRadius:6,padding:"2px 8px",whiteSpace:"nowrap"}}>{s.skorA}-{s.skorB}</span>
              <span style={{fontSize:11,color:T.text,flex:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.takimB}</span>
              <Logo renk={s.renkB} ad={s.takimB} boy={18}/>
            </div>
          )}
        </>}
      </>}
    </div>}

    {/* ========== LİGLER ========== */}
    {sekme==="ligler" && <div className="fade-in" style={{padding:"0 14px"}}>
      {ligler.length===0 ?
        <div style={{background:T.bg1,borderRadius:12,padding:20,textAlign:"center",border:"0.5px solid "+T.line}}>
          <div style={{fontSize:13,color:T.textMut,lineHeight:1.6,marginBottom:12}}>Henüz lig takip etmiyorsun.</div>
          <button onClick={()=>git({sayfa:"ligler"})} className="tap" style={{fontSize:12,color:T.accent,background:T.accent+"18",borderRadius:9,padding:"8px 16px",fontWeight:700,border:"1px solid "+T.accent+"44"}}>Ligleri keşfet</button>
        </div> :
      <>
        {/* lig seçici çipler */}
        <div style={{display:"flex",gap:6,marginBottom:12,overflowX:"auto",paddingBottom:2}}>
          {ligler.map(t=>{ const aktif=(aktifLig&&aktifLig.id===t.id);
            return <div key={t.id} onClick={()=>setSeciliLig(t.id)} className="tap" style={{display:"flex",alignItems:"center",gap:6,whiteSpace:"nowrap",borderRadius:9,padding:"6px 10px",
              background:aktif?t.renk+"22":T.bg1,border:"0.5px solid "+(aktif?t.renk:T.line)}}>
              <Logo renk={t.renk} ad={t.ad} logo={t.logo} renk2={t.renk2} boy={18}/>
              <span style={{fontSize:11,color:aktif?T.text:T.textMut,fontWeight:aktif?700:500}}>{t.ad}</span>
            </div>;
          })}
        </div>

        {aktifLig && <>
          {/* lig başlık + takipten çık */}
          <div style={{display:"flex",alignItems:"center",gap:9,background:T.bg1,borderRadius:11,padding:"10px 12px",marginBottom:10}}>
            <Logo renk={aktifLig.renk} ad={aktifLig.ad} logo={aktifLig.logo} renk2={aktifLig.renk2} boy={32}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,color:T.text,fontWeight:700}}>{aktifLig.ad}</div>
              <div style={{fontSize:10,color:ligDurum(aktifLig).renk,fontWeight:600}}>{ligDurum(aktifLig).yazi}</div>
            </div>
            <button onClick={()=>{ ligTakip(aktifLig.id); setSeciliLig(null); }} className="tap" style={{fontSize:11,color:T.danger,background:T.danger+"18",borderRadius:8,padding:"6px 11px",fontWeight:600,border:"1px solid "+T.danger+"33"}}>✕ Bırak</button>
          </div>

          {/* lig alt sekmeleri */}
          <div style={{display:"flex",gap:4,marginBottom:10}}>
            {[["puan","Puan"],["gol","⚽ Gol"],["asist","🅰 Asist"],["odul","🏅 Ödül"],["fikstur","Fikstür"]].map(([k,et])=>
              <span key={k} onClick={()=>setLigTab(k)} className="tap" style={{flex:1,fontSize:10,textAlign:"center",padding:"7px 0",borderRadius:7,fontWeight:ligTab===k?700:500,
                color:ligTab===k?(T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0):T.textMut, background:ligTab===k?T.accent:T.bg1}}>{et}</span>
            )}
          </div>

          <TakipLigIcerik turnuva={aktifLig} ligTab={ligTab} T={T} git={git}/>
        </>}
      </>}
    </div>}

    {/* ========== TAKIMLAR ========== */}
    {sekme==="takimlar" && <div className="fade-in" style={{padding:"0 14px"}}>
      {takimlar.length===0 ?
        <div style={{background:T.bg1,borderRadius:12,padding:20,textAlign:"center",border:"0.5px solid "+T.line}}>
          <div style={{fontSize:13,color:T.textMut,lineHeight:1.6}}>Henüz takım takip etmiyorsun. Bir takım sayfasından "+ Takip et" ile ekle.</div>
        </div> :
        takimlar.map(({takim:tk,turnuva:t})=>{
          // sıra hesabı
          const sirali=[...t.takimlar].sort((a,b)=> (b.puan||0)-(a.puan||0) || ((b.ag-b.yg)-(a.ag-a.yg)) || (b.ag-a.ag));
          const sira=sirali.findIndex(x=>x.id===tk.id)+1;
          const lider=sira===1;
          const avr=(tk.ag||0)-(tk.yg||0);
          const form=(tk.form||[]).slice(-5);
          const formRk={G:"#34D399",B:T.gold,M:T.danger};
          // sıradaki maç
          const siradakiMac=t.maclar.find(mc=>!mc.oynandi && (mc.takimAId===tk.id||mc.takimBId===tk.id||mc.takimA===tk.ad||mc.takimB===tk.ad));
          const rakip = siradakiMac ? (siradakiMac.takimA===tk.ad?siradakiMac.takimB:siradakiMac.takimA) : null;
          return <div key={tk.id} style={{background:T.bg1,borderRadius:11,padding:"11px 12px",marginBottom:8}}>
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              <div onClick={()=>git({sayfa:"takim",takim:tk,turnuva:t})} className="tap" style={{flexShrink:0}}><Logo renk={tk.renk} ad={tk.ad} logo={tk.logo} renk2={tk.renk2} boy={40}/></div>
              <div onClick={()=>git({sayfa:"takim",takim:tk,turnuva:t})} className="tap" style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:13,color:T.text,fontWeight:700}}>{tk.ad}</span>
                  {lider && <span style={{fontSize:8,color:T.gold,background:T.gold+"22",borderRadius:5,padding:"2px 6px",fontWeight:700}}>🏆 LİDER</span>}
                </div>
                <div style={{fontSize:10,color:T.textMut,marginTop:2}}>{t.ad} · {sira}. sıra</div>
              </div>
              <button onClick={()=>takimTakip(tk.id)} className="tap" style={{fontSize:11,color:T.danger,background:T.danger+"18",borderRadius:8,padding:"6px 10px",fontWeight:600,border:"1px solid "+T.danger+"33"}}>✕</button>
            </div>

            {/* 4 istatistik */}
            <div style={{display:"flex",gap:6,marginTop:10,paddingTop:10,borderTop:"0.5px solid "+T.line}}>
              {[[tk.puan||0,"PUAN",T.text],[tk.g||0,"GALİBİYET","#34D399"],[tk.ag||0,"ATILAN",T.text],[(avr>=0?"+":"")+avr,"AVERAJ",T.text]].map(([v,et,c],i)=>
                <div key={i} style={{flex:1,textAlign:"center"}}>
                  <div style={{fontSize:15,fontWeight:800,fontFamily:T.fontDisplay,color:c}}>{v}</div>
                  <div style={{fontSize:8,color:T.textMut}}>{et}</div>
                </div>
              )}
            </div>

            {/* form */}
            {form.length>0 && <div style={{display:"flex",alignItems:"center",gap:5,marginTop:9,paddingTop:9,borderTop:"0.5px solid "+T.line}}>
              <span style={{fontSize:9,color:T.textMut}}>Form:</span>
              {form.map((f,i)=> <span key={i} style={{fontSize:9,color:f==="M"?"#fff":"#0b0b0b",background:formRk[f]||T.textMut,borderRadius:4,padding:"1px 5px",fontWeight:700}}>{f}</span>)}
              <span style={{fontSize:9,color:T.textMut,marginLeft:"auto"}}>son {form.length}</span>
            </div>}

            {/* sıradaki maç */}
            {siradakiMac && <div onClick={()=>git({sayfa:"mac",mac:siradakiMac,turnuva:t})} className="tap" style={{display:"flex",alignItems:"center",gap:7,marginTop:9,padding:"8px 9px",background:T.bg2,borderRadius:8}}>
              <span style={{fontSize:10,color:T.gold}}>⏰</span>
              <span style={{fontSize:10,color:T.textMut,flex:1}}>Sıradaki: <span style={{color:T.text,fontWeight:600}}>vs {rakip}</span> · {siradakiMac.hafta}. hafta</span>
              <span style={{fontSize:11,color:T.textMut}}>›</span>
            </div>}
          </div>;
        })}
    </div>}

    {/* ========== FUTBOLCULAR ========== */}
    {sekme==="oyuncular" && <div className="fade-in" style={{padding:"0 14px"}}>
      {oyuncular.length===0 ?
        <div style={{background:T.bg1,borderRadius:12,padding:20,textAlign:"center",border:"0.5px solid "+T.line}}>
          <div style={{fontSize:13,color:T.textMut,lineHeight:1.6}}>Henüz futbolcu takip etmiyorsun. Bir oyuncu profilinden takip et.</div>
        </div> :
        oyuncular.map(o=>{
          const rozet=oyuncuRozet(o); const form=oyuncuForm(o);
          return <div key={o.id} style={{background:T.bg1,borderRadius:11,padding:"10px 11px",marginBottom:6}}>
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              <div onClick={()=>git({sayfa:"oyuncu",oyuncu:o})} className="tap" style={{position:"relative",flexShrink:0}}>
                <Avatar o={o} boy={34} T={T}/>
                {rozet && <span style={{position:"absolute",bottom:-2,right:-2,fontSize:10,background:T.bg0,borderRadius:"50%",width:16,height:16,display:"flex",alignItems:"center",justifyContent:"center"}}>{rozet.ik}</span>}
              </div>
              <div onClick={()=>git({sayfa:"oyuncu",oyuncu:o})} className="tap" style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:12,color:T.text,fontWeight:700}}>{o.ad}</span>
                  {rozet && <span style={{fontSize:8,color:rozet.renk,background:rozet.renk+"22",borderRadius:5,padding:"2px 6px",fontWeight:700}}>{rozet.et}</span>}
                </div>
                <div style={{fontSize:10,color:T.textMut,marginTop:2}}>{o.takimAd} · {o.gol} gol · {o.asist} asist · {o.mac} maç</div>
              </div>
              <button onClick={()=>oyuncuTakip(o.id)} className="tap" style={{fontSize:11,color:T.danger,background:T.danger+"18",borderRadius:8,padding:"6px 10px",fontWeight:600,border:"1px solid "+T.danger+"33"}}>✕</button>
            </div>
            {form.length>0 && <div style={{display:"flex",alignItems:"center",gap:5,marginTop:8,paddingTop:8,borderTop:"0.5px solid "+T.line}}>
              <span style={{fontSize:9,color:T.textMut}}>Form:</span>
              {form.map((r,i)=> <span key={i} title={r.toFixed(1)} style={{width:9,height:9,borderRadius:"50%",background:formRenk(r)}}/>)}
              <span style={{fontSize:9,color:T.textSoft,marginLeft:4}}>son {form.length} maç reytingi</span>
            </div>}
          </div>;
        })}
    </div>}
  </div>;
}

function Ayarlar({T, stilKey, setStilKey, renkKey, setRenkKey, veriUret, veriSil, turnuvalar, adminMod, setAdminMod, yedekle, yukleDosya, kayitDurum, git, adminMi, rehberBaslat, oturum}){
  return <div className="fade-in main-area" style={{paddingBottom:90}}>
    {/* VAV HERO BAŞLIK */}
    <div className="vav-hero" style={{position:"relative",overflow:"hidden",padding:"22px 18px 18px",background:"linear-gradient(120deg,"+T.accent+"40 0%,"+T.bg0+" 38%,"+T.accent+"22 66%,"+T.bg0+")"}}>
      <div className="vav-supurme"/>
      <div style={{position:"relative",display:"flex",alignItems:"center",gap:12}}>
        <div className="vav-suzul" style={{width:44,height:44,borderRadius:13,background:T.accent+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,boxShadow:"0 0 18px "+T.accent+"44"}}>⚙️</div>
        <div>
          <div style={{fontSize:11,color:T.accent,letterSpacing:1,fontWeight:700}}>AYARLAR</div>
          <div style={{fontSize:22,fontWeight:800,color:T.text,fontFamily:T.fontDisplay,lineHeight:1.1}}>Tema & Veri</div>
        </div>
      </div>
    </div>

    {/* FAZ 4 — uygulama turunu tekrar göster */}
    {rehberBaslat && <div style={{padding:"10px 14px 0"}}>
      <button onClick={rehberBaslat} className="tap" style={{width:"100%",display:"flex",alignItems:"center",gap:10,background:T.bg1,border:"0.5px solid "+T.line,borderRadius:12,padding:"13px 14px",cursor:"pointer"}}>
        <span style={{width:28,height:28,borderRadius:8,background:T.accent+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>🧭</span>
        <span style={{flex:1,textAlign:"left"}}><span style={{fontSize:13,color:T.text,fontWeight:600,display:"block"}}>Uygulama turunu göster</span><span style={{fontSize:11,color:T.textMut}}>Ana özellikleri hızlıca tanıt</span></span>
        <span style={{color:T.textMut,fontSize:16}}>›</span>
      </button>
    </div>}

    {oturum && <PushAyar T={T} oturum={oturum}/>}

    {/* VERİ KALICILIĞI + SÜPER ADMIN — sadece admin görsün */}
    {adminMi && <><div style={{padding:"6px 14px"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,margin:"8px 4px"}}><span style={{width:28,height:28,borderRadius:8,background:T.accent+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>💾</span><span style={{fontSize:13,fontWeight:700,color:T.text}}>Verilerim</span></div>
      <div style={{background:T.accent+"0E",borderRadius:12,padding:"14px",border:"0.5px solid "+T.accent+"33"}}>
        <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:8}}>
          <span style={{fontSize:15}}>✅</span>
          <span style={{fontSize:12,color:T.text,fontWeight:600}}>Veriler bu cihaza otomatik kaydediliyor</span>
        </div>
        <div style={{fontSize:11,color:T.textMut,lineHeight:1.6,marginBottom:12}}>Lig, takım, maç ve skorların tarayıcıya kaydedilir — sayfayı kapatıp açsan da durur. Başka cihaza taşımak veya yedek almak için "Yedek İndir" kullan.</div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={yedekle} className="tap" style={{flex:1,background:T.accent,color:T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0,borderRadius:10,padding:"11px",fontSize:13,fontWeight:700,border:"none"}}>⬇️ Yedek İndir</button>
          <label className="tap" style={{flex:1,background:T.bg1,color:T.text,borderRadius:10,padding:"11px",fontSize:13,fontWeight:700,border:"0.5px solid "+T.line,textAlign:"center",cursor:"pointer"}}>
            ⬆️ Yedek Yükle
            <input type="file" accept=".json,application/json" onChange={e=>{ if(e.target.files[0]){ if(confirm("Mevcut veriler bu yedekle değiştirilecek. Devam?")) yukleDosya(e.target.files[0]); e.target.value=""; }}} style={{display:"none"}}/>
          </label>
        </div>
        {kayitDurum && <div style={{fontSize:11,color:T.accent,marginTop:8,textAlign:"center",fontWeight:600}}>{kayitDurum}</div>}
      </div>
    </div>

    {/* Süper Admin modu */}
    <div style={{padding:"6px 14px"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,margin:"8px 4px"}}><span style={{width:28,height:28,borderRadius:8,background:T.gold+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>👑</span><span style={{fontSize:13,fontWeight:700,color:T.text}}>Süper Admin</span></div>
      <div onClick={()=>setAdminMod(!adminMod)} className="tap" style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:adminMod?T.accent+"18":T.bg1,borderRadius:12,padding:"14px",border:adminMod?"1px solid "+T.accent:"0.5px solid "+T.line}}>
        <div style={{flex:1}}>
          <div style={{fontSize:13,color:T.text,fontWeight:600}}>Kart düzenleme yetkisi</div>
          <div style={{fontSize:11,color:T.textMut,marginTop:2,lineHeight:1.5}}>Açıkken oyuncu kartlarını manuel düzenleyebilirsin (yıldız, stat, değer). Kapalıyken herkes sistemin gerçek değerlerini görür.</div>
        </div>
        <div style={{width:44,height:26,borderRadius:13,background:adminMod?T.accent:T.bg2,position:"relative",flexShrink:0,transition:"background .2s"}}>
          <div style={{position:"absolute",top:3,left:adminMod?21:3,width:20,height:20,borderRadius:"50%",background:"#fff",transition:"left .2s"}}/>
        </div>
      </div>
    </div></>}

    <div style={{padding:"6px 14px"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,margin:"8px 4px"}}><span style={{width:28,height:28,borderRadius:8,background:"#7c4dff22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>🎨</span><span style={{fontSize:13,fontWeight:700,color:T.text}}>Görünüm</span><span style={{fontSize:10,color:T.textMut,fontWeight:500}}>· {adminMi?"tüm site için görünüm":"süper admin belirler"}</span></div>

      {/* CANLI ÖNİZLEME — seçince anında burada değişir */}
      <div style={{position:"relative",overflow:"hidden",borderRadius:16,padding:"16px",border:"1px solid "+T.accent+"40",marginBottom:4,
        background:"radial-gradient(120% 140% at 88% 4%,"+T.accent+"33,transparent 52%), linear-gradient(155deg,"+T.bg1+","+T.bg0+" 70%)"}}>
        <div style={{position:"absolute",right:-24,top:-30,width:130,height:130,borderRadius:"50%",pointerEvents:"none",background:"radial-gradient(circle at 40% 35%,"+T.accent+",transparent 62%)",opacity:.3,filter:"blur(4px)"}}/>
        <div style={{position:"relative",display:"flex",alignItems:"center",gap:7,fontSize:9.5,fontWeight:800,letterSpacing:.6,textTransform:"uppercase",color:T.accent}}>
          <span className="fz-nabiz" style={{width:6,height:6,borderRadius:"50%",background:T.accent,boxShadow:"0 0 8px "+T.accent}}/>
          Canlı Önizleme · {(STILLER[stilKey]||{}).ad}{renkKey&&RENK_TEMA[renkKey]?" + "+RENK_TEMA[renkKey].ad:""}
        </div>
        <div style={{position:"relative",fontSize:19,fontWeight:800,color:T.text,fontFamily:T.fontDisplay,marginTop:8,lineHeight:1.1}}>68 Alayhan zirvede! 🏆</div>
        <div style={{position:"relative",display:"flex",gap:14,marginTop:12,alignItems:"center"}}>
          <div><span style={{fontSize:20,fontWeight:800,color:T.accent,fontFamily:T.fontDisplay}}>34</span><span style={{fontSize:10,color:T.textMut,marginLeft:3}}>puan</span></div>
          <div><span style={{fontSize:20,fontWeight:800,color:T.gold,fontFamily:T.fontDisplay}}>+28</span><span style={{fontSize:10,color:T.textMut,marginLeft:3}}>averaj</span></div>
          <div style={{marginLeft:"auto",display:"flex",gap:6}}>
            <span style={{background:T.accent,color:T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0,fontSize:11,fontWeight:800,padding:"7px 14px",borderRadius:10}}>Ligi Aç</span>
            <span style={{background:T.bg2,color:T.textSoft,fontSize:11,fontWeight:700,padding:"7px 12px",borderRadius:10,border:"1px solid "+T.line}}>Paylaş</span>
          </div>
        </div>
      </div>

      {adminMi ? <>
      {/* STİL (5) — sayfanın havası */}
      <div style={{fontSize:11,color:T.textMut,fontWeight:700,letterSpacing:.4,margin:"10px 4px 7px"}}>STİL</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {Object.entries(STILLER).map(([k,st])=>{
          const secili=stilKey===k;
          return <div key={k} onClick={()=>{ setStilKey(k); Db.siteGorunumKaydet(k, renkKey, oturum&&oturum.id); }} className="tap" style={{position:"relative",overflow:"hidden",background:st.bg1,borderRadius:12,padding:"12px 13px",border:secili?"2px solid "+st.accent:"0.5px solid "+T.line,display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
            <div style={{width:30,height:30,borderRadius:9,flexShrink:0,background:"linear-gradient(135deg,"+st.accent+","+st.accent2+")",boxShadow:"0 3px 10px "+st.accent+"55"}}/>
            <div style={{minWidth:0}}>
              <div style={{fontSize:12.5,color:st.text,fontWeight:secili?800:600,whiteSpace:"nowrap"}}>{st.ad}</div>
              <div style={{fontSize:9.5,color:st.textMut}}>{secili?"✓ seçili":"dokun"}</div>
            </div>
          </div>;
        })}
      </div>

      {/* RENK — vurgu rengi (opsiyonel) */}
      <div style={{fontSize:11,color:T.textMut,fontWeight:700,letterSpacing:.4,margin:"14px 4px 7px"}}>RENK <span style={{fontWeight:400,textTransform:"none"}}>(vurgu)</span></div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <div onClick={()=>{ setRenkKey(""); Db.siteGorunumKaydet(stilKey, "", oturum&&oturum.id); }} className="tap" style={{display:"flex",alignItems:"center",gap:7,background:T.bg1,borderRadius:20,padding:"7px 12px",border:!renkKey?"2px solid "+T.accent:"0.5px solid "+T.line,cursor:"pointer"}}>
          <span style={{width:14,height:14,borderRadius:"50%",background:"conic-gradient(from 0deg,#20e07a,#00e5ff,#8b7bff,#ff6a00,#20e07a)"}}/>
          <span style={{fontSize:11.5,color:T.text,fontWeight:!renkKey?700:500}}>Stil Rengi</span>
        </div>
        {Object.entries(RENK_TEMA).map(([k,r])=>{
          const secili=renkKey===k;
          return <div key={k} onClick={()=>{ setRenkKey(k); Db.siteGorunumKaydet(stilKey, k, oturum&&oturum.id); }} className="tap" style={{display:"flex",alignItems:"center",gap:7,background:T.bg1,borderRadius:20,padding:"7px 12px",border:secili?"2px solid "+r.accent:"0.5px solid "+T.line,cursor:"pointer"}}>
            <span style={{width:14,height:14,borderRadius:"50%",background:r.accent}}/>
            <span style={{fontSize:11.5,color:T.text,fontWeight:secili?700:500}}>{r.ad}</span>
          </div>;
        })}
      </div>

      <div style={{fontSize:10.5,color:T.textMut,marginTop:12,lineHeight:1.5,background:"linear-gradient(120deg,"+T.accent+"12,"+T.bg1+")",borderRadius:10,padding:"10px 12px",border:"0.5px solid "+T.accent+"33"}}>👑 Süper admin: seçtiğin görünüm <b style={{color:T.accent}}>sitenin tamamına</b> uygulanır — tüm kullanıcılar (bütün cihazlarda) aynı anda bunu görür. 5 stil × 6 renk = 30 kombinasyon.</div>
      </> : <div style={{fontSize:11.5,color:T.textMut,marginTop:6,lineHeight:1.6,background:T.bg1,borderRadius:12,padding:"14px",border:"0.5px solid "+T.line}}>
        Site görünümünü <b style={{color:T.text}}>süper admin</b> belirler. Şu anki görünüm: <b style={{color:T.accent}}>{(STILLER[stilKey]||{}).ad}{renkKey&&RENK_TEMA[renkKey]?" + "+RENK_TEMA[renkKey].ad:""}</b>
      </div>}
    </div>
    <div style={{padding:"12px 14px"}}>
      {!sb && <><div style={{display:"flex",alignItems:"center",gap:8,margin:"8px 4px"}}><span style={{width:28,height:28,borderRadius:8,background:"#34D39922",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>🧪</span><span style={{fontSize:13,fontWeight:700,color:T.text}}>Stres Testi <span style={{fontSize:11,color:T.textMut,fontWeight:400}}>(örnek veri)</span></span></div>
      <div style={{background:T.bg1,borderRadius:12,padding:"14px",border:"0.5px solid "+T.line}}>
        <div style={{fontSize:12,color:T.textMut,marginBottom:12,lineHeight:1.6}}>
          Şu an: {turnuvalar.length} turnuva, {turnuvalar.reduce((s,t)=>s+t.takimlar.length,0)} takım, {Motor.tumOyuncular(turnuvalar).length} futbolcu, {turnuvalar.reduce((s,t)=>s+t.maclar.length,0)} maç.
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>veriUret(3,9,12)} className="tap" style={{flex:1,background:T.accent,color:T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0,borderRadius:10,padding:"11px",fontSize:13,fontWeight:600}}>Normal</button>
          <button onClick={()=>veriUret(8,16,18)} className="tap" style={{flex:1,background:T.accent2,color:"#fff",borderRadius:10,padding:"11px",fontSize:13,fontWeight:600}}>Bol</button>
          <button onClick={()=>{ if(confirm("Aşırı yük: 15 lig, ~300 takım, ~5000 oyuncu üretilecek. Cihazı zorlar. Devam?")) veriUret(15,20,20); }} className="tap" style={{flex:1,background:T.danger,color:"#fff",borderRadius:10,padding:"11px",fontSize:13,fontWeight:700}}>🔥 Aşırı</button>
        </div>
        <button onClick={veriSil} className="tap" style={{width:"100%",marginTop:8,background:"transparent",color:T.danger,borderRadius:10,padding:"11px",fontSize:13,fontWeight:600,border:"0.5px solid "+T.danger+"55"}}>🗑 Tüm veriyi sil</button>
      </div></>}

      <div style={{display:"flex",alignItems:"center",gap:8,margin:"18px 4px 8px"}}><span style={{width:28,height:28,borderRadius:8,background:T.textMut+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>⚖️</span><span style={{fontSize:13,fontWeight:700,color:T.text}}>Yasal</span></div>
      <div onClick={()=>git({sayfa:"yasal",tip:"gizlilik"})} className="tap satir-hover" style={{display:"flex",alignItems:"center",gap:11,background:T.bg1,border:"0.5px solid "+T.line,borderRadius:11,padding:"12px 13px",marginBottom:6}}><span style={{fontSize:16}}>🔒</span><span style={{flex:1,fontSize:13,color:T.text}}>Gizlilik / KVKK</span><span style={{fontSize:12,color:T.textMut}}>›</span></div>
      <div onClick={()=>git({sayfa:"yasal",tip:"kosul"})} className="tap satir-hover" style={{display:"flex",alignItems:"center",gap:11,background:T.bg1,border:"0.5px solid "+T.line,borderRadius:11,padding:"12px 13px",marginBottom:6}}><span style={{fontSize:16}}>📜</span><span style={{flex:1,fontSize:13,color:T.text}}>Kullanım Koşulları</span><span style={{fontSize:12,color:T.textMut}}>›</span></div>
      <div style={{fontSize:9,color:T.textMut,textAlign:"center",margin:"16px 0",lineHeight:1.6}}>ForzaLig · forzalig.com<br/>Halı saha liginin dijital merkezi</div>
    </div>
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
  // HAKEMLER (0–4 + görev) — mevcut maclar.hakem kolonuna yazılır
  const [hakemler,setHakemler]=useState(()=>hakemParse(m.hakemler!=null?m.hakemler:m.hakem));
  const [hakemHavuz,setHakemHavuz]=useState([]);
  const [hakemManuel,setHakemManuel]=useState("");
  useEffect(()=>{ let a=true; Db.hakemHavuzu().then(h=>{ if(a) setHakemHavuz(h||[]); }); return ()=>{a=false;}; },[]);
  const hakemEkle=(ad,uid)=>{ ad=(ad||"").trim(); if(!ad) return; if(hakemler.length>=4) return; if(uid&&hakemler.some(h=>h.uid===uid)) return; setHakemler(l=>[...l,{ad,gorev:hakemGorevSonraki(l),...(uid?{uid}:{})}]); };
  const hakemGorevDegis=(i,g)=>setHakemler(l=>l.map((h,x)=>x===i?{...h,gorev:g}:h));
  const hakemCikar=(i)=>setHakemler(l=>l.filter((_,x)=>x!==i));
  // Havuzdan seçilebilecekler: bu lige atanmış (ligi yoksa=tüm ligler) + henüz eklenmemiş
  const hakemHavuzFiltre=(hakemHavuz||[]).filter(h=>{ const lg=h.ligler; const uygun=!lg||!lg.length||(turnuva&&lg.indexOf(turnuva.id)>-1); return uygun && !hakemler.some(x=>x.uid&&x.uid===h.user_id); });
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
      tarih, saat, stad, hakem: hakemDurustur(hakemler), hakemler,
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
        {/* HAKEMLER — 0–4 hakem + görev */}
        <div style={{marginTop:12,paddingTop:12,borderTop:"0.5px solid "+T.line}}>
          <div style={{fontSize:11,fontWeight:700,color:T.text,marginBottom:hakemler.length?8:6}}>🧑‍⚖️ Hakemler <span style={{color:T.textMut,fontWeight:400,fontSize:9.5}}>· {hakemler.length}/4</span></div>
          {hakemler.map((h,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderTop:i>0?"0.5px solid "+T.line:"none"}}>
              <div style={{width:24,height:24,borderRadius:"50%",background:T.accent+"22",color:T.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10.5,fontWeight:800,flexShrink:0}}>{i+1}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:700,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{h.ad}</div>
                <select value={h.gorev||"Orta Hakem"} onChange={e=>hakemGorevDegis(i,e.target.value)} style={{marginTop:2,fontSize:10,color:T.accent2||T.accent,background:T.bg2,border:"0.5px solid "+T.line,borderRadius:6,padding:"2px 4px",fontFamily:"inherit",outline:"none",maxWidth:"100%"}}>
                  {HAKEM_GOREVLER.map(g=><option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <button onClick={()=>hakemCikar(i)} className="tap" title="Kaldır" style={{fontSize:12,background:T.danger+"14",border:"0.5px solid "+T.danger+"40",borderRadius:7,padding:"5px 8px",color:T.danger,flexShrink:0}}>✕</button>
            </div>)}
          {hakemler.length<4 && <div style={{marginTop:hakemler.length?10:2}}>
            {/* AÇILIR LİSTE — havuzdan seç (isim yazmadan) */}
            <select value="" onChange={e=>{ const v=e.target.value; if(!v) return; const h=hakemHavuzFiltre.find(x=>x.user_id===v); if(h) hakemEkle(h.ad||h.email||"Hakem", h.user_id); e.target.value=""; }} style={{width:"100%",boxSizing:"border-box",background:T.bg2,border:"0.5px solid "+(hakemHavuzFiltre.length?T.accent+"55":T.line),borderRadius:8,padding:"10px 8px",color:hakemHavuzFiltre.length?T.text:T.textMut,fontSize:11.5,fontWeight:600,outline:"none",fontFamily:"inherit"}}>
              <option value="">{hakemHavuzFiltre.length?"🧑‍⚖️ Havuzdan hakem seç…":"Havuzda uygun kayıtlı hakem yok"}</option>
              {hakemHavuzFiltre.map(h=><option key={h.user_id} value={h.user_id}>{(h.ad||h.email||"Hakem")+(h.sehir?" · "+h.sehir:"")}</option>)}
            </select>
            {/* ELLE isim ekle (kayıtsız hakem) */}
            <div style={{display:"flex",gap:6,marginTop:6}}>
              <input value={hakemManuel} onChange={e=>setHakemManuel(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter"&&hakemManuel.trim()){ hakemEkle(hakemManuel); setHakemManuel(""); } }} placeholder="…veya elle isim yaz" style={{flex:1,boxSizing:"border-box",background:T.bg2,border:"0.5px solid "+T.line,borderRadius:8,padding:"9px 10px",color:T.text,fontSize:11.5,outline:"none",fontFamily:"inherit"}}/>
              <button onClick={()=>{ if(hakemManuel.trim()){ hakemEkle(hakemManuel); setHakemManuel(""); } }} className="tap" style={{fontSize:11.5,fontWeight:800,color:T.bg0,background:T.accent,border:0,borderRadius:8,padding:"0 14px"}}>+ Ekle</button>
            </div>
            <div style={{fontSize:9,color:T.textMut,marginTop:5,lineHeight:1.5}}>Listedeki hakemler <b>Admin → 🧑‍⚖️ Hakemler</b>'den eklenir. Oradan hakeme <b>lig atarsan</b> yalnızca o ligin maçlarında listede çıkar.</div>
          </div>}
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

function DavetKatil({T, token, oturum, girisYap}){
  const [davet,setDavet]=useState(undefined);
  const [ad,setAd]=useState(""); const [no,setNo]=useState("");
  const [renk,setRenk]=useState("#2980B9"); const [renk2,setRenk2]=useState("#FFFFFF"); const [logo,setLogo]=useState("");
  const [poz,setPoz]=useState("OrtaSaha"); const [foto,setFoto]=useState("");
  const [dogum,setDogum]=useState(""); const [boy,setBoy]=useState(""); const [kilo,setKilo]=useState(""); const [uyruk,setUyruk]=useState("Türkiye"); const [ayak,setAyak]=useState("Sağ");
  const [detay,setDetay]=useState(false);
  const [mesaj,setMesaj]=useState(""); const [yuk,setYuk]=useState(false); const [fotoYuk,setFotoYuk]=useState(false);
  const [oyuncuLink,setOyuncuLink]=useState(""); const [kopyalandi,setKopyalandi]=useState(false);
  useEffect(()=>{ let a=true; (async()=>{ const d=await Db.davetGetir(token); if(a) setDavet(d); })(); return ()=>{a=false;}; },[token]);
  const cik=()=>{ try{ window.location.href=window.location.origin+window.location.pathname; }catch(e){} };
  const googleGiris=async()=>{ if(!sb){ if(girisYap)girisYap(); return; } try{ const {error}=await sb.auth.signInWithOAuth({provider:"google", options:{redirectTo: window.location.href}}); if(error && girisYap) girisYap(); }catch(e){ if(girisYap)girisYap(); } };
  const dosyaSec=async(e, klasor, setUrl)=>{ const f=e.target.files&&e.target.files[0]; if(!f)return; setFotoYuk(true); setMesaj("Fotoğraf yükleniyor…"); const r=await fotoYukle(f, klasor); setFotoYuk(false); e.target.value=""; if(r&&r.url){ setUrl(r.url); setMesaj(""); } else setMesaj("❌ Fotoğraf yüklenemedi: "+((r&&r.hata)||"")); };
  const katil=async()=>{
    if(!ad.trim()){ setMesaj("❌ "+(davet.tip==="takim"?"Takım adı gir.":"Ad soyad gir.")); return; }
    if(davet.tip==="oyuncu"||davet.tip==="kulup"){ // Q11: profil alanları zorunlu (forma no hariç)
      if(!foto){ setMesaj("❌ Fotoğraf ekle (zorunlu)."); return; }
      if(!dogum){ setMesaj("❌ Doğum tarihi gir (zorunlu)."); return; }
      if(!(parseInt(boy)>0)){ setMesaj("❌ Boy gir (zorunlu)."); return; }
      if(!(parseInt(kilo)>0)){ setMesaj("❌ Kilo gir (zorunlu)."); return; }
      if(!ayak){ setMesaj("❌ Tercih edilen ayağı seç (zorunlu)."); return; }
    }
    setYuk(true); setMesaj("Kaydediliyor…");
    if(davet.tip==="takim"){
      const r=await Db.takimDavetiKullan(token, ad.trim(), renk, renk2, logo||null);
      setYuk(false);
      if(r.ok){ setMesaj(""); setOyuncuLink(r.oyuncuToken?DAVET_URL(r.oyuncuToken):""); }
      else setMesaj("❌ "+(r.hata||"olmadı"));
    } else if(davet.tip==="kulup"){
      const r=await Db.kulupDavetiKullan(token, {ad:ad.trim(), no:parseInt(no)||null, poz, foto:foto||null, dogum:dogum||null, boy:parseInt(boy)||null, kilo:parseInt(kilo)||null, uyruk:uyruk||null, ayak});
      setYuk(false);
      if(r.ok){ setMesaj("✅ Takıma kaydoldun! Kadroda görüneceksin."); setTimeout(cik,3000); } else setMesaj("❌ "+(r.hata||"olmadı"));
    } else {
      const r=await Db.oyuncuDavetiKullan(token, {ad:ad.trim(), no:parseInt(no)||null, poz, foto:foto||null, dogum:dogum||null, boy:parseInt(boy)||null, kilo:parseInt(kilo)||null, uyruk:uyruk||null, ayak});
      setYuk(false);
      if(r.ok){ setMesaj("✅ İsteğin gönderildi! Takım yöneticisi onayladığında kariyerin başlar."); setTimeout(cik,3000); } else setMesaj("❌ "+(r.hata||"olmadı"));
    }
  };
  const kopyala=()=>{ try{ navigator.clipboard.writeText(oyuncuLink); setKopyalandi(true); setTimeout(()=>setKopyalandi(false),1600); }catch(e){} };
  const kutu=(ic)=><div style={{position:"fixed",inset:0,zIndex:2000,background:T.bg0,display:"flex",alignItems:"center",justifyContent:"center",padding:20,overflowY:"auto"}}>
    <div className="fade-in" style={{width:"100%",maxWidth:400,background:T.bg1,border:"1px solid "+T.line,borderRadius:18,padding:24,margin:"auto"}}>{ic}</div></div>;
  const inp={width:"100%",background:T.bg0,border:"0.5px solid "+T.line,borderRadius:11,padding:12,color:T.text,fontSize:14,fontFamily:"inherit",outline:"none",marginBottom:10,boxSizing:"border-box"};
  if(davet===undefined) return kutu(<div style={{textAlign:"center",color:T.textMut,fontSize:13}}>Davet açılıyor…</div>);
  if(!davet || !davet.aktif) return kutu(<div style={{textAlign:"center"}}>
    <div style={{fontSize:36,marginBottom:10}}>🔗</div>
    <div style={{fontSize:16,fontWeight:800,color:T.text,fontFamily:T.fontDisplay,marginBottom:6}}>Davet geçersiz</div>
    <div style={{fontSize:12,color:T.textMut,marginBottom:16}}>Bu davet linki bulunamadı veya kapatılmış.</div>
    <button onClick={cik} className="tap" style={{background:T.accent,color:T.bg0,border:0,borderRadius:11,padding:"11px 20px",fontWeight:800,fontSize:13}}>Ana sayfaya git</button>
  </div>);
  const ligAd = davet.ligler ? davet.ligler.ad : "";
  const takimAd = davet.takimlar ? davet.takimlar.ad : (davet.kulupler ? davet.kulupler.ad : "");
  const takimMi = davet.tip==="takim";
  // Takım kuruldu → oyuncu davet linkini paylaş ekranı
  if(takimMi && oyuncuLink) return kutu(<div style={{textAlign:"center"}}>
    <div style={{fontSize:38,marginBottom:8}}>✅</div>
    <div style={{fontSize:18,fontWeight:800,color:T.text,fontFamily:T.fontDisplay}}>Takımın kuruldu!</div>
    <div style={{fontSize:12.5,color:T.textSoft,margin:"8px 0 16px",lineHeight:1.6}}><b style={{color:T.accent}}>{ad}</b> hazır. Şimdi bu linki <b>oyuncularına</b> gönder — herkes kendi bilgisini + fotoğrafını girsin.</div>
    {qrData(oyuncuLink) && <img src={qrData(oyuncuLink)} alt="QR" style={{width:150,height:150,borderRadius:12,margin:"0 auto 12px",display:"block",background:"#fff",padding:6}}/>}
    <div style={{fontSize:11,color:T.textMut,background:T.bg0,borderRadius:9,padding:"9px 10px",wordBreak:"break-all",marginBottom:10}}>{oyuncuLink}</div>
    <button onClick={kopyala} className="tap" style={{width:"100%",background:T.accent,color:T.bg0,border:0,borderRadius:12,padding:13,fontWeight:800,fontSize:14,marginBottom:8}}>{kopyalandi?"✓ Kopyalandı":"🔗 Oyuncu Linkini Kopyala"}</button>
    <div onClick={cik} className="tap" style={{fontSize:11,color:T.textMut,marginTop:6,cursor:"pointer"}}>Bitir · ana sayfa</div>
  </div>);
  const POZLAR=[["Kaleci","🧤"],["Defans","🛡️"],["OrtaSaha","🎩"],["Forvet","⚽"]];
  return kutu(<div>
    <div style={{textAlign:"center",marginBottom:18}}>
      <div style={{fontSize:34,marginBottom:8}}>{takimMi?"🛡️":"⚽"}</div>
      <div style={{fontSize:18,fontWeight:800,color:T.text,fontFamily:T.fontDisplay}}>{takimMi?"Takımını kur":"Takıma katıl"}</div>
      <div style={{fontSize:12,color:T.textMut,marginTop:5}}>{takimMi ? <><b style={{color:T.accent}}>{ligAd}</b> ligine takımını kur, yöneticisi ol</> : <><b style={{color:T.accent}}>{takimAd}</b> takımına oyuncu olarak katıl</>}</div>
    </div>
    {!oturum
      ? <div style={{textAlign:"center"}}>
          <div style={{fontSize:12.5,color:T.textSoft,marginBottom:14,lineHeight:1.6}}>Katılmak için <b>Google ile giriş</b> yap.<br/>Giriş sonrası otomatik bu davete döneceksin.</div>
          <button onClick={googleGiris} className="tap" style={{width:"100%",background:"#fff",color:"#1a1a1a",border:0,borderRadius:12,padding:13,fontWeight:800,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>🟦 Google ile Devam Et</button>
          <div onClick={girisYap} className="tap" style={{fontSize:11,color:T.textMut,marginTop:12,cursor:"pointer"}}>e-posta ile giriş →</div>
        </div>
      : takimMi
        ? <div>
            <input value={ad} onChange={e=>setAd(e.target.value)} placeholder="Takım adı" style={{...inp,fontWeight:600}}/>
            <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:12}}>
              <div style={{position:"relative",flexShrink:0}}>
                <Logo renk={renk} ad={ad||"F"} logo={logo} renk2={renk2} boy={54}/>
                <label className="tap" title="Logo yükle" style={{position:"absolute",bottom:-4,right:-4,background:T.bg2,borderRadius:"50%",width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,border:"1px solid "+T.line,cursor:"pointer"}}>{fotoYuk?"⏳":"📷"}
                  <input type="file" accept="image/*" onChange={e=>dosyaSec(e,"logo",setLogo)} style={{display:"none"}}/></label>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:10.5,color:T.textMut,marginBottom:6,fontWeight:600}}>Takım renkleri (2 zorunlu)</div>
                <div style={{display:"flex",gap:14}}>
                  <label className="tap" style={{textAlign:"center",cursor:"pointer"}}><div style={{width:32,height:32,borderRadius:9,background:renk,border:"2px solid "+T.bg0,boxShadow:"0 0 0 1px "+T.line}}/><input type="color" value={renk} onChange={e=>setRenk(e.target.value)} style={{opacity:0,width:0,height:0,position:"absolute"}}/><div style={{fontSize:9,color:T.textMut,marginTop:3}}>Ana</div></label>
                  <label className="tap" style={{textAlign:"center",cursor:"pointer"}}><div style={{width:32,height:32,borderRadius:9,background:renk2,border:"2px solid "+T.bg0,boxShadow:"0 0 0 1px "+T.line}}/><input type="color" value={renk2} onChange={e=>setRenk2(e.target.value)} style={{opacity:0,width:0,height:0,position:"absolute"}}/><div style={{fontSize:9,color:T.textMut,marginTop:3}}>2. renk</div></label>
                </div>
              </div>
            </div>
            <button onClick={katil} disabled={yuk||fotoYuk} className="tap" style={{width:"100%",background:T.accent,color:"#04070C",border:0,borderRadius:12,padding:13,fontWeight:800,fontSize:14,opacity:(yuk||fotoYuk)?.7:1}}>{yuk?"Kaydediliyor…":"🛡️ Takımı Kur"}</button>
            {mesaj && <div style={{fontSize:12,color:/❌/.test(mesaj)?T.danger:T.textSoft,textAlign:"center",marginTop:10}}>{mesaj}</div>}
          </div>
        : <div>
            <div style={{display:"flex",justifyContent:"center",marginBottom:12}}>
              <div style={{position:"relative"}}>
                <div style={{width:82,height:82,borderRadius:"50%",overflow:"hidden",border:"2px solid "+T.accent2+"88",background:T.bg2}} dangerouslySetInnerHTML={{__html:svgAvatar(ad||"?",82,foto)}}/>
                <label className="tap" title="Fotoğraf ekle" style={{position:"absolute",bottom:0,right:0,background:T.accent2,color:"#04070C",borderRadius:"50%",width:26,height:26,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,cursor:"pointer",border:"2px solid "+T.bg1}}>{fotoYuk?"⏳":"📷"}
                  <input type="file" accept="image/*" onChange={e=>dosyaSec(e,"oyuncu",setFoto)} style={{display:"none"}}/></label>
              </div>
            </div>
            <input value={ad} onChange={e=>setAd(e.target.value)} placeholder="Ad soyad" style={{...inp,fontWeight:600}}/>
            <div style={{fontSize:10.5,color:T.textMut,marginBottom:6,fontWeight:600}}>Mevki</div>
            <div style={{display:"flex",gap:6,marginBottom:10}}>
              {POZLAR.map(([k,ik])=><span key={k} onClick={()=>setPoz(k)} className="tap" style={{flex:1,textAlign:"center",fontSize:10.5,padding:"8px 2px",borderRadius:10,background:poz===k?T.accent2:T.bg0,color:poz===k?"#04070C":T.textMut,fontWeight:poz===k?800:500,border:"0.5px solid "+(poz===k?T.accent2:T.line)}}>{ik}<br/>{k==="OrtaSaha"?"Orta":k}</span>)}
            </div>
            <input value={no} onChange={e=>setNo(e.target.value)} placeholder="Forma no (opsiyonel)" type="number" style={inp}/>
            <div style={{marginBottom:6}}>
              <label style={{fontSize:10,color:T.textMut}}>Doğum tarihi <span style={{color:T.accent2}}>*</span><input type="date" value={dogum} onChange={e=>setDogum(e.target.value)} style={{...inp,marginTop:3}}/></label>
              <div style={{display:"flex",gap:8}}>
                <input value={boy} onChange={e=>setBoy(e.target.value)} placeholder="Boy cm *" type="number" style={{...inp,flex:1}}/>
                <input value={kilo} onChange={e=>setKilo(e.target.value)} placeholder="Kilo kg *" type="number" style={{...inp,flex:1}}/>
              </div>
              <div style={{fontSize:10.5,color:T.textMut,marginBottom:6,fontWeight:600}}>Tercih edilen ayak <span style={{color:T.accent2}}>*</span></div>
              <div style={{display:"flex",gap:6,marginBottom:8}}>
                {["Sağ","Sol","Çift"].map(k=><span key={k} onClick={()=>setAyak(k)} className="tap" style={{flex:1,textAlign:"center",fontSize:11,padding:"8px 2px",borderRadius:9,background:ayak===k?T.accent2+"33":T.bg0,color:ayak===k?T.accent2:T.textMut,fontWeight:ayak===k?700:500,border:"0.5px solid "+(ayak===k?T.accent2:T.line)}}>{k} ayak</span>)}
              </div>
              <input value={uyruk} onChange={e=>setUyruk(e.target.value)} placeholder="Uyruk (opsiyonel)" style={inp}/>
              <div style={{fontSize:9.5,color:T.textMut,marginBottom:4,textAlign:"center"}}>Fotoğraf, doğum, boy, kilo ve ayak zorunludur (* işaretli). Forma no opsiyonel.</div>
            </div>
            <button onClick={katil} disabled={yuk||fotoYuk} className="tap" style={{width:"100%",background:T.accent2,color:"#04070C",border:0,borderRadius:12,padding:13,fontWeight:800,fontSize:14,opacity:(yuk||fotoYuk)?.7:1}}>{yuk?"Kaydediliyor…":"⚽ Takıma Katıl"}</button>
            {mesaj && <div style={{fontSize:12,color:/✅/.test(mesaj)?T.accent:/❌/.test(mesaj)?T.danger:T.textSoft,textAlign:"center",marginTop:10}}>{mesaj}</div>}
          </div>}
    <div onClick={cik} className="tap" style={{textAlign:"center",fontSize:11,color:T.textMut,marginTop:16,cursor:"pointer"}}>Vazgeç · ana sayfa</div>
  </div>);
}

function SohbetSayfa({T, git, geri, oturum, turnuva, takim, adminMi, turnuvalar, kulup, saltOkunur}){
  const kulupMod=!!(kulup && !turnuva); // takım (kulüp) sohbeti — lige bağlı değil
  const ligYon=!!(oturum&&turnuva&&(((turnuva.yonetici_id!=null)&&turnuva.yonetici_id===oturum.id)||adminMi));
  const benimTakimlar=(turnuva&&oturum)?(turnuva.takimlar||[]).filter(tk=> ligYon || tk.yonetici_id===oturum.id || (tk.oyuncular||[]).some(o=>o.sahip_user_id&&o.sahip_user_id===oturum.id) ):[];
  // Gönderirken kimlik: kendi oyuncumun bulunduğu takım (lig sohbetinde "kim hangi takımdan" görünsün)
  const benimTakim=(turnuva&&oturum)?(turnuva.takimlar||[]).find(tk=>(tk.oyuncular||[]).some(o=>o.sahip_user_id&&o.sahip_user_id===oturum.id)):null;
  const benimOyuncu=benimTakim?(benimTakim.oyuncular||[]).find(o=>o.sahip_user_id===oturum.id):null;

  const [kanal,setKanal]=useState(takim?("t:"+takim.id):"genel");
  const [mesajlar,setMesajlar]=useState([]);
  const [tepkiMap,setTepkiMap]=useState({});      // {mesajId:[{user_id,emoji}]}
  const [metin,setMetin]=useState("");
  const [yuk,setYuk]=useState(true);
  const [gonderiliyor,setGonderiliyor]=useState(false);
  const [secili,setSecili]=useState(null);        // aksiyon menüsü açık mesaj id
  const [yanit,setYanit]=useState(null);          // yanıtlanan mesaj
  const [yonetimMod,setYonetimMod]=useState(false); // admin/lig yön.: yönetim mesajı gönder
  const [yeniVar,setYeniVar]=useState(false);     // "↓ yeni mesaj"
  const [dahaVar,setDahaVar]=useState(true);      // sayfalama
  const [eskiYuk,setEskiYuk]=useState(false);
  const [unread,setUnread]=useState({});          // {kanal:adet}
  const kaydirRef=useRef(null), aboneRef=useRef(null), taslaklar=useRef({}), dipteRef=useRef(true);
  const [kayit,setKayit]=useState(false);        // ses kaydı aktif (yalnız süper admin)
  const [medyaYuk,setMedyaYuk]=useState(false);  // medya yükleniyor
  const kayitRef=useRef(null), kayitIptalRef=useRef(false);
  const aktifTakimId = kanal.startsWith("t:") ? kanal.slice(2) : null;
  // ✨ CANLI "yazıyor…" göstergesi — broadcast (yeni tablo YOK, mevcut Realtime altyapısı)
  const yaziKapsam = kulupMod ? ("k:"+(kulup&&kulup.id)) : ((turnuva&&turnuva.id)+":"+(aktifTakimId||"genel"));
  const [yazanlar,setYazanlar]=useState([]);          // [{uid,ad,t}]
  const yaziKanalRef=useRef(null); const yaziSonRef=useRef(0);
  const acilisRef=useRef(Date.now());                 // yeni gelen mesajlara giriş animasyonu (eski geçmişe değil)
  const [patlama,setPatlama]=useState(null);          // {id,emoji,key} — tepki verince büyük emoji patlar
  const [pinKapali,setPinKapali]=useState(()=>{ try{ return localStorage.getItem("fl_pin_kapali")||""; }catch(e){ return ""; } });  // sabit duyuru kapatıldı (cihaz)
  // Bu kanalda gösterilecek aktif anketler (hedefteyse) — sohbet kartı olarak üstte
  const [kanalAnketler,setKanalAnketler]=useState([]);
  useEffect(()=>{ let a=true; if(!oturum){ setKanalAnketler([]); return; }
    const lid=kulupMod?null:(turnuva&&turnuva.id); const tid=kulupMod?null:aktifTakimId; const kid=kulupMod?(kulup&&kulup.id):null;
    Db.sohbetAnketleri(lid,tid,kid).then(x=>{ if(a) setKanalAnketler(x||[]); });
    return ()=>{a=false;}; },[kanal, turnuva&&turnuva.id, kulupMod, oturum&&oturum.id]);
  // Moderasyon + etiket durumu (kanal başına)
  const scopeLig=kulupMod?null:(turnuva&&turnuva.id), scopeTakim=kulupMod?null:aktifTakimId, scopeKulup=kulupMod?(kulup&&kulup.id):null;
  const [uyeler,setUyeler]=useState([]);          // @-etiket için kanal üyeleri
  const [kanalKadro,setKanalKadro]=useState({takimlar:[],oyuncular:[]}); // @-etiket için TAM kadro (DB'den)
  const [modYetki,setModYetki]=useState(false);   // bu kanalda moderasyon yetkim var mı
  const [cezam,setCezam]=useState(null);          // benim aktif cezam (mute/ban)
  const [kanalAyar,setKanalAyar]=useState(null);  // yavaş mod / sadece yönetici
  const [etiketPanel,setEtiketPanel]=useState(null); // @ otomatik tamamlama {q,items}
  const secilenEtiket=useRef({});                 // ad(lower) -> uid (bu mesaj için)
  const [modHedef,setModHedef]=useState(null);    // moderasyon modalı açık mesaj
  const [modAyarAcik,setModAyarAcik]=useState(false); // kanal ayarı (yavaş/sadece-yönetici) modalı
  const [hizliAnket,setHizliAnket]=useState(false); // composer'dan hızlı anket
  const [haBaslik,setHaBaslik]=useState(""); const [haSec,setHaSec]=useState(["",""]); const [haSaat,setHaSaat]=useState(0); const [haYuk,setHaYuk]=useState(false);
  const hizliAnketOlustur=async()=>{ const secs=haSec.map(s=>s.trim()).filter(Boolean);
    if(!haBaslik.trim()||secs.length<2){ alert("Başlık + en az 2 seçenek gir."); return; }
    const hedefler = kulupMod?[{kapsam:'kulup',kapsam_id:kulup.id}] : aktifTakimId?[{kapsam:'takim',kapsam_id:aktifTakimId}] : [{kapsam:'lig_takimlari',kapsam_id:turnuva.id}];
    setHaYuk(true);
    const r=await Db.anketOlustur({baslik:haBaslik.trim(), secenekler:secs, durum:'yayin', biter: haSaat? new Date(Date.now()+haSaat*3600e3).toISOString():null, hedefler});
    setHaYuk(false);
    if(r&&r.ok){ setHizliAnket(false); setHaBaslik(""); setHaSec(["",""]); setHaSaat(0); Db.logla(oturum,"Hızlı anket (sohbet)",haBaslik.trim());
      const lid=kulupMod?null:(turnuva&&turnuva.id); const tid=kulupMod?null:aktifTakimId; const kid=kulupMod?(kulup&&kulup.id):null;
      Db.sohbetAnketleri(lid,tid,kid).then(x=>setKanalAnketler(x||[])); dibeKaydir(); }
    else alert("Olmadı: "+((r&&r.hata)||"")); };
  const [modSebep,setModSebep]=useState("Küfür / hakaret");
  const [modIhlal,setModIhlal]=useState(0);       // son 30 gün ihlal sayısı (öneri)
  const modIslem=async(tur, saat)=>{ if(!modHedef) return;
    const biter = tur==='mute'&&saat ? new Date(Date.now()+saat*3600e3).toISOString() : null;
    const r=await Db.cezaVer({user:modHedef.user_id, tur, lig:scopeLig, takim:scopeTakim, kulup:scopeKulup, biter, sebep:modSebep, aciklama:modSebep, mesajId:modHedef.id});
    if(r&&r.ok){ setModHedef(null); if(modHedef.user_id===(oturum&&oturum.id)) Db.cezaAktif(scopeLig,scopeTakim,scopeKulup).then(setCezam); }
    else alert("Olmadı: "+((r&&r.hata)||"")); };
  const modMesaj=async(islem)=>{ if(!modHedef) return; const id=modHedef.id;
    const r=await Db.mesajModerasyon(id, islem, modSebep);
    if(r&&r.ok){ if(islem==='sil') setMesajlar(p=>p.filter(x=>x.id!==id)); else setMesajlar(p=>p.map(x=>x.id===id?{...x,gizli:islem==='gizle'}:x)); setModHedef(null); }
    else alert("Olmadı: "+((r&&r.hata)||"")); };
  const ayarKaydet=async(yavas, sadece)=>{ const r=await Db.sohbetAyarGuncelle({lig:scopeLig,takim:scopeTakim,kulup:scopeKulup,yavas,sadece});
    if(r&&r.ok){ setKanalAyar({yavas_sn:yavas, sadece_yonetici:sadece}); setModAyarAcik(false); } else alert("Olmadı: "+((r&&r.hata)||"")); };
  useEffect(()=>{ let a=true; if(!oturum){ setUyeler([]);setModYetki(false);setCezam(null);setKanalAyar(null); return; }
    Db.sohbetUyeleri(scopeLig,scopeTakim,scopeKulup).then(x=>{ if(a) setUyeler(x||[]); });
    if(scopeLig) Db.kanalKadrosu(scopeLig).then(x=>{ if(a) setKanalKadro(x||{takimlar:[],oyuncular:[]}); }); else setKanalKadro({takimlar:[],oyuncular:[]});
    Db.moderatorYetki(scopeLig,scopeTakim,scopeKulup).then(x=>{ if(a) setModYetki(!!x); });
    Db.cezaAktif(scopeLig,scopeTakim,scopeKulup).then(x=>{ if(a) setCezam(x||null); });
    Db.sohbetAyarGetir(scopeLig,scopeTakim,scopeKulup).then(x=>{ if(a) setKanalAyar(x||null); });
    return ()=>{a=false;}; },[kanal, turnuva&&turnuva.id, kulupMod, oturum&&oturum.id]);
  // Etiketlenebilir üyeler: İSTEMCİ verisinden (turnuva/takım oyuncuları — demo+gerçek hepsi) + RPC (kaptan/yönetici/hakem)
  const etiketUyeler = useMemo(()=>{
    const map={}; const isim=(o)=>o.gorunen_ad||o.takma_ad||o.ad_soyad||o.ad||o.isim||"";
    const ekle=(u)=>{ if(!u||!u.ad) return; const k=(u.ad).toLowerCase()+"|"+(u.player_id||u.user_id||u.takim_id||u.ad); if(!map[k]) map[k]=u; };
    if(!kulupMod && turnuva){
      // 1) EN GÜVENİLİR KAYNAK: DB'den çekilen tam kadro (kanalKadro) → tüm takım + tüm oyuncular her yerde (web/mobil/PWA) aynı
      const kTakim=(kanalKadro&&kanalKadro.takimlar)||[]; const kOyun=(kanalKadro&&kanalKadro.oyuncular)||[];
      if(!aktifTakimId) kTakim.forEach(t=>{ if(t.ad) ekle({ad:t.ad, takim_id:t.id, takim_ad:t.ad, rol:'takim'}); });  // lig kanalı: takım adları da etiketlenebilir
      kOyun.forEach(o=>{ if(aktifTakimId && o.takim_id!==aktifTakimId) return; if(o.ad) ekle({user_id:o.sahip_user_id||null, player_id:o.player_id||null, ad:o.ad, foto:o.foto||null, takim_ad:o.takim_ad||null, takim_id:o.takim_id||null, rol:'oyuncu'}); });
      // 2) İSTEMCİ ÖNBELLEĞİ (yedek): turnuvalar tam yüklüyse ek oyuncu/demo yakala
      const ligTam=(turnuvalar||[]).find(t=>t&&t.id===turnuva.id) || turnuva;
      const tks=(ligTam.takimlar||[]); const hedef=aktifTakimId?tks.filter(t=>t.id===aktifTakimId):tks;
      if(!aktifTakimId) hedef.forEach(t=>{ if(t.ad) ekle({ad:t.ad, takim_id:t.id, takim_ad:t.ad, rol:'takim'}); });
      hedef.forEach(t=>{ (t.oyuncular||[]).forEach(o=>{ const ad=isim(o); if(ad) ekle({user_id:o.sahip_user_id||null, player_id:o.player_id||o.id||null, ad, foto:o.foto||null, takim_ad:t.ad, takim_id:t.id, rol:'oyuncu'}); }); }); }
    (uyeler||[]).forEach(u=>ekle(u));   // kaptan / lig_yon / hakem (ve hesaba bağlı oyuncular)
    return Object.values(map);
  },[turnuva, turnuvalar, aktifTakimId, kulupMod, uyeler, kanalKadro]);
  // @-etiket: input'ta son "@kelime"yi yakala → süzülmüş panel
  const etiketKontrol=(deger, pos)=>{ try{ const onceki=deger.slice(0,pos); const m=onceki.match(/@([\wçğıöşüÇĞİÖŞÜ]*)$/);
    if(!m){ setEtiketPanel(null); return; } const q=(m[1]||"").toLowerCase();
    const hepsi=(etiketUyeler||[]).filter(u=>(u.ad||"").toLowerCase().indexOf(q)>-1);
    let items;
    if(!q){ const tk=hepsi.filter(u=>u.rol==='takim').slice(0,10); const oy=hepsi.filter(u=>u.rol!=='takim').slice(0,60); items=tk.concat(oy); }
    else items=hepsi.slice(0,40);
    setEtiketPanel({q, items}); }catch(e){ setEtiketPanel(null); } };
  const etiketSec=(u)=>{ // seçilen üyeyi input'a yaz
    const el=document.getElementById("fzMsgInput"); const pos=el?el.selectionStart:metin.length;
    const onceki=metin.slice(0,pos).replace(/@([\wçğıöşüÇĞİÖŞÜ]*)$/,""); const sonra=metin.slice(pos);
    const ad=u.ad||"Takımım"; secilenEtiket.current[(ad).toLowerCase()]= u.rol==='takim' ? ('__takim:'+u.takim_id) : (u.user_id||null);  // takım → o takımın oyuncuları; null = bağlı değil (bildirim yok)
    const yeni=onceki+"@"+ad+" "+sonra; setMetin(yeni); setEtiketPanel(null);
    setTimeout(()=>{ if(el){ el.focus(); const p=(onceki+"@"+ad+" ").length; el.setSelectionRange(p,p); } },10); };
  // Metindeki @adlardan etiketlenen uid'leri çıkar (bildirim için)
  const etiketleriTopla=(t)=>{ const uids=[]; const low=(t||"").toLowerCase();
    Object.keys(secilenEtiket.current).forEach(ad=>{ if(low.indexOf("@"+ad)>-1){ const uid=secilenEtiket.current[ad];
      if(uid==="__takimim__"){ const bt=aktifTakimId||((benimTakim&&benimTakim.id)); (etiketUyeler||[]).filter(u=>u.rol==="oyuncu"&&(!bt||u.takim_id===bt)).forEach(u=>{ if(u.user_id&&uids.indexOf(u.user_id)<0) uids.push(u.user_id); }); }
      else if(typeof uid==="string"&&uid.indexOf("__takim:")===0){ const tid=uid.slice(8); (etiketUyeler||[]).filter(u=>u.rol==="oyuncu"&&u.takim_id===tid).forEach(u=>{ if(u.user_id&&uids.indexOf(u.user_id)<0) uids.push(u.user_id); }); }
      else if(uid&&uids.indexOf(uid)<0) uids.push(uid); } });
    return uids; };
  // Etiketli isme tıkla → oyuncu profili (player_id veya user_id ile)
  const uyeAc=(u)=>{ try{ if(!u) return; const kaynak=[turnuva].concat(turnuvalar||[]).filter(Boolean);
    for(const tt of kaynak){ for(const tk of (tt.takimlar||[])){ const o=(tk.oyuncular||[]).find(x=>(u.player_id&&x.player_id===u.player_id)||(u.user_id&&u.user_id!=="__takimim__"&&x.sahip_user_id===u.user_id)); if(o){ git({sayfa:"oyuncu",oyuncu:{...o,takimAd:tk.ad,turnuva:tt.ad,_adaylar:tk.oyuncular}}); return; } } } }catch(e){} };
  // Mesaj metni: küfür-gizli placeholder + @etiket vurgusu (tıklanabilir)
  const mesajMetni=(m)=>{
    const benimMsj = m.user_id===(oturum&&oturum.id);
    if(m.gizli && !modYetki && !benimMsj) return <i style={{color:"inherit",opacity:.7}}>🚫 Bu mesaj uygunsuz içerik nedeniyle gizlendi.</i>;
    const t=m.metin||""; if(t.indexOf("@")<0) return t;
    const parcalar=t.split(/(@[\wçğıöşüÇĞİÖŞÜ]+)/g);
    return parcalar.map((p,i)=>{ if(p&&p[0]==="@"){ const ad=p.slice(1).toLowerCase(); const u=(etiketUyeler||[]).find(x=>(x.ad||"").toLowerCase()===ad);
      return <span key={i} onClick={(e)=>{ e.stopPropagation(); if(u) uyeAc(u); }} style={{color:benimMsj?T.bg0:T.accent2,fontWeight:800,cursor:u?"pointer":"default",textDecoration:u?"underline":"none",textUnderlineOffset:2}}>{p}</span>; }
      return p; }); };
  // Üyelik: lig genelinde yalnız o ligin üyesi (kaptan/lig yön./kadroda oyuncusu olan) yazar; takım kanalında o takımın üyesi. (RLS ile de zorlanır — 63/64.)
  const yazabilirKanal = kulupMod || (aktifTakimId ? (benimTakimlar||[]).some(tk=>tk.id===aktifTakimId) : !!(ligYon || (benimTakimlar&&benimTakimlar.length>0)));
  // Gönderen adı: önce bağlı oyuncunun ad-soyadı, sonra profil adı, sonra e-postanın @ öncesi
  const ad=(oturum&&((benimOyuncu&&benimOyuncu.ad)||(oturum.user_metadata&&oturum.user_metadata.ad)||(oturum.email&&oturum.email.split("@")[0])))||"Oyuncu";
  const dibeKaydir=()=>{ setTimeout(()=>{ try{ if(kaydirRef.current) kaydirRef.current.scrollTop=kaydirRef.current.scrollHeight; }catch(e){} },40); };
  const dipteMi=()=>{ const el=kaydirRef.current; if(!el) return true; return (el.scrollHeight-el.scrollTop-el.clientHeight)<80; };

  const tepkileriYukle=async(liste)=>{ const idler=(liste||[]).filter(m=>!m.sistem).map(m=>m.id); if(!idler.length){ setTepkiMap({}); return; } const t=await Db.tepkiler(idler); const mp={}; t.forEach(x=>{ (mp[x.mesaj_id]=mp[x.mesaj_id]||[]).push(x); }); setTepkiMap(mp); };

  // Kanal yüklemesi + realtime
  useEffect(()=>{
    if((!turnuva&&!kulupMod)||!sb){ setYuk(false); return; }
    let aktif=true; setYuk(true); setDahaVar(true); setSecili(null); setYeniVar(false);
    if(kulupMod){
      Db.mesajlar(null, null, null, kulup.id).then(m=>{ if(!aktif) return; setMesajlar(m); setYuk(false); tepkileriYukle(m); dibeKaydir(); if(m.length<30) setDahaVar(false); });
      if(aboneRef.current){ Db.sohbetKapat(aboneRef.current); aboneRef.current=null; }
      aboneRef.current=Db.sohbetDinleKulup(kulup.id, (m)=>{ setMesajlar(p=>{ if(p.some(x=>x.id===m.id)) return p; const yeni=[...p,m]; if(dipteRef.current || (oturum&&m.user_id===oturum.id)){ dibeKaydir(); } else setYeniVar(true); return yeni; }); });
      return ()=>{ aktif=false; if(aboneRef.current){ Db.sohbetKapat(aboneRef.current); aboneRef.current=null; } };
    }
    Db.mesajlar(turnuva.id, aktifTakimId).then(m=>{ if(!aktif) return; setMesajlar(m); setYuk(false); tepkileriYukle(m); dibeKaydir(); if(m.length<30) setDahaVar(false); if(oturum) Db.okumaKaydet(oturum.id, turnuva.id, aktifTakimId||"genel"); });
    if(aboneRef.current){ Db.sohbetKapat(aboneRef.current); aboneRef.current=null; }
    aboneRef.current=Db.sohbetDinle(turnuva.id, aktifTakimId, (m)=>{ setMesajlar(p=>{ if(p.some(x=>x.id===m.id)) return p; const yeni=[...p,m]; if(dipteRef.current || (oturum&&m.user_id===oturum.id)){ dibeKaydir(); } else setYeniVar(true); return yeni; }); if(oturum) Db.okumaKaydet(oturum.id, turnuva.id, aktifTakimId||"genel"); });
    return ()=>{ aktif=false; if(aboneRef.current){ Db.sohbetKapat(aboneRef.current); aboneRef.current=null; } };
  },[turnuva&&turnuva.id, kulup&&kulup.id, kanal]);

  // ✨ "yazıyor…" kanalı — kanala göre abone ol, birinin yazdığını duy, 3.5sn'de sön
  useEffect(()=>{ if(!sb||!oturum||(!turnuva&&!kulupMod)) return; let aktif=true;
    const ch=sb.channel("yaziyor:"+yaziKapsam,{config:{broadcast:{self:false}}}); yaziKanalRef.current=ch;
    ch.on("broadcast",{event:"yaziyor"},({payload})=>{ if(!aktif||!payload||!payload.uid||payload.uid===oturum.id) return;
      setYazanlar(list=>{ const now=Date.now(); const kalan=(list||[]).filter(x=>x.uid!==payload.uid && now-x.t<3500); return [...kalan,{uid:payload.uid, ad:payload.ad||"Biri", t:now}]; }); });
    ch.subscribe();
    const tik=setInterval(()=>{ setYazanlar(list=>{ const now=Date.now(); const f=(list||[]).filter(x=>now-x.t<3500); return f.length===(list||[]).length?list:f; }); },1200);
    return ()=>{ aktif=false; clearInterval(tik); try{ sb.removeChannel(ch); }catch(e){} yaziKanalRef.current=null; setYazanlar([]); };
  },[yaziKapsam, oturum&&oturum.id]);
  const yaziyorBildir=()=>{ const now=Date.now(); if(now-yaziSonRef.current<1800) return; yaziSonRef.current=now;
    try{ yaziKanalRef.current && yaziKanalRef.current.send({type:"broadcast",event:"yaziyor",payload:{uid:(oturum&&oturum.id), ad:ad}}); }catch(e){} };

  // Okunmamış badge (genel + kendi takımım)
  // Tek dokunuş: tek aktif ligi olan kullanıcı Sohbet'e basınca direkt o ligin sohbetine girer
  // NOT: "tek lig → direkt sohbet" kısayolu artık menuGit içinde (nav'a basınca) yapılır.
  // Efekt ile yapılınca geri kaydırınca hub'a düşüp anında tekrar içeri giriyordu (tuzak) — kaldırıldı.
  useEffect(()=>{
    if(!turnuva||kulupMod||!sb||!oturum) return; let a=true;
    (async()=>{ const son=await Db.sonOkumalar(oturum.id, turnuva.id); const u={}; const kanallar=[["genel",null]]; benimTakimlar.forEach(tk=>kanallar.push(["t:"+tk.id, tk.id]));
      for(const [k,tid] of kanallar){ if(k===kanal) continue; u[k]=await Db.okunmamisSay(turnuva.id, tid, son[tid||"genel"]); }
      if(a) setUnread(u); })();
    return ()=>{a=false;};
  },[turnuva&&turnuva.id, kanal]);

  const kanalDegis=(yeni)=>{ taslaklar.current[kanal]=metin; setMetin(taslaklar.current[yeni]||""); setYanit(null); setKanal(yeni); setUnread(u=>({...u,[yeni]:0})); };

  // —— MEDYA (yalnız süper admin; RLS ile de zorlanır) ——
  const medyaGonder=async(url,tip)=>{
    if(!url||!oturum||(!turnuva&&!kulupMod)) return;
    const ek={ medya_url:url, medya_tip:tip, metin:(tip==="foto"?"📷 Görsel":"🎤 Ses kaydı"),
      takim_ad:kulupMod?(kulup.ad||null):(benimTakim?benimTakim.ad:null),
      takim_logo:kulupMod?(kulup.logo||null):(benimTakim?(benimTakim.logo||null):null),
      foto:benimOyuncu?(benimOyuncu.foto||null):null };
    const r=kulupMod ? await Db.mesajGonder(null,null,oturum.id,ad,ek,kulup.id) : await Db.mesajGonder(turnuva.id,aktifTakimId,oturum.id,ad,ek);
    if(r&&r.ok){ if(r.mesaj) setMesajlar(p=>p.some(x=>x.id===r.mesaj.id)?p:[...p,r.mesaj]); dibeKaydir(); }
    else alert("Gönderilemedi: "+((r&&r.hata)||"")+"\n(Medya için 73_ SQL güncellemesi çalıştırılmış olmalı.)");
  };
  const fotoSec=async(e)=>{ const f=e.target.files&&e.target.files[0]; e.target.value=""; if(!f) return;
    setMedyaYuk(true); const r=await fotoYukle(f,"sohbet"); setMedyaYuk(false);
    if(r&&r.url) medyaGonder(r.url,"foto"); else alert("Görsel yüklenemedi: "+((r&&r.hata)||"")); };
  const sesDosya=async(e)=>{ const f=e.target.files&&e.target.files[0]; e.target.value=""; if(!f) return;
    setMedyaYuk(true); const r=await sesYukle(f); setMedyaYuk(false);
    if(r&&r.url) medyaGonder(r.url,"ses"); else alert("Ses yüklenemedi: "+((r&&r.hata)||"")); };
  const sesKayitBasla=async()=>{
    if(typeof MediaRecorder==="undefined"||!navigator.mediaDevices){ alert("Tarayıcı ses kaydını desteklemiyor — ‘ses dosyası’ ile gönderebilirsin."); return; }
    try{ const stream=await navigator.mediaDevices.getUserMedia({audio:true});
      const mr=new MediaRecorder(stream); const parcalar=[]; kayitIptalRef.current=false;
      mr.ondataavailable=ev=>{ if(ev.data&&ev.data.size)parcalar.push(ev.data); };
      mr.onstop=async()=>{ try{ stream.getTracks().forEach(t=>t.stop()); }catch(e){}
        if(kayitIptalRef.current){ kayitIptalRef.current=false; return; }
        const blob=new Blob(parcalar,{type:(mr.mimeType||"audio/webm").split(";")[0]});
        if(blob.size<800) return;
        setMedyaYuk(true); const r=await sesYukle(blob); setMedyaYuk(false);
        if(r&&r.url) medyaGonder(r.url,"ses"); else alert("Ses yüklenemedi: "+((r&&r.hata)||"")); };
      kayitRef.current=mr; mr.start(); setKayit(true);
    }catch(e){ alert("Mikrofona erişilemedi: "+((e&&e.message)||e)); } };
  const sesKayitDur=()=>{ try{ if(kayitRef.current&&kayitRef.current.state!=="inactive") kayitRef.current.stop(); }catch(e){} setKayit(false); };
  const sesKayitIptal=()=>{ kayitIptalRef.current=true; try{ if(kayitRef.current&&kayitRef.current.state!=="inactive") kayitRef.current.stop(); }catch(e){} setKayit(false); };
  // Bu sohbetteki (lig/takım/kulüp) tüm foto/ses medyasını temizle — yalnız süper admin. Ekranı anında günceller.
  const buKanalMedyaTemizle=async()=>{
    if(!adminMi) return;
    if(!confirm("Bu sohbetteki TÜM foto/ses medyası KALICI silinsin mi?\n\nYazılı mesajlar ve maç sonucu kartları KALIR; yalnız foto/ses medyası ve depodaki dosyaları silinir.")) return;
    setMedyaYuk(true);
    const scope=kulupMod?{kulupId:kulup.id}:{ligId:turnuva&&turnuva.id, takimId:aktifTakimId};
    const r=await Db.sohbetMedyaSilRPC(scope);
    setMedyaYuk(false);
    if(r&&r.ok){ setMesajlar(p=>(p||[]).filter(m=>!m.medya_url)); Db.logla(oturum,"Sohbet medyası temizlendi (kanal)",r.adet+" medya · "+r.dosya+" dosya"); if(!r.adet) alert("Bu sohbette silinecek foto/ses medyası yok."); }
    else alert("Silinemedi: "+((r&&r.hata)||"bilinmeyen")); };
  const gonder=async()=>{
    const t=metin.trim(); if(!t||!oturum||(!turnuva&&!kulupMod)) return;
    setGonderiliyor(true);
    const ek={ metin:t, takim_ad:kulupMod?(kulup.ad||null):(benimTakim?benimTakim.ad:null), takim_logo:kulupMod?(kulup.logo||null):(benimTakim?(benimTakim.logo||null):null), foto:benimOyuncu?(benimOyuncu.foto||null):null };
    if(yonetimMod && ligYon){ ek.yonetim=true; ek.takim_ad=null; ek.takim_logo=null; }
    if(yanit){ ek.yanit_id=yanit.id; ek.yanit_ad=yanit.ad; ek.yanit_metin=(yanit.metin||"").slice(0,120); }
    const etk=etiketleriTopla(t); if(etk.length) ek.etiketler=etk;         // @-etiket bildirimi (trigger)
    if(kufurVar(t)){ ek.gizli=true; ek.gizli_sebep="otomatik"; }            // küfür filtresi: otomatik gizle
    const r=kulupMod ? await Db.mesajGonder(null, null, oturum.id, ad, ek, kulup.id) : await Db.mesajGonder(turnuva.id, aktifTakimId, oturum.id, ad, ek);
    setGonderiliyor(false);
    if(r&&r.ok){ setMetin(""); setYanit(null); setEtiketPanel(null); secilenEtiket.current={}; taslaklar.current[kanal]=""; if(r.mesaj) setMesajlar(p=> p.some(x=>x.id===r.mesaj.id)?p:[...p,r.mesaj]); dibeKaydir(); }
    else alert(/row-level security|sohbet_yazabilir/i.test((r&&r.hata)||"") ? "Mesaj gönderilemedi — bu sohbette şu an yazamıyorsunuz (susturma/yavaş mod/sadece-yönetici)." : "Gönderilemedi: "+((r&&r.hata)||""));
  };
  const patlat=(mid,emoji)=>{ const key=Date.now()+Math.random(); setPatlama({id:mid,emoji,key}); setTimeout(()=>setPatlama(p=>(p&&p.key===key)?null:p),1000); };
  const tepkiVer=async(m,emoji)=>{ if(!oturum) return; const mine=(tepkiMap[m.id]||[]).some(x=>x.user_id===oturum.id&&x.emoji===emoji);
    setSecili(null);
    if(!mine) patlat(m.id, emoji);                       // 💥 tepki patlaması (sadece eklerken)
    if(mine){ await Db.tepkiKaldir(m.id,oturum.id,emoji); } else { await Db.tepkiEkle(m.id,oturum.id,emoji); }
    setTepkiMap(p=>{ const arr=(p[m.id]||[]).filter(x=>!(x.user_id===oturum.id&&x.emoji===emoji)); if(!mine) arr.push({user_id:oturum.id,emoji}); return {...p,[m.id]:arr}; });
  };
  const ciftKalp=(m)=>{ if(!oturum) return; const mine=(tepkiMap[m.id]||[]).some(x=>x.user_id===oturum.id&&x.emoji==="❤️"); if(mine){ patlat(m.id,"❤️"); } else { tepkiVer(m,"❤️"); } };
  const mesajSil=async(m)=>{ setSecili(null); if(!confirm("Mesaj silinsin mi?")) return; await Db.mesajSil(m.id); setMesajlar(p=>p.filter(x=>x.id!==m.id));
    if(m.medya_url){ const d=await Db.medyaMesajTemizle(m); if(d&&d.dosya) Db.logla(oturum,"Sohbet medya dosyası silindi",(m.medya_tip==="ses"?"🎤 ses":"📷 görsel")+" · "+(d.yol||"")); } };
  const sikayet=async(m)=>{ setSecili(null); const s=prompt("Şikâyet sebebi (opsiyonel):",""); if(s===null) return; const r=await Db.sikayetEt(m,oturum.id,s); alert(r&&r.ok?"Şikâyetin iletildi, teşekkürler.":"Gönderilemedi."); };
  const eskiYukle=async()=>{ if(!mesajlar.length||eskiYuk||!dahaVar) return; setEskiYuk(true); const enEski=mesajlar[0].olusma; const eski=kulupMod ? await Db.mesajlar(null, null, enEski, kulup.id) : await Db.mesajlar(turnuva.id, aktifTakimId, enEski); const el=kaydirRef.current; const oncekiH=el?el.scrollHeight:0; setMesajlar(p=>[...eski,...p]); if(eski.length<30) setDahaVar(false); tepkileriYukle([...eski,...mesajlar]); setTimeout(()=>{ if(el) el.scrollTop=el.scrollHeight-oncekiH; },30); setEskiYuk(false); };
  const scrollDinle=(e)=>{ const el=e.target; dipteRef.current=dipteMi(); if(dipteRef.current) setYeniVar(false); if(el.scrollTop<40) eskiYukle(); };
  // Klavye açılıp kapanınca (visualViewport) dipteysek son mesajı görünür tut
  useEffect(()=>{
    const vv=window.visualViewport; if(!vv) return;
    const onR=()=>{ if(dipteRef.current) dibeKaydir(); };
    vv.addEventListener('resize',onR);
    return ()=>vv.removeEventListener('resize',onR);
  },[]);

  // GLOBAL SOHBET HUB — belirli lig seçilmemişse: sohbet edilebilir ligleri listele
  if(!turnuva && !kulupMod){
    const ligler=(turnuvalar||[]).filter(t=>t.iliskisel && (t.durum||'aktif')!=='arsiv');
    return <div className="fade-in main-area" style={{paddingBottom:90}}>
      <div className="vav-hero" style={{position:"relative",overflow:"hidden",padding:"22px 18px 18px",background:"linear-gradient(120deg,"+T.accent2+"33,"+T.bg0+" 45%,"+T.accent+"22 75%,"+T.bg0+")"}}>
        <div className="vav-supurme"/>
        <div style={{position:"relative",display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:44,height:44,borderRadius:13,background:T.accent2+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,boxShadow:"0 0 18px "+T.accent2+"44"}}>💬</div>
          <div><div style={{fontSize:11,color:T.accent2,letterSpacing:1,fontWeight:700}}>SOHBET</div><div style={{fontSize:22,fontWeight:800,color:T.text,fontFamily:T.fontDisplay,lineHeight:1.1}}>Sohbetlerim</div></div>
        </div>
      </div>
      {!oturum && <div style={{padding:30,textAlign:"center",color:T.textMut,fontSize:13}}>Sohbet için giriş yapmalısın.</div>}
      {oturum && ligler.length===0 && <div style={{padding:"40px 26px",textAlign:"center"}}>
        <div style={{fontSize:38,marginBottom:12}}>💬</div>
        <div style={{fontSize:14,color:T.text,fontWeight:700,marginBottom:6}}>Henüz sohbet edecek ligin yok</div>
        <div style={{fontSize:12,color:T.textMut,lineHeight:1.6,maxWidth:300,margin:"0 auto 18px"}}>Bir lige katıl veya kur — takım ve lig sohbetlerin burada açılır.</div>
        <button onClick={()=>git({sayfa:"ligler"})} className="tap" style={{background:T.accent,color:T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0,border:0,borderRadius:11,padding:"12px 26px",fontSize:13.5,fontWeight:800}}>🔍 Ligleri Keşfet</button>
      </div>}
      {oturum && ligler.length>0 && <div style={{padding:"12px 14px"}}>
        <div style={{fontSize:11,color:T.textMut,fontWeight:700,margin:"4px 2px 10px"}}>LİG & TAKIM SOHBETLERİ</div>
        {ligler.map(t=>
          <div key={t.id} onClick={()=>git({sayfa:"sohbet",turnuva:t})} className="tap kart-hover" style={{display:"flex",gap:12,alignItems:"center",background:T.bg1,borderRadius:14,padding:13,marginBottom:9,border:"0.5px solid "+T.line}}>
            <Logo renk={t.renk} ad={t.ad} logo={t.logo} renk2={t.renk2} boy={44}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:15,fontWeight:800,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.ad}</div>
              <div style={{fontSize:11,color:T.textMut,marginTop:2}}>💬 Lig sohbeti · takım sohbetleri</div>
            </div>
            <span style={{fontSize:20,color:T.accent2}}>›</span>
          </div>
        )}
      </div>}
    </div>;
  }

  const rozet=(n)=> n>0 ? <span style={{marginLeft:6,background:T.accent,color:T.bg0,fontSize:10,fontWeight:800,borderRadius:10,padding:"0 6px",minWidth:16,display:"inline-block",textAlign:"center"}}>{n>99?"99+":n}</span> : null;
  const zaman=(iso)=>{ try{ return new Date(iso).toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"}); }catch(e){ return ""; } };

  return <div className="fz-sohbet" style={{background:T.bg0}}>
    {/* BAŞLIK + SEKMELER */}
    <div style={{flexShrink:0,padding:"12px 14px 10px",borderBottom:"0.5px solid "+T.line,background:T.bg0}}>
      {/* GERİ — her zaman görünür (iOS PWA'da kaydırma güvenilmez; buton %100 çalışır) */}
      <div onClick={()=>{ if(geri) geri(); else if(git) git({sayfa:"ana"}); }} className="tap" style={{display:"inline-flex",alignItems:"center",gap:3,color:T.textSoft,fontSize:13,fontWeight:700,marginBottom:9,cursor:"pointer",WebkitTapHighlightColor:"transparent"}}>
        <span style={{fontSize:22,lineHeight:1,marginTop:-1}}>‹</span> Geri
      </div>
      {kulupMod
        ? <div style={{display:"flex",alignItems:"center",gap:10}}>
            <Logo renk={kulup.renk} ad={kulup.ad} logo={kulup.logo} renk2={kulup.renk2} boy={34}/>
            <div style={{minWidth:0}}>
              <div style={{fontSize:16,fontWeight:800,color:T.text,fontFamily:T.fontDisplay,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{kulup.ad}</div>
              <div style={{fontSize:10.5,color:T.accent2,fontWeight:700,marginTop:1}}>💬 Takım Sohbeti · sadece kadro</div>
            </div>
          </div>
        : <React.Fragment>
      <div style={{fontSize:16,fontWeight:800,color:T.text,fontFamily:T.fontDisplay,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{turnuva.ad}</div>
      <div style={{display:"flex",gap:8,marginTop:10,overflowX:"auto",alignItems:"center",overscrollBehaviorX:"contain",WebkitOverflowScrolling:"touch"}}>
        <button onClick={()=>kanalDegis("genel")} className="tap" style={{flexShrink:0,background:kanal==="genel"?T.accent:T.bg1,color:kanal==="genel"?T.bg0:T.textSoft,border:"0.5px solid "+(kanal==="genel"?T.accent:T.line),borderRadius:20,padding:"7px 15px",fontSize:12.5,fontWeight:700}}>Lig Sohbeti{rozet(unread["genel"]||0)}</button>
        {ligYon
          ? <select value={aktifTakimId||""} onChange={e=>kanalDegis(e.target.value?("t:"+e.target.value):"genel")} style={{flexShrink:0,background:aktifTakimId?T.accent:T.bg1,color:aktifTakimId?T.bg0:T.textSoft,border:"0.5px solid "+(aktifTakimId?T.accent:T.line),borderRadius:20,padding:"8px 12px",fontSize:12.5,fontWeight:700,fontFamily:"inherit",outline:"none",maxWidth:200}}>
              <option value="">🛡️ Takım sohbeti seç…</option>
              {(turnuva.takimlar||[]).map(tk=><option key={tk.id} value={tk.id}>{tk.ad}</option>)}
            </select>
          : benimTakimlar.map(tk=>
              <button key={tk.id} onClick={()=>kanalDegis("t:"+tk.id)} className="tap" style={{flexShrink:0,display:"flex",alignItems:"center",gap:5,background:kanal==="t:"+tk.id?T.accent:T.bg1,color:kanal==="t:"+tk.id?T.bg0:T.textSoft,border:"0.5px solid "+(kanal==="t:"+tk.id?T.accent:T.line),borderRadius:20,padding:"7px 14px",fontSize:12.5,fontWeight:700}}>🛡️ {tk.ad}{rozet(unread["t:"+tk.id]||0)}</button>
            )}
      </div>
      </React.Fragment>}
    </div>

    {/* 📌 SABİT DUYURU — en son yönetim mesajı üstte sabit (cihazda kapatılabilir) */}
    {(()=>{ const y=(mesajlar||[]).filter(mm=>mm&&mm.yonetim&&!mm.silindi&&!mm.gizli); const sd=y.length?y[y.length-1]:null; if(!sd || pinKapali===String(sd.id)) return null;
      return <div style={{flexShrink:0,display:"flex",alignItems:"center",gap:9,margin:"8px 12px 0",padding:"8px 12px",background:"linear-gradient(135deg,"+T.gold+"22,"+T.bg1+")",border:"0.5px solid "+T.gold+"55",borderRadius:12}}>
        <span style={{fontSize:15,flexShrink:0}}>📌</span>
        <div style={{flex:1,minWidth:0}}><div style={{fontSize:9,fontWeight:800,letterSpacing:.5,color:T.gold}}>SABİT DUYURU · {sd.ad||"Yönetim"}</div><div style={{fontSize:12.5,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{(sd.metin||"").replace(/\n/g," ")}</div></div>
        <button onClick={()=>{ setPinKapali(String(sd.id)); try{ localStorage.setItem("fl_pin_kapali",String(sd.id)); }catch(e){} }} className="tap" aria-label="Kapat" style={{flexShrink:0,background:"none",border:0,color:T.textMut,fontSize:17,cursor:"pointer",lineHeight:1}}>×</button>
      </div>; })()}
    {/* MESAJLAR */}
    <div ref={kaydirRef} onScroll={scrollDinle} onClick={()=>secili&&setSecili(null)} style={{flex:1,minHeight:0,overflowY:"auto",overflowX:"hidden",overscrollBehavior:"contain",WebkitOverflowScrolling:"touch",touchAction:"pan-y",padding:"14px 12px",display:"flex",flexDirection:"column",gap:3}}>
      {eskiYuk && <div style={{textAlign:"center",color:T.textMut,fontSize:11,padding:6}}>Eski mesajlar yükleniyor…</div>}
      {yuk ? <div style={{textAlign:"center",color:T.textMut,fontSize:12,padding:30}}>Yükleniyor…</div>
       : (()=>{
        // Mesajlar + aktif anketler tek kronolojik akışta (anket oluşturulma zamanına oturur; yeni mesaj en altta — WhatsApp mantığı)
        const akis=[...(mesajlar||[]).map(m=>({...m,__a:false})), ...(kanalAnketler||[]).map(a=>({__a:true,__anket:a,olusma:a.created,id:"anket:"+a.id}))].sort((x,y)=>new Date(x.olusma||0)-new Date(y.olusma||0));
        if(!akis.length) return <div style={{textAlign:"center",color:T.textMut,fontSize:12.5,padding:40}}>İlk mesajı sen yaz 👋</div>;
        return akis.map((m,i)=>{
          if(m.__a) return <AnketKart key={m.id} anket={m.__anket} T={T} oturum={oturum} adminMi={adminMi}/>;
          // SİSTEM MESAJI
          if(m.sistem){
            if(m.kart && m.sistem_tip==="mac"){ const k=m.kart;
              const macAc=()=>{ try{ const t=(turnuva&&turnuva.maclar&&turnuva.maclar.some(x=>String(x.id)===String(k.macId)))?turnuva:((turnuvalar||[]).find(x=>x.maclar&&x.maclar.some(mm=>String(mm.id)===String(k.macId)))); const mm=t&&t.maclar&&t.maclar.find(x=>String(x.id)===String(k.macId)); if(mm&&t) git({sayfa:"mac",mac:mm,turnuva:t}); }catch(e){} };
              const gol=(k.goller||[]);
              return <div key={m.id} onClick={macAc} className="kart-hover tap" style={{alignSelf:"center",maxWidth:340,width:"92%",background:"linear-gradient(135deg,"+T.accent2+"14,"+T.bg1+")",border:"0.5px solid "+T.accent2+"44",borderRadius:16,padding:"13px 14px",margin:"8px 0",cursor:"pointer"}}>
                <div style={{fontSize:9,color:T.accent2,fontWeight:800,letterSpacing:1,textAlign:"center",marginBottom:9}}>⚽ MAÇ SONUCU{k.hafta?" · "+k.hafta+". HAFTA":""}</div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12}}>
                  <div style={{flex:1,textAlign:"center"}}><div style={{width:40,height:40,margin:"0 auto 5px"}} dangerouslySetInnerHTML={{__html:svgAmblem(k.takimA||"?",T.accent,40,k.logoA)}}/><div style={{fontSize:10.5,color:T.text,fontWeight:600}}>{k.takimA}</div></div>
                  <div style={{fontSize:22,fontWeight:800,fontFamily:T.fontDisplay,color:T.text}}>{k.skorA} - {k.skorB}</div>
                  <div style={{flex:1,textAlign:"center"}}><div style={{width:40,height:40,margin:"0 auto 5px"}} dangerouslySetInnerHTML={{__html:svgAmblem(k.takimB||"?",T.danger,40,k.logoB)}}/><div style={{fontSize:10.5,color:T.text,fontWeight:600}}>{k.takimB}</div></div>
                </div>
                {gol.length>0 && <div style={{marginTop:9,paddingTop:8,borderTop:"0.5px solid "+T.line,display:"flex",flexDirection:"column",gap:2}}>
                  {gol.map((g,gi)=><div key={gi} style={{fontSize:10.5,color:T.textSoft,display:"flex",gap:6}}><span>⚽</span><span style={{flex:1}}>{g.ad}</span><span style={{color:T.textMut}}>{g.dk?g.dk+"'":""}</span></div>)}
                </div>}
                {k.mvp && <div style={{fontSize:10.5,color:T.gold,textAlign:"center",marginTop:8,fontWeight:700}}>⭐ MVP: {k.mvp}</div>}
                <div style={{fontSize:9.5,color:T.accent2,textAlign:"center",marginTop:9,fontWeight:700}}>📰 Gazete · afiş · kadro · puan durumu →</div>
                <div style={{fontSize:9,color:T.textMut,textAlign:"center",marginTop:4}}>{zaman(m.olusma)}</div>
              </div>;
            }
            return <div key={m.id} style={{alignSelf:"center",maxWidth:"90%",margin:"6px 0",display:"flex",alignItems:"center",gap:8,background:T.bg1,border:"0.5px solid "+T.line,borderRadius:14,padding:"9px 13px"}}>
              <span style={{width:22,height:22,borderRadius:"50%",background:T.accent,color:T.bg0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0,fontWeight:800}}>✓</span>
              <div><div style={{fontSize:9,color:T.accent,fontWeight:800,letterSpacing:.5}}>FORZALİG{m.sistem_tip==="yonetim"?" YÖNETİMİ":""}</div><div style={{fontSize:12,color:T.textSoft,marginTop:1}}>{m.metin}</div></div>
            </div>;
          }
          // YÖNETİM MESAJI (doğrulanmış, normal mesajdan ayrı)
          if(m.yonetim){
            return <div key={m.id} style={{alignSelf:"center",maxWidth:360,width:"94%",margin:"9px 0",background:"linear-gradient(135deg,"+T.gold+"1a,"+T.bg1+")",border:"1px solid "+T.gold+"66",borderRadius:16,padding:"12px 14px"}}>
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:6}}>
                <span style={{width:22,height:22,borderRadius:"50%",background:T.gold,color:"#04070C",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800}}>✓</span>
                <span style={{fontSize:10.5,color:T.gold,fontWeight:800,letterSpacing:.5}}>📢 FORZALİG YÖNETİMİ</span>
              </div>
              <div style={{fontSize:13,color:T.text,lineHeight:1.45}}>{m.metin}</div>
              <div style={{fontSize:9,color:T.textMut,marginTop:6,textAlign:"right"}}>{zaman(m.olusma)}</div>
            </div>;
          }
          // NORMAL MESAJ
          const benim=oturum&&m.user_id===oturum.id;
          const tepk=tepkiMap[m.id]||[]; const grup={}; tepk.forEach(x=>{ grup[x.emoji]=grup[x.emoji]||{n:0,mine:false}; grup[x.emoji].n++; if(oturum&&x.user_id===oturum.id) grup[x.emoji].mine=true; });
          const oncekiAyni = i>0 && akis[i-1] && !akis[i-1].__a && !akis[i-1].sistem && akis[i-1].user_id===m.user_id;
          const yeniGeldi = m.olusma && (new Date(m.olusma).getTime() > acilisRef.current - 1500);
          return <div key={m.id} className={yeniGeldi?"fz-msggir":undefined} style={{alignSelf:benim?"flex-end":"flex-start",maxWidth:"82%",marginTop:oncekiAyni?1:8,display:"flex",gap:8,flexDirection:benim?"row-reverse":"row"}}>
            <div style={{width:30,height:30,borderRadius:"50%",overflow:"hidden",flexShrink:0,alignSelf:"flex-end",visibility:oncekiAyni?"hidden":"visible"}} dangerouslySetInnerHTML={{__html:svgAvatar(m.ad,30,m.foto)}}/>
            <div style={{minWidth:0,position:"relative"}}>
              {!oncekiAyni && <div style={{fontSize:10,color:T.textMut,marginBottom:3,margin:benim?"0 4px 3px 0":"0 0 3px 4px",display:"flex",alignItems:"center",gap:5,justifyContent:benim?"flex-end":"flex-start",flexDirection:benim?"row-reverse":"row"}}>
                <b style={{color:T.textSoft}}>{m.ad}</b>{m.takim_ad && <span style={{display:"inline-flex",alignItems:"center",gap:4,color:T.accent2}}><span style={{width:14,height:14,display:"inline-block"}} dangerouslySetInnerHTML={{__html:svgAmblem(m.takim_ad,T.accent2,14,m.takim_logo)}}/>{m.takim_ad}</span>}
              </div>}
              {patlama&&patlama.id===m.id && <div key={patlama.key} className="fz-patla" style={{position:"absolute",top:-6,[benim?"right":"left"]:18,fontSize:34,zIndex:12,pointerEvents:"none",filter:"drop-shadow(0 3px 8px rgba(0,0,0,.5))"}}>{patlama.emoji}</div>}
              <div onClick={(e)=>{ e.stopPropagation(); setSecili(secili===m.id?null:m.id); }} onDoubleClick={(e)=>{ e.stopPropagation(); ciftKalp(m); }} className="tap" style={{background:benim?("linear-gradient(135deg,"+T.accent+","+(T.accent2||T.accent)+")"):T.bg1,color:benim?T.bg0:T.text,border:benim?0:"0.5px solid "+T.line,borderRadius:16,borderBottomRightRadius:benim?5:16,borderBottomLeftRadius:benim?16:5,padding:"9px 13px",fontSize:13.5,lineHeight:1.4,wordBreak:"break-word",cursor:"pointer",boxShadow:benim?"0 6px 16px -8px "+T.accent+"aa":"none"}}>
                {m.yanit_id && <div style={{borderLeft:"2px solid "+(benim?T.bg0:T.accent),paddingLeft:7,marginBottom:5,opacity:.85}}><div style={{fontSize:10,fontWeight:700}}>{m.yanit_ad}</div><div style={{fontSize:11,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:180}}>{m.yanit_metin}</div></div>}
                {m.medya_tip==="foto" && m.medya_url && <img src={m.medya_url} onClick={(e)=>{ e.stopPropagation(); window.open(m.medya_url,"_blank"); }} alt="" style={{display:"block",width:200,maxWidth:"100%",maxHeight:260,objectFit:"cover",borderRadius:10,marginBottom:5,cursor:"pointer",background:"rgba(0,0,0,.2)"}}/>}
                {m.medya_tip==="ses" && m.medya_url && <audio controls src={m.medya_url} onClick={e=>e.stopPropagation()} style={{display:"block",width:220,maxWidth:"100%",marginBottom:5,height:38}}/>}
                {(!m.medya_url || (m.metin!=="📷 Görsel" && m.metin!=="🎤 Ses kaydı")) && mesajMetni(m)}
                {m.gizli && (modYetki || m.user_id===(oturum&&oturum.id)) && <span style={{fontSize:8.5,fontWeight:800,color:T.gold,background:T.gold+"22",borderRadius:5,padding:"1px 5px",marginLeft:6,verticalAlign:"middle"}}>gizli</span>}
                <span style={{fontSize:9,opacity:.6,marginLeft:8,verticalAlign:"bottom"}}>{zaman(m.olusma)}</span>
              </div>
              {/* Tepkiler */}
              {Object.keys(grup).length>0 && <div style={{display:"flex",gap:4,marginTop:4,flexWrap:"wrap",justifyContent:benim?"flex-end":"flex-start"}}>
                {Object.entries(grup).map(([em,d])=><span key={em} onClick={(e)=>{ e.stopPropagation(); tepkiVer(m,em); }} className="tap pop" style={{background:d.mine?T.accent+"33":T.bg2,border:"0.5px solid "+(d.mine?T.accent:T.line),borderRadius:12,padding:"1px 7px",fontSize:11,cursor:"pointer"}}>{em} {d.n}</span>)}
              </div>}
              {/* Aksiyon menüsü — mesajın ÜSTÜNDE açılır (giriş kutusunun arkasında kalmaz), açılınca otomatik görünüre kayar */}
              {secili===m.id && <div ref={el=>{ if(el){ try{ el.scrollIntoView({block:"nearest",behavior:"smooth"}); }catch(e){} } }} onClick={e=>e.stopPropagation()} className="pop" style={{position:"absolute",bottom:"calc(100% + 6px)",zIndex:30,[benim?"right":"left"]:0,minWidth:212,maxWidth:"min(90vw,330px)",background:"rgba(16,24,36,.97)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",border:"0.5px solid "+T.line,borderRadius:16,padding:"8px 10px",display:"flex",flexWrap:"wrap",gap:10,alignItems:"center",boxShadow:"0 14px 34px -10px rgba(0,0,0,.7)"}}>
                {FL_EMOJILER.map(em=><span key={em} onClick={()=>tepkiVer(m,em)} className="tap" style={{fontSize:21,cursor:"pointer",lineHeight:1}}>{em}</span>)}
                <span style={{width:1,height:18,background:T.line}}/>
                <button onClick={()=>{ setYanit(m); setSecili(null); }} className="tap" style={{background:"none",border:0,color:T.accent,fontSize:11.5,fontWeight:700}}>↩ Yanıtla</button>
                {benim
                  ? <button onClick={()=>mesajSil(m)} className="tap" style={{background:"none",border:0,color:T.danger,fontSize:11.5,fontWeight:700}}>🗑 Sil</button>
                  : <button onClick={()=>sikayet(m)} className="tap" style={{background:"none",border:0,color:T.textMut,fontSize:11.5,fontWeight:700}}>⚑ Şikâyet</button>}
                {!benim && (ligYon) && <button onClick={()=>mesajSil(m)} className="tap" style={{background:"none",border:0,color:T.danger,fontSize:11.5,fontWeight:700}}>🗑 Kaldır</button>}
                {modYetki && !m.sistem && <button onClick={()=>{ setModHedef(m); setModIhlal(0); Db.ihlalOzet(m.user_id,30).then(setModIhlal); setSecili(null); }} className="tap" style={{background:"none",border:0,color:T.gold,fontSize:11.5,fontWeight:800}}>🛡 Moderasyon</button>}
              </div>}
            </div>
          </div>;
        });
       })()}
    </div>

    {/* ↓ yeni mesaj */}
    {yeniVar && <button onClick={()=>{ dibeKaydir(); setYeniVar(false); }} className="tap" style={{position:"absolute",bottom:oturum?86:70,left:"50%",transform:"translateX(-50%)",background:T.accent,color:T.bg0,border:0,borderRadius:20,padding:"7px 16px",fontSize:12,fontWeight:800,boxShadow:"0 6px 18px rgba(0,0,0,.4)",zIndex:5}}>↓ Yeni mesaj</button>}

    {/* Yanıt önizleme */}
    {yanit && <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",borderTop:"0.5px solid "+T.line,background:T.bg1}}>
      <div style={{flex:1,borderLeft:"2px solid "+T.accent,paddingLeft:8,minWidth:0}}><div style={{fontSize:10,color:T.accent,fontWeight:700}}>{yanit.ad}'a yanıt</div><div style={{fontSize:11,color:T.textMut,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{yanit.metin}</div></div>
      <button onClick={()=>setYanit(null)} className="tap" style={{background:"none",border:0,color:T.textMut,fontSize:18}}>×</button>
    </div>}

    {/* Yönetim modu bandı (sadece admin / lig yöneticisi) */}
    {oturum && ligYon && <div onClick={()=>setYonetimMod(v=>!v)} className="tap" style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",borderTop:"0.5px solid "+T.line,background:yonetimMod?T.gold+"14":T.bg0,cursor:"pointer"}}>
      <span style={{width:32,height:18,borderRadius:9,background:yonetimMod?T.gold:T.bg2,position:"relative",flexShrink:0,transition:"background .2s"}}><span style={{position:"absolute",top:2,left:yonetimMod?16:2,width:14,height:14,borderRadius:"50%",background:"#fff",transition:"left .2s"}}/></span>
      <span style={{fontSize:11.5,color:yonetimMod?T.gold:T.textMut,fontWeight:700}}>📢 Yönetim mesajı olarak gönder</span>
    </div>}
    {/* @-ETİKET OTOMATİK TAMAMLAMA */}
    {etiketPanel && (etiketPanel.items.length>0 || scopeTakim) && !cezam && <div style={{flexShrink:0,maxHeight:210,overflowY:"auto",borderTop:"0.5px solid "+T.line,background:T.bg1}}>
      {scopeTakim && "takımım".indexOf(etiketPanel.q)>-1 && <div onClick={()=>etiketSec({ad:"Takımım",user_id:"__takimim__"})} className="tap" style={{display:"flex",alignItems:"center",gap:9,padding:"9px 14px",cursor:"pointer",borderBottom:"0.5px solid "+T.line}}><span style={{width:28,height:28,borderRadius:"50%",background:T.accent+"22",display:"grid",placeItems:"center",fontSize:14,flexShrink:0}}>👥</span><div><div style={{fontSize:12.5,fontWeight:700,color:T.accent}}>@Takımım</div><div style={{fontSize:10,color:T.textMut}}>Takımının tüm aktif oyuncuları</div></div></div>}
      {etiketPanel.items.map((u,ui)=><div key={(u.player_id||u.user_id||u.takim_id||ui)+"|"+u.rol} onClick={()=>etiketSec(u)} className="tap" style={{display:"flex",alignItems:"center",gap:9,padding:"8px 14px",cursor:"pointer",borderBottom:"0.5px solid "+T.line}}>
        {u.rol==="takim"?<span style={{width:28,height:28,borderRadius:8,background:T.accent2+"22",display:"grid",placeItems:"center",fontSize:14,flexShrink:0}}>🛡️</span>:u.foto?<img src={u.foto} alt="" style={{width:28,height:28,borderRadius:"50%",objectFit:"cover",flexShrink:0}}/>:<span style={{width:28,height:28,borderRadius:"50%",background:T.bg2,display:"grid",placeItems:"center",fontSize:12,fontWeight:800,color:T.textSoft,flexShrink:0}}>{((u.ad||"?").trim()[0]||"?").toUpperCase()}</span>}
        <div style={{flex:1,minWidth:0}}><div style={{fontSize:12.5,fontWeight:600,color:u.rol==="takim"?T.accent2:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>@{u.ad}</div><div style={{fontSize:10,color:T.textMut}}>{u.rol==="takim"?"Takım · tüm oyunculara bildirim":(u.takim_ad||"")+(u.rol==="kaptan"?" · Kaptan":u.rol==="lig_yon"?" · Lig Yön.":u.rol==="hakem"?" · Hakem":"")}</div></div>
      </div>)}
    </div>}
    {/* Yavaş mod ipucu */}
    {kanalAyar && kanalAyar.yavas_sn>0 && !modYetki && !cezam && <div style={{flexShrink:0,fontSize:10.5,color:T.gold,textAlign:"center",padding:"5px 0",background:T.gold+"10",borderTop:"0.5px solid "+T.line}}>🐢 Yavaş mod açık — {kanalAyar.yavas_sn} sn'de bir mesaj</div>}
    {/* MESAJ KUTUSU */}
    {!oturum ? <div style={{flexShrink:0,padding:"14px 14px calc(14px + env(safe-area-inset-bottom))",textAlign:"center",fontSize:12,color:T.textMut,borderTop:"0.5px solid "+T.line,background:T.bg0}}>Yazmak için giriş yap.</div>
     : saltOkunur ? <div style={{flexShrink:0,padding:"14px 14px calc(14px + env(safe-area-inset-bottom))",textAlign:"center",fontSize:12,color:T.gold,fontWeight:700,borderTop:"0.5px solid "+T.line,background:T.bg0}}>👁 Salt-okunur görünüm — bu modda mesaj gönderilemez. Test için kendi hesabınla sohbete gir.</div>
     : !yazabilirKanal ? <div style={{flexShrink:0,padding:"14px 14px calc(14px + env(safe-area-inset-bottom))",textAlign:"center",fontSize:12,color:T.textMut,borderTop:"0.5px solid "+T.line,background:T.bg0}}>🔒 Bu {aktifTakimId?"takımın":"ligin"} üyesi değilsin — yalnız üyeler yazabilir.</div>
     : cezam ? <div style={{flexShrink:0,padding:"12px 14px calc(12px + env(safe-area-inset-bottom))",borderTop:"0.5px solid "+T.line,background:"#160b0b"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:16}}>🔇</span><b style={{fontSize:12.5,color:T.danger}}>{cezam.tur==="ban"?"Sohbet engeli":"Sohbette susturuldunuz"}</b></div>
        <div style={{fontSize:11.5,color:T.textSoft,marginTop:6,lineHeight:1.6}}>{cezam.biter ? <span>Bu sohbette <b style={{color:T.text}}>{trTarih(cezam.biter,true)}</b>'e kadar mesaj gönderemezsiniz. Kalan: <b style={{color:T.text}}>{kalanSure(cezam.biter)}</b>.</span> : <span>Bu sohbette <b style={{color:T.text}}>süresiz</b> mesaj kısıtlamanız var.</span>}{cezam.sebep && <span> Sebep: <b>{cezam.sebep}</b>.</span>}</div>
        <div style={{fontSize:10.5,color:T.textMut,marginTop:5}}>Mesajları okuyabilir, anketleri görüp oy verebilirsiniz. Hesabınız/takımınız etkilenmez.</div>
      </div>
     : (kanalAyar && kanalAyar.sadece_yonetici && !modYetki) ? <div style={{flexShrink:0,padding:"14px 14px calc(14px + env(safe-area-inset-bottom))",textAlign:"center",fontSize:12,color:T.gold,fontWeight:700,borderTop:"0.5px solid "+T.line,background:T.bg0}}>🔒 Bu sohbet geçici olarak yalnızca yöneticilerin mesaj göndermesine açık.</div>
     : kayit ? <div style={{flexShrink:0,display:"flex",gap:8,alignItems:"center",padding:"10px 12px max(10px, calc(env(safe-area-inset-bottom) - var(--kb, 0px)))",borderTop:"0.5px solid "+T.line,background:T.bg0}}>
        <span style={{width:11,height:11,borderRadius:"50%",background:T.danger,flexShrink:0}}/>
        <span style={{flex:1,fontSize:13,color:T.text,fontWeight:700}}>🎤 Ses kaydediliyor…</span>
        <button onClick={sesKayitIptal} className="tap" style={{background:"none",border:"0.5px solid "+T.line,color:T.textMut,borderRadius:20,padding:"9px 12px",fontSize:12,fontWeight:700,flexShrink:0}}>✕ İptal</button>
        <button onClick={sesKayitDur} className="tap" style={{background:T.accent,color:T.bg0,border:0,borderRadius:20,padding:"9px 14px",fontSize:12,fontWeight:800,flexShrink:0}}>⏹ Bitir &amp; Gönder</button>
      </div>
     : (()=>{ const arac=(adminMi||modYetki)&&!saltOkunur; const bstil={width:38,height:38,borderRadius:"50%",background:T.bg1,border:"0.5px solid "+T.line,fontSize:15,display:"grid",placeItems:"center",flexShrink:0,cursor:"pointer"};
       return <div style={{flexShrink:0,display:"flex",flexDirection:"column",gap:8,padding:"10px 12px max(10px, calc(env(safe-area-inset-bottom) - var(--kb, 0px)))",borderTop:yonetimMod?"none":"0.5px solid "+T.line,background:T.bg0}}>
        {/* ✨ yazıyor… göstergesi */}
        {yazanlar.length>0 && <div style={{display:"flex",alignItems:"center",gap:7,padding:"0 6px 2px",fontSize:11.5,color:T.accent2||T.accent,fontWeight:700}}>
          <span style={{display:"inline-flex",alignItems:"center",gap:3,color:T.accent2||T.accent}}>
            <span className="fz-yaznokta" style={{animationDelay:"0s"}}/><span className="fz-yaznokta" style={{animationDelay:".18s"}}/><span className="fz-yaznokta" style={{animationDelay:".36s"}}/>
          </span>
          <span style={{color:T.textMut}}>{yazanlar.length===1?(yazanlar[0].ad+" yazıyor…"):yazanlar.length===2?(yazanlar[0].ad+" ve "+yazanlar[1].ad+" yazıyor…"):"Birkaç kişi yazıyor…"}</span>
        </div>}
        {/* Satır 1 — Mesaj yaz (herkeste aynı, ortada) */}
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <input id="fzMsgInput" value={metin} onChange={e=>{ setMetin(e.target.value); etiketKontrol(e.target.value, e.target.selectionStart); if(e.target.value.trim()) yaziyorBildir(); }} onFocus={()=>{ dipteRef.current=dipteMi(); setTimeout(dibeKaydir,300); }} onKeyDown={e=>{ if(e.key==="Enter"){ e.preventDefault(); setEtiketPanel(null); gonder(); } }} placeholder={medyaYuk?"Medya yükleniyor…":(yonetimMod?"📢 Yönetim duyurusu yaz…":"Mesaj yaz…  @ ile etiketle")} style={{flex:1,minWidth:0,background:T.bg1,border:"0.5px solid "+(yonetimMod?T.gold+"66":T.line),borderRadius:22,padding:"12px 16px",color:T.text,outline:"none",fontFamily:"inherit",boxSizing:"border-box",fontSize:16}}/>
          <button onClick={gonder} disabled={gonderiliyor||!metin.trim()||medyaYuk} className="tap" style={{background:yonetimMod?T.gold:T.accent,color:T.bg0,border:0,borderRadius:"50%",width:46,height:46,fontSize:18,fontWeight:800,flexShrink:0,opacity:(gonderiliyor||!metin.trim()||medyaYuk)?.5:1}}>➤</button>
        </div>
        {/* Satır 2 — Yönetim araçları (yalnız admin/moderatör) */}
        {arac && <div style={{display:"flex",gap:9,justifyContent:"center",flexWrap:"wrap"}}>
          {adminMi && <label className="tap" title="Görsel" style={{...bstil,opacity:medyaYuk?.5:1}}><input type="file" accept="image/*" onChange={fotoSec} disabled={medyaYuk} style={{display:"none"}}/>📷</label>}
          {adminMi && <button onClick={sesKayitBasla} disabled={medyaYuk} className="tap" title="Ses kaydı" style={{...bstil,color:T.text,opacity:medyaYuk?.5:1}}>🎤</button>}
          {adminMi && <label className="tap" title="Ses dosyası" style={{...bstil,opacity:medyaYuk?.5:1}}><input type="file" accept="audio/*" onChange={sesDosya} disabled={medyaYuk} style={{display:"none"}}/>🎵</label>}
          {adminMi && <button onClick={()=>setHizliAnket(true)} className="tap" title="Hızlı anket oluştur" style={{...bstil,border:"0.5px solid "+T.accent+"66",color:T.accent}}>📊</button>}
          {adminMi && <button onClick={buKanalMedyaTemizle} disabled={medyaYuk} className="tap" title="Sohbet medyasını temizle" style={{...bstil,border:"0.5px solid "+T.danger+"55",color:T.danger,opacity:medyaYuk?.5:1}}>🧹</button>}
          {modYetki && <button onClick={()=>setModAyarAcik(true)} className="tap" title="Moderasyon ayarı (yavaş mod / sadece yönetici)" style={{...bstil,border:"0.5px solid "+T.gold+"66",color:T.gold}}>🛡</button>}
        </div>}
      </div>; })()}

    {/* ===== HIZLI ANKET (composer 📊) ===== */}
    {hizliAnket && <div onClick={()=>setHizliAnket(false)} style={{position:"fixed",inset:0,background:"rgba(3,6,12,.66)",zIndex:70,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:460,background:T.bg1,borderTop:"1px solid "+T.line,borderTopLeftRadius:18,borderTopRightRadius:18,padding:16,maxHeight:"85vh",overflowY:"auto"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}><span style={{fontSize:16}}>📊</span><b style={{fontSize:14}}>Hızlı Anket</b><span style={{fontSize:10,color:T.textMut,background:T.bg2,borderRadius:6,padding:"2px 7px"}}>{aktifTakimId?"Bu takım":kulupMod?"Bu kulüp":"Bu lig"}</span><span onClick={()=>setHizliAnket(false)} className="tap" style={{marginLeft:"auto",color:T.textMut,fontSize:20,cursor:"pointer"}}>×</span></div>
        <input value={haBaslik} onChange={e=>setHaBaslik(e.target.value)} placeholder="Anket sorusu" style={{width:"100%",background:T.bg2,border:"0.5px solid "+T.line,borderRadius:10,padding:"11px 13px",color:T.text,fontSize:13.5,fontFamily:"inherit",marginBottom:9,boxSizing:"border-box"}}/>
        {haSec.map((s,i)=><div key={i} style={{display:"flex",gap:6,marginBottom:6}}>
          <input value={s} onChange={e=>setHaSec(p=>{const a=[...p];a[i]=e.target.value;return a;})} placeholder={"Seçenek "+(i+1)} style={{flex:1,background:T.bg2,border:"0.5px solid "+T.line,borderRadius:9,padding:"9px 12px",color:T.text,fontSize:12.5,fontFamily:"inherit"}}/>
          {haSec.length>2 && <button onClick={()=>setHaSec(p=>p.filter((_,j)=>j!==i))} className="tap" style={{background:T.bg2,border:"0.5px solid "+T.line,borderRadius:9,color:T.danger,width:38}}>✕</button>}
        </div>)}
        {haSec.length<6 && <button onClick={()=>setHaSec(p=>[...p,""])} className="tap" style={{fontSize:11.5,color:T.accent,background:"none",border:0,fontWeight:700,marginBottom:12}}>＋ Seçenek ekle</button>}
        <div style={{fontSize:10.5,color:T.textMut,marginBottom:6}}>Süre</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
          {[["Süresiz",0],["1 saat",1],["1 gün",24],["3 gün",72],["1 hafta",168]].map(([l,v])=><span key={v} onClick={()=>setHaSaat(v)} className="tap" style={{fontSize:11.5,padding:"7px 12px",borderRadius:9,fontWeight:700,cursor:"pointer",background:haSaat===v?T.accent:T.bg2,color:haSaat===v?T.bg0:T.textSoft,border:"0.5px solid "+T.line}}>{l}</span>)}
        </div>
        <button onClick={hizliAnketOlustur} disabled={haYuk} className="tap" style={{width:"100%",background:T.accent,color:T.bg0,border:0,borderRadius:11,padding:"12px",fontSize:13,fontWeight:800,opacity:haYuk?.6:1}}>🚀 Yayınla — {aktifTakimId?"bu takım sohbetine":kulupMod?"bu kulübe":"bu ligin tüm takımlarına"}</button>
        <div style={{fontSize:10,color:T.textMut,marginTop:9,textAlign:"center"}}>Detaylı ayar (gizli oy, çoklu seçim, yorum vb.) için Admin → 🗳️ Anket.</div>
      </div>
    </div>}

    {/* ===== MODERASYON MODALI (mesaj) ===== */}
    {modHedef && <div onClick={()=>setModHedef(null)} style={{position:"fixed",inset:0,background:"rgba(3,6,12,.66)",zIndex:70,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:460,background:T.bg1,borderTop:"1px solid "+T.line,borderTopLeftRadius:18,borderTopRightRadius:18,padding:16,maxHeight:"85vh",overflowY:"auto"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}><span style={{fontSize:16}}>🛡</span><b style={{fontSize:14}}>Moderasyon</b><span onClick={()=>setModHedef(null)} className="tap" style={{marginLeft:"auto",color:T.textMut,fontSize:20,cursor:"pointer"}}>×</span></div>
        <div style={{background:T.bg2,border:"0.5px solid "+T.line,borderRadius:10,padding:"9px 12px",marginBottom:10}}>
          <div style={{fontSize:11,color:T.textMut}}>{modHedef.ad||"Kullanıcı"}</div>
          <div style={{fontSize:12.5,color:T.textSoft,marginTop:2,wordBreak:"break-word"}}>{modHedef.metin||(modHedef.medya_tip==="foto"?"📷 Görsel":modHedef.medya_tip==="ses"?"🎤 Ses":"")}</div>
        </div>
        {modIhlal>=2 && <div style={{fontSize:11,color:T.gold,background:T.gold+"12",border:"0.5px solid "+T.gold+"40",borderRadius:9,padding:"8px 11px",marginBottom:10,lineHeight:1.5}}>🧭 Bu kullanıcının son 30 günde <b>{modIhlal}</b> ihlali var. Önerilen: {modIhlal>=4?"7 gün susturma":"24 saat susturma"} (karar sizde).</div>}
        <div style={{fontSize:10.5,color:T.textMut,marginBottom:5}}>Sebep</div>
        <select value={modSebep} onChange={e=>setModSebep(e.target.value)} style={{width:"100%",background:T.bg2,border:"0.5px solid "+T.line,borderRadius:9,padding:"9px 11px",color:T.text,fontFamily:"inherit",fontSize:12.5,marginBottom:12}}>
          {["Küfür / hakaret","Tartışmayı bozma","Spam","Reklam","Tehdit","Uygunsuz içerik","Konu dışı mesaj","Diğer"].map(s=><option key={s}>{s}</option>)}
        </select>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
          <button onClick={()=>modIslem('uyari')} className="tap" style={{background:T.gold,color:"#221800",border:0,borderRadius:10,padding:"10px",fontSize:12,fontWeight:800}}>⚠️ Uyar</button>
          <button onClick={()=>modMesaj('sil')} className="tap" style={{background:T.bg2,color:T.danger,border:"0.5px solid "+T.danger+"55",borderRadius:10,padding:"10px",fontSize:12,fontWeight:800}}>🗑 Mesajı sil</button>
          <button onClick={()=>modMesaj(modHedef.gizli?'goster':'gizle')} className="tap" style={{background:T.bg2,color:T.text,border:"0.5px solid "+T.line,borderRadius:10,padding:"10px",fontSize:12,fontWeight:700}}>{modHedef.gizli?"👁 Geri göster":"🙈 Gizle"}</button>
          <button onClick={()=>modIslem('mute',1)} className="tap" style={{background:T.bg2,color:T.text,border:"0.5px solid "+T.line,borderRadius:10,padding:"10px",fontSize:12,fontWeight:700}}>🔇 1 saat sustur</button>
          <button onClick={()=>modIslem('mute',24)} className="tap" style={{background:T.bg2,color:T.text,border:"0.5px solid "+T.line,borderRadius:10,padding:"10px",fontSize:12,fontWeight:700}}>🔇 24 saat</button>
          <button onClick={()=>modIslem('mute',168)} className="tap" style={{background:T.bg2,color:T.text,border:"0.5px solid "+T.line,borderRadius:10,padding:"10px",fontSize:12,fontWeight:700}}>🔇 7 gün</button>
          <button onClick={()=>{ if(confirm("Bu kullanıcı bu sohbetten KALICI engellensin mi? (Hesabı kapanmaz)")) modIslem('ban'); }} className="tap" style={{gridColumn:"1 / span 2",background:T.danger,color:"#210606",border:0,borderRadius:10,padding:"10px",fontSize:12,fontWeight:800}}>⛔ Sohbetten kalıcı engelle</button>
        </div>
        <div style={{fontSize:10,color:T.textMut,marginTop:10,textAlign:"center"}}>Ceza yalnız bu {scopeTakim?"takım":scopeKulup?"kulüp":"lig"} sohbetini etkiler. Hesap/maç/istatistik etkilenmez.</div>
      </div>
    </div>}

    {/* ===== KANAL AYARI (yavaş mod / sadece yönetici) ===== */}
    {modAyarAcik && <div onClick={()=>setModAyarAcik(false)} style={{position:"fixed",inset:0,background:"rgba(3,6,12,.66)",zIndex:70,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:400,background:T.bg1,border:"1px solid "+T.line,borderRadius:16,padding:16}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}><span style={{fontSize:16}}>🛡</span><b style={{fontSize:14}}>Sohbet Ayarı</b><span onClick={()=>setModAyarAcik(false)} className="tap" style={{marginLeft:"auto",color:T.textMut,fontSize:20,cursor:"pointer"}}>×</span></div>
        <div style={{fontSize:11,color:T.textMut,marginBottom:6}}>🐢 Yavaş mod (mesaj aralığı)</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
          {[["Kapalı",0],["10 sn",10],["30 sn",30],["1 dk",60],["5 dk",300]].map(([l,v])=><button key={v} onClick={()=>ayarKaydet(v, (kanalAyar&&kanalAyar.sadece_yonetici)||false)} className="tap" style={{fontSize:11.5,padding:"7px 12px",borderRadius:9,fontWeight:700,background:((kanalAyar&&kanalAyar.yavas_sn)||0)===v?T.accent:T.bg2,color:((kanalAyar&&kanalAyar.yavas_sn)||0)===v?T.bg0:T.textSoft,border:"0.5px solid "+T.line}}>{l}</button>)}
        </div>
        <div onClick={()=>ayarKaydet((kanalAyar&&kanalAyar.yavas_sn)||0, !(kanalAyar&&kanalAyar.sadece_yonetici))} className="tap" style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",cursor:"pointer"}}>
          <div style={{flex:1}}><div style={{fontSize:12.5,fontWeight:700}}>🔒 Sadece yöneticiler yazabilir</div><div style={{fontSize:10.5,color:T.textMut}}>Normal üyeler okur ama yazamaz</div></div>
          <div style={{width:38,height:22,borderRadius:20,background:(kanalAyar&&kanalAyar.sadece_yonetici)?T.accent:"#25324a",position:"relative"}}><i style={{position:"absolute",top:2,left:(kanalAyar&&kanalAyar.sadece_yonetici)?18:2,width:18,height:18,borderRadius:"50%",background:"#fff",display:"block",transition:".2s"}}/></div>
        </div>
        <div style={{fontSize:10,color:T.textMut,marginTop:8,textAlign:"center"}}>Yalnız bu sohbeti etkiler.</div>
      </div>
    </div>}
  </div>;
}

function PazarSayfa({T, git, oturum, turnuvalar, ilkTip}){
  const [tab,setTab]=useState(ilkTip==="eksik"?"eksik":ilkTip==="oyuncu"?"oyuncu":"rakip");
  const [sehir,setSehir]=useState("");
  const [rakip,setRakip]=useState([]);
  const [eksik,setEksik]=useState([]);
  const [oyuncu,setOyuncu]=useState([]);
  const [transfer,setTransfer]=useState([]);
  const [yuk,setYuk]=useState(true);
  const [yeni,setYeni]=useState(["rakip","eksik","oyuncu"].includes(ilkTip)?ilkTip:null); // create modal tipi
  const [ilanlarim,setIlanlarim]=useState([]);
  const [yonetIlan,setYonetIlan]=useState(null); // yanıtları yönetilen ilan
  const benad=(oturum&&((oturum.user_metadata&&oturum.user_metadata.ad)||oturum.email.split("@")[0]))||"Bir kullanıcı";
  // Kullanıcının yönettiği/oynadığı takımlar (ilan açmak için)
  const benimTakimlar=useMemo(()=>{ const arr=[]; (turnuvalar||[]).forEach(t=>(t.takimlar||[]).forEach(tk=>{ const yetkili = oturum && (tk.yonetici_id===oturum.id || (tk.oyuncular||[]).some(o=>o.sahip_user_id===oturum.id)); if(yetkili) arr.push({takim_id:tk.id,takim_ad:tk.ad,takim_logo:tk.logo||null,takim_renk:tk.renk||null,lig_id:t.id,lig_ad:t.ad,sehir:t.sehir||""}); })); return arr; },[turnuvalar,oturum]);

  const yenile=async()=>{ setYuk(true);
    if(tab==="rakip") setRakip(await Db.ilanlar("rakip", sehir||null));
    else if(tab==="eksik") setEksik(await Db.ilanlar("eksik", sehir||null));
    else { setOyuncu(await Db.ilanlar("oyuncu", sehir||null)); setTransfer(await Db.pazarOyuncular(sehir||null)); }
    setYuk(false);
  };
  const ilanlarimYenile=async()=>{ if(oturum) setIlanlarim(await Db.ilanlarim(oturum.id)); };
  useEffect(()=>{ yenile(); },[tab]);
  useEffect(()=>{ ilanlarimYenile(); },[]);

  const yanitla=async(il, mesaj)=>{ if(!oturum){ alert("Yanıt için giriş yap."); return; } const r=await Db.ilanYanitVer(il.id, benad, mesaj||null); if(r.ok){ alert(il.tip==="rakip"?"🆚 Meydan okundu! İlan sahibine bildirim gitti.":il.tip==="oyuncu"?"📞 İlgilendiğini bildirdin! Oyuncuya bildirim gitti.":"🙋 'Geliyorum' dedin! Kaptana bildirim gitti."); } else alert(r.hata||"Gönderilemedi"); };

  const TAB=({k,ik,l})=> <button onClick={()=>setTab(k)} className="tap" style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,background:tab===k?T.accent+"1e":T.bg1,border:"0.5px solid "+(tab===k?T.accent:T.line),color:tab===k?T.accent:T.textMut,borderRadius:12,padding:"10px 4px",fontSize:12.5,fontWeight:700}}>{ik} {l}</button>;
  const zamanKisa=(iso)=>{ try{ if(!iso) return ""; const d=new Date(iso), fark=(Date.now()-d.getTime())/86400000; if(fark<1) return "bugün"; if(fark<2) return "dün"; return Math.floor(fark)+" gün önce"; }catch(e){ return ""; } };
  const beyaz=T.renkCifti&&T.renkCifti[1]==="#FFFFFF";

  const IlanKart=(il)=>{
    const oyuncuMu=il.tip==="oyuncu", acil=il.tip==="eksik";
    const anaRenk=oyuncuMu?(T.accent2||T.accent):acil?T.danger:T.accent;
    const rozet=oyuncuMu?"Maça Gelir":acil?"Oyuncu Arıyor":"Rakip Arıyor";
    const btn=oyuncuMu?"📞 İlgileniyorum":acil?"🙋 Geliyorum":"🆚 Meydan Oku";
    const chip={fontSize:11.5,color:T.text,background:T.bg2||T.bg0,border:"0.5px solid "+T.line,padding:"6px 10px",borderRadius:9};
    return <div key={il.id} style={{position:"relative",overflow:"hidden",background:T.bg1,border:"0.5px solid "+(acil?T.danger+"44":T.line),borderRadius:16,padding:14,marginBottom:11}}>
      <div style={{position:"absolute",inset:0,left:"auto",width:"55%",background:"radial-gradient(90% 120% at 90% 20%,"+anaRenk+"1e,transparent 60%)",pointerEvents:"none"}}/>
      <div style={{position:"relative",zIndex:1}}>
        <div style={{display:"flex",alignItems:"center",gap:11}}>
          {oyuncuMu
            ? <div style={{width:44,height:44,borderRadius:"50%",overflow:"hidden",flexShrink:0}} dangerouslySetInnerHTML={{__html:svgAvatar(il.takim_ad||"?",44,il.takim_logo)}}/>
            : <Logo renk={il.takim_renk||T.accent} ad={il.takim_ad||"?"} logo={il.takim_logo} boy={44}/>}
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:15,fontWeight:800,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{il.takim_ad||(oyuncuMu?"Oyuncu":"Takım")}</div>
            <div style={{fontSize:10.5,color:T.textMut,marginTop:1}}>{oyuncuMu?(il.pozisyon||"Oyuncu"):(il.lig_ad||"halı saha")}</div>
          </div>
          <span style={{flexShrink:0,fontSize:9.5,fontWeight:800,textTransform:"uppercase",letterSpacing:.4,color:anaRenk,background:anaRenk+"1a",border:"0.5px solid "+anaRenk+"55",padding:"3px 8px",borderRadius:20}}>{rozet}</span>
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:7,margin:"12px 0 13px"}}>
          {(acil||oyuncuMu) && <span style={{fontSize:11,fontWeight:800,padding:"6px 10px",borderRadius:9,background:(il.kalici?T.accent:"#c2670f")+"1e",color:il.kalici?T.accent:"#c2670f",border:"0.5px solid "+(il.kalici?T.accent:"#c2670f")+"55"}}>{il.kalici?"🟢 KALICI":"🟠 BU MAÇ"}</span>}
          {acil && il.pozisyon && <span style={chip}>🎯 {il.adet>1?il.adet+" ":""}{il.pozisyon}</span>}
          {oyuncuMu && il.pozisyon && <span style={chip}>🎯 {il.pozisyon}</span>}
          {il.tarih_text && <span style={chip}>🕐 {il.tarih_text}</span>}
          {il.sehir && <span style={chip}>📍 {il.sehir}</span>}
          {il.saha && <span style={chip}>🏟️ {il.saha}</span>}
          {!acil && !oyuncuMu && il.seviye && <span style={chip}>⭐ {il.seviye}</span>}
        </div>
        {il.aciklama && <div style={{fontSize:11.5,color:T.textSoft,fontStyle:"italic",marginBottom:12,lineHeight:1.5}}>"{il.aciklama}"</div>}
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {oturum && il.user_id===oturum.id
            ? <div style={{flex:1,fontSize:11.5,color:T.textMut,textAlign:"center",padding:"11px",background:T.bg2||T.bg0,borderRadius:11}}>Senin ilanın · {zamanKisa(il.olusma)}</div>
            : <button onClick={()=>yanitla(il, null)} className="tap" style={{flex:1,background:anaRenk,color:acil?"#fff":(beyaz?"#fff":T.bg0),border:0,borderRadius:11,padding:12,fontSize:13.5,fontWeight:800}}>{btn}</button>}
        </div>
      </div>
    </div>;
  };

  return <div className="fade-in" style={{paddingBottom:96}}>
    <div className="vav-hero" style={{position:"relative",overflow:"hidden",padding:"20px 16px 14px",background:"linear-gradient(120deg,"+T.accent+"33 0%,"+T.bg0+" 45%,"+T.gold+"1f 75%,"+T.bg0+")"}}>
      <div className="vav-supurme"/>
      <div style={{position:"relative",display:"flex",alignItems:"center",gap:12}}>
        {git && <span onClick={()=>git({sayfa:"ligler"})} className="tap" style={{fontSize:22,color:T.textSoft}}>‹</span>}
        <div className="vav-suzul" style={{width:44,height:44,borderRadius:13,background:T.accent+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>🛒</div>
        <div style={{minWidth:0}}><div style={{fontSize:11,color:T.accent,letterSpacing:1,fontWeight:700}}>İLAN PANOSU</div><div style={{fontSize:20,fontWeight:800,color:T.text,fontFamily:T.fontDisplay,lineHeight:1.1}}>Pazar</div></div>
      </div>
    </div>

    <div style={{padding:"12px 14px 0",display:"flex",gap:7}}>
      <TAB k="rakip" ik="🆚" l="Rakip Bul"/>
      <TAB k="eksik" ik="🙋" l="Eksik Oyuncu"/>
      <TAB k="oyuncu" ik="🏃" l="Maça Katıl"/>
    </div>

    {oturum && ilanlarim.length>0 && <div style={{padding:"12px 14px 0"}}>
      <div onClick={()=>setYonetIlan(yonetIlan==="list"?null:"list")} className="tap" style={{display:"flex",alignItems:"center",gap:8,background:T.gold+"14",border:"0.5px solid "+T.gold+"44",borderRadius:12,padding:"10px 13px",fontSize:12.5,color:T.gold,fontWeight:700}}>
        📋 İlanlarım ({ilanlarim.filter(i=>i.durum==="aktif").length} aktif) <span style={{marginLeft:"auto"}}>{yonetIlan==="list"?"▲":"▼"}</span>
      </div>
      {yonetIlan==="list" && <div style={{marginTop:8}}>{ilanlarim.map(i=>
        <div key={i.id} style={{display:"flex",alignItems:"center",gap:10,background:T.bg1,border:"0.5px solid "+T.line,borderRadius:11,padding:"10px 12px",marginBottom:6}}>
          <span style={{fontSize:16}}>{i.tip==="rakip"?"🆚":i.tip==="oyuncu"?"🏃":"🙋"}</span>
          <div style={{flex:1,minWidth:0}}><div style={{fontSize:12.5,color:T.text,fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{i.takim_ad} · {i.tip==="rakip"?"rakip":i.tip==="oyuncu"?"maça katıl":i.pozisyon||"oyuncu"}</div><div style={{fontSize:10,color:i.durum==="aktif"?T.accent:T.textMut}}>{i.durum==="aktif"?"aktif":"kapandı"} · {zamanKisa(i.olusma)}</div></div>
          <button onClick={()=>setYonetIlan(i)} className="tap" style={{fontSize:11,color:T.accent2,background:"none",border:"0.5px solid "+T.line,borderRadius:8,padding:"5px 9px",fontWeight:700}}>Yanıtlar</button>
          {i.durum==="aktif" && <button onClick={async()=>{ if(confirm("İlanı kapat?")){ await Db.ilanKapat(i.id); ilanlarimYenile(); yenile(); } }} className="tap" style={{fontSize:11,color:T.textMut,background:"none",border:"0.5px solid "+T.line,borderRadius:8,padding:"5px 9px"}}>Kapat</button>}
        </div>
      )}</div>}
    </div>}

    <div style={{padding:"12px 14px"}}>
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        <input value={sehir} onChange={e=>setSehir(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter") yenile(); }} placeholder="Şehir ara (ör: İstanbul)" style={{flex:1,background:T.bg1,border:"0.5px solid "+T.line,borderRadius:10,padding:"10px 13px",color:T.text,fontSize:13,outline:"none",fontFamily:"inherit"}}/>
        <button onClick={()=>yenile()} className="tap" style={{background:T.accent,color:beyaz?"#fff":T.bg0,border:0,borderRadius:10,padding:"0 16px",fontSize:13,fontWeight:800}}>Ara</button>
      </div>

      {oturum && (()=>{ const r=tab==="eksik"?T.danger:tab==="oyuncu"?(T.accent2||T.accent):T.accent; return <button onClick={()=>setYeni(tab)} className="tap" style={{width:"100%",marginBottom:12,background:r+"18",color:r,border:"1px solid "+r+"55",borderRadius:12,padding:12,fontSize:13.5,fontWeight:800}}>{tab==="eksik"?"+ Eksik Oyuncu İlanı Ver":tab==="oyuncu"?"+ Ben Oyuncuyum · Maça Gelirim":"+ Rakip İlanı Ver"}</button>; })()}

      {yuk ? <div style={{textAlign:"center",color:T.textMut,fontSize:12,padding:30}}>Yükleniyor…</div>
       : tab==="rakip" ? (rakip.length?rakip.map(IlanKart):<BosPazar T={T} ik="🆚" metin="Şu an rakip arayan takım yok." alt="İlk ilanı sen ver!"/>)
       : tab==="eksik" ? (eksik.length?eksik.map(IlanKart):<BosPazar T={T} ik="🙋" metin="Şu an oyuncu arayan takım yok." alt="Maça oyuncu lazımsa ilan ver."/>)
       : <>
          {oyuncu.map(IlanKart)}
          {transfer.length>0 && <div style={{fontSize:11,color:T.textMut,fontWeight:700,margin:"6px 2px 8px"}}>🔁 KART SAHİBİ MÜSAİT OYUNCULAR</div>}
          {transfer.map(o=>
            <div key={o.player_id} style={{display:"flex",alignItems:"center",gap:12,background:T.bg1,border:"0.5px solid "+T.line,borderRadius:12,padding:"11px 12px",marginBottom:7}}>
              <div style={{width:44,height:44,borderRadius:"50%",overflow:"hidden",flexShrink:0}} dangerouslySetInnerHTML={{__html:svgAvatar(o.ad_soyad,44,o.foto)}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,color:T.text,fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{o.ad_soyad}</div>
                <div style={{fontSize:11,color:T.textMut,marginTop:1}}>{o.poz||"Oyuncu"}{o.musait_sehir?" · 📍 "+o.musait_sehir:""}</div>
                {o.musait_not && <div style={{fontSize:11,color:T.textSoft,marginTop:3,fontStyle:"italic"}}>"{o.musait_not}"</div>}
              </div>
              <div style={{fontSize:9,color:T.gold,fontWeight:700,background:T.gold+"18",borderRadius:6,padding:"2px 7px",flexShrink:0}}>MÜSAİT</div>
            </div>
          )}
          {oyuncu.length===0 && transfer.length===0 && <BosPazar T={T} ik="🏃" metin="Şu an maça gelmek isteyen oyuncu yok." alt="'+ Ben Oyuncuyum' ile ilk ilanı sen ver!"/>}
        </>}
    </div>

    {yeni && <IlanVerModal T={T} tip={yeni} takimlar={benimTakimlar} oturum={oturum} onKapat={()=>setYeni(null)} onOk={()=>{ setYeni(null); yenile(); ilanlarimYenile(); }}/>}
    {yonetIlan && yonetIlan!=="list" && <IlanYanitModal T={T} ilan={yonetIlan} onKapat={()=>{ setYonetIlan("list"); }}/>}
  </div>;
}

function Kuluplerim({T, oturum, git, turnuvalar, embedded, takimKurabilir, adminMi}){
  const [liste,setListe]=React.useState(null);   // null=yükleniyor (senin takımların)
  const [tumListe,setTumListe]=React.useState(null); // tüm takımlar (keşfet/vitrin)
  const [sec,setSec]=React.useState(null);        // seçili kulüp (detay)
  const [kadro,setKadro]=React.useState([]);
  const [kur,setKur]=React.useState(false);       // kur formu açık
  const [ad,setAd]=React.useState(""); const [renk,setRenk]=React.useState("#22E07A");
  const [oy,setOy]=React.useState(""); const [oyMevki,setOyMevki]=React.useState("");
  const [mesaj,setMesaj]=React.useState(""); const [bekle,setBekle]=React.useState(false);
  const [ligSec,setLigSec]=React.useState(false);
  const [davetLink,setDavetLink]=React.useState(""); const [davetKopya,setDavetKopya]=React.useState(false);
  const [duz,setDuz]=React.useState(false); const [dAd,setDAd]=React.useState(""); const [dRenk,setDRenk]=React.useState("");
  const [tz,setTz]=React.useState(null); // tüm-zamanlar istatistik (lig seçmeden)
  const [secModu,setSecModu]=React.useState(false);            // toplu silme seçim modu (admin)
  const [secili2,setSecili2]=React.useState(()=>new Set());    // seçili kulüp id'leri
  const yetkili = takimKurabilir===true; // takım KURMA yetkisi (SADECE admin/lig yöneticisi) — varsayılan kapalı
  const benimKulup = !!(sec && oturum && (sec.benim || adminMi)); // bu takımı YÖNETME yetkisi (sahip/admin)
  const yenile=async()=>{ if(!oturum) return; const l=await Db.takimlarim(oturum.id); setListe(l); Db.tumTakimlar().then(setTumListe); };
  React.useEffect(()=>{ yenile(); },[oturum]);
  const kadroYukle=async(k)=>{ setSec(k); setKadro([]); setDavetLink(""); setDuz(false); setTz(null); Db.kulupTumZamanlar(k.id).then(setTz); const c=await Db.kulupKadro(k.id); setKadro(c); };
  const kulupKur=async()=>{ const a=(ad||"").trim(); if(!a){ setMesaj("⚠️ Takım adı gerekli"); return; } setBekle(true); const r=await Db.kulupKur(oturum.id,{ad:a,renk}); setBekle(false); if(r&&r.ok){ setAd(""); setKur(false); setMesaj(""); await yenile(); kadroYukle(r.kulup); } else setMesaj("Olmadı: "+((r&&r.hata)||"")); };
  const oyuncuEkle=async()=>{ const a=(oy||"").trim(); if(!a||!sec) return; setBekle(true); const r=await Db.kulupOyuncuEkle(sec.id,a,oyMevki||null,null); setBekle(false); if(r&&r.ok){ setOy(""); setOyMevki(""); kadroYukle(sec); } else setMesaj("Olmadı: "+((r&&r.hata)||"")); };
  const oyuncuCikar=async(p)=>{ if(!sec) return; if(!confirm(p.ad+" oyuncusunu takımdan çıkar? Serbest kalır (istatistikleri korunur).")) return; const r=await Db.kulupOyuncuSerbest(sec.id,p.player_id); if(r&&r.ok){ kadroYukle(sec); setMesaj("✓ "+p.ad+" takımdan çıkarıldı (serbest kaldı, istatistik korundu)"); } else setMesaj("Olmadı: "+((r&&r.hata)||"yetki yok")); };
  const ligeEkle=async(t)=>{ if(!sec) return; setBekle(true); const r=await Db.kulupLigeKatil(sec.id,t.id,null); setBekle(false); setLigSec(false); if(r&&r.ok){ setMesaj("✓ "+sec.ad+" · “"+t.ad+"” ligine eklendi ("+kadro.length+" oyuncu otomatik geldi)"); } else setMesaj("Olmadı: "+((r&&r.hata)||"")); };
  const davetUret=async()=>{ if(!sec) return; setDavetLink("üretiliyor…"); const r=await Db.kulupDavetiUret(sec.id); setDavetLink(r.ok?DAVET_URL(r.token):("Hata: "+(r.hata||""))); setDavetKopya(false); };
  const davetKopyala=()=>{ try{ navigator.clipboard.writeText(davetLink); setDavetKopya(true); setTimeout(()=>setDavetKopya(false),1500); }catch(e){} };
  const duzAc=()=>{ setDAd(sec.ad||""); setDRenk(sec.renk||"#22E07A"); setDuz(true); };
  const kulupLogoSec=async(e)=>{ const f=e.target.files&&e.target.files[0]; if(!f||!sec)return; setBekle(true); const r=await fotoYukle(f,"logo",sec.logo); setBekle(false); e.target.value=""; if(r&&r.url){ await Db.kulupGuncelle(sec.id,{logo:r.url}); sec.logo=r.url; await yenile(); setMesaj("✓ Logo güncellendi"); } else setMesaj("Logo yüklenemedi"); };
  const duzKaydet=async()=>{ const a=(dAd||"").trim(); if(!a) return; setBekle(true); const r=await Db.kulupGuncelle(sec.id,{ad:a,renk:dRenk}); setBekle(false); if(r&&r.ok){ sec.ad=a; sec.renk=dRenk; setDuz(false); await yenile(); setMesaj("✓ Takım güncellendi"); } else setMesaj("Olmadı: "+((r&&r.hata)||"")); };
  // Tekil kalıcı silme (admin herhangi bir takımı; sahip kendi takımını)
  const takimSil=async(k)=>{ if(!confirm('"'+(k.ad||'Takım')+'" KALICI silinsin mi?'+(adminMi?'\n\nLigdeki maçları dahil TÜM verisi silinecek. ':'\n\n')+'Bu işlem geri alınamaz.')) return; setBekle(true); const r=await Db.kulupSil(k.id); setBekle(false); if(r&&r.ok){ setSec(null); await yenile(); setMesaj("✓ Takım silindi"); } else setMesaj("Olmadı: "+((r&&r.hata)||"yetki yok")); };
  // Toplu silme (sadece admin)
  const secTogle=(id)=>setSecili2(s=>{ const n=new Set(s); n.has(id)?n.delete(id):n.add(id); return n; });
  const topluSil=async()=>{ const ids=[...secili2]; if(!ids.length) return; if(!confirm(ids.length+" takım KALICI silinsin mi?\n\nLigdeki maçları dahil tüm verileri silinecek. Bu işlem geri alınamaz.")) return; setBekle(true); const r=await Db.kulupTopluSil(ids); setBekle(false); if(r&&r.ok){ setSecili2(new Set()); setSecModu(false); await yenile(); setMesaj("✓ "+r.adet+" takım silindi"); } else setMesaj("Olmadı: "+((r&&r.hata)||"yetki yok")); };
  const benimLiglerim=(turnuvalar||[]).filter(t=>t && (t.yoneticiId===(oturum&&oturum.id) || t.yonetici_id===(oturum&&oturum.id)));
  const IN={width:"100%",boxSizing:"border-box",background:T.bg1,border:"0.5px solid "+T.line,borderRadius:11,padding:"11px 12px",color:T.text,fontSize:14,fontFamily:"inherit",outline:"none"};
  const BTN={background:T.accent,color:(T.renkCifti&&T.renkCifti[1]==="#FFFFFF")?"#fff":T.bg0,border:0,borderRadius:11,padding:"11px 15px",fontSize:13,fontWeight:800,cursor:"pointer"};
  const KART=(c)=>{ const rk=c.renk||T.accent; const secli=secili2.has(c.id);
    const onCard=()=>{ if(secModu) secTogle(c.id); else kadroYukle(c); };
    return <div key={c.id} onClick={onCard} className="tap" style={{display:"flex",alignItems:"center",gap:12,background:secli?T.danger+"14":T.bg1,border:(secli?"1px solid "+T.danger:"0.5px solid "+T.line),borderRadius:14,padding:13,marginBottom:9,cursor:"pointer"}}>
    {secModu && <span style={{width:22,height:22,borderRadius:6,border:"2px solid "+(secli?T.danger:T.line),background:secli?T.danger:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"#fff",flexShrink:0,fontWeight:800}}>{secli?"✓":""}</span>}
    <div style={{width:40,height:40,borderRadius:11,background:rk+"26",color:rk,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,fontWeight:800,flexShrink:0}}>{(c.ad||"K")[0].toUpperCase()}</div>
    <div style={{flex:1,minWidth:0}}><div style={{fontSize:15,fontWeight:800,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.ad}</div><div style={{fontSize:11,color:c.benim?T.textMut:(c.katildi?T.accent2:T.textMut)}}>{c.benim?"Takımın · kalıcı":c.katildi?"⚽ Oyuncu olarak katıldın":"Takım · görüntüle"}</div></div>
    <span style={{color:T.textMut,fontSize:20}}>{secModu?"":"›"}</span>
  </div>; };

  return <div style={{maxWidth:520,margin:"0 auto",padding:embedded?"4px 0 40px":"14px 14px 90px"}}>
    {(sec || !embedded) && <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
      <span onClick={()=>sec?setSec(null):git({sayfa:"profil"})} className="tap" style={{fontSize:22,color:T.textSoft,cursor:"pointer"}}>‹</span>
      <span style={{flex:1,fontSize:19,fontWeight:800,color:T.text,fontFamily:T.fontDisplay,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{sec?sec.ad:"🛡️ Takımlar"}</span>
      {sec && benimKulup && !duz && <button onClick={duzAc} className="tap" style={{background:"none",border:"0.5px solid "+T.line,color:T.textSoft,borderRadius:9,padding:"6px 10px",fontSize:12,fontWeight:700}}>✏️ Düzenle</button>}
    </div>}
    {mesaj && <div style={{fontSize:12.5,color:mesaj[0]==="✓"?T.accent:T.gold,marginBottom:11,lineHeight:1.5}}>{mesaj}</div>}

    {/* SÜPER ADMIN — toplu takım silme (ligde olan/olmayan tüm takımlar) */}
    {!sec && adminMi && <div style={{display:"flex",gap:8,marginBottom:11}}>
      <button onClick={()=>{ setSecModu(m=>!m); setSecili2(new Set()); }} className="tap" style={{flex:secModu?"0 0 auto":1,background:secModu?T.bg2:T.bg1,color:secModu?T.textSoft:T.danger,border:"0.5px solid "+(secModu?T.line:T.danger+"55"),borderRadius:11,padding:"10px 14px",fontSize:12.5,fontWeight:800,cursor:"pointer"}}>{secModu?"Vazgeç":"🗑 Toplu Sil"}</button>
      {secModu && <button onClick={topluSil} disabled={!secili2.size||bekle} className="tap" style={{flex:1,background:secili2.size?T.danger:T.bg2,color:secili2.size?"#fff":T.textMut,border:0,borderRadius:11,padding:"10px 14px",fontSize:12.5,fontWeight:800,cursor:secili2.size?"pointer":"not-allowed",opacity:bekle?.6:1}}>{bekle?"Siliniyor…":"Seçilenleri Sil ("+secili2.size+")"}</button>}
    </div>}

    {!sec ? <>
      {liste===null ? <div style={{color:T.textMut,fontSize:13,padding:20,textAlign:"center"}}>Yükleniyor…</div> : <>
        {liste.length>0 && <div style={{fontSize:11,color:T.textMut,fontWeight:700,letterSpacing:.5,margin:"2px 2px 8px",textTransform:"uppercase"}}>Takımlarım</div>}
        {liste.length===0 && !kur && <div style={{textAlign:"center",padding:"18px 10px 4px",color:T.textMut}}><div style={{fontSize:32,marginBottom:6}}>🛡️</div><div style={{fontSize:13,color:T.textSoft,lineHeight:1.6}}>{yetkili?"Henüz takımın yok — aşağıdan kur.":"Henüz bir takıma katılmadın. Aşağıdaki takımlara göz atabilir, davet linkiyle katılabilirsin."}</div></div>}
        {liste.map(KART)}
        {kur ? <div style={{background:T.bg1,border:"1px solid "+T.line,borderRadius:14,padding:14,marginTop:6}}>
          <input value={ad} onChange={e=>setAd(e.target.value)} placeholder="Takım adı · örn. Şimşekler FC" style={IN}/>
          <div style={{display:"flex",alignItems:"center",gap:10,margin:"11px 0"}}>
            <span style={{fontSize:12,color:T.textMut,fontWeight:700}}>Renk</span>
            {["#22E07A","#3B9EFF","#FF5252","#E5B84B","#A855F7","#FF7A1A"].map(c=><span key={c} onClick={()=>setRenk(c)} className="tap" style={{width:26,height:26,borderRadius:8,background:c,cursor:"pointer",border:renk===c?"2px solid "+T.text:"2px solid transparent"}}/>)}
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={kulupKur} disabled={bekle} style={{...BTN,flex:1}}>{bekle?"…":"Takımı oluştur"}</button>
            <button onClick={()=>{setKur(false);setMesaj("");}} style={{background:T.bg2,color:T.textSoft,border:"1px solid "+T.line,borderRadius:11,padding:"11px 15px",fontSize:13,fontWeight:700}}>İptal</button>
          </div>
        </div> : (yetkili
          ? <button onClick={()=>{setKur(true);setMesaj("");}} className="tap" style={{...BTN,width:"100%",marginTop:6}}>＋ Takım Kur</button>
          : <button title="Takım oluşturma yetkiniz bulunmuyor." aria-disabled="true" onClick={e=>{e.preventDefault();e.stopPropagation();}} style={{...BTN,width:"100%",marginTop:6,opacity:.4,cursor:"not-allowed"}}>＋ Takım Kur</button>)}
        {/* TÜM TAKIMLAR — liglerdeki takımlar (demo/evren dahil), tıkla → takım sayfası (oyuncular gibi) */}
        {!secModu && (()=>{ const seen=new Set(); const ligTak=[];
          (turnuvalar||[]).forEach(t=>{ if(!t) return; (t.takimlar||[]).forEach(tk=>{ if(!tk) return; const key=String(tk.id||(tk.ad+"@"+t.id)); if(seen.has(key)) return; seen.add(key); ligTak.push({tk,t}); }); });
          // ayrıca lige bağlı olmayan kulüpleri de göster (varsa)
          const mineIds=new Set((liste||[]).map(c=>c.id)); const kulupTak=(tumListe||[]).filter(c=>c&&!mineIds.has(c.id));
          if(!ligTak.length && !kulupTak.length) return null;
          return <div style={{marginTop:18}}>
            <div style={{fontSize:11,color:T.textMut,fontWeight:700,letterSpacing:.5,margin:"2px 2px 8px",textTransform:"uppercase"}}>Tüm Takımlar · {ligTak.length+kulupTak.length}</div>
            {ligTak.map(({tk,t})=><div key={String(tk.id)+"@"+t.id} onClick={()=>git({sayfa:"takim",takim:tk,turnuva:t})} className="tap kart-hover" style={{display:"flex",alignItems:"center",gap:12,background:T.bg1,border:"0.5px solid "+T.line,borderRadius:14,padding:13,marginBottom:9,cursor:"pointer"}}>
              <Logo renk={tk.renk} ad={tk.ad} logo={tk.logo} renk2={tk.renk2} boy={40}/>
              <div style={{flex:1,minWidth:0}}><div style={{fontSize:15,fontWeight:800,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{tk.ad}</div><div style={{fontSize:11,color:T.textMut,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>🏆 {t.ad}{tk.oyuncular?" · "+tk.oyuncular.length+" oyuncu":""}</div></div>
              <span style={{color:T.textMut,fontSize:20}}>›</span>
            </div>)}
            {kulupTak.map(KART)}
          </div>;
        })()}
      </>}
    </> : <>
      {/* DÜZENLE (ad/renk/logo) — süper admin/yönetici */}
      {duz && <div style={{background:T.bg1,border:"1px solid "+T.line,borderRadius:12,padding:12,marginBottom:12}}>
        <input value={dAd} onChange={e=>setDAd(e.target.value)} placeholder="Takım adı" style={IN}/>
        <div style={{display:"flex",alignItems:"center",gap:8,margin:"10px 0"}}>
          <span style={{fontSize:12,color:T.textMut,fontWeight:700}}>Renk</span>
          {["#22E07A","#3B9EFF","#FF5252","#E5B84B","#A855F7","#FF7A1A"].map(c=><span key={c} onClick={()=>setDRenk(c)} className="tap" style={{width:24,height:24,borderRadius:7,background:c,cursor:"pointer",border:dRenk===c?"2px solid "+T.text:"2px solid transparent"}}/>)}
          <label className="tap" style={{marginLeft:"auto",fontSize:11,color:T.accent,border:"0.5px solid "+T.line,borderRadius:8,padding:"6px 10px",cursor:"pointer"}}>{sec.logo?"🖼️ Logo":"📷 Logo"}<input type="file" accept="image/*" onChange={kulupLogoSec} style={{display:"none"}}/></label>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={duzKaydet} disabled={bekle} style={{...BTN,flex:1}}>{bekle?"…":"Kaydet"}</button>
          <button onClick={()=>setDuz(false)} style={{background:T.bg2,color:T.textSoft,border:"1px solid "+T.line,borderRadius:11,padding:"11px 15px",fontSize:13,fontWeight:700}}>İptal</button>
        </div>
      </div>}
      {/* TÜM ZAMANLAR İSTATİSTİK — lig seçmeden, doğrudan */}
      {tz && tz.mac>0 ? <div style={{background:"linear-gradient(135deg,"+T.gold+"12,"+T.bg1+")",border:"0.5px solid "+T.gold+"33",borderRadius:14,padding:"13px 14px",marginBottom:14}}>
        <div style={{fontSize:11,color:T.gold,fontWeight:800,letterSpacing:.3,marginBottom:10}}>📊 TÜM ZAMANLAR</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
          {[["Maç",tz.mac,T.text],["Galibiyet",tz.galibiyet,T.accent],["Beraberlik",tz.beraberlik,T.textSoft],["Mağlubiyet",tz.maglubiyet,T.danger],["Attığı",tz.atilan,T.accent],["Yediği",tz.yenen,T.danger]].map(([k,v,c],i)=>
            <div key={i} style={{background:T.bg0,borderRadius:10,padding:"9px 6px",textAlign:"center"}}>
              <div style={{fontSize:18,fontWeight:900,color:c,fontFamily:T.fontDisplay}}>{v}</div>
              <div style={{fontSize:8.5,color:T.textMut,marginTop:1}}>{k}</div>
            </div>)}
        </div>
        <div style={{fontSize:9.5,color:T.textMut,marginTop:8,textAlign:"center"}}>Averaj {tz.atilan-tz.yenen>=0?"+":""}{tz.atilan-tz.yenen} · tüm sezonların toplamı</div>
      </div> : null}
      {/* TAKIM SOHBETİ — lige bağlı değil, sadece kadro + admin */}
      {oturum && (benimKulup || sec.katildi) && <button onClick={()=>git({sayfa:"sohbet",kulup:sec})} className="tap" style={{width:"100%",display:"flex",alignItems:"center",gap:10,background:T.accent2,color:(T.renkCifti&&T.renkCifti[1]==="#FFFFFF")?"#fff":T.bg0,border:0,borderRadius:12,padding:"12px 14px",marginBottom:14,fontWeight:800}}>
        <span style={{fontSize:16}}>💬</span>
        <span style={{flex:1,textAlign:"left",minWidth:0}}><span style={{display:"block",fontSize:13.5}}>Takım Sohbeti →</span><span style={{display:"block",fontSize:10,opacity:.85,fontWeight:600}}>sadece bu takımın oyuncuları · lig gerekmez</span></span>
      </button>}
      {/* DETAYLI TAKIM SAYFASI — zengin sekmeli/istatistik sayfası (ligde oynayınca) */}
      {(()=>{ const gr=(turnuvalar||[]).map(t=>{ const tk=(t.takimlar||[]).find(x=>x&&x.kulup_id===sec.id); return tk?{t, tk}:null; }).filter(Boolean);
        if(gr.length) return <div style={{marginBottom:14}}>
          {gr.map(({t,tk})=><button key={t.id} onClick={()=>git({sayfa:"takim",takim:tk,turnuva:t})} className="tap" style={{width:"100%",display:"flex",alignItems:"center",gap:10,background:T.accent,color:(T.renkCifti&&T.renkCifti[1]==="#FFFFFF")?"#fff":T.bg0,border:0,borderRadius:12,padding:"12px 14px",marginBottom:7,fontWeight:800}}>
            <span style={{fontSize:16}}>📊</span>
            <span style={{flex:1,textAlign:"left",minWidth:0}}><span style={{display:"block",fontSize:13.5}}>Detaylı Takım Sayfası →</span><span style={{display:"block",fontSize:10,opacity:.85,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.ad} · kadro · istatistik · maçlar</span></span>
          </button>)}
        </div>;
        return <div style={{marginBottom:14,background:T.bg1,border:"0.5px dashed "+T.line,borderRadius:12,padding:"11px 13px",fontSize:11,color:T.textMut,lineHeight:1.5}}>📊 <b>Detaylı istatistik sayfası</b> (sekmeler · maçlar) bu takım <b>bir ligde oynayınca</b> açılır.{benimKulup?" Aşağıdan lige ekle → maç oyna → dolsun.":""}</div>;
      })()}
      {/* KADRO */}
      <div style={{fontSize:11,color:T.textMut,fontWeight:700,letterSpacing:.5,margin:"2px 2px 8px",textTransform:"uppercase"}}>Kadro · {kadro.length} oyuncu</div>
      {kadro.map(p=><div key={p.player_id} style={{display:"flex",alignItems:"center",gap:10,background:T.bg1,border:"0.5px solid "+T.line,borderRadius:11,padding:"9px 11px",marginBottom:6}}>
        <div style={{width:26,height:26,borderRadius:"50%",overflow:"hidden",flexShrink:0}} dangerouslySetInnerHTML={{__html:svgAvatar(p.ad,26,p.foto)}}/>
        <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:700,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.ad}</div>{p.mevki&&<div style={{fontSize:10,color:T.textMut}}>{p.mevki}</div>}</div>
        {benimKulup && <span onClick={()=>oyuncuCikar(p)} className="tap" style={{fontSize:11,color:T.danger,cursor:"pointer",padding:"4px 6px"}}>✕</span>}
      </div>)}
      {kadro.length===0 && <div style={{fontSize:11.5,color:T.textMut,textAlign:"center",padding:"10px 0"}}>Kadro boş. {benimKulup?"Davet linkiyle oyuncu ekleyebilirsin.":""}</div>}
      {/* isim yaz-ekle — sadece yönetici */}
      {benimKulup && <div style={{display:"flex",gap:7,marginTop:8}}>
        <input value={oy} onChange={e=>setOy(e.target.value)} placeholder="✏️ İsim yaz, ekle" style={{...IN,flex:2}}/>
        <input value={oyMevki} onChange={e=>setOyMevki(e.target.value)} placeholder="Mevki" style={{...IN,flex:1,minWidth:0}}/>
        <button onClick={oyuncuEkle} disabled={bekle} style={{...BTN,padding:"11px 14px"}}>＋</button>
      </div>}
      {/* DAVET LİNKİ — oyuncular kendi profiliyle takıma kaydolur */}
      {benimKulup && <div style={{marginTop:14,background:"linear-gradient(120deg,"+T.accent2+"14,"+T.bg1+")",border:"0.5px solid "+T.accent2+"44",borderRadius:12,padding:12}}>
        <div style={{fontSize:12.5,fontWeight:800,color:T.text,marginBottom:3}}>🔗 Oyuncu Davet Linki</div>
        <div style={{fontSize:10.5,color:T.textMut,marginBottom:9,lineHeight:1.5}}>Bu linki oyuncuya (WhatsApp) yolla. Açan kişi foto/boy/kilo/doğum/ayak/mevki girip <b>doğrudan bu takıma kaydolur.</b></div>
        {!davetLink ? <button onClick={davetUret} className="tap" style={{...BTN,width:"100%",background:T.accent2,color:"#04070C"}}>Davet Linki Oluştur</button>
          : <div style={{background:T.bg0,border:"0.5px solid "+T.line,borderRadius:9,padding:"9px 10px"}}>
              <div style={{fontSize:10.5,color:T.accent2,wordBreak:"break-all",lineHeight:1.4}}>{davetLink}</div>
              <button onClick={davetKopyala} className="tap" style={{marginTop:7,background:davetKopya?T.accent:T.bg2,color:davetKopya?"#04070C":T.textSoft,border:"0.5px solid "+T.line,borderRadius:8,padding:"6px 12px",fontSize:11,fontWeight:700}}>{davetKopya?"✓ Kopyalandı":"📋 Kopyala"}</button>
            </div>}
      </div>}
      {/* lige ekle — sadece yönetici */}
      {benimKulup && <div style={{marginTop:16,borderTop:"0.5px solid "+T.line,paddingTop:14}}>
        {ligSec ? <div>
          <div style={{fontSize:12,color:T.textMut,fontWeight:700,marginBottom:8}}>Hangi lige? (kadro otomatik gelir)</div>
          {benimLiglerim.length===0 ? <div style={{fontSize:12,color:T.textMut}}>Önce bir lig kurmalısın (Keşfet → + Lig Kur).</div> :
            benimLiglerim.map(t=><div key={t.id} onClick={()=>ligeEkle(t)} className="tap" style={{display:"flex",alignItems:"center",gap:9,background:T.bg1,border:"0.5px solid "+T.line,borderRadius:10,padding:"10px 12px",marginBottom:6,cursor:"pointer"}}><span style={{fontSize:15}}>🏆</span><span style={{flex:1,fontSize:13,fontWeight:700,color:T.text}}>{t.ad}</span><span style={{color:T.accent,fontSize:12,fontWeight:800}}>Ekle</span></div>)}
          <button onClick={()=>setLigSec(false)} style={{background:"none",border:0,color:T.textMut,fontSize:12,marginTop:4,cursor:"pointer"}}>Vazgeç</button>
        </div> : <button onClick={()=>{setLigSec(true);setMesaj("");}} disabled={!kadro.length} className="tap" style={{...BTN,width:"100%",opacity:kadro.length?1:.5}}>🏆 Bu takımla bir lige katıl</button>}
      </div>}
      {/* TAKIMI SİL — kalıcı (admin her takımı; sahip kendi takımını) */}
      {benimKulup && <div style={{marginTop:18,borderTop:"0.5px solid "+T.line,paddingTop:14}}>
        <button onClick={()=>takimSil(sec)} disabled={bekle} className="tap" style={{width:"100%",background:"none",color:T.danger,border:"0.5px solid "+T.danger+"55",borderRadius:12,padding:"12px",fontSize:13,fontWeight:800,cursor:"pointer",opacity:bekle?.6:1}}>🗑 Takımı Kalıcı Sil</button>
        <div style={{fontSize:10,color:T.textMut,textAlign:"center",marginTop:6,lineHeight:1.5}}>{adminMi?"Süper Admin: ligde olan/olmayan tüm takımlar — maç geçmişi dahil silinir.":"Kulüp silinir; lig maç geçmişi korunur."}</div>
      </div>}
    </>}
  </div>;
}

  return { ProfilSayfa, Kesfet, TumEnler, LigGenel, TurnuvaSayfa, KadroEkrani, TakimSayfa, OyuncuSayfa, MacSayfa, MacKurulum, TakipSayfa, Ayarlar, SkorGir, MacSihirbaz, DavetKatil, SohbetSayfa, PazarSayfa, Kuluplerim };
}
