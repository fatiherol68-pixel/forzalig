const Motor = {
  tumOyuncular(turnuvalar){
    const arr=[];
    turnuvalar.forEach(t=> t.takimlar.forEach(tk=> tk.oyuncular.forEach(o=> arr.push({...o, takimAd:tk.ad, turnuva:t.ad, turnuvaId:t.id}))));
    return arr;
  },
  golKrallari(turnuvalar, n=10){
    return this.tumOyuncular(turnuvalar).filter(o=>o.gol>0).sort((a,b)=>b.gol-a.gol).slice(0,n);
  },
  asistKrallari(turnuvalar, n=10){
    return this.tumOyuncular(turnuvalar).filter(o=>o.asist>0).sort((a,b)=>b.asist-a.asist).slice(0,n);
  },
  kurtarisKrallari(turnuvalar, n=10){
    return this.tumOyuncular(turnuvalar).filter(o=>o.kurtaris>0).sort((a,b)=>b.kurtaris-a.kurtaris).slice(0,n);
  },
  enler(turnuvalar){
    const golK=this.golKrallari(turnuvalar,1)[0];
    const asistK=this.asistKrallari(turnuvalar,1)[0];
    const kurtarisK=this.kurtarisKrallari(turnuvalar,1)[0];
    let sampiyon=null;
    turnuvalar.forEach(t=>{ const lider=t.takimlar[0]; if(!sampiyon||lider.puan>sampiyon.puan) sampiyon={...lider, turnuva:t.ad}; });
    return {golK, asistK, kurtarisK, sampiyon};
  },
  // === KAPSAMLI ENLER (tüm liglerden) ===
  enlerVitrin(turnuvalar){
    const O=this.tumOyuncular(turnuvalar);
    const enUst=(filtre,key,terstir)=>{ const f=O.filter(filtre); if(!f.length)return null; return [...f].sort((a,b)=> terstir?(key(a)-key(b)):(key(b)-key(a)))[0]; };
    // mvp sayısı: ödüllerden hesapla — oyuncuda mvp alanı yoksa oduller.altin gibi say
    const mvpEn=enUst(o=>(o.mvp||0)>0, o=>o.mvp||0);
    // en golcü takım
    let golcuTakim=null, azYiyenTakim=null;
    turnuvalar.forEach(t=>t.takimlar.forEach(tk=>{
      if(!golcuTakim||(tk.ag||0)>(golcuTakim.ag||0)) golcuTakim={...tk,turnuva:t.ad,_t:t};
      if((tk.o||0)>0 && (!azYiyenTakim||(tk.yg||0)<(azYiyenTakim.yg||0))) azYiyenTakim={...tk,turnuva:t.ad,_t:t};
    }));
    // en formda: yeterli maç oynamış + yüksek OVR
    const formEn=enUst(o=>(o.mac||0)>=2, o=> o.ovr||0);
    return {
      gol: this.golKrallari(turnuvalar,1)[0],
      asist: this.asistKrallari(turnuvalar,1)[0],
      kaleci: this.kurtarisKrallari(turnuvalar,1)[0],
      mvp: mvpEn,
      golcuTakim, formEn
    };
  },
  // maç-olay bazlı oyuncu metrikleri (hat-trick, çift gol, zaman, tek adam, dev avcısı)
  olayMetrik(turnuvalar){
    const m={}; // ad -> {hat,cift,erken,son,ilkYari,ikinciYari,devGol,takimGol{}, toplamGol}
    const al=(ad)=>{ if(!m[ad]) m[ad]={ad,hat:0,cift:0,erken:0,son:0,ilkYari:0,ikinciYari:0,devGol:0,golMaclar:new Set(),toplamGol:0}; return m[ad]; };
    turnuvalar.forEach(t=>{
      // lider takım (dev avcısı için)
      const liderTakim = t.takimlar[0] ? t.takimlar[0].ad : null;
      t.maclar.forEach(mac=>{
        if(!mac.oynandi) return;
        const sure = mac.sure || 60;
        const yari = sure/2, erkenSinir = sure*0.25, sonSinir = sure*0.8;
        // her maçta oyuncu başı gol say
        const macGol={};
        (mac.olaylar||[]).filter(o=>o.tip==="gol").forEach(o=>{
          const e=al(o.oyuncu);
          macGol[o.oyuncu]=(macGol[o.oyuncu]||0)+1;
          e.toplamGol++; e.golMaclar.add(mac.id);
          if(o.dk){ if(o.dk<=erkenSinir)e.erken++; if(o.dk>=sonSinir)e.son++; if(o.dk<yari)e.ilkYari++; else e.ikinciYari++; }
          // dev avcısı: rakip lider takımsa
          const rakip = o.takim===mac.takimA?mac.takimB:mac.takimA;
          if(liderTakim && rakip===liderTakim && o.takim!==liderTakim) e.devGol++;
        });
        Object.entries(macGol).forEach(([ad,g])=>{ const e=al(ad); if(g>=3)e.hat++; if(g===2)e.cift++; });
      });
    });
    return m;
  },
  // tek bir "en" listesi (ilk n) — kategori anahtarına göre
  enListe(turnuvalar, kategori, n=10){
    const O=this.tumOyuncular(turnuvalar);
    const dk=(o)=> o.dk>0?o.dk:(o.mac||0)*60;
    const k90=(o)=>{ const d=dk(o); return d>0?((o.gol||0)+(o.asist||0))/d*90:0; };
    const sortla=(filtre,key)=> O.filter(filtre).sort((a,b)=>key(b)-key(a)).slice(0,n);
    const az=(filtre,key)=> O.filter(filtre).sort((a,b)=>key(a)-key(b)).slice(0,n);
    // olay bazlı kategoriler için metrik haritası
    const olayKat=["hattrick","ciftGol","erken","son","ilkYari","ikinciYari","devAvcisi","tekAdam","cokYonlu","supermen","kasap","beygir","bencil","ozverili","dengeli","soguk","yukselen","uykucu","yildiz","sanssiz","surpriz"];
    if(olayKat.includes(kategori)){
      const met=this.olayMetrik(turnuvalar);
      const ekle=(o)=>({...o, _m: met[o.ad]||{}});
      const arr=O.map(ekle);
      const srt=(filtre,key)=>arr.filter(filtre).sort((a,b)=>key(b)-key(a)).slice(0,n);
      // takım gol toplamı (tek adam için)
      const takimGolHarita={};
      turnuvalar.forEach(t=>t.takimlar.forEach(tk=>{ takimGolHarita[tk.ad]=tk.ag||0; }));
      switch(kategori){
        case "hattrick": return srt(o=>(o._m.hat||0)>0, o=>o._m.hat);
        case "ciftGol": return srt(o=>(o._m.cift||0)>0, o=>o._m.cift);
        case "erken": return srt(o=>(o._m.erken||0)>0, o=>o._m.erken);
        case "son": return srt(o=>(o._m.son||0)>0, o=>o._m.son);
        case "ilkYari": return srt(o=>(o._m.ilkYari||0)>0, o=>o._m.ilkYari);
        case "ikinciYari": return srt(o=>(o._m.ikinciYari||0)>0, o=>o._m.ikinciYari);
        case "devAvcisi": return srt(o=>(o._m.devGol||0)>0, o=>o._m.devGol);
        case "tekAdam": return srt(o=>(o.gol||0)>=3 && takimGolHarita[o.takimAd]>0, o=>o.gol/(takimGolHarita[o.takimAd]||1));
        case "cokYonlu": return srt(o=>(o.gol||0)>0&&(o.asist||0)>0&&(o.kurtaris||0)>0, o=>(o.gol||0)+(o.asist||0)+(o.kurtaris||0));
        case "supermen": return srt(o=>(o.gol||0)+(o.asist||0)>0, o=>(o.gol||0)+(o.asist||0)+(o.ovr||0)/10);
        case "kasap": return srt(o=>(o.sari||0)+(o.kirmizi||0)>0, o=>(o.sari||0)+(o.kirmizi||0)*2);
        case "beygir": return srt(o=>(o.mac||0)>0, o=>(o.mac||0)+dk(o)/60);
        case "bencil": return srt(o=>(o.gol||0)>=3&&(o.asist||0)===0, o=>o.gol);
        case "ozverili": return srt(o=>(o.asist||0)>=2&&(o.gol||0)===0, o=>o.asist);
        case "dengeli": return srt(o=>(o.gol||0)>0&&o.gol===o.asist, o=>o.gol);
        case "soguk": return srt(o=>(o.ovr||0)>=80&&(o.mac||0)>=2, o=>o.ovr-(o.sari||0)*5-(o.kirmizi||0)*10);
        case "yukselen": return srt(o=>(o.ovr||0)<78&&(o.gol||0)>=2, o=>o.gol-(o.ovr||0)/20);
        case "uykucu": return srt(o=>(o.ovr||0)>=82&&(o.mac||0)>=2, o=>o.ovr-(o.gol||0)*8);
        case "yildiz": return srt(o=>(o.mvp||0)>0||(o.gol||0)>0, o=>(o.mvp||0)*5+(o.gol||0)+(o.oduller?Object.values(o.oduller).filter(Boolean).length:0)*2);
        case "sanssiz": return srt(o=>(o.mac||0)>=3&&(o.mvp||0)===0, o=>o.mac);
        case "surpriz": return srt(o=>(o._m.golMaclar&&o._m.golMaclar.size>0), o=>o._m.golMaclar?o._m.golMaclar.size:0);
        default: return [];
      }
    }
    switch(kategori){
      case "gol": return sortla(o=>o.gol>0, o=>o.gol);
      case "asist": return sortla(o=>o.asist>0, o=>o.asist);
      case "katki": return sortla(o=>(o.gol||0)+(o.asist||0)>0, o=>(o.gol||0)+(o.asist||0));
      case "macBasiGol": return sortla(o=>(o.mac||0)>=2&&o.gol>0, o=>o.gol/(o.mac||1));
      case "kurtaris": return sortla(o=>o.kurtaris>0, o=>o.kurtaris);
      case "macBasiKurtaris": return sortla(o=>(o.mac||0)>=2&&o.kurtaris>0, o=>o.kurtaris/(o.mac||1));
      case "rating": return sortla(o=>(o.ovr||0)>0&&o.poz==="Kaleci", o=>o.ovr);
      case "forvet": return sortla(o=>o.poz==="Forvet", o=>(o.ovr||0)+(o.gol||0));
      case "ortasaha": return sortla(o=>o.poz==="OrtaSaha", o=>(o.ovr||0)+(o.asist||0));
      case "defans": return sortla(o=>o.poz==="Defans", o=>o.ovr||0);
      case "mac": return sortla(o=>(o.mac||0)>0, o=>o.mac);
      case "dakika": return sortla(o=>dk(o)>0, o=>dk(o));
      case "mvp": return sortla(o=>(o.mvp||0)>0, o=>o.mvp);
      case "odul": return sortla(o=>o.oduller&&Object.values(o.oduller).filter(Boolean).length>0, o=>Object.values(o.oduller||{}).filter(Boolean).length);
      case "centilmen": return az(o=>(o.mac||0)>=2, o=>(o.sari||0)*1+(o.kirmizi||0)*3);
      case "sari": return sortla(o=>(o.sari||0)>0, o=>o.sari);
      case "kirmizi": return sortla(o=>(o.kirmizi||0)>0, o=>o.kirmizi);
      case "gizliCevher": return sortla(o=>(o.mac||0)>=1&&(o.mac||0)<=3&&k90(o)>0, o=>k90(o));
      default: return [];
    }
  },
  enlerTakimListe(turnuvalar, kategori, n=10){
    const T=[]; turnuvalar.forEach(t=>t.takimlar.forEach(tk=>T.push({...tk,turnuva:t.ad})));
    const sortla=(filtre,key)=>T.filter(filtre).sort((a,b)=>key(b)-key(a)).slice(0,n);
    const az=(filtre,key)=>T.filter(filtre).sort((a,b)=>key(a)-key(b)).slice(0,n);
    // takım kartları: oyunculardan sarı/kırmızı topla
    const takimKart=(tk)=>{ let k=0; (tk.oyuncular||[]).forEach(o=>k+=(o.sari||0)+(o.kirmizi||0)*2); return k; };
    switch(kategori){
      case "golcuTakim": return sortla(t=>(t.ag||0)>0, t=>t.ag);
      case "azYiyen": return az(t=>(t.o||0)>0, t=>t.yg||0);
      case "averaj": return sortla(t=>(t.o||0)>0, t=>(t.ag||0)-(t.yg||0));
      case "centilmenTakim": return az(t=>(t.o||0)>0, t=>takimKart(t)).map(t=>({...t,_kart:takimKart(t)}));
      default: return [];
    }
  },
  enlerLigListe(turnuvalar, kategori, n=10){
    const L=turnuvalar.map(t=>{
      const macSay=t.maclar.filter(m=>m.oynandi).length;
      const golSay=t.maclar.filter(m=>m.oynandi).reduce((s,m)=>s+(m.skorA||0)+(m.skorB||0),0);
      const ortGol = macSay>0?golSay/macSay:0;
      // çekişme: ilk 2 takım puan farkı
      const puanlar=[...t.takimlar].map(tk=>tk.puan||0).sort((a,b)=>b-a);
      const fark = puanlar.length>=2 ? puanlar[0]-puanlar[1] : 99;
      return {ad:t.ad, _ortGol:ortGol, _fark:fark, _takim:t.takimlar.length, _mac:macSay};
    });
    const sortla=(key)=>[...L].sort((a,b)=>key(b)-key(a)).slice(0,n);
    const az=(key)=>[...L].filter(l=>l._mac>0).sort((a,b)=>key(a)-key(b)).slice(0,n);
    switch(kategori){
      case "golcuLig": return sortla(l=>l._ortGol);
      case "cekismeli": return az(l=>l._fark);
      case "cokTakim": return sortla(l=>l._takim);
      case "cokMac": return sortla(l=>l._mac);
      default: return [];
    }
  },
  turnuvaGolKrallari(turnuva, n=5){
    const arr=[];
    turnuva.takimlar.forEach(tk=> tk.oyuncular.forEach(o=> arr.push({...o, takimAd:tk.ad, takimRenk:tk.renk})));
    return arr.filter(o=>o.gol>0).sort((a,b)=>b.gol-a.gol).slice(0,n);
  },
  turnuvaAsist(turnuva,n=5){
    const arr=[];
    turnuva.takimlar.forEach(tk=> tk.oyuncular.forEach(o=> arr.push({...o, takimAd:tk.ad, takimRenk:tk.renk})));
    return arr.filter(o=>o.asist>0).sort((a,b)=>b.asist-a.asist).slice(0,n);
  },
  turnuvaKurtaris(turnuva,n=5){
    const arr=[];
    turnuva.takimlar.forEach(tk=> tk.oyuncular.forEach(o=> arr.push({...o, takimAd:tk.ad, takimRenk:tk.renk})));
    return arr.filter(o=>o.kurtaris>0).sort((a,b)=>b.kurtaris-a.kurtaris).slice(0,n);
  },
  // Genel ödül kralı: herhangi bir ödül alanına göre lider listesi (tek kaynak)
  turnuvaOdulKrali(turnuva, alan, n=5){
    const arr=[];
    turnuva.takimlar.forEach(tk=> tk.oyuncular.forEach(o=> arr.push({...o, takimAd:tk.ad, takimRenk:tk.renk})));
    return arr.filter(o=>(o[alan]||0)>0).sort((a,b)=>b[alan]-a[alan]).slice(0,n);
  },
  // İdeal 11: ovr'ye göre (altin=en iyi 11, gumus=sonraki 11) pozisyon dengeli
  ideal11(turnuva, tip="altin"){
    const arr=[];
    turnuva.takimlar.forEach(tk=> tk.oyuncular.forEach(o=> arr.push({...o, takimAd:tk.ad, takimRenk:tk.renk})));
    const poz=(p)=>arr.filter(o=>o.poz===p).sort((a,b)=>b.ovr-a.ovr);
    const k=poz("Kaleci"), d=poz("Defans"), o=poz("OrtaSaha"), f=poz("Forvet");
    const off = tip==="gumus"?1:0; // gümüş = bir alttaki
    const sec=(liste,adet,bas)=>liste.slice(bas, bas+adet);
    if(tip==="gumus"){
      return [...sec(k,1,1),...sec(d,3,3),...sec(o,3,3),...sec(f,1,1)].filter(Boolean);
    }
    return [...sec(k,1,0),...sec(d,3,0),...sec(o,3,0),...sec(f,1,0)].filter(Boolean);
  },

  // ============ KADRO — performans reytingi (otomatik taban + manuel ödül bonusu) ============
  // Diziliş formata (kişi sayısı 5–11) göre otomatik. Toplam slot = kişi sayısı.
  kadroDizilim(kisi){
    kisi=Math.max(5,Math.min(11,parseInt(kisi)||8));
    var t={5:[["Kaleci",1],["Defans",2],["OrtaSaha",1],["Forvet",1]],
      6:[["Kaleci",1],["Defans",2],["OrtaSaha",2],["Forvet",1]],
      7:[["Kaleci",1],["Defans",3],["OrtaSaha",2],["Forvet",1]],
      8:[["Kaleci",1],["Defans",3],["OrtaSaha",3],["Forvet",1]],
      9:[["Kaleci",1],["Defans",3],["OrtaSaha",3],["Forvet",2]],
      10:[["Kaleci",1],["Defans",4],["OrtaSaha",3],["Forvet",2]],
      11:[["Kaleci",1],["Defans",4],["OrtaSaha",3],["Forvet",3]]};
    return t[kisi];
  },
  // Zaman pencereleri: haftalar + aylar (tarih varsa takvim ayı, yoksa 4-haftalık blok)
  kadroPencereler(turnuva){
    var oyn=(turnuva.maclar||[]).filter(m=>m.oynandi && m.skorA!=null);
    var haftalar=[...new Set(oyn.map(m=>m.hafta).filter(h=>h!=null))].sort((a,b)=>a-b);
    var AY=["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
    var tarihli=oyn.filter(m=>m.tarih&&(""+m.tarih).length>=7);
    var aylar;
    if(tarihli.length>=Math.max(1,oyn.length*0.5)){
      var mp={};
      oyn.forEach(m=>{ var d=m.tarih?(""+m.tarih).slice(0,7):null; if(d){ (mp[d]=mp[d]||[]).push(m); } });
      aylar=Object.keys(mp).sort().map(function(k){ var pr=k.split("-"); return {key:k,label:(AY[(parseInt(pr[1])||1)-1]||"")+" "+pr[0],maclar:mp[k]}; });
    } else {
      var bl={};
      oyn.forEach(m=>{ var b=Math.ceil((m.hafta||1)/4); (bl[b]=bl[b]||[]).push(m); });
      aylar=Object.keys(bl).sort((a,b)=>a-b).map(function(b){ return {key:"b"+b,label:b+". Ay",alt:((b-1)*4+1)+"–"+(b*4)+". hafta",maclar:bl[b]}; });
    }
    return {haftalar:haftalar,aylar:aylar,tum:oyn};
  },
  // Verilen maç kümesinde her oyuncunun performans puanını + kırılımını hesapla → {oyuncuId: rec}
  kadroPuan(turnuva, maclar){
    var W={golF:5,golO:6,golD:8,golK:12,asist:4,temiz:6,kurtaris:1,galip:2,berabere:1,sari:-2,kirmizi:-5};
    var B={mvp:6,altin:6,gumus:3,forvet:3,ortasaha:3,defans:3,kaleci:3,macinGolu:2,centilmen:2,enerjik:2};
    var BAD={mvp:"MVP",altin:"Altın Oyuncu",gumus:"Gümüş Oyuncu",forvet:"En İyi Forvet",ortasaha:"En İyi Orta Saha",defans:"En İyi Defans",kaleci:"En İyi Kaleci",macinGolu:"Maçın Golü",centilmen:"Centilmen",enerjik:"Enerjik"};
    var byId={}, byAd={}, idx={};
    (turnuva.takimlar||[]).forEach(function(tk){ tk.oyuncular.forEach(function(o){
      var rec={oy:o,poz:o.poz,tkId:tk.id,takimAd:tk.ad,takimRenk:tk.renk,puan:0,k:{},mac:0,gol:0,asist:0,kurtaris:0,temiz:0};
      idx[o.id]=rec; byId[String(o.player_id||o.id)]=rec; byId[String(o.id)]=rec; if(!byAd[o.ad])byAd[o.ad]=rec;
    }); });
    var coz=function(id,ad){ return (id!=null&&byId[String(id)]) || (ad?byAd[ad]:null); };
    function add(rec,et,p){ if(!rec)return; rec.puan+=p; rec.k[et]=(rec.k[et]||0)+p; }
    (maclar||[]).forEach(function(mc){
      if(!mc.oynandi||mc.skorA==null) return;
      var A=turnuva.takimlar.find(t=>t.id===mc.takimAId)||turnuva.takimlar.find(t=>t.ad===mc.takimA);
      var Bt=turnuva.takimlar.find(t=>t.id===mc.takimBId)||turnuva.takimlar.find(t=>t.ad===mc.takimB);
      var sA=mc.skorA, sB=mc.skorB;
      // Bireysel objektif: gol / asist / kart
      (mc.olaylar||[]).forEach(function(ol){
        if(ol.tip==="gol"){ var o=coz(ol.oyuncuId,ol.oyuncu); if(o){ var wp=o.poz==="Forvet"?W.golF:o.poz==="OrtaSaha"?W.golO:o.poz==="Defans"?W.golD:o.poz==="Kaleci"?W.golK:W.golF; add(o,"Gol",wp); o.gol++; }
          if(ol.asist||ol.asistId){ var a=coz(ol.asistId,ol.asist); if(a){ add(a,"Asist",W.asist); a.asist++; } } }
        else if(ol.tip==="sari"){ var s=coz(ol.oyuncuId,ol.oyuncu); if(s) add(s,"Sarı kart",W.sari); }
        else if(ol.tip==="kirmizi"){ var kr=coz(ol.oyuncuId,ol.oyuncu); if(kr) add(kr,"Kırmızı kart",W.kirmizi); }
      });
      // Kurtarış
      (mc.kaleciler||[]).forEach(function(kl){ var n=parseInt(kl.kurtaris)||0; if(n){ var k=coz(kl.id,kl.ad); if(k){ add(k,"Kurtarış",n*W.kurtaris); k.kurtaris+=n; } } });
      // Manuel ödül bonusları (maç yöneticisinin seçtiği)
      var od=mc.oduller||{}, odId=mc.odullerId||{};
      Object.keys(B).forEach(function(kk){ var nm=(kk==="mvp")?mc.mvp:od[kk]; var nid=(kk==="mvp")?mc.mvpId:odId[kk]; if(nm||nid){ var r=coz(nid,nm); if(r) add(r,BAD[kk],B[kk]); } });
      // Katılım (galibiyet + gol yememe) — sahada oynadığı belli olanlara
      var part={};
      function P(rec){ if(rec) part[rec.oy.id]=rec; }
      if(mc.kadroA&&Array.isArray(mc.kadroA.yerlesim)) mc.kadroA.yerlesim.forEach(function(id){ if(id!=null)P(byId[String(id)]); });
      if(mc.kadroB&&Array.isArray(mc.kadroB.yerlesim)) mc.kadroB.yerlesim.forEach(function(id){ if(id!=null)P(byId[String(id)]); });
      (mc.olaylar||[]).forEach(function(ol){ P(coz(ol.oyuncuId,ol.oyuncu)); if(ol.asist||ol.asistId)P(coz(ol.asistId,ol.asist)); if(ol.tip==="degisik"){ P(coz(ol.girenId,ol.giren)); P(coz(ol.cikanId,ol.cikan)); } });
      (mc.kaleciler||[]).forEach(function(kl){ P(coz(kl.id,kl.ad)); });
      Object.keys(B).forEach(function(kk){ var nm=(kk==="mvp")?mc.mvp:od[kk]; var nid=(kk==="mvp")?mc.mvpId:odId[kk]; if(nm||nid) P(coz(nid,nm)); });
      Object.keys(part).forEach(function(id){
        var rec=part[id]; rec.mac++;
        var biz,rak;
        if(A&&rec.tkId===A.id){ biz=sA; rak=sB; } else if(Bt&&rec.tkId===Bt.id){ biz=sB; rak=sA; } else return;
        if(biz>rak) add(rec,"Galibiyet",W.galip); else if(biz===rak) add(rec,"Beraberlik",W.berabere);
        if(rak===0 && (rec.poz==="Kaleci"||rec.poz==="Defans")){ add(rec,"Gol yememe",W.temiz); rec.temiz++; }
      });
    });
    return idx;
  },
  // Puan haritasından kademeye (altın=1., gümüş=2.) göre kadroyu diz
  kadroSec(turnuva, puanMap, kademe){
    var diz=this.kadroDizilim(turnuva.kisi);
    // TÜM kayıtlı oyuncular havuzda → kadro lig boyutuna (kişi sayısı) dolar.
    // Performans puanı olanlar üste, sonra oynayanlar, sonra OVR. Altın=1. kademe, Gümüş=2.
    var recs=Object.keys(puanMap).map(function(k){ return puanMap[k]; });
    return diz.map(function(l){
      var poz=l[0],adet=l[1];
      var grup=recs.filter(function(r){ return r.poz===poz; }).sort(function(a,b){ return b.puan-a.puan || (b.mac-a.mac) || ((b.oy.ovr||0)-(a.oy.ovr||0)) || (b.gol-a.gol); });
      var bas=kademe==="gumus"?adet:0;
      return {poz:poz,adet:adet,list:grup.slice(bas,bas+adet)};
    });
  },

  // Lig geneli istatistikler
  ligIstatistik(turnuva){
    const oynanan=turnuva.maclar.filter(m=>m.oynandi);
    const toplamGol=oynanan.reduce((s,m)=>s+(m.skorA||0)+(m.skorB||0),0);
    const macBasi=oynanan.length?(toplamGol/oynanan.length).toFixed(1):"0";
    // takım gol/yeme
    const tkStat={};
    turnuva.takimlar.forEach(tk=>tkStat[tk.id]={ad:tk.ad,renk:tk.renk,at:tk.ag||0,ye:tk.yg||0,g:tk.g||0,evG:0,depG:0,kart:0});
    turnuva.takimlar.forEach(tk=>{ tk.oyuncular.forEach(o=>{ if(tkStat[tk.id]) tkStat[tk.id].kart+=(o.sari||0)+(o.kirmizi||0)*2; }); });
    const liste=Object.values(tkStat);
    const enGolcu=[...liste].sort((a,b)=>b.at-a.at)[0];
    const enDefans=[...liste].sort((a,b)=>a.ye-b.ye)[0];
    const enSert=[...liste].sort((a,b)=>b.kart-a.kart)[0];
    const enCentilmen=[...liste].sort((a,b)=>a.kart-b.kart)[0];
    // en farklı galibiyet + en gollü maç
    let enFarkli=null, enGollu=null;
    oynanan.forEach(m=>{
      const fark=Math.abs((m.skorA||0)-(m.skorB||0));
      const top=(m.skorA||0)+(m.skorB||0);
      if(!enFarkli||fark>enFarkli.fark) enFarkli={fark, mac:m, skor:`${m.takimA} ${m.skorA}-${m.skorB} ${m.takimB}`};
      if(!enGollu||top>enGollu.top) enGollu={top, mac:m, skor:`${m.takimA} ${m.skorA}-${m.skorB} ${m.takimB}`};
    });
    // haftalık gol
    const haftaGol={};
    oynanan.forEach(m=>{ const h=m.hafta||1; haftaGol[h]=(haftaGol[h]||0)+(m.skorA||0)+(m.skorB||0); });
    return {toplamGol, macBasi, oynananSayi:oynanan.length, enGolcu, enDefans, enSert, enCentilmen, enFarkli, enGollu, haftaGol, liste};
  },
};

/* ============================================================
   UI PARÇALARI (ortak bileşenler — her yerde aynı)
   ============================================================ */
