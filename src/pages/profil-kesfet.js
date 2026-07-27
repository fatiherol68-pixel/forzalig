function ProfilSayfa({turnuvalar, T, takipLig, takipOyuncu, takipTakim, git, kapiAc, oturum, cikisYap, sahiplenme, onSahiplenmeBirak, adminMi, profil, destekBilgi}){
  const kariyereGit=()=>{
    if(!sahiplenme) return;
    // yerelde oyuncuyu bul
    let bulunan=null, bulunanT=null;
    turnuvalar.forEach(t=>t.takimlar.forEach(tk=>tk.oyuncular.forEach(o=>{ if(o.id===sahiplenme.oyuncu_id||o.ad===sahiplenme.oyuncu_ad){ bulunan=o; bulunanT=t; } })));
    if(bulunan){ git({sayfa:"oyuncu",oyuncu:{...bulunan,turnuva:bulunanT.ad}}); }
    else if(sahiplenme.lig_slug){ window.location.href=PAYLASIM_URL(sahiplenme.lig_slug); }
  };
  const tumOyuncular=useMemo(()=>Motor.tumOyuncular(turnuvalar),[turnuvalar]);
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
      </> : oturum ? <div style={{margin:"16px 0 0",background:"linear-gradient(120deg,"+T.gold+"12,"+T.bg1+")",border:"0.5px solid "+T.gold+"33",borderRadius:16,padding:"15px 15px"}}>
        <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:6}}><span style={{fontSize:20}}>⚽</span><div style={{fontSize:13,color:T.text,fontWeight:700}}>Henüz bir oyuncu kariyerin yok</div></div>
        <div style={{fontSize:11.5,color:T.textMut,lineHeight:1.55}}>Bir takım davetini kabul edip yönetici onayladığında kariyerin otomatik burada oluşur.</div>
      </div> : null}

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

