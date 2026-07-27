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

// ==================== BİLDİRİM MERKEZİ ====================
function BildirimSayfa({T, git, oturum, liste, yenile, takipListe, turnuvalar}){
  const [yuk,setYuk]=useState(false);
  const ikonlar={transfer_istek:"🔄",transfer_onay:"✅",transfer_ret:"🚫",mac:"⚽",sohbet:"💬",duyuru:"📢",katilim:"🙋",rakip_yanit:"🆚",eksik_yanit:"🙋",oyuncu_yanit:"🏃",rakip_karar:"✅",eksik_karar:"✅",oyuncu_karar:"✅"};
  const zamanKisa=(iso)=>{ try{ const d=new Date(iso), fark=(Date.now()-d.getTime())/1000; if(fark<60) return "az önce"; if(fark<3600) return Math.floor(fark/60)+" dk"; if(fark<86400) return Math.floor(fark/3600)+" sa"; return d.toLocaleDateString("tr-TR"); }catch(e){ return ""; } };
  const ac=async(b)=>{ if(!b.okundu){ await Db.bildirimOku(b.id); yenile&&yenile(); } if(b.link_tip==="pazar"){ git({sayfa:"pazar"}); return; } if(b.link_tip==="turnuva"&&b.link_id){ const t=(turnuvalar||[]).find(x=>x.id===b.link_id); if(t){ const yonetimeGit=["transfer_istek","katilim"].includes(b.tip); git({sayfa:"turnuva",turnuva:t,tab:yonetimeGit?"yonet":undefined}); return; } } git({sayfa:"ana"}); };
  const hepsiOku=async()=>{ setYuk(true); await Db.bildirimHepsiOku(); await (yenile&&yenile()); setYuk(false); };
  const sil=async(b)=>{ await Db.bildirimSil(b.id); yenile&&yenile(); };
  const varmi=(liste&&liste.length>0);
  return <div className="fade-in" style={{paddingBottom:90}}>
    <div className="vav-hero" style={{position:"relative",overflow:"hidden",padding:"20px 16px 16px",marginBottom:6,background:"linear-gradient(120deg,"+T.accent+"3d 0%,"+T.bg0+" 45%,"+T.accent+"22 75%,"+T.bg0+")"}}>
      <div className="vav-supurme"/>
      <div style={{position:"relative",display:"flex",alignItems:"center",gap:12}}>
        <div className="vav-suzul" style={{width:44,height:44,borderRadius:13,background:T.accent+"2a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>🔔</div>
        <div style={{minWidth:0,flex:1}}>
          <div style={{fontSize:11,color:T.accent,letterSpacing:1,fontWeight:700}}>BİLDİRİMLER</div>
          <div style={{fontSize:20,fontWeight:800,color:T.text,fontFamily:T.fontDisplay,lineHeight:1.1}}>Bildirim Merkezi</div>
        </div>
        {varmi && <button onClick={hepsiOku} disabled={yuk} className="tap" style={{background:T.bg1,border:"0.5px solid "+T.line,color:T.textSoft,borderRadius:9,padding:"7px 11px",fontSize:11,fontWeight:600}}>Tümünü oku</button>}
      </div>
    </div>
    <div style={{padding:"6px 14px"}}>
      {!oturum && <div style={{background:T.bg1,border:"0.5px solid "+T.line,borderRadius:12,padding:16,textAlign:"center",fontSize:12.5,color:T.textMut}}>Bildirimleri görmek için giriş yap.</div>}
      {oturum && !varmi && <div style={{background:T.bg1,border:"0.5px solid "+T.line,borderRadius:12,padding:20,textAlign:"center"}}>
        <div style={{fontSize:30,marginBottom:8}}>🔕</div>
        <div style={{fontSize:13,color:T.text,fontWeight:600}}>Henüz bildirim yok</div>
        <div style={{fontSize:11,color:T.textMut,marginTop:4}}>Transfer, maç ve lig olayları burada görünecek.</div>
      </div>}
      {varmi && liste.map(b=>
        <div key={b.id} onClick={()=>ac(b)} className="tap" style={{display:"flex",alignItems:"flex-start",gap:11,background:b.okundu?T.bg1:"linear-gradient(120deg,"+T.accent+"12,"+T.bg1+")",border:"0.5px solid "+(b.okundu?T.line:T.accent+"44"),borderRadius:12,padding:"11px 12px",marginBottom:7}}>
          <span style={{fontSize:19,flexShrink:0}}>{ikonlar[b.tip]||"🔔"}</span>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,color:T.text,fontWeight:b.okundu?600:800}}>{b.baslik}</div>
            {b.metin && <div style={{fontSize:11.5,color:T.textSoft,marginTop:2,lineHeight:1.45}}>{b.metin}</div>}
            <div style={{fontSize:9.5,color:T.textMut,marginTop:3}}>{zamanKisa(b.olusma)}</div>
          </div>
          {!b.okundu && <span style={{width:8,height:8,borderRadius:"50%",background:T.accent,flexShrink:0,marginTop:5}}/>}
          <button onClick={(e)=>{e.stopPropagation(); sil(b);}} className="tap" style={{background:"none",border:0,color:T.textMut,fontSize:15,flexShrink:0,padding:"0 2px"}}>×</button>
        </div>
      )}
      {/* Takip akışı (eski özet, otomatik) */}
      {takipListe && takipListe.length>0 && <div style={{marginTop:14}}>
        <div style={{fontSize:11,color:T.textMut,fontWeight:700,margin:"2px 2px 8px"}}>📡 TAKİP AKIŞI (otomatik)</div>
        {takipListe.slice(0,10).map((e,i)=>
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,background:T.bg1,border:"0.5px solid "+T.line,borderRadius:11,padding:"9px 11px",marginBottom:5}}>
            <span style={{fontSize:16}}>{e.ikon}</span>
            <div style={{flex:1,fontSize:12,color:T.textSoft}}>{e.metin}</div>
          </div>
        )}
      </div>}
    </div>
  </div>;
}

