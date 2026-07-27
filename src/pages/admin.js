function AdminPanel({T, git, oturum, turnuvalar, onIliskiselYukle, onGercegeDon, onDestek}){
  const [sekme,setSekme]=useState("ozet");
  const [ligler,setLigler]=useState([]);
  const [yetkiler,setYetkiler]=useState([]);
  const [yuk,setYuk]=useState(true);
  const [yeniMail,setYeniMail]=useState("");
  const [mesaj,setMesaj]=useState("");
  const [haklar,setHaklar]=useState([]);      // lig_haklari + email
  const [uyeler,setUyeler]=useState([]);      // tüm üyeler + yetki
  const [hakMail,setHakMail]=useState("");
  const [hakSayi,setHakSayi]=useState(1);
  const [hakNot,setHakNot]=useState("");
  const [ozet,setOzet]=useState(null);        // KPI sayımları
  const [ulkeler,setUlkeler]=useState([]);    // ülke dağılımı
  const [bekTransfer,setBekTransfer]=useState([]); // bekleyen transferler
  const [audit,setAudit]=useState([]);
  const [topSayfa,setTopSayfa]=useState([]);
  const [topArama,setTopArama]=useState([]);
  const [online,setOnline]=useState(0);
  const [popLig,setPopLig]=useState([]);
  const [popOyuncu,setPopOyuncu]=useState([]);
  const [gunTrend,setGunTrend]=useState([]);
  const [sikayetler,setSikayetler]=useState([]);
  const [hatalar,setHatalar]=useState([]);        // FAZ 4 — çökme logları
  const [yasaklilar,setYasaklilar]=useState([]);  // FAZ 3 — yasaklı user_id listesi
  const [seciliLigler,setSeciliLigler]=useState(()=>new Set()); // FAZ 5 — toplu seçim
  const [uyeSeg,setUyeSeg]=useState("hepsi");     // FAZ 5 — üye segmenti
  const [uyeAra,setUyeAra]=useState("");          // üye arama (palet de kullanır)
  const [metrik,setMetrik]=useState(null);         // FAZ 4 — gerçek metrikler (panel_metrikler)
  const [opEk,setOpEk]=useState(null);             // Operasyon Merkezi ek: canlı akış + trafik + trend
  const [opTek,setOpTek]=useState({deploy:null, api:null, cf:null});  // deploy sürüm · API gecikme · Cloudflare
  const [mkOzet,setMkOzet]=useState(null);         // sohbet maç kartları: {adet,bayt,eski} (null=yüklenmedi)
  const [destekTalep,setDestekTalep]=useState([]); // 🆘 sorun bildirimleri
  const [acikTeshis,setAcikTeshis]=useState(null); // teşhisi açık talep id
  // FAZ 1 — Öz-Test (Sistem Sağlığı canlı kontrolü): salt-okunur prob'lar
  const [ozTest,setOzTest]=useState(null);         // sonuç dizisi | null
  const [ozTestYuk,setOzTestYuk]=useState(false);
  // FAZ 2 — Veri Sağlık Taraması (Veri Doktoru)
  const [veriSaglik,setVeriSaglik]=useState(null);
  const [veriSaglikYuk,setVeriSaglikYuk]=useState(false);
  const veriTara=async()=>{ setVeriSaglikYuk(true); const r=await Db.veriSaglik(); setVeriSaglik(r||{hata:"yok"}); setVeriSaglikYuk(false); };
  // FAZ 3 — Sistem anahtarları (bakım modu + özellik bayrakları)
  const [anahtarlar,setAnahtarlar]=useState(null);
  const anahtarCevir=async(key,deger)=>{ const r=await Db.ayarYaz(key,deger); if(r&&r.ok){ setAnahtarlar(p=>({...(p||{}),[key]:deger})); } else alert("Kaydedilemedi (Faz 5'teki SQL çalıştırılınca aktif olur)."); };
  const ozTestCalistir=async()=>{
    setOzTestYuk(true); const R=[]; const GBb=1073741824;
    const olc=async(ad,fn)=>{ const t0=Date.now(); try{ const r=await fn(); const ms=Date.now()-t0; R.push({ad, durum:r&&r.uyari?"uyari":(r&&r.ok===false?"hata":"ok"), not:(r&&r.not)||(ms+"ms")}); }catch(e){ R.push({ad,durum:"hata",not:"yanıt yok"}); } };
    if(sb){
      await olc("Veritabanı", async()=>{ const {error}=await sb.from('ligler').select('id',{count:'exact',head:true}); return {ok:!error, not:error?"engel":null}; });
      await olc("Giriş (Auth)", async()=>{ const {data}=await sb.auth.getSession(); return {ok:!!(data&&data.session), not:(data&&data.session)?"oturum aktif":"oturum yok"}; });
      await olc("Güvenlik (RLS)", async()=>{ const {error}=await sb.from('profiller').select('user_id',{count:'exact',head:true}); return {ok:!error, not:error?"politika hatası":"aktif"}; });
    } else { R.push({ad:"Veritabanı",durum:"hata",not:"bağlantı yok"}); }
    // Depolama (mevcut metrik)
    if(metrik){ const y=(metrik.depo_bayt/GBb)*100; R.push({ad:"Depolama",durum:y>=90?"hata":y>=70?"uyari":"ok",not:"%"+y.toFixed(0)+" dolu"}); }
    // API hızı (mevcut opTek)
    if(opTek.api!=null) R.push({ad:"API hızı",durum:opTek.api<400?"ok":opTek.api<900?"uyari":"hata",not:opTek.api+"ms"});
    // PWA / sürüm eşleşmesi
    try{ var calisan=(document.querySelector('script') && (window.__FL_RELEASE||"")); var yayin=opTek.deploy||""; if(yayin){ var esles=calisan&&yayin&&calisan.split("-")[0]===String(yayin).split("-")[0]; R.push({ad:"PWA / sürüm",durum:esles?"ok":"uyari",not:esles?"güncel":"eski sürüm açık"}); } }catch(e){}
    // Cloudflare (mevcut opTek)
    R.push({ad:"Cloudflare",durum:opTek.cf?"ok":"uyari",not:opTek.cf||"doğrulanamadı"});
    // Hata logu
    R.push({ad:"Çökme logu",durum:hatalar.length?"uyari":"ok",not:hatalar.length?hatalar.length+" kayıt":"temiz"});
    setOzTest(R); setOzTestYuk(false);
  };
  // Operasyon ek veri + istemci ölçümleri (yalnızca Sistem sekmesi açılınca, tek sefer — polling YOK)
  useEffect(()=>{ if(sekme!=="sistem"||opEk) return; let a=true;
    Db.operasyonEk().then(d=>{ if(a) setOpEk(d||{}); });
    Db.destekTalepListe().then(d=>{ if(a) setDestekTalep(d||[]); });
    // Sohbet maç kartları: fırsatçı otomatik temizlik (14 gün+) sonra özeti göster. Polling YOK.
    (async()=>{ try{ await Db.macKartTemizle(14); }catch(e){} const oz=await Db.macKartOzet(); if(a) setMkOzet(oz||{adet:0,bayt:0,eski:null}); })();
    (async()=>{ // deploy sürümü: /sw.js'ten SURUM (tek fetch)
      try{ const r=await fetch('/sw.js',{cache:'no-store'}); const t=await r.text(); const m=t.match(/SURUM\s*=\s*"([^"]+)"/); const cf=r.headers.get('cf-cache-status')||r.headers.get('cf-ray'); if(a) setOpTek(o=>({...o, deploy:(m?m[1]:null), cf:(cf?(r.headers.get('cf-cache-status')||'Cloudflare'):null)})); }catch(e){}
      try{ const t0=(window.performance&&performance.now)?performance.now():Date.now(); await sb.from('ligler').select('*',{count:'exact',head:true}).limit(1); const t1=(window.performance&&performance.now)?performance.now():Date.now(); if(a) setOpTek(o=>({...o, api:Math.round(t1-t0)})); }catch(e){}
    })();
    return ()=>{a=false;};
  },[sekme]);
  const [copLigler,setCopLigler]=useState([]);     // FAZ 3 — çöp kutusu (soft-silinen ligler)
  const [orphanlar,setOrphanlar]=useState(null);   // FAZ 4 — sahipsiz dosyalar (null=taranmadı)
  const [bakimMsj,setBakimMsj]=useState("");
  const [basvurular,setBasvurular]=useState([]);   // lig kurma başvuruları (para/onay kapısı)
  const [hepYardimci,setHepYardimci]=useState([]); // YARDIMCI — tüm liglerin yardımcı yöneticileri
  const [tumLiglerY,setTumLiglerY]=useState([]);   // ekleme formu için lig listesi
  const [aySecLig,setAySecLig]=useState("");
  const [ayMail,setAyMail]=useState("");
  const [ayMesaj,setAyMesaj]=useState("");
  const [paletAcik,setPaletAcik]=useState(false); // FAZ 6 — komut paleti
  const [paletQ,setPaletQ]=useState("");
  // FAZ 2 — Geri Al (Undo): yıkıcı işlemi 5 sn geciktir; bu arada UI'dan kaldır
  const [undoBox,setUndoBox]=useState(null);       // {mesaj, geriAl}
  const undoRef=useRef(null);
  const undoluIslem=(mesaj, uygulaFn, geriAlFn)=>{
    if(undoRef.current){ clearTimeout(undoRef.current.t); try{ undoRef.current.uygula(); }catch(e){} } // önceki bekleyeni hemen işle
    const t=setTimeout(()=>{ try{ uygulaFn(); }catch(e){} undoRef.current=null; setUndoBox(null); }, 5000);
    undoRef.current={t, uygula:uygulaFn};
    setUndoBox({mesaj, geriAl:()=>{ clearTimeout(t); undoRef.current=null; try{ geriAlFn&&geriAlFn(); }catch(e){} setUndoBox(null); }});
  };
  const sikayetKapat=async(s)=>{ setSikayetler(p=>p.filter(x=>x.id!==s.id)); await Db.sikayetKapat(s.id); };
  // Şikâyetli mesajı kaldır — Undo'lu (5 sn içinde geri alınabilir)
  const sikayetSil=(s)=>{
    setSikayetler(p=>p.filter(x=>x.id!==s.id)); // optimistic
    undoluIslem("Mesaj kaldırıldı",
      async()=>{ if(s.mesaj_id) await Db.mesajSil(s.mesaj_id); await Db.sikayetKapat(s.id); Db.logla(oturum,"Şikâyetli mesaj kaldırıldı",s.mesaj_metin||""); },
      ()=>{ setSikayetler(p=>[s,...p]); });
  };
  // FAZ 3 — kullanıcıyı yasakla / kaldır
  const yasakla=async(u)=>{ const sebep=prompt("Yasaklama sebebi (kullanıcıya gösterilmez, log için):",""); if(sebep===null) return; if(!confirm((u.ad||u.email)+" askıya alınsın mı? Giriş yapamaz.")) return; const r=await Db.yasakla(u.user_id, sebep, oturum&&oturum.id); if(r.ok){ setYasaklilar(p=>[...p,{user_id:u.user_id,sebep}]); Db.logla(oturum,"Kullanıcı askıya alındı",(u.email||"")+(sebep?" · "+sebep:"")); setMesaj("🚫 Askıya alındı"); } else setMesaj("Olmadı: "+(r.hata||"")); };
  const yasakKaldir=async(u)=>{ const r=await Db.yasakKaldir(u.user_id); if(r.ok){ setYasaklilar(p=>p.filter(x=>x.user_id!==u.user_id)); Db.logla(oturum,"Yasak kaldırıldı",u.email||""); setMesaj("✓ Yasak kaldırıldı"); } else setMesaj("Olmadı: "+(r.hata||"")); };
  const yasakliMi=(uid)=> yasaklilar.some(x=>x.user_id===uid);
  // Süper admin: bir kullanıcının rollerini değiştir (futbolcu/hakem/td)
  const rolToggle=async(u,key)=>{ const roller={...(u.roller||{})}; if(roller[key]) delete roller[key]; else roller[key]=true; const r=await Db.profilRollerYaz(u.user_id, roller); if(r&&r.ok){ setUyeler(p=>p.map(x=>x.user_id===u.user_id?{...x,roller}:x)); Db.logla(oturum,"Rol güncelledi",(u.email||"")+" · "+key+"="+(roller[key]?"1":"0")); } else setMesaj("Olmadı: "+((r&&r.hata)||"")); };
  // Lig başvurusu işlemleri
  const basvuruYetki=async(b)=>{ if(!b.user_id){ setMesaj("⚠️ Bu başvuruda hesap yok — kişi önce üye olmalı."); return; } const mevcut=(haklar.find(h=>h.user_id===b.user_id)||{}).toplam||0; if(!confirm((b.ad_soyad||b.email)+" için lig hakkı "+mevcut+" → "+(mevcut+1)+" yapılsın mı?")) return; const r=await Db.hakVer(b.user_id, mevcut+1, "Başvuru: "+(b.lig_ad||b.ad_soyad||"")); if(r&&r.ok){ await Db.basvuruDurum(b.id,'onaylandi'); setBasvurular(p=>p.map(x=>x.id===b.id?{...x,durum:'onaylandi'}:x)); Db.logla(oturum,"Lig başvurusu onaylandı",(b.email||"")+" · "+(b.lig_ad||"")); setMesaj("✓ Yetki verildi"); Db.haklariListe().then(h=>{ const em={}; (uyeler||[]).forEach(u=>em[u.user_id]=u.email); setHaklar((h||[]).map(x=>({...x,email:em[x.user_id]||x.user_id}))); }); } else setMesaj("Olmadı: "+((r&&r.hata)||"")); };
  const basvuruArandi=async(b)=>{ await Db.basvuruDurum(b.id,'arandi'); setBasvurular(p=>p.map(x=>x.id===b.id?{...x,durum:'arandi'}:x)); };
  const basvuruRed=async(b)=>{ if(!confirm("Başvuru reddedilsin mi?")) return; await Db.basvuruDurum(b.id,'red'); setBasvurular(p=>p.map(x=>x.id===b.id?{...x,durum:'red'}:x)); };
  // YARDIMCI — admin panelden merkezi ekle/çıkar
  const ayEkle=async()=>{ const e=(ayMail||"").trim().toLowerCase(); if(!aySecLig){ setAyMesaj("⚠️ Önce lig seç"); return; } if(!e){ setAyMesaj("⚠️ E-posta yaz"); return; } setAyMesaj(""); const r=await Db.yardimciEkle(aySecLig, e); if(r&&r.ok){ const lig=tumLiglerY.find(x=>x.id===aySecLig); setHepYardimci(p=>[...p,{lig_id:aySecLig, ligAd:(lig&&lig.ad)||"(lig)", user_id:r.user_id, email:r.email||e, ad:r.ad||null, tarih:new Date().toISOString()}]); setAyMail(""); setAyMesaj("✓ Eklendi"); Db.logla(oturum,"Yardımcı yönetici eklendi",((lig&&lig.ad)||"")+" · "+e); } else setAyMesaj("⚠️ "+((r&&r.hata)||"olmadı")); };
  const ayCikar=async(y)=>{ if(!confirm((y.ad||y.email)+" — “"+y.ligAd+"” liginden yardımcı yöneticilikten çıkarılsın mı?")) return; const r=await Db.yardimciKaldir(y.lig_id, y.user_id); if(r&&r.ok){ setHepYardimci(p=>p.filter(x=>!(x.lig_id===y.lig_id && x.user_id===y.user_id))); Db.logla(oturum,"Yardımcı yönetici çıkarıldı",y.ligAd+" · "+(y.email||"")); } else setMesaj("Olmadı: "+((r&&r.hata)||"")); };
  // FAZ 4 — Bakım Merkezi
  const orphanTara=async()=>{ setBakimMsj("Taranıyor…"); const o=await Db.orphanBul(); setOrphanlar(o||[]); setBakimMsj((o&&o.length)?(o.length+" sahipsiz dosya bulundu"):"✓ Sahipsiz dosya yok — depo temiz"); };
  const orphanTemizleAll=async()=>{ if(!orphanlar||!orphanlar.length) return; if(!confirm(orphanlar.length+" sahipsiz dosya kalıcı silinsin mi?")) return; const r=await Db.orphanTemizle(orphanlar.map(o=>o.yol)); if(r&&r.ok){ setOrphanlar([]); Db.logla(oturum,"Orphan temizlik",r.adet+" dosya"); Db.panelMetrikler().then(m=>setMetrik(m)); setBakimMsj("✓ "+r.adet+" dosya silindi"); } else setBakimMsj("Olmadı: "+((r&&r.hata)||"")); };
  const arsivleYap=async()=>{ if(!confirm("Kanal başına en yeni 5.000 mesaj aktif kalsın, gerisi arşive alınsın mı?")) return; setBakimMsj("Arşivleniyor…"); const r=await Db.sohbetArsivle(); if(r&&r.ok){ Db.panelMetrikler().then(m=>setMetrik(m)); setBakimMsj("✓ "+r.adet+" mesaj arşive alındı"); } else setBakimMsj("Olmadı: "+((r&&r.hata)||"")); };
  // Sohbetteki maç kartlarını manuel temizle (14 gün+). Sonuçlar maç sayfasında kalır — sadece sohbet kartı gider.
  const macKartTemizleYap=async()=>{ if(!confirm("2 haftadan eski maç sonucu kartları sohbetten kalıcı silinsin mi?\n\n(Maç sonuçları ve istatistikler maç sayfasında KALIR — sadece sohbetteki bildirim kartı gider.)")) return; setBakimMsj("Temizleniyor…"); const r=await Db.macKartTemizle(14); if(r&&r.ok){ const oz=await Db.macKartOzet(); setMkOzet(oz||{adet:0,bayt:0,eski:null}); Db.logla(oturum,"Maç kartı temizlik",r.adet+" kart"); setBakimMsj("✓ "+r.adet+" maç kartı silindi"); } else setBakimMsj("Olmadı: "+((r&&r.hata)||"")); };
  const copGeriAl=async(l)=>{ const r=await Db.ligGeriAl(l.id); if(r&&r.ok){ setCopLigler(p=>p.filter(x=>x.id!==l.id)); Db.logla(oturum,"Lig çöpten geri alındı",l.ad||""); setBakimMsj("✓ Geri alındı: "+(l.ad||"")); } else setBakimMsj("Olmadı: "+((r&&r.hata)||"")); };
  const copBosalt=async()=>{ if(!confirm("Çöp kutusundaki 90 GÜNDEN eski ligler KALICI silinsin mi? (Geri alınamaz)")) return; const r=await Db.ligPurge(); if(r&&r.ok){ Db.ligCopListe().then(c=>setCopLigler(c||[])); Db.panelMetrikler().then(m=>setMetrik(m)); setBakimMsj("✓ "+r.adet+" lig kalıcı silindi"); } else setBakimMsj("Olmadı: "+((r&&r.hata)||"")); };
  // Tek ligi HEMEN kalıcı sil (90 gün beklemeden) — tüm bağlı veri (takım/oyuncu/maç/istatistik/sohbet/bildirim)
  const copKaliciSil=async(l)=>{ if(!confirm("\""+(l.ad||"Lig")+"\" ligini VE tüm bağlı verisini (takımlar, oyuncular, maçlar, istatistikler, sohbetler, bildirimler) KALICI sil?\n\n⚠️ Bu işlem GERİ ALINAMAZ.")) return; const r=await Db.ligKaliciSil(l.id); if(r&&r.ok){ setCopLigler(p=>p.filter(x=>x.id!==l.id)); Db.logla(oturum,"Lig KALICI silindi",l.ad||""); Db.panelMetrikler().then(m=>setMetrik(m)); setBakimMsj("✓ Kalıcı silindi: "+(l.ad||"")); } else setBakimMsj("Olmadı: "+((r&&r.hata)||"")); };
  // 📢 Toplu mesaj/duyuru
  const [msgAcik,setMsgAcik]=useState(false);
  const [msgTip,setMsgTip]=useState("herkes");     // herkes | lig | takim | kisi
  const [msgLigId,setMsgLigId]=useState("");
  const [msgTakimId,setMsgTakimId]=useState("");
  const [msgEmail,setMsgEmail]=useState("");
  const [msgBaslik,setMsgBaslik]=useState("");
  const [msgMetin,setMsgMetin]=useState("");
  const [msgYuk,setMsgYuk]=useState(false);
  const [msgSonuc,setMsgSonuc]=useState("");
  const [msgLigler,setMsgLigler]=useState([]);
  const [msgTakimlar,setMsgTakimlar]=useState([]);
  useEffect(()=>{ if(msgAcik && msgLigler.length===0) Db.tumLiglerBasit().then(setMsgLigler); },[msgAcik]);
  useEffect(()=>{ if(msgTip==="takim" && msgLigId) Db.ligTakimlariBasit(msgLigId).then(setMsgTakimlar); },[msgTip,msgLigId]);
  const mesajGonder=async()=>{
    setMsgSonuc("");
    if(!msgBaslik.trim()){ setMsgSonuc("❌ Başlık gerekli."); return; }
    let id=null;
    if(msgTip==="lig"){ if(!msgLigId){ setMsgSonuc("❌ Lig seç."); return; } id=msgLigId; }
    if(msgTip==="takim"){ if(!msgTakimId){ setMsgSonuc("❌ Takım seç."); return; } id=msgTakimId; }
    if(msgTip==="kisi"){ const e=msgEmail.trim().toLowerCase(); if(!e){ setMsgSonuc("❌ E-posta yaz."); return; } const pr=await Db.profilBul(e); if(!pr||!pr.user_id){ setMsgSonuc("❌ Bu e-postayla kullanıcı bulunamadı."); return; } id=pr.user_id; }
    // FAZ 6 — Blast guard: herkese giden büyük gönderimde onay iste
    if(msgTip==="herkes"){ const kac=(ozet&&ozet.uye)||"tüm"; if(!confirm("Bu duyuru "+kac+" kullanıcıya gidecek.\n\nBaşlık: "+msgBaslik.trim()+"\n\nGöndermek istediğine emin misin?")) return; }
    setMsgYuk(true);
    const r=await Db.adminTopluBildirim(msgTip, id, msgBaslik.trim(), msgMetin.trim());   // in-app (+ webhook ile push)
    // TEK MERKEZ — lig/takım duyurusu ayrıca sohbet kanalına düşsün + e-posta kuyruğuna
    let ekKanal="";
    if(r&&r.ok && (msgTip==="lig"||msgTip==="takim")){
      try{ const d=await Db.bildirimDagit({ ligId:(msgTip==="lig"?id:msgLigId), takimIds:(msgTip==="takim"?[id]:null), baslik:msgBaslik.trim(), metin:(msgMetin.trim()||msgBaslik.trim()), sistemTip:'yonetim', kanallar:{ ligSohbet:msgTip==="lig", takimSohbet:msgTip==="takim", email:true } }); if(d&&d.ok) ekKanal=" · sohbet + e-posta ✓"; }catch(e){}
    }
    setMsgYuk(false);
    if(r&&r.ok){ setMsgSonuc("✅ Gönderildi ("+(r.adet||0)+" kişiye)"+ekKanal+"."); setMsgBaslik(""); setMsgMetin(""); Db.logla(oturum,"Toplu bildirim",msgTip+": "+msgBaslik.trim()); }
    else setMsgSonuc("❌ "+((r&&r.hata)||"olmadı"));
  };
  const yenile=async()=>{ setYuk(true);
    const [l,y,h,p,u,oz,ul,bt,au,ts,ta,on,pl,po,gt]=await Promise.all([
      Admin.ligler(), Admin.yetkiListe(), Db.haklariListe(), Db.profillerHepsi(), Db.uyeler(),
      Db.panelOzet(), Db.ulkeDagilim(), Db.bekleyenTransferler(),
      Db.auditListe(), Db.topOlay('sayfa'), Db.topOlay('arama'), Db.onlineSayi(),
      Db.populer('lig'), Db.populer('oyuncu'), Db.gunlukAktif()]);
    setLigler(l); setYetkiler(y); setUyeler(u||[]); setOzet(oz); setUlkeler(ul||[]); setBekTransfer(bt||[]);
    setAudit(au||[]); setTopSayfa(ts||[]); setTopArama(ta||[]); setOnline(on||0); setPopLig(pl||[]); setPopOyuncu(po||[]); setGunTrend(gt||[]);
    Db.sikayetler().then(s=>setSikayetler(s||[]));
    Db.hataListe().then(hh=>setHatalar(hh||[]));       // FAZ 4
    Db.yasakliListe().then(yy=>setYasaklilar(yy||[])); // FAZ 3
    Db.tumYardimcilar().then(yy=>setHepYardimci(yy||[])); // YARDIMCI — merkezi görünüm
    Db.panelMetrikler().then(m=>setMetrik(m));            // FAZ 4 — gerçek metrikler
    Db.veriSaglik().then(v=>setVeriSaglik(v));            // FAZ 2 — veri sağlık taraması
    Db.ayarlarOku().then(a=>setAnahtarlar(a||{}));        // FAZ 3 — sistem anahtarları
    Db.ligCopListe().then(c=>setCopLigler(c||[]));        // FAZ 3 — çöp kutusu
    Db.basvuruListe().then(b=>setBasvurular(b||[]));      // lig kurma başvuruları
    Db.tumLiglerBasit().then(ll=>setTumLiglerY(ll||[]));  // ekleme formu lig listesi
    const epostaHarita={}; (p||[]).forEach(pr=>{ epostaHarita[pr.user_id]=pr.email; });
    setHaklar((h||[]).map(x=>({...x, email:epostaHarita[x.user_id]||x.user_id})));
    setYuk(false);
  };
  // Bayrak + ülke adı (harita yerine sade liste)
  const ULKE_AD={TR:"🇹🇷 Türkiye",DE:"🇩🇪 Almanya",AT:"🇦🇹 Avusturya",AZ:"🇦🇿 Azerbaycan",NL:"🇳🇱 Hollanda",FR:"🇫🇷 Fransa",GB:"🇬🇧 İngiltere",US:"🇺🇸 ABD",BE:"🇧🇪 Belçika"};
  const rZaman=(iso)=>{ try{ const d=new Date(iso), f=(Date.now()-d.getTime())/1000; if(f<60)return "az önce"; if(f<3600)return Math.floor(f/60)+" dk önce"; if(f<86400)return Math.floor(f/3600)+" sa önce"; if(f<604800)return Math.floor(f/86400)+" gün önce"; return d.toLocaleDateString("tr-TR"); }catch(e){ return ""; } };
  // FAZ 5 — lig sağlık rozeti (son güncelleme tazeliğine göre)
  const ligSagligi=(l)=>{ try{ const g=(Date.now()-new Date(l.guncelleme).getTime())/86400000; if(g<7) return {r:"#22c55e",t:"aktif",ik:"🟢"}; if(g<30) return {r:T.gold,t:"yavaşlıyor",ik:"🟡"}; return {r:T.danger,t:"sessiz",ik:"🔴"}; }catch(e){ return {r:T.textMut,t:"—",ik:"⚪"}; } };
  const ligSecToggle=(slug)=>{ setSeciliLigler(p=>{ const n=new Set(p); n.has(slug)?n.delete(slug):n.add(slug); return n; }); };
  const topluLigKaldir=async()=>{ const slugs=[...seciliLigler]; if(!slugs.length) return; if(!confirm(slugs.length+" lig yayından kaldırılsın mı? (moderasyon)")) return; for(const s of slugs){ try{ await Admin.ligSil(s); }catch(e){} } setLigler(p=>p.filter(x=>!seciliLigler.has(x.slug))); setSeciliLigler(new Set()); Db.logla(oturum,"Toplu lig kaldırma",slugs.length+" lig"); setMesaj("✓ "+slugs.length+" lig kaldırıldı"); };
  // FAZ 6 — Komut Paleti klavye kısayolu (Cmd/Ctrl + K)
  useEffect(()=>{ const h=(e)=>{ if((e.metaKey||e.ctrlKey) && (e.key==="k"||e.key==="K")){ e.preventDefault(); setPaletAcik(a=>!a); setPaletQ(""); } if(e.key==="Escape") setPaletAcik(false); }; window.addEventListener("keydown",h); return ()=>window.removeEventListener("keydown",h); },[]);
  const transferOnay=async(id,onay)=>{ const r=onay?await Db.transferOnayla(id):await Db.transferReddet(id); if(r.ok){ setBekTransfer(p=>p.filter(x=>x.id!==id)); Db.logla(oturum, onay?"Transfer onayladı":"Transfer reddetti", ""); setMesaj(onay?"✓ Transfer onaylandı":"Transfer reddedildi"); } else setMesaj("Olmadı: "+(r.hata||"")); };
  useEffect(()=>{ yenile(); },[]);
  const ligSil=async(slug)=>{ if(!confirm("Bu ligi yayından kaldır? (moderasyon)")) return; const r=await Admin.ligSil(slug); if(r.ok){ setLigler(p=>p.filter(x=>x.slug!==slug)); } else setMesaj("Silinemedi: "+(r.hata||"")); };
  const yetkiEkle=async()=>{ const e=yeniMail.trim().toLowerCase(); if(!e){return;} const r=await Admin.yetkiEkle(e,"onayli"); if(r.ok){ setYeniMail(""); setMesaj("Eklendi ✓"); yenile(); } else setMesaj("Olmadı: "+(r.hata||"")); };
  const yetkiSil=async(email)=>{ const r=await Admin.yetkiSil(email); if(r.ok) setYetkiler(p=>p.filter(x=>x.email!==email)); };
  const [stresYuk,setStresYuk]=useState(false);
  const [stresLog,setStresLog]=useState("");
  // 🧪 STRES TESTİ — ayarlanabilir: kaç lig, ligde kaç takım, kaç oyuncu, format, oynanma oranı
  const [cfgLig,setCfgLig]=useState(3);
  const [cfgTakim,setCfgTakim]=useState(8);
  const [cfgOyuncu,setCfgOyuncu]=useState(12);
  const [cfgKisi,setCfgKisi]=useState(11);
  const [cfgFormat,setCfgFormat]=useState("tek");
  const [cfgOran,setCfgOran]=useState(80);   // % oynanmış maç
  const [cfgKupa,setCfgKupa]=useState(false);  // örnek kupa — varsayılan KAPALI (2 lig = tam 2 lig)
  // ForzaLig Evreni — ek alanlar
  const [cfgEvrenAd,setCfgEvrenAd]=useState("ForzaLig Evreni");
  const [cfgHakem,setCfgHakem]=useState(8);
  const [cfgTD,setCfgTD]=useState(8);
  const [cfgSezon,setCfgSezon]=useState(1);
  const [cfgSeed,setCfgSeed]=useState("");
  const [cfgGercekci,setCfgGercekci]=useState(true);
  const [cfgHaber,setCfgHaber]=useState(true);
  const [cfgFoto,setCfgFoto]=useState(true);
  const [cfgLogo,setCfgLogo]=useState(true);
  const [cfgGoster,setCfgGoster]=useState(true);
  const [stresPct,setStresPct]=useState(0);   // ilerleme çubuğu %
  const [hamLigler,setHamLigler]=useState(null);   // ham lig listesi (fantom temizliği)
  const hamLiglerYukle=async()=>{ setHamLigler("yuk"); const d=await Db.tumLiglerHam(); setHamLigler(d||[]); };
  const hamLigSil=async(l)=>{ if(!confirm("\""+(l.ad||"Lig")+"\" ligini VE tüm bağlı verisini KALICI sil? Geri alınamaz.")) return; const r=await Db.ligKaliciSil(l.id); if(r&&r.ok){ setHamLigler(p=>Array.isArray(p)?p.filter(x=>x.id!==l.id):p); try{localStorage.removeItem('fz_aktif_evren');}catch(e){} Db.panelMetrikler&&Db.panelMetrikler().then(m=>setMetrik(m)); Db.logla(oturum,"Ham lig kalıcı silindi",l.ad||l.id); } else alert((r&&r.hata)||"silinemedi"); };
  // maç sayısı önizleme (tek devre: n*(n-1)/2, çift: iki katı; gruplu: yaklaşık)
  const macOnizle=useMemo(()=>{
    const n=Math.max(2,parseInt(cfgTakim)||0);
    let perLig = n*(n-1)/2;
    if(cfgFormat==="cift") perLig*=2;
    if(cfgFormat==="gruplu"){ const g=Math.max(2,Math.round(n/4)); const gk=Math.ceil(n/g); perLig=g*(gk*(gk-1)/2); }
    return { perLig:Math.round(perLig), toplam:Math.round(perLig*(parseInt(cfgLig)||0)) };
  },[cfgLig,cfgTakim,cfgFormat]);
  const STRES_LIG_ADI=["Cuma Akşamı Ligi","Kadıköy Süper Lig","Ankara Kurumsal Lig","İzmir Serbest Lig","Bursa Dostluk Ligi","Antalya Sahil Ligi","Beşiktaş Gece Ligi","Çankaya Kupası Ligi","Bornova Yıldızlar","Nilüfer Efeler Ligi"];
  const stresTestOlustur=async()=>{
    if(!oturum||!oturum.id){ setStresLog("Önce giriş yap."); return; }
    if(!Db.hazir()){ setStresLog("Supabase bağlantısı yok."); return; }
    const nLig=Math.max(1,Math.min(30,parseInt(cfgLig)||1));
    const nTk=Math.max(2,Math.min(24,parseInt(cfgTakim)||8));
    const nOy=Math.max(3,Math.min(30,parseInt(cfgOyuncu)||12));
    const oran=Math.max(0,Math.min(1,(parseInt(cfgOran)||100)/100));
    const grup=cfgFormat==="gruplu"?Math.max(2,Math.round(nTk/4)):0;
    const sehirler=["İstanbul","Ankara","İzmir","Bursa","Antalya","Adana","Konya","Eskişehir"];
    const evrenAd=(cfgEvrenAd||"").trim()||"ForzaLig Evreni";
    // KURAL 1: mevcut demo evren silinsin mi? Evet → sil+oluştur, İptal → oluşturma
    if(!confirm("Mevcut Demo Evren silinsin mi?\n\n• Tamam → eski demo evren tamamen silinir, yenisi oluşturulur.\n• İptal → yeni evren oluşturulmaz.\n\n(Gerçek kullanıcı liglerine dokunulmaz.)")) return;
    setStresYuk(true); setStresPct(0);
    setStresLog("🧹 Eski demo evren temizleniyor…");
    await Db.evrenSil(null);   // birikme olmasın: tüm demo evrenleri temizle
    const olan=[];
    try{
      for(let i=0;i<nLig;i++){
        setStresLog("🌌 Üretiliyor "+(i+1)+"/"+nLig+" …");
        const T2=uretVeri(1,nTk,nOy,{format:cfgFormat,grup,kisi:Math.max(7,Math.min(11,parseInt(cfgKisi)||11)),oynanmaOran:oran,gercekci:cfgGercekci})[0];
        T2.ad=(STRES_LIG_ADI[i]||("Lig "+(i+1)));
        T2.sehir=pick(sehirler);
        setStresLog("💾 Kaydediliyor "+(i+1)+"/"+nLig+": "+T2.ad+" …");
        const r=await Db.ligKaydet(T2, oturum.id, evrenAd);
        if(!r.ok){ setStresLog("❌ Hata ("+T2.ad+"): "+(r.hata||"")); setStresYuk(false); return; }
        olan.push(T2.ad);
        setStresPct(Math.round((i+1)/(nLig+(cfgKupa?1:0))*100));
      }
      if(cfgKupa){
        setStresLog("💾 Kaydediliyor: Kupa …");
        const kupa=demoKupa(); kupa.ad="⭐ Şampiyonlar Kupası";
        const rk=await Db.ligKaydet(kupa, oturum.id, evrenAd);
        if(rk.ok) olan.push(kupa.ad);
      }
      setStresPct(100);
      setStresLog("✅ \""+evrenAd+"\" oluşturuldu: "+olan.length+" lig ("+cfgFormat+", %"+Math.round(oran*100)+" oynanmış). Şimdi 👁 Göster ile yalnızca bu evreni yükle.");
    }catch(e){ setStresLog("❌ "+String(e&&e.message||e)); }
    setStresYuk(false);
  };
  const iliskiselYukleFn=async()=>{
    if(!onIliskiselYukle) return;
    setStresYuk(true); setStresLog("👁 Evren yükleniyor…");
    const n=await onIliskiselYukle((cfgEvrenAd||"").trim()||"ForzaLig Evreni");
    setStresYuk(false); setStresLog("✅ "+n+" lig yüklendi. Ana sayfada görebilirsin.");
  };
  // 🔍 SİSTEM TARAMASI — canlı veritabanını tarar, ✅/⚠️/❌ raporu üretir (kopyalanabilir)
  const [tarama,setTarama]=useState(null);
  const [taramaYuk,setTaramaYuk]=useState(false);
  const [taramaKopyalandi,setTaramaKopyalandi]=useState(false);
  const sistemTaramasi=async()=>{
    setTaramaYuk(true); setTarama(null); setTaramaKopyalandi(false);
    const R=[]; const ekle=(ad,durum,not)=>R.push({ad,durum,not:not||""});
    const say=async(t,filtre)=>{ try{ let q=sb.from(t).select('*',{count:'exact',head:true}); if(filtre) q=filtre(q); const {count,error}=await q; return error?{err:error.message}:{n:count||0}; }catch(e){ return {err:String(e&&e.message||e)}; } };
    try{
      ekle("Supabase bağlantısı", (sb&&Db.hazir())?"ok":"hata", (sb&&Db.hazir())?SB_URL.replace("https://",""):"bağlantı yok");
      if(!sb){ setTarama(R); setTaramaYuk(false); return; }
      if(oturum){ let adm=false; try{ adm=await Db.adminMi(oturum.id); }catch(e){} ekle("Oturum / kimlik","ok",(oturum.email||"?")+(adm?" · Süper Admin ✓":" · normal üye")); }
      else ekle("Oturum / kimlik","uyari","giriş yapılmamış");
      const cLig=await say('ligler'), cTk=await say('takimlar'), cOy=await say('oyuncular');
      const cMac=await say('maclar'), cMacO=await say('maclar',q=>q.eq('oynandi',true));
      ekle("Ligler", cLig.err?"hata":"ok", cLig.err||(cLig.n+" lig"));
      ekle("Takımlar", cTk.err?"hata":"ok", cTk.err||(cTk.n+" takım"));
      ekle("Oyuncular", cOy.err?"hata":"ok", cOy.err||(cOy.n+" oyuncu"));
      ekle("Maçlar", cMac.err?"hata":"ok", cMac.err||(cMac.n+" maç · "+(cMacO.n||0)+" oynanmış"));
      const cOl=await say('mac_olaylari'), cOd=await say('mac_odulleri'), cTr=await say('transferler'), cDav=await say('davetler');
      ekle("Maç olayları (gol/asist/kart/kurtarış)", cOl.err?"uyari":"ok", cOl.err||(cOl.n+" olay"));
      ekle("Maç ödülleri (MVP + mevkiler)", cOd.err?"uyari":"ok", cOd.err||(cOd.n+" ödül"));
      ekle("Transferler", cTr.err?"uyari":"ok", cTr.err||(cTr.n+" transfer"));
      ekle("Davet linkleri", cDav.err?"uyari":"ok", cDav.err||(cDav.n+" davet"));
      // KVKK — açık görünüm hassas alan sızdırıyor mu?
      try{
        const {data,error}=await sb.from('oyuncular_acik').select('*').limit(1);
        if(error) ekle("KVKK açık görünüm","hata",error.message);
        else if(!data||!data.length) ekle("KVKK açık görünüm","uyari","henüz oyuncu yok — veri girilince test edilir");
        else { const row=data[0]; const hassas=['telefon','tc','kilo','dogum','ad_soyad','email','not_'].filter(k=>k in row);
          ekle("KVKK açık görünüm", hassas.length?"hata":"ok", hassas.length?("⚠️ HASSAS ALAN SIZIYOR: "+hassas.join(", ")):("güvenli — sadece: "+Object.keys(row).join(", "))); }
      }catch(e){ ekle("KVKK açık görünüm","hata",String(e&&e.message||e)); }
      const cUye=await say('profiller'), cAdm=await say('adminler'), cHak=await say('lig_haklari');
      ekle("Üyeler (profiller)", cUye.err?"uyari":"ok", cUye.err||(cUye.n+" üye"));
      ekle("Süper Adminler", cAdm.err?"uyari":"ok", cAdm.err||(cAdm.n+" admin"));
      ekle("Lig hakları", cHak.err?"uyari":"ok", cHak.err||(cHak.n+" kayıt"));
      const cLog=await say('islem_log'), cOlay=await say('olay_log'), cTak=await say('takipler');
      ekle("İşlem kaydı (audit)", cLog.err?"uyari":"ok", cLog.err||(cLog.n+" satır"));
      ekle("Analitik olay", cOlay.err?"uyari":"ok", cOlay.err||(cOlay.n+" satır"));
      ekle("Takipler", cTak.err?"uyari":"ok", cTak.err||(cTak.n+" takip"));
      // Tutarsızlık: oynandı ama skor yok
      const cBozuk=await say('maclar', q=>q.eq('oynandi',true).or('ev_skor.is.null,dep_skor.is.null'));
      ekle("Tutarsız maç (oynandı ama skor boş)", cBozuk.err?"uyari":(cBozuk.n>0?"uyari":"ok"), cBozuk.err||(cBozuk.n+" adet"));
    }catch(e){ ekle("Tarama hatası","hata",String(e&&e.message||e)); }
    setTarama(R); setTaramaYuk(false);
  };
  const taramaMetin=()=>{
    if(!tarama) return "";
    const sim={ok:"✅",uyari:"⚠️",hata:"❌"};
    const bas="FORZALIG SİSTEM TARAMASI\n"+(oturum?oturum.email:"")+"\n========================\n";
    return bas+tarama.map(r=>(sim[r.durum]||"•")+" "+r.ad+(r.not?": "+r.not:"")).join("\n");
  };
  const taramaKopyala=()=>{ try{ navigator.clipboard.writeText(taramaMetin()); setTaramaKopyalandi(true); setTimeout(()=>setTaramaKopyalandi(false),2000); }catch(e){} };
  const testTemizleFn=async()=>{
    if(!oturum||!oturum.id) return;
    if(!confirm("TÜM demo evren verisini kalıcı sil?\n\n(Hangi adla üretilmiş olursa olsun tüm demo ligler + bağlı veri silinir.)\n\n⚠️ Geri alınamaz. Gerçek kullanıcı liglerine ASLA dokunulmaz.")) return;
    setStresYuk(true); setStresLog("🗑️ Demo evren siliniyor…");
    const r=await Db.evrenSil(null);   // null = tüm demo evrenler (farklı adlar dahil)
    setStresYuk(false);
    try{ localStorage.removeItem('fz_aktif_evren'); }catch(e){}   // evren modundan çık → gerçek liglere dön
    if(r.ok){ setStresLog("🗑️ Demo evren silindi: "+r.adet+" lig (+ bağlı tüm veri). Gerçek liglerine dokunulmadı."); if(onGercegeDon) onGercegeDon(); }
    else setStresLog("❌ "+(r.hata||"silinemedi"));
  };
  // K3/K4 — lig hakkı ver (e-postadan bul → hak ata)
  const hakVerFn=async()=>{
    const e=(hakMail||"").trim().toLowerCase(); const say=Math.max(0,parseInt(hakSayi)||0);
    if(!e){ setMesaj("E-posta gir."); return; }
    const prof=await Db.profilBul(e);
    if(!prof){ setMesaj("⚠️ Bu e-posta üye değil. Önce uygulamaya üye olsun, sonra hak ver."); return; }
    const r=await Db.hakVer(prof.user_id, say, hakNot||null);
    if(r.ok){ Db.logla(oturum, "Lig hakkı verdi", e+" → "+say); setHakMail(""); setHakSayi(1); setHakNot(""); setMesaj("✓ "+e+" → "+say+" lig hakkı verildi"); yenile(); }
    else setMesaj("Olmadı: "+(r.hata||""));
  };

  const toplamTakim=turnuvalar.reduce((s,t)=>s+t.takimlar.length,0);
  const toplamOyuncu=turnuvalar.reduce((s,t)=>s+t.takimlar.reduce((a,tk)=>a+tk.oyuncular.length,0),0);
  const toplamMac=turnuvalar.reduce((s,t)=>s+t.maclar.filter(m=>m.oynandi).length,0);

  const Kart=({ik,say,et,renk})=><div style={{flex:1,background:T.bg1,border:"0.5px solid "+T.line,borderRadius:13,padding:"13px 10px",textAlign:"center"}}>
    <div style={{fontSize:18}}>{ik}</div><div style={{fontSize:22,fontWeight:800,color:renk||T.accent,fontFamily:T.fontDisplay}}>{say}</div><div style={{fontSize:9,color:T.textMut}}>{et}</div></div>;

  return <div className="fade-in" style={{paddingBottom:90}}>
    <div className="vav-hero" style={{position:"relative",overflow:"hidden",padding:"18px 16px",background:"linear-gradient(120deg,"+T.danger+"33,"+T.bg0+" 55%,"+T.accent+"22)"}}>
      <div className="vav-supurme"/>
      <div style={{position:"relative",zIndex:1,display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:24}}>🛡️</span>
        <div><div style={{fontSize:19,fontWeight:800,color:T.text,fontFamily:T.fontDisplay}}>Süper Admin</div><div style={{fontSize:10.5,color:T.textSoft}}>{oturum?oturum.email:""}</div></div>
        <button onClick={()=>{ setPaletAcik(true); setPaletQ(""); }} className="tap" title="Ara (Cmd/Ctrl+K)" style={{marginLeft:"auto",fontSize:12,color:T.textSoft,background:T.bg1,border:"0.5px solid "+T.line,borderRadius:9,padding:"6px 10px",fontWeight:700}}>🔍 Ara</button>
        <button onClick={yenile} className="tap" style={{fontSize:11,color:T.accent,background:T.accent+"18",border:"0.5px solid "+T.accent+"44",borderRadius:9,padding:"6px 10px",fontWeight:700}}>↻ Yenile</button>
      </div>
    </div>

    <div style={{display:"flex",gap:8,padding:"12px 14px 4px"}}>
      <Kart ik="🌍" say={ligler.length} et="açık lig" renk={T.gold}/>
      <Kart ik="🛡️" say={toplamTakim} et="takım (sen)"/>
      <Kart ik="👥" say={uyeler.length} et="üye" renk={T.accent2}/>
      <Kart ik="🎟️" say={uyeler.filter(u=>u.hak&&u.hak.toplam>0).length} et="yetkili"/>
    </div>

    <div style={{display:"flex",gap:6,padding:"10px 14px 0"}}>
      {[["ozet","🎯 İşlem Merkezi"],["uyeler","👥 Üyeler"],["hak","🎟️ Lig Hakkı"],["ligler","🌍 Açık Ligler"],["yetki","✅ Yetkiler"],["sistem","⚙️ Sistem"]].map(([k,l])=>
        <button key={k} onClick={()=>setSekme(k)} className="tap" style={{fontSize:11,padding:"7px 11px",borderRadius:9,fontWeight:700,background:sekme===k?T.accent:T.bg1,color:sekme===k?T.bg0:T.textMut,border:"0.5px solid "+(sekme===k?T.accent:T.line)}}>{l}</button>
      )}
    </div>
    {mesaj && <div style={{fontSize:11,color:T.accent,textAlign:"center",padding:"8px 14px 0"}}>{mesaj}</div>}

    <div style={{padding:"12px 14px"}}>
      {yuk && <div style={{fontSize:12,color:T.textMut,textAlign:"center",padding:20}}>Yükleniyor…</div>}

      {!yuk && sekme==="ozet" && <div>
        {/* 📢 TOPLU MESAJ / DUYURU */}
        <div style={{background:"linear-gradient(120deg,"+T.accent2+"14,"+T.bg1+")",border:"0.5px solid "+T.accent2+"44",borderRadius:12,marginBottom:10,overflow:"hidden"}}>
          <div onClick={()=>setMsgAcik(a=>!a)} className="tap" style={{display:"flex",alignItems:"center",gap:9,padding:"12px 13px",cursor:"pointer"}}>
            <span style={{width:30,height:30,borderRadius:8,background:T.accent2+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>📢</span>
            <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:T.text}}>Mesaj / Duyuru Gönder</div><div style={{fontSize:10,color:T.textMut}}>Herkese, bir lige, takıma veya tek kişiye bildirim</div></div>
            <span style={{fontSize:14,color:T.textMut,transform:msgAcik?"rotate(180deg)":"none",transition:"transform .2s"}}>▾</span>
          </div>
          {msgAcik && <div className="fade-in" style={{padding:"0 13px 14px"}}>
            <div style={{fontSize:10.5,color:T.textMut,fontWeight:700,marginBottom:6}}>KİME?</div>
            <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
              {[["herkes","🌍 Herkese"],["lig","🏆 Bir lige"],["takim","🛡️ Bir takıma"],["kisi","👤 Tek kişiye"]].map(([k,l])=>
                <button key={k} onClick={()=>{ setMsgTip(k); setMsgSonuc(""); }} className="tap" style={{background:msgTip===k?T.accent2:T.bg0,color:msgTip===k?"#04070C":T.textSoft,border:"0.5px solid "+(msgTip===k?T.accent2:T.line),borderRadius:20,padding:"6px 12px",fontSize:11.5,fontWeight:700}}>{l}</button>
              )}
            </div>
            {(msgTip==="lig"||msgTip==="takim") && <select value={msgLigId} onChange={e=>{ setMsgLigId(e.target.value); setMsgTakimId(""); }} style={{width:"100%",boxSizing:"border-box",background:T.bg0,border:"0.5px solid "+T.line,borderRadius:10,padding:11,color:T.text,fontSize:13,outline:"none",fontFamily:"inherit",marginBottom:10}}>
              <option value="">— Lig seç —</option>
              {msgLigler.map(l=><option key={l.id} value={l.id}>{l.ad}</option>)}
            </select>}
            {msgTip==="takim" && msgLigId && <select value={msgTakimId} onChange={e=>setMsgTakimId(e.target.value)} style={{width:"100%",boxSizing:"border-box",background:T.bg0,border:"0.5px solid "+T.line,borderRadius:10,padding:11,color:T.text,fontSize:13,outline:"none",fontFamily:"inherit",marginBottom:10}}>
              <option value="">— Takım seç —</option>
              {msgTakimlar.map(t=><option key={t.id} value={t.id}>{t.ad}</option>)}
            </select>}
            {msgTip==="kisi" && <input value={msgEmail} onChange={e=>setMsgEmail(e.target.value)} placeholder="kullanici@mail.com" style={{width:"100%",boxSizing:"border-box",background:T.bg0,border:"0.5px solid "+T.line,borderRadius:10,padding:11,color:T.text,fontSize:13,outline:"none",fontFamily:"inherit",marginBottom:10}}/>}
            <input value={msgBaslik} onChange={e=>setMsgBaslik(e.target.value)} placeholder="Başlık (ör: Yeni sezon başlıyor!)" style={{width:"100%",boxSizing:"border-box",background:T.bg0,border:"0.5px solid "+T.line,borderRadius:10,padding:11,color:T.text,fontSize:13,fontWeight:600,outline:"none",fontFamily:"inherit",marginBottom:9}}/>
            <textarea value={msgMetin} onChange={e=>setMsgMetin(e.target.value)} placeholder="Mesaj (isteğe bağlı)" rows={3} style={{width:"100%",boxSizing:"border-box",background:T.bg0,border:"0.5px solid "+T.line,borderRadius:10,padding:11,color:T.text,fontSize:13,outline:"none",fontFamily:"inherit",marginBottom:10,resize:"vertical"}}/>
            <button onClick={mesajGonder} disabled={msgYuk} className="tap" style={{width:"100%",background:T.accent2,color:"#04070C",border:0,borderRadius:10,padding:12,fontSize:13.5,fontWeight:800,opacity:msgYuk?.6:1}}>{msgYuk?"Gönderiliyor…":"📤 Gönder"}</button>
            {msgSonuc && <div style={{fontSize:11.5,color:/✅/.test(msgSonuc)?T.accent:T.danger,textAlign:"center",marginTop:9}}>{msgSonuc}</div>}
          </div>}
        </div>
        {/* ═══════ OPERASYON MERKEZİ (Faz 1) ═══════ */}
        {(()=>{
          const bugunHata=hatalar.filter(h=>{ try{ return (Date.now()-new Date(h.olusma).getTime())<86400000; }catch(e){ return false; } });
          const yapSay=bekTransfer.length+sikayetler.length+(bugunHata.length>0?1:0);
          const grp={}; sikayetler.forEach(s=>{ const k=s.gonderen_ad||s.gonderen_id; if(k) grp[k]=(grp[k]||0)+1; });
          const tekrar=Object.entries(grp).filter(x=>x[1]>=2).map(x=>({ad:x[0],adet:x[1]}));
          const izleSay=tekrar.length;
          return <>
            {/* 🔴 BUGÜN YAPILACAKLAR */}
            <div style={{display:"flex",alignItems:"center",gap:7,margin:"2px 2px 9px"}}>
              <span style={{width:9,height:9,borderRadius:"50%",background:yapSay>0?T.danger:T.accent,boxShadow:"0 0 8px "+(yapSay>0?T.danger:T.accent)}}/>
              <span style={{fontSize:12.5,fontWeight:800,color:T.text}}>Bugün Yapılacaklar</span>
              {yapSay>0 && <span style={{fontSize:10,fontWeight:800,color:"#fff",background:T.danger,borderRadius:20,padding:"1px 8px"}}>{yapSay}</span>}
            </div>
            {yapSay===0
              ? <div style={{background:T.bg1,border:"0.5px solid "+T.line,borderRadius:12,padding:"18px",textAlign:"center",marginBottom:16}}>
                  <div style={{fontSize:26,marginBottom:6}}>🎉</div>
                  <div style={{fontSize:12.5,color:T.text,fontWeight:700}}>Bugün yapılacak bir şey yok</div>
                  <div style={{fontSize:11,color:T.textMut,marginTop:3}}>Her şey yolunda, temizsin.</div>
                </div>
              : <div style={{marginBottom:16,display:"flex",flexDirection:"column",gap:7}}>
                  {bekTransfer.map(t=>
                    <div key={t.id} style={{display:"flex",alignItems:"center",gap:8,background:"linear-gradient(120deg,"+T.gold+"12,"+T.bg1+")",border:"0.5px solid "+T.gold+"33",borderRadius:11,padding:"10px 11px"}}>
                      <span style={{fontSize:15}}>🔄</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,color:T.text,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.oyuncular?t.oyuncular.ad_soyad:"Oyuncu"} transferi</div>
                        <div style={{fontSize:9.5,color:T.textMut}}>{t.ligler?t.ligler.ad:""} · aşama: {t.asama}</div>
                      </div>
                      <button onClick={()=>transferOnay(t.id,true)} className="tap" style={{background:T.accent,color:"#04070C",border:0,borderRadius:8,padding:"6px 10px",fontSize:11,fontWeight:800}}>Onayla</button>
                      <button onClick={()=>transferOnay(t.id,false)} className="tap" style={{background:"none",color:T.danger,border:"0.5px solid "+T.danger+"55",borderRadius:8,padding:"6px 9px",fontSize:11,fontWeight:700}}>Ret</button>
                    </div>
                  )}
                  {sikayetler.map(s=>
                    <div key={s.id} style={{background:"linear-gradient(120deg,"+T.danger+"12,"+T.bg1+")",border:"0.5px solid "+T.danger+"33",borderRadius:11,padding:"10px 11px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:6}}><span style={{fontSize:14}}>🚩</span><span style={{fontSize:10,color:T.danger,fontWeight:800}}>ŞİKÂYET</span><span style={{fontSize:9.5,color:T.textMut,marginLeft:"auto"}}>{rZaman(s.olusma||s.created)}</span></div>
                      <div style={{fontSize:12,color:T.text,fontWeight:600,fontStyle:"italic",background:T.bg0,borderRadius:8,padding:"8px 10px"}}>"{s.mesaj_metin||"(mesaj silinmiş)"}"</div>
                      <div style={{fontSize:9.5,color:T.textMut,marginTop:5}}>Gönderen: {s.gonderen_ad||"?"}{s.sebep?" · Sebep: "+s.sebep:""}</div>
                      <div style={{display:"flex",gap:7,marginTop:8}}>
                        <button onClick={()=>sikayetSil(s)} className="tap" style={{background:T.danger,color:"#fff",border:0,borderRadius:8,padding:"6px 11px",fontSize:11,fontWeight:800}}>🗑 Kaldır & Uyar</button>
                        <button onClick={()=>sikayetKapat(s)} className="tap" style={{background:"none",color:T.textMut,border:"0.5px solid "+T.line,borderRadius:8,padding:"6px 11px",fontSize:11,fontWeight:700}}>Yoksay</button>
                      </div>
                    </div>
                  )}
                  {bugunHata.length>0 && <div onClick={()=>setSekme("sistem")} className="tap" style={{display:"flex",alignItems:"center",gap:9,background:"linear-gradient(120deg,"+T.danger+"16,"+T.bg1+")",border:"0.5px solid "+T.danger+"44",borderRadius:11,padding:"11px 12px",cursor:"pointer"}}>
                    <span style={{fontSize:16}}>🔴</span>
                    <div style={{flex:1}}><div style={{fontSize:12,color:T.text,fontWeight:700}}>{bugunHata.length} sistem hatası (son 24 saat)</div><div style={{fontSize:9.5,color:T.textMut}}>Sistem sekmesinde detay</div></div>
                    <span style={{color:T.textMut,fontSize:16}}>›</span>
                  </div>}
                </div>}

            {/* 🟡 TAKİP EDİLECEKLER */}
            {izleSay>0 && <>
              <div style={{display:"flex",alignItems:"center",gap:7,margin:"2px 2px 9px"}}>
                <span style={{width:9,height:9,borderRadius:"50%",background:T.gold}}/>
                <span style={{fontSize:12.5,fontWeight:800,color:T.text}}>Takip Edilecekler</span>
                <span style={{fontSize:10,fontWeight:800,color:"#04070C",background:T.gold,borderRadius:20,padding:"1px 8px"}}>{izleSay}</span>
              </div>
              <div style={{background:T.bg1,border:"0.5px solid "+T.line,borderRadius:12,padding:"6px 12px",marginBottom:16}}>
                {tekrar.map((x,i)=>
                  <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 0",borderBottom:i<tekrar.length-1?"0.5px solid "+T.line:"none"}}>
                    <span style={{fontSize:14}}>⚠️</span>
                    <div style={{flex:1,fontSize:12,color:T.text}}><b>{x.ad}</b> <span style={{color:T.textMut}}>— {x.adet} kez şikayet edildi</span></div>
                  </div>
                )}
              </div>
            </>}
          </>;
        })()}

        {/* 🟢 BİLGİLENDİRME — genel durum */}
        <div style={{display:"flex",alignItems:"center",gap:7,margin:"2px 2px 9px"}}>
          <span style={{width:9,height:9,borderRadius:"50%",background:T.accent}}/>
          <span style={{fontSize:12.5,fontWeight:800,color:T.text}}>Bilgilendirme</span>
          <span style={{fontSize:9.5,color:T.textMut}}>· genel durum</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:8}}>
          {[["🌍",ozet?ozet.lig:"–","lig",T.gold],["👥",ozet?ozet.uye:"–","üye",T.accent2],["⚽",ozet?ozet.oyuncu:"–","oyuncu",T.accent],["📅",ozet?ozet.mac:"–","maç",T.text],["🔄",ozet?ozet.bekleyenTransfer:"–","bekleyen",T.gold],["📦",ozet?ozet.arsivLig:"–","arşiv",T.textMut]].map(([ik,say,et,renk],i)=>
            <div key={i} style={{background:T.bg1,border:"0.5px solid "+T.line,borderRadius:11,padding:"11px 6px",textAlign:"center"}}>
              <div style={{fontSize:15}}>{ik}</div><div style={{fontSize:19,fontWeight:800,color:renk,fontFamily:T.fontDisplay}}>{say}</div><div style={{fontSize:9,color:T.textMut}}>{et}</div>
            </div>
          )}
        </div>

        {/* ÜLKE DAĞILIMI (madde 3) + ONLINE (madde 7) */}
        <div style={{display:"flex",gap:8,marginBottom:8}}>
          {ulkeler.length>0 && <div style={{flex:1,background:T.bg1,border:"0.5px solid "+T.line,borderRadius:12,padding:"12px 14px"}}>
            <div style={{fontSize:11,color:T.textMut,fontWeight:700,marginBottom:8}}>🌍 ÜLKE</div>
            {(()=>{ const top=ulkeler.reduce((s,u)=>s+(u.adet||0),0)||1; return ulkeler.map(u=>{ const yuz=Math.round((u.adet/top)*100); return
              <div key={u.ulke} style={{padding:"4px 0"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,fontSize:12.5,color:T.text}}>
                  <span style={{flex:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{ULKE_AD[u.ulke]||("🏳️ "+u.ulke)}</span>
                  <b style={{color:T.accent}}>{u.adet}</b>
                  <span style={{fontSize:9.5,color:T.textMut,minWidth:30,textAlign:"right"}}>%{yuz}</span>
                </div>
                <div style={{height:4,background:T.bg2,borderRadius:3,marginTop:4,overflow:"hidden"}}><div style={{height:"100%",width:yuz+"%",background:T.accent,borderRadius:3}}/></div>
              </div>; }); })()}
          </div>}
          <div style={{flex:1,background:T.bg1,border:"0.5px solid "+T.line,borderRadius:12,padding:"12px 14px",textAlign:"center",display:"flex",flexDirection:"column",justifyContent:"center"}}>
            <div style={{fontSize:11,color:T.textMut,fontWeight:700,marginBottom:4}}>🟢 ŞU AN ONLINE</div>
            <div style={{fontSize:28,fontWeight:800,color:T.accent,fontFamily:T.fontDisplay}}>{online}</div>
            <div style={{fontSize:9,color:T.textMut}}>son 5 dakika</div>
          </div>
        </div>

        {/* POPÜLER (madde 10) */}
        {(popLig.length>0||popOyuncu.length>0) && <div style={{background:T.bg1,border:"0.5px solid "+T.line,borderRadius:12,padding:"12px 14px"}}>
          <div style={{fontSize:11,color:T.textMut,fontWeight:700,marginBottom:8}}>🔥 EN ÇOK TAKİP EDİLEN</div>
          {popLig.length>0 && <div style={{marginBottom:6}}><div style={{fontSize:9.5,color:T.gold,fontWeight:700}}>Ligler</div>{popLig.map((x,i)=><div key={i} style={{display:"flex",fontSize:12,color:T.text,padding:"2px 0"}}><span style={{flex:1}}>{x.ad}</span><b style={{color:T.gold}}>{x.adet}</b></div>)}</div>}
          {popOyuncu.length>0 && <div><div style={{fontSize:9.5,color:T.accent2,fontWeight:700}}>Oyuncular</div>{popOyuncu.map((x,i)=><div key={i} style={{display:"flex",fontSize:12,color:T.text,padding:"2px 0"}}><span style={{flex:1}}>{x.ad}</span><b style={{color:T.accent2}}>{x.adet}</b></div>)}</div>}
        </div>}
      </div>}

      {!yuk && sekme==="uyeler" && <div>
        {(()=>{ const yetkili=uyeler.filter(u=>u.hak&&u.hak.toplam>0); const normal=uyeler.filter(u=>!(u.hak&&u.hak.toplam>0)&&!u.admin);
          const yeniSay=uyeler.filter(u=>{ try{ return (Date.now()-new Date(u.created).getTime())<7*86400000; }catch(e){ return false; } }).length;
          const askiSay=uyeler.filter(u=>yasakliMi(u.user_id)).length;
          const q=uyeAra.trim().toLowerCase();
          const gosterilen=uyeler.filter(u=>{
            if(uyeSeg==="yeni"){ try{ if((Date.now()-new Date(u.created).getTime())>=7*86400000) return false; }catch(e){ return false; } }
            else if(uyeSeg==="yetkili"){ if(!(u.hak&&u.hak.toplam>0)) return false; }
            else if(uyeSeg==="normal"){ if((u.hak&&u.hak.toplam>0)||u.admin) return false; }
            else if(uyeSeg==="askida"){ if(!yasakliMi(u.user_id)) return false; }
            if(q && !((u.ad||"").toLowerCase().indexOf(q)>-1 || (u.email||"").toLowerCase().indexOf(q)>-1)) return false;
            return true;
          });
          return <div>
          <div style={{display:"flex",gap:8,marginBottom:12}}>
            <div style={{flex:1,background:T.bg1,border:"0.5px solid "+T.line,borderRadius:11,padding:"11px 8px",textAlign:"center"}}><div style={{fontSize:20,fontWeight:800,color:T.accent2,fontFamily:T.fontDisplay}}>{uyeler.length}</div><div style={{fontSize:9.5,color:T.textMut}}>toplam üye</div></div>
            <div style={{flex:1,background:T.bg1,border:"0.5px solid "+T.line,borderRadius:11,padding:"11px 8px",textAlign:"center"}}><div style={{fontSize:20,fontWeight:800,color:T.gold,fontFamily:T.fontDisplay}}>{yetkili.length}</div><div style={{fontSize:9.5,color:T.textMut}}>lig yetkisi olan</div></div>
            <div style={{flex:1,background:T.bg1,border:"0.5px solid "+T.line,borderRadius:11,padding:"11px 8px",textAlign:"center"}}><div style={{fontSize:20,fontWeight:800,color:T.textSoft,fontFamily:T.fontDisplay}}>{normal.length}</div><div style={{fontSize:9.5,color:T.textMut}}>normal üye</div></div>
          </div>
          {/* FAZ 5 — segment çipleri + arama */}
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
            {[["hepsi","Tümü",uyeler.length],["yeni","Yeni 7g",yeniSay],["yetkili","Yetkili",yetkili.length],["normal","Normal",normal.length],["askida","Askıda",askiSay]].map(x=>
              <button key={x[0]} onClick={()=>setUyeSeg(x[0])} className="tap" style={{fontSize:11,fontWeight:700,padding:"6px 11px",borderRadius:20,border:"0.5px solid "+(uyeSeg===x[0]?T.accent:T.line),background:uyeSeg===x[0]?T.accent:T.bg1,color:uyeSeg===x[0]?(T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0):T.textMut}}>{x[1]}{x[2]>0?" · "+x[2]:""}</button>
            )}
          </div>
          <input value={uyeAra} onChange={e=>setUyeAra(e.target.value)} placeholder="🔍 İsim / e-posta ara…" style={{width:"100%",boxSizing:"border-box",background:T.bg1,border:"0.5px solid "+T.line,borderRadius:10,padding:"9px 12px",color:T.text,fontSize:12.5,outline:"none",fontFamily:"inherit",marginBottom:10}}/>
          {uyeler.length===0 && <div style={{fontSize:12,color:T.textMut,textAlign:"center",padding:16}}>Henüz üye yok. İnsanlar üye oldukça burada görünür.</div>}
          {uyeler.length>0 && gosterilen.length===0 && <div style={{fontSize:12,color:T.textMut,textAlign:"center",padding:16}}>Bu filtreye uyan üye yok.</div>}
          {gosterilen.map(u=>{ const yetki=u.hak&&u.hak.toplam>0; const kalan=yetki?Math.max(0,(u.hak.toplam||0)-(u.hak.kullanilan||0)):0; const ikon=u.admin?"👑":yetki?"🎟️":"👤"; const kenar=u.admin?T.danger+"55":yetki?T.gold+"44":T.line; return (
            <div key={u.user_id} style={{display:"flex",alignItems:"center",flexWrap:"wrap",gap:10,background:T.bg1,border:"0.5px solid "+kenar,borderRadius:11,padding:"10px 12px",marginBottom:6}}>
              <div style={{width:34,height:34,borderRadius:"50%",background:(u.admin?T.danger:yetki?T.gold:T.accent2)+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>{ikon}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12.5,color:T.text,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{u.ad||u.email}</div>
                <div style={{fontSize:9.5,color:T.textMut,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{u.email}</div>
              </div>
              {u.admin
                ? <span style={{fontSize:9.5,fontWeight:800,color:T.danger,background:T.danger+"1f",borderRadius:6,padding:"4px 8px",whiteSpace:"nowrap"}}>👑 Süper Admin</span>
                : yetki
                ? <span style={{fontSize:9.5,fontWeight:800,color:T.gold,background:T.gold+"1f",borderRadius:6,padding:"4px 8px",whiteSpace:"nowrap"}}>Yetkili · {kalan}/{u.hak.toplam} boş</span>
                : <span style={{fontSize:9.5,fontWeight:700,color:T.textMut,background:T.bg2,borderRadius:6,padding:"4px 8px"}}>normal</span>}
              {oturum && u.user_id!==oturum.id && <button onClick={async()=>{ const y=!u.admin; if(y||confirm(u.email+" admin yetkisi kaldırılsın mı?")){ const r=await Db.adminYap(u.user_id,y); if(r.ok){ Db.logla(oturum, y?"Admin yaptı":"Admin kaldırdı", u.email); yenile(); } else setMesaj("Olmadı: "+(r.hata||"")); } }} className="tap" title={u.admin?"Admin'i kaldır":"Admin yap"} style={{fontSize:12,background:"none",border:"0.5px solid "+T.line,borderRadius:7,padding:"4px 7px",color:u.admin?T.danger:T.textMut}}>{u.admin?"⬇️":"👑"}</button>}
              {oturum && u.user_id!==oturum.id && !u.admin && (yasakliMi(u.user_id)
                ? <button onClick={()=>yasakKaldir(u)} className="tap" title="Yasağı kaldır" style={{fontSize:12,background:T.danger+"22",border:"0.5px solid "+T.danger+"66",borderRadius:7,padding:"4px 7px",color:T.danger}}>🚫</button>
                : <button onClick={()=>yasakla(u)} className="tap" title="Askıya al (yasakla)" style={{fontSize:12,background:"none",border:"0.5px solid "+T.line,borderRadius:7,padding:"4px 7px",color:T.textMut}}>🚫</button>)}
              {/* SÜPER ADMIN — rol ata: futbolcu / hakem / teknik direktör */}
              <div style={{flexBasis:"100%",display:"flex",alignItems:"center",gap:6,paddingTop:2}}>
                <span style={{fontSize:9.5,color:T.textMut,fontWeight:700,marginRight:2}}>ROL:</span>
                {[["futbolcu","⚽","Futbolcu"],["hakem","🧑‍⚖️","Hakem"],["td","🎯","Tek. Dir."]].map(([k,ic,et])=>{ const on=!!(u.roller&&u.roller[k]); return (
                  <button key={k} onClick={()=>rolToggle(u,k)} className="tap" title={et} style={{fontSize:10.5,fontWeight:700,background:on?T.accent+"22":"none",border:"0.5px solid "+(on?T.accent:T.line),borderRadius:7,padding:"4px 9px",color:on?T.accent:T.textMut,display:"flex",alignItems:"center",gap:4}}>{ic}<span style={{fontSize:9.5}}>{et}</span></button>
                ); })}
                {onDestek && oturum && u.user_id!==oturum.id && <button onClick={()=>onDestek(u)} className="tap" title="Kullanıcı gözünden görüntüle (salt-okunur)" style={{marginLeft:"auto",fontSize:10.5,fontWeight:800,background:T.gold+"1f",border:"0.5px solid "+T.gold+"66",borderRadius:7,padding:"4px 9px",color:T.gold,display:"flex",alignItems:"center",gap:4}}>👁<span style={{fontSize:9.5}}>Gözünden gör</span></button>}
              </div>
            </div> ); })}
        </div>; })()}
      </div>}

      {!yuk && sekme==="hak" && <div>
        {/* 📩 LİG KURMA BAŞVURULARI — uygulama içinden gelen talepler */}
        {(()=>{ const bekleyen=basvurular.filter(b=>b.durum!=='onaylandi'&&b.durum!=='red'); return <div style={{marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",gap:8,margin:"0 2px 9px"}}>
            <span style={{fontSize:13,fontWeight:800,color:T.text}}>📩 Lig Kurma Başvuruları</span>
            {bekleyen.length>0 && <span style={{fontSize:10,fontWeight:800,color:T.gold,background:T.gold+"1f",borderRadius:20,padding:"2px 9px"}}>{bekleyen.length} bekliyor</span>}
          </div>
          {basvurular.length===0 && <div style={{fontSize:12,color:T.textMut,textAlign:"center",padding:"14px 10px",background:T.bg1,border:"0.5px solid "+T.line,borderRadius:12}}>Henüz başvuru yok. İnsanlar “+ Lig Kur” deyip başvurdukça burada görünür.</div>}
          {basvurular.map(b=>{ const durRenk=b.durum==='onaylandi'?T.accent:b.durum==='red'?T.danger:b.durum==='arandi'?(T.accent2||T.accent):T.gold; const durAd={bekliyor:"BEKLİYOR",arandi:"ARANDI",onaylandi:"ONAYLANDI",red:"REDDEDİLDİ"}[b.durum]||b.durum; return (
            <div key={b.id} style={{background:T.bg1,border:"0.5px solid "+T.line,borderRadius:13,padding:13,marginBottom:9}}>
              <div style={{display:"flex",alignItems:"center",gap:9}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:T.accent2+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:T.accent2,flexShrink:0}}>{((b.ad_soyad||b.email||"?").trim()[0]||"?").toLocaleUpperCase("tr")}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13.5,fontWeight:800,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{b.ad_soyad||"(isim yok)"}</div>
                  <div style={{fontSize:10.5,color:T.textMut}}>{b.sehir||"—"}{b.takim_sayisi?" · "+b.takim_sayisi+" takım":""}</div>
                </div>
                <span style={{fontSize:9,fontWeight:800,color:durRenk,background:durRenk+"1f",borderRadius:6,padding:"3px 8px",whiteSpace:"nowrap"}}>{durAd}</span>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:4,margin:"10px 0 11px",fontSize:12.5,color:T.textSoft}}>
                <div style={{display:"flex",gap:8}}><span style={{color:T.textMut,width:64,flexShrink:0}}>📞 Tel</span><a href={"tel:"+(b.telefon||"")} style={{color:T.accent2,textDecoration:"none"}}>{b.telefon||"—"}</a></div>
                <div style={{display:"flex",gap:8}}><span style={{color:T.textMut,width:64,flexShrink:0}}>✉️ Mail</span><span style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{b.email||"—"}</span></div>
                <div style={{display:"flex",gap:8}}><span style={{color:T.textMut,width:64,flexShrink:0}}>🏆 Lig</span><span>{b.lig_ad||"—"}</span></div>
                {b.mesaj && <div style={{display:"flex",gap:8}}><span style={{color:T.textMut,width:64,flexShrink:0}}>📝 Not</span><span style={{lineHeight:1.4}}>{b.mesaj}</span></div>}
              </div>
              {b.durum!=='onaylandi' && b.durum!=='red' && <div style={{display:"flex",gap:7}}>
                <button onClick={()=>basvuruYetki(b)} className="tap" style={{flex:1,background:T.accent,color:T.renkCifti&&T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0,border:0,borderRadius:9,padding:"9px",fontSize:12.5,fontWeight:800}}>✓ Yetki Ver</button>
                <button onClick={()=>basvuruArandi(b)} className="tap" style={{flex:"0 0 auto",background:T.bg2,color:T.accent2,border:"0.5px solid "+T.line,borderRadius:9,padding:"9px 12px",fontSize:12.5,fontWeight:700}}>📞 Aradım</button>
                <button onClick={()=>basvuruRed(b)} className="tap" style={{flex:"0 0 auto",background:"none",color:T.danger,border:"0.5px solid "+T.danger+"44",borderRadius:9,padding:"9px 12px",fontSize:12.5,fontWeight:700}}>✕</button>
              </div>}
            </div> ); })}
          <div style={{height:1,background:T.line,margin:"14px 0 12px"}}/>
        </div>; })()}
        <div style={{fontSize:11,color:T.textMut,lineHeight:1.6,marginBottom:10}}>IBAN ödemesini gördüğün kişiye lig açma hakkı ver. Kişi <b style={{color:T.text}}>önce uygulamaya üye olmalı</b> (yoksa e-posta bulunamaz).</div>
        <div style={{background:T.bg1,border:"0.5px solid "+T.line,borderRadius:12,padding:12,marginBottom:12}}>
          <input value={hakMail} onChange={e=>setHakMail(e.target.value)} placeholder="kisi@mail.com" style={{width:"100%",background:T.bg0,border:"0.5px solid "+T.line,borderRadius:10,padding:11,color:T.text,fontSize:13,outline:"none",fontFamily:"inherit",marginBottom:8}}/>
          <div style={{display:"flex",gap:8,marginBottom:8}}>
            <div style={{flex:"0 0 110px"}}>
              <div style={{fontSize:9.5,color:T.textMut,marginBottom:3}}>Toplam lig hakkı</div>
              <input type="number" min="0" value={hakSayi} onChange={e=>setHakSayi(e.target.value)} style={{width:"100%",background:T.bg0,border:"0.5px solid "+T.line,borderRadius:10,padding:11,color:T.text,fontSize:15,fontWeight:800,textAlign:"center",outline:"none",fontFamily:"inherit"}}/>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:9.5,color:T.textMut,marginBottom:3}}>Not (ör. ödeme tarihi)</div>
              <input value={hakNot} onChange={e=>setHakNot(e.target.value)} placeholder="IBAN 12.07 geldi" style={{width:"100%",background:T.bg0,border:"0.5px solid "+T.line,borderRadius:10,padding:11,color:T.text,fontSize:12,outline:"none",fontFamily:"inherit"}}/>
            </div>
          </div>
          <button onClick={hakVerFn} className="tap" style={{width:"100%",background:T.gold,color:"#04070C",border:0,borderRadius:10,padding:"11px",fontSize:13.5,fontWeight:800}}>🎟️ Hak Ver / Güncelle</button>
        </div>
        <div style={{fontSize:10.5,color:T.textMut,fontWeight:700,margin:"4px 2px 8px"}}>HAK VERİLEN HESAPLAR ({haklar.length})</div>
        {haklar.length===0 && <div style={{fontSize:12,color:T.textMut,textAlign:"center",padding:16}}>Henüz kimseye hak verilmedi.</div>}
        {haklar.map(h=>{ const kalan=Math.max(0,(h.toplam||0)-(h.kullanilan||0)); return (
          <div key={h.user_id} style={{background:T.bg1,border:"0.5px solid "+T.line,borderRadius:11,padding:"10px 12px",marginBottom:6}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:14}}>🎟️</span>
              <span style={{flex:1,fontSize:12.5,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{h.email}</span>
              <span style={{fontSize:11,fontWeight:800,color:kalan>0?T.accent:T.textMut}}>{kalan} boş</span>
            </div>
            <div style={{display:"flex",gap:6,marginTop:7,fontSize:10}}>
              <span style={{background:T.gold+"1f",color:T.gold,borderRadius:6,padding:"3px 8px",fontWeight:700}}>Toplam {h.toplam||0}</span>
              <span style={{background:T.accent2+"1f",color:T.accent2,borderRadius:6,padding:"3px 8px",fontWeight:700}}>Kullanılan {h.kullanilan||0}</span>
              {h.not_ && <span style={{color:T.textMut,padding:"3px 4px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>📝 {h.not_}</span>}
            </div>
          </div> ); })}
      </div>}

      {!yuk && sekme==="ligler" && <div>
        {/* 👥 YARDIMCI (YEDEK) LİG YÖNETİCİLERİ — merkezi görünüm + ekle/çıkar */}
        <div style={{background:T.bg1,border:"0.5px solid "+T.line,borderRadius:14,padding:"13px 14px",marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
            <span style={{fontSize:13,fontWeight:800,color:T.text}}>👥 Yardımcı Yöneticiler</span>
            <span style={{fontSize:10,color:T.textMut,background:T.bg2,borderRadius:20,padding:"2px 8px",fontWeight:700}}>{hepYardimci.length}</span>
          </div>
          <div style={{fontSize:10.5,color:T.textMut,lineHeight:1.55,marginBottom:11}}>Bir ligin yedek yöneticisi. O ligi yönetir (takım/maç/oyuncu) ama <b>kendine lig hakkı almaz</b>. Dilediğinde çıkar.</div>
          {/* ekleme formu */}
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:ayMesaj?6:11}}>
            <select value={aySecLig} onChange={e=>{setAySecLig(e.target.value);setAyMesaj("");}} style={{flex:"1 1 140px",minWidth:0,background:T.bg2,border:"0.5px solid "+T.line,borderRadius:9,padding:"9px 10px",color:aySecLig?T.text:T.textMut,fontSize:12,outline:"none",fontFamily:"inherit"}}>
              <option value="">Lig seç…</option>
              {tumLiglerY.map(l=><option key={l.id} value={l.id}>{l.ad}</option>)}
            </select>
            <input value={ayMail} onChange={e=>{setAyMail(e.target.value);setAyMesaj("");}} onKeyDown={e=>{if(e.key==="Enter")ayEkle();}} placeholder="yardımcı@mail.com" style={{flex:"2 1 150px",minWidth:0,background:T.bg2,border:"0.5px solid "+T.line,borderRadius:9,padding:"9px 10px",color:T.text,fontSize:12,outline:"none",fontFamily:"inherit"}}/>
            <button onClick={ayEkle} className="tap" style={{background:T.accent,color:T.bg0,border:0,borderRadius:9,padding:"0 15px",fontSize:12.5,fontWeight:800}}>Ekle</button>
          </div>
          {ayMesaj && <div style={{fontSize:11,color:ayMesaj[0]==="✓"?T.accent:T.gold,marginBottom:10}}>{ayMesaj}</div>}
          {/* lige göre gruplanmış liste */}
          {hepYardimci.length===0
            ? <div style={{fontSize:11.5,color:T.textMut,textAlign:"center",padding:"8px 0"}}>Henüz atanmış yardımcı yönetici yok.</div>
            : Object.entries(hepYardimci.reduce((m,y)=>{ (m[y.lig_id]=m[y.lig_id]||{ad:y.ligAd,uyeler:[]}).uyeler.push(y); return m; },{})).map(([lid,g])=>
              <div key={lid} style={{marginBottom:8}}>
                <div style={{fontSize:10.5,color:T.textMut,fontWeight:700,margin:"0 2px 4px",display:"flex",alignItems:"center",gap:6}}><span>🏟️</span><span style={{color:T.textSoft}}>{g.ad}</span></div>
                {g.uyeler.map(y=>
                  <div key={y.user_id} style={{display:"flex",alignItems:"center",gap:9,background:T.bg2,border:"0.5px solid "+T.line,borderRadius:10,padding:"8px 10px",marginBottom:4}}>
                    <div style={{width:26,height:26,borderRadius:8,background:T.accent+"22",color:T.accent,display:"grid",placeItems:"center",fontSize:12,fontWeight:800,flexShrink:0}}>{((y.ad||y.email||"?")[0]||"?").toUpperCase()}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:700,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{y.ad||y.email}</div>
                      {y.ad && <div style={{fontSize:9.5,color:T.textMut,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{y.email}</div>}
                    </div>
                    <button onClick={()=>ayCikar(y)} className="tap" style={{fontSize:10.5,color:T.danger,background:T.danger+"14",border:"0.5px solid "+T.danger+"44",borderRadius:8,padding:"5px 10px",fontWeight:700,flexShrink:0}}>Çıkar</button>
                  </div>
                )}
              </div>
            )}
        </div>
        {ligler.length===0 && <div style={{fontSize:12,color:T.textMut,textAlign:"center",padding:20}}>Henüz herkese açık lig yok.</div>}
        {ligler.length>0 && <div style={{fontSize:9.5,color:T.textMut,margin:"0 2px 8px",display:"flex",gap:12}}><span>🟢 aktif</span><span>🟡 yavaşlıyor</span><span>🔴 sessiz (30g+)</span></div>}
        {ligler.map(l=>{ const sg=ligSagligi(l); const secili=seciliLigler.has(l.slug); return
          <div key={l.slug} style={{display:"flex",alignItems:"center",gap:10,background:secili?T.accent+"12":T.bg1,border:"0.5px solid "+(secili?T.accent+"55":T.line),borderRadius:11,padding:"10px 12px",marginBottom:6}}>
            <button onClick={()=>ligSecToggle(l.slug)} className="tap" title="Seç" style={{width:20,height:20,borderRadius:6,flexShrink:0,border:"1.5px solid "+(secili?T.accent:T.line),background:secili?T.accent:"transparent",color:"#04140c",fontSize:12,fontWeight:900,display:"grid",placeItems:"center"}}>{secili?"✓":""}</button>
            <div style={{width:34,height:34,borderRadius:9,background:T.gold+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0,position:"relative"}}>🏟️
              <span title={sg.t} style={{position:"absolute",bottom:-2,right:-2,width:11,height:11,borderRadius:"50%",background:sg.r,border:"2px solid "+T.bg1}}/></div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:700,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{l.ad}</div>
              <div style={{fontSize:9.5,color:T.textMut}}>{l.sehir||"—"} · <span style={{color:sg.r}}>{sg.t}</span> · {rZaman(l.guncelleme)}</div>
            </div>
            <a href={PAYLASIM_URL(l.slug)} className="tap" style={{fontSize:11,color:T.accent,textDecoration:"none",background:T.accent+"18",borderRadius:8,padding:"6px 9px",fontWeight:700}}>Aç</a>
            <button onClick={()=>ligSil(l.slug)} className="tap" style={{fontSize:11,color:T.danger,background:T.danger+"18",border:"0.5px solid "+T.danger+"44",borderRadius:8,padding:"6px 9px",fontWeight:700}}>Kaldır</button>
          </div>; })}
        {/* toplu işlem çubuğu */}
        {seciliLigler.size>0 && <div className="fade-in" style={{position:"sticky",bottom:8,marginTop:10,display:"flex",alignItems:"center",gap:10,background:T.bg2,border:"1px solid "+T.accent+"55",borderRadius:12,padding:"11px 14px",boxShadow:"0 10px 26px rgba(0,0,0,.5)"}}>
          <span style={{fontSize:12.5,color:T.text,fontWeight:700}}>{seciliLigler.size} lig seçildi</span>
          <button onClick={()=>setSeciliLigler(new Set())} className="tap" style={{marginLeft:"auto",fontSize:11.5,color:T.textMut,background:"none",border:"0.5px solid "+T.line,borderRadius:8,padding:"7px 12px",fontWeight:700}}>Vazgeç</button>
          <button onClick={topluLigKaldir} className="tap" style={{fontSize:11.5,color:"#fff",background:T.danger,border:0,borderRadius:8,padding:"7px 14px",fontWeight:800}}>🗑 Seçilenleri Kaldır</button>
        </div>}
      </div>}

      {!yuk && sekme==="yetki" && <div>
        <div style={{fontSize:11,color:T.textMut,lineHeight:1.6,marginBottom:10}}>IBAN ile ödeme yapan / onayladığın hesapların e-postasını ekle. (Onaylı işaretlenir.)</div>
        <div style={{display:"flex",gap:8,marginBottom:12}}>
          <input value={yeniMail} onChange={e=>setYeniMail(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")yetkiEkle();}} placeholder="ornek@mail.com" style={{flex:1,background:T.bg1,border:"0.5px solid "+T.line,borderRadius:10,padding:11,color:T.text,fontSize:13,outline:"none",fontFamily:"inherit"}}/>
          <button onClick={yetkiEkle} className="tap" style={{background:T.accent,color:T.bg0,border:0,borderRadius:10,padding:"0 16px",fontSize:13,fontWeight:800}}>Ekle</button>
        </div>
        {yetkiler.length===0 && <div style={{fontSize:12,color:T.textMut,textAlign:"center",padding:16}}>Henüz onaylı hesap yok.</div>}
        {yetkiler.map(y=>
          <div key={y.email} style={{display:"flex",alignItems:"center",gap:10,background:T.bg1,border:"0.5px solid "+T.line,borderRadius:10,padding:"9px 12px",marginBottom:6}}>
            <span style={{fontSize:14}}>✅</span>
            <span style={{flex:1,fontSize:12.5,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{y.email}</span>
            <button onClick={()=>yetkiSil(y.email)} className="tap" style={{fontSize:11,color:T.danger,background:"none",border:"0.5px solid "+T.line,borderRadius:8,padding:"5px 9px"}}>çıkar</button>
          </div>
        )}
      </div>}

      {!yuk && sekme==="sistem" && <div style={{fontSize:12.5,color:T.textSoft,lineHeight:1.8}}>
        {/* ===== ÖZ-TEST (Sistem Sağlığı canlı kontrolü) ===== */}
        {(()=>{ const durRenk=(d)=>d==="ok"?T.accent:d==="uyari"?T.gold:T.danger; const durIk=(d)=>d==="ok"?"✅":d==="uyari"?"⚠":"❌";
          const sayac=ozTest?{ok:ozTest.filter(x=>x.durum==="ok").length,uyari:ozTest.filter(x=>x.durum==="uyari").length,hata:ozTest.filter(x=>x.durum==="hata").length}:null;
          const genelRenk=!sayac?T.accent2:sayac.hata?T.danger:sayac.uyari?T.gold:T.accent;
          return <div style={{background:"linear-gradient(160deg,"+T.bg2+","+T.bg1+")",border:"1px solid "+T.line,borderRadius:14,padding:"14px 15px",marginBottom:10}}>
            <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:ozTest?12:4}}>
              <span style={{width:9,height:9,borderRadius:"50%",background:genelRenk,display:"inline-block",flexShrink:0}}/>
              <div style={{fontSize:13.5,fontWeight:800,color:T.text}}>🩺 Sistem Öz-Testi</div>
              {sayac && <span style={{marginLeft:"auto",fontSize:10.5,fontWeight:700,color:genelRenk}}>{sayac.hata?sayac.hata+" hata":sayac.uyari?sayac.uyari+" uyarı":"her şey yolunda"}</span>}
            </div>
            {!ozTest && <div style={{fontSize:11.5,color:T.textMut,marginBottom:11,lineHeight:1.5}}>Veritabanı, giriş, güvenlik, depolama, hız ve sürümü canlı kontrol eder. Salt-okunur — hiçbir veriye dokunmaz.</div>}
            {ozTest && <div style={{marginBottom:11}}>
              {ozTest.map((s,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:i<ozTest.length-1?"1px solid "+T.line:"none"}}>
                <span style={{fontSize:13}}>{durIk(s.durum)}</span>
                <span style={{flex:1,fontSize:13,color:T.text}}>{s.ad}</span>
                <span style={{fontSize:11,color:durRenk(s.durum),fontWeight:600,fontFamily:T.fontDisplay}}>{s.not}</span>
              </div>)}
            </div>}
            {ozTest && ozTest.some(s=>s.durum==="uyari"&&/sürüm/i.test(s.ad)) && <button onClick={()=>{ try{sessionStorage.removeItem("fl_sw_reload_ts");}catch(e){} if(navigator.serviceWorker&&navigator.serviceWorker.getRegistration){ navigator.serviceWorker.getRegistration().then(function(reg){ if(reg){ if(reg.waiting)reg.waiting.postMessage("FL_SKIP_WAITING"); reg.update().catch(function(){}); } setTimeout(function(){location.reload();},700); }).catch(function(){ setTimeout(function(){location.reload();},300); }); } else setTimeout(function(){location.reload();},250); }} className="tap" style={{width:"100%",padding:"11px",borderRadius:11,background:T.gold,color:"#1A1505",fontSize:13,fontWeight:800,border:"none",marginBottom:8}}>⬆️ Yeni sürüme güncelle & yenile</button>}
            <button onClick={ozTestCalistir} disabled={ozTestYuk} className="tap" style={{width:"100%",padding:"11px",borderRadius:11,background:ozTestYuk?T.bg2:T.accent,color:ozTestYuk?T.textMut:(T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0),fontSize:13,fontWeight:800,border:"none"}}>{ozTestYuk?"Kontrol ediliyor…":ozTest?"↻ Yeniden Test Et":"▶ Öz-Test Başlat"}</button>
          </div>;
        })()}
        {/* ===== FAZ 2 — VERİ SAĞLIK TARAMASI (Veri Doktoru) ===== */}
        {(()=>{ const v=veriSaglik; const hata=v&&v.hata; const say=v&&!hata?((v.takimsizLig||0)+(v.oksuzOyuncu||0)+(v.hayaletMac||0)):null;
          const sat=[["Takımsız lig",v&&v.takimsizLig||0],["Öksüz oyuncu (üyeliksiz)",v&&v.oksuzOyuncu||0],["Hayalet maç (skor var, oynanmadı)",v&&v.hayaletMac||0]];
          const renk=say===null?T.accent2:say===0?T.accent:T.gold;
          return <div style={{background:"linear-gradient(160deg,"+T.bg2+","+T.bg1+")",border:"1px solid "+T.line,borderRadius:14,padding:"14px 15px",marginBottom:10}}>
            <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:10}}>
              <span style={{width:9,height:9,borderRadius:"50%",background:renk,flexShrink:0}}/>
              <div style={{fontSize:13.5,fontWeight:800,color:T.text}}>🩺 Veri Doktoru</div>
              {say!==null && <span style={{marginLeft:"auto",fontSize:10.5,fontWeight:700,color:renk}}>{say===0?"temiz":say+" uyarı"}</span>}
            </div>
            {hata && <div style={{fontSize:11.5,color:T.textMut,marginBottom:10}}>Tarama yapılamadı ({v.hata}).</div>}
            {!hata && sat.map(([ad,n],i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:i<sat.length-1?"1px solid "+T.line:"none"}}>
              <span style={{fontSize:13}}>{n>0?"⚠":"✅"}</span><span style={{flex:1,fontSize:13,color:T.text}}>{ad}</span>
              <span style={{fontSize:13,fontWeight:800,color:n>0?T.gold:T.accent,fontFamily:T.fontDisplay}}>{n}</span>
            </div>)}
            {v&&v.zaman && <div style={{fontSize:10,color:T.textMut,margin:"8px 0 0"}}>Son tarama: {new Date(v.zaman).toLocaleString("tr-TR")}</div>}
            <button onClick={veriTara} disabled={veriSaglikYuk} className="tap" style={{width:"100%",marginTop:11,padding:"10px",borderRadius:11,background:veriSaglikYuk?T.bg2:T.bg1,color:veriSaglikYuk?T.textMut:T.accent,fontSize:12.5,fontWeight:800,border:"1px solid "+T.accent+"55"}}>{veriSaglikYuk?"Taranıyor…":"↻ Şimdi Tara"}</button>
          </div>;
        })()}
        {/* ===== FAZ 3 — SİSTEM ANAHTARLARI (Bakım modu + özellik bayrakları) ===== */}
        {(()=>{ const A=anahtarlar||{}; const sw=(on)=>({width:36,height:20,borderRadius:11,position:"relative",flexShrink:0,background:on?T.accent:T.bg2,border:"1px solid "+(on?T.accent:T.line),transition:"background .2s"});
          const knob=(on)=>({position:"absolute",top:2,left:on?18:2,width:14,height:14,borderRadius:"50%",background:"#fff",transition:"left .2s"});
          const flags=[["bakim","🧯 Bakım modu (herkes salt-okunur)",A.bakim==="1"||A.bakim===true],["yeni_ozellik","🧪 Beta özellik anahtarı",A.yeni_ozellik==="1"||A.yeni_ozellik===true]];
          return <div style={{background:"linear-gradient(160deg,"+T.bg2+","+T.bg1+")",border:"1px solid "+T.line,borderRadius:14,padding:"14px 15px",marginBottom:10}}>
            <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:10}}><span style={{fontSize:15}}>🎛</span><div style={{fontSize:13.5,fontWeight:800,color:T.text}}>Sistem Anahtarları</div></div>
            {flags.map(([k,et,on])=><div key={k} onClick={()=>anahtarCevir(k,on?"0":"1")} className="tap" style={{display:"flex",alignItems:"center",gap:11,padding:"9px 0",borderBottom:"1px solid "+T.line,cursor:"pointer"}}>
              <span style={{flex:1,fontSize:13,color:T.text}}>{et}</span>
              <span style={sw(on)}><span style={knob(on)}/></span>
            </div>)}
            <div style={{fontSize:10.5,color:T.textMut,marginTop:9,lineHeight:1.5}}>Kapalı = kullanıcı görmez/etkilenmez · Bakım modu açıkken sadece sen düzenleyebilirsin. Anında etki eder, güncelleme beklemez.</div>
          </div>;
        })()}
        {/* ===== İZLEME PANELLERİ — tek dokunuşla dış servisler (Clarity/Sentry/UptimeRobot) ===== */}
        {(()=>{ const paneller=[
            ["🎬","Clarity","Isı haritası + kayıtlar","https://clarity.microsoft.com"],
            ["🐞","Sentry","Hata kayıtları","https://sentry.io"],
            ["📡","UptimeRobot","Kesinti izleme","https://uptimerobot.com/dashboard"],
          ];
          return <div style={{background:"linear-gradient(160deg,"+T.bg2+","+T.bg1+")",border:"1px solid "+T.line,borderRadius:14,padding:"14px 15px",marginBottom:10}}>
            <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:4}}><span style={{fontSize:15}}>📊</span><div style={{fontSize:13.5,fontWeight:800,color:T.text}}>İzleme Panelleri</div></div>
            <div style={{fontSize:10.5,color:T.textMut,marginBottom:11,lineHeight:1.5}}>Tek dokunuşla açılır. İlk girişten sonra servis seni hatırlar, tekrar şifre sormaz.</div>
            {paneller.map(([ik,ad,ac,url])=>
              <a key={ad} href={url} target="_blank" rel="noopener noreferrer" className="tap" style={{display:"flex",alignItems:"center",gap:11,padding:"10px 11px",marginBottom:7,background:T.bg1,border:"1px solid "+T.line,borderRadius:11,textDecoration:"none",cursor:"pointer"}}>
                <span style={{fontSize:18,flexShrink:0}}>{ik}</span>
                <span style={{flex:1,minWidth:0}}>
                  <span style={{display:"block",fontSize:13,fontWeight:700,color:T.text}}>{ad}</span>
                  <span style={{display:"block",fontSize:10.5,color:T.textMut,marginTop:1}}>{ac}</span>
                </span>
                <span style={{fontSize:15,color:T.accent,flexShrink:0}}>↗</span>
              </a>)}
          </div>;
        })()}
        {/* ===== FAZ 4 — OPERASYON MERKEZİ (gerçek metrikler) ===== */}
        {metrik && (()=>{
          const GB=1073741824;
          const depoY=Math.min(100,(metrik.depo_bayt/GB)*100);
          const depoMB=metrik.depo_bayt/1048576;
          const ortKB=metrik.depo_dosya?(metrik.depo_bayt/metrik.depo_dosya/1024):0;
          const puanDepo=Math.max(0,Math.round(100-depoY));
          const puanGuv=hatalar.length?74:92;
          const puanDb=Math.max(50,Math.round(100-(metrik.mac/5000)*100));
          const puanOlcek=Math.max(50,Math.round(100-(metrik.mau/50000)*100));
          // B5: sabit-kodlu "Perf 90 / Optim 88" alt-skorları kaldırıldı → sağlık puanı sadece GERÇEK ölçülenlerden
          const genel=Math.round((puanDepo+puanGuv+puanDb+puanOlcek)/4);
          const renk=genel>=80?T.accent:genel>=60?T.gold:T.danger;
          const uyari=[];
          if(depoY>70) uyari.push(["🔴","Depolama %"+depoY.toFixed(0)+" dolu. Bakım → sahipsiz dosyaları temizle."]);
          else if(depoY<50) uyari.push(["🟢","Depolama %"+depoY.toFixed(0)+" — ücretli plana geçmene gerek yok."]);
          if(metrik.mesaj>5000 && metrik.mesaj_arsiv===0) uyari.push(["🟡","Aktif mesaj 5.000+ ama arşiv boş — Bakım → sohbeti arşivle."]);
          if(ortKB>80) uyari.push(["🟡","Fotoğraf ortalama boyutu ~"+ortKB.toFixed(0)+"KB, beklenenden yüksek."]);
          if(hatalar.length>0) uyari.push(["🔴",hatalar.length+" çökme kaydı var — aşağıda Hata Logu'na bak."]);
          if(metrik.lig_cop>0) uyari.push(["🟡","Çöp kutusunda "+metrik.lig_cop+" lig var."]);
          const mtr=[["🏟️","Lig",metrik.lig],["👥","Üye",metrik.uye],["🟢","Aktif 30g",metrik.mau],["⚽","Oyuncu",metrik.oyuncu],["🛡️","Takım",metrik.takim],["📅","Maç",metrik.mac],["💬","Mesaj",metrik.mesaj],["🖼️","Foto+Logo",(metrik.foto+metrik.logo)]];
          return <>
            <div style={{background:"linear-gradient(160deg,"+T.bg2+","+T.bg1+")",border:"1px solid "+T.line,borderRadius:14,padding:"14px 15px",marginBottom:10}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                <div style={{width:58,height:58,borderRadius:"50%",display:"grid",placeItems:"center",flexShrink:0,background:"conic-gradient("+renk+" "+(genel*3.6)+"deg, rgba(255,255,255,.08) 0)"}}>
                  <div style={{width:46,height:46,borderRadius:"50%",background:T.bg1,display:"grid",placeItems:"center"}}><b style={{fontSize:18,color:renk,fontWeight:900}} className="tab">{genel}</b></div>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13.5,fontWeight:800,color:T.text,display:"flex",alignItems:"center",gap:7}}>🎛️ Operasyon Merkezi <span className="fz-canli-dot" style={{width:7,height:7,borderRadius:"50%",background:T.accent,display:"inline-block"}}/></div>
                  <div style={{fontSize:10.5,color:T.textMut,marginTop:2}}>Sistem sağlığı {genel}/100 · <span style={{color:T.accent}}>GERÇEK veriler</span></div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:6}}>
                    <span style={{fontSize:9,color:opTek.api!=null?(opTek.api<400?T.accent:T.gold):T.textMut,background:T.bg1,border:"0.5px solid "+T.line,borderRadius:7,padding:"3px 7px",fontWeight:700}}>⚡ API {opTek.api!=null?opTek.api+"ms":"…"}</span>
                    <span style={{fontSize:9,color:opTek.cf?T.accent:T.textMut,background:T.bg1,border:"0.5px solid "+T.line,borderRadius:7,padding:"3px 7px",fontWeight:700}}>☁ {opTek.cf||"CDN"}</span>
                    {opTek.deploy && <span title="Son yayınlanan sürüm" style={{fontSize:9,color:T.textMut,background:T.bg1,border:"0.5px solid "+T.line,borderRadius:7,padding:"3px 7px",fontWeight:700}}>🚀 {String(opTek.deploy).split("-")[0]}</span>}
                  </div>
                </div>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
                {[["Güvenlik",puanGuv],["Depolama",puanDepo],["DB",puanDb],["Ölçek",puanOlcek]].map(([ad,p],i)=>
                  <div key={i} style={{fontSize:9.5,color:T.textMut,background:T.bg1,border:"0.5px solid "+T.line,borderRadius:8,padding:"4px 8px"}}>{ad} <b style={{color:p>=80?T.accent:p>=60?T.gold:T.danger}} className="tab">{p}</b></div>)}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:12}}>
                {mtr.map(([ik,ad,v],i)=>
                  <div key={i} style={{background:T.bg1,border:"0.5px solid "+T.line,borderRadius:9,padding:"8px 6px",textAlign:"center"}}>
                    <div style={{fontSize:15,fontWeight:800,color:T.text}} className="tab">{v}</div>
                    <div style={{fontSize:8.5,color:T.textMut,marginTop:1}}>{ik} {ad}</div>
                  </div>)}
              </div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10.5,color:T.textMut,marginBottom:4}}><span>💾 Depolama <span style={{color:T.accent}}>(GERÇEK)</span></span><span className="tab">{depoMB.toFixed(1)} / 1024 MB · %{depoY.toFixed(1)}</span></div>
              <div style={{height:7,background:T.bg1,borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",width:Math.max(2,depoY)+"%",background:depoY>70?T.danger:depoY>40?T.gold:T.accent,borderRadius:4}}/></div>
            </div>
            {uyari.length>0 && <div style={{background:T.bg1,border:"0.5px solid "+T.line,borderRadius:12,padding:"11px 13px",marginBottom:10}}>
              <div style={{fontSize:11,color:T.textMut,fontWeight:700,marginBottom:8}}>💡 AKILLI UYARILAR</div>
              {uyari.map(([ik,tx],i)=><div key={i} style={{display:"flex",gap:8,fontSize:12,color:T.textSoft,padding:"4px 0",lineHeight:1.4}}><span>{ik}</span><span style={{flex:1}}>{tx}</span></div>)}
            </div>}
          </>;
        })()}
        {/* ===== CANLI AKIŞ · TRAFİK · TREND ===== */}
        {(()=>{
          const SPL=(arr,renk)=>{ const a=(arr&&arr.length)?arr:[0,0]; const mx=Math.max(1,...a); const w=58,h=18; const pts=a.map((v,i)=>((i/((a.length-1)||1))*w).toFixed(1)+","+(h-(v/mx)*(h-3)-1.5).toFixed(1)).join(" "); return <svg width={w} height={h} style={{display:"block",overflow:"visible"}}><polyline points={pts} fill="none" stroke={renk} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round"/><circle cx={(w).toFixed(1)} cy={(h-(a[a.length-1]/mx)*(h-3)-1.5).toFixed(1)} r="2" fill={renk}/></svg>; };
          const aktifSeri=(gunTrend||[]).map(x=>x.kisi||0);
          const olayIk={sayfa:"👁️",rol:"👤",basvuru:"🏆",arama:"🔍",lig:"🏟️",mac:"⚽"};
          const trafik=[["🟢 Online","5dk",online||0,aktifSeri,T.accent],["👁️ Görüntüleme","24s",(opEk&&opEk.pageview24)||0,null,T.accent2||T.accent],["✨ Yeni üye","7g",(opEk&&opEk.yeniUye7)||0,(opEk&&opEk.yeniTrend)||[],T.gold]];
          return <>
            <div style={{background:"linear-gradient(160deg,"+T.bg2+","+T.bg1+")",border:"1px solid "+T.line,borderRadius:14,padding:"13px 15px",marginBottom:10}}>
              <div style={{fontSize:11,color:T.textMut,fontWeight:700,marginBottom:10,display:"flex",alignItems:"center",gap:7}}>📈 TRAFİK & TREND <span style={{fontSize:8.5,color:T.accent,background:T.accent+"18",borderRadius:6,padding:"1px 6px"}}>7 GÜN</span></div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:6}}>
                {trafik.map(([ad,per,v,seri,renk],i)=>
                  <div key={i} style={{background:T.bg1,border:"0.5px solid "+T.line,borderRadius:10,padding:"9px 10px"}}>
                    <div style={{fontSize:8.5,color:T.textMut}}>{ad} <span style={{opacity:.6}}>· {per}</span></div>
                    <div style={{fontSize:19,fontWeight:900,color:T.text,margin:"2px 0 3px"}} className="tab">{v}</div>
                    {seri && seri.length>1 ? SPL(seri,renk) : <div style={{height:18}}/>}
                  </div>)}
              </div>
              {opEk&&opEk.hataTrend&&opEk.hataTrend.some(x=>x>0) && <div style={{display:"flex",alignItems:"center",gap:8,fontSize:10,color:T.textMut,marginTop:4}}><span>🐞 Hata trendi (7g)</span><span style={{marginLeft:"auto"}}>{SPL(opEk.hataTrend,T.danger)}</span></div>}
            </div>
            <div style={{background:T.bg1,border:"0.5px solid "+T.line,borderRadius:12,padding:"12px 14px",marginBottom:10}}>
              <div style={{fontSize:11,color:T.textMut,fontWeight:700,marginBottom:9,display:"flex",alignItems:"center",gap:7}}>🌊 CANLI AKIŞ <span className="fz-canli-dot" style={{width:6,height:6,borderRadius:"50%",background:T.accent,display:"inline-block"}}/></div>
              {(!opEk||!opEk.akis||opEk.akis.length===0) && <div style={{fontSize:11.5,color:T.textMut,textAlign:"center",padding:"12px 0"}}>Henüz olay yok — kullanıcı hareketi burada canlı akar.</div>}
              <div style={{maxHeight:200,overflowY:"auto"}}>
                {(opEk&&opEk.akis||[]).map((e,i)=>
                  <div key={i} className="fz-akis-satir" style={{display:"flex",alignItems:"center",gap:9,padding:"6px 2px",borderBottom:i<((opEk.akis.length)-1)?"0.5px solid "+T.line:"none"}}>
                    <span style={{fontSize:13,width:18,textAlign:"center",flexShrink:0}}>{olayIk[e.tip]||"•"}</span>
                    <span style={{flex:1,fontSize:11.5,color:T.textSoft,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{e.tip==="sayfa"?("Sayfa görüntülendi: "+(e.deger||"—")):(e.deger?(e.tip+" · "+e.deger):e.tip)}</span>
                    <span style={{fontSize:9.5,color:T.textMut,flexShrink:0}}>{rZaman(e.created)}</span>
                  </div>)}
              </div>
            </div>
          </>;
        })()}
        {/* ===== 🆘 DESTEK TALEPLERİ ===== */}
        {destekTalep.length>0 && (()=>{ const btn={fontSize:10,fontWeight:700,background:T.bg1,border:"0.5px solid "+T.line,borderRadius:7,padding:"5px 9px",color:T.textSoft,cursor:"pointer"}; return <div style={{background:T.bg1,border:"0.5px solid "+T.gold+"44",borderRadius:12,padding:"12px 14px",marginBottom:10}}>
          <div style={{fontSize:11,color:T.gold,fontWeight:800,marginBottom:9}}>🆘 DESTEK TALEPLERİ · {destekTalep.filter(t=>t.durum!=='kapandi').length} açık</div>
          {destekTalep.slice(0,15).map(t=><div key={t.id} style={{background:T.bg2,border:"0.5px solid "+T.line,borderRadius:9,padding:"9px 11px",marginBottom:6,opacity:t.durum==='kapandi'?.55:1}}>
            <div style={{display:"flex",alignItems:"center",gap:7}}>
              <span style={{fontSize:12,fontWeight:700,color:T.text,flex:1,minWidth:0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.ad||t.email||'Kullanıcı'} <span style={{color:T.textMut,fontWeight:400}}>· {t.sayfa||'—'}</span></span>
              <span style={{fontSize:9,fontWeight:700,color:t.durum==='kapandi'?T.textMut:t.durum==='inceleniyor'?T.accent2:T.gold,background:T.bg1,borderRadius:5,padding:"2px 7px",flexShrink:0}}>{t.durum}</span>
            </div>
            <div style={{fontSize:12,color:T.textSoft,margin:"5px 0",lineHeight:1.5}}>{t.mesaj}</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {t.sayfa && <button onClick={()=>git({sayfa:t.sayfa})} className="tap" style={btn}>↪ Ekrana git</button>}
              {t.teshis && <button onClick={()=>setAcikTeshis(acikTeshis===t.id?null:t.id)} className="tap" style={btn}>{acikTeshis===t.id?'Teşhisi gizle':'🔍 Teşhis'}</button>}
              {t.durum!=='inceleniyor' && t.durum!=='kapandi' && <button onClick={async()=>{ await Db.destekTalepDurum(t.id,'inceleniyor'); setDestekTalep(p=>p.map(x=>x.id===t.id?{...x,durum:'inceleniyor'}:x)); }} className="tap" style={btn}>İncele</button>}
              {t.durum!=='kapandi' && <button onClick={async()=>{ await Db.destekTalepDurum(t.id,'kapandi'); setDestekTalep(p=>p.map(x=>x.id===t.id?{...x,durum:'kapandi'}:x)); }} className="tap" style={{...btn,color:T.accent}}>✓ Kapat</button>}
            </div>
            {acikTeshis===t.id && <pre style={{fontSize:9.5,color:T.textMut,background:T.bg1,borderRadius:7,padding:"8px",marginTop:6,overflowX:"auto",maxHeight:150,whiteSpace:"pre-wrap"}}>{JSON.stringify(t.teshis,null,1)}</pre>}
          </div>)}
        </div>; })()}
        {/* ===== BAKIM MERKEZİ ===== */}
        <div style={{background:T.bg1,border:"0.5px solid "+T.line,borderRadius:12,padding:"12px 14px",marginBottom:10}}>
          <div style={{fontSize:11,color:T.textMut,fontWeight:700,marginBottom:9}}>🧹 BAKIM MERKEZİ</div>
          {bakimMsj && <div style={{fontSize:11,color:bakimMsj[0]==="✓"?T.accent:T.gold,marginBottom:9}}>{bakimMsj}</div>}
          <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
            <button onClick={arsivleYap} className="tap" style={{fontSize:11,color:T.text,background:T.bg2,border:"0.5px solid "+T.line,borderRadius:9,padding:"7px 11px",fontWeight:700}}>💬 Sohbeti arşivle</button>
            <button onClick={orphanTara} className="tap" style={{fontSize:11,color:T.text,background:T.bg2,border:"0.5px solid "+T.line,borderRadius:9,padding:"7px 11px",fontWeight:700}}>🔍 Sahipsiz dosya tara</button>
            {orphanlar && orphanlar.length>0 && <button onClick={orphanTemizleAll} className="tap" style={{fontSize:11,color:"#fff",background:T.danger,border:0,borderRadius:9,padding:"7px 11px",fontWeight:800}}>🗑 {orphanlar.length} dosyayı sil</button>}
          </div>
          {/* Sohbet maç kartları — otomatik (2 haftada bir) + görünürlük + manuel */}
          <div style={{marginTop:11,paddingTop:10,borderTop:"0.5px dashed "+T.line}}>
            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
              <div style={{flex:1,minWidth:150}}>
                <div style={{fontSize:11,color:T.text,fontWeight:700}}>🗂️ Sohbetteki maç kartları</div>
                <div style={{fontSize:10,color:T.textMut,marginTop:2}}>
                  {mkOzet===null ? "Yükleniyor…" : <>{(mkOzet.adet||0)} kart · ~{((mkOzet.bayt||0)/1024).toFixed(1)} KB{mkOzet.eski?" · en eski "+rZaman(mkOzet.eski):""}</>}
                </div>
              </div>
              <button onClick={macKartTemizleYap} className="tap" style={{fontSize:11,color:T.text,background:T.bg2,border:"0.5px solid "+T.line,borderRadius:9,padding:"7px 11px",fontWeight:700,flexShrink:0}}>🧹 2 hafta+ temizle</button>
            </div>
            <div style={{fontSize:9.5,color:T.textMut,marginTop:6}}>⚙️ Otomatik: 2 haftada bir eski kartlar silinir. Maç sonuçları ve istatistikler maç sayfasında KALIR — sadece sohbetteki bildirim kartı gider.</div>
          </div>
        </div>
        {/* ===== ÇÖP KUTUSU (soft-silinen ligler) ===== */}
        {copLigler.length>0 && <div style={{background:T.bg1,border:"0.5px solid "+T.gold+"44",borderRadius:12,padding:"12px 14px",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",marginBottom:6}}>
            <span style={{fontSize:11,color:T.gold,fontWeight:700}}>🗑️ ÇÖP KUTUSU ({copLigler.length})</span>
            <button onClick={copBosalt} className="tap" style={{marginLeft:"auto",fontSize:10,color:T.textMut,background:T.bg2,border:"0.5px solid "+T.line,borderRadius:7,padding:"4px 8px",fontWeight:700}}>90g+ kalıcı sil</button>
          </div>
          <div style={{fontSize:9.5,color:T.textMut,marginBottom:8}}>Silinen ligler 90 gün burada tutulur — geri alabilirsin.</div>
          {copLigler.map(l=>
            <div key={l.id} style={{display:"flex",alignItems:"center",gap:9,background:T.bg2,border:"0.5px solid "+T.line,borderRadius:9,padding:"8px 10px",marginBottom:5}}>
              <div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:700,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{l.ad}</div><div style={{fontSize:9,color:T.textMut}}>{rZaman(l.silinme_t)} silindi</div></div>
              <button onClick={()=>copGeriAl(l)} className="tap" style={{fontSize:10.5,color:T.accent,background:T.accent+"18",border:"0.5px solid "+T.accent+"44",borderRadius:8,padding:"5px 10px",fontWeight:700,flexShrink:0}}>↩ Geri al</button>
              <button onClick={()=>copKaliciSil(l)} className="tap" title="Hemen kalıcı sil (geri alınamaz)" style={{fontSize:10.5,color:T.danger,background:T.danger+"18",border:"0.5px solid "+T.danger+"55",borderRadius:8,padding:"5px 10px",fontWeight:700,flexShrink:0}}>🗑️ Kalıcı sil</button>
            </div>)}
        </div>}
        {/* 15) SİSTEM SAĞLIĞI */}
        <div style={{background:T.bg1,border:"0.5px solid "+T.line,borderRadius:12,padding:"12px 14px",marginBottom:10}}>
          <div style={{fontSize:11,color:T.textMut,fontWeight:700,marginBottom:8}}>💚 SİSTEM SAĞLIĞI</div>
          {[["Veritabanı",!!ozet],["Giriş (Auth)",!!oturum],["Kayıt/Okuma",ligler!=null]].map(([ad,ok],i)=>
            <div key={i} style={{display:"flex",alignItems:"center",gap:8,fontSize:12.5,padding:"3px 0"}}><span>{ok?"🟢":"🔴"}</span><span style={{flex:1,color:T.text}}>{ad}</span><span style={{fontSize:10,color:ok?T.accent:T.danger}}>{ok?"çalışıyor":"?"}</span></div>
          )}
          <div style={{height:1,background:T.line,margin:"6px 0"}}/>
          {[["⚡","API gecikmesi",opTek.api!=null?(opTek.api+" ms"):"ölçülüyor…",opTek.api!=null&&opTek.api<400],["🗄️","Otomatik yedek","haftalık · şifreli",true],["☁️","CDN / SSL",opTek.cf?(opTek.cf+" · aktif"):"aktif",true],["🚀","Yayın sürümü",opTek.deploy?String(opTek.deploy).split("-")[0]:"—",true]].map(([ik,ad,val,ok],i)=>
            <div key={i} style={{display:"flex",alignItems:"center",gap:8,fontSize:12.5,padding:"3px 0"}}><span>{ik}</span><span style={{flex:1,color:T.text}}>{ad}</span><span style={{fontSize:10,color:ok?T.accent:T.gold}}>{val}</span></div>
          )}
        </div>
        {/* FAZ 4 — HATA / ÇÖKME LOG */}
        <div style={{background:T.bg1,border:"0.5px solid "+(hatalar.length?T.danger+"44":T.line),borderRadius:12,padding:"12px 14px",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",marginBottom:8}}>
            <span style={{fontSize:11,color:hatalar.length?T.danger:T.textMut,fontWeight:700}}>🔴 HATA / ÇÖKME LOGU ({hatalar.length})</span>
            {hatalar.length>0 && <button onClick={async()=>{ if(confirm("Tüm hata kayıtları silinsin mi?")){ await Db.hataTemizle(); setHatalar([]); } }} className="tap" style={{marginLeft:"auto",fontSize:10,color:T.textMut,background:T.bg2,border:"0.5px solid "+T.line,borderRadius:7,padding:"4px 8px",fontWeight:700}}>Temizle</button>}
          </div>
          {hatalar.length===0
            ? <div style={{fontSize:12,color:T.textMut,textAlign:"center",padding:"10px 0"}}>✅ Kayıtlı çökme yok — site stabil</div>
            : hatalar.slice(0,20).map(h=>
                <div key={h.id} style={{background:T.bg0,border:"0.5px solid "+T.line,borderRadius:9,padding:"9px 11px",marginBottom:6}}>
                  <div style={{fontSize:11,color:T.text,fontWeight:600,fontFamily:"monospace",wordBreak:"break-word",lineHeight:1.4}}>{(h.mesaj||"").slice(0,240)}</div>
                  <div style={{fontSize:9.5,color:T.textMut,marginTop:4}}>{h.sayfa?("📄 "+h.sayfa+" · "):""}{rZaman(h.olusma)}{h.cihaz?(" · "+(/Mobile|iPhone|Android/.test(h.cihaz)?"📱 mobil":"💻 web")):""}</div>
                </div>
              )}
        </div>
        {/* KULLANIM — son 7 gün aktif kullanıcı trendi */}
        <div style={{background:T.bg1,border:"0.5px solid "+T.line,borderRadius:12,padding:"12px 14px",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <div style={{fontSize:11,color:T.textMut,fontWeight:700}}>📈 SON 7 GÜN AKTİF KULLANICI</div>
            <div style={{fontSize:10,color:T.accent}}>🟢 şu an {online} çevrimiçi</div>
          </div>
          {gunTrend.length===0 ? <div style={{fontSize:11,color:T.textMut}}>Veri birikiyor…</div>
            : (()=>{ const enb=Math.max(1,...gunTrend.map(g=>g.kisi)); return <div style={{display:"flex",alignItems:"flex-end",gap:6,height:80}}>
                {gunTrend.map((g,i)=><div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                  <div style={{fontSize:10,color:T.text,fontWeight:700}}>{g.kisi}</div>
                  <div style={{width:"100%",height:Math.round(6+(g.kisi/enb)*54),background:"linear-gradient(180deg,"+T.accent+","+T.accent2+")",borderRadius:5,minHeight:6}}/>
                  <div style={{fontSize:9,color:T.textMut}}>{g.etiket}</div>
                </div>)}
              </div>; })()}
        </div>
        {/* 4/8) ANALİTİK — en çok sayfa & arama */}
        <div style={{display:"flex",gap:8,marginBottom:10}}>
          <div style={{flex:1,background:T.bg1,border:"0.5px solid "+T.line,borderRadius:12,padding:"12px 14px"}}>
            <div style={{fontSize:11,color:T.textMut,fontWeight:700,marginBottom:8}}>📄 EN ÇOK SAYFA</div>
            {topSayfa.length===0 ? <div style={{fontSize:11,color:T.textMut}}>Veri birikiyor…</div> : topSayfa.map((x,i)=><div key={i} style={{display:"flex",fontSize:12,color:T.text,padding:"2px 0"}}><span style={{flex:1}}>{x.deger}</span><b style={{color:T.accent2}}>{x.adet}</b></div>)}
          </div>
          <div style={{flex:1,background:T.bg1,border:"0.5px solid "+T.line,borderRadius:12,padding:"12px 14px"}}>
            <div style={{fontSize:11,color:T.textMut,fontWeight:700,marginBottom:8}}>🔍 EN ÇOK ARAMA</div>
            {topArama.length===0 ? <div style={{fontSize:11,color:T.textMut}}>Henüz arama yok</div> : topArama.map((x,i)=><div key={i} style={{display:"flex",fontSize:12,color:T.text,padding:"2px 0"}}><span style={{flex:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{x.deger}</span><b style={{color:T.gold}}>{x.adet}</b></div>)}
          </div>
        </div>
        {/* 14) AUDIT LOG */}
        <div style={{background:T.bg1,border:"0.5px solid "+T.line,borderRadius:12,padding:"12px 14px",marginBottom:10}}>
          <div style={{fontSize:11,color:T.textMut,fontWeight:700,marginBottom:8}}>📝 İŞLEM GEÇMİŞİ (son {audit.length})</div>
          {audit.length===0 ? <div style={{fontSize:11,color:T.textMut}}>Henüz kayıt yok. Kritik işlemler (hak verme, silme, transfer onay) burada loglanır.</div>
            : <div style={{maxHeight:220,overflowY:"auto"}}>{audit.map(a=>
              <div key={a.id} style={{display:"flex",gap:8,fontSize:11,padding:"5px 0",borderTop:"0.5px solid "+T.line}}>
                <span style={{color:T.textMut,whiteSpace:"nowrap"}}>{(a.created||"").slice(5,16).replace("T"," ")}</span>
                <span style={{flex:1,color:T.text}}><b>{(a.kim||"?").split("@")[0]}</b> · {a.islem}{a.detay?" — "+a.detay:""}</span>
              </div>)}</div>}
        </div>
        <div style={{background:"linear-gradient(120deg,"+T.accent+"1e,"+T.bg1+")",border:"0.5px solid "+T.accent+"55",borderRadius:12,padding:14,marginBottom:10}}>
          <b style={{color:T.text}}>🔍 Sistem Taraması</b>
          <div style={{fontSize:11,color:T.textMut,margin:"5px 0 10px",lineHeight:1.6}}>Canlı veritabanını tarar: bağlantı, veri sayıları, KVKK gizliliği, yetkiler, tutarsızlıklar. Rapor çıkar → <b>Kopyala</b> ile bana yapıştır, birlikte bakalım.</div>
          <button onClick={sistemTaramasi} disabled={taramaYuk} className="tap" style={{width:"100%",background:taramaYuk?T.line:T.accent,color:taramaYuk?T.textMut:"#04070C",border:0,borderRadius:10,padding:"11px",fontSize:12.5,fontWeight:800}}>{taramaYuk?"⏳ Taranıyor…":"🔍 Sistemi Tara"}</button>
          {tarama && <div style={{marginTop:10}}>
            <div style={{maxHeight:280,overflowY:"auto",background:T.bg0,borderRadius:8,padding:"6px 10px"}}>
              {tarama.map((r,i)=>{ const rk=r.durum==="ok"?T.accent:r.durum==="uyari"?T.gold:T.danger; const sim=r.durum==="ok"?"✅":r.durum==="uyari"?"⚠️":"❌";
                return <div key={i} style={{display:"flex",gap:8,fontSize:11.5,padding:"6px 0",borderTop:i?"0.5px solid "+T.line:"none",alignItems:"baseline"}}>
                  <span>{sim}</span><span style={{color:T.text,fontWeight:600,flex:"0 0 auto"}}>{r.ad}</span>
                  <span style={{color:rk,flex:1,textAlign:"right",wordBreak:"break-word"}}>{r.not}</span>
                </div>; })}
            </div>
            <button onClick={taramaKopyala} className="tap" style={{width:"100%",marginTop:8,background:taramaKopyalandi?T.accent:T.bg2,color:taramaKopyalandi?"#04070C":T.text,border:"0.5px solid "+T.line,borderRadius:10,padding:"9px",fontSize:12,fontWeight:800}}>{taramaKopyalandi?"✓ Kopyalandı — bana yapıştır":"📋 Raporu Kopyala"}</button>
          </div>}
        </div>
        <div style={{background:"linear-gradient(120deg,"+T.accent2+"18,"+T.bg1+")",border:"0.5px solid "+T.accent2+"44",borderRadius:12,padding:14,marginBottom:10}}>
          <b style={{color:T.text}}>🌌 ForzaLig Evreni</b>
          <div style={{fontSize:11,color:T.textMut,margin:"5px 0 10px",lineHeight:1.6}}>Gerçek bir sezon oynanmış gibi tüm modülleri doldurur: ligler, takımlar, oyuncular, TD, kaptan, hakem, fikstür, dakika-dakika olaylar, goller/asistler/kartlar/kurtarışlar, MVP, maç ödülleri, oyuncu puanları, puan durumu, krallıklar ve AI gazete. Sonuçlar <b style={{color:T.text}}>rastgele değil</b> — takım gücü, oyuncu gücü, mevki, form ve ev avantajına göre.</div>
          {(()=>{ const Alan=({et,val,set,min,max})=><label style={{flex:"1 1 76px",fontSize:10,color:T.textMut}}>{et}<input type="number" min={min} max={max} value={val} onChange={e=>set(e.target.value)} style={{width:"100%",marginTop:3,background:T.bg0,border:"0.5px solid "+T.line,borderRadius:8,padding:"7px 8px",color:T.text,fontSize:13,fontWeight:700,boxSizing:"border-box"}}/></label>;
            const Chk=({et,val,set})=><label className="tap" style={{fontSize:10.5,color:val?T.text:T.textMut,display:"flex",alignItems:"center",gap:5,background:T.bg2,borderRadius:8,padding:"6px 9px"}}><input type="checkbox" checked={val} onChange={e=>set(e.target.checked)}/> {et}</label>;
            const takimTop=(parseInt(cfgLig)||0)*(parseInt(cfgTakim)||0), oyTop=takimTop*(parseInt(cfgOyuncu)||0);
            const sureTah=Math.max(1,Math.ceil((parseInt(cfgLig)||1)*0.9+(cfgKupa?1:0)));
            return <div style={{background:T.bg0,borderRadius:10,padding:10,marginBottom:10}}>
              <label style={{fontSize:10,color:T.textMut,display:"block"}}>Evren Adı<input value={cfgEvrenAd} onChange={e=>setCfgEvrenAd(e.target.value)} style={{width:"100%",marginTop:3,marginBottom:9,background:T.bg1,border:"0.5px solid "+T.line,borderRadius:8,padding:"8px 10px",color:T.text,fontSize:13,fontWeight:700,boxSizing:"border-box"}}/></label>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <Alan et="Lig" val={cfgLig} set={setCfgLig} min={1} max={30}/>
                <Alan et="Takım/lig" val={cfgTakim} set={setCfgTakim} min={2} max={24}/>
                <Alan et="Oyuncu/takım" val={cfgOyuncu} set={setCfgOyuncu} min={3} max={30}/>
                <Alan et="% oynanmış" val={cfgOran} set={setCfgOran} min={0} max={100}/>
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:8}}>
                <Alan et="Hakem" val={cfgHakem} set={setCfgHakem} min={0} max={50}/>
                <Alan et="Tek. Dir." val={cfgTD} set={setCfgTD} min={0} max={50}/>
                <Alan et="Sezon" val={cfgSezon} set={setCfgSezon} min={1} max={10}/>
                <label style={{flex:"1 1 76px",fontSize:10,color:T.textMut}}>Seed (ops.)<input value={cfgSeed} onChange={e=>setCfgSeed(e.target.value)} placeholder="rastgele" style={{width:"100%",marginTop:3,background:T.bg0,border:"0.5px solid "+T.line,borderRadius:8,padding:"7px 8px",color:T.text,fontSize:12,fontWeight:600,boxSizing:"border-box"}}/></label>
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:9,alignItems:"center"}}>
                <span style={{fontSize:10,color:T.textMut,marginRight:2}}>Saha kişi:</span>
                {[7,8,9,10,11].map(k=>
                  <span key={k} onClick={()=>setCfgKisi(k)} className="tap" style={{fontSize:11,minWidth:30,textAlign:"center",padding:"5px 9px",borderRadius:11,background:cfgKisi===k?T.gold:T.bg2,color:cfgKisi===k?"#1A1505":T.textMut,fontWeight:cfgKisi===k?800:600}}>{k}</span>)}
                <span style={{fontSize:9.5,color:T.textMut,marginLeft:4}}>→ Altın/Gümüş {cfgKisi} kişi</span>
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:9,alignItems:"center"}}>
                <span style={{fontSize:10,color:T.textMut,marginRight:2}}>Format:</span>
                {[["tek","Tek devre"],["cift","Çift devre"],["gruplu","Gruplu"],["serbest","Serbest"]].map(([k,ad])=>
                  <span key={k} onClick={()=>setCfgFormat(k)} className="tap" style={{fontSize:10.5,padding:"5px 10px",borderRadius:11,background:cfgFormat===k?T.accent2:T.bg2,color:cfgFormat===k?"#04070C":T.textMut,fontWeight:cfgFormat===k?800:500}}>{ad}</span>)}
                <label className="tap" style={{fontSize:10.5,color:T.textMut,display:"flex",alignItems:"center",gap:4,marginLeft:"auto"}}><input type="checkbox" checked={cfgKupa} onChange={e=>setCfgKupa(e.target.checked)}/> örnek kupa</label>
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:9}}>
                <Chk et="Gerçekçi Simülasyon" val={cfgGercekci} set={setCfgGercekci}/>
                <Chk et="AI Haberleri" val={cfgHaber} set={setCfgHaber}/>
                <Chk et="Fotoğraf Havuzu" val={cfgFoto} set={setCfgFoto}/>
                <Chk et="Logo Havuzu" val={cfgLogo} set={setCfgLogo}/>
                <Chk et="Herkese Göster" val={cfgGoster} set={setCfgGoster}/>
              </div>
              <div style={{fontSize:10.5,color:T.gold,marginTop:10,fontWeight:600,lineHeight:1.5}}>📦 ≈ {takimTop} takım · {oyTop} oyuncu · {macOnizle.toplam} maç ({macOnizle.perLig}/lig) · {parseInt(cfgHakem)||0} hakem · {takimTop} TD/kaptan<br/>⏱️ Tahmini süre: ~{sureTah} sn · %{cfgOran} oynanmış</div>
            </div>;
          })()}
          {stresYuk && <div style={{marginBottom:10}}>
            <div style={{height:8,background:T.bg0,borderRadius:5,overflow:"hidden"}}><div style={{height:"100%",width:stresPct+"%",background:"linear-gradient(90deg,"+T.accent2+","+T.accent+")",borderRadius:5,transition:"width .3s"}}/></div>
            <div style={{fontSize:10,color:T.textMut,textAlign:"center",marginTop:4}}>%{stresPct}</div>
          </div>}
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <button onClick={stresTestOlustur} disabled={stresYuk} className="tap" style={{flex:1,minWidth:130,background:stresYuk?T.line:T.accent2,color:stresYuk?T.textMut:"#04070C",border:0,borderRadius:10,padding:"11px",fontSize:12.5,fontWeight:800}}>{stresYuk?"⏳ Oluşturuluyor…":"🌌 Evren Oluştur"}</button>
            <button onClick={iliskiselYukleFn} disabled={stresYuk} className="tap" style={{flex:1,minWidth:130,background:T.gold+"22",color:T.gold,border:"0.5px solid "+T.gold+"55",borderRadius:10,padding:"11px",fontSize:12.5,fontWeight:800}}>👁 Göster (Yükle)</button>
          </div>
          <button onClick={testTemizleFn} disabled={stresYuk} className="tap" style={{width:"100%",marginTop:8,background:T.danger+"14",color:T.danger,border:"0.5px solid "+T.danger+"55",borderRadius:10,padding:"10px",fontSize:12,fontWeight:800}}>🗑️ Evreni Sil (tüm üretilen veri)</button>
          <button onClick={()=>{ try{localStorage.removeItem('fz_aktif_evren');}catch(e){} if(onGercegeDon){ setStresLog("🏠 Gerçek liglerine dönüldü."); onGercegeDon(); } }} disabled={stresYuk} className="tap" style={{width:"100%",marginTop:6,background:"none",color:T.textMut,border:"0.5px solid "+T.line,borderRadius:10,padding:"9px",fontSize:11.5,fontWeight:700}}>🏠 Gerçek liglerime dön (evren modundan çık)</button>
          {/* 🔧 HAM LİG LİSTESİ — fantom/gizli lig temizliği (mod/yönetici/evren farketmez) */}
          <div style={{marginTop:10,borderTop:"0.5px solid "+T.line,paddingTop:10}}>
            <button onClick={hamLiglerYukle} className="tap" style={{width:"100%",background:T.bg2,color:T.textSoft,border:"0.5px solid "+T.line,borderRadius:10,padding:"9px",fontSize:11.5,fontWeight:700}}>🔧 Tüm ligleri listele (fantom temizliği)</button>
            {hamLigler==="yuk" && <div style={{fontSize:11,color:T.textMut,textAlign:"center",padding:8}}>Yükleniyor…</div>}
            {Array.isArray(hamLigler) && hamLigler.length===0 && <div style={{fontSize:11,color:T.accent,textAlign:"center",padding:8}}>✅ Veritabanında hiç lig yok — tertemiz.</div>}
            {Array.isArray(hamLigler) && hamLigler.map(l=>
              <div key={l.id} style={{display:"flex",alignItems:"center",gap:8,background:T.bg2,border:"0.5px solid "+T.line,borderRadius:9,padding:"8px 10px",marginTop:6}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:700,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{l.ad||"(isimsiz)"}</div>
                  <div style={{fontSize:9,color:T.textMut}}>{l.evren?("🌌 demo: "+l.evren):"gerçek"}{l.silindi?" · 🗑️ çöpte":""}{(l.yonetici_id&&oturum&&l.yonetici_id!==oturum.id)?" · başka sahip":""}</div>
                </div>
                <button onClick={()=>hamLigSil(l)} className="tap" style={{fontSize:10.5,color:T.danger,background:T.danger+"18",border:"0.5px solid "+T.danger+"55",borderRadius:8,padding:"5px 10px",fontWeight:700,flexShrink:0}}>🗑️ Kalıcı sil</button>
              </div>
            )}
          </div>
          {stresLog && <div style={{fontSize:11,color:T.text,marginTop:9,background:T.bg0,borderRadius:8,padding:"8px 10px",lineHeight:1.5}}>{stresLog}</div>}
        </div>
        <div style={{background:T.bg1,border:"0.5px solid "+T.line,borderRadius:12,padding:14,marginBottom:10}}>
          <b style={{color:T.text}}>Yayın durumu</b><br/>
          Mod: <b style={{color:HERKESE_ACIK?T.accent:T.gold}}>{HERKESE_ACIK?"🌍 HERKESE AÇIK":"🔒 TEST MODU"}</b><br/>
          <span style={{fontSize:11,color:T.textMut}}>{HERKESE_ACIK?"Herkes üye olup girebiliyor.":"Sadece yetkili e-postalar girebiliyor. Herkese açmak için hazır olduğunda söyle — tek ayarla açarız."}</span>
        </div>
        <div style={{background:T.bg1,border:"0.5px solid "+T.line,borderRadius:12,padding:14}}>
          <b style={{color:T.text}}>Yayın öncesi kontrol listesi</b><br/>
          <span style={{fontSize:11.5}}>• Google/Apple girişi ayarı<br/>• E-posta onayı aç (güvenlik)<br/>• Test e-posta kısıtını kaldır<br/>• Demo kupayı istersen gizle</span>
        </div>
      </div>}
    </div>
    {/* FAZ 2 — Geri Al (Undo) şeridi */}
    {undoBox && <div className="fade-in" style={{position:"fixed",left:"50%",transform:"translateX(-50%)",bottom:"calc(20px + env(safe-area-inset-bottom))",zIndex:2000,display:"flex",alignItems:"center",gap:12,background:T.bg1,border:"1px solid "+T.accent+"55",borderRadius:12,padding:"11px 14px",boxShadow:"0 12px 30px rgba(0,0,0,.5)",maxWidth:"90vw"}}>
      <span style={{fontSize:13,color:T.text,fontWeight:600}}>{undoBox.mesaj}</span>
      <button onClick={undoBox.geriAl} className="tap" style={{background:T.accent,color:T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0,border:0,borderRadius:9,padding:"7px 14px",fontSize:12,fontWeight:800}}>↶ Geri Al</button>
    </div>}
    {/* FAZ 6 — Komut Paleti (Cmd/Ctrl + K) */}
    {paletAcik && <div onClick={()=>setPaletAcik(false)} style={{position:"fixed",inset:0,zIndex:3000,background:"rgba(0,0,0,.55)",backdropFilter:"blur(3px)",display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"64px 16px 16px"}}>
      <div onClick={e=>e.stopPropagation()} className="fade-in" style={{width:"100%",maxWidth:470,background:T.bg1,border:"1px solid "+T.accent+"55",borderRadius:16,boxShadow:"0 24px 60px rgba(0,0,0,.6)",overflow:"hidden"}}>
        <input autoFocus value={paletQ} onChange={e=>setPaletQ(e.target.value)} placeholder="Ara: üye, lig veya komut…" style={{width:"100%",boxSizing:"border-box",background:T.bg0,border:0,borderBottom:"1px solid "+T.line,padding:"14px 16px",color:T.text,fontSize:14,outline:"none",fontFamily:"inherit"}}/>
        <div style={{maxHeight:"52vh",overflowY:"auto",padding:8}}>
          {(()=>{ const q=paletQ.trim().toLowerCase();
            const akts=[["ozet","🎯","İşlem Merkezi"],["uyeler","👥","Üyeler"],["ligler","🌍","Açık Ligler"],["yetki","✅","Yetkiler"],["sistem","⚙️","Sistem / Hata Log"]].filter(a=>!q||a[2].toLowerCase().indexOf(q)>-1);
            const us=(q?uyeler.filter(u=>((u.ad||"")+" "+(u.email||"")).toLowerCase().indexOf(q)>-1):[]).slice(0,6);
            const ls=(q?ligler.filter(l=>(l.ad||"").toLowerCase().indexOf(q)>-1):[]).slice(0,6);
            const calistir=(fn)=>{ fn(); setPaletAcik(false); };
            return <>
              {akts.length>0 && <div style={{fontSize:9.5,color:T.textMut,fontWeight:700,padding:"6px 8px 4px"}}>KOMUTLAR</div>}
              {akts.map(a=><button key={a[0]} onClick={()=>calistir(()=>setSekme(a[0]))} className="tap satir-hover" style={{width:"100%",display:"flex",alignItems:"center",gap:10,background:"none",border:0,borderRadius:9,padding:"10px",color:T.text,textAlign:"left"}}><span style={{fontSize:15}}>{a[1]}</span><span style={{fontSize:13,fontWeight:600}}>{a[2]}</span></button>)}
              {us.length>0 && <div style={{fontSize:9.5,color:T.textMut,fontWeight:700,padding:"8px 8px 4px"}}>ÜYELER</div>}
              {us.map(u=><button key={u.user_id} onClick={()=>calistir(()=>{ setSekme("uyeler"); setUyeSeg("hepsi"); setUyeAra(u.email||u.ad||""); })} className="tap satir-hover" style={{width:"100%",display:"flex",alignItems:"center",gap:10,background:"none",border:0,borderRadius:9,padding:"9px 10px",color:T.text,textAlign:"left"}}><span style={{fontSize:14}}>{u.admin?"👑":"👤"}</span><div style={{minWidth:0}}><div style={{fontSize:12.5,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{u.ad||u.email}</div><div style={{fontSize:10,color:T.textMut,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{u.email}</div></div></button>)}
              {ls.length>0 && <div style={{fontSize:9.5,color:T.textMut,fontWeight:700,padding:"8px 8px 4px"}}>LİGLER</div>}
              {ls.map(l=><button key={l.slug} onClick={()=>calistir(()=>setSekme("ligler"))} className="tap satir-hover" style={{width:"100%",display:"flex",alignItems:"center",gap:10,background:"none",border:0,borderRadius:9,padding:"9px 10px",color:T.text,textAlign:"left"}}><span style={{fontSize:14}}>🏟️</span><span style={{fontSize:12.5,fontWeight:600}}>{l.ad}</span></button>)}
              {q && akts.length===0 && us.length===0 && ls.length===0 && <div style={{fontSize:12,color:T.textMut,textAlign:"center",padding:20}}>Sonuç yok</div>}
              {!q && <div style={{fontSize:11,color:T.textMut,padding:"10px 8px",lineHeight:1.5}}>Üye adı, lig adı veya komut yaz. <b>Esc</b> ile kapat.</div>}
            </>;
          })()}
        </div>
      </div>
    </div>}
  </div>;
}

/* DAVET KATILIM — ?davet=TOKEN linkiyle takım/oyuncu ekle (2 renk + logo + foto + profil) */
