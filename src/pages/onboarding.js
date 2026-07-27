function BosDurum({T, git, ligKurabilir}){
  return <div style={{padding:"70px 30px",textAlign:"center"}}>
    <div style={{fontSize:40,marginBottom:12}}>🏆</div>
    <div style={{fontSize:17,color:T.text,fontWeight:700,marginBottom:6}}>Henüz lig yok</div>
    <div style={{fontSize:13,color:T.textMut,lineHeight:1.6,maxWidth:340,margin:"0 auto"}}>{ligKurabilir?"Yeni bir lig kur, takımları ve oyuncuları ekle, maçlara başla.":"Bir takım seni davet ettiğinde ligler burada görünür."}</div>
    {ligKurabilir && <button onClick={()=>git({sayfa:"ligkur"})} className="tap" style={{marginTop:20,background:T.accent,color:T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0,borderRadius:11,padding:"13px 26px",fontSize:14,fontWeight:800,border:"none"}}>+ Yeni Lig Kur</button>}
    <div style={{marginTop:14}}>
      <button onClick={()=>git({sayfa:"ligler"})} className="tap" style={{background:"transparent",color:T.textMut,borderRadius:10,padding:"9px 18px",fontSize:12,fontWeight:600,border:"0.5px solid "+T.line}}>🔍 Açık ligleri keşfet</button>
    </div>
  </div>;
}

/* ============================================================
   FAZ 7 (ONLINE) — Açılış / Tanıtım / Giriş-Üye Ol ekranları
   NOT: Sadece görünüm. Gerçek üyelik/veritabanı sonraki adımda.
   ============================================================ */

/* Atmosfer ışık lekeleri (overlay içinde) */
function KapiGlow({T}){
  return <>
    <div style={{position:"absolute",top:"-12%",right:"-28%",width:"80%",height:"46%",background:`radial-gradient(circle, ${T.accent}28, transparent 70%)`,pointerEvents:"none",zIndex:0}}/>
    <div style={{position:"absolute",bottom:"-10%",left:"-28%",width:"80%",height:"46%",background:`radial-gradient(circle, ${(T.accent2||T.accent)}20, transparent 70%)`,pointerEvents:"none",zIndex:0}}/>
  </>;
}

