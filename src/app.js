function App(){
  // localStorage yardımcıları
  const KAYIT="fatihpro_veri_v1";
  const yukle=()=>{ try{ const s=localStorage.getItem(KAYIT); return s?JSON.parse(s):null; }catch(e){ return null; } };
  const ilk=yukle();
  // eski kayıtlara lisans no ata (bir kez)
  if(ilk && ilk.turnuvalar){
    const temizle=(ad)=> (ad && /\s\d+$/.test(ad) && TAKIM_ADLARI.some(n=>ad.startsWith(n))) ? ad.replace(/\s\d+$/,"") : ad;
    ilk.turnuvalar.forEach(t=>{
      (t.takimlar||[]).forEach(tk=>{
        if(!tk.lisNo) tk.lisNo=lisansUret("takim");
        tk.ad=temizle(tk.ad);
        (tk.oyuncular||[]).forEach(o=>{
          if(!o.lisNo) o.lisNo=lisansUret("oyuncu");
          if(!o.ayak) o.ayak=pick(["Sağ","Sağ","Sağ","Sol","Çift"]);
          if(o.takimAd) o.takimAd=temizle(o.takimAd);
        });
      });
      (t.maclar||[]).forEach(m=>{
        m.takimA=temizle(m.takimA); m.takimB=temizle(m.takimB);
        if(m.mvpTakim) m.mvpTakim=temizle(m.mvpTakim);
        (m.olaylar||[]).forEach(o=>{ if(o.takim) o.takim=temizle(o.takim); });
      });
    });
  }

  // PREMIUM MOTOR — iki katman: STİL (5) + RENK (opsiyonel vurgu)
  const [stilKey,setStilKey]=useState(()=> (ilk&&ilk.stilKey) || "zumrut");
  const [renkKey,setRenkKey]=useState(()=>{
    if(ilk&&ilk.renkKey!==undefined) return ilk.renkKey;                 // yeni kayıt
    if(ilk&&ilk.temaKey&&ESKI_TEMA_RENK[ilk.temaKey]) return ESKI_TEMA_RENK[ilk.temaKey]; // eski tek-tema → renk
    return ""; // stilin kendi rengi
  });
  // Supabase varsa (canlı): başlangıçta BOŞ — ligler ilişkiselden yüklenir (eski yerel demo karışmasın)
  const [turnuvalar,setTurnuvalar]=useState(()=> sb ? [] : ((ilk&&ilk.turnuvalar)||uretVeri(5,9,12)));
  const [nav,setNav]=useState(()=> (!PAYLASIM_SLUG && !DAVET_TOKEN && BASLANGIC_SAYFA) ? {sayfa:BASLANGIC_SAYFA} : {sayfa:"ana"});
  const [navGecmis,setNavGecmis]=useState([]); // geri navigasyonu için yığın
  // FAZ 7 — açılış kapısı: "splash" | "tanitim" | "giris" | "uyeol" | null(uygulama)
  const GIRIS_FLAG="forzalig_giris_v1";
  const [kapi,setKapi]=useState(()=>{ if(PAYLASIM_SLUG||DAVET_TOKEN) return null; try{ return localStorage.getItem(GIRIS_FLAG) ? null : "splash"; }catch(e){ return "splash"; } });
  const kapiTamamla=()=>{ try{ localStorage.setItem(GIRIS_FLAG,"1"); }catch(e){} setKapi(null); };
  const [authHazir,setAuthHazir]=useState(false); // ilk Supabase oturum kontrolü bitti mi
  const [ekleAcik,setEkleAcik]=useState(false); // ortadaki + (Ekle) alt menüsü
  // FAZ 4 — ilk giriş rehberi (onboarding turu): kapı geçildikten sonra bir kez
  const REHBER_FLAG="forzalig_rehber_v1";
  const [rehberGoster,setRehberGoster]=useState(false);
  const rehberBitir=()=>{ try{ localStorage.setItem(REHBER_FLAG,"1"); }catch(e){} setRehberGoster(false); };
  const rehberBaslat=()=>setRehberGoster(true); // Ayarlar'dan tekrar açmak için
  useEffect(()=>{
    if(kapi!==null || PAYLASIM_SLUG || DAVET_TOKEN) return;   // kapı açıkken / paylaşım / davet akışında gösterme
    try{ if(!localStorage.getItem(REHBER_FLAG)) setRehberGoster(true); }catch(e){}
  },[kapi]);
  // Görünür viewport + klavye + header yüksekliği → CSS değişkenleri (iOS/Android/Safari/PWA kalıcı çözüm)
  useEffect(()=>{
    const vv=window.visualViewport;
    const olcHeader=()=>{ const tb=document.querySelector('.fz-topbar'); if(tb) document.documentElement.style.setProperty('--fz-hdr', Math.round(tb.getBoundingClientRect().height)+'px'); };
    const uygula=()=>{
      const h=vv?vv.height:window.innerHeight;
      const ofs=vv?vv.offsetTop:0;                                              // iOS klavye açınca görünür viewport kayması
      const kb=Math.max(0, window.innerHeight-(vv?(vv.height+vv.offsetTop):window.innerHeight)); // klavye yüksekliği
      const r=document.documentElement.style;
      r.setProperty('--vvh', Math.round(h)+'px');
      r.setProperty('--vvtop', Math.round(ofs)+'px');
      r.setProperty('--kb', Math.round(kb)+'px');
      olcHeader();
    };
    uygula();
    const t1=setTimeout(uygula,250), t2=setTimeout(uygula,800);
    if(vv){ vv.addEventListener('resize',uygula); vv.addEventListener('scroll',uygula); }
    window.addEventListener('resize',uygula); window.addEventListener('orientationchange',uygula);
    return ()=>{ clearTimeout(t1); clearTimeout(t2); if(vv){ vv.removeEventListener('resize',uygula); vv.removeEventListener('scroll',uygula); } window.removeEventListener('resize',uygula); window.removeEventListener('orientationchange',uygula); };
  },[]);
  // Sayfa/banner değişince header yüksekliğini yeniden ölç (salt-okunur/destek şeridi eklenip kalkabilir)
  useEffect(()=>{ const tb=document.querySelector('.fz-topbar'); if(tb) document.documentElement.style.setProperty('--fz-hdr', Math.round(tb.getBoundingClientRect().height)+'px'); });
  // ÇEKİRDEK — app-içi bildirim (gerçek, Supabase tabanlı)
  const [gercekBildirim,setGercekBildirim]=useState([]); // {id,tip,baslik,metin,link_tip,link_id,okundu,olusma}
  const okunmamis = gercekBildirim.filter(b=>!b.okundu).length;
  // FAZ 8 — online oturum & bulut senkron
  const [oturum,setOturum]=useState(null);      // supabase kullanıcı (null=çıkış)
  const [bulutDurum,setBulutDurum]=useState(""); // kısa senkron göstergesi
  const [liglerYuk,setLiglerYuk]=useState(true); // ligler ilk yükleniyor mu (boş ekran yerine gösterge)
  const [evrenAktif,setEvrenAktif]=useState(false); // demo/evren görüntüleme modunda mıyız (kendi ligler gizlenir)
  const bulutHazir=useRef(false);                // ilk bulut yüklemesi bitti mi
  const bulutZaman=useRef(null);                 // son bilinen bulut zamanı (çakışma tespiti)
  const [catisma,setCatisma]=useState(false);    // başka cihaz veriyi değiştirdi
  const [iliskiselModu,setIliskiselModu]=useState(false); // stres testi: ilişkiselden yüklendi → buluta YAZMA (gerçek veriyi koru)
  const [adminMi,setAdminMi]=useState(false);   // giriş yapan kişi Süper Admin mi
  const [profil,setProfil]=useState(null);      // kullanıcı rol/profil (profiller tablosu); null=henüz yüklenmedi
  const [rolSor,setRolSor]=useState(false);     // rol seçimi ekranı göster (artık ZORUNLU değil — opsiyonel)
  const [rolBaslangic,setRolBaslangic]=useState("secim"); // rol ekranı hangi adımdan açılsın (futbolcu/hakem/secim)
  const [rolGizli,setRolGizli]=useState(()=>{ try{ return !!localStorage.getItem('fz_rol_gizle'); }catch(e){ return false; } }); // hoş geldin şeridi gizlendi mi
  const [yasakli,setYasakli]=useState(null);    // {sebep} → hesap askıya alındı ekranı
  const [yardimciLigler,setYardimciLigler]=useState(()=>new Set()); // yardımcı yönetici olduğum lig id'leri
  const [ligKurYetkim,setLigKurYetkim]=useState(false); // lig hakkı olan üye VEYA admin
  // FAZ 9 — paylaşılan lig (salt-okunur public görünüm)
  const [destek,setDestek]=useState(null);            // 👁 Destek Modu: {uid, ad} — kimlik taklidi YOK, salt-okunur
  const [destekProfil,setDestekProfil]=useState(null);  // hedefin profili/rolleri (menüleri simüle etmek için)
  const [destekAdminMi,setDestekAdminMi]=useState(false);
  const [destekLigKur,setDestekLigKur]=useState(false);
  const destekTimer=useRef(null);
  const [saltOkunurBase]=useState(()=> !!PAYLASIM_SLUG);
  // FAZ 3 — sistem anahtarları (bakım modu). Açılışta tek hafif okuma; kullanıcıyı yavaşlatmaz.
  const [sistemBayrak,setSistemBayrak]=useState({});
  useEffect(()=>{ let a=true; Db.ayarlarOku().then(x=>{ if(a) setSistemBayrak(x||{}); }); return ()=>{a=false;}; },[]);
  const bakimModu = (sistemBayrak.bakim==="1"||sistemBayrak.bakim===true) && !adminMi;  // admin hariç herkes salt-okunur
  const saltOkunur = saltOkunurBase || !!destek || bakimModu;  // destek/bakım = global salt-okunur (yazma/yetki otomatik kapanır)
  // 👁 DESTEK MODU — kullanıcı gözünden görüntüle. Oturum DEVRALINMAZ (admin kendi oturumunda kalır).
  const destekBaslat=async(u)=>{
    if(!u||!u.user_id) return;
    try{ Db.logla(oturum, "👁 Destek modu görüntüleme", (u.email||u.ad||u.user_id)); }catch(e){} // audit log (islem_log)
    // Hedefin bağlamını yükle: ligler + rolleri + yetkileri (menüleri birebir simüle et)
    let gelen=[];
    try{
      // Kullanıcının kendi ligleri + yayınlanan evren içeriği (normal kullanıcı ana sayfası birebir simüle edilsin)
      const [lg, evren, pr, adm, hak] = await Promise.all([
        Db.liglerYukle(u.user_id, false), Db.liglerEvrenHepsi(60), Db.profilGetir(u.user_id), Db.adminMi(u.user_id), Db.hakGetir(u.user_id)
      ]);
      const varOlan=new Set((lg||[]).map(l=>l.id));
      gelen = (lg||[]).concat((evren||[]).filter(l=>!varOlan.has(l.id)));
      setDestekProfil(pr||{roller:(u.roller||{}), rol:u.rol||null}); setDestekAdminMi(!!adm); setDestekLigKur(!!adm || (hak && hak.kalan>0));
    }catch(e){ gelen=[]; setDestekProfil({roller:(u.roller||{})}); setDestekAdminMi(false); setDestekLigKur(false); }
    gelen.forEach(t=>{ try{ turnuvaHesapla(t); }catch(e){} });
    setIliskiselModu(true); setTurnuvalar(gelen);
    setDestek({uid:u.user_id, ad:(u.ad||u.email||"Kullanıcı")});
    if(typeof git==="function") git({sayfa:"ana"});
    if(destekTimer.current) clearTimeout(destekTimer.current);
    destekTimer.current=setTimeout(()=>{ destekBitir(); }, 15*60000); // güvenlik: 15 dk sonra oto-çıkış
  };
  const destekBitir=async()=>{
    if(destekTimer.current){ clearTimeout(destekTimer.current); destekTimer.current=null; }
    let gelen=[]; try{ gelen = await Db.liglerYukle(oturum&&oturum.id, false); }catch(e){ gelen=[]; }
    gelen.forEach(t=>{ try{ turnuvaHesapla(t); }catch(e){} });
    setIliskiselModu(true); setTurnuvalar(gelen);
    setDestek(null); setDestekProfil(null); setDestekAdminMi(false); setDestekLigKur(false);
    if(typeof git==="function") git({sayfa:"admin"});
  };
  // Veri katmanı read-only kilidini salt-okunur duruma bağla (destek/paylaşım) — UI+veri birlikte
  useEffect(()=>{ Db.saltOkunurKilit(saltOkunur); return ()=>Db.saltOkunurKilit(false); },[saltOkunur]);
  // 🆘 Teşhis paketi — hassas olmayan bağlam (kullanıcı Sorun Bildir'de otomatik eklenir)
  const teshisUret=()=>{ try{ return { sayfa:nav.sayfa||"ana", rol:(profil&&profil.rol)||null, roller:(profil&&profil.roller)||null, adminMi:!!adminMi, ligKur:!!ligKurYetkim, ligSay:(turnuvalar&&turnuvalar.length)||0, surum:(window.__FL_SURUM||null), cihaz:((navigator&&navigator.userAgent)||"").slice(0,200), ekran:(window.innerWidth+"x"+window.innerHeight), online:!!(navigator&&navigator.onLine), dil:(navigator&&navigator.language)||null, ts:Date.now() }; }catch(e){ return {sayfa:"?", hata:String(e)}; } };
  const [paylasimYuk,setPaylasimYuk]=useState(()=> !!PAYLASIM_SLUG);
  const [paylasimHata,setPaylasimHata]=useState(false);
  const [tab,setTab]=useState("ana");
  const [aramaAcik,setAramaAcik]=useState(false); // arama overlay
  const [aramaMetin,setAramaMetin]=useState("");
  useEffect(()=>{ setAramaAcik(false); },[nav]); // sayfa degisince arama katmanini kapat (takilma onlemi)
  // Global hata yakalayıcı — React DIŞI çökmeleri de admin hata log'una yaz (throttle: oturum başına max 30, tekrar yok)
  useEffect(()=>{
    if(!sb) return;
    const gorulen=new Set(); let sayac=0;
    const yaz=(m)=>{ try{ m=String(m||"").slice(0,500); if(!m||gorulen.has(m)||sayac>=30) return; gorulen.add(m); sayac++; Db.hataKaydet(m, window.__FL_SAYFA||null, window.__FL_UID); }catch(e){} };
    const oh=(ev)=>yaz((ev&&ev.message)||(ev&&ev.error&&ev.error.message)||"window error");
    const ph=(ev)=>yaz("promise: "+((ev&&ev.reason&&(ev.reason.message||ev.reason))||"unhandled"));
    window.addEventListener('error', oh); window.addEventListener('unhandledrejection', ph);
    return ()=>{ window.removeEventListener('error', oh); window.removeEventListener('unhandledrejection', ph); };
  },[]);
  const [takipLig,setTakipLig]=useState(()=> (ilk&&ilk.takipLig)||[]);      // takip edilen turnuva id'leri
  const [takipOyuncu,setTakipOyuncu]=useState(()=> (ilk&&ilk.takipOyuncu)||[]); // takip edilen oyuncu id'leri
  const [takipTakim,setTakipTakim]=useState(()=> (ilk&&ilk.takipTakim)||[]); // takip edilen takım id'leri
  const [adminMod,setAdminMod]=useState(false); // süper admin: kart düzenleme yetkisi
  const [kayitDurum,setKayitDurum]=useState(""); // "kaydedildi" göstergesi
  const T=useMemo(()=>temaHesapla(stilKey, renkKey),[stilKey, renkKey]);

  // AÇILIŞTA bir kez: tüm turnuvaları yeniden hesapla (eski kayıtlı veride ödül/kurtarış işlenmemişse düzelt)
  useEffect(()=>{
    setTurnuvalar(p=>{ p.forEach(t=>turnuvaHesapla(t)); return [...p]; });
  // eslint-disable-next-line
  },[]);

  // OTOMATİK KAYIT — her değişiklikte localStorage'a yaz
  useEffect(()=>{
    if(saltOkunur) return; // paylaşılan ligi izleyen kişinin verisini bozma
    try{
      // İlişkisel modda ligler buluttan gelir → yerel kopya tutma (stale cache önlemi). Tercihler yine kaydolur.
      localStorage.setItem(KAYIT, JSON.stringify({turnuvalar: iliskiselModu?[]:turnuvalar, stilKey, renkKey, takipLig, takipOyuncu, takipTakim, v:1, ts:Date.now()}));
    }catch(e){ /* kota dolarsa sessizce geç */ }
  },[turnuvalar, stilKey, renkKey, takipLig, takipOyuncu, takipTakim]);

  // AÇILIŞTA YENİDEN HESAPLA — eski kayıtlı veride ödül/istatistik sayaçları
  // güncel mantıkla yeniden işlensin (tek seferlik, mount'ta)
  useEffect(()=>{
    turnuvalar.forEach(t=>{ try{ turnuvaHesapla(t); }catch(e){} });
    setTurnuvalar(p=>[...p]);
  },[]);

  // DEMO KUPA — sadece Supabase YOKSA (çevrimdışı demo). Canlıda ilişkisel yüklenir.
  useEffect(()=>{
    if(saltOkunur || sb) return;
    setTurnuvalar(p=> p.some(t=>t.id===990001) ? p : (()=>{ try{ return [demoKupa(), ...p]; }catch(e){ return p; } })());
  },[]);

  // FAZ 9 — paylaşılan ligi buluttan çek (salt-okunur, girişsiz)
  useEffect(()=>{
    if(!PAYLASIM_SLUG) return;
    let aktif=true;
    const ONBELLEK="forzalig_lig_cache_"+PAYLASIM_SLUG;
    (async()=>{
      let lig=await Paylas.getir(PAYLASIM_SLUG);
      // FAZ 3 — çevrimdışı: ağdan gelmezse son görülen kopyayı localStorage'dan aç
      let cevrimdisi=false;
      if(!(lig && Array.isArray(lig.takimlar))){
        try{ const c=localStorage.getItem(ONBELLEK); if(c){ lig=JSON.parse(c); cevrimdisi=true; } }catch(e){}
      }
      if(!aktif) return;
      if(lig && Array.isArray(lig.takimlar)){
        try{ turnuvaHesapla(lig); }catch(e){}
        setTurnuvalar([lig]);
        setNav({sayfa:"turnuva", turnuva:lig});
        if(cevrimdisi) setBulutDurum("Çevrimdışı — son kayıtlı görünüm");
        // başarıyla ağdan geldiyse çevrimdışı için sakla
        if(!cevrimdisi){ try{ localStorage.setItem(ONBELLEK, JSON.stringify(lig)); }catch(e){} }
        // dinamik SEO/sosyal başlık
        try{
          const bas=lig.ad+" · ForzaLig";
          const acik=(lig.sehir?lig.sehir+" · ":"")+lig.takimlar.length+" takım · puan durumu ve kral listeleri ForzaLig'de";
          document.title=bas;
          const setMeta=(sel,val)=>{ const el=document.querySelector(sel); if(el) el.setAttribute("content",val); };
          setMeta('meta[property="og:title"]',bas); setMeta('meta[name="twitter:title"]',bas);
          setMeta('meta[name="description"]',acik); setMeta('meta[property="og:description"]',acik); setMeta('meta[name="twitter:description"]',acik);
        }catch(e){}
      } else { setPaylasimHata(true); }
      setPaylasimYuk(false);
    })();
    return ()=>{ aktif=false; };
  },[]);

  // FAZ 14 — CANLI: paylaşılan ligi izleyen kişi periyodik yenilesin
  useEffect(()=>{
    if(!PAYLASIM_SLUG || !saltOkunur) return;
    const iv=setInterval(async()=>{
      const lig=await Paylas.getir(PAYLASIM_SLUG);
      if(lig && Array.isArray(lig.takimlar)){
        try{ turnuvaHesapla(lig); }catch(e){}
        setTurnuvalar([lig]);
        setNav(n=> n.sayfa==="turnuva" ? {...n, turnuva:lig} : n);
        try{ localStorage.setItem("forzalig_lig_cache_"+PAYLASIM_SLUG, JSON.stringify(lig)); }catch(e){} // çevrimdışı için güncel tut
      }
    }, 25000);
    return ()=>clearInterval(iv);
  },[]);

  // FAZ 8 — Supabase oturumunu izle (açılışta + değişince)
  useEffect(()=>{
    if(!sb) return;
    let aktif=true;
    // test modunda izinsiz e-posta (ör. Google/Apple) girerse çıkışa at
    const kapiKontrol=(u)=>{
      if(u && !mailIzinli(u.email)){
        try{ sb.auth.signOut(); }catch(e){}
        setOturum(null);
        alert("🚧 ForzaLig şu an test modunda. Çok yakında herkese açılacak!");
        return null;
      }
      return u;
    };
    sb.auth.getSession().then(({data})=>{
      if(!aktif) return;
      const u=kapiKontrol(data.session?data.session.user:null);
      setOturum(u);
      if(u){ setKapi(null); try{ Db.benBuradayim(); }catch(e){} } // zaten girişli → açılış kapısını atla + MAU için "buradayım"
      setAuthHazir(true);
    }).catch(()=>{ if(aktif) setAuthHazir(true); });
    const {data:sub}=sb.auth.onAuthStateChange((_ev,session)=>{
      const u=kapiKontrol(session?session.user:null);
      setOturum(u);
      if(u) setKapi(null);            // giriş yapıldı → uygulamayı aç (kilitlenme yok)
      if(!u) bulutHazir.current=false;
      setAuthHazir(true);
    });
    return ()=>{ aktif=false; try{ sub.subscription.unsubscribe(); }catch(e){} };
  },[]);

  // ÜYELİK ZORUNLU — giriş yoksa uygulamaya girişi engelle (davet akışı hariç).
  // authHazir: ilk oturum kontrolü bitmeden yönlendirme yapma (girişli kullanıcı yanıp sönmesin).
  useEffect(()=>{
    if(!sb || !authHazir || DAVET_TOKEN) return;
    if(!oturum && kapi===null){
      let gordu=false; try{ gordu=!!localStorage.getItem(GIRIS_FLAG); }catch(e){}
      setKapi(gordu ? "giris" : "splash");
    }
  },[authHazir, oturum, kapi]);

  // FAZ 3 — İLİŞKİSEL yükleme: girişli → kendi ligleri (yönetim), ziyaretçi → tüm public ligler
  useEffect(()=>{
    if(!sb || saltOkunur || DAVET_TOKEN){ setLiglerYuk(false); return; }
    let aktif=true;
    setLiglerYuk(true);
    (async()=>{
      // Aktif demo evren varsa (Göster'e basılmış) → yenilemede de o evren kalsın (mod). Yoksa gerçek ligler.
      const aktEv = (()=>{ try{ return oturum ? localStorage.getItem('fz_aktif_evren') : null; }catch(e){ return null; } })();
      // Yayınlanan herkese-açık evren içeriği HERKESE görünür (kendi liglerine ek olarak)
      const evrenBirlestir=(kendi)=>{ const varOlan=new Set((kendi||[]).map(l=>l.id)); return (kendi||[]).concat((evrenHepsi||[]).filter(l=>!varOlan.has(l.id))); };
      let ligler, evrenHepsi=[];
      if(!oturum){
        const [acik, evren] = await Promise.all([Db.liglerYukleAcik(), Db.liglerEvrenHepsi(60)]);
        evrenHepsi=evren; ligler = evrenBirlestir(acik);
      } else if(aktEv){
        ligler = await Db.liglerEvrenYukle(aktEv);
        // Evren silinmiş/boşsa modda takılı kalma → gerçek liglere otomatik dön
        if(!ligler.length){ try{ localStorage.removeItem('fz_aktif_evren'); }catch(e){} const [benim,evren]=await Promise.all([Db.liglerYukle(oturum.id, false),Db.liglerEvrenHepsi(60)]); evrenHepsi=evren; ligler=evrenBirlestir(benim); }
      } else {
        const [benim, evren] = await Promise.all([Db.liglerYukle(oturum.id, false), Db.liglerEvrenHepsi(60)]);
        evrenHepsi=evren; ligler = evrenBirlestir(benim);
      }
      if(!aktif) return;
      setEvrenAktif(!!(oturum && (()=>{ try{ return localStorage.getItem('fz_aktif_evren'); }catch(e){ return null; } })()));
      if(oturum){ window.__FL_UID=oturum.id; Db.adminMi(oturum.id).then(a=>{ if(aktif) setAdminMi(!!a); }); Promise.all([Db.adminMi(oturum.id),Db.hakGetir(oturum.id)]).then(([a,h])=>{ if(aktif) setLigKurYetkim(!!a || (h && h.kalan>0)); }); Db.yasakliMi(oturum.id).then(y=>{ if(aktif && y) setYasakli(true); }); Db.yardimciLiglerim(oturum.id).then(ids=>{ if(aktif) setYardimciLigler(new Set(ids)); }); Db.profilGetir(oturum.id).then(p=>{ if(!aktif) return; setProfil(p||{}); }); } else { window.__FL_UID=null; setAdminMi(false); setLigKurYetkim(false); setYasakli(null); setYardimciLigler(new Set()); setProfil(null); setRolSor(false); }
      ligler.forEach(t=>{ try{ turnuvaHesapla(t); }catch(e){} });
      setIliskiselModu(true);            // blob otomatik kaydı/yeniden yayını KAPALI
      setTurnuvalar(ligler);
      setLiglerYuk(false);
      bulutHazir.current=true;
      setBulutDurum(ligler.length ? ("Yüklendi ✓ ("+ligler.length+" lig)") : "");
      setTimeout(()=>{ if(aktif) setBulutDurum(""); },2200);
    })();
    return ()=>{ aktif=false; };
  },[oturum]);

  // Demo/evren görüntüleme modundan çık → gerçek liglere dön (görünür şerit için)
  const evrenModundanCik=async()=>{
    try{ localStorage.removeItem('fz_aktif_evren'); }catch(e){}
    setEvrenAktif(false);
    if(!oturum) return;
    setLiglerYuk(true);
    const [benim,evren]=await Promise.all([Db.liglerYukle(oturum.id,false),Db.liglerEvrenHepsi(60)]);
    const varOlan=new Set((benim||[]).map(l=>l.id));
    const ligler=(benim||[]).concat((evren||[]).filter(l=>!varOlan.has(l.id)));
    ligler.forEach(t=>{ try{ turnuvaHesapla(t); }catch(e){} });
    setTurnuvalar(ligler); setLiglerYuk(false); git({sayfa:"ana"});
  };
  // ÇEKİRDEK — bildirimleri yükle + periyodik yenile (girişliyken)
  const bildirimYenile=async()=>{ if(!sb||!oturum) return; const b=await Db.bildirimlerim(); setGercekBildirim(b); };
  useEffect(()=>{
    if(!sb || !oturum || saltOkunur){ setGercekBildirim([]); return; }
    let aktif=true;
    bildirimYenile();
    const t=setInterval(()=>{ if(aktif) bildirimYenile(); }, 30000); // 30sn'de bir
    return ()=>{ aktif=false; clearInterval(t); };
  },[oturum]);

  // FAZ 8 — girişliyken her değişikliği buluta yaz (gecikmeli, ÇAKIŞMA korumalı)
  useEffect(()=>{
    if(!sb || !oturum || !bulutHazir.current || saltOkunur || catisma || iliskiselModu) return;
    const t=setTimeout(async()=>{
      const r=await Bulut.kaydetGuvenli(oturum.id, {turnuvalar, stilKey, renkKey, takipLig, takipOyuncu, takipTakim, v:1}, bulutZaman.current);
      if(r.catisma){ setCatisma(true); }                       // başka cihaz değiştirmiş → SESSİZCE EZME, sor
      else if(r.ok){ bulutZaman.current=r.zaman; setBulutDurum("Senkron ✓"); setTimeout(()=>setBulutDurum(""),1500); }
    },1400);
    return ()=>clearTimeout(t);
  },[turnuvalar, stilKey, renkKey, takipLig, takipOyuncu, takipTakim, oturum, catisma, iliskiselModu]);

  // ÇAKIŞMA çözümü — kullanıcı seçer
  const catismaOnlariniYukle=async()=>{
    const r=await Bulut.yukle(oturum.id);
    if(r && r.veri && Array.isArray(r.veri.turnuvalar)){
      let gelen=r.veri.turnuvalar;
      setTurnuvalar(gelen);
      // NOT: stil/renk artık GLOBAL (site_ayar) — kişisel buluttan uygulanmaz
      if(Array.isArray(r.veri.takipLig))setTakipLig(r.veri.takipLig);
      if(Array.isArray(r.veri.takipOyuncu))setTakipOyuncu(r.veri.takipOyuncu);
      if(Array.isArray(r.veri.takipTakim))setTakipTakim(r.veri.takipTakim);
      bulutZaman.current=r.zaman;
    }
    setCatisma(false);
  };
  const catismaBenimkiniYaz=async()=>{
    const ok=await Bulut.kaydet(oturum.id, {turnuvalar, stilKey, renkKey, takipLig, takipOyuncu, takipTakim, v:1});
    if(ok){ bulutZaman.current=await Bulut.buluttakiZaman(oturum.id); }
    setCatisma(false);
  };

  // FAZ 14 — CANLI: yayınlı ligler değişince otomatik yeniden yayınla (izleyiciler görsün)
  useEffect(()=>{
    if(!sb || !oturum || saltOkunur || iliskiselModu) return;
    const yayinli=turnuvalar.filter(t=>t.paylasimSlug);
    if(!yayinli.length) return;
    const t=setTimeout(()=>{ yayinli.forEach(tt=>{ try{ Paylas.yayinla(oturum.id, tt); }catch(e){} }); }, 2000);
    return ()=>clearTimeout(t);
  },[turnuvalar, oturum, iliskiselModu]);

  // FAZ 8 — çıkış yap
  const cikisYap=async()=>{
    if(sb){ try{ await sb.auth.signOut(); }catch(e){} }
    bulutHazir.current=false;
    setOturum(null);
    try{ localStorage.removeItem(GIRIS_FLAG); }catch(e){}
    setKapi("giris");
  };

  // FAZ 9 — ligi herkese aç / paylaş / kaldır
  const paylasLig=async(turnuva)=>{
    if(!oturum) return {hata:"Paylaşmak için önce giriş yapmalısın."};
    const r=await Paylas.yayinla(oturum.id, turnuva);
    if(!r || !r.slug){
      let m=(r&&r.hata)||"";
      if(/schema cache|does not exist|find the table/i.test(m)) m="Sunucu tabloları yeni fark ediyor — 1 dakika bekleyip tekrar dene.";
      else if(/row-level security|violates/i.test(m)) m="Yetki hatası (RLS). Bana haber ver.";
      else if(m) m="Yayınlanamadı: "+m;
      else m="Yayınlanamadı. İnternetini kontrol edip tekrar dene.";
      return {hata:m};
    }
    turnuva.paylasimSlug=r.slug; setTurnuvalar(p=>[...p]);
    return {url:PAYLASIM_URL(r.slug), slug:r.slug};
  };
  const paylasKaldir=async(turnuva)=>{
    if(turnuva.paylasimSlug){ await Paylas.kaldir(turnuva.paylasimSlug); }
    turnuva.paylasimSlug=null; setTurnuvalar(p=>[...p]);
  };

  // FAZ 9 — oyuncu sahiplenme (kariyer)
  const [sahiplenme,setSahiplenme]=useState(null);
  useEffect(()=>{
    if(!sb || !oturum || saltOkunur){ setSahiplenme(null); return; }
    let a=true; Paylas.sahiplenmem(oturum.id).then(s=>{ if(a) setSahiplenme(s); });
    return ()=>{ a=false; };
  },[oturum]);
  const oyuncuSahiplen=async(oyuncu, turnuva)=>{
    if(!oturum) return {hata:"Sahiplenmek için önce giriş yap."};
    const kayit={ oyuncu_ad:oyuncu.ad, oyuncu_id:oyuncu.id, lig_slug:(turnuva&&turnuva.paylasimSlug)||null, lig_ad:(turnuva&&turnuva.ad)||(oyuncu.turnuva||"") };
    const ok=await Paylas.sahiplen(oturum.id, kayit);
    if(ok){ setSahiplenme({user_id:oturum.id, ...kayit}); return {ok:true}; }
    return {hata:"Kaydedilemedi, tekrar dene."};
  };
  const sahiplenmeyiBirak=async()=>{ if(oturum){ await Paylas.sahiplenmeKaldir(oturum.id); setSahiplenme(null); } };

  const adAra=(tip,id)=>{ try{ for(const t of turnuvalar){ if(tip==='lig'&&t.id===id) return t.ad; for(const tk of t.takimlar){ if(tip==='takim'&&tk.id===id) return tk.ad; if(tip==='oyuncu') for(const o of tk.oyuncular){ if(o.id===id) return o.ad; } } } }catch(e){} return null; };
  const ligTakip=(id)=> setTakipLig(p=>{ const ekle=!p.includes(id); Db.takipYaz(oturum,'lig',id,adAra('lig',id),ekle); return ekle?[...p,id]:p.filter(x=>x!==id); });
  const oyuncuTakip=(id)=> setTakipOyuncu(p=>{ const ekle=!p.includes(id); Db.takipYaz(oturum,'oyuncu',id,adAra('oyuncu',id),ekle); return ekle?[...p,id]:p.filter(x=>x!==id); });
  const takimTakip=(id)=> setTakipTakim(p=>{ const ekle=!p.includes(id); Db.takipYaz(oturum,'takim',id,adAra('takim',id),ekle); return ekle?[...p,id]:p.filter(x=>x!==id); });

  // bildirim akışı (takip edilenlere göre üretilir)
  const bildirimler=useMemo(()=>{
    const b=[];
    const tumO=Motor.tumOyuncular(turnuvalar);
    // takip edilen ligler: son maç + lider
    turnuvalar.forEach(t=>{
      if(takipLig.includes(t.id)){
        const oynanan=t.maclar.filter(m=>m.oynandi);
        const sonMac=oynanan[oynanan.length-1];
        if(sonMac) b.push({ikon:"⚽",metin:`${t.ad}: ${sonMac.takimA} ${sonMac.skorA}-${sonMac.skorB} ${sonMac.takimB}`,renk:T.accent});
        const lider=[...t.takimlar].sort((a,b)=>(b.puan||0)-(a.puan||0))[0];
        if(lider && oynanan.length>0) b.push({ikon:"📈",metin:`${t.ad}: ${lider.ad} zirvede (${lider.puan} puan)`,renk:T.accent2});
      }
    });
    // takip edilen takımlar: son maç sonucu
    turnuvalar.forEach(t=> t.takimlar.forEach(tk=>{
      if(takipTakim.includes(tk.id)){
        const mac=t.maclar.filter(m=>m.oynandi && (m.takimA===tk.ad||m.takimB===tk.ad)).slice(-1)[0];
        if(mac){ const kendiA=mac.takimA===tk.ad; const at=kendiA?mac.skorA:mac.skorB, ye=kendiA?mac.skorB:mac.skorA;
          const sonuc=at>ye?"kazandı 🎉":at<ye?"kaybetti":"berabere kaldı";
          b.push({ikon:"🛡️",metin:`${tk.ad} ${sonuc}: ${mac.takimA} ${mac.skorA}-${mac.skorB} ${mac.takimB}`,renk:at>ye?T.accent:at<ye?T.danger:T.textMut}); }
      }
    }));
    // takip edilen oyuncular: MVP / gol
    tumO.forEach(o=>{
      if(takipOyuncu.includes(o.id)){
        if((o.mvp||0)>0) b.push({ikon:"⭐",metin:`${o.ad} ${o.mvp} kez maçın adamı seçildi`,renk:T.gold});
        else if((o.gol||0)>0) b.push({ikon:"🔥",metin:`${o.ad} bu sezon ${o.gol} gol attı`,renk:T.gold});
      }
    });
    // kariyerim
    if(sahiplenme){
      const benim=tumO.find(o=>o.id===sahiplenme.oyuncu_id||o.ad===sahiplenme.oyuncu_ad);
      if(benim) b.push({ikon:"👤",metin:`Kariyerin: ${benim.ad} — ${benim.gol||0} gol, ${benim.asist||0} asist`,renk:T.accent});
    }
    return b.slice(0,12);
  },[turnuvalar,takipLig,takipOyuncu,takipTakim,sahiplenme,stilKey,renkKey]);

  useEffect(()=>{
    const r=document.documentElement.style;
    r.setProperty("--bg0",T.bg0); r.setProperty("--text",T.text); r.setProperty("--font-body",T.fontBody);
    r.setProperty("--font-display",T.fontDisplay); r.setProperty("--accent",T.accent);
    r.setProperty("--bg1",T.bg1); r.setProperty("--line",T.line);
    // premium gradyan atmosfer — tema accent'inden türet (neon stilde daha güçlü)
    const hex2rgb=(h)=>{ h=h.replace('#',''); return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]; };
    const stil=STILLER[stilKey]||STILLER.zumrut;
    try{
      const [ar,ag,ab]=hex2rgb(T.accent), [br,bg,bb]=hex2rgb(T.accent2||T.accent);
      // açık modda yumuşak, neon'da güçlü, diğerlerinde belirgin
      const gA=stil.acik?.10:(stil.neon?.30:.22), gB=stil.acik?.07:(stil.neon?.20:.15);
      r.setProperty("--glowA",`rgba(${ar},${ag},${ab},${gA})`);
      r.setProperty("--glowB",`rgba(${br},${bg},${bb},${gB})`);
    }catch(e){}
    document.body.style.background=T.bg0;
    // stil imzası → global CSS kancaları (büyük harf / neon / açık / cam)
    document.body.classList.toggle("stil-buyukharf", !!stil.buyukHarf);
    document.body.classList.toggle("stil-neon", !!stil.neon);
    document.body.classList.toggle("stil-acik", !!stil.acik);
    document.body.classList.toggle("stil-cam", !!stil.cam);
    document.body.dataset.stil = stilKey;   // temaya özel global gölge/atmosfer (CSS: body[data-stil=...])
  },[stilKey, renkKey]);

  // Hata loglayıcı için güncel sayfa bağlamı
  useEffect(()=>{ try{ window.__FL_SAYFA = nav && nav.sayfa; }catch(e){} },[nav]);

  // GLOBAL SİTE GÖRÜNÜMÜ — süper adminin seçtiği stil/renk herkeste görünür.
  // Açılışta sunucudan yükle + realtime dinle (admin değiştirince anında herkese düşer).
  useEffect(()=>{
    if(!sb) return; let aktif=true;
    Db.siteGorunum().then(g=>{ if(!aktif||!g) return; if(g.stil_key) setStilKey(g.stil_key); setRenkKey(g.renk_key||""); });
    let kanal=null;
    try{
      kanal=sb.channel("site_gorunum")
        .on("postgres_changes",{event:"UPDATE",schema:"public",table:"site_ayar"},(p)=>{
          const g=p&&p.new; if(!g) return; if(g.stil_key) setStilKey(g.stil_key); setRenkKey(g.renk_key||"");
        }).subscribe();
    }catch(e){}
    return ()=>{ aktif=false; try{ if(kanal) sb.removeChannel(kanal); }catch(e){} };
  },[]);

  // GEZİNME + TARAYICI GEÇMİŞİ — telefonun geri tuşu uygulamadan atmasın:
  // git() her sayfa geçişinde history'ye kayıt ekler; geri tuşu (popstate) iç yığından döner.
  const titret=(ms)=>{ try{ if(navigator.vibrate) navigator.vibrate(ms||8); }catch(e){} }; // haptik: kısa dokunuş hissi (destekleyen cihazlarda)
  const git=(n)=>{ titret(); setNavGecmis(p=>[...p, nav]); setNav(n); try{ window.history.replaceState({...(window.history.state||{}), sy:window.scrollY}, ""); window.history.pushState({fz:1},"",URL_FOR(n)); }catch(e){} window.scrollTo(0,0); try{ if(n&&n.sayfa) Db.olayYaz(oturum,'sayfa',n.sayfa); }catch(e){} };
  const geriIc=()=>{ setNavGecmis(p=>{ if(p.length===0){ setNav({sayfa:"ana"}); return p; } const son=p[p.length-1]; setNav(son); return p.slice(0,-1); }); window.scrollTo(0,0); };
  const geriIcRef=useRef(geriIc); geriIcRef.current=geriIc;
  // Uygulamanın kendi "←" butonu: bizim eklediğimiz kayıt varsa tarayıcıdan geri git
  // (popstate → geriIc); yoksa doğrudan iç yığından dön. İkisi hep senkron kalır.
  const geri=()=>{ try{ if(window.history.state&&window.history.state.fz){ window.history.back(); return; } }catch(e){} geriIc(); };
  useEffect(()=>{
    const din=()=>{ geriIcRef.current(); setTimeout(()=>{ try{ window.scrollTo(0,(window.history.state&&window.history.state.sy)||0); }catch(e){} },60); };
    window.addEventListener("popstate",din);
    return ()=>window.removeEventListener("popstate",din);
  },[]);
  // DERİN LİNK GERİ-YÜKLEME: ?mac= / ?takim= / ?oyuncu= → veri yüklenince o sayfaya dön (tek sefer)
  const derinRestoreRef=useRef(false);
  useEffect(()=>{
    if(derinRestoreRef.current) return;
    if(!(MAC_ID||TAKIM_ID||OYUNCU_ID)) return;
    if(!turnuvalar||!turnuvalar.length) return;
    derinRestoreRef.current=true;
    try{
      if(MAC_ID){ for(const t of turnuvalar){ const mm=(t.maclar||[]).find(x=>String(x.id)===String(MAC_ID)); if(mm){ git({sayfa:"mac",mac:mm,turnuva:t}); return; } } }
      if(TAKIM_ID){ for(const t of turnuvalar){ const tk=(t.takimlar||[]).find(x=>String(x.id)===String(TAKIM_ID)); if(tk){ git({sayfa:"takim",takim:tk,turnuva:t}); return; } } }
      if(OYUNCU_ID){ for(const t of turnuvalar){ for(const tk of (t.takimlar||[])){ const o=(tk.oyuncular||[]).find(x=>String(x.player_id||x.id)===String(OYUNCU_ID)); if(o){ git({sayfa:"oyuncu",oyuncu:{...o,takimAd:tk.ad,turnuva:t.ad}}); return; } } } }
    }catch(e){}
  },[turnuvalar]);
  const veriUret=(a,b,c)=>{ setTurnuvalar(uretVeri(a,b,c)); setNav({sayfa:"ana"}); setNavGecmis([]); setTab("ana"); };
  const veriSil=()=>{ setTurnuvalar([]); setNav({sayfa:"ana"}); setNavGecmis([]); setTab("ana"); };

  // YEDEKLE — tüm veriyi dosya olarak indir
  const yedekle=()=>{
    const veri={turnuvalar, stilKey, renkKey, takipLig, takipOyuncu, takipTakim, v:1, ts:Date.now()};
    const blob=new Blob([JSON.stringify(veri,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    const tarih=new Date().toISOString().slice(0,10);
    a.href=url; a.download=`forzalig-yedek-${tarih}.json`; a.click();
    URL.revokeObjectURL(url);
    setKayitDurum("İndirildi ✓"); setTimeout(()=>setKayitDurum(""),2500);
  };
  // YÜKLE — dosyadan veri geri al
  const yukleDosya=(file)=>{
    const r=new FileReader();
    r.onload=(e)=>{
      try{
        const v=JSON.parse(e.target.result);
        if(v && Array.isArray(v.turnuvalar)){
          setTurnuvalar(v.turnuvalar);
          // NOT: stil/renk artık GLOBAL (site_ayar) — yedek dosyadan uygulanmaz
          if(v.takipLig)setTakipLig(v.takipLig);
          if(v.takipOyuncu)setTakipOyuncu(v.takipOyuncu);
          if(v.takipTakim)setTakipTakim(v.takipTakim);
          setNav({sayfa:"ana"}); setTab("ana");
          setKayitDurum("Yüklendi ✓"); setTimeout(()=>setKayitDurum(""),2500);
        } else { alert("Geçersiz yedek dosyası."); }
      }catch(err){ alert("Dosya okunamadı. Doğru yedek dosyası mı?"); }
    };
    r.readAsText(file);
  };

  // FAZ 4 — state'i tazele (mutasyon sonrası re-render)
  const guncelle=()=> setTurnuvalar(p=>[...p]);

  // Yeni lig oluştur
  const ligKur=async({ad, sehir, ilce, renk, kisi, format, grupSayi, baslangic, hedefTakim})=>{
    const bilgi={ ad: ad||"Yeni Lig", renk: renk||pick(RENKLER), sehir: sehir||"İstanbul", ilce: ilce||"",
      kisi: kisi||7, format: format||"serbest", grupSayi: grupSayi||0, baslangic: baslangic||"", hedefTakim: hedefTakim||0 };
    // İLİŞKİSEL + HAK KONTROLÜ (Karar 3): yetkisi/hakkı yoksa RLS engeller
    if(sb && oturum){
      const r=await Db.ligOlustur(oturum.id, { ad:bilgi.ad, ulke:'TR', sehir:bilgi.sehir, ilce:bilgi.ilce, renk:bilgi.renk,
        kisi:bilgi.kisi, format:bilgi.format, grup_sayi:bilgi.grupSayi, hedef_takim:bilgi.hedefTakim, fikstur_tipi:bilgi.format });
      if(r.hata){
        const yetkiSorun=/policy|row-level|violates row|permission/i.test(r.hata);
        alert(yetkiSorun
          ? "⚠️ Lig açma hakkın yok.\n\nLig oluşturmak için Süper Admin'in sana yetki (lig hakkı) vermesi gerekiyor. IBAN ödemesi sonrası admin hakkını tanımlar."
          : ("Lig açılamadı: "+r.hata));
        return;
      }
      const yeni={ id:r.id, yonetici_id:oturum.id, ...bilgi, takimlar:[], maclar:[], iliskisel:true };
      setIliskiselModu(true);
      setTurnuvalar(p=>[...p, yeni]);
      setTimeout(()=>git({sayfa:"turnuva",turnuva:yeni}),0);
      return;
    }
    // Canlı sitede giriş yoksa lig kurulamaz (yetki: sadece hak verilen üye/admin)
    if(sb && !oturum){ alert("Lig kurmak için önce Google ile giriş yap ve Süper Admin'den lig hakkı al."); return; }
    // Çevrimdışı yedek (sb yok = demo modu) — eski davranış
    setTurnuvalar(p=>{
      const id=yeniId(p,"turnuva");
      const yeni={ id, ...bilgi, takimlar:[], maclar:[] };
      setTimeout(()=>git({sayfa:"turnuva",turnuva:yeni}),0);
      return [...p, yeni];
    });
  };
  // ===== İLİŞKİSEL KALICILIK YARDIMCILARI (Faz 3) =====
  const oyuncuDbKayit=(o)=>({ ad_soyad:o.ad, forma_no:(o.no??null), dogum:tarihISO(o.dogum), ayak:o.ayak||null,
    boy:(o.boy??null), kilo:(o.kilo??null), uyruk:o.uyruk||null, poz:o.poz||null, ovr:(o.ovr??null),
    nitelik:{pac:o.pac,sho:o.sho,pas:o.pas,dri:o.dri,def:o.def,phy:o.phy}, deger:(o.deger??null),
    saglik:o.saglik||null, bolge:o.bolge||null, renk:o.renk||o.formaRenk||null });
  const oyuncuIliskiselKaydet=async(ligId, takimId, o)=>{
    const or=await Db.oyuncuOlustur(oyuncuDbKayit(o));
    if(or.ok){ o.id=or.player_id; o.player_id=or.player_id; await Db.kadroEkle(or.player_id, takimId, ligId); }
    return or;
  };
  const takimIliskiselKaydet=async(ligId, tk)=>{
    const r=await Db.takimEkle(ligId, tk.ad);
    if(r.hata) return {hata:r.hata};
    await Db.takimGuncelle(r.id, {renk:tk.renk||null, grup:tk.grup||0, lis_no:tk.lisNo||null});
    tk.id=r.id;
    for(const o of (tk.oyuncular||[])) await oyuncuIliskiselKaydet(ligId, r.id, o);
    return {ok:true, id:r.id};
  };
  const iliskiselMi=(turnuva)=> !!(turnuva && turnuva.iliskisel && sb);
  // turnuvayı takımdan bul (oyuncu işlemlerinde lig_id lazım)
  const takiminTurnuvasi=(takim)=> turnuvalar.find(t=>t.takimlar.some(x=>x.id===takim.id));

  // Lig bilgilerini güncelle
  const ligGuncelle=(turnuva, alanlar)=>{
    Object.assign(turnuva, alanlar);
    if(iliskiselMi(turnuva)){ const db={}; if(alanlar.ad!=null)db.ad=alanlar.ad; if(alanlar.renk!=null)db.renk=alanlar.renk; if(alanlar.sehir!=null)db.sehir=alanlar.sehir; if(alanlar.ilce!=null)db.ilce=alanlar.ilce; if(alanlar.logo!=null)db.logo=alanlar.logo; if(alanlar.bitisTarihi!=null)db.bitis_tarihi=alanlar.bitisTarihi; if(alanlar.kurallar!=null)db.kurallar=alanlar.kurallar; if(Object.keys(db).length) Db.ligGuncelle(turnuva.id, db); }
    guncelle();
  };
  // Maç Gazetesi görünümü — lig varsayılanı + üye kilidi (yetkili belirler)
  const gazeteAyar=(turnuva, alanlar)=>{
    Object.assign(turnuva, alanlar);
    try{ localStorage.setItem('fz_gz_lig_'+turnuva.id, JSON.stringify({gzGorunum:turnuva.gzGorunum, gzUyeAcik:turnuva.gzUyeAcik})); }catch(e){}
    if(turnuva.paylasimSlug){ paylasLig(turnuva); } // yayındaki ligse izleyicilere yansı
    guncelle();
  };
  // Lig arşivle / aktif yap (madde 22) — maç oynanmışsa silinemez, arşivlenir
  const ligArsivle=async(turnuva, arsiv)=>{
    if(iliskiselMi(turnuva)){ const r=await Db.ligArsivle(turnuva.id, arsiv); if(r.hata){ alert("Olmadı: "+r.hata); return; } Db.logla(oturum, arsiv?"Lig arşivledi":"Ligi aktif etti", turnuva.ad); }
    turnuva.durum = arsiv ? 'arsiv' : 'aktif';
    if(arsiv){ git({sayfa:"ana"}); }
    guncelle();
  };
  // Yeni sezon başlat (Faz 3) — bu sezonu arşivle, takımlar+kadrolar yeni sezona otomatik taşınsın (Q21-24)
  const yeniSezon=async(turnuva)=>{
    if(!iliskiselMi(turnuva)){ alert("Yeni sezon yalnızca kayıtlı liglerde kullanılabilir."); return; }
    // Onay artık YonetimPaneli'nde iki-adımlı (yanlışlıkla basma koruması)
    const r=await Db.yeniSezonBaslat(turnuva.id);
    if(r.hata){ alert("Olmadı: "+r.hata); return; }
    Db.logla(oturum, "Yeni sezon başlattı", turnuva.ad);
    const yeni=await Db.ligYukle(r.yeniId);
    setTurnuvalar(p=>{ const upd=p.map(t=>t.id===turnuva.id?{...t,durum:'arsiv'}:t); return yeni?[yeni, ...upd.filter(t=>t.id!==yeni.id)]:upd; });
    if(yeni) setTimeout(()=>git({sayfa:"turnuva",turnuva:yeni}),0); else git({sayfa:"ana"});
  };
  // Lig tamamen sil (sadece maç oynanmamışsa; admin her zaman) — RLS korur
  const ligSilTam=async(turnuva)=>{
    if(iliskiselMi(turnuva)){ const r=await Db.ligSil(turnuva.id); if(r.hata){ alert("Silinemedi (maç oynanmış olabilir — arşivle): "+r.hata); return; } Db.logla(oturum, "Lig sildi", turnuva.ad); }
    setTurnuvalar(p=>p.filter(t=>t.id!==turnuva.id)); git({sayfa:"ana"});
  };
  // Süper Admin: ligi ÇÖP KUTUSUNA at (soft-delete) — 90 gün geri alınabilir, sonra otomatik kalıcı silinir.
  const ligSilAdmin=async(turnuva)=>{
    if(iliskiselMi(turnuva)){ const r=await Db.ligSoftSil(turnuva.id); if(r.hata){ alert("Olmadı: "+r.hata); return; } Db.logla(oturum, "Lig çöp kutusuna atıldı (admin)", turnuva.ad); }
    setTurnuvalar(p=>p.filter(t=>t.id!==turnuva.id)); git({sayfa:"ana"});
  };
  // TRANSFER — kaptan istek gönderir → lig yöneticisi onaylar/reddeder
  const transferEt=async(oyuncu, yeniTakimId)=>{
    let trn, eski;
    for(const t of turnuvalar){ for(const tk of t.takimlar){ if(tk.oyuncular.some(o=>o.id===oyuncu.id)){ trn=t; eski=tk; break; } } if(trn) break; }
    if(!trn||!eski) return {hata:"oyuncu bulunamadı"};
    const yeni=trn.takimlar.find(t=>t.id===yeniTakimId);
    if(!yeni||yeni.id===eski.id) return {hata:"geçersiz hedef"};
    if(iliskiselMi(trn) && typeof oyuncu.id==="string"){
      const t=await Db.transferTalep(oyuncu.id, trn.id, eski.id, yeniTakimId, oturum&&oturum.id);
      if(t.hata) return {hata:t.hata};
      Db.logla(oturum, "Transfer isteği gönderdi", oyuncu.ad+" → "+yeni.ad);
      return {ok:true, beklemede:true, yeniTakim:yeni.ad};
    }
    // yerel lig: direkt taşı
    const oyRef=eski.oyuncular.find(o=>o.id===oyuncu.id);
    eski.oyuncular=eski.oyuncular.filter(o=>o.id!==oyuncu.id);
    if(oyRef){ oyRef.takimAd=yeni.ad; oyRef.renk=yeni.renk; yeni.oyuncular.push(oyRef); }
    turnuvaHesapla(trn); guncelle();
    return {ok:true, yeniTakim:yeni.ad};
  };
  // Lig yöneticisi transfer onayı — DB trigger (trg_transfer_uygula) oyuncu_takim'i otomatik günceller
  const transferKabulEt=async(transfer)=>{
    const r=await Db.transferYoneticiOnay(transfer.id);
    if(r.hata) return {hata:r.hata};
    Db.logla(oturum, "Transfer onayladı", (transfer.oyuncular&&transfer.oyuncular.ad_soyad)||"");
    const trn=turnuvalar.find(t=>t.id===transfer.lig_id);
    if(trn){
      const eski=trn.takimlar.find(t=>t.id===transfer.eski_takim_id);
      const yeni=trn.takimlar.find(t=>t.id===transfer.yeni_takim_id);
      if(eski&&yeni){
        const oyRef=eski.oyuncular.find(o=>o.id===transfer.player_id);
        eski.oyuncular=eski.oyuncular.filter(o=>o.id!==transfer.player_id);
        if(oyRef){ oyRef.takimAd=yeni.ad; oyRef.renk=yeni.renk; yeni.oyuncular.push(oyRef); }
        turnuvaHesapla(trn); guncelle();
      }
    }
    return {ok:true};
  };
  // Lig yöneticisi transfer reddi
  const transferRedEt=async(transferId)=>{
    const r=await Db.transferReddet(transferId);
    if(r.hata) return {hata:r.hata};
    Db.logla(oturum, "Transfer reddetti", "");
    return {ok:true};
  };
  // Takım ekle
  const takimEkle=async(turnuva, ad, bos)=>{
    const tid=yeniId(turnuvalar,"takim"); const oid=yeniId(turnuvalar,"oyuncu");
    const yeni = yeniTakim(tid, ad, pick(RENKLER), oid, bos?0:12);
    if(iliskiselMi(turnuva)){ const r=await takimIliskiselKaydet(turnuva.id, yeni); if(r.hata){ alert("Takım eklenemedi: "+r.hata); return; } }
    turnuva.takimlar.push(yeni);
    guncelle();
    return yeni;
  };
  // Mevcut kulübü (Takımlarım) lige ekle — kadro otomatik kopyalanır (Q4/kulup_lige_katil)
  const kulupLigeEkle=async(turnuva, kulupId)=>{
    if(!iliskiselMi(turnuva)) return {hata:"kayıtlı lig gerekli"};
    const r=await Db.kulupLigeKatil(kulupId, turnuva.id, null);
    if(r.hata) return {hata:r.hata};
    const yeni=await Db.ligYukle(turnuva.id);
    if(yeni){ turnuva.takimlar=yeni.takimlar; turnuva.maclar=yeni.maclar; turnuvaHesapla(turnuva); }
    guncelle();
    return {ok:true};
  };
  // Takım düzenle (ad / renk) — lig sorumlusu
  const takimDuzenle=async(turnuva, takimId, alanlar)=>{
    const t=turnuva.takimlar.find(x=>x.id===takimId); if(!t) return;
    if(alanlar.ad!=null) t.ad=alanlar.ad; if(alanlar.renk!=null){ t.renk=alanlar.renk; if(alanlar.renk2==null && !t.renk2) t.renk2=ikinciRenk(alanlar.renk); (t.oyuncular||[]).forEach(o=>{ o.renk=alanlar.renk; o.formaRenk=alanlar.renk; }); }
    if(alanlar.renk2!=null) t.renk2=alanlar.renk2; if(alanlar.logo!==undefined) t.logo=alanlar.logo;
    if(iliskiselMi(turnuva) && typeof takimId==="string"){ const db={}; if(alanlar.ad!=null)db.ad=alanlar.ad; if(alanlar.renk!=null)db.renk=alanlar.renk; if(alanlar.renk2!=null)db.renk2=alanlar.renk2; if(alanlar.logo!==undefined)db.logo=alanlar.logo; if(Object.keys(db).length) await Db.takimGuncelle(takimId, db); }
    turnuvaHesapla(turnuva); guncelle();
  };
  // Takım sil (madde 23: maç yapılmışsa sunucu engeller)
  const takimSil=async(turnuva, takimId)=>{
    if(iliskiselMi(turnuva) && typeof takimId==="string"){ const r=await Db.takimSil(takimId); if(r.hata){ alert("Silinemedi (maç yapılmış olabilir): "+r.hata); return; } }
    turnuva.takimlar = turnuva.takimlar.filter(t=>t.id!==takimId);
    turnuva.maclar = turnuva.maclar.filter(m=>m.takimAId!==takimId && m.takimBId!==takimId);
    turnuvaHesapla(turnuva); guncelle();
  };
  // Oyuncu ekle (detaylı veya hızlı)
  const oyuncuEkle=async(takim, bilgi)=>{
    const oid=yeniId(turnuvalar,"oyuncu");
    const o=yeniOyuncu(oid, bilgi.ad, bilgi.poz, bilgi.no, takim.renk);
    if(bilgi.dogum){ o.dogum=bilgi.dogum; const y=parseInt((bilgi.dogum.split(".")[2]||bilgi.dogum.split("-")[0])); if(y>1950&&y<2020)o.yas=2026-y; }
    if(bilgi.boy) o.boy=parseInt(bilgi.boy)||o.boy;
    if(bilgi.kilo) o.kilo=parseInt(bilgi.kilo)||o.kilo;
    const trn=takiminTurnuvasi(takim);
    if(iliskiselMi(trn)){ await oyuncuIliskiselKaydet(trn.id, takim.id, o); }
    takim.oyuncular.push(o); guncelle(); return o;
  };
  // Toplu oyuncu ekle (isim listesi)
  const oyuncuTopluEkle=async(takim, isimler)=>{
    let oid=yeniId(turnuvalar,"oyuncu");
    const pozDagit=["Kaleci","Defans","Defans","OrtaSaha","OrtaSaha","Forvet","Forvet","Defans","OrtaSaha","Forvet","Defans","OrtaSaha"];
    const trn=takiminTurnuvasi(takim); const base=takim.oyuncular.length;
    for(let i=0;i<isimler.length;i++){
      const o=yeniOyuncu(oid++, isimler[i].trim(), pozDagit[(base+i)%pozDagit.length], base+i+1, takim.renk);
      if(iliskiselMi(trn)){ await oyuncuIliskiselKaydet(trn.id, takim.id, o); }
      takim.oyuncular.push(o);
    }
    guncelle();
  };
  // Oyuncu düzenle
  const oyuncuDuzenle=async(takim, oyuncuId, bilgi)=>{
    const o=takim.oyuncular.find(x=>x.id===oyuncuId); if(!o)return;
    if(bilgi.ad!=null)o.ad=bilgi.ad; if(bilgi.poz!=null)o.poz=bilgi.poz; if(bilgi.no!=null)o.no=parseInt(bilgi.no)||o.no;
    if(bilgi.dogum!=null){ o.dogum=bilgi.dogum; const y=parseInt((bilgi.dogum.split(".")[2]||bilgi.dogum.split("-")[0])); if(y>1950&&y<2020)o.yas=2026-y; }
    if(bilgi.boy!=null)o.boy=parseInt(bilgi.boy)||o.boy; if(bilgi.kilo!=null)o.kilo=parseInt(bilgi.kilo)||o.kilo;
    if(bilgi.ayak!=null)o.ayak=bilgi.ayak; if(bilgi.uyruk!=null)o.uyruk=bilgi.uyruk; if(bilgi.saglik!=null)o.saglik=bilgi.saglik;
    const trn=takiminTurnuvasi(takim);
    if(iliskiselMi(trn) && typeof o.id==="string"){ await Db.oyuncuGuncelle(o.id, { ad_soyad:o.ad, poz:o.poz, forma_no:o.no, dogum:tarihISO(o.dogum), boy:o.boy, kilo:o.kilo, ayak:o.ayak, uyruk:o.uyruk, saglik:o.saglik }); }
    guncelle();
  };
  // Oyuncu sil (madde 24: kariyer korunur → üyelikten çıkar, kayıt kalır)
  const oyuncuSil=async(takim, oyuncuId)=>{
    const trn=takiminTurnuvasi(takim);
    // Q17/Q18: çıkar → üyelik pasif (silinmez), istatistik korunur, oyuncuya bildirim gider
    if(iliskiselMi(trn) && typeof oyuncuId==="string"){ const r=await Db.oyuncuCikar(oyuncuId, takim.id); if(r&&r.hata){ await Db.kadrodanCikarPid(oyuncuId, takim.id); } }
    takim.oyuncular=takim.oyuncular.filter(x=>x.id!==oyuncuId); guncelle();
  };

  // EXCEL TOPLU EKLE — sütunlar: Takım | Ad Soyad | Doğum | Mevki | No | Boy | Kilo | Uyruk
  const excelTopluEkle=async(turnuva, satirlar)=>{
    let oid=yeniId(turnuvalar,"oyuncu");
    let tid=yeniId(turnuvalar,"takim");
    const rel=iliskiselMi(turnuva);
    const mevkiNorm=(s)=>{ s=(s||"").toLowerCase();
      if(s.includes("kale"))return "Kaleci";
      if(s.includes("def")||s.includes("stoper")||s.includes("bek"))return "Defans";
      if(s.includes("orta")||s.includes("os")||s.includes("mid"))return "OrtaSaha";
      if(s.includes("for")||s.includes("kanat")||s.includes("santra"))return "Forvet";
      return null;
    };
    let eklenenTakim=0, eklenenOyuncu=0;
    for(const satir of satirlar){
      const [takimAd, ad, dogum, mevki, no, ayak, boy, kilo, uyruk] = satir;
      if(!takimAd || !ad) continue;
      let takim = turnuva.takimlar.find(t=>t.ad.toLowerCase().trim()===takimAd.toLowerCase().trim());
      if(!takim){ takim=yeniTakim(tid++, takimAd.trim(), pick(RENKLER), oid, 0);
        if(rel){ const r=await Db.takimEkle(turnuva.id, takim.ad); if(!r.hata){ await Db.takimGuncelle(r.id,{renk:takim.renk,lis_no:takim.lisNo}); takim.id=r.id; } }
        turnuva.takimlar.push(takim); eklenenTakim++; }
      const poz = mevkiNorm(mevki) || ["Kaleci","Defans","Defans","OrtaSaha","OrtaSaha","Forvet","Forvet"][takim.oyuncular.length%7];
      const o=yeniOyuncu(oid++, ad.trim(), poz, parseInt(no)||takim.oyuncular.length+1, takim.renk);
      if(dogum && dogum.trim()){ o.dogum=dogum.trim(); const y=parseInt((dogum.split(".")[2]||dogum.split("-")[0]||dogum.split("/")[2])); if(y>1950&&y<2020)o.yas=2026-y; }
      if(ayak && ayak.trim()){ const a=ayak.trim().toLowerCase(); o.ayak = a.startsWith("sol")?"Sol":a.startsWith("çi")||a.startsWith("ci")||a.startsWith("ik")?"Çift":"Sağ"; }
      if(boy) o.boy=parseInt(boy)||o.boy;
      if(kilo) o.kilo=parseInt(kilo)||o.kilo;
      if(uyruk && uyruk.trim()) o.uyruk=uyruk.trim();
      if(rel && typeof takim.id==="string"){ await oyuncuIliskiselKaydet(turnuva.id, takim.id, o); }
      takim.oyuncular.push(o); eklenenOyuncu++;
    }
    if(turnuva.format==="gruplu"){ gruplaraDagit(turnuva,"kura"); if(rel){ for(const tk of turnuva.takimlar){ if(typeof tk.id==="string") await Db.takimGuncelle(tk.id,{grup:tk.grup||0}); } } }
    turnuvaHesapla(turnuva); guncelle();
    return {eklenenTakim, eklenenOyuncu};
  };
  // İlişkisel: oyuncu ad → player_id haritası (maç olayları için)
  const adPidHarita=(turnuva)=>{ const m={}; turnuva.takimlar.forEach(tk=>tk.oyuncular.forEach(o=>{ const pid=o.player_id||(typeof o.id==="string"?o.id:null); if(pid){ m[o.ad]=pid; if(o.id!=null) m[o.id]=pid; m[pid]=pid; } })); return m; };
  // İlişkisel: id'si olmayan (yeni) maçları kaydet, uuid ata
  const maclariSenkronize=async(turnuva)=>{
    if(!iliskiselMi(turnuva)) return;
    const P=adPidHarita(turnuva);
    for(const mc of turnuva.maclar){ if(typeof mc.id!=="string"){ const r=await Db.macKaydet(turnuva.id, mc, P); if(r.ok) mc.id=r.id; } }
  };
  // Maç ekle (serbest)
  const macEkle=async(turnuva, aId, bId)=>{
    const A=turnuva.takimlar.find(t=>t.id===aId), B=turnuva.takimlar.find(t=>t.id===bId);
    if(!A||!B||A.id===B.id) return;
    const mid=Math.max(0,...turnuva.maclar.map(m=>typeof m.id==="number"?m.id:0), yeniId(turnuvalar,"mac")-1)+1;
    const hafta=turnuva.maclar.length?Math.max(...turnuva.maclar.map(m=>m.hafta||0))+1:1;
    const yeni=yeniMac(mid, A, B, hafta);
    if(iliskiselMi(turnuva)){ const r=await Db.macKaydet(turnuva.id, yeni, adPidHarita(turnuva)); if(r.ok) yeni.id=r.id; }
    turnuva.maclar.push(yeni);
    guncelle();
  };
  // Maç sil
  const macSil=async(turnuva, macId)=>{
    if(iliskiselMi(turnuva) && typeof macId==="string"){ await Db.macSil(macId); }
    turnuva.maclar = turnuva.maclar.filter(m=>m.id!==macId);
    turnuvaHesapla(turnuva); guncelle();
  };
  // Fikstür üret (otomatik) — gruplu ise grup grup
  const fikstürYap=async(turnuva, cift)=>{
    turnuva.maclar = turnuva.format==="kupa" ? kupaFikstur(turnuva)
      : turnuva.format==="gruplu" ? gruplufikstürUret(turnuva, cift) : fikstürUret(turnuva, cift);
    if(iliskiselMi(turnuva)){ await Db.ligMaclariSil(turnuva.id); await maclariSenkronize(turnuva); }
    turnuvaHesapla(turnuva); guncelle();
  };
  // KUPA — sonraki turu oluştur / penaltı galibi seç
  const kupaSonraki=async(turnuva)=>{ const r=kupaSonrakiTur(turnuva); if(r.hata){ alert(r.hata); } else if(r.bitti){ alert("🏆 Şampiyon: "+(r.sampiyon?r.sampiyon.ad:"?")); } if(iliskiselMi(turnuva)) await maclariSenkronize(turnuva); turnuvaHesapla(turnuva); guncelle(); return r; };
  const penGalipSec=async(turnuva, mac, takimAd)=>{ mac.penGalip=takimAd; if(iliskiselMi(turnuva) && typeof mac.id==="string") await Db.macKaydet(turnuva.id, mac, adPidHarita(turnuva)); guncelle(); };
  // Gruplara dağıt
  const dagit=async(turnuva, yontem)=>{ gruplaraDagit(turnuva, yontem); if(iliskiselMi(turnuva)){ for(const tk of turnuva.takimlar){ if(typeof tk.id==="string") await Db.takimGuncelle(tk.id,{grup:tk.grup||0}); } } turnuvaHesapla(turnuva); guncelle(); };
  // Takımı başka gruba taşı
  const grupTasi=async(turnuva, takimId, yeniGrup)=>{
    const t=turnuva.takimlar.find(x=>x.id===takimId); if(t)t.grup=yeniGrup;
    if(iliskiselMi(turnuva) && typeof takimId==="string") await Db.takimGuncelle(takimId,{grup:yeniGrup});
    guncelle();
  };
  // Skor + olaylar kaydet
  const skorKaydet=async(turnuva, mac, skorA, skorB, olaylar, mvp, mvpTakim, oduller, ekstra)=>{
    mac.skorA=skorA; mac.skorB=skorB; mac.olaylar=olaylar||[]; mac.mvp=mvp||null; mac.mvpTakim=mvpTakim||null; mac.oynandi=true;
    mac.mvpId=(ekstra&&ekstra.mvpId)||null;
    if(ekstra&&ekstra.medya!==undefined) mac.medya=ekstra.medya;
    if(oduller) mac.oduller={...oduller};
    if(ekstra&&ekstra.odullerId) mac.odullerId={...ekstra.odullerId};
    if(!mac.istatistik) mac.istatistik=istatistikUret(skorA, skorB);
    const A=turnuva.takimlar.find(t=>t.id===mac.takimAId)||turnuva.takimlar.find(t=>t.ad===mac.takimA);
    const B=turnuva.takimlar.find(t=>t.id===mac.takimBId)||turnuva.takimlar.find(t=>t.ad===mac.takimB);
    mac.ratingler = ratingHesapla(mac, A, B);
    if(iliskiselMi(turnuva)){ const r=await Db.macKaydet(turnuva.id, mac, adPidHarita(turnuva)); if(r.ok && r.id) mac.id=r.id; }
    turnuvaHesapla(turnuva); guncelle();
    // TEK BİLDİRİM MERKEZİ — maç sonu fan-out (bir kez, idempotent). İlişkisel lig + skor girildiyse.
    if(iliskiselMi(turnuva) && typeof mac.id==="string" && !mac.bildirildi && (skorA!=null||skorB!=null)){
      mac.bildirildi=true;
      const ozet=`${mac.takimA} ${skorA}-${skorB} ${mac.takimB}`+(mac.mvp?` · ⭐ MVP: ${mac.mvp}`:"");
      const goller=(olaylar||[]).filter(x=>x.tip==="gol").map(x=>({ad:x.oyuncu, dk:x.dk, takim:x.takim})).slice(0,8);
      const kart={tip:"mac", takimA:mac.takimA, takimB:mac.takimB, skorA, skorB, mvp:mac.mvp||null, hafta:mac.hafta||null, macId:mac.id, goller};
      (async()=>{ try{
        await Db.bildirimDagit({ ligId:turnuva.id, takimIds:[mac.takimAId,mac.takimBId], senderId:(oturum&&oturum.id)||null, baslik:`⚽ ${(turnuva.ad||"Lig")} · Maç Sonucu`, metin:ozet, linkId:mac.id, sistemTip:"mac", kart, kanallar:{inapp:true, ligSohbet:true, takimSohbet:true, email:true} });
        try{ await sb.from('maclar').update({bildirildi:true}).eq('id',mac.id); }catch(e){}
      }catch(e){} })();
    }
  };
  // Rating'i yönetici elle düzeltir
  const ratingKaydet=async(mac, ratingler)=>{ mac.ratingler={...ratingler}; const trn=turnuvalar.find(t=>t.maclar.some(m=>m.id===mac.id)); if(trn && iliskiselMi(trn) && typeof mac.id==="string") await Db.macKaydet(trn.id, mac, adPidHarita(trn)); guncelle(); };
  // SİHİRBAZ — kadro + skor + olaylar + ödüller tek seferde kaydet
  const sihirbazKaydet=async(turnuva, mac, skorA, skorB, olaylar, mvp, mvpTakim, oduller, kadroPaket, ekstra)=>{
    if(kadroPaket){
      mac.kadroA=kadroPaket.kadroA; mac.kadroB=kadroPaket.kadroB;
      mac.dizilisA=kadroPaket.dizilisA; mac.dizilisB=kadroPaket.dizilisB;
      if(kadroPaket.sure) mac.sure=kadroPaket.sure;
      if(kadroPaket.kaleciler) mac.kaleciler=kadroPaket.kaleciler;
      mac.tarih=kadroPaket.tarih||""; mac.saat=kadroPaket.saat||""; mac.stad=kadroPaket.stad||"";
    }
    await skorKaydet(turnuva, mac, skorA, skorB, olaylar, mvp, mvpTakim, oduller, ekstra);
  };

  // 👁 Destek modunda menüler/yetkiler HEDEF kullanıcının perspektifini yansıtır (yoksa kendi değerlerin)
  const etkinAdminMi = destek ? destekAdminMi : adminMi;
  const etkinLigKurYetkim = destek ? destekLigKur : ligKurYetkim;
  // Takım (kulüp) kurma yetkisi — MERKEZÎ: Süper Admin VEYA Lig hakkı olan VEYA bir lig yöneticisi.
  // Backend (RLS p_kulup_ins → takim_kurabilir()) ile birebir aynı kural. Normal kullanıcı kuramaz.
  const etkinTakimKurYetkim = !saltOkunur && !!(etkinAdminMi || etkinLigKurYetkim || (oturum && (turnuvalar||[]).some(t=>t&&(t.yonetici_id===oturum.id||t.yoneticiId===oturum.id))));
  const etkinProfil = destek ? destekProfil : profil;
  // Oturuma bağlı ekranlar destek modunda yanlış bilgi göstermesin
  const destekKapali = <div style={{maxWidth:440,margin:"0 auto",padding:"60px 24px",textAlign:"center"}}>
    <div style={{fontSize:44,marginBottom:14}}>👁</div>
    <div style={{fontSize:18,fontWeight:800,color:T.text,fontFamily:T.fontDisplay,marginBottom:8}}>Destek Modunda görüntülenemez</div>
    <div style={{fontSize:13.5,color:T.textMut,lineHeight:1.6}}>Bu ekran oturuma bağlıdır (kendi hesabının bilgisini gösterir). Yanlış bilgi göstermemek için destek modunda gizlendi. Üstteki şeritten <b style={{color:T.text}}>Çık</b>'a basıp normal moda dönebilirsin.</div>
  </div>;

  let icerik;
  // "Henüz lig yok" boş ekranı SADECE lig içeriğine bağlı sayfalarda çıksın.
  // Profil / Takip / Admin / Yasal / Ayarlar / Keşfet / LigKur kendi içeriğini her zaman gösterir.
  const bosMu = turnuvalar.length===0 && (nav.sayfa==="ana" || nav.sayfa==="tumenler");
  if(paylasimYuk){
    icerik=<div style={{padding:"20px 16px"}}>
      {/* İskelet: gelecek içeriğin biçimini gösterir (boş ekran hissi yok) */}
      <div className="fl-skel" style={{height:44,marginBottom:14,borderRadius:14}}/>
      <div style={{display:"flex",gap:10,marginBottom:14}}>
        <div className="fl-skel" style={{width:72,height:72,borderRadius:"50%"}}/>
        <div style={{flex:1}}>
          <div className="fl-skel" style={{height:18,width:"60%",marginBottom:8}}/>
          <div className="fl-skel" style={{height:12,width:"40%"}}/>
        </div>
      </div>
      {[0,1,2,3,4,5].map(i=><div key={i} className="fl-skel" style={{height:52,marginBottom:8,opacity:1-i*0.13}}/>)}
      <div style={{fontSize:12,color:T.textMut,textAlign:"center",marginTop:14}}>Paylaşılan lig getiriliyor…</div>
    </div>;
  } else if(paylasimHata){
    icerik=<div style={{padding:"80px 30px",textAlign:"center"}}>
      <div style={{fontSize:40,marginBottom:12}}>🔍</div>
      <div style={{fontSize:16,color:T.text,fontWeight:700,marginBottom:6}}>Lig bulunamadı</div>
      <div style={{fontSize:13,color:T.textMut,lineHeight:1.6,maxWidth:320,margin:"0 auto"}}>Bu paylaşım linki artık geçerli değil ya da lig yayından kaldırılmış olabilir.</div>
      <a href={(window.location.origin+window.location.pathname)} style={{display:"inline-block",marginTop:20,background:T.accent,color:T.bg0,borderRadius:11,padding:"12px 24px",fontSize:14,fontWeight:800,textDecoration:"none"}}>ForzaLig'e Git →</a>
    </div>;
  } else if(bosMu){
    icerik = liglerYuk
      ? <div className="fade-in" style={{padding:"18px 16px"}}>{[0,1,2].map(i=><div key={i} className="skel" style={{height:88,borderRadius:16,marginBottom:12}}/>)}<div style={{fontSize:12.5,color:T.textMut,textAlign:"center",marginTop:6}}>⏳ Liglerin yükleniyor…</div></div>
      : <BosDurum T={T} git={git} ligKurabilir={etkinLigKurYetkim}/>;
  } else {
    // YETKİ: bu ligi yönetebilir miyim? (lig sahibi VEYA süper admin) — misafir/başka üye DÜZENLEYEMEZ
    const ligYetkim=(t)=> !saltOkunur && !!oturum && !!t && (((t.yonetici_id!=null) && t.yonetici_id===oturum.id) || adminMi || (t.id && yardimciLigler.has(t.id)));
    // Yetkisiz kişi düzenleme ekranına gelirse: kaydetmeyi engelle (sunucu RLS de engeller, bu arayüz kapısı)
    const kilitliKaydet=()=>{ alert("Bu maçı yalnızca ligin yöneticisi düzenleyebilir."); return Promise.resolve({hata:"yetki yok"}); };
    switch(nav.sayfa){
      case "ana": icerik=<AnaSayfa turnuvalar={turnuvalar.filter(t=>(t.durum||'aktif')!=='arsiv')} T={T} git={git} yukleniyor={liglerYuk}/>; break;
      case "tumenler": icerik=<TumEnler turnuvalar={turnuvalar} T={T} git={git}/>; break;
      case "ligler": icerik=<Kesfet turnuvalar={turnuvalar} T={T} git={git} ligKurAc={oturum?()=>git({sayfa:"ligkur"}):null} ligKurYetki={etkinLigKurYetkim} saltOkunur={saltOkunur} yukleniyor={liglerYuk} oturum={oturum} adminMi={etkinAdminMi} takimKurabilir={etkinTakimKurYetkim}/>; break;
      case "ligkur": icerik=<LigKur T={T} git={git} ligKur={ligKur} oturum={oturum}/>; break;
      case "turnuva": icerik=<TurnuvaSayfa turnuva={nav.turnuva} T={T} git={git} takipLig={takipLig} ligTakip={ligTakip} yonetim={ligYetkim(nav.turnuva)?{takimEkle,kulupLigeEkle,takimSil,takimDuzenle,macEkle,macSil,fikstürYap,dagit,grupTasi,oyuncuEkle,oyuncuTopluEkle,oyuncuDuzenle,oyuncuSil,excelTopluEkle,ligGuncelle,kupaSonraki,penGalipSec,ligArsivle,yeniSezon,ligSilTam,ligSilAdmin,adminMi,transferKabulEt,transferRedEt}:null} oturum={oturum} saltOkunur={saltOkunur} onPaylas={paylasLig} onPaylasKaldir={paylasKaldir} ilkTab={nav.tab}/>; break;
      case "takim": icerik=<TakimSayfa takim={nav.takim} turnuva={nav.turnuva} T={T} git={git} takipTakim={takipTakim} takimTakip={takimTakip} oturum={oturum} adminMi={etkinAdminMi}/>; break;
      case "oyuncu": icerik=<OyuncuSayfa oyuncu={nav.oyuncu} T={T} takipOyuncu={takipOyuncu} oyuncuTakip={oyuncuTakip} adminMod={adminMod} git={git} turnuvalar={turnuvalar} oturum={oturum} sahiplenme={sahiplenme} onSahiplen={oyuncuSahiplen} onTransfer={transferEt} saltOkunur={saltOkunur} adminMi={etkinAdminMi}/>; break;
      case "mac": icerik=<MacSayfa mac={nav.mac} turnuva={nav.turnuva} T={T} git={git} oturum={oturum} sahiplenme={sahiplenme} yetkili={ligYetkim(nav.turnuva)}/>; break;
      case "skorgir": icerik=<SkorGir mac={nav.mac} turnuva={nav.turnuva} T={T} git={git} skorKaydet={ligYetkim(nav.turnuva)?skorKaydet:kilitliKaydet}/>; break;
      case "gazete": icerik=<MacGazete mac={nav.mac} turnuva={nav.turnuva} T={T} git={git} oturum={oturum} adminMi={etkinAdminMi} yetkili={ligYetkim(nav.turnuva)} gazeteAyar={gazeteAyar}/>; break;
      case "afis": icerik=<MacAfis mac={nav.mac} turnuva={nav.turnuva} T={T} git={git}/>; break;
      case "sezonsonu": icerik=<SezonSonu turnuva={nav.turnuva} T={T} git={git}/>; break;
      case "skorkart": icerik=<SkorKart mac={nav.mac} turnuva={nav.turnuva} T={T} git={git}/>; break;
      case "h2h": icerik=<Karsilastir tip={nav.tip} a={nav.a} b={nav.b} aday={nav.aday} turnuva={nav.turnuva} T={T} git={git}/>; break;
      case "rating": icerik=<RatingDuzenle mac={nav.mac} turnuva={nav.turnuva} T={T} git={git} ratingKaydet={ligYetkim(nav.turnuva)?ratingKaydet:kilitliKaydet} skorKaydet={ligYetkim(nav.turnuva)?skorKaydet:kilitliKaydet}/>; break;
      case "kurulum": icerik=<MacKurulum mac={nav.mac} turnuva={nav.turnuva} T={T} git={git} kaydet={ligYetkim(nav.turnuva)?(paket)=>{ Object.assign(nav.mac,paket); git({sayfa:"mac",mac:nav.mac,turnuva:nav.turnuva}); }:kilitliKaydet}/>; break;
      case "sihirbaz": icerik=<MacSihirbaz mac={nav.mac} turnuva={nav.turnuva} T={T} git={git} sihirbazKaydet={ligYetkim(nav.turnuva)?sihirbazKaydet:kilitliKaydet}/>; break;
      case "istatistik": icerik=<MacIstatistik mac={nav.mac} turnuva={nav.turnuva} T={T} git={git} onKaydet={ligYetkim(nav.turnuva)?(mac,ist)=>{ mac.istatistik=ist; }:kilitliKaydet}/>; break;
      case "takip": icerik=<TakipSayfa T={T} turnuvalar={turnuvalar} takipLig={takipLig} takipOyuncu={takipOyuncu} takipTakim={takipTakim} ligTakip={ligTakip} oyuncuTakip={oyuncuTakip} takimTakip={takimTakip} git={git}/>; break;
      case "bildirim": icerik=<BildirimSayfa T={T} git={git} oturum={oturum} liste={gercekBildirim} yenile={bildirimYenile} takipListe={bildirimler} turnuvalar={turnuvalar}/>; break;
      case "sohbet": icerik=<SohbetSayfa T={T} git={git} oturum={oturum} turnuva={nav.turnuva} takim={nav.takim} kulup={nav.kulup} adminMi={etkinAdminMi} turnuvalar={turnuvalar} saltOkunur={saltOkunur}/>; break;
      case "pazar": icerik=<PazarSayfa T={T} git={git} oturum={oturum} turnuvalar={turnuvalar} ilkTip={nav.pazarYeni}/>; break;
      case "profil": icerik = <ProfilSayfa T={T} turnuvalar={turnuvalar} takipLig={takipLig} takipOyuncu={takipOyuncu} takipTakim={takipTakim} git={git} kapiAc={(m)=>setKapi(m||"tanitim")} oturum={oturum} cikisYap={cikisYap} sahiplenme={sahiplenme} onSahiplenmeBirak={sahiplenmeyiBirak} adminMi={adminMi} profil={profil} destekBilgi={destek?{uid:destek.uid, ad:destek.ad, profil:destekProfil, adminMi:destekAdminMi}:null}/>; break;
      case "kuluplerim": icerik=<Kuluplerim T={T} oturum={oturum} git={git} turnuvalar={turnuvalar} adminMi={etkinAdminMi} takimKurabilir={etkinTakimKurYetkim}/>; break;
      case "sorun": icerik=<SorunBildir T={T} git={git} oturum={oturum} teshis={teshisUret()}/>; break;
      case "admin": icerik = destek ? destekKapali : <AdminPanel T={T} git={git} oturum={oturum} turnuvalar={turnuvalar} onIliskiselYukle={async(evren)=>{ try{ if(evren) localStorage.setItem('fz_aktif_evren',evren); }catch(e){} const gelen = evren ? await Db.liglerEvrenYukle(evren) : await Db.liglerYukle(oturum&&oturum.id, true); gelen.forEach(t=>{ try{turnuvaHesapla(t);}catch(e){} }); setIliskiselModu(true); setTurnuvalar(gelen); git({sayfa:"ana"}); return gelen.length; }} onGercegeDon={async()=>{ try{ localStorage.removeItem('fz_aktif_evren'); }catch(e){} const gelen=await Db.liglerYukle(oturum&&oturum.id,false); gelen.forEach(t=>{ try{turnuvaHesapla(t);}catch(e){} }); setIliskiselModu(true); setTurnuvalar(gelen); git({sayfa:"ana"}); return gelen.length; }} onDestek={destekBaslat}/>; break;
      case "yasal": icerik=<YasalSayfa T={T} git={git} tip={nav.tip}/>; break;
      case "ayar": icerik = destek ? destekKapali : <Ayarlar T={T} stilKey={stilKey} setStilKey={setStilKey} renkKey={renkKey} setRenkKey={setRenkKey} veriUret={veriUret} veriSil={veriSil} turnuvalar={turnuvalar} adminMod={adminMod} setAdminMod={setAdminMod} yedekle={yedekle} yukleDosya={yukleDosya} kayitDurum={kayitDurum} git={git} adminMi={adminMi} rehberBaslat={rehberBaslat} oturum={oturum}/>; break;
      default: icerik=<AnaSayfa turnuvalar={turnuvalar} T={T} git={git}/>;
    }
  }

  const geriVar = !["ana","ligler","ayar","takip"].includes(nav.sayfa);
  const aktifTab = nav.sayfa==="ana"?"ana":nav.sayfa==="ligler"?"lig":nav.sayfa==="sohbet"?"sohbet":nav.sayfa==="profil"?"profil":"";

  const menuItems=[["ana","🏠","Ana"],["lig","🔍","Keşfet"],["sohbet","💬","Sohbet"],["profil","👤","Profil"]];
  const menuGit=(k)=>{ titret(); setNavGecmis([]); const s = k==="lig"?"ligler":k;
    let hedef={sayfa:s};
    // "Sohbet"e basınca tek aktif ligi olan kullanıcı doğrudan o ligin sohbetine girsin (hub'ı atla → geri tuzağı yok)
    if(k==="sohbet" && oturum){ const ls=(turnuvalar||[]).filter(t=>t.iliskisel && (t.durum||'aktif')!=='arsiv'); if(ls.length===1) hedef={sayfa:"sohbet",turnuva:ls[0]}; }
    setNav(hedef); try{ window.history.replaceState({fz:1},"",URL_FOR(hedef)); }catch(e){} window.scrollTo(0,0); };

  return <div style={{minHeight:"100vh",background:T.bg0,fontFamily:T.fontBody}}>
    {/* 👁 DESTEK MODU ŞERİDİ — her zaman üstte, tek tık çıkış (sticky, içeriği iter) */}
    {destek && <div style={{position:"sticky",top:0,zIndex:2500,background:"linear-gradient(90deg,#7a5f1a,#b8901f)",color:"#fff",padding:"calc(8px + env(safe-area-inset-top)) 13px 8px",display:"flex",alignItems:"center",gap:10,boxShadow:"0 3px 14px rgba(0,0,0,.35)"}}>
      <span style={{fontSize:17,flexShrink:0}}>👁</span>
      <div style={{flex:1,minWidth:0,lineHeight:1.25}}><div style={{fontSize:12.5,fontWeight:800,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>Destek Modu — {destek.ad}</div><div style={{fontSize:10.5,opacity:.9,fontWeight:500}}>Salt-okunur · değişiklik yapılamaz</div></div>
      <button onClick={destekBitir} className="tap" style={{flexShrink:0,background:"rgba(0,0,0,.28)",color:"#fff",border:"1px solid rgba(255,255,255,.45)",borderRadius:9,padding:"7px 14px",fontSize:12.5,fontWeight:800,cursor:"pointer"}}>Çık ✕</button>
    </div>}
    {/* FAZ 3 — Yasaklı hesap ekranı (her şeyin üstünde) */}
    {yasakli && <div style={{position:"fixed",inset:0,zIndex:9999,background:T.bg0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,textAlign:"center"}}>
      <div style={{fontSize:52,marginBottom:16}}>🚫</div>
      <div style={{fontSize:21,fontWeight:800,color:T.text,fontFamily:T.fontDisplay,marginBottom:10}}>Hesabın askıya alındı</div>
      <div style={{fontSize:13,color:T.textMut,lineHeight:1.65,maxWidth:330}}>Bu hesap ForzaLig yönetimi tarafından askıya alındı. Bir yanlışlık olduğunu düşünüyorsan yöneticiyle iletişime geç.</div>
      <button onClick={cikisYap} className="tap" style={{marginTop:22,background:T.bg1,color:T.textSoft,border:"0.5px solid "+T.line,borderRadius:12,padding:"12px 24px",fontSize:13,fontWeight:700}}>Çıkış Yap</button>
    </div>}
    {/* DAVET — ?davet=TOKEN ile takım/oyuncu katılım (auth kapısı yoksa) */}
    {DAVET_TOKEN && kapi!=="giris" && kapi!=="uyeol" && kapi!=="splash" && kapi!=="tanitim" &&
      <DavetKatil T={T} token={DAVET_TOKEN} oturum={oturum} girisYap={()=>setKapi("uyeol")}/>}
    {/* FAZ 7 — Açılış / Tanıtım / Giriş kapısı (uygulamanın üstünde overlay) */}
    {kapi==="splash" && <AcilisSplash T={T} onBitti={()=>setKapi("tanitim")}/>}
    {kapi==="tanitim" && <Tanitim T={T} kapiGit={setKapi} tamamla={kapiTamamla}/>}
    {(kapi==="giris"||kapi==="uyeol") && <GirisAuth T={T} mod={kapi} kapiGit={setKapi} tamamla={kapiTamamla}/>}
    {/* FAZ 4 — ilk giriş rehberi (uygulama açıkken, kapı yokken) */}
    {rehberGoster && kapi===null && !saltOkunur && !rolSor && (()=>{
      // Tur, kullanıcının gerçek durumuna göre dinamik kurulur (nav: 0=Ana,1=Keşfet,2=Sohbet,3=Profil)
      const gUser=!!(oturum&&oturum.user_metadata&&(oturum.user_metadata.avatar_url||oturum.user_metadata.picture)); // Google fotolu
      let benT=null; if(oturum){ for(const t of (turnuvalar||[])){ for(const tk of (t.takimlar||[])){ if((tk.oyuncular||[]).some(o=>o.sahip_user_id===oturum.id)){ benT={tk,t}; break; } } if(benT)break; } }
      const oynanmisMacim = !!(benT && (benT.t.maclar||[]).some(mm=> mm.oynandi && (mm.takimA===benT.tk.ad || mm.takimB===benT.tk.ad)));
      const ad=[
        {ik:"🏠", vur:0, bas:"Ana Sayfa", ac:"Ligindeki öne çıkanlar, gol kralı, haftanın maçı ve puan durumu burada. Birden çok ligin varsa üstteki şeritten geçersin."},
        {ik:"🔍", vur:1, bas:"Keşfet", ac:"Tüm ligler, takımlar ve oyuncular burada. Aradığını hızlıca bulursun."},
        {ik:"➕", vur:1, bas:"Lig Bul / Kur", ac:"Keşfet'ten mevcut bir lige göz atabilir ya da “+ Lig Kur” ile kendi ligini kurabilirsin."},
        {ik:"⚽", vur:1, bas:"Takıma Katıl", ac:"Bir takıma katılmak için lig/takım sayfasından kendini oyuncu olarak sahiplen; yönetici onaylayınca kadroya girersin."},
      ];
      // Özellik adımı: yalnızca oynanmış maçı olan kullanıcıya
      if(oynanmisMacim) ad.push({ik:"📲", vur:-1, bas:"Maçı Paylaş", ac:"Oynanan bir maça gir, “Skor Kartı”na dokun — hazır görseli tek dokunuşla WhatsApp'a at."});
      // Profil: Google kullanıcısında foto otomatik; değilse buradan eklenir
      ad.push({ik:"👤", vur:3, bas:"Profil", ac: gUser
        ? "Kariyerin ve takip ettiğin lig/oyuncular burada. Profil fotoğrafın Google hesabından otomatik geldi."
        : "Kariyerin, fotoğrafın ve takip ettiğin lig/oyuncular burada. Profil fotoğrafını da buradan eklersin."});
      return <Rehber T={T} bitir={rehberBitir} adimlar={ad}/>;
    })()}
    {/* ROL SEÇİMİ — artık OPSİYONEL: sadece kullanıcı "hoş geldin" şeridinden seçince açılır */}
    {rolSor && oturum && kapi===null && !saltOkunur && !DAVET_TOKEN &&
      <RolSecim T={T} oturum={oturum} profil={profil} baslangic={rolBaslangic}
        onKapat={()=>{ setRolSor(false); setRolBaslangic("secim"); }}
        onKaydet={(p)=>{ setProfil(p); setRolSor(false); setRolBaslangic("secim"); }}/>}
    {/* HOŞ GELDİN ŞERİDİ — rol yok, opsiyonel, kapatılabilir (kimse role zorlanmaz) */}
    {/* "Hoş geldin · Futbolcuyum/Hakemim" rol seçim şeridi kaldırıldı — oyuncu artık davet linkiyle takıma katılıyor, ayrı rol sorulmuyor */}

    {/* ÇAKIŞMA UYARISI — başka cihaz veriyi değiştirdi */}
    {catisma && <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:1800,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div className="fade-in" style={{width:"100%",maxWidth:400,background:T.bg1,border:"1px solid "+T.gold+"55",borderRadius:16,padding:20}}>
        <div style={{fontSize:30,textAlign:"center",marginBottom:8}}>⚠️</div>
        <div style={{fontFamily:T.fontDisplay,fontSize:17,fontWeight:800,color:T.text,textAlign:"center",marginBottom:6}}>Veriler başka cihazda değişti</div>
        <div style={{fontSize:12.5,color:T.textSoft,textAlign:"center",lineHeight:1.6,marginBottom:16}}>Bu hesabı başka bir cihazda da kullanmışsın ve orada değişiklik yapılmış. Hangisini tutalım?</div>
        <button onClick={catismaOnlariniYukle} className="tap" style={{width:"100%",background:T.accent,color:T.bg0,border:0,borderRadius:12,padding:13,fontSize:13.5,fontWeight:800,marginBottom:8}}>☁ Diğer cihazdakini al (önerilen)</button>
        <button onClick={catismaBenimkiniYaz} className="tap" style={{width:"100%",background:"transparent",color:T.danger,border:"0.5px solid "+T.danger+"55",borderRadius:12,padding:12,fontSize:12.5,fontWeight:600}}>Bu cihazdakini yaz (diğeri silinir)</button>
        <div style={{fontSize:9.5,color:T.textMut,textAlign:"center",marginTop:10,lineHeight:1.5}}>Emin değilsen "Diğer cihazdakini al" — böylece hiçbir şey kaybolmaz.</div>
      </div>
    </div>}

    <div className="wrap">
      {/* üst bar — güvenli alan (çentik) padding'e gömülü, background çentiği doldurur */}
      <div className="fz-topbar" style={{position:"sticky",top:0,zIndex:10,background:T.bg0,borderBottom:"0.5px solid "+T.line,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"calc(12px + env(safe-area-inset-top)) 16px 12px"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {geriVar && <button onClick={geri} className="tap" style={{fontSize:20,color:T.textSoft}}>‹</button>}
          <span style={{fontWeight:800,fontSize:17,color:T.accent,fontFamily:T.fontDisplay,letterSpacing:.5}}>ForzaLig</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {saltOkunur ? <a href={(window.location.origin+window.location.pathname)} className="tap" style={{background:T.accent,color:T.bg0,borderRadius:20,padding:"6px 14px",fontSize:12,fontWeight:800,textDecoration:"none"}}>Katıl →</a> : <>
          <button onClick={()=>{setAramaAcik(true);setAramaMetin("");}} aria-label="Ara" title="Ara" className="tap" style={{fontSize:18,background:"none",border:0,color:T.textSoft}}>🔍</button>
          {bulutDurum ? <span style={{fontSize:10,color:T.accent,fontWeight:600,whiteSpace:"nowrap"}}>☁ {bulutDurum}</span>
            : oturum ? <span title="Buluta bağlı" style={{fontSize:12,color:T.accent}}>☁</span> : null}
          <span style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:T.accent}}><span className="live-dot" style={{width:7,height:7,borderRadius:"50%",background:T.accent}}/>Canlı</span>
          <button onClick={()=>git({sayfa:"bildirim"})} aria-label="Bildirimler" title="Bildirimler" className="tap" style={{position:"relative",fontSize:18}}>🔔
            {(okunmamis>0) && <span style={{position:"absolute",top:-4,right:-6,background:T.danger,color:"#fff",fontSize:9,fontWeight:700,borderRadius:8,padding:"1px 5px"}}>{okunmamis>9?"9+":okunmamis}</span>}
          </button>
          </>}
        </div>
      </div>
      {bakimModu && <div style={{background:T.gold+"1a",borderBottom:"0.5px solid "+T.gold+"44",padding:"7px 16px",fontSize:11.5,color:T.gold,textAlign:"center",fontWeight:700}}>🧯 Kısa bir bakımdayız — şu an yalnızca görüntüleme açık. Birazdan normale döneriz.</div>}
      {saltOkunur && !bakimModu && <div style={{background:T.accent+"14",borderBottom:"0.5px solid "+T.accent+"33",padding:"6px 16px",fontSize:11,color:T.accent,textAlign:"center",fontWeight:600}}>👁 Salt-okunur · paylaşılan lig — düzenleyemezsin</div>}

      {/* ARAMA OVERLAY */}
      {aramaAcik && (()=>{
        const q=aramaMetin.trim().toLocaleLowerCase("tr");
        let ligler=[],takimlar=[],oyuncular=[];
        if(q.length>=1){
          turnuvalar.forEach(t=>{
            if(t.ad.toLocaleLowerCase("tr").includes(q)) ligler.push(t);
            t.takimlar.forEach(tk=>{
              if(tk.ad.toLocaleLowerCase("tr").includes(q)) takimlar.push({tk,t});
              tk.oyuncular.forEach(o=>{ if(o.ad.toLocaleLowerCase("tr").includes(q)) oyuncular.push({o,tk,t}); });
            });
          });
          ligler=ligler.slice(0,5); takimlar=takimlar.slice(0,8); oyuncular=oyuncular.slice(0,12);
        }
        const kapat=()=>{setAramaAcik(false);setAramaMetin("");};
        const go=(n)=>{kapat();git(n);};
        return <div style={{position:"fixed",inset:0,background:T.bg0,zIndex:1600,display:"flex",flexDirection:"column"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"calc(12px + env(safe-area-inset-top)) 14px 12px",borderBottom:"0.5px solid "+T.line}}>
            <span style={{fontSize:16,color:T.textMut}}>🔍</span>
            <input autoFocus value={aramaMetin} onChange={e=>setAramaMetin(e.target.value)} placeholder="Oyuncu, takım veya lig ara..." style={{flex:1,background:"none",border:0,color:T.text,fontSize:15,outline:"none",fontFamily:"inherit"}}/>
            <button onClick={kapat} className="tap" style={{fontSize:14,color:T.textMut,background:"none",border:0}}>İptal</button>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"12px 14px"}}>
            {q.length<1 ? <div style={{textAlign:"center",color:T.textMut,fontSize:13,padding:40}}>Aramak için yazmaya başla</div> :
             (ligler.length+takimlar.length+oyuncular.length===0) ? <div style={{textAlign:"center",color:T.textMut,fontSize:13,padding:40}}>"{aramaMetin}" için sonuç yok</div> :
             <>
              {oyuncular.length>0 && <div style={{marginBottom:14}}>
                <div style={{fontSize:10,color:T.textMut,fontWeight:700,marginBottom:6}}>👤 OYUNCULAR</div>
                {oyuncular.map(({o,tk,t})=>
                  <div key={o.id} onClick={()=>go({sayfa:"oyuncu",oyuncu:{...o,turnuva:t.ad}})} className="tap" style={{display:"flex",alignItems:"center",gap:10,padding:"8px 6px",borderRadius:9,marginBottom:2}}>
                    <div style={{width:30,height:30,borderRadius:"50%",overflow:"hidden",flexShrink:0}} dangerouslySetInnerHTML={{__html:svgAvatar(o.ad,30,o.foto)}}/>
                    <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,color:T.text,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{o.ad}</div><div style={{fontSize:10,color:T.textMut}}>{tk.ad} · {t.ad}</div></div>
                    <span style={{fontSize:11,color:T.textMut}}>›</span>
                  </div>
                )}
              </div>}
              {takimlar.length>0 && <div style={{marginBottom:14}}>
                <div style={{fontSize:10,color:T.textMut,fontWeight:700,marginBottom:6}}>⚽ TAKIMLAR</div>
                {takimlar.map(({tk,t})=>
                  <div key={tk.id} onClick={()=>go({sayfa:"takim",takim:tk,turnuva:t})} className="tap" style={{display:"flex",alignItems:"center",gap:10,padding:"8px 6px",borderRadius:9,marginBottom:2}}>
                    <Logo renk={tk.renk} ad={tk.ad} logo={tk.logo} renk2={tk.renk2} boy={30}/>
                    <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,color:T.text,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{tk.ad}</div><div style={{fontSize:10,color:T.textMut}}>{t.ad} · {tk.oyuncular.length} oyuncu</div></div>
                    <span style={{fontSize:11,color:T.textMut}}>›</span>
                  </div>
                )}
              </div>}
              {ligler.length>0 && <div style={{marginBottom:14}}>
                <div style={{fontSize:10,color:T.textMut,fontWeight:700,marginBottom:6}}>🏆 LİGLER</div>
                {ligler.map(t=>
                  <div key={t.id} onClick={()=>go({sayfa:"turnuva",turnuva:t})} className="tap" style={{display:"flex",alignItems:"center",gap:10,padding:"8px 6px",borderRadius:9,marginBottom:2}}>
                    <Logo renk={t.renk||T.accent} ad={t.ad} boy={30}/>
                    <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,color:T.text,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.ad}</div><div style={{fontSize:10,color:T.textMut}}>{t.takimlar.length} takım</div></div>
                    <span style={{fontSize:11,color:T.textMut}}>›</span>
                  </div>
                )}
              </div>}
             </>}
          </div>
        </div>;
      })()}

      <div className="desktop-grid" style={{display:"flex"}}>
        {/* geniş ekran sol menü */}
        <div className="desktop-side" style={{padding:"16px 12px",borderRight:"0.5px solid "+T.line,minHeight:"calc(100vh - 50px)",display:saltOkunur?"none":undefined}}>
          {menuItems.map(([k,ik,l])=>
            <button key={k} onClick={()=>menuGit(k)} className="menu-item" style={{display:"flex",alignItems:"center",gap:12,width:"100%",padding:"11px 14px",borderRadius:10,marginBottom:4,background:aktifTab===k?T.accent+"18":"transparent"}}>
              <span style={{fontSize:18}}>{ik}</span>
              <span style={{fontSize:14,color:aktifTab===k?T.accent:T.textSoft,fontWeight:aktifTab===k?600:400}}>{l}</span>
              {k==="takip"&&bildirimler.length>0 && <span style={{marginLeft:"auto",background:T.danger,color:"#fff",fontSize:10,fontWeight:700,borderRadius:8,padding:"1px 6px"}}>{bildirimler.length}</span>}
            </button>
          )}
          {oturum && <button onClick={()=>{ titret&&titret(); setEkleAcik(true); }} className="menu-item" style={{display:"flex",alignItems:"center",gap:12,width:"100%",padding:"11px 14px",borderRadius:10,marginTop:8,background:T.accent,color:T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0}}>
            <span style={{fontSize:18}}>➕</span><span style={{fontSize:14,fontWeight:700}}>Ekle</span>
          </button>}
        </div>

        {/* içerik — sayfa bazında hata kalkanı (bir sekme çökerse menü ayakta kalır) */}
        <div className="main-area" style={{flex:1,minWidth:0}}>
          {evrenAktif && <div onClick={evrenModundanCik} className="tap" style={{margin:"10px 14px 0",background:"linear-gradient(90deg,"+T.gold+"22,"+T.bg1+")",border:"1px solid "+T.gold+"66",borderRadius:12,padding:"11px 14px",display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
            <span style={{fontSize:18}}>🎬</span>
            <span style={{flex:1,minWidth:0}}>
              <span style={{display:"block",fontSize:12.5,fontWeight:800,color:T.gold}}>Demo (evren) modundasın</span>
              <span style={{display:"block",fontSize:10.5,color:T.textMut,marginTop:1}}>Kendi liglerin gizli. Gerçek liglerine dönmek için dokun.</span>
            </span>
            <span style={{fontSize:12,fontWeight:800,color:T.gold,background:T.gold+"22",borderRadius:8,padding:"6px 10px",whiteSpace:"nowrap"}}>🏠 Çık</span>
          </div>}
          <HataSiniri key={nav.sayfa} sayfa={nav.sayfa} gomulu>{icerik}</HataSiniri>
        </div>
      </div>
    </div>

    {/* ORTADAKİ + (EKLE) — yüzen buton, alt menünün üstünde */}
    {!saltOkunur && oturum && !(nav.sayfa==="sohbet"&&nav.turnuva) && !["sihirbaz","skorgir","rating","istatistik","kurulum"].includes(nav.sayfa) && <button onClick={()=>{ titret(); setEkleAcik(true); }} className="tap mobile-bottom" aria-label="Oluştur" title="Oluştur" style={{position:"fixed",bottom:"calc(30px + env(safe-area-inset-bottom))",left:"50%",transform:"translateX(-50%)",width:58,height:58,borderRadius:18,border:"3px solid "+T.bg0,background:"linear-gradient(150deg,"+(T.accent2||T.accent)+","+T.accent+")",zIndex:901,boxShadow:"0 8px 22px "+T.accent+"66",display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}><svg width="30" height="30" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="21" fill="#fff"/><path d="M32 17 L45 26.5 L40 42 L24 42 L19 26.5 Z" fill="#0a5c30"/></svg></button>}

    {/* EKLE alt sayfası */}
    {ekleAcik && <div onClick={e=>{ if(e.target===e.currentTarget) setEkleAcik(false); }} style={{position:"fixed",inset:0,zIndex:1300,background:"rgba(0,0,0,.6)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div style={{width:"100%",maxWidth:480,background:T.bg0,borderTopLeftRadius:22,borderTopRightRadius:22,border:"0.5px solid "+T.line,padding:"8px 16px calc(22px + env(safe-area-inset-bottom))"}}>
        <div style={{width:40,height:4,borderRadius:3,background:T.line,margin:"8px auto 14px"}}/>
        <div style={{fontSize:12,color:T.textMut,textTransform:"uppercase",letterSpacing:1,fontWeight:700,margin:"2px 4px 12px"}}>⚽ Oluştur</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:6}}>
        {[
          etkinLigKurYetkim && ["🏆","Yeni Lig","Kendi ligini kur",T.gold,()=>git({sayfa:"ligkur"}),true],
          ["🆚","Rakip İlanı","Takımına maç ayarla",T.accent,()=>git({sayfa:"pazar",pazarYeni:"rakip"})],
          ["🙋","Eksik Oyuncu","Maça oyuncu bul",T.danger,()=>git({sayfa:"pazar",pazarYeni:"eksik"})],
          ["🏃","Ben Oyuncuyum","Maça gelirim",(T.accent2||T.accent),()=>git({sayfa:"pazar",pazarYeni:"oyuncu"})],
        ].filter(Boolean).map((o,i)=>
          <div key={i} onClick={()=>{ setEkleAcik(false); o[4](); }} className="tap kart-hover" style={{gridColumn:o[5]?"1 / -1":"auto",display:"flex",flexDirection:o[5]?"row":"column",alignItems:"center",gap:o[5]?13:0,textAlign:o[5]?"left":"center",background:o[5]?"linear-gradient(140deg,"+o[3]+"22,"+T.bg1+")":T.bg1,border:"0.5px solid "+o[3]+"44",borderRadius:16,padding:o[5]?"15px 16px":"18px 10px",cursor:"pointer"}}>
            <span style={{width:o[5]?46:44,height:o[5]?46:44,borderRadius:13,background:o[3]+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:23,flexShrink:0,marginBottom:o[5]?0:8}}>{o[0]}</span>
            <div style={{minWidth:0,flex:o[5]?1:undefined}}><div style={{fontSize:o[5]?15:13,fontWeight:800,color:T.text}}>{o[1]}</div><div style={{fontSize:o[5]?11.5:10,color:T.textMut,marginTop:o[5]?2:1}}>{o[2]}</div></div>
            {o[5] && <span style={{fontSize:18,color:o[3]}}>›</span>}
          </div>
        )}
        </div>
        <button onClick={()=>setEkleAcik(false)} className="tap" style={{width:"100%",marginTop:6,background:"none",border:"0.5px solid "+T.line,color:T.textSoft,borderRadius:12,padding:12,fontSize:13,fontWeight:700}}>Kapat</button>
      </div>
    </div>}

    {/* mobil alt menü — giriş yapmış kullanıcıda salt-okunur (demo evren/destek) modda da görünür ki mahsur kalmasın */}
    {(oturum || !saltOkunur) && !(nav.sayfa==="sohbet"&&nav.turnuva) && !["sihirbaz","skorgir","rating","istatistik","kurulum"].includes(nav.sayfa) && <div className="mobile-bottom" style={{position:"fixed",bottom:0,left:0,right:0,maxWidth:480,margin:"0 auto",background:T.bg1,borderTop:"0.5px solid "+T.line,display:"flex",padding:"8px 0 calc(10px + env(safe-area-inset-bottom))",zIndex:900,boxShadow:"0 -2px 12px rgba(0,0,0,.3)"}}>
      {menuItems.map(([k,ik,l])=>
        <button key={k} onClick={()=>menuGit(k)} style={{flex:1,textAlign:"center",position:"relative"}}>
          <div className="nav-ic" style={{fontSize:19,display:"inline-block",padding:"3px 16px",borderRadius:14,filter:aktifTab===k?"none":"grayscale(1) opacity(.5)",background:aktifTab===k?T.accent+"22":"transparent"}}>{ik}</div>
          <div style={{fontSize:10,color:aktifTab===k?T.accent:T.textMut,marginTop:3,fontWeight:aktifTab===k?600:400,transition:"color .25s ease"}}>{l}</div>
          {k==="takip"&&bildirimler.length>0 && <span style={{position:"absolute",top:-2,right:"50%",marginRight:-22,background:T.danger,color:"#fff",fontSize:9,fontWeight:700,borderRadius:8,padding:"0px 5px"}}>{bildirimler.length}</span>}
        </button>
      )}
    </div>}
  </div>;
}

// HATA KALKANI — çökünce boş ekran yerine hatayı göster (kalıcı iyileştirme + teşhis)
class HataSiniri extends React.Component {
  constructor(p){ super(p); this.state={hata:null}; }
  static getDerivedStateFromError(e){ return {hata:e}; }
  componentDidCatch(e,info){ try{ console.error("FL crash:", e, info&&info.componentStack); const m=String((e&&(e.stack||e.message))||e); window.__FL_SON_HATA=m; try{ Db.hataKaydet(m, this.props.sayfa||(window.__FL_SAYFA||null), window.__FL_UID); }catch(x2){} }catch(x){} }
  render(){
    if(this.state.hata){
      const m=String((this.state.hata&&(this.state.hata.stack||this.state.hata.message))||this.state.hata).slice(0,800);
      const g=this.props.gomulu, sf=this.props.sayfa;
      return <div style={{padding:g?"26px 18px 40px":"34px 20px",fontFamily:"system-ui,-apple-system,sans-serif",color:"#fff",background:g?"transparent":"#0b0b0f",minHeight:g?"auto":"100vh"}}>
        <div style={{fontSize:g?17:20,fontWeight:800,marginBottom:8}}>⚠️ Bir hata oluştu{sf?" · "+sf:""}</div>
        <div style={{fontSize:12,color:"#9aa",marginBottom:14}}>{g?"Başka bir sekmeye geçebilirsin. Sürerse":"Ekranı yenile; sürerse"} bu yazının fotoğrafını gönder.</div>
        <div style={{fontSize:12,color:"#ff8a8a",marginBottom:18,whiteSpace:"pre-wrap",wordBreak:"break-word",lineHeight:1.5,background:"#16161c",border:"1px solid #333",borderRadius:10,padding:12}}>{m}</div>
        <button onClick={()=>{ try{ location.reload(); }catch(e){} }} style={{background:"#39FF7A",color:"#04140c",border:0,borderRadius:10,padding:"12px 22px",fontWeight:800,fontSize:14}}>Yeniden Yükle</button>
      </div>;
    }
    return this.props.children;
  }
}
ReactDOM.createRoot(document.getElementById("root")).render(<HataSiniri><App/></HataSiniri>);