function Kesfet({turnuvalar, T, git, ligKurAc, ligKurYetki, saltOkunur, yukleniyor, oturum, takimKurabilir, adminMi}){
  const [tab,setTab]=useState("lig");
  const [ara,setAra]=useState("");
  const [sira,setSira]=useState("gol"); // takım/oyuncu sıralama
  const [mevki,setMevki]=useState("hepsi");
  const q=ara.trim().toLocaleLowerCase("tr");
  const aktifTurnuvalar=turnuvalar.filter(t=>t&&(t.durum||'aktif')!=='arsiv'); // arşivlenen (bitmiş) sezonlar katalogda görünmez
  // FAZ 9 — herkese açık (paylaşılan) ligler
  const [acikLigler,setAcikLigler]=useState([]);
  useEffect(()=>{ if(!sb) return; let a=true; Paylas.liste().then(l=>{ if(a) setAcikLigler(l||[]); }); return ()=>{a=false;}; },[]);

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
          {(aktifTurnuvalar.length+acikLigler.length)>0 && <span style={{fontSize:11,fontWeight:700,color:T.accent,background:T.accent+"1e",border:"0.5px solid "+T.accent+"44",padding:"3px 9px",borderRadius:20}}>{aktifTurnuvalar.length+acikLigler.length} Lig</span>}
        </div>
        {ligKurAc && (ligKurYetki
          ? <button onClick={ligKurAc} className="tap" style={{display:"flex",alignItems:"center",gap:6,background:T.accent,color:T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0,border:0,borderRadius:11,padding:"9px 14px",fontSize:12.5,fontWeight:800}}>+ Lig Kur</button>
          : <button title="Lig oluşturma yetkiniz bulunmuyor." aria-disabled="true" onClick={e=>{e.preventDefault();e.stopPropagation();}} style={{display:"flex",alignItems:"center",gap:6,background:T.accent,color:T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0,border:0,borderRadius:11,padding:"9px 14px",fontSize:12.5,fontWeight:800,opacity:.4,cursor:"not-allowed"}}>+ Lig Kur</button>)}
      </div>

      {/* Herkese açık ligler */}
      {acikLigler.filter(l=>!q||((l.ad||"")+" "+(l.sehir||"")).toLocaleLowerCase("tr").includes(q)).map(l=>
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
      {aktifTurnuvalar.length===0 && acikLigler.length===0 && (yukleniyor
        ? <div style={{textAlign:"center",padding:"26px 20px"}}>
            {[0,1].map(i=><div key={i} className="skel" style={{height:76,borderRadius:16,marginBottom:10}}/>)}
            <div style={{fontSize:12,color:T.textMut,marginTop:4}}>⏳ Ligler yükleniyor…</div>
          </div>
        : <div style={{fontSize:12.5,color:T.textMut,textAlign:"center",padding:"30px 20px",lineHeight:1.6}}>Henüz lig yok.<br/>{ligKurAc?"Yukarıdan kendi ligini kurabilirsin.":"Bir lige katıldığında burada görünür."}</div>)}
      {aktifTurnuvalar.filter(t=>!q||((t.ad||"")+" "+(t.sehir||"")).toLocaleLowerCase("tr").includes(q)).map(t=>{
        const oynanan=t.maclar.filter(m=>m.oynandi).length;
        const lider=[...t.takimlar].sort((a,b)=>(b.puan||0)-(a.puan||0))[0];
        const ilkTakimlar=(t.takimlar||[]).slice(0,3);
        return <div key={t.id} onClick={()=>git({sayfa:"turnuva",turnuva:t})} className="tap kart-hover" style={{position:"relative",overflow:"hidden",background:T.bg1,borderRadius:18,padding:14,marginBottom:11,border:"0.5px solid "+T.line,cursor:"pointer"}}>
          <div style={{position:"absolute",inset:0,left:"auto",width:"58%",background:"radial-gradient(90% 120% at 92% 35%,"+(t.renk||T.accent)+"26,transparent 62%)",pointerEvents:"none"}}/>
          <div style={{display:"flex",gap:13,alignItems:"center",position:"relative",zIndex:1}}>
            <Logo renk={t.renk} ad={t.ad} logo={t.logo} renk2={t.renk2} boy={54}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:16,fontWeight:800,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.ad}</div>
              <div style={{display:"flex",gap:12,marginTop:6,flexWrap:"wrap"}}>
                {t.sehir && <span style={{fontSize:11,color:T.textMut}}>📍 {t.sehir}</span>}
                <span style={{fontSize:11,color:T.textMut}}>👥 {t.takimlar.length} takım</span>
                <span style={{fontSize:11,color:T.textMut}}>⚽ {oynanan} maç</span>
              </div>
              {lider && oynanan>0 && <div style={{fontSize:11,color:T.gold,marginTop:6,fontWeight:700}}>🏆 {lider.ad}</div>}
            </div>
            {ilkTakimlar.length>0 && <div style={{display:"flex",flexShrink:0,paddingLeft:4}}>{ilkTakimlar.map((tk,i)=><div key={i} style={{marginLeft:i?-10:0,borderRadius:9,overflow:"hidden",border:"2px solid "+T.bg1}}><Logo renk={tk.renk} ad={tk.ad} logo={tk.logo} renk2={tk.renk2} boy={28}/></div>)}</div>}
            <span style={{fontSize:18,color:T.textMut,flexShrink:0}}>›</span>
          </div>
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
  </div>;
}

function MacSatir({m, T, git}){
  return <div onClick={()=>git({sayfa:"mac",mac:m,turnuva:m._t})} className="tap satir-hover" style={{background:T.bg1,borderRadius:11,padding:"9px 12px",marginBottom:5,border:"0.5px solid "+T.line}}>
    <div style={{fontSize:8,color:T.textMut,marginBottom:5,display:"flex",justifyContent:"space-between"}}>
      <span>{m._lig} · {m.hafta}. hafta</span>
      {(m.tarih||m.saat) && <span style={{color:T.accent}}>{m.tarih?(m.tarih.includes("-")?m.tarih.split("-").reverse().join("."):m.tarih):""}{m.saat?" "+m.saat:""}</span>}
    </div>
    <div style={{display:"flex",alignItems:"center",gap:7}}>
      <Logo renk={m.renkA} ad={m.takimA} boy={20}/>
      <span style={{fontSize:11,color:T.text,flex:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{m.takimA}</span>
      {m.oynandi ? <span style={{fontSize:14,fontWeight:800,color:T.text,fontFamily:T.fontDisplay}}>{m.skorA}-{m.skorB}</span>
        : <span style={{fontSize:11,fontWeight:700,color:T.textMut}}>VS</span>}
      <span style={{fontSize:11,color:T.text,flex:1,textAlign:"right",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{m.takimB}</span>
      <Logo renk={m.renkB} ad={m.takimB} boy={20}/>
    </div>
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

