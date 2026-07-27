function uretVeri(turnuvaSayisi=5, takimPerTurnuva=9, oyuncuPerTakim=12, opts={}) {
  const turnuvalar = [];
  let oyuncuId=1, takimId=1, macId=1;

  for (let t=0; t<turnuvaSayisi; t++) {
    const takimlar=[];
    const tAdSlug = (TURNUVA_ADLARI[t]||("Turnuva "+(t+1)));
    for (let k=0; k<takimPerTurnuva; k++) {
      const renk = RENKLER[k % RENKLER.length];
      const oyuncular=[];
      for (let o=0; o<oyuncuPerTakim; o++) {
        const ovr = 55 + rnd(45);
        const yas = 18+rnd(25);
        oyuncular.push({
          id: oyuncuId++,
          ad: pick(ADLAR)+" "+pick(SOYADLAR),
          poz: pick(POZISYONLAR),
          no: o+1,
          ovr,
          pac: 50+rnd(50), sho:50+rnd(50), pas:50+rnd(50), dri:50+rnd(50), def:50+rnd(50), phy:50+rnd(50),
          renk,
          yas, boy:165+rnd(30), kilo:60+rnd(30),
          dogum: `${String(1+rnd(28)).padStart(2,"0")}.${String(1+rnd(12)).padStart(2,"0")}.${2026-(18+rnd(25))}`,
          bolge: pick(["Sol Kanat","Sağ Kanat","Merkez","Orta Saha","Defans","Forvet"]),
          saglik: Math.random()>0.85?"Sakat":"Sağlam",
          deger: Math.round((ovr*ovr*ovr/180))/10, // milyon €
          gol:0, asist:0, mac:0, kurtaris:0, sari:0, kirmizi:0, mvp:0,
          altin:0, gumus:0, forvet:0, ortasaha:0, defans:0, kaleci:0, centilmen:0, enerjik:0, macinGolu:0,
          formaRenk:renk
        });
      }
      // Kaptan = en yüksek OVR'li oyuncu; TD = üretilmiş isim (Faz 5: evren varlıkları)
      const kap = [...oyuncular].sort((a,b)=>b.ovr-a.ovr)[0];
      takimlar.push({
        id: takimId++,
        ad: TAKIM_ADLARI[(t*takimPerTurnuva+k) % TAKIM_ADLARI.length],
        renk, oyuncular,
        kaptanId: kap?kap.id:null,
        td: { ad: pick(ADLAR)+" "+pick(SOYADLAR) },
        o:0,g:0,b:0,m:0,ag:0,yg:0,puan:0, form:[]
      });
    }

    // —— FİKSTÜR (format'a göre: serbest/tek = tek devre, cift = çift devre, gruplu = grup içi lig) ——
    const fmt = opts.format || "serbest";
    const grupSay = fmt==="gruplu" ? Math.max(2, opts.grup||2) : 0;
    if(grupSay){ takimlar.forEach((tk,idx)=>{ tk.grup=idx%grupSay; }); }
    const kisi = opts.kisi || 7;                                   // saha oyuncu sayısı (diziliş için)
    const oran = (opts.oynanmaOran==null?1:Math.max(0,Math.min(1,opts.oynanmaOran))); // oynanmış maç oranı
    const fixtures=[];
    const eslestir=(list)=>{ for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){ fixtures.push({A:list[i],B:list[j],grup:list[i].grup||0}); if(fmt==="cift") fixtures.push({A:list[j],B:list[i],grup:list[i].grup||0}); } };
    if(grupSay){ for(let g=0;g<grupSay;g++) eslestir(takimlar.filter(tk=>tk.grup===g)); }
    else eslestir(takimlar);
    fixtures.forEach((fx,idx)=>{ fx.hafta=idx+1; });
    const oynananSay = Math.round(fixtures.length*oran);
    // diziliş üretici: pozisyona+OVR'a göre otomatik kadro (yerlesim + yedek) ve formasyon adı
    const dizUret=(tk)=>{
      const liste=DIZILIS_SABLON[kisi]||DIZILIS_SABLON[7];
      const sab=pick(liste); const slotlar=slotlariUret(sab);
      const havuz=[...tk.oyuncular].sort((a,b)=>b.ovr-a.ovr); const kull=new Set();
      const yerlesim=slotlar.map(sl=>{ let a=havuz.find(o=>!kull.has(o.id)&&o.poz===sl.poz)||havuz.find(o=>!kull.has(o.id)); if(a)kull.add(a.id); return a?a.id:null; });
      const yedek=havuz.filter(o=>!kull.has(o.id)).map(o=>o.id);
      return {ad:sab.ad, kadro:{yerlesim,yedek}};
    };
    const maclar=[];
    fixtures.forEach((fx,fi)=>{
      const A=fx.A, B=fx.B, hafta=fx.hafta;
      if(fi>=oynananSay){ // henüz oynanmamış maç (fikstürde duruyor)
        maclar.push({id:macId++, hafta, grup:fx.grup, takimA:A.ad, takimB:B.ad, renkA:A.renk, renkB:B.renk, skorA:null, skorB:null, olaylar:[], oynandi:false, takimAId:A.id, takimBId:B.id, sure:60});
        return;
      }
        // —— GERÇEKÇİ SİMÜLASYON —— skor takım gücü + mevki + form + EV AVANTAJI'na göre (rastgele değil)
        const nonGk=(tk)=>tk.oyuncular.filter(p=>p.poz!=="Kaleci");
        const hucumG=(tk)=>{ const l=nonGk(tk); return l.length? l.reduce((s,o)=>s+(o.ovr*0.6+o.sho*0.4),0)/l.length : 60; };
        const defansG=(tk)=>{ const l=tk.oyuncular.filter(o=>o.poz==="Defans"||o.poz==="Kaleci"); return l.length? l.reduce((s,o)=>s+(o.ovr*0.6+o.def*0.4),0)/l.length : 60; };
        const formFak=(tk)=>{ const f=(tk.form||[]).slice(-5); const p=f.reduce((s,r)=>s+(r==="G"?1:r==="M"?-1:0),0); return 1+Math.max(-0.2,Math.min(0.2,p*0.05)); };
        const poisson=(lam)=>{ const L=Math.exp(-Math.max(0.05,lam)); let k=0,p=1; do{k++;p*=Math.random();}while(p>L); return k-1; };
        const gercekci = opts.gercekci!==false;   // varsayılan: gerçekçi
        let sA,sB;
        if(gercekci){
          const xgA=Math.max(0.15, 1.5*(hucumG(A)/Math.max(45,defansG(B)))*1.12*formFak(A)); // A ev sahibi: 1.12 avantaj
          const xgB=Math.max(0.15, 1.5*(hucumG(B)/Math.max(45,defansG(A)))*formFak(B));
          sA=Math.min(8,poisson(xgA)); sB=Math.min(8,poisson(xgB));
        } else { sA=rnd(6); sB=rnd(6); }
        const olaylar=[];
        const golAgirlik=(p)=>{ const pz=p.poz==="Forvet"?3:p.poz==="OrtaSaha"?1.5:p.poz==="Defans"?0.5:0.12; return pz*(p.sho*0.6+p.ovr*0.4)/40+0.01; };
        const asistAgirlik=(p)=>{ const pz=p.poz==="OrtaSaha"?3:p.poz==="Forvet"?1.6:p.poz==="Defans"?0.7:0.1; return pz*(p.pas*0.6+p.ovr*0.4)/40+0.01; };
        const golAt=(tk,adet)=>{ const hav=nonGk(tk); for(let g=0;g<adet;g++){ const sc=pickWeighted(hav,golAgirlik)||pick(hav); if(!sc) continue; sc.gol++; const asAday=tk.oyuncular.filter(p=>p.id!==sc.id); const as=(Math.random()>0.4)?(pickWeighted(asAday,asistAgirlik)||null):null; if(as) as.asist++; olaylar.push({oyuncu:sc.ad, oyuncuId:sc.id, takim:tk.ad, tip:"gol", asist:as?as.ad:null, asistId:as?as.id:null, dk:1+Math.floor(Math.random()*58)}); } };
        golAt(A,sA); golAt(B,sB);
        // kartlar — defans/orta saha ağırlıklı (mevkiye göre gerçekçi)
        const kartAgirlik=(p)=>p.poz==="Defans"?2.2:p.poz==="OrtaSaha"?1.6:p.poz==="Forvet"?0.8:0.4;
        [A,B].forEach(tk=>{
          const sariSay = Math.random()>0.45 ? (Math.random()>0.6?2:1) : 0;
          for(let i=0;i<sariSay;i++){ const p=pickWeighted(tk.oyuncular,kartAgirlik)||pick(tk.oyuncular); if(p){ p.sari++; olaylar.push({oyuncu:p.ad, oyuncuId:p.id, takim:tk.ad, tip:"sari"}); } }
          if(Math.random()>0.82){ const p=pickWeighted(tk.oyuncular,kartAgirlik)||pick(tk.oyuncular); if(p){ p.kirmizi++; olaylar.push({oyuncu:p.ad, oyuncuId:p.id, takim:tk.ad, tip:"kirmizi"}); } }
        });
        // kaleci kurtarış — hem oyuncu sayacı hem MAÇA yaz (kaydedici maçtan okur)
        const macKaleciler=[];
        [A,B].forEach(tk=>{ const k=tk.oyuncular.find(p=>p.poz==="Kaleci"); if(k){ const yedi=(tk===A?sB:sA); const n=Math.max(1, 2+rnd(3)+yedi); k.kurtaris+=n; macKaleciler.push({ad:k.ad, id:k.id, kurtaris:n}); } });
        // mvp — kazanan takımda gol+asist katkısı yüksek olana ağırlıklı
        const mvpTk = sA>=sB?A:B;
        const mvpAday = mvpTk.oyuncular.filter(p=>p.gol>0).length?mvpTk.oyuncular.filter(p=>p.gol>0):mvpTk.oyuncular;
        const mvpO = pickWeighted(mvpAday, p=> p.gol*3 + p.asist*2 + p.ovr/40);
        if(mvpO) mvpO.mvp++;
        // diğer ödüller — pozisyon + yeteneğe göre ağırlıklı dağıt (yıldızlar öne çıksın)
        const tumO=[...A.oyuncular,...B.oyuncular];
        const forvetler = tumO.filter(p=>p.poz==="Forvet"); 
        const ortalar   = tumO.filter(p=>p.poz==="OrtaSaha");
        const defanslar = tumO.filter(p=>p.poz==="Defans");
        const kaleciler = tumO.filter(p=>p.poz==="Kaleci");
        // maça kaydedilecek ödül paketi (her maçta TÜM ödüller seçili olsun — inceleme kolaylığı)
        const macOdul={}, macOdulId={};
        macOdul.mvp = mvpO?mvpO.ad:null;
        { const o=pickWeighted(forvetler.length?forvetler:tumO, p=>p.gol+p.sho/20); if(o){o.forvet++; macOdul.forvet=o.ad; macOdulId.forvet=o.id;} }
        { const o=pickWeighted(ortalar.length?ortalar:tumO, p=>p.asist+p.pas/20); if(o){o.ortasaha++; macOdul.ortasaha=o.ad; macOdulId.ortasaha=o.id;} }
        { const o=pickWeighted(defanslar.length?defanslar:tumO, p=>p.def/15); if(o){o.defans++; macOdul.defans=o.ad; macOdulId.defans=o.id;} }
        { const o=pickWeighted(kaleciler.length?kaleciler:tumO, p=>p.kurtaris+p.def/20); if(o){o.kaleci++; macOdul.kaleci=o.ad; macOdulId.kaleci=o.id;} }
        { const o=pickWeighted(tumO, p=>(p.ovr-50)/12); if(o){o.altin++; macOdul.altin=o.ad; macOdulId.altin=o.id;} }
        { const o=pickWeighted(tumO, p=>(p.ovr-50)/15); if(o){o.gumus++; macOdul.gumus=o.ad; macOdulId.gumus=o.id;} }
        { const o=pickWeighted(tumO, p=>p.gol+p.sho/25); if(o){o.macinGolu++; macOdul.macinGolu=o.ad; macOdulId.macinGolu=o.id;} }
        { const o=pick(tumO); o.enerjik++; macOdul.enerjik=o.ad; macOdulId.enerjik=o.id; }
        { const o=pick(tumO); o.centilmen++; macOdul.centilmen=o.ad; macOdulId.centilmen=o.id; }
        // mac istatistik
        A.oyuncular.forEach(p=>p.mac++); B.oyuncular.forEach(p=>p.mac++);
        // puan
        A.o++;B.o++;A.ag+=sA;A.yg+=sB;B.ag+=sB;B.yg+=sA;
        if(sA>sB){A.g++;B.m++;A.puan+=3;A.form.push("G");B.form.push("M");}
        else if(sB>sA){B.g++;A.m++;B.puan+=3;B.form.push("M");A.form.push("G");}
        else {A.b++;B.b++;A.puan++;B.puan++;A.form.push("B");B.form.push("B");}
        // maç istatistiği de üret (gazete/afişte dolu görünsün)
        const macIst = istatistikUret(sA, sB);
        const dA=dizUret(A), dB=dizUret(B);
        const yeniMacObj={id:macId++, hafta, grup:fx.grup, takimA:A.ad, takimB:B.ad, renkA:A.renk, renkB:B.renk, skorA:sA, skorB:sB, olaylar, kaleciler:macKaleciler, mvp:mvpO?mvpO.ad:null, mvpId:mvpO?mvpO.id:null, mvpTakim:mvpTk.ad, oduller:macOdul, odullerId:macOdulId, istatistik:macIst, oynandi:true, takimAId:A.id, takimBId:B.id, sure:60, dizilisA:dA.ad, dizilisB:dB.ad, kadroA:dA.kadro, kadroB:dB.kadro, hakem:pick(HAKEM_ADLARI)};
        yeniMacObj.ratingler = ratingHesapla(yeniMacObj, A, B);
        maclar.push(yeniMacObj);
    });
    // sırala
    takimlar.sort((a,b)=> b.puan-a.puan || (b.ag-b.yg)-(a.ag-a.yg) || b.ag-a.ag);
    takimlar.forEach((tk,i)=> tk.sira=i+1);

    turnuvalar.push({
      id:t+1, ad:tAdSlug, renk: pick(RENKLER),
      takimlar, maclar, format:fmt, grupSayi:grupSay, kisi,
      sehir: pick(["İstanbul","Ankara","İzmir","Bursa","Antalya"])
    });
  }
  return turnuvalar;
}

