const TEMALAR = {
  neon: {
    ad: "Neon Yeşil", bg0:"#070B12", bg1:"#0F1828", bg2:"#0A1422", line:"#1A2233",
    text:"#F1F5F9", textMut:"#74849B", textSoft:"#94A3B8",
    accent:"#34D399", accent2:"#38BDF8", gold:"#FBBF24", danger:"#F87171",
    fontBody:"'Inter', sans-serif", fontDisplay:"'Sora', sans-serif", renkCifti:["#34D399","#070B12"]
  },
  kirmizi: {
    ad: "Kırmızı Beyaz", bg0:"#160404", bg1:"#260A0A", bg2:"#1E0707", line:"#3A1515",
    text:"#FFF5F5", textMut:"#B08585", textSoft:"#D9A5A5",
    accent:"#FF5252", accent2:"#FF8A80", gold:"#FFD54F", danger:"#FF1744",
    fontBody:"'Oswald', sans-serif", fontDisplay:"'Playfair Display', serif", renkCifti:["#FF5252","#FFFFFF"]
  },
  altin: {
    ad: "Altın Lüks", bg0:"#0F0C05", bg1:"#1A1505", bg2:"#14100A", line:"#4A3A0A",
    text:"#F5E6C0", textMut:"#9A8147", textSoft:"#C9AE6A",
    accent:"#E5B84B", accent2:"#F0CB6E", gold:"#FFD700", danger:"#E07A5F",
    fontBody:"'Inter', sans-serif", fontDisplay:"'Playfair Display', serif", renkCifti:["#E5B84B","#1A1505"]
  },
  mavi: {
    ad: "Mavi Beyaz", bg0:"#040A16", bg1:"#0A1428", bg2:"#071020", line:"#16243E",
    text:"#F1F6FC", textMut:"#6482A6", textSoft:"#8FAAD0",
    accent:"#3B9EFF", accent2:"#5BC0FF", gold:"#FFC857", danger:"#FF6B6B",
    fontBody:"'Sora', sans-serif", fontDisplay:"'Sora', sans-serif", renkCifti:["#3B9EFF","#FFFFFF"]
  },
  mor: {
    ad: "Mor Neon", bg0:"#0A0612", bg1:"#160B28", bg2:"#100820", line:"#2A1A40",
    text:"#F3EEFC", textMut:"#8C71B2", textSoft:"#A98FD0",
    accent:"#A855F7", accent2:"#C77DFF", gold:"#FBBF24", danger:"#F87171",
    fontBody:"'Inter', sans-serif", fontDisplay:"'Sora', sans-serif", renkCifti:["#A855F7","#0A0612"]
  },
  turuncu: {
    ad: "Turuncu Enerji", bg0:"#120A04", bg1:"#28160A", bg2:"#1E1007", line:"#40280F",
    text:"#FCF3EE", textMut:"#A27C61", textSoft:"#D0A98F",
    accent:"#FF7A1A", accent2:"#FFA04D", gold:"#FFD54F", danger:"#FF5252",
    fontBody:"'Oswald', sans-serif", fontDisplay:"'Bebas Neue', sans-serif", renkCifti:["#FF7A1A","#FFFFFF"]
  },
};

/* ============================================================
   PREMIUM TASARIM MOTORU — İKİ KATMAN
   STİL (5) = sayfanın kasası/havası (arka plan, yazı, font, his)
   RENK     = vurgu rengi (isteğe bağlı; seçilmezse stilin kendi rengi)
   Nihai tema T = STIL + (varsa) RENK override.
   Not: tüm renkler 6 haneli HEX olmalı — kod yer yer T.accent+"44" gibi
   alfa ekliyor; rgba/8-hane bozar.
   ============================================================ */