// ==================== SOHBET v2 (Apple tarzı: tepki/yanıt/sistem/okunmamış) ====================
const FL_EMOJILER=["👍","❤️","😂","⚽","🔥"];
function SohbetSayfa({T, git, oturum, turnuva, takim, adminMi, turnuvalar, kulup, saltOkunur}){
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
  const aktifTakimId = kanal.startsWith("t:") ? kanal.slice(2) : null;
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

  const gonder=async()=>{
    const t=metin.trim(); if(!t||!oturum||(!turnuva&&!kulupMod)) return;
    setGonderiliyor(true);
    const ek={ metin:t, takim_ad:kulupMod?(kulup.ad||null):(benimTakim?benimTakim.ad:null), takim_logo:kulupMod?(kulup.logo||null):(benimTakim?(benimTakim.logo||null):null), foto:benimOyuncu?(benimOyuncu.foto||null):null };
    if(yonetimMod && ligYon){ ek.yonetim=true; ek.takim_ad=null; ek.takim_logo=null; }
    if(yanit){ ek.yanit_id=yanit.id; ek.yanit_ad=yanit.ad; ek.yanit_metin=(yanit.metin||"").slice(0,120); }
    const r=kulupMod ? await Db.mesajGonder(null, null, oturum.id, ad, ek, kulup.id) : await Db.mesajGonder(turnuva.id, aktifTakimId, oturum.id, ad, ek);
    setGonderiliyor(false);
    if(r&&r.ok){ setMetin(""); setYanit(null); taslaklar.current[kanal]=""; if(r.mesaj) setMesajlar(p=> p.some(x=>x.id===r.mesaj.id)?p:[...p,r.mesaj]); dibeKaydir(); }
    else alert("Gönderilemedi: "+((r&&r.hata)||""));
  };
  const tepkiVer=async(m,emoji)=>{ if(!oturum) return; const mine=(tepkiMap[m.id]||[]).some(x=>x.user_id===oturum.id&&x.emoji===emoji);
    setSecili(null);
    if(mine){ await Db.tepkiKaldir(m.id,oturum.id,emoji); } else { await Db.tepkiEkle(m.id,oturum.id,emoji); }
    setTepkiMap(p=>{ const arr=(p[m.id]||[]).filter(x=>!(x.user_id===oturum.id&&x.emoji===emoji)); if(!mine) arr.push({user_id:oturum.id,emoji}); return {...p,[m.id]:arr}; });
  };
  const mesajSil=async(m)=>{ setSecili(null); if(!confirm("Mesaj silinsin mi?")) return; await Db.mesajSil(m.id); setMesajlar(p=>p.filter(x=>x.id!==m.id)); };
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

    {/* MESAJLAR */}
    <div ref={kaydirRef} onScroll={scrollDinle} onClick={()=>secili&&setSecili(null)} style={{flex:1,minHeight:0,overflowY:"auto",overflowX:"hidden",overscrollBehavior:"contain",WebkitOverflowScrolling:"touch",padding:"14px 12px",display:"flex",flexDirection:"column",gap:3}}>
      {eskiYuk && <div style={{textAlign:"center",color:T.textMut,fontSize:11,padding:6}}>Eski mesajlar yükleniyor…</div>}
      {yuk ? <div style={{textAlign:"center",color:T.textMut,fontSize:12,padding:30}}>Yükleniyor…</div>
       : mesajlar.length===0 ? <div style={{textAlign:"center",color:T.textMut,fontSize:12.5,padding:40}}>İlk mesajı sen yaz 👋</div>
       : mesajlar.map((m,i)=>{
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
          const oncekiAyni = i>0 && mesajlar[i-1] && !mesajlar[i-1].sistem && mesajlar[i-1].user_id===m.user_id;
          return <div key={m.id} style={{alignSelf:benim?"flex-end":"flex-start",maxWidth:"82%",marginTop:oncekiAyni?1:8,display:"flex",gap:8,flexDirection:benim?"row-reverse":"row"}}>
            <div style={{width:30,height:30,borderRadius:"50%",overflow:"hidden",flexShrink:0,alignSelf:"flex-end",visibility:oncekiAyni?"hidden":"visible"}} dangerouslySetInnerHTML={{__html:svgAvatar(m.ad,30,m.foto)}}/>
            <div style={{minWidth:0}}>
              {!oncekiAyni && <div style={{fontSize:10,color:T.textMut,marginBottom:3,margin:benim?"0 4px 3px 0":"0 0 3px 4px",display:"flex",alignItems:"center",gap:5,justifyContent:benim?"flex-end":"flex-start",flexDirection:benim?"row-reverse":"row"}}>
                <b style={{color:T.textSoft}}>{m.ad}</b>{m.takim_ad && <span style={{display:"inline-flex",alignItems:"center",gap:4,color:T.accent2}}><span style={{width:14,height:14,display:"inline-block"}} dangerouslySetInnerHTML={{__html:svgAmblem(m.takim_ad,T.accent2,14,m.takim_logo)}}/>{m.takim_ad}</span>}
              </div>}
              <div onClick={(e)=>{ e.stopPropagation(); setSecili(secili===m.id?null:m.id); }} className="tap" style={{background:benim?T.accent:T.bg1,color:benim?T.bg0:T.text,border:benim?0:"0.5px solid "+T.line,borderRadius:16,borderBottomRightRadius:benim?5:16,borderBottomLeftRadius:benim?16:5,padding:"9px 13px",fontSize:13.5,lineHeight:1.4,wordBreak:"break-word",cursor:"pointer"}}>
                {m.yanit_id && <div style={{borderLeft:"2px solid "+(benim?T.bg0:T.accent),paddingLeft:7,marginBottom:5,opacity:.85}}><div style={{fontSize:10,fontWeight:700}}>{m.yanit_ad}</div><div style={{fontSize:11,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:180}}>{m.yanit_metin}</div></div>}
                {m.metin}
                <span style={{fontSize:9,opacity:.6,marginLeft:8,verticalAlign:"bottom"}}>{zaman(m.olusma)}</span>
              </div>
              {/* Tepkiler */}
              {Object.keys(grup).length>0 && <div style={{display:"flex",gap:4,marginTop:4,flexWrap:"wrap",justifyContent:benim?"flex-end":"flex-start"}}>
                {Object.entries(grup).map(([em,d])=><span key={em} onClick={(e)=>{ e.stopPropagation(); tepkiVer(m,em); }} className="tap" style={{background:d.mine?T.accent+"33":T.bg2,border:"0.5px solid "+(d.mine?T.accent:T.line),borderRadius:12,padding:"1px 7px",fontSize:11,cursor:"pointer"}}>{em} {d.n}</span>)}
              </div>}
              {/* Aksiyon menüsü */}
              {secili===m.id && <div onClick={e=>e.stopPropagation()} style={{marginTop:6,background:T.bg2,border:"0.5px solid "+T.line,borderRadius:14,padding:"7px 9px",display:"flex",flexWrap:"wrap",gap:8,alignItems:"center",boxShadow:"0 6px 20px rgba(0,0,0,.35)"}}>
                {FL_EMOJILER.map(em=><span key={em} onClick={()=>tepkiVer(m,em)} className="tap" style={{fontSize:19,cursor:"pointer"}}>{em}</span>)}
                <span style={{width:1,height:18,background:T.line}}/>
                <button onClick={()=>{ setYanit(m); setSecili(null); }} className="tap" style={{background:"none",border:0,color:T.accent,fontSize:11,fontWeight:700}}>↩ Yanıtla</button>
                {benim
                  ? <button onClick={()=>mesajSil(m)} className="tap" style={{background:"none",border:0,color:T.danger,fontSize:11,fontWeight:700}}>🗑 Sil</button>
                  : <button onClick={()=>sikayet(m)} className="tap" style={{background:"none",border:0,color:T.textMut,fontSize:11,fontWeight:700}}>⚑ Şikâyet</button>}
                {!benim && (ligYon) && <button onClick={()=>mesajSil(m)} className="tap" style={{background:"none",border:0,color:T.danger,fontSize:11,fontWeight:700}}>🗑 Kaldır</button>}
              </div>}
            </div>
          </div>;
        })}
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
    {/* MESAJ KUTUSU */}
    {!oturum ? <div style={{flexShrink:0,padding:"14px 14px calc(14px + env(safe-area-inset-bottom))",textAlign:"center",fontSize:12,color:T.textMut,borderTop:"0.5px solid "+T.line,background:T.bg0}}>Yazmak için giriş yap.</div>
     : saltOkunur ? <div style={{flexShrink:0,padding:"14px 14px calc(14px + env(safe-area-inset-bottom))",textAlign:"center",fontSize:12,color:T.gold,fontWeight:700,borderTop:"0.5px solid "+T.line,background:T.bg0}}>👁 Salt-okunur görünüm — bu modda mesaj gönderilemez. Test için kendi hesabınla sohbete gir.</div>
     : <div style={{flexShrink:0,display:"flex",gap:8,padding:"10px 12px max(10px, calc(env(safe-area-inset-bottom) - var(--kb, 0px)))",borderTop:yonetimMod?"none":"0.5px solid "+T.line,background:T.bg0}}>
        <input value={metin} onChange={e=>setMetin(e.target.value)} onFocus={()=>{ dipteRef.current=dipteMi(); setTimeout(dibeKaydir,300); }} onKeyDown={e=>{ if(e.key==="Enter"){ e.preventDefault(); gonder(); } }} placeholder={yonetimMod?"📢 Yönetim duyurusu yaz…":"Mesaj yaz…"} style={{flex:1,minWidth:0,width:0,background:T.bg1,border:"0.5px solid "+(yonetimMod?T.gold+"66":T.line),borderRadius:22,padding:"12px 16px",color:T.text,outline:"none",fontFamily:"inherit",boxSizing:"border-box",fontSize:16}}/>
        <button onClick={gonder} disabled={gonderiliyor||!metin.trim()} className="tap" style={{background:yonetimMod?T.gold:T.accent,color:T.bg0,border:0,borderRadius:"50%",width:46,height:46,fontSize:18,fontWeight:800,flexShrink:0,opacity:(gonderiliyor||!metin.trim())?.5:1}}>➤</button>
      </div>}
  </div>;
}