/* ============================================================
   DEMO KUPA — tam oynanmış eleme turnuvası (hayali)
   ============================================================ */
function demoKupa(){
  let oid=900000, tid=90000, mid=900000;
  const takimSayisi=8, oyuncuSay=10;
  const takimlar=[];
  const kupaTakimAd=["Kartal Yıldızları","Anadolu Fırtınası","Boğaziçi FK","Marmara Kartalları","Efe Gücü","Şahin Spor","Yıldırım United","Toros Kaplanları"];
  for(let k=0;k<takimSayisi;k++){
    const renk=RENKLER[k%RENKLER.length];
    const oyuncular=[];
    for(let o=0;o<oyuncuSay;o++){
      const ovr=60+rnd(38), yas=18+rnd(20);
      oyuncular.push({ id:oid++, ad:pick(ADLAR)+" "+pick(SOYADLAR), poz:pick(POZISYONLAR), no:o+1, ovr,
        pac:55+rnd(45),sho:55+rnd(45),pas:55+rnd(45),dri:55+rnd(45),def:55+rnd(45),phy:55+rnd(45),
        renk, yas, boy:168+rnd(26), kilo:62+rnd(26), ayak:pick(["Sağ","Sağ","Sol","Çift"]),
        dogum:`${String(1+rnd(28)).padStart(2,"0")}.${String(1+rnd(12)).padStart(2,"0")}.${2026-yas}`,
        saglik:Math.random()>0.85?"Sakat":"Sağlam", deger:Math.round(ovr*ovr*ovr/180)/10, lisNo:lisansUret("oyuncu"),
        gol:0,asist:0,mac:0,kurtaris:0,sari:0,kirmizi:0,mvp:0,
        altin:0,gumus:0,forvet:0,ortasaha:0,defans:0,kaleci:0,centilmen:0,enerjik:0,macinGolu:0, formaRenk:renk });
    }
    takimlar.push({ id:tid++, ad:kupaTakimAd[k]||("Takım "+(k+1)), renk, oyuncular, o:0,g:0,b:0,m:0,ag:0,yg:0,puan:0,form:[], lisNo:lisansUret("takim") });
  }
  const turnuva={ id:990001, ad:"⭐ Şampiyonlar Kupası (Demo)", renk:"#E5B84B", takimlar, maclar:[], format:"kupa", grupSayi:0,
    sehir:"İstanbul", ilce:"Kartal", kisi:8, sponsorAd:"Kartal Halı Saha", sponsorEmoji:"🏟️" };
  // tek maçı simüle et (kupa: berabere yok)
  const oynat=(m)=>{
    if(m.bye) return;
    const A=takimlar.find(t=>t.id===m.takimAId), B=takimlar.find(t=>t.id===m.takimBId);
    if(!A||!B) return;
    let sA=rnd(5), sB=rnd(5); if(sA===sB){ if(Math.random()>0.5)sA++; else sB++; }
    const olaylar=[];
    const golciler=(tk,adet)=>{ for(let g=0;g<adet;g++){ const sc=pick(tk.oyuncular.filter(p=>p.poz!=="Kaleci"))||tk.oyuncular[0]; sc.gol++;
      const as=pick(tk.oyuncular.filter(p=>p.id!==sc.id)); const asistVar=Math.random()>0.4; if(asistVar&&as)as.asist++;
      olaylar.push({oyuncu:sc.ad, takim:tk.ad, tip:"gol", asist:asistVar&&as?as.ad:null, dk:1+rnd(59)}); } };
    golciler(A,sA); golciler(B,sB);
    [A,B].forEach(tk=>{ if(Math.random()>0.55){ const p=pick(tk.oyuncular); p.sari++; olaylar.push({oyuncu:p.ad,takim:tk.ad,tip:"sari",dk:5+rnd(55)}); }
      if(Math.random()>0.85){ const p=pick(tk.oyuncular); p.kirmizi++; olaylar.push({oyuncu:p.ad,takim:tk.ad,tip:"kirmizi",dk:20+rnd(40)}); } });
    const macKal=[];
    [A,B].forEach(tk=>{ const k=tk.oyuncular.find(p=>p.poz==="Kaleci"); if(k){ const n=1+rnd(6); k.kurtaris+=n; macKal.push({ad:k.ad,kurtaris:n}); } });
    const mvpTk=sA>sB?A:B;
    const mvpAday=mvpTk.oyuncular.filter(p=>p.gol>0).length?mvpTk.oyuncular.filter(p=>p.gol>0):mvpTk.oyuncular;
    const mvpO=pickWeighted(mvpAday, p=>p.gol*3+p.asist*2+p.ovr/40);
    if(mvpO)mvpO.mvp++;
    const tumO=[...A.oyuncular,...B.oyuncular];
    const forv=tumO.filter(p=>p.poz==="Forvet"), orta=tumO.filter(p=>p.poz==="OrtaSaha"), def=tumO.filter(p=>p.poz==="Defans"), kal=tumO.filter(p=>p.poz==="Kaleci");
    const od={}; od.mvp=mvpO?mvpO.ad:null;
    { const o=pickWeighted(forv.length?forv:tumO,p=>p.gol+p.sho/20); if(o){o.forvet++;od.forvet=o.ad;} }
    { const o=pickWeighted(orta.length?orta:tumO,p=>p.asist+p.pas/20); if(o){o.ortasaha++;od.ortasaha=o.ad;} }
    { const o=pickWeighted(def.length?def:tumO,p=>p.def/15); if(o){o.defans++;od.defans=o.ad;} }
    { const o=pickWeighted(kal.length?kal:tumO,p=>p.kurtaris+p.def/20); if(o){o.kaleci++;od.kaleci=o.ad;} }
    { const o=pickWeighted(tumO,p=>(p.ovr-50)/12); if(o){o.altin++;od.altin=o.ad;} }
    { const o=pickWeighted(tumO,p=>(p.ovr-50)/15); if(o){o.gumus++;od.gumus=o.ad;} }
    { const o=pickWeighted(tumO,p=>p.gol+p.sho/25); if(o){o.macinGolu++;od.macinGolu=o.ad;} }
    { const o=pick(tumO); o.enerjik++; od.enerjik=o.ad; }
    { const o=pick(tumO); o.centilmen++; od.centilmen=o.ad; }
    A.oyuncular.forEach(p=>p.mac++); B.oyuncular.forEach(p=>p.mac++);
    m.skorA=sA; m.skorB=sB; m.olaylar=olaylar; m.kaleciler=macKal; m.mvp=mvpO?mvpO.ad:null; m.mvpTakim=mvpTk.ad; m.oduller=od;
    m.istatistik=istatistikUret(sA,sB); m.oynandi=true; m.sure=60;
    try{ m.ratingler=ratingHesapla(m,A,B); }catch(e){}
  };
  // fikstür + tüm turları oyna
  turnuva.maclar=kupaFikstur(turnuva);
  turnuva.maclar.forEach(oynat);
  let guard=0;
  while(guard++<12){
    const r=kupaSonrakiTur(turnuva);
    if(r.hata||r.bitti) break;
    const sonTur=Math.max(...turnuva.maclar.map(x=>x.tur||1));
    turnuva.maclar.filter(x=>(x.tur||1)===sonTur).forEach(oynat);
  }
  try{ turnuvaHesapla(turnuva); }catch(e){}
  return turnuva;
}