const STILLER = {
  zumrut: {
    ad:"Zümrüt", bg0:"#08160E", bg1:"#0F2018", bg2:"#0B1A12", line:"#213328",
    text:"#EAF3EE", textMut:"#8A9C92", textSoft:"#B9CEC3",
    accent:"#20E07A", accent2:"#12B45F", gold:"#F5C24B", danger:"#F5615C",
    fontBody:"'Inter', sans-serif", fontDisplay:"'Sora', sans-serif", renkCifti:["#20E07A","#04140C"]
  },
  gece: {
    ad:"Gece Neon", bg0:"#060C1E", bg1:"#0F1836", bg2:"#0A1228", line:"#1E2E52",
    text:"#EAF1FF", textMut:"#8792B8", textSoft:"#9FB4E0",
    accent:"#00E5FF", accent2:"#0077FF", gold:"#FFE14D", danger:"#FF5D7A",
    fontBody:"'Sora', sans-serif", fontDisplay:"'Sora', sans-serif", renkCifti:["#00E5FF","#02121A"], neon:true
  },
  aydinlik: {
    ad:"Aydınlık", bg0:"#F4F7F5", bg1:"#FFFFFF", bg2:"#EEF2EF", line:"#E2E8E4",
    text:"#0F1A14", textMut:"#5F6F66", textSoft:"#3F4F47",
    accent:"#0FAE57", accent2:"#0B8F47", gold:"#C98A15", danger:"#E0483F",
    fontBody:"'Inter', sans-serif", fontDisplay:"'Sora', sans-serif", renkCifti:["#0FAE57","#FFFFFF"], acik:true
  },
  enerji: {
    ad:"Enerji", bg0:"#150C05", bg1:"#22160B", bg2:"#1A1108", line:"#42301C",
    text:"#FBF3EA", textMut:"#B09884", textSoft:"#D0A98F",
    accent:"#FF6A00", accent2:"#E24A00", gold:"#FFC93C", danger:"#FF4D4D",
    fontBody:"'Oswald', sans-serif", fontDisplay:"'Bebas Neue', sans-serif", renkCifti:["#FF6A00","#1A0D02"], buyukHarf:true
  },
  cam: {
    ad:"Cam", bg0:"#0C1028", bg1:"#181E42", bg2:"#121634", line:"#2E3A64",
    text:"#F2F3FF", textMut:"#B9BCDA", textSoft:"#CFD2F0",
    accent:"#8B7BFF", accent2:"#6D5CFF", gold:"#FFD75E", danger:"#FF6B9A",
    fontBody:"'Inter', sans-serif", fontDisplay:"'Sora', sans-serif", renkCifti:["#8B7BFF","#0E0A2A"], cam:true
  },
  karbon: {
    ad:"Karbon", bg0:"#000000", bg1:"#0C0C0E", bg2:"#0A0A0C", line:"#1E1E22",
    text:"#FAFAFA", textMut:"#7B7B82", textSoft:"#C7C7CC",
    accent:"#ECECEE", accent2:"#B9BBC0", gold:"#E6BE72", danger:"#FF5B5B",
    fontBody:"'Inter', sans-serif", fontDisplay:"'Sora', sans-serif", renkCifti:["#ECECEE","#0A0A0B"]
  },
  prizma: {
    ad:"Prizma", bg0:"#140F20", bg1:"#1E1733", bg2:"#191228", line:"#312748",
    text:"#F5F1FF", textMut:"#A99ECB", textSoft:"#CFC6E8",
    accent:"#C08CFF", accent2:"#43CFC6", gold:"#FFD36B", danger:"#FF6F9E",
    fontBody:"'Inter', sans-serif", fontDisplay:"'Sora', sans-serif", renkCifti:["#C08CFF","#140F20"], cam:true
  },
  sinyal: {
    ad:"Sinyal", bg0:"#0B0B10", bg1:"#131319", bg2:"#101016", line:"#242430",
    text:"#E4E3EE", textMut:"#7C7B90", textSoft:"#B7B6C6",
    accent:"#8087E6", accent2:"#5E6AD2", gold:"#D9BE7C", danger:"#F0616B",
    fontBody:"'Inter', sans-serif", fontDisplay:"'Sora', sans-serif", renkCifti:["#8087E6","#0B0B10"]
  },
  sampiyon: {
    ad:"Şampiyonlar", bg0:"#050B1E", bg1:"#0C1838", bg2:"#0A1430", line:"#26386E",
    text:"#EAF1FF", textMut:"#8798C6", textSoft:"#B9C7E8",
    accent:"#6FB6FF", accent2:"#C7D2E8", gold:"#EBD08A", danger:"#FF6B7D",
    fontBody:"'Inter', sans-serif", fontDisplay:"'Sora', sans-serif", renkCifti:["#6FB6FF","#06122E"], neon:true
  },
  oyun: {
    ad:"Oyun", bg0:"#05070F", bg1:"#0C1430", bg2:"#0A1026", line:"#213A64",
    text:"#EAF2FF", textMut:"#8EA6D6", textSoft:"#B9CCF0",
    accent:"#2E9BFF", accent2:"#00E0FF", gold:"#FFD86B", danger:"#FF5D7A",
    fontBody:"'Sora', sans-serif", fontDisplay:"'Sora', sans-serif", renkCifti:["#2E9BFF","#04122E"], neon:true, cam:true
  },
};
/* RENK katmanı — sadece vurgu (accent) + renkCifti değişir; stilin bg/yazı/font'u kalır */
const RENK_TEMA = {
  yesil:   { ad:"Yeşil",   accent:"#34D399", accent2:"#38BDF8", renkCifti:["#34D399","#04140C"] },
  kirmizi: { ad:"Kırmızı", accent:"#FF5252", accent2:"#FF8A80", renkCifti:["#FF5252","#FFFFFF"] },
  altin:   { ad:"Altın",   accent:"#E5B84B", accent2:"#F0CB6E", renkCifti:["#E5B84B","#1A1505"] },
  mavi:    { ad:"Mavi",    accent:"#3B9EFF", accent2:"#5BC0FF", renkCifti:["#3B9EFF","#FFFFFF"] },
  mor:     { ad:"Mor",     accent:"#A855F7", accent2:"#C77DFF", renkCifti:["#A855F7","#0A0612"] },
  turuncu: { ad:"Turuncu", accent:"#FF7A1A", accent2:"#FFA04D", renkCifti:["#FF7A1A","#FFFFFF"] },
};
/* Eski tek-tema kaydını yeni RENK anahtarına çevir (geri uyum) */
const ESKI_TEMA_RENK = { neon:"yesil", kirmizi:"kirmizi", altin:"altin", mavi:"mavi", mor:"mor", turuncu:"turuncu" };
/* İki hex rengi karıştır (t: 0..1) — kart kenarına hafif accent tonu için */
function _hexMix(a, b, t){
  const p=(h)=>{ h=(h||"#000").replace("#",""); if(h.length===3) h=h.split("").map(c=>c+c).join(""); return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]; };
  const A=p(a), B=p(b), h=(v)=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,"0");
  return "#"+h(A[0]+(B[0]-A[0])*t)+h(A[1]+(B[1]-A[1])*t)+h(A[2]+(B[2]-A[2])*t);
}
/* Stil + Renk'ten nihai tema üret */
function temaHesapla(stilKey, renkKey){
  const s = STILLER[stilKey] || STILLER.zumrut;
  const r = renkKey && RENK_TEMA[renkKey];
  const t = r ? { ...s, accent:r.accent, accent2:r.accent2, renkCifti:r.renkCifti } : { ...s };
  // Açık ("Aydınlık") stilde vurgu rengi hem METİN hem DOLGU olarak açık zeminde kullanılıyor.
  // Canlı yeşil/mavi vb. beyaz üstünde WCAG AA kontrastını geçmez → açık stilde vurguyu koyulaştır.
  // Tek yerde: taban renk + üzerine seçilen RENK katmanı, ikisi de kapsanır. (Koyu stiller etkilenmez.)
  if(s.acik){ try{ t.accent=_hexMix(t.accent,"#0A0A0A",0.34); t.accent2=_hexMix(t.accent2,"#0A0A0A",0.30); }catch(e){} }
  // #3 — kart kenarlarına çok hafif accent tonu (renge göre bütünsel görünüm)
  try{ t.line = _hexMix(s.line, t.accent, 0.13); }catch(e){}
  return t;
}

/* ============================================================
   STRES TESTİ — sahte veri üreteci
   ============================================================ */
