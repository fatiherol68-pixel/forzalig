const ADLAR = ["Tamer","Özkan","Alp","Şevket","Abdülgani","Egemen","Can","Burak","Hasan","Mehmet","Orhan","Ufuk","Engin","Gürkan","Mahir","Şükrü","Yusuf","Emre","Kaan","Deniz","Berke","Arda","Cenk","Volkan","Selim","Tolga","Onur","Barış","Kerem","Sinan"];
const SOYADLAR = ["Temür","Kutu","Araz","Üstünsoy","Ağbal","Akyüz","Demirci","Kocaoğlu","Alper","Koca","Işık","Alver","Yiğit","Palavan","Matsar","Deniz","Kaya","Yılmaz","Şahin","Çelik","Aydın","Öztürk","Arslan","Doğan","Kılıç","Aslan","Korkmaz","Polat"];
const TAKIM_ADLARI = ["İçerenköy","68 Alayhan Spor","Çağdaş Veteran","Kartal Yunus","Kurtköy Legends","Efe 09","Master Feet","AlayhanSpor","Velibaba","Bostancı United","Maltepe Gücü","Pendik Star","Kadıköy FK","Ataşehir SK","Ümraniye Spor","Tuzla Power"];
const TURNUVA_ADLARI = ["İstanbul Veteran Ligi","Anadolu Yakası Kupası","Kadıköy Akşam Ligi","Pendik Halısaha Turnuvası","Marmara Masterlar"];
const POZISYONLAR = ["Kaleci","Defans","OrtaSaha","Forvet"];
const HAKEM_ADLARI = ["Cüneyt Faytar","Halil Meler","Fırat Aydın","Mete Kalkavan","Ali Palabıyık","Yaşar Kemal","Zorbay Küçük","Atilla Karaoğlan","Bahattin Duran","Ozan Ergün","Volkan Bayarslan","Direnç Tonusluoğlu","Kutluhan Bilgiç","Serkan Olguncan","Arda Kardeşler","Alper Ulusoy"];
const RENKLER = ["#C0392B","#2980B9","#27AE60","#8E44AD","#E67E22","#16A085","#D35400","#2C3E50","#C0399B","#1ABC9C"];
/* Her takımın 2. rengi zorunlu — seçilmezse ana renkten türet (koyu ton, ya da renk koyuysa açık). */
function ikinciRenk(renk){
  try{
    let h=(renk||"#34D399").replace("#",""); if(h.length===3) h=h.split("").map(c=>c+c).join("");
    let r=parseInt(h.slice(0,2),16), g=parseInt(h.slice(2,4),16), b=parseInt(h.slice(4,6),16);
    if(0.299*r+0.587*g+0.114*b < 70) return "#F5F5F5"; // ana renk çok koyuysa 2. renk açık
    r=Math.round(r*0.5); g=Math.round(g*0.5); b=Math.round(b*0.5);
    return "#"+[r,g,b].map(v=>v.toString(16).padStart(2,"0")).join("");
  }catch(e){ return "#0B1220"; }
}

function rnd(n){ return Math.floor(Math.random()*n); }
function pick(a){ return a[rnd(a.length)]; }
// Ağırlıklı seçim: skor(o) ne kadar büyükse o oyuncunun seçilme şansı o kadar yüksek.
// Böylece ödüller yetenekli oyunculara birikir (demo'da gerçek "kral" çıkar).
function pickWeighted(arr, skor){
  if(!arr.length) return null;
  // taban şans düşük + skor karesi → yetenek farkı belirgin biriksin (demo'da net kral çıkar)
  const agirlik = arr.map(o=>{ const s=Math.max(0,skor(o)); return 0.04 + s*s; });
  const toplam = agirlik.reduce((s,w)=>s+w,0);
  let r = Math.random()*toplam;
  for(let i=0;i<arr.length;i++){ r-=agirlik[i]; if(r<=0) return arr[i]; }
  return arr[arr.length-1];
}

/* deterministik hash (ad'dan sabit görsel) */
function hash(str){ let h=0; for(let i=0;i<str.length;i++){ h=(h*31+str.charCodeAt(i))>>>0; } return h; }

/* Sayı sayma animasyonu — 0'dan hedefe */