/* ============================================================
   FAZ 4 — VERİ FABRİKASI (elle lig/takım/oyuncu/maç oluşturma)
   ============================================================ */
// Benzersiz id üretici (tüm turnuvalardaki max id'den devam)
function yeniId(turnuvalar, tip){
  let max=0;
  turnuvalar.forEach(t=>{
    if(tip==="turnuva") max=Math.max(max,t.id);
    t.takimlar.forEach(tk=>{
      if(tip==="takim") max=Math.max(max,tk.id);
      tk.oyuncular.forEach(o=>{ if(tip==="oyuncu") max=Math.max(max,o.id); });
    });
    t.maclar.forEach(mc=>{ if(tip==="mac") max=Math.max(max,mc.id); });
  });
  return max+1;
}

function lisansUret(tip){
  // OYU-2026-04871 / TKM-2026-00293 — eklendiği yıl + benzersiz sıra
  const yil=new Date().getFullYear();
  const key = tip==="oyuncu" ? "fp_seq_oyu_"+yil : "fp_seq_tkm_"+yil;
  let n=0;
  try{ n=parseInt(localStorage.getItem(key)||"0")||0; }catch(e){}
  n++;
  try{ localStorage.setItem(key, String(n)); }catch(e){}
  const on = tip==="oyuncu"?"OYU":"TKM";
  return on+"-"+yil+"-"+String(n).padStart(5,"0");
}