// ==================== TRANSFER PAZARI (müsait oyuncular) ====================
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

function BosPazar({T,ik,metin,alt}){
  return <div style={{background:T.bg1,border:"0.5px solid "+T.line,borderRadius:14,padding:"34px 20px",textAlign:"center"}}>
    <div style={{fontSize:34,marginBottom:10}}>{ik}</div>
    <div style={{fontSize:13,color:T.text,fontWeight:700,marginBottom:5}}>{metin}</div>
    <div style={{fontSize:11.5,color:T.textMut}}>{alt}</div>
  </div>;
}

function IlanVerModal({T, tip, takimlar, oturum, onKapat, onOk}){
  const eksik=tip==="eksik", oyuncuMu=tip==="oyuncu";
  const benad=(oturum&&((oturum.user_metadata&&oturum.user_metadata.ad)||oturum.email.split("@")[0]))||"";
  const [tkIdx,setTkIdx]=useState(takimlar.length?0:-1);
  const [elTakim,setElTakim]=useState("");
  const [ad,setAd]=useState(benad);
  const [tarih,setTarih]=useState(""); const [saha,setSaha]=useState(""); const [sehir,setSehir]=useState(takimlar[0]?takimlar[0].sehir:"");
  const [seviye,setSeviye]=useState("Orta"); const [poz,setPoz]=useState("Kaleci"); const [adet,setAdet]=useState(1);
  const [aciklama,setAciklama]=useState(""); const [kaydet,setKaydet]=useState(false);
  const [kalici,setKalici]=useState(false);   // false=🟠 bu maç · true=🟢 kalıcı/kadro
  const sec=(!oyuncuMu&&tkIdx>=0)?takimlar[tkIdx]:null;
  const anaRenk=eksik?T.danger:oyuncuMu?(T.accent2||T.accent):T.accent;
  const gonder=async()=>{
    const takimAd = oyuncuMu ? ad.trim() : (sec?sec.takim_ad:elTakim.trim());
    if(!takimAd){ alert(oyuncuMu?"Adını yaz.":"Takım seç veya adını yaz."); return; }
    if(!kalici && !tarih.trim()){ alert(oyuncuMu?"Ne zaman müsaitsin yaz (ör: Hafta içi akşam).":"Tarih/saat yaz (ör: Cuma 21:00)."); return; }
    setKaydet(true);
    const il={ tip, user_id:oturum.id, takim_id:sec?sec.takim_id:null, takim_ad:takimAd, takim_logo:sec?sec.takim_logo:null, takim_renk:sec?sec.takim_renk:null, lig_id:sec?sec.lig_id:null, lig_ad:sec?sec.lig_ad:null, sehir:sehir.trim()||null, tarih_text:tarih.trim(), aciklama:aciklama.trim()||null };
    if(eksik){ il.pozisyon=poz; il.adet=Number(adet)||1; il.kalici=kalici; } else if(oyuncuMu){ il.pozisyon=poz; il.kalici=kalici; } else { il.saha=saha.trim()||null; il.seviye=seviye; }
    const r=await Db.ilanOlustur(il); setKaydet(false);
    if(r.ok){ alert("✅ İlan yayınlandı!"); onOk(); } else alert("Olmadı: "+(r.hata||""));
  };
  const inp={width:"100%",background:T.bg1,border:"0.5px solid "+T.line,borderRadius:10,padding:"11px 12px",color:T.text,fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"};
  const lbl={fontSize:11,color:T.textMut,fontWeight:700,margin:"12px 2px 6px",display:"block"};
  return <div onClick={e=>{ if(e.target===e.currentTarget) onKapat(); }} style={{position:"fixed",inset:0,zIndex:1200,background:"rgba(0,0,0,.6)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
    <div style={{width:"100%",maxWidth:480,background:T.bg0,borderTopLeftRadius:22,borderTopRightRadius:22,border:"0.5px solid "+T.line,padding:"8px 16px calc(20px + env(safe-area-inset-bottom))",maxHeight:"88vh",overflowY:"auto"}}>
      <div style={{width:40,height:4,borderRadius:3,background:T.line,margin:"8px auto 14px"}}/>
      <div style={{fontSize:17,fontWeight:800,color:T.text,marginBottom:4}}>{eksik?"🙋 Eksik Oyuncu İlanı":oyuncuMu?"🏃 Maça Gelirim":"🆚 Rakip İlanı"}</div>
      <div style={{fontSize:11.5,color:T.textMut,marginBottom:6}}>{eksik?"Maça oyuncu bul — herkes görür, 'geliyorum' diyen olursa bildirim gelir.":oyuncuMu?"Bir oyuncu olarak maç ara — takımlar seni görüp çağırır, ilgilenen olursa bildirim gelir.":"Takımına maç ayarla — meydan okuyan olursa bildirim gelir."}</div>
      {(eksik||oyuncuMu) && <div style={{display:"flex",gap:8,margin:"6px 0 2px"}}>
        <button onClick={()=>setKalici(false)} className="tap" style={{flex:1,padding:"10px 6px",borderRadius:11,fontSize:12.5,fontWeight:800,border:"1px solid "+(!kalici?"#c2670f":T.line),background:!kalici?"#c2670f1e":T.bg1,color:!kalici?"#c2670f":T.textMut,lineHeight:1.3}}>🟠 Bu maç<span style={{display:"block",fontSize:9,fontWeight:600,opacity:.85}}>{eksik?"misafir gelsin":"boştayım, gelirim"}</span></button>
        <button onClick={()=>setKalici(true)} className="tap" style={{flex:1,padding:"10px 6px",borderRadius:11,fontSize:12.5,fontWeight:800,border:"1px solid "+(kalici?T.accent:T.line),background:kalici?T.accent+"1e":T.bg1,color:kalici?T.accent:T.textMut,lineHeight:1.3}}>🟢 Kalıcı<span style={{display:"block",fontSize:9,fontWeight:600,opacity:.85}}>{eksik?"kadroya sürekli":"takım arıyorum"}</span></button>
      </div>}
      {oyuncuMu ? <>
        <label style={lbl}>ADIN</label>
        <input value={ad} onChange={e=>setAd(e.target.value)} placeholder="Ad Soyad" style={inp}/>
        <label style={lbl}>POZİSYON</label>
        <select value={poz} onChange={e=>setPoz(e.target.value)} style={inp}>{["Kaleci","Defans","Ortasaha","Forvet","Farketmez"].map(p=><option key={p} value={p}>{p}</option>)}</select>
      </> : <>
        <label style={lbl}>TAKIM</label>
        {takimlar.length>0
          ? <select value={tkIdx} onChange={e=>{ const v=Number(e.target.value); setTkIdx(v); if(v>=0&&takimlar[v].sehir) setSehir(takimlar[v].sehir); }} style={inp}>
              {takimlar.map((t,i)=><option key={i} value={i}>{t.takim_ad} · {t.lig_ad}</option>)}
              <option value={-1}>+ Elle takım adı yaz…</option>
            </select>
          : <input value={elTakim} onChange={e=>setElTakim(e.target.value)} placeholder="Takım adı" style={inp}/>}
        {takimlar.length>0 && tkIdx===-1 && <input value={elTakim} onChange={e=>setElTakim(e.target.value)} placeholder="Takım adı" style={{...inp,marginTop:8}}/>}
        {eksik ? <>
          <label style={lbl}>POZİSYON & ADET</label>
          <div style={{display:"flex",gap:8}}>
            <select value={poz} onChange={e=>setPoz(e.target.value)} style={{...inp,flex:2}}>{["Kaleci","Defans","Ortasaha","Forvet","Farketmez"].map(p=><option key={p} value={p}>{p}</option>)}</select>
            <select value={adet} onChange={e=>setAdet(e.target.value)} style={{...inp,flex:1}}>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n} kişi</option>)}</select>
          </div>
        </> : <>
          <label style={lbl}>SEVİYE</label>
          <select value={seviye} onChange={e=>setSeviye(e.target.value)} style={inp}>{["Başlangıç","Orta","İyi","Rekabetçi"].map(s=><option key={s} value={s}>{s}</option>)}</select>
        </>}
      </>}
      <label style={lbl}>{oyuncuMu?"MÜSAİT ZAMAN":"TARİH / SAAT"}</label>
      <input value={tarih} onChange={e=>setTarih(e.target.value)} placeholder={oyuncuMu?"ör: Hafta içi akşamları":"ör: Cuma 21:00"} style={inp}/>
      <label style={lbl}>ŞEHİR / BÖLGE</label>
      <input value={sehir} onChange={e=>setSehir(e.target.value)} placeholder="ör: İstanbul · Kadıköy" style={inp}/>
      {!eksik && !oyuncuMu && <><label style={lbl}>SAHA (opsiyonel)</label><input value={saha} onChange={e=>setSaha(e.target.value)} placeholder="ör: Fenerbahçe Halı Saha" style={inp}/></>}
      <label style={lbl}>AÇIKLAMA & İLETİŞİM (opsiyonel)</label>
      <textarea value={aciklama} onChange={e=>setAciklama(e.target.value)} placeholder="Ek not + istersen telefon/WhatsApp numaran (ör: 05xx… arayın)" rows={2} style={{...inp,resize:"vertical"}}/>
      <div style={{display:"flex",gap:10,marginTop:16}}>
        <button onClick={onKapat} className="tap" style={{flex:1,background:T.bg1,border:"0.5px solid "+T.line,color:T.textSoft,borderRadius:12,padding:13,fontSize:13.5,fontWeight:700}}>Vazgeç</button>
        <button onClick={gonder} disabled={kaydet} className="tap" style={{flex:2,background:anaRenk,color:eksik?"#fff":(T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0),border:0,borderRadius:12,padding:13,fontSize:13.5,fontWeight:800,opacity:kaydet?.6:1}}>{kaydet?"…":"Yayınla"}</button>
      </div>
    </div>
  </div>;
}


