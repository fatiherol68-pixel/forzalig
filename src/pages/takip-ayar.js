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

/* Takip > Ligler > seçili lig alt içeriği (puan/gol/asist/ödül/fikstür) */
function TakipLigIcerik({turnuva, ligTab, T, git}){
  const [krallarSira,setKrallarSira]=useState("toplam"); // toplam | mac | per90
  const sirali=[...turnuva.takimlar].sort((a,b)=> (b.puan||0)-(a.puan||0) || ((b.ag-b.yg)-(a.ag-a.yg)) || (b.ag-a.ag));

  // PUAN DURUMU
  if(ligTab==="puan") return <div>
    {sirali.map((t,i)=>
      <div key={t.id} onClick={()=>git({sayfa:"takim",takim:t,turnuva})} className="tap" style={{display:"flex",alignItems:"center",gap:8,padding:"8px 9px",background:T.bg1,borderRadius:9,marginBottom:4}}>
        <span style={{fontSize:12,fontWeight:700,width:16,color:i===0?T.gold:i<3?T.text:T.textMut}}>{i+1}</span>
        <Logo renk={t.renk} ad={t.ad} logo={t.logo} renk2={t.renk2} boy={22}/>
        <span style={{fontSize:12,color:T.text,flex:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.ad}</span>
        <span style={{fontSize:9,color:T.textMut,whiteSpace:"nowrap"}}>O{t.o||0} G{t.g||0} B{t.b||0} M{t.m||0}</span>
        <span style={{fontSize:13,fontWeight:800,fontFamily:T.fontDisplay,color:i===0?T.gold:T.text,minWidth:22,textAlign:"right"}}>{t.puan||0}</span>
      </div>
    )}
  </div>;

  // GOL / ASİST KRALLARI
  if(ligTab==="gol"||ligTab==="asist"){
    const alan=ligTab==="gol"?"gol":"asist"; const birim=ligTab==="gol"?"gol":"asist";
    // tüm oyuncular (o alanda >0), dakika hesabıyla
    const tumO=[]; turnuva.takimlar.forEach(tk=>tk.oyuncular.forEach(o=>tumO.push({...o,takimAd:tk.ad})));
    const dkOf=(o)=> o.dk>0?o.dk:(o.mac||0)*60;
    const per90Of=(o)=>{ const d=dkOf(o); return d>0?(o[alan]*90/d):0; };
    const perMacOf=(o)=> o.mac>0?(o[alan]/o.mac):0;
    let liste=tumO.filter(o=>(o[alan]||0)>0);
    if(krallarSira==="toplam") liste.sort((a,b)=>b[alan]-a[alan]);
    else if(krallarSira==="mac") liste.sort((a,b)=>perMacOf(b)-perMacOf(a));
    else liste.sort((a,b)=>per90Of(b)-per90Of(a));
    liste=liste.slice(0,10);
    return <div>
      {/* sıralama çipleri */}
      <div style={{display:"flex",gap:5,marginBottom:9}}>
        {[["toplam","Toplam"],["mac","/maç"],["per90","/90 dk"]].map(([k,et])=>
          <span key={k} onClick={()=>setKrallarSira(k)} className="tap" style={{flex:1,textAlign:"center",fontSize:10,borderRadius:8,padding:"6px 0",fontWeight:krallarSira===k?700:500,
            color:krallarSira===k?(T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0):T.textMut, background:krallarSira===k?T.accent:T.bg1}}>{et}</span>
        )}
      </div>
      {liste.length===0 ? <div style={{fontSize:12,color:T.textMut,padding:14,textAlign:"center",background:T.bg1,borderRadius:11}}>Henüz {birim} yok.</div> :
        liste.map((o,i)=>{
          const dk=dkOf(o);
          const sagDeger = krallarSira==="toplam"?o[alan] : krallarSira==="mac"?perMacOf(o).toFixed(2) : per90Of(o).toFixed(1);
          const altBilgi = krallarSira==="toplam"?`${perMacOf(o).toFixed(1)}/maç` : krallarSira==="mac"?`${o[alan]} toplam` : `${per90Of(o).toFixed(1)}/90 🔥`;
          return <div key={o.id} onClick={()=>git({sayfa:"oyuncu",oyuncu:o})} className="tap" style={{display:"flex",alignItems:"center",gap:9,padding:"8px 9px",background:T.bg1,borderRadius:9,marginBottom:4}}>
            <span style={{fontSize:12,fontWeight:700,width:16,color:i===0?T.gold:T.textMut}}>{i+1}</span>
            <Avatar o={o} boy={26} T={T}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,color:T.text,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{o.ad}</div>
              <div style={{fontSize:9,color:T.textMut}}>{o.takimAd} · {o.mac||0} maç · {dk} dk</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:15,fontWeight:800,fontFamily:T.fontDisplay,color:i===0?T.gold:T.text}}>{sagDeger}</div>
              <div style={{fontSize:8,color:krallarSira==="per90"?T.gold:T.textMut}}>{altBilgi}</div>
            </div>
          </div>;
        })}
    </div>;
  }

  // ÖDÜL LİDERLERİ (sezonluk birikmiş ödüller)
  if(ligTab==="odul"){
    const tumO=[]; turnuva.takimlar.forEach(tk=>tk.oyuncular.forEach(o=>tumO.push({...o,takimAd:tk.ad})));
    const odulTanim=[["altin","🥇","Altın"],["gumus","🥈","Gümüş"],["forvet","⚡","Forvet"],["ortasaha","🎩","Orta Saha"],["defans","🛡️","Defans"],["kaleci","🧤","Kaleci"],["macinGolu","🎯","Maçın Golü"],["centilmen","🤝","Centilmen"],["enerjik","🔥","Enerjik"]];
    return <div>
      {odulTanim.map(([alan,ik,et])=>{
        const lider=[...tumO].filter(o=>(o[alan]||0)>0).sort((a,b)=>b[alan]-a[alan])[0];
        return <div key={alan} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 9px",background:T.bg1,borderRadius:9,marginBottom:4}}>
          <span style={{fontSize:15,width:22,textAlign:"center"}}>{ik}</span>
          <span style={{fontSize:11,color:T.textMut,width:74}}>{et}</span>
          {lider ? <>
            <span style={{fontSize:12,color:T.text,fontWeight:600,flex:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{lider.ad}</span>
            <span style={{fontSize:11,fontWeight:700,color:T.gold}}>×{lider[alan]}</span>
          </> : <span style={{fontSize:11,color:T.textMut,flex:1}}>—</span>}
        </div>;
      })}
    </div>;
  }

  // FİKSTÜR
  if(ligTab==="fikstur"){
    const maclar=[...turnuva.maclar].sort((a,b)=>(a.hafta-b.hafta));
    return <div>
      {maclar.length===0 ? <div style={{fontSize:12,color:T.textMut,padding:14,textAlign:"center",background:T.bg1,borderRadius:11}}>Henüz maç yok.</div> :
        maclar.slice(0,20).map(mc=>
          <div key={mc.id} onClick={()=>git({sayfa:"mac",mac:mc,turnuva})} className="tap" style={{display:"flex",alignItems:"center",gap:7,padding:"8px 9px",background:T.bg1,borderRadius:9,marginBottom:4}}>
            <span style={{fontSize:9,color:T.textMut,width:24}}>{mc.hafta}.H</span>
            <span style={{flex:1,fontSize:11,color:T.text,textAlign:"right",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{mc.takimA}</span>
            <span style={{fontSize:12,fontWeight:800,fontFamily:T.fontDisplay,color:mc.oynandi?T.text:T.textMut,minWidth:40,textAlign:"center",background:T.bg2,borderRadius:6,padding:"2px 0"}}>{mc.oynandi?`${mc.skorA}-${mc.skorB}`:"– : –"}</span>
            <span style={{flex:1,fontSize:11,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{mc.takimB}</span>
          </div>
        )}
    </div>;
  }
  return null;
}

/* AYARLAR — tema + stres testi */
// Push: VAPID base64 → Uint8Array
function flB64ToU8(b64){ const pad="=".repeat((4-b64.length%4)%4); const s=(b64+pad).replace(/-/g,"+").replace(/_/g,"/"); const raw=atob(s); const arr=new Uint8Array(raw.length); for(let i=0;i<raw.length;i++) arr[i]=raw.charCodeAt(i); return arr; }
// Telefon push bildirim aç/kapat kartı
function PushAyar({T, oturum}){
  const [durum,setDurum]=useState("bilinmiyor"); // acik | kapali | destek_yok | ayarli_degil
  const [mesgul,setMesgul]=useState(false);
  const vapid=(typeof window!=="undefined"&&window.__FL_VAPID_PUBLIC)||"";
  useEffect(()=>{
    (async()=>{
      if(!("serviceWorker" in navigator)||!("PushManager" in window)){ setDurum("destek_yok"); return; }
      if(!vapid){ setDurum("ayarli_degil"); return; }
      try{ const reg=await navigator.serviceWorker.ready; const sub=await reg.pushManager.getSubscription(); setDurum(sub?"acik":"kapali"); }catch(e){ setDurum("kapali"); }
    })();
  },[]);
  const ac=async()=>{
    if(!oturum){ alert("Bildirim açmak için giriş yap."); return; }
    setMesgul(true);
    try{
      const izin=await Notification.requestPermission();
      if(izin!=="granted"){ setMesgul(false); alert("Bildirim izni verilmedi."); return; }
      const reg=await navigator.serviceWorker.ready;
      const sub=await reg.pushManager.subscribe({userVisibleOnly:true, applicationServerKey:flB64ToU8(vapid)});
      const r=await Db.pushKaydet(oturum.id, sub);
      setMesgul(false);
      if(r&&r.ok){ setDurum("acik"); } else alert("Kaydedilemedi: "+((r&&r.hata)||""));
    }catch(e){ setMesgul(false); alert("Açılamadı: "+String(e)); }
  };
  const kapat=async()=>{
    setMesgul(true);
    try{ const reg=await navigator.serviceWorker.ready; const sub=await reg.pushManager.getSubscription(); if(sub){ await Db.pushSil(sub.endpoint); await sub.unsubscribe(); } setDurum("kapali"); }catch(e){}
    setMesgul(false);
  };
  if(durum==="destek_yok") return null;
  return <div style={{padding:"6px 14px"}}>
    <div style={{display:"flex",alignItems:"center",gap:8,margin:"8px 4px"}}><span style={{width:28,height:28,borderRadius:8,background:T.accent2+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>📲</span><span style={{fontSize:13,fontWeight:700,color:T.text}}>Telefon Bildirimleri</span></div>
    <div style={{background:T.bg1,borderRadius:12,padding:"14px",border:"0.5px solid "+T.line}}>
      {durum==="ayarli_degil"
        ? <div style={{fontSize:11.5,color:T.textMut,lineHeight:1.5}}>Telefon push bildirimi henüz kurulmadı (VAPID anahtarı gerekiyor). Uygulama içi 🔔 bildirimler zaten çalışıyor. Kurulum tamamlanınca burası aktif olacak.</div>
        : <>
          <div style={{fontSize:12,color:T.textSoft,lineHeight:1.5,marginBottom:10}}>Uygulama kapalıyken bile transfer/maç bildirimleri telefonuna düşsün.{" "}<span style={{color:T.textMut}}>(iPhone'da: önce uygulamayı ana ekrana ekle.)</span></div>
          <button onClick={durum==="acik"?kapat:ac} disabled={mesgul} className="tap" style={{width:"100%",background:durum==="acik"?T.bg2:T.accent2,color:durum==="acik"?T.textSoft:"#04070C",border:durum==="acik"?"0.5px solid "+T.line:0,borderRadius:10,padding:11,fontSize:13,fontWeight:800,opacity:mesgul?.6:1}}>{mesgul?"…":durum==="acik"?"🔕 Bildirimleri Kapat":"🔔 Bildirimleri Aç"}</button>
        </>}
    </div>
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

/* ============================================================
   FAZ 4 — LİG KUR sihirbazı
   ============================================================ */
function LigKur({T, git, ligKur, oturum}){
  const [hakBilgi,setHakBilgi]=useState(null);
  const [adminMi,setAdminMi]=useState(false);
  useEffect(()=>{ let a=true; (async()=>{
    if(!sb||!oturum) return;
    const [h,adm]=await Promise.all([Db.hakGetir(oturum.id), Db.adminMi(oturum.id)]);
    if(a){ setHakBilgi(h); setAdminMi(adm); }
  })(); return ()=>{a=false;}; },[oturum]);
  const [ad,setAd]=useState("");
  const [sehir,setSehir]=useState("İstanbul");
  const [ilce,setIlce]=useState("");
  const [kisi,setKisi]=useState(7);
  const [format,setFormat]=useState("serbest");
  const [grupSayi,setGrupSayi]=useState(2);
  const [renk,setRenk]=useState(RENKLER[0]);
  const [baslangic,setBaslangic]=useState("");
  const [hedefTakim,setHedefTakim]=useState(12);

  const formatlar=[
    ["serbest","Serbest Lig","Maçları elle eklersin, sınır yok"],
    ["tek","Tek Devre","Herkes herkesle 1 kez (oto fikstür)"],
    ["cift","Çift Devre","Ev-deplasman, herkes 2 kez"],
    ["gruplu","Gruplu","Gruplara böl, her grup kendi içinde"],
    ["kupa","🏆 Kupa (Eleme)","Tek maç eleme — kaybeden elenir, kazanan tura çıkar"],
  ];
  const formatAd={serbest:"Serbest",tek:"Tek Devre",cift:"Çift Devre",gruplu:"Gruplu",kupa:"Kupa"}[format];
  const yetkiliKur = !!oturum && (adminMi || (hakBilgi && hakBilgi.kalan>0));
  const [kurBekle,setKurBekle]=useState(false);
  const kur=async()=>{
    if(kurBekle) return;   // çift-tıklama koruması → iki lig oluşmasın
    if(!oturum){ alert("Lig kurmak için önce Google ile giriş yap."); return; }
    if(!yetkiliKur){ alert("⚠️ Lig açma hakkın yok.\n\nLig oluşturmak için Süper Admin'in sana lig hakkı vermesi gerekiyor."); return; }
    if(!ad.trim()){return;}
    setKurBekle(true);
    await ligKur({ad:ad.trim(), sehir, ilce:ilce.trim(), renk, kisi, format, grupSayi:format==="gruplu"?grupSayi:0, baslangic, hedefTakim});
    setTimeout(()=>setKurBekle(false), 2500); // başarılıysa zaten yönlendirdi; başarısızsa tekrar denenebilir
  };

  // Yetkisi olmayan (admin değil + hakkı 0) → lig kurma yerine BAŞVURU formu
  if(oturum && hakBilgi && !yetkiliKur){ return <LigBasvuru T={T} oturum={oturum} git={git}/>; }
  return <div className="fade-in" style={{paddingBottom:100}}>
    <Baslik ust="YENİ LİG" ana="Lig Kur" T={T}/>
    {/* Lig hakkı göstergesi (Karar 3) */}
    {oturum && (adminMi
      ? <div style={{margin:"4px 14px 0",background:"linear-gradient(120deg,"+T.danger+"18,"+T.bg1+")",border:"0.5px solid "+T.danger+"44",borderRadius:11,padding:"10px 13px",display:"flex",alignItems:"center",gap:9}}>
          <span style={{fontSize:17}}>👑</span><span style={{fontSize:12,color:T.text,fontWeight:600}}>Süper Admin — <b style={{color:T.danger}}>sınırsız</b> lig açabilirsin</span>
        </div>
      : hakBilgi && <div style={{margin:"4px 14px 0",background:"linear-gradient(120deg,"+(hakBilgi.kalan>0?T.gold:T.danger)+"18,"+T.bg1+")",border:"0.5px solid "+(hakBilgi.kalan>0?T.gold:T.danger)+"44",borderRadius:11,padding:"10px 13px"}}>
          <div style={{display:"flex",alignItems:"center",gap:9}}>
            <span style={{fontSize:17}}>🎟️</span>
            <div style={{flex:1}}>
              <div style={{fontSize:12.5,color:T.text,fontWeight:700}}>Lig hakkın: <b style={{color:hakBilgi.kalan>0?T.gold:T.danger}}>{hakBilgi.kalan} kaldı</b></div>
              <div style={{fontSize:10,color:T.textMut}}>{hakBilgi.toplam} toplam · {hakBilgi.kullanilan} kullanıldı</div>
            </div>
          </div>
          {hakBilgi.kalan<=0 && <div style={{fontSize:10.5,color:T.danger,marginTop:6,lineHeight:1.5}}>Hakkın kalmadı. Yeni lig açmak için Süper Admin'e IBAN ödemesi yapıp hak iste.</div>}
        </div>)}
    <div style={{padding:"6px 14px"}}>
      <div style={{fontSize:11,color:T.textMut,fontWeight:700,marginBottom:6}}>LİG ADI</div>
      <input value={ad} onChange={e=>setAd(e.target.value)} placeholder="Örn: Cuma Akşamı Ligi"
        style={{width:"100%",background:T.bg1,border:"0.5px solid "+T.line,borderRadius:11,padding:"12px",color:T.text,fontSize:14,fontWeight:600,fontFamily:"inherit",outline:"none",marginBottom:14,boxSizing:"border-box"}}/>

      <div style={{display:"flex",gap:10,marginBottom:14}}>
        <div style={{flex:1}}>
          <div style={{fontSize:11,color:T.textMut,fontWeight:700,marginBottom:6}}>ŞEHİR</div>
          <input value={sehir} onChange={e=>setSehir(e.target.value)} placeholder="Şehir"
            style={{width:"100%",background:T.bg1,border:"0.5px solid "+T.line,borderRadius:11,padding:"12px",color:T.text,fontSize:14,fontWeight:600,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:11,color:T.textMut,fontWeight:700,marginBottom:6}}>İLÇE</div>
          <input value={ilce} onChange={e=>setIlce(e.target.value)} placeholder="Örn: Kartal"
            style={{width:"100%",background:T.bg1,border:"0.5px solid "+T.line,borderRadius:11,padding:"12px",color:T.text,fontSize:14,fontWeight:600,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
        </div>
      </div>

      <div style={{fontSize:11,color:T.textMut,fontWeight:700,marginBottom:6}}>SAHA KAÇ KİŞİLİK?</div>
      <div style={{display:"flex",gap:6,marginBottom:14}}>
        {[7,8,9,10,11].map(k=>
          <button key={k} onClick={()=>setKisi(k)} className="tap" style={{flex:1,padding:"11px 0",borderRadius:10,fontSize:14,fontWeight:700,
            background:kisi===k?T.accent:T.bg1, color:kisi===k?(T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0):T.textSoft, border:"0.5px solid "+(kisi===k?T.accent:T.line)}}>{k}</button>
        )}
      </div>

      <div style={{fontSize:11,color:T.textMut,fontWeight:700,marginBottom:6}}>LİG FORMATI</div>
      <div style={{marginBottom:14}}>
        {formatlar.map(([k,baslik,aciklama])=>
          <div key={k} onClick={()=>setFormat(k)} className="tap" style={{display:"flex",alignItems:"center",gap:11,background:format===k?T.accent+"1A":T.bg1,borderRadius:11,padding:"12px",marginBottom:7,border:"1px solid "+(format===k?T.accent:T.line),cursor:"pointer"}}>
            <span style={{width:20,height:20,borderRadius:"50%",border:"2px solid "+(format===k?T.accent:T.textMut),display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{format===k && <span style={{width:10,height:10,borderRadius:"50%",background:T.accent}}/>}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:700,color:T.text}}>{baslik}</div>
              <div style={{fontSize:11,color:T.textMut}}>{aciklama}</div>
            </div>
          </div>
        )}
      </div>

      {format==="gruplu" && <div className="fade-in" style={{marginBottom:14,background:T.accent+"0E",borderRadius:11,padding:"12px",border:"0.5px solid "+T.accent+"33"}}>
        <div style={{fontSize:11,color:T.textMut,fontWeight:700,marginBottom:8}}>KAÇ GRUP? ({grupSayi} grup)</div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {[2,3,4,5,6,7,8,9,10].map(g=>
            <button key={g} onClick={()=>setGrupSayi(g)} className="tap" style={{width:38,height:38,borderRadius:9,fontSize:14,fontWeight:700,
              background:grupSayi===g?T.accent:T.bg1, color:grupSayi===g?(T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0):T.textSoft, border:"0.5px solid "+(grupSayi===g?T.accent:T.line)}}>{g}</button>
          )}
        </div>
        <div style={{fontSize:10,color:T.textMut,marginTop:8}}>Takımlar A, B, C... gruplarına bölünür. Takım ekledikçe dağıtırsın, elle de taşıyabilirsin.</div>
      </div>}

      <div style={{display:"flex",gap:10,marginBottom:14}}>
        <div style={{flex:1}}>
          <div style={{fontSize:11,color:T.textMut,fontWeight:700,marginBottom:6}}>BAŞLANGIÇ TARİHİ</div>
          <input type="date" value={baslangic} onChange={e=>setBaslangic(e.target.value)}
            style={{width:"100%",background:T.bg1,border:"0.5px solid "+T.line,borderRadius:11,padding:"11px",color:T.text,fontSize:13,fontWeight:600,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:11,color:T.textMut,fontWeight:700,marginBottom:6}}>HEDEF TAKIM</div>
          <div style={{display:"flex",alignItems:"center",gap:6,background:T.bg1,border:"0.5px solid "+T.line,borderRadius:11,padding:"6px 8px"}}>
            <button onClick={()=>setHedefTakim(Math.max(2,hedefTakim-1))} className="tap" style={{width:30,height:30,borderRadius:8,background:T.bg2,color:T.text,fontSize:16,fontWeight:700}}>−</button>
            <span style={{flex:1,textAlign:"center",fontSize:15,fontWeight:700,color:T.text}}>{hedefTakim}</span>
            <button onClick={()=>setHedefTakim(Math.min(64,hedefTakim+1))} className="tap" style={{width:30,height:30,borderRadius:8,background:T.bg2,color:T.text,fontSize:16,fontWeight:700}}>+</button>
          </div>
        </div>
      </div>

      <div style={{fontSize:11,color:T.textMut,fontWeight:700,marginBottom:6}}>LİG RENGİ</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:18}}>
        {RENKLER.slice(0,8).map(r=>
          <span key={r} onClick={()=>setRenk(r)} className="tap" style={{width:34,height:34,borderRadius:"50%",background:r,cursor:"pointer",border:renk===r?"3px solid "+T.text:"2px solid "+T.line}}/>
        )}
      </div>

      <div style={{background:T.bg1,borderRadius:11,padding:12,marginBottom:14,border:"0.5px solid "+T.line}}>
        <div style={{fontSize:10,color:T.textMut,marginBottom:6,letterSpacing:.5}}>ÖNİZLEME</div>
        <div style={{fontSize:13,color:T.text,fontWeight:700}}>{ad.trim()||"Lig adı"}</div>
        <div style={{fontSize:11,color:T.textMut,marginTop:3}}>📍 {sehir}{ilce?" / "+ilce:""} · ⚽ {kisi} kişi · {formatAd}{hedefTakim?" · "+hedefTakim+" takım hedef":""}</div>
      </div>

      {!yetkiliKur && <div style={{margin:"0 0 10px",background:T.danger+"14",border:"0.5px solid "+T.danger+"44",borderRadius:11,padding:"11px 13px",fontSize:12,color:T.danger,lineHeight:1.5,fontWeight:600}}>{!oturum?"Lig kurmak için önce Google ile giriş yap.":"Lig açma hakkın yok. Süper Admin'den lig hakkı alman gerekiyor."}</div>}
      <button onClick={kur} disabled={!ad.trim()||!yetkiliKur||kurBekle} className="tap" style={{width:"100%",padding:"14px",borderRadius:12,background:(ad.trim()&&yetkiliKur&&!kurBekle)?T.accent:T.bg2,color:(ad.trim()&&yetkiliKur&&!kurBekle)?(T.renkCifti[1]==="#FFFFFF"?"#fff":T.bg0):T.textMut,fontSize:15,fontWeight:800,border:"none",opacity:yetkiliKur?1:.7}}>
        {kurBekle?"⏳ Oluşturuluyor…":"✓ Ligi Oluştur"}
      </button>
      <div style={{fontSize:11,color:T.textMut,textAlign:"center",marginTop:10}}>Oluşturduktan sonra takım ve maç ekleyebilirsin</div>
    </div>
  </div>;
}

/* ============================================================
   FAZ 4 — SKOR GİRİŞİ (skor + gol + asist + kart + MVP)
   ============================================================ */
/* ============================================================
   CANLI YAYIN / MAÇ MEDYASI — platform-bağımsız (Faz 7)
   Veri modeli: m.medya = { canli, tamMac, roportaj, canliAcik }
   Platform URL'den türetilir (saklanmaz). YouTube aktif; FB/IG/TikTok/MP4 hazır.
   ============================================================ */