function yeniOyuncu(id, ad, poz, no, renk){
  const ovr=60+rnd(25);
  return {
    id, lisNo: lisansUret("oyuncu"), ad: ad||"Yeni Oyuncu", poz: poz||"OrtaSaha", no: no||1, ovr, foto:null,
    pac:55+rnd(40), sho:55+rnd(40), pas:55+rnd(40), dri:55+rnd(40), def:55+rnd(40), phy:55+rnd(40),
    renk, yas:18+rnd(22), boy:170+rnd(25), kilo:65+rnd(25), ayak: pick(["Sağ","Sağ","Sağ","Sol","Çift"]),
    dogum:`01.01.${2026-(18+rnd(22))}`, bolge:"Merkez", uyruk:"Türkiye", saglik:"Sağlam",
    deger: Math.round((ovr*ovr*ovr/180))/10,
    gol:0,asist:0,mac:0,kurtaris:0,sari:0,kirmizi:0,mvp:0,dk:0,
    altin:0,gumus:0,forvet:0,ortasaha:0,defans:0,kaleci:0,centilmen:0,enerjik:0,macinGolu:0,
    formaRenk:renk
  };
}

function yeniTakim(id, ad, renk, oyuncuBaslaId, oyuncuSayi=12){
  const oyuncular=[];
  const pozlar=["Kaleci","Defans","Defans","Defans","OrtaSaha","OrtaSaha","OrtaSaha","Forvet","Forvet","Defans","OrtaSaha","Forvet"];
  for(let i=0;i<oyuncuSayi;i++){
    oyuncular.push(yeniOyuncu(oyuncuBaslaId+i, pick(ADLAR)+" "+pick(SOYADLAR), pozlar[i]||"OrtaSaha", i+1, renk));
  }
  return { id, lisNo: lisansUret("takim"), ad: ad||"Yeni Takım", renk, renk2:ikinciRenk(renk), logo:null, oyuncular, grup:0, o:0,g:0,b:0,m:0,ag:0,yg:0,puan:0, form:[] };
}