function IlanYanitModal({T, ilan, onKapat}){
  const [yanitlar,setYanitlar]=useState([]); const [yuk,setYuk]=useState(true);
  const yukle=async()=>{ setYuk(true); setYanitlar(await Db.ilanYanitlari(ilan.id)); setYuk(false); };
  useEffect(()=>{ yukle(); },[]);
  const karar=async(y,kabul)=>{ const r=await Db.ilanKarar(y.id,kabul); if(r.ok){ yukle(); } else alert(r.hata||"Olmadı"); };
  return <div onClick={e=>{ if(e.target===e.currentTarget) onKapat(); }} style={{position:"fixed",inset:0,zIndex:1200,background:"rgba(0,0,0,.6)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
    <div style={{width:"100%",maxWidth:480,background:T.bg0,borderTopLeftRadius:22,borderTopRightRadius:22,border:"0.5px solid "+T.line,padding:"8px 16px calc(20px + env(safe-area-inset-bottom))",maxHeight:"80vh",overflowY:"auto"}}>
      <div style={{width:40,height:4,borderRadius:3,background:T.line,margin:"8px auto 14px"}}/>
      <div style={{fontSize:16,fontWeight:800,color:T.text,marginBottom:2}}>{ilan.tip==="rakip"?"🆚":"🙋"} {ilan.takim_ad} — Yanıtlar</div>
      <div style={{fontSize:11.5,color:T.textMut,marginBottom:12}}>{ilan.tip==="rakip"?ilan.tarih_text:(ilan.pozisyon||"")+" · "+(ilan.tarih_text||"")}</div>
      {yuk ? <div style={{textAlign:"center",color:T.textMut,fontSize:12,padding:24}}>Yükleniyor…</div>
       : yanitlar.length===0 ? <div style={{textAlign:"center",color:T.textMut,fontSize:12.5,padding:"26px 10px"}}>Henüz yanıt yok. Biri "geliyorum/meydan oku" deyince burada görünür.</div>
       : yanitlar.map(y=>
          <div key={y.id} style={{display:"flex",alignItems:"center",gap:11,background:T.bg1,border:"0.5px solid "+T.line,borderRadius:12,padding:"11px 12px",marginBottom:8}}>
            <div style={{width:38,height:38,borderRadius:"50%",overflow:"hidden",flexShrink:0}} dangerouslySetInnerHTML={{__html:svgAvatar(y.ad||"?",38,null)}}/>
            <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,color:T.text,fontWeight:700}}>{y.ad||"Kullanıcı"}</div>{y.mesaj && <div style={{fontSize:11,color:T.textSoft,fontStyle:"italic"}}>"{y.mesaj}"</div>}</div>
            {y.durum==="bekliyor" ? <div style={{display:"flex",gap:6,flexShrink:0}}>
              <button onClick={()=>karar(y,true)} className="tap" style={{background:T.accent,color:T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0,border:0,borderRadius:9,padding:"7px 11px",fontSize:12,fontWeight:800}}>✓ Kabul</button>
              <button onClick={()=>karar(y,false)} className="tap" style={{background:"none",color:T.textMut,border:"0.5px solid "+T.line,borderRadius:9,padding:"7px 10px",fontSize:12,fontWeight:700}}>✕</button>
            </div> : <span style={{fontSize:11,fontWeight:800,color:y.durum==="kabul"?T.accent:T.textMut,flexShrink:0}}>{y.durum==="kabul"?"✅ Kabul":"reddedildi"}</span>}
          </div>
        )}
      <button onClick={onKapat} className="tap" style={{width:"100%",marginTop:12,background:T.bg1,border:"0.5px solid "+T.line,color:T.textSoft,borderRadius:12,padding:12,fontSize:13,fontWeight:700}}>Kapat</button>
    </div>
  </div>;
}