/* 1) AÇILIŞ SPLASH — saha çizilir → top düşer → logo parlar → çubuk dolar → ekran açılır */
function AcilisSplash({T, onBitti}){
  const [kapan,setKapan]=useState(false);
  useEffect(()=>{
    const t1=setTimeout(()=>setKapan(true), 3900);
    const t2=setTimeout(()=>{ if(onBitti)onBitti(); }, 4550);
    return ()=>{ clearTimeout(t1); clearTimeout(t2); };
  },[]);
  const atla=()=>{ setKapan(true); setTimeout(()=>{ if(onBitti)onBitti(); }, 480); };
  return <div className={kapan?"fz-splash-kapan":""} style={{position:"fixed",inset:0,zIndex:2000,background:T.bg0,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center"}}>
    <KapiGlow T={T}/>
    <svg className="fz-saha" viewBox="0 0 220 300" style={{position:"absolute",width:220,height:300,top:"50%",left:"50%",transform:"translate(-50%,-50%)",opacity:.45,zIndex:1}}>
      <rect x="8" y="8" width="204" height="284" rx="5" style={{stroke:T.accent,fill:"none"}}/>
      <line x1="8" y1="150" x2="212" y2="150" style={{stroke:T.accent}}/>
      <circle cx="110" cy="150" r="34" style={{stroke:T.accent,fill:"none"}}/>
      <rect x="58" y="8" width="104" height="46" style={{stroke:T.accent,fill:"none"}}/>
      <rect x="58" y="246" width="104" height="46" style={{stroke:T.accent,fill:"none"}}/>
    </svg>
    <div className="fz-top" style={{position:"absolute",top:"calc(50% - 80px)",fontSize:46,zIndex:2}}>⚽</div>
    <div className="fz-marka" style={{position:"absolute",top:"calc(50% + 14px)",fontFamily:T.fontDisplay,fontSize:34,fontWeight:800,color:T.accent,letterSpacing:1,textShadow:`0 0 22px ${T.accent}`,zIndex:2}}>ForzaLig</div>
    <div className="fz-yuk" style={{position:"absolute",top:"calc(50% + 72px)",display:"flex",flexDirection:"column",alignItems:"center",gap:9,zIndex:2}}>
      <div style={{width:160,height:5,background:"rgba(255,255,255,.08)",borderRadius:3,overflow:"hidden"}}>
        <div className="fz-fill" style={{height:"100%",width:0,background:`linear-gradient(90deg, ${T.accent}, ${T.accent2||T.accent})`,borderRadius:3}}/>
      </div>
      <div style={{fontSize:10,color:T.textMut,letterSpacing:1.5}}>YÜKLENİYOR...</div>
    </div>
    <button onClick={atla} style={{position:"absolute",top:16,right:18,fontSize:12,color:T.textMut,background:"none",border:0,zIndex:3}}>Atla</button>
    <div style={{position:"absolute",bottom:"calc(22px + env(safe-area-inset-bottom))",fontSize:11,color:T.textMut,letterSpacing:2,zIndex:2}}>forzalig.com</div>
  </div>;
}

/* 2) TANITIM (Landing) */
function Tanitim({T, kapiGit, tamamla}){
  const beyaz = T.renkCifti && T.renkCifti[1]==="#FFFFFF";
  const ozellikler=[
    ["🏆",T.accent,"Ligler & Puan Durumu","Fikstür, gruplar ve tablolar otomatik"],
    ["🃏",T.gold,"FIFA Tarzı Oyuncu Kartları","Reyting, radar ve istatistikler"],
    ["📊",T.accent2||T.accent,"Krallar & Ödüller","Gol, asist, kurtarış liderleri"],
    ["📱",T.accent,"Canlı Skor & Paylaşım","Ligini QR ile herkesle paylaş"],
  ];
  return <div className="fz-giris" style={{position:"fixed",inset:0,zIndex:2000,background:T.bg0,overflow:"hidden",display:"flex",flexDirection:"column"}}>
    <KapiGlow T={T}/>
    <div style={{position:"relative",zIndex:1,flex:1,overflowY:"auto",padding:"46px 22px 26px",display:"flex",flexDirection:"column"}}>
      <div style={{textAlign:"center"}}>
        <div className="vav-suzul" style={{width:74,height:74,borderRadius:22,margin:"0 auto 16px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:38,background:`linear-gradient(135deg, ${T.accent}, ${T.accent2||T.accent})`,boxShadow:`0 12px 34px ${T.accent}66`}}>⚽</div>
        <div className="vav-parla" style={{fontFamily:T.fontDisplay,fontSize:30,fontWeight:800,color:T.accent,letterSpacing:.5}}>ForzaLig</div>
        <div style={{color:T.textSoft,fontSize:12.5,lineHeight:1.6,margin:"9px 6px 22px"}}>Halı saha liginin dijital merkezi.<br/>Fikstür, puan durumu, kral listeleri, FIFA kartları ve canlı skorlar — hepsi tek yerde.</div>
      </div>
      <div style={{flex:1}}>
        {ozellikler.map(([ik,renk,bas,alt],i)=>
          <div key={i} style={{display:"flex",alignItems:"center",gap:12,background:T.bg1,border:"0.5px solid "+T.line,borderRadius:13,padding:"11px 13px",marginBottom:9}}>
            <div style={{width:38,height:38,borderRadius:11,display:"flex",alignItems:"center",justifyContent:"center",fontSize:19,flexShrink:0,background:renk+"22",color:renk}}>{ik}</div>
            <div><b style={{fontFamily:T.fontDisplay,fontSize:13,fontWeight:700,color:T.text,display:"block"}}>{bas}</b><span style={{fontSize:10.5,color:T.textMut}}>{alt}</span></div>
          </div>
        )}
      </div>
      <div style={{marginTop:14}}>
        <button onClick={()=>kapiGit("uyeol")} className="tap vav-bar" style={{width:"100%",border:"none",borderRadius:13,padding:15,fontFamily:T.fontDisplay,fontSize:14.5,fontWeight:800,background:T.accent,color:beyaz?"#fff":T.bg0,boxShadow:`0 8px 22px ${T.accent}52`}}>Üye Ol</button>
        <button onClick={()=>kapiGit("giris")} className="tap" style={{width:"100%",border:"0.5px solid "+T.line,borderRadius:13,padding:14,marginTop:9,fontSize:13,fontWeight:600,background:"transparent",color:T.textSoft}}>Giriş Yap</button>
        {/* "Giriş yapmadan keşfet" çıkmaza düşürüyordu (guard hemen girişe döndürüyor) — gizlendi.
           Gerçek misafir gezinme ileride ayrı, test edilmiş bir aşamada gelecek. */}
      </div>
    </div>
  </div>;
}

/* FAZ 4 — İlk giriş rehberi (onboarding turu): alt menüyü vurgulayan 4 adımlık tanıtım */
function Rehber({T, bitir, adimlar:adimProp}){
  const [adim,setAdim]=useState(0);
  const beyaz=T.renkCifti&&T.renkCifti[1]==="#FFFFFF";
  const adimlar=(adimProp&&adimProp.length)?adimProp:[
    {ik:"🏠", vur:0, bas:"Ana", ac:"Ligindeki öne çıkanlar, gol kralı, haftanın maçı ve puan durumu ilk 5 burada. Birden çok ligin varsa üstteki şeritten hızlıca geçersin."},
    {ik:"🔍", vur:1, bas:"Keşfet", ac:"Tüm liglerin, takımların ve oyuncuların burada. Yeni bir lig de buradan kurulur."},
    {ik:"👤", vur:3, bas:"Profil", ac:"Kariyerin, fotoğrafın ve takip ettiğin lig/oyuncular burada."},
  ];
  const a=adimlar[adim], son=adim===adimlar.length-1;
  const ileri=()=>{ if(son) bitir(); else { setAdim(x=>x+1); try{ if(navigator.vibrate)navigator.vibrate(8); }catch(e){} } };
  const navStil={position:"fixed",bottom:0,left:0,right:0,maxWidth:480,margin:"0 auto"};
  return <div className="fade-in" style={{position:"fixed",inset:0,zIndex:2500,background:"rgba(0,0,0,.72)",display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
    <button onClick={bitir} style={{position:"absolute",top:"calc(14px + env(safe-area-inset-top))",right:16,background:"rgba(255,255,255,.14)",color:"#fff",border:0,borderRadius:20,padding:"7px 15px",fontSize:12,fontWeight:600,cursor:"pointer"}}>Atla</button>
    <div style={{...navStil,position:"static",width:"100%",margin:"0 auto",maxWidth:480}}>
      <div style={{margin:"0 14px 96px",background:T.bg1,border:"1px solid "+T.accent+"55",borderRadius:16,padding:18,boxShadow:"0 12px 40px rgba(0,0,0,.55)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:9}}>
          <div style={{width:40,height:40,borderRadius:12,background:T.accent+"22",color:T.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{a.ik}</div>
          <div style={{fontSize:16,fontWeight:800,color:T.text,fontFamily:T.fontDisplay}}>{a.bas}</div>
          <span style={{marginLeft:"auto",fontSize:11,color:T.textMut,fontWeight:600}}>{adim+1}/{adimlar.length}</span>
        </div>
        <div style={{fontSize:13,color:T.textSoft,lineHeight:1.6,marginBottom:14}}>{a.ac}</div>
        <div style={{display:"flex",gap:6,marginBottom:14}}>{adimlar.map((_,i)=><div key={i} style={{flex:1,height:3,borderRadius:2,background:i<=adim?T.accent:T.line,transition:"background .3s"}}/>)}</div>
        <button onClick={ileri} className="tap" style={{width:"100%",padding:13,borderRadius:12,background:T.accent,color:beyaz?"#fff":T.bg0,border:0,fontSize:14,fontWeight:800,cursor:"pointer"}}>{son?"Başlayalım 🚀":"Devam →"}</button>
      </div>
    </div>
    {/* alt menü vurgusu — gerçek nav ile hizalı 4 sütun */}
    <div style={{...navStil,pointerEvents:"none"}}>
      <div style={{display:"flex",padding:"8px 0 calc(10px + env(safe-area-inset-bottom))"}}>
        {[0,1,2,3].map(i=><div key={i} style={{flex:1,display:"flex",justifyContent:"center",alignItems:"center",height:48}}>
          {a.vur===i && <div className="fade-in" style={{width:54,height:44,borderRadius:14,border:"2px solid "+T.accent,boxShadow:"0 0 0 4px "+T.accent+"2e, 0 0 22px "+T.accent+"99"}}/>}
        </div>)}
      </div>
    </div>
  </div>;
}

/* 3) GİRİŞ / ÜYE OL (tek bileşen, mod ile) */
function GirisAuth({T, mod, kapiGit, tamamla}){
  const uyeol = mod==="uyeol";
  const beyaz = T.renkCifti && T.renkCifti[1]==="#FFFFFF";
  const [rol,setRol]=useState("oyuncu");
  const [kvkk,setKvkk]=useState(true);
  const [ad,setAd]=useState("");
  const [email,setEmail]=useState("");
  const [sifre,setSifre]=useState("");
  const [hata,setHata]=useState("");
  const [bilgi,setBilgi]=useState("");
  const [yuk,setYuk]=useState(false);
  const [epostaAcik,setEpostaAcik]=useState(false);   // sade ekran: e-posta formu gizli başlar
  const inpStil={width:"100%",background:T.bg1,border:"0.5px solid "+T.line,borderRadius:12,padding:13,color:T.text,fontSize:13.5,fontFamily:"inherit",outline:"none",marginBottom:15,boxSizing:"border-box"};
  const etStil={fontSize:11,color:T.textMut,fontWeight:700,marginBottom:6};

  const gonder = async ()=>{
    setHata(""); setBilgi("");
    const e=email.trim().toLowerCase();
    if(!e || !sifre){ setHata("E-posta ve şifre gerekli."); return; }
    if(uyeol && sifre.length<6){ setHata("Şifre en az 6 karakter olmalı."); return; }
    if(uyeol && !kvkk){ setHata("Devam etmek için koşulları kabul et."); return; }
    if(!mailIzinli(e)){ setHata("🚧 Uygulama şu an test modunda. Çok yakında herkese açılacak!"); return; }
    if(!sb){ setHata("Sunucuya bağlanılamadı. İnternetini kontrol edip tekrar dene."); return; }
    setYuk(true);
    try{
      if(uyeol){
        const {data,error}=await sb.auth.signUp({ email:e, password:sifre, options:{ data:{ ad:ad.trim(), rol } } });
        if(error){ setHata(authHata(error.message)); setYuk(false); return; }
        if(data && data.session){ tamamla(); }          // e-posta onayı kapalıysa direkt girer
        else { setBilgi("Hesabın oluşturuldu! E-postana gelen onay linkine tıkla, sonra giriş yap."); setYuk(false); }
      } else {
        const {error}=await sb.auth.signInWithPassword({ email:e, password:sifre });
        if(error){ setHata(authHata(error.message)); setYuk(false); return; }
        tamamla();
      }
    }catch(err){ setHata("Beklenmedik bir hata oldu. Tekrar dene."); setYuk(false); }
  };
  const sifremiUnuttum = async ()=>{
    setHata(""); setBilgi("");
    const e=email.trim().toLowerCase();
    if(!e){ setHata("Önce e-posta adresini yaz."); return; }
    if(!sb){ setHata("Sunucuya bağlanılamadı."); return; }
    try{ await sb.auth.resetPasswordForEmail(e); setBilgi("Şifre sıfırlama linki e-postana gönderildi."); }
    catch(err){ setHata("Gönderilemedi, tekrar dene."); }
  };
  const sosyalGiris = async (provider)=>{
    setHata(""); setBilgi("");
    if(!sb){ setHata("Sunucuya bağlanılamadı."); return; }
    try{
      const {error}=await sb.auth.signInWithOAuth({ provider, options:{ redirectTo: window.location.origin+window.location.pathname+window.location.search } });
      if(error) setHata((provider==="apple"?"Apple":"Google")+" girişi henüz açık değil. (Ayar gerekiyor)");
    }catch(e){ setHata("Giriş başlatılamadı."); }
  };

  return <div className="fz-giris" style={{position:"fixed",inset:0,zIndex:2000,background:T.bg0,overflow:"hidden",display:"flex",flexDirection:"column"}}>
    <KapiGlow T={T}/>
    <button onClick={()=>kapiGit("tanitim")} className="tap" style={{position:"absolute",top:18,left:16,zIndex:5,fontSize:22,color:T.textSoft,background:"none",border:0}}>‹</button>
    <div style={{position:"relative",zIndex:1,flex:1,overflowY:"auto",padding:"56px 22px 26px"}}>
      {!uyeol && <div className="vav-suzul" style={{width:56,height:56,borderRadius:16,marginBottom:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,background:`linear-gradient(135deg, ${T.accent}, ${T.accent2||T.accent})`,boxShadow:`0 12px 30px ${T.accent}55`}}>⚽</div>}
      <div style={{fontFamily:T.fontDisplay,fontSize:24,fontWeight:800,color:T.text,marginBottom:4}}>{uyeol?"Hesap oluştur":"Tekrar hoş geldin 👋"}</div>
      <div style={{color:T.textMut,fontSize:12.5,marginBottom:28}}>{uyeol?"Google ile saniyeler içinde başla.":"Google ile giriş yap, ligine devam et."}</div>

      {/* GOOGLE — büyük ana buton */}
      <button onClick={()=>sosyalGiris("google")} disabled={yuk} className="tap" style={{width:"100%",background:"#fff",color:"#1a1a1a",border:"none",borderRadius:14,padding:"15px",fontSize:15,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:11,boxShadow:"0 8px 22px rgba(0,0,0,.18)",opacity:yuk?.7:1}}>
        <svg width="20" height="20" viewBox="0 0 48 48" style={{flexShrink:0}}><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
        Google ile devam et
      </button>
      <div style={{textAlign:"center",marginTop:12,fontSize:11,color:T.textMut,lineHeight:1.5}}>Devam ederek <a href="/gizlilik/" target="_blank" rel="noopener" style={{color:T.textSoft}}>Gizlilik &amp; KVKK</a> metnini kabul etmiş olursun.</div>

      {/* E-posta ile devam et — küçük ikincil seçenek */}
      {!epostaAcik && <div style={{textAlign:"center",marginTop:16}}>
        <span onClick={()=>{ setEpostaAcik(true); setHata(""); setBilgi(""); }} className="tap" style={{color:T.textMut,fontSize:12.5,fontWeight:600,cursor:"pointer",borderBottom:"1px solid "+T.line,paddingBottom:2}}>E-posta ile devam et</span>
      </div>}

      {/* E-POSTA FORMU — sadece istenirse açılır */}
      {epostaAcik && <div className="fade-in" style={{marginTop:22}}>
        {uyeol && <>
          <div style={etStil}>AD SOYAD</div>
          <input value={ad} onChange={ev=>setAd(ev.target.value)} placeholder="Örn: Fatih Erol" style={inpStil}/>
        </>}
        <div style={etStil}>E-POSTA</div>
        <input value={email} onChange={ev=>setEmail(ev.target.value)} type="email" autoCapitalize="none" autoCorrect="off" placeholder="ornek@mail.com" style={inpStil}/>
        <div style={etStil}>ŞİFRE</div>
        <input value={sifre} onChange={ev=>setSifre(ev.target.value)} onKeyDown={ev=>{ if(ev.key==="Enter") gonder(); }} type="password" placeholder={uyeol?"En az 6 karakter":"••••••••"} style={{...inpStil,marginBottom:uyeol?15:8}}/>

        {!uyeol && <div style={{textAlign:"right",margin:"0 0 16px"}}><span onClick={sifremiUnuttum} className="tap" style={{color:T.accent,fontSize:11.5,fontWeight:600,cursor:"pointer"}}>Şifremi unuttum</span></div>}

        {uyeol && <div onClick={()=>setKvkk(v=>!v)} className="tap" style={{display:"flex",gap:9,alignItems:"flex-start",fontSize:11,color:T.textMut,lineHeight:1.5,margin:"4px 0 18px",cursor:"pointer"}}>
          <span style={{width:18,height:18,borderRadius:5,border:"1.5px solid "+T.accent,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",color:T.accent,fontSize:12,fontWeight:800,background:kvkk?T.accent+"22":"transparent"}}>{kvkk?"✓":""}</span>
          <span>Kullanım koşullarını ve gizlilik politikasını okudum, kabul ediyorum.</span>
        </div>}

        <button onClick={gonder} disabled={yuk} className="tap vav-bar" style={{width:"100%",border:"none",borderRadius:12,padding:14,fontFamily:T.fontDisplay,fontSize:14,fontWeight:800,background:T.accent,color:beyaz?"#fff":T.bg0,boxShadow:`0 8px 22px ${T.accent}52`,opacity:yuk?.7:1}}>{yuk?"Lütfen bekle...":(uyeol?"Üye Ol":"E-posta ile Giriş Yap")}</button>
      </div>}

      {hata && <div style={{fontSize:12,color:T.danger,background:T.danger+"18",border:"0.5px solid "+T.danger+"55",borderRadius:10,padding:"10px 12px",marginTop:16,lineHeight:1.5}}>{hata}</div>}
      {bilgi && <div style={{fontSize:12,color:T.accent,background:T.accent+"14",border:"0.5px solid "+T.accent+"55",borderRadius:10,padding:"10px 12px",marginTop:16,lineHeight:1.5}}>{bilgi}</div>}

      <div style={{textAlign:"center",fontSize:12,color:T.textMut,marginTop:24}}>
        {uyeol?"Zaten üye misin? ":"Hesabın yok mu? "}
        <b onClick={()=>{ setHata("");setBilgi(""); kapiGit(uyeol?"giris":"uyeol"); }} className="tap" style={{color:T.accent,fontWeight:700,cursor:"pointer"}}>{uyeol?"Giriş Yap":"Üye Ol"}</b>
      </div>
      {!HERKESE_ACIK && <div style={{textAlign:"center",fontSize:10,color:T.gold,background:T.gold+"1a",border:"0.5px solid "+T.gold+"4d",borderRadius:10,padding:8,marginTop:18}}>🔒 Test modu — şimdilik sadece yetkili hesaplar girebilir</div>}
    </div>
  </div>;
}

/* Yasal — KVKK/Gizlilik + Kullanım Koşulları (şablon, hukukçu onayı önerilir) */
function YasalSayfa({T, git, tip}){
  const [sekme,setSekme]=useState(tip==="kosul"?"kosul":"gizlilik");
  const P=({children})=><p style={{fontSize:12.5,color:T.textSoft,lineHeight:1.75,marginBottom:12}}>{children}</p>;
  const H=({children})=><div style={{fontSize:13.5,color:T.text,fontWeight:800,margin:"16px 0 8px",fontFamily:T.fontDisplay}}>{children}</div>;
  return <div className="fade-in" style={{paddingBottom:90}}>
    <Baslik ust="YASAL" ana="Gizlilik & Koşullar" T={T}/>
    <div style={{display:"flex",gap:6,padding:"6px 14px 0"}}>
      {[["gizlilik","🔒 Gizlilik / KVKK"],["kosul","📜 Kullanım Koşulları"]].map(([k,l])=>
        <button key={k} onClick={()=>setSekme(k)} className="tap" style={{flex:1,fontSize:11.5,padding:"9px",borderRadius:9,fontWeight:700,background:sekme===k?T.accent:T.bg1,color:sekme===k?T.bg0:T.textMut,border:"0.5px solid "+(sekme===k?T.accent:T.line)}}>{l}</button>
      )}
    </div>
    <div style={{padding:"14px 16px"}}>
      <div style={{fontSize:10,color:T.gold,background:T.gold+"14",border:"0.5px solid "+T.gold+"40",borderRadius:9,padding:9,marginBottom:14,lineHeight:1.5}}>ℹ️ Bu metin bir taslaktır. Yayına almadan önce bir hukukçuya kontrol ettirmen önerilir.</div>
      {sekme==="gizlilik" ? <div>
        <P>ForzaLig ("uygulama") olarak gizliliğine önem veriyoruz. Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında hangi verileri, neden ve nasıl işlediğimizi açıklar.</P>
        <H>Toplanan Veriler</H>
        <P>• Hesap bilgileri: e-posta adresi, ad (üyelik için).<br/>• Uygulama içi veriler: oluşturduğun lig, takım, oyuncu, maç ve istatistik bilgileri.<br/>• Teknik: oturum bilgisi (giriş yapabilmen için).</P>
        <H>Verilerin Kullanımı</H>
        <P>Verilerin yalnızca uygulamanın çalışması (hesabın, liglerin, bulut senkronu) için işlenir. Verilerin başka kişilerle paylaşılmaz; yalnızca <b>senin "herkese açık" yaptığın ligler</b> herkes tarafından görüntülenebilir.</P>
        <H>Saklama ve Güvenlik</H>
        <P>Veriler güvenli altyapıda (Supabase) saklanır ve erişim güvenlik kurallarıyla (RLS) korunur; her kullanıcı yalnızca kendi verisine erişebilir.</P>
        <H>Haklarının</H>
        <P>Dilediğin zaman verilerine erişebilir, düzeltebilir veya hesabının silinmesini talep edebilirsin. İletişim: uygulama üzerinden.</P>
        <H>Çerezler</H>
        <P>Uygulama, oturumun açık kalması için tarayıcı depolamasını (localStorage) kullanır; reklam/izleme çerezi kullanmaz.</P>
      </div> : <div>
        <P>Bu uygulamayı kullanarak aşağıdaki koşulları kabul etmiş olursun.</P>
        <H>1. Hizmet</H>
        <P>ForzaLig, halı saha liglerini yönetmen, paylaşman ve istatistik tutman için sunulan bir uygulamadır. Hizmet "olduğu gibi" sunulur.</P>
        <H>2. Kullanıcı Sorumluluğu</H>
        <P>Girdiğin bilgilerden (lig, oyuncu, skor) sen sorumlusun. Başkalarının haklarını ihlal eden, hakaret/uygunsuz içerik girmemeyi kabul edersin.</P>
        <H>3. İçerik ve Paylaşım</H>
        <P>"Herkese açık" yaptığın ligler herkes tarafından görüntülenebilir. Uygunsuz içerik yönetim tarafından kaldırılabilir.</P>
        <H>4. Hesap</H>
        <P>Hesabının güvenliğinden sen sorumlusun. Kötüye kullanım durumunda hesap askıya alınabilir.</P>
        <H>5. Sorumluluk Reddi</H>
        <P>Uygulama, veri kaybı veya kesintilerden doğabilecek zararlardan sorumlu tutulamaz. Önemli verilerini yedeklemen önerilir.</P>
        <H>6. Değişiklikler</H>
        <P>Bu koşullar zaman zaman güncellenebilir. Güncel sürüm uygulamada yayınlanır.</P>
      </div>}
    </div>
  </div>;
}

/* FAZ 13 — Süper Admin Paneli (sadece yetkili) */
/* ============================================================
   ROL SEÇİMİ — giriş sonrası bir kez (profil.rol boşsa).
   Futbolcu / Hakem / İzleyici. Bilgiler profiller tablosuna yazılır.
   ============================================================ */
function RolSecim({T, oturum, profil, onKaydet, onKapat, baslangic}){
  const meta=(oturum&&oturum.user_metadata)||{};
  const [asama,setAsama]=useState(baslangic||"secim"); // secim | futbolcu | hakem | bitti
  const [ad,setAd]=useState((profil&&profil.ad)||meta.full_name||meta.name||"");
  const [dogum,setDogum]=useState((profil&&profil.dogum)||"");
  const [boy,setBoy]=useState((profil&&profil.boy)||"");
  const [kilo,setKilo]=useState((profil&&profil.kilo)||"");
  const [mevki,setMevki]=useState((profil&&profil.mevki)||"Defans");
  const [ayak,setAyak]=useState((profil&&profil.ayak)||"Sağ");
  const [sehir,setSehir]=useState((profil&&profil.sehir)||"");
  const [foto,setFoto]=useState((profil&&profil.foto)||meta.avatar_url||meta.picture||"");
  const [fotoYuk,setFotoYuk]=useState(false);
  const [kayit,setKayit]=useState(false);
  const [bittiRol,setBittiRol]=useState("");
  const fotoSec=async(e)=>{ const f=e.target.files&&e.target.files[0]; if(!f)return; setFotoYuk(true); const r=await fotoYukle(f,"profil",foto&&foto.indexOf("supabase")>-1?foto:null); if(r&&r.url) setFoto(r.url); else if(r&&r.hata) alert(r.hata); setFotoYuk(false); e.target.value=""; };
  const kaydet=async(rol)=>{
    if(!oturum){ return; }
    setKayit(true);
    const roller={...((profil&&profil.roller)||{})}; if(rol==="futbolcu"||rol==="hakem") roller[rol]=true;
    const obj={ rol, roller, ad:(ad||"").trim()||null, sehir:(sehir||"").trim()||null, foto:foto||null };
    if(rol==="futbolcu"){ obj.dogum=dogum||null; obj.boy=boy?parseInt(boy)||null:null; obj.kilo=kilo?parseInt(kilo)||null:null; obj.mevki=mevki; obj.ayak=ayak; }
    await Db.profilKaydet(oturum.id, obj);
    try{ Db.olayYaz&&Db.olayYaz(oturum,'rol',rol); }catch(e){}
    setKayit(false); setBittiRol(rol); setAsama("bitti");
  };
  const bitir=()=> onKaydet({...(profil||{}), rol:bittiRol});
  const IN={width:"100%",boxSizing:"border-box",background:T.bg1,border:"0.5px solid "+T.line,borderRadius:12,padding:"13px 14px",color:T.text,fontSize:14.5,fontFamily:"inherit",outline:"none"};
  const LBL={fontSize:11,fontWeight:800,color:T.textMut,letterSpacing:.4,textTransform:"uppercase",display:"block",margin:"16px 2px 7px"};
  const BTN={width:"100%",background:T.accent,color:T.renkCifti&&T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0,fontWeight:800,fontSize:15,padding:15,border:0,borderRadius:14,fontFamily:"inherit",marginTop:22,cursor:"pointer"};
  const chip=(on)=>({background:on?T.accent:T.bg1,border:"1px solid "+(on?T.accent:T.line),color:on?(T.renkCifti&&T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0):T.textSoft,borderRadius:20,padding:"9px 14px",fontSize:13,fontWeight:600,cursor:"pointer"});
  const fotoKutu=<div style={{textAlign:"center"}}>
    <label className="tap" style={{display:"inline-flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,width:96,height:96,borderRadius:"50%",background:T.bg1,border:"2px dashed "+T.line,color:T.textMut,fontSize:11,cursor:"pointer",overflow:"hidden",backgroundImage:foto?`url(${foto})`:"none",backgroundSize:"cover",backgroundPosition:"center"}}>
      {!foto&&<><span style={{fontSize:26}}>{fotoYuk?"⏳":"📷"}</span>Fotoğraf</>}
      <input type="file" accept="image/*" onChange={fotoSec} style={{display:"none"}}/>
    </label>
  </div>;
  return <div className="fz-giris" style={{position:"fixed",inset:0,zIndex:2400,background:T.bg0,overflow:"hidden",display:"flex",flexDirection:"column"}}>
    {onKapat && asama!=="bitti" && <div onClick={onKapat} className="tap" style={{position:"absolute",top:"calc(14px + env(safe-area-inset-top))",right:16,zIndex:2,width:34,height:34,borderRadius:"50%",background:T.bg1,border:"0.5px solid "+T.line,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:T.textMut,cursor:"pointer"}}>✕</div>}
    <div style={{flex:1,overflowY:"auto",padding:"calc(30px + env(safe-area-inset-top)) 22px 30px",maxWidth:460,margin:"0 auto",width:"100%",boxSizing:"border-box"}}>
      {asama==="secim" && <>
        <div style={{textAlign:"center",marginBottom:6}}><span style={{fontWeight:900,fontSize:18,color:T.accent,fontFamily:T.fontDisplay}}>⚽ ForzaLig</span></div>
        <div style={{fontSize:23,fontWeight:900,color:T.text,letterSpacing:-.5,lineHeight:1.2,fontFamily:T.fontDisplay}}>Seni nasıl tanıyalım?</div>
        <div style={{color:T.textMut,fontSize:13.5,lineHeight:1.6,marginTop:9}}>İstediğin zaman değiştirebilirsin, birden fazlası da olabilirsin. Şimdilik en çok ne yapacaksan onu seç.</div>
        <div style={{marginTop:22,display:"flex",flexDirection:"column",gap:12}}>
          <div onClick={()=>setAsama("futbolcu")} className="tap" style={{background:T.bg1,border:"1px solid "+T.line,borderRadius:18,padding:18,display:"flex",alignItems:"center",gap:15,cursor:"pointer"}}>
            <div style={{width:52,height:52,borderRadius:14,background:T.accent+"26",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0}}>⚽</div>
            <div style={{flex:1,minWidth:0}}><div style={{fontSize:16.5,fontWeight:800,color:T.text}}>Futbolcuyum</div><div style={{fontSize:12.5,color:T.textMut,marginTop:3,lineHeight:1.45}}>Bir takımda oynuyorum. Oyuncu kartımı oluşturayım.</div></div>
            <span style={{color:T.textMut,fontSize:20}}>›</span>
          </div>
          <div onClick={()=>setAsama("hakem")} className="tap" style={{background:T.bg1,border:"1px solid "+T.line,borderRadius:18,padding:18,display:"flex",alignItems:"center",gap:15,cursor:"pointer"}}>
            <div style={{width:52,height:52,borderRadius:14,background:(T.accent2||T.accent)+"26",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0}}>🧑‍⚖️</div>
            <div style={{flex:1,minWidth:0}}><div style={{fontSize:16.5,fontWeight:800,color:T.text}}>Hakemim</div><div style={{fontSize:12.5,color:T.textMut,marginTop:3,lineHeight:1.45}}>Maç yönetirim. Hakem havuzuna katılayım.</div></div>
            <span style={{color:T.textMut,fontSize:20}}>›</span>
          </div>
        </div>
        <div style={{textAlign:"center",marginTop:20}}>
          <span onClick={()=>kaydet("izleyici")} className="tap" style={{color:T.textMut,fontSize:13,cursor:"pointer",textDecoration:"underline"}}>{kayit?"Kaydediliyor…":"Şimdilik sadece bakacağım →"}</span>
        </div>
        <div style={{marginTop:24,background:T.gold+"14",border:"1px solid "+T.gold+"3a",borderRadius:14,padding:13,fontSize:12.5,color:T.textSoft,lineHeight:1.55}}>🏆 Lig/turnuva mı düzenliyorsun? O bir <b style={{color:T.text}}>başvuru</b> gerektirir — Keşfet sayfasındaki <b style={{color:T.text}}>“+ Lig Kur”</b> butonundan.</div>
      </>}

      {asama==="futbolcu" && <>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}><span onClick={()=>setAsama("secim")} className="tap" style={{fontSize:20,color:T.textSoft,cursor:"pointer"}}>‹</span><span style={{fontWeight:800,fontSize:15,color:T.text}}>⚽ Oyuncu Kartın</span></div>
        {fotoKutu}
        <label style={LBL}>Ad Soyad</label>
        <input value={ad} onChange={e=>setAd(e.target.value)} placeholder="Ad Soyad" style={IN}/>
        <label style={LBL}>Doğum Tarihi</label>
        <input type="date" value={dogum} onChange={e=>setDogum(e.target.value)} style={{...IN,color:dogum?T.text:T.textMut}}/>
        <div style={{display:"flex",gap:10}}>
          <div style={{flex:1}}><label style={LBL}>Boy (cm)</label><input value={boy} onChange={e=>setBoy(e.target.value.replace(/\D/g,""))} placeholder="178" inputMode="numeric" style={IN}/></div>
          <div style={{flex:1}}><label style={LBL}>Kilo (kg)</label><input value={kilo} onChange={e=>setKilo(e.target.value.replace(/\D/g,""))} placeholder="74" inputMode="numeric" style={IN}/></div>
        </div>
        <label style={LBL}>Mevki</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>{[["Kaleci","🧤 Kaleci"],["Defans","🛡️ Defans"],["OrtaSaha","🎯 Orta Saha"],["Forvet","⚡ Forvet"]].map(([k,l])=><span key={k} onClick={()=>setMevki(k)} className="tap" style={chip(mevki===k)}>{l}</span>)}</div>
        <label style={LBL}>Kullandığın Ayak</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>{["Sağ","Sol","Çift"].map(k=><span key={k} onClick={()=>setAyak(k)} className="tap" style={chip(ayak===k)}>{k}</span>)}</div>
        <button onClick={()=>kaydet("futbolcu")} disabled={kayit} style={BTN}>{kayit?"Kaydediliyor…":"Kartımı Oluştur"}</button>
        <div style={{marginTop:16,background:T.accent+"12",border:"1px solid "+T.accent+"33",borderRadius:14,padding:13,fontSize:12.5,color:T.textSoft,lineHeight:1.55}}>💡 Bir lige katılmak için yöneticinden davet linki iste. Bilgilerin hazır bekler.</div>
      </>}

      {asama==="hakem" && <>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}><span onClick={()=>setAsama("secim")} className="tap" style={{fontSize:20,color:T.textSoft,cursor:"pointer"}}>‹</span><span style={{fontWeight:800,fontSize:15,color:T.text}}>🧑‍⚖️ Hakem Kaydın</span></div>
        {fotoKutu}
        <label style={LBL}>Ad Soyad</label>
        <input value={ad} onChange={e=>setAd(e.target.value)} placeholder="Ad Soyad" style={IN}/>
        <label style={LBL}>Şehir</label>
        <input value={sehir} onChange={e=>setSehir(e.target.value)} placeholder="İstanbul" style={IN}/>
        <button onClick={()=>kaydet("hakem")} disabled={kayit} style={BTN}>{kayit?"Kaydediliyor…":"Hakem Havuzuna Katıl"}</button>
        <div style={{marginTop:16,background:(T.accent2||T.accent)+"12",border:"1px solid "+(T.accent2||T.accent)+"33",borderRadius:14,padding:13,fontSize:12.5,color:T.textSoft,lineHeight:1.55}}>🎽 Havuza girince lig yöneticileri seni maça atarken bulur.</div>
      </>}

      {asama==="bitti" && <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",minHeight:"70vh"}}>
        <div style={{width:82,height:82,borderRadius:"50%",background:T.accent+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:40,marginBottom:20}}>{bittiRol==="hakem"?"🎽":bittiRol==="futbolcu"?"🎉":"👋"}</div>
        <div style={{fontSize:22,fontWeight:900,color:T.text,fontFamily:T.fontDisplay}}>{bittiRol==="hakem"?"Havuzdasın!":bittiRol==="futbolcu"?"Kartın hazır!":"Hoş geldin!"}</div>
        <div style={{color:T.textMut,fontSize:13.5,lineHeight:1.6,marginTop:10,maxWidth:300}}>{bittiRol==="hakem"?"Lig yöneticileri artık seni maçlara atayabilir.":bittiRol==="futbolcu"?"Yöneticinden davet linki iste; bilgilerin dolu gelir.":"Ligleri keşfetmeye başlayabilirsin."}</div>
        <button onClick={bitir} style={{...BTN,maxWidth:240}}>Uygulamaya Gir →</button>
      </div>}
    </div>
  </div>;
}

/* ============================================================
   LİG KURMA BAŞVURUSU — yetkisi olmayan kişi doldurur, süper
   admin paneline düşer. ad/telefon/email ZORUNLU.
   ============================================================ */
function LigBasvuru({T, oturum, git}){
  const [ad,setAd]=useState((oturum&&oturum.user_metadata&&(oturum.user_metadata.full_name||oturum.user_metadata.name))||"");
  const [tel,setTel]=useState("");
  const [email,setEmail]=useState((oturum&&oturum.email)||"");
  const [ligAd,setLigAd]=useState("");
  const [sehir,setSehir]=useState("");
  const [takimSayi,setTakimSayi]=useState("");
  const [mesaj,setMesaj]=useState("");
  const [durum,setDurum]=useState("form"); // form | gonderiliyor | ok | zaten
  const [hata,setHata]=useState("");
  useEffect(()=>{ let a=true; (async()=>{ if(oturum && await Db.basvurumVar(oturum.id)){ if(a) setDurum("zaten"); } })(); return ()=>{a=false;}; },[oturum]);
  const gonder=async()=>{
    if(!ad.trim()||!tel.trim()||!email.trim()){ setHata("Ad soyad, telefon ve e-posta zorunlu."); return; }
    setHata(""); setDurum("gonderiliyor");
    const r=await Db.basvuruEkle({ user_id:oturum?oturum.id:null, ad_soyad:ad.trim(), telefon:tel.trim(), email:email.trim(), lig_ad:ligAd.trim()||null, sehir:sehir.trim()||null, takim_sayisi:takimSayi?parseInt(takimSayi)||null:null, mesaj:mesaj.trim()||null, durum:'bekliyor' });
    if(r&&r.ok){ try{ Db.olayYaz&&Db.olayYaz(oturum,'basvuru','lig'); }catch(e){} setDurum("ok"); }
    else { setHata((r&&r.hata)||"Gönderilemedi, tekrar dene."); setDurum("form"); }
  };
  const IN={width:"100%",boxSizing:"border-box",background:T.bg1,border:"0.5px solid "+T.line,borderRadius:12,padding:"13px 14px",color:T.text,fontSize:14.5,fontFamily:"inherit",outline:"none"};
  const LBL={fontSize:11,fontWeight:800,color:T.textMut,letterSpacing:.4,textTransform:"uppercase",display:"block",margin:"15px 2px 7px"};
  if(durum==="ok"||durum==="zaten") return <div className="fade-in" style={{padding:"40px 24px",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center"}}>
    <Baslik ust="LİG KURMA" ana="Başvuru" T={T}/>
    <div style={{width:82,height:82,borderRadius:"50%",background:T.accent+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:40,margin:"18px 0 20px"}}>📞</div>
    <div style={{fontSize:20,fontWeight:900,color:T.text,fontFamily:T.fontDisplay}}>{durum==="zaten"?"Başvurun alındı":"Başvurun gönderildi"}</div>
    <div style={{color:T.textMut,fontSize:13.5,lineHeight:1.6,marginTop:10,maxWidth:320}}>En kısa sürede <b style={{color:T.textSoft}}>seni arayacağız</b>. Anlaşınca lig yönetici yetkin açılır ve kurmaya başlarsın.</div>
    <button onClick={()=>git({sayfa:"ligler"})} className="tap" style={{marginTop:22,background:T.bg1,color:T.textSoft,border:"0.5px solid "+T.line,borderRadius:12,padding:"12px 24px",fontSize:13,fontWeight:700}}>Keşfet'e dön</button>
  </div>;
  return <div className="fade-in" style={{paddingBottom:100}}>
    <Baslik ust="LİG KURMA" ana="Başvuru" T={T}/>
    <div style={{padding:"6px 16px"}}>
      <div style={{color:T.textMut,fontSize:13.5,lineHeight:1.6}}>Ligini biz kuralım. Formu doldur — <b style={{color:T.textSoft}}>seni arayıp</b> detayları konuşalım ve yetkini açalım.</div>
      <label style={LBL}>Ad Soyad <span style={{color:T.danger}}>*</span></label>
      <input value={ad} onChange={e=>setAd(e.target.value)} placeholder="Adın soyadın" style={IN}/>
      <label style={LBL}>Telefon <span style={{color:T.danger}}>*</span></label>
      <input value={tel} onChange={e=>setTel(e.target.value)} placeholder="05__ ___ __ __" inputMode="tel" style={IN}/>
      <label style={LBL}>E-posta <span style={{color:T.danger}}>*</span></label>
      <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="ornek@mail.com" inputMode="email" style={IN}/>
      <label style={LBL}>Lig / Turnuva Adı</label>
      <input value={ligAd} onChange={e=>setLigAd(e.target.value)} placeholder="Örn. Cuma Akşamı Ligi" style={IN}/>
      <div style={{display:"flex",gap:10}}>
        <div style={{flex:1}}><label style={LBL}>Şehir</label><input value={sehir} onChange={e=>setSehir(e.target.value)} placeholder="İstanbul" style={IN}/></div>
        <div style={{flex:1}}><label style={LBL}>Takım sayısı</label><input value={takimSayi} onChange={e=>setTakimSayi(e.target.value.replace(/\D/g,""))} placeholder="8" inputMode="numeric" style={IN}/></div>
      </div>
      <label style={LBL}>Eklemek istediğin (opsiyonel)</label>
      <textarea value={mesaj} onChange={e=>setMesaj(e.target.value)} placeholder="Kısa not…" rows={3} style={{...IN,resize:"vertical"}}/>
      {hata && <div style={{color:T.danger,fontSize:12,marginTop:10,fontWeight:600}}>{hata}</div>}
      <button onClick={gonder} disabled={durum==="gonderiliyor"} className="tap" style={{width:"100%",background:T.accent,color:T.renkCifti&&T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0,fontWeight:800,fontSize:15,padding:15,border:0,borderRadius:14,fontFamily:"inherit",marginTop:20,cursor:"pointer"}}>{durum==="gonderiliyor"?"Gönderiliyor…":"Başvuruyu Gönder"}</button>
      <div style={{textAlign:"center",color:T.textMut,fontSize:11.5,marginTop:12,lineHeight:1.5}}>Zorunlu alanlar <span style={{color:T.danger}}>*</span> ile işaretli — sana ulaşabilmemiz için.</div>
    </div>
  </div>;
}