function yeniMac(id, A, B, hafta){
  return { id, hafta:hafta||1, takimA:A.ad, takimB:B.ad, renkA:A.renk, renkB:B.renk,
    skorA:null, skorB:null, olaylar:[], mvp:null, mvpTakim:null, takimAId:A.id, takimBId:B.id, oynandi:false,
    tarih:"", saat:"", stad:"" };
}

// Bir turnuvanın tüm puan/istatistiklerini maçlardan SIFIRDAN hesapla
function turnuvaHesapla(turnuva){
  // takım istatistik sıfırla
  turnuva.takimlar.forEach(tk=>{ tk.o=0;tk.g=0;tk.b=0;tk.m=0;tk.ag=0;tk.yg=0;tk.puan=0;tk.form=[]; });
  // oyuncu istatistik sıfırla (ödül + dakika sayaçları dahil)
  turnuva.takimlar.forEach(tk=>tk.oyuncular.forEach(o=>{ o.gol=0;o.asist=0;o.mac=0;o.kurtaris=0;o.sari=0;o.kirmizi=0;o.mvp=0;o.dk=0;
    o.altin=0;o.gumus=0;o.forvet=0;o.ortasaha=0;o.defans=0;o.kaleci=0;o.macinGolu=0;o.centilmen=0;o.enerjik=0; }));
  const bulO=(ad)=>{ for(const tk of turnuva.takimlar){ const o=tk.oyuncular.find(x=>x.ad===ad); if(o)return o; } return null; };
  // Player ID omurgası: önce benzersiz id ile bul (aynı isim karışmaz), yoksa isme düş (eski/demo veri uyumu)
  const bulOId=(id)=>{ if(id==null||id==="") return null; const s=String(id); for(const tk of turnuva.takimlar){ const o=tk.oyuncular.find(x=>String(x.player_id||x.id)===s || String(x.id)===s); if(o)return o; } return null; };
  const coz=(id,ad)=> bulOId(id) || (ad?bulO(ad):null);
  turnuva.maclar.filter(mc=>mc.oynandi && mc.skorA!=null).forEach(mc=>{
    const A=turnuva.takimlar.find(t=>t.id===mc.takimAId)||turnuva.takimlar.find(t=>t.ad===mc.takimA);
    const B=turnuva.takimlar.find(t=>t.id===mc.takimBId)||turnuva.takimlar.find(t=>t.ad===mc.takimB);
    if(!A||!B) return;
    const sA=mc.skorA, sB=mc.skorB;
    const sure=mc.sure?parseInt(mc.sure):60; // maç süresi (varsayılan 60 dk)
    A.o++;B.o++;A.ag+=sA;A.yg+=sB;B.ag+=sB;B.yg+=sA;
    if(sA>sB){A.g++;B.m++;A.puan+=3;A.form.push("G");B.form.push("M");}
    else if(sB>sA){B.g++;A.m++;B.puan+=3;B.form.push("G");A.form.push("M");}
    else {A.b++;B.b++;A.puan++;B.puan++;A.form.push("B");B.form.push("B");}
    A.oyuncular.forEach(o=>o.mac++); B.oyuncular.forEach(o=>o.mac++);

    // —— OYNAMA SÜRESİ —— kadro (saha 11) tam süre başlar; değişiklikler dakikayı ayarlar
    const sahaBasla=(kadro)=>{ const set=new Set(); if(kadro&&Array.isArray(kadro.yerlesim)) kadro.yerlesim.forEach(id=>{ if(id!=null) set.add(id); }); return set; };
    const oynamaDk={}; // id → dakika
    [["A",A,mc.kadroA],["B",B,mc.kadroB]].forEach(([k,tk,kadro])=>{
      const basla=sahaBasla(kadro);
      // başlayanlar tam süre (varsayılan), id ile sakla
      tk.oyuncular.forEach(o=>{ if(basla.has(o.id)) oynamaDk[o.id]=sure; });
    });
    // değişiklikler: çıkan → o dakikaya kadar, giren → kalan süre
    (mc.olaylar||[]).filter(o=>o.tip==="degisik").forEach(o=>{
      const dk = (o.dk!=null&&o.dk!=="") ? parseInt(o.dk) : Math.round(sure*0.6);
      if(o.cikan){ const c=coz(o.cikanId,o.cikan); if(c) oynamaDk[c.id]=Math.min(oynamaDk[c.id]!=null?oynamaDk[c.id]:sure, dk); }
      if(o.giren){ const g=coz(o.girenId,o.giren); if(g) oynamaDk[g.id]=(oynamaDk[g.id]||0)+(sure-dk); }
    });
    // dakikaları oyunculara işle
    Object.entries(oynamaDk).forEach(([id,dk])=>{
      for(const tk of turnuva.takimlar){ const o=tk.oyuncular.find(x=>x.id==id); if(o){ o.dk=(o.dk||0)+Math.max(0,dk); break; } }
    });

    (mc.olaylar||[]).forEach(ol=>{
      const o=coz(ol.oyuncuId, ol.oyuncu);
      if(ol.tip==="gol"){ if(o)o.gol++; if(ol.asist||ol.asistId){ const a=coz(ol.asistId, ol.asist); if(a)a.asist++; } }
      else if(ol.tip==="sari"){ if(o)o.sari++; }
      else if(ol.tip==="kirmizi"){ if(o)o.kirmizi++; }
    });
    if(mc.mvp||mc.mvpId){ const mv=coz(mc.mvpId, mc.mvp); if(mv)mv.mvp++; }
    // maç ödüllerini oyuncu sayaçlarına ekle (mvp hariç — o ayrı sayılıyor)
    if(mc.oduller){
      ["altin","gumus","forvet","ortasaha","defans","kaleci","macinGolu","centilmen","enerjik"].forEach(alan=>{
        const ad=mc.oduller[alan]; const oid=mc.odullerId&&mc.odullerId[alan]; if(ad||oid){ const o=coz(oid, ad); if(o)o[alan]=(o[alan]||0)+1; }
      });
      // eski tek-kaleci kurtarış (geriye uyum)
      if(mc.oduller.kaleci && mc.oduller.kaleciKurtaris && !mc.kaleciler){
        const k=coz(mc.odullerId&&mc.odullerId.kaleci, mc.oduller.kaleci); const n=parseInt(mc.oduller.kaleciKurtaris)||0;
        if(k) k.kurtaris=(k.kurtaris||0)+n;
      }
    }
    // —— ÇOKLU KALECİ KURTARIŞI —— mc.kaleciler = [{ad, kurtaris}]
    if(Array.isArray(mc.kaleciler)){
      mc.kaleciler.forEach(kl=>{ if(kl.ad||kl.id){ const k=coz(kl.id, kl.ad); const n=parseInt(kl.kurtaris)||0; if(k) k.kurtaris=(k.kurtaris||0)+n; } });
    }
  });
  // sıralama: tüm lig genel; gruplu ise grup içi sıra da hesaplanır
  turnuva.takimlar.sort((a,b)=> b.puan-a.puan || (b.ag-b.yg)-(a.ag-a.yg) || b.ag-a.ag);
  turnuva.takimlar.forEach((tk,i)=>tk.sira=i+1);
  if(turnuva.format==="gruplu"){
    const g=turnuva.grupSayi||2;
    for(let gi=0; gi<g; gi++){
      const grup=turnuva.takimlar.filter(t=>(t.grup||0)===gi)
        .sort((a,b)=> b.puan-a.puan || (b.ag-b.yg)-(a.ag-a.yg) || b.ag-a.ag);
      grup.forEach((tk,i)=>tk.grupSira=i+1);
    }
  }
}

