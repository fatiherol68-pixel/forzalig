function _resimYukle(src){
  return new Promise((res)=>{
    if(!src) return res(null);
    const img=new Image();
    img.crossOrigin="anonymous";       // Supabase Storage CORS'a açık; taint olursa export kırılmasın diye onerror→null
    img.onload=()=>res(img);
    img.onerror=()=>res(null);
    img.src=src;
  });
}
function _harfAl(ad){ return (ad||"F").replace(/[^A-Za-zÇĞİÖŞÜçğıöşü]/g,"")[0]||"F"; }
function _amblemCiz(x, cx, cy, r, renk, renk2, ad, img){
  x.save();
  x.beginPath(); x.arc(cx,cy,r,0,7);
  const g=x.createLinearGradient(cx-r,cy-r,cx+r,cy+r); g.addColorStop(0,renk); g.addColorStop(1,renk2||"#0B1220");
  x.fillStyle=g; x.fill();
  x.lineWidth=7; x.strokeStyle="rgba(255,255,255,.35)"; x.stroke();
  if(img){
    x.save(); x.beginPath(); x.arc(cx,cy,r-5,0,7); x.clip();
    // kırpılmış daireye orta-kırpma (cover) ile çiz
    const s=Math.min(img.width,img.height), sx=(img.width-s)/2, sy=(img.height-s)/2;
    x.drawImage(img, sx, sy, s, s, cx-r+5, cy-r+5, (r-5)*2, (r-5)*2);
    x.restore();
  } else {
    x.fillStyle="#fff"; x.font="800 "+Math.round(r*1.1)+"px Inter, Arial, sans-serif";
    x.textAlign="center"; x.textBaseline="middle";
    x.fillText(_harfAl(ad), cx, cy+2);
  }
  x.restore();
}
// Maçtan 1080×1080 skor kartı canvas'ı üret (marka: ForzaLig, koyu + neon yeşil kimlik)
async function skorKartiCanvas(m, turnuva){
  const G=1080, x=(()=>{ const c=document.createElement("canvas"); c.width=G; c.height=G; c._el=c; return c.getContext("2d"); })();
  const c=x.canvas;
  const A="#39FF7A", GOLD="#FBBF24", TEXT="#F1F5F9", MUT="#8CA0B3";
  const takimA = turnuva && turnuva.takimlar.find(t=>t.ad===m.takimA);
  const takimB = turnuva && turnuva.takimlar.find(t=>t.ad===m.takimB);
  const renkA=m.renkA||(takimA&&takimA.renk)||A, renkB=m.renkB||(takimB&&takimB.renk)||"#5B8DEF";
  const renkA2=(takimA&&takimA.renk2)||ikinciRenk(renkA), renkB2=(takimB&&takimB.renk2)||ikinciRenk(renkB);
  const [logoA,logoB]=await Promise.all([_resimYukle(takimA&&takimA.logo), _resimYukle(takimB&&takimB.logo)]);
  const aGol=m.skorA, bGol=m.skorB, aGalip=aGol>bGol, bGalip=bGol>aGol, berabere=aGol===bGol;
  // arka plan
  const bg=x.createLinearGradient(0,0,G,G); bg.addColorStop(0,"#0B1220"); bg.addColorStop(1,"#070B12");
  x.fillStyle=bg; x.fillRect(0,0,G,G);
  const glow=(cx,cy,renk)=>{ const gl=x.createRadialGradient(cx,cy,20,cx,cy,560); gl.addColorStop(0,renk+"2e"); gl.addColorStop(1,"#00000000"); x.fillStyle=gl; x.fillRect(0,0,G,G); };
  glow(150,420,renkA); glow(G-150,420,renkB);
  // çerçeve
  x.strokeStyle="rgba(57,255,122,.22)"; x.lineWidth=3; x.strokeRect(24,24,G-48,G-48);
  // başlık: lig adı + hafta/tarih
  x.textAlign="center";
  x.fillStyle=GOLD; x.font="800 34px Inter, Arial, sans-serif";
  x.fillText((turnuva?turnuva.ad:"ForzaLig").toLocaleUpperCase("tr").slice(0,34), G/2, 120);
  x.fillStyle=MUT; x.font="600 26px Inter, Arial, sans-serif";
  const tarih=m.tarih?(m.tarih.includes("-")?m.tarih.split("-").reverse().join("."):m.tarih):"";
  x.fillText((m.hafta?m.hafta+". HAFTA":"")+(tarih?"  ·  "+tarih:""), G/2, 165);
  // amblemler + skor
  const cy=430, r=105, cxA=245, cxB=G-245;
  _amblemCiz(x, cxA, cy, r, renkA, renkA2, m.takimA, logoA);
  _amblemCiz(x, cxB, cy, r, renkB, renkB2, m.takimB, logoB);
  x.textAlign="center"; x.textBaseline="middle";
  x.font="800 150px Inter, Arial, sans-serif";
  x.fillStyle=aGalip?A:TEXT; x.fillText(String(aGol), G/2-95, cy-6);
  x.fillStyle=MUT; x.fillText("-", G/2, cy-14);
  x.fillStyle=bGalip?A:TEXT; x.fillText(String(bGol), G/2+95, cy-6);
  x.textBaseline="alphabetic";
  // takım adları
  x.fillStyle=aGalip?TEXT:MUT; x.font="700 34px Inter, Arial, sans-serif";
  x.fillText(m.takimA.slice(0,16), cxA, cy+r+55);
  x.fillStyle=bGalip?TEXT:MUT; x.fillText(m.takimB.slice(0,16), cxB, cy+r+55);
  // sonuç etiketi
  const sonuc=berabere?"BERABERE":(aGalip?m.takimA.toLocaleUpperCase("tr")+" KAZANDI":m.takimB.toLocaleUpperCase("tr")+" KAZANDI");
  x.fillStyle=berabere?GOLD:A; x.font="800 26px Inter, Arial, sans-serif";
  x.fillText(sonuc.slice(0,30), G/2, cy+r+130);
  // golcüler
  const golcu=(ad)=>{ const h={}; (m.olaylar||[]).filter(o=>o.tip==="gol"&&o.takim===ad).forEach(o=>{ (h[o.oyuncu]=h[o.oyuncu]||[]).push(o.dk); }); return Object.entries(h).map(([n,dks])=>({n,dks:dks.filter(d=>d!=null).sort((a,b)=>a-b)})); };
  const gA=golcu(m.takimA), gB=golcu(m.takimB), maxG=Math.max(gA.length,gB.length);
  if(maxG>0){
    let yy=cy+r+195; x.strokeStyle="rgba(255,255,255,.12)"; x.lineWidth=2;
    x.beginPath(); x.moveTo(140,yy-30); x.lineTo(G-140,yy-30); x.stroke();
    x.font="500 27px Inter, Arial, sans-serif";
    const yaz=(g)=> g.n + (g.dks.length?"  "+g.dks.map(d=>d+"'").join(",") : "");
    for(let i=0;i<Math.min(maxG,6);i++){
      x.fillStyle="#C7D2DE";
      x.textAlign="right"; if(gA[i]) x.fillText("⚽ "+yaz(gA[i]), G/2-40, yy);
      x.textAlign="left";  if(gB[i]) x.fillText(yaz(gB[i])+" ⚽", G/2+40, yy);
      yy+=46;
    }
  }
  // MVP
  if(m.mvp){ x.textAlign="center"; x.fillStyle=GOLD; x.font="700 28px Inter, Arial, sans-serif"; x.fillText("⭐ Maçın Adamı: "+m.mvp, G/2, 970); }
  // footer marka
  x.textAlign="center"; x.fillStyle=A; x.font="800 40px Inter, Arial, sans-serif";
  x.fillText("⚽ ForzaLig", G/2, 1030);
  x.fillStyle=MUT; x.font="600 22px Inter, Arial, sans-serif"; x.fillText("forzalig.com", G/2, 1062);
  return c;
}
function _canvasBlob(c){ return new Promise(res=>{ if(c.toBlob) c.toBlob(res,"image/png"); else res(null); }); }
// Skor kartını paylaş: önce Web Share (dosya), olmazsa indir. Dönüş: "paylasildi"|"indirildi"|"iptal"|"hata"
async function skorKartiPaylas(m, turnuva){
  try{
    const c=await skorKartiCanvas(m,turnuva);
    const blob=await _canvasBlob(c);
    const adDosya=("forzalig-"+(m.takimA+"-"+m.takimB)).replace(/[^A-Za-z0-9-]/g,"_").toLowerCase()+".png";
    const metin=`${m.takimA} ${m.skorA}-${m.skorB} ${m.takimB}${turnuva?" · "+turnuva.ad:""} · ForzaLig`;
    if(blob && navigator.canShare){
      const dosya=new File([blob],adDosya,{type:"image/png"});
      if(navigator.canShare({files:[dosya]})){
        try{ await navigator.share({files:[dosya],text:metin}); return "paylasildi"; }
        catch(e){ if(e&&e.name==="AbortError") return "iptal"; }
      }
    }
    // fallback: indir
    const url=c.toDataURL("image/png");
    const a=document.createElement("a"); a.href=url; a.download=adDosya; document.body.appendChild(a); a.click(); a.remove();
    return "indirildi";
  }catch(e){ console.warn("skorKartiPaylas:",e); return "hata"; }
}