/* ===== TAKIMLARIM (kalıcı Kulüp yönetimi) — Aşama 4-6 ===== */
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

/* ===== 🆘 SORUN BİLDİR — kullanıcı-başlatan destek + otomatik teşhis ===== */
function SorunBildir({T, git, oturum, teshis}){
  const [mesaj,setMesaj]=React.useState("");
  const [durum,setDurum]=React.useState("");
  const [bekle,setBekle]=React.useState(false);
  const gonder=async()=>{
    if(!(mesaj||"").trim()){ setDurum("⚠️ Kısaca ne olduğunu yaz"); return; }
    setBekle(true);
    const r=await Db.sorunBildir({
      user_id:(oturum&&oturum.id)||null,
      ad:(oturum&&oturum.user_metadata&&(oturum.user_metadata.ad||oturum.user_metadata.full_name))||null,
      email:(oturum&&oturum.email)||null,
      sayfa:(teshis&&teshis.sayfa)||null, mesaj:mesaj.trim(), teshis:teshis||null
    });
    setBekle(false);
    setDurum(r&&r.ok ? "ok" : ("Olmadı: "+((r&&r.hata)||"")));
  };
  const BTN={background:T.accent,color:(T.renkCifti&&T.renkCifti[1]==="#FFFFFF")?"#fff":T.bg0,border:0,borderRadius:12,padding:"13px 18px",fontSize:14,fontWeight:800,cursor:"pointer"};
  if(durum==="ok") return <div style={{maxWidth:440,margin:"0 auto",padding:"64px 24px",textAlign:"center"}}>
    <div style={{fontSize:46,marginBottom:14}}>✅</div>
    <div style={{fontSize:18,fontWeight:800,color:T.text,fontFamily:T.fontDisplay}}>Teşekkürler, aldık!</div>
    <div style={{fontSize:13.5,color:T.textMut,marginTop:8,lineHeight:1.6}}>Sorununu en kısa sürede inceleyeceğiz. Gerekirse e-postandan döneriz.</div>
    <button onClick={()=>git({sayfa:"profil"})} style={{...BTN,marginTop:22}}>Tamam</button>
  </div>;
  return <div style={{maxWidth:460,margin:"0 auto",padding:"14px 16px 90px"}}>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
      <span onClick={()=>git({sayfa:"profil"})} className="tap" style={{fontSize:22,color:T.textSoft,cursor:"pointer"}}>‹</span>
      <span style={{fontSize:19,fontWeight:800,color:T.text,fontFamily:T.fontDisplay}}>🆘 Sorun Bildir</span>
    </div>
    <div style={{fontSize:13,color:T.textMut,lineHeight:1.6,marginBottom:14}}>Bir sorun mu yaşıyorsun? Kısaca anlat — hangi ekranda, ne bekliyordun, ne oldu. Çözmemize yardımcı olur.</div>
    <textarea value={mesaj} onChange={e=>setMesaj(e.target.value)} rows={5} placeholder="Örn: Takımlarım'a girince kadro görünmüyor…" style={{width:"100%",boxSizing:"border-box",background:T.bg1,border:"0.5px solid "+T.line,borderRadius:12,padding:"13px 14px",color:T.text,fontSize:14,fontFamily:"inherit",outline:"none",resize:"vertical"}}/>
    <div style={{background:T.bg1,border:"0.5px solid "+T.line,borderRadius:12,padding:"12px 14px",marginTop:12,fontSize:12,color:T.textMut,lineHeight:1.6}}>
      🔒 <b style={{color:T.textSoft}}>Otomatik eklenecek:</b> bulunduğun ekran, cihaz/tarayıcı, uygulama sürümü, rolün. <b style={{color:T.textSoft}}>Telefon, şifre gibi kişisel veri gönderilmez.</b>
    </div>
    {durum && durum!=="ok" && <div style={{fontSize:12.5,color:T.gold,margin:"10px 2px"}}>{durum}</div>}
    <button onClick={gonder} disabled={bekle} style={{...BTN,width:"100%",marginTop:14,opacity:bekle?.6:1}}>{bekle?"Gönderiliyor…":"Gönder"}</button>
  </div>;
}