// Otomatik fikstür üret (round-robin). cift=true → ev-deplasman (çift devre)
function fikstürUret(turnuva, cift){
  // global id çakışmasın diye büyük taban
  let mid = (turnuva.maclar.reduce((m,x)=>Math.max(m,x.id),0))+1;
  const tk=[...turnuva.takimlar];
  if(tk.length<2) return [];
  return roundRobin(tk, cift, mid, 0).maclar;
}

/* ===== KUPA (tek maç eleme) ===== */
function byeMac(id, A, tur){ return {id, tur, hafta:tur, takimA:A.ad, takimB:"(bay)", renkA:A.renk, renkB:"#334155", takimAId:A.id, takimBId:null, skorA:1, skorB:0, oynandi:true, bye:true, olaylar:[], mvp:null, mvpTakim:null, tarih:"", saat:"", stad:"" }; }
function kupaGalip(m){
  if(m.bye) return {ad:m.takimA, id:m.takimAId, renk:m.renkA};
  if(m.skorA==null || m.skorB==null) return null;
  if(m.skorA>m.skorB) return {ad:m.takimA, id:m.takimAId, renk:m.renkA};
  if(m.skorB>m.skorA) return {ad:m.takimB, id:m.takimBId, renk:m.renkB};
  if(m.penGalip){ return m.penGalip===m.takimA ? {ad:m.takimA,id:m.takimAId,renk:m.renkA} : {ad:m.takimB,id:m.takimBId,renk:m.renkB}; }
  return null; // beraberlik, penaltı galibi seçilmemiş
}
function kupaFikstur(turnuva){
  let mid = (turnuva.maclar.reduce((m,x)=>Math.max(m,x.id),0))+1;
  const kar=[...turnuva.takimlar].sort(()=>Math.random()-0.5);
  if(kar.length<2) return [];
  const maclar=[];
  for(let i=0;i<kar.length;i+=2){
    const A=kar[i], B=kar[i+1];
    if(A&&B){ const mc=yeniMac(mid++, A, B, 1); mc.tur=1; maclar.push(mc); }
    else if(A){ maclar.push(byeMac(mid++, A, 1)); }
  }
  return maclar;
}
function kupaSonrakiTur(turnuva){
  const turlar=turnuva.maclar.map(m=>m.tur||1);
  if(!turlar.length) return {hata:"Önce kupa fikstürü oluştur."};
  const sonTur=Math.max(...turlar);
  const buTur=turnuva.maclar.filter(m=>(m.tur||1)===sonTur);
  const galipler=buTur.map(kupaGalip);
  if(galipler.some(g=>!g)) return {hata:"Bu turdaki tüm maçlar bitmeli (beraberlikte penaltı galibini seç)."};
  if(galipler.length<2) return {bitti:true, sampiyon:galipler[0]};
  let mid=(turnuva.maclar.reduce((m,x)=>Math.max(m,x.id),0))+1;
  const yeni=[];
  for(let i=0;i<galipler.length;i+=2){
    const A=galipler[i], B=galipler[i+1];
    if(A&&B){ const tkA=turnuva.takimlar.find(t=>t.id===A.id)||A, tkB=turnuva.takimlar.find(t=>t.id===B.id)||B; const mc=yeniMac(mid++, tkA, tkB, sonTur+1); mc.tur=sonTur+1; yeni.push(mc); }
    else if(A){ const tkA=turnuva.takimlar.find(t=>t.id===A.id)||A; yeni.push(byeMac(mid++, tkA, sonTur+1)); }
  }
  turnuva.maclar.push(...yeni);
  return {ok:true, tur:sonTur+1};
}
function kupaTurAd(macSayi){
  if(macSayi<=1) return "🏆 Final";
  if(macSayi===2) return "Yarı Final";
  if(macSayi<=4) return "Çeyrek Final";
  if(macSayi<=8) return "Son 16";
  if(macSayi<=16) return "Son 32";
  return "Eleme Turu";
}

// Bir takım listesinden round-robin maçları üret. grupNo: maça yazılır
function roundRobin(tk, cift, midBasla, grupNo){
  let mid=midBasla;
  const liste=[...tk]; if(liste.length%2) liste.push(null);
  const n=liste.length, yari=n/2, turlar=n-1;
  const maclar=[]; let hafta=1; let dizi=[...liste];
  for(let tur=0; tur<turlar; tur++){
    for(let i=0;i<yari;i++){
      const A=dizi[i], B=dizi[n-1-i];
      if(A&&B){ const mc=yeniMac(mid++, tur%2?B:A, tur%2?A:B, hafta); mc.grup=grupNo; maclar.push(mc); }
    }
    hafta++; dizi.splice(1,0,dizi.pop());
  }
  if(cift){
    const ilk=[...maclar];
    ilk.forEach(mc=>{
      const A=tk.find(t=>t.id===mc.takimBId), B=tk.find(t=>t.id===mc.takimAId);
      if(A&&B){ const m2=yeniMac(mid++, A, B, hafta++); m2.grup=grupNo; maclar.push(m2); }
    });
  }
  return {maclar, sonId:mid};
}

// Gruplu fikstür: her grup kendi içinde
function gruplufikstürUret(turnuva, cift){
  let mid = (turnuva.maclar.reduce((m,x)=>Math.max(m,x.id),0))+1;
  const grupSayi = turnuva.grupSayi||2;
  let tum=[];
  for(let g=0; g<grupSayi; g++){
    const grupTk = turnuva.takimlar.filter(t=>(t.grup||0)===g);
    if(grupTk.length<2) continue;
    const sonuc = roundRobin(grupTk, cift, mid, g);
    tum = tum.concat(sonuc.maclar); mid = sonuc.sonId;
  }
  return tum;
}

// Takımları gruplara dağıt. yontem: "dengeli" | "kura"
function gruplaraDagit(turnuva, yontem){
  const g = turnuva.grupSayi||2;
  let tk=[...turnuva.takimlar];
  if(yontem==="dengeli"){
    // güce göre sırala, yılan usulü dağıt (1.gruba en güçlü, sonra geri sar)
    tk.sort((a,b)=>{
      const oa=a.oyuncular.reduce((s,o)=>s+o.ovr,0)/(a.oyuncular.length||1);
      const ob=b.oyuncular.reduce((s,o)=>s+o.ovr,0)/(b.oyuncular.length||1);
      return ob-oa;
    });
    tk.forEach((t,i)=>{ const tur=Math.floor(i/g); const poz=i%g; t.grup = tur%2===0?poz:(g-1-poz); });
  } else {
    // kura — karıştır, sırayla dağıt
    for(let i=tk.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [tk[i],tk[j]]=[tk[j],tk[i]]; }
    tk.forEach((t,i)=>{ t.grup = i%g; });
  }
}

/* ============================================================
   HESAPLAMA MOTORU (tek kaynak) — tüm sayfalar buradan beslenir
   ============================================================ */
